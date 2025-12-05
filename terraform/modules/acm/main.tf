# ==============================================================================
# ACM CERTIFICATE MODULE (US-EAST-1 para CloudFront)
# ==============================================================================

# Certificado SSL/TLS para o domínio
resource "aws_acm_certificate" "website" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "www.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(
    var.tags,
    {
      Name        = "Weather Forecast SSL Certificate - ${var.environment}"
      Environment = var.environment
    }
  )
}

# Validação automática do certificado via Route53
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.website.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.route53_zone_id
}

# Aguardar validação do certificado
# DESABILITADO TEMPORARIAMENTE: O certificado só será validado após migrar DNS para Route53
# Descomente este recurso após migrar os nameservers no painel Vercel
#
# resource "aws_acm_certificate_validation" "website" {
#   certificate_arn         = aws_acm_certificate.website.arn
#   validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]

#   timeouts {
#     create = "45m"  # Aumentado para aguardar propagação DNS
#   }

#   lifecycle {
#     create_before_destroy = true
#   }
# }
