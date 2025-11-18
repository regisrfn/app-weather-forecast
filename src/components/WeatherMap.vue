<template>
  <div class="weather-map-container">
    <div class="map-header">
      <h1>Previsão do Tempo - Ribeirão do Sul e Região</h1>
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
        <p><strong>Intensidade de Chuva:</strong> {{ selectedCity.rainfallIntensity.toFixed(1) }}%</p>
        <p><strong>Temperatura:</strong> {{ selectedCity.temperature.toFixed(1) }}°C</p>
        <p><strong>Umidade:</strong> {{ selectedCity.humidity.toFixed(1) }}%</p>
        <p><strong>Vento:</strong> {{ selectedCity.windSpeed.toFixed(1) }} km/h</p>
        <p class="timestamp"><strong>Atualizado:</strong> {{ formatTime(selectedCity.timestamp) }}</p>
      </div>
      
      <div class="subdivisions" v-if="selectedCity.subdivisions && selectedCity.subdivisions.length > 0">
        <h3>Subdivisões da Cidade</h3>
        <div class="subdivision-list">
          <div 
            v-for="sub in sortedSubdivisions" 
            :key="sub.id"
            class="subdivision-item"
            :style="{ borderLeft: `4px solid ${getRainfallColor(sub.rainfallIntensity)}` }"
          >
            <span class="subdivision-name">{{ sub.name }}</span>
            <span class="subdivision-intensity">{{ sub.rainfallIntensity.toFixed(1) }}%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { IBGEService, type IBGEMunicipality } from '../services/ibgeService';
import { WeatherService } from '../services/weatherService';
import type { RainfallData } from '../types/weather';

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
const selectedCity = ref<RainfallData | null>(null);
const regionalData = ref<RainfallData[]>([]);
const geoJsonLayers: L.GeoJSON[] = [];
let updateInterval: number | null = null;

// Coordenadas de Ribeirão do Sul
const RIBEIRAO_DO_SUL_COORDS: [number, number] = [-22.7572, -49.9439];

const legendItems = [
  { color: 'rgba(200, 200, 200, 0.3)', label: 'Sem chuva' },
  { color: 'rgba(150, 150, 255, 0.4)', label: 'Chuva fraca (0-25%)' },
  { color: 'rgba(100, 100, 255, 0.5)', label: 'Chuva moderada (25-50%)' },
  { color: 'rgba(50, 50, 255, 0.6)', label: 'Chuva forte (50-75%)' },
  { color: 'rgba(0, 0, 255, 0.8)', label: 'Chuva intensa (75-100%)' },
];

const sortedSubdivisions = computed(() => {
  if (!selectedCity.value?.subdivisions) return [];
  return [...selectedCity.value.subdivisions].sort((a, b) => b.rainfallIntensity - a.rainfallIntensity);
});

const getRainfallColor = (intensity: number): string => {
  return WeatherService.getRainfallColor(intensity);
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
};

const loadRegionalData = async () => {
  try {
    // Buscar informações do IBGE
    const ribeiraoInfo = await IBGEService.getRibeiraoDoSulInfo();
    
    if (ribeiraoInfo) {
      // Buscar cidades da região
      const cities = await IBGEService.getRegionalCities();
      
      // Buscar dados de chuva para as cidades
      const cityIds = cities.map(c => c.id.toString());
      const rainfallData = await WeatherService.getRegionalRainfall(cityIds);
      regionalData.value = rainfallData;
      
      // Renderizar malhas no mapa
      await renderCityMeshes(cities, rainfallData);
      
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

const renderCityMeshes = async (cities: IBGEMunicipality[], rainfallData: RainfallData[]) => {
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
          fillOpacity: 0.6,
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
            `<b>${city.nome}</b><br>Chuva: ${rainfall.rainfallIntensity.toFixed(1)}%`,
            { permanent: false, direction: 'top' }
          );
        },
      });
      
      geoJsonLayer.addTo(map);
      geoJsonLayers.push(geoJsonLayer);
    }
  }
};

const updateData = async () => {
  await loadRegionalData();
};

onMounted(async () => {
  initMap();
  await loadRegionalData();
  
  // Atualizar dados a cada 5 minutos
  updateInterval = window.setInterval(updateData, 5 * 60 * 1000);
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

.timestamp {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-top: 1rem !important;
  padding-top: 1rem;
  border-top: 1px solid #ecf0f1;
}

.subdivisions h3 {
  margin: 0 0 1rem 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.subdivision-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.subdivision-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 6px;
  transition: all 0.2s;
}

.subdivision-item:hover {
  background: #e9ecef;
  transform: translateX(4px);
}

.subdivision-name {
  font-weight: 500;
  color: #2c3e50;
}

.subdivision-intensity {
  font-weight: 600;
  color: #667eea;
  font-size: 1.1rem;
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
    max-height: 40vh;
  }
}
</style>
