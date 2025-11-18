variable "aws_region" {
  description = "Região AWS para deploy"
  type        = string
  default     = "us-east-1"  # Virginia, USA
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
