# Backend API - Requisitos# Backend API - Requisitos# Backend API - Requisitos Simplificados# Backend Requirements - Weather Forecast API



## 🎯 Objetivo



Backend para fornecer dados meteorológicos em tempo real para Ribeirão do Sul e cidades vizinhas.## 🎯 Objetivo



## 📡 Rotas Necessárias



### 1. Cidades VizinhasBackend para fornecer dados meteorológicos em tempo real para Ribeirão do Sul e cidades vizinhas.## 🎯 Objetivo## Stack Simples

```http

GET /api/cities/neighbors/:cityId?radius=50

```

## 📡 Rotas Necessárias- **Framework**: Node.js (Express) ou Python (FastAPI)

**Parâmetros:**

- `cityId` - Código IBGE da cidade (ex: 3543204 para Ribeirão do Sul)

- `radius` - Raio em quilômetros (opcional, padrão: 50)

### 1. Cidades VizinhasBackend para fornecer dados meteorológicos em tempo real para Ribeirão do Sul e cidades vizinhas.- **Banco de Dados**: PostgreSQL + PostGIS

**Resposta:**

```json```http

{

  "centerCity": {GET /api/cities/neighbors/:cityId?radius=50- **Cache**: Redis

    "id": "3543204",

    "name": "Ribeirão do Sul",```

    "latitude": -22.7572,

    "longitude": -49.9439## 📡 Rotas Necessárias- **Cron Job**: Coleta dados a cada 10 minutos

  },

  "neighbors": [**Parâmetros:**

    {

      "id": "3534708",- `cityId` - Código IBGE da cidade (ex: 3543204 para Ribeirão do Sul)

      "name": "Ourinhos",

      "latitude": -22.9789,- `radius` - Raio em quilômetros (opcional, padrão: 50)

      "longitude": -49.8708,

      "distance": 24.5### 1. Dados de Chuva por Cidade---

    },

    {**Resposta:**

      "id": "3545407",

      "name": "Salto Grande",```json```http

      "latitude": -22.8936,

      "longitude": -49.9853,{

      "distance": 18.2

    },  "centerCity": {GET /api/weather/city/:cityId## APIs Meteorológicas (GRATUITAS)

    {

      "id": "3550506",    "id": "3543204",

      "name": "São Pedro do Turvo",

      "latitude": -22.8978,    "name": "Ribeirão do Sul",```

      "longitude": -49.7433,

      "distance": 17.8    "latitude": -22.7572,

    }

  ]    "longitude": -49.9439### **INMET** - Instituto Nacional de Meteorologia ⭐ RECOMENDADO

}

```  },



### 2. Dados de Chuva por Cidade  "neighbors": [**Resposta:**- 🆓 Gratuito e oficial

```http

