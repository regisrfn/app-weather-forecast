/**
 * Configuração centralizada da aplicação
 */

export const APP_CONFIG = {
  /**
   * ID IBGE da cidade centro
   * Ribeirão do Sul, SP
   */
  CENTER_CITY_ID: '3543204',

  /**
   * URL base da API backend
   * Usar mock enquanto backend não estiver implementado
   */
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',

  /**
   * Modo de desenvolvimento - usa dados mockados
   */
  USE_MOCK: import.meta.env.VITE_USE_MOCK !== 'false',

  /**
   * Configurações do mapa
   */
  MAP: {
    DEFAULT_ZOOM: 10,
    MIN_ZOOM: 5,
    MAX_ZOOM: 18,
    CENTER: {
      lat: -22.7572,
      lng: -49.9439,
    },
  },

  /**
   * Configurações de raio
   */
  RADIUS: {
    DEFAULT: 50,
    MIN: 10,
    MAX: 150,
  },

  /**
   * Intervalo de atualização dos dados (ms)
   */
  UPDATE_INTERVAL: 60 * 60 * 1000, // 60 minutos

  /**
   * Configurações de API
   */
  API: {
    /**
     * Tamanho máximo de cidades por requisição batch
     * Para evitar timeouts e limites de payload do backend
     */
    MAX_CITIES_PER_BATCH: 50,
  },
} as const;
