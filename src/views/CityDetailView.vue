<template>
  <div class="city-detail-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-content">
        <button @click="goBack" class="back-button" aria-label="Voltar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div v-if="detailedWeather" class="city-search-container">
          <button 
            v-if="!isSearchActive" 
            @click="activateSearch" 
            class="city-search-button" 
            aria-label="Pesquisar cidade"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="location-icon">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
            </svg>
            <div class="city-info">
              <span class="city-name">{{ detailedWeather.cityInfo.cityName }}</span>
              <span v-if="detailedWeather.cityInfo.state" class="city-state">{{ detailedWeather.cityInfo.state }}</span>
            </div>
          </button>
          
          <div v-else class="inline-search-box">
            <input
              ref="inlineSearchInputRef"
              v-model="searchQuery"
              type="text"
              placeholder="Digite o nome da cidade..."
              class="inline-search-input"
              @input="handleSearchInput"
              @blur="handleSearchBlur"
            />
            <button v-if="searchQuery" @click="clearInlineSearch" class="inline-clear-btn" aria-label="Limpar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          
          <!-- Dropdown de resultados -->
          <div v-if="searchQuery && filteredCities.length > 0" class="search-dropdown">
            <button
              v-for="city in filteredCities"
              :key="city.id"
              @mousedown.prevent="selectCity(city)"
              class="dropdown-item"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
              </svg>
              <div class="dropdown-city-info">
                <span class="dropdown-city-name">{{ city.name }}</span>
                <span class="dropdown-city-state">{{ city.state_name }} ({{ city.state }})</span>
              </div>
            </button>
          </div>
          
          <div v-if="searchQuery && !isSearching && filteredCities.length === 0" class="search-dropdown-empty">
            Nenhuma cidade encontrada
          </div>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Carregando dados da cidade...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <h2>Erro ao carregar dados</h2>
      <p>{{ error }}</p>
      <button @click="loadCityDetails" class="retry-button">Tentar Novamente</button>
    </div>

    <!-- Main Content -->
    <main v-else-if="detailedWeather" class="page-content">
      <!-- Clima Atual -->
      <section class="current-weather-section">
        <div class="section-header">
          <h2 class="section-title">Clima Atual</h2>
          <div v-if="detailedWeather" class="forecast-date-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span>{{ formatForecastDateLabel(detailedWeather.currentWeather.timestamp) }}</span>
          </div>
        </div>
        
        <!-- Hero Cards Grid -->
        <div class="hero-cards-grid">
          <!-- Temperatura Principal -->
          <div class="hero-temp-card">
            <span class="hero-icon">{{ getWeatherIcon(detailedWeather.currentWeather.description) }}</span>
            <div class="hero-temp-info">
              <span class="hero-temp-value">{{ detailedWeather.currentWeather.temperature.toFixed(1) }}°C</span>
              <span class="hero-temp-label">{{ detailedWeather.currentWeather.description }}</span>
              <div class="hero-temp-range">
                <span class="temp-range-max">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5v14m0-14l-4 4m4-4l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  {{ getCurrentTempRange().tempMax.toFixed(0) }}°
                </span>
                <span class="temp-range-separator">|</span>
                <span class="temp-range-min">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 19V5m0 14l-4-4m4 4l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  {{ getCurrentTempRange().tempMin.toFixed(0) }}°
                </span>
              </div>
            </div>
          </div>
          
          <!-- Bússola de Vento em Card Separado -->
          <div class="hero-wind-card">
            <h3 class="wind-card-title">Vento</h3>
            <WindCompass 
              :wind-speed="detailedWeather.currentWeather.windSpeed" 
              :wind-direction="detailedWeather.currentWeather.windDirection || 0"
            />
          </div>
        </div>

        <!-- Tabela de Métricas -->
        <div class="metrics-container">
          <div class="metrics-header" @click="metricsExpanded = !metricsExpanded">
            <h3 class="metrics-title">Condições Meteorológicas</h3>
            <button class="metrics-toggle" :class="{ 'expanded': metricsExpanded }" aria-label="Expandir/Recolher">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <div class="metrics-grid" :class="{ 'collapsed': !metricsExpanded }">
            <div class="metric-item">
              <div class="metric-label">
                <span class="metric-icon">🌡️</span>
                <span>Sensação Térmica</span>
              </div>
              <div class="metric-value">{{ detailedWeather.currentWeather.feelsLike.toFixed(1) }}°C</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">
                <span class="metric-icon">💧</span>
                <span>Umidade</span>
              </div>
              <div class="metric-value">{{ detailedWeather.currentWeather.humidity.toFixed(0) }}%</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">
                <span class="metric-icon">🌪️</span>
                <span>Pressão</span>
              </div>
              <div class="metric-value">{{ detailedWeather.currentWeather.pressure.toFixed(0) }} hPa</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">
                <span class="metric-icon">👁️</span>
                <span>Visibilidade</span>
              </div>
              <div class="metric-value">{{ (detailedWeather.currentWeather.visibility / 1000).toFixed(1) }} km</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">
                <span class="metric-icon">☁️</span>
                <span>Nuvens</span>
              </div>
              <div class="metric-value">{{ detailedWeather.currentWeather.clouds.toFixed(0) }}%</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">
                <span class="metric-icon">🌅</span>
                <span>Nascer do Sol</span>
              </div>
              <div class="metric-value">{{ formatTime(detailedWeather.dailyForecasts[0]?.sunrise || '') }}</div>
            </div>
            <div class="metric-item">
              <div class="metric-label">
                <span class="metric-icon">🌇</span>
                <span>Pôr do Sol</span>
              </div>
              <div class="metric-value">{{ formatTime(detailedWeather.dailyForecasts[0]?.sunset || '') }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Alertas Meteorológicos -->
      <section v-if="detailedWeather.currentWeather.weatherAlert && detailedWeather.currentWeather.weatherAlert.length > 0" class="alerts-section">
        <WeatherAlerts 
          :alerts="detailedWeather.currentWeather.weatherAlert"
          @alert-clicked="handleAlertClick"
        />
      </section>

      <!-- Gráfico de Tendências -->
      <section class="visualization-section">
        <h2 class="section-title">Tendências e Previsões ({{ detailedWeather.dailyForecasts.length }} dias)</h2>
        
        <!-- Mobile: Botão para abrir modal -->
        <button class="chart-mobile-trigger" @click="showWeatherModal = true">
          <span class="trigger-icon">🌡️</span>
          <span class="trigger-text">Ver Gráfico Completo ({{ detailedWeather.dailyForecasts.length }} dias)</span>
          <span class="trigger-arrow">›</span>
        </button>
        
        <!-- Desktop: Gráfico inline -->
        <div class="chart-desktop-wrapper">
          <WeatherChart :daily-forecasts="detailedWeather.dailyForecasts" />
        </div>
      </section>

      <!-- Previsão Horária (próximas 48h) -->
      <section v-if="detailedWeather.hourlyForecasts && detailedWeather.hourlyForecasts.length > 0" class="hourly-forecast-section">
        <!-- Mobile: Botão para abrir modal -->
        <button class="chart-mobile-trigger" @click="showHourlyModal = true">
          <span class="trigger-icon">📈</span>
          <span class="trigger-text">Ver Previsão Hora a Hora ({{ displayedHoursCount }}h)</span>
          <span class="trigger-arrow">›</span>
        </button>
        
        <!-- Desktop: Gráfico inline -->
        <div class="chart-desktop-wrapper">
          <HourlyChart :hourly-forecasts="detailedWeather.hourlyForecasts" :max-hours="48" />
        </div>
      </section>

      <!-- Carrossel de Previsões Diárias -->
      <section class="forecast-section">
        <div class="forecast-header">
          <h2 class="section-title">Previsão para os Próximos {{ detailedWeather.dailyForecasts.length }} Dias</h2>
          <div class="forecast-nav-buttons">
            <button 
              @click="scrollForecastPrev" 
              :disabled="!canScrollForecastLeft"
              class="forecast-nav-btn prev"
              aria-label="Anterior"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button 
              @click="scrollForecastNext" 
              :disabled="!canScrollForecastRight"
              class="forecast-nav-btn next"
              aria-label="Próximo"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div class="forecast-scroll-container" ref="forecastScrollRef" @scroll="updateForecastScrollButtons">
          <div 
            v-for="forecast in detailedWeather.dailyForecasts" 
            :key="forecast.date"
            class="forecast-card"
          >
            <div class="forecast-date">{{ formatForecastDate(forecast.date) }}</div>
            
            <div class="forecast-icon">
              {{ forecast.weatherDescription ? getWeatherIcon(forecast.weatherDescription) : getPrecipitationIcon(forecast.precipitationMm) }}
            </div>
            
            <div class="forecast-temps">
              <span class="temp-max">{{ forecast.tempMax.toFixed(0) }}°</span>
              <span class="temp-separator">/</span>
              <span class="temp-min">{{ forecast.tempMin.toFixed(0) }}°</span>
            </div>

            <div class="forecast-detail">
              <span class="detail-icon">💧</span>
              <span class="detail-value">{{ forecast.precipitationMm.toFixed(1) }} mm</span>
            </div>

            <div class="forecast-detail">
              <span class="detail-icon">☔</span>
              <span class="detail-value">{{ forecast.rainProbability.toFixed(0) }}%</span>
            </div>

            <div class="forecast-uv" :style="{ backgroundColor: forecast.uvRiskColor, color: getContrastColor(forecast.uvRiskColor) }">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="uv-icon">
                <circle cx="12" cy="12" r="5" fill="currentColor"/>
                <path d="M12 1v3m0 16v3M23 12h-3M4 12H1m17.5-7.5l-2 2m-11 11l-2 2m13 0l-2-2m-11-11l-2-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>UV {{ forecast.uvIndex.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- Alert Detail Panel -->
    <AlertDetailPanel
      :alert="selectedAlert"
      :is-open="showAlertDetail"
      @close="closeAlertDetail"
    />

    <!-- City Search Modal -->
    <CitySearchModal
      :is-open="showSearch"
      :municipalities="allMunicipalities"
      @close="closeSearch"
      @select="selectCityFromModal"
    />
    
    <!-- Chart Modals (mobile only) -->
    <HourlyChartModal
      v-if="detailedWeather"
      :is-open="showHourlyModal"
      :hourly-forecasts="detailedWeather.hourlyForecasts"
      @close="showHourlyModal = false"
    />
    
    <WeatherChartModal
      v-if="detailedWeather"
      :is-open="showWeatherModal"
      :daily-forecasts="detailedWeather.dailyForecasts"
      @close="showWeatherModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { getCityWeatherDetailed } from '../services/apiService';
import type { DetailedWeatherResponse } from '../types/weather';
import WeatherChart from '../components/WeatherChart.vue';
import HourlyChart from '../components/HourlyChart.vue';
import HourlyChartModal from '../components/HourlyChartModal.vue';
import WeatherChartModal from '../components/WeatherChartModal.vue';
import WeatherAlerts from '../components/WeatherAlerts.vue';
import AlertDetailPanel from '../components/AlertDetailPanel.vue';
import WindCompass from '../components/WindCompass.vue';
import CitySearchModal from '../components/CitySearchModal.vue';
import { 
  getWeatherIcon, 
  formatTime, 
  getContrastColor,
  getPrecipitationIcon
} from '../utils/weatherVisuals';
import { componentLogger } from '../utils/logger';
import { weatherCache } from '../services/cacheService';

const logger = componentLogger('CityDetailView');

interface Municipality {
  id: string;
  name: string;
  state: string;
  state_name: string;
  microregion: string;
  mesoregion: string;
  region: string;
  latitude: number;
  longitude: number;
}

const route = useRoute();
const router = useRouter();

const detailedWeather = ref<DetailedWeatherResponse | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const selectedAlert = ref<any | null>(null);
const showAlertDetail = ref(false);
const metricsExpanded = ref(false);
const forecastScrollRef = ref<HTMLElement | null>(null);
const canScrollForecastLeft = ref(false);
const canScrollForecastRight = ref(true);

// Search state
const showSearch = ref(false);
const searchQuery = ref('');
const inlineSearchInputRef = ref<HTMLInputElement | null>(null);
const isSearching = ref(false);
const filteredCities = ref<Municipality[]>([]);
const allMunicipalities = ref<Municipality[]>([]);
const isSearchActive = ref(false);

// Modal states
const showHourlyModal = ref(false);
const showWeatherModal = ref(false);

// Computed para calcular quantas horas serão exibidas no gráfico
const displayedHoursCount = computed(() => {
  if (!detailedWeather.value?.hourlyForecasts) return 0;
  
  if (typeof window === 'undefined') return Math.min(48, detailedWeather.value.hourlyForecasts.length);
  
  const width = window.innerWidth;
  if (width < 640) return Math.min(24, detailedWeather.value.hourlyForecasts.length); // Mobile: 24h
  if (width < 768) return Math.min(36, detailedWeather.value.hourlyForecasts.length); // Tablet: 36h
  if (width < 1025) return Math.min(36, detailedWeather.value.hourlyForecasts.length); // Tablet grande: 36h
  return Math.min(48, detailedWeather.value.hourlyForecasts.length); // Desktop: 48h
});

/**
 * Carrega lista de municípios
 */
const loadMunicipalities = async () => {
  try {
    const response = await fetch('/data/municipalities_db.json');
    if (!response.ok) {
      throw new Error('Falha ao carregar municípios');
    }
    allMunicipalities.value = await response.json();
    logger.info(`${allMunicipalities.value.length} municípios carregados`);
  } catch (err) {
    logger.error('Erro ao carregar municípios:', err);
  }
};

/**
 * Normaliza string removendo acentos, cedilha e convertendo para minúsculas
 */
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD') // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remove marcas diacríticas (acentos)
    .replace(/ç/g, 'c') // Substitui ç por c
    .replace(/[^a-z0-9\s]/g, ''); // Remove outros caracteres especiais
};

