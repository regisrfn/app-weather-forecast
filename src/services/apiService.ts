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
import { weatherCache } from './cacheService';

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
 * 
 * Com cache integrado: verifica cache antes de fazer requisição
 */
export async function getRegionalWeather(
  cityIds: string[],
  date?: string,
  time?: string
): Promise<WeatherData[]> {
  // Usar data/hora fornecida ou atual (timezone Brasil)
  let finalDate = date;
  let finalTime = time;
  
  if (!finalDate || !finalTime) {
    // Fallback: usar horário atual do Brasil
    const now = new Date();
    const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    
    if (!finalDate) {
      const year = brasilTime.getFullYear();
      const month = String(brasilTime.getMonth() + 1).padStart(2, '0');
      const day = String(brasilTime.getDate()).padStart(2, '0');
      finalDate = `${year}-${month}-${day}`;
    }
    
    if (!finalTime) {
      const hours = String(brasilTime.getHours()).padStart(2, '0');
      const minutes = String(brasilTime.getMinutes()).padStart(2, '0');
      finalTime = `${hours}:${minutes}`;
    }
  }
  
  // Verificar se dados estão no cache (AGORA ASSÍNCRONO)
  const cachedData = await weatherCache.getRegional(cityIds, finalDate, finalTime);
  if (cachedData) {
    console.log(`[Cache HIT] Dados regionais para ${cityIds.length} cidades em ${finalDate} ${finalTime}`);
    return cachedData;
  }
  
  console.log(`[Cache MISS] Buscando dados regionais da API para ${cityIds.length} cidades`);
  
  if (APP_CONFIG.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const data = getMockRegionalWeather(cityIds);
    // Armazenar no cache (AGORA ASSÍNCRONO)
    await weatherCache.setRegional(cityIds, finalDate, finalTime, data);
    return data;
  }

  const response = await api.post<WeatherData[]>(
    '/api/weather/regional',
    { cityIds },
    {
      params: { date: finalDate, time: finalTime }
    }
  );

  // Armazenar resposta no cache (AGORA ASSÍNCRONO)
  await weatherCache.setRegional(cityIds, finalDate, finalTime, response.data);
  
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
