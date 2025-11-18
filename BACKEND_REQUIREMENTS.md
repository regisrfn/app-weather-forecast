# Backend API - Requisitos Simplificados# Backend Requirements - Weather Forecast API



## 🎯 Objetivo## Stack Simples

- **Framework**: Node.js (Express) ou Python (FastAPI)

Backend para fornecer dados meteorológicos em tempo real para Ribeirão do Sul e cidades vizinhas.- **Banco de Dados**: PostgreSQL + PostGIS

- **Cache**: Redis

## 📡 Rotas Necessárias- **Cron Job**: Coleta dados a cada 10 minutos



### 1. Dados de Chuva por Cidade---

```http

GET /api/weather/city/:cityId## APIs Meteorológicas (GRATUITAS)

```

### **INMET** - Instituto Nacional de Meteorologia ⭐ RECOMENDADO

**Resposta:**- 🆓 Gratuito e oficial

```json- 📍 Estações no interior de SP

{- API: https://apitempo.inmet.gov.br

  "cityId": "3543204",

  "cityName": "Ribeirão do Sul",```bash

  "timestamp": "2025-11-18T15:30:00Z",# Estações próximas

  "rainfallIntensity": 45.5,GET https://apitempo.inmet.gov.br/estacao/A707  # Assis

  "temperature": 24.3,

  "humidity": 72.5,# Dados horários

  "windSpeed": 12.8GET https://apitempo.inmet.gov.br/estacao/{codigo_estacao}

}```

```

### **OpenWeatherMap** - Backup

### 2. Dados de Múltiplas Cidades- 💰 Free: 1000 calls/dia

```http- API: https://openweathermap.org/api

POST /api/weather/regional

Content-Type: application/json```bash

GET https://api.openweathermap.org/data/2.5/weather?lat=-22.7572&lon=-49.9439&appid=YOUR_KEY

