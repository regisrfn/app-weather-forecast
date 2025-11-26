variable "aws_region" {
  description = "Região AWS para deploy"
  type        = string
  default     = "sa-east-1"  # São Paulo, Brasil
}

variable "environment" {
  description = "Ambiente (dev, staging, production)"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Nome do projeto"
  type        = string
  default     = "weather-forecast"
}

variable "domain_name" {
  description = "Nome do domínio customizado (opcional)"
  type        = string
  default     = ""
}

variable "enable_custom_domain" {
  description = "Habilitar domínio customizado com certificado SSL"
  type        = bool
  default     = false
}

variable "price_class" {
  description = "CloudFront price class (PriceClass_All, PriceClass_200, PriceClass_100)"
  type        = string
  default     = "PriceClass_100"
}

variable "enable_ipv6" {
  description = "Habilitar IPv6 no CloudFront"
  type        = bool
  default     = true
}

variable "min_ttl" {
  description = "Tempo mínimo de cache (segundos)"
  type        = number
  default     = 0
}

variable "default_ttl" {
  description = "Tempo padrão de cache (segundos)"
  type        = number
  default     = 3600
}

variable "max_ttl" {
  description = "Tempo máximo de cache (segundos)"
  type        = number
  default     = 86400
}

# ============================================
# AWS Amplify Variables
# ============================================

variable "repository_url" {
  description = "URL do repositório GitHub (ex: https://github.com/user/repo)"
  type        = string
  default     = "https://github.com/regisrfn/app-weather-forecast"
}

variable "github_token" {
  description = "GitHub Personal Access Token para Amplify (permissões: repo, admin:repo_hook)"
  type        = string
  sensitive   = true
}

variable "branch_name" {
  description = "Nome da branch principal para deploy"
  type        = string
  default     = "main"
}

variable "enable_auto_build" {
  description = "Habilitar build automático ao fazer push na branch"
  type        = bool
  default     = true
}

variable "vite_use_mock" {
  description = "Usar dados mock no frontend (VITE_USE_MOCK)"
  type        = string
  default     = "true"
}

variable "vite_api_base_url" {
  description = "URL base da API backend (VITE_API_BASE_URL)"
  type        = string
  default     = ""
}
