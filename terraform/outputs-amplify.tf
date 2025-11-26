# ============================================
# AWS Amplify Outputs
# ============================================

output "amplify_app_id" {
  description = "ID da aplicação Amplify"
  value       = module.amplify.app_id
}

output "amplify_app_arn" {
  description = "ARN da aplicação Amplify"
  value       = module.amplify.app_arn
}

output "amplify_default_domain" {
  description = "Domínio padrão do Amplify (HTTPS automático)"
  value       = module.amplify.default_domain
}

output "amplify_branch_url" {
  description = "URL completa da branch principal com HTTPS"
  value       = lookup(module.amplify.branches, var.branch_name, null) != null ? lookup(module.amplify.branches, var.branch_name).url : "N/A"
}

output "amplify_console_url" {
  description = "URL do console Amplify para gerenciar a aplicação"
  value       = module.amplify.console_url
}

output "amplify_custom_domain_url" {
  description = "URL do domínio customizado (se habilitado)"
  value       = var.enable_custom_domain ? "https://${var.domain_name}" : "N/A - Domínio customizado não habilitado"
}

output "deploy_instructions" {
  description = "Instruções para deploy automático"
  value       = <<-EOT
    ═══════════════════════════════════════════════
    ✅ AWS Amplify Configurado com Sucesso!
    ═══════════════════════════════════════════════
    
    🚀 Deploy Automático via Git:
       git push origin ${var.branch_name}
    
    🌐 URL da Aplicação:
       https://${var.branch_name}.${module.amplify.default_domain}
    
    🎛️  Console AWS Amplify:
       ${module.amplify.console_url}
    
    📝 Próximos Passos:
       1. Faça commit e push das alterações
       2. Aguarde ~5 minutos para primeiro build
       3. Acesse a URL gerada (HTTPS automático)
    
    ═══════════════════════════════════════════════
  EOT
}
