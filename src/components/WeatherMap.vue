<template>
  <div class="weather-map-container">
    <!-- Header Flutuante -->
    <header class="floating-header" :class="{ 'menu-open': isMenuOpen }">
      <div class="header-wrapper">
        <div class="header-left">
          <!-- Ícone SVG de nuvem com sol -->
          <svg class="weather-icon" width="36" height="36" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Sol -->
            <circle cx="38" cy="20" r="8" fill="#FDB813" opacity="0.9"/>
            <line x1="38" y1="6" x2="38" y2="10" stroke="#FDB813" stroke-width="2" stroke-linecap="round"/>
            <line x1="52" y1="20" x2="48" y2="20" stroke="#FDB813" stroke-width="2" stroke-linecap="round"/>
            <line x1="46.5" y1="11.5" x2="43.5" y2="14.5" stroke="#FDB813" stroke-width="2" stroke-linecap="round"/>
            <line x1="46.5" y1="28.5" x2="43.5" y2="25.5" stroke="#FDB813" stroke-width="2" stroke-linecap="round"/>
            <!-- Nuvem -->
            <path d="M18 32c-6 0-10 4-10 9s4 9 10 9h24c5.5 0 10-4.5 10-10 0-5-4-9-9-9-1 0-2 0-3 1-1-6-6-10-12-10-5 0-9 3-11 7-3 0-5 1-5 3z" fill="white" stroke="#E0E0E0" stroke-width="1.5"/>
            <ellipse cx="28" cy="38" rx="10" ry="8" fill="#F5F5F5"/>
          </svg>
          <div class="header-title">
            <h1>Previsão do Tempo</h1>
            <span class="subtitle">{{ getCurrentCenterCityName() }}</span>
          </div>
          
          <!-- Campo de Busca de Cidade -->
          <div class="city-search">
            <button class="search-toggle-btn" @click="toggleSearch" aria-label="Buscar cidade">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21l-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <div v-if="isSearchOpen" class="search-container">
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Buscar cidade..."
                @input="filterCities"
                @keydown.enter="selectFirstCity"
                ref="searchInput"
                class="search-input"
              />
              <div v-if="filteredCities.length > 0" class="search-results">
                <div
                  v-for="city in filteredCities.slice(0, 10)"
                  :key="city.id"
                  class="search-result-item"
                  @click="selectCity(city)"
                >
                  {{ city.name }}, {{ city.state }}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Toggle Mobile -->
          <button class="hamburger-btn" @click="toggleMenu" aria-label="Menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        
        <div class="header-controls">
          <!-- Controle de Raio -->
          <div class="control-item radius-control">
            <label for="radius-slider">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2" stroke-dasharray="2 2"/>
                <circle cx="12" cy="12" r="2" fill="currentColor"/>
              </svg>
              <strong>{{ searchRadius }} km</strong>
            </label>
            <input
              id="radius-slider"
              type="range"
              v-model.number="searchRadius"
              :min="APP_CONFIG.RADIUS.MIN"
              :max="APP_CONFIG.RADIUS.MAX"
              step="10"
              @input="debouncedUpdateRegionalData"
            />
          </div>
          
          <!-- Controle de Data/Hora -->
          <div class="control-item datetime-control">
            <button 
              class="date-nav-btn prev" 
              @click="navigatePrevDay"
              :disabled="!canNavigatePrev()"
              aria-label="Dia anterior"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            
            <button 
              class="date-btn"
              @click="showDayCarousel = true"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              {{ formatDateButton() }}
            </button>
            
            <button 
              class="date-nav-btn next" 
              @click="navigateNextDay"
              :disabled="!canNavigateNext()"
              aria-label="Próximo dia"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          
        </div>
      </div>
    </header>
    
    <!-- Indicador de Carregamento -->
    <div v-if="isLoading" class="loading-overlay"></div>
    <div v-if="isLoading" class="loading-indicator">
      <!-- Ícone de clima animado -->
      <div class="weather-icon-loading">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- Sol -->
          <circle cx="38" cy="20" r="8" fill="#FDB813" opacity="0.9"/>
          <line x1="38" y1="6" x2="38" y2="10" stroke="#FDB813" stroke-width="2" stroke-linecap="round"/>
          <line x1="52" y1="20" x2="48" y2="20" stroke="#FDB813" stroke-width="2" stroke-linecap="round"/>
          <line x1="46.5" y1="11.5" x2="43.5" y2="14.5" stroke="#FDB813" stroke-width="2" stroke-linecap="round"/>
          <line x1="46.5" y1="28.5" x2="43.5" y2="25.5" stroke="#FDB813" stroke-width="2" stroke-linecap="round"/>
          <!-- Nuvem -->
          <path d="M18 32c-6 0-10 4-10 9s4 9 10 9h24c5.5 0 10-4.5 10-10 0-5-4-9-9-9-1 0-2 0-3 1-1-6-6-10-12-10-5 0-9 3-11 7-3 0-5 1-5 3z" fill="white" stroke="#E0E0E0" stroke-width="1.5"/>
          <ellipse cx="28" cy="38" rx="10" ry="8" fill="#F5F5F5"/>
        </svg>
      </div>

      <!-- Container do Spinner -->
      <div class="spinner-container">
        <div class="spinner"></div>
      </div>

      <!-- Texto de Loading -->
      <div class="loading-text">
        <div class="main-text">Carregando Previsão</div>
        <div class="sub-text">
          Buscando dados meteorológicos
          <div class="dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
    
    <div id="map" ref="mapContainer"></div>
    
    <!-- Bottom Container -->
    <div class="bottom-container">
      <!-- Legenda Flutuante -->
      <div class="legend-footer">
        <div class="legend-scale">
          <div class="legend-item" v-for="item in legendItems" :key="item.label">
            <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>
      
      <!-- Grupo Stats + Botão -->
      <div class="stats-group">
        <!-- Stats Panel -->
        <div class="stats-panel">
          <div class="stat-item">
            <span class="stat-value">{{ regionalData.length }}</span>
            <span class="stat-label">cidades</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-value">{{ searchRadius }} km</span>
            <span class="stat-label">raio</span>
          </div>
        </div>
        
        <!-- Botão Flutuante -->
        <button 
          v-if="selectedCity" 
          class="info-toggle-btn"
          @click="togglePanel"
          :class="{ 'is-open': isPanelOpen }"
        >
          <div class="btn-content">
            <svg v-if="!isPanelOpen" class="toggle-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
            </svg>
            <svg v-else class="toggle-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
            </svg>
            <span class="toggle-text">{{ selectedCity.cityName }}</span>
          </div>
        </button>
      </div>
    </div>
    
    <!-- Carrossel de Dias -->
    <DayCarousel
      v-if="showDayCarousel"
      :initialDate="forecastDate"
      :initialTime="forecastTime"
      :maxDays="6"
      @close="showDayCarousel = false"
      @select="handleDateTimeSelect"
    />

    <!-- Painel de Detalhes de Alertas -->
    <AlertDetailPanel
      :alert="selectedAlert"
      :isOpen="isAlertPanelOpen"
      @close="closeAlertPanel"
      @jump-to-date="handleJumpToDate"
    />
    
    <!-- Painel de Informações (Expansível) -->
    <div 
      v-if="selectedCity" 
      class="info-panel"
      :class="{ 'is-open': isPanelOpen }"
    >
      <div class="panel-header">
        <div class="header-top">
          <h2 class="city-name-clickable" @click="navigateToCityDetail" role="button" tabindex="0" @keydown.enter="navigateToCityDetail">
            {{ selectedCity.cityName }}
          </h2>
          <div class="header-right">
            <span class="intensity-badge" :style="{ backgroundColor: getRainfallColor(selectedCity.rainfallIntensity) }">
              {{ getRainfallDescription(selectedCity.rainfallIntensity) }}
            </span>
            <button class="close-panel-btn" @click="togglePanel" aria-label="Fechar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Controles de Navegação Temporal -->
        <div class="time-navigation">
          <!-- Botões de navegação Dia -->
          <button 
            class="nav-btn nav-btn-day prev" 
            @click="navigatePrevDay" 
            :disabled="!canNavigatePrev()"
            aria-label="Dia anterior"
            title="Dia anterior"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 5L4 12l7 7M4 12h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          
          <!-- Display central com data e hora -->
          <button 
            class="datetime-display"
            @click="showDayCarousel = true"
            title="Clique para abrir o calendário"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span class="datetime-text">{{ formatDateButton() }}</span>
          </button>
          
          <!-- Botões de navegação Dia -->
          <button 
            class="nav-btn nav-btn-day next" 
            @click="navigateNextDay"
            :disabled="!canNavigateNext()"
            aria-label="Próximo dia"
            title="Próximo dia"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 5l7 7-7 7M20 12H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Timeline de Previsões -->
      <div class="forecast-timeline">
        <div 
          v-for="(forecast, index) in forecastTimeSlots" 
          :key="index"
          class="forecast-card"
          :class="{ 'is-current': index === 0, 'is-loading': forecast.loading }"
          @click="jumpToTime(forecast.time)"
        >
          <div class="forecast-time">{{ forecast.time }}</div>
          <div v-if="!forecast.loading && forecast.data" class="forecast-content">
            <div class="forecast-temp">{{ forecast.data.temperature.toFixed(1) }}°C</div>
            <div class="forecast-rain" v-if="forecast.data.rainfallProbability !== undefined">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor" opacity="0.6"/>
              </svg>
              <span>{{ forecast.data.rainfallProbability.toFixed(0) }}%</span>
            </div>
          </div>
          <div v-else-if="forecast.loading" class="forecast-loading">
            <div class="spinner-small"></div>
          </div>
        </div>
      </div>
      
      <div class="weather-grid">
        <div class="weather-item" v-if="selectedCity.rainfallProbability !== undefined">
          <span class="weather-label">Prob. Chuva</span>
          <span class="weather-value">{{ selectedCity.rainfallProbability.toFixed(0) }}%</span>
        </div>
        <div class="weather-item" v-if="selectedCity.dailyRainAccumulation !== undefined && selectedCity.dailyRainAccumulation > 0">
          <span class="weather-label">Acum. Dia</span>
          <span class="weather-value">{{ selectedCity.dailyRainAccumulation.toFixed(1) }} mm</span>
        </div>
        <div class="weather-item">
          <span class="weather-label">Temp.</span>
          <span class="weather-value">{{ selectedCity.temperature.toFixed(1) }}°C</span>
        </div>
        <div class="weather-item" v-if="selectedCity.tempMin !== undefined && selectedCity.tempMax !== undefined">
          <span class="weather-label">Mín/Máx</span>
          <span class="weather-value">{{ selectedCity.tempMin.toFixed(1) }}° / {{ selectedCity.tempMax.toFixed(1) }}°</span>
        </div>
        <div class="weather-item">
          <span class="weather-label">Umidade</span>
          <span class="weather-value">{{ selectedCity.humidity.toFixed(0) }}%</span>
        </div>
        <div class="weather-item">
          <span class="weather-label">Vento</span>
          <span class="weather-value">{{ selectedCity.windSpeed.toFixed(1) }} km/h</span>
        </div>
        <div class="weather-item" v-if="selectedCity.clouds !== undefined">
          <span class="weather-label">Tempo</span>
          <span class="weather-value">{{ getCloudsDescription(selectedCity.clouds) }}</span>
        </div>
      </div>
      
      <!-- Alertas Meteorológicos -->
      <WeatherAlerts :alerts="selectedCity.weatherAlert" @alert-clicked="handleAlertClick" />
      
      <div class="update-time">
        Previsão para: {{ formatTime(selectedCity.timestamp) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { APP_CONFIG } from '../config/app';
import { getNeighborCities, getRegionalWeather } from '../services/apiService';
import { getMunicipalityMesh } from '../services/ibgeService';
import { getCloudsDescription, getRainfallColor, getRainfallDescription, type WeatherData } from '../services/mockService';
import DayCarousel from './DayCarousel.vue';
import WeatherAlerts from './WeatherAlerts.vue';
import AlertDetailPanel from './AlertDetailPanel.vue';
import type { WeatherAlert } from '../types/weather';
import { componentLogger } from '../utils/logger';

const logger = componentLogger('WeatherMap');

// Router
const route = useRoute();
const router = useRouter();

// Corrigir ícones do Leaflet para produção
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
const selectedCity = ref<WeatherData | null>(null);
const regionalData = ref<WeatherData[]>([]);
const geoJsonLayers: L.GeoJSON[] = [];
let updateInterval: number | null = null;
let radiusCircle: L.Circle | null = null;
let selectedLayer: L.Layer | null = null; // Camada atualmente selecionada
const layerColors = new Map<L.Layer, string>(); // Guardar cores originais
let centerMarker: L.Marker | null = null; // Marcador da cidade central

// Dados dos municípios
const municipalities = ref<Array<{id: string, name: string, state: string, latitude: number, longitude: number}>>([]);
const searchQuery = ref<string>('');
const filteredCities = ref<Array<{id: string, name: string, state: string, latitude: number, longitude: number}>>([]);
const isSearchOpen = ref<boolean>(false);

// Cidade central (reativa)
const centerCityId = ref<string>(APP_CONFIG.CENTER_CITY_ID);
const centerLat = ref<number>(APP_CONFIG.MAP.CENTER.lat);
const centerLng = ref<number>(APP_CONFIG.MAP.CENTER.lng);

// Controle de raio de busca (em km)
const searchRadius = ref<number>(APP_CONFIG.RADIUS.DEFAULT);

// Controle de data/hora da previsão
const forecastDate = ref<string>(''); // YYYY-MM-DD
const forecastTime = ref<string>(''); // HH:MM
const showDayCarousel = ref<boolean>(false); // Controla exibição do carrossel

// Controle de abertura do painel
const isPanelOpen = ref<boolean>(false);

// Controle do menu hamburger (mobile)
const isMenuOpen = ref<boolean>(false);

// Controle do painel de detalhes de alertas
const selectedAlert = ref<WeatherAlert | null>(null);
const isAlertPanelOpen = ref<boolean>(false);

// Controle de carregamento
const isLoading = ref<boolean>(false);

// Previsões de múltiplos horários
interface ForecastSlot {
  time: string;
  data: WeatherData | null;
  loading: boolean;
}

const forecastTimeSlots = ref<ForecastSlot[]>([
  { time: '00:00', data: null, loading: false },
  { time: '03:00', data: null, loading: false },
  { time: '06:00', data: null, loading: false }
]);

const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value;
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const handleAlertClick = (alert: WeatherAlert) => {
  selectedAlert.value = alert;
  isAlertPanelOpen.value = true;
};

const closeAlertPanel = () => {
  isAlertPanelOpen.value = false;
  selectedAlert.value = null;
};

const handleJumpToDate = async (date: string, time: string) => {
  forecastDate.value = date;
  forecastTime.value = time;
  await updateRegionalData();
};

const jumpToTime = async (time: string) => {
  forecastTime.value = time;
  await updateRegionalData();
};

/**
 * Navega para a página de detalhes da cidade
 */
const navigateToCityDetail = () => {
  if (selectedCity.value) {
    router.push(`/city/${selectedCity.value.cityId}`);
  }
};

// Atualizar slots de previsão
const updateForecastSlots = async () => {
  if (!selectedCity.value) return;
  
  const currentTime = forecastTime.value;
  const parts = currentTime.split(':');
  const currentHours = parts[0] ? parseInt(parts[0]) : 0;
  
  // Calcular os 3 slots de tempo (atual, +3h, +6h)
  const slots: string[] = [];
  for (let i = 0; i < 3; i++) {
    let hour = currentHours + (i * 3);
    if (hour >= 24) hour = hour - 24;
    slots.push(`${String(hour).padStart(2, '0')}:00`);
  }
  
  // Atualizar os slots
  forecastTimeSlots.value = slots.map((time, index) => ({
    time,
    data: index === 0 ? selectedCity.value : null,
    loading: index > 0
  }));
  
  // Buscar dados para os próximos horários
  for (let i = 1; i < slots.length; i++) {
    const time = slots[i];
    const slot = forecastTimeSlots.value[i];
    if (!slot) continue;
    
    try {
      const weatherData = await getRegionalWeather([selectedCity.value.cityId], forecastDate.value, time);
      if (weatherData.length > 0 && weatherData[0]) {
        slot.data = weatherData[0];
      }
    } catch (error) {
      logger.error(`Erro ao buscar previsão para ${time}:`, error);
    } finally {
      slot.loading = false;
    }
  }
};

const toggleSearch = () => {
  isSearchOpen.value = !isSearchOpen.value;
  if (isSearchOpen.value) {
    // Focar no input quando abrir
    setTimeout(() => {
      const input = document.querySelector('.search-input') as HTMLInputElement;
      if (input) input.focus();
    }, 100);
  } else {
    searchQuery.value = '';
    filteredCities.value = [];
  }
};

const loadMunicipalities = async () => {
  try {
    const response = await fetch('/data/municipalities_db.json');
    municipalities.value = await response.json();
  } catch (error) {
    logger.error('Erro ao carregar municípios:', error);
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

const filterCities = () => {
  if (searchQuery.value.length < 2) {
    filteredCities.value = [];
    return;
  }
  
  const normalizedQuery = normalizeString(searchQuery.value);
  
  filteredCities.value = municipalities.value.filter(city => {
    const normalizedName = normalizeString(city.name);
    const normalizedState = normalizeString(city.state);
    
    return normalizedName.includes(normalizedQuery) || 
           normalizedState.includes(normalizedQuery);
  });
};

const selectCity = (city: {id: string, name: string, state: string, latitude: number, longitude: number}) => {
  centerCityId.value = city.id;
  centerLat.value = city.latitude;
  centerLng.value = city.longitude;
  isSearchOpen.value = false;
  searchQuery.value = '';
  filteredCities.value = [];
  
  // Atualizar mapa e dados
  updateMapCenter();
  updateRadiusCircle();
  selectedLayer = null;
  loadRegionalData();
};

const selectFirstCity = () => {
  if (filteredCities.value.length > 0) {
    selectCity(filteredCities.value[0]!);
  }
};

const updateMapCenter = () => {
  if (map) {
    map.setView([centerLat.value, centerLng.value], APP_CONFIG.MAP.DEFAULT_ZOOM);
    
    // Remover marcador anterior
    if (centerMarker) {
      map.removeLayer(centerMarker);
    }
    
    // Adicionar novo marcador
    centerMarker = L.marker([centerLat.value, centerLng.value])
      .addTo(map)
      .bindPopup(`<b>${getCurrentCenterCityName()}</b>`)
      .openPopup();
  }
};

const getCurrentCenterCityName = (): string => {
  const city = municipalities.value.find(c => c.id === centerCityId.value);
  return city ? `${city.name}, ${city.state}` : 'Carregando...';
};

const legendItems = [
  { color: 'rgba(200, 200, 200, 0.3)', label: '0 - Sem chuva' },
  { color: 'rgba(173, 216, 230, 0.6)', label: '< 15 - Fraca' },
  { color: 'rgba(100, 149, 237, 0.7)', label: '15-35 - Moderada' },
  { color: 'rgba(30, 144, 255, 0.8)', label: '35-60 - Forte' },
  { color: 'rgba(0, 0, 139, 0.9)', label: '> 60 - Intensa' },
];

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo', // Garantir timezone do Brasil
  });
};

const initMap = () => {
  if (!mapContainer.value) return;

  // Inicializar mapa centrado na cidade atual
  map = L.map(mapContainer.value).setView(
    [centerLat.value, centerLng.value],
    APP_CONFIG.MAP.DEFAULT_ZOOM
  );

  // Adicionar camada base do OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: APP_CONFIG.MAP.MAX_ZOOM,
    minZoom: APP_CONFIG.MAP.MIN_ZOOM,
  }).addTo(map);

  // Marcar cidade central
  centerMarker = L.marker([centerLat.value, centerLng.value])
    .addTo(map)
    .bindPopup(`<b>${getCurrentCenterCityName()}</b>`)
    .openPopup();
  
  // Adicionar círculo de raio
  updateRadiusCircle();
};

