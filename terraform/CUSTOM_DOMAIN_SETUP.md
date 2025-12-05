# Configuração de Domínio Customizado - Guia Completo

## Para Nova Aplicação (Primeira Vez)

Se você está criando uma aplicação do zero com domínio customizado, siga estas etapas:

---

## OPÇÃO 1: Setup em 2 Etapas (Recomendado para Domínio Novo)

### Etapa 1: Criar infraestrutura SEM domínio customizado

```hcl
# terraform.tfvars
enable_custom_domain = false
aws_region           = "sa-east-1"
environment          = "production"
```

```bash
terraform init
terraform apply
```

**Resultado:**
- ✅ S3 bucket criado
- ✅ CloudFront funcionando
- ✅ Site acessível via CloudFront URL
- 🚀 Deploy funcionando

### Etapa 2: Adicionar domínio customizado

```hcl
# terraform.tfvars
enable_custom_domain = true
domain_name          = "seudominio.com"
aws_region           = "sa-east-1"
environment          = "production"
```

```bash
terraform apply -target=module.route53[0] -target=module.acm[0]
```

**Copie os nameservers do output:**
```
route53_nameservers = [
  "ns-xxxx.awsdns-xx.com",
  ...
]
```

**Atualize nameservers no seu registrador de domínio** (GoDaddy, Namecheap, AWS Route53, etc.)

**Aguarde propagação DNS** (30min - 2h):
```bash
dig NS seudominio.com +short
```

**Quando nameservers estiverem propagados, aplique configuração completa:**
```bash
terraform apply
```

---

## OPÇÃO 2: Domínio Comprado na AWS Route53

Se você comprar o domínio **direto na AWS Route53**, pode fazer tudo de uma vez:

```hcl
# terraform.tfvars
enable_custom_domain = true
domain_name          = "seudominio.com"
aws_region           = "sa-east-1"
environment          = "production"
```

```bash
# 1. Comprar domínio na AWS Route53 Console
# https://console.aws.amazon.com/route53/home#DomainRegistration

# 2. Aplicar infraestrutura
terraform apply
```

**Por que funciona?**
- Domínio já está na Route53
- Nameservers já estão configurados automaticamente
- Certificado ACM valida imediatamente
- CloudFront configura sem erro

---

## OPÇÃO 3: Domínio Já Existente em Outro Registrador

### Passo 1: Criar Route53 Hosted Zone primeiro

```bash
terraform apply -target=module.route53[0]
```

### Passo 2: Copiar nameservers e atualizar no registrador

```bash
terraform output route53_nameservers
```

### Passo 3: Aguardar propagação DNS (2-24h)

```bash
# Verificar propagação
dig NS seudominio.com +short

# Quando aparecerem os nameservers da AWS, continuar
```

### Passo 4: Criar certificado ACM

```bash
terraform apply -target=module.acm[0]
```

### Passo 5: Aguardar validação do certificado (5-30min)

```bash
# Verificar status
aws acm list-certificates --region us-east-1
```

### Passo 6: Aplicar configuração completa

```bash
terraform apply
```

---

## Troubleshooting

### Erro: "InvalidViewerCertificate"

**Causa:** Certificado ACM ainda não foi validado.

**Solução:**
1. Verifique propagação DNS: `dig NS seudominio.com`
2. Verifique status do certificado: `aws acm describe-certificate --certificate-arn <ARN> --region us-east-1`
3. Aguarde status = `ISSUED` antes de aplicar CloudFront

### Erro: "ConflictingDomainExists"

**Causa:** Domínio já está em uso em outra distribuição CloudFront.

**Solução:**
1. Remova o domínio da distribuição antiga
2. Aguarde 5-10 minutos
3. Tente novamente

### Certificado não valida

**Causa:** Nameservers não estão apontando para AWS Route53.

**Solução:**
```bash
# Verificar nameservers atuais
dig NS seudominio.com +short

# Devem aparecer:
# ns-xxxx.awsdns-xx.org
# ns-xxxx.awsdns-xx.co.uk
# ns-xxxx.awsdns-xx.com
# ns-xxxx.awsdns-xx.net
```

---

## Migração de Vercel/Netlify/Outro Provider

Se você já tem um site em produção e quer migrar sem downtime:

### 1. Criar infraestrutura AWS sem domínio

```hcl
enable_custom_domain = false
```

### 2. Testar via CloudFront URL

```bash
./deploy.sh production
# Acesse: https://xxxxx.cloudfront.net
```

### 3. Quando tudo estiver OK, habilitar domínio customizado

```hcl
enable_custom_domain = true
domain_name          = "seudominio.com"
```

### 4. Seguir OPÇÃO 1 acima

---

## Resumo das Abordagens

| Cenário | Abordagem | Tempo Estimado |
|---------|-----------|----------------|
| Domínio novo (qualquer registrador) | OPÇÃO 1 (2 etapas) | 2-24h (propagação DNS) |
| Domínio comprado na AWS Route53 | OPÇÃO 2 (1 etapa) | 10-15min |
| Domínio existente em outro registrador | OPÇÃO 3 (6 passos) | 2-24h (propagação DNS) |
| Migração de site existente | Sem domínio primeiro, depois adicionar | 2-24h (propagação DNS) |

---

## Comandos Úteis

```bash
# Verificar nameservers
dig NS seudominio.com +short

# Verificar certificado ACM
aws acm list-certificates --region us-east-1

# Verificar status de certificado específico
aws acm describe-certificate --certificate-arn <ARN> --region us-east-1

# Verificar propagação DNS global
https://dnschecker.org

# Aplicar apenas módulos específicos (útil para debug)
terraform apply -target=module.route53[0]
terraform apply -target=module.acm[0]
terraform apply -target=module.cloudfront
```
