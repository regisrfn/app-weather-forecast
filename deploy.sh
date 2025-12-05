#!/bin/bash

# ==============================================================================
# Deploy Script para Weather Forecast App na AWS
# ==============================================================================
# 
# Usage: ./deploy.sh [environment]
# Example: ./deploy.sh production
#
# Requirements:
#   - AWS CLI configurado
#   - Node.js 20+
#   - Variáveis de ambiente configuradas
# ==============================================================================

set -e  # Exit on error

# Colors para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções de log
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# ==============================================================================
# CONFIGURAÇÃO
# ==============================================================================

ENVIRONMENT=${1:-production}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BUILD_DIR="${PROJECT_ROOT}/dist"

log_info "Iniciando deploy para ambiente: ${ENVIRONMENT}"
log_info "Diretório do projeto: ${PROJECT_ROOT}"

# Carregar variáveis de ambiente
# Primeiro tenta .env.production
ENV_FILE_BASE="${PROJECT_ROOT}/.env.${ENVIRONMENT}"
if [ -f "${ENV_FILE_BASE}" ]; then
    log_info "Carregando variáveis de ${ENV_FILE_BASE}"
    set -a
    source "${ENV_FILE_BASE}"
    set +a
fi

# Depois tenta .env.production.local (sobrescreve se existir)
ENV_FILE_LOCAL="${PROJECT_ROOT}/.env.${ENVIRONMENT}.local"
if [ -f "${ENV_FILE_LOCAL}" ]; then
    log_info "Carregando variáveis de ${ENV_FILE_LOCAL} (override)"
    set -a
    source "${ENV_FILE_LOCAL}"
    set +a
fi

if [ ! -f "${ENV_FILE_BASE}" ] && [ ! -f "${ENV_FILE_LOCAL}" ]; then
    log_warning "Nenhum arquivo .env encontrado. Usando variáveis de ambiente do sistema."
fi

# ==============================================================================
# VALIDAÇÃO DE VARIÁVEIS OBRIGATÓRIAS
# ==============================================================================

log_info "Validando variáveis de ambiente obrigatórias..."

REQUIRED_VARS=(
    "AWS_REGION"
    "S3_BUCKET"
    "CF_DISTRIBUTION_ID"
    "VITE_USE_MOCK"
    "VITE_API_BASE_URL"
)

OPTIONAL_VARS=(
    "VITE_DATADOG_APPLICATION_ID"
    "VITE_DATADOG_CLIENT_TOKEN"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

# Avisar sobre variáveis opcionais não configuradas
for var in "${OPTIONAL_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        log_warning "${var} não configurado - Datadog RUM será desabilitado"
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    log_error "Variáveis obrigatórias não configuradas:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Configure as variáveis em ${ENV_FILE} ou como variáveis de ambiente."
    exit 1
fi

log_success "Todas as variáveis obrigatórias estão configuradas"

# Exibir configuração (sem valores sensíveis)
log_info "Configuração do deploy:"
echo "  - Ambiente: ${ENVIRONMENT}"
echo "  - AWS Region: ${AWS_REGION}"
echo "  - S3 Bucket: ${S3_BUCKET}"
echo "  - CloudFront ID: ${CF_DISTRIBUTION_ID}"
echo "  - API Mode: ${VITE_USE_MOCK}"
echo "  - API URL: ${VITE_API_BASE_URL}"

# ==============================================================================
# VERIFICAR AWS CLI
# ==============================================================================

log_info "Verificando AWS CLI..."

if ! command -v aws &> /dev/null; then
    log_error "AWS CLI não encontrado. Instale com: https://aws.amazon.com/cli/"
    exit 1
fi

# Verificar credenciais AWS
if ! aws sts get-caller-identity --region "${AWS_REGION}" &> /dev/null; then
    log_error "Credenciais AWS inválidas ou não configuradas"
    log_info "Configure com: aws configure"
    exit 1
fi

AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text --region "${AWS_REGION}")
log_success "AWS CLI configurado (Account: ${AWS_ACCOUNT})"