GET /api/weather/city/:cityId    {

```

      "id": "3539103",```json- 📍 Estações no interior de SP

**Resposta:**

```json      "name": "Ourinhos",

{

  "cityId": "3543204",      "latitude": -22.9789,{- API: https://apitempo.inmet.gov.br

  "cityName": "Ribeirão do Sul",

  "timestamp": "2025-11-18T15:30:00Z",      "longitude": -49.8708,

  "rainfallIntensity": 45.5,

  "temperature": 24.3,      "distance": 24.5  "cityId": "3543204",

  "humidity": 72.5,

  "windSpeed": 12.8    },

}

```    {  "cityName": "Ribeirão do Sul",```bash



### 3. Dados de Múltiplas Cidades      "id": "3543907",

```http

POST /api/weather/regional      "name": "Salto Grande",  "timestamp": "2025-11-18T15:30:00Z",# Estações próximas

Content-Type: application/json

      "latitude": -22.7367,

{

  "cityIds": ["3543204", "3534708", "3545407", "3550506"]      "longitude": -49.7028,  "rainfallIntensity": 45.5,GET https://apitempo.inmet.gov.br/estacao/A707  # Assis

}

```      "distance": 18.2



**Resposta:**    },  "temperature": 24.3,

```json

[    {

  {

    "cityId": "3543204",      "id": "3545001",  "humidity": 72.5,# Dados horários

    "cityName": "Ribeirão do Sul",

    "timestamp": "2025-11-18T15:30:00Z",      "name": "São Pedro do Turvo",

    "rainfallIntensity": 45.5,

    "temperature": 24.3,      "latitude": -22.8978,  "windSpeed": 12.8GET https://apitempo.inmet.gov.br/estacao/{codigo_estacao}

    "humidity": 72.5,

    "windSpeed": 12.8      "longitude": -49.7433,

  }

]      "distance": 17.8}```

```

    },

### 4. Previsão Horária (Opcional)

```http    {```

GET /api/weather/forecast/:cityId?hours=24

```      "id": "3510005",



## 🗺️ Cidades Vizinhas de Ribeirão do Sul      "name": "Campos Novos Paulista",### **OpenWeatherMap** - Backup



**Códigos IBGE corretos:**      "latitude": -22.6089,

- **Ribeirão do Sul** (3543204)

- **Ourinhos** (3534708) - ~25 km      "longitude": -49.9997,### 2. Dados de Múltiplas Cidades- 💰 Free: 1000 calls/dia

- **Salto Grande** (3545407) - ~18 km  

- **São Pedro do Turvo** (3550506) - ~18 km      "distance": 16.9

- **Canitar** (3510153) - ~30 km

- **Santa Cruz do Rio Pardo** (3546405) - ~35 km    }```http- API: https://openweathermap.org/api

- **Piraju** (3538808) - ~45 km

  ]

## 🔌 Fontes de Dados

}POST /api/weather/regional

### APIs Meteorológicas

```

1. **OpenWeatherMap**

   - https://openweathermap.org/apiContent-Type: application/json```bash

   - Plano gratuito: 60 chamadas/minuto

### 2. Dados de Chuva por Cidade

2. **INMET**

   - https://portal.inmet.gov.br/```httpGET https://api.openweathermap.org/data/2.5/weather?lat=-22.7572&lon=-49.9439&appid=YOUR_KEY

   - Dados oficiais do Brasil

GET /api/weather/city/:cityId

3. **Weather API**

   - https://www.weatherapi.com/```{```

   - Plano gratuito: 1M chamadas/mês



## 📦 Exemplo Backend (Node.js/Express)

**Resposta:**  "cityIds": ["3543204", "3539103", "3506300"]

```javascript

// server.js```json

const express = require('express');

const cors = require('cors');{}---

const axios = require('axios');

  "cityId": "3543204",

const app = express();

app.use(cors());  "cityName": "Ribeirão do Sul",```

app.use(express.json());

  "timestamp": "2025-11-18T15:30:00Z",

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

  "rainfallIntensity": 45.5,## Database Schema (PostgreSQL + PostGIS)

// Coordenadas das cidades (IDs IBGE corretos)

const CITY_COORDS = {  "temperature": 24.3,

  '3543204': { lat: -22.7572, lon: -49.9439, name: 'Ribeirão do Sul' },

  '3534708': { lat: -22.9789, lon: -49.8708, name: 'Ourinhos' },  "humidity": 72.5,**Resposta:**

  '3545407': { lat: -22.8936, lon: -49.9853, name: 'Salto Grande' },

  '3550506': { lat: -22.8978, lon: -49.7433, name: 'São Pedro do Turvo' },  "windSpeed": 12.8

  '3510153': { lat: -23.0028, lon: -49.7817, name: 'Canitar' },

  '3546405': { lat: -22.8997, lon: -49.6336, name: 'Santa Cruz do Rio Pardo' },}```json```sql

  '3538808': { lat: -23.1933, lon: -49.3847, name: 'Piraju' },

};```



// Rota 1: Cidades vizinhas[-- Cidades

