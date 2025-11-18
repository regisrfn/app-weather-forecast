# 🌦️ App Previsão do Tempo - Ribeirão do Sul# 🌦️ App Previsão do Tempo - Ribeirão do Sul



Aplicação web interativa para visualizar previsão do tempo focada em **Ribeirão do Sul, SP** e cidades vizinhas.Aplicação Vue.js para visualização de previsão do tempo com foco em **Ribeirão do Sul/SP** e cidades vizinhas. Mostra dados de chuva com gradiente visual azul, subdivisões dentro das cidades, e integração com malhas municipais do IBGE.



## ✨ Funcionalidades## 🚀 Tecnologias



- 🎯 **Foco em Ribeirão do Sul** como ponto central- **Vue 3** + TypeScript + Vite

- 📍 **Busca por raio** - Ajuste de 10 a 150 km para cidades vizinhas- **Leaflet** - Mapas interativos

- 🗺️ **Visualização em mapa** com malhas municipais do IBGE- **API IBGE** - Malhas municipais

- 🌈 **Gradiente de cores azuis** indicando intensidade de chuva- **Axios** - Requisições HTTP

- 📊 **Dados meteorológicos** completos por cidade- **PostGIS** (backend) - Dados geoespaciais

- 🔄 **Atualização automática** a cada 5 minutos

## 📋 Features

## 🚀 Como Executar

✅ Visualização de mapa centrado em Ribeirão do Sul  

```bash✅ Malhas municipais do IBGE sobrepostas  

# Instalar dependências✅ Gradiente de cores azul (intensidade de chuva)  

npm install✅ Subdivisões dentro de cada cidade  

✅ Painel de informações meteorológicas  

# Iniciar em modo desenvolvimento✅ Atualização automática a cada 5 minutos  

npm run dev✅ Dados mockados para desenvolvimento (sem backend)  



# Build para produção## 🛠️ Instalação e Desenvolvimento

npm run build

```### Pré-requisitos

- Node.js 20+

Acesse: `http://localhost:5173/`- npm ou yarn



## 🎮 Como Usar### Instalação



1. **Ajustar Raio de Busca** - Use o slider no topo para selecionar o raio (10-150 km)```bash

2. **Navegar no Mapa** - Clique e arraste para mover, scroll para zoom# Clone o repositório

3. **Ver Detalhes** - Clique em uma cidade para ver informações completasgit clone https://github.com/seu-usuario/app-weather-forecast.git

4. **Acompanhar Cores** - Quanto mais escuro o azul, maior a intensidade de chuvacd app-weather-forecast



### Escala de Cores# Instale as dependências

npm install

- 🌫️ Cinza claro - Sem chuva

- 🔵 Azul muito claro - Nublado (0-20%)# Configure as variáveis de ambiente

- 🔵 Azul claro - Chuva fraca (20-40%)cp .env.example .env

- 🔵 Azul médio - Chuva moderada (40-60%)```

- 🔵 Azul escuro - Chuva forte (60-80%)

- 🔵 Azul intenso - Chuva intensa (80-100%)### Desenvolvimento Local



## 🛠️ Tecnologias```bash

# Inicie o servidor de desenvolvimento

- **Vue 3** - Framework frontendnpm run dev

- **TypeScript** - Tipagem estática

- **Leaflet** - Mapas interativos# Acesse http://localhost:5173

- **Vite** - Build tool```

- **IBGE APIs** - Dados geográficos

### Build para Produção

## 📁 Estrutura do Projeto

```bash

```# Build otimizado

src/npm run build

├── components/

│   └── WeatherMap.vue      # Componente principal do mapa# Preview do build

├── services/npm run preview

│   ├── ibgeService.ts      # Integração com API do IBGE```

│   └── weatherService.ts   # Serviço de dados meteorológicos

├── types/## 🏗️ Estrutura do Projeto

│   └── weather.ts          # Tipos TypeScript

└── utils/```

    └── geoUtils.ts         # Utilitários geográficos (Haversine)src/

```├── components/

│   └── WeatherMap.vue      # Componente principal do mapa

## 🌐 APIs Utilizadas├── services/

│   ├── ibgeService.ts      # Integração com API do IBGE

### IBGE│   └── weatherService.ts   # Serviço de dados meteorológicos

- **Malhas Municipais (GeoJSON)** - Geometrias dos municípios├── types/

- **Localidades** - Informações dos municípios│   └── weather.ts          # Tipos TypeScript

├── App.vue                 # Componente raiz

### Leaflet└── main.ts                 # Entry point

- **OpenStreetMap** - Mapa base```



## 📊 Dados Mockados## 🌐 Deploy na AWS



Atualmente a aplicação usa **dados simulados** para demonstração. Para usar dados reais:Veja a documentação completa em [DEPLOY_AWS.md](./DEPLOY_AWS.md).



1. Implementar o backend (veja `BACKEND_REQUIREMENTS.md`)**Resumo:**

2. Descomentar as chamadas de API em `src/services/weatherService.ts`- S3 para hospedagem estática

3. Configurar variável de ambiente `VITE_API_URL`- CloudFront para CDN global

- Route 53 para DNS

## 🔧 Adicionar Mais Cidades- Terraform para infraestrutura como código



Edite `src/services/ibgeService.ts` e adicione as coordenadas:**Deploy rápido:**

```bash

