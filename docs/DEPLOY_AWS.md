# Deploy do Frontend na AWS com Terraform

## Arquitetura Recomendada

Para o deploy de uma aplicação Vue.js estática na AWS, a arquitetura ideal inclui:

1. **S3 Bucket** - Hospedagem dos arquivos estáticos
2. **CloudFront** - CDN para distribuição global
3. **Route 53** - DNS e gerenciamento de domínio
4. **ACM** - Certificado SSL/TLS
5. **CloudWatch** - Monitoramento e logs

### Vantagens desta arquitetura:
- ✅ Alta disponibilidade e escalabilidade
- ✅ Baixa latência global via CDN
- ✅ HTTPS seguro
- ✅ Custo otimizado (paga apenas pelo uso)
- ✅ Fácil versionamento e rollback

---

## Estrutura de Diretórios Terraform

```
terraform/
├── main.tf              # Recursos principais
├── variables.tf         # Variáveis de entrada
├── outputs.tf          # Outputs úteis
├── provider.tf         # Configuração do provider AWS
└── terraform.tfvars    # Valores das variáveis (não comitar!)
```

---

## 1. Provider Configuration (`provider.tf`)

```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Backend para armazenar o estado no S3 (recomendado)
  backend "s3" {
    bucket         = "seu-bucket-terraform-state"
    key            = "weather-app/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Weather Forecast App"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Provider adicional para certificados ACM (deve ser us-east-1 para CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  
  default_tags {
    tags = {
      Project     = "Weather Forecast App"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
```

---

## 2. Variables (`variables.tf`)

```hcl
variable "aws_region" {
  description = "AWS region para recursos"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Ambiente (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Nome do projeto"
  type        = string
  default     = "weather-forecast"
}

variable "domain_name" {
  description = "Domínio principal (ex: weather.exemplo.com)"
  type        = string
}

variable "route53_zone_id" {
  description = "ID da hosted zone do Route 53"
  type        = string
}

variable "enable_cloudfront_logs" {
  description = "Habilitar logs do CloudFront"
  type        = bool
  default     = true
}
```

---

## 3. Main Resources (`main.tf`)

```hcl
# ========================================
# S3 Bucket para hospedagem estática
# ========================================

resource "aws_s3_bucket" "website" {
  bucket = "${var.project_name}-${var.environment}-website"
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"  # SPA redirect
  }
}

resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "website" {
  bucket = aws_s3_bucket.website.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# ========================================
# CloudFront Origin Access Identity
# ========================================

resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for ${var.project_name}"
}

# Política do S3 para permitir acesso do CloudFront
resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.website.arn}/*"
      }
    ]
  })
}

# ========================================
# ACM Certificate (deve estar em us-east-1)
# ========================================

resource "aws_acm_certificate" "cert" {
  provider          = aws.us_east_1
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "www.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.route53_zone_id
}

resource "aws_acm_certificate_validation" "cert" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# ========================================
# S3 Bucket para logs do CloudFront
# ========================================

resource "aws_s3_bucket" "logs" {
  count  = var.enable_cloudfront_logs ? 1 : 0
  bucket = "${var.project_name}-${var.environment}-logs"
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  count  = var.enable_cloudfront_logs ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "logs" {
  count  = var.enable_cloudfront_logs ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id
  acl    = "private"
  
  depends_on = [aws_s3_bucket_ownership_controls.logs]
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  count  = var.enable_cloudfront_logs ? 1 : 0
  bucket = aws_s3_bucket.logs[0].id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    expiration {
      days = 90
    }
  }
}

# ========================================
# CloudFront Distribution
# ========================================

resource "aws_cloudfront_distribution" "website" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"  # Apenas NA e Europa
  aliases             = [var.domain_name, "www.${var.domain_name}"]

  origin {
    domain_name = aws_s3_bucket.website.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.website.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    target_origin_id       = "S3-${aws_s3_bucket.website.id}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # Cache otimizado para assets
  ordered_cache_behavior {
    path_pattern           = "/assets/*"
    target_origin_id       = "S3-${aws_s3_bucket.website.id}"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 31536000
    default_ttl = 31536000
    max_ttl     = 31536000
  }

  # Custom error response para SPA routing
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  dynamic "logging_config" {
    for_each = var.enable_cloudfront_logs ? [1] : []
    content {
      bucket          = aws_s3_bucket.logs[0].bucket_domain_name
      include_cookies = false
      prefix          = "cloudfront/"
    }
  }
}

# ========================================
# Route 53 DNS Records
# ========================================

resource "aws_route53_record" "website" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "website_www" {
  zone_id = var.route53_zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}
```

---

## 4. Outputs (`outputs.tf`)

```hcl
output "s3_bucket_name" {
  description = "Nome do bucket S3"
  value       = aws_s3_bucket.website.id
}

output "cloudfront_distribution_id" {
  description = "ID da distribuição CloudFront"
  value       = aws_cloudfront_distribution.website.id
}

output "cloudfront_domain_name" {
  description = "Domain name do CloudFront"
  value       = aws_cloudfront_distribution.website.domain_name
}

output "website_url" {
  description = "URL do site"
  value       = "https://${var.domain_name}"
}

output "certificate_arn" {
  description = "ARN do certificado ACM"
  value       = aws_acm_certificate.cert.arn
}
```

