#!/bin/bash

# Script de deploy para S3 (sem CloudFront)
# Usage: ./deploy-s3.sh

set -e

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  Deploy Weather Forecast App (S3)${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Verificar se dist/ existe
if [ ! -d "dist" ]; then
  echo -e "${YELLOW}Pasta dist/ não encontrada. Executando build...${NC}"
  npm run build
  echo ""
fi

# Obter nome do bucket do Terraform
echo -e "${BLUE}Obtendo informações do bucket S3...${NC}"
cd terraform
BUCKET_NAME=$(terraform output -raw s3_bucket_name 2>/dev/null)
WEBSITE_URL=$(terraform output -raw website_url 2>/dev/null)
cd ..

if [ -z "$BUCKET_NAME" ]; then
  echo -e "${RED}Erro: Não foi possível obter o nome do bucket do Terraform${NC}"
  echo -e "${YELLOW}Execute: cd terraform && terraform apply${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Bucket: $BUCKET_NAME${NC}"
echo ""

# Fazer upload para S3
echo -e "${BLUE}Fazendo upload dos arquivos para S3...${NC}"
aws s3 sync dist/ s3://$BUCKET_NAME/ \
  --delete \
  --cache-control "public, max-age=3600" \
  --exclude "*.map"

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${GREEN}URL da aplicação:${NC}"
echo -e "${BLUE}$WEBSITE_URL${NC}"
echo ""
echo -e "${YELLOW}Nota: Esta versão usa apenas S3 (HTTP).${NC}"
echo -e "${YELLOW}Quando sua conta AWS for verificada, você poderá adicionar CloudFront para HTTPS e CDN.${NC}"
echo ""
