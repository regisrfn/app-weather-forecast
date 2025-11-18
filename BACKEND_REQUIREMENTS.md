# 📡 API Backend - Documentação

## 🎯 Visão Geral

API RESTful para fornecer dados meteorológicos em tempo real para Ribeirão do Sul e cidades vizinhas.

**Base URL:** `http://localhost:3000/api`

---

## 🌍 Endpoints

### 1. Buscar Cidades Vizinhas

Retorna a cidade centro e suas cidades vizinhas dentro de um raio especificado.

#### **GET** `/api/cities/neighbors/:cityId`

#### Parâmetros de Rota
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `cityId` | string | ✅ Sim | Código IBGE da cidade centro (ex: `3543204`) |

#### Parâmetros de Query
| Parâmetro | Tipo | Obrigatório | Padrão | Descrição |
|-----------|------|-------------|--------|-----------|
| `radius` | number | ❌ Não | `50` | Raio de busca em quilômetros (10-150) |

#### Exemplo de Requisição
```bash
GET /api/cities/neighbors/3543204?radius=50
```

#### Resposta de Sucesso (200 OK)
```json
{
  "centerCity": {
    "id": "3543204",
    "name": "Ribeirão do Sul",
    "latitude": -22.7572,
    "longitude": -49.9439
  },
  "neighbors": [
    {
      "id": "3550506",
      "name": "São Pedro do Turvo",
      "latitude": -22.8978,
      "longitude": -49.7433,
      "distance": 17.8
    },
    {
      "id": "3545407",
      "name": "Salto Grande",
      "latitude": -22.8936,
      "longitude": -49.9853,
      "distance": 18.2
    },
    {
      "id": "3534708",
      "name": "Ourinhos",
      "latitude": -22.9789,
      "longitude": -49.8708,
      "distance": 24.5
    },
    {
      "id": "3510153",
      "name": "Canitar",
      "latitude": -23.0028,
      "longitude": -49.7817,
      "distance": 30.1
    },
    {
      "id": "3546405",
      "name": "Santa Cruz do Rio Pardo",
      "latitude": -22.8997,
      "longitude": -49.6336,
      "distance": 35.7
    },
    {
      "id": "3538808",
      "name": "Piraju",
      "latitude": -23.1933,
      "longitude": -49.3847,
      "distance": 47.2
    }
  ]
}
```

#### Estrutura da Resposta
```typescript
{
  centerCity: {
    id: string;           // Código IBGE
    name: string;         // Nome da cidade
    latitude: number;     // Latitude (decimal)
    longitude: number;    // Longitude (decimal)
  };
  neighbors: Array<{
    id: string;           // Código IBGE
    name: string;         // Nome da cidade
    latitude: number;     // Latitude (decimal)
    longitude: number;    // Longitude (decimal)
    distance: number;     // Distância em km (Haversine)
  }>;
}
```

#### Erros
| Código | Descrição |
|--------|-----------|
| `404` | Cidade não encontrada |
| `400` | Parâmetro `radius` inválido |

---

### 2. Dados Climáticos de Uma Cidade

Retorna os dados meteorológicos atuais de uma cidade específica.

#### **GET** `/api/weather/city/:cityId`

#### Parâmetros de Rota
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `cityId` | string | ✅ Sim | Código IBGE da cidade (ex: `3543204`) |

#### Exemplo de Requisição
```bash
GET /api/weather/city/3543204
```

#### Resposta de Sucesso (200 OK)
```json
{
  "cityId": "3543204",
  "cityName": "Ribeirão do Sul",
  "timestamp": "2025-11-18T15:30:00.000Z",
  "rainfallIntensity": 45.5,
  "temperature": 24.3,
  "humidity": 72.5,
  "windSpeed": 12.8
}
```

#### Estrutura da Resposta
```typescript
{
  cityId: string;            // Código IBGE
  cityName: string;          // Nome da cidade
  timestamp: string;         // Data/hora ISO 8601
  rainfallIntensity: number; // Intensidade de chuva (0-100%)
  temperature: number;       // Temperatura em °C
  humidity: number;          // Umidade relativa (%)
  windSpeed: number;         // Velocidade do vento (km/h)
}
```

#### Erros
| Código | Descrição |
|--------|-----------|
| `404` | Cidade não encontrada |
| `500` | Erro ao buscar dados meteorológicos |

---

### 3. Dados Climáticos de Múltiplas Cidades

Retorna os dados meteorológicos de várias cidades em uma única requisição.

#### **POST** `/api/weather/regional`