/**
 * Filtra cidades conforme digitação
 */
const handleSearchInput = () => {
  isSearching.value = true;
  
  // Debounce simples
  setTimeout(() => {
    const query = searchQuery.value.trim();
    
    if (!query || query.length < 2) {
      filteredCities.value = [];
      isSearching.value = false;
      return;
    }
    
    const normalizedQuery = normalizeString(query);
    
    // Filtrar cidades (limitar a 50 resultados para performance)
    filteredCities.value = allMunicipalities.value
      .filter(city => {
        const normalizedName = normalizeString(city.name);
        const normalizedState = normalizeString(city.state);
        const normalizedStateName = normalizeString(city.state_name);
        
        return normalizedName.includes(normalizedQuery) ||
               normalizedState.includes(normalizedQuery) ||
               normalizedStateName.includes(normalizedQuery);
      })
      .slice(0, 50);
    
    isSearching.value = false;
  }, 150);
};

/**
 * Ativa o modo de busca inline
 */
const activateSearch = async () => {
  isSearchActive.value = true;
  await nextTick();
  inlineSearchInputRef.value?.focus();
};

/**
 * Desativa o modo de busca inline
 */
const handleSearchBlur = () => {
  // Delay para permitir clique nos resultados
  setTimeout(() => {
    if (!searchQuery.value) {
      isSearchActive.value = false;
      filteredCities.value = [];
    }
  }, 200);
};

