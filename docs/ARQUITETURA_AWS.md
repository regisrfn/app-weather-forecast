# 🏗️ Arquitetura AWS - Weather Forecast App

## Diagrama da Solução

```
┌─────────────────────────────────────────────────────────────────┐
│                          USUÁRIOS                                │
│                    (Qualquer lugar do mundo)                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTPS (TLS 1.2+)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   🌐 AMAZON CLOUDFRONT                           │
│                    (CDN Global - Edge Locations)                 │
│                                                                  │
│  ✅ Certificado SSL/TLS gratuito                                │
│  ✅ Cache inteligente (TTL configurável)                        │
│  ✅ Compressão Gzip/Brotli                                      │
│  ✅ Proteção DDoS (AWS Shield Standard)                         │
│  ✅ Redirect HTTP → HTTPS                                       │
│                                                                  │
│  📊 Edge Locations:                                             │
│  • América do Norte: ~50 locations                              │
│  • Europa: ~40 locations                                        │
│  • Ásia: ~30 locations                                          │
│  • América do Sul: ~10 locations                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Origin Access Control (OAC)
                             │ Acesso seguro e privado
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      📦 AMAZON S3                                │
│                   (Object Storage - Privado)                     │
│                                                                  │
│  Bucket: weather-forecast-prod-XXXX                             │
│  Região: us-east-1 (ou sa-east-1)                               │
│                                                                  │
│  Arquivos:                                                      │
│  ├── index.html                                                 │
│  ├── assets/                                                    │
│  │   ├── index-HASH.js                                         │
│  │   ├── index-HASH.css                                        │
│  │   └── logo-HASH.svg                                         │
│  └── ...                                                        │
│                                                                  │
│  ✅ Bucket completamente PRIVADO                                │
│  ✅ Versionamento habilitado                                    │
│  ✅ Criptografia AES-256                                        │
│  ✅ Lifecycle policies (opcional)                               │
└─────────────────────────────────────────────────────────────────┘

                             ┌─────────────────┐
                             │   ACM (us-east-1)│
                             │  🔒 Certificado  │
                             │   SSL/TLS        │
                             │   (Gratuito)     │
                             └─────────────────┘
                                      │
                                      │ Usado por CloudFront
                                      ▼
                             ┌─────────────────┐
                             │   Route53       │
                             │   (Opcional)    │
                             │   DNS           │
                             └─────────────────┘
```

---

## Fluxo de Requisição

### 1️⃣ Usuário acessa o site
```
Usuário → https://weather.example.com (ou CloudFront URL)
```

### 2️⃣ DNS Resolution (se usar domínio próprio)
```
Route53 → CNAME → d111111abcdef8.cloudfront.net
```

### 3️⃣ CloudFront recebe requisição
```
CloudFront Edge Location (mais próxima do usuário)
├── Cache HIT? → Retorna arquivo do cache ⚡ (< 50ms)
└── Cache MISS? → Busca no S3 Origin (200-500ms)
```

### 4️⃣ CloudFront → S3 (se necessário)
```
CloudFront (via OAC) → S3 Bucket (privado)
└── Validação de segurança (SigV4)
```

### 5️⃣ Resposta ao usuário
```
S3 → CloudFront → Cache → Usuário
```

---

## Segurança em Camadas

### 🔒 Camada 1: TLS/SSL
- **Certificado gratuito** via ACM
- **TLS 1.2+** obrigatório
- **HTTP → HTTPS** redirect automático

### 🔒 Camada 2: Origin Access Control (OAC)
- S3 bucket **100% privado**
- Acesso **exclusivo** do CloudFront
- **Autenticação SigV4**

### 🔒 Camada 3: S3 Bucket
- **Block Public Access**: todas as flags ativadas
- **Criptografia** em repouso (AES-256)
- **Versionamento** habilitado

### 🔒 Camada 4: IAM Policies
- **Least privilege** principle
- Acesso restrito por ARN
- **Condition keys** para validação

---

## Performance

### ⚡ Cache Strategy

#### Assets Estáticos (JS, CSS, Images)
```
Cache-Control: public, max-age=31536000
TTL: 1 ano
```
✅ Versionados via hash no nome do arquivo  
✅ Cache longo = menos requisições ao origin

#### index.html (SPA Entry Point)
```
Cache-Control: public, max-age=0, must-revalidate
TTL: Sempre validar
```
✅ Sempre busca versão mais recente  
✅ Permite atualizações instantâneas

### 📊 Performance Esperada

| Métrica | Valor |
|---------|-------|
| **TTFB** (Time to First Byte) | 50-150ms (cache hit) |
| **TTFB** (cache miss) | 200-500ms |
| **Cache Hit Rate** | 85-95% |
| **Global Latency** | < 200ms (99%) |

---

## Comparação: S3 Simple vs CloudFront

