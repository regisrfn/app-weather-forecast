# 🚀 Deploy na AWS com CloudFront

Guia completo para migrar a aplicação Weather Forecast da Vercel para AWS usando Terraform, S3, CloudFront e Route53.

## 📋 Índice

- [Pré-requisitos](#-pré-requisitos)
- [Arquitetura AWS](#-arquitetura-aws)
- [Setup Inicial](#-setup-inicial)
- [Fase 1: Provisionar Infraestrutura](#fase-1-provisionar-infraestrutura)
- [Fase 2: Testar via CloudFront](#fase-2-testar-via-cloudfront)
- [Fase 3: Migrar DNS](#fase-3-migrar-dns)
- [Fase 4: Primeiro Deploy](#fase-4-primeiro-deploy)
- [Troubleshooting](#-troubleshooting)
- [Custos Estimados](#-custos-estimados)
- [Rollback](#-rollback)
- [Próximos Passos](#-próximos-passos)

## 📦 Pré-requisitos

### 1. Ferramentas Necessárias

```bash
# Terraform 1.5+
terraform --version

# AWS CLI
aws --version

# Node.js 20+
node --version

# Git
git --version
```

**Instalação:**

```bash
# Terraform (Linux/Mac)
wget https://releases.hashicorp.com/terraform/1.6.5/terraform_1.6.5_linux_amd64.zip
unzip terraform_1.6.5_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# AWS CLI (Linux)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### 2. Credenciais AWS

Configure suas credenciais AWS:

```bash
aws configure
```

Você precisará:
- AWS Access Key ID
- AWS Secret Access Key
- Default region: `sa-east-1`
- Default output format: `json`

**Verificar credenciais:**

```bash
aws sts get-caller-identity
```

### 3. Conta Datadog

1. Acesse https://us5.datadoghq.com/rum/application/create
2. Crie uma nova aplicação RUM
3. Anote o **Application ID** e **Client Token**

## 🏗️ Arquitetura AWS

```
┌─────────────────────────────────────────────────────┐
│                    Route53 DNS                      │
│         (Nameservers gerenciados pela AWS)          │
│         vemchuvabrasil.com → CloudFront             │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│              CloudFront CDN (Global)                │
│  • Edge Locations no Brasil (São Paulo/Rio)        │
│  • SSL/TLS Certificate (ACM us-east-1)              │
│  • Cache behaviors (assets cache longo)             │
│  • Error pages 404→index.html (SPA routing)         │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│            S3 Bucket (sa-east-1)                    │
│  • Website hosting habilitado                       │
│  • Versionamento ativo                              │
│  • Build da aplicação Vue.js                        │
└─────────────────────────────────────────────────────┘
```

**Componentes:**

- **Route53**: Gerenciamento de DNS com hosted zone
- **ACM (us-east-1)**: Certificado SSL/TLS gratuito (obrigatório us-east-1 para CloudFront)
- **CloudFront**: CDN global com edge locations
- **S3 (sa-east-1)**: Armazenamento dos arquivos estáticos

## 🔧 Setup Inicial

### 1. Backup dos Registros DNS Atuais

**IMPORTANTE:** Antes de qualquer mudança, documente seus registros DNS atuais da Vercel.

Acesse: Vercel → Domains → vemchuvabrasil.com → DNS

**Registros atuais (exemplo):**
```
*     ALIAS   cname.vercel-dns-017.com            TTL 60
@     ALIAS   1d0a7b9cb9b352d4.vercel-dns-017.com TTL 60
@     CAA     0 issue "letsencrypt.org"           TTL 60
```

**Anote também os Nameservers atuais:**
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

💾 **Salve essas informações!** Você precisará delas para rollback se necessário.

### 2. Configurar Variáveis de Ambiente

```bash
cd /home/regis/GIT/app-weather-forecast

# Copiar arquivo de exemplo
cp .env.production.example .env.production.local

# Editar com valores reais
nano .env.production.local
```

**Preencha:**
```bash
# AWS (será preenchido após Terraform apply)
AWS_REGION=sa-east-1
S3_BUCKET=  # Obter do Terraform output
CF_DISTRIBUTION_ID=  # Obter do Terraform output

# Application
VITE_API_BASE_URL=https://api.vemchuvabrasil.com

# Datadog
VITE_DATADOG_APPLICATION_ID=your-app-id
VITE_DATADOG_CLIENT_TOKEN=your-client-token
VITE_ENVIRONMENT=production
```

### 3. Instalar Dependências

```bash
npm install
```

Isso instalará o Datadog RUM SDK e removerá as dependências da Vercel.

## Fase 1: Provisionar Infraestrutura

### 1. Inicializar Terraform

```bash
cd terraform

# Inicializar (baixa providers)
terraform init
```

**Output esperado:**
```
Initializing the backend...
Initializing provider plugins...
- Finding hashicorp/aws versions matching "~> 5.0"...
...
Terraform has been successfully initialized!
```

### 2. Validar Configuração

```bash
# Validar sintaxe
terraform validate

# Formatar arquivos
terraform fmt
```

### 3. Planejar Mudanças

```bash
terraform plan
```

**Revise o output:**
- ✅ S3 bucket será criado
- ✅ CloudFront distribution será criada
- ✅ Route53 hosted zone será criada
- ✅ ACM certificate será solicitado
- ✅ DNS records serão criados

### 4. Aplicar Infraestrutura

```bash
terraform apply
```

Digite `yes` quando solicitado.

**⏱️ Tempo estimado:** 15-30 minutos (certificado ACM leva mais tempo)

**Output importante:**
```
Outputs:

route53_nameservers = [
  "ns-1234.awsdns-12.org",
  "ns-5678.awsdns-34.com",
  "ns-910.awsdns-56.net",
  "ns-1112.awsdns-78.co.uk"
]

cloudfront_url = "https://d1234567890abc.cloudfront.net"
s3_bucket_name = "production-weather-forecast-sa-east-1"
cloudfront_distribution_id = "E1234567890ABC"
```

**📝 ANOTE ESSES VALORES!** Você precisará deles.

### 5. Atualizar .env.production.local

```bash
cd ..
nano .env.production.local
```

Preencha os valores do Terraform output:
```bash
S3_BUCKET=production-weather-forecast-sa-east-1
CF_DISTRIBUTION_ID=E1234567890ABC
```

## Fase 2: Testar via CloudFront

**ANTES de migrar o DNS**, teste que tudo está funcionando via URL temporária do CloudFront.

### 1. Fazer Deploy Inicial

```bash
# Primeiro deploy
./deploy.sh production
```

**O script irá:**
1. ✅ Validar variáveis de ambiente
2. ✅ Instalar dependências
3. ✅ Fazer build da aplicação
4. ✅ Upload para S3 com cache headers
5. ✅ Invalidar cache do CloudFront

### 2. Testar CloudFront URL

Acesse a URL temporária (do Terraform output):
```
https://d1234567890abc.cloudfront.net
```

**Checklist de validação:**

- [ ] Site carrega corretamente
- [ ] Rotas funcionam (/, /city/:id)
- [ ] Assets carregam (CSS, JS, images)
- [ ] Arquivo `municipalities_db.json` carrega
- [ ] Mapa Leaflet renderiza
- [ ] API está respondendo (endpoint backend disponível)
- [ ] Console do navegador sem erros
- [ ] Datadog RUM está rastreando (verifique no painel Datadog)

**Se algo não funcionar**, corrija antes de prosseguir para Fase 3.

## Fase 3: Migrar DNS

**⚠️ ATENÇÃO:** Esta etapa fará o site migrar da Vercel para AWS. Haverá propagação DNS de 2-24h.

### 1. Atualizar Nameservers no Painel Vercel

1. Acesse: https://vercel.com/dashboard
2. Vá em: Domains → vemchuvabrasil.com
3. Click em: **Nameservers**
4. Selecione: **Custom Nameservers**

**Substitua os nameservers atuais pelos 4 da AWS** (do Terraform output):
```
ns-1234.awsdns-12.org
ns-5678.awsdns-34.com
ns-910.awsdns-56.net
ns-1112.awsdns-78.co.uk
```

5. Click em **Save**

### 2. Aguardar Propagação DNS

**⏱️ Tempo:** 2-24 horas (geralmente 2-6h)

**Verificar propagação:**

```bash
# Verificar nameservers
dig NS vemchuvabrasil.com

# Verificar record A
dig A vemchuvabrasil.com

# Verificar de DNS público
dig @8.8.8.8 vemchuvabrasil.com
```

**Ferramentas online:**
- https://www.whatsmydns.net/#NS/vemchuvabrasil.com
- https://dnschecker.org/

**Quando ver os nameservers AWS em múltiplas regiões**, a propagação está completa.

### 3. Durante a Propagação

Durante a propagação DNS:
- Alguns usuários verão o site na Vercel (nameservers antigos)
- Outros verão o site na AWS (nameservers novos)
- Isso é normal e esperado

**Recomendações:**
- ⏸️ Não faça deploys durante propagação
- 📊 Monitore Datadog RUM para detectar problemas
- 🚨 Tenha o plano de rollback pronto

## Fase 4: Primeiro Deploy

Após propagação DNS completa:

### 1. Validar DNS

```bash
# Deve retornar nameservers AWS
dig NS vemchuvabrasil.com

# Deve retornar CloudFront IP
dig A vemchuvabrasil.com
```

### 2. Testar Domínio Final

Acesse: https://vemchuvabrasil.com

**Checklist:**
- [ ] Site carrega via HTTPS
- [ ] Certificado SSL válido (cadeado verde)
- [ ] Todas funcionalidades funcionam
- [ ] Performance adequada
- [ ] Datadog RUM rastreando

### 3. Monitoramento

**Datadog RUM:**
- Acesse: https://us5.datadoghq.com/rum
- Verifique: Session replays, erros, performance

**CloudWatch:**
```bash
# Ver logs CloudFront
aws cloudfront get-distribution --id E1234567890ABC
```

## 🔧 Troubleshooting

### Certificado SSL Pendente

**Problema:** Certificado ACM fica em "Pending Validation"

**Causa:** Registros DNS de validação não propagaram

**Solução:**
```bash
# Verificar status
aws acm describe-certificate --certificate-arn <arn> --region us-east-1

# Aguardar até 30 minutos
# Terraform aguarda automaticamente
```

### Site Mostra Versão Antiga

**Problema:** Após deploy, site mostra versão antiga

**Causa:** Cache do CloudFront

**Solução:**
```bash
# Criar invalidação manual
aws cloudfront create-invalidation \
  --distribution-id E1234567890ABC \
  --paths "/*"

# Verificar status
aws cloudfront get-invalidation \
  --distribution-id E1234567890ABC \
  --id <invalidation-id>
```

### DNS Não Propaga

**Problema:** DNS ainda aponta para Vercel após horas

**Verificar:**
```bash
# Ver nameservers atuais
whois vemchuvabrasil.com | grep "Name Server"

# Limpar cache DNS local
sudo systemd-resolve --flush-caches  # Linux
dscacheutil -flushcache              # Mac
ipconfig /flushdns                   # Windows
```

### Erro 403 Forbidden

**Problema:** CloudFront retorna 403

**Causas possíveis:**
1. Bucket policy não permite acesso público
2. Arquivos não foram enviados para S3

**Solução:**
```bash
# Verificar arquivos no S3
aws s3 ls s3://production-weather-forecast-sa-east-1/ --recursive

# Verificar bucket policy
aws s3api get-bucket-policy --bucket production-weather-forecast-sa-east-1

# Redeploy
./deploy.sh production
```

### Datadog Não Rastreia

**Problema:** Nenhum dado aparece no Datadog

**Verificar:**
1. Application ID e Client Token corretos?
2. Site está em `https://` (não funciona em `http://`)?
3. Console do navegador mostra erros Datadog?

**Debug:**
```javascript
// Abra console do navegador
datadogRum.getInitConfiguration()
// Deve retornar objeto com configuração
```

## 💰 Custos Estimados

### Custos Mensais (uso médio)

| Serviço | Custo Mensal | Detalhes |
|---------|--------------|----------|
| **Route53** | $0.50 | 1 hosted zone |
| **S3** | $0.10-0.50 | ~100MB storage + requests |
| **CloudFront** | $1-5 | Depende do tráfego (PriceClass_200) |
| **ACM** | $0 | Gratuito |
| **Data Transfer** | $0.50-2 | Saída S3→CloudFront |
| **TOTAL** | **$2-8/mês** | ~$25-100/ano |

### Custos Anuais

| Item | Custo Anual | Nota |
|------|-------------|------|
| AWS Infraestrutura | $25-100 | Varia com tráfego |
| Domínio Vercel | $20 | Até transferir |
| **TOTAL** | **$45-120/ano** | |

**Após transferir domínio para Route53 (28/01/2026):**
- AWS Infraestrutura: $25-100/ano
- Domínio Route53: $12/ano
- **TOTAL: $37-112/ano**

### Otimização de Custos

```hcl
# terraform/variables.tf

# Usar PriceClass_100 (só US/Europa) para economizar
variable "cloudfront_price_class" {
  default = "PriceClass_100"  # Economiza ~30%
}

# Desabilitar versionamento S3 se não precisa
variable "enable_versioning" {
  default = false  # Economiza storage
}
```

## 🔄 Rollback

Se algo der errado, você pode reverter para Vercel:

### 1. Restaurar Nameservers Vercel

No painel Vercel:
1. Domains → vemchuvabrasil.com → Nameservers
2. Selecione: **Vercel Nameservers**
3. Ou configure custom com os nameservers antigos que você anotou

### 2. Aguardar Propagação

Tempo: 2-24 horas

### 3. Site Volta para Vercel

Site funcionará na Vercel normalmente.

**⚠️ Importante:**
- Você NÃO perde a infraestrutura AWS
- Pode tentar migração novamente quando quiser
- Apenas reverte o DNS

## 📚 Próximos Passos

### 1. Migrar State do Terraform para S3

Atualmente o state está local. Migre para S3:

```hcl
# terraform/backend.tf (criar arquivo)

terraform {
  backend "s3" {
    bucket         = "terraform-state-weather-forecast"
    key            = "production/terraform.tfstate"
    region         = "sa-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}
```

**Criar recursos backend:**
```bash
# Criar bucket
aws s3 mb s3://terraform-state-weather-forecast --region sa-east-1

# Criar tabela DynamoDB
aws dynamodb create-table \
  --table-name terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region sa-east-1

# Migrar state
terraform init -migrate-state
```

### 2. Criar Ambiente Staging

```bash
cd terraform

# Criar workspace staging
terraform workspace new staging

# Aplicar com variáveis diferentes
terraform apply -var="environment=staging" -var="domain_name=staging.vemchuvabrasil.com"
```

### 3. Transferir Domínio para Route53 (Após 27/01/2026)

1. Desbloquear domínio na Vercel
2. Obter auth code da Vercel
3. Iniciar transferência no Route53:

```bash
aws route53domains transfer-domain \
  --domain-name vemchuvabrasil.com \
  --duration-in-years 1 \
  --auth-code <code-da-vercel>
```

4. Aguardar 5-7 dias
5. Economizar $14/ano 🎉

### 4. Configurar CI/CD com GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: sa-east-1
      
      - name: Deploy
        env:
          S3_BUCKET: ${{ secrets.S3_BUCKET }}
          CF_DISTRIBUTION_ID: ${{ secrets.CF_DISTRIBUTION_ID }}
          VITE_API_BASE_URL: ${{ secrets.VITE_API_BASE_URL }}
          VITE_DATADOG_APPLICATION_ID: ${{ secrets.VITE_DATADOG_APPLICATION_ID }}
          VITE_DATADOG_CLIENT_TOKEN: ${{ secrets.VITE_DATADOG_CLIENT_TOKEN }}
        run: ./deploy.sh production
```

### 5. Configurar Health Checks

```hcl
# terraform/monitoring.tf (criar arquivo)

resource "aws_route53_health_check" "website" {
  fqdn              = var.domain_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/"
  failure_threshold = 3
  request_interval  = 30

  tags = {
    Name = "Weather Forecast Health Check"
  }
}

resource "aws_cloudwatch_metric_alarm" "website_down" {
  alarm_name          = "website-down"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Minimum"
  threshold           = "1"
  alarm_description   = "Site está offline"
  alarm_actions       = [aws_sns_topic.alerts.arn]
}
```

## 📞 Suporte

**Documentação:**
- Terraform AWS Provider: https://registry.terraform.io/providers/hashicorp/aws
- AWS CloudFront: https://docs.aws.amazon.com/cloudfront/
- Datadog RUM: https://docs.datadoghq.com/real_user_monitoring/

**Comandos Úteis:**

```bash
# Ver estado Terraform
terraform show

# Ver recursos criados
terraform state list

# Destruir tudo (cuidado!)
terraform destroy

# Ver logs CloudFront em tempo real
aws cloudfront get-distribution --id E1234567890ABC

# Estatísticas CloudFront
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --dimensions Name=DistributionId,Value=E1234567890ABC \
  --start-time 2024-12-04T00:00:00Z \
  --end-time 2024-12-04T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

---

**Migração completa! 🎉** Sua aplicação agora está rodando em infraestrutura AWS escalável e otimizada.
