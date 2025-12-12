<template>
  <div class="layer-selector" ref="selectorRef">
    <button
      type="button"
      class="selector-trigger"
      @click="toggleDropdown"
      :class="{ 'is-open': isOpen }"
    >
      <div class="trigger-content">
        <component :is="currentLayerIcon" class="layer-icon" />
        <span class="layer-label">{{ currentLayerLabel }}</span>
      </div>
      <svg class="chevron-icon" :class="{ 'is-rotated': isOpen }" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <Transition name="dropdown">
      <div 
        v-if="isOpen" 
        class="dropdown-menu"
        :style="dropdownPosition"
      >
        <button
          v-for="layer in layers"
          :key="layer.value"
          type="button"
          class="dropdown-item"
          :class="{ 'is-active': modelValue === layer.value }"
          @click="selectLayer(layer.value)"
        >
          <component :is="layer.icon" class="layer-icon" />
          <span class="layer-label">{{ layer.label }}</span>
          <svg v-if="modelValue === layer.value" class="check-icon" width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M3.75 9L7.5 12.75L14.25 5.25" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

type LayerType = 'rain' | 'alerts' | 'temperature' | 'wind';

interface Props {
  modelValue: LayerType;
}

interface Emits {
  (e: 'update:modelValue', value: LayerType): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isOpen = ref(false);
const selectorRef = ref<HTMLElement | null>(null);
const dropdownPosition = ref<Record<string, string>>({});

// Ícones SVG inline como componentes
const RainIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 11C3.567 11 2 9.433 2 7.5C2 5.567 3.567 4 5.5 4C5.672 4 5.842 4.013 6.008 4.038C6.566 2.272 8.154 1 10 1C12.21 1 14 2.79 14 5C14 5.34 13.958 5.67 13.88 5.985C15.72 6.269 17 7.848 17 9.75C17 11.821 15.321 13.5 13.25 13.5H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M7 15L6 17M10 14L9 16M13 15L12 17M8.5 18L7.5 20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `
};

const AlertIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 6.5V10.5M10 13.5H10.008M8.228 3.228L2.478 13.728C1.872 14.828 2.65 16.25 3.928 16.25H16.072C17.35 16.25 18.128 14.828 17.522 13.728L11.772 3.228C11.166 2.128 9.834 2.128 9.228 3.228H8.228Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `
};

const TemperatureIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 12.5V5M10 14.5C8.619 14.5 7.5 13.381 7.5 12V5C7.5 3.619 8.619 2.5 10 2.5C11.381 2.5 12.5 3.619 12.5 5V12C12.5 13.381 11.381 14.5 10 14.5ZM10 14.5C11.381 14.5 12.5 15.619 12.5 17C12.5 18.381 11.381 19.5 10 19.5C8.619 19.5 7.5 18.381 7.5 17C7.5 15.619 8.619 14.5 10 14.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `
};

const WindIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 8H9.5C10.88 8 12 6.88 12 5.5C12 4.12 10.88 3 9.5 3C8.612 3 7.843 3.52 7.455 4.273M2 12H13.5C14.88 12 16 13.12 16 14.5C16 15.88 14.88 17 13.5 17C12.612 17 11.843 16.48 11.455 15.727M2 16H7.5C8.328 16 9 15.328 9 14.5C9 13.672 8.328 13 7.5 13H5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `
};

const layers = [
  { value: 'rain' as LayerType, label: 'Chuva', icon: RainIcon },
  { value: 'alerts' as LayerType, label: 'Alertas', icon: AlertIcon },
  { value: 'temperature' as LayerType, label: 'Temperatura', icon: TemperatureIcon },
  { value: 'wind' as LayerType, label: 'Vento', icon: WindIcon },
];

const currentLayerLabel = computed(() => {
  return layers.find(l => l.value === props.modelValue)?.label || 'Camada';
});

const currentLayerIcon = computed(() => {
  return layers.find(l => l.value === props.modelValue)?.icon || RainIcon;
});

