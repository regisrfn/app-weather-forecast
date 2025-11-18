<template>
  <div class="weather-map-container">
    <!-- Header com Menu Hamburger -->
    <div class="map-header" :class="{ 'menu-open': isMenuOpen }">
      <div class="header-top">
        <h1>Previsão do Tempo - Ribeirão do Sul</h1>
        <button class="hamburger-btn" @click="toggleMenu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div class="header-content">
        <div class="controls">
          <div class="radius-control">
            <label for="radius-slider">
              Raio: <strong>{{ searchRadius }} km</strong>
            </label>
            <input
              id="radius-slider"
              type="range"
              v-model.number="searchRadius"
              :min="APP_CONFIG.RADIUS.MIN"
              :max="APP_CONFIG.RADIUS.MAX"
              step="10"
              @input="updateRegionalData"
            />
          </div>
        </div>
        
        <div class="legend">
          <span class="legend-title">Intensidade:</span>
          <div class="legend-scale">
            <div class="legend-item" v-for="item in legendItems" :key="item.label">
              <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div id="map" ref="mapContainer"></div>
    
    <!-- Stats Panel (canto inferior esquerdo) -->
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
    
    <!-- Botão Flutuante (canto inferior direito) -->
    <button 
      v-if="selectedCity" 
      class="info-toggle-btn"
      @click="togglePanel"
      :class="{ 'is-open': isPanelOpen }"
    >
      <span class="toggle-icon">{{ isPanelOpen ? '✕' : 'ℹ️' }}</span>
      <span class="toggle-text">{{ selectedCity.cityName }}</span>
    </button>
    
    <!-- Painel de Informações (Expansível) -->
    <div 
      v-if="selectedCity" 
      class="info-panel"
      :class="{ 'is-open': isPanelOpen }"
    >
      <div class="panel-header">
        <h2>{{ selectedCity.cityName }}</h2>
        <span class="intensity-badge" :style="{ backgroundColor: getRainfallColor(selectedCity.rainfallIntensity) }">
          {{ getRainfallDescription(selectedCity.rainfallIntensity) }}
        </span>
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
        Atualizado: {{ formatTime(selectedCity.timestamp) }}
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

// Controle de raio de busca (em km)
const searchRadius = ref<number>(APP_CONFIG.RADIUS.DEFAULT);

// Controle de abertura do painel
const isPanelOpen = ref<boolean>(false);

// Controle do menu hamburger (mobile)
const isMenuOpen = ref<boolean>(false);

const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value;
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const legendItems = [
  { color: 'rgba(200, 200, 200, 0.3)', label: 'Sem chuva' },
  { color: 'rgba(173, 216, 230, 0.6)', label: 'Fraca' },
  { color: 'rgba(100, 149, 237, 0.7)', label: 'Moderada' },
  { color: 'rgba(30, 144, 255, 0.8)', label: 'Forte' },
  { color: 'rgba(0, 0, 139, 0.9)', label: 'Intensa' },
];

const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const initMap = () => {
  if (!mapContainer.value) return;

  // Inicializar mapa centrado em Ribeirão do Sul
  map = L.map(mapContainer.value).setView(
    [APP_CONFIG.MAP.CENTER.lat, APP_CONFIG.MAP.CENTER.lng],
    APP_CONFIG.MAP.DEFAULT_ZOOM
  );

  // Adicionar camada base do OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: APP_CONFIG.MAP.MAX_ZOOM,
    minZoom: APP_CONFIG.MAP.MIN_ZOOM,
  }).addTo(map);

  // Marcar Ribeirão do Sul como centro
  L.marker([APP_CONFIG.MAP.CENTER.lat, APP_CONFIG.MAP.CENTER.lng])
    .addTo(map)
    .bindPopup('<b>Ribeirão do Sul</b><br>Cidade focal')
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
  radiusCircle = L.circle([APP_CONFIG.MAP.CENTER.lat, APP_CONFIG.MAP.CENTER.lng], {
    color: '#667eea',
    fillColor: '#667eea',
    fillOpacity: 0.1,
    radius: searchRadius.value * 1000, // Converter km para metros
    weight: 2,
    dashArray: '5, 10',
  }).addTo(map);
};

