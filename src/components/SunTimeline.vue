<template>
  <div class="sun-timeline">
    <div class="sun-timeline__container">
      <!-- Sunrise marker -->
      <div class="sun-timeline__time-point sun-timeline__time-point--sunrise">
        <div class="sun-timeline__time-label">Nascer</div>
        <div class="sun-timeline__time-value">{{ formatTime(sunrise) }}</div>
      </div>
      
      <!-- Progress bar -->
      <div class="sun-timeline__progress">
        <div class="sun-timeline__bar">
          <!-- Background gradient - always visible -->
          <div class="sun-timeline__gradient"></div>
          
          <!-- Dark overlay that covers progressively -->
          <div 
            v-if="isCurrentDay"
            class="sun-timeline__dark-cover" 
            :style="{ clipPath: `inset(0 ${100 - sunProgress * 100}% 0 0)` }"
          ></div>
          
          <!-- Sun indicator -->
          <div 
            v-if="isCurrentDay" 
            class="sun-timeline__indicator"
            :style="{ left: `${sunProgress * 100}%` }"
          >
            <div class="sun-timeline__dot"></div>
          </div>
        </div>
        
        <!-- Status text -->
        <div v-if="isCurrentDay" class="sun-timeline__status">
          {{ statusText }}
        </div>
      </div>
      
      <!-- Sunset marker -->
      <div class="sun-timeline__time-point sun-timeline__time-point--sunset">
        <div class="sun-timeline__time-label">Pôr</div>
        <div class="sun-timeline__time-value">{{ formatTime(sunset) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  sunrise: string;
  sunset: string;
  currentTime?: string;
  isCurrentDay?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  currentTime: '',
  isCurrentDay: false,
});

const timeToMinutes = (timeStr: string): number => {
  const [hours = 0, minutes = 0] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':');
  return `${hours}:${minutes}`;
};

const sunProgress = computed(() => {
  if (!props.isCurrentDay || !props.currentTime) {
    return 0.5;
  }
  
  const sunriseMin = timeToMinutes(props.sunrise);
  const sunsetMin = timeToMinutes(props.sunset);
  const currentMin = timeToMinutes(props.currentTime);
  
  // Debug
  console.log('SunTimeline Debug:', {
    sunrise: props.sunrise,
    sunset: props.sunset,
    currentTime: props.currentTime,
    sunriseMin,
    sunsetMin,
    currentMin,
    isCurrentDay: props.isCurrentDay
  });
  
  // Antes do nascer ou depois do pôr = noite (100% escuro)
  if (currentMin < sunriseMin || currentMin >= sunsetMin) {
    console.log('É noite - progress: 1');
    return 1;
  }
  
  // Durante o dia - calcular progresso
  const elapsed = currentMin - sunriseMin;
  const total = sunsetMin - sunriseMin;
  
  const progress = elapsed / total;
  console.log('É dia - progress:', progress);
  
  return progress;
});

const statusText = computed(() => {
  if (!props.isCurrentDay || !props.currentTime) return '';
  
  const sunriseMin = timeToMinutes(props.sunrise);
  const sunsetMin = timeToMinutes(props.sunset);
  const currentMin = timeToMinutes(props.currentTime);
  
  // Antes do nascer do sol (madrugada) ou depois do pôr do sol = Noite
  if (currentMin < sunriseMin || currentMin >= sunsetMin) {
    return 'Noite';
  }
  
  // Durante o dia - calcular horas restantes até o pôr do sol
  const remainingMin = sunsetMin - currentMin;
  const remainingHours = Math.round(remainingMin / 60);
  
  return remainingHours > 0 ? `${remainingHours}h de luz restante` : 'Noite';
});
</script>
