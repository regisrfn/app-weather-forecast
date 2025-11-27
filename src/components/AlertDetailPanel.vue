<script setup lang="ts">
import { computed } from 'vue';
import type { WeatherAlert } from '../types/weather';

interface Props {
  alert: WeatherAlert | null;
  isOpen: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  jumpToDate: [date: string, time: string];
}>();

// Mapeamento de códigos para labels em português
const alertCodeLabels: Record<string, string> = {
  DRIZZLE: 'Garoa',
  LIGHT_RAIN: 'Chuva Fraca',
  MODERATE_RAIN: 'Chuva Moderada',
  HEAVY_RAIN: 'Chuva Forte',
  RAIN_EXPECTED: 'Chuva Esperada',
  STORM: 'Tempestade com Raios',
  STORM_RAIN: 'Tempestade com Chuva',
  MODERATE_WIND: 'Ventos Moderados',
  STRONG_WIND: 'Ventos Fortes',
  COLD: 'Frio',
  VERY_COLD: 'Frio Intenso',
  TEMP_DROP: 'Queda de Temperatura',
  TEMP_RISE: 'Aumento de Temperatura',
  SNOW: 'Neve',
  LOW_VISIBILITY: 'Visibilidade Reduzida',
};

// Ícones SVG por severidade
const getSeverityIcon = (severity: string) => {
  const icons = {
    danger: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="severity-icon">
      <circle cx="12" cy="12" r="10" stroke-width="2"/>
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01"/>
    </svg>`,
    alert: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="severity-icon">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="severity-icon">
      <circle cx="12" cy="12" r="10" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
    </svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="severity-icon">
      <circle cx="12" cy="12" r="10" stroke-width="2"/>
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16v-4m0-4h.01"/>
    </svg>`,
  };
  return icons[severity as keyof typeof icons] || icons.info;
};

// Formatação de timestamp
const formatTimestamp = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return timestamp;
  }
};

// Extrair data e hora do timestamp e buscar previsão
const handleTimestampClick = () => {
  if (!props.alert?.timestamp) return;
  
  try {
    // Converter para timezone de Brasília usando toLocaleString
    const date = new Date(props.alert.timestamp);
    
    // Formatar data YYYY-MM-DD usando timezone de Brasília
    const brasiliaDate = date.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    // Parse: "27/11/2025, 18:00" -> ["27/11/2025", "18:00"]
    const parts = brasiliaDate.split(', ');
    const datePart = parts[0];
    const timePart = parts[1];
    
    if (!datePart || !timePart) {
      console.error('Formato de data inválido:', brasiliaDate);
      return;
    }
    
    const dateComponents = datePart.split('/');
    const day = dateComponents[0];
    const month = dateComponents[1];
    const year = dateComponents[2];
    
    if (!day || !month || !year) {
      console.error('Componentes de data inválidos:', datePart);
      return;
    }
    
    const dateStr = `${year}-${month}-${day}`;
    const timeStr = timePart;
    
    emit('jumpToDate', dateStr, timeStr);
    emit('close');
  } catch (error) {
    console.error('Erro ao processar timestamp:', error);
  }
};

