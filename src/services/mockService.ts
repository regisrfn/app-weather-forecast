/**
 * Mock Service - Dados simulados para desenvolvimento
 * 
 * Este serviço fornece dados mockados enquanto o backend não está implementado
 * Deve ser substituído pelas chamadas reais de API quando o backend estiver pronto
 */

export interface NeighborCity {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  distance: number;
}

export interface CenterCityInfo {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface NeighborCitiesResponse {
  centerCity: CenterCityInfo;
  neighbors: NeighborCity[];
}

export interface WeatherData {
  cityId: string;
  cityName: string;
  timestamp: string;
  rainfallIntensity: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
}

/**
 * Mock: Buscar cidades vizinhas
 * Backend: GET /api/cities/neighbors/:cityId?radius=50
 */
export function getMockNeighborCities(
  _centerCityId: string,
  radius: number = 50
): NeighborCitiesResponse {
  // Simular resposta do backend
  const response: NeighborCitiesResponse = {
    centerCity: {
      id: '3543204',
      name: 'Ribeirão do Sul',
      latitude: -22.7572,
      longitude: -49.9439,
    },
    neighbors: [
      {
        id: '3550506',
        name: 'São Pedro do Turvo',
        latitude: -22.8978,
        longitude: -49.7433,
        distance: 17.8,
      },
      {
        id: '3545407',
        name: 'Salto Grande',
        latitude: -22.8936,
        longitude: -49.9853,
        distance: 18.2,
      },
      {
        id: '3534708',
        name: 'Ourinhos',
        latitude: -22.9789,
        longitude: -49.8708,
        distance: 24.5,
      },
      {
        id: '3510153',
        name: 'Canitar',
        latitude: -23.0028,
        longitude: -49.7817,
        distance: 30.1,
      },
      {
        id: '3546405',
        name: 'Santa Cruz do Rio Pardo',
        latitude: -22.8997,
        longitude: -49.6336,
        distance: 35.7,
      },
      {
        id: '3538808',
        name: 'Piraju',
        latitude: -23.1933,
        longitude: -49.3847,
        distance: 47.2,
      },
    ],
  };

  // Filtrar por raio
  const filtered = response.neighbors.filter((city) => city.distance <= radius);

  return {
    ...response,
    neighbors: filtered,
  };
}

/**
 * Mock: Buscar dados climáticos de uma cidade
 * Backend: GET /api/weather/city/:cityId
 */
export function getMockWeatherData(cityId: string): WeatherData {
  const weatherMap: Record<string, Partial<WeatherData>> = {
    '3543204': {
      // Ribeirão do Sul
      cityName: 'Ribeirão do Sul',
      rainfallIntensity: 45.5,
      temperature: 24.3,
      humidity: 72.5,
      windSpeed: 12.8,
    },
    '3534708': {
      // Ourinhos
      cityName: 'Ourinhos',
      rainfallIntensity: 68.2,
      temperature: 23.1,
      humidity: 78.3,
      windSpeed: 15.2,
    },
    '3545407': {
      // Salto Grande
      cityName: 'Salto Grande',
      rainfallIntensity: 52.8,
      temperature: 24.7,
      humidity: 74.1,
      windSpeed: 11.5,
    },
    '3550506': {
      // São Pedro do Turvo
      cityName: 'São Pedro do Turvo',
      rainfallIntensity: 38.4,
      temperature: 25.2,
      humidity: 69.8,
      windSpeed: 9.3,
    },
    '3510153': {
      // Canitar
      cityName: 'Canitar',
      rainfallIntensity: 61.5,
      temperature: 22.8,
      humidity: 81.2,
      windSpeed: 14.7,
    },
    '3546405': {
      // Santa Cruz do Rio Pardo
      cityName: 'Santa Cruz do Rio Pardo',
      rainfallIntensity: 29.3,
      temperature: 26.1,
      humidity: 65.4,
      windSpeed: 8.2,
    },
    '3538808': {
      // Piraju
      cityName: 'Piraju',
      rainfallIntensity: 71.9,
      temperature: 21.9,
      humidity: 83.7,
      windSpeed: 16.8,
    },
  };

  const cityData = weatherMap[cityId] || {
    cityName: 'Cidade Desconhecida',
    rainfallIntensity: 0,
    temperature: 20,
    humidity: 60,
    windSpeed: 10,
  };

  return {
    cityId,
    timestamp: new Date().toISOString(),
    ...cityData,
  } as WeatherData;
}

/**
 * Mock: Buscar dados de múltiplas cidades
 * Backend: POST /api/weather/regional
 */
export function getMockRegionalWeather(cityIds: string[]): WeatherData[] {
  return cityIds.map((cityId) => getMockWeatherData(cityId));
}

/**
 * Utilitário: Gerar cor baseada na intensidade de chuva
 */
export function getRainfallColor(intensity: number): string {
  if (intensity === 0) return 'rgba(200, 200, 200, 0.3)';
  if (intensity < 25) return 'rgba(173, 216, 230, 0.6)';
  if (intensity < 50) return 'rgba(100, 149, 237, 0.7)';
  if (intensity < 75) return 'rgba(30, 144, 255, 0.8)';
  return 'rgba(0, 0, 139, 0.9)';
}

/**
 * Utilitário: Descrição textual da probabilidade de chuva
 */
export function getRainfallDescription(intensity: number): string {
  if (intensity === 0) return 'Sem chuva';
  if (intensity < 25) return 'Probabilidade baixa';
  if (intensity < 50) return 'Probabilidade média';
  if (intensity < 75) return 'Probabilidade alta';
  return 'Probabilidade muito alta';
}