const updateRadiusCircle = () => {
  if (!map) return;
  
  // Remover círculo anterior
  if (radiusCircle) {
    map.removeLayer(radiusCircle);
  }
  
  // Adicionar novo círculo
  radiusCircle = L.circle([centerLat.value, centerLng.value], {
    color: '#667eea',
    fillColor: '#667eea',
    fillOpacity: 0.1,
    radius: searchRadius.value * 1000, // Converter km para metros
    weight: 2,
    dashArray: '5, 10',
  }).addTo(map);
};

const loadRegionalData = async () => {
  // Ativar loading imediatamente (delay visual é feito via CSS)
  isLoading.value = true;
  
  try {
    // 1. Buscar cidades vizinhas do backend (ou mock)
    const response = await getNeighborCities(centerCityId.value, searchRadius.value);
    
    // Incluir a cidade centro na lista
    const allCities = [response.centerCity, ...response.neighbors];
    const cityIds = allCities.map(c => c.id);
    
    // 2. Buscar dados climáticos do backend (ou mock) com cache
    // SEMPRE passa data e hora (inicializadas com horário Brasil correto)
    const weatherData = await getRegionalWeather(cityIds, forecastDate.value, forecastTime.value);
    
    regionalData.value = weatherData;
    
    // 3. Renderizar malhas no mapa
    await renderCityMeshes(allCities, weatherData);
    
    // 4. Selecionar cidade central por padrão
    const centerData = weatherData.find((d: WeatherData) => d.cityId === centerCityId.value);
    if (centerData) {
      selectedCity.value = centerData;
      await updateForecastSlots();
    }
  } catch (error) {
    logger.error('Erro ao carregar dados regionais:', error);
  } finally {
    // Sempre desativar loading ao final
    isLoading.value = false;
  }
};

