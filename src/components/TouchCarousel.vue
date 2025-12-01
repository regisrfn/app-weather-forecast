<template>
  <div class="touch-carousel">
    <div 
      ref="carouselTrack"
      class="carousel-track"
      @mousedown="handleDragStart"
      @mousemove="handleDragMove"
      @mouseup="handleDragEnd"
      @mouseleave="handleDragEnd"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      :style="trackStyle"
    >
      <slot></slot>
    </div>
    
    <!-- Navigation Buttons -->
    <button 
      v-if="showNavigation && canScrollLeft"
      class="carousel-nav prev"
      @click="scrollPrev"
      aria-label="Anterior"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    
    <button 
      v-if="showNavigation && canScrollRight"
      class="carousel-nav next"
      @click="scrollNext"
      aria-label="Próximo"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    
    <!-- Pagination Dots -->
    <div v-if="showPagination" class="carousel-pagination">
      <button
        v-for="(_, index) in totalSlides"
        :key="index"
        class="pagination-dot"
        :class="{ active: index === currentSlide }"
        @click="goToSlide(index)"
        :aria-label="`Ir para slide ${index + 1}`"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

interface Props {
  slidesPerView?: number;
  spaceBetween?: number;
  showNavigation?: boolean;
  showPagination?: boolean;
  breakpoints?: {
    [key: number]: {
      slidesPerView: number;
      spaceBetween?: number;
    };
  };
}

const props = withDefaults(defineProps<Props>(), {
  slidesPerView: 1,
  spaceBetween: 16,
  showNavigation: true,
  showPagination: true,
  breakpoints: () => ({})
});

const emit = defineEmits<{
  slideChange: [index: number];
}>();

const carouselTrack = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const startX = ref(0);
const currentTranslate = ref(0);
const prevTranslate = ref(0);
const currentSlide = ref(0);
const totalSlides = ref(0);
const slideWidth = ref(0);
const currentSlidesPerView = ref(props.slidesPerView);
const currentSpaceBetween = ref(props.spaceBetween);

const canScrollLeft = computed(() => currentSlide.value > 0);
const canScrollRight = computed(() => {
  return currentSlide.value < totalSlides.value - currentSlidesPerView.value;
});

const trackStyle = computed(() => ({
  transform: `translateX(${currentTranslate.value}px)`,
  transition: isDragging.value ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  gap: `${currentSpaceBetween.value}px`
}));

const calculateResponsiveSettings = () => {
  const width = window.innerWidth;
  const breakpointKeys = Object.keys(props.breakpoints).map(Number).sort((a, b) => b - a);
  
  for (const breakpoint of breakpointKeys) {
    if (width >= breakpoint) {
      const settings = props.breakpoints[breakpoint];
      if (settings) {
        currentSlidesPerView.value = settings.slidesPerView;
        currentSpaceBetween.value = settings.spaceBetween ?? props.spaceBetween;
      }
      return;
    }
  }
  
  currentSlidesPerView.value = props.slidesPerView;
  currentSpaceBetween.value = props.spaceBetween;
};

const calculateDimensions = () => {
  if (!carouselTrack.value) return;
  
  const slides = carouselTrack.value.children;
  totalSlides.value = slides.length;
  
  if (totalSlides.value === 0) return;
  
  const trackWidth = carouselTrack.value.offsetWidth;
  const totalSpacing = currentSpaceBetween.value * (currentSlidesPerView.value - 1);
  slideWidth.value = (trackWidth - totalSpacing) / currentSlidesPerView.value;
  
  // Set width for each slide
  Array.from(slides).forEach((slide) => {
    (slide as HTMLElement).style.minWidth = `${slideWidth.value}px`;
    (slide as HTMLElement).style.maxWidth = `${slideWidth.value}px`;
  });
  
  updateTranslate();
};

const updateTranslate = () => {
  const offset = currentSlide.value * (slideWidth.value + currentSpaceBetween.value);
  currentTranslate.value = -offset;
  prevTranslate.value = currentTranslate.value;
};

const goToSlide = (index: number) => {
  const maxSlide = Math.max(0, totalSlides.value - currentSlidesPerView.value);
  currentSlide.value = Math.max(0, Math.min(index, maxSlide));
  updateTranslate();
  emit('slideChange', currentSlide.value);
};

const scrollPrev = () => {
  goToSlide(currentSlide.value - 1);
};

