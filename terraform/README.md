# 🚀 Deploy na AWS com Terraform

Infraestrutura como código (IaC) para deploy do Weather Forecast App na AWS usando S3 + CloudFront.

## 📋 Pré-requisitos

1. **AWS CLI** instalado e configurado
   ```bash
   aws configure
   ```

2. **Terraform** instalado (v1.0+)
   ```bash
   # macOS
   brew install terraform
   
   # Linux
   wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
   unzip terraform_1.6.0_linux_amd64.zip
   sudo mv terraform /usr/local/bin/
   ```

3. **Credenciais AWS** com permissões para:
   - S3 (criar buckets, políticas)
   - CloudFront (criar distribuições)
   - ACM (certificados SSL) - opcional
   - Route53 (DNS) - opcional

## 🏗️ Infraestrutura

### Recursos Criados

- ✅ **S3 Bucket** - Hospedagem estática com versionamento e criptografia
- ✅ **CloudFront Distribution** - CDN global com cache otimizado
- ✅ **Origin Access Control** - Acesso seguro S3 → CloudFront
- ✅ **SSL/TLS Certificate** - HTTPS automático (domínio customizado opcional)
- ✅ **Route53 Records** - DNS (domínio customizado opcional)

### Arquitetura

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │ HTTPS
       ▼
┌──────────────────┐
│   CloudFront     │ ← CDN Global
│   (CDN)          │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   S3 Bucket      │ ← Hospedagem Estática
│   (Website)      │
└──────────────────┘
```

## 🚀 Deploy Rápido

### 1. Build da Aplicação

```bash
# Volta para o diretório raiz do projeto
cd /home/regis/GIT/app-weather-forecast

# Build de produção
npm run build
```

### 2. Inicializar Terraform

```bash
cd terraform

# Inicializar Terraform
terraform init
```

### 3. Revisar Infraestrutura

```bash
# Ver o que será criado
terraform plan
```

### 4. Criar Infraestrutura

```bash
# Aplicar mudanças
terraform apply

# Confirmar com: yes
```

### 5. Deploy da Aplicação

Após o Terraform criar a infraestrutura, use os comandos de output:

```bash
# Ver outputs
terraform output

# Copiar comando de deploy
terraform output -raw deploy_command

# Executar deploy (exemplo)
aws s3 sync ../dist/ s3://weather-forecast-production-abc123/ --delete
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths '/*'
```

## ⚙️ Configuração

### Variáveis (terraform.tfvars)

```hcl
# Ambiente
environment  = "production"
project_name = "weather-forecast"
aws_region   = "us-east-1"

# CloudFront
price_class = "PriceClass_100"  # US, Canadá, Europa
enable_ipv6 = true

# Cache
default_ttl = 3600   # 1 hora
max_ttl     = 86400  # 1 dia

# Domínio customizado (opcional)
# enable_custom_domain = true
# domain_name          = "weather.exemplo.com"
```

### Domínio Customizado (Opcional)

Para usar domínio próprio:

1. Edite `terraform.tfvars`:
   ```hcl
   enable_custom_domain = true
   domain_name          = "weather.seudominio.com"
   ```

2. Certifique-se de ter a zona Route53 criada:
   ```bash
   aws route53 list-hosted-zones
   ```

3. Apply novamente:
   ```bash
   terraform apply
   ```

## 📊 Outputs

Após o deploy, o Terraform exibe:

| Output | Descrição |
|--------|-----------|
| `s3_bucket_name` | Nome do bucket S3 |
| `cloudfront_distribution_id` | ID da distribuição CloudFront |
| `cloudfront_domain_name` | URL do CloudFront |
| `website_url` | URL completa do site |
| `deploy_command` | Comando completo para deploy |

## 🔄 Atualizações

### Deploy de Nova Versão

```bash
# 1. Build
cd /home/regis/GIT/app-weather-forecast
npm run build

# 2. Sync para S3
cd terraform
BUCKET=$(terraform output -raw s3_bucket_name)
DIST_ID=$(terraform output -raw cloudfront_distribution_id)

aws s3 sync ../dist/ s3://$BUCKET/ --delete

# 3. Invalidar cache do CloudFront
aws cloudfront create-invalidation \
  --distribution-id $DIST_ID \
  --paths '/*'
```

### Script de Deploy Automatizado

```bash
#!/bin/bash
# deploy.sh

set -e

echo "🔨 Building application..."
npm run build

echo "📦 Uploading to S3..."
cd terraform
BUCKET=$(terraform output -raw s3_bucket_name)
DIST_ID=$(terraform output -raw cloudfront_distribution_id)

aws s3 sync ../dist/ s3://$BUCKET/ --delete

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DIST_ID \
  --paths '/*'

echo "✅ Deploy completo!"
echo "🌐 Site: $(terraform output -raw website_url)"
```

## 💰 Custos Estimados

### Tier Gratuito (12 meses)
- S3: 5 GB armazenamento + 20k GET requests
- CloudFront: 1 TB transferência + 10M requests
- Route53: Primeira hosted zone

### Após Tier Gratuito
- **S3**: ~$0.023/GB (us-east-1)
- **CloudFront**: ~$0.085/GB (primeiros 10 TB)
- **Route53**: $0.50/mês por hosted zone

**Estimativa mensal (10k visitantes):**
- S3: < $1
- CloudFront: $5-10
- Route53: $0.50
- **Total: ~$6-12/mês**

## 🔒 Segurança

✅ **Implementado:**
- Bucket S3 privado (acesso apenas via CloudFront)
- HTTPS obrigatório (redirect-to-https)
- Origin Access Control (OAC)
- Versionamento habilitado
- Criptografia server-side (AES256)
- TLS 1.2+ mínimo

## 🧹 Destruir Infraestrutura

**⚠️ ATENÇÃO: Isso apaga tudo!**

```bash
cd terraform

# Remover tudo
terraform destroy

# Confirmar com: yes
```

## 🐛 Troubleshooting

### Erro: Bucket name already exists
- Nomes de bucket S3 são globalmente únicos
- O Terraform adiciona um sufixo aleatório automaticamente

### CloudFront demorando para propagar
- Pode levar 15-30 minutos na primeira criação
- Use `terraform output website_url` para pegar a URL

### Erro de permissões AWS
```bash
# Verificar credenciais
aws sts get-caller-identity

# Verificar região
aws configure get region
```

### Cache antigo no CloudFront
```bash
# Invalidar todo o cache
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths '/*'
```

## 📚 Recursos

- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS S3 Static Website](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [AWS CloudFront](https://docs.aws.amazon.com/cloudfront/)
- [AWS CLI](https://aws.amazon.com/cli/)

## 🤝 Contribuindo

Para modificar a infraestrutura:

1. Edite os arquivos `.tf`
2. `terraform fmt` - Formatar código
3. `terraform validate` - Validar sintaxe
4. `terraform plan` - Revisar mudanças
5. `terraform apply` - Aplicar mudanças
