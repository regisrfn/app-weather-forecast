# 🌦️ App Previsão do Tempo - Ribeirão do Sul

Aplicação web interativa para visualizar previsão do tempo focada em **Ribeirão do Sul, SP** e cidades vizinhas com visualização em mapa usando malhas municipais do IBGE.

## ✨ Funcionalidades

- 🎯 **Foco em Ribeirão do Sul** como ponto central
- 📍 **Busca por raio ajustável** - 10 a 150 km para cidades vizinhas
- 🗺️ **Visualização em mapa interativo** com malhas municipais do IBGE
- 🌈 **Gradiente de cores azuis** indicando intensidade de chuva
- 📊 **Painel de informações** completas por cidade
- 📱 **Interface responsiva** - Desktop e mobile
- 🔄 **Atualização automática** a cada 5 minutos
- 🧪 **Dados mockados** para desenvolvimento (sem necessidade de backend)

## 🚀 Tecnologias

### Frontend
- **Vue 3** - Framework progressivo com Composition API
- **TypeScript** - Tipagem estática
- **Leaflet** - Biblioteca de mapas interativos
- **Vite** - Build tool ultrarrápida
- **Axios** - Cliente HTTP

### APIs Externas
- **IBGE Malhas** - Geometrias GeoJSON dos municípios
- **OpenStreetMap** - Tiles do mapa base

### Backend (Opcional)
- Veja [BACKEND_REQUIREMENTS.md](./BACKEND_REQUIREMENTS.md) para implementação completa

## 📦 Instalação e Desenvolvimento

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/app-weather-forecast.git
cd app-weather-forecast

# Instale as dependências
npm install
```

### Desenvolvimento Local

```bash
# Inicie o servidor de desenvolvimento
npm run dev

# Acesse http://localhost:5173/
```

### Build para Produção

```bash
# Build otimizado
npm run build

# Preview do build
npm run preview
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/
│   └── WeatherMap.vue          # Componente principal do mapa
├── services/
│   ├── apiService.ts           # Comunicação com backend
│   ├── mockService.ts          # Dados simulados para desenvolvimento
│   └── ibgeService.ts          # Busca malhas do IBGE
├── config/
│   └── app.ts                  # Configurações centralizadas
├── types/
│   └── weather.ts              # Tipos TypeScript
├── App.vue                     # Componente raiz
└── main.ts                     # Entry point
```

## 🎮 Como Usar

1. **Ajustar Raio de Busca** - Use o slider no topo para alterar o raio (10-150 km)
2. **Navegar no Mapa** - Clique e arraste para mover, scroll para zoom
3. **Ver Detalhes da Cidade** - Clique em uma malha municipal
4. **Abrir/Fechar Painel** - Use o botão flutuante no canto inferior direito
5. **Acompanhar Intensidade** - Observe o gradiente de azul nas malhas

## 🎨 Gradiente de Intensidade de Chuva

| Intensidade | Cor | Descrição |
|-------------|-----|-----------|
| 0% | Cinza claro | Sem chuva |
| 1-25% | Azul claro | Chuva fraca |
| 25-50% | Azul médio | Chuva moderada |
| 50-75% | Azul escuro | Chuva forte |
| 75-100% | Azul intenso | Chuva muito forte |

## 🗺️ Cidades da Região

Cidades vizinhas de **Ribeirão do Sul** (Microrregião de Ourinhos - SP):

| Código IBGE | Nome | Distância Aprox. |
|-------------|------|------------------|
| 3543204 | **Ribeirão do Sul** | 0 km (centro) |
| 3550506 | São Pedro do Turvo | ~18 km |
| 3545407 | Salto Grande | ~18 km |
| 3534708 | Ourinhos | ~25 km |
| 3510153 | Canitar | ~30 km |
| 3546405 | Santa Cruz do Rio Pardo | ~36 km |
| 3538808 | Piraju | ~47 km |

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# URL do backend (quando implementado)
VITE_API_BASE_URL=http://localhost:3000

# Modo mock (true = dados simulados, false = backend real)
VITE_USE_MOCK=true
```

