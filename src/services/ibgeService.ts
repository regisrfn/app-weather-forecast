/**
 * IBGE Service - Simplificado
 * 
 * Responsável APENAS por buscar malhas geométricas do IBGE
 * Lógica de cálculo de distância e dados climáticos movidos para o backend
 */

import axios from 'axios';

/**
 * Buscar malha geométrica de um município
 * API: https://servicodados.ibge.gov.br/api/v3/malhas/municipios/{id}
 */
export async function getMunicipalityMesh(
  municipalityId: string
): Promise<GeoJSON.Feature | null> {
  try {
    const response = await axios.get<GeoJSON.Feature>(
      `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${municipalityId}`,
      {
        params: {
          formato: 'application/vnd.geo+json',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar malha do município ${municipalityId}:`, error);
    return null;
  }
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