const updateDropdownPosition = () => {
  if (!selectorRef.value) return;
  
  const rect = selectorRef.value.getBoundingClientRect();
  dropdownPosition.value = {
    top: `${rect.bottom + 6}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
  };
};

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    updateDropdownPosition();
  }
};

const selectLayer = (value: LayerType) => {
  emit('update:modelValue', value);
  isOpen.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (selectorRef.value && !selectorRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

const handleScroll = () => {
  if (isOpen.value) {
    updateDropdownPosition();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('scroll', handleScroll, true);
  window.addEventListener('resize', handleScroll);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('scroll', handleScroll, true);
  window.removeEventListener('resize', handleScroll);
});
</script>

<style scoped lang="scss">
@use '../styles/abstracts/colors' as *;
@use '../styles/abstracts/variables' as *;
@use '../styles/abstracts/mixins' as *;

.layer-selector {
  position: relative;
  min-width: 160px;
}

.selector-trigger {
  @include reset-button;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-sm;
  padding: 0.55rem 0.85rem;
  background: linear-gradient(135deg, rgba(88, 177, 255, 0.04), rgba(139, 211, 255, 0.02)), var(--home-control-strong);
  border: 1px solid var(--home-control-border);
  border-radius: $radius-md;
  color: var(--home-text-strong);
  font-weight: $font-semibold;
  font-size: $font-sm;
  cursor: pointer;
  transition: all $transition-fast;
  box-shadow: var(--home-shadow-soft);
  backdrop-filter: blur(12px);

  &:hover {
    background: linear-gradient(135deg, rgba(88, 177, 255, 0.08), rgba(139, 211, 255, 0.04)), var(--home-control-strong);
    border-color: var(--home-border-strong);
    transform: translateY(-1px);
    box-shadow: var(--home-shadow-strong);
  }

  &:active {
    transform: scale(0.98);
  }

  &.is-open {
    border-color: var(--home-accent);
    box-shadow: 0 0 0 3px var(--home-glow), var(--home-shadow-strong);
  }
}

.trigger-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-xs;
  flex: 1;
}

.layer-icon {
  flex-shrink: 0;
  color: var(--home-accent);
  transition: transform $transition-fast;

  .selector-trigger:hover & {
    transform: scale(1.1);
  }
}

.layer-label {
  font-size: $font-sm;
  line-height: 1;
}

.chevron-icon {
  flex-shrink: 0;
  color: var(--home-text-muted);
  transition: transform $transition-normal;

  &.is-rotated {
    transform: rotate(180deg);
  }
}

.dropdown-menu {
  position: fixed;
  background: var(--home-surface-strong);
  border: 1px solid var(--home-border-strong);
  border-radius: $radius-md;
  box-shadow: var(--home-shadow-strong);
  overflow: hidden;
  z-index: 1050;
  backdrop-filter: blur(16px);
  min-width: 160px;
}

.dropdown-item {
  @include reset-button;
  width: 100%;
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: 0.65rem 0.85rem;
  color: var(--home-text-strong);
  font-size: $font-sm;
  font-weight: $font-semibold;
  cursor: pointer;
  transition: all $transition-fast;
  border-bottom: 1px solid var(--home-border-soft);

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--home-control-hover);
    padding-left: 1rem;

    .layer-icon {
      transform: scale(1.15);
    }
  }

  &:active {
    background: var(--home-control-hover);
    transform: scale(0.98);
  }

  &.is-active {
    background: linear-gradient(90deg, var(--home-glow), transparent);
    color: var(--home-accent);

    .layer-icon {
      color: var(--home-accent);
    }
  }

  .layer-icon {
    flex-shrink: 0;
    transition: all $transition-fast;
  }

  .layer-label {
    flex: 1;
    text-align: left;
  }

  .check-icon {
    flex-shrink: 0;
    color: var(--home-accent);
  }
}

// Animações do dropdown
.dropdown-enter-active {
  animation: dropdown-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dropdown-leave-active {
  animation: dropdown-out 0.15s ease-in;
}

@keyframes dropdown-in {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dropdown-out {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
}
</style>