app.get('/api/cities/neighbors/:cityId', (req, res) => {

  const { cityId } = req.params;### 3. Dados de Múltiplas Cidades

  const radius = parseFloat(req.query.radius) || 50;

  ```http  {CREATE TABLE cities (

  const centerCity = CITY_COORDS[cityId];

  if (!centerCity) {POST /api/weather/regional

    return res.status(404).json({ error: 'Cidade não encontrada' });

  }Content-Type: application/json    "cityId": "3543204",    id SERIAL PRIMARY KEY,

  

  const neighbors = Object.entries(CITY_COORDS)

    .filter(([id]) => id !== cityId)

    .map(([id, coords]) => {{    "cityName": "Ribeirão do Sul",    ibge_code VARCHAR(7) UNIQUE NOT NULL,

      const distance = calculateDistance(

        centerCity.lat, centerCity.lon,  "cityIds": ["3543204", "3539103", "3543907", "3545001"]

        coords.lat, coords.lon

      );}    "timestamp": "2025-11-18T15:30:00Z",    name VARCHAR(100) NOT NULL,

      

      return {```

        id,

        name: coords.name,    "rainfallIntensity": 45.5,    state CHAR(2) NOT NULL,

        latitude: coords.lat,

        longitude: coords.lon,**Resposta:**

        distance: parseFloat(distance.toFixed(1))

      };```json    "temperature": 24.3,    geometry GEOMETRY(MultiPolygon, 4326),

    })

    .filter(city => city.distance <= radius)[

    .sort((a, b) => a.distance - b.distance);

    {    "humidity": 72.5,    created_at TIMESTAMP DEFAULT NOW()

  res.json({

    centerCity: {    "cityId": "3543204",

      id: cityId,

      name: centerCity.name,    "cityName": "Ribeirão do Sul",    "windSpeed": 12.8);

      latitude: centerCity.lat,

      longitude: centerCity.lon    "timestamp": "2025-11-18T15:30:00Z",

    },

    neighbors    "rainfallIntensity": 45.5,  },

  });

});    "temperature": 24.3,



// Rota 2: Dados de uma cidade    "humidity": 72.5,  {-- Subdivisões (bairros)

app.get('/api/weather/city/:cityId', async (req, res) => {

  try {    "windSpeed": 12.8

    const { cityId } = req.params;

    const coords = CITY_COORDS[cityId];  }    "cityId": "3539103",CREATE TABLE city_subdivisions (

    

    if (!coords) {]

      return res.status(404).json({ error: 'Cidade não encontrada' });

    }```    "cityName": "Ourinhos",    id SERIAL PRIMARY KEY,



    const response = await axios.get(

      `https://api.openweathermap.org/data/2.5/weather`,

      {### 4. Previsão Horária (Opcional)    "timestamp": "2025-11-18T15:30:00Z",    city_id INTEGER REFERENCES cities(id),

        params: {

          lat: coords.lat,```http

          lon: coords.lon,

          appid: OPENWEATHER_API_KEY,GET /api/weather/forecast/:cityId?hours=24    "rainfallIntensity": 38.2,    name VARCHAR(100),

          units: 'metric',

          lang: 'pt_br'```

        }

      }    "temperature": 25.1,    geometry GEOMETRY(Polygon, 4326)

    );

## 🗺️ Cidades Vizinhas de Ribeirão do Sul

    const data = response.data;

        "humidity": 68.0,);

    res.json({

      cityId,**Principais cidades vizinhas:**

      cityName: coords.name,

      timestamp: new Date(),- **Ourinhos** (3539103) - ~25 km    "windSpeed": 10.5

      rainfallIntensity: calculateRainfallIntensity(data),

      temperature: data.main.temp,- **Salto Grande** (3543907) - ~18 km

      humidity: data.main.humidity,

      windSpeed: data.wind.speed * 3.6- **São Pedro do Turvo** (3545001) - ~18 km  }-- Dados meteorológicos por subdivisão

    });

  } catch (error) {- **Campos Novos Paulista** (3510005) - ~17 km

    res.status(500).json({ error: 'Erro ao buscar dados' });

  }]CREATE TABLE subdivision_weather (

});

