# Deploy S3 - Weather Forecast App

## Arquitetura Atual

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────────┐
│   S3 Website    │
│  (sa-east-1)    │
│  Static Hosting │
└─────────────────┘
```

## Pré-requisitos

- AWS CLI configurado
- Node.js e npm instalados
- Terraform >= 1.0.0

## Estrutura dos Arquivos

```
terraform/
├── main.tf              # Providers AWS
├── variables.tf         # Variáveis de configuração
├── terraform.tfvars     # Valores das variáveis
├── s3-simple.tf         # Bucket S3 com website hosting
└── outputs-simple.tf    # Outputs (URL, bucket name, etc)
```

## Deployment Rápido

### 1. Configurar AWS CLI

```bash
aws configure
# AWS Access Key ID: [sua-key]
# AWS Secret Access Key: [sua-secret]
# Default region name: sa-east-1
# Default output format: json
```

### 2. Inicializar Terraform (apenas primeira vez)

```bash
cd terraform
terraform init
```

### 3. Criar Infraestrutura

```bash
terraform apply
```

### 4. Deploy da Aplicação

```bash
cd ..
./deploy-s3.sh
```

Pronto! A aplicação estará disponível na URL exibida.

## Comandos Úteis

### Ver URL da aplicação
```bash
cd terraform
terraform output website_url
```

### Atualizar aplicação
```bash
npm run build
./deploy-s3.sh
```

### Destruir infraestrutura
```bash
cd terraform
terraform destroy
```

## Recursos Criados

- **S3 Bucket**: Hospedagem estática com website hosting
- **Bucket Policy**: Acesso público de leitura
- **Versioning**: Habilitado para histórico
- **Encryption**: AES256 server-side
- **Region**: sa-east-1 (São Paulo, Brasil)

## Limitações Atuais

⚠️ **Sem CloudFront**: Contas AWS novas precisam ser verificadas para usar CloudFront.

**Limitações:**
- ❌ Sem CDN global (latência maior fora do Brasil)
- ❌ Sem HTTPS customizado (apenas HTTP)
- ❌ Sem cache distribuído

## Próximos Passos (Após Verificação da Conta)

Quando sua conta AWS for verificada, você poderá adicionar CloudFront:

1. Criar arquivos CloudFront (terraform/cloudfront.tf)
2. Atualizar configuração S3 (acesso via CloudFront apenas)
3. Executar `terraform apply`

Isso adicionará:
- ✅ CDN global
- ✅ HTTPS automático
- ✅ Cache otimizado
- ✅ Melhor performance

## Custos Estimados

**Configuração atual (S3 apenas):**
- S3 Storage: ~$0.50/mês (1GB)
- S3 Requests: ~$0.05/mês (10k requests)
- Data Transfer: ~$0.50/mês (5GB)

**Total estimado: ~$1/mês**

## Troubleshooting

### Erro: Bucket already exists
```bash
cd terraform
terraform import aws_s3_bucket.website_simple <bucket-name>
```

### Erro: AWS credentials not found
```bash
aws configure
```

### Build com erro
```bash
npm install
npm run build
```

## Suporte

Para problemas ou dúvidas:
1. Verificar logs do Terraform: `terraform show`
2. Verificar bucket no console AWS
3. Testar acesso: `curl -I <website_url>`