const renderCityMeshes = async (
  cities: Array<{ id: string; name: string; latitude: number; longitude: number }>,
  weatherData: WeatherData[]
) => {
  if (!map) return;

  // Limpar camadas anteriores
  geoJsonLayers.forEach(layer => map?.removeLayer(layer));
  geoJsonLayers.length = 0;
  layerColors.clear(); // Limpar cores guardadas

  for (const city of cities) {
    const geometry = await getMunicipalityMesh(city.id);
    const weather = weatherData.find(w => w.cityId === city.id);
    
    if (geometry && weather) {
      const color = getRainfallColor(weather.rainfallIntensity);
      
      const geoJsonLayer = L.geoJSON(geometry, {
        style: {
          fillColor: color,
          fillOpacity: 0.7,
          color: '#2c3e50',
          weight: 2,
          dashArray: '',
        },
        onEachFeature: (_feature, layer) => {
          // Guardar cor original da camada
          layerColors.set(layer, color);
          
          layer.on({
            click: () => {
              // Resetar estilo da camada anteriormente selecionada
              if (selectedLayer && selectedLayer !== layer) {
                const originalColor = layerColors.get(selectedLayer);
                if (originalColor) {
                  (selectedLayer as any).setStyle({
                    fillColor: originalColor,
                    fillOpacity: 0.7,
                    weight: 2,
                    color: '#2c3e50',
                    dashArray: '',
                  });
                }
              }
              
              // Destacar camada selecionada com verde suave
              (layer as any).setStyle({
                fillColor: '#52c41a', // Verde suave no preenchimento
                fillOpacity: 0.6,
                weight: 3,
                color: '#27ae60', // Verde mais escuro na borda
                dashArray: '', // Remove dash array se houver
                outline: 'none', // Remove outline
              });
              
              selectedLayer = layer;
              selectedCity.value = weather;
              isPanelOpen.value = true; // Abrir painel ao clicar
              updateForecastSlots(); // Atualizar previsões ao selecionar cidade
            },
            mouseover: (e) => {
              const layer = e.target;
              // Não alterar se for a camada selecionada
              if (selectedLayer !== layer) {
                layer.setStyle({
                  weight: 3,
                  color: '#34495e',
                });
              }
            },
            mouseout: (e) => {
              const layer = e.target;
              // Não alterar se for a camada selecionada
              if (selectedLayer !== layer) {
                layer.setStyle({
                  weight: 2,
                  color: '#2c3e50',
                });
              }
            },
          });
          
          layer.bindTooltip(
            `<b>${city.name}</b><br>Intensidade: ${weather.rainfallIntensity.toFixed(0)} - ${getRainfallDescription(weather.rainfallIntensity)}`,
            { permanent: false, direction: 'top' }
          );
        },
      });
      
      geoJsonLayer.addTo(map);
      geoJsonLayers.push(geoJsonLayer);
    }
  }
};

