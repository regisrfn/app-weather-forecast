<template>
  <div class="sun-timeline">
    <div class="timeline-container">
      <!-- Sunrise marker -->
      <div class="time-point sunrise">
        <div class="time-label">Nascer</div>
        <div class="time-value">{{ formatTime(sunrise) }}</div>
      </div>
      
      <!-- Progress bar -->
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${sunProgress * 100}%` }"
          ></div>
          <div 
            v-if="isCurrentDay" 
            class="current-indicator"
            :style="{ left: `${sunProgress * 100}%` }"
          >
            <div class="indicator-dot"></div>
          </div>
        </div>
      </div>
      
      <!-- Sunset marker -->
      <div class="time-point sunset">
        <div class="time-label">Pôr</div>
        <div class="time-value">{{ formatTime(sunset) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  sunrise: string; // HH:MM:SS format
  sunset: string;  // HH:MM:SS format
  currentTime?: string; // HH:MM:SS format, optional
  isCurrentDay?: boolean; // Se true, mostra animação e posição atual
}

const props = withDefaults(defineProps<Props>(), {
  currentTime: '',
  isCurrentDay: false,
});

/**
 * Converte string HH:MM:SS para minutos desde meia-noite
 */
const timeToMinutes = (timeStr: string): number => {
  const [hours = 0, minutes = 0] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Formata HH:MM:SS para HH:MM
 */
const formatTime = (timeStr: string): string => {
  const [hours, minutes] = timeStr.split(':');
  return `${hours}:${minutes}`;
};

/**
 * Calcula o progresso do sol (0 a 1)
 * 0 = nascer do sol, 1 = pôr do sol
 */
const sunProgress = computed(() => {
  if (!props.isCurrentDay || !props.currentTime) {
    return 0.5; // Meio-dia por padrão se não for o dia atual
  }
  
  const sunriseMin = timeToMinutes(props.sunrise);
  const sunsetMin = timeToMinutes(props.sunset);
  const currentMin = timeToMinutes(props.currentTime);
  
  // Se antes do nascer ou após o pôr, retornar extremos
  if (currentMin < sunriseMin) return 0;
  if (currentMin > sunsetMin) return 1;
  
  // Calcular progresso entre nascer e pôr
  const elapsed = currentMin - sunriseMin;
  const total = sunsetMin - sunriseMin;
  
  return elapsed / total;
});


</script>

<style scoped lang="scss">
@use '../styles/abstracts/colors' as *;
@use '../styles/abstracts/variables' as *;
@use '../styles/abstracts/breakpoints' as *;
@use '../styles/abstracts/mixins' as *;

.sun-timeline {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.timeline-container {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  flex: 1;
  
  @include md {
    gap: $spacing-xs;
  }
}

.time-point {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 50px;
  
  @include md {
    min-width: 42px;
  }
}

.time-label {
  font-size: 0.65rem;
  font-weight: $font-semibold;
  color: var(--weather-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  
  @include md {
    font-size: 0.55rem;
  }
}

.time-value {
  font-size: $font-sm;
  font-weight: $font-bold;
  color: var(--weather-text-primary);
  
  @include md {
    font-size: $font-xs;
  }
}

.progress-bar-container {
  flex: 1;
  display: flex;
  align-items: center;
  min-width: 60px;
  padding: 0 $spacing-xs;
}

.progress-bar {
  position: relative;
  width: 100%;
  height: 16px;
  background: rgba(226, 232, 240, 0.4);
  border-radius: 8px;
  overflow: visible;
  border: 1px solid rgba(148, 163, 184, 0.3);
  
  @include dark-mode {
    background: rgba(51, 65, 85, 0.4);
    border-color: rgba(71, 85, 105, 0.5);
  }
  
  @include md {
    height: 14px;
    border-radius: 7px;
  }
}

.progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(
    to right,
    #fbbf24 0%,
    #fcd34d 25%,
    #fb923c 50%,
    #f97316 70%,
    #ea580c 85%,
    #c026d3 92%,
    #7c3aed 96%,
    #1e3a8a 100%
  );
  border-radius: 7px;
  transition: width 0.6s ease;
  box-shadow: 0 3px 12px rgba(251, 146, 60, 0.4), 0 1px 4px rgba(124, 58, 237, 0.3);
  
  @include dark-mode {
    box-shadow: 0 3px 12px rgba(251, 146, 60, 0.3), 0 1px 4px rgba(124, 58, 237, 0.25);
  }
}

.current-indicator {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none;
}

.indicator-dot {
  width: 20px;
  height: 20px;
  background: radial-gradient(circle, #fde047 0%, #fbbf24 70%);
  border: 3px solid white;
  border-radius: $radius-full;
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.3),
              0 3px 12px rgba(251, 191, 36, 0.8),
              0 0 20px rgba(253, 224, 71, 0.5);
  animation: pulse 2s ease-in-out infinite;
  
  @include dark-mode {
    border-color: rgba(15, 23, 42, 0.95);
    box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.25),
                0 3px 12px rgba(251, 191, 36, 0.7),
                0 0 20px rgba(253, 224, 71, 0.4);
  }
  
  @include md {
    width: 16px;
    height: 16px;
    border-width: 2px;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.3),
                0 3px 12px rgba(251, 191, 36, 0.8),
                0 0 20px rgba(253, 224, 71, 0.5);
  }
  50% {
    transform: scale(1.15);
    box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.4),
                0 5px 20px rgba(251, 191, 36, 1),
                0 0 30px rgba(253, 224, 71, 0.7);
  }
}
</style>
