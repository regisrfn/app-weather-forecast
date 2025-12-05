# 🌤️ Weather Forecast App

Aplicação web de previsão do tempo com visualização em mapa interativo, desenvolvida com Vue 3, TypeScript e Leaflet.

![Vue.js](https://img.shields.io/badge/Vue.js-3.5-4FC08D?logo=vue.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=white)
[![Live Demo](https://img.shields.io/badge/🚀_Live-Demo-brightgreen?style=flat-square)](https://vemchuvabrasil.com)
![Deployed on AWS](https://img.shields.io/badge/Deployed%20on-AWS-FF9900?logo=amazon-aws&logoColor=white)
![Monitored by Datadog](https://img.shields.io/badge/Monitored-Datadog-632CA6?logo=datadog&logoColor=white)

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Demo](#-demo)
- [Tecnologias](#-tecnologias)
- [Começando](#-começando)
- [Documentação](#-documentação)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Licença](#-licença)

## 🎯 Visão Geral

O Weather Forecast App é uma aplicação web moderna que exibe previsões meteorológicas em um mapa interativo. A aplicação permite visualizar dados climáticos de múltiplas cidades simultaneamente, com controle de raio de busca, navegação temporal e estatísticas agregadas.

### Características Principais

- 🗺️ **Mapa Interativo**: Visualização geográfica com Leaflet
- 📍 **Busca de Cidades**: Pesquisa rápida por nome de cidade
- 📊 **Estatísticas Regionais**: Temperatura média, extremos e condições predominantes
- 📅 **Navegação Temporal**: Visualize previsões para os próximos 5 dias
- ⏰ **Previsão Horária**: Até 168 horas (7 dias) de previsões hora a hora
- 🧭 **Bússola de Vento**: Direção e velocidade do vento em tempo real
- 🎨 **UI Moderna**: Interface responsiva com design glassmorphism
- ⚡ **Performance**: Cache inteligente e otimizações
- 🌐 **100% Frontend**: Funciona com dados mock (backend opcional)

## ✨ Funcionalidades

### Mapa Meteorológico
- Visualização de múltiplas cidades simultaneamente
- Marcadores coloridos por condição climática
- Popups com informações detalhadas
- Controle de raio de busca (10-150 km)

### Busca e Navegação
- Pesquisa por nome de cidade
- Autocomplete com lista filtrada
- Navegação por carrossel de dias
- Controle de horários dentro do dia

### Estatísticas
- Temperatura média regional
- Temperaturas mínima e máxima
- Condição climática predominante
- Alertas meteorológicos (quando disponíveis)

### Cache e Performance
- Sistema de cache com LocalForage
- Refresh automático configurável
- Debounce em operações custosas
- Carregamento otimizado de dados

## 🚀 Demo

**URL de Produção:** [https://vemchuvabrasil.com](https://vemchuvabrasil.com)

> 💡 **Nota**: Aplicação configurada com dados mock para demonstração. Para conectar a um backend real, configure a variável `VITE_API_BASE_URL`.

### Funcionalidades Online

✅ Aplicação totalmente funcional  
✅ Mapa interativo com Leaflet  
✅ Busca de cidades brasileiras  
✅ Previsão para 5 dias  
✅ Sistema de cache ativo  
✅ SSL/HTTPS automático  

### Screenshots

```
[Adicione capturas de tela aqui]
```

## 🛠️ Tecnologias

### Frontend
- **Vue 3**: Framework JavaScript progressivo
- **TypeScript**: Tipagem estática
- **Vite**: Build tool e dev server
- **Leaflet**: Biblioteca de mapas interativos
- **Sass**: Pré-processador CSS
- **Axios**: Cliente HTTP

### Infraestrutura
- **AWS S3**: Hospedagem de arquivos estáticos
- **AWS CloudFront**: CDN global com edge locations
- **AWS Route53**: Gerenciamento de DNS
- **AWS ACM**: Certificados SSL/TLS
- **Terraform**: Infraestrutura como código
- **Datadog RUM**: Monitoramento de performance e erros
- **LocalForage**: Armazenamento local assíncrono

### Qualidade
- **Vue TSC**: Type checking para Vue
- **ESLint**: Análise estática de código (futuro)

## 🚀 Começando

### Pré-requisitos

- Node.js 20.x ou superior
- npm ou yarn

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/regisrfn/app-weather-forecast.git
cd app-weather-forecast
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.production.example .env.development.local
```

Edite o arquivo `.env.development.local`:
```env
# Modo de desenvolvimento - usa dados mockados
VITE_USE_MOCK=true

# URL da API backend (quando disponível)
VITE_API_BASE_URL=http://localhost:3000

# Datadog RUM (opcional para desenvolvimento)
VITE_DATADOG_APPLICATION_ID=
VITE_DATADOG_CLIENT_TOKEN=
VITE_ENVIRONMENT=development
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

Acesse http://localhost:5173

### Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados em `dist/`.

### Deploy para AWS

Para deploy na infraestrutura AWS:

```bash
# Configurar variáveis de produção
cp .env.production.example .env.production.local
# Edite .env.production.local com valores reais

# Provisionar infraestrutura (primeira vez)
cd terraform
terraform init
terraform apply

# Fazer deploy da aplicação
cd ..
./deploy.sh production
```

Veja [docs/AWS_DEPLOY.md](docs/AWS_DEPLOY.md) para guia completo de migração.

### Preview do Build

```bash
npm run preview
```

## 📚 Documentação

A documentação completa está organizada em seções:

- **[Funcionalidades](docs/FEATURES.md)**: Detalhamento de todas as funcionalidades
- **[Arquitetura](docs/ARCHITECTURE.md)**: Estrutura técnica e decisões de design
- **[Implementação](docs/IMPLEMENTATION.md)**: Guia de desenvolvimento e padrões
- **[Deploy](docs/DEPLOY.md)**: Instruções de deploy no Vercel
- **[API](docs/API.md)**: Documentação da integração com backend

## 📁 Estrutura do Projeto

```
app-weather-forecast/
├── public/                    # Arquivos estáticos
│   └── data/
│       └── municipalities_db.json  # Database de municípios
├── src/
│   ├── assets/               # Recursos estáticos (imagens, etc)
│   ├── components/           # Componentes Vue
│   │   ├── WeatherMap.vue   # Componente principal do mapa
│   │   ├── DayCarousel.vue  # Carrossel de dias
│   │   └── WeatherAlerts.vue # Alertas meteorológicos
│   ├── config/
│   │   └── app.ts           # Configurações da aplicação
│   ├── services/            # Camada de serviços
│   │   ├── apiService.ts    # Cliente da API
│   │   ├── cacheService.ts  # Sistema de cache
│   │   ├── ibgeService.ts   # Serviço de municípios
│   │   └── mockService.ts   # Dados mock
│   ├── styles/              # Estilos globais (Sass)
│   │   ├── abstracts/       # Variáveis, mixins, funções
│   │   ├── base/            # Reset, tipografia
│   │   └── components/      # Estilos por componente
│   ├── types/
│   │   └── weather.ts       # TypeScript interfaces
│   ├── utils/
│   │   └── array.ts         # Funções utilitárias
│   ├── App.vue              # Componente raiz
│   └── main.ts              # Entry point
├── docs/                    # Documentação
├── vercel.json              # Configuração Vercel
├── vite.config.ts           # Configuração Vite
├── tsconfig.json            # Configuração TypeScript
└── package.json             # Dependências e scripts
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Build
npm run build        # Build de produção
npm run preview      # Preview do build local

# Type Checking
npm run type-check   # Verifica erros de TypeScript
```

## 🌍 Variáveis de Ambiente

| Variável | Descrição | Padrão | Obrigatória |
|----------|-----------|--------|-------------|
| `VITE_USE_MOCK` | Usa dados mockados | `true` | Não |
| `VITE_API_BASE_URL` | URL base da API backend | - | Sim (se USE_MOCK=false) |

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👤 Autor

**Regis**
- GitHub: [@regisrfn](https://github.com/regisrfn)

---

⭐ Se este projeto foi útil, considere dar uma estrela!

