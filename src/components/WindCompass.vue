<template>
  <div class="wind-compass">
    <svg
      viewBox="0 0 200 200"
      class="compass-svg"
      role="img"
      aria-label="Bússola indicando direção do vento"
    >
      <!-- Círculo externo -->
      <circle
        cx="100"
        cy="100"
        r="90"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        opacity="0.2"
      />
      
      <!-- Círculo interno -->
      <circle
        cx="100"
        cy="100"
        r="70"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        opacity="0.15"
      />
      
      <!-- Pontos cardeais -->
      <text x="100" y="25" text-anchor="middle" class="cardinal-point cardinal-n" font-weight="bold">N</text>
      <text x="175" y="105" text-anchor="middle" class="cardinal-point cardinal-e" font-weight="bold">L</text>
      <text x="100" y="185" text-anchor="middle" class="cardinal-point cardinal-s" font-weight="bold">S</text>
      <text x="25" y="105" text-anchor="middle" class="cardinal-point cardinal-w" font-weight="bold">O</text>
      
      <!-- Marcações intermediárias -->
      <text x="148" y="42" text-anchor="middle" class="cardinal-point-small" font-size="10">NE</text>
      <text x="158" y="158" text-anchor="middle" class="cardinal-point-small" font-size="10">SE</text>
      <text x="52" y="158" text-anchor="middle" class="cardinal-point-small" font-size="10">SO</text>
      <text x="42" y="42" text-anchor="middle" class="cardinal-point-small" font-size="10">NO</text>
      
      <!-- Seta indicadora de direção (rotaciona conforme windDirection) -->
      <g
        :transform="`rotate(${windDirection || 0} 100 100)`"
        class="wind-arrow"
      >
        <!-- Corpo da seta -->
        <path
          d="M 100 40 L 105 90 L 100 85 L 95 90 Z"
          fill="#ef4444"
          stroke="#dc2626"
          stroke-width="1"
        />
        <!-- Ponta da seta -->
        <path
          d="M 100 30 L 110 45 L 100 40 L 90 45 Z"
          fill="#dc2626"
        />
        <!-- Cauda -->
        <circle cx="100" cy="95" r="5" fill="#dc2626" opacity="0.6"/>
      </g>
      
      <!-- Centro -->
      <circle cx="100" cy="100" r="3" fill="currentColor" opacity="0.5"/>
    </svg>
    
    <!-- Velocidade do vento -->
    <div class="wind-speed">
      <span class="wind-speed-value">{{ windSpeed.toFixed(1) }}</span>
      <span class="wind-speed-unit">km/h</span>
    </div>
    
    <!-- Direção em texto -->
    <div v-if="windDirection !== undefined" class="wind-direction-text">
      {{ getDirectionName(windDirection) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

interface Props {
  windSpeed: number;
  windDirection?: number; // Graus 0-360
}

const props = withDefaults(defineProps<Props>(), {
  windDirection: 0,
});

onMounted(() => {
  console.log('[WindCompass] Mounted with:', {
    windSpeed: props.windSpeed,
    windDirection: props.windDirection
  });
});

/**
 * Converte direção em graus para nome cardinal
 */
const getDirectionName = (degrees: number): string => {
  const normalized = ((degrees % 360) + 360) % 360;
  
  if (normalized >= 337.5 || normalized < 22.5) return 'Norte';
  if (normalized >= 22.5 && normalized < 67.5) return 'Nordeste';
  if (normalized >= 67.5 && normalized < 112.5) return 'Leste';
  if (normalized >= 112.5 && normalized < 157.5) return 'Sudeste';
  if (normalized >= 157.5 && normalized < 202.5) return 'Sul';
  if (normalized >= 202.5 && normalized < 247.5) return 'Sudoeste';
  if (normalized >= 247.5 && normalized < 292.5) return 'Oeste';
  return 'Noroeste';
};
</script>

<style scoped lang="scss">
@use '../styles/abstracts/colors' as *;
@use '../styles/abstracts/variables' as *;
@use '../styles/abstracts/mixins' as *;
@use '../styles/abstracts/breakpoints' as *;

.wind-compass {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-lg;
  padding: $spacing-xl;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 255, 0.98) 100%
  );
  border-radius: $radius-xl;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.12);
  border: 2px solid rgba(139, 157, 225, 0.2);
  min-width: 240px;
  position: relative;
  transition: all $transition-normal;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.18);
    border-color: rgba(102, 126, 234, 0.3);
  }
  
  @include md {
    min-width: 200px;
    padding: $spacing-lg;
    gap: $spacing-md;
  }
}

.compass-svg {
  width: 100%;
  max-width: 240px;
  height: auto;
  color: $text-dark;
  
  @include md {
    max-width: 200px;
  }
}

.cardinal-point {
  font-size: 18px;
  fill: rgba(102, 126, 234, 0.8);
  font-weight: $font-bold;
  
  @include md {
    font-size: 16px;
  }
}

.cardinal-n {
  fill: rgba(102, 126, 234, 0.95);
}

.cardinal-point-small {
  fill: $text-dark;
  opacity: 0.6;
  font-size: 10px;
}

.wind-arrow {
  transition: transform 0.5s ease-out;
  transform-origin: center;
}

.wind-speed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  margin-top: -$spacing-sm;
}

.wind-speed-value {
  font-size: $font-5xl;
  font-weight: $font-extrabold;
  @include text-gradient;
  line-height: 1;
  
  @include md {
    font-size: $font-4xl;
  }
}

.wind-speed-unit {
  font-size: $font-sm;
  font-weight: $font-semibold;
  color: $text-dark;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: $letter-spacing-wide;
  
  @include md {
    font-size: $font-xs;
  }
}

.wind-direction-text {
  font-size: $font-base;
  font-weight: $font-semibold;
  color: $text-dark;
  opacity: 0.8;
  text-align: center;
  
  @include md {
    font-size: $font-sm;
  }
}
</style>
