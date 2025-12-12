<template>
  <div class="weather-shell">
    <header class="weather-topbar">
      <div class="topbar-left">
        <div class="brand">
          <div class="brand-icon">
            <svg width="26" height="26" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="38" cy="20" r="8" fill="currentColor" opacity="0.9" />
              <path d="M18 32c-6 0-10 4-10 9s4 9 10 9h24c5.5 0 10-4.5 10-10 0-5-4-9-9-9-1 0-2 0-3 1-1-6-6-10-12-10-5 0-9 3-11 7-3 0-5 1-5 3z" fill="white" opacity="0.9" />
            </svg>
          </div>
          <div class="brand-text">
            <div class="brand-title">Previsão do Tempo</div>
            <div class="brand-subtitle">{{ getCurrentCenterCityName() }}</div>
          </div>
        </div>
        <div class="topbar-date">{{ headerDateLabel }}</div>
      </div>

      <div class="topbar-right">
        <div class="layer-select">
          <label for="layer-select">Camada</label>
          <select id="layer-select" v-model="activeLayer">
            <option value="rain">Chuva</option>
            <option value="alerts">Alertas</option>
            <option value="temperature">Temperatura</option>
            <option value="wind">Vento</option>
          </select>
        </div>
        <button
          class="pill-btn ghost"
          type="button"
          @click="toggleTheme"
          :aria-label="isDark() ? 'Ativar modo claro' : 'Ativar modo escuro'"
        >
          <svg v-if="!isDark()" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="5" fill="currentColor" />
            <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </header>

    <div class="weather-grid">
      <aside class="sidebar-card">
        <div class="sidebar-header">
          <div class="sidebar-title">Previsão do tempo</div>
          <div class="sidebar-subtitle">Escolha a cidade centro e personalize os dados.</div>
        </div>

        <div class="sidebar-section">
          <div class="search-field">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21l-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <input
              id="city-search"
              type="text"
              v-model="searchQuery"
              placeholder="Buscar cidade..."
              @input="filterCities"
              @keydown.enter="selectFirstCity"
            />
          </div>
          <div v-if="filteredCities.length > 0" class="search-dropdown">
            <button
              v-for="city in filteredCities.slice(0, 8)"
              :key="city.id"
              class="dropdown-item"
              type="button"
              @click="selectCity(city)"
            >
              <span>{{ city.name }}, {{ city.state }}</span>
            </button>
          </div>
        </div>

        <div class="sidebar-section">
          <div class="section-label">Raio de busca</div>
          <div class="radius-row">
            <input
              id="radius-slider"
              type="range"
              v-model.number="searchRadius"
              :min="APP_CONFIG.RADIUS.MIN"
              :max="APP_CONFIG.RADIUS.MAX"
              step="10"
              @input="debouncedUpdateRegionalData"
            />
            <span class="radius-value">{{ searchRadius }} km</span>
          </div>
        </div>

        <div class="sidebar-section">
          <div class="section-label">Cidades próximas</div>
          <div class="city-list">
            <button
              v-for="city in sidebarCities"
              :key="city.id"
              class="city-item"
              type="button"
              @click="selectCity(city)"
              :aria-pressed="centerCityId === city.id"
            >
              <span class="city-dot" :class="{ active: centerCityId === city.id }"></span>
              <div class="city-item-text">
                <span class="city-name">{{ city.name }}</span>
                <span class="city-state">- {{ city.state }}</span>
              </div>
              <span class="city-distance" v-if="city.distance">{{ city.distance.toFixed(0) }} km</span>
            </button>
          </div>
        </div>

        <div class="sidebar-section">
          <div class="section-label">Indicadores</div>
          <div class="filter-list">
            <label class="filter-item">
              <input type="checkbox" v-model="metricsToggles.rain" />
              Chuva
            </label>
            <label class="filter-item">
              <input type="checkbox" v-model="metricsToggles.temperature" />
              Temperatura
            </label>
            <label class="filter-item">
              <input type="checkbox" v-model="metricsToggles.wind" />
              Vento
            </label>
            <label class="filter-item">
              <input type="checkbox" v-model="metricsToggles.alerts" />
              Alertas
            </label>
          </div>
        </div>
      </aside>

      <section class="map-area">
        <div class="map-wrapper">
          <div v-if="isLoading" class="loading-overlay"></div>
          <div v-if="isLoading" class="loading-indicator">
            <div class="weather-icon-loading">
              <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="38" cy="20" r="8" fill="#FDB813" opacity="0.9" />
                <path d="M18 32c-6 0-10 4-10 9s4 9 10 9h24c5.5 0 10-4.5 10-10 0-5-4-9-9-9-1 0-2 0-3 1-1-6-6-10-12-10-5 0-9 3-11 7-3 0-5 1-5 3z" fill="white" opacity="0.9" />
              </svg>
            </div>
            <div class="spinner-container">
              <div class="spinner"></div>
            </div>
            <div class="loading-text">
              <div class="main-text">Carregando previsão</div>
              <div class="sub-text">Buscando dados meteorológicos</div>
            </div>
          </div>
          <div id="map" ref="mapContainer"></div>
        </div>

        <div class="legend-bar" v-if="legendItems.length">
          <div class="legend-item" v-for="item in legendItems" :key="item.label">
            <span class="legend-color" :style="{ backgroundColor: item.color }"></span>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </section>

      <transition name="panel-fade">
        <aside
          v-if="selectedCity && isPanelOpen"
          class="info-panel is-open"
        >
          <div class="panel-header">
            <div class="header-top">
              <div
                class="city-name-clickable"
                role="heading"
                aria-level="2"
                @click="navigateToCityDetail"
                tabindex="0"
                @keydown.enter="navigateToCityDetail"
              >
                {{ selectedCity.cityName }}
              </div>
              <div class="header-right">
                <span
                  class="intensity-badge"
                  :style="{ backgroundColor: activeBadge.color }"
                >
                  {{ activeBadge.label }}
                </span>
                <button class="close-panel-btn" @click="togglePanel" aria-label="Fechar">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="time-navigation">
              <button
                class="nav-btn nav-btn-day prev"
                @click="navigatePrevDay"
                :disabled="!canNavigatePrev()"
                aria-label="Dia anterior"
                title="Dia anterior"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 5L4 12l7 7M4 12h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>

              <button
                class="datetime-display"
                @click="showDayCarousel = true"
                title="Clique para abrir o calendário"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
                <span class="datetime-text">{{ formatDateButton() }}</span>
              </button>

              <button
                class="nav-btn nav-btn-day next"
                @click="navigateNextDay"
                :disabled="!canNavigateNext()"
                aria-label="Próximo dia"
                title="Próximo dia"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 5l7 7-7 7M20 12H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          <div class="forecast-timeline">
            <div
              v-for="(forecast, index) in forecastTimeSlots"
              :key="index"
              class="forecast-card"
              :class="{ 'is-current': index === 0, 'is-loading': forecast.loading }"
              @click="jumpToTime(forecast.time, forecast.date)"
            >
              <div class="forecast-time">
                {{ forecast.time }}
                <span v-if="forecast.date !== forecastDate" class="forecast-date-label">
                  {{ formatDateShort(forecast.date) }}
                </span>
              </div>
              <div v-if="!forecast.loading && forecast.data" class="forecast-content">
                <div class="forecast-temp">{{ forecast.data.temperature.toFixed(1) }}°C</div>
                <div class="forecast-rain" v-if="forecast.data.rainfallProbability !== undefined">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="currentColor" opacity="0.6" />
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
            <div class="weather-item" v-if="metricsToggles.rain && selectedCity.rainfallProbability !== undefined">
              <span class="weather-label">Prob. Chuva</span>
              <span class="weather-value">{{ selectedCity.rainfallProbability.toFixed(0) }}%</span>
            </div>
            <div class="weather-item" v-if="metricsToggles.rain && selectedCity.dailyRainAccumulation !== undefined && selectedCity.rainfallIntensity > 0">
              <span class="weather-label">Acum. Dia</span>
              <span class="weather-value">{{ selectedCity.dailyRainAccumulation.toFixed(1) }} mm</span>
            </div>
            <div class="weather-item" v-if="metricsToggles.temperature">
              <span class="weather-label">Temp.</span>
              <span class="weather-value">{{ selectedCity.temperature.toFixed(1) }}°C</span>
            </div>
            <div class="weather-item" v-if="metricsToggles.temperature && selectedCity.tempMin !== undefined && selectedCity.tempMax !== undefined">
              <span class="weather-label">Mín/Máx</span>
              <span class="weather-value">{{ selectedCity.tempMin.toFixed(1) }}° / {{ selectedCity.tempMax.toFixed(1) }}°</span>
            </div>
            <div class="weather-item">
              <span class="weather-label">Umidade</span>
              <span class="weather-value">{{ selectedCity.humidity.toFixed(0) }}%</span>
            </div>
            <div class="weather-item" v-if="metricsToggles.wind">
              <span class="weather-label">Vento</span>
              <span class="weather-value">{{ selectedCity.windSpeed.toFixed(1) }} km/h</span>
            </div>
            <div class="weather-item" v-if="selectedCity.clouds !== undefined && metricsToggles.rain">
              <span class="weather-label">Tempo</span>
              <span class="weather-value">{{ getCloudsDescription(selectedCity.clouds) }}</span>
            </div>
          </div>

          <WeatherAlerts
            v-if="metricsToggles.alerts"
            :alerts="selectedCity.weatherAlert"
            @alert-clicked="handleAlertClick"
          />

          <div class="update-time">
            Previsão para: {{ formatTime(selectedCity.timestamp) }}
          </div>
        </aside>
      </transition>
    </div>

    <DayCarousel
      v-if="showDayCarousel"
      :initialDate="forecastDate"
      :initialTime="forecastTime"
      :maxDays="6"
      @close="showDayCarousel = false"
      @select="handleDateTimeSelect"
    />

    <AlertDetailPanel
      :alert="selectedAlert"
      :isOpen="isAlertPanelOpen"
      @close="closeAlertPanel"
      @jump-to-date="handleJumpToDate"
    />
  </div>