// Formatação dos detalhes técnicos
const formatDetails = computed(() => {
  if (!props.alert?.details) return [];

  const details = props.alert.details as Record<string, any>;
  const formatted: Array<{ label: string; value: string }> = [];

  if (details.rain_mm_h !== undefined) {
    formatted.push({
      label: 'Intensidade da Chuva',
      value: `${details.rain_mm_h.toFixed(1)} mm/h`,
    });
  }

  if (details.rain_mm !== undefined) {
    formatted.push({
      label: 'Volume de Chuva',
      value: `${details.rain_mm.toFixed(1)} mm`,
    });
  }

  if (details.rain_ends_at !== undefined) {
    try {
      const endDate = new Date(details.rain_ends_at);
      formatted.push({
        label: 'Fim Previsto da Chuva',
        value: endDate.toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    } catch {
      // Ignora se a data for inválida
    }
  }

  if (details.visibility_m !== undefined) {
    formatted.push({
      label: 'Visibilidade',
      value: details.visibility_m < 1000 
        ? `${details.visibility_m} m` 
        : `${(details.visibility_m / 1000).toFixed(1)} km`,
    });
  }

  if (details.wind_speed_kmh !== undefined) {
    formatted.push({
      label: 'Velocidade do Vento',
      value: `${details.wind_speed_kmh.toFixed(1)} km/h`,
    });
  }

  if (details.temperature_c !== undefined) {
    formatted.push({
      label: 'Temperatura',
      value: `${details.temperature_c.toFixed(1)}°C`,
    });
  }

  if (details.variation_c !== undefined) {
    formatted.push({
      label: 'Variação de Temperatura',
      value: `${details.variation_c > 0 ? '+' : ''}${details.variation_c.toFixed(1)}°C`,
    });
  }

  if (details.days_between !== undefined) {
    formatted.push({
      label: 'Período',
      value: `${details.days_between} ${details.days_between === 1 ? 'dia' : 'dias'}`,
    });
  }

  if (details.probability_percent !== undefined) {
    formatted.push({
      label: 'Probabilidade',
      value: `${details.probability_percent.toFixed(0)}%`,
    });
  }

  if (details.weather_code !== undefined) {
    formatted.push({
      label: 'Código Meteorológico',
      value: details.weather_code.toString(),
    });
  }

  if (details.day_1_date && details.day_2_date) {
    // Adicionar 'T00:00:00' para forçar interpretação como data local, não UTC
    const date1 = new Date(details.day_1_date + 'T00:00:00');
    const date2 = new Date(details.day_2_date + 'T00:00:00');
    formatted.push({
      label: 'Período da Variação',
      value: `${date1.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} → ${date2.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
    });
  }

  if (details.day_1_max_c !== undefined) {
    formatted.push({
      label: 'Temperatura Inicial',
      value: `${details.day_1_max_c.toFixed(1)}°C`,
    });
  }

  if (details.day_2_max_c !== undefined) {
    formatted.push({
      label: 'Temperatura Final',
      value: `${details.day_2_max_c.toFixed(1)}°C`,
    });
  }

  return formatted;
});

// Label do código do alerta
const alertLabel = computed(() => {
  if (!props.alert?.code) return '';
  return alertCodeLabels[props.alert.code] || props.alert.code;
});

const handleClose = () => {
  emit('close');
};
</script>

<template>
  <Transition name="alert-panel">
    <div v-if="isOpen && alert" class="alert-detail-overlay" @click.self="handleClose">
      <div class="alert-detail-card" :class="`severity-${alert.severity}`">
        <!-- Header -->
        <div class="alert-header">
          <div class="severity-badge" :class="`severity-${alert.severity}`">
            <div v-html="getSeverityIcon(alert.severity)"></div>
            <span class="severity-label">
              {{ alert.severity === 'danger' ? 'PERIGO' : 
                 alert.severity === 'alert' ? 'ALERTA' : 
                 alert.severity === 'warning' ? 'ATENÇÃO' : 'INFO' }}
            </span>
          </div>
          <button class="close-button" @click="handleClose" aria-label="Fechar">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="alert-detail-content">
          <!-- Description -->
          <div class="alert-detail-description">
            <h2>{{ alert.description }}</h2>
            <div class="alert-detail-meta">
              <span class="alert-type">{{ alertLabel }}</span>
              <button 
                class="alert-detail-time clickable"
                @click="handleTimestampClick"
                title="Clique para buscar previsão neste horário"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 4px; vertical-align: middle;">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                {{ formatTimestamp(alert.timestamp) }}
              </button>
            </div>
          </div>

          <!-- Technical Details -->
          <div v-if="formatDetails.length > 0" class="technical-details">
            <h3>Detalhes Técnicos</h3>
            <div class="details-grid">
              <div v-for="detail in formatDetails" :key="detail.label" class="detail-item">
                <span class="detail-label">{{ detail.label }}</span>
                <span class="detail-value">{{ detail.value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
// Styles will be in separate SCSS file
</style>
