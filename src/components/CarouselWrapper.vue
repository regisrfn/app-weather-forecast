<template>
  <div class="map-carousel">
    <button
      class="map-carousel__nav map-carousel__nav--prev"
      type="button"
      @click="scrollPrev"
      :disabled="!canScrollLeft"
      aria-label="Anterior"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <div class="map-carousel__track" ref="trackRef">
      <template v-if="isDaily">
        <button
          v-for="day in days"
          :key="day.value"
          class="map-carousel__item"
          :class="{ 'map-carousel__item--active': day.value === selectedDate }"
          type="button"
          @click="emitDay(day.value)"
          :aria-pressed="day.value === selectedDate"
          :aria-label="`Selecionar previsão de ${day.ariaLabel}`"
        >
          <span class="map-carousel__label">{{ day.weekdayShort }}</span>
          <span class="map-carousel__value">{{ day.dayMonth }}</span>
        </button>
      </template>

      <template v-else>
        <button
          v-for="slot in hourSlots"
          :key="slot"
          class="map-carousel__item"
          :class="{ 'map-carousel__item--active': slot === selectedTime }"
          type="button"
          @click="emitHour(slot)"
          :aria-pressed="slot === selectedTime"
        >
          <span class="map-carousel__label">{{ formatHourLabel(slot) }}</span>
          <span class="map-carousel__value">{{ selectedDaySummary }}</span>
        </button>
      </template>
    </div>

    <button
      class="map-carousel__nav map-carousel__nav--next"
      type="button"
      @click="scrollNext"
      :disabled="!canScrollRight"
      aria-label="Próximo"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { DataResolution } from '../types/weather';

const DAILY_NAVIGATION_TIME = '00:00';
const BASE_HOUR_SLOTS = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];

const capitalize = (value: string) => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const formatWeekdayShort = (date: Date) => {
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' }).replace('.', '');
  return capitalize(weekday);
};

const formatDayMonth = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' });
  return `${day} ${month}`;
};

const props = defineProps<{
  resolution: DataResolution;
  selectedDate: string;
  selectedTime: string;
  maxDays?: number;
}>();

const emit = defineEmits<{
  select: [date: string, time: string];
}>();

const trackRef = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(true);

const isDaily = computed(() => props.resolution === 'daily');

const resolvedDate = computed(() => {
  if (props.selectedDate) {
    return props.selectedDate;
  }

  const now = new Date();
  const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const year = brasilTime.getFullYear();
  const month = String(brasilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brasilTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
});

const days = computed(() => {
  const result: Array<{ value: string; weekdayShort: string; dayMonth: string; ariaLabel: string }> = [];
  const maxDays = props.maxDays ?? 6;

  const now = new Date();
  const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));

  for (let i = 0; i < maxDays; i++) {
    const date = new Date(brasilTime);
    date.setDate(date.getDate() + i);

    const dayNumber = date.getDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(dayNumber).padStart(2, '0');
    const value = `${year}-${month}-${day}`;

    const weekdayShort = formatWeekdayShort(date);
    const dayMonth = formatDayMonth(date);
    const ariaLabel = date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'America/Sao_Paulo' });

    result.push({
      value,
      weekdayShort,
      dayMonth,
      ariaLabel,
    });
  }

  return result;
});

const hourSlots = computed(() => {
  const slots = new Set(BASE_HOUR_SLOTS);
  if (props.selectedTime) {
    slots.add(props.selectedTime);
  }
  return Array.from(slots).sort();
});

const selectedDaySummary = computed(() => {
  if (!resolvedDate.value) return '';
  const date = new Date(resolvedDate.value + 'T00:00:00');
  const weekday = formatWeekdayShort(date);
  const dayMonth = formatDayMonth(date);
  return `${weekday} ${dayMonth}`;
});

const formatHourLabel = (time: string) => {
  const [hour, minute] = time.split(':');
  if (!hour || minute === undefined) return time;
  if (minute === '00') {
    return `${hour}h`;
  }
  return `${hour}h${minute}`;
};

const emitDay = (value: string) => {
  emit('select', value, DAILY_NAVIGATION_TIME);
};

const emitHour = (time: string) => {
  emit('select', resolvedDate.value, time);
};

const scrollPrev = () => {
  if (trackRef.value) {
    const itemWidth = trackRef.value.querySelector<HTMLElement>('.map-carousel__item')?.clientWidth || 0;
    trackRef.value.scrollBy({ left: -(itemWidth + 12), behavior: 'smooth' });
  }
};

const scrollNext = () => {
  if (trackRef.value) {
    const itemWidth = trackRef.value.querySelector<HTMLElement>('.map-carousel__item')?.clientWidth || 0;
    trackRef.value.scrollBy({ left: itemWidth + 12, behavior: 'smooth' });
  }
};

const updateScrollButtons = () => {
  if (!trackRef.value) return;
  const { scrollLeft, scrollWidth, clientWidth } = trackRef.value;
  canScrollLeft.value = scrollLeft > 0;
  canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 5;
};

const resetScroll = async () => {
  await nextTick();
  if (trackRef.value) {
    trackRef.value.scrollTo({ left: 0 });
    updateScrollButtons();
  }
};

onMounted(() => {
  if (trackRef.value) {
    trackRef.value.addEventListener('scroll', updateScrollButtons);
    updateScrollButtons();
  }
  resetScroll();
});

onUnmounted(() => {
  if (trackRef.value) {
    trackRef.value.removeEventListener('scroll', updateScrollButtons);
  }
});

watch([isDaily, () => props.selectedDate, () => props.selectedTime], () => {
  resetScroll();
});

watch([days, hourSlots], async () => {
  await nextTick();
  updateScrollButtons();
});
</script>
