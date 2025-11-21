/**
 * Cache Service - Gerenciamento de cache local para dados climáticos
 * 
 * Implementa cache em memória com TTL (Time To Live) para evitar
 * chamadas duplicadas à API ao navegar entre datas/horários.
 * 
 * Estrutura da chave: `${cityId}_${date}_${time}`
 * Exemplo: "3550308_2025-11-21_14:00"
 */

import type { WeatherData } from './mockService';

interface CacheEntry {
  data: WeatherData;
  timestamp: number; // Timestamp de quando foi cacheado
}

interface RegionalCacheEntry {
  data: WeatherData[];
  timestamp: number;
}

class WeatherCache {
  // Cache para dados individuais de cidades
  private cache: Map<string, CacheEntry>;
  
  // Cache para requisições regionais (múltiplas cidades)
  private regionalCache: Map<string, RegionalCacheEntry>;
  
  // TTL padrão: 30 minutos (em milissegundos)
  private readonly DEFAULT_TTL = 30 * 60 * 1000;
  
  constructor() {
    this.cache = new Map();
    this.regionalCache = new Map();
    
    // Limpeza automática a cada 5 minutos
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  /**
   * Gera chave única para uma cidade em uma data/hora específica
   */
  private generateKey(cityId: string, date: string, time: string): string {
    return `${cityId}_${date}_${time}`;
  }
  
  /**
   * Gera chave única para uma requisição regional
   */
  private generateRegionalKey(cityIds: string[], date: string, time: string, radius?: number): string {
    // Ordena cityIds para garantir que a mesma requisição sempre gere a mesma chave
    const sortedIds = [...cityIds].sort();
    const radiusPart = radius !== undefined ? `_${radius}` : '';
    return `regional_${sortedIds.join('-')}_${date}_${time}${radiusPart}`;
  }
  
  /**
   * Verifica se uma entrada está válida (não expirou)
   */
  private isValid(timestamp: number, ttl: number = this.DEFAULT_TTL): boolean {
    return Date.now() - timestamp < ttl;
  }
  
  /**
   * Armazena dados climáticos de uma cidade no cache
   */
  set(cityId: string, date: string, time: string, data: WeatherData): void {
    const key = this.generateKey(cityId, date, time);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Recupera dados climáticos de uma cidade do cache
   * Retorna null se não existe ou expirou
   */
  get(cityId: string, date: string, time: string): WeatherData | null {
    const key = this.generateKey(cityId, date, time);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (!this.isValid(entry.timestamp)) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  /**
   * Verifica se dados de uma cidade estão no cache e são válidos
   */
  has(cityId: string, date: string, time: string): boolean {
    return this.get(cityId, date, time) !== null;
  }
  
  /**
   * Armazena dados climáticos regionais (múltiplas cidades) no cache
   */
  setRegional(cityIds: string[], date: string, time: string, data: WeatherData[], radius?: number): void {
    const key = this.generateRegionalKey(cityIds, date, time, radius);
    this.regionalCache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Recupera dados climáticos regionais do cache
   * Retorna null se não existe ou expirou
   */
  getRegional(cityIds: string[], date: string, time: string, radius?: number): WeatherData[] | null {
    const key = this.generateRegionalKey(cityIds, date, time, radius);
    const entry = this.regionalCache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (!this.isValid(entry.timestamp)) {
      this.regionalCache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  /**
   * Verifica se dados regionais estão no cache e são válidos
   */
  hasRegional(cityIds: string[], date: string, time: string, radius?: number): boolean {
    return this.getRegional(cityIds, date, time, radius) !== null;
  }
  
  /**
   * Remove entrada específica do cache
   */
  remove(cityId: string, date: string, time: string): void {
    const key = this.generateKey(cityId, date, time);
    this.cache.delete(key);
  }
  
  /**
   * Remove entrada regional específica do cache
   */
  removeRegional(cityIds: string[], date: string, time: string, radius?: number): void {
    const key = this.generateRegionalKey(cityIds, date, time, radius);
    this.regionalCache.delete(key);
  }
  
  /**
   * Limpa todo o cache (individual e regional)
   */
  clear(): void {
    this.cache.clear();
    this.regionalCache.clear();
  }
  
  /**
   * Limpa apenas o cache individual
   */
  clearIndividual(): void {
    this.cache.clear();
  }
  
  /**
   * Limpa apenas o cache regional
   */
  clearRegional(): void {
    this.regionalCache.clear();
  }
  
  /**
   * Remove entradas expiradas (limpeza automática)
   */
  private cleanup(): void {
    // Limpar cache individual
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isValid(entry.timestamp)) {
        this.cache.delete(key);
      }
    }
    
    // Limpar cache regional
    for (const [key, entry] of this.regionalCache.entries()) {
      if (!this.isValid(entry.timestamp)) {
        this.regionalCache.delete(key);
      }
    }
  }
  
  /**
   * Retorna estatísticas do cache para debug
   */
  getStats(): { individual: number; regional: number; total: number } {
    return {
      individual: this.cache.size,
      regional: this.regionalCache.size,
      total: this.cache.size + this.regionalCache.size,
    };
  }
}

// Singleton: exportar uma única instância
export const weatherCache = new WeatherCache();