const scrollNext = () => {
  goToSlide(currentSlide.value + 1);
};

// Mouse events
const handleDragStart = (event: MouseEvent) => {
  isDragging.value = true;
  startX.value = event.clientX;
  if (carouselTrack.value) {
    carouselTrack.value.style.cursor = 'grabbing';
  }
};

const handleDragMove = (event: MouseEvent) => {
  if (!isDragging.value) return;
  
  const currentX = event.clientX;
  const diff = currentX - startX.value;
  currentTranslate.value = prevTranslate.value + diff;
};

const handleDragEnd = () => {
  if (!isDragging.value) return;
  
  isDragging.value = false;
  if (carouselTrack.value) {
    carouselTrack.value.style.cursor = 'grab';
  }
  
  const movedBy = currentTranslate.value - prevTranslate.value;
  const threshold = slideWidth.value * 0.2;
  
  if (movedBy < -threshold && canScrollRight.value) {
    scrollNext();
  } else if (movedBy > threshold && canScrollLeft.value) {
    scrollPrev();
  } else {
    updateTranslate();
  }
};

// Touch events
const handleTouchStart = (event: TouchEvent) => {
  const touch = event.touches?.[0];
  if (!touch) return;
  isDragging.value = true;
  startX.value = touch.clientX;
};

const handleTouchMove = (event: TouchEvent) => {
  if (!isDragging.value) return;
  const touch = event.touches?.[0];
  if (!touch) return;
  
  const currentX = touch.clientX;
  const diff = currentX - startX.value;
  currentTranslate.value = prevTranslate.value + diff;
};

const handleTouchEnd = () => {
  if (!isDragging.value) return;
  
  isDragging.value = false;
  
  const movedBy = currentTranslate.value - prevTranslate.value;
  const threshold = slideWidth.value * 0.2;
  
  if (movedBy < -threshold && canScrollRight.value) {
    scrollNext();
  } else if (movedBy > threshold && canScrollLeft.value) {
    scrollPrev();
  } else {
    updateTranslate();
  }
};

const handleResize = () => {
  calculateResponsiveSettings();
  calculateDimensions();
};

onMounted(() => {
  calculateResponsiveSettings();
  nextTick(() => {
    calculateDimensions();
  });
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

defineExpose({
  goToSlide,
  scrollNext,
  scrollPrev,
  currentSlide
});
</script>

<style scoped lang="scss">
@use '../styles/abstracts/colors' as *;
@use '../styles/abstracts/variables' as *;
@use '../styles/abstracts/mixins' as *;
@use '../styles/abstracts/breakpoints' as *;

.touch-carousel {
  position: relative;
  width: 100%;
  overflow: hidden;
  padding: $spacing-md 0 $spacing-2xl 0;
}

.carousel-track {
  display: flex;
  width: 100%;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  touch-action: pan-y;
  will-change: transform;
  
  &:active {
    cursor: grabbing;
  }
}

.carousel-nav {
  @include reset-button;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: $radius-full;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 2px solid rgba(139, 157, 225, 0.2);
  color: #8b9de1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all $transition-normal;
  box-shadow: 0 4px 16px rgba(139, 157, 225, 0.15);
  z-index: 10;
  
  &:hover {
    background: rgba(255, 255, 255, 1);
    border-color: #8b9de1;
    transform: translateY(-50%) scale(1.08);
    box-shadow: 0 6px 24px rgba(139, 157, 225, 0.25);
  }
  
  &:active {
    transform: translateY(-50%) scale(1.02);
  }
  
  &.prev {
    left: -24px;
    
    @include md {
      left: 4px;
    }
  }
  
  &.next {
    right: -24px;
    
    @include md {
      right: 4px;
    }
  }
  
  svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
  
  @include md {
    width: 40px;
    height: 40px;
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
}

.carousel-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $spacing-sm;
  margin-top: $spacing-lg;
  padding: $spacing-sm;
}

.pagination-dot {
  @include reset-button;
  width: 10px;
  height: 10px;
  border-radius: $radius-full;
  background: rgba(139, 157, 225, 0.3);
  border: none;
  cursor: pointer;
  transition: all $transition-fast;
  
  &:hover {
    background: rgba(139, 157, 225, 0.5);
    transform: scale(1.2);
  }
  
  &.active {
    background: #8b9de1;
    width: 28px;
    box-shadow: 0 2px 8px rgba(139, 157, 225, 0.4);
  }
}
</style>