{```

  "cityIds": ["3543204", "3539103", "3506300"]

}---

```

## Database Schema (PostgreSQL + PostGIS)

**Resposta:**

```json```sql

[-- Cidades

  {CREATE TABLE cities (

    "cityId": "3543204",    id SERIAL PRIMARY KEY,

    "cityName": "Ribeirão do Sul",    ibge_code VARCHAR(7) UNIQUE NOT NULL,

    "timestamp": "2025-11-18T15:30:00Z",    name VARCHAR(100) NOT NULL,

    "rainfallIntensity": 45.5,    state CHAR(2) NOT NULL,

    "temperature": 24.3,    geometry GEOMETRY(MultiPolygon, 4326),

    "humidity": 72.5,    created_at TIMESTAMP DEFAULT NOW()

    "windSpeed": 12.8);

  },

  {-- Subdivisões (bairros)

    "cityId": "3539103",CREATE TABLE city_subdivisions (

    "cityName": "Ourinhos",    id SERIAL PRIMARY KEY,

    "timestamp": "2025-11-18T15:30:00Z",    city_id INTEGER REFERENCES cities(id),

    "rainfallIntensity": 38.2,    name VARCHAR(100),

    "temperature": 25.1,    geometry GEOMETRY(Polygon, 4326)

    "humidity": 68.0,);

    "windSpeed": 10.5

  }-- Dados meteorológicos por subdivisão

]CREATE TABLE subdivision_weather (

```    id BIGSERIAL PRIMARY KEY,

    subdivision_id INTEGER REFERENCES city_subdivisions(id),

### 3. Previsão Horária (Opcional)    timestamp TIMESTAMP NOT NULL,

```http    rainfall_intensity FLOAT, -- 0-100

GET /api/weather/forecast/:cityId?hours=24    temperature FLOAT,

```    humidity FLOAT,

    wind_speed FLOAT

**Resposta:**);

```json

{CREATE INDEX idx_subdivision_weather ON subdivision_weather(subdivision_id, timestamp DESC);

  "cityId": "3543204",```

  "forecastHours": [

    {---

      "timestamp": "2025-11-18T16:00:00Z",

      "rainfallIntensity": 50.0,## API Endpoints (ESSENCIAIS)

      "temperature": 23.8,

      "humidity": 75.0### 1️⃣ Dados Atuais de uma Cidade

    },```

    {GET /api/weather/current/:cityId

      "timestamp": "2025-11-18T17:00:00Z",```

      "rainfallIntensity": 55.2,**Response:**

      "temperature": 23.2,```json

      "humidity": 78.5{

    }  "cityId": "3543204",

  ]  "cityName": "Ribeirão do Sul",

}  "timestamp": "2025-11-18T14:30:00Z",

```  "rainfallIntensity": 45.5,

  "temperature": 24.3,

## 🔌 Fontes de Dados Sugeridas  "humidity": 78.2,

  "windSpeed": 12.5,

### APIs Meteorológicas Gratuitas/Comerciais  "subdivisions": [

    {

1. **OpenWeatherMap** (Recomendado)      "id": "3543204-01",

   - https://openweathermap.org/api      "name": "Centro",

   - Plano gratuito: 60 chamadas/minuto      "rainfallIntensity": 50.2,

   - Dados de precipitação, temperatura, vento      "latitude": -22.7572,

      "longitude": -49.9439

2. **INMET** (Instituto Nacional de Meteorologia)    }

   - https://portal.inmet.gov.br/  ]

   - Dados oficiais do Brasil}

   - API gratuita```



3. **Weather API**### 2️⃣ Dados de Múltiplas Cidades

   - https://www.weatherapi.com/```

   - Plano gratuito: 1M chamadas/mêsPOST /api/weather/regional

   - Dados históricos e previsãoBody: { "cityIds": ["3543204", "3539103", "3506300"] }

```

4. **Open-Meteo****Response:** Array de dados (mesmo formato acima)

   - https://open-meteo.com/

   - Totalmente gratuito### 3️⃣ Previsão

   - Sem necessidade de API key```

GET /api/weather/forecast/:cityId?hours=24

## 📦 Exemplo de Estrutura Backend (Node.js/Express)```

**Response:**

```javascript```json

// server.js{

const express = require('express');  "cityId": "3543204",

const cors = require('cors');  "forecastHours": [

const axios = require('axios');    {

      "timestamp": "2025-11-18T15:00:00Z",

const app = express();      "rainfallIntensity": 35.0,

app.use(cors());      "temperature": 23.5,

app.use(express.json());      "humidity": 75.0

    }

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;  ]

}

// Coordenadas das cidades```

const CITY_COORDS = {

  '3543204': { lat: -22.7572, lon: -49.9439, name: 'Ribeirão do Sul' },---

  '3539103': { lat: -22.9789, lon: -49.8708, name: 'Ourinhos' },

  // ... outras cidades## Lógica do Backend

};

### 1. Cron Job - Coleta de Dados (a cada 10 min)

// Rota: Dados de uma cidade```javascript

app.get('/api/weather/city/:cityId', async (req, res) => {// Coletar dados do INMET/OpenWeather

  try {async function collectWeatherData() {

    const { cityId } = req.params;  const stations = ['A707']; // Assis

    const coords = CITY_COORDS[cityId];  

      for (const station of stations) {

    if (!coords) {    const data = await fetchFromINMET(station);

      return res.status(404).json({ error: 'Cidade não encontrada' });    await saveToDatabase(data);

    }  }

  

    // Buscar dados do OpenWeatherMap  // Calcular dados para subdivisões (interpolação simples)

    const response = await axios.get(  await calculateSubdivisionWeather();

      `https://api.openweathermap.org/data/2.5/weather`,  

      {  // Atualizar cache Redis

        params: {  await updateCache();

          lat: coords.lat,}

          lon: coords.lon,```

          appid: OPENWEATHER_API_KEY,

          units: 'metric',### 2. Interpolação para Subdivisões

          lang: 'pt_br'```javascript

        }// Distribuir dados da estação para subdivisões da cidade

      }// Adicionar variação aleatória de ±20% para simular diferenças locais

    );function interpolateSubdivisions(cityWeather) {

  const subdivisions = ['Centro', 'Norte', 'Sul', 'Leste', 'Oeste'];

    const data = response.data;  

      return subdivisions.map(name => ({

    res.json({    name,

      cityId,    rainfallIntensity: cityWeather.rainfall * (0.8 + Math.random() * 0.4),

      cityName: coords.name,    temperature: cityWeather.temp + (Math.random() - 0.5) * 2,

      timestamp: new Date(),    humidity: cityWeather.humidity + (Math.random() - 0.5) * 10

      rainfallIntensity: calculateRainfallIntensity(data),  }));

      temperature: data.main.temp,}

      humidity: data.main.humidity,```

      windSpeed: data.wind.speed * 3.6 // m/s para km/h

    });### 3. Cache Redis (5 minutos)

  } catch (error) {```javascript

    res.status(500).json({ error: 'Erro ao buscar dados' });// Cachear resposta para reduzir load no DB

  }await redis.setex(`weather:${cityId}`, 300, JSON.stringify(data));

});```



// Rota: Dados regionais---

app.post('/api/weather/regional', async (req, res) => {

  try {## Variáveis de Ambiente

    const { cityIds } = req.body;

    ```env

    const promises = cityIds.map(cityId =># Database

      axios.get(`http://localhost:3000/api/weather/city/${cityId}`)DB_HOST=localhost

        .catch(() => null)DB_PORT=5432

    );DB_NAME=weather_db

    DB_USER=postgres

    const results = await Promise.all(promises);DB_PASSWORD=sua_senha

    const validResults = results

      .filter(r => r !== null)# Redis

      .map(r => r.data);REDIS_HOST=localhost

    REDIS_PORT=6379

    res.json(validResults);

  } catch (error) {# APIs

    res.status(500).json({ error: 'Erro ao buscar dados regionais' });INMET_API_URL=https://apitempo.inmet.gov.br

  }OPENWEATHER_API_KEY=sua_key

});