</template>

<script setup lang="ts">
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { APP_CONFIG } from '../config/app';
import { getNeighborCities, getRegionalWeather } from '../services/apiService';
import { getMultipleMunicipalityMeshes } from '../services/ibgeService';
import { getCloudsDescription, getRainfallColor, getRainfallDescription } from '../utils/weather';
import DayCarousel from './DayCarousel.vue';
import WeatherAlerts from './WeatherAlerts.vue';
import AlertDetailPanel from './AlertDetailPanel.vue';
import type { WeatherAlert, WeatherData } from '../types/weather';
import { componentLogger } from '../utils/logger';
import { useTheme } from '../composables/useTheme';

const logger = componentLogger('WeatherMap');

// Theme
const { toggleTheme, isDark } = useTheme();

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

type SidebarCity = {
  id: string;
  name: string;
  state?: string;
  latitude: number;
  longitude: number;
  distance?: number;
};

// Dados dos municípios
const municipalities = ref<Array<{ id: string; name: string; state: string; latitude: number; longitude: number }>>([]);
const searchQuery = ref<string>('');
const filteredCities = ref<Array<{ id: string; name: string; state: string; latitude: number; longitude: number }>>([]);
const sidebarCities = ref<SidebarCity[]>([]);
const mapCities = ref<SidebarCity[]>([]);

