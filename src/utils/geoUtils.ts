/**
 * Utilitários para cálculos geográficos
 */

/**
 * Calcula a distância entre dois pontos geográficos usando a fórmula de Haversine
 * @param lat1 Latitude do primeiro ponto
 * @param lon1 Longitude do primeiro ponto
 * @param lat2 Latitude do segundo ponto
 * @param lon2 Longitude do segundo ponto
 * @returns Distância em quilômetros
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em quilômetros
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Converte graus para radianos
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Interface para pontos com coordenadas
 */
export interface GeoPoint {
  id: number | string;
  latitude: number;
  longitude: number;
  nome?: string;
}

/**
 * Filtra pontos que estão dentro de um raio específico de um ponto central
 * @param centerPoint Ponto central
 * @param points Lista de pontos a filtrar
 * @param radiusKm Raio em quilômetros
 * @returns Lista de pontos dentro do raio com suas distâncias
 */
export function filterByRadius<T extends GeoPoint>(
  centerPoint: GeoPoint,
  points: T[],
  radiusKm: number
): Array<T & { distance: number }> {
  return points
    .map(point => ({
      ...point,
      distance: calculateDistance(
        centerPoint.latitude,
        centerPoint.longitude,
        point.latitude,
        point.longitude
      ),
    }))
    .filter(point => point.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance); // Ordena por distância
}

/**
 * Busca o ponto mais próximo de um ponto central
 */
export function findClosest<T extends GeoPoint>(
  centerPoint: GeoPoint,
  points: T[]
): (T & { distance: number }) | null {
  if (points.length === 0) return null;
  
  const pointsWithDistance = points.map(point => ({
    ...point,
    distance: calculateDistance(
      centerPoint.latitude,
      centerPoint.longitude,
      point.latitude,
      point.longitude
    ),
  }));
  
  return pointsWithDistance.reduce((closest, current) =>
    current.distance < closest.distance ? current : closest
  );
}

/**
 * Calcula o centro geográfico (centróide) de uma lista de pontos
 */
export function calculateCentroid(points: GeoPoint[]): { latitude: number; longitude: number } {
  if (points.length === 0) {
    throw new Error('A lista de pontos não pode estar vazia');
  }
  
  const sum = points.reduce(
    (acc, point) => ({
      lat: acc.lat + point.latitude,
      lon: acc.lon + point.longitude,
    }),
    { lat: 0, lon: 0 }
  );
  
  return {
    latitude: sum.lat / points.length,
    longitude: sum.lon / points.length,
  };
}
