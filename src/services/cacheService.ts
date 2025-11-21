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
import type { WeatherData } from './mockService';

interface CacheEntry {
  data: WeatherData;
  timestamp: number; // Timestamp de quando foi cacheado
  size: number; // Tamanho em bytes do dado serializado
}

interface RegionalCacheEntry {
  data: WeatherData[];
  timestamp: number;
  size: number;
}

interface CacheMetadata {
  keys: string[];
  regionalKeys: string[];
  totalSize: number;
  lastAccessed: Record<string, number>; // Para implementar LRU
}

class WeatherCache {
  // TTL para dados climáticos: 30 minutos (em milissegundos)
  private readonly WEATHER_TTL = 30 * 60 * 1000;
  
  // Limite máximo de cache: 10MB
  private readonly MAX_CACHE_SIZE = 10 * 1024 * 1024; // 10MB em bytes
  
  // Stores separados para melhor organização
  private readonly weatherStore: LocalForage;
  private readonly regionalStore: LocalForage;
  private readonly metadataStore: LocalForage;
  
  // Cache de metadata em memória para performance
  private metadata: CacheMetadata = {
    keys: [],
    regionalKeys: [],
    totalSize: 0,
    lastAccessed: {},
  };
  
  constructor() {
    // Configurar stores do localforage
    this.weatherStore = localforage.createInstance({
      name: 'weather-forecast',
      storeName: 'weather_cache',
    });
    
    this.regionalStore = localforage.createInstance({
      name: 'weather-forecast',
      storeName: 'regional_cache',
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
        console.log(`[Cache] Metadata carregado: ${this.metadata.keys.length + this.metadata.regionalKeys.length} entradas, ${this.formatBytes(this.metadata.totalSize)}`);
      }
    } catch (error) {
      console.error('[Cache] Erro ao carregar metadata:', error);
    }
  }
  
