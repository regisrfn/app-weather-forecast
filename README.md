# 🌦️ App Previsão do Tempo - Ribeirão do Sul

Aplicação Vue.js para visualização de previsão do tempo com foco em **Ribeirão do Sul/SP** e cidades vizinhas. Mostra dados de chuva com gradiente visual azul, subdivisões dentro das cidades, e integração com malhas municipais do IBGE.

## 🚀 Tecnologias

- **Vue 3** + TypeScript + Vite
- **Leaflet** - Mapas interativos
- **API IBGE** - Malhas municipais
- **Axios** - Requisições HTTP
- **PostGIS** (backend) - Dados geoespaciais

## 📋 Features

✅ Visualização de mapa centrado em Ribeirão do Sul  
✅ Malhas municipais do IBGE sobrepostas  
✅ Gradiente de cores azul (intensidade de chuva)  
✅ Subdivisões dentro de cada cidade  
✅ Painel de informações meteorológicas  
✅ Atualização automática a cada 5 minutos  
✅ Dados mockados para desenvolvimento (sem backend)  

## 🛠️ Instalação e Desenvolvimento

### Pré-requisitos
- Node.js 20+
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/app-weather-forecast.git
cd app-weather-forecast

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
```

### Desenvolvimento Local

```bash
# Inicie o servidor de desenvolvimento
npm run dev

# Acesse http://localhost:5173
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
│   └── WeatherMap.vue      # Componente principal do mapa
├── services/
│   ├── ibgeService.ts      # Integração com API do IBGE
│   └── weatherService.ts   # Serviço de dados meteorológicos
├── types/
│   └── weather.ts          # Tipos TypeScript
├── App.vue                 # Componente raiz
└── main.ts                 # Entry point
```

## 🌐 Deploy na AWS

Veja a documentação completa em [DEPLOY_AWS.md](./DEPLOY_AWS.md).

**Resumo:**
- S3 para hospedagem estática
- CloudFront para CDN global
- Route 53 para DNS
- Terraform para infraestrutura como código

**Deploy rápido:**
```bash
cd terraform
terraform init
terraform apply

# Após criar infraestrutura
npm run build
aws s3 sync dist/ s3://seu-bucket-name/
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

## 🔧 Backend

O frontend está preparado para integração com backend. Veja [BACKEND_REQUIREMENTS.md](./BACKEND_REQUIREMENTS.md) para detalhes completos.

### APIs Meteorológicas Recomendadas:
1. **INMET** (gratuito) - Dados oficiais brasileiros
2. **OpenWeatherMap** (free tier) - Backup
3. **CPTEC/INPE** (gratuito) - Imagens de satélite

### Endpoints Esperados:
```typescript
GET  /api/weather/current/:cityId
POST /api/weather/regional
GET  /api/weather/forecast/:cityId?hours=24
GET  /api/weather/history/:cityId?start=DATE&end=DATE
WS   /api/ws/weather/:cityId
```

## 🎨 Visualização

### Gradiente de Chuva (Azul)
- **Sem chuva**: Cinza claro `rgba(200, 200, 200, 0.3)`
- **Chuva fraca (0-25%)**: Azul claro `rgba(150, 150, 255, 0.4)`
- **Chuva moderada (25-50%)**: Azul médio `rgba(100, 100, 255, 0.5)`
- **Chuva forte (50-75%)**: Azul escuro `rgba(50, 50, 255, 0.6)`
- **Chuva intensa (75-100%)**: Azul intenso `rgba(0, 0, 255, 0.8)`

### Malhas Municipais
As malhas são obtidas da API do IBGE:
```
https://servicodados.ibge.gov.br/api/v3/malhas/municipios/{id}?formato=application/vnd.geo+json
```

## 📊 Dados

### Modo Mock (Desenvolvimento)
Por padrão, a aplicação usa dados mockados para desenvolvimento sem backend.

Para habilitar/desabilitar:
```env
# .env
VITE_USE_MOCK_DATA=true  # Dados mockados
VITE_USE_MOCK_DATA=false # Backend real
```

### Cidades da Região
- **Ribeirão do Sul** (3543204) - Cidade focal
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
