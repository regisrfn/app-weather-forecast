<template>
  <div class="weather-chart">
    <h3 class="chart-title">Previsão de Temperatura e Precipitação</h3>
    <div class="chart-container">
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
import type { DailyForecast } from '../types/weather';

// Registrar componentes do Chart.js (tree-shaking)
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
  dailyForecasts: DailyForecast[];
}

const props = defineProps<Props>();

const { theme } = useTheme();
const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const isDark = computed(() => theme.value === 'dark');
const PRECIP_PROBABILITY_THRESHOLD = 10;
const MIN_DISPLAYED_PRECIP = 0.1;
const PRECIP_BAR_RGB = '37, 99, 235'; // Azul base para as barras

const shouldShowPrecipBar = (value: number, probability: number) => {
  return value > 0 || probability > PRECIP_PROBABILITY_THRESHOLD;
};

const normalizePrecipValue = (value: number, probability: number) => {
  if (probability > PRECIP_PROBABILITY_THRESHOLD && value <= 0) {
    return MIN_DISPLAYED_PRECIP;
  }
  return value;
};

const getProbabilityColor = (probability: number, extraAlpha = 0) => {
  const clamped = Math.min(Math.max(probability, 0), 100);
  const alpha = 0.2 + (clamped / 100) * 0.6 + extraAlpha; // 100% deixa a barra mais escura
  return `rgba(${PRECIP_BAR_RGB}, ${Math.min(alpha, 0.95)})`;
};

const chartAriaLabel = computed(() => 
  `Gráfico mostrando previsão de ${props.dailyForecasts.length} dias com temperatura e precipitação`
);

/**
 * Formata data para exibição no eixo X (formato curto)
 */
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
};

/**
 * Cria e configura o gráfico Chart.js
 */
const createChart = () => {
  if (!chartCanvas.value) {
    console.warn('[WeatherChart] Canvas ref not available');
    return;
  }
  
  if (!props.dailyForecasts?.length) {
    console.warn('[WeatherChart] No forecast data available');
    return;
  }

  console.log('[WeatherChart] Creating chart with', props.dailyForecasts.length, 'days');

  const labels = props.dailyForecasts.map(f => formatDate(f.date));
  const tempMaxData = props.dailyForecasts.map(f => f.tempMax);
  const tempMinData = props.dailyForecasts.map(f => f.tempMin);
  const rainProbData = props.dailyForecasts.map(f => f.rainProbability);
  const precipData = props.dailyForecasts.map((f, index) => 
    normalizePrecipValue(f.precipitationMm, rainProbData[index] ?? 0)
  );
  const rainfallIntensityData = props.dailyForecasts.map(f => f.rainfallIntensity || 0);

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Temp. Máx (°C)',
          data: tempMaxData,
          borderColor: '#fb923c',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(251, 146, 60, 0.25)');
            gradient.addColorStop(1, 'rgba(251, 146, 60, 0.0)');
            return gradient;
          },
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#fb923c',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.4,
          yAxisID: 'y',
          fill: true,
          order: 2, // Behind rain bars
        },
        {
          type: 'line',
          label: 'Temp. Mín (°C)',
          data: tempMinData,
          borderColor: '#60a5fa',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(96, 165, 250, 0.25)');
            gradient.addColorStop(1, 'rgba(96, 165, 250, 0.0)');
            return gradient;
          },
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#60a5fa',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.4,
          yAxisID: 'y',
          fill: true,
          order: 2, // Behind rain bars
        },
        {
          type: 'bar',
          label: 'Precipitação (mm)',
          data: precipData,
          backgroundColor: (context: any) => {
            const probability = rainProbData[context.dataIndex] ?? 0;
            const value = precipData[context.dataIndex] ?? 0;

            if (!shouldShowPrecipBar(value, probability)) {
              return 'transparent';
            }

            return getProbabilityColor(probability);
          },
          borderColor: (context: any) => {
            const probability = rainProbData[context.dataIndex] ?? 0;
            const value = precipData[context.dataIndex] ?? 0;
            return shouldShowPrecipBar(value, probability) ? getProbabilityColor(probability, 0.1) : 'transparent';
          },
          borderWidth: 1,
          borderRadius: 4,
          yAxisID: 'y1',
          barPercentage: 0.6,
          order: 1, // In front of temperature lines
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12,
              weight: 'bold',
            },
            color: isDark.value ? '#e2e8f0' : '#1e293b',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.96)',
          titleColor: '#fff',
          bodyColor: '#e2e8f0',
          borderColor: '#64748b',
          borderWidth: 1,
          padding: () => {
            return window.innerWidth < 640 ? 10 : 14;
          },
          cornerRadius: 8,
          titleFont: {
            size: () => {
              return window.innerWidth < 640 ? 11 : 13;
            },
            weight: 'bold',
          },
          bodyFont: {
            size: () => {
              return window.innerWidth < 640 ? 10 : 12;
            },
          },
          boxWidth: 8,
          boxHeight: 8,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (value === null || value === undefined) return label;
              if (label.includes('Precipitação')) {
                const prob = rainProbData[context.dataIndex];
                const intensity = rainfallIntensityData[context.dataIndex] ?? 0;
                return `${label}: ${value.toFixed(1)} mm (${prob}%, intensidade: ${intensity.toFixed(1)})`;
              }
              return `${label}: ${value.toFixed(1)}°C`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: true,
            color: isDark.value ? 'rgba(71, 85, 105, 0.3)' : 'rgba(148, 163, 184, 0.1)',
            lineWidth: 1,
          },
          ticks: {
            color: isDark.value ? '#94a3b8' : '#475569',
            font: {
              size: 12,
              weight: 'bold',
            },
          },
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Temperatura (°C)',
            color: isDark.value ? '#94a3b8' : '#475569',
            font: {
              size: 12,
              weight: 'bold',
            },
          },
          grid: {
            color: isDark.value ? 'rgba(71, 85, 105, 0.25)' : 'rgba(148, 163, 184, 0.15)',
          },
          ticks: {
            color: isDark.value ? '#94a3b8' : '#475569',
            font: {
              size: 11,
            },
            callback: (value) => `${value}°C`,
          },
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Precipitação (mm)',
            color: isDark.value ? '#94a3b8' : '#475569',
            font: {
              size: 12,
              weight: 'bold',
            },
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: isDark.value ? '#94a3b8' : '#475569',
            font: {
              size: 11,
            },
            callback: (value) => `${value} mm`,
          },
        },
      },
    },
  };

  chartInstance = new Chart(chartCanvas.value, config);
  console.log('[WeatherChart] Chart created successfully');
};

