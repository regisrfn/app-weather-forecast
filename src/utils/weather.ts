// Utilitários de exibição de clima (cores e descrições)

export function getRainfallColor(intensity: number): string {
  if (intensity === 0) return 'rgba(200, 200, 200, 0.3)';
  if (intensity < 15) return 'rgba(173, 216, 230, 0.6)';
  if (intensity < 35) return 'rgba(100, 149, 237, 0.7)';
  if (intensity < 60) return 'rgba(30, 144, 255, 0.8)';
  return 'rgba(0, 0, 139, 0.9)';
}

export function getRainfallDescription(intensity: number): string {
  if (intensity === 0) return 'Sem chuva';
  if (intensity < 15) return 'Chuva fraca';
  if (intensity < 35) return 'Chuva moderada';
  if (intensity < 60) return 'Chuva forte';
  return 'Chuva intensa';
}

export function getCloudsDescription(clouds: number): string {
  if (clouds <= 10) return 'Céu limpo';
  if (clouds <= 25) return 'Poucas nuvens';
  if (clouds <= 50) return 'Parcialmente nublado';
  if (clouds <= 84) return 'Nublado';
  return 'Céu encoberto';
}
