<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen" class="modal-overlay" @click="closeModal">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">Previsão Hora a Hora ({{ hourlyForecasts.length }}h)</h3>
            <button class="close-button" @click="closeModal" aria-label="Fechar">
              <span>✕</span>
            </button>
          </div>
          <div class="modal-body">
            <HourlyChart :hourly-forecasts="hourlyForecasts" :max-hours="hourlyForecasts.length" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import HourlyChart from './HourlyChart.vue';
import type { HourlyForecast } from '../types/weather';

interface Props {
  isOpen: boolean;
  hourlyForecasts: HourlyForecast[];
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

<style scoped lang="scss">
@use '../styles/abstracts/variables' as *;
@use '../styles/abstracts/breakpoints' as *;

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 0;
  
  @include min-md {
    display: none !important; // Esconder em telas >= 769px (desktop/tablet)
  }
}

.modal-container {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 255, 0.98) 100%
  );
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  // Portrait: rotacionar tudo 90 graus
  @include portrait {
    transform: rotate(90deg);
    transform-origin: center center;
    width: calc(100vh - 40px); // Margem de segurança
    height: calc(100vw - 40px);
    position: fixed;
    left: 50%;
    top: 50%;
    margin-left: calc(-50vh + 20px);
    margin-top: calc(-50vw + 20px);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-sm $spacing-md;
  border-bottom: 2px solid rgba(139, 157, 225, 0.2);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  flex-shrink: 0;
  min-height: 56px;
  gap: $spacing-sm;
  
  @include landscape {
    padding: $spacing-md $spacing-lg;
    min-height: 64px;
  }
}

.modal-title {
  font-size: 14px;
  font-weight: $font-bold;
  color: #667eea;
  margin: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  @include landscape {
    font-size: $font-lg;
  }
}

.close-button {
  background: rgba(139, 157, 225, 0.15);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  z-index: 10;
  
  span {
    font-size: 22px;
    color: #667eea;
    font-weight: bold;
    line-height: 1;
  }
  
  &:active {
    transform: scale(0.95);
    background: rgba(139, 157, 225, 0.25);
  }
}

.modal-body {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  padding: $spacing-xs;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
  
  :deep(.hourly-chart) {
    height: 100%;
    width: 100%;
  }
  
  :deep(.chart-title) {
    display: none;
  }
  
  // Portrait (vertical) - rotacionado para horizontal
  @include portrait {
    :deep(.chart-container) {
      height: 100%;
      width: 100%;
      min-width: unset;
      margin: 0;
      padding: $spacing-xs;
      overflow-x: auto;
      overflow-y: hidden;
      
      canvas {
        width: 100% !important;
        height: 100% !important;
        max-height: calc(100vh - 60px);
      }
    }
  }
  
  // Landscape (horizontal) - exibição normal
  @include landscape {
    padding: $spacing-sm;
    
    :deep(.chart-container) {
      height: 100%;
      width: 100%;
      min-width: unset;
      margin: 0;
      padding: $spacing-xs;
      overflow-x: auto;
      overflow-y: hidden;
      
      canvas {
        width: 100% !important;
        height: 100% !important;
      }
    }
  }
}

// Animações
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: translateY(100%);
}

// Dark mode support
[data-theme="dark"] {
  .modal-container {
    background: linear-gradient(135deg, 
      rgba(30, 41, 59, 0.98) 0%,
      rgba(51, 65, 85, 0.98) 100%
    );
  }

  .modal-header {
    background: rgba(30, 41, 59, 0.95);
    border-bottom-color: rgba(71, 85, 105, 0.4);
  }

  .modal-title {
    color: var(--weather-primary);
  }

  .close-button {
    background: rgba(71, 85, 105, 0.3);
    
    span {
      color: var(--weather-primary);
    }
    
    &:hover {
      background: rgba(71, 85, 105, 0.5);
    }
  }
}
</style>
