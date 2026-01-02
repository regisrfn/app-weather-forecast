<template>
  <section
    v-if="shouldRender"
    class="forecast-insights"
    :aria-busy="isLoading"
  >
    <div class="insights-header">
      <div class="insights-eyebrow">
        <span class="dot"></span>
        Visão de {{ totalDays }} dias
      </div>
      <div class="insights-pill" v-if="rainyDays > 0">
        {{ rainyDays }} dia{{ rainyDays === 1 ? '' : 's' }} com chuva
      </div>
      <div class="insights-title">
        <h3>Panorama rápido</h3>
        <p>
          {{ cityContextLabel }} nos próximos 16 dias.
        </p>
      </div>
    </div>

    <div v-if="isLoading" class="insights-placeholder" role="status" aria-live="polite">
      <div class="skeleton-bar"></div>
      <div class="skeleton-bar short"></div>
      <div class="skeleton-bar"></div>
    </div>
    <div v-else-if="!hasData" class="insights-empty">
      <span v-if="hasError">Não foi possível carregar os gráficos agora. Tente novamente em instantes.</span>
      <span v-else>Sem dados suficientes para montar os gráficos agora.</span>
    </div>
    <div v-else class="insights-carousel-wrapper">
      <button
        class="insights-nav insights-nav--prev"
        type="button"
        @click="scrollPrev"
        :disabled="!canScrollLeft"
        aria-label="Cartões anteriores"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <div class="insights-carousel" ref="carouselTrackRef">
        <article
          v-for="(card, index) in chartCards"
          :key="card.key"
          class="insight-card"
          role="group"
          :aria-label="card.ariaLabel"
        >
          <div class="card-header">
            <div>
              <div class="card-kicker">{{ card.kicker }}</div>
              <div class="card-title">{{ card.title }}</div>
            </div>
            <div class="card-metric">{{ card.highlight }}</div>
          </div>
          <p class="card-description">{{ card.description }}</p>
          <div class="chart-area">
            <canvas :ref="(el) => setCanvasRef(el as HTMLCanvasElement | null, index)" :aria-label="card.ariaLabel" role="img"></canvas>
          </div>
          <div class="card-legend">
            <div
              v-for="(label, idx) in card.labels"
              :key="`${card.key}-${label}`"
              class="legend-item"
            >
              <span class="legend-dot" :style="{ backgroundColor: card.colors[idx] }"></span>
              <span class="legend-text">{{ label }}</span>
            </div>
          </div>
        </article>
      </div>

      <button
        class="insights-nav insights-nav--next"
        type="button"
        @click="scrollNext"
        :disabled="!canScrollRight"
        aria-label="Próximos cartões"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ArcElement, Chart as ChartJS, DoughnutController, Legend, Tooltip } from 'chart.js';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useTheme } from '../composables/useTheme';
import { getCityWeatherDetailed } from '../services/apiService';
import type { DailyForecast } from '../types/weather';

ChartJS.register(DoughnutController, ArcElement, Tooltip, Legend);

interface Props {
  cityId?: string | null;
  cityName?: string;
}

interface ChartCard {
  key: string;
  title: string;
  kicker: string;
  description: string;
  labels: string[];
  values: number[];
  colors: string[];
  highlight: string;
  ariaLabel: string;
}

const props = defineProps<Props>();

const { theme } = useTheme();
const isDark = computed(() => theme.value === 'dark');

const dailyForecasts = ref<DailyForecast[]>([]);
const isLoading = ref<boolean>(false);
const canvasRefs = ref<Array<HTMLCanvasElement | null>>([]);
const chartInstances = ref<Array<ChartJS<'doughnut'>>>([]);
const carouselTrackRef = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(false);

const setCanvasRef = (el: HTMLCanvasElement | null, index: number) => {
  if (!el) return;
  canvasRefs.value[index] = el;
};

