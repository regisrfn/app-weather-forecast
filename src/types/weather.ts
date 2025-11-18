// Tipos para dados de chuva e previsão do tempo

export interface City {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface RainfallData {
  cityId: string;
  cityName: string;
  timestamp: Date;
  rainfallIntensity: number; // 0-100 (0 = sem chuva, 100 = chuva intensa)
  temperature: number;
  humidity: number;
  windSpeed: number;
}

export interface WeatherForecast {
  cityId: string;
  forecastHours: HourlyForecast[];
}

export interface HourlyForecast {
  timestamp: Date;
  rainfallIntensity: number;
  temperature: number;
  humidity: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}
