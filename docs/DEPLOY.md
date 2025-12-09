# 🚀 Deploy no Vercel

Guia completo para fazer deploy do Weather Forecast App no Vercel.

## 📑 Índice

- [Visão Geral](#-visão-geral)
- [Pré-requisitos](#-pré-requisitos)
- [Deploy via Interface Web](#-deploy-via-interface-web)
- [Deploy via CLI](#-deploy-via-cli)
- [Configuração](#-configuração)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Domínio Customizado](#-domínio-customizado)
- [CI/CD Automático](#-cicd-automático)
- [Monitoramento](#-monitoramento)
- [Troubleshooting](#-troubleshooting)

## 🎯 Visão Geral

O Vercel é uma plataforma de deploy otimizada para aplicações frontend, oferecendo:

- ⚡ **Deploy Instantâneo**: Em segundos
- 🌐 **CDN Global**: Edge network
- 🔒 **HTTPS Automático**: Certificado SSL gratuito
- 🔄 **CI/CD**: Deploy automático a cada push
- 💚 **Preview**: URL única para cada PR
- 📊 **Analytics**: Métricas de performance
- 🆓 **Tier Gratuito**: 100GB bandwidth/mês

## 📋 Pré-requisitos

### 1. Conta no Vercel

Crie uma conta gratuita em: https://vercel.com/signup

**Opções de cadastro**:
- GitHub (recomendado)
- GitLab
- Bitbucket
- Email

### 2. Repositório Git

Seu código deve estar em um repositório Git:
- GitHub
- GitLab
- Bitbucket

### 3. Build Configurado

Verifique que o build funciona localmente:

```bash
npm run build
npm run preview  # Teste o build
```

## 🌐 Deploy via Interface Web

### Método Recomendado para Iniciantes

#### Passo 1: Importar Projeto

1. Acesse https://vercel.com/new
2. Click em "Import Project"
3. Selecione seu repositório Git
4. Autorize o Vercel se necessário

#### Passo 2: Configurar Projeto

O Vercel detecta automaticamente que é um projeto Vite:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**Não precisa alterar nada!** A configuração padrão já está correta.

#### Passo 3: Configurar Variáveis de Ambiente

1. Click em "Environment Variables"
2. Adicione:
   - `VITE_USE_MOCK`: `false`
   - `VITE_API_BASE_URL`: URL da sua API

#### Passo 4: Deploy

1. Click em "Deploy"
2. Aguarde 1-2 minutos
3. ✅ Aplicação no ar!

Você receberá uma URL como:
```
https://app-weather-forecast-abc123.vercel.app
```

## 💻 Deploy via CLI

### Para Usuários Avançados

#### Passo 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

#### Passo 2: Login

```bash
vercel login
```

Escolha o método de autenticação (GitHub, email, etc.)

#### Passo 3: Deploy

```bash
cd /caminho/para/app-weather-forecast

# Primeiro deploy
vercel

# Responda as perguntas:
# ? Set up and deploy? [Y/n] y
# ? Which scope? [Seu usuário]
# ? Link to existing project? [N/y] n
# ? What's your project's name? app-weather-forecast
# ? In which directory is your code located? ./
# ? Want to modify settings? [N/y] n
```

#### Passo 4: Deploy para Produção

```bash
vercel --prod
```

## ⚙️ Configuração

O arquivo `vercel.json` já está configurado:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### O que cada opção faz:

- **buildCommand**: Comando para gerar build de produção
- **outputDirectory**: Pasta com arquivos estáticos gerados
- **framework**: Framework detectado (Vite)
- **rewrites**: Redireciona todas rotas para index.html (SPA)

## 🔐 Variáveis de Ambiente

### Configuração via Web

1. Acesse https://vercel.com/[seu-usuario]/app-weather-forecast
2. Click em "Settings"
3. Click em "Environment Variables"
4. Adicione suas variáveis

### Configuração via CLI

```bash
vercel env add VITE_USE_MOCK

# Escolha o ambiente:
# ? What's the value? false
# ? Add to environment: Production
```

### Variáveis Disponíveis

| Variável | Descrição | Padrão | Ambiente |
|----------|-----------|--------|----------|
| `VITE_USE_MOCK` | Ativar modo mock (apenas desenvolvimento) | `true` (defina `false` em produção) | Production |
| `VITE_API_BASE_URL` | URL da API backend | - | Production |

### Importante sobre Variáveis Vite

⚠️ **Variáveis devem começar com `VITE_`** para serem expostas ao frontend!

```bash
# ✅ Correto
VITE_API_BASE_URL=https://api.example.com

# ❌ Errado (não será exposta)
API_BASE_URL=https://api.example.com
```

## 🌐 Domínio Customizado

### Adicionar Domínio Próprio

#### Via Web UI

1. Acesse projeto no Vercel
2. Click em "Settings" → "Domains"
3. Click em "Add"
4. Digite seu domínio: `weather.seudominio.com`
5. Siga as instruções para configurar DNS

#### Configuração DNS

No seu provedor de DNS (Registro.br, GoDaddy, etc):

**Opção 1: CNAME (Subdomínio)**
```
Type: CNAME
Name: weather
Value: cname.vercel-dns.com
```

**Opção 2: A Record (Domínio Raiz)**
```
Type: A
Name: @
Value: 76.76.21.21
```

**Verificação SSL**

O Vercel gera automaticamente certificado SSL (Let's Encrypt).
Aguarde ~15-30 minutos para propagação.

## 🔄 CI/CD Automático

### Deploy Automático

Após conectar repositório, **cada push** dispara deploy automático:

```bash
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# Vercel detecta o push e faz deploy automático
```

### Preview Deployments

**Pull Requests** ganham URL única de preview:

```
https://app-weather-forecast-pr-123.vercel.app
```

Perfeito para revisar mudanças antes de mergear!

### Ambientes

- **Production**: Branch `main`
- **Preview**: Pull Requests e outras branches
- **Development**: Local (não deploy)

### Configurar Branch de Produção

1. Settings → Git
2. Production Branch: `main` (ou `master`)
3. Salvar

## 📊 Monitoramento

### Analytics (Vercel)

1. Acesse seu projeto
2. Click em "Analytics"
3. Visualize:
   - Pageviews
   - Top Pages
   - Top Referrers
   - Devices
   - Browsers

### Web Vitals

Vercel rastreia automaticamente Core Web Vitals:
- **LCP** (Largest Contentful Paint)
- **FID** (First Input Delay)
- **CLS** (Cumulative Layout Shift)

### Logs

1. Acesse projeto → "Deployments"
2. Click em um deployment
3. View "Build Logs" e "Function Logs"

```bash
# Via CLI
vercel logs [deployment-url]
```

## 🔧 Troubleshooting

### Build Falha

**Erro**: `npm install failed`

**Solução**:
```bash
# Limpe cache local e reinstale
rm -rf node_modules package-lock.json
npm install

# Teste build localmente
npm run build

# Se funcionar local, commit e push
git add .
git commit -m "fix: update dependencies"
git push
```

**Erro**: `TypeScript errors`

**Solução**:
```bash
# Rode type check
npm run type-check

# Corrija erros TypeScript
# Depois commit e push
```

### 404 nas Rotas

**Problema**: Refresh na página dá 404

**Solução**: Já configurado no `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Assets não Carregam

**Problema**: Imagens/arquivos não aparecem

**Solução**: Use caminhos relativos ou `/` para root:

```vue
<!-- ✅ Correto -->
<img src="/logo.png" />
<img :src="`/images/${city.id}.png`" />

<!-- ❌ Errado -->
<img src="../assets/logo.png" />
```

### Variáveis de Ambiente não Funcionam

**Problema**: `import.meta.env.VITE_API_URL` é `undefined`

**Checklist**:
1. ✅ Variável começa com `VITE_`?
2. ✅ Configurada no Vercel?
3. ✅ Deploy feito APÓS adicionar variável?

**Solução**:
```bash
# Redeploy após adicionar variável
vercel --prod
```

### Performance Lenta

**Otimizações**:

1. **Habilite Compressão** (já habilitado por padrão)
2. **Otimize Imagens**: Use WebP
3. **Code Splitting**: Vite já faz automaticamente
4. **Cache Headers**: Configurar no `vercel.json`

```json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Limites do Tier Gratuito

**Limites Free Tier**:
- 100GB Bandwidth/mês
- 100 Deployments/dia
- 3.000 Execuções Serverless/dia

**Se Exceder**:
- Upgrade para Pro ($20/mês)
- Ou otimize uso (cache agressivo, etc)

## 🎯 Melhores Práticas

### 1. Use Preview Deployments

Sempre revise mudanças em URL de preview antes de mergear.

### 2. Monitore Analytics

Cheque semanalmente métricas de uso e performance.

### 3. Configure Notificações

Settings → Notifications → Habilite notificações de deploy.

### 4. Proteja Branches

Configure regras no GitHub para proteger branch `main`:
- Require PR reviews
- Require status checks (Vercel build)

### 5. Documente URLs

Adicione URLs de produção/staging no README:

```markdown
## 🚀 Deploy

- **Produção**: https://weather.seu-dominio.com
- **Staging**: https://app-weather-forecast-staging.vercel.app
```

## 📚 Recursos Adicionais

- **Documentação Oficial**: https://vercel.com/docs
- **Vite no Vercel**: https://vercel.com/docs/frameworks/vite
- **Deploy Hooks**: https://vercel.com/docs/concepts/git/deploy-hooks
- **Edge Functions**: https://vercel.com/docs/concepts/functions/edge-functions

## 🎉 Próximos Passos

Após deploy bem-sucedido:

1. ✅ Teste todas funcionalidades em produção
2. ✅ Configure domínio customizado (se tiver)
3. ✅ Adicione URL no README
4. ✅ Compartilhe com usuários!

---

**Dúvidas?** Consulte também:
- [FEATURES.md](FEATURES.md): Funcionalidades
- [ARCHITECTURE.md](ARCHITECTURE.md): Arquitetura
- [IMPLEMENTATION.md](IMPLEMENTATION.md): Implementação
