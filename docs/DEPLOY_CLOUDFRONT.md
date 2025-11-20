# 🚀 Deploy AWS - CloudFront + HTTPS

## Arquitetura Implementada

A solução implementada utiliza:

- **Amazon S3**: Armazenamento dos arquivos estáticos (privado)
- **Amazon CloudFront**: CDN global com HTTPS automático
- **AWS ACM**: Certificado SSL/TLS gratuito (opcional, para domínio próprio)
- **Origin Access Control (OAC)**: Acesso seguro do CloudFront ao S3

## ✨ Vantagens desta Solução

✅ **HTTPS automático** - CloudFront fornece certificado SSL gratuito  
✅ **CDN Global** - Distribuição em edge locations no mundo todo  
✅ **Alta Performance** - Cache inteligente e compressão automática  
✅ **Segurança** - S3 bucket privado, acesso apenas via CloudFront  
✅ **Custo-benefício** - Free tier generoso + preços baixos  
✅ **Escalabilidade** - Suporta milhões de requisições sem configuração adicional

---

## 📋 Pré-requisitos

1. AWS CLI configurado:
```bash
aws configure
```

2. Terraform instalado (v1.13.5+)
3. Node.js e npm instalados

---

## 🚀 Deploy Rápido (Sem Domínio Próprio)

### Passo 1: Inicializar Terraform

```bash
cd terraform
terraform init
```

### Passo 2: Aplicar infraestrutura

```bash
terraform apply
```

Confirme com `yes`. Aguarde ~5 minutos.

### Passo 3: Deploy da aplicação

```bash
cd ..
./deploy-cloudfront.sh
```

### Passo 4: Acessar o site

O comando acima mostrará a URL HTTPS:
```
https://d111111abcdef8.cloudfront.net
```

✅ **Pronto!** Seu site está no ar com HTTPS.

---

## 🌐 Deploy com Domínio Próprio (HTTPS)

### Passo 1: Configurar variáveis

Edite `terraform/terraform.tfvars`:

```hcl
environment           = "production"
domain_name          = "weather.seudominio.com"
enable_custom_domain = true
```

### Passo 2: Aplicar infraestrutura

```bash
cd terraform
terraform apply
```

### Passo 3: Configurar DNS

O Terraform mostrará os registros DNS necessários:

```bash
terraform output certificate_validation_records
```

**Adicione estes registros no seu provedor DNS:**

1. **Validação do Certificado** (tipo TXT):
   - Nome: `_acme-challenge.weather.seudominio.com`
   - Valor: (valor fornecido pelo output)

2. **Apontar domínio para CloudFront** (tipo CNAME):
   - Nome: `weather.seudominio.com`
   - Valor: `d111111abcdef8.cloudfront.net` (fornecido pelo output)

### Passo 4: Aguardar validação do certificado

```bash
# Verificar status do certificado
aws acm describe-certificate \
  --certificate-arn $(terraform output -raw certificate_arn) \
  --region us-east-1
```

Status: `PENDING_VALIDATION` → `ISSUED` (pode levar 5-30 minutos)

### Passo 5: Deploy da aplicação

```bash
cd ..
./deploy-cloudfront.sh
```

✅ **Pronto!** Acesse `https://weather.seudominio.com`

---

## 📁 Estrutura dos Arquivos Terraform

```
terraform/
├── main.tf              # Providers AWS
├── s3-cloudfront.tf     # S3 + CloudFront + ACM (NOVA SOLUÇÃO)
├── s3-simple.tf         # S3 simples (solução antiga, sem HTTPS)
├── variables.tf         # Variáveis de configuração
├── outputs.tf           # Outputs importantes
└── terraform.tfvars     # Valores das variáveis
```

### Arquivos Importantes

- **s3-cloudfront.tf**: Solução completa com HTTPS (RECOMENDADA)
- **s3-simple.tf**: Solução simples sem CloudFront (apenas HTTP)

---

## ⚙️ Variáveis de Configuração

Edite `terraform.tfvars`:

```hcl
# Básico
aws_region   = "us-east-1"
environment  = "production"
project_name = "weather-forecast"

# Domínio customizado (opcional)
domain_name          = ""      # Ex: "weather.example.com"
enable_custom_domain = false

# CloudFront
price_class = "PriceClass_100"  # Mais barato (América + Europa)
enable_ipv6 = true

# Cache TTL (segundos)
min_ttl     = 0
default_ttl = 3600      # 1 hora
max_ttl     = 86400     # 1 dia
```