#### Corpo da Requisição
```json
{
  "cityIds": ["3543204", "3534708", "3545407", "3550506"]
}
```

#### Estrutura do Body
```typescript
{
  cityIds: string[];  // Array de códigos IBGE
}
```

#### Exemplo de Requisição
```bash
POST /api/weather/regional
Content-Type: application/json

{
  "cityIds": ["3543204", "3534708", "3545407"]
}
```

#### Resposta de Sucesso (200 OK)
```json
[
  {
    "cityId": "3543204",
    "cityName": "Ribeirão do Sul",
    "timestamp": "2025-11-18T15:30:00.000Z",
    "rainfallIntensity": 45.5,
    "temperature": 24.3,
    "humidity": 72.5,
    "windSpeed": 12.8
  },
  {
    "cityId": "3534708",
    "cityName": "Ourinhos",
    "timestamp": "2025-11-18T15:30:00.000Z",
    "rainfallIntensity": 68.2,
    "temperature": 23.1,
    "humidity": 78.3,
    "windSpeed": 15.2
  },
  {
    "cityId": "3545407",
    "cityName": "Salto Grande",
    "timestamp": "2025-11-18T15:30:00.000Z",
    "rainfallIntensity": 52.8,
    "temperature": 24.7,
    "humidity": 74.1,
    "windSpeed": 11.5
  }
]
```

#### Estrutura da Resposta
```typescript
Array<{
  cityId: string;            // Código IBGE
  cityName: string;          // Nome da cidade
  timestamp: string;         // Data/hora ISO 8601
  rainfallIntensity: number; // Intensidade de chuva (0-100%)
  temperature: number;       // Temperatura em °C
  humidity: number;          // Umidade relativa (%)
  windSpeed: number;         // Velocidade do vento (km/h)
}>
```

#### Erros
| Código | Descrição |
|--------|-----------|
| `400` | Body inválido ou `cityIds` ausente |
| `500` | Erro ao buscar dados meteorológicos |

---

## 🗺️ Referência de Cidades

### Cidades Vizinhas de Ribeirão do Sul

| Código IBGE | Nome | Latitude | Longitude | Distância (aprox.) |
|-------------|------|----------|-----------|-------------------|
| `3543204` | Ribeirão do Sul | -22.7572 | -49.9439 | 0 km (centro) |
| `3550506` | São Pedro do Turvo | -22.8978 | -49.7433 | ~18 km |
| `3545407` | Salto Grande | -22.8936 | -49.9853 | ~18 km |
| `3534708` | Ourinhos | -22.9789 | -49.8708 | ~25 km |
| `3510153` | Canitar | -23.0028 | -49.7817 | ~30 km |
| `3546405` | Santa Cruz do Rio Pardo | -22.8997 | -49.6336 | ~36 km |
| `3538808` | Piraju | -23.1933 | -49.3847 | ~47 km |

---

## 🔧 Implementação Backend

### Stack Recomendada
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Linguagem:** TypeScript
- **API Meteorológica:** OpenWeatherMap, INMET ou Weather API

### Instalação

```bash
npm init -y
npm install express cors axios dotenv
npm install -D typescript @types/express @types/cors @types/node
```

### Estrutura de Diretórios

```
backend/
├── src/
│   ├── routes/
│   │   ├── cities.ts
│   │   └── weather.ts
│   ├── services/
│   │   ├── weatherService.ts
│   │   └── geoService.ts
│   ├── utils/
│   │   └── haversine.ts
│   ├── config/
│   │   └── cities.ts
│   └── server.ts
├── .env
├── package.json
└── tsconfig.json
```

### Exemplo de Implementação (Express)

#### `src/server.ts`

```typescript
import express from 'express';
import cors from 'cors';
import citiesRouter from './routes/cities';
import weatherRouter from './routes/weather';

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/cities', citiesRouter);
app.use('/api/weather', weatherRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Backend rodando em http://localhost:${PORT}`);
});
```

#### `src/routes/cities.ts`

```typescript
import { Router, Request, Response } from 'express';
import { getNeighborCities } from '../services/geoService';

const router = Router();

