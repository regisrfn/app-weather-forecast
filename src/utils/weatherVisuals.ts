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
 * Retorna ícone baseado no weatherCode (com fallback para descrição)
 */
export function getWeatherIconByCode(weatherCode?: number, description?: string): string {
  if (typeof weatherCode !== 'number' || Number.isNaN(weatherCode)) {
    return description ? getWeatherIcon(description) : '🌤️';
  }

  const code = Math.floor(weatherCode);

  if (code >= 100 && code < 200) return '☀️';
  if (code >= 200 && code < 300) return '⛅';
  if (code >= 300 && code < 350) return '☁️';
  if (code >= 350 && code < 400) return '☁️';
  if (code >= 400 && code < 500) return '🌦️';
  if (code >= 500 && code < 600) return '🌧️';
  if (code >= 600 && code < 630) return '⛈️';
  if (code >= 630 && code < 700) return '🌩️';
  if (code >= 700 && code < 721) return '🌫️';
  if (code === 800) return '🌫️';
  if (code >= 900 && code < 910) return '❄️';
  if (code >= 910) return '🌨️';

  return description ? getWeatherIcon(description) : '🌤️';
}

/**
 * Retorna cor baseada no índice UV
 * Cores suavizadas para melhor conforto visual
 */
export function getUVColor(uvIndex: number): string {
  if (uvIndex < 3) return '#4ade80'; // Verde - Baixo (mais claro)
  if (uvIndex < 6) return '#fbbf24'; // Amarelo - Moderado (mais suave)
  if (uvIndex < 8) return '#fb923c'; // Laranja - Alto (mais suave)
  if (uvIndex < 11) return '#f87171'; // Vermelho - Muito Alto (mais claro)
  return '#c084fc'; // Roxo - Extremo (mais claro)
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

/**
 * Retorna direção cardinal do vento em português baseada em graus
 */
export function getWindDirectionLabel(degrees: number): string {
  // Normalizar para 0-360
  const normalized = ((degrees % 360) + 360) % 360;
  
  // 8 direções cardinais (45° cada)
  if (normalized >= 337.5 || normalized < 22.5) return 'N';
  if (normalized >= 22.5 && normalized < 67.5) return 'NE';
  if (normalized >= 67.5 && normalized < 112.5) return 'L';
  if (normalized >= 112.5 && normalized < 157.5) return 'SE';
  if (normalized >= 157.5 && normalized < 202.5) return 'S';
  if (normalized >= 202.5 && normalized < 247.5) return 'SO';
  if (normalized >= 247.5 && normalized < 292.5) return 'O';
  if (normalized >= 292.5 && normalized < 337.5) return 'NO';
  
  return 'N'; // Fallback
}

/**
 * Retorna emoji da fase da lua baseada no nome
 */
export function getMoonPhaseEmoji(moonPhase: string): string {
  const phase = moonPhase.toLowerCase();
  
  if (phase.includes('nova')) return '🌑';
  if (phase.includes('crescente')) {
    if (phase.includes('quarto')) return '🌓';
    return '🌒'; // Lua Crescente (antes do quarto)
  }
  if (phase.includes('cheia')) return '🌕';
  if (phase.includes('minguante')) {
    if (phase.includes('quarto')) return '🌗';
    return '🌖'; // Lua Minguante (depois da cheia)
  }
  
  return '🌙'; // Fallback genérico
}

/**
 * Retorna cor do card de previsão baseado na combinação de temperatura e probabilidade de chuva
 * Usa apenas 2-3 cores principais para manter simplicidade visual
 */
export function getForecastCardColor(tempAvg: number, rainProbability: number): string {
  // Normalizar valores (0-1)
  const tempNorm = Math.min(Math.max((tempAvg - 10) / 30, 0), 1); // 10°C = 0, 40°C = 1
  const rainNorm = rainProbability / 100; // 0-100% -> 0-1
  
  // Calcular peso combinado (temperatura tem mais peso que chuva)
  const weatherScore = (tempNorm * 0.6) + (rainNorm * 0.4);
  
  // Retornar uma de 3 cores principais baseado no score
  if (weatherScore < 0.35) {
    // Clima frio/chuvoso - Azul
    return 'rgba(59, 130, 246, 0.12)'; // Blue com transparência
  } else if (weatherScore < 0.65) {
    // Clima moderado - Verde/Amarelo
    return 'rgba(34, 197, 94, 0.12)'; // Green com transparência
  } else {
    // Clima quente/seco - Laranja/Vermelho
    return 'rgba(249, 115, 22, 0.12)'; // Orange com transparência
  }
}

/**
 * Retorna cor da borda do card baseado na mesma lógica
 */
export function getForecastCardBorderColor(tempAvg: number, rainProbability: number): string {
  const tempNorm = Math.min(Math.max((tempAvg - 10) / 30, 0), 1);
  const rainNorm = rainProbability / 100;
  const weatherScore = (tempNorm * 0.6) + (rainNorm * 0.4);
  
  if (weatherScore < 0.35) {
    return 'rgba(59, 130, 246, 0.3)';
  } else if (weatherScore < 0.65) {
    return 'rgba(34, 197, 94, 0.3)';
  } else {
    return 'rgba(249, 115, 22, 0.3)';
  }
}