const totalDays = computed(() => dailyForecasts.value.length);
const rainyDays = computed(() =>
  dailyForecasts.value.filter((forecast) => isRainyDay(forecast)).length
);
const totalRainVolume = computed(() => {
  if (!dailyForecasts.value.length) return 0;

  const total = dailyForecasts.value.reduce(
    (acc, day) => acc + Math.max(0, day.precipitationMm ?? 0),
    0
  );

  return Math.round(total);
});
const averageRainChance = computed(() => {
  if (!dailyForecasts.value.length) return 0;
  const sum = dailyForecasts.value.reduce((acc, day) => acc + (day.rainProbability ?? 0), 0);
  return Math.round(sum / dailyForecasts.value.length);
});
const warmestAverage = computed(() => {
  if (!dailyForecasts.value.length) return 0;
  const sum = dailyForecasts.value.reduce((acc, day) => acc + (day.tempMax ?? day.tempMin ?? 0), 0);
  return Math.round(sum / dailyForecasts.value.length);
});
const cityContextLabel = computed(() =>
  props.cityName ? `Resumo para ${props.cityName}` : 'Resumo da cidade selecionada'
);
const shouldRender = computed(() => !!props.cityId);
const hasData = computed(() => chartCards.value.length > 0);
const hasError = ref(false);

const colorPalettes = {
  // Claro -> escuro, respeitando intensidade
  probability: ['#dbeafe', '#93c5fd', '#60a5fa', '#2563eb'],
  volume: ['#e5e7eb', '#cbd5e1', '#93c5fd', '#3b82f6', '#1e3a8a'],
  temperature: ['#ffedd5', '#fdba74', '#f97316', '#ea580c'],
  sky: ['#fef9c3', '#fde68a', '#cbd5e1', '#1d4ed8'],
};

const isRainyDay = (forecast: DailyForecast): boolean => {
  const intensity = forecast.rainfallIntensity ?? 0;
  const precipitation = forecast.precipitationMm ?? 0;
  return intensity > 0 && precipitation > 0.1;
};

const buildProbabilityBuckets = () => {
  const buckets = [
    { label: '< 30% (baixa)', count: 0 },
    { label: '30-49% (moderada)', count: 0 },
    { label: '50-69% (alta)', count: 0 },
    { label: '>= 70% (muito alta)', count: 0 },
  ];

  dailyForecasts.value.forEach((forecast) => {
    const probability = Math.max(0, forecast.rainProbability ?? 0);
    if (probability >= 70) buckets[3]!.count += 1;
    else if (probability >= 50) buckets[2]!.count += 1;
    else if (probability >= 30) buckets[1]!.count += 1;
    else buckets[0]!.count += 1;
  });

  return buckets;
};

const buildVolumeBuckets = () => {
  const buckets = [
    { label: 'Sem chuva', count: 0 },
    { label: '0-5 mm', count: 0 },
    { label: '5-15 mm', count: 0 },
    { label: '15-30 mm', count: 0 },
    { label: '> 30 mm', count: 0 },
  ];

  dailyForecasts.value.forEach((forecast) => {
    if (!isRainyDay(forecast)) {
      buckets[0]!.count += 1;
      return;
    }

    const volume = forecast.precipitationMm ?? 0;
    if (volume < 5) buckets[1]!.count += 1;
    else if (volume < 15) buckets[2]!.count += 1;
    else if (volume < 30) buckets[3]!.count += 1;
    else buckets[4]!.count += 1;
  });

  return buckets;
};

const buildTemperatureBuckets = () => {
  const buckets = [
    { label: '< 22°C', count: 0 },
    { label: '22-28°C', count: 0 },
    { label: '28-34°C', count: 0 },
    { label: '> 34°C', count: 0 },
  ];

  dailyForecasts.value.forEach((forecast) => {
    const maxTemp = forecast.tempMax ?? forecast.tempMin ?? 0;
    if (maxTemp < 22) buckets[0]!.count += 1;
    else if (maxTemp < 28) buckets[1]!.count += 1;
    else if (maxTemp < 34) buckets[2]!.count += 1;
    else buckets[3]!.count += 1;
  });

  return buckets;
};

