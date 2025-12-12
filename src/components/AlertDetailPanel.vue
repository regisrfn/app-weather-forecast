<script setup lang="ts">
import { computed } from 'vue';
import type { WeatherAlert } from '../types/weather';
import { componentLogger } from '../utils/logger';

const logger = componentLogger('AlertDetailPanel');

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
  HEAVY_RAIN_DAY: 'Chuva Forte (dia)',
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
    danger: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="alert-detail__severity-icon">
      <circle cx="12" cy="12" r="10" stroke-width="2"/>
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01"/>
    </svg>`,
    alert: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="alert-detail__severity-icon">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
    </svg>`,
    warning: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="alert-detail__severity-icon">
      <circle cx="12" cy="12" r="10" stroke-width="2"/>
      <circle cx="12" cy="12" r="3" fill="currentColor"/>
    </svg>`,
    info: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="alert-detail__severity-icon">
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
      logger.error('Formato de data inválido:', brasiliaDate);
      return;
    }
    
    const dateComponents = datePart.split('/');
    const day = dateComponents[0];
    const month = dateComponents[1];
    const year = dateComponents[2];
    
    if (!day || !month || !year) {
      logger.error('Componentes de data inválidos:', datePart);
      return;
    }
    
    const dateStr = `${year}-${month}-${day}`;
    const timeStr = timePart;
    
    emit('jumpToDate', dateStr, timeStr);
    emit('close');
  } catch (error) {
    logger.error('Erro ao processar timestamp:', error);
  }
};

// Formatação dos detalhes técnicos
const formatDetails = computed(() => {
  if (!props.alert?.details) return [];

  const details = props.alert.details as Record<string, any>;
  const getDetail = (camelKey: string, legacyKey?: string) =>
    details[camelKey] ?? (legacyKey ? details[legacyKey] : undefined);
  const isHeavyRainDay = props.alert?.code === 'HEAVY_RAIN_DAY';
  const formatted: Array<{ label: string; value: string }> = [];

  const rainMmH = getDetail('rainMmH', 'rain_mm_h');
  if (!isHeavyRainDay && typeof rainMmH === 'number') {
    formatted.push({
      label: 'Intensidade da Chuva',
      value: `${rainMmH.toFixed(1)} mm/h`,
    });
  }

  const rainMm = getDetail('precipitationMm') ?? getDetail('rainMm', 'rain_mm');
  if (typeof rainMm === 'number') {
    formatted.push({
      label: 'Volume de Chuva',
      value: `${rainMm.toFixed(1)} mm`,
    });
  }

  const rainfallIntensity = getDetail('rainfallIntensity', 'intensity');
  if (!isHeavyRainDay && typeof rainfallIntensity === 'number') {
    formatted.push({
      label: 'Intensidade Composta',
      value: `${rainfallIntensity.toFixed(1)} (0-100)`,
    });
  }

  const rainEndsAt = getDetail('rainEndsAt', 'rain_ends_at');
  if (rainEndsAt !== undefined) {
    try {
      const endDate = new Date(rainEndsAt);
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

  const visibilityMeters = getDetail('visibilityMeters', 'visibility_m');
  if (typeof visibilityMeters === 'number') {
    formatted.push({
      label: 'Visibilidade',
      value: visibilityMeters < 1000 
        ? `${visibilityMeters} m` 
        : `${(visibilityMeters / 1000).toFixed(1)} km`,
    });
  }

  const windSpeedKmh = getDetail('windSpeedKmh', 'wind_speed_kmh');
  if (typeof windSpeedKmh === 'number') {
    formatted.push({
      label: 'Velocidade do Vento',
      value: `${windSpeedKmh.toFixed(1)} km/h`,
    });
  }

  const temperatureC = getDetail('temperatureC', 'temperature_c');
  if (typeof temperatureC === 'number') {
    formatted.push({
      label: 'Temperatura',
      value: `${temperatureC.toFixed(1)}°C`,
    });
  }

  const variationC = getDetail('variationC', 'variation_c');
  if (typeof variationC === 'number') {
    formatted.push({
      label: 'Variação de Temperatura',
      value: `${variationC > 0 ? '+' : ''}${variationC.toFixed(1)}°C`,
    });
  }

  const daysBetween = getDetail('daysBetween', 'days_between');
  if (typeof daysBetween === 'number') {
    formatted.push({
      label: 'Período',
      value: `${daysBetween} ${daysBetween === 1 ? 'dia' : 'dias'}`,
    });
  }

  const probabilityPercent = getDetail('probabilityPercent', 'probability_percent') 
    ?? getDetail('rainProbability');
  if (typeof probabilityPercent === 'number') {
    formatted.push({
      label: 'Probabilidade',
      value: `${probabilityPercent.toFixed(0)}%`,
    });
  }

  const weatherCode = getDetail('weatherCode', 'weather_code');
  if (weatherCode !== undefined) {
    formatted.push({
      label: 'Código Meteorológico',
      value: weatherCode.toString(),
    });
  }

  const day1Date = getDetail('day1Date', 'day_1_date');
  const day2Date = getDetail('day2Date', 'day_2_date');
  if (day1Date && day2Date) {
    // Adicionar 'T00:00:00' para forçar interpretação como data local, não UTC
    const date1 = new Date(day1Date + 'T00:00:00');
    const date2 = new Date(day2Date + 'T00:00:00');
    formatted.push({
      label: 'Período da Variação',
      value: `${date1.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })} → ${date2.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
    });
  }

  const day1MaxC = getDetail('day1MaxC', 'day_1_max_c');
  if (typeof day1MaxC === 'number') {
    formatted.push({
      label: 'Temperatura Inicial',
      value: `${day1MaxC.toFixed(1)}°C`,
    });
  }

  const day2MaxC = getDetail('day2MaxC', 'day_2_max_c');
  if (typeof day2MaxC === 'number') {
    formatted.push({
      label: 'Temperatura Final',
      value: `${day2MaxC.toFixed(1)}°C`,
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
  <Teleport to="body">
    <Transition name="alert-panel">
      <div v-if="isOpen && alert" class="alert-detail alert-detail__overlay" @click.self="handleClose">
        <div class="alert-detail__card" :class="`alert-detail__card--severity-${alert.severity}`">
          <!-- Header -->
          <div class="alert-detail__header">
            <div class="alert-detail__severity-badge" :class="`alert-detail__severity-badge--${alert.severity}`">
              <div v-html="getSeverityIcon(alert.severity)"></div>
              <span class="alert-detail__severity-label">
                {{ alert.severity === 'danger' ? 'PERIGO' : 
                   alert.severity === 'alert' ? 'ALERTA' : 
                   alert.severity === 'warning' ? 'ATENÇÃO' : 'INFO' }}
              </span>
            </div>
            <button class="alert-detail__close" @click="handleClose" aria-label="Fechar">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="alert-detail__content">
            <!-- Description -->
            <div class="alert-detail__description">
              <h2>{{ alert.description }}</h2>
              <div class="alert-detail__meta">
                <span class="alert-detail__type">{{ alertLabel }}</span>
                <button 
                  class="alert-detail__time alert-detail__time--clickable"
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
            <div v-if="formatDetails.length > 0" class="alert-detail__technical">
              <h3>Detalhes Técnicos</h3>
              <div class="alert-detail__details-grid">
                <div v-for="detail in formatDetails" :key="detail.label" class="alert-detail__detail">
                  <span class="alert-detail__detail-label">{{ detail.label }}</span>
                  <span class="alert-detail__detail-value">{{ detail.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
