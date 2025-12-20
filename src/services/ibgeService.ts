/**
 * IBGE Service - Simplificado com Cache Persistente
 * 
 * Responsável APENAS por buscar malhas geométricas do IBGE
 * Usa localforage para cache persistente com limite de tamanho
 * Lógica de cálculo de distância e dados climáticos movidos para o backend
 */

import localforage from 'localforage';
import { APP_CONFIG } from '../config/app';
import { postMunicipalityMeshes } from './apiService';
import { chunkArray } from '../utils/array';
import { ibgeLogger } from '../utils/logger';

// Store dedicado para malhas do IBGE
const ibgeMeshStore = localforage.createInstance({
  name: 'weather-forecast',
  storeName: 'ibge_mesh_cache',
});

// Store para metadata do cache IBGE
const ibgeMetadataStore = localforage.createInstance({
  name: 'weather-forecast',
  storeName: 'ibge_metadata',
});

// Garantir que os object stores existem antes de qualquer operação
const storesReadyPromise = Promise.all([ibgeMeshStore.ready(), ibgeMetadataStore.ready()]);

async function ensureStoresReady(): Promise<void> {
  try {
    await storesReadyPromise;
  } catch (error) {
    ibgeLogger.error('Erro ao inicializar stores do IBGE:', error);
    throw error;
  }
}

interface CachedMesh {
  data: GeoJSON.Feature;
  timestamp: number;
  size: number;
}

// TTL para malhas do IBGE: 24 horas (em milissegundos)
const IBGE_TTL = 24 * 60 * 60 * 1000;

interface IBGEMetadata {
  keys: string[];
  totalSize: number;
  lastAccessed: Record<string, number>;
}

// Limite de cache para malhas: 5MB (parte do total de 10MB)
const IBGE_CACHE_LIMIT = 5 * 1024 * 1024;

// Metadata em memória
let ibgeMetadata: IBGEMetadata = {
  keys: [],
  totalSize: 0,
  lastAccessed: {},
};

/**
 * Inicializa metadata do cache IBGE
 */
async function initIBGEMetadata(): Promise<void> {
  try {
    await ensureStoresReady();
    const stored = await ibgeMetadataStore.getItem<IBGEMetadata>('metadata');
    if (stored) {
      ibgeMetadata = stored;
      ibgeLogger.info(`Metadata carregado: ${ibgeMetadata.keys.length} malhas, ${formatBytes(ibgeMetadata.totalSize)}`);
    }
  } catch (error) {
    ibgeLogger.error('Erro ao carregar metadata:', error);
  }
}

/**
 * Salva metadata do cache IBGE
 */
async function saveIBGEMetadata(): Promise<void> {
  try {
    await ibgeMetadataStore.setItem('metadata', ibgeMetadata);
  } catch (error) {
    ibgeLogger.error('Erro ao salvar metadata:', error);
  }
}

/**
 * Calcula tamanho em bytes de um objeto
 */
function calculateSize(data: unknown): number {
  return new Blob([JSON.stringify(data)]).size;
}

/**
 * Formata bytes para legibilidade
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * Armazena uma malha no cache com controle de espaço
 */
async function persistMeshInCache(
  municipalityId: string,
  mesh: GeoJSON.Feature,
  skipMetadataSave: boolean = false
): Promise<void> {
  await ensureStoresReady();
  const size = calculateSize(mesh);

  // Se já existe uma entrada antiga, remover tamanho anterior da contagem
  try {
    const existing = await ibgeMeshStore.getItem<CachedMesh>(municipalityId);
    if (existing?.size) {
      ibgeMetadata.totalSize = Math.max(0, ibgeMetadata.totalSize - existing.size);
    }
  } catch (error) {
    ibgeLogger.error(`Erro ao ler cache existente para ${municipalityId}:`, error);
  }

  if (ibgeMetadata.totalSize + size > IBGE_CACHE_LIMIT) {
    await evictLRU(size);
  }

  const cachedMesh: CachedMesh = {
    data: mesh,
    timestamp: Date.now(),
    size,
  };

  await ibgeMeshStore.setItem(municipalityId, cachedMesh);

  if (!ibgeMetadata.keys.includes(municipalityId)) {
    ibgeMetadata.keys.push(municipalityId);
  }
  ibgeMetadata.totalSize += size;
  ibgeMetadata.lastAccessed[municipalityId] = Date.now();

  if (!skipMetadataSave) {
    await saveIBGEMetadata();
  }
}

