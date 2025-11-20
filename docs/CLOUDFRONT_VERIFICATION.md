# ⚠️ CloudFront - Verificação de Conta AWS Necessária

## Problema Encontrado

Ao tentar criar uma distribuição CloudFront, você recebeu este erro:

```
AccessDenied: Your account must be verified before you can add new CloudFront resources. 
To verify your account, please contact AWS Support 
(https://console.aws.amazon.com/support/home#/) and include this error message.
```

## O que isso significa?

A AWS requer que **contas novas** sejam **verificadas** antes de permitir o uso de certos serviços, incluindo **CloudFront**. Isso é uma medida de segurança para prevenir abuso.

## ✅ Solução

### Opção 1: Verificar a Conta AWS (Recomendado)

1. **Acesse o AWS Support Center**
   - https://console.aws.amazon.com/support/home

2. **Crie um caso de suporte**
   - Type: **Account and Billing Support**
   - Category: **Account**
   - Subject: **CloudFront Access Request**
   
3. **Mensagem sugerida**:
   ```
   Hello,

   I'm trying to create a CloudFront distribution for my web application
   but I'm getting the following error:

   "Your account must be verified before you can add new CloudFront resources"

   Could you please verify my account so I can use CloudFront?

   Account ID: [Seu Account ID]

   Thank you!
   ```

4. **Aguarde resposta**
   - Geralmente leva **1-24 horas**
   - Em alguns casos, pode ser instantâneo

### Opção 2: Usar S3 Simple (Solução Atual)

✅ **Já está funcionando!**

Seu site está hospedado em:
```
http://weather-forecast-production-eea8c812.s3-website-sa-east-1.amazonaws.com
```

**Limitações:**
- ❌ Sem HTTPS
- ❌ Sem CDN global
- ❌ Performance variável para usuários distantes
- ✅ Funciona perfeitamente
- ✅ Custo mais baixo

### Opção 3: Alternativas ao CloudFront

Se você precisa de HTTPS imediatamente:

#### A) **Vercel** (GRÁTIS)
```bash
npm install -g vercel
vercel login
vercel --prod
```
- ✅ HTTPS automático
- ✅ CDN global
- ✅ Deploy instantâneo
- ✅ Free tier generoso

#### B) **Netlify** (GRÁTIS)
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```
- ✅ HTTPS automático
- ✅ CDN global
- ✅ Deploy instantâneo

#### C) **GitHub Pages** (GRÁTIS)
- ✅ HTTPS automático
- ✅ Integração com GitHub
- ❌ Precisa repositório público

#### D) **Cloudflare Pages** (GRÁTIS)
- ✅ HTTPS automático
- ✅ CDN mais rápido do mundo
- ✅ Unlimited bandwidth

---

## 🔄 Quando Migrar para CloudFront

Após sua conta ser verificada:

### 1. Habilitar CloudFront no Terraform

```bash
cd terraform
mv s3-simple.tf s3-simple.tf.disabled
mv s3-cloudfront.tf.disabled s3-cloudfront.tf
mv outputs-simple.tf outputs-simple.tf.disabled
mv outputs-cloudfront.tf.disabled outputs-cloudfront.tf
```

### 2. Aplicar mudanças

```bash
terraform plan
terraform apply
```

### 3. Deploy

```bash
cd ..
./deploy-manual.sh
```

O script automaticamente detectará CloudFront e usará a nova URL HTTPS! 🎉

---

## 📊 Comparação: S3 vs CloudFront vs Vercel

| Recurso | S3 Simple | S3 + CloudFront | Vercel/Netlify |
|---------|-----------|-----------------|----------------|
| **HTTPS** | ❌ | ✅ | ✅ |
| **CDN Global** | ❌ | ✅ | ✅ |
| **Deploy Time** | ~10s | ~5 min | ~30s |
| **Setup Complexity** | ⭐ Fácil | ⭐⭐ Médio | ⭐ Muito Fácil |
| **Custo** | $1/mês | $2/mês | $0 (free tier) |
| **Controle AWS** | ✅ | ✅ | ❌ |
| **Custom Domain** | 🟡 Limitado | ✅ | ✅ |

---

## 💡 Recomendação

**Para Desenvolvimento/Teste:**
- Use **Vercel** ou **Netlify** (GRÁTIS, HTTPS instantâneo)

**Para Produção (AWS):**
1. Verifique sua conta AWS (suporte)
2. Aguarde aprovação (1-24h)
3. Migre para CloudFront
4. Configure domínio próprio com ACM

**Solução Atual:**
- ✅ S3 Simple está funcionando perfeitamente
- ✅ Deploy manual funciona: `./deploy-manual.sh`
- ⚠️ Sem HTTPS (não recomendado para produção)

---

## 🆘 Links Úteis

- **AWS Support:** https://console.aws.amazon.com/support/home
- **Vercel:** https://vercel.com
- **Netlify:** https://netlify.com
- **Cloudflare Pages:** https://pages.cloudflare.com
- **AWS Account Verification:** https://docs.aws.amazon.com/accounts/latest/reference/manage-acct-verification.html

---

## ✅ Status Atual

- ✅ **Deploy funcionando** com S3 Simple
- ✅ **Script de deploy** (`./deploy-manual.sh`) funcionando
- ⏳ **CloudFront** aguardando verificação de conta
- 📦 **URL ativa:** http://weather-forecast-production-eea8c812.s3-website-sa-east-1.amazonaws.com
