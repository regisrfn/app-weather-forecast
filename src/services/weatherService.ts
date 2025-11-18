import type { RainfallData, SubdivisionRainfall, WeatherForecast } from '../types/weather';

/**
 * Serviço para consumir dados meteorológicos do backend
 * Por enquanto retorna dados mockados para desenvolvimento
 */
export class WeatherService {
  private static API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
      '3539103': { name: 'Ourinhos', lat: -22.9789, lon: -49.8708 },
      '3506300': { name: 'Bernardino de Campos', lat: -23.0117, lon: -49.4683 },
      '3510153': { name: 'Canitar', lat: -23.0028, lon: -49.7817 },
      '3552601': { name: 'Santa Cruz do Rio Pardo', lat: -22.8997, lon: -49.6336 },
    };

    const city = mockCities[cityId] || mockCities['3543204'];
    const baseIntensity = Math.random() * 100;

    return {
      cityId,
      cityName: city.name,
      timestamp: new Date(),
      rainfallIntensity: baseIntensity,
      temperature: 20 + Math.random() * 10,
      humidity: 60 + Math.random() * 30,
      windSpeed: 5 + Math.random() * 15,
      subdivisions: this.getMockSubdivisions(cityId, baseIntensity),
    };
  }

  /**
   * Gera subdivisões mockadas dentro de uma cidade
   */
  private static getMockSubdivisions(cityId: string, baseIntensity: number): SubdivisionRainfall[] {
    const subdivisions = ['Centro', 'Norte', 'Sul', 'Leste', 'Oeste'];
    
    return subdivisions.map((name, index) => ({
      id: `${cityId}-${index}`,
      name,
      latitude: -22.7572 + (Math.random() - 0.5) * 0.1,
      longitude: -49.9439 + (Math.random() - 0.5) * 0.1,
      rainfallIntensity: Math.max(0, Math.min(100, baseIntensity + (Math.random() - 0.5) * 40)),
    }));
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
   * Retorna um gradiente de azul (mais escuro = mais chuva)
   */
  static getRainfallColor(intensity: number): string {
    if (intensity === 0) return 'rgba(200, 200, 200, 0.3)'; // Sem chuva - cinza claro
    
    // Escala de azul: 0-100
    const minBlue = 150; // Azul claro
    const maxBlue = 255; // Azul intenso
    const alpha = 0.3 + (intensity / 100) * 0.5; // Transparência aumenta com intensidade
    
    // Quanto maior a intensidade, mais escuro o azul
    const blue = maxBlue;
    const green = Math.floor(minBlue * (1 - intensity / 100));
    const red = Math.floor(minBlue * (1 - intensity / 100));
    
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }
}
