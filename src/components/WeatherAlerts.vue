<template>
  <div v-if="alerts && alerts.length > 0" class="weather-alerts">
    <div class="weather-alerts__header">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L1 21h22L12 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <h3>Alertas Meteorológicos</h3>
    </div>
    
    <div class="weather-alerts__list">
      <div 
        v-for="(alert, index) in sortedAlerts" 
        :key="index"
        class="weather-alerts__item"
        :class="[`weather-alerts__item--severity-${alert.severity}`]"
        @click="handleAlertClick(alert)"
        role="button"
        tabindex="0"
        @keypress.enter="handleAlertClick(alert)"
      >
        <div class="weather-alerts__icon">
          <component :is="getAlertIcon(alert.severity)" />
        </div>
        <div class="weather-alerts__content">
          <div class="weather-alerts__description">
            <span class="weather-alerts__emoji">{{ getAlertEmoji(alert.code) }}</span>
            {{ getAlertDescription(alert.code) }}
          </div>
          <div class="weather-alerts__meta">
            <span class="weather-alerts__code">{{ getAlertCodeLabel(alert.code) }}</span>
            <span class="weather-alerts__time">{{ formatAlertTime(alert.timestamp) }}</span>
          </div>
        </div>
        <div class="weather-alerts__arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, computed } from 'vue';
import type { WeatherAlert, AlertSeverity } from '../types/weather';

