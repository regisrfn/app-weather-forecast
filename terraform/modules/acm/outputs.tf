output "certificate_arn" {
  description = "ARN do certificado ACM"
  value       = aws_acm_certificate.website.arn
}

output "certificate_domain_name" {
  description = "Domain name do certificado"
  value       = aws_acm_certificate.website.domain_name
}

output "certificate_status" {
  description = "Status da validação do certificado"
  value       = aws_acm_certificate.website.status
}

output "validated_certificate_arn" {
  description = "ARN do certificado validado"
  value       = aws_acm_certificate.website.arn  # Usando ARN direto, pois validação está desabilitada
}
