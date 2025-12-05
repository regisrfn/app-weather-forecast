output "s3_bucket_name" {
  description = "Nome do bucket S3 criado"
  value       = module.s3.bucket_id
}

output "s3_bucket_website_endpoint" {
  description = "Endpoint do website S3"
  value       = module.s3.website_endpoint
}

output "cloudfront_distribution_id" {
  description = "ID da distribuição CloudFront"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_domain_name" {
  description = "Domain name da distribuição CloudFront (URL temporária para testes)"
  value       = module.cloudfront.distribution_domain_name
}

output "cloudfront_url" {
  description = "URL completa do CloudFront para testes"
  value       = "https://${module.cloudfront.distribution_domain_name}"
}

output "website_url" {
  description = "URL final do website"
  value       = var.enable_custom_domain ? "https://${var.domain_name}" : "https://${module.cloudfront.distribution_domain_name}"
}

output "route53_zone_id" {
  description = "ID da hosted zone no Route53 (somente se enable_custom_domain = true)"
  value       = var.enable_custom_domain ? module.route53[0].zone_id : null
}

output "route53_nameservers" {
  description = "Nameservers do Route53 (somente se enable_custom_domain = true)"
  value       = var.enable_custom_domain ? module.route53[0].name_servers : null
}

output "acm_certificate_arn" {
  description = "ARN do certificado ACM (somente se enable_custom_domain = true)"
  value       = var.enable_custom_domain ? module.acm[0].certificate_arn : null
}

output "acm_certificate_status" {
  description = "Status da validação do certificado ACM (somente se enable_custom_domain = true)"
  value       = var.enable_custom_domain ? module.acm[0].certificate_status : null
}

locals {
  deployment_instructions_custom = <<-EOT
    
    ========================================
    MODO: DOMÍNIO CUSTOMIZADO HABILITADO
    ========================================
    
    1. TESTAR VIA CLOUDFRONT (antes de mudar DNS):
       ${module.cloudfront.distribution_domain_name}
       
       IMPORTANTE: O certificado SSL customizado só funcionará após migrar DNS.
       Por enquanto, use a URL acima para testar.
    
    2. FAZER DEPLOY DE TESTE:
       Executar: ./deploy.sh ${var.environment}
       Acessar: https://${module.cloudfront.distribution_domain_name}
    
    3. SE TUDO FUNCIONAR, ATUALIZAR NAMESERVERS:
       Acesse seu registrador de domínio (Vercel/GoDaddy/AWS Route53/etc)
       
       Atualize para estes nameservers Route53:
       ${var.enable_custom_domain ? join("\n       ", module.route53[0].name_servers) : "N/A"}
    
    4. AGUARDAR PROPAGAÇÃO DNS:
       Verificar com: dig NS ${var.domain_name}
       Tempo estimado: 2-24 horas
       
       Durante a propagação:
       - Transição gradual entre DNS antigo e novo
       - Certificado SSL será validado automaticamente
    
    5. APÓS PROPAGAÇÃO:
       - Site funcionando com HTTPS: https://${var.domain_name}
       - Domínio www também funciona: https://www.${var.domain_name}
    
    ========================================
    INFORMAÇÕES PARA DEPLOY
    ========================================
    
    Bucket S3: ${module.s3.bucket_id}
    CloudFront Distribution ID: ${module.cloudfront.distribution_id}
    CloudFront URL (teste): https://${module.cloudfront.distribution_domain_name}
    Domínio Final: https://${var.domain_name}
    Região: ${var.aws_region}
    
  EOT

  deployment_instructions_default = <<-EOT
    
    ========================================
    MODO: SOMENTE CLOUDFRONT (SEM DOMÍNIO CUSTOMIZADO)
    ========================================
    
    ✅ Infraestrutura pronta para uso!
    
    1. FAZER DEPLOY:
       Executar: ./deploy.sh ${var.environment}
    
    2. ACESSAR SITE:
       URL: https://${module.cloudfront.distribution_domain_name}
    
    ========================================
    COMO ADICIONAR DOMÍNIO CUSTOMIZADO DEPOIS
    ========================================
    
    1. Comprar domínio (AWS Route53, GoDaddy, Vercel, etc)
    
    2. Editar terraform/terraform.tfvars:
       enable_custom_domain = true
       domain_name = "seudominio.com"
    
    3. Aplicar mudanças:
       terraform apply
    
    4. Atualizar nameservers no registrador com os valores fornecidos
    
    5. Aguardar propagação DNS (2-24h)
    
    ========================================
    INFORMAÇÕES PARA DEPLOY
    ========================================
    
    Bucket S3: ${module.s3.bucket_id}
    CloudFront Distribution ID: ${module.cloudfront.distribution_id}
    CloudFront URL: https://${module.cloudfront.distribution_domain_name}
    Região: ${var.aws_region}
    
    💡 Esta URL CloudFront é permanente e funciona sem domínio customizado!
    
  EOT
}

output "deployment_instructions" {
  description = "Próximos passos para completar a migração"
  value       = var.enable_custom_domain ? local.deployment_instructions_custom : local.deployment_instructions_default
}