## 🔌 Fontes de Dados

// Rota 3: Dados regionais

app.post('/api/weather/regional', async (req, res) => {```    id BIGSERIAL PRIMARY KEY,

  try {

    const { cityIds } = req.body;### APIs Meteorológicas

    

    const promises = cityIds.map(cityId =>    subdivision_id INTEGER REFERENCES city_subdivisions(id),

      axios.get(`http://localhost:3000/api/weather/city/${cityId}`)

        .catch(() => null)1. **OpenWeatherMap**

    );

       - https://openweathermap.org/api### 3. Previsão Horária (Opcional)    timestamp TIMESTAMP NOT NULL,

    const results = await Promise.all(promises);

    const validResults = results   - Plano gratuito: 60 chamadas/minuto

      .filter(r => r !== null)

      .map(r => r.data);```http    rainfall_intensity FLOAT, -- 0-100

    

    res.json(validResults);2. **INMET**

  } catch (error) {

    res.status(500).json({ error: 'Erro ao buscar dados regionais' });   - https://portal.inmet.gov.br/GET /api/weather/forecast/:cityId?hours=24    temperature FLOAT,

  }

});   - Dados oficiais do Brasil



// Função: Calcular distância (Haversine)```    humidity FLOAT,

function calculateDistance(lat1, lon1, lat2, lon2) {

  const R = 6371; // Raio da Terra em km3. **Weather API**

  const dLat = (lat2 - lat1) * Math.PI / 180;

  const dLon = (lon2 - lon1) * Math.PI / 180;   - https://www.weatherapi.com/    wind_speed FLOAT

  

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +   - Plano gratuito: 1M chamadas/mês

            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *

            Math.sin(dLon/2) * Math.sin(dLon/2);**Resposta:**);

  

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));## 📦 Exemplo Backend (Node.js/Express)

  return R * c;

}```json



// Função: Calcular intensidade de chuva```javascript