const buildSkyBuckets = () => {
  const buckets = [
    { label: 'Ensolarado', count: 0 },
    { label: 'Sol entre nuvens', count: 0 },
    { label: 'Nublado', count: 0 },
    { label: 'Chuva', count: 0 },
  ];

  dailyForecasts.value.forEach((forecast) => {
    const description = (forecast.weatherDescription || forecast.description || '').toLowerCase();

    if (isRainyDay(forecast) || description.includes('chuva')) {
      buckets[3]!.count += 1;
      return;
    }

    if (description.includes('nublado')) {
      buckets[2]!.count += 1;
      return;
    }

    if (description.includes('nuvens') || description.includes('parcial')) {
      buckets[1]!.count += 1;
      return;
    }

    buckets[0]!.count += 1;
  });

  return buckets;
};

const chartCards = computed<ChartCard[]>(() => {
  if (!dailyForecasts.value.length) return [];

  const probabilityBuckets = buildProbabilityBuckets();
  const volumeBuckets = buildVolumeBuckets();
  const temperatureBuckets = buildTemperatureBuckets();
  const skyBuckets = buildSkyBuckets();

  return [
    {
      key: 'probability',
      title: 'Probabilidade de chuva',
      kicker: 'Chances dia a dia',
      description: 'Distribuição das chances de chuva ao longo dos próximos dias.',
      labels: probabilityBuckets.map((bucket) => bucket.label),
      values: probabilityBuckets.map((bucket) => bucket.count),
      colors: colorPalettes.probability.slice(0, probabilityBuckets.length),
      highlight: `${averageRainChance.value}% média`,
      ariaLabel: 'Pizza com distribuição da probabilidade de chuva para os próximos dias.',
    },
    {
      key: 'volume',
      title: 'Volume previsto',
      kicker: 'Intensidade de chuva',
      description: 'Soma de dias chuvosos por faixa de precipitação, ignorando dias completamente secos.',
      labels: volumeBuckets.map((bucket) => bucket.label),
      values: volumeBuckets.map((bucket) => bucket.count),
      colors: colorPalettes.volume.slice(0, volumeBuckets.length),
      highlight: `${totalRainVolume.value}mm`,
      ariaLabel: 'Pizza com distribuição de volume de chuva em milímetros.',
    },
    {
      key: 'temperature',
      title: 'Picos de temperatura',
      kicker: 'Máximas diárias',
      description: 'Classificação das máximas previstas, útil para planejar calor ou tempo ameno.',
      labels: temperatureBuckets.map((bucket) => bucket.label),
      values: temperatureBuckets.map((bucket) => bucket.count),
      colors: colorPalettes.temperature.slice(0, temperatureBuckets.length),
      highlight: `${warmestAverage.value}°C média`,
      ariaLabel: 'Pizza com distribuição das temperaturas máximas previstas.',
    },
    {
      key: 'sky',
      title: 'Condição do céu',
      kicker: 'Ensolarado x nublado',
      description: 'Separação entre dias de sol pleno, sol com nuvens, dias nublados e chuvosos.',
      labels: skyBuckets.map((bucket) => bucket.label),
      values: skyBuckets.map((bucket) => bucket.count),
      colors: colorPalettes.sky.slice(0, skyBuckets.length),
      highlight: `${skyBuckets[0]?.count ?? 0} dia${(skyBuckets[0]?.count ?? 0) === 1 ? '' : 's'} de sol`,
      ariaLabel: 'Pizza com distribuição da condição do céu para os próximos dias.',
    },
  ];
});

const updateScrollButtons = () => {
  const track = carouselTrackRef.value;
  if (!track) {
    canScrollLeft.value = false;
    canScrollRight.value = false;
    return;
  }

  const { scrollLeft, scrollWidth, clientWidth } = track;
  const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
  canScrollLeft.value = scrollLeft > 2;
  canScrollRight.value = scrollLeft < maxScrollLeft - 2;
};

