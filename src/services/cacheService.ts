/**
 * Cache Service - Gerenciamento de cache persistente para dados climáticos
 * 
 * Implementa cache em localStorage com TTL (Time To Live) e limite de 10MB
 * usando localforage para melhor performance e compatibilidade.
 * 
 * Estrutura da chave: `${cityId}_${date}_${time}`
 * Exemplo: "3550308_2025-11-21_14:00"
 */

import localforage from 'localforage';
import type { DetailedWeatherResponse, WeatherData } from '../types/weather';
import { cacheLogger } from '../utils/logger';

interface CacheEntry {
  data: WeatherData;
  timestamp: number; // Timestamp de quando foi cacheado
  size: number; // Tamanho em bytes do dado serializado
}

interface DetailedCacheEntry {
  data: DetailedWeatherResponse;
  timestamp: number;
  size: number;
}

interface CacheMetadata {
  keys: string[];
  totalSize: number;
  lastAccessed: Record<string, number>; // Para implementar LRU
}

class WeatherCache {
  // TTL para dados climáticos: 30 minutos (em milissegundos)
  private readonly WEATHER_TTL = 30 * 60 * 1000;
  
  // TTL para dados detalhados da cidade: 1 hora (em milissegundos)
  private readonly DETAILED_WEATHER_TTL = 60 * 60 * 1000;
  
  // Limite máximo de cache: 10MB
  private readonly MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB em bytes
  
  // Store para dados climáticos individuais
  private readonly weatherStore: LocalForage;
  private readonly metadataStore: LocalForage;
  
  // Cache de metadata em memória para performance
  private metadata: CacheMetadata = {
    keys: [],
    totalSize: 0,
    lastAccessed: {},
  };
  
  constructor() {
    // Configurar stores do localforage
    this.weatherStore = localforage.createInstance({
      name: 'weather-forecast',
      storeName: 'weather_cache',
    });
    
    this.metadataStore = localforage.createInstance({
      name: 'weather-forecast',
      storeName: 'cache_metadata',
    });
    
    // Inicializar metadata
    this.initMetadata();
    
    // Limpeza automática a cada 15 minutos (para TTL de 30 minutos)
    setInterval(() => this.cleanup(), 15 * 60 * 1000);
  }
  
  /**
   * Inicializa metadata do cache ao carregar
   */
  private async initMetadata(): Promise<void> {
    try {
      const stored = await this.metadataStore.getItem<CacheMetadata>('metadata');
      if (stored) {
        this.metadata = stored;
        cacheLogger.info(`Metadata carregado: ${this.metadata.keys.length} entradas, ${this.formatBytes(this.metadata.totalSize)}`);
      }
    } catch (error) {
      cacheLogger.error('Erro ao carregar metadata:', error);
    }
  }
  
  /**
   * Salva metadata no localStorage
   */
  private async saveMetadata(): Promise<void> {
    try {
      await this.metadataStore.setItem('metadata', this.metadata);
    } catch (error) {
      cacheLogger.error('Erro ao salvar metadata:', error);
    }
  }
  
  /**
   * Calcula tamanho em bytes de um objeto JSON
   */
  private calculateSize(data: unknown): number {
    return new Blob([JSON.stringify(data)]).size;
  }
  
  /**
   * Formata bytes para legibilidade
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }
  
  /**
   * Serializa dados removendo proxies do Vue e outras referências não-clonáveis
   */
  private serialize<T>(data: T): T {
    return JSON.parse(JSON.stringify(data));
  }
  
  /**
   * Remove entradas menos recentemente usadas até liberar espaço suficiente
   */
  private async evictLRU(requiredSpace: number): Promise<void> {
    cacheLogger.debug(`Evicção LRU necessária. Espaço requerido: ${this.formatBytes(requiredSpace)}`);
    
    // Criar array com todas as chaves e seus timestamps de último acesso
    const allEntries = this.metadata.keys.map(key => ({ 
      key, 
      lastAccess: this.metadata.lastAccessed[key] || 0 
    }));
    
    // Ordenar por último acesso (mais antigo primeiro)
    allEntries.sort((a, b) => a.lastAccess - b.lastAccess);
    
    // Remover entradas até liberar espaço suficiente
    for (const entry of allEntries) {
      if (this.metadata.totalSize + requiredSpace <= this.MAX_CACHE_SIZE) {
        break;
      }
      
      await this.removeByKey(entry.key);
    }
    
    cacheLogger.debug(`Evicção completa. Tamanho atual: ${this.formatBytes(this.metadata.totalSize)}`);
  }
  
  
  /**
   * Arredonda o tempo para a hora mais próxima que é múltipla de 3 horas
   */
  private roundTimeToNearest3Hours(time: string): string {
    const parts = time.split(':');
    const hoursStr = parts[0];
    if (!hoursStr) throw new Error('Invalid time format');
    const hours = parseInt(hoursStr, 10);
    const remainder = hours % 3;
    let roundedHours;
    
    if (remainder < 1.5) {
      roundedHours = hours - remainder;
    } else {
      roundedHours = hours + (3 - remainder);
    }
    
    // Trata wrap around para 24 horas
    if (roundedHours >= 24) roundedHours -= 24;
    if (roundedHours < 0) roundedHours += 24;
    
    return `${String(roundedHours).padStart(2, '0')}:00`;
  }
  
