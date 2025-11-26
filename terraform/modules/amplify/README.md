# AWS Amplify Terraform Module

Módulo reutilizável para provisionar AWS Amplify Hosting com suporte a múltiplas branches, domínios customizados e SPA routing.

## Recursos Criados

- **AWS Amplify App** - Aplicação principal com integração GitHub
- **AWS Amplify Branch** - Configuração de branches para deploy (main, develop, etc)
- **AWS Amplify Domain** - Domínio customizado com SSL automático (opcional)

## Uso Básico

```hcl
module "amplify" {
  source = "./modules/amplify"

  app_name       = "my-app-production"
  repository_url = "https://github.com/user/repo"
  github_token   = var.github_token

  build_spec_content = file("${path.module}/amplify.yml")

  environment_variables = {
    VITE_API_URL = "https://api.example.com"
    NODE_ENV     = "production"
  }

  branches = {
    main = {
      enable_auto_build       = true
      enable_performance_mode = false
      environment_variables   = {}
    }
  }

  enable_spa_routing = true

  tags = {
    Environment = "production"
    Project     = "MyApp"
  }
}
```

## Uso Avançado - Múltiplas Branches

```hcl
module "amplify" {
  source = "./modules/amplify"

  app_name       = "my-app"
  repository_url = "https://github.com/user/repo"
  github_token   = var.github_token

  build_spec_content = file("${path.module}/amplify.yml")

  environment_variables = {
    SHARED_VAR = "value"
  }

  branches = {
    main = {
      enable_auto_build       = true
      enable_performance_mode = false
      environment_variables = {
        ENVIRONMENT = "production"
        API_URL     = "https://api.example.com"
      }
    }
    develop = {
      enable_auto_build       = true
      enable_performance_mode = false
      environment_variables = {
        ENVIRONMENT = "development"
        API_URL     = "https://api-dev.example.com"
      }
    }
  }

  enable_spa_routing = true
}
```

## Uso com Domínio Customizado

```hcl
module "amplify" {
  source = "./modules/amplify"

  app_name       = "my-app"
  repository_url = "https://github.com/user/repo"
  github_token   = var.github_token

  build_spec_content = file("${path.module}/amplify.yml")

  branches = {
    main = {
      enable_auto_build       = true
      enable_performance_mode = false
      environment_variables   = {}
    }
  }

  custom_domain = {
    domain_name            = "myapp.example.com"
    enable_auto_sub_domain = false
    wait_for_verification  = true
    sub_domains = [
      {
        branch_name = "main"
        prefix      = ""
      },
      {
        branch_name = "main"
        prefix      = "www"
      }
    ]
  }

  enable_spa_routing = true
}
```

## Variáveis de Entrada

| Nome | Descrição | Tipo | Padrão | Obrigatório |
|------|-----------|------|--------|-------------|
| `app_name` | Nome da aplicação Amplify | `string` | - | ✅ |
| `repository_url` | URL do repositório GitHub | `string` | - | ✅ |
| `github_token` | GitHub Personal Access Token | `string` | - | ✅ |
| `build_spec_content` | Conteúdo do amplify.yml | `string` | - | ✅ |
| `environment_variables` | Variáveis de ambiente globais | `map(string)` | `{}` | ❌ |
| `node_version` | Versão do Node.js | `string` | `"20"` | ❌ |
| `branches` | Configuração das branches | `map(object)` | `{}` | ❌ |
| `enable_spa_routing` | Habilitar SPA routing | `bool` | `true` | ❌ |
| `custom_rules` | Regras customizadas adicionais | `list(object)` | `[]` | ❌ |
| `custom_domain` | Configuração de domínio customizado | `object` | `null` | ❌ |
| `enable_branch_auto_deletion` | Auto-deletar branches removidas | `bool` | `false` | ❌ |
| `enable_basic_auth` | Habilitar autenticação básica | `bool` | `false` | ❌ |
| `tags` | Tags para recursos | `map(string)` | `{}` | ❌ |

### Estrutura de `branches`

```hcl
branches = {
  "branch-name" = {
    enable_auto_build       = bool      # Deploy automático ao push
    enable_performance_mode = bool      # Otimizações de cache
    environment_variables   = map(string)  # Variáveis específicas da branch
  }
}
```

### Estrutura de `custom_domain`

```hcl
custom_domain = {
  domain_name            = string  # ex: "myapp.com"
  enable_auto_sub_domain = bool    # Auto-criar subdomínios
  wait_for_verification  = bool    # Aguardar verificação DNS
  sub_domains = [
    {
      branch_name = string  # Branch associada
      prefix      = string  # "" para root, "www" para www.myapp.com
    }
  ]
}
```

## Outputs

