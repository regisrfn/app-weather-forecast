<template>
  <Teleport to="body">
    <Transition name="chart-modal">
      <div v-if="isOpen" class="chart-modal chart-modal__overlay" @click="closeModal">
        <div class="chart-modal__container" @click.stop>
          <div class="chart-modal__header">
            <h3 class="chart-modal__title">Previsão de {{ dailyForecasts.length }} Dias</h3>
            <button class="chart-modal__close" @click="closeModal" aria-label="Fechar">
              <span>✕</span>
            </button>
          </div>
          <div class="chart-modal__body">
            <WeatherChart :daily-forecasts="dailyForecasts" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import WeatherChart from './WeatherChart.vue';
import type { DailyForecast } from '../types/weather';

interface Props {
  isOpen: boolean;
  dailyForecasts: DailyForecast[];
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
}>();

const closeModal = () => {
  emit('close');
};

// Prevenir scroll do body quando modal está aberto
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});
</script>
