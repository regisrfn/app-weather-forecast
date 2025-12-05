variable "bucket_name" {
  description = "Nome do bucket S3"
  type        = string
}

variable "enable_versioning" {
  description = "Habilitar versionamento no bucket S3"
  type        = bool
  default     = true
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