/**
 * Busca malhas no backend em chunks paralelos de até 50 cidades
 */
async function fetchMeshesFromBackend(
  municipalityIds: string[]
): Promise<Map<string, GeoJSON.Feature>> {
  const meshMap = new Map<string, GeoJSON.Feature>();
  const uniqueIds = Array.from(new Set(municipalityIds));

  if (uniqueIds.length === 0) {
    return meshMap;
  }

  const chunks = chunkArray(uniqueIds, APP_CONFIG.API.MAX_CITIES_PER_BATCH);

  const requests = chunks.map((chunk, index) =>
    postMunicipalityMeshes(chunk)
      .then((data) => ({
        status: 'fulfilled' as const,
        data,
        chunk,
        chunkIndex: index,
      }))
      .catch((error) => ({
        status: 'rejected' as const,
        reason: error,
        chunk,
        chunkIndex: index,
      })),
  );

  const results = await Promise.all(requests);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      Object.entries(result.data).forEach(([cityId, mesh]) => {
        meshMap.set(cityId, mesh as GeoJSON.Feature);
      });
      ibgeLogger.debug(`✓ Chunk ${result.chunkIndex + 1}/${chunks.length} OK: ${result.chunk.length} cidades`);
    } else {
      ibgeLogger.error(
        `✗ Chunk ${result.chunkIndex + 1}/${chunks.length} falhou (${result.chunk.length} cidades)`,
        result.reason,
      );
    }
  }

  return meshMap;
}

/**
 * Remove malhas menos recentemente usadas até liberar espaço
 */
async function evictLRU(requiredSpace: number): Promise<void> {
  ibgeLogger.debug(`Evicção LRU necessária. Espaço requerido: ${formatBytes(requiredSpace)}`);
  
  // Ordenar chaves por último acesso
  const sortedKeys = [...ibgeMetadata.keys].sort(
    (a, b) => (ibgeMetadata.lastAccessed[a] || 0) - (ibgeMetadata.lastAccessed[b] || 0)
  );
  
  // Remover até liberar espaço suficiente
  for (const key of sortedKeys) {
    if (ibgeMetadata.totalSize + requiredSpace <= IBGE_CACHE_LIMIT) {
      break;
    }
    
    try {
      const cached = await ibgeMeshStore.getItem<CachedMesh>(key);
      if (cached) {
        await ibgeMeshStore.removeItem(key);
        ibgeMetadata.totalSize -= cached.size;
        ibgeMetadata.keys = ibgeMetadata.keys.filter(k => k !== key);
        delete ibgeMetadata.lastAccessed[key];
        ibgeLogger.debug(`Malha ${key} removida (LRU)`);
      }
    } catch (error) {
      ibgeLogger.error(`Erro ao remover ${key}:`, error);
    }
  }
  
  await saveIBGEMetadata();
}

/**
 * Buscar malha geométrica de um município (com cache persistente)
 * API: https://servicodados.ibge.gov.br/api/v3/malhas/municipios/{id}
 * @param skipMetadataSave - Se true, não salva metadata (útil para batch operations)
 */
export async function getMunicipalityMesh(
  municipalityId: string,
  skipMetadataSave: boolean = false
): Promise<GeoJSON.Feature | null> {
  try {
    await ensureStoresReady();
    // Verificar cache primeiro
    const cached = await ibgeMeshStore.getItem<CachedMesh>(municipalityId);
    
    if (cached) {
      // Verificar se o cache expirou (24 horas)
      const isExpired = Date.now() - cached.timestamp > IBGE_TTL;
      
      if (isExpired) {
        ibgeLogger.debug(`EXPIRED: ${municipalityId} - removendo do cache`);
        await ibgeMeshStore.removeItem(municipalityId);
        ibgeMetadata.totalSize -= cached.size;
        ibgeMetadata.keys = ibgeMetadata.keys.filter(k => k !== municipalityId);
        delete ibgeMetadata.lastAccessed[municipalityId];
        if (!skipMetadataSave) {
          await saveIBGEMetadata();
        }
      } else {
        ibgeLogger.debug(`HIT: ${municipalityId}`);
        // Atualizar último acesso
        ibgeMetadata.lastAccessed[municipalityId] = Date.now();
        if (!skipMetadataSave) {
          await saveIBGEMetadata();
        }
        return cached.data;
      }
    }
    
    ibgeLogger.debug(`MISS: ${municipalityId} - Buscando do backend`);

    const backendMeshes = await fetchMeshesFromBackend([municipalityId]);
    const mesh = backendMeshes.get(municipalityId) || null;

    if (!mesh) {
      ibgeLogger.error(`Backend não retornou malha para ${municipalityId}`);
      return null;
    }

    await persistMeshInCache(municipalityId, mesh, skipMetadataSave);

    return mesh;
  } catch (error) {
    ibgeLogger.error(`Erro ao buscar malha do município ${municipalityId}:`, error);
    return null;
  }
}

