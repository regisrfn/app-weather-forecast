<template>
  <div class="hourly-chart">
    <h3 class="chart-title">Previsão Hora a Hora (Próximas 48h)</h3>
    <div class="chart-container">
      <canvas ref="chartCanvas" role="img" :aria-label="chartAriaLabel"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import {
  Chart,
  LineController,
  BarController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartConfiguration,
} from 'chart.js';
import type { HourlyForecast } from '../types/weather';

// Registrar componentes do Chart.js
Chart.register(
  LineController,
  BarController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  hourlyForecasts: HourlyForecast[];
  maxHours?: number;
}

const props = withDefaults(defineProps<Props>(), {
  maxHours: 48
});

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const chartAriaLabel = computed(() => 
  `Gráfico mostrando previsão horária de ${displayedForecasts.value.length} horas com temperatura e precipitação`
);

/**
 * Limitar dados para exibição (primeiras N horas)
 */
const displayedForecasts = computed(() => {
  return props.hourlyForecasts.slice(0, props.maxHours);
});

/**
 * Formata timestamp para exibição no eixo X
 * Mostra hora + dia apenas quando muda de dia
 */
const formatHourLabel = (timestamp: string, index: number): string => {
  const date = new Date(timestamp);
  const hour = date.getHours();
  const day = date.getDate();
  
  // Se é a primeira hora OU mudou de dia, mostrar dia também
  const previousForecast = displayedForecasts.value[index - 1];
  if (index === 0 || (index > 0 && previousForecast && new Date(previousForecast.timestamp).getDate() !== day)) {
    return `${hour}h\n${day}/${date.getMonth() + 1}`;
  }
  
  return `${hour}h`;
};

/**
 * Cria e configura o gráfico Chart.js
 */
const createChart = () => {
  if (!chartCanvas.value) {
    console.warn('[HourlyChart] Canvas ref not available');
    return;
  }
  
  if (!displayedForecasts.value?.length) {
    console.warn('[HourlyChart] No forecast data available');
    return;
  }

  console.log('[HourlyChart] Creating chart with', displayedForecasts.value.length, 'hours');

  const labels = displayedForecasts.value.map((f, i) => formatHourLabel(f.timestamp, i));
  const tempData = displayedForecasts.value.map(f => f.temperature);
  const precipData = displayedForecasts.value.map(f => f.precipitation);
  const precipProbData = displayedForecasts.value.map(f => f.precipitationProbability);

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        // Barras de precipitação
        {
          type: 'bar',
          label: 'Precipitação (mm)',
          data: precipData,
          backgroundColor: (context: any) => {
            const prob = precipProbData[context.dataIndex] ?? 0;
            
            // Cor baseada na probabilidade de chuva
            if (prob >= 70) {
              return 'rgba(59, 130, 246, 0.7)'; // Azul forte
            } else if (prob >= 40) {
              return 'rgba(59, 130, 246, 0.5)'; // Azul médio
            } else if (prob >= 20) {
              return 'rgba(59, 130, 246, 0.3)'; // Azul claro
            }
            return 'rgba(59, 130, 246, 0.15)'; // Azul muito claro
          },
          borderColor: 'rgba(59, 130, 246, 0.8)',
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y-precip',
          order: 2
        },
        // Linha de temperatura
        {
          type: 'line',
          label: 'Temperatura (°C)',
          data: tempData,
          borderColor: '#fb923c',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(251, 146, 60, 0.3)');
            gradient.addColorStop(1, 'rgba(251, 146, 60, 0.05)');
            return gradient;
          },
          borderWidth: 3,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#fb923c',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: true,
          tension: 0.4,
          yAxisID: 'y-temp',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#374151',
            font: {
              size: 12,
              weight: 600
            },
            padding: 15,
            usePointStyle: true,
            pointStyle: 'circle'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1f2937',
          bodyColor: '#374151',
          borderColor: 'rgba(139, 92, 246, 0.2)',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            title: (items: any) => {
              const index = items[0].dataIndex;
              const forecast = displayedForecasts.value[index];
              if (!forecast) return '';
              const date = new Date(forecast.timestamp);
              return `${date.toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}`;
            },
            label: (context: any) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              
              if (context.dataset.yAxisID === 'y-precip') {
                const prob = precipProbData[context.dataIndex];
                return `${label}: ${value.toFixed(1)}mm (${prob}%)`;
              }
              
              return `${label}: ${value.toFixed(1)}°`;
            },
            afterBody: (items: any) => {
              const index = items[0].dataIndex;
              const forecast = displayedForecasts.value[index];
              if (!forecast) return [];
              return [
                ``,
                `💨 Vento: ${forecast.windSpeed.toFixed(1)} km/h`,
                `💧 Umidade: ${forecast.humidity}%`,
                `☁️ Nuvens: ${forecast.cloudCover}%`,
                `📝 ${forecast.description}`
              ];
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 11
            },
            maxRotation: 0,
            autoSkip: true,
            autoSkipPadding: 10
          }
        },
        'y-temp': {
          type: 'linear',
          position: 'left',
          title: {
            display: true,
            text: 'Temperatura (°C)',
            color: '#fb923c',
            font: {
              size: 12,
              weight: 600
            }
          },
          grid: {
            color: 'rgba(251, 146, 60, 0.1)'
          },
          ticks: {
            color: '#fb923c',
            font: {
              size: 11,
              weight: 600
            },
            callback: function(value: any) {
              return value + '°';
            }
          }
        },
        'y-precip': {
          type: 'linear',
          position: 'right',
          title: {
            display: true,
            text: 'Precipitação (mm)',
            color: '#3b82f6',
            font: {
              size: 12,
              weight: 600
            }
          },
          grid: {
            display: false
          },
          ticks: {
            color: '#3b82f6',
            font: {
              size: 11,
              weight: 600
            },
            callback: function(value: any) {
              return value + 'mm';
            }
          },
          beginAtZero: true
        }
      }
    }
  };

  // Destruir gráfico anterior se existir
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Criar novo gráfico
  chartInstance = new Chart(chartCanvas.value, config);
};

/**
 * Lifecycle: montar gráfico
 */
onMounted(() => {
  createChart();
});

/**
 * Lifecycle: limpar gráfico
 */
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
});

/**
 * Watch: recriar gráfico quando dados mudarem
 */
watch(() => props.hourlyForecasts, () => {
  createChart();
}, { deep: true });
</script>

<style scoped lang="scss">
@use '../styles/abstracts/colors' as *;
@use '../styles/abstracts/variables' as *;
@use '../styles/abstracts/mixins' as *;
@use '../styles/abstracts/breakpoints' as *;

.hourly-chart {
  width: 100%;
  animation: fadeIn 0.6s ease-out 0.3s both;
}

.chart-title {
  font-size: $font-lg;
  font-weight: $font-bold;
  color: $weather-text-primary;
  margin-bottom: $spacing-lg;
  text-align: center;
  
  @include md {
    font-size: $font-base;
    margin-bottom: $spacing-md;
  }
}

.chart-container {
  position: relative;
  width: 100%;
  height: 350px;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.9) 0%,
    rgba(248, 250, 255, 0.92) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: $spacing-xl;
  border-radius: $radius-xl;
  box-shadow: 0 4px 16px rgba(139, 157, 225, 0.12);
  border: 2px solid rgba(139, 157, 225, 0.15);
  
  @include md {
    height: 300px;
    padding: $spacing-lg;
  }
  
  @include sm {
    height: 280px;
    padding: $spacing-md;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
