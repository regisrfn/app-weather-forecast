<template>
  <div class="touch-carousel">
    <div 
      ref="carouselTrack"
      class="touch-carousel__track"
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
      class="touch-carousel__nav touch-carousel__nav--prev"
      @click="scrollPrev"
      aria-label="Anterior"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    
    <button 
      v-if="showNavigation && canScrollRight"
      class="touch-carousel__nav touch-carousel__nav--next"
      @click="scrollNext"
      aria-label="Próximo"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    
    <!-- Pagination Dots -->
    <div v-if="showPagination" class="touch-carousel__pagination">
      <button
        v-for="(_, index) in totalSlides"
        :key="index"
        class="touch-carousel__dot"
        :class="{ 'touch-carousel__dot--active': index === currentSlide }"
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
