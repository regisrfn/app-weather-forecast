/**
 * API Service - Comunicação com o backend
 * 
 * Este serviço centraliza todas as chamadas para o backend
 * Usa dados mockados quando USE_MOCK=true
 */

import axios from 'axios';
import { APP_CONFIG } from '../config/app';
import {
  getMockNeighborCities,
  getMockWeatherData,
  getMockRegionalWeather,
  type NeighborCitiesResponse,
  type WeatherData,
} from './mockService';

const api = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  timeout: 60000, // 60 segundos para previsões meteorológicas
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Buscar cidades vizinhas por raio
 * Backend: GET /api/cities/neighbors/:cityId?radius=50
 */
export async function getNeighborCities(
  centerCityId: string,
  radius: number = APP_CONFIG.RADIUS.DEFAULT
): Promise<NeighborCitiesResponse> {
  if (APP_CONFIG.USE_MOCK) {
    // Simular delay de rede
    await new Promise((resolve) => setTimeout(resolve, 300));
    return getMockNeighborCities(centerCityId, radius);
  }

  const response = await api.get<NeighborCitiesResponse>(
    `/api/cities/neighbors/${centerCityId}`,
    {
      params: { radius },
    }
  );

  return response.data;
}

/**
 * Buscar dados climáticos de uma cidade
 * Backend: GET /api/weather/city/:cityId
 */
export async function getCityWeather(cityId: string): Promise<WeatherData> {
  if (APP_CONFIG.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return getMockWeatherData(cityId);
  }

  const response = await api.get<WeatherData>(`/api/weather/city/${cityId}`);
  return response.data;
}

/**
 * Buscar dados climáticos de múltiplas cidades
 * Backend: POST /api/weather/regional
 */
export async function getRegionalWeather(
  cityIds: string[]
): Promise<WeatherData[]> {
  if (APP_CONFIG.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return getMockRegionalWeather(cityIds);
  }

  const response = await api.post<WeatherData[]>('/api/weather/regional', {
    cityIds,
  });

  return response.data;
}

/**
 * Tratamento de erros da API
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.message);

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }

    return Promise.reject(error);
  }
);
