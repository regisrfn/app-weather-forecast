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
            <label class="datetime-toggle">
              <input 
                type="checkbox" 
                v-model="useForecastDateTime"
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span>Data/Hora</span>
            </label>
            
            <div v-if="useForecastDateTime" class="datetime-inputs">
              <div class="input-wrapper">
                <input
                  id="forecast-date"
                  type="date"
                  v-model="forecastDate"
                  :min="getTodayBrasil()"
                  :max="getMaxDate()"
                  @change="updateRegionalData"
                />
              </div>
              <div class="input-wrapper">
                <input
                  id="forecast-time"
                  type="time"
                  v-model="forecastTime"
                  @change="updateRegionalData"
                />
              </div>
            </div>
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
    
    <!-- Painel de Informações (Expansível) -->
    <div 
      v-if="selectedCity" 
      class="info-panel"
      :class="{ 'is-open': isPanelOpen }"
    >
      <div class="panel-header">
        <h2>{{ selectedCity.cityName }}</h2>
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
      
      <div class="weather-grid">
        <div class="weather-item">
          <span class="weather-label">Chuva</span>
          <span class="weather-value">{{ selectedCity.rainfallIntensity.toFixed(0) }}%</span>
        </div>
        <div class="weather-item">
          <span class="weather-label">Temp.</span>
          <span class="weather-value">{{ selectedCity.temperature.toFixed(1) }}°C</span>
        </div>
        <div class="weather-item">
          <span class="weather-label">Umidade</span>
          <span class="weather-value">{{ selectedCity.humidity.toFixed(0) }}%</span>
        </div>
        <div class="weather-item">
          <span class="weather-label">Vento</span>
          <span class="weather-value">{{ selectedCity.windSpeed.toFixed(1) }} km/h</span>
        </div>
      </div>
      
      <div class="update-time">
        Previsão para: {{ formatTime(selectedCity.timestamp) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { APP_CONFIG } from '../config/app';
import { getNeighborCities, getRegionalWeather } from '../services/apiService';
import { getMunicipalityMesh } from '../services/ibgeService';
import { getRainfallColor, getRainfallDescription, type WeatherData } from '../services/mockService';

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
const useForecastDateTime = ref<boolean>(false); // Se deve usar data/hora específica

// Controle de abertura do painel
const isPanelOpen = ref<boolean>(false);

// Controle do menu hamburger (mobile)
const isMenuOpen = ref<boolean>(false);

// Controle de carregamento
const isLoading = ref<boolean>(false);

const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value;
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
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
    console.error('Erro ao carregar municípios:', error);
  }
};

const filterCities = () => {
  if (searchQuery.value.length < 2) {
    filteredCities.value = [];
    return;
  }
  const query = searchQuery.value.toLowerCase();
  filteredCities.value = municipalities.value.filter(city =>
    city.name.toLowerCase().includes(query) ||
    city.state.toLowerCase().includes(query)
  );
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
    
    // Atualizar marcador
    L.marker([centerLat.value, centerLng.value])
      .addTo(map)
      .bindPopup(`<b>${getCurrentCenterCityName()}</b><br>Cidade focal`)
      .openPopup();
  }
};

const getCurrentCenterCityName = (): string => {
  const city = municipalities.value.find(c => c.id === centerCityId.value);
  return city ? `${city.name}, ${city.state}` : 'Carregando...';
};

const legendItems = [
  { color: 'rgba(200, 200, 200, 0.3)', label: '0% - Sem chuva' },
  { color: 'rgba(173, 216, 230, 0.6)', label: '< 25% - Baixa' },
  { color: 'rgba(100, 149, 237, 0.7)', label: '25-50% - Média' },
  { color: 'rgba(30, 144, 255, 0.8)', label: '50-75% - Alta' },
  { color: 'rgba(0, 0, 139, 0.9)', label: '> 75% - Muito alta' },
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

/**
 * Retorna a data atual no timezone do Brasil (America/Sao_Paulo)
 * Formato: YYYY-MM-DD
 */
const getTodayBrasil = (): string => {
  const now = new Date();
  const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  
  const year = brasilTime.getFullYear();
  const month = String(brasilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brasilTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

const getMaxDate = (): string => {
  // OpenWeather retorna previsões até 5 dias (usar timezone do Brasil)
  const now = new Date();
  const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  brasilTime.setDate(brasilTime.getDate() + 5);
  
  const year = brasilTime.getFullYear();
  const month = String(brasilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brasilTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
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
  L.marker([centerLat.value, centerLng.value])
    .addTo(map)
    .bindPopup(`<b>${getCurrentCenterCityName()}</b><br>Cidade focal`)
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
  isLoading.value = true;
  try {
    // 1. Buscar cidades vizinhas do backend (ou mock)
    const response = await getNeighborCities(centerCityId.value, searchRadius.value);
    
    // Incluir a cidade centro na lista
    const allCities = [response.centerCity, ...response.neighbors];
    const cityIds = allCities.map(c => c.id);
    
    // 2. Buscar dados climáticos do backend (ou mock)
    // SEMPRE passa data e hora (inicializadas com horário Brasil correto)
    // Isso garante que a busca inicial use o horário correto
    let weatherData;
    if (useForecastDateTime.value && forecastDate.value && forecastTime.value) {
      // Usuário ativou controle de data/hora manualmente
      weatherData = await getRegionalWeather(cityIds, forecastDate.value, forecastTime.value);
    } else {
      // Busca automática: usa data/hora atuais do Brasil (já inicializadas no onMounted)
      weatherData = await getRegionalWeather(cityIds, forecastDate.value, forecastTime.value);
    }
    
    regionalData.value = weatherData;
    
    // 3. Renderizar malhas no mapa
    await renderCityMeshes(allCities, weatherData);
    
    // 4. Selecionar cidade central por padrão
    const centerData = weatherData.find(d => d.cityId === centerCityId.value);
    if (centerData) {
      selectedCity.value = centerData;
    }
  } catch (error) {
    console.error('Erro ao carregar dados regionais:', error);
  } finally {
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
                  });
                }
              }
              
              // Destacar camada selecionada com verde suave
              (layer as any).setStyle({
                fillColor: '#52c41a', // Verde suave no preenchimento
                fillOpacity: 0.6,
                weight: 3,
                color: '#27ae60', // Verde mais escuro na borda
              });
              
              selectedLayer = layer;
              selectedCity.value = weather;
              isPanelOpen.value = true; // Abrir painel ao clicar
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
            `<b>${city.name}</b><br>Chuva: ${weather.rainfallIntensity.toFixed(1)}% - ${getRainfallDescription(weather.rainfallIntensity)}`,
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
  forecastDate.value = `${year}-${month}-${day}`;
  
  // Formatar hora HH:MM
  const hours = String(brasilTime.getHours()).padStart(2, '0');
  const minutes = String(brasilTime.getMinutes()).padStart(2, '0');
  forecastTime.value = `${hours}:${minutes}`;
  
  initMap();
  await loadRegionalData();
  
  // Atualizar dados automaticamente
  updateInterval = window.setInterval(() => loadRegionalData(), APP_CONFIG.UPDATE_INTERVAL);
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