function calculateRainfallIntensity(weatherData) {

  const clouds = weatherData.clouds?.all || 0;// server.js{CREATE INDEX idx_subdivision_weather ON subdivision_weather(subdivision_id, timestamp DESC);

  const rain = weatherData.rain?.['1h'] || 0;

  const express = require('express');

  if (rain > 0) {

    return Math.min(100, rain * 20);const cors = require('cors');  "cityId": "3543204",```

  }

  const axios = require('axios');

  return clouds * 0.3;

}  "forecastHours": [



const PORT = process.env.PORT || 3000;const app = express();

app.listen(PORT, () => {

  console.log(`Backend rodando na porta ${PORT}`);app.use(cors());    {---

});

```app.use(express.json());



## 🚀 Como Iniciar      "timestamp": "2025-11-18T16:00:00Z",



```bashconst OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

npm init -y

npm install express cors axios dotenv      "rainfallIntensity": 50.0,## API Endpoints (ESSENCIAIS)



echo "OPENWEATHER_API_KEY=sua_chave_aqui" > .env// Coordenadas das cidades

echo "PORT=3000" >> .env

const CITY_COORDS = {      "temperature": 23.8,

node server.js

```  '3543204': { lat: -22.7572, lon: -49.9439, name: 'Ribeirão do Sul' },



## 📋 Checklist  '3539103': { lat: -22.9789, lon: -49.8708, name: 'Ourinhos' },      "humidity": 75.0### 1️⃣ Dados Atuais de uma Cidade



- [ ] Implementar rota `/api/cities/neighbors/:cityId`  '3543907': { lat: -22.7367, lon: -49.7028, name: 'Salto Grande' },

- [ ] Implementar rota `/api/weather/city/:cityId`

- [ ] Implementar rota `/api/weather/regional`  '3545001': { lat: -22.8978, lon: -49.7433, name: 'São Pedro do Turvo' },    },```

- [ ] Obter API key do OpenWeatherMap

- [ ] Configurar CORS  '3510005': { lat: -22.6089, lon: -49.9997, name: 'Campos Novos Paulista' },

- [ ] Adicionar cache (Redis)

- [ ] Implementar tratamento de erros};    {GET /api/weather/current/:cityId




// Rota 1: Cidades vizinhas      "timestamp": "2025-11-18T17:00:00Z",```

app.get('/api/cities/neighbors/:cityId', (req, res) => {

  const { cityId } = req.params;      "rainfallIntensity": 55.2,**Response:**

  const radius = parseFloat(req.query.radius) || 50;

        "temperature": 23.2,```json

  const centerCity = CITY_COORDS[cityId];

  if (!centerCity) {      "humidity": 78.5{

    return res.status(404).json({ error: 'Cidade não encontrada' });

  }    }  "cityId": "3543204",

  

  const neighbors = Object.entries(CITY_COORDS)  ]  "cityName": "Ribeirão do Sul",

    .filter(([id]) => id !== cityId)

    .map(([id, coords]) => {}  "timestamp": "2025-11-18T14:30:00Z",

      const distance = calculateDistance(

        centerCity.lat, centerCity.lon,```  "rainfallIntensity": 45.5,

        coords.lat, coords.lon

      );  "temperature": 24.3,

      

      return {## 🔌 Fontes de Dados Sugeridas  "humidity": 78.2,

        id,

        name: coords.name,  "windSpeed": 12.5,

        latitude: coords.lat,

        longitude: coords.lon,### APIs Meteorológicas Gratuitas/Comerciais  "subdivisions": [

        distance: parseFloat(distance.toFixed(1))

      };    {

    })

    .filter(city => city.distance <= radius)1. **OpenWeatherMap** (Recomendado)      "id": "3543204-01",

    .sort((a, b) => a.distance - b.distance);

     - https://openweathermap.org/api      "name": "Centro",

  res.json({

    centerCity: {   - Plano gratuito: 60 chamadas/minuto      "rainfallIntensity": 50.2,

      id: cityId,

      name: centerCity.name,   - Dados de precipitação, temperatura, vento      "latitude": -22.7572,

      latitude: centerCity.lat,

      longitude: centerCity.lon      "longitude": -49.9439

    },

    neighbors2. **INMET** (Instituto Nacional de Meteorologia)    }

  });

});   - https://portal.inmet.gov.br/  ]



// Rota 2: Dados de uma cidade   - Dados oficiais do Brasil}