```typescriptcd terraform

const MUNICIPALITY_COORDS: Record<number, { lat: number; lon: number }> = {terraform init

  3543204: { lat: -22.7572, lon: -49.9439 }, // Ribeirão do Sulterraform apply

  // Adicione aqui:

  3503208: { lat: -22.6622, lon: -50.4128 }, // Assis# Após criar infraestrutura

};npm run build

```aws s3 sync dist/ s3://seu-bucket-name/

aws cloudfront create-invalidation --distribution-id XXX --paths "/*"

### Como Buscar Coordenadas```



1. **Google Maps** - Click direito → "O que há aqui?"## 🔧 Backend

2. **LatLong.net** - https://www.latlong.net/

3. **API Nominatim** - https://nominatim.openstreetmap.org/O frontend está preparado para integração com backend. Veja [BACKEND_REQUIREMENTS.md](./BACKEND_REQUIREMENTS.md) para detalhes completos.



## 📝 Backend### APIs Meteorológicas Recomendadas:

1. **INMET** (gratuito) - Dados oficiais brasileiros

Veja `BACKEND_REQUIREMENTS.md` para:2. **OpenWeatherMap** (free tier) - Backup

- Rotas necessárias3. **CPTEC/INPE** (gratuito) - Imagens de satélite

- Exemplos de implementação

- Fontes de dados meteorológicos### Endpoints Esperados:

- Integração com o frontend```typescript

GET  /api/weather/current/:cityId

### Rotas EsperadasPOST /api/weather/regional

GET  /api/weather/forecast/:cityId?hours=24

```httpGET  /api/weather/history/:cityId?start=DATE&end=DATE

GET  /api/weather/city/:cityIdWS   /api/ws/weather/:cityId

POST /api/weather/regional```

GET  /api/weather/forecast/:cityId?hours=24

```## 🎨 Visualização



## 🗺️ Cálculo de Distâncias### Gradiente de Chuva (Azul)

- **Sem chuva**: Cinza claro `rgba(200, 200, 200, 0.3)`

Usa a **fórmula de Haversine** para calcular distâncias geográficas precisas entre coordenadas (implementada em `src/utils/geoUtils.ts`).- **Chuva fraca (0-25%)**: Azul claro `rgba(150, 150, 255, 0.4)`

- **Chuva moderada (25-50%)**: Azul médio `rgba(100, 100, 255, 0.5)`

## 📄 Deploy- **Chuva forte (50-75%)**: Azul escuro `rgba(50, 50, 255, 0.6)`

- **Chuva intensa (75-100%)**: Azul intenso `rgba(0, 0, 255, 0.8)`

Veja `DEPLOY_AWS.md` para instruções de deploy na AWS usando:

- S3 para hospedagem### Malhas Municipais

- CloudFront para CDNAs malhas são obtidas da API do IBGE:

- Route 53 para DNS```

https://servicodados.ibge.gov.br/api/v3/malhas/municipios/{id}?formato=application/vnd.geo+json

## 👨‍💻 Desenvolvimento```



```bash## 📊 Dados

# Type checking

npm run type-check### Modo Mock (Desenvolvimento)

Por padrão, a aplicação usa dados mockados para desenvolvimento sem backend.

# Build

npm run buildPara habilitar/desabilitar:

```env

# Preview da build# .env

npm run previewVITE_USE_MOCK_DATA=true  # Dados mockados

```VITE_USE_MOCK_DATA=false # Backend real

```

## 📝 Licença

### Cidades da Região

MIT- **Ribeirão do Sul** (3543204) - Cidade focal

- Ourinhos (3539103)
- Bernardino de Campos (3506300)
- Canitar (3510153)
- Santa Cruz do Rio Pardo (3552601)

Microrregião de Ourinhos - SP (código IBGE: 35040)

## 🔐 Variáveis de Ambiente

```env
VITE_API_URL=http://localhost:3000/api
VITE_USE_MOCK_DATA=true
VITE_UPDATE_INTERVAL=300000
VITE_MAP_DEFAULT_ZOOM=10
VITE_FOCAL_CITY_LAT=-22.7572
VITE_FOCAL_CITY_LON=-49.9439
VITE_FOCAL_CITY_ID=3543204
```

## 🧪 Testes

```bash
# Type checking
npm run type-check
```

## 📱 Responsividade

A aplicação é totalmente responsiva:
- Desktop: Painel lateral fixo
- Mobile: Painel inferior deslizante

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👤 Autor

**Regis**

## 🙏 Agradecimentos

- IBGE pela API de malhas municipais
- INMET pelos dados meteorológicos
- OpenStreetMap pelos mapas base
- Leaflet pela biblioteca de mapas