// Debounce para evitar múltiplas chamadas no slider
let debounceTimer: number | null = null;
const debouncedUpdateRegionalData = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  // Atualizar círculo imediatamente para feedback visual
  updateRadiusCircle();
  
  // Aguardar 500ms antes de fazer a chamada API
  debounceTimer = window.setTimeout(async () => {
    selectedLayer = null;
    await loadRegionalData();
  }, 500);
};

const updateRegionalData = async () => {
  updateRadiusCircle();
  selectedLayer = null; // Resetar seleção ao mudar raio
  await loadRegionalData();
};

const handleDateTimeSelect = async (date: string, time: string) => {
  forecastDate.value = date;
  forecastTime.value = time;
  await updateRegionalData();
};

const formatDateButton = (): string => {
  if (!forecastDate.value) return 'Selecionar';
  
  const parts = forecastDate.value.split('-');
  if (parts.length !== 3) return 'Selecionar';
  
  const [year, month, day] = parts;
  if (!year || !month || !day) return 'Selecionar';
  
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  const now = new Date();
  const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  brasilTime.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((date.getTime() - brasilTime.getTime()) / (1000 * 60 * 60 * 24));
  
  let dayLabel = '';
  if (diffDays === 0) dayLabel = 'Hoje';
  else if (diffDays === 1) dayLabel = 'Amanhã';
  else dayLabel = date.toLocaleDateString('pt-BR', { weekday: 'short' });
  
  return `${dayLabel}, ${day}/${month} ${forecastTime.value}`;
};

