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

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

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
  const precipData = props.dailyForecasts.map(f => f.precipitationMm);

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Temp. Máx (°C)',
          data: tempMaxData,
          borderColor: '#f97316',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(249, 115, 22, 0.3)');
            gradient.addColorStop(1, 'rgba(249, 115, 22, 0.0)');
            return gradient;
          },
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#f97316',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.4,
          yAxisID: 'y',
          fill: true,
        },
        {
          type: 'line',
          label: 'Temp. Mín (°C)',
          data: tempMinData,
          borderColor: '#3b82f6',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
            gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
            return gradient;
          },
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          tension: 0.4,
          yAxisID: 'y',
          fill: true,
        },
        {
          type: 'bar',
          label: 'Precipitação (mm)',
          data: precipData,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: '#2563eb',
          borderWidth: 1,
          yAxisID: 'y1',
          barPercentage: 0.6,
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
            color: '#1e293b',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(30, 41, 59, 0.96)',
          titleColor: '#fff',
          bodyColor: '#e2e8f0',
          borderColor: '#64748b',
          borderWidth: 1,
          padding: 14,
          cornerRadius: 8,
          titleFont: {
            size: 14,
            weight: 'bold',
          },
          bodyFont: {
            size: 13,
          },
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (value === null || value === undefined) return label;
              if (label.includes('Precipitação')) {
                return `${label}: ${value.toFixed(1)} mm`;
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
            color: 'rgba(148, 163, 184, 0.1)',
            lineWidth: 1,
          },
          ticks: {
            color: '#475569',
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
            color: '#475569',
            font: {
              size: 12,
              weight: 'bold',
            },
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.15)',
          },
          ticks: {
            color: '#475569',
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
            color: '#475569',
            font: {
              size: 12,
              weight: 'bold',
            },
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: '#475569',
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
 * Atualiza gráfico quando dados mudam
 */
watch(() => props.dailyForecasts, () => {
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
  background: rgba(255, 255, 255, 0.98);
  border-radius: $radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-md;
  
  @include md {
    padding: $spacing-md;
    min-height: 400px;
  }
}

.chart-title {
  font-size: $font-xl;
  font-weight: $font-bold;
  color: $text-dark;
  margin: 0 0 $spacing-lg 0;
  text-align: center;
  
  @include md {
    font-size: $font-lg;
    margin-bottom: $spacing-md;
  }
}

.chart-container {
  position: relative;
  width: 100%;
  height: 400px;
  
  @include md {
    height: 300px;
    overflow-x: auto;
    overflow-y: hidden;
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