/**
 * Limpa a busca inline
 */
const clearInlineSearch = () => {
  searchQuery.value = '';
  filteredCities.value = [];
  isSearchActive.value = false;
};

/**
 * Seleciona uma cidade e navega para ela (busca inline)
 */
const selectCity = (city: Municipality) => {
  logger.info(`Navegando para cidade: ${city.name} (${city.id})`);
  searchQuery.value = '';
  filteredCities.value = [];
  isSearchActive.value = false;
  router.push(`/city/${city.id}`);
};

/**
 * Fecha modal de pesquisa
 */
const closeSearch = () => {
  showSearch.value = false;
};

/**
 * Seleciona cidade do modal
 */
const selectCityFromModal = (city: Municipality) => {
  logger.info(`Navegando para cidade do modal: ${city.name} (${city.id})`);
  router.push(`/city/${city.id}`);
};

/**
 * Retorna temperaturas máxima e mínima para o clima atual
 * Busca no dailyForecasts o dia que corresponde à data do currentWeather
 */
const getCurrentTempRange = (): { tempMax: number; tempMin: number } => {
  if (!detailedWeather.value) {
    return { tempMax: 0, tempMin: 0 };
  }

  const current = detailedWeather.value.currentWeather;
  const currentDate = new Date(current.timestamp);
  
  // Buscar no dailyForecasts o dia que corresponde à data atual
  const todayForecast = detailedWeather.value.dailyForecasts.find(forecast => {
    const forecastDate = new Date(forecast.date + 'T00:00:00');
    return forecastDate.toDateString() === currentDate.toDateString();
  });
  
  if (todayForecast) {
    return { tempMax: todayForecast.tempMax, tempMin: todayForecast.tempMin };
  }

  // Fallback: retornar temperatura atual como max/min
  return { tempMax: current.temperature, tempMin: current.temperature };
};