### Price Classes do CloudFront

- **PriceClass_100**: América + Europa (mais barato)
- **PriceClass_200**: América, Europa, Ásia, África, Oceania
- **PriceClass_All**: Todas as edge locations (mais caro)

---

## 🔧 Comandos Úteis

### Ver outputs do Terraform

```bash
cd terraform
terraform output
```

### Fazer deploy manual

```bash
# Build
npm run build

# Upload para S3
aws s3 sync ./dist s3://SEU-BUCKET-NAME/ --delete

# Invalidar cache do CloudFront
aws cloudfront create-invalidation \
  --distribution-id SEU-DISTRIBUTION-ID \
  --paths "/*"
```

### Ver status do CloudFront

```bash
aws cloudfront get-distribution \
  --id SEU-DISTRIBUTION-ID
```

### Ver logs do CloudFront

```bash
# Habilitar logs (opcional)
# Edite s3-cloudfront.tf e adicione:

logging_config {
  bucket          = "BUCKET-DE-LOGS.s3.amazonaws.com"
  prefix          = "cloudfront-logs/"
  include_cookies = false
}
```

---

## 💰 Estimativa de Custos

### Free Tier (primeiro ano)
- **CloudFront**: 50 GB de transferência + 2M requisições/mês
- **S3**: 5 GB de armazenamento + 20K GET requests
- **ACM**: Certificados SSL gratuitos

### Após Free Tier (estimativa)
Para um site com **100K visitas/mês**:
- CloudFront: ~$1-2/mês
- S3: ~$0.50/mês
- **Total: ~$2-3/mês**

---

## 🔒 Segurança

### Implementações de Segurança

✅ S3 bucket **totalmente privado**  
✅ Acesso ao S3 apenas via **CloudFront OAC**  
✅ **TLS 1.2+** obrigatório  
✅ **Redirect HTTP → HTTPS** automático  
✅ Criptografia em repouso (AES256)  
✅ Versionamento de arquivos habilitado

### Headers de Segurança (Opcional)

Adicione em `s3-cloudfront.tf`:

```hcl
response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id

resource "aws_cloudfront_response_headers_policy" "security" {
  name = "security-headers-policy"
  
  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = true
    }
    
    content_type_options {
      override = true
    }
    
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    
    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
  }
}
```

---

## 🐛 Troubleshooting

### Erro: "Access Denied" ao acessar CloudFront

**Causa**: Policy do S3 não está correta ou OAC não configurado.

**Solução**:
```bash
terraform destroy -target=aws_s3_bucket_policy.website
terraform apply
```

### Erro: Certificado não valida

**Causa**: Registros DNS não foram adicionados.

**Solução**: Verifique os registros:
```bash
terraform output certificate_validation_records
```

### Cache não invalida

**Causa**: CloudFront pode levar até 15 minutos.

**Solução**: Aguarde ou use query strings:
```
https://seudominio.com?v=123
```

### Erro 403/404 em rotas do SPA

**Causa**: CloudFront Function pode ter falhado.

**Solução**: Verifique os custom error responses no `s3-cloudfront.tf`.

---

## 🔄 Rollback

### Destruir infraestrutura

```bash
cd terraform
terraform destroy
```

### Voltar para S3 simples (sem CloudFront)

1. Comente todo o conteúdo de `s3-cloudfront.tf`
2. Use `s3-simple.tf`
3. Execute `terraform apply`

---

## 📊 Monitoramento

### CloudWatch Metrics (automático)

CloudFront envia métricas para CloudWatch:
- Requests
- Bytes Downloaded
- Error Rate
- Cache Hit Rate

Acesse: Console AWS → CloudWatch → Metrics → CloudFront

### Habilitar Real-time Logs (opcional)

```hcl
# Em s3-cloudfront.tf
resource "aws_cloudfront_realtime_log_config" "example" {
  name          = "weather-realtime-logs"
  sampling_rate = 100
  # ... configuração do Kinesis
}
```

---

## 📝 Próximos Passos

- [ ] Configurar domínio próprio
- [ ] Adicionar Route53 para DNS automatizado
- [ ] Implementar CI/CD (GitHub Actions)
- [ ] Configurar CloudWatch Alarms
- [ ] Adicionar WAF (Web Application Firewall)

---

## 🆘 Suporte

**Documentação AWS**:
- [CloudFront](https://docs.aws.amazon.com/cloudfront/)
- [S3 Static Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [ACM](https://docs.aws.amazon.com/acm/)

**Terraform**:
- [AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