const canNavigatePrev = (): boolean => {
  if (!forecastDate.value) return false;
  
  const now = new Date();
  const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const todayStr = `${brasilTime.getFullYear()}-${String(brasilTime.getMonth() + 1).padStart(2, '0')}-${String(brasilTime.getDate()).padStart(2, '0')}`;
  
  return forecastDate.value > todayStr;
};

const canNavigateNext = (): boolean => {
  if (!forecastDate.value) return false;
  
  const parts = forecastDate.value.split('-');
  if (parts.length !== 3) return false;
  
  const [year, month, day] = parts;
  if (!year || !month || !day) return false;
  
  const currentDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  const now = new Date();
  const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const maxDate = new Date(brasilTime);
  maxDate.setDate(maxDate.getDate() + 5); // Máximo 6 dias (0-5)
  
  // Comparar apenas as datas (sem horas) usando strings YYYY-MM-DD
  const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  const maxDateStr = `${maxDate.getFullYear()}-${String(maxDate.getMonth() + 1).padStart(2, '0')}-${String(maxDate.getDate()).padStart(2, '0')}`;
  
  return currentDateStr < maxDateStr;
};

const navigatePrevDay = async () => {
  if (!canNavigatePrev()) return;
  
  const parts = forecastDate.value.split('-');
  if (parts.length !== 3) return;
  
  const [year, month, day] = parts;
  if (!year || !month || !day) return;
  
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  date.setDate(date.getDate() - 1);
  
  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, '0');
  const newDay = String(date.getDate()).padStart(2, '0');
  
  forecastDate.value = `${newYear}-${newMonth}-${newDay}`;
  await updateRegionalData();
};