  /**
   * Salva metadata no localStorage
   */
  private async saveMetadata(): Promise<void> {
    try {
      await this.metadataStore.setItem('metadata', this.metadata);
    } catch (error) {
      console.error('[Cache] Erro ao salvar metadata:', error);
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
   * Remove entradas menos recentemente usadas até liberar espaço suficiente
   */
  private async evictLRU(requiredSpace: number): Promise<void> {
    console.log(`[Cache] Evicção LRU necessária. Espaço requerido: ${this.formatBytes(requiredSpace)}`);
    
    // Combinar todas as chaves com seus timestamps de último acesso
    const allEntries = [
      ...this.metadata.keys.map(key => ({ key, regional: false, lastAccess: this.metadata.lastAccessed[key] || 0 })),
      ...this.metadata.regionalKeys.map(key => ({ key, regional: true, lastAccess: this.metadata.lastAccessed[key] || 0 })),
    ];
    
    // Ordenar por último acesso (mais antigo primeiro)
    allEntries.sort((a, b) => a.lastAccess - b.lastAccess);
    
    // Remover entradas até liberar espaço suficiente
    for (const entry of allEntries) {
      if (this.metadata.totalSize + requiredSpace <= this.MAX_CACHE_SIZE) {
        break;
      }
      
      if (entry.regional) {
        await this.removeRegionalByKey(entry.key);
      } else {
        await this.removeByKey(entry.key);
      }
    }
    
    console.log(`[Cache] Evicção completa. Tamanho atual: ${this.formatBytes(this.metadata.totalSize)}`);
  }
  
  
  /**
   * Gera chave única para uma cidade em uma data/hora específica
   */
  private generateKey(cityId: string, date: string, time: string): string {
    return `${cityId}_${date}_${time}`;
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
   * Gera chave única para uma requisição regional
   */
  private generateRegionalKey(cityIds: string[], date: string, time: string, radius?: number): string {
    const roundedTime = this.roundTimeToNearest3Hours(time);
    // Ordena cityIds para garantir que a mesma requisição sempre gere a mesma chave
    const sortedIds = [...cityIds].sort();
    const radiusPart = radius !== undefined ? `_${radius}` : '';
    const key = `regional_${sortedIds.join('-')}_${date}_${roundedTime}${radiusPart}`;
    
    // Log para debug - mostra transformação do tempo
    console.log(`[Cache Key] ${cityIds.length} cidades, ${date} ${time} → ${roundedTime}`);
    
    return key;
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
   */
  async set(cityId: string, date: string, time: string, data: WeatherData): Promise<void> {
    const key = this.generateKey(cityId, date, time);
    const size = this.calculateSize(data);
    
    // Verificar se precisa fazer evicção
    if (this.metadata.totalSize + size > this.MAX_CACHE_SIZE) {
      await this.evictLRU(size);
    }
    
    const entry: CacheEntry = {
      data,
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
      console.error(`[Cache] Erro ao salvar entrada ${key}:`, error);
    }
  }
  
  /**
   * Recupera dados climáticos de uma cidade do cache
   * Retorna null se não existe ou expirou
   */
  async get(cityId: string, date: string, time: string): Promise<WeatherData | null> {
    const key = this.generateKey(cityId, date, time);
    
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
      console.error(`[Cache] Erro ao recuperar entrada ${key}:`, error);
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
   * Armazena dados climáticos regionais (múltiplas cidades) no cache
   */
  async setRegional(cityIds: string[], date: string, time: string, data: WeatherData[], radius?: number): Promise<void> {
    const key = this.generateRegionalKey(cityIds, date, time, radius);
    const size = this.calculateSize(data);
    
    // Verificar se precisa fazer evicção
    if (this.metadata.totalSize + size > this.MAX_CACHE_SIZE) {
      await this.evictLRU(size);
    }
    
    const entry: RegionalCacheEntry = {
      data,
      timestamp: Date.now(),
      size,
    };
    
    try {
      await this.regionalStore.setItem(key, entry);
      
      // Atualizar metadata
      if (!this.metadata.regionalKeys.includes(key)) {
        this.metadata.regionalKeys.push(key);
      }
      this.metadata.totalSize += size;
      this.updateLastAccess(key);
      
      await this.saveMetadata();
      console.log(`[Cache] Entrada regional salva com sucesso (${this.formatBytes(size)})`);
    } catch (error) {
      console.error(`[Cache] Erro ao salvar entrada regional ${key}:`, error);
    }
  }
  
  /**
   * Recupera dados climáticos regionais do cache
   * Retorna null se não existe ou expirou
   */
  async getRegional(cityIds: string[], date: string, time: string, radius?: number): Promise<WeatherData[] | null> {
    const key = this.generateRegionalKey(cityIds, date, time, radius);
    
    try {
      const entry = await this.regionalStore.getItem<RegionalCacheEntry>(key);
      
      if (!entry) {
        console.log(`[Cache] Entry não encontrada no store`);
        return null;
      }
      
      if (!this.isValid(entry.timestamp)) {
        console.log(`[Cache] Entry expirada (${Math.round((Date.now() - entry.timestamp) / 1000 / 60)} min atrás)`);
        await this.removeRegionalByKey(key);
        return null;
      }
      
      // Atualizar último acesso
      this.updateLastAccess(key);
      await this.saveMetadata();
      
      return entry.data;
    } catch (error) {
      console.error(`[Cache] Erro ao recuperar entrada regional ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Verifica se dados regionais estão no cache e são válidos
   */
  async hasRegional(cityIds: string[], date: string, time: string, radius?: number): Promise<boolean> {
    const data = await this.getRegional(cityIds, date, time, radius);
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
      console.error(`[Cache] Erro ao remover entrada ${key}:`, error);
    }
  }
  
  /**
   * Remove entrada regional específica do cache
   */
  async removeRegional(cityIds: string[], date: string, time: string, radius?: number): Promise<void> {
    const key = this.generateRegionalKey(cityIds, date, time, radius);
    await this.removeRegionalByKey(key);
  }
  
  /**
   * Remove entrada regional por chave
   */
  private async removeRegionalByKey(key: string): Promise<void> {
    try {
      const entry = await this.regionalStore.getItem<RegionalCacheEntry>(key);
      if (entry) {
        await this.regionalStore.removeItem(key);
        this.metadata.totalSize -= entry.size;
        this.metadata.regionalKeys = this.metadata.regionalKeys.filter(k => k !== key);
        delete this.metadata.lastAccessed[key];
        await this.saveMetadata();
      }
    } catch (error) {
      console.error(`[Cache] Erro ao remover entrada regional ${key}:`, error);
    }
  }
  
  /**
   * Limpa todo o cache (individual e regional)
   */
  async clear(): Promise<void> {
    try {
      await this.weatherStore.clear();
      await this.regionalStore.clear();
      this.metadata = {
        keys: [],
        regionalKeys: [],
        totalSize: 0,
        lastAccessed: {},
      };
      await this.saveMetadata();
      console.log('[Cache] Cache limpo completamente');
    } catch (error) {
      console.error('[Cache] Erro ao limpar cache:', error);
    }
  }
  
  /**
   * Limpa apenas o cache individual
   */
  async clearIndividual(): Promise<void> {
    try {
      for (const key of this.metadata.keys) {
        await this.removeByKey(key);
      }
      console.log('[Cache] Cache individual limpo');
    } catch (error) {
      console.error('[Cache] Erro ao limpar cache individual:', error);
    }
  }
  
  /**
   * Limpa apenas o cache regional
   */
  async clearRegional(): Promise<void> {
    try {
      for (const key of this.metadata.regionalKeys) {
        await this.removeRegionalByKey(key);
      }
      console.log('[Cache] Cache regional limpo');
    } catch (error) {
      console.error('[Cache] Erro ao limpar cache regional:', error);
    }
  }
  
  /**
   * Remove entradas expiradas (limpeza automática)
   */
  private async cleanup(): Promise<void> {
    console.log('[Cache] Iniciando limpeza automática...');
    let removed = 0;
    
    // Limpar cache individual
    for (const key of [...this.metadata.keys]) {
      try {
        const entry = await this.weatherStore.getItem<CacheEntry>(key);
        if (entry && !this.isValid(entry.timestamp)) {
          await this.removeByKey(key);
          removed++;
        }
      } catch (error) {
        console.error(`[Cache] Erro ao limpar entrada ${key}:`, error);
      }
    }
    
    // Limpar cache regional
    for (const key of [...this.metadata.regionalKeys]) {
      try {
        const entry = await this.regionalStore.getItem<RegionalCacheEntry>(key);
        if (entry && !this.isValid(entry.timestamp)) {
          await this.removeRegionalByKey(key);
          removed++;
        }
      } catch (error) {
        console.error(`[Cache] Erro ao limpar entrada regional ${key}:`, error);
      }
    }
    
    if (removed > 0) {
      console.log(`[Cache] Limpeza completa: ${removed} entradas expiradas removidas. Tamanho: ${this.formatBytes(this.metadata.totalSize)}`);
    }
  }
  
  /**
   * Retorna estatísticas do cache para debug
   */
  getStats(): { 
    individual: number; 
    regional: number; 
    total: number;
    size: string;
    limit: string;
    usage: string;
  } {
    const usagePercent = ((this.metadata.totalSize / this.MAX_CACHE_SIZE) * 100).toFixed(2);
    
    return {
      individual: this.metadata.keys.length,
      regional: this.metadata.regionalKeys.length,
      total: this.metadata.keys.length + this.metadata.regionalKeys.length,
      size: this.formatBytes(this.metadata.totalSize),
      limit: this.formatBytes(this.MAX_CACHE_SIZE),
      usage: `${usagePercent}%`,
    };
  }
}

// Singleton: exportar uma única instância
export const weatherCache = new WeatherCache();