/**
 * Formata data para exibição no card
 */
const formatForecastDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const month = date.toLocaleDateString('pt-BR', { month: 'short' });
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' });
  return `${weekday}, ${day} ${month}`;
};



/**
 * Formata data para label do hero (Previsão para Domingo 22/11, Hoje, Amanhã)
 */
const formatForecastDateLabel = (isoString: string): string => {
  const date = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Formatar hora e minuto
  const time = date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
  
  // Comparar apenas a data, não a hora
  const dateStr = date.toDateString();
  const todayStr = today.toDateString();
  const tomorrowStr = tomorrow.toDateString();
  
  if (dateStr === todayStr) {
    return 'Hoje, ' + date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + time;
  } else if (dateStr === tomorrowStr) {
    return 'Amanhã, ' + date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + time;
  } else {
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const day = date.getDate();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `Previsão para ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day}/${month} às ${time}`;
  }
};

/**
 * Rolar carrossel de previsão para a esquerda
 */
const scrollForecastPrev = () => {
  if (forecastScrollRef.value) {
    const itemWidth = forecastScrollRef.value.querySelector('.forecast-card')?.clientWidth || 0;
    forecastScrollRef.value.scrollBy({ left: -(itemWidth + 16), behavior: 'smooth' });
  }
};