const activeLayer = ref<'rain' | 'alerts' | 'temperature' | 'wind'>('rain');
const metricsToggles = ref({
  rain: true,
  temperature: true,
  wind: true,
  alerts: true,
});

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

// Controle do painel de detalhes de alertas
const selectedAlert = ref<WeatherAlert | null>(null);
const isAlertPanelOpen = ref<boolean>(false);

// Controle de carregamento
const isLoading = ref<boolean>(false);

// Previsões de múltiplos horários
interface ForecastSlot {
  time: string;
  date: string; // YYYY-MM-DD
  data: WeatherData | null;
  loading: boolean;
}

const forecastTimeSlots = ref<ForecastSlot[]>([
  { time: '00:00', date: '', data: null, loading: false },
  { time: '03:00', date: '', data: null, loading: false },
  { time: '06:00', date: '', data: null, loading: false }
]);

const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value;
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

const jumpToTime = async (time: string, date?: string) => {
  forecastTime.value = time;
  if (date) {
    forecastDate.value = date;
  }
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
  
  // Calcular os 3 slots de tempo (atual, +3h, +6h) com transição de dia
  const slots: Array<{ time: string; date: string }> = [];
  let currentDate = forecastDate.value;
  
  for (let i = 0; i < 3; i++) {
    let hour = currentHours + (i * 3);
    let dateToUse = currentDate;
    
    // Se hora passa de 24, ajustar para próximo dia
    if (hour >= 24) {
      hour = hour - 24;
      // Incrementar data em 1 dia
      const date = new Date(currentDate + 'T00:00:00');
      date.setDate(date.getDate() + 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dateToUse = `${year}-${month}-${day}`;
    }
    
    slots.push({
      time: `${String(hour).padStart(2, '0')}:00`,
      date: dateToUse
    });
  }
  
  // Atualizar os slots
  forecastTimeSlots.value = slots.map(({ time, date }, index) => ({
    time,
    date,
    data: index === 0 ? selectedCity.value : null,
    loading: index > 0
  }));
  
  // Buscar dados para os próximos horários
  for (let i = 1; i < slots.length; i++) {
    const slotData = slots[i];
    if (!slotData) continue;
    
    const { time, date } = slotData;
    const slot = forecastTimeSlots.value[i];
    if (!slot) continue;
    
    try {
      const weatherData = await getRegionalWeather([selectedCity.value.cityId], date, time);
      if (weatherData.length > 0 && weatherData[0]) {
        slot.data = weatherData[0];
      }
    } catch (error) {
      logger.error(`Erro ao buscar previsão para ${date} ${time}:`, error);
    } finally {
      slot.loading = false;
    }
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

const selectCity = (city: SidebarCity) => {
  centerCityId.value = city.id;
  centerLat.value = city.latitude;
  centerLng.value = city.longitude;
  searchQuery.value = '';
  filteredCities.value = [];
  isPanelOpen.value = false;
  
  // Atualizar mapa e dados
  updateMapCenter();
  updateRadiusCircle();
  selectedLayer = null;
  loadRegionalData({ preferredCityId: centerCityId.value });
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

const headerDateLabel = computed(() => {
  if (!forecastDate.value) return '';
  const [yearStr, monthStr, dayStr] = forecastDate.value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) return forecastDate.value;

  const date = new Date(year, month - 1, day);
  const now = new Date();
  const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  brasilTime.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((date.getTime() - brasilTime.getTime()) / (1000 * 60 * 60 * 24));
  const dayLabel = diffDays === 0 ? 'Hoje' : diffDays === 1 ? 'Amanhã' : date.toLocaleDateString('pt-BR', { weekday: 'short' });
  const formattedDate = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
  const timeLabel = forecastTime.value || '';
  return `${dayLabel}, ${formattedDate}${timeLabel ? ` - ${timeLabel}` : ''}`;
});

const getTemperatureColor = (temperature: number) => {
  if (temperature < 18) return 'rgba(99, 179, 237, 0.85)';
  if (temperature < 24) return 'rgba(74, 222, 240, 0.9)';
  if (temperature < 32) return 'rgba(255, 200, 124, 0.9)';
  return 'rgba(248, 113, 113, 0.95)';
};

const getWindColor = (windSpeed: number) => {
  if (windSpeed < 10) return 'rgba(125, 211, 252, 0.85)';
  if (windSpeed < 20) return 'rgba(56, 189, 248, 0.9)';
  if (windSpeed < 35) return 'rgba(59, 130, 246, 0.95)';
  return 'rgba(239, 68, 68, 0.95)';
};

const getAlertColor = (alerts?: WeatherAlert[]) => {
  if (!alerts || alerts.length === 0) return 'rgba(148, 163, 184, 0.6)';
  const severities = alerts.map(a => a.severity);
  if (severities.includes('danger')) return 'rgba(239, 68, 68, 0.9)';
  if (severities.includes('alert')) return 'rgba(249, 115, 22, 0.9)';
  if (severities.includes('warning')) return 'rgba(234, 179, 8, 0.9)';
  if (severities.includes('info')) return 'rgba(59, 130, 246, 0.9)';
  return 'rgba(148, 163, 184, 0.6)';
};

const getLayerColor = (weather: WeatherData) => {
  switch (activeLayer.value) {
    case 'temperature':
      return getTemperatureColor(weather.temperature);
    case 'wind':
      return getWindColor(weather.windSpeed);
    case 'alerts':
      return getAlertColor(weather.weatherAlert);
    default:
      return getRainfallColor(weather.rainfallIntensity);
  }
};

const legendItems = computed(() => {
  if (activeLayer.value === 'temperature') {
    return [
      { color: getTemperatureColor(15), label: '< 18°C' },
      { color: getTemperatureColor(20), label: '18 - 24°C' },
      { color: getTemperatureColor(28), label: '24 - 32°C' },
      { color: getTemperatureColor(35), label: '> 32°C' },
    ];
  }

  if (activeLayer.value === 'wind') {
    return [
      { color: getWindColor(5), label: '< 10 km/h' },
      { color: getWindColor(15), label: '10 - 20 km/h' },
      { color: getWindColor(25), label: '20 - 35 km/h' },
      { color: getWindColor(40), label: '> 35 km/h' },
    ];
  }

  if (activeLayer.value === 'alerts') {
    return [
      { color: 'rgba(148, 163, 184, 0.6)', label: 'Sem alertas' },
      { color: 'rgba(59, 130, 246, 0.9)', label: 'Info' },
      { color: 'rgba(234, 179, 8, 0.9)', label: 'Atenção' },
      { color: 'rgba(249, 115, 22, 0.9)', label: 'Alerta' },
      { color: 'rgba(239, 68, 68, 0.9)', label: 'Perigo' },
    ];
  }

  return [
    { color: 'rgba(42, 65, 96, 0.75)', label: '0 - Sem chuva' },
    { color: 'rgba(76, 130, 196, 0.85)', label: '< 15 - Fraca' },
    { color: 'rgba(55, 117, 195, 0.9)', label: '15-35 - Moderada' },
    { color: 'rgba(37, 99, 235, 0.95)', label: '35-60 - Forte' },
    { color: 'rgba(30, 64, 175, 0.95)', label: '> 60 - Intensa' },
  ];
});

const activeBadge = computed(() => {
  const city = selectedCity.value;
  if (!city) return { label: '', color: 'transparent' };

  if (activeLayer.value === 'temperature') {
    return { label: `${city.temperature.toFixed(1)}°C`, color: getTemperatureColor(city.temperature) };
  }

  if (activeLayer.value === 'wind') {
    return { label: `${city.windSpeed.toFixed(1)} km/h`, color: getWindColor(city.windSpeed) };
  }

  if (activeLayer.value === 'alerts') {
    const hasAlerts = city.weatherAlert && city.weatherAlert.length > 0;
    const color = getAlertColor(city.weatherAlert);
    return { label: hasAlerts ? 'Alertas ativos' : 'Sem alertas', color };
  }

  return {
    label: getRainfallDescription(city.rainfallIntensity),
    color: getRainfallColor(city.rainfallIntensity),
  };
});

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo', // Garantir timezone do Brasil
  });
};

