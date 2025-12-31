// Utilitários de exibição de clima (cores e descrições)

export function getRainfallColor(intensity: number): string {
  if (intensity === 0) return 'rgba(191, 219, 254, 0.22)'; // Azul bem claro e translúcido - sem chuva
  if (intensity < 15) return 'rgba(96, 165, 250, 0.55)'; // Azul suave - chuva fraca
  if (intensity < 35) return 'rgba(37, 99, 235, 0.8)'; // Azul médio mais escuro - chuva moderada
  if (intensity < 60) return 'rgba(30, 64, 175, 0.88)'; // Azul escuro - chuva forte
  return 'rgba(15, 23, 42, 0.95)'; // Azul petróleo bem escuro - chuva muito intensa
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
