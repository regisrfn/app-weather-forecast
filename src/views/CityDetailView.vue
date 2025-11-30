<template>
  <div class="city-detail-page">
    <!-- Header -->
    <header class="page-header">
      <button @click="goBack" class="back-button" aria-label="Voltar">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Voltar
      </button>
      <h1 v-if="detailedWeather" class="city-name">
        {{ detailedWeather.cityInfo.cityName }}
      </h1>
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
          <span class="timestamp-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            {{ formatTimestamp(detailedWeather.currentWeather.timestamp) }}
          </span>
        </div>
        <div class="current-weather-grid">
          <div class="weather-card main-temp-card">
            <span class="weather-icon">{{ getWeatherIcon(detailedWeather.currentWeather.description) }}</span>
            <div class="temp-info">
              <span class="temp-value">{{ detailedWeather.currentWeather.temperature.toFixed(1) }}°C</span>
              <span class="temp-label">{{ detailedWeather.currentWeather.description }}</span>
            </div>
          </div>

          <div class="weather-card">
            <span class="card-icon">🌡️</span>
            <span class="card-label">Sensação</span>
            <span class="card-value">{{ detailedWeather.currentWeather.feelsLike.toFixed(1) }}°C</span>
          </div>

          <div class="weather-card">
            <span class="card-icon">💧</span>
            <span class="card-label">Umidade</span>
            <span class="card-value">{{ detailedWeather.currentWeather.humidity.toFixed(0) }}%</span>
          </div>

          <div class="weather-card">
            <span class="card-icon">🌪️</span>
            <span class="card-label">Pressão</span>
            <span class="card-value">{{ detailedWeather.currentWeather.pressure.toFixed(0) }} hPa</span>
          </div>

          <div class="weather-card">
            <span class="card-icon">👁️</span>
            <span class="card-label">Visibilidade</span>
            <span class="card-value">{{ (detailedWeather.currentWeather.visibility / 1000).toFixed(1) }} km</span>
          </div>

          <div class="weather-card">
            <span class="card-icon">☁️</span>
            <span class="card-label">Nuvens</span>
            <span class="card-value">{{ detailedWeather.currentWeather.clouds.toFixed(0) }}%</span>
          </div>
        </div>
      </section>

      <!-- Wind Compass e Chart lado a lado em desktop -->
      <section class="visualization-section">
        <div class="visualization-grid">
          <!-- Usar windDirection do dailyForecast[0] para representar direção do dia -->
          <WindCompass 
            :wind-speed="detailedWeather.currentWeather.windSpeed"
            :wind-direction="detailedWeather.dailyForecasts[0]?.windDirection"
          />

          <WeatherChart :daily-forecasts="detailedWeather.dailyForecasts" />
        </div>
      </section>

      <!-- Carrossel de Previsões Diárias -->
      <section class="forecast-section">
        <h2 class="section-title">Previsão Diária ({{ detailedWeather.dailyForecasts.length }} dias)</h2>
        <swiper
          :slides-per-view="1.2"
          :space-between="16"
          :breakpoints="{
            640: { slidesPerView: 2, spaceBetween: 16 },
            768: { slidesPerView: 3, spaceBetween: 20 },
            1024: { slidesPerView: 4, spaceBetween: 24 },
            1280: { slidesPerView: 5, spaceBetween: 24 }
          }"
          :pagination="{ clickable: true }"
          :navigation="true"
          class="forecast-swiper"
        >
          <swiper-slide v-for="forecast in detailedWeather.dailyForecasts" :key="forecast.date">
            <div class="forecast-card">
              <div class="forecast-date">{{ formatForecastDate(forecast.date) }}</div>
              <div class="forecast-icon">☀️</div>
              
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
                UV {{ forecast.uvIndex.toFixed(1) }} - {{ forecast.uvRiskLevel }}
              </div>

              <div class="forecast-sun">
                <div class="sun-time">
                  <span>🌅</span>
                  <span>{{ formatTime(forecast.sunrise) }}</span>
                </div>
                <div class="sun-time">
                  <span>🌇</span>
                  <span>{{ formatTime(forecast.sunset) }}</span>
                </div>
              </div>
            </div>
          </swiper-slide>
        </swiper>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/swiper-bundle.css';

import { getCityWeatherDetailed } from '../services/apiService';
import type { DetailedWeatherResponse } from '../types/weather';
import WindCompass from '../components/WindCompass.vue';
import WeatherChart from '../components/WeatherChart.vue';
import { 
  getWeatherIcon, 
  formatTime, 
  getContrastColor 
} from '../utils/weatherVisuals';
import { componentLogger } from '../utils/logger';

const logger = componentLogger('CityDetailView');

const route = useRoute();
const router = useRouter();

const detailedWeather = ref<DetailedWeatherResponse | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

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
