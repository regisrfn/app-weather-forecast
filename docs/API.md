# 🔌 API Backend

Documentação da integração com a API backend do Weather Forecast App.

## 📑 Índice

- [Visão Geral](#-visão-geral)
- [Autenticação](#-autenticação)
- [Endpoints](#-endpoints)
- [Tipos e Modelos](#-tipos-e-modelos)
- [Tratamento de Erros](#-tratamento-de-erros)
- [Rate Limiting](#-rate-limiting)
- [Exemplos de Uso](#-exemplos-de-uso)
- [Requisitos do Backend](#-requisitos-do-backend)

## 🎯 Visão Geral

O frontend consome apenas a API backend real.

```env
VITE_API_BASE_URL=https://api.exemplo.com
```
- Consome API REST real com dados meteorológicos
- Backend precisa estar disponível para desenvolvimento e produção

## 🔐 Autenticação

### Método: API Key (Recomendado)

```typescript
// Configuração no apiService.ts
const api = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  headers: {
    'X-API-Key': import.meta.env.VITE_API_KEY
  }
})
```

### Variáveis de Ambiente

```env
VITE_API_KEY=sua_api_key_aqui
```

## 📡 Endpoints

### 1. Buscar Dados Meteorológicos

Retorna previsões para múltiplas cidades dentro de um raio.

```http
GET /api/weather
```

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `centerCityId` | string | Sim | ID IBGE da cidade central |
| `radius` | number | Sim | Raio em km (10-150) |
| `datetime` | string (ISO 8601) | Sim | Data/hora da previsão |

#### Exemplo de Requisição

```typescript
const params = {
  centerCityId: '3543204',  // Ribeirão do Sul, SP
  radius: 50,
  datetime: '2025-11-26T15:00:00Z'
}

const response = await axios.get('/api/weather', { params })
```

```bash
curl "https://api.example.com/api/weather?centerCityId=3543204&radius=50&datetime=2025-11-26T15:00:00Z" \
  -H "X-API-Key: your_api_key"
```

#### Resposta de Sucesso (200 OK)

```json
{
  "data": [
    {
      "cityId": "3543204",
      "cityName": "Ribeirão do Sul",
      "state": "SP",
      "temperature": 28.5,
      "feelsLike": 30.2,
      "condition": "sunny",
      "description": "Céu limpo",
      "humidity": 65,
      "windSpeed": 12,
      "windDirection": 180,
      "pressure": 1013,
      "precipitation": 0,
      "cloudCover": 10,
      "visibility": 10000,
      "uvIndex": 8,
      "coordinates": {
        "lat": -22.7572,
        "lng": -49.9439
      },
      "timestamp": "2025-11-26T15:00:00Z",
      "hourlyForecasts": [
        {
          "timestamp": "2025-11-26T15:00:00Z",
          "temperature": 28.5,
          "precipitation": 0.0,
          "precipitationProbability": 10,
          "humidity": 65,
          "windSpeed": 12.0,
          "windDirection": 180,
          "cloudCover": 10,
          "weatherCode": 1,
          "description": "Mainly clear"
        }
        // ... até 168 horas
      ]
    }
  ],
  "count": 15,
  "metadata": {
    "centerCity": "Ribeirão do Sul",
    "radius": 50,
    "requestedAt": "2025-11-26T14:30:00Z"
  }
}
```

### 2. Buscar Alertas Meteorológicos

Retorna alertas ativos para uma região.

```http
GET /api/alerts
```

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `centerCityId` | string | Sim | ID IBGE da cidade central |
| `radius` | number | Não | Raio em km (padrão: 100) |

#### Exemplo de Requisição

```typescript
const params = {
  centerCityId: '3543204',
  radius: 100
}

const response = await axios.get('/api/alerts', { params })
```

#### Resposta de Sucesso (200 OK)

```json
{
  "data": [
    {
      "id": "alert-123",
      "type": "storm",
      "severity": "high",
      "title": "Alerta de Tempestade",
      "description": "Previsão de tempestade severa com ventos fortes e possibilidade de granizo.",
      "affectedCities": [
        "3543204",
        "3543303"
      ],
      "startTime": "2025-11-26T18:00:00Z",
      "endTime": "2025-11-26T23:00:00Z",
      "issuedAt": "2025-11-26T14:00:00Z",
      "source": "INMET"
    }
  ],
  "count": 1
}
```

### 3. Buscar Histórico (Opcional)

Retorna dados históricos de uma cidade.

```http
GET /api/weather/history/:cityId
```

#### Path Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `cityId` | string | ID IBGE da cidade |

#### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `startDate` | string (ISO 8601) | Sim | Data inicial |
| `endDate` | string (ISO 8601) | Sim | Data final |

#### Exemplo de Requisição

```bash
curl "https://api.example.com/api/weather/history/3543204?startDate=2025-11-20T00:00:00Z&endDate=2025-11-26T00:00:00Z" \
  -H "X-API-Key: your_api_key"
```

## 📦 Tipos e Modelos

### WeatherData

```typescript
interface WeatherData {
  cityId: string              // ID IBGE
  cityName: string            // Nome da cidade
  state: string               // UF (ex: 'SP')
  temperature: number         // Temperatura em °C
  feelsLike: number           // Sensação térmica em °C
  condition: WeatherCondition // Condição climática
  description: string         // Descrição textual
  humidity: number            // Umidade relativa (0-100)
  windSpeed: number           // Velocidade do vento em km/h
  windDirection: number       // Direção do vento em graus (0-360)
  pressure: number            // Pressão atmosférica em hPa
  precipitation: number       // Precipitação em mm
  cloudCover: number          // Cobertura de nuvens (0-100)
  visibility: number          // Visibilidade em metros
  uvIndex: number             // Índice UV (0-11+)
  coordinates: {
    lat: number
    lng: number
  }
  timestamp: string           // ISO 8601
  hourlyForecasts?: HourlyForecast[]  // Opcional: Previsões horárias
}

interface HourlyForecast {
  timestamp: string           // ISO 8601
  temperature: number         // Temperatura em °C
  precipitation: number       // Precipitação em mm
  precipitationProbability: number  // Probabilidade de chuva (0-100)
  humidity: number            // Umidade relativa (0-100)
  windSpeed: number           // Velocidade do vento em km/h
  windDirection: number       // Direção do vento em graus (0-360)
  cloudCover: number          // Cobertura de nuvens (0-100)
  weatherCode: number         // WMO weather code
  description: string         // Descrição textual
}
```

### WeatherCondition

```typescript
type WeatherCondition = 
  | 'sunny'       // Ensolarado
  | 'cloudy'      // Nublado
  | 'rainy'       // Chuvoso
  | 'stormy'      // Tempestade
  | 'foggy'       // Névoa/Neblina
  | 'snowy'       // Neve
  | 'partly-cloudy' // Parcialmente nublado
```

### WeatherAlert

```typescript
interface WeatherAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  affectedCities: string[]    // Array de IDs IBGE
  startTime: string           // ISO 8601
  endTime: string             // ISO 8601
  issuedAt: string            // ISO 8601
  source: string              // Ex: 'INMET', 'CPTEC'
}

type AlertType = 
  | 'storm'
  | 'flood'
  | 'heat'
  | 'cold'
  | 'wind'
  | 'rain'

type AlertSeverity = 
  | 'low'       // Azul
  | 'medium'    // Amarelo
  | 'high'      // Vermelho
```

## ⚠️ Tratamento de Erros

### Códigos de Status HTTP

| Código | Significado | Ação do Frontend |
|--------|-------------|------------------|
| 200 | Success | Exibir dados |
| 400 | Bad Request | Mostrar erro de validação |
| 401 | Unauthorized | Redirecionar para login |
| 404 | Not Found | Exibir "Cidade não encontrada" |
| 429 | Too Many Requests | Mostrar "Muitas requisições, aguarde" |
| 500 | Internal Server Error | Mostrar erro genérico + tentar cache |
| 503 | Service Unavailable | Mostrar "Serviço temporariamente indisponível" |

### Formato de Erro

```json
{
  "error": {
    "code": "INVALID_RADIUS",
    "message": "O raio deve estar entre 10 e 150 km",
    "details": {
      "field": "radius",
      "value": 200,
      "min": 10,
      "max": 150
    }
  }
}
```

### Tratamento no Frontend

```typescript
try {
  const data = await apiService.getWeather(params)
  return data
} catch (error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    
    switch (status) {
      case 400:
        showError('Parâmetros inválidos. Verifique raio e data.')
        break
      case 404:
        showError('Cidade não encontrada.')
        break
      case 429:
        showError('Muitas requisições. Aguarde um momento.')
        break
      case 503:
        showError('Serviço temporariamente indisponível.')
        // Tentar usar dados do cache
        const cached = await cacheService.get(cacheKey)
        if (cached) return cached.data
        break
      default:
        showError('Erro ao carregar dados. Tente novamente.')
    }
  }
  
  throw error
}
```

## 🚦 Rate Limiting

### Limites Recomendados

- **Requests por minuto**: 60
- **Requests por hora**: 1000
- **Requests por dia**: 10000

### Headers de Rate Limit

O backend deve retornar:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1732640400
```

### Tratamento no Frontend

```typescript
const rateLimitInfo = {
  limit: Number(response.headers['x-ratelimit-limit']),
  remaining: Number(response.headers['x-ratelimit-remaining']),
  reset: Number(response.headers['x-ratelimit-reset'])
}

if (rateLimitInfo.remaining < 5) {
  console.warn('Limite de requisições próximo. Considere usar cache.')
}
```

## 💡 Exemplos de Uso

### Caso de Uso 1: Carregar Dados Iniciais

```typescript
async function loadInitialData() {
  const params = {
    centerCityId: APP_CONFIG.CENTER_CITY_ID,
    radius: APP_CONFIG.RADIUS.DEFAULT,
    datetime: new Date().toISOString()
  }
  
  try {
    const weatherData = await apiService.getWeather(params)
    state.weatherData = weatherData
  } catch (error) {
    console.error('Failed to load weather data:', error)
    state.error = 'Não foi possível carregar os dados.'
  }
}
```

### Caso de Uso 2: Atualizar Dados ao Mudar Raio

```typescript
watch(() => state.searchRadius, debounce(async (newRadius) => {
  const params = {
    centerCityId: currentCityId.value,
    radius: newRadius,
    datetime: state.currentDateTime.toISOString()
  }
  
  state.isLoading = true
  
  try {
    const weatherData = await apiService.getWeather(params)
    state.weatherData = weatherData
  } finally {
    state.isLoading = false
  }
}, 500))
```

### Caso de Uso 3: Buscar Alertas

```typescript
async function fetchAlerts() {
  try {
    const alerts = await apiService.getAlerts({
      centerCityId: currentCityId.value,
      radius: 100
    })
    
    state.alerts = alerts.filter(alert => alert.severity === 'high')
  } catch (error) {
    // Alertas são opcionais, não bloqueiam a aplicação
    console.warn('Alerts not available:', error)
    state.alerts = []
  }
}
```

## 📋 Requisitos do Backend

### Obrigatórios

1. ✅ **Endpoint de Weather Data**: `/api/weather`
2. ✅ **Suporte a Query Params**: `centerCityId`, `radius`, `datetime`
3. ✅ **Formato de Resposta JSON**: Conforme especificado
4. ✅ **CORS**: Permitir origem do frontend
5. ✅ **HTTPS**: Em produção

### Recomendados

6. ⭐ **Endpoint de Alerts**: `/api/alerts`
7. ⭐ **Rate Limiting**: Headers `X-RateLimit-*`
8. ⭐ **Caching**: Headers `Cache-Control`, `ETag`
9. ⭐ **Compressão**: Gzip/Brotli
10. ⭐ **Logs**: Structured logging

### Opcionais

11. 💡 **Endpoint de Histórico**: `/api/weather/history/:cityId`
12. 💡 **WebSockets**: Para updates em tempo real
13. 💡 **GraphQL**: Alternativa ao REST
14. 💡 **Autenticação OAuth**: Para usuários autenticados

### Stack Sugerido

- **Node.js** + **Express** ou **Fastify**
- **Python** + **FastAPI** ou **Flask**
- **Go** + **Gin** ou **Echo**

### Fontes de Dados

- **OpenWeatherMap API**: https://openweathermap.org/api
- **INMET** (Brasil): https://portal.inmet.gov.br/
- **CPTEC/INPE** (Brasil): http://servicos.cptec.inpe.br/

## 🔗 Recursos Adicionais

- **Postman Collection**: [Link para collection]
- **OpenAPI Spec**: [Link para swagger.yaml]
- **Backend Repository**: [Link para repo do backend]

---

Para informações sobre deploy, veja [DEPLOY.md](DEPLOY.md).
