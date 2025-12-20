import axios from 'axios';
import { APP_CONFIG } from '../config/app';
import { weatherCache } from './cacheService';
import { chunkArray } from '../utils/array';
import { apiLogger } from '../utils/logger';
import { getSessionId } from '../utils/session';
import type { DetailedWeatherResponse, NeighborCitiesResponse, WeatherData } from '../types/weather';
import localforage from 'localforage';

const api = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  timeout: 60000, // 60 segundos para previsões meteorológicas
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar session_id em todas as requisições
api.interceptors.request.use((config) => {
  const sessionId = getSessionId();
  config.headers['x-session-id'] = sessionId;
  apiLogger.debug('Enviando requisição com session_id:', sessionId);
  return config;
});

/**
 * Buscar cidades vizinhas por raio
 * Backend: GET /api/cities/neighbors/:cityId?radius=50
 */
export async function getNeighborCities(
  centerCityId: string,
  radius: number = APP_CONFIG.RADIUS.DEFAULT
): Promise<NeighborCitiesResponse> {
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
  const response = await api.get<WeatherData>(`/api/weather/city/${cityId}`);
  return response.data;
}

/**
 * Buscar malhas geográficas de múltiplos municípios
 * Backend: POST /api/geo/municipalities
 */
export async function postMunicipalityMeshes(
  cityIds: string[],
): Promise<Record<string, GeoJSON.Feature>> {
  const response = await api.post<Record<string, GeoJSON.Feature>>(
    '/api/geo/municipalities',
    { cityIds },
  );
  return response.data;
}

/**
 * Buscar dados de um chunk de cidades da API
 */
async function fetchWeatherChunk(
  cityIds: string[],
  date: string,
  time: string
): Promise<WeatherData[]> {
  const response = await api.post<WeatherData[]>(
    '/api/weather/regional',
    { cityIds },
    {
      params: { date, time }
    }
  );
  return response.data;
}

/**
 * Buscar dados climáticos de múltiplas cidades
 * Backend: POST /api/weather/regional
 * 
 * Com cache individual por cidade: busca do cache primeiro, depois API para cidades faltantes
 * Divide requisições grandes em chunks de 50 cidades e processa em paralelo
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
  
  // Buscar dados cacheados individualmente por cidade
  const cachedDataMap = new Map<string, WeatherData>();
  const missingCityIds: string[] = [];
  
  for (const cityId of cityIds) {
    const cached = await weatherCache.get(cityId, finalDate, finalTime);
    if (cached) {
      cachedDataMap.set(cityId, cached);
    } else {
      missingCityIds.push(cityId);
    }
  }
  
  // Log de cache hit/miss
  if (cachedDataMap.size > 0) {
    apiLogger.debug(`Cache HIT: ${cachedDataMap.size}/${cityIds.length} cidades`);
  }
  if (missingCityIds.length > 0) {
    apiLogger.debug(`Cache MISS: Buscando ${missingCityIds.length} cidades da API`);
  }
  
  // Se todas as cidades estão no cache, retornar
  if (missingCityIds.length === 0) {
    return cityIds.map(id => cachedDataMap.get(id)!);
  }
  
  // Dividir cidades faltantes em chunks de no máximo 50
  const chunks = chunkArray(missingCityIds, APP_CONFIG.API.MAX_CITIES_PER_BATCH);
  
  apiLogger.info(`Dividindo ${missingCityIds.length} cidades em ${chunks.length} chunk(s) de até ${APP_CONFIG.API.MAX_CITIES_PER_BATCH}`);
  
  // Buscar todos os chunks em paralelo usando Promise.allSettled
  const chunkPromises = chunks.map((chunk: string[], index: number) => 
    fetchWeatherChunk(chunk, finalDate, finalTime)
      .then(data => ({ status: 'fulfilled' as const, data, chunkIndex: index, chunk }))
      .catch(error => ({ status: 'rejected' as const, reason: error, chunkIndex: index, chunk }))
  );
  
  const results = await Promise.all(chunkPromises);
  
  // Processar resultados: separar sucessos e falhas
  const successfulData: WeatherData[] = [];
  const failedChunks: Array<{ index: number; cityIds: string[]; error: any }> = [];
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      successfulData.push(...result.data);
      apiLogger.debug(`✓ Chunk ${result.chunkIndex + 1}/${chunks.length} OK: ${result.chunk.length} cidades`);
    } else {
      failedChunks.push({
        index: result.chunkIndex,
        cityIds: result.chunk,
        error: result.reason,
      });
      apiLogger.error(`✗ Chunk ${result.chunkIndex + 1}/${chunks.length} FALHOU:`, result.reason.message);
    }
  }
  
  // Armazenar dados bem-sucedidos individualmente no cache
  for (const cityData of successfulData) {
    await weatherCache.set(cityData.cityId, finalDate, finalTime, cityData);
    cachedDataMap.set(cityData.cityId, cityData);
  }
  
  // Log de resumo
  if (failedChunks.length > 0) {
    const failedCityCount = failedChunks.reduce((sum, chunk) => sum + chunk.cityIds.length, 0);
    apiLogger.warn(`⚠️ ${failedChunks.length} chunk(s) falharam (${failedCityCount} cidades sem dados)`);
  }
  
  // Retornar dados na ordem original dos cityIds (undefined para cidades sem dados)
  const result = cityIds.map(id => cachedDataMap.get(id)!).filter(Boolean);
  
  // Se não conseguimos dados para nenhuma cidade, lançar erro
  if (result.length === 0 && cityIds.length > 0) {
    throw new Error('Falha ao buscar dados de todas as cidades');
  }
  
  return result;
}

// Store dedicado para cache de dados detalhados
const detailedCacheStore = localforage.createInstance({
  name: 'weather-forecast',
  storeName: 'detailed_cache',
});

interface DetailedCacheEntry {
  data: DetailedWeatherResponse;
  timestamp: number;
}

/**
 * Buscar dados climáticos detalhados de uma cidade
 * Backend: GET /api/weather/city/:cityId/detailed
 * 
 * Com cache transparente de 60 minutos por cidade
 */
export async function getCityWeatherDetailed(cityId: string): Promise<DetailedWeatherResponse> {
  const cacheKey = `detailed:${cityId}`;
  const ttl = 60 * 60 * 1000; // 60 minutos em milissegundos
  
  try {
    // Tentar buscar do cache primeiro
    const cached = await detailedCacheStore.getItem<DetailedCacheEntry>(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      apiLogger.debug(`Cache HIT: Dados detalhados da cidade ${cityId}`);
      return cached.data;
    }
    
    apiLogger.debug(`Cache MISS: Buscando dados detalhados da cidade ${cityId} da API`);
    
    // Buscar da API (estrutura já corresponde às interfaces)
    const response = await api.get<DetailedWeatherResponse>(`/api/weather/city/${cityId}/detailed`);
    
    // Armazenar no cache
    const entry: DetailedCacheEntry = {
      data: response.data,
      timestamp: Date.now(),
    };
    await detailedCacheStore.setItem(cacheKey, entry);
    
    return response.data;
  } catch (error) {
    apiLogger.error(`Erro ao buscar dados detalhados da cidade ${cityId}:`, error);
    throw error;
  }
}

/**
 * Tratamento de erros da API
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    apiLogger.error('API Error:', error.message);

    if (error.response) {
      apiLogger.error('Status:', error.response.status);
      apiLogger.error('Data:', error.response.data);
    }

    return Promise.reject(error);
  }
);
