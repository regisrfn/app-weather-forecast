<template>
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="isVisible" class="discrete-ad-popup" role="complementary" aria-label="Anúncio">
        <button 
          class="discrete-ad-close" 
          @click="handleClose"
          aria-label="Fechar anúncio"
          title="Fechar"
        >
          ×
        </button>
        
        <div class="discrete-ad-content">
          <!-- Placeholder para o anúncio Ezoic -->
          <div :id="`ezoic-pub-ad-placeholder-${placementId}`" class="discrete-ad-placeholder"></div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from 'vue';
import { componentLogger } from '../utils/logger';

const logger = componentLogger('DiscreteAdPopup');

interface Props {
  /** ID do placement do Ezoic (ex: 111) */
  placementId: number;
  /** Controla visibilidade do popup */
  modelValue: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isVisible = ref(false);
const adLoaded = ref(false);

// Sincroniza com v-model
watch(() => props.modelValue, async (newValue) => {
  if (newValue) {
    await loadAd();
    
    // Só mostra o popup se o anúncio carregar
    if (adLoaded.value) {
      isVisible.value = true;
      logger.info('Popup discreto exibido com anúncio');
    } else {
      logger.info('Anúncio não carregado. Popup não será exibido.');
      emit('update:modelValue', false);
    }
  } else {
    isVisible.value = false;
  }
});

/**
 * Carrega o anúncio Ezoic e verifica se foi carregado
 */
const loadAd = async (): Promise<void> => {
  await nextTick();
  
  try {
    // Verifica se o script Ezoic está disponível
    if (typeof window.ezstandalone !== 'undefined' && window.ezstandalone.cmd) {
      const placeholderId = `ezoic-pub-ad-placeholder-${props.placementId}`;
      
      // Carrega o anúncio
      window.ezstandalone.cmd.push(() => {
        window.ezstandalone.showAds(props.placementId);
      });
      
      // Aguarda um tempo para verificar se o anúncio carregou
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verifica se o placeholder tem conteúdo (anúncio carregado)
      const placeholder = document.getElementById(placeholderId);
      if (placeholder && placeholder.children.length > 0) {
        adLoaded.value = true;
        logger.info(`Anúncio carregado: placement ${props.placementId}`);
      } else {
        adLoaded.value = false;
        logger.debug(`Anúncio não carregado ou vazio: placement ${props.placementId}`);
      }
    } else {
      logger.warn('Ezoic script não disponível');
      adLoaded.value = false;
    }
  } catch (error) {
    logger.error('Erro ao carregar anúncio:', error);
    adLoaded.value = false;
  }
};

/**
 * Fecha o popup
 */
const handleClose = () => {
  isVisible.value = false;
  emit('update:modelValue', false);
  emit('close');
};

/**
 * Fecha popup com tecla ESC
 */
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isVisible.value) {
    handleClose();
  }
};

// Adiciona listener para ESC
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleKeydown);
}

// Remove listener ao desmontar
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown);
  }
});

// Tipo para o objeto global Ezoic
declare global {
  interface Window {
    ezstandalone: {
      cmd: Array<() => void>;
      showAds: (...placementIds: number[]) => void;
    };
  }
}
</script>

<style scoped>
/* Estilos básicos inline - estilos completos em _discrete-ad-popup.scss */
.discrete-ad-popup {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 9999;
}

.discrete-ad-close {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  cursor: pointer;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  padding: 0.25rem 0.5rem;
}

.discrete-ad-content {
  padding: 0.5rem;
}

/* Animação de slide up */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.4s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