/**
 * Rolar carrossel de previsão para a direita
 */
const scrollForecastNext = () => {
  if (forecastScrollRef.value) {
    const itemWidth = forecastScrollRef.value.querySelector('.forecast-card')?.clientWidth || 0;
    forecastScrollRef.value.scrollBy({ left: itemWidth + 16, behavior: 'smooth' });
  }
};

/**
 * Atualizar estado dos botões de scroll
 */
const updateForecastScrollButtons = () => {
  if (forecastScrollRef.value) {
    const { scrollLeft, scrollWidth, clientWidth } = forecastScrollRef.value;
    canScrollForecastLeft.value = scrollLeft > 0;
    canScrollForecastRight.value = scrollLeft < scrollWidth - clientWidth - 5;
  }
};



/**
 * Volta para a página anterior
 */
const goBack = () => {
  router.back();
};

/**
 * Manipula clique em alerta
 */
const handleAlertClick = (alert: any) => {
  selectedAlert.value = alert;
  showAlertDetail.value = true;
};

/**
 * Fecha painel de detalhes do alerta
 */
const closeAlertDetail = () => {
  showAlertDetail.value = false;
  selectedAlert.value = null;
};

/**
 * Carrega dados detalhados da cidade
 */
const loadCityDetails = async () => {
  const cityId = route.params.cityId as string;
  
  if (!cityId) {
    error.value = 'ID da cidade não fornecido';
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    // Tentar buscar do cache primeiro
    logger.info(`Verificando cache para cidade ${cityId}`);
    const cachedData = await weatherCache.getDetailed(cityId);
    
    if (cachedData) {
      logger.info(`Dados carregados do cache para cidade ${cityId}`);
      detailedWeather.value = cachedData;
      
      // Atualizar título da página
      if (detailedWeather.value) {
        document.title = `${detailedWeather.value.cityInfo.cityName} - Previsão do Tempo`;
      }
      isLoading.value = false;
      return;
    }
    
    // Cache miss - buscar da API
    logger.info(`Cache miss - carregando dados detalhados da API para cidade ${cityId}`);
    detailedWeather.value = await getCityWeatherDetailed(cityId);
    
    // Armazenar no cache
    if (detailedWeather.value) {
      await weatherCache.setDetailed(cityId, detailedWeather.value);
      logger.info('Dados armazenados no cache com sucesso');
    }
    
    logger.info('Dados carregados com sucesso');
    
    // Atualizar título da página
    if (detailedWeather.value) {
      document.title = `${detailedWeather.value.cityInfo.cityName} - Previsão do Tempo`;
    }
  } catch (err) {
    logger.error('Erro ao carregar dados da cidade:', err);
    error.value = err instanceof Error ? err.message : 'Erro desconhecido ao carregar dados';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadCityDetails();
  loadMunicipalities();
  
  // Configurar listener de scroll para o carrossel
  if (forecastScrollRef.value) {
    updateForecastScrollButtons();
  }
});

