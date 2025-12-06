// Tipos para dados de chuva e previsão do tempo

export interface City {
  id: string;
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}

export type AlertSeverity = 'info' | 'warning' | 'alert' | 'danger';

export interface WeatherAlert {
  code: string;
  severity: AlertSeverity;
  description: string;
  timestamp: string;
  details?: Record<string, any>; // Detalhes técnicos opcionais (rain_mm_h, wind_speed_kmh, temperature_c, etc.)
}

export interface RainfallData {
  cityId: string;
  cityName: string;
  timestamp: Date | string; // Aceita Date ou ISO string
  rainfallIntensity: number; // 0-100 (0 = sem chuva, 100 = chuva intensa)
  temperature: number;
  humidity: number;
  windSpeed: number;
  clouds?: number; // 0-100 (% de cobertura de nuvens)
  weatherAlert?: WeatherAlert[]; // Lista de alertas meteorológicos
  tempMin?: number; // Temperatura mínima (°C)
  tempMax?: number; // Temperatura máxima (°C)
}

// Tipos para resposta detalhada da API
export interface CityInfo {
  cityId: string;
  cityName: string;
  state: string;
}
export interface CurrentWeather extends RainfallData {
  rainfallProbability: number;
  rainVolumeHour: number;
  dailyRainAccumulation: number;
  description: string;
  feelsLike: number;
  pressure: number;
  visibility: number;
  clouds: number; // Override: sempre presente em CurrentWeather
  cloudsDescription: string;
  windDirection: number; // Direção do vento em graus (0-360)
  timestamp: string; // Override: sempre string ISO na API
}

export interface WeatherForecast {
  cityId: string;
  forecastHours: HourlyForecast[];
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface DailyForecast {
  date: string;
  tempMin: number;
  tempMax: number;
  precipitationMm: number;
  rainProbability: number;
  rainfallIntensity: number; // 0-100 (0 = sem chuva, 100 = chuva intensa)
  windSpeedMax: number;
  windSpeed?: number;
  windDirection: number;
  windDirectionArrow?: string;
  uvIndex: number;
  uvRiskLevel: string;
  uvRiskColor: string;
  sunrise: string;
  sunset: string;
  precipitationHours: number;
  daylightHours: number;
  moonPhase: string;
  weatherDescription: string;
}

export interface HourlyForecast {
  timestamp: string;  // ISO 8601 format
  temperature: number;
  precipitation: number;
  precipitationProbability: number;
  rainfallIntensity?: number; // 0-100 (0 = sem chuva, 100 = chuva intensa)
  humidity: number;
  windSpeed: number;
  windDirection: number;
  cloudCover: number;
  weatherCode: number;
  description: string;  // Descrição em português do weather code
}

export interface DetailedWeatherResponse {
  cityInfo: CityInfo;
  currentWeather: CurrentWeather;
  dailyForecasts: DailyForecast[];
  hourlyForecasts: HourlyForecast[];
}
