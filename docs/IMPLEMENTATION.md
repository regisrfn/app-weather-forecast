# 💻 Guia de Implementação

Guia completo para desenvolvimento, padrões de código e boas práticas do Weather Forecast App.

## 📑 Índice

- [Setup do Ambiente](#-setup-do-ambiente)
- [Estrutura de Código](#-estrutura-de-código)
- [Padrões de Código](#-padrões-de-código)
- [TypeScript](#-typescript)
- [Vue 3 + Composition API](#-vue-3--composition-api)
- [Estilos e CSS](#-estilos-e-css)
- [Serviços](#-serviços)
- [Testes](#-testes)
- [Performance](#-performance)
- [Debugging](#-debugging)

## 🛠️ Setup do Ambiente

### Pré-requisitos

```bash
node --version  # v20.x ou superior
npm --version   # v10.x ou superior
```

### Extensões VS Code Recomendadas

```json
{
  "recommendations": [
    "Vue.volar",
    "Vue.vscode-typescript-vue-plugin",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "syler.sass-indented"
  ]
}
```

### Configuração do Editor

**.vscode/settings.json**:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Instalação

```bash
# Clone
git clone https://github.com/regisrfn/app-weather-forecast.git
cd app-weather-forecast

# Instale dependências
npm install

# Configure ambiente
cp .env.example .env

# Inicie dev server
npm run dev
```

## 📂 Estrutura de Código

### Organização de Arquivos

```
src/
├── components/
│   ├── WeatherMap.vue       # Componente principal
│   ├── DayCarousel.vue      # Sub-componente
│   └── WeatherAlerts.vue    # Sub-componente
├── services/
│   ├── apiService.ts        # API cliente
│   ├── cacheService.ts      # Cache
│   ├── ibgeService.ts       # Municípios
│   └── mockService.ts       # Respostas estáticas para desenvolvimento local
├── types/
│   └── weather.ts           # Tipos TypeScript
├── utils/
│   └── array.ts             # Utilitários
├── config/
│   └── app.ts               # Configurações
└── styles/
    ├── abstracts/           # Variáveis, mixins
    ├── base/                # Reset, base
    └── components/          # Estilos por componente
```

### Convenções de Nomenclatura

**Arquivos**:
- Componentes: `PascalCase.vue` (ex: `WeatherMap.vue`)
- Serviços: `camelCase.ts` (ex: `apiService.ts`)
- Tipos: `camelCase.ts` (ex: `weather.ts`)
- Utilitários: `camelCase.ts` (ex: `array.ts`)
- Estilos parciais: `_kebab-case.scss` (ex: `_weather-map.scss`)

**Variáveis e Funções**:
- Variáveis: `camelCase` (ex: `weatherData`)
- Constantes: `UPPER_SNAKE_CASE` (ex: `API_BASE_URL`)
- Funções: `camelCase` (ex: `fetchWeatherData`)
- Componentes: `PascalCase` (ex: `WeatherMap`)
- Props: `camelCase` (ex: `selectedDate`)
- Events: `kebab-case` (ex: `date-selected`)

## 📝 Padrões de Código

### Imports

Ordem recomendada:

```typescript
// 1. Vue core
import { ref, reactive, computed, onMounted } from 'vue'

// 2. External libraries
import axios from 'axios'
import L from 'leaflet'

// 3. Internal services
import { apiService } from '@/services/apiService'
import { cacheService } from '@/services/cacheService'

// 4. Types
import type { WeatherData, Municipality } from '@/types/weather'

// 5. Components
import DayCarousel from './DayCarousel.vue'

// 6. Config/Utils
import { APP_CONFIG } from '@/config/app'
import { debounce } from '@/utils/array'

// 7. Styles
import './styles/weather-map.scss'
```

### Comentários

Use comentários JSDoc para funções exportadas:

```typescript
/**
 * Busca dados meteorológicos para as cidades dentro do raio especificado
 * 
 * @param centerCityId - ID IBGE da cidade central
 * @param radius - Raio de busca em km
 * @param datetime - Data/hora da previsão
 * @returns Promise com array de dados meteorológicos
 * @throws {Error} Se a requisição falhar
 */
async function fetchWeatherData(
  centerCityId: string,
  radius: number,
  datetime: Date
): Promise<WeatherData[]> {
  // Implementação
}
```

### Error Handling

Sempre trate erros adequadamente:

```typescript
try {
  const data = await apiService.getWeather(params)
  return data
} catch (error) {
  console.error('Failed to fetch weather data:', error)
  
  // Mostrar mensagem para usuário
  state.error = 'Não foi possível carregar os dados. Tente novamente.'
  
  // Fallback para dados em cache (se disponível)
  return cacheService.get(cacheKey)
}
```

## 📘 TypeScript

### Tipos e Interfaces

Defina interfaces claras:

```typescript
// types/weather.ts

export interface WeatherData {
  cityId: string
  cityName: string
  temperature: number
  feelsLike: number
  condition: WeatherCondition
  humidity: number
  windSpeed: number
  coordinates: {
    lat: number
    lng: number
  }
  timestamp: Date
}

export type WeatherCondition = 
  | 'sunny'
  | 'cloudy'
  | 'rainy'
  | 'stormy'

export interface Municipality {
  id: string
  name: string
  state: string
  coordinates: {
    lat: number
    lng: number
  }
}
```

### Generics

Use generics para reutilização:

```typescript
interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  const response = await axios.get<T>(url)
  return {
    data: response.data,
    status: response.status
  }
}
```

### Type Guards

Crie type guards para validação:

```typescript
function isWeatherData(obj: any): obj is WeatherData {
  return (
    typeof obj?.cityId === 'string' &&
    typeof obj?.temperature === 'number' &&
    typeof obj?.coordinates?.lat === 'number'
  )
}

// Uso
if (isWeatherData(data)) {
  // TypeScript sabe que data é WeatherData
  console.log(data.temperature)
}
```

## 🎨 Vue 3 + Composition API

### Setup Pattern

```vue
<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import type { WeatherData } from '@/types/weather'

// Props
interface Props {
  initialCenter?: { lat: number; lng: number }
  initialRadius?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialRadius: 50
})

// Emits
interface Emits {
  'data-loaded': [data: WeatherData[]]
  'error': [error: Error]
}

const emit = defineEmits<Emits>()

// State
const weatherData = ref<WeatherData[]>([])
const isLoading = ref(false)

const state = reactive({
  selectedDate: new Date(),
  searchRadius: props.initialRadius,
  error: null as string | null
})

// Computed
const hasData = computed(() => weatherData.value.length > 0)

const avgTemperature = computed(() => {
  if (!hasData.value) return 0
  const sum = weatherData.value.reduce((acc, w) => acc + w.temperature, 0)
  return sum / weatherData.value.length
})

// Methods
async function fetchData() {
  isLoading.value = true
  try {
    const data = await apiService.getWeather({
      radius: state.searchRadius,
      date: state.selectedDate
    })
    weatherData.value = data
    emit('data-loaded', data)
  } catch (error) {
    state.error = 'Erro ao carregar dados'
    emit('error', error as Error)
  } finally {
    isLoading.value = false
  }
}

// Watchers
watch(() => state.searchRadius, () => {
  fetchData()
})

// Lifecycle
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="weather-map">
    <div v-if="isLoading">Carregando...</div>
    <div v-else-if="state.error">{{ state.error }}</div>
    <div v-else-if="hasData">
      <!-- Conteúdo -->
    </div>
  </div>
</template>
```

### Composables (Futuro)

Para lógica reutilizável:

```typescript
// composables/useWeatherData.ts
import { ref } from 'vue'

export function useWeatherData() {
  const data = ref<WeatherData[]>([])
  const isLoading = ref(false)
  
  async function fetch(params: WeatherParams) {
    isLoading.value = true
    try {
      data.value = await apiService.getWeather(params)
    } finally {
      isLoading.value = false
    }
  }
  
  return {
    data,
    isLoading,
    fetch
  }
}

// Uso no componente
const { data, isLoading, fetch } = useWeatherData()
```

## 🎨 Estilos e CSS

### Arquitetura SASS

```scss
// styles/abstracts/_variables.scss
$font-family-base: 'Inter', -apple-system, sans-serif;
$font-size-base: 16px;
$line-height-base: 1.5;

$spacing-xs: 0.25rem;   // 4px
$spacing-sm: 0.5rem;    // 8px
$spacing-md: 1rem;      // 16px
$spacing-lg: 1.5rem;    // 24px
$spacing-xl: 2rem;      // 32px

// styles/abstracts/_colors.scss
$primary: #3b82f6;
$secondary: #8b5cf6;
$success: #10b981;
$warning: #f59e0b;
$danger: #ef4444;

$gray-50: #f9fafb;
$gray-100: #f3f4f6;
// ...

$text-primary: $gray-900;
$text-secondary: $gray-600;

// styles/abstracts/_mixins.scss
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: $spacing-md;
}

@mixin respond-to($breakpoint) {
  @if $breakpoint == 'mobile' {
    @media (max-width: 768px) { @content; }
  } @else if $breakpoint == 'tablet' {
    @media (min-width: 769px) and (max-width: 1024px) { @content; }
  } @else if $breakpoint == 'desktop' {
    @media (min-width: 1025px) { @content; }
  }
}
```

### Scoped Styles

```vue
<style scoped lang="scss">
@import '@/styles/abstracts/variables';
@import '@/styles/abstracts/mixins';

.weather-map {
  @include card;
  
  &__header {
    @include flex-center;
    justify-content: space-between;
    margin-bottom: $spacing-md;
  }
  
  &__title {
    font-size: 1.5rem;
    font-weight: 600;
    color: $text-primary;
  }
  
  @include respond-to('mobile') {
    padding: $spacing-sm;
    
    &__title {
      font-size: 1.25rem;
    }
  }
}
</style>
```

### BEM Methodology

```scss
// Block
.weather-card {
  // Element
  &__header { }
  &__body { }
  &__footer { }
  
  // Modifier
  &--large { }
  &--compact { }
  
  // State
  &.is-loading { }
  &.is-error { }
}
```

## 🔌 Serviços

### Service Pattern

```typescript
// services/apiService.ts

import axios, { AxiosInstance } from 'axios'
import type { WeatherData, WeatherParams } from '@/types/weather'
import { APP_CONFIG } from '@/config/app'

class ApiService {
  private client: AxiosInstance
  
  constructor() {
    this.client = axios.create({
      baseURL: APP_CONFIG.API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    this.setupInterceptors()
  }
  
  private setupInterceptors() {
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error)
        return Promise.reject(error)
      }
    )
  }
  
  async getWeather(params: WeatherParams): Promise<WeatherData[]> {
    const response = await this.client.get<WeatherData[]>('/weather', {
      params
    })
    return response.data
  }
}

export const apiService = new ApiService()
```

## 🧪 Testes

### Setup Vitest (Futuro)

```bash
npm install -D vitest @vue/test-utils happy-dom
```

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true
  }
})
```

### Teste de Componente

```typescript
// components/__tests__/WeatherMap.spec.ts
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import WeatherMap from '../WeatherMap.vue'

describe('WeatherMap', () => {
  it('renders properly', () => {
    const wrapper = mount(WeatherMap)
    expect(wrapper.find('.weather-map').exists()).toBe(true)
  })
  
  it('displays loading state', async () => {
    const wrapper = mount(WeatherMap)
    // Simulate loading
    await wrapper.vm.fetchData()
    expect(wrapper.find('.loading-indicator').exists()).toBe(true)
  })
})
```

### Teste de Serviço

```typescript
// services/__tests__/cacheService.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { cacheService } from '../cacheService'

describe('CacheService', () => {
  beforeEach(async () => {
    await cacheService.clear()
  })
  
  it('stores and retrieves data', async () => {
    const key = 'test-key'
    const data = { value: 'test' }
    
    await cacheService.set(key, data)
    const result = await cacheService.get(key)
    
    expect(result?.data).toEqual(data)
  })
  
  it('respects TTL', async () => {
    const key = 'test-key'
    const data = { value: 'test' }
    const ttl = 1000 // 1 segundo
    
    await cacheService.set(key, data, ttl)
    
    // Aguarda TTL expirar
    await new Promise(resolve => setTimeout(resolve, 1100))
    
    const result = await cacheService.get(key)
    expect(cacheService.isExpired(result!)).toBe(true)
  })
})
```

## ⚡ Performance

### Debounce

```typescript
import { ref } from 'vue'

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Uso
const searchQuery = ref('')
const debouncedSearch = debounce((query: string) => {
  // Fazer busca
}, 300)

watch(searchQuery, (newValue) => {
  debouncedSearch(newValue)
})
```

### Lazy Loading

```typescript
// Router lazy loading
const routes = [
  {
    path: '/map',
    component: () => import('./components/WeatherMap.vue')
  }
]

// Dynamic import
async function loadHeavyModule() {
  const module = await import('./heavy-module')
  return module.default
}
```

### Memoization

```typescript
import { computed } from 'vue'

// Computed properties são automaticamente memoizados
const expensiveCalculation = computed(() => {
  // Cálculo custoso
  return weatherData.value.reduce(...)
})
```

## 🐛 Debugging

### Vue Devtools

Instale a extensão do navegador: [Vue Devtools](https://devtools.vuejs.org/)

### Console Logging

```typescript
// Desenvolvimento
if (import.meta.env.DEV) {
  console.log('Weather data loaded:', weatherData.value)
}

// Produção - usar ferramenta de logging
import { logger } from '@/utils/logger'
logger.info('Weather data loaded', { count: weatherData.value.length })
```

### Source Maps

Garantido pelo Vite em desenvolvimento. Para produção, configure:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: true
  }
})
```

---

Para informações sobre deploy, veja [DEPLOY.md](DEPLOY.md).
