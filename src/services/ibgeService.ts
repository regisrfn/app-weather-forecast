/**
 * IBGE Service - Simplificado com Cache Persistente
 * 
 * Responsável APENAS por buscar malhas geométricas do IBGE
 * Usa localforage para cache persistente com limite de tamanho
 * Lógica de cálculo de distância e dados climáticos movidos para o backend
 */

import localforage from 'localforage';
import { ibgeLogger } from '../utils/logger';
import { getMunicipalityMeshFromApi } from './apiService';

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

interface CachedMesh {
  data: GeoJSON.Feature;
  timestamp: number;
  size: number;
}

// TTL para malhas do IBGE (back e front): 7 dias (em milissegundos)
const IBGE_TTL = 7 * 24 * 60 * 60 * 1000;

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
 * API backend: GET /api/geo/municipalities/{id} (proxy do IBGE com cache)
 * @param skipMetadataSave - Se true, não salva metadata (útil para batch operations)
 */
export async function getMunicipalityMesh(
  municipalityId: string,
  skipMetadataSave: boolean = false
): Promise<GeoJSON.Feature | null> {
  try {
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
    
    ibgeLogger.debug(`MISS: ${municipalityId} - Buscando do backend (proxy IBGE)`);
    
    // Buscar da API do backend (proxy para o IBGE)
    const mesh: GeoJSON.Feature = await getMunicipalityMeshFromApi(municipalityId);
    const size = calculateSize(mesh);
    
    // Verificar se precisa fazer evicção
    if (ibgeMetadata.totalSize + size > IBGE_CACHE_LIMIT) {
      await evictLRU(size);
    }
    
    // Salvar no cache
    const cachedMesh: CachedMesh = {
      data: mesh,
      timestamp: Date.now(),
      size,
    };
    
    await ibgeMeshStore.setItem(municipalityId, cachedMesh);
    
    // Atualizar metadata
    if (!ibgeMetadata.keys.includes(municipalityId)) {
      ibgeMetadata.keys.push(municipalityId);
    }
    ibgeMetadata.totalSize += size;
    ibgeMetadata.lastAccessed[municipalityId] = Date.now();
    
    if (!skipMetadataSave) {
      await saveIBGEMetadata();
    }
    
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

  const CONCURRENCY = 10; 
  const queue = [...municipalityIds];
  const workers: Promise<void>[] = [];

  const runWorker = async () => {
    while (queue.length > 0) {
      const id = queue.shift();
      if (!id) continue;

      const mesh = await getMunicipalityMesh(id, true); // true = skip metadata save
      if (mesh) {
        meshMap.set(id, mesh);
      }
    }
  };

  // Inicia trabalhadores limitados por CONCURRENCY
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(runWorker());
  }

  await Promise.all(workers);

  // Salvar metadata uma única vez ao final (batch update)
  await saveIBGEMetadata();
  
  ibgeLogger.info(`Batch: ${municipalityIds.length} malhas processadas (${meshMap.size} sucessos)`);

  return meshMap;
}

// Inicializar metadata ao carregar o módulo
initIBGEMetadata();