| Aspecto | S3 Website (Simple) | S3 + CloudFront |
|---------|---------------------|-----------------|
| **HTTPS** | ❌ Não (apenas HTTP) | ✅ Sim (gratuito) |
| **Domínio próprio** | ❌ Limitado | ✅ Sim (com ACM) |
| **CDN Global** | ❌ Não | ✅ Sim (edge locations) |
| **Cache** | ❌ Não | ✅ Sim (configurável) |
| **DDoS Protection** | ❌ Básica | ✅ Shield Standard |
| **Latência Global** | 🟡 Variável (200-2000ms) | ✅ Baixa (< 200ms) |
| **Custo** | $ Mais barato | $$ Pouco mais caro |
| **Segurança S3** | 🟡 Público | ✅ Privado (OAC) |
| **Compressão** | ❌ Não | ✅ Gzip/Brotli |

### 💰 Custo Comparativo (100K visitas/mês)

**S3 Simple**
- S3 GET requests: $0.04
- Data Transfer: $0.90
- **Total: ~$1/mês**

**S3 + CloudFront**
- S3 GET requests: $0.01 (menos devido ao cache)
- CloudFront requests: $0.10
- CloudFront data transfer: $0.85
- **Total: ~$1-2/mês**

💡 **Vale a pena?** SIM! Por apenas $1 a mais você ganha:
- HTTPS gratuito
- Performance global
- Segurança avançada
- Melhor experiência do usuário

---

## Recursos AWS Utilizados

### 1. **S3 Bucket** (`aws_s3_bucket`)
```hcl
resource "aws_s3_bucket" "website"
├── Versionamento
├── Criptografia (AES-256)
├── Block Public Access
└── Bucket Policy (OAC)
```

### 2. **CloudFront Distribution** (`aws_cloudfront_distribution`)
```hcl
resource "aws_cloudfront_distribution" "website"
├── Origin: S3 bucket
├── OAC (Origin Access Control)
├── Default Cache Behavior
├── Ordered Cache Behaviors (assets/)
├── Custom Error Responses (SPA)
├── Viewer Certificate (ACM)
└── CloudFront Function (SPA routing)
```

### 3. **ACM Certificate** (`aws_acm_certificate`) *Opcional*
```hcl
resource "aws_acm_certificate" "cert"
├── Provider: us-east-1 (obrigatório)
├── Validation: DNS
└── Domain: seu domínio
```

### 4. **CloudFront Function** (`aws_cloudfront_function`)
```javascript
// Redireciona rotas SPA para index.html
function handler(event) {
    var request = event.request;
    var uri = request.uri;
    if (!uri.includes('.')) {
        request.uri = '/index.html';
    }
    return request;
}
```

---

## Monitoramento

### CloudWatch Metrics (Automático)

**CloudFront**
- Requests
- BytesDownloaded
- 4xxErrorRate
- 5xxErrorRate
- CacheHitRate

**S3**
- AllRequests
- GetRequests
- BytesDownloaded
- 4xxErrors

### Alertas Recomendados

```hcl
# CloudWatch Alarm - 5xx Error Rate
resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx" {
  alarm_name          = "weather-cloudfront-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5  # 5% de erros
  alarm_description   = "CloudFront 5xx error rate is too high"
}
```

---

## Escalabilidade

### Limites e Capacidade

| Recurso | Limite | Escalabilidade |
|---------|--------|----------------|
| **CloudFront Requests/s** | Sem limite soft | ✅ Auto-scale |
| **S3 Requests/s** | 5.500 GET/prefix | ✅ Partition automaticamente |
| **CloudFront Bandwidth** | Sem limite | ✅ Ilimitado |
| **Concurrent Users** | Milhões | ✅ Global distribution |

### 📈 Crescimento Esperado

```
10K usuários/dia → sem configuração adicional
100K usuários/dia → sem configuração adicional
1M usuários/dia → considerar WAF + Rate Limiting
10M+ usuários/dia → considerar Lambda@Edge para otimizações
```

---

## Disaster Recovery

### Backup e Recuperação

**Versionamento S3**
```bash
# Listar versões
aws s3api list-object-versions --bucket BUCKET-NAME

# Restaurar versão anterior
aws s3api copy-object \
  --copy-source BUCKET-NAME/index.html?versionId=VERSION-ID \
  --bucket BUCKET-NAME \
  --key index.html
```

**Terraform State**
- Estado armazenado em `terraform.tfstate`
- Backup automático em `.backup`
- ⚠️ Considere usar S3 backend para produção

### 🔄 Rollback Rápido

```bash
# 1. Fazer rollback no código
git revert HEAD
git push

# 2. Rebuild e deploy
npm run build
./deploy-cloudfront.sh

# 3. Ou restaurar versão S3 anterior
# (se versionamento estiver habilitado)
```

---

## Próximos Passos Recomendados

### 🚀 Curto Prazo
- [ ] Configurar domínio próprio
- [ ] Adicionar CI/CD (GitHub Actions)
- [ ] Configurar CloudWatch Alarms

### 🔒 Segurança
- [ ] Implementar WAF (Web Application Firewall)
- [ ] Adicionar rate limiting
- [ ] Configurar Security Headers

### 📊 Monitoramento
- [ ] CloudWatch Dashboards
- [ ] Real-time logs (opcional)
- [ ] Cost monitoring

### ⚡ Performance
- [ ] Adicionar Lambda@Edge (se necessário)
- [ ] Otimizar cache policies
- [ ] Implement image optimization

---

## Referências

- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [S3 Static Website Hosting](https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html)
- [AWS ACM Documentation](https://docs.aws.amazon.com/acm/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
