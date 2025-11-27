<template>
  <div v-if="alerts && alerts.length > 0" class="weather-alerts">
    <div class="alerts-header">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L1 21h22L12 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        <path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <h3>Alertas Meteorológicos</h3>
    </div>
    
    <div class="alerts-list">
      <div 
        v-for="(alert, index) in sortedAlerts" 
        :key="index"
        class="alert-item"
        :class="[`severity-${alert.severity}`]"
        @click="handleAlertClick(alert)"
        role="button"
        tabindex="0"
        @keypress.enter="handleAlertClick(alert)"
      >
        <div class="alert-icon">
          <component :is="getAlertIcon(alert.severity)" />
        </div>
        <div class="alert-content">
          <div class="alert-description">{{ alert.description }}</div>
          <div class="alert-meta">
            <span class="alert-code">{{ getAlertCodeLabel(alert.code) }}</span>
            <span class="alert-time">{{ formatAlertTime(alert.timestamp) }}</span>
          </div>
        </div>
        <div class="alert-arrow">
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

// Ordenar alertas por categoria/tipo, depois por timestamp e severidade
const sortedAlerts = computed(() => {
  if (!props.alerts || props.alerts.length === 0) return [];
  
  // Mapa de categoria por código de alerta
  const alertCategory: Record<string, number> = {
    // Tempestades (prioridade 1 - mais crítico)
    'STORM': 1,
    'STORM_RAIN': 1,
    
    // Chuvas (prioridade 2)
    'HEAVY_RAIN': 2,
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
    
    // Outros (prioridade 6)
    'SNOW': 6
  };
  
  // Mapa de prioridade de severidade (maior = mais crítico)
  const severityPriority: Record<AlertSeverity, number> = {
    danger: 4,
    alert: 3,
    warning: 2,
    info: 1
  };
  
  return [...props.alerts].sort((a, b) => {
    // Primeiro: ordenar por categoria
    const catA = alertCategory[a.code] || 99;
    const catB = alertCategory[b.code] || 99;
    if (catA !== catB) {
      return catA - catB;
    }
    
    // Segundo: ordenar por timestamp (mais próximos primeiro)
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
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

const getAlertCodeLabel = (code: string): string => {
  const labels: Record<string, string> = {
    DRIZZLE: 'Garoa',
    LIGHT_RAIN: 'Chuva Fraca',
    MODERATE_RAIN: 'Chuva Moderada',
    HEAVY_RAIN: 'Chuva Forte',
    RAIN_EXPECTED: 'Chuva Prevista',
    STORM: 'Tempestade',
    STORM_RAIN: 'Tempestade',
    MODERATE_WIND: 'Vento Moderado',
    STRONG_WIND: 'Vento Forte',
    COLD: 'Frio',
    VERY_COLD: 'Frio Intenso',
    TEMP_DROP: 'Queda de Temperatura',
    TEMP_RISE: 'Aumento de Temperatura',
    SNOW: 'Neve',
    LOW_VISIBILITY: 'Visibilidade Reduzida'
  };
  
  return labels[code] || code;
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

