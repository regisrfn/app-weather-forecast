<template>
  <Transition name="modal">
    <div v-if="isOpen" class="search-modal-overlay" @click="closeModal">
      <div class="search-modal" @click.stop>
        <div class="search-modal-header">
          <h2 class="search-modal-title">Pesquisar Cidade</h2>
          <button @click="closeModal" class="search-close-btn" aria-label="Fechar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="search-input-container">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Digite o nome da cidade..."
            class="search-input"
            @input="handleSearchInput"
          />
          <button v-if="searchQuery" @click="clearSearch" class="search-clear-btn" aria-label="Limpar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="search-results">
          <div v-if="isSearching" class="search-loading">
            <div class="search-spinner"></div>
            <span>Buscando...</span>
          </div>
          <div v-else-if="searchQuery && filteredCities.length === 0" class="search-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
              <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p>Nenhuma cidade encontrada</p>
          </div>
          <div v-else-if="!searchQuery" class="search-hint">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 16v-4m0-4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p>Digite o nome de uma cidade para pesquisar</p>
          </div>
          <div v-else class="search-results-list">
            <button
              v-for="city in filteredCities"
              :key="city.id"
              @click="selectCity(city)"
              class="search-result-item"
            >
              <div class="result-city-info">
                <span class="result-city-name">{{ city.name }}</span>
                <span class="result-city-state">{{ city.state_name }} ({{ city.state }})</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="result-arrow">
                <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { searchMunicipalities } from '../utils/citySearch';
import type { Municipality } from '../types/municipality';

interface Props {
  isOpen: boolean;
  municipalities: Municipality[];
}

interface Emits {
  (e: 'close'): void;
  (e: 'select', city: Municipality): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const searchQuery = ref('');
const searchInputRef = ref<HTMLInputElement | null>(null);
const isSearching = ref(false);
const filteredCities = ref<Municipality[]>([]);

/**
 * Filtra cidades conforme digitação
 */
const handleSearchInput = () => {
  isSearching.value = true;
  
  // Debounce simples
  setTimeout(() => {
    filteredCities.value = searchMunicipalities(props.municipalities, searchQuery.value);
    isSearching.value = false;
  }, 150);
};

/**
 * Seleciona uma cidade
 */
const selectCity = (city: Municipality) => {
  emit('select', city);
  closeModal();
};

/**
 * Fecha modal
 */
const closeModal = () => {
  searchQuery.value = '';
  filteredCities.value = [];
  emit('close');
};

/**
 * Limpa campo de pesquisa
 */
const clearSearch = () => {
  searchQuery.value = '';
  filteredCities.value = [];
  searchInputRef.value?.focus();
};

/**
 * Foca no input quando abre
 */
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    await nextTick();
    searchInputRef.value?.focus();
  }
});
</script>