router.get('/neighbors/:cityId', async (req: Request, res: Response) => {
  try {
    const { cityId } = req.params;
    const radius = Number(req.query.radius) || 50;

    if (radius < 10 || radius > 150) {
      return res.status(400).json({ 
        error: 'Raio deve estar entre 10 e 150 km' 
      });
    }

    const result = await getNeighborCities(cityId, radius);
    
    if (!result) {
      return res.status(404).json({ 
        error: 'Cidade não encontrada' 
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar cidades vizinhas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
```

#### `src/routes/weather.ts`

```typescript
import { Router, Request, Response } from 'express';
import { getCityWeather, getRegionalWeather } from '../services/weatherService';

const router = Router();

router.get('/city/:cityId', async (req: Request, res: Response) => {
  try {
    const { cityId } = req.params;
    const weather = await getCityWeather(cityId);

    if (!weather) {
      return res.status(404).json({ 
        error: 'Dados não disponíveis para esta cidade' 
      });
    }

    res.json(weather);
  } catch (error) {
    console.error('Erro ao buscar clima:', error);
    res.status(500).json({ error: 'Erro ao buscar dados meteorológicos' });
  }
});

router.post('/regional', async (req: Request, res: Response) => {
  try {
    const { cityIds } = req.body;

    if (!Array.isArray(cityIds) || cityIds.length === 0) {
      return res.status(400).json({ 
        error: 'cityIds deve ser um array não vazio' 
      });
    }

    const weatherData = await getRegionalWeather(cityIds);
    res.json(weatherData);
  } catch (error) {
    console.error('Erro ao buscar clima regional:', error);
    res.status(500).json({ error: 'Erro ao buscar dados meteorológicos' });
  }
});

export default router;
```

#### `src/utils/haversine.ts`

```typescript
/**
 * Calcula distância entre dois pontos usando fórmula de Haversine
 * @returns Distância em quilômetros
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
```

#### `.env`

```env
PORT=3000
OPENWEATHER_API_KEY=sua_chave_aqui
NODE_ENV=development
```

---

## 🌐 Fontes de Dados Meteorológicos

### OpenWeatherMap
- **URL:** https://openweathermap.org/api
- **Plano Gratuito:** 60 chamadas/minuto, 1M chamadas/mês
- **Endpoint:** `https://api.openweathermap.org/data/2.5/weather`

```bash
GET https://api.openweathermap.org/data/2.5/weather?lat=-22.7572&lon=-49.9439&appid=YOUR_API_KEY&units=metric&lang=pt_br
```

### Weather API
- **URL:** https://www.weatherapi.com
- **Plano Gratuito:** 1M chamadas/mês
- **Endpoint:** `https://api.weatherapi.com/v1/current.json`

```bash
GET https://api.weatherapi.com/v1/current.json?key=YOUR_API_KEY&q=-22.7572,-49.9439&lang=pt
```

### INMET (Instituto Nacional de Meteorologia)
- **URL:** https://portal.inmet.gov.br
- **API:** Dados oficiais do Brasil (requer cadastro)

---

## 🧪 Testando a API

### Usando cURL

```bash
# 1. Buscar cidades vizinhas
curl "http://localhost:3000/api/cities/neighbors/3543204?radius=50"

# 2. Dados de uma cidade
curl "http://localhost:3000/api/weather/city/3543204"

# 3. Dados regionais
curl -X POST "http://localhost:3000/api/weather/regional" \
  -H "Content-Type: application/json" \
  -d '{"cityIds": ["3543204", "3534708", "3545407"]}'
```

### Usando Postman/Insomnia

Importe a collection com os endpoints acima ou crie requisições manualmente seguindo os exemplos.

---

## 📋 Checklist de Implementação

- [ ] Configurar projeto Node.js + TypeScript
- [ ] Implementar rota `GET /api/cities/neighbors/:cityId`
- [ ] Implementar rota `GET /api/weather/city/:cityId`
- [ ] Implementar rota `POST /api/weather/regional`
- [ ] Integrar com API meteorológica (OpenWeatherMap/Weather API)
- [ ] Implementar cálculo de distância (Haversine)
- [ ] Adicionar validação de parâmetros
- [ ] Configurar CORS para frontend
- [ ] Adicionar tratamento de erros
- [ ] Implementar cache (Redis opcional)
- [ ] Documentar variáveis de ambiente
- [ ] Adicionar logs
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Deploy (AWS/Heroku/Railway)

---

## 🚀 Deploy

### Railway
```bash
railway login
railway init
railway up
```

### Heroku
```bash
heroku create app-weather-backend
git push heroku main
```

### AWS (Elastic Beanstalk)
```bash
eb init
eb create weather-api-env
eb deploy
```

---

## 📞 Suporte

Para dúvidas sobre implementação, consulte:
- Documentação do Express: https://expressjs.com
- Documentação TypeScript: https://www.typescriptlang.org
- OpenWeatherMap API: https://openweathermap.org/api
