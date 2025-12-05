# ==============================================================================
# TERRAFORM MODULES - README
# ==============================================================================

Este diretório contém módulos Terraform reutilizáveis para provisionar a infraestrutura AWS.

## 📁 Estrutura de Módulos

```
modules/
├── s3/              # Bucket S3 para hospedagem estática
├── cloudfront/      # Distribuição CDN CloudFront
├── route53/         # Hosted zone e DNS records
└── acm/             # Certificado SSL/TLS
```

## 📦 Módulo S3

**Localização:** `modules/s3/`

**Propósito:** Provisiona bucket S3 configurado para website hosting estático.

**Recursos criados:**
- S3 bucket
- Website configuration (index.html, error document)
- Bucket versioning
- Public access block
- Bucket policy (leitura pública)
- CORS configuration
- Lifecycle rules para versões antigas

**Variáveis:**
- `bucket_name` (string, required): Nome do bucket
- `enable_versioning` (bool, default: true): Habilitar versionamento
- `environment` (string, required): Ambiente (production/staging)
- `tags` (map, optional): Tags adicionais

**Outputs:**
- `bucket_id`: ID do bucket
- `bucket_arn`: ARN do bucket
- `website_endpoint`: Endpoint do website

## 🌐 Módulo CloudFront

**Localização:** `modules/cloudfront/`

**Propósito:** Provisiona distribuição CloudFront com SSL, cache otimizado e SPA routing.

**Recursos criados:**
- CloudFront distribution
- CloudFront function (SPA router)
- Route53 A/AAAA records (alias para CloudFront)
- Cache behaviors customizados

**Variáveis:**
- `domain_name` (string, required): Domínio principal
- `s3_website_endpoint` (string, required): Endpoint do S3
- `s3_bucket_name` (string, required): Nome do bucket
- `acm_certificate_arn` (string, required): ARN do certificado ACM
- `route53_zone_id` (string, required): ID da hosted zone
- `price_class` (string, default: PriceClass_200): Classe de preço
- `environment` (string, required): Ambiente
- `tags` (map, optional): Tags adicionais

**Outputs:**
- `distribution_id`: ID da distribuição
- `distribution_domain_name`: Domain name CloudFront
- `distribution_arn`: ARN da distribuição

## 🔐 Módulo ACM

**Localização:** `modules/acm/`

**Propósito:** Provisiona certificado SSL/TLS na região us-east-1 (obrigatório para CloudFront).

**Recursos criados:**
- ACM certificate
- Route53 validation records
- Certificate validation (aguarda validação)

**Variáveis:**
- `domain_name` (string, required): Domínio principal
- `route53_zone_id` (string, required): ID da hosted zone
- `environment` (string, required): Ambiente
- `tags` (map, optional): Tags adicionais

**Outputs:**
- `certificate_arn`: ARN do certificado
- `validated_certificate_arn`: ARN do certificado validado
- `certificate_status`: Status da validação

**Importante:** Este módulo deve usar o provider `aws.us_east_1` (alias).

## 🌍 Módulo Route53

**Localização:** `modules/route53/`

**Propósito:** Provisiona hosted zone no Route53 para gerenciamento de DNS.

**Recursos criados:**
- Route53 hosted zone
- CAA records (autorização AWS Certificate Manager)

**Variáveis:**
- `domain_name` (string, required): Domínio principal
- `environment` (string, required): Ambiente
- `tags` (map, optional): Tags adicionais

**Outputs:**
- `zone_id`: ID da hosted zone
- `name_servers`: Nameservers Route53 (para configurar no registrador)
- `zone_name`: Nome da zona

## 🔧 Como Usar

### Exemplo de uso no main.tf:

```hcl
module "route53" {
  source = "./modules/route53"

  domain_name = "vemchuvabrasil.com"
  environment = "production"
}

module "acm" {
  source = "./modules/acm"

  providers = {
    aws = aws.us_east_1
  }

  domain_name     = "vemchuvabrasil.com"
  route53_zone_id = module.route53.zone_id
  environment     = "production"
}

module "s3" {
  source = "./modules/s3"

  bucket_name       = "production-weather-forecast"
  enable_versioning = true
  environment       = "production"
}

module "cloudfront" {
  source = "./modules/cloudfront"

  domain_name         = "vemchuvabrasil.com"
  s3_website_endpoint = module.s3.website_endpoint
  s3_bucket_name      = module.s3.bucket_id
  acm_certificate_arn = module.acm.validated_certificate_arn
  route53_zone_id     = module.route53.zone_id
  price_class         = "PriceClass_200"
  environment         = "production"

  depends_on = [module.acm, module.s3]
}
```

## 📝 Dependências entre Módulos

```
route53 (criado primeiro)
   ↓
acm (precisa do zone_id)
   ↓
s3 (independente)
   ↓
cloudfront (precisa de todos os anteriores)
```

## 🧪 Validar Módulos

```bash
# Validar sintaxe
terraform fmt -recursive modules/

# Validar configuração
terraform validate

# Ver plano
terraform plan
```

## 🔄 Atualizar Módulos

Para atualizar um módulo específico:

```bash
# Re-inicializar após mudanças
terraform init -upgrade

# Planejar mudanças
terraform plan -target=module.s3

# Aplicar mudanças específicas
terraform apply -target=module.s3
```

## 🎯 Vantagens da Modularização

1. **Reutilização:** Módulos podem ser usados em múltiplos ambientes (staging/production)
2. **Manutenção:** Mudanças em um módulo não afetam outros
3. **Testabilidade:** Cada módulo pode ser testado independentemente
4. **Clareza:** Código mais organizado e fácil de entender
5. **Versionamento:** Módulos podem ter suas próprias versões

## 📚 Referências

- [Terraform Modules Documentation](https://www.terraform.io/docs/language/modules/)
- [AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Best Practices](https://www.terraform-best-practices.com/)
