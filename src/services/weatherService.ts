import type { RainfallData, WeatherForecast } from '../types/weather';

/**
 * Serviço para consumir dados meteorológicos do backend
 * Por enquanto retorna dados mockados para desenvolvimento
 */
export class WeatherService {
  // TODO: Descomentar quando integrar com backend real
  // private static API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  /**
   * Busca dados atuais de chuva para uma cidade
   */
  static async getCurrentRainfall(cityId: string): Promise<RainfallData | null> {
    try {
      // TODO: Integrar com backend real
      // const response = await axios.get<RainfallData>(`${this.API_URL}/rainfall/current/${cityId}`);
      // return response.data;
      
      // Mock data para desenvolvimento
      return this.getMockRainfallData(cityId);
    } catch (error) {
      console.error('Erro ao buscar dados de chuva:', error);
      return null;
    }
  }

  /**
   * Busca dados de chuva para múltiplas cidades
   */
  static async getRegionalRainfall(cityIds: string[]): Promise<RainfallData[]> {
    try {
      // TODO: Integrar com backend real
      // const response = await axios.post<RainfallData[]>(`${this.API_URL}/rainfall/regional`, { cityIds });
      // return response.data;
      
      // Mock data para desenvolvimento
      return cityIds.map(id => this.getMockRainfallData(id)).filter(Boolean) as RainfallData[];
    } catch (error) {
      console.error('Erro ao buscar dados regionais de chuva:', error);
      return [];
    }
  }

  /**
   * Busca previsão do tempo para as próximas horas
   */
  static async getHourlyForecast(cityId: string, hours: number = 24): Promise<WeatherForecast | null> {
    try {
      // TODO: Integrar com backend real
      // const response = await axios.get<WeatherForecast>(`${this.API_URL}/forecast/${cityId}?hours=${hours}`);
      // return response.data;
      
      return this.getMockForecast(cityId, hours);
    } catch (error) {
      console.error('Erro ao buscar previsão do tempo:', error);
      return null;
    }
  }

  /**
   * Gera dados mockados para desenvolvimento
   */
  private static getMockRainfallData(cityId: string): RainfallData {
    const mockCities: Record<string, { name: string; lat: number; lon: number }> = {
      '3543204': { name: 'Ribeirão do Sul', lat: -22.7572, lon: -49.9439 },
      '3534708': { name: 'Ourinhos', lat: -22.9789, lon: -49.8708 },
      '3545407': { name: 'Salto Grande', lat: -22.8936, lon: -49.9853 },
      '3550506': { name: 'São Pedro do Turvo', lat: -22.8978, lon: -49.7433 },
      '3510153': { name: 'Canitar', lat: -23.0028, lon: -49.7817 },
      '3538808': { name: 'Piraju', lat: -23.1933, lon: -49.3847 },
      '3546405': { name: 'Santa Cruz do Rio Pardo', lat: -22.8997, lon: -49.6336 },
    };

    const city = mockCities[cityId];
    if (!city) {
      // Retornar dados padrão se a cidade não for encontrada
      return {
        cityId,
        cityName: 'Cidade Desconhecida',
        timestamp: new Date(),
        rainfallIntensity: Math.random() * 100,
        temperature: 20 + Math.random() * 10,
        humidity: 60 + Math.random() * 30,
        windSpeed: 5 + Math.random() * 15,
      };
    }
    
    const baseIntensity = Math.random() * 100;

    return {
      cityId,
      cityName: city.name,
      timestamp: new Date(),
      rainfallIntensity: baseIntensity,
      temperature: 20 + Math.random() * 10,
      humidity: 60 + Math.random() * 30,
      windSpeed: 5 + Math.random() * 15,
    };
  }

  /**
   * Gera previsão mockada
   */
  private static getMockForecast(cityId: string, hours: number): WeatherForecast {
    const forecastHours = Array.from({ length: hours }, (_, i) => {
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() + i);
      
      return {
        timestamp,
        rainfallIntensity: Math.random() * 100,
        temperature: 18 + Math.random() * 12,
        humidity: 50 + Math.random() * 40,
      };
    });

    return {
      cityId,
      forecastHours,
    };
  }

  /**
   * Calcula a cor baseada na intensidade da chuva
   * Retorna um gradiente de azul (mais claro para mais escuro conforme aumenta a intensidade)
   */
  static getRainfallColor(intensity: number): string {
    if (intensity === 0) return 'rgba(220, 220, 220, 0.2)'; // Sem chuva - cinza muito claro
    
    // Gradiente de azul progressivo:
    // 0-20%: Azul muito claro (céu nublado)
    // 20-40%: Azul claro (chuva fraca)
    // 40-60%: Azul médio (chuva moderada)
    // 60-80%: Azul escuro (chuva forte)
    // 80-100%: Azul muito escuro/intenso (chuva intensa)
    
    let red: number, green: number, blue: number, alpha: number;
    
    if (intensity <= 20) {
      // Azul muito claro - início das nuvens
      red = 180;
      green = 200;
      blue = 255;
      alpha = 0.3 + (intensity / 20) * 0.1;
    } else if (intensity <= 40) {
      // Azul claro - chuva fraca
      const t = (intensity - 20) / 20;
      red = Math.floor(180 - t * 60);
      green = Math.floor(200 - t * 80);
      blue = 255;
      alpha = 0.4 + t * 0.1;
    } else if (intensity <= 60) {
      // Azul médio - chuva moderada
      const t = (intensity - 40) / 20;
      red = Math.floor(120 - t * 50);
      green = Math.floor(120 - t * 60);
      blue = 255;
      alpha = 0.5 + t * 0.1;
    } else if (intensity <= 80) {
      // Azul escuro - chuva forte
      const t = (intensity - 60) / 20;
      red = Math.floor(70 - t * 40);
      green = Math.floor(60 - t * 40);
      blue = Math.floor(255 - t * 35);
      alpha = 0.6 + t * 0.15;
    } else {
      // Azul muito escuro/intenso - chuva intensa
      const t = (intensity - 80) / 20;
      red = Math.floor(30 - t * 20);
      green = Math.floor(20 - t * 10);
      blue = Math.floor(220 - t * 20);
      alpha = 0.75 + t * 0.2;
    }
    
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  /**
   * Retorna uma descrição textual da intensidade da chuva
   */
  static getRainfallDescription(intensity: number): string {
    if (intensity === 0) return 'Sem chuva';
    if (intensity <= 20) return 'Nublado';
    if (intensity <= 40) return 'Chuva fraca';
    if (intensity <= 60) return 'Chuva moderada';
    if (intensity <= 80) return 'Chuva forte';
    return 'Chuva intensa';
  }
}
