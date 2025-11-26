# ✨ Funcionalidades

Guia completo de todas as funcionalidades do Weather Forecast App.

## 📑 Índice

- [Mapa Meteorológico](#-mapa-meteorológico)
- [Busca de Cidades](#-busca-de-cidades)
- [Navegação Temporal](#-navegação-temporal)
- [Estatísticas Regionais](#-estatísticas-regionais)
- [Alertas Meteorológicos](#-alertas-meteorológicos)
- [Sistema de Cache](#-sistema-de-cache)
- [Interface Responsiva](#-interface-responsiva)

## 🗺️ Mapa Meteorológico

### Visualização de Dados

O mapa interativo é o componente central da aplicação, exibindo:

- **Marcadores de Cidades**: Cada cidade é representada por um marcador colorido
- **Cores por Condição**: Marcadores coloridos baseados na condição climática
  - 🔵 **Azul**: Chuva
  - ⚪ **Cinza**: Nublado
  - 🟡 **Amarelo**: Ensolarado
  - ⚫ **Preto**: Dados não disponíveis

### Controle de Raio

- **Range**: 10 km a 150 km
- **Padrão**: 50 km
- **Ajuste Dinâmico**: Slider interativo que atualiza as cidades exibidas
- **Debounce**: Evita requisições excessivas durante o ajuste

```typescript
// Configuração do raio
RADIUS: {
  DEFAULT: 50,
  MIN: 10,
  MAX: 150,
}
```

### Interações

- **Zoom**: Scroll do mouse ou controles de zoom
- **Pan**: Arrastar o mapa
- **Popup**: Click em marcador para detalhes
  - Temperatura atual
  - Sensação térmica
  - Descrição da condição
  - Umidade
  - Velocidade do vento

### Cidade Central

- **Padrão**: Ribeirão do Sul, SP (ID IBGE: 3543204)
- **Configurável**: Pode ser alterada via `app.ts`
- **Indicador Visual**: Subtitle no header mostra a cidade central

## 🔍 Busca de Cidades

### Autocomplete Inteligente

- **Database Local**: 5.570 municípios brasileiros (IBGE)
- **Busca Rápida**: Filtragem em tempo real
- **Formato**: "Nome da Cidade, UF"
- **Limite**: Exibe até 10 resultados

### Como Usar

1. Click no ícone de busca (🔍)
2. Digite o nome da cidade
3. Selecione da lista ou pressione Enter

### Características

- **Case Insensitive**: Não diferencia maiúsculas/minúsculas
- **Busca Parcial**: Encontra correspondências parciais
- **Focus Automático**: Input recebe foco ao abrir
- **Esc para Fechar**: Tecla ESC fecha a busca

```typescript
// Exemplo de busca
filterCities() {
  const query = this.searchQuery.toLowerCase().trim();
  this.filteredCities = this.municipalities.filter(city =>
    city.name.toLowerCase().includes(query) ||
    city.state.toLowerCase().includes(query)
  );
}
```

## 📅 Navegação Temporal

### Carrossel de Dias

- **Previsão**: 5 dias a partir de hoje
- **Visualização**: Cards deslizantes com:
  - Dia da semana
  - Data completa
  - Ícone da condição predominante
  - Temperatura mínima e máxima

### Navegação de Horários

- **Granularidade**: 3 em 3 horas (00:00, 03:00, 06:00, etc.)
- **Total**: 8 horários por dia
- **Controles**:
  - ◀️ Horário anterior
  - ▶️ Próximo horário
  - Botão de data abre carrossel

### Limitações Temporais

- **Passado**: Não permite navegar para horários passados
- **Futuro**: Limitado aos próximos 5 dias
- **Validação**: Botões desabilitados quando no limite

```typescript
canNavigatePrev(): boolean {
  const now = new Date();
  const current = new Date(this.currentDateTime);
  return current > now;
}
```

## 📊 Estatísticas Regionais

### Painel de Informações

Exibe estatísticas agregadas de todas as cidades visíveis no raio:

#### Temperatura Média
- Média aritmética das temperaturas
- Formato: "XX°C"
- Arredondamento: 1 casa decimal

#### Temperatura Mínima
- Menor temperatura encontrada
- Inclui nome da cidade
- Formato: "XX°C (Cidade, UF)"

#### Temperatura Máxima
- Maior temperatura encontrada
- Inclui nome da cidade
- Formato: "XX°C (Cidade, UF)"

#### Condição Predominante
- Condição mais frequente na região
- Contagem de ocorrências
- Exibição com ícone correspondente

### Cálculos

```typescript
// Exemplo de cálculo de estatísticas
const temps = weatherData.map(w => w.temperature);
const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
const minTemp = Math.min(...temps);
const maxTemp = Math.max(...temps);
```

## 🚨 Alertas Meteorológicos

### Tipos de Alertas

- ⚠️ **Tempestade**: Condições severas previstas
- 🌡️ **Temperatura Extrema**: Calor ou frio excessivo
- 💨 **Ventos Fortes**: Velocidade acima de 60 km/h
- 🌊 **Chuvas Intensas**: Precipitação pesada

### Prioridade

1. **Alto**: Vermelho - Perigo imediato
2. **Médio**: Amarelo - Atenção necessária
3. **Baixo**: Azul - Informativo

### Exibição

- **Painel Destacado**: Posição fixa no topo
- **Ícones Claros**: Identificação visual rápida
- **Descrição**: Texto explicativo do alerta
- **Múltiplos**: Suporta vários alertas simultâneos

> **Nota**: Alertas dependem de dados do backend. Em modo mock, não são exibidos.

## 💾 Sistema de Cache

### Estratégia de Cache

- **Armazenamento**: LocalForage (IndexedDB)
- **TTL**: Configurável (padrão: 60 minutos)
- **Chave**: Baseada em parâmetros da requisição

### Funcionamento

1. **Verificação**: Checa se dados existem e são válidos
2. **Cache Hit**: Retorna dados armazenados
3. **Cache Miss**: Busca novos dados e armazena
4. **Refresh**: Atualização automática após expiração

### Benefícios

- ⚡ **Performance**: Reduz requisições à API
- 🌐 **Offline**: Funciona mesmo sem conexão
- 💰 **Economia**: Menos consumo de dados
- 🚀 **UX**: Carregamento instantâneo

```typescript
// Uso do cache
const cached = await cacheService.get(cacheKey);
if (cached && !cacheService.isExpired(cached)) {
  return cached.data;
}
```

## 📱 Interface Responsiva

### Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Adaptações Mobile

#### Header
- Menu hambúrguer
- Controles colapsáveis
- Stack vertical

#### Mapa
- Altura ajustada
- Controles simplificados
- Touch gestures

#### Busca
- Modal full-screen
- Teclado otimizado
- Resultados em lista

#### Carrossel
- Swipe gestures
- Cards maiores
- Navegação por toque

### Otimizações

- **Fonte Base**: Escala com viewport
- **Espaçamentos**: Proporcionais
- **Touch Targets**: Mínimo 44x44px
- **Imagens**: Lazy loading

```scss
// Exemplo de responsividade
@media (max-width: $breakpoint-mobile) {
  .floating-header {
    flex-direction: column;
    padding: 1rem;
  }
}
```

## 🎨 Temas e Personalização

### Variáveis CSS

Cores, espaçamentos e outros valores são centralizados:

```scss
// abstracts/_colors.scss
$primary-color: #3b82f6;
$background: rgba(255, 255, 255, 0.95);
$text-primary: #1f2937;
```

### Glassmorphism

- Backgrounds semi-transparentes
- Blur effects
- Bordas sutis
- Sombras suaves

### Ícones

- **SVG Inline**: Performance e customização
- **Tamanhos**: 16px, 20px, 24px, 36px
- **Cores**: Dinâmicas via `currentColor`

---

Para mais detalhes técnicos, consulte [IMPLEMENTATION.md](IMPLEMENTATION.md).
