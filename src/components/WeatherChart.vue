<template>
  <div class="weather-chart">
    <h3 class="weather-chart__title">Previsão de Temperatura e Precipitação</h3>
    <div class="weather-chart__container">
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
import {
  formatDateShort,
  getPrecipitationColorByProbability,
  getPrecipitationBorderColor,
  getProbabilityDescription,
  createTemperatureGradient,
  chartColors,
  getResponsiveConfig,
} from '../utils/chartHelpers';

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

const chartAriaLabel = computed(() => 
  `Gráfico mostrando previsão de ${props.dailyForecasts.length} dias com temperatura e precipitação`
);

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

  const labels = props.dailyForecasts.map(f => formatDateShort(f.date));
  const tempMaxData = props.dailyForecasts.map(f => f.tempMax);
  const tempMinData = props.dailyForecasts.map(f => f.tempMin);
  const precipData = props.dailyForecasts.map(f => f.precipitationMm);
  const rainProbData = props.dailyForecasts.map(f => f.rainProbability);
  const rainfallIntensityData = props.dailyForecasts.map(f => f.rainfallIntensity || 0);
  const responsiveConfig = getResponsiveConfig();

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Temp. Máx (°C)',
          data: tempMaxData,
          borderColor: chartColors.tempMax,
          backgroundColor: (context: any) => {
            return createTemperatureGradient(context.chart.ctx, chartColors.tempMaxRGB);
          },
          borderWidth: 3,
          pointRadius: responsiveConfig.pointRadius,
          pointHoverRadius: responsiveConfig.pointHoverRadius,
          pointBackgroundColor: chartColors.tempMax,
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
          borderColor: chartColors.tempMin,
          backgroundColor: (context: any) => {
            return createTemperatureGradient(context.chart.ctx, chartColors.tempMinRGB);
          },
          borderWidth: 3,
          pointRadius: responsiveConfig.pointRadius,
          pointHoverRadius: responsiveConfig.pointHoverRadius,
          pointBackgroundColor: chartColors.tempMin,
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
            const intensity = rainfallIntensityData[context.dataIndex];
            return getPrecipitationColorByProbability(probability, intensity);
          },
          borderColor: (context: any) => {
            const probability = rainProbData[context.dataIndex] ?? 0;
            const intensity = rainfallIntensityData[context.dataIndex];
            return getPrecipitationBorderColor(probability, intensity);
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
          padding: responsiveConfig.tooltipPadding,
          cornerRadius: 8,
          titleFont: {
            size: responsiveConfig.tooltipTitleSize,
            weight: 'bold',
          },
          bodyFont: {
            size: responsiveConfig.tooltipBodySize,
          },
          boxWidth: 8,
          boxHeight: 8,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              if (value === null || value === undefined) return label;
              if (label.includes('Precipitação')) {
                const prob = rainProbData[context.dataIndex] ?? 0;
                const probDesc = getProbabilityDescription(prob);
                return `${label}: ${value.toFixed(1)} mm (${prob}% - ${probDesc})`;
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
