<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { componentLogger } from '../utils/logger';

const logger = componentLogger('AdUnit');

interface Props {
  slotId: string;
  format?: 'auto' | 'horizontal' | 'rectangle';
  label?: string;
  closeable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  format: 'auto',
  label: 'Publicidade',
  closeable: false
});

const adContainer = ref<HTMLElement | null>(null);
const isVisible = ref(false);
const observer = ref<IntersectionObserver | null>(null);
const showContainer = ref(false); // Oculto por padrão - só mostra quando carregar anúncio
const isClosed = ref(false);

/**
 * Verifica se o anúncio foi fechado anteriormente
 */
const checkIfClosed = () => {
  if (props.closeable) {
    const closedKey = `ad-closed-${props.slotId}`;
    const closedTimestamp = sessionStorage.getItem(closedKey);
    if (closedTimestamp) {
      isClosed.value = true;
      showContainer.value = false;
      logger.debug(`Anúncio foi fechado anteriormente: slot ${props.slotId}`);
    }
  }
};

/**
 * Fecha o anúncio e salva no sessionStorage
 */
const closeAd = () => {
  isClosed.value = true;
  showContainer.value = false;
  
  if (props.closeable) {
    const closedKey = `ad-closed-${props.slotId}`;
    sessionStorage.setItem(closedKey, Date.now().toString());
    logger.info(`Anúncio fechado manualmente: slot ${props.slotId}`);
  }
};

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
  checkIfClosed();
  
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
  <div v-show="showContainer && !isClosed" class="adsense-unit-container" ref="adContainer">
    <button 
      v-if="closeable" 
      class="adsense-close-btn" 
      @click="closeAd"
      aria-label="Fechar anúncio"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
      </svg>
    </button>
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
