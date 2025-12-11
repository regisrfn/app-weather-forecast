<template>
  <Teleport to="body">
    <div class="day-carousel-overlay" @click.self="$emit('close')">
      <div class="day-carousel-container">
      <div class="carousel-header">
        <h3>Selecione o dia</h3>
        <button class="close-btn" @click="$emit('close')" aria-label="Fechar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
          </svg>
        </button>
      </div>
      
      <div class="carousel-wrapper">
        <button 
          class="carousel-nav prev" 
          @click="scrollPrev"
          :disabled="canScrollLeft === false"
          aria-label="Anterior"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        <div class="carousel-track" ref="trackRef">
          <button
            v-for="day in days"
            :key="day.value"
            class="day-item"
            :class="{ 'selected': day.value === selectedDate }"
            @click="selectDay(day)"
          >
            <div class="day-label">{{ day.label }}</div>
            <div class="day-date">{{ day.date }}</div>
            <div class="day-month">{{ day.month }}</div>
          </button>
        </div>
        
        <button 
          class="carousel-nav next" 
          @click="scrollNext"
          :disabled="canScrollRight === false"
          aria-label="Próximo"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
      
      <div class="time-selector">
        <label for="time-input">Horário:</label>
        <input
          id="time-input"
          type="time"
          :value="selectedTime"
          @input="updateTime"
        />
      </div>
      
      <div class="carousel-footer">
        <button class="btn-secondary" @click="$emit('close')">
          Cancelar
        </button>
        <button class="btn-primary" @click="confirmSelection">
          Aplicar
        </button>
      </div>
    </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Day {
  label: string;
  date: string;
  month: string;
  value: string; // YYYY-MM-DD
  dayOfWeek: string;
}

const props = defineProps<{
  initialDate: string; // YYYY-MM-DD
  initialTime: string; // HH:MM
  maxDays?: number;
}>();

const emit = defineEmits<{
  close: [];
  select: [date: string, time: string];
}>();

const trackRef = ref<HTMLElement | null>(null);
const canScrollLeft = ref(false);
const canScrollRight = ref(true);
const selectedDate = ref(props.initialDate);
const selectedTime = ref(props.initialTime);

const days = computed<Day[]>(() => {
  const result: Day[] = [];
  const maxDays = props.maxDays || 6;
  
  // Obter data atual no timezone do Brasil
  const now = new Date();
  const brasilTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  
  for (let i = 0; i < maxDays; i++) {
    const date = new Date(brasilTime);
    date.setDate(date.getDate() + i);
    
    const dayOfWeek = date.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'America/Sao_Paulo' });
    const dayNumber = date.getDate();
    const month = date.toLocaleDateString('pt-BR', { month: 'short', timeZone: 'America/Sao_Paulo' });
    
    const year = date.getFullYear();
    const monthNum = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(dayNumber).padStart(2, '0');
    const value = `${year}-${monthNum}-${day}`;
    
    result.push({
      label: i === 0 ? 'Hoje' : i === 1 ? 'Amanhã' : dayOfWeek,
      date: String(dayNumber),
      month: month,
      value,
      dayOfWeek
    });
  }
  
  return result;
});

const selectDay = (day: Day) => {
  selectedDate.value = day.value;
};

const updateTime = (event: Event) => {
  const target = event.target as HTMLInputElement;
  selectedTime.value = target.value;
};

const confirmSelection = () => {
  emit('select', selectedDate.value, selectedTime.value);
  emit('close');
};

const scrollPrev = () => {
  if (trackRef.value) {
    const itemWidth = trackRef.value.querySelector('.day-item')?.clientWidth || 0;
    trackRef.value.scrollBy({ left: -(itemWidth + 16), behavior: 'smooth' });
  }
};

const scrollNext = () => {
  if (trackRef.value) {
    const itemWidth = trackRef.value.querySelector('.day-item')?.clientWidth || 0;
    trackRef.value.scrollBy({ left: itemWidth + 16, behavior: 'smooth' });
  }
};

const updateScrollButtons = () => {
  if (trackRef.value) {
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.value;
    canScrollLeft.value = scrollLeft > 0;
    canScrollRight.value = scrollLeft < scrollWidth - clientWidth - 5;
  }
};

onMounted(() => {
  if (trackRef.value) {
    trackRef.value.addEventListener('scroll', updateScrollButtons);
    updateScrollButtons();
    
    // Auto-scroll para o item selecionado
    const selectedItem = trackRef.value.querySelector('.day-item.selected') as HTMLElement;
    if (selectedItem) {
      selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }
});

onUnmounted(() => {
  if (trackRef.value) {
    trackRef.value.removeEventListener('scroll', updateScrollButtons);
  }
});
</script>