const loadRegionalData = async () => {
  try {
    // 1. Buscar cidades vizinhas do backend (ou mock)
    const response = await getNeighborCities(APP_CONFIG.CENTER_CITY_ID, searchRadius.value);
    
    // Incluir a cidade centro na lista
    const allCities = [response.centerCity, ...response.neighbors];
    const cityIds = allCities.map(c => c.id);
    
    // 2. Buscar dados climáticos do backend (ou mock)
    const weatherData = await getRegionalWeather(cityIds);
    regionalData.value = weatherData;
    
    // 3. Renderizar malhas no mapa
    await renderCityMeshes(allCities, weatherData);
    
    // 4. Selecionar Ribeirão do Sul por padrão
    const ribeiraoData = weatherData.find(d => d.cityId === APP_CONFIG.CENTER_CITY_ID);
    if (ribeiraoData) {
      selectedCity.value = ribeiraoData;
    }
  } catch (error) {
    console.error('Erro ao carregar dados regionais:', error);
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
          layer.on({
            click: () => {
              selectedCity.value = weather;
              isPanelOpen.value = true; // Abrir painel ao clicar
            },
            mouseover: (e) => {
              const layer = e.target;
              layer.setStyle({
                weight: 3,
                color: '#34495e',
              });
            },
            mouseout: (e) => {
              const layer = e.target;
              layer.setStyle({
                weight: 2,
                color: '#2c3e50',
              });
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

const updateRegionalData = async () => {
  updateRadiusCircle();
  await loadRegionalData();
};

onMounted(async () => {
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

<style scoped>
.weather-map-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.map-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: all 0.3s ease;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.map-header h1 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: 0.3px;
}

/* Menu Hamburger */
.hamburger-btn {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  width: 40px;
  height: 40px;
  position: relative;
  z-index: 1001;
}

.hamburger-btn span {
  display: block;
  width: 24px;
  height: 2.5px;
  background: white;
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
}

.hamburger-btn span:nth-child(1) {
  top: 12px;
}

.hamburger-btn span:nth-child(2) {
  top: 18.75px;
}

.hamburger-btn span:nth-child(3) {
  top: 25.5px;
}

.menu-open .hamburger-btn span:nth-child(1) {
  top: 18.75px;
  transform: rotate(45deg);
}

.menu-open .hamburger-btn span:nth-child(2) {
  opacity: 0;
}

.menu-open .hamburger-btn span:nth-child(3) {
  top: 18.75px;
  transform: rotate(-45deg);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.controls {
  flex: 1;
  max-width: 320px;
}

.radius-control {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 0.75rem 1rem;
  border-radius: 8px;
}

.radius-control label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.radius-control input[type="range"] {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.3);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.radius-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease;
}

.radius-control input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.radius-control input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s ease;
}

.radius-control input[type="range"]::-moz-range-thumb:hover {
  transform: scale(1.1);
}

.legend {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-shrink: 0;
}

.legend-title {
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.3px;
}

.legend-scale {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 22px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.legend-item span {
  font-size: 0.813rem;
  font-weight: 500;
}

#map {
  flex: 1;
  z-index: 1;
}

.info-toggle-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  z-index: 1001;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.info-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.info-toggle-btn.is-open {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}

.toggle-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.toggle-text {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 280px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
  transform: translateY(calc(100% + 20px));
  opacity: 0;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.info-panel.is-open {
  transform: translateY(-60px);
  opacity: 1;
  pointer-events: auto;
}

.panel-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  flex: 1;
}

.intensity-badge {
  display: inline-block;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.2) !important;
  backdrop-filter: brightness(0.8);
}

.weather-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  padding: 1rem;
  background: #f8f9fa;
}

.weather-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.weather-label {
  font-size: 0.75rem;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.weather-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2c3e50;
}

.update-time {
  padding: 0.6rem 1rem;
  font-size: 0.75rem;
  color: #6c757d;
  text-align: center;
  background: #ffffff;
  border-top: 1px solid #e9ecef;
}

.stats-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 0.75rem 1.25rem;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.stat-label {
  font-size: 0.7rem;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #667eea;
}

.stat-divider {
  width: 1px;
  height: 35px;
  background: #dee2e6;
}

@media (max-width: 768px) {
  /* Menu Hamburger visível em mobile */
  .hamburger-btn {
    display: flex;
  }

  .header-content {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    transition: all 0.3s ease;
  }

  .menu-open .header-content {
    max-height: 500px;
    opacity: 1;
    margin-top: 1rem;
  }
  
  .map-header h1 {
    font-size: 1.15rem;
  }
  
  .controls {
    max-width: 100%;
  }
  
  .legend {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .legend-title {
    margin-bottom: 0.25rem;
  }
  
  .legend-scale {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: flex-start;
  }
  
  /* Stats panel - canto inferior esquerdo */
  .stats-panel {
    left: 20px;
    bottom: 20px;
  }
  
  /* Botão info - canto inferior direito */
  .info-toggle-btn {
    right: 20px;
    bottom: 20px;
  }
  
  .info-panel {
    width: calc(100% - 40px);
    left: 20px;
    right: 20px;
    bottom: 20px;
  }
  
  .info-panel.is-open {
    transform: translateY(-80px);
  }
}
</style>