const navigateNextDay = async () => {
  if (!canNavigateNext()) return;
  
  const parts = forecastDate.value.split('-');
  if (parts.length !== 3) return;
  
  const [year, month, day] = parts;
  if (!year || !month || !day) return;
  
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  date.setDate(date.getDate() + 1);
  
  const newYear = date.getFullYear();
  const newMonth = String(date.getMonth() + 1).padStart(2, '0');
  const newDay = String(date.getDate()).padStart(2, '0');
  
  forecastDate.value = `${newYear}-${newMonth}-${newDay}`;
  await updateRegionalData();
};

onMounted(async () => {
  // Carregar dados dos municípios
  await loadMunicipalities();
  
  // Inicializar data e hora padrão (agora em horário Brasil)
  const now = new Date();
  
  // Converter para timezone do Brasil (America/Sao_Paulo)
  const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  
  // Formatar data YYYY-MM-DD
  const year = brasilTime.getFullYear();
  const month = String(brasilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brasilTime.getDate()).padStart(2, '0');
  const defaultDate = `${year}-${month}-${day}`;
  
  // Formatar hora HH:MM
  const hours = String(brasilTime.getHours()).padStart(2, '0');
  const minutes = String(brasilTime.getMinutes()).padStart(2, '0');
  const defaultTime = `${hours}:${minutes}`;
  
  // Inicializar estado a partir da URL ou usar valores padrão
  initializeFromURL(defaultDate, defaultTime);
  
  initMap();
  await loadRegionalData();
  
  // Atualizar dados automaticamente
  updateInterval = window.setInterval(() => loadRegionalData(), APP_CONFIG.UPDATE_INTERVAL);
});

