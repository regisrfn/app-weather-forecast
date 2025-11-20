# 🚀 Deploy com CloudFront + HTTPS

## Solução Implementada

**S3 + CloudFront + ACM** para frontend com HTTPS automático

### ✨ Benefícios
- ✅ **HTTPS gratuito** via CloudFront
- ✅ **CDN global** com baixa latência
- ✅ **Cache inteligente**
- ✅ **Segurança** (S3 privado)
- ✅ **Custo baixo** (~$2-3/mês)

---

## 🎯 Quick Start (Sem Domínio)

### 1. Inicializar Terraform
```bash
cd terraform
terraform init
```

### 2. Aplicar infraestrutura
```bash
terraform apply
```
Confirme com `yes`. Aguarde ~5 minutos.

### 3. Deploy da aplicação
```bash
cd ..
./deploy-cloudfront.sh
```

### 4. ✅ Pronto!
Acesse a URL HTTPS mostrada:
```
https://d111111abcdef8.cloudfront.net
```

---

## 🌐 Com Domínio Próprio

### 1. Configurar variáveis
Edite `terraform.tfvars`:
```hcl
domain_name          = "weather.seudominio.com"
enable_custom_domain = true
```

### 2. Aplicar
```bash
terraform apply
```

### 3. Configurar DNS
```bash
# Ver registros necessários
terraform output certificate_validation_records
terraform output dns_configuration_instructions
```

Adicione no seu DNS:
- **Validação**: Registro TXT
- **CNAME**: Apontar para CloudFront

### 4. Aguardar validação (~5-30 min)
```bash
# Verificar status
aws acm describe-certificate \
  --certificate-arn $(terraform output -raw certificate_arn) \
  --region us-east-1
```

### 5. Deploy
```bash
./deploy-cloudfront.sh
```

---

## 📋 Arquivos Importantes

- **s3-cloudfront.tf** → Infraestrutura completa (S3 + CloudFront + ACM)
- **outputs.tf** → Informações do deploy
- **deploy-cloudfront.sh** → Script de deploy automático

---

## 🔧 Comandos Úteis

```bash
# Ver todas as informações
terraform output

# Ver apenas a URL
terraform output website_url_https

# Deploy manual
aws s3 sync ./dist s3://$(terraform output -raw s3_bucket_name)/ --delete
aws cloudfront create-invalidation --distribution-id $(terraform output -raw cloudfront_distribution_id) --paths "/*"

# Destruir tudo
terraform destroy
```

---

## 💰 Custos Estimados

**Free Tier (1º ano)**
- CloudFront: 50 GB + 2M req/mês
- S3: 5 GB + 20K GET
- ACM: Gratuito

**Após Free Tier**
- ~$2-3/mês para ~100K visitas

---

## 📚 Documentação Completa

Veja: [`docs/DEPLOY_CLOUDFRONT.md`](../docs/DEPLOY_CLOUDFRONT.md)

Inclui:
- Troubleshooting
- Monitoramento
- CI/CD com GitHub Actions
- Configurações avançadas
- Segurança

---

## 🆘 Problemas Comuns

**❌ Access Denied**
```bash
terraform destroy -target=aws_s3_bucket_policy.website
terraform apply
```

**❌ Certificado não valida**
- Verifique se adicionou os registros DNS corretamente
- Aguarde até 30 minutos

**❌ Cache não atualiza**
- Aguarde 15 minutos ou
- Force invalidação: `aws cloudfront create-invalidation ...`

---

## 🔄 Rollback para S3 Simples

Se quiser voltar para S3 sem CloudFront:

1. Comente tudo em `s3-cloudfront.tf`
2. Use `s3-simple.tf`
3. `terraform apply`
