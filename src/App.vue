<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DiscreteAdPopup from './components/DiscreteAdPopup.vue';

// Controle do popup de anúncio discreto
const showDiscreteAd = ref(false);

// ID do placement Ezoic - ID real do dashboard
const AD_PLACEMENT_ID = 111;

// Delay antes de mostrar o popup (2 minutos = 120000ms)
const POPUP_DELAY = 120000; // 2 minutos

onMounted(() => {
  // Aguarda 2 minutos antes de tentar mostrar o popup
  setTimeout(() => {
    showDiscreteAd.value = true;
  }, POPUP_DELAY);
});

/**
 * Handler quando o popup é fechado
 */
const handlePopupClose = () => {
  showDiscreteAd.value = false;
};
</script>

<template>
  <router-view />
  
  <!-- Popup discreto de anúncio (só aparece se tiver conteúdo) -->
  <DiscreteAdPopup 
    v-model="showDiscreteAd"
    :placement-id="AD_PLACEMENT_ID"
    @close="handlePopupClose"
  />
</template>