  /**
   * Gera chave única para uma cidade em uma data/hora específica
   * Usa tempo arredondado para maximizar cache hits
   */
  private generateKey(cityId: string, date: string, time: string): string {
    const roundedTime = this.roundTimeToNearest3Hours(time);
    return `${cityId}_${date}_${roundedTime}`;
  }
  

  
  /**
   * Verifica se uma entrada está válida (não expirou)
   */
  private isValid(timestamp: number, ttl: number = this.WEATHER_TTL): boolean {
    return Date.now() - timestamp < ttl;
  }
  
  /**
   * Atualiza timestamp de último acesso (para LRU)
   */
  private updateLastAccess(key: string): void {
    this.metadata.lastAccessed[key] = Date.now();
  }
  
  /**
   * Armazena dados climáticos de uma cidade no cache
   * Usa timestamp arredondado para maximizar cache hits
   */
  async set(cityId: string, date: string, time: string, data: WeatherData): Promise<void> {
    const key = this.generateKey(cityId, date, time); // Já arredonda internamente
    
    // Serializar dados para remover proxies do Vue
    const serializedData = this.serialize(data);
    const size = this.calculateSize(serializedData);
    
    // Verificar se precisa fazer evicção
    if (this.metadata.totalSize + size > this.MAX_CACHE_SIZE) {
      await this.evictLRU(size);
    }
    
    const entry: CacheEntry = {
      data: serializedData,
      timestamp: Date.now(),
      size,
    };
    
    try {
      await this.weatherStore.setItem(key, entry);
      
      // Atualizar metadata
      if (!this.metadata.keys.includes(key)) {
        this.metadata.keys.push(key);
      }
      this.metadata.totalSize += size;
      this.updateLastAccess(key);
      
      await this.saveMetadata();
    } catch (error) {
      cacheLogger.error(`Erro ao salvar entrada ${key}:`, error);
    }
  }
  
