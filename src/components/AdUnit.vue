<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { componentLogger } from '../utils/logger';

const logger = componentLogger('AdUnit');

interface Props {
  slotId: string;
  format?: 'auto' | 'horizontal' | 'rectangle';
  label?: string;
}

const props = withDefaults(defineProps<Props>(), {
  format: 'auto',
  label: 'Publicidade'
});

const adContainer = ref<HTMLElement | null>(null);
const isVisible = ref(false);
const observer = ref<IntersectionObserver | null>(null);
const showContainer = ref(false);

/**
 * Inicializa o anúncio quando visível
 */
const initializeAd = () => {
  if (isVisible.value) return;
  
  try {
    // Push do AdSense
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    isVisible.value = true;
    logger.info(`Anúncio inicializado: slot ${props.slotId}`);
    
    // Verifica se o anúncio carregou
    setTimeout(() => {
      const insElement = adContainer.value?.querySelector('ins');
      const adStatus = insElement?.getAttribute('data-adsbygoogle-status');
      
      if (adStatus === 'filled') {
        showContainer.value = true;
        logger.debug(`Anúncio carregado com sucesso: slot ${props.slotId}`);
      } else {
        showContainer.value = false;
        logger.debug(`Nenhum anúncio disponível: slot ${props.slotId}`);
      }
    }, 1500);
  } catch (error) {
    logger.error('Erro ao inicializar anúncio:', error);
    showContainer.value = false;
  }
};

/**
 * Configura o IntersectionObserver para lazy loading
 */
onMounted(() => {
  if (!adContainer.value) return;

  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isVisible.value) {
          logger.debug(`Anúncio visível: slot ${props.slotId}`);
          initializeAd();
          // Desconecta após inicializar
          observer.value?.disconnect();
        }
      });
    },
    {
      threshold: 0.5, // 50% visível
      rootMargin: '50px' // Carrega 50px antes de ficar visível
    }
  );

  observer.value.observe(adContainer.value);
  logger.debug(`Observer configurado para slot ${props.slotId}`);
});

/**
 * Cleanup
 */
onBeforeUnmount(() => {
  if (observer.value) {
    observer.value.disconnect();
    logger.debug(`Observer desconectado: slot ${props.slotId}`);
  }
});
</script>

<template>
  <div v-show="showContainer" class="adsense-unit-container" ref="adContainer">
    <div class="adsense-label">{{ label }}</div>
    <ins
      class="adsbygoogle"
      style="display:block"
      data-ad-client="ca-pub-5677395868811418"
      :data-ad-slot="slotId"
      :data-ad-format="format"
      data-full-width-responsive="true"
    ></ins>
  </div>
</template>
