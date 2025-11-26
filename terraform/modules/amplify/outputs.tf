# ============================================
# AWS Amplify Module Outputs
# ============================================

output "app_id" {
  description = "ID da aplicação Amplify"
  value       = aws_amplify_app.app.id
}

output "app_arn" {
  description = "ARN da aplicação Amplify"
  value       = aws_amplify_app.app.arn
}

output "default_domain" {
  description = "Domínio padrão do Amplify"
  value       = aws_amplify_app.app.default_domain
}

output "branches" {
  description = "Informações das branches configuradas"
  value = {
    for branch_name, branch in aws_amplify_branch.branch : branch_name => {
      branch_name = branch.branch_name
      branch_arn  = branch.arn
      url         = "https://${branch.branch_name}.${aws_amplify_app.app.default_domain}"
    }
  }
}

output "custom_domain_url" {
  description = "URL do domínio customizado"
  value       = var.custom_domain != null ? "https://${var.custom_domain.domain_name}" : null
}

output "console_url" {
  description = "URL do console AWS Amplify"
  value       = "https://console.aws.amazon.com/amplify/home#/${aws_amplify_app.app.id}"
}
