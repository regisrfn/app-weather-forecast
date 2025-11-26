# ============================================
# AWS Amplify Module Variables
# ============================================

variable "app_name" {
  description = "Nome da aplicação Amplify"
  type        = string
}

variable "repository_url" {
  description = "URL do repositório GitHub"
  type        = string
}

variable "github_token" {
  description = "GitHub Personal Access Token"
  type        = string
  sensitive   = true
}

variable "build_spec_content" {
  description = "Conteúdo do build spec (amplify.yml)"
  type        = string
}

variable "environment_variables" {
  description = "Variáveis de ambiente para a aplicação"
  type        = map(string)
  default     = {}
}

variable "node_version" {
  description = "Versão do Node.js para build"
  type        = string
  default     = "20"
}

variable "branches" {
  description = "Configuração das branches para deploy"
  type = map(object({
    enable_auto_build       = bool
    enable_performance_mode = bool
    environment_variables   = map(string)
  }))
  default = {}
}

variable "enable_spa_routing" {
  description = "Habilitar regras de roteamento para SPA"
  type        = bool
  default     = true
}

variable "custom_rules" {
  description = "Regras customizadas adicionais"
  type = list(object({
    source = string
    status = string
    target = string
  }))
  default = []
}

variable "custom_domain" {
  description = "Configuração de domínio customizado"
  type = object({
    domain_name            = string
    enable_auto_sub_domain = bool
    wait_for_verification  = bool
    sub_domains = list(object({
      branch_name = string
      prefix      = string
    }))
  })
  default = null
}

variable "enable_branch_auto_deletion" {
  description = "Deletar branches automaticamente quando removidas do repositório"
  type        = bool
  default     = false
}

variable "enable_basic_auth" {
  description = "Habilitar autenticação básica"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags para recursos AWS"
  type        = map(string)
  default     = {}
}
