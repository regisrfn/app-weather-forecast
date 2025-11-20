#!/bin/bash

# ============================================
# Deploy Script - Weather Forecast App
# S3 + CloudFront com HTTPS
# ============================================

set -e  # Para em caso de erro

echo "=========================================="
echo "Weather Forecast App - Deploy Script"
echo "=========================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ---------------------------------------------
# 1. Build da aplicação
# ---------------------------------------------
echo -e "${YELLOW}[1/4] Building application...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erro: Diretório dist/ não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build concluído${NC}"
echo ""

# ---------------------------------------------
# 2. Obter informações do Terraform
# ---------------------------------------------
echo -e "${YELLOW}[2/4] Obtendo informações do Terraform...${NC}"

cd terraform

# Verificar se terraform já foi inicializado
if [ ! -d ".terraform" ]; then
    echo -e "${YELLOW}Terraform não inicializado. Executando terraform init...${NC}"
    terraform init
fi

# Obter outputs
S3_BUCKET=$(terraform output -raw s3_bucket_name 2>/dev/null)
CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null)
CLOUDFRONT_URL=$(terraform output -raw website_url_https 2>/dev/null)

if [ -z "$S3_BUCKET" ] || [ -z "$CLOUDFRONT_ID" ]; then
    echo -e "${RED}❌ Erro: Não foi possível obter informações do Terraform${NC}"
    echo "Execute 'terraform apply' primeiro"
    exit 1
fi

cd ..

echo -e "${GREEN}✓ Bucket S3: ${S3_BUCKET}${NC}"
echo -e "${GREEN}✓ CloudFront ID: ${CLOUDFRONT_ID}${NC}"
echo ""

# ---------------------------------------------
# 3. Upload para S3
# ---------------------------------------------
echo -e "${YELLOW}[3/4] Fazendo upload para S3...${NC}"

aws s3 sync ./dist s3://${S3_BUCKET}/ \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html"

# index.html com cache menor (para SPAs)
aws s3 cp ./dist/index.html s3://${S3_BUCKET}/index.html \
    --cache-control "public, max-age=0, must-revalidate" \
    --content-type "text/html"

echo -e "${GREEN}✓ Upload concluído${NC}"
echo ""

# ---------------------------------------------
# 4. Invalidar cache do CloudFront
# ---------------------------------------------
echo -e "${YELLOW}[4/4] Invalidando cache do CloudFront...${NC}"

INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id ${CLOUDFRONT_ID} \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo -e "${GREEN}✓ Invalidação iniciada (ID: ${INVALIDATION_ID})${NC}"
echo ""

# ---------------------------------------------
# Resumo do deploy
# ---------------------------------------------
echo "=========================================="
echo -e "${GREEN}✓ DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo "=========================================="
echo ""
echo "🌐 URL do site (HTTPS):"
echo "   ${CLOUDFRONT_URL}"
echo ""
echo "📦 Bucket S3: ${S3_BUCKET}"
echo "🚀 CloudFront Distribution: ${CLOUDFRONT_ID}"
echo ""
echo "⏳ Aguarde alguns minutos para o cache ser invalidado"
echo "   em todas as edge locations do CloudFront."
echo ""
echo "=========================================="
