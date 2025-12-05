variable "enable_custom_domain" {
  description = "Habilitar domínio customizado (aliases e certificado ACM)"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Nome do domínio principal (opcional)"
  type        = string
  default     = ""
}

variable "s3_website_endpoint" {
  description = "Endpoint do website S3"
  type        = string
}

variable "s3_bucket_name" {
  description = "Nome do bucket S3"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ARN do certificado ACM validado (opcional)"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "ID da hosted zone Route53 (opcional)"
  type        = string
  default     = ""
}

variable "price_class" {
  description = "Classe de preço do CloudFront"
  type        = string
  default     = "PriceClass_200"
}

variable "environment" {
  description = "Ambiente de deployment"
  type        = string
}

variable "tags" {
  description = "Tags adicionais para recursos"
  type        = map(string)
  default     = {}
}