const getScrollStep = () => {
  const track = carouselTrackRef.value;
  if (!track) return 320;

  const card = track.querySelector<HTMLElement>('.insight-card');
  const styles = getComputedStyle(track);
  const gap = parseFloat(styles.columnGap || styles.gap || '0') || 12;

  if (!card) return 320 + gap;

  return card.clientWidth + gap;
};

const scrollPrev = () => {
  const track = carouselTrackRef.value;
  if (!track) return;
  track.scrollBy({ left: -getScrollStep(), behavior: 'smooth' });
};

const scrollNext = () => {
  const track = carouselTrackRef.value;
  if (!track) return;
  track.scrollBy({ left: getScrollStep(), behavior: 'smooth' });
};

const resetCarouselPosition = () => {
  const track = carouselTrackRef.value;
  if (!track) {
    canScrollLeft.value = false;
    canScrollRight.value = false;
    return;
  }

  track.scrollTo({ left: 0, behavior: 'auto' });
  updateScrollButtons();
};

const destroyCharts = () => {
  chartInstances.value.forEach((chart) => chart.destroy());
  chartInstances.value = [];
};

const buildCharts = async () => {
  await nextTick();
  destroyCharts();

  chartCards.value.forEach((card, index) => {
    const canvas = canvasRefs.value[index];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const hasValues = card.values.some((value) => value > 0);
    const datasetValues = hasValues ? card.values : [1];
    const datasetLabels = hasValues ? card.labels : ['Sem dados'];
    const datasetColors = (hasValues ? card.colors : ['#cbd5e1']).slice(0, datasetLabels.length);

    const chart = new ChartJS<'doughnut'>(ctx, {
      type: 'doughnut',
      data: {
        labels: datasetLabels,
        datasets: [
          {
            data: datasetValues,
            backgroundColor: datasetColors,
            borderColor: isDark.value ? '#0f172a' : '#e2e8f0',
            borderWidth: 1.5,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: isDark.value ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.96)',
            borderColor: isDark.value ? '#1e293b' : '#cbd5e1',
            borderWidth: 1,
            titleColor: isDark.value ? '#e2e8f0' : '#0f172a',
            bodyColor: isDark.value ? '#e2e8f0' : '#0f172a',
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (context) => {
                const value = context.parsed as number;
                const label = context.label ?? '';
                const suffix = value === 1 ? ' dia' : ' dias';
                return `${label}: ${value}${suffix}`;
              },
            },
          },
        },
      },
    });

    chartInstances.value[index] = chart;
  });
};

const fetchForecasts = async () => {
  if (!props.cityId) {
    dailyForecasts.value = [];
    hasError.value = false;
    destroyCharts();
    return;
  }

  isLoading.value = true;
  hasError.value = false;
  try {
    const detailed = await getCityWeatherDetailed(props.cityId);
    dailyForecasts.value = detailed.dailyForecasts.slice(0, 16);
  } catch (error) {
    console.error('Erro ao carregar previsões detalhadas para gráficos:', error);
    dailyForecasts.value = [];
    hasError.value = true;
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.cityId,
  () => {
    fetchForecasts();
  },
  { immediate: true }
);

watch(
  [chartCards, isDark],
  async () => {
    if (!chartCards.value.length) {
      destroyCharts();
      resetCarouselPosition();
      return;
    }
    await buildCharts();
    await nextTick();
    updateScrollButtons();
  }
);

watch(chartCards, async () => {
  await nextTick();
  resetCarouselPosition();
  updateScrollButtons();
});

watch(carouselTrackRef, (track, previous) => {
  if (previous) {
    previous.removeEventListener('scroll', updateScrollButtons);
  }

  if (track) {
    track.addEventListener('scroll', updateScrollButtons);
    updateScrollButtons();
  }
});

onMounted(() => {
  window.addEventListener('resize', updateScrollButtons);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateScrollButtons);
  if (carouselTrackRef.value) {
    carouselTrackRef.value.removeEventListener('scroll', updateScrollButtons);
  }
  destroyCharts();
});
</script>
