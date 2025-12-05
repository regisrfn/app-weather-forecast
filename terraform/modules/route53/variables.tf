variable "domain_name" {
  description = "Nome do domínio principal"
  type        = string
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