// Watch para mudanças na rota (quando navega para outra cidade)
watch(() => route.params.cityId, (newCityId, oldCityId) => {
  if (newCityId && newCityId !== oldCityId) {
    loadCityDetails();
  }
});
</script>

<style scoped lang="scss">
@use '../styles/components/city-detail';
@use '../styles/abstracts/breakpoints' as *;
@use '../styles/abstracts/variables' as *;

// Mobile chart trigger button
.chart-mobile-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: $spacing-lg;
  background: linear-gradient(135deg, 
    rgba(102, 126, 234, 0.08) 0%,
    rgba(118, 75, 162, 0.08) 100%
  );
  border: 2px solid rgba(139, 157, 225, 0.2);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  @include min-sm {
    display: none !important; // Esconder em telas >= 480px (desktop)
  }
  
  &:active {
    transform: scale(0.98);
    background: linear-gradient(135deg, 
      rgba(102, 126, 234, 0.15) 0%,
      rgba(118, 75, 162, 0.15) 100%
    );
  }
  
  .trigger-icon {
    font-size: 24px;
    margin-right: $spacing-sm;
  }
  
  .trigger-text {
    flex: 1;
    font-size: $font-base;
    font-weight: $font-bold;
    color: #667eea;
    text-align: left;
  }
  
  .trigger-arrow {
    font-size: 28px;
    color: #667eea;
    font-weight: bold;
  }
}

// Desktop chart wrapper
.chart-desktop-wrapper {
  display: none;
  
  @include min-sm {
    display: block !important; // Mostrar em telas >= 480px (desktop)
  }
}
</style>