/**
 * Limpar cache manualmente (útil para testes)
 */
export async function clearMeshCache(): Promise<void> {
  try {
    await ensureStoresReady();
    await ibgeMeshStore.clear();
    ibgeMetadata = {
      keys: [],
      totalSize: 0,
      lastAccessed: {},
    };
    await saveIBGEMetadata();
    ibgeLogger.info('Cache de malhas limpo');
  } catch (error) {
    ibgeLogger.error('Erro ao limpar cache:', error);
  }
}

/**
 * Obter informações do cache
 */
export function getCacheInfo(): { 
  size: number; 
  limit: number; 
  keys: string[];
  sizeFormatted: string;
  limitFormatted: string;
  usage: string;
} {
  const usagePercent = ((ibgeMetadata.totalSize / IBGE_CACHE_LIMIT) * 100).toFixed(2);
  
  return {
    size: ibgeMetadata.totalSize,
    limit: IBGE_CACHE_LIMIT,
    keys: ibgeMetadata.keys,
    sizeFormatted: formatBytes(ibgeMetadata.totalSize),
    limitFormatted: formatBytes(IBGE_CACHE_LIMIT),
    usage: `${usagePercent}%`,
  };
}

/**
 * Buscar malhas de múltiplos municípios em paralelo
 * Otimizado: faz todas as requisições em paralelo e salva metadata uma única vez
 */
export async function getMultipleMunicipalityMeshes(
  municipalityIds: string[]
): Promise<Map<string, GeoJSON.Feature>> {
  const meshMap = new Map<string, GeoJSON.Feature>();
  if (municipalityIds.length === 0) {
    return meshMap;
  }

  const uniqueIds = Array.from(new Set(municipalityIds));
  const missingIds: string[] = [];

  await ensureStoresReady();

  // Primeira passada: tentar preencher via cache local
  for (const id of uniqueIds) {
    const cached = await ibgeMeshStore.getItem<CachedMesh>(id);

    if (cached) {
      const isExpired = Date.now() - cached.timestamp > IBGE_TTL;

      if (isExpired) {
        ibgeLogger.debug(`EXPIRED: ${id} - removendo do cache`);
        await ibgeMeshStore.removeItem(id);
        ibgeMetadata.totalSize -= cached.size;
        ibgeMetadata.keys = ibgeMetadata.keys.filter(k => k !== id);
        delete ibgeMetadata.lastAccessed[id];
        missingIds.push(id);
      } else {
        meshMap.set(id, cached.data);
        ibgeMetadata.lastAccessed[id] = Date.now();
      }
    } else {
      missingIds.push(id);
    }
  }

  // Buscar ids faltantes no backend em chunks paralelos
  if (missingIds.length > 0) {
    const fetchedMeshes = await fetchMeshesFromBackend(missingIds);

    for (const [cityId, mesh] of fetchedMeshes.entries()) {
      meshMap.set(cityId, mesh);
      await persistMeshInCache(cityId, mesh, true); // true = salvar metadata apenas uma vez ao final
    }
  }

  await saveIBGEMetadata();

  ibgeLogger.info(
    `Batch: ${uniqueIds.length} malhas processadas (${meshMap.size} sucessos, ${missingIds.length} fetch backend)`
  );

  return meshMap;
}

// Inicializar metadata ao carregar o módulo
initIBGEMetadata();
