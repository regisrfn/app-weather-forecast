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
        <div v-if="detailedWeather" class="timestamp-badge">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span class="timestamp-text">{{ formatTimestamp(detailedWeather.currentWeather.timestamp) }}</span>
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
        
        <!-- Hero Card - Temperatura Principal -->
        <div class="hero-weather-card">
          <div class="hero-main-content">
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
          
          <!-- Bússola Compacta -->
          <div class="hero-wind-compass">
            <div class="compass-mini">
              <svg viewBox="0 0 120 120" class="compass-svg-mini">
                <!-- Círculo externo -->
                <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.15" />
                
                <!-- Pontos cardeais -->
                <text x="60" y="20" text-anchor="middle" class="cardinal-mini cardinal-n" font-size="12" font-weight="bold">N</text>
                <text x="100" y="65" text-anchor="middle" class="cardinal-mini" font-size="10">L</text>
                <text x="60" y="105" text-anchor="middle" class="cardinal-mini" font-size="10">S</text>
                <text x="20" y="65" text-anchor="middle" class="cardinal-mini" font-size="10">O</text>
                
                <!-- Seta indicadora aprimorada -->
                <g :transform="`rotate(${detailedWeather.dailyForecasts[0]?.windDirection || 0} 60 60)`" class="wind-arrow-mini">
                  <!-- Sombra da seta -->
                  <path d="M 61 21 L 66 56 L 61 53 L 56 56 Z" fill="rgba(0, 0, 0, 0.2)" />
                  <!-- Corpo principal da seta -->
                  <path d="M 60 18 L 66 56 L 60 53 L 54 56 Z" fill="#ef4444" stroke="#dc2626" stroke-width="1.5" stroke-linejoin="round" />
                  <!-- Ponta afiada -->
                  <path d="M 60 12 L 70 24 L 60 18 L 50 24 Z" fill="#b91c1c" stroke="#991b1b" stroke-width="1" stroke-linejoin="round" />
                  <!-- Destaque na ponta -->
                  <path d="M 60 12 L 65 18 L 60 16 L 55 18 Z" fill="#fca5a5" opacity="0.8" />
                  <!-- Base circular -->
                  <circle cx="60" cy="58" r="5" fill="#dc2626" stroke="#991b1b" stroke-width="1" />
                  <circle cx="60" cy="57" r="3" fill="#ef4444" opacity="0.7" />
                </g>
                
                <!-- Centro -->
                <circle cx="60" cy="60" r="2" fill="currentColor" opacity="0.5" />
              </svg>
            </div>
            <div class="wind-info-mini">
              <span class="wind-speed-mini">{{ detailedWeather.currentWeather.windSpeed.toFixed(1) }} km/h</span>
              <span class="wind-dir-mini">{{ getWindDirectionLabel(detailedWeather.dailyForecasts[0]?.windDirection || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- Grid de Métricas -->
        <div class="current-weather-grid">
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
            <span class="card-icon">💨</span>
            <span class="card-label">Vento</span>
            <span class="card-value">
              {{ detailedWeather.currentWeather.windSpeed.toFixed(1) }} km/h
              <span class="wind-direction">{{ getWindDirectionLabel(detailedWeather.dailyForecasts[0]?.windDirection || 0) }}</span>
            </span>
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

          <!-- Nascer do Sol -->
          <div class="weather-card sun-card">
            <svg class="card-icon-svg sunrise" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="4" fill="currentColor"/>
              <path d="M12 2v4M12 18v4M22 12h-4M6 12H2M19.07 4.93l-2.83 2.83M7.76 16.24l-2.83 2.83M19.07 19.07l-2.83-2.83M7.76 7.76L4.93 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M2 20h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="card-label">Nascer do Sol</span>
            <span class="card-value">{{ formatTime(detailedWeather.dailyForecasts[0]?.sunrise || '') }}</span>
          </div>

          <!-- Pôr do Sol -->
          <div class="weather-card sun-card">
            <svg class="card-icon-svg sunset" width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="4" fill="currentColor"/>
              <path d="M12 2v4M12 18v4M22 12h-4M6 12H2M19.07 4.93l-2.83 2.83M7.76 16.24l-2.83 2.83M19.07 19.07l-2.83-2.83M7.76 7.76L4.93 4.93" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M2 20h20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="card-label">Pôr do Sol</span>
            <span class="card-value">{{ formatTime(detailedWeather.dailyForecasts[0]?.sunset || '') }}</span>
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
        <h2 class="section-title">Previsão para os Próximos {{ detailedWeather.dailyForecasts.length }} Dias</h2>
        <swiper
          :modules="[Navigation, Pagination]"
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
            <div 
              class="forecast-card"
              :style="{ 
                backgroundColor: getForecastCardColor((forecast.tempMax + forecast.tempMin) / 2, forecast.rainProbability),
                borderColor: getForecastCardBorderColor((forecast.tempMax + forecast.tempMin) / 2, forecast.rainProbability)
              }"
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

              <div class="forecast-detail">
                <span class="detail-icon">💨</span>
                <span class="detail-value">
                  {{ forecast.windSpeedMax.toFixed(0) }} km/h 
                  <span class="wind-dir-label">{{ getWindDirectionLabel(forecast.windDirection) }}</span>
                </span>
              </div>

              <div class="forecast-uv" :style="{ backgroundColor: forecast.uvRiskColor, color: getContrastColor(forecast.uvRiskColor) }">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="uv-icon">
                  <circle cx="12" cy="12" r="5" fill="currentColor"/>
                  <path d="M12 1v3m0 16v3M23 12h-3M4 12H1m17.5-7.5l-2 2m-11 11l-2 2m13 0l-2-2m-11-11l-2-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>UV {{ forecast.uvIndex.toFixed(1) }}</span>
              </div>

              <div class="forecast-sun">
                <div class="sun-time sunrise-time">
                  <svg class="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="4" fill="currentColor"/>
                    <path d="M12 2v4m0 12v4m10-10h-4M6 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M4 19h16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                    <path d="M12 15l-3 4h6l-3-4z" fill="currentColor" opacity="0.3"/>
                  </svg>
                  <span class="sun-label">{{ formatTime(forecast.sunrise) }}</span>
                </div>
                <div class="sun-time sunset-time">
                  <svg class="sun-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="4" fill="currentColor"/>
                    <path d="M12 2v4m0 12v4m10-10h-4M6 12H2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <path d="M4 5h16" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
                    <path d="M12 9l3-4h-6l3 4z" fill="currentColor" opacity="0.3"/>
                  </svg>
                  <span class="sun-label">{{ formatTime(forecast.sunset) }}</span>
                </div>
              </div>

              <div v-if="forecast.moonPhase" class="forecast-moon">
                <span class="moon-emoji">{{ getMoonPhaseEmoji(forecast.moonPhase) }}</span>
                <span class="moon-label">{{ forecast.moonPhase }}</span>
              </div>
            </div>
          </swiper-slide>
        </swiper>
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
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/swiper-bundle.css';

import { getCityWeatherDetailed } from '../services/apiService';
import type { DetailedWeatherResponse } from '../types/weather';
import WeatherChart from '../components/WeatherChart.vue';
import WeatherAlerts from '../components/WeatherAlerts.vue';
import AlertDetailPanel from '../components/AlertDetailPanel.vue';
import { 
  getWeatherIcon, 
  formatTime, 
  getContrastColor,
  getPrecipitationIcon,
  getWindDirectionLabel,
  getMoonPhaseEmoji,
  getForecastCardColor,
  getForecastCardBorderColor
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
