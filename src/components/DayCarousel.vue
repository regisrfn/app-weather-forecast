<template>
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
  const maxDays = props.maxDays || 5;
  
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

<style scoped lang="scss">
.day-carousel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.day-carousel-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 90%;
  width: 600px;
  overflow: hidden;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.carousel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e8e8e8;
  
  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #2c3e50;
  }
  
  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #666;
    padding: 0.5rem;
    border-radius: 8px;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:hover {
      background: #f5f5f5;
      color: #2c3e50;
    }
  }
}

.carousel-wrapper {
  position: relative;
  padding: 2rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.carousel-nav {
  background: white;
  border: 2px solid #e8e8e8;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  margin: 0 0.5rem;
  
  &:hover:not(:disabled) {
    background: #667eea;
    border-color: #667eea;
    color: white;
    transform: scale(1.1);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}

.carousel-track {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 0 1rem;
  flex: 1;
  
  /* Hide scrollbar but keep functionality */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
  
  &::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
  }
}

.day-item {
  flex-shrink: 0;
  background: #f8f9fa;
  border: 2px solid transparent;
  border-radius: 16px;
  padding: 1rem;
  min-width: 100px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
  
  .day-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
  }
  
  .day-date {
    font-size: 2rem;
    font-weight: 700;
    color: #2c3e50;
    line-height: 1;
    margin-bottom: 0.25rem;
  }
  
  .day-month {
    font-size: 0.875rem;
    color: #666;
    text-transform: capitalize;
  }
  
  &:hover {
    background: #e8eaf6;
    border-color: #667eea;
    transform: translateY(-2px);
  }
  
  &.selected {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: #667eea;
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    
    .day-label,
    .day-date,
    .day-month {
      color: white;
    }
  }
}

.time-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e8e8e8;
  border-bottom: 1px solid #e8e8e8;
  
  label {
    font-weight: 600;
    color: #2c3e50;
  }
  
  input[type="time"] {
    padding: 0.75rem 1rem;
    border: 2px solid #e8e8e8;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    color: #2c3e50;
    transition: all 0.2s;
    
    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
}

.carousel-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  justify-content: flex-end;
  
  button {
    padding: 0.75rem 2rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    
    &.btn-secondary {
      background: #f5f5f5;
      color: #666;
      
      &:hover {
        background: #e8e8e8;
      }
    }
    
    &.btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
      }
    }
  }
}

/* Responsive */
@media (max-width: 768px) {
  .day-carousel-overlay {
    padding-top: 20px;
    align-items: flex-start;
  }
  
  .day-carousel-container {
    max-width: 95%;
    margin: 0 auto;
  }
  
  .carousel-header {
    padding: 1rem;
    
    h3 {
      font-size: 1.1rem;
    }
  }
  
  .carousel-wrapper {
    padding: 1.5rem 0;
  }
  
  .carousel-nav {
    width: 36px;
    height: 36px;
    margin: 0 0.25rem;
  }
  
  .day-item {
    min-width: 80px;
    padding: 0.75rem;
    
    .day-date {
      font-size: 1.75rem;
    }
  }
  
  .time-selector {
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem;
    
    input[type="time"] {
      width: 100%;
      max-width: 200px;
    }
  }
  
  .carousel-footer {
    padding: 1rem;
    flex-direction: column-reverse;
    
    button {
      width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .day-item {
    min-width: 70px;
    padding: 0.625rem;
    
    .day-label {
      font-size: 0.75rem;
    }
    
    .day-date {
      font-size: 1.5rem;
    }
    
    .day-month {
      font-size: 0.75rem;
    }
  }
}
</style>
