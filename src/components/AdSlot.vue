<template>
  <div
    v-if="shouldShowWrapper"
    class="ad-wrapper"
    :class="[`ad-wrapper--${variant}`, { 'ad-wrapper--loading': isLoading }]"
  >
    <p class="ad-wrapper__label">Publicidade</p>
    <div class="ad-wrapper__frame" :style="frameStyle">
      <ins
        v-if="isConfigured && currentSize"
        ref="adRef"
        :key="adKey"
        class="adsbygoogle"
        :style="insStyle"
        :data-ad-client="adClient"
        :data-ad-slot="resolvedSlotId"
      ></ins>

      <div v-else-if="showPlaceholder" class="ad-placeholder">
        Defina o <code>data-ad-slot</code> em <span>src/config/ads.ts</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { AdSize } from '../config/ads';
import { ADSENSE_CLIENT } from '../config/ads';

const props = withDefaults(defineProps<{
  /**
   * Lista de tamanhos ordenados por breakpoint
   */
  sizes: AdSize[];
  /**
   * Slot padrão (caso não seja definido no tamanho)
   */
  slotId?: string;
  /**
   * Variante visual (inline, sidebar)
   */
  variant?: 'inline' | 'sidebar' | 'stacked';
  /**
   * ID do cliente AdSense
   */
  adClient?: string;
}>(), {
  slotId: '',
  variant: 'inline',
  adClient: ADSENSE_CLIENT,
});

const adRef = ref<HTMLElement | null>(null);
const currentSize = ref<AdSize | null>(null);
const isMounted = ref(false);
const isLoading = ref(false);
const isDev = import.meta.env.DEV;

const sortedSizes = computed(() => [...props.sizes].sort((a, b) => b.minWidth - a.minWidth));

const resolvedSlotId = computed(() => currentSize.value?.slotId || props.slotId || '');
const isConfigured = computed(() => Boolean(resolvedSlotId.value && !resolvedSlotId.value.includes('REPLACE_WITH')));
const showPlaceholder = computed(() => isDev && !isConfigured.value);
const variant = computed(() => props.variant || 'inline');
const shouldShowWrapper = computed(() => isConfigured.value || showPlaceholder.value);

const adKey = computed(() => `${resolvedSlotId.value || 'slot'}-${currentSize.value?.width ?? 'auto'}x${currentSize.value?.height ?? 'auto'}`);

const frameStyle = computed(() => ({
  minHeight: currentSize.value ? `${currentSize.value.height}px` : undefined,
}));

const insStyle = computed(() => ({
  display: 'block',
  width: currentSize.value ? `${currentSize.value.width}px` : '100%',
  maxWidth: '100%',
  height: currentSize.value ? `${currentSize.value.height}px` : 'auto',
  margin: '0 auto',
}));

const pickSize = () => {
  if (typeof window === 'undefined' || sortedSizes.value.length === 0) return;
  const viewportWidth = window.innerWidth;
  const match = sortedSizes.value.find(size => viewportWidth >= size.minWidth) || sortedSizes.value[sortedSizes.value.length - 1] || null;
  currentSize.value = match;
};

const pushAdSense = async () => {
  if (!isConfigured.value || !currentSize.value) return;
  if (typeof window === 'undefined') return;

  await nextTick();
  if (!adRef.value) return;

  isLoading.value = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
  } catch (error) {
    console.warn('Falha ao carregar anúncio', error);
  } finally {
    isLoading.value = false;
  }
};

let resizeTimer: number | undefined;
const handleResize = () => {
  if (!isMounted.value) return;
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }
  resizeTimer = window.setTimeout(() => {
    const previousKey = adKey.value;
    pickSize();
    if (adKey.value !== previousKey) {
      pushAdSense();
    }
  }, 200);
};

onMounted(() => {
  isMounted.value = true;
  pickSize();
  pushAdSense();
  window.addEventListener('resize', handleResize, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

watch(adKey, (newValue, oldValue) => {
  if (!isMounted.value || newValue === oldValue) return;
  pushAdSense();
});
</script>