// Inicializar estado a partir dos parâmetros da URL
const initializeFromURL = (defaultDate: string, defaultTime: string) => {
  const query = route.query;
  
  // Inicializar cidade
  if (query.city && typeof query.city === 'string') {
    const cityExists = municipalities.value.some(m => m.id === query.city);
    if (cityExists) {
      centerCityId.value = query.city;
      const city = municipalities.value.find(m => m.id === query.city);
      if (city) {
        centerLat.value = city.latitude;
        centerLng.value = city.longitude;
      }
    } else {
      centerCityId.value = APP_CONFIG.CENTER_CITY_ID;
      centerLat.value = APP_CONFIG.MAP.CENTER.lat;
      centerLng.value = APP_CONFIG.MAP.CENTER.lng;
    }
  } else {
    centerCityId.value = APP_CONFIG.CENTER_CITY_ID;
    centerLat.value = APP_CONFIG.MAP.CENTER.lat;
    centerLng.value = APP_CONFIG.MAP.CENTER.lng;
  }
  
  // Inicializar raio
  if (query.radius && typeof query.radius === 'string') {
    const radius = parseInt(query.radius);
    if (!isNaN(radius) && radius >= APP_CONFIG.RADIUS.MIN && radius <= APP_CONFIG.RADIUS.MAX) {
      searchRadius.value = radius;
    } else {
      searchRadius.value = APP_CONFIG.RADIUS.DEFAULT;
    }
  } else {
    searchRadius.value = APP_CONFIG.RADIUS.DEFAULT;
  }
  
  // Inicializar data
  if (query.date && typeof query.date === 'string') {
    if (isValidDate(query.date)) {
      forecastDate.value = query.date;
    } else {
      forecastDate.value = defaultDate;
    }
  } else {
    forecastDate.value = defaultDate;
  }
  
  // Inicializar hora
  if (query.time && typeof query.time === 'string') {
    if (isValidTime(query.time)) {
      forecastTime.value = query.time;
    } else {
      forecastTime.value = defaultTime;
    }
  } else {
    forecastTime.value = defaultTime;
  }
};

