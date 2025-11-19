/**
 * IBGE Service - Simplificado com Cache
 * 
 * Responsável APENAS por buscar malhas geométricas do IBGE
 * Lógica de cálculo de distância e dados climáticos movidos para o backend
 */

import axios from 'axios';

// Cache de malhas em memória com limite de 100 cidades
const CACHE_LIMIT = 100;
const meshCache = new Map<string, GeoJSON.Feature>();
const cacheOrder: string[] = []; // Para controlar a ordem de inserção (FIFO)

/**
 * Buscar malha geométrica de um município (com cache)
 * API: https://servicodados.ibge.gov.br/api/v3/malhas/municipios/{id}
 */
export async function getMunicipalityMesh(
  municipalityId: string
): Promise<GeoJSON.Feature | null> {
  // Verificar se está no cache
  if (meshCache.has(municipalityId)) {
    console.log(`Cache hit: ${municipalityId}`);
    return meshCache.get(municipalityId)!;
  }

  try {
    console.log(`Cache miss: ${municipalityId} - Buscando do IBGE`);
    const response = await axios.get<GeoJSON.Feature>(
      `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${municipalityId}`,
      {
        params: {
          formato: 'application/vnd.geo+json',
        },
      }
    );

    const mesh = response.data;

    // Adicionar ao cache
    meshCache.set(municipalityId, mesh);
    cacheOrder.push(municipalityId);

    // Limpar cache se exceder o limite (FIFO - First In First Out)
    if (cacheOrder.length > CACHE_LIMIT) {
      const oldestId = cacheOrder.shift();
      if (oldestId) {
        meshCache.delete(oldestId);
        console.log(`Cache evicted: ${oldestId}`);
      }
    }

    return mesh;
  } catch (error) {
    console.error(`Erro ao buscar malha do município ${municipalityId}:`, error);
    return null;
  }
}

/**
 * Limpar cache manualmente (útil para testes)
 */
export function clearMeshCache(): void {
  meshCache.clear();
  cacheOrder.length = 0;
  console.log('Cache de malhas limpo');
}

/**
 * Obter informações do cache
 */
export function getCacheInfo(): { size: number; limit: number; keys: string[] } {
  return {
    size: meshCache.size,
    limit: CACHE_LIMIT,
    keys: Array.from(meshCache.keys()),
  };
}

/**
 * Buscar malhas de múltiplos municípios em paralelo
 */
export async function getMultipleMunicipalityMeshes(
  municipalityIds: string[]
): Promise<Map<string, GeoJSON.Feature>> {
  const meshMap = new Map<string, GeoJSON.Feature>();

  const promises = municipalityIds.map(async (id) => {
    const mesh = await getMunicipalityMesh(id);
    if (mesh) {
      meshMap.set(id, mesh);
    }
  });

  await Promise.all(promises);

  return meshMap;
}
