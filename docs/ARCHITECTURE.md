# 🏗️ Arquitetura

Documentação técnica da arquitetura e decisões de design do Weather Forecast App.

## 📑 Índice

- [Visão Geral](#-visão-geral)
- [Camadas da Aplicação](#-camadas-da-aplicação)
- [Fluxo de Dados](#-fluxo-de-dados)
- [Componentes Principais](#-componentes-principais)
- [Serviços](#-serviços)
- [Sistema de Cache](#-sistema-de-cache)
- [Gerenciamento de Estado](#-gerenciamento-de-estado)
- [Decisões Técnicas](#-decisões-técnicas)

## 🎯 Visão Geral

O Weather Forecast App segue uma arquitetura em camadas, separando responsabilidades e facilitando manutenção e escalabilidade.

### Princípios

- **Separação de Responsabilidades**: Cada camada tem função específica
- **Reutilização**: Componentes e serviços modulares
- **Testabilidade**: Código desacoplado e testável
- **Performance**: Cache, lazy loading e otimizações
- **Manutenibilidade**: Código limpo e bem documentado

## 📚 Camadas da Aplicação

```
┌─────────────────────────────────────┐
│        Presentation Layer           │
│     (Components + Templates)        │
├─────────────────────────────────────┤
│         Business Logic              │
│    (Composition API + Utils)        │
├─────────────────────────────────────┤
│         Service Layer               │
│  (API, Cache, IBGE, Mock Services)  │
├─────────────────────────────────────┤
│         Data Layer                  │
│   (LocalForage + External APIs)     │
└─────────────────────────────────────┘
```

### 1. Presentation Layer

**Responsabilidade**: Interface do usuário e interações

**Componentes**:
- `WeatherMap.vue`: Componente principal
- `DayCarousel.vue`: Navegação de dias
- `WeatherAlerts.vue`: Exibição de alertas

**Características**:
- Templates Vue com TypeScript
- Estilos scoped Sass
- Props e Events para comunicação
- Composition API para lógica

### 2. Business Logic Layer

**Responsabilidade**: Lógica de negócio e transformação de dados

**Localização**: Dentro dos componentes (setup) e utils

**Exemplos**:
- Cálculo de estatísticas regionais
- Validação de navegação temporal
- Formatação de dados para exibição
- Debounce de eventos

### 3. Service Layer

**Responsabilidade**: Comunicação com APIs e gerenciamento de dados

**Serviços**:
- `apiService.ts`: Cliente HTTP para backend
- `cacheService.ts`: Gerenciamento de cache
- `ibgeService.ts`: Database de municípios
- `mockService.ts`: Dados simulados

**Características**:
- Interfaces TypeScript bem definidas
- Tratamento de erros centralizado
- Retry logic quando necessário
- Abstrações sobre libs externas

### 4. Data Layer

**Responsabilidade**: Persistência e fonte de dados

**Fontes**:
- **LocalForage**: Cache persistente (IndexedDB)
- **Backend API**: Dados reais (quando disponível)
- **Mock Data**: Dados simulados para desenvolvimento
- **IBGE JSON**: Database estático de municípios

## 🔄 Fluxo de Dados

### Requisição de Dados Meteorológicos

```
┌──────────────┐
│  Component   │
│ (User Action)│
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  apiService  │◄─────┐
│ .getWeather()│      │
└──────┬───────┘      │
       │              │
       ▼              │
┌──────────────┐      │
│ cacheService │      │
│ .get(key)    │      │
└──────┬───────┘      │
       │              │
   ┌───┴────┐         │
   │ Cached?│         │
   └───┬────┘         │
       │              │
    ┌──┴──┐           │
    │ Yes │           │
    └──┬──┘           │
       │              │
       ▼              │
  Return Data         │
       ▲              │
       │              │
    ┌──┴──┐           │
    │ No  │           │
    └──┬──┘           │
       │              │
       ▼              │
┌──────────────┐      │
│ Backend API  │      │
│ or Mock      │──────┘
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ cacheService │
│ .set(key)    │
└──────┬───────┘
       │
       ▼
   Return Data
```

### Busca de Cidades

```
User Input
    │
    ▼
Filter Local (municipalities_db.json)
    │
    ▼
Update UI (filteredCities)
    │
    ▼
User Selects City
    │
    ▼
Update Map Center
    │
    ▼
Fetch Weather Data (new center)
```

## 🧩 Componentes Principais

### WeatherMap.vue

**Responsabilidade**: Componente principal que orquestra toda a aplicação

**Estado**:
```typescript
interface State {
  // Map
  center: LatLng
  zoom: number
  
  // Weather data
  weatherData: WeatherData[]
  regionalStats: RegionalStats
  
  // UI State
  searchRadius: number
  currentDateTime: Date
  isMenuOpen: boolean
  isSearchOpen: boolean
  
  // Loading
  isLoading: boolean
  error: string | null
}
```

**Métodos Principais**:
- `fetchWeatherData()`: Busca dados meteorológicos
- `updateRegionalData()`: Atualiza dados ao mudar raio/centro
- `navigateTime()`: Navegação temporal
- `selectCity()`: Centraliza mapa em cidade

**Lifecycle**:
```typescript
onMounted(() => {
  loadMunicipalities()
  fetchWeatherData()
  setupAutoRefresh()
})

onUnmounted(() => {
  clearAutoRefresh()
})
```

### DayCarousel.vue

**Responsabilidade**: Navegação entre dias da previsão

**Props**:
```typescript
interface Props {
  selectedDate: Date
  forecastDays: Date[]
}
```

**Events**:
```typescript
interface Emits {
  'date-selected': Date
}
```

**Features**:
- Scroll horizontal suave
- Indicador visual do dia selecionado
- Touch/swipe support mobile

### WeatherAlerts.vue

**Responsabilidade**: Exibição de alertas meteorológicos

**Props**:
```typescript
interface Props {
  alerts: WeatherAlert[]
}
```

**Priorização**:
- Ordena alertas por severidade
- Cores e ícones por tipo
- Suporte a múltiplos alertas

## 🔧 Serviços

### apiService.ts

**Interface**:
```typescript
interface IApiService {
  getWeather(params: WeatherParams): Promise<WeatherData[]>
  getAlerts(cityId: string): Promise<WeatherAlert[]>
}
```

**Implementação**:
- Axios como cliente HTTP
- Interceptors para tratamento de erros
- Timeout configurável
- Retry logic

**Configuração**:
```typescript
const api = axios.create({
  baseURL: APP_CONFIG.API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})
```

### cacheService.ts

**Interface**:
```typescript
interface ICacheService {
  get<T>(key: string): Promise<CacheEntry<T> | null>
  set<T>(key: string, data: T, ttl?: number): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
  isExpired(entry: CacheEntry): boolean
}
```

**Storage**: LocalForage (IndexedDB)

**Estrutura**:
```typescript
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}
```

### ibgeService.ts

**Responsabilidade**: Gerenciamento de municípios brasileiros

**Database**: `public/data/municipalities_db.json`

**Interface**:
```typescript
interface IIBGEService {
  loadMunicipalities(): Promise<Municipality[]>
  findByName(name: string): Municipality[]
  findByRadius(center: LatLng, radius: number): Municipality[]
  getById(id: string): Municipality | undefined
}
```

**Otimizações**:
- Carregamento único (singleton)
- Busca indexada por ID
- Cálculo de distância otimizado

### mockService.ts

**Responsabilidade**: Geração de dados simulados

**Features**:
- Dados realistas baseados em padrões
- Variação temporal (dia/noite)
- Condições climáticas variadas
- Consistência entre requisições

## 💾 Sistema de Cache

### Estratégia

**Cache First**: Sempre verifica cache antes de requisitar

**TTL (Time To Live)**: 60 minutos (configurável)

**Invalidação**:
- Manual (clear cache)
- Automática (expiração)
- Por mudança de parâmetros

### Chaves de Cache

Formato: `weather:${centerCityId}:${radius}:${datetime}`

**Exemplo**:
```
weather:3543204:50:2025-11-26T15:00:00.000Z
```

### Performance

**Ganhos**:
- Redução de 90% em requisições repetidas
- Carregamento instantâneo em cache hit
- Funciona offline

**Trade-offs**:
- Dados podem estar levemente desatualizados
- Uso de storage do browser
- Complexidade adicional

## 🗄️ Gerenciamento de Estado

### Local Component State

Usando Composition API:

```typescript
const state = reactive({
  weatherData: [],
  isLoading: false,
  error: null
})
```

**Quando usar**:
- Estado específico do componente
- UI state (menu aberto/fechado)
- Dados temporários

### Props Down, Events Up

Comunicação pai-filho:

```vue
<!-- Parent -->
<DayCarousel 
  :selected-date="currentDate"
  @date-selected="onDateSelected"
/>

<!-- Child -->
const emit = defineEmits<{
  'date-selected': [date: Date]
}>()
```

### Provide/Inject

**Não utilizado atualmente**

Razão: Aplicação relativamente simples, não necessita state management complexo

**Futuro**: Considerar Pinia se crescer complexidade

## 🎯 Decisões Técnicas

### Por que Vue 3?

- **Composition API**: Melhor reutilização de lógica
- **TypeScript**: Suporte de primeira classe
- **Performance**: Virtual DOM otimizado
- **DX**: Developer experience excelente

### Por que Leaflet?

- **Open Source**: Sem custos de licença
- **Maduro**: Biblioteca estável e testada
- **Plugins**: Ecossistema rico
- **Leve**: ~40KB minified

### Por que LocalForage?

- **Async**: Não bloqueia UI
- **Fallback**: localStorage se IndexedDB indisponível
- **API Simples**: Similar ao localStorage
- **Capacidade**: Muito maior que localStorage

### Por que Vite?

- **HMR**: Hot Module Replacement instantâneo
- **Build**: Extremamente rápido
- **ESM**: Native ES modules
- **DX**: Zero config para começar

### Por que Sass?

- **Variáveis**: Tema centralizado
- **Mixins**: Reutilização de estilos
- **Nesting**: Código mais organizado
- **Funcões**: Cálculos complexos

### Por que Vercel?

- **Deploy**: Automatizado via Git
- **Performance**: Edge network global
- **HTTPS**: Certificado automático
- **Gratuito**: Tier free generoso
- **DX**: Zero configuration

## 🚀 Escalabilidade

### Pontos de Extensão

1. **Backend API**: Trocar mock por API real
2. **State Management**: Adicionar Pinia se necessário
3. **Testes**: Vitest + Testing Library
4. **CI/CD**: GitHub Actions
5. **Monitoring**: Sentry para erros
6. **Analytics**: Google Analytics ou similar

### Limitações Atuais

- Sem autenticação/autorização
- Sem backend real
- Sem testes automatizados
- Sem i18n (internacionalização)
- Brasil apenas (limitação IBGE)

---

Para detalhes de implementação, veja [IMPLEMENTATION.md](IMPLEMENTATION.md).
