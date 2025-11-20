#!/bin/bash

# ============================================
# Deploy Manual - Weather Forecast App
# Deploy simples para S3 (com ou sem CloudFront)
# ============================================

set -e  # Para em caso de erro

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "=========================================="
echo "  Weather Forecast App - Deploy Manual"
echo "=========================================="
echo ""

# ---------------------------------------------
# Verificar dependências
# ---------------------------------------------
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ Erro: $1 não está instalado${NC}"
        echo "   Instale com: sudo apt install $2"
        exit 1
    fi
}

echo -e "${BLUE}[0/5] Verificando dependências...${NC}"
check_command "aws" "awscli"
check_command "terraform" "terraform"
check_command "npm" "npm"
echo -e "${GREEN}✓ Todas as dependências OK${NC}"
echo ""

# ---------------------------------------------
# 1. Build da aplicação
# ---------------------------------------------
echo -e "${YELLOW}[1/5] Building application...${NC}"

if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erro: package.json não encontrado!${NC}"
    echo "   Execute este script na raiz do projeto"
    exit 1
fi

npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erro: Diretório dist/ não foi criado!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build concluído com sucesso${NC}"
echo ""

# ---------------------------------------------
# 2. Verificar infraestrutura Terraform
# ---------------------------------------------
echo -e "${YELLOW}[2/5] Verificando infraestrutura...${NC}"

cd terraform

# Verificar se terraform foi inicializado
if [ ! -d ".terraform" ]; then
    echo -e "${YELLOW}⚠ Terraform não inicializado. Executando terraform init...${NC}"
    terraform init
fi

# Verificar se existe state
if [ ! -f "terraform.tfstate" ]; then
    echo -e "${RED}❌ Erro: Infraestrutura não existe!${NC}"
    echo "   Execute primeiro: cd terraform && terraform apply"
    exit 1
fi

echo -e "${GREEN}✓ Infraestrutura encontrada${NC}"
echo ""

# ---------------------------------------------
# 3. Obter informações do Terraform
# ---------------------------------------------
echo -e "${YELLOW}[3/5] Obtendo configurações...${NC}"

# Verificar qual solução está sendo usada
HAS_CLOUDFRONT=$(terraform state list 2>/dev/null | grep -c "aws_cloudfront_distribution.website" || true)

if [ "$HAS_CLOUDFRONT" -gt 0 ] 2>/dev/null; then
    echo -e "${BLUE}📡 Detectado: S3 + CloudFront${NC}"
    DEPLOY_TYPE="cloudfront"
    S3_BUCKET=$(terraform output -raw s3_bucket_name 2>/dev/null)
    CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null)
    WEBSITE_URL=$(terraform output -raw website_url_https 2>/dev/null)
else
    echo -e "${BLUE}📦 Detectado: S3 Simple${NC}"
    DEPLOY_TYPE="s3simple"
    # Tentar pegar do state antigo
    S3_BUCKET=$(terraform state show 'aws_s3_bucket.website_simple' 2>/dev/null | grep "bucket " | head -1 | awk '{print $3}' | tr -d '"')
    if [ -z "$S3_BUCKET" ]; then
        echo -e "${RED}❌ Erro: Não foi possível determinar o bucket S3${NC}"
        exit 1
    fi
    WEBSITE_URL=$(terraform state show 'aws_s3_bucket_website_configuration.website_simple' 2>/dev/null | grep "website_endpoint" | awk '{print $3}' | tr -d '"')
    WEBSITE_URL="http://${WEBSITE_URL}"
fi

if [ -z "$S3_BUCKET" ]; then
    echo -e "${RED}❌ Erro: Não foi possível obter informações do Terraform${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Bucket S3: ${S3_BUCKET}${NC}"
if [ "$DEPLOY_TYPE" = "cloudfront" ]; then
    echo -e "${GREEN}✓ CloudFront ID: ${CLOUDFRONT_ID}${NC}"
fi
echo ""

cd ..

# ---------------------------------------------
# 4. Upload para S3
# ---------------------------------------------
echo -e "${YELLOW}[4/5] Fazendo upload para S3...${NC}"

if [ "$DEPLOY_TYPE" = "cloudfront" ]; then
    # Deploy para CloudFront (com cache otimizado)
    echo "  → Uploading assets com cache longo..."
    aws s3 sync ./dist s3://${S3_BUCKET}/ \
        --delete \
        --cache-control "public, max-age=31536000" \
        --exclude "index.html" \
        --exclude "*.map"
    
    echo "  → Uploading index.html com cache curto..."
    aws s3 cp ./dist/index.html s3://${S3_BUCKET}/index.html \
        --cache-control "public, max-age=0, must-revalidate" \
        --content-type "text/html"
else
    # Deploy simples para S3
    aws s3 sync ./dist s3://${S3_BUCKET}/ \
        --delete \
        --exclude "*.map"
fi

echo -e "${GREEN}✓ Upload concluído${NC}"
echo ""

# ---------------------------------------------
# 5. Invalidar cache do CloudFront (se aplicável)
# ---------------------------------------------
if [ "$DEPLOY_TYPE" = "cloudfront" ]; then
    echo -e "${YELLOW}[5/5] Invalidando cache do CloudFront...${NC}"
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id ${CLOUDFRONT_ID} \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text 2>/dev/null || echo "ERROR")
    
    if [ "$INVALIDATION_ID" != "ERROR" ]; then
        echo -e "${GREEN}✓ Invalidação criada (ID: ${INVALIDATION_ID})${NC}"
    else
        echo -e "${YELLOW}⚠ Não foi possível invalidar o cache${NC}"
        echo "  Execute manualmente:"
        echo "  aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_ID} --paths '/*'"
    fi
else
    echo -e "${YELLOW}[5/5] Sem cache para invalidar (S3 Simple)${NC}"
fi

echo ""

# ---------------------------------------------
# Resumo do deploy
# ---------------------------------------------
echo "=========================================="
echo -e "${GREEN}✅ DEPLOY CONCLUÍDO COM SUCESSO!${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}Tipo de deploy:${NC} $DEPLOY_TYPE"
echo -e "${BLUE}Bucket S3:${NC} ${S3_BUCKET}"
echo ""
echo -e "${GREEN}🌐 URL do site:${NC}"
echo "   ${WEBSITE_URL}"
echo ""

if [ "$DEPLOY_TYPE" = "cloudfront" ]; then
    echo -e "${YELLOW}⏳ Aguarde 2-3 minutos para o cache ser invalidado${NC}"
    echo "   em todas as edge locations do CloudFront."
else
    echo -e "${YELLOW}💡 Dica:${NC} Para HTTPS e melhor performance, considere"
    echo "   migrar para CloudFront (veja docs/DEPLOY_CLOUDFRONT.md)"
fi

echo ""
echo "=========================================="