interface Props {
  alerts?: WeatherAlert[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  alertClicked: [alert: WeatherAlert];
}>();

const getDayStart = (timestamp: string): number => {
  const date = new Date(timestamp);
  const time = date.getTime();
  if (Number.isNaN(time)) return Number.MAX_SAFE_INTEGER;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};

const getTimestampValue = (timestamp: string): number => {
  const time = new Date(timestamp).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
};

// Ordenar alertas por dia, mantendo prioridade por categoria/tipo, timestamp e severidade
const sortedAlerts = computed(() => {
  if (!props.alerts || props.alerts.length === 0) return [];
  
  // Mapa de categoria por código de alerta
  const alertCategory: Record<string, number> = {
    // Tempestades (prioridade 1 - mais crítico)
    'STORM': 1,
    'STORM_RAIN': 1,
    
    // Chuvas (prioridade 2)
    'HEAVY_RAIN': 2,
    'HEAVY_RAIN_DAY': 2,
    'MODERATE_RAIN': 2,
    'LIGHT_RAIN': 2,
    'DRIZZLE': 2,
    'RAIN_EXPECTED': 2,
    
    // Ventos (prioridade 3)
    'STRONG_WIND': 3,
    'MODERATE_WIND': 3,
    
    // Temperatura (prioridade 4)
    'VERY_COLD': 4,
    'COLD': 4,
    'TEMP_DROP': 4,
    'TEMP_RISE': 4,
    
    // Visibilidade (prioridade 5)
    'LOW_VISIBILITY': 5,
    
    // UV (prioridade 6)
    'EXTREME_UV': 6,
    
    // Outros (prioridade 7)
    'SNOW': 7
  };
  
  // Mapa de prioridade de severidade (maior = mais crítico)
  const severityPriority: Record<AlertSeverity, number> = {
    danger: 4,
    alert: 3,
    warning: 2,
    info: 1
  };
  
  return [...props.alerts].sort((a, b) => {
    // Primeira ordenação: dia (garante cronologia dia 1, dia 2, etc.)
    const dayA = getDayStart(a.timestamp);
    const dayB = getDayStart(b.timestamp);
    if (dayA !== dayB) {
      return dayA - dayB;
    }

    // Primeiro: ordenar por categoria
    const catA = alertCategory[a.code] || 99;
    const catB = alertCategory[b.code] || 99;
    if (catA !== catB) {
      return catA - catB;
    }
    
    // Segundo: ordenar por timestamp (mais próximos primeiro) dentro do mesmo dia/categoria
    const dateA = getTimestampValue(a.timestamp);
    const dateB = getTimestampValue(b.timestamp);
    if (dateA !== dateB) {
      return dateA - dateB;
    }
    
    // Terceiro: se timestamps iguais, ordenar por severidade (mais críticos primeiro)
    return severityPriority[b.severity] - severityPriority[a.severity];
  });
});

const handleAlertClick = (alert: WeatherAlert) => {
  emit('alertClicked', alert);
};

const getAlertIcon = (severity: AlertSeverity) => {
  const icons = {
    danger: () => h('svg', {
      width: 24,
      height: 24,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg'
    }, [
      h('circle', { cx: 12, cy: 12, r: 10, stroke: 'currentColor', 'stroke-width': 2 }),
      h('path', { d: 'M12 8v4M12 16h.01', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' })
    ]),
    alert: () => h('svg', {
      width: 24,
      height: 24,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg'
    }, [
      h('path', { d: 'M12 2L1 21h22L12 2z', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
      h('path', { d: 'M12 9v4M12 17h.01', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' })
    ]),
    warning: () => h('svg', {
      width: 24,
      height: 24,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg'
    }, [
      h('circle', { cx: 12, cy: 12, r: 10, stroke: 'currentColor', 'stroke-width': 2 }),
      h('path', { d: 'M12 8v4', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' }),
      h('circle', { cx: 12, cy: 16, r: 1, fill: 'currentColor' })
    ]),
    info: () => h('svg', {
      width: 24,
      height: 24,
      viewBox: '0 0 24 24',
      fill: 'none',
      xmlns: 'http://www.w3.org/2000/svg'
    }, [
      h('circle', { cx: 12, cy: 12, r: 10, stroke: 'currentColor', 'stroke-width': 2 }),
      h('path', { d: 'M12 16v-4M12 8h.01', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round' })
    ])
  };
  
  return icons[severity] || icons.info;
};

// Mapa global de labels e descrições dos alertas
const ALERT_CONFIG: Record<string, { label: string; description: string; icon: string }> = {
  DRIZZLE: { 
    label: 'Garoa', 
    description: 'Chuva leve prevista',
    icon: '🌦️'
  },
  LIGHT_RAIN: { 
    label: 'Chuva Fraca', 
    description: 'Chuva fraca esperada',
    icon: '🌧️'
  },
  MODERATE_RAIN: { 
    label: 'Chuva Moderada', 
    description: 'Chuva moderada prevista',
    icon: '🌧️'
  },
  HEAVY_RAIN: { 
    label: 'Chuva Forte', 
    description: 'Chuva intensa esperada',
    icon: '⛈️'
  },
  HEAVY_RAIN_DAY: {
    label: 'Chuva Forte (dia)',
    description: 'Acumulado alto previsto para o dia',
    icon: '🌧️'
  },
  RAIN_EXPECTED: { 
    label: 'Chuva Prevista', 
    description: 'Alta probabilidade de chuva',
    icon: '☔'
  },
  STORM: { 
    label: 'Tempestade', 
    description: 'Tempestade se aproximando',
    icon: '⛈️'
  },
  STORM_RAIN: { 
    label: 'Tempestade', 
    description: 'Tempestade com chuva intensa',
    icon: '⛈️'
  },
  MODERATE_WIND: { 
    label: 'Vento Moderado', 
    description: 'Ventos moderados esperados',
    icon: '💨'
  },
  STRONG_WIND: { 
    label: 'Vento Forte', 
    description: 'Ventos fortes previstos',
    icon: '🌬️'
  },
  COLD: { 
    label: 'Frio', 
    description: 'Temperaturas baixas',
    icon: '🥶'
  },
  VERY_COLD: { 
    label: 'Frio Intenso', 
    description: 'Temperaturas muito baixas',
    icon: '❄️'
  },
  TEMP_DROP: { 
    label: 'Queda de Temperatura', 
    description: 'Temperatura em queda',
    icon: '🌡️'
  },
  TEMP_RISE: { 
    label: 'Aumento de Temperatura', 
    description: 'Temperatura em elevação',
    icon: '🌡️'
  },
  SNOW: { 
    label: 'Neve', 
    description: 'Possibilidade de neve',
    icon: '🌨️'
  },
  LOW_VISIBILITY: { 
    label: 'Visibilidade Reduzida', 
    description: 'Baixa visibilidade',
    icon: '🌫️'
  },
  EXTREME_UV: { 
    label: 'UV Extremo', 
    description: 'Índice UV muito alto',
    icon: '☀️'
  }
};

const getAlertCodeLabel = (code: string): string => {
  return ALERT_CONFIG[code]?.label || code;
};

const getAlertDescription = (code: string): string => {
  return ALERT_CONFIG[code]?.description || code;
};

const getAlertEmoji = (code: string): string => {
  return ALERT_CONFIG[code]?.icon || '⚠️';
};

const formatAlertTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
};
</script>