# App

// Função auxiliar: Calcular intensidade de chuvaNODE_ENV=production

function calculateRainfallIntensity(weatherData) {PORT=3000

  // Lógica para calcular intensidade baseada em:```

  // - Precipitação (rain.1h)

  // - Nuvens (clouds.all)---

  // - Condições (weather[0].main)

  ## Deploy AWS (Simples)

  const clouds = weatherData.clouds?.all || 0;

  const rain = weatherData.rain?.['1h'] || 0;### Opção Serverless (+ Barato)

  ```

  let intensity = 0;API Gateway → Lambda → Aurora Serverless + Redis

  Cost: ~$30-50/mês

  // Chuva em mm/h```

  if (rain > 0) {

    intensity = Math.min(100, rain * 20); // 5mm = 100%### Terraform Básico

  } else {```hcl

    // Baseado em cobertura de nuvensresource "aws_lambda_function" "api" {

    intensity = clouds * 0.3; // Max 30% sem chuva efetiva  function_name = "weather-api"

  }  runtime       = "nodejs20.x"

    handler       = "index.handler"

  return intensity;  timeout       = 30

}  

  environment {

const PORT = process.env.PORT || 3000;    variables = {

app.listen(PORT, () => {      DB_HOST    = aws_db_instance.postgres.endpoint

  console.log(`Backend rodando na porta ${PORT}`);      REDIS_HOST = aws_elasticache_cluster.redis.cache_nodes[0].address

});    }

```  }

}

## 🚀 Como Iniciar o Backend

resource "aws_db_instance" "postgres" {

```bash  engine            = "postgres"

# Instalar dependências  instance_class    = "db.t3.micro"

npm init -y  allocated_storage = 20

npm install express cors axios dotenv}



# Criar arquivo .envresource "aws_elasticache_cluster" "redis" {

echo "OPENWEATHER_API_KEY=sua_chave_aqui" > .env  cluster_id      = "weather-cache"

echo "PORT=3000" >> .env  engine          = "redis"

  node_type       = "cache.t3.micro"

# Iniciar servidor  num_cache_nodes = 1

node server.js}

``````



## 📋 Checklist de Implementação---



- [ ] Escolher fonte de dados meteorológicos## Checklist MVP

- [ ] Obter API key (se necessário)

- [ ] Implementar rota `/api/weather/city/:cityId`- [ ] Setup PostgreSQL + PostGIS

- [ ] Implementar rota `/api/weather/regional`- [ ] Criar tabelas (cities, subdivisions, weather)

- [ ] Adicionar coordenadas de todas as cidades- [ ] Implementar 3 endpoints principais

- [ ] Implementar cálculo de intensidade de chuva- [ ] Integrar com INMET API

- [ ] Configurar CORS para aceitar requisições do frontend- [ ] Criar cron job (10 minutos)

- [ ] Adicionar cache para reduzir chamadas à API externa- [ ] Adicionar cache Redis

- [ ] Implementar tratamento de erros- [ ] Deploy na AWS

- [ ] (Opcional) Implementar rota de previsão horária

---

## 🔧 Configuração no Frontend

## Resumo

Atualizar `src/services/weatherService.ts`:

**O que o backend precisa fazer:**

```typescript1. ✅ Coletar dados do INMET a cada 10 minutos

// Descomentar e configurar2. ✅ Calcular dados para subdivisões das cidades

private static API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';3. ✅ Servir 3 endpoints: `/current`, `/regional`, `/forecast`

4. ✅ Cachear respostas (Redis, 5 min)

static async getCurrentRainfall(cityId: string): Promise<RainfallData | null> {5. ✅ Deploy simples na AWS

  try {

    const response = await axios.get<RainfallData>(**Cidades para monitorar:**

      `${this.API_URL}/weather/city/${cityId}`- Ribeirão do Sul (3543204) - FOCAL

    );- Ourinhos (3539103)

    return response.data;- Bernardino de Campos (3506300)

  } catch (error) {- Canitar (3510153)

    console.error('Erro ao buscar dados de chuva:', error);- Santa Cruz do Rio Pardo (3552601)

    return null;
  }
}

static async getRegionalRainfall(cityIds: string[]): Promise<RainfallData[]> {
  try {
    const response = await axios.post<RainfallData[]>(
      `${this.API_URL}/weather/regional`,
      { cityIds }
    );
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar dados regionais de chuva:', error);
    return [];
  }
}
```

Criar arquivo `.env` no frontend:
```
VITE_API_URL=http://localhost:3000/api
```

## 📝 Notas

- O frontend já está preparado para consumir essas rotas
- Atualmente usa dados mockados para demonstração
- Basta implementar o backend e atualizar as URLs
- Considere adicionar rate limiting e cache no backend