// Validar formato de data YYYY-MM-DD
const isValidDate = (dateStr: string): boolean => {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match || !match[1] || !match[2] || !match[3]) return false;
  
  const year = parseInt(match[1]);
  const month = parseInt(match[2]);
  const day = parseInt(match[3]);
  
  const date = new Date(year, month - 1, day);
  const now = new Date();
  const maxDate = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000); // +6 dias
  
  return date.getFullYear() === year &&
         date.getMonth() === month - 1 &&
         date.getDate() === day &&
         date >= now &&
         date <= maxDate;
};

// Validar formato de hora HH:MM
const isValidTime = (timeStr: string): boolean => {
  const match = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!match || !match[1] || !match[2]) return false;
  
  const hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
};

// Atualizar URL quando o estado mudar
const updateURL = () => {
  router.replace({
    query: {
      city: centerCityId.value,
      radius: searchRadius.value.toString(),
      date: forecastDate.value,
      time: forecastTime.value
    }
  });
};

// Flag para evitar atualização da URL durante a inicialização
let isInitialLoad = true;

// Watchers para sincronizar estado com URL
watch([centerCityId, searchRadius, forecastDate, forecastTime], () => {
  if (isInitialLoad) {
    isInitialLoad = false;
    // Atualizar URL na primeira carga para garantir consistência
    updateURL();
    return;
  }
  updateURL();
}, { deep: true });

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  if (map) {
    map.remove();
    map = null;
  }
});
</script>
