<template>
  <div class="city-detail-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
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
        <div v-if="detailedWeather" class="header-right">
          <div class="timestamp-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="timestamp-text">{{ formatTimestamp(detailedWeather.currentWeather.timestamp) }}</span>
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
        <h2 class="section-title">Clima Atual</h2>
        
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
                  {{ detailedWeather.dailyForecasts[0]?.tempMax.toFixed(0) }}°
                </span>
                <span class="temp-range-separator">|</span>
                <span class="temp-range-min">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 19V5m0 14l-4-4m4 4l4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  {{ detailedWeather.dailyForecasts[0]?.tempMin.toFixed(0) }}°
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
          <h3 class="metrics-title">Condições Meteorológicas</h3>
          <table class="weather-metrics-table">
            <tbody>
              <tr>
                <th>
                  <span class="metric-icon">🌡️</span>
                  <span>Sensação Térmica</span>
                </th>
                <td>{{ detailedWeather.currentWeather.feelsLike.toFixed(1) }}°C</td>
                <th>
                  <span class="metric-icon">💧</span>
                  <span>Umidade</span>
                </th>
                <td>{{ detailedWeather.currentWeather.humidity.toFixed(0) }}%</td>
              </tr>
              <tr>
                <th>
                  <span class="metric-icon">🌪️</span>
                  <span>Pressão</span>
                </th>
                <td>{{ detailedWeather.currentWeather.pressure.toFixed(0) }} hPa</td>
                <th>
                  <span class="metric-icon">👁️</span>
                  <span>Visibilidade</span>
                </th>
                <td>{{ (detailedWeather.currentWeather.visibility / 1000).toFixed(1) }} km</td>
              </tr>
              <tr>
                <th>
                  <span class="metric-icon">☁️</span>
                  <span>Nuvens</span>
                </th>
                <td>{{ detailedWeather.currentWeather.clouds.toFixed(0) }}%</td>
                <th>
                  <span class="metric-icon">🌅</span>
                  <span>Nascer do Sol</span>
                </th>
                <td>{{ formatTime(detailedWeather.dailyForecasts[0]?.sunrise || '') }}</td>
              </tr>
              <tr>
                <th colspan="3">
                  <span class="metric-icon">🌇</span>
                  <span>Pôr do Sol</span>
                </th>
                <td>{{ formatTime(detailedWeather.dailyForecasts[0]?.sunset || '') }}</td>
              </tr>
            </tbody>
          </table>
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
        </div>
        <div class="forecast-scroll-container">
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

const logger = componentLogger('CityDetailView');

const route = useRoute();
const router = useRouter();

const detailedWeather = ref<DetailedWeatherResponse | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);
const selectedAlert = ref<any | null>(null);
const showAlertDetail = ref(false);

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
 * Formata timestamp ISO para exibição
 */
const formatTimestamp = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
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
    logger.info(`Carregando dados detalhados da cidade ${cityId}`);
    detailedWeather.value = await getCityWeatherDetailed(cityId);
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
});
</script>

<style scoped lang="scss">
@use '../styles/components/city-detail';
</style>