# ==============================================================================
# VERIFICAR NODE E NPM
# ==============================================================================

log_info "Verificando Node.js..."

if ! command -v node &> /dev/null; then
    log_error "Node.js não encontrado. Instale Node.js 20+"
    exit 1
fi

NODE_VERSION=$(node --version)
log_success "Node.js encontrado: ${NODE_VERSION}"

# ==============================================================================
# INSTALAÇÃO DE DEPENDÊNCIAS
# ==============================================================================

log_info "Instalando dependências do projeto..."

cd "${PROJECT_ROOT}"

if [ -f "package-lock.json" ]; then
    npm ci --silent
else
    npm install --silent
fi

log_success "Dependências instaladas"

# ==============================================================================
# BUILD DA APLICAÇÃO
# ==============================================================================

log_info "Executando build da aplicação..."

# Exportar variáveis para o build
export VITE_USE_MOCK
export VITE_API_BASE_URL
export VITE_DATADOG_APPLICATION_ID
export VITE_DATADOG_CLIENT_TOKEN
export VITE_ENVIRONMENT="${ENVIRONMENT}"
export VITE_APP_VERSION=$(git rev-parse --short HEAD 2>/dev/null || echo "local")

npm run build

if [ ! -d "${BUILD_DIR}" ]; then
    log_error "Diretório de build ${BUILD_DIR} não foi criado"
    exit 1
fi

BUILD_SIZE=$(du -sh "${BUILD_DIR}" | cut -f1)
log_success "Build concluído com sucesso (Tamanho: ${BUILD_SIZE})"

# ==============================================================================
# SYNC COM S3
# ==============================================================================

log_info "Sincronizando arquivos com S3..."

# Sync assets com cache longo
log_info "Uploading assets com cache imutável..."
aws s3 sync "${BUILD_DIR}/assets/" "s3://${S3_BUCKET}/assets/" \
    --region "${AWS_REGION}" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --quiet

# Sync arquivos root sem cache
log_info "Uploading arquivos root sem cache..."
aws s3 sync "${BUILD_DIR}/" "s3://${S3_BUCKET}/" \
    --region "${AWS_REGION}" \
    --delete \
    --exclude "assets/*" \
    --cache-control "public, max-age=0, no-cache, no-store, must-revalidate" \
    --quiet

log_success "Arquivos sincronizados com S3"

# ==============================================================================
# INVALIDAÇÃO DO CLOUDFRONT
# ==============================================================================

log_info "Criando invalidação no CloudFront..."

INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "${CF_DISTRIBUTION_ID}" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

log_success "Invalidação criada: ${INVALIDATION_ID}"
log_info "Status da invalidação: https://console.aws.amazon.com/cloudfront/v3/home?#/distributions/${CF_DISTRIBUTION_ID}/invalidations"

# ==============================================================================
# RESUMO DO DEPLOY
# ==============================================================================

echo ""
echo "=============================================="
echo "  DEPLOY CONCLUÍDO COM SUCESSO!"
echo "=============================================="
echo ""
echo "Ambiente: ${ENVIRONMENT}"
echo "Build Version: ${VITE_APP_VERSION}"
echo "S3 Bucket: s3://${S3_BUCKET}"
echo "CloudFront ID: ${CF_DISTRIBUTION_ID}"
echo "Invalidation ID: ${INVALIDATION_ID}"
echo ""
echo "URLs:"
echo "  - S3 Website: http://${S3_BUCKET}.s3-website.${AWS_REGION}.amazonaws.com"
echo "  - CloudFront: Verificar no output do Terraform"
echo ""
echo "Próximos passos:"
echo "  1. Aguardar propagação da invalidação (~5-10 min)"
echo "  2. Testar o site via CloudFront URL"
echo "  3. Verificar Datadog RUM para métricas"
echo ""
log_info "Deploy finalizado em $(date '+%Y-%m-%d %H:%M:%S')"