const formatDateShort = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `${day}/${month}`;
};

const getTooltipContent = (cityName: string, weather: WeatherData): string => {
  if (activeLayer.value === 'temperature') {
    return `<b>${cityName}</b><br>Temperatura: ${weather.temperature.toFixed(1)}°C`;
  }

  if (activeLayer.value === 'wind') {
    return `<b>${cityName}</b><br>Vento: ${weather.windSpeed.toFixed(1)} km/h`;
  }

  if (activeLayer.value === 'alerts') {
    const alertCount = weather.weatherAlert?.length ?? 0;
    return `<b>${cityName}</b><br>${alertCount > 0 ? `${alertCount} alerta(s)` : 'Sem alertas'}`;
  }

  return `<b>${cityName}</b><br>Intensidade: ${weather.rainfallIntensity.toFixed(0)} - ${getRainfallDescription(weather.rainfallIntensity)}`;
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
    color: '#58b1ff',
    fillColor: '#58b1ff',
    fillOpacity: 0.12,
    radius: searchRadius.value * 1000, // Converter km para metros
    weight: 2,
    dashArray: '6, 10',
  }).addTo(map);
};

const loadRegionalData = async (options: { preferredCityId?: string } = {}) => {
  // Ativar loading imediatamente (delay visual é feito via CSS)
  isLoading.value = true;
  const desiredCityId = options.preferredCityId ?? selectedCity.value?.cityId;
  
  try {
    // 1. Buscar cidades vizinhas do backend
    const response = await getNeighborCities(centerCityId.value, searchRadius.value);
    
    // Incluir a cidade centro na lista
    const normalizeCity = (city: SidebarCity): SidebarCity => {
      const municipality = municipalities.value.find(m => m.id === city.id);
      return {
        ...city,
        state: municipality?.state || city.state,
      };
    };
    const allCities = [response.centerCity, ...response.neighbors].map(normalizeCity);
    mapCities.value = allCities;
    sidebarCities.value = allCities.slice(0, 6);
    const cityIds = allCities.map(c => c.id);
    
    // 2. Buscar dados climáticos do backend com cache
    // SEMPRE passa data e hora (inicializadas com horário Brasil correto)
    const weatherData = await getRegionalWeather(cityIds, forecastDate.value, forecastTime.value);
    
    regionalData.value = weatherData;
    
    // 3. Renderizar malhas no mapa
    await renderCityMeshes(allCities, weatherData);
    
    // 4. Preservar cidade selecionada quando possível
    const preferredData = desiredCityId 
      ? weatherData.find((d: WeatherData) => d.cityId === desiredCityId) 
      : null;
    const centerData = weatherData.find((d: WeatherData) => d.cityId === centerCityId.value) || null;
    const fallbackData = weatherData[0] || null;

    selectedCity.value = preferredData || centerData || fallbackData || null;

    if (selectedCity.value) {
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
  cities: SidebarCity[] = mapCities.value,
  weatherData: WeatherData[] = regionalData.value
) => {
  if (!map || cities.length === 0 || weatherData.length === 0) return;

  const currentSelectedId = selectedCity.value?.cityId ?? null;

  geoJsonLayers.forEach(layer => map?.removeLayer(layer));
  geoJsonLayers.length = 0;
  layerColors.clear();
  selectedLayer = null;

  const cityIds = cities.map(c => c.id);
  const meshMap = await getMultipleMunicipalityMeshes(cityIds);

  for (const city of cities) {
    const geometry = meshMap.get(city.id);
    const weather = weatherData.find(w => w.cityId === city.id);
    
    if (geometry && weather) {
      const color = getLayerColor(weather);
      
      const geoJsonLayer = L.geoJSON(geometry, {
        style: {
          fillColor: color,
          fillOpacity: 0.65,
          color: '#1f2a44',
          weight: 1.5,
          dashArray: '',
        },
        onEachFeature: (_feature, layer) => {
          layerColors.set(layer, color);
          
          layer.on({
            click: () => {
              if (selectedLayer && selectedLayer !== layer) {
                const originalColor = layerColors.get(selectedLayer);
                if (originalColor) {
                  (selectedLayer as any).setStyle({
                    fillColor: originalColor,
                    fillOpacity: 0.65,
                    weight: 1.5,
                    color: '#1f2a44',
                    dashArray: '',
                  });
                }
              }
              
              (layer as any).setStyle({
                fillColor: '#58b1ff',
                fillOpacity: 0.55,
                weight: 2.2,
                color: '#8bd3ff',
                dashArray: '',
              });
              
              selectedLayer = layer;
              selectedCity.value = weather;
              isPanelOpen.value = true;
              updateForecastSlots();
            },
            mouseover: (e) => {
              const hoveredLayer = e.target;
              if (selectedLayer !== hoveredLayer) {
                hoveredLayer.setStyle({
                  weight: 2,
                  color: '#67b8ff',
                });
              }
            },
            mouseout: (e) => {
              const hoveredLayer = e.target;
              if (selectedLayer !== hoveredLayer) {
                hoveredLayer.setStyle({
                  weight: 1.5,
                  color: '#1f2a44',
                });
              }
            },
          });
          
          layer.bindTooltip(
            getTooltipContent(city.name, weather),
            { permanent: false, direction: 'top', opacity: 0.9 }
          );
        },
      });

      if (currentSelectedId && weather.cityId === currentSelectedId && isPanelOpen.value) {
        (geoJsonLayer as any).setStyle({
          fillColor: '#58b1ff',
          fillOpacity: 0.55,
          weight: 2.2,
          color: '#8bd3ff',
          dashArray: '',
        });
        selectedLayer = geoJsonLayer;
      }
      
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

watch(activeLayer, () => {
  selectedLayer = null;
  renderCityMeshes().catch(error => logger.error('Erro ao redesenhar malhas para camada ativa:', error));
});

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
