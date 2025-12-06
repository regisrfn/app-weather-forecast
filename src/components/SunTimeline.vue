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
          <!-- Background gradient - always visible -->
          <div class="gradient-base"></div>
          
          <!-- Dark overlay that covers progressively -->
          <div 
            v-if="isCurrentDay"
            class="dark-cover" 
            :style="{ clipPath: `inset(0 ${100 - sunProgress * 100}% 0 0)` }"
          ></div>
          
          <!-- Sun indicator -->
          <div 
            v-if="isCurrentDay" 
            class="sun-indicator"
            :style="{ left: `${sunProgress * 100}%` }"
          >
            <div class="sun-dot"></div>
          </div>
        </div>
        
        <!-- Status text -->
        <div v-if="isCurrentDay" class="status-text">
          {{ statusText }}
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
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 60px;
  padding: 0 $spacing-xs;
}

.progress-bar {
  position: relative;
  width: 100%;
  height: 16px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.3);
  
  @include dark-mode {
    border-color: rgba(71, 85, 105, 0.5);
  }
  
  @include md {
    height: 14px;
    border-radius: 7px;
  }
}

.gradient-base {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to right,
    #fde047 0%,
    #fbbf24 10%,
    #fcd34d 20%,
    #fb923c 30%,
    #f97316 45%,
    #ea580c 60%,
    #c026d3 73%,
    #7c3aed 84%,
    #4c1d95 92%,
    #1e3a8a 97%,
    #0f172a 100%
  );
}

.dark-cover {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: #0f172a;
  transition: clip-path 0.6s ease;
}

.status-text {
  font-size: 0.65rem;
  font-weight: $font-semibold;
  color: var(--weather-text-muted);
  text-align: center;
  opacity: 0.8;
  letter-spacing: 0.2px;
  
  @include md {
    font-size: 0.6rem;
  }
}

.sun-indicator {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  pointer-events: none;
  transition: left 0.6s ease;
}

.sun-dot {
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
