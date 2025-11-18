<template>
  <div class="weather-map-container">
    <div class="map-header">
      <h1>Previsão do Tempo - Ribeirão do Sul e Região</h1>
      
      <div class="controls">
        <div class="radius-control">
          <label for="radius-slider">
            Raio de Busca: <strong>{{ searchRadius }} km</strong>
          </label>
          <input
            id="radius-slider"
            type="range"
            v-model.number="searchRadius"
            min="10"
            max="150"
            step="10"
            @input="updateRegionalData"
          />
          <div class="radius-info">
            <span>10 km</span>
            <span>150 km</span>
          </div>
        </div>
      </div>
      
      <div class="legend">
        <h3>Intensidade de Chuva</h3>
        <div class="legend-scale">
          <div class="legend-item" v-for="item in legendItems" :key="item.label">
            <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
            <span>{{ item.label }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <div id="map" ref="mapContainer"></div>
    
    <div class="info-panel" v-if="selectedCity">
      <h2>{{ selectedCity.cityName }}</h2>
      <div class="weather-info">
        <p><strong>Intensidade de Chuva:</strong> {{ selectedCity.rainfallIntensity.toFixed(1) }}% 
          <span class="intensity-badge" :style="{ backgroundColor: getRainfallColor(selectedCity.rainfallIntensity) }">
            {{ getRainfallDescription(selectedCity.rainfallIntensity) }}
          </span>
        </p>
        <p><strong>Temperatura:</strong> {{ selectedCity.temperature.toFixed(1) }}°C</p>
        <p><strong>Umidade:</strong> {{ selectedCity.humidity.toFixed(1) }}%</p>
        <p><strong>Vento:</strong> {{ selectedCity.windSpeed.toFixed(1) }} km/h</p>
        <p class="timestamp"><strong>Atualizado:</strong> {{ formatTime(selectedCity.timestamp) }}</p>
      </div>
    </div>
    
    <div class="stats-panel">
      <div class="stat-item">
        <span class="stat-label">Cidades Monitoradas</span>
        <span class="stat-value">{{ regionalData.length }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Raio de Busca</span>
        <span class="stat-value">{{ searchRadius }} km</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IBGEService, type MunicipalityWithCoords } from '../services/ibgeService';
import { WeatherService } from '../services/weatherService';
import type { RainfallData } from '../types/weather';

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
const selectedCity = ref<RainfallData | null>(null);
const regionalData = ref<RainfallData[]>([]);
const geoJsonLayers: L.GeoJSON[] = [];
let updateInterval: number | null = null;
let radiusCircle: L.Circle | null = null;

// Coordenadas de Ribeirão do Sul
const RIBEIRAO_DO_SUL_COORDS: [number, number] = [-22.7572, -49.9439];

// Controle de raio de busca (em km)
const searchRadius = ref<number>(50);

const legendItems = [
  { color: 'rgba(220, 220, 220, 0.2)', label: 'Sem chuva' },
  { color: 'rgba(180, 200, 255, 0.4)', label: 'Nublado (0-20%)' },
  { color: 'rgba(120, 140, 255, 0.5)', label: 'Chuva fraca (20-40%)' },
  { color: 'rgba(70, 80, 255, 0.6)', label: 'Chuva moderada (40-60%)' },
  { color: 'rgba(30, 40, 220, 0.75)', label: 'Chuva forte (60-80%)' },
  { color: 'rgba(10, 10, 200, 0.9)', label: 'Chuva intensa (80-100%)' },
];

const getRainfallColor = (intensity: number): string => {
  return WeatherService.getRainfallColor(intensity);
};

const getRainfallDescription = (intensity: number): string => {
  return WeatherService.getRainfallDescription(intensity);
};

const formatTime = (date: Date): string => {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const initMap = () => {
  if (!mapContainer.value) return;

  // Inicializar mapa centrado em Ribeirão do Sul
  map = L.map(mapContainer.value).setView(RIBEIRAO_DO_SUL_COORDS, 10);

  // Adicionar camada base do OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map);

  // Marcar Ribeirão do Sul como centro
  L.marker(RIBEIRAO_DO_SUL_COORDS)
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
  radiusCircle = L.circle(RIBEIRAO_DO_SUL_COORDS, {
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
    // Buscar cidades dentro do raio especificado
    const citiesInRadius = await IBGEService.getCitiesByRadius(
      RIBEIRAO_DO_SUL_COORDS[0],
      RIBEIRAO_DO_SUL_COORDS[1],
      searchRadius.value
    );
    
    if (citiesInRadius.length > 0) {
      // Buscar dados de chuva para as cidades
      const cityIds = citiesInRadius.map(c => c.id.toString());
      const rainfallData = await WeatherService.getRegionalRainfall(cityIds);
      regionalData.value = rainfallData;
      
      // Renderizar malhas no mapa
      await renderCityMeshes(citiesInRadius, rainfallData);
      
      // Selecionar Ribeirão do Sul por padrão
      const ribeiraoData = rainfallData.find(d => d.cityId === '3543204');
      if (ribeiraoData) {
        selectedCity.value = ribeiraoData;
      }
    }
  } catch (error) {
    console.error('Erro ao carregar dados regionais:', error);
  }
};

const renderCityMeshes = async (cities: MunicipalityWithCoords[], rainfallData: RainfallData[]) => {
  if (!map) return;

  // Limpar camadas anteriores
  geoJsonLayers.forEach(layer => map?.removeLayer(layer));
  geoJsonLayers.length = 0;

  for (const city of cities) {
    const geometry = await IBGEService.getMunicipalityGeometry(city.id);
    const rainfall = rainfallData.find(r => r.cityId === city.id.toString());
    
    if (geometry && rainfall) {
      const color = getRainfallColor(rainfall.rainfallIntensity);
      
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
              selectedCity.value = rainfall;
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
            `<b>${city.nome}</b><br>Chuva: ${rainfall.rainfallIntensity.toFixed(1)}% - ${getRainfallDescription(rainfall.rainfallIntensity)}`,
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
  
  // Atualizar dados a cada 5 minutos
  updateInterval = window.setInterval(() => loadRegionalData(), 5 * 60 * 1000);
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
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.map-header h1 {
  margin: 0 0 1rem 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.controls {
  margin-bottom: 1rem;
}

.radius-control {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.radius-control label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}

.radius-control input[type="range"] {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.radius-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.radius-control input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.radius-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  margin-top: 0.25rem;
  opacity: 0.8;
}

.legend {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem;
  border-radius: 8px;
}

.legend h3 {
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 500;
}

.legend-scale {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 30px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

#map {
  flex: 1;
  z-index: 1;
}

.info-panel {
  position: absolute;
  top: 180px;
  right: 20px;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 1.5rem;
  z-index: 1000;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}

.info-panel h2 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.5rem;
  border-bottom: 2px solid #667eea;
  padding-bottom: 0.5rem;
}

.weather-info {
  margin-bottom: 1.5rem;
}

.weather-info p {
  margin: 0.5rem 0;
  color: #34495e;
  font-size: 0.95rem;
}

.intensity-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  margin-left: 0.5rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.timestamp {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-top: 1rem !important;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
}

.stats-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 1rem 1.5rem;
  z-index: 1000;
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
}

@media (max-width: 768px) {
  .map-header h1 {
    font-size: 1.3rem;
  }
  
  .legend-scale {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .info-panel {
    width: calc(100% - 40px);
    top: auto;
    bottom: 20px;
    right: 20px;
    left: 20px;
    max-height: 40vh;
  }
  
  .stats-panel {
    position: static;
    margin: 1rem;
    width: calc(100% - 2rem);
  }
  
  .controls {
    font-size: 0.9rem;
  }
}
</style>
