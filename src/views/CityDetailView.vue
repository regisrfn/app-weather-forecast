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
        <div v-if="detailedWeather" class="header-info">
          <h1 class="city-name">{{ detailedWeather.cityInfo.cityName }}</h1>
          <span v-if="detailedWeather.cityInfo.state" class="city-state">{{ detailedWeather.cityInfo.state }}</span>
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
              :wind-direction="detailedWeather.dailyForecasts[0]?.windDirection || 0"
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
        <h2 class="section-title">Tendências e Previsões</h2>
        <WeatherChart :daily-forecasts="detailedWeather.dailyForecasts" />
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { getCityWeatherDetailed } from '../services/apiService';
import type { DetailedWeatherResponse } from '../types/weather';
import WeatherChart from '../components/WeatherChart.vue';
import WeatherAlerts from '../components/WeatherAlerts.vue';
import AlertDetailPanel from '../components/AlertDetailPanel.vue';
import WindCompass from '../components/WindCompass.vue';
import { 
  getWeatherIcon, 
  formatTime, 
  getContrastColor,
  getPrecipitationIcon
} from '../utils/weatherVisuals';
import { componentLogger } from '../utils/logger';
import { weatherCache } from '../services/cacheService';

const logger = componentLogger('CityDetailView');

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
  
  // Comparar apenas a data, não a hora
  const dateStr = date.toDateString();
  const todayStr = today.toDateString();
  const tomorrowStr = tomorrow.toDateString();
  
  if (dateStr === todayStr) {
    return 'Hoje, ' + date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } else if (dateStr === tomorrowStr) {
    return 'Amanhã, ' + date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } else {
    const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    const day = date.getDate();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `Previsão para ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}, ${day}/${month}`;
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
  
  // Configurar listener de scroll para o carrossel
  if (forecastScrollRef.value) {
    updateForecastScrollButtons();
  }
});
</script>

<style scoped lang="scss">
@use '../styles/components/city-detail';
</style>
