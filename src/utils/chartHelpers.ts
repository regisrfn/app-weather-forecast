/**
 * Utilitários para gráficos de clima
 * Centraliza funções de formatação, cores e configurações
 */

/**
 * Retorna cor baseada na probabilidade de precipitação
 * @param probability - Probabilidade de 0 a 100
 * @param rainfallIntensity - Intensidade da chuva (0-100), opcional
 * @returns Cor RGBA para o gráfico
 */
export const getPrecipitationColorByProbability = (
  probability: number, 
  rainfallIntensity?: number
): string => {
  // Se intensidade é menor que 1, não exibir barra
  if (rainfallIntensity !== undefined && rainfallIntensity < 1) {
    return 'transparent';
  }
  
  // Se probabilidade é 0, retornar transparente
  if (probability === 0) {
    return 'rgba(59, 130, 246, 0)';
  }
  
  // Escala de cores baseada na probabilidade:
  // 0-20%: azul muito claro
  // 20-40%: azul claro
  // 40-60%: azul médio
  // 60-80%: azul forte
  // 80-100%: azul muito forte
  
  if (probability >= 80) {
    return 'rgba(59, 130, 246, 0.9)'; // 80-100%: Muito provável - azul intenso
  } else if (probability >= 60) {
    return 'rgba(59, 130, 246, 0.7)'; // 60-80%: Provável - azul forte
  } else if (probability >= 40) {
    return 'rgba(59, 130, 246, 0.5)'; // 40-60%: Possível - azul médio
  } else if (probability >= 20) {
    return 'rgba(59, 130, 246, 0.3)'; // 20-40%: Pouco provável - azul claro
  } else {
    return 'rgba(59, 130, 246, 0.15)'; // 0-20%: Improvável - azul muito claro
  }
};

/**
 * Retorna cor da borda baseada na probabilidade de precipitação
 * @param probability - Probabilidade de 0 a 100
 * @param rainfallIntensity - Intensidade da chuva (0-100), opcional
 * @returns Cor RGBA para a borda do gráfico
 */
export const getPrecipitationBorderColor = (
  probability: number,
  rainfallIntensity?: number
): string => {
  // Se intensidade é menor que 1, não exibir borda
  if (rainfallIntensity !== undefined && rainfallIntensity < 1) {
    return 'transparent';
  }
  
  if (probability === 0) {
    return 'transparent';
  }
  
  if (probability >= 60) {
    return 'rgba(59, 130, 246, 1)'; // Borda sólida para alta probabilidade
  } else if (probability >= 40) {
    return 'rgba(59, 130, 246, 0.8)';
  } else {
    return 'rgba(59, 130, 246, 0.5)';
  }
};

/**
 * Retorna descrição textual da probabilidade
 * @param probability - Probabilidade de 0 a 100 (pode ser undefined)
 * @returns Texto descritivo
 */
export const getProbabilityDescription = (probability: number | undefined): string => {
  if (!probability || probability === 0) {
    return 'Sem previsão';
  }
  
  if (probability >= 80) {
    return 'Muito provável';
  } else if (probability >= 60) {
    return 'Provável';
  } else if (probability >= 40) {
    return 'Possível';
  } else if (probability >= 20) {
    return 'Pouco provável';
  } else {
    return 'Improvável';
  }
};

/**
 * Formata data para exibição no eixo X (formato curto dd/mm)
 * @param dateStr - String de data no formato YYYY-MM-DD
 * @returns Data formatada
 */
export const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}/${month}`;
};

/**
 * Formata timestamp para exibição horária
 * Mostra hora + dia quando muda de dia
 * @param timestamp - Timestamp ISO
 * @param index - Índice do elemento
 * @param previousTimestamp - Timestamp anterior para comparação
 * @returns Hora formatada
 */
export const formatHourLabel = (
  timestamp: string, 
  index: number, 
  previousTimestamp?: string
): string => {
  const date = new Date(timestamp);
  const hour = date.getHours();
  const day = date.getDate();
  
  // Se é a primeira hora OU mudou de dia, mostrar dia também
  if (index === 0 || (previousTimestamp && new Date(previousTimestamp).getDate() !== day)) {
    return `${hour}h\n${day}/${date.getMonth() + 1}`;
  }
  
  return `${hour}h`;
};

/**
 * Cria gradiente para linhas de temperatura
 * @param ctx - Contexto do canvas
 * @param color - Cor base em RGB (ex: '251, 146, 60')
 * @param height - Altura do gradiente
 * @returns CanvasGradient
 */
export const createTemperatureGradient = (
  ctx: CanvasRenderingContext2D,
  color: string,
  height: number = 400
): CanvasGradient => {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, `rgba(${color}, 0.25)`);
  gradient.addColorStop(1, `rgba(${color}, 0.0)`);
  return gradient;
};

/**
 * Configurações de cores do tema
 */
export const chartColors = {
  tempMax: '#fb923c', // Laranja para temperatura máxima
  tempMin: '#60a5fa', // Azul claro para temperatura mínima
  temp: '#fb923c', // Laranja para temperatura (horária)
  precipitation: '#3b82f6', // Azul para precipitação
  
  // Cores RGB para gradientes
  tempMaxRGB: '251, 146, 60',
  tempMinRGB: '96, 165, 250',
  tempRGB: '251, 146, 60',
};

/**
 * Configurações responsivas para gráficos
 */
export const getResponsiveConfig = () => {
  const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
  
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 768,
    isDesktop: width >= 768,
    
    // Tamanhos de fonte
    tooltipTitleSize: width < 640 ? 11 : 13,
    tooltipBodySize: width < 640 ? 10 : 12,
    legendSize: 12,
    tickSize: 12,
    
    // Padding
    tooltipPadding: width < 640 ? 10 : 14,
    legendPadding: 15,
    
    // Tamanhos de pontos
    pointRadius: width < 640 ? 3 : 5,
    pointHoverRadius: width < 640 ? 5 : 7,
  };
};
