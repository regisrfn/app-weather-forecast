variable "aws_region" {
  description = "Região AWS principal (sa-east-1 para São Paulo)"
  type        = string
  default     = "sa-east-1"
}

variable "environment" {
  description = "Ambiente de deployment (production, staging)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging"], var.environment)
    error_message = "Environment deve ser 'production' ou 'staging'."
  }
}

variable "enable_custom_domain" {
  description = "Habilitar domínio customizado (Route53 + ACM + CloudFront aliases). Se false, usa apenas CloudFront default"
  type        = bool
  default     = true
}

variable "domain_name" {
  description = "Nome do domínio principal (obrigatório se enable_custom_domain = true)"
  type        = string
  default     = "vemchuvabrasil.com"
}

variable "bucket_name" {
  description = "Nome do bucket S3 (será gerado automaticamente se não especificado)"
  type        = string
  default     = ""
}

variable "cloudfront_price_class" {
  description = "Classe de preço do CloudFront (PriceClass_All, PriceClass_200, PriceClass_100)"
  type        = string
  default     = "PriceClass_200"

  validation {
    condition     = contains(["PriceClass_All", "PriceClass_200", "PriceClass_100"], var.cloudfront_price_class)
    error_message = "CloudFront price class deve ser PriceClass_All, PriceClass_200, ou PriceClass_100."
  }
}

variable "enable_versioning" {
  description = "Habilitar versionamento no bucket S3"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags adicionais para recursos AWS"
  type        = map(string)
  default     = {}
}