### Configuração Centralizada

Edite `src/config/app.ts` para ajustar:

```typescript
export const APP_CONFIG = {
  CENTER_CITY_ID: '3543204',    // Código IBGE da cidade centro
  API_BASE_URL: '...',           // URL do backend
  USE_MOCK: true,                // Usar dados mockados
  RADIUS: {
    DEFAULT: 50,                 // Raio padrão (km)
    MIN: 10,                     // Raio mínimo
    MAX: 150,                    // Raio máximo
  },
  UPDATE_INTERVAL: 5 * 60 * 1000, // Intervalo de atualização (ms)
}
```

## 📡 Backend

A aplicação frontend está **preparada para integração com backend**, mas funciona com dados mockados por padrão.

### Documentação Completa
Veja [BACKEND_REQUIREMENTS.md](./BACKEND_REQUIREMENTS.md) para:
- ✅ Especificação completa das 3 rotas de API
- ✅ Parâmetros, tipos e exemplos de retorno
- ✅ Implementação de exemplo em Express + TypeScript
- ✅ Integração com APIs meteorológicas (OpenWeatherMap, INMET)
- ✅ Cálculo de distância com Haversine
- ✅ Instruções de deploy

### Rotas Necessárias

```http
GET  /api/cities/neighbors/:cityId?radius=50
GET  /api/weather/city/:cityId
POST /api/weather/regional
```

### Alternando entre Mock e Backend Real

```typescript
// src/config/app.ts
USE_MOCK: false  // Desativa mock, usa backend real
```

## 🌐 APIs do IBGE

### Malhas Municipais
Busca geometria GeoJSON dos municípios:

```
GET https://servicodados.ibge.gov.br/api/v3/malhas/municipios/{id}?formato=application/vnd.geo+json
```

**Exemplo:** Malha de Ribeirão do Sul
```bash
curl "https://servicodados.ibge.gov.br/api/v3/malhas/municipios/3543204?formato=application/vnd.geo+json"
```

## 🚀 Deploy

### Deploy na AWS S3 (Versão Simplificada)

**Deploy rápido:**
```bash
# Build da aplicação
npm run build

# Deploy automático no S3
./deploy-s3.sh
```

📖 **Documentação completa**: [DEPLOY_S3.md](./DEPLOY_S3.md)

---

### Deploy na AWS com CloudFront (Requer conta verificada)

Veja [DEPLOY_AWS.md](./DEPLOY_AWS.md) para instruções completas usando:
- **S3** - Hospedagem estática
- **CloudFront** - CDN global
- **Route 53** - DNS customizado
- **Terraform** - Infraestrutura como código

### Outras Opções de Deploy

#### Vercel
```bash
npm install -g vercel
vercel
```

#### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Railway
```bash
railway login
railway init
railway up
```

## 🧪 Desenvolvimento

```bash
# Type checking
npm run type-check

# Build
npm run build

# Preview da build
npm run preview
```

## 📱 Responsividade

A aplicação é totalmente responsiva:

- **Desktop** - Painel de informações flutuante no canto inferior direito
- **Mobile** - Painel adaptativo com largura total
- **Tablet** - Layout intermediário otimizado

## 🔧 Adicionar Novas Cidades

Para adicionar mais cidades ao mock:

1. Edite `src/services/mockService.ts`
2. Adicione coordenadas em `getMockNeighborCities()`
3. Adicione dados climáticos em `getMockWeatherData()`

```typescript
// Exemplo:
{
  id: '3503208',
  name: 'Assis',
  latitude: -22.6622,
  longitude: -50.4128,
  distance: 60.5,
}
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 🙏 Agradecimentos

- **IBGE** - API de malhas municipais
- **OpenStreetMap** - Tiles do mapa base
- **Leaflet** - Biblioteca de mapas
- **Vue.js** - Framework frontend

---

