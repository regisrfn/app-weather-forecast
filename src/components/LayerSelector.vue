<template>
  <div class="layer-selector" ref="selectorRef">
    <button
      type="button"
      class="layer-selector__trigger"
      @click="toggleDropdown"
      :class="{ 'layer-selector__trigger--open': isOpen }"
    >
      <div class="layer-selector__trigger-content">
        <component :is="currentLayerIcon" class="layer-selector__icon" />
        <span class="layer-selector__label">{{ currentLayerLabel }}</span>
      </div>
      <svg
        class="layer-selector__chevron"
        :class="{ 'layer-selector__chevron--rotated': isOpen }"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <Transition name="layer-selector-dropdown">
      <div 
        v-if="isOpen" 
        class="layer-selector__dropdown"
      >
        <button
          v-for="layer in layers"
          :key="layer.value"
          type="button"
          class="layer-selector__item"
          :class="{ 'layer-selector__item--active': modelValue === layer.value }"
          @click="selectLayer(layer.value)"
        >
          <component :is="layer.icon" class="layer-selector__item-icon" />
          <span class="layer-selector__item-label">{{ layer.label }}</span>
          <svg
            v-if="modelValue === layer.value"
            class="layer-selector__check-icon"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
          >
            <path d="M3.75 9L7.5 12.75L14.25 5.25" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

type LayerType = 'rain' | 'alerts' | 'temperature' | 'wind' | 'accumulation';

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

const AccumulationIcon = {
  template: `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 2C10 2 5 8 5 11.5C5 14.538 7.239 17 10 17C12.761 17 15 14.538 15 11.5C15 8 10 2 10 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M8.5 11.5C8.5 12.88 9.62 14 11 14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `
};

const layers = [
  { value: 'rain' as LayerType, label: 'Chuva', icon: RainIcon },
  { value: 'accumulation' as LayerType, label: 'Chuva acumulada', icon: AccumulationIcon },
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

const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
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

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>