| Nome | Descrição | Exemplo |
|------|-----------|---------|
| `app_id` | ID da aplicação Amplify | `d123abc456def` |
| `app_arn` | ARN da aplicação | `arn:aws:amplify:...` |
| `default_domain` | Domínio padrão do Amplify | `d123abc456def.amplifyapp.com` |
| `branches` | Informações das branches | Map com URLs de cada branch |
| `custom_domain_url` | URL do domínio customizado | `https://myapp.com` ou `null` |
| `console_url` | URL do console AWS | Link direto para gerenciar a app |

### Exemplo de uso dos outputs

```hcl
output "main_branch_url" {
  value = module.amplify.branches["main"].url
}

output "app_console" {
  value = module.amplify.console_url
}
```

## Pré-requisitos

### 1. GitHub Personal Access Token

Crie um token em: https://github.com/settings/tokens/new

**Permissões necessárias:**
- ✅ `repo` (acesso completo ao repositório)
- ✅ `admin:repo_hook` (criar/gerenciar webhooks)

### 2. Arquivo amplify.yml

Crie `amplify.yml` na raiz do projeto:

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

## Exemplos Completos

### SPA Vue.js/React

```hcl
module "amplify" {
  source = "./modules/amplify"

  app_name       = "my-spa-app"
  repository_url = "https://github.com/user/my-spa"
  github_token   = var.github_token

  build_spec_content = file("${path.module}/amplify.yml")

  environment_variables = {
    VITE_API_URL = "https://api.example.com"
  }

  branches = {
    main = {
      enable_auto_build       = true
      enable_performance_mode = false
      environment_variables   = {}
    }
  }

  enable_spa_routing = true

  tags = {
    Environment = "production"
  }
}
```

### Multi-ambiente (prod + staging)

```hcl
module "amplify" {
  source = "./modules/amplify"

  app_name       = "my-app-multi-env"
  repository_url = "https://github.com/user/my-app"
  github_token   = var.github_token

  build_spec_content = file("${path.module}/amplify.yml")

  branches = {
    main = {
      enable_auto_build       = true
      enable_performance_mode = true
      environment_variables = {
        ENV_NAME = "production"
        API_URL  = "https://api.example.com"
      }
    }
    staging = {
      enable_auto_build       = true
      enable_performance_mode = false
      environment_variables = {
        ENV_NAME = "staging"
        API_URL  = "https://api-staging.example.com"
      }
    }
  }

  enable_spa_routing = true
}
```

## Troubleshooting

### Erro: Invalid GitHub token

**Problema:** Token do GitHub inválido ou sem permissões

**Solução:**
1. Verifique se o token tem permissões `repo` e `admin:repo_hook`
2. Gere um novo token se necessário
3. Atualize `terraform.tfvars`

### Build falhando

**Problema:** Build do Amplify falha

**Solução:**
1. Acesse o console AWS Amplify
2. Verifique os logs de build
3. Confirme se `amplify.yml` está correto
4. Verifique variáveis de ambiente necessárias

### SPA routing não funciona

**Problema:** Rotas do Vue/React retornam 404 ao recarregar

**Solução:**
1. Confirme `enable_spa_routing = true`
2. As regras customizadas são aplicadas automaticamente
3. Aguarde 2-3 minutos após deploy para propagar

### Domínio customizado não verifica

**Problema:** SSL não é provisionado para domínio customizado

**Solução:**
1. Adicione os registros DNS conforme instruções no console
2. Use `wait_for_verification = true` no Terraform
3. Aguarde 15-30 minutos para propagação DNS

## Recursos AWS

Este módulo cria os seguintes recursos:

- `aws_amplify_app` - 1 por invocação
- `aws_amplify_branch` - 1 por branch configurada
- `aws_amplify_domain_association` - 0 ou 1 (se domínio customizado habilitado)

## Custos Estimados

**AWS Amplify Free Tier (12 meses):**
- ✅ 1.000 minutos de build/mês
- ✅ 15 GB de armazenamento
- ✅ 15 GB de transferência/mês

**Após Free Tier:**
- Build: $0.01/minuto
- Hosting: Primeiros 15 GB grátis, depois $0.15/GB
- Transferência: Primeiros 15 GB grátis, depois $0.15/GB

**Exemplo:** App com 30 deploys/mês (~60 min build) + 10 GB transfer = **~$0.60/mês**

## Segurança

- ✅ GitHub token marcado como `sensitive = true`
- ✅ HTTPS automático via AWS Certificate Manager
- ✅ Suporte para autenticação básica (opcional)
- ✅ Tags para organização e auditoria

## Suporte

Para mais informações:
- [Documentação AWS Amplify](https://docs.aws.amazon.com/amplify/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)

## Licença

Este módulo segue a mesma licença do projeto principal.
