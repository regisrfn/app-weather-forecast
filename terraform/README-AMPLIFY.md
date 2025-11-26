# 🚀 AWS Amplify Hosting - Deploy com Terraform

Guia completo para deploy do Weather Forecast App usando AWS Amplify Hosting e Terraform (estrutura modular).

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Configuração Inicial](#configuração-inicial)
- [Deploy](#deploy)
- [Gerenciamento](#gerenciamento)
- [Troubleshooting](#troubleshooting)

---

## Visão Geral

### Arquitetura

```
┌─────────────┐
│   GitHub    │
│  Repository │
└──────┬──────┘
       │ webhook (git push)
       ▼
┌─────────────────────┐
│   AWS Amplify       │
│   - Auto Build      │
│   - CloudFront CDN  │
│   - SSL/HTTPS       │
└──────┬──────────────┘
       │ HTTPS
       ▼
┌─────────────┐
│   Usuários  │
└─────────────┘
```

### Recursos Provisionados

- ✅ **AWS Amplify App** - Aplicação com build automático
- ✅ **CloudFront CDN** - Distribuição global automática
- ✅ **SSL/TLS** - Certificado HTTPS gerenciado automaticamente
- ✅ **CI/CD** - Deploy automático ao fazer git push
- ✅ **SPA Routing** - Suporte Vue Router / React Router

### Vantagens sobre S3+CloudFront Manual

| Recurso | S3+CloudFront | AWS Amplify |
|---------|---------------|-------------|
| HTTPS | ❌ Bloqueado (requer verificação) | ✅ Automático |
| Deploy | 🔧 Manual (scripts bash) | 🚀 Git push |
| Cache Invalidation | ⏳ Manual, 5-15 min | ⚡ Automático |
| Infraestrutura | 🏗️ 10+ recursos Terraform | 🎯 1 módulo simples |
| Preview Deployments | ❌ Não disponível | ✅ Por branch/PR |
| Rollback | 🔧 Manual | ✅ 1 clique no console |

---

## Pré-requisitos

### 1. Ferramentas Instaladas

```bash
# Terraform >= 1.0
terraform --version

# AWS CLI configurado
aws configure list

# Git
git --version
```

### 2. AWS CLI Configurado

```bash
aws configure
# AWS Access Key ID: [sua-key]
# AWS Secret Access Key: [sua-secret]
# Default region name: sa-east-1
# Default output format: json
```

Verifique:
```bash
aws sts get-caller-identity
```

### 3. GitHub Personal Access Token

**Criar token:** https://github.com/settings/tokens/new

**Configuração:**
- Nome: `AWS Amplify - Weather Forecast`
- Expiração: 90 dias (ou No expiration)
- Permissões:
  - ✅ `repo` (acesso completo ao repositório)
  - ✅ `admin:repo_hook` (criar/gerenciar webhooks)

**Salvar o token gerado** (só é mostrado uma vez!)

---

## Estrutura do Projeto

```
terraform/
├── main.tf                      # Configuração principal + módulo Amplify
├── variables.tf                 # Variáveis de entrada
├── terraform.tfvars             # Valores das variáveis (não commitar!)
├── terraform.tfvars.example     # Exemplo de configuração
├── outputs-amplify.tf           # Outputs úteis
├── README-AMPLIFY.md            # Este arquivo
└── modules/
    └── amplify/
        ├── main.tf              # Recursos Amplify
        ├── variables.tf         # Variáveis do módulo
        ├── outputs.tf           # Outputs do módulo
        └── README.md            # Documentação do módulo

amplify.yml                      # Build configuration (raiz do projeto)
```

---

## Configuração Inicial

### 1. Copiar Exemplo de Variáveis

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

### 2. Editar terraform.tfvars

```bash
nano terraform.tfvars
# ou
code terraform.tfvars
```

**Configuração mínima:**

```hcl
# Básico
environment  = "production"
project_name = "weather-forecast"
aws_region   = "sa-east-1"

# GitHub
repository_url = "https://github.com/SEU-USUARIO/app-weather-forecast"
github_token   = "ghp_SEU_TOKEN_AQUI"

# Branch
branch_name       = "main"
enable_auto_build = true

# Variáveis Vite
vite_use_mock     = "true"
vite_api_base_url = ""
```

### 3. Verificar amplify.yml

O arquivo `amplify.yml` na raiz do projeto deve estar configurado:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

---

## Deploy

### 1. Inicializar Terraform

```bash
cd terraform
terraform init
```

Saída esperada:
```
Initializing modules...
- amplify in modules/amplify

Initializing the backend...
Initializing provider plugins...
...
Terraform has been successfully initialized!
```

### 2. Planejar Infraestrutura

```bash
terraform plan
```

Revise os recursos que serão criados:
- `module.amplify.aws_amplify_app.app`
- `module.amplify.aws_amplify_branch.branch["main"]`

### 3. Aplicar Infraestrutura

```bash
terraform apply
```

Digite `yes` para confirmar.

**Tempo esperado:** ~2 minutos

### 4. Verificar Outputs

```bash
terraform output
```

Saída esperada:
```
amplify_app_id = "d123abc456def"
amplify_branch_url = "https://main.d123abc456def.amplifyapp.com"
amplify_console_url = "https://console.aws.amazon.com/amplify/home?region=sa-east-1#/d123abc456def"
deploy_instructions = <<EOT
═══════════════════════════════════════════════
✅ AWS Amplify Configurado com Sucesso!
═══════════════════════════════════════════════
...
EOT
```

### 5. Primeiro Deploy

O Amplify detecta automaticamente o código atual do repositório e inicia o build:

1. Acesse o console: `terraform output amplify_console_url`
2. Clique na aba "Deployments"
3. Aguarde o build (~3-5 minutos)
4. Acesse a URL: `terraform output amplify_branch_url`

---

## Gerenciamento

### Deploy de Novas Versões

**Automático via Git:**

```bash
# Fazer alterações no código
git add .
git commit -m "Nova funcionalidade"
git push origin main
```

O Amplify detecta o push e inicia o build automaticamente! 🚀

### Verificar Status do Build

```bash
# Via CLI
aws amplify list-jobs \
  --app-id $(terraform output -raw amplify_app_id) \
  --branch-name main \
  --max-results 1

# Ou no console
terraform output amplify_console_url
```

### Adicionar Variáveis de Ambiente

**Editar `terraform.tfvars`:**

```hcl
vite_use_mock     = "false"
vite_api_base_url = "https://api.weather.example.com"
```

**Aplicar alterações:**

```bash
terraform apply
```

O Amplify detecta a mudança e refaz o build com as novas variáveis.

### Adicionar Nova Branch (Staging)

**Editar `main.tf`:**

```hcl
module "amplify" {
  # ... configuração existente ...
  
  branches = {
    main = {
      enable_auto_build       = true
      enable_performance_mode = false
      environment_variables = {
        VITE_USE_MOCK = "false"
      }
    }
    develop = {
      enable_auto_build       = true
      enable_performance_mode = false
      environment_variables = {
        VITE_USE_MOCK = "true"
      }
    }
  }
}
```

**Aplicar:**

```bash
terraform apply
```

Agora ambas as branches `main` e `develop` terão deploy automático!

### Configurar Domínio Customizado

**1. Editar `terraform.tfvars`:**

```hcl
enable_custom_domain = true
domain_name          = "weather.seudominio.com"
```

**2. Aplicar infraestrutura:**

```bash
terraform apply
```

**3. Adicionar registros DNS:**

Após apply, acesse o console Amplify e copie os registros CNAME fornecidos.

Se usar **Route 53**, os registros são criados automaticamente.
Se usar outro DNS, adicione manualmente:

```
Type: CNAME
Name: _xxx.weather.seudominio.com
Value: _yyy.acm-validations.aws.
TTL: 300
```

**4. Aguardar verificação:**

Verificação SSL leva ~15-30 minutos. Acompanhe no console.

### Rollback para Versão Anterior

**Via Console AWS:**
1. Acesse: `terraform output amplify_console_url`
2. Vá em "Deployments"
3. Encontre o deploy anterior
4. Clique "Redeploy this version"

**Via CLI:**

```bash
aws amplify start-job \
  --app-id $(terraform output -raw amplify_app_id) \
  --branch-name main \
  --job-type RELEASE \
  --job-id PREVIOUS_JOB_ID
```

---

## Troubleshooting

### ❌ Erro: Invalid GitHub token

**Problema:**
```
Error: error creating Amplify App: BadRequestException: The access token provided is invalid or has been revoked
```

**Solução:**
1. Verifique se o token tem permissões `repo` e `admin:repo_hook`
2. Gere novo token: https://github.com/settings/tokens/new
3. Atualize `terraform.tfvars`
4. Execute `terraform apply` novamente

### ❌ Build falhando no Amplify

**Problema:** Build mostra erro no console

**Solução:**
1. Acesse console: `terraform output amplify_console_url`
2. Clique no build com erro
3. Veja os logs detalhados
4. Problemas comuns:
   - Erro no `npm ci`: verifique `package-lock.json`
   - Erro no `npm run build`: teste localmente primeiro
   - Variáveis faltando: adicione em `terraform.tfvars`

### ❌ SPA routing não funciona (404 ao recarregar)

**Problema:** Ao recarregar `/map` retorna 404

**Solução:**
Verifique em `main.tf`:
```hcl
enable_spa_routing = true  # Deve estar true
```

Se já está true, aguarde 2-3 minutos para propagar.

### ❌ Domínio customizado não verifica

**Problema:** SSL não é provisionado após 1 hora

**Solução:**
1. Verifique registros DNS:
   ```bash
   dig _xxx.weather.seudominio.com CNAME
   ```
2. Aguarde propagação DNS (até 48h em casos extremos)
3. Verifique no console Amplify se há erros específicos

### ❌ Terraform: Error acquiring state lock

**Problema:** Outro processo Terraform está rodando

**Solução:**
```bash
# Ver locks ativos
terraform force-unlock LOCK_ID

# Ou remover manualmente
rm -rf .terraform/terraform.tfstate
terraform init
```

### ⚠️ Custo inesperado

**Problema:** Fatura AWS maior que esperado

**Análise:**
```bash
# Ver uso de build minutes
aws amplify list-jobs \
  --app-id $(terraform output -raw amplify_app_id) \
  --branch-name main \
  --max-results 50 \
  | jq '.jobSummaries | map(.summary.buildDuration) | add'
```

**Solução:**
- Free tier: 1.000 minutos/mês
- Se exceder: otimize build (cache node_modules)
- Desabilite auto-build em branches de teste

---

## Comandos Úteis

### Ver todas as informações

```bash
terraform output
```

### Ver apenas URL da aplicação

```bash
terraform output -raw amplify_branch_url
```

### Abrir console AWS

```bash
xdg-open "$(terraform output -raw amplify_console_url)"
# ou no Mac: open "$(terraform output -raw amplify_console_url)"
```

### Forçar rebuild sem push

```bash
aws amplify start-job \
  --app-id $(terraform output -raw amplify_app_id) \
  --branch-name main \
  --job-type RELEASE
```

### Destruir infraestrutura completa

```bash
terraform destroy
```

**⚠️ ATENÇÃO:** Isso remove toda a aplicação Amplify!

---

## Recursos Adicionais

- [Documentação AWS Amplify](https://docs.aws.amazon.com/amplify/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/amplify_app)
- [Módulo Amplify](./modules/amplify/README.md) - Documentação detalhada do módulo

---

## Migração do S3+CloudFront

Se você estava usando a configuração antiga S3+CloudFront:

1. **Backup:** Os arquivos antigos foram removidos mas estão no histórico git
2. **Reverter se necessário:**
   ```bash
   git log --all --full-history -- terraform/s3-simple.tf
   git checkout COMMIT_HASH -- terraform/s3-simple.tf
   ```
3. **Destruir recursos antigos S3:**
   ```bash
   # Se ainda existirem
   aws s3 rb s3://BUCKET-NAME --force
   ```

---

## Suporte

Para problemas ou dúvidas:
1. Verifique [Troubleshooting](#troubleshooting)
2. Consulte documentação do módulo: `modules/amplify/README.md`
3. AWS Support (se tiver plano)

---

**✅ Configuração completa!** Faça `git push` e veja a mágica acontecer! 🚀
