<template>
  <div class="hourly-chart">
    <h3 class="hourly-chart__title">Previsão Hora a Hora (Próximas {{ adjustedMaxHours }}h)</h3>
    <div class="hourly-chart__container">
      <canvas ref="chartCanvas" role="img" :aria-label="chartAriaLabel"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useTheme } from '../composables/useTheme';
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
import {
  formatHourLabel,
  getPrecipitationColorByProbability,
  getPrecipitationBorderColor,
  getProbabilityDescription,
  createTemperatureGradient,
  chartColors,
  getResponsiveConfig,
} from '../utils/chartHelpers';

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

const { theme } = useTheme();
const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const isDark = computed(() => theme.value === 'dark');

/**
 * Ajusta quantidade de horas baseado no tamanho da tela
 */
const adjustedMaxHours = computed(() => {
  if (typeof window === 'undefined') return props.maxHours;
  
  const width = window.innerWidth;
  if (width < 640) return 24; // Mobile: 24 horas
  if (width < 768) return 36; // Tablet: 36 horas
  return props.maxHours; // Desktop: 48 horas
});

const chartAriaLabel = computed(() => 
  `Gráfico mostrando previsão horária de ${displayedForecasts.value.length} horas com temperatura e precipitação`
);

/**
 * Limitar dados para exibição (primeiras N horas)
 */
const displayedForecasts = computed(() => {
  return props.hourlyForecasts.slice(0, adjustedMaxHours.value);
});

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

  const labels = displayedForecasts.value.map((f, i) => 
    formatHourLabel(f.timestamp, i, displayedForecasts.value[i - 1]?.timestamp)
  );
  const tempData = displayedForecasts.value.map(f => f.temperature);
  const precipData = displayedForecasts.value.map(f => f.precipitation);
  const precipProbData = displayedForecasts.value.map(f => f.precipitationProbability);
  const rainfallIntensityData = displayedForecasts.value.map(f => f.rainfallIntensity || 0);
  const responsiveConfig = getResponsiveConfig();

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        // Barras de precipitação (baseadas em probabilidade)
        {
          type: 'bar',
          label: 'Precipitação (mm)',
          data: precipData,
          backgroundColor: (context: any) => {
            const probability = precipProbData[context.dataIndex] ?? 0;
            const intensity = rainfallIntensityData[context.dataIndex];
            return getPrecipitationColorByProbability(probability, intensity);
          },
          borderColor: (context: any) => {
            const probability = precipProbData[context.dataIndex] ?? 0;
            const intensity = rainfallIntensityData[context.dataIndex];
            return getPrecipitationBorderColor(probability, intensity);
          },
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y-precip',
          order: 1 // In front of temperature line
        },
        // Linha de temperatura
        {
          type: 'line',
          label: 'Temperatura (°C)',
          data: tempData,
          borderColor: chartColors.temp,
          backgroundColor: (context: any) => {
            return createTemperatureGradient(context.chart.ctx, chartColors.tempRGB, 300);
          },
          borderWidth: 3,
          pointRadius: responsiveConfig.pointRadius,
          pointHoverRadius: responsiveConfig.pointHoverRadius,
          pointBackgroundColor: chartColors.temp,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: true,
          tension: 0.4,
          yAxisID: 'y-temp',
          order: 2 // Behind rain bars
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
            color: isDark.value ? '#e2e8f0' : '#374151',
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
          backgroundColor: isDark.value ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: isDark.value ? '#e2e8f0' : '#1f2937',
          bodyColor: isDark.value ? '#cbd5e1' : '#374151',
          borderColor: isDark.value ? 'rgba(71, 85, 105, 0.5)' : 'rgba(139, 92, 246, 0.2)',
          borderWidth: 1,
          padding: responsiveConfig.tooltipPadding,
          displayColors: true,
          titleFont: {
            size: responsiveConfig.tooltipTitleSize,
            weight: 'bold'
          },
          bodyFont: {
            size: responsiveConfig.tooltipBodySize
          },
          boxWidth: 8,
          boxHeight: 8,
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
                const prob = precipProbData[context.dataIndex] ?? 0;
                const probDesc = getProbabilityDescription(prob);
                return `${label}: ${value.toFixed(1)}mm (${prob}% - ${probDesc})`;
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
            color: isDark.value ? '#94a3b8' : '#6b7280',
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
            color: isDark.value ? 'rgba(251, 146, 60, 0.15)' : 'rgba(251, 146, 60, 0.1)'
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
 * Watch: recriar gráfico quando dados ou tema mudam
 */
watch(() => [props.hourlyForecasts, theme.value], () => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  createChart();
}, { deep: true });

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
