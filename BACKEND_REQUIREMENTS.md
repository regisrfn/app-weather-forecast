# Backend Requirements - Weather Forecast API

## Stack Simples
- **Framework**: Node.js (Express) ou Python (FastAPI)
- **Banco de Dados**: PostgreSQL + PostGIS
- **Cache**: Redis
- **Cron Job**: Coleta dados a cada 10 minutos

---

## APIs Meteorológicas (GRATUITAS)

### **INMET** - Instituto Nacional de Meteorologia ⭐ RECOMENDADO
- 🆓 Gratuito e oficial
- 📍 Estações no interior de SP
- API: https://apitempo.inmet.gov.br

```bash
# Estações próximas
GET https://apitempo.inmet.gov.br/estacao/A707  # Assis

# Dados horários
GET https://apitempo.inmet.gov.br/estacao/{codigo_estacao}
```

### **OpenWeatherMap** - Backup
- 💰 Free: 1000 calls/dia
- API: https://openweathermap.org/api

```bash
GET https://api.openweathermap.org/data/2.5/weather?lat=-22.7572&lon=-49.9439&appid=YOUR_KEY
```

---

## Database Schema (PostgreSQL + PostGIS)

```sql
-- Cidades
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    ibge_code VARCHAR(7) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    state CHAR(2) NOT NULL,
    geometry GEOMETRY(MultiPolygon, 4326),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Subdivisões (bairros)
CREATE TABLE city_subdivisions (
    id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES cities(id),
    name VARCHAR(100),
    geometry GEOMETRY(Polygon, 4326)
);

-- Dados meteorológicos por subdivisão
CREATE TABLE subdivision_weather (
    id BIGSERIAL PRIMARY KEY,
    subdivision_id INTEGER REFERENCES city_subdivisions(id),
    timestamp TIMESTAMP NOT NULL,
    rainfall_intensity FLOAT, -- 0-100
    temperature FLOAT,
    humidity FLOAT,
    wind_speed FLOAT
);

CREATE INDEX idx_subdivision_weather ON subdivision_weather(subdivision_id, timestamp DESC);
```

---

## API Endpoints (ESSENCIAIS)

### 1️⃣ Dados Atuais de uma Cidade
```
GET /api/weather/current/:cityId
```
**Response:**
```json
{
  "cityId": "3543204",
  "cityName": "Ribeirão do Sul",
  "timestamp": "2025-11-18T14:30:00Z",
  "rainfallIntensity": 45.5,
  "temperature": 24.3,
  "humidity": 78.2,
  "windSpeed": 12.5,
  "subdivisions": [
    {
      "id": "3543204-01",
      "name": "Centro",
      "rainfallIntensity": 50.2,
      "latitude": -22.7572,
      "longitude": -49.9439
    }
  ]
}
```

### 2️⃣ Dados de Múltiplas Cidades
```
POST /api/weather/regional
Body: { "cityIds": ["3543204", "3539103", "3506300"] }
```
**Response:** Array de dados (mesmo formato acima)

### 3️⃣ Previsão
```
GET /api/weather/forecast/:cityId?hours=24
```
**Response:**
```json
{
  "cityId": "3543204",
  "forecastHours": [
    {
      "timestamp": "2025-11-18T15:00:00Z",
      "rainfallIntensity": 35.0,
      "temperature": 23.5,
      "humidity": 75.0
    }
  ]
}
```

---

## Lógica do Backend

### 1. Cron Job - Coleta de Dados (a cada 10 min)
```javascript
// Coletar dados do INMET/OpenWeather
async function collectWeatherData() {
  const stations = ['A707']; // Assis
  
  for (const station of stations) {
    const data = await fetchFromINMET(station);
    await saveToDatabase(data);
  }
  
  // Calcular dados para subdivisões (interpolação simples)
  await calculateSubdivisionWeather();
  
  // Atualizar cache Redis
  await updateCache();
}
```

### 2. Interpolação para Subdivisões
```javascript
// Distribuir dados da estação para subdivisões da cidade
// Adicionar variação aleatória de ±20% para simular diferenças locais
function interpolateSubdivisions(cityWeather) {
  const subdivisions = ['Centro', 'Norte', 'Sul', 'Leste', 'Oeste'];
  
  return subdivisions.map(name => ({
    name,
    rainfallIntensity: cityWeather.rainfall * (0.8 + Math.random() * 0.4),
    temperature: cityWeather.temp + (Math.random() - 0.5) * 2,
    humidity: cityWeather.humidity + (Math.random() - 0.5) * 10
  }));
}
```

### 3. Cache Redis (5 minutos)
```javascript
// Cachear resposta para reduzir load no DB
await redis.setex(`weather:${cityId}`, 300, JSON.stringify(data));
```

---

## Variáveis de Ambiente

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=weather_db
DB_USER=postgres
DB_PASSWORD=sua_senha

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# APIs
INMET_API_URL=https://apitempo.inmet.gov.br
OPENWEATHER_API_KEY=sua_key

# App
NODE_ENV=production
PORT=3000
```

---

## Deploy AWS (Simples)

### Opção Serverless (+ Barato)
```
API Gateway → Lambda → Aurora Serverless + Redis
Cost: ~$30-50/mês
```

### Terraform Básico
```hcl
resource "aws_lambda_function" "api" {
  function_name = "weather-api"
  runtime       = "nodejs20.x"
  handler       = "index.handler"
  timeout       = 30
  
  environment {
    variables = {
      DB_HOST    = aws_db_instance.postgres.endpoint
      REDIS_HOST = aws_elasticache_cluster.redis.cache_nodes[0].address
    }
  }
}

resource "aws_db_instance" "postgres" {
  engine            = "postgres"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id      = "weather-cache"
  engine          = "redis"
  node_type       = "cache.t3.micro"
  num_cache_nodes = 1
}
```

---

## Checklist MVP

- [ ] Setup PostgreSQL + PostGIS
- [ ] Criar tabelas (cities, subdivisions, weather)
- [ ] Implementar 3 endpoints principais
- [ ] Integrar com INMET API
- [ ] Criar cron job (10 minutos)
- [ ] Adicionar cache Redis
- [ ] Deploy na AWS

---

## Resumo

**O que o backend precisa fazer:**
1. ✅ Coletar dados do INMET a cada 10 minutos
2. ✅ Calcular dados para subdivisões das cidades
3. ✅ Servir 3 endpoints: `/current`, `/regional`, `/forecast`
4. ✅ Cachear respostas (Redis, 5 min)
5. ✅ Deploy simples na AWS

**Cidades para monitorar:**
- Ribeirão do Sul (3543204) - FOCAL
- Ourinhos (3539103)
- Bernardino de Campos (3506300)
- Canitar (3510153)
- Santa Cruz do Rio Pardo (3552601)