  /**
   * Recupera dados climáticos de uma cidade do cache
   * Usa timestamp arredondado para maximizar cache hits
   * Retorna null se não existe ou expirou
   */
  async get(cityId: string, date: string, time: string): Promise<WeatherData | null> {
    const key = this.generateKey(cityId, date, time); // Já arredonda internamente
    
    try {
      const entry = await this.weatherStore.getItem<CacheEntry>(key);
      
      if (!entry) {
        return null;
      }
      
      if (!this.isValid(entry.timestamp)) {
        await this.removeByKey(key);
        return null;
      }
      
      // Atualizar último acesso
      this.updateLastAccess(key);
      await this.saveMetadata();
      
      return entry.data;
    } catch (error) {
      cacheLogger.error(`Erro ao recuperar entrada ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Verifica se dados de uma cidade estão no cache e são válidos
   */
  async has(cityId: string, date: string, time: string): Promise<boolean> {
    const data = await this.get(cityId, date, time);
    return data !== null;
  }
  
  /**
   * Remove entrada específica do cache
   */
  async remove(cityId: string, date: string, time: string): Promise<void> {
    const key = this.generateKey(cityId, date, time);
    await this.removeByKey(key);
  }
  
  /**
   * Remove entrada por chave
   */
  private async removeByKey(key: string): Promise<void> {
    try {
      const entry = await this.weatherStore.getItem<CacheEntry>(key);
      if (entry) {
        await this.weatherStore.removeItem(key);
        this.metadata.totalSize -= entry.size;
        this.metadata.keys = this.metadata.keys.filter(k => k !== key);
        delete this.metadata.lastAccessed[key];
        await this.saveMetadata();
      }
    } catch (error) {
      cacheLogger.error(`Erro ao remover entrada ${key}:`, error);
    }
  }
  

  
  /**
   * Limpa todo o cache
   */
  async clear(): Promise<void> {
    try {
      await this.weatherStore.clear();
      this.metadata = {
        keys: [],
        totalSize: 0,
        lastAccessed: {},
      };
      await this.saveMetadata();
      cacheLogger.info('Cache limpo completamente');
    } catch (error) {
      cacheLogger.error('Erro ao limpar cache:', error);
    }
  }
  

  
  /**
   * Remove entradas expiradas (limpeza automática)
   */
  private async cleanup(): Promise<void> {
    cacheLogger.debug('Iniciando limpeza automática...');
    let removed = 0;
    
    for (const key of [...this.metadata.keys]) {
      try {
        const entry = await this.weatherStore.getItem<CacheEntry>(key);
        if (entry && !this.isValid(entry.timestamp)) {
          await this.removeByKey(key);
          removed++;
        }
      } catch (error) {
        cacheLogger.error(`Erro ao limpar entrada ${key}:`, error);
      }
    }
    
    if (removed > 0) {
      cacheLogger.info(`Limpeza completa: ${removed} entradas expiradas removidas. Tamanho: ${this.formatBytes(this.metadata.totalSize)}`);
    }
  }
  
  /**
   * Retorna estatísticas do cache para debug
   */
  getStats(): { 
    total: number;
    size: string;
    limit: string;
    usage: string;
  } {
    const usagePercent = ((this.metadata.totalSize / this.MAX_CACHE_SIZE) * 100).toFixed(2);
    
    return {
      total: this.metadata.keys.length,
      size: this.formatBytes(this.metadata.totalSize),
      limit: this.formatBytes(this.MAX_CACHE_SIZE),
      usage: `${usagePercent}%`,
    };
  }
  
  /**
   * Gera chave para dados detalhados da cidade
   */
  private generateDetailedKey(cityId: string): string {
    return `detailed_${cityId}`;
  }
  
  /**
   * Armazena dados detalhados de uma cidade no cache (TTL: 1 hora)
   */
  async setDetailed(cityId: string, data: DetailedWeatherResponse): Promise<void> {
    const key = this.generateDetailedKey(cityId);
    
    // Serializar dados para remover proxies do Vue
    const serializedData = this.serialize(data);
    const size = this.calculateSize(serializedData);
    
    // Verificar se precisa fazer evicção
    if (this.metadata.totalSize + size > this.MAX_CACHE_SIZE) {
      await this.evictLRU(size);
    }
    
    const entry: DetailedCacheEntry = {
      data: serializedData,
      timestamp: Date.now(),
      size,
    };
    
    try {
      await this.weatherStore.setItem(key, entry);
      
      // Atualizar metadata
      if (!this.metadata.keys.includes(key)) {
        this.metadata.keys.push(key);
      }
      this.metadata.totalSize += size;
      this.updateLastAccess(key);
      
      await this.saveMetadata();
      cacheLogger.info(`Cache detalhado salvo para cidade ${cityId} (${this.formatBytes(size)})`);
    } catch (error) {
      cacheLogger.error(`Erro ao salvar cache detalhado ${key}:`, error);
    }
  }
  
  /**
   * Recupera dados detalhados de uma cidade do cache
   * Retorna null se não existe ou expirou (TTL: 1 hora)
   */
  async getDetailed(cityId: string): Promise<DetailedWeatherResponse | null> {
    const key = this.generateDetailedKey(cityId);
    
    try {
      const entry = await this.weatherStore.getItem<DetailedCacheEntry>(key);
      
      if (!entry) {
        cacheLogger.debug(`Cache miss para cidade ${cityId}`);
        return null;
      }
      
      if (!this.isValid(entry.timestamp, this.DETAILED_WEATHER_TTL)) {
        cacheLogger.debug(`Cache expirado para cidade ${cityId}`);
        await this.removeByKey(key);
        return null;
      }
      
      // Atualizar último acesso
      this.updateLastAccess(key);
      await this.saveMetadata();
      
      cacheLogger.info(`Cache hit para cidade ${cityId}`);
      return entry.data;
    } catch (error) {
      cacheLogger.error(`Erro ao recuperar cache detalhado ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Remove dados detalhados de uma cidade do cache
   */
  async removeDetailed(cityId: string): Promise<void> {
    const key = this.generateDetailedKey(cityId);
    await this.removeByKey(key);
  }
}

// Singleton: exportar uma única instância
export const weatherCache = new WeatherCache();
