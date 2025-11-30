/**
 * Weather Visuals - Helper para ícones, cores e visuais de condições climáticas
 */

/**
 * Retorna ícone SVG baseado na descrição do clima
 */
export function getWeatherIcon(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes('limpo') || desc.includes('clear')) {
    return '☀️';
  }
  if (desc.includes('nublado') || desc.includes('cloud')) {
    return '☁️';
  }
  if (desc.includes('parcial')) {
    return '⛅';
  }
  if (desc.includes('chuva') || desc.includes('rain')) {
    return '🌧️';
  }
  if (desc.includes('tempestade') || desc.includes('storm') || desc.includes('trovoada')) {
    return '⛈️';
  }
  if (desc.includes('garoa') || desc.includes('drizzle')) {
    return '🌦️';
  }
  if (desc.includes('neve') || desc.includes('snow')) {
    return '❄️';
  }
  if (desc.includes('nevoeiro') || desc.includes('fog') || desc.includes('neblina')) {
    return '🌫️';
  }
  
  return '🌤️'; // Padrão
}

/**
 * Retorna cor baseada no índice UV
 */
export function getUVColor(uvIndex: number): string {
  if (uvIndex < 3) return '#22c55e'; // Verde - Baixo
  if (uvIndex < 6) return '#eab308'; // Amarelo - Moderado
  if (uvIndex < 8) return '#f97316'; // Laranja - Alto
  if (uvIndex < 11) return '#ef4444'; // Vermelho - Muito Alto
  return '#a855f7'; // Roxo - Extremo
}

/**
 * Retorna nome do nível de risco UV
 */
export function getUVRiskName(uvIndex: number): string {
  if (uvIndex < 3) return 'Baixo';
  if (uvIndex < 6) return 'Moderado';
  if (uvIndex < 8) return 'Alto';
  if (uvIndex < 11) return 'Muito Alto';
  return 'Extremo';
}

/**
 * Retorna cor baseada na temperatura
 */
export function getTempColor(temp: number): string {
  if (temp < 10) return '#3b82f6'; // Azul - Frio
  if (temp < 18) return '#06b6d4'; // Cyan - Fresco
  if (temp < 25) return '#22c55e'; // Verde - Agradável
  if (temp < 30) return '#eab308'; // Amarelo - Quente
  if (temp < 35) return '#f97316'; // Laranja - Muito Quente
  return '#ef4444'; // Vermelho - Extremo
}

/**
 * Retorna cor baseada na precipitação
 */
export function getPrecipitationColor(mm: number): string {
  if (mm === 0) return '#e2e8f0'; // Cinza claro - Sem chuva
  if (mm < 5) return '#bae6fd'; // Azul claro - Chuva fraca
  if (mm < 20) return '#7dd3fc'; // Azul médio - Chuva moderada
  if (mm < 50) return '#38bdf8'; // Azul - Chuva forte
  return '#0284c7'; // Azul escuro - Chuva intensa
}

/**
 * Retorna ícone para precipitação
 */
export function getPrecipitationIcon(mm: number): string {
  if (mm === 0) return '☀️';
  if (mm < 5) return '🌦️';
  if (mm < 20) return '🌧️';
  if (mm < 50) return '⛈️';
  return '🌊';
}

/**
 * Formata horário de sunrise/sunset
 */
export function formatTime(timeStr: string): string {
  // Formato esperado: "HH:MM:SS"
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr;
}

/**
 * Retorna cor de texto com contraste adequado para fundo colorido
 */
export function getContrastColor(backgroundColor: string): string {
  // Converter hex para RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calcular luminância relativa
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Retornar preto ou branco baseado na luminância
  return luminance > 0.5 ? '#1e293b' : '#ffffff';
}

/**
 * Retorna descrição da probabilidade de chuva
 */
export function getRainProbabilityText(probability: number): string {
  if (probability < 20) return 'Muito Baixa';
  if (probability < 40) return 'Baixa';
  if (probability < 60) return 'Moderada';
  if (probability < 80) return 'Alta';
  return 'Muito Alta';
}