---

## 5. Terraform Variables File (`terraform.tfvars`)

```hcl
# NÃO COMITAR ESTE ARQUIVO - Adicionar ao .gitignore

aws_region       = "us-east-1"
environment      = "production"
project_name     = "weather-forecast"
domain_name      = "weather.seudominio.com.br"
route53_zone_id  = "Z1234567890ABC"  # Seu Zone ID do Route 53
enable_cloudfront_logs = true
```

---

## 6. Scripts de Deploy

### `scripts/build-and-deploy.sh`

```bash
#!/bin/bash

set -e

ENV=${1:-production}
BUCKET_NAME="weather-forecast-${ENV}-website"
DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id)

echo "🏗️  Building application..."
npm run build

echo "📦 Uploading to S3..."
aws s3 sync dist/ s3://${BUCKET_NAME}/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "*.map"

# index.html com cache curto para atualizações rápidas
aws s3 cp dist/index.html s3://${BUCKET_NAME}/index.html \
  --cache-control "public, max-age=0, must-revalidate"

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id ${DISTRIBUTION_ID} \
  --paths "/*"

echo "✅ Deploy completed successfully!"
echo "🌐 Website: https://weather.seudominio.com.br"
```

### `scripts/terraform-init.sh`

```bash
#!/bin/bash

set -e

cd terraform

echo "🚀 Initializing Terraform..."
terraform init

echo "📋 Planning infrastructure..."
terraform plan -out=tfplan

echo "✅ Plan created successfully!"
echo "📝 Review the plan and run: terraform apply tfplan"
```

---

## Comandos de Deploy

### 1. Primeira vez - Criar infraestrutura

```bash
# Navegar para o diretório terraform
cd terraform

# Inicializar Terraform
terraform init

# Revisar o plano
terraform plan

# Aplicar mudanças
terraform apply

# Anotar os outputs
terraform output
```

### 2. Build e Deploy da aplicação

```bash
# Build do Vue.js
npm run build

# Sync com S3
aws s3 sync dist/ s3://$(terraform -chdir=terraform output -raw s3_bucket_name)/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "index.html"

# index.html sem cache
aws s3 cp dist/index.html s3://$(terraform -chdir=terraform output -raw s3_bucket_name)/index.html \
  --cache-control "no-cache"

# Invalidar cache do CloudFront
aws cloudfront create-invalidation \
  --distribution-id $(terraform -chdir=terraform output -raw cloudfront_distribution_id) \
  --paths "/*"
```

### 3. Atualizar infraestrutura

```bash
cd terraform
terraform plan
terraform apply
```

---

## CI/CD com GitHub Actions

### `.github/workflows/deploy.yml`

```yaml
name: Deploy to AWS

on:
  push:
    branches:
      - main

env:
  AWS_REGION: us-east-1
  NODE_VERSION: '20'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
      env:
        VITE_API_URL: ${{ secrets.VITE_API_URL }}
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
    
    - name: Deploy to S3
      run: |
        aws s3 sync dist/ s3://${{ secrets.S3_BUCKET }}/ \
          --delete \
          --cache-control "public, max-age=31536000" \
          --exclude "index.html"
        
        aws s3 cp dist/index.html s3://${{ secrets.S3_BUCKET }}/index.html \
          --cache-control "no-cache"
    
    - name: Invalidate CloudFront cache
      run: |
        aws cloudfront create-invalidation \
          --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
          --paths "/*"
```

---

## Custos Estimados (Baixo Tráfego)

- **S3**: ~$0.50/mês (armazenamento + requests)
- **CloudFront**: ~$1-5/mês (50GB transferência)
- **Route 53**: $0.50/mês (hosted zone)
- **Total**: ~$2-6/mês

Para tráfego maior, o CloudFront escala automaticamente.

---

## Segurança e Melhores Práticas

✅ **Implementado:**
- HTTPS obrigatório
- CloudFront com OAI (S3 não público)
- Versionamento do S3
- Tags de recursos
- Certificado SSL/TLS via ACM

🔒 **Recomendações adicionais:**
- Implementar WAF no CloudFront
- Habilitar CloudTrail para auditoria
- Configurar alarmes no CloudWatch
- Backup automático do bucket S3
- Implementar política de IAM com least privilege

---

## Troubleshooting

### Problema: "403 Access Denied" no CloudFront
**Solução:** Verificar política do S3 bucket e OAI

### Problema: Cache não invalida
**Solução:** Aguardar ~5 minutos ou usar `--paths "/*"`

### Problema: Certificado SSL não validado
**Solução:** Verificar records DNS no Route 53

---

## Próximos Passos

1. ✅ Criar recursos com Terraform
2. ✅ Configurar domínio no Route 53
3. ✅ Fazer primeiro deploy
4. 🔄 Configurar CI/CD
5. 📊 Configurar monitoramento
6. 🔒 Implementar WAF (opcional)