/**
 * Destrói instância do gráfico
 */
const destroyChart = () => {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
};

/**
 * Atualiza gráfico quando dados ou tema mudam
 */
watch(() => [props.dailyForecasts, theme.value], () => {
  destroyChart();
  createChart();
}, { deep: true });

onMounted(() => {
  createChart();
});

onUnmounted(() => {
  destroyChart();
});
</script>

<style scoped lang="scss">
@use '../styles/abstracts/colors' as *;
@use '../styles/abstracts/variables' as *;
@use '../styles/abstracts/mixins' as *;
@use '../styles/abstracts/breakpoints' as *;

.weather-chart {
  width: 100%;
  min-height: 500px;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 255, 0.98) 100%
  );
  border-radius: $radius-xl;
  padding: $spacing-xl;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.12);
  border: 2px solid rgba(139, 157, 225, 0.2);
  transition: all $transition-normal;
  
  [data-theme="dark"] & {
    background: linear-gradient(135deg, 
      rgba(30, 41, 59, 0.95) 0%,
      rgba(51, 65, 85, 0.95) 100%
    );
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    border-color: rgba(71, 85, 105, 0.4);
  }
  
  &:hover {
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.18);
    border-color: rgba(102, 126, 234, 0.3);
    
    [data-theme="dark"] & {
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      border-color: rgba(71, 85, 105, 0.6);
    }
  }
  
  @include md {
    padding: $spacing-lg;
    min-height: 400px;
  }
}

.chart-title {
  font-size: $font-xl;
  font-weight: $font-bold;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 $spacing-xl 0;
  text-align: center;
  
  [data-theme="dark"] & {
    background: linear-gradient(135deg, rgba(139, 157, 225, 0.9) 0%, rgba(167, 139, 250, 0.9) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  @include md {
    font-size: $font-lg;
    margin-bottom: $spacing-lg;
  }
}

.chart-container {
  position: relative;
  width: 100%;
  height: 400px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  
  @include md {
    height: 300px;
  }
  
  @include sm {
    canvas {
      min-width: 450px;
    }
  }
  
  canvas {
    max-width: 100%;
  }
}

// Suporte para usuários que preferem menos movimento
@media (prefers-reduced-motion: reduce) {
  .weather-chart {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}
</style>