app.get('/api/weather/city/:cityId', async (req, res) => {

  try {   - API gratuita```

    const { cityId } = req.params;

    const coords = CITY_COORDS[cityId];

    

    if (!coords) {3. **Weather API**### 2️⃣ Dados de Múltiplas Cidades

      return res.status(404).json({ error: 'Cidade não encontrada' });

    }   - https://www.weatherapi.com/```



    const response = await axios.get(   - Plano gratuito: 1M chamadas/mêsPOST /api/weather/regional

      `https://api.openweathermap.org/data/2.5/weather`,

      {   - Dados históricos e previsãoBody: { "cityIds": ["3543204", "3539103", "3506300"] }

        params: {

          lat: coords.lat,```

          lon: coords.lon,

          appid: OPENWEATHER_API_KEY,4. **Open-Meteo****Response:** Array de dados (mesmo formato acima)

          units: 'metric',

          lang: 'pt_br'   - https://open-meteo.com/

        }

      }   - Totalmente gratuito### 3️⃣ Previsão

    );

   - Sem necessidade de API key```

    const data = response.data;

    GET /api/weather/forecast/:cityId?hours=24

    res.json({

      cityId,## 📦 Exemplo de Estrutura Backend (Node.js/Express)```

      cityName: coords.name,

      timestamp: new Date(),**Response:**

      rainfallIntensity: calculateRainfallIntensity(data),

      temperature: data.main.temp,```javascript```json

      humidity: data.main.humidity,

      windSpeed: data.wind.speed * 3.6// server.js{

    });

  } catch (error) {const express = require('express');  "cityId": "3543204",

    res.status(500).json({ error: 'Erro ao buscar dados' });

  }const cors = require('cors');  "forecastHours": [

});

const axios = require('axios');    {

// Rota 3: Dados regionais

app.post('/api/weather/regional', async (req, res) => {      "timestamp": "2025-11-18T15:00:00Z",

  try {

    const { cityIds } = req.body;const app = express();      "rainfallIntensity": 35.0,

    

    const promises = cityIds.map(cityId =>app.use(cors());      "temperature": 23.5,

      axios.get(`http://localhost:3000/api/weather/city/${cityId}`)

        .catch(() => null)app.use(express.json());      "humidity": 75.0

    );

        }

    const results = await Promise.all(promises);

    const validResults = resultsconst OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;  ]

      .filter(r => r !== null)

      .map(r => r.data);}

    

    res.json(validResults);// Coordenadas das cidades```

  } catch (error) {

    res.status(500).json({ error: 'Erro ao buscar dados regionais' });const CITY_COORDS = {

  }

});  '3543204': { lat: -22.7572, lon: -49.9439, name: 'Ribeirão do Sul' },---



// Função: Calcular distância (Haversine)  '3539103': { lat: -22.9789, lon: -49.8708, name: 'Ourinhos' },

function calculateDistance(lat1, lon1, lat2, lon2) {

  const R = 6371; // Raio da Terra em km  // ... outras cidades## Lógica do Backend

  const dLat = (lat2 - lat1) * Math.PI / 180;

  const dLon = (lon2 - lon1) * Math.PI / 180;};

  

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +### 1. Cron Job - Coleta de Dados (a cada 10 min)

            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *

            Math.sin(dLon/2) * Math.sin(dLon/2);// Rota: Dados de uma cidade```javascript

  

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));app.get('/api/weather/city/:cityId', async (req, res) => {// Coletar dados do INMET/OpenWeather

  return R * c;

}  try {async function collectWeatherData() {



// Função: Calcular intensidade de chuva    const { cityId } = req.params;  const stations = ['A707']; // Assis

function calculateRainfallIntensity(weatherData) {

  const clouds = weatherData.clouds?.all || 0;    const coords = CITY_COORDS[cityId];  

  const rain = weatherData.rain?.['1h'] || 0;

        for (const station of stations) {

  if (rain > 0) {

    return Math.min(100, rain * 20);    if (!coords) {    const data = await fetchFromINMET(station);

  }

        return res.status(404).json({ error: 'Cidade não encontrada' });    await saveToDatabase(data);

  return clouds * 0.3;

}    }  }



const PORT = process.env.PORT || 3000;  

app.listen(PORT, () => {

  console.log(`Backend rodando na porta ${PORT}`);    // Buscar dados do OpenWeatherMap  // Calcular dados para subdivisões (interpolação simples)

});

```    const response = await axios.get(  await calculateSubdivisionWeather();



## 🚀 Como Iniciar      `https://api.openweathermap.org/data/2.5/weather`,  



```bash      {  // Atualizar cache Redis

npm init -y

npm install express cors axios dotenv        params: {  await updateCache();



echo "OPENWEATHER_API_KEY=sua_chave_aqui" > .env          lat: coords.lat,}

echo "PORT=3000" >> .env

          lon: coords.lon,```

node server.js

```          appid: OPENWEATHER_API_KEY,



## 📋 Checklist          units: 'metric',### 2. Interpolação para Subdivisões



- [ ] Implementar rota `/api/cities/neighbors/:cityId`          lang: 'pt_br'```javascript

- [ ] Implementar rota `/api/weather/city/:cityId`

- [ ] Implementar rota `/api/weather/regional`        }// Distribuir dados da estação para subdivisões da cidade

- [ ] Obter API key do OpenWeatherMap

- [ ] Configurar CORS      }// Adicionar variação aleatória de ±20% para simular diferenças locais

- [ ] Adicionar cache (Redis)

- [ ] Implementar tratamento de erros    );function interpolateSubdivisions(cityWeather) {


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
