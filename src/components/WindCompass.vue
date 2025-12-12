<template>
  <div class="wind-compass">
    <svg
      viewBox="0 0 200 200"
      class="wind-compass__svg"
      role="img"
      :aria-label="`Bússola indicando vento soprando para ${Math.round(displayedDirection)}° a ${windSpeed.toFixed(1)} km/h`"
    >
      <!-- Definições de gradientes -->
      <defs>
        <!-- Gradiente metálico do anel -->
        <radialGradient id="metalGradient" cx="50%" cy="30%">
          <stop offset="0%" style="stop-color:#f1f5f9;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#cbd5e1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#94a3b8;stop-opacity:1" />
        </radialGradient>
        
        <!-- Gradiente do fundo -->
        <radialGradient id="backgroundGradient" cx="50%" cy="50%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
          <stop offset="50%" style="stop-color:#f8faff;stop-opacity:0.95" />
          <stop offset="100%" style="stop-color:#f0f4ff;stop-opacity:0.9" />
        </radialGradient>

        <!-- Sombra interna -->
        <radialGradient id="innerShadow" cx="50%" cy="50%">
          <stop offset="80%" style="stop-color:#000000;stop-opacity:0" />
          <stop offset="100%" style="stop-color:#000000;stop-opacity:0.1" />
        </radialGradient>
      </defs>

      <!-- Fundo do disco -->
      <circle cx="100" cy="100" r="90" fill="url(#backgroundGradient)" />
      
      <!-- Anel externo metálico -->
      <circle
        cx="100"
        cy="100"
        r="92"
        fill="none"
        stroke="url(#metalGradient)"
        stroke-width="6"
        opacity="0.9"
      />
      
      <!-- Círculos concêntricos -->
      <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" stroke-width="1" opacity="0.15" />
      <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" stroke-width="1" opacity="0.12" />
      <circle cx="100" cy="100" r="45" fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.10" />
      <circle cx="100" cy="100" r="30" fill="none" stroke="currentColor" stroke-width="0.6" opacity="0.08" />
      
      <!-- Marcações de graus a cada 30° -->
      <g class="wind-compass__degree-marks" opacity="0.3">
        <line x1="100" y1="15" x2="100" y2="25" stroke="currentColor" stroke-width="2" />
        <line x1="143.3" y1="25" x2="138.3" y2="32.68" stroke="currentColor" stroke-width="1.5" />
        <line x1="175" y1="56.7" x2="167.32" y2="61.7" stroke="currentColor" stroke-width="1.5" />
        <line x1="185" y1="100" x2="175" y2="100" stroke="currentColor" stroke-width="2" />
        <line x1="175" y1="143.3" x2="167.32" y2="138.3" stroke="currentColor" stroke-width="1.5" />
        <line x1="143.3" y1="175" x2="138.3" y2="167.32" stroke="currentColor" stroke-width="1.5" />
        <line x1="100" y1="185" x2="100" y2="175" stroke="currentColor" stroke-width="2" />
        <line x1="56.7" y1="175" x2="61.7" y2="167.32" stroke="currentColor" stroke-width="1.5" />
        <line x1="25" y1="143.3" x2="32.68" y2="138.3" stroke="currentColor" stroke-width="1.5" />
        <line x1="15" y1="100" x2="25" y2="100" stroke="currentColor" stroke-width="2" />
        <line x1="25" y1="56.7" x2="32.68" y2="61.7" stroke="currentColor" stroke-width="1.5" />
        <line x1="56.7" y1="25" x2="61.7" y2="32.68" stroke="currentColor" stroke-width="1.5" />
      </g>
      
      <!-- Pontos cardeais -->
      <text x="100" y="35" text-anchor="middle" class="wind-compass__cardinal wind-compass__cardinal--north" font-size="20" font-weight="bold">N</text>
      <text x="165" y="108" text-anchor="middle" class="wind-compass__cardinal" font-size="16" font-weight="600">L</text>
      <text x="100" y="175" text-anchor="middle" class="wind-compass__cardinal" font-size="16" font-weight="600">S</text>
      <text x="35" y="108" text-anchor="middle" class="wind-compass__cardinal" font-size="16" font-weight="600">O</text>
      
      <!-- Seta indicadora com animação de oscilação -->
      <g
        class="wind-compass__arrow"
        :style="`--wind-direction: ${displayedDirection}deg`"
      >
        <!-- Sombra da seta -->
        <path d="M 101.5 35 L 108 88 L 101.5 84 L 95 88 Z" fill="rgba(0, 0, 0, 0.25)" />
        
        <!-- Corpo principal da seta -->
        <path d="M 100 30 L 108 88 L 100 84 L 92 88 Z" fill="#ef4444" stroke="#dc2626" stroke-width="2" stroke-linejoin="round" />
        
        <!-- Ponta afiada -->
        <path d="M 100 20 L 112 36 L 100 30 L 88 36 Z" fill="#b91c1c" stroke="#991b1b" stroke-width="1.5" stroke-linejoin="round" />
        
        <!-- Destaque na ponta -->
        <path d="M 100 20 L 106 28 L 100 25 L 94 28 Z" fill="#fca5a5" opacity="0.9" />
        
        <!-- Base circular -->
        <circle cx="100" cy="90" r="8" fill="#dc2626" stroke="#991b1b" stroke-width="1.5" />
        <circle cx="100" cy="88" r="5" fill="#ef4444" opacity="0.8" />
      </g>
      
      <!-- Centro com brilho -->
      <circle cx="100" cy="100" r="4" fill="currentColor" opacity="0.6" />
      <circle cx="100" cy="100" r="2" fill="#ffffff" opacity="0.9" />
      
      <!-- Sombra interna do disco -->
      <circle cx="100" cy="100" r="90" fill="url(#innerShadow)" />
      
      <!-- Efeito de vidro/brilho -->
      <ellipse cx="100" cy="50" rx="60" ry="30" fill="rgba(255, 255, 255, 0.15)" />
    </svg>
    
    <!-- Velocidade do vento -->
    <div class="wind-compass__speed">
      <span class="wind-compass__speed-value">{{ windSpeed.toFixed(1) }}</span>
      <span class="wind-compass__speed-unit">km/h</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';

interface Props {
  windSpeed: number;
  windDirection?: number; // Graus 0-360
}

const props = withDefaults(defineProps<Props>(), {
  windDirection: 0,
});

// UI mostra a direção para onde o vento sopra (origem + 180°)
const displayedDirection = computed(() => ((props.windDirection ?? 0) + 180) % 360);

onMounted(() => {
  console.log('[WindCompass] Mounted with:', {
    windSpeed: props.windSpeed,
    windDirection: props.windDirection
  });
});
</script>
