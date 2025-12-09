# ==============================================================================
# ROUTE53 MODULE
# ==============================================================================

# Hosted Zone para o domínio
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = merge(
    var.tags,
    {
      Name        = "Weather Forecast DNS Zone - ${var.environment}"
      Environment = var.environment
    }
  )
}

# CAA Record - Autorizar AWS Certificate Manager
resource "aws_route53_record" "caa" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "CAA"
  ttl     = 300

  records = [
    "0 issue \"amazon.com\"",
    "0 issue \"amazontrust.com\"",
    "0 issue \"awstrust.com\"",
    "0 issue \"amazonaws.com\""
  ]
}

# ==============================================================================
# EMAIL CONFIGURATION (ImprovMX)
# ==============================================================================

# MX Records - Email forwarding via ImprovMX
resource "aws_route53_record" "mx" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "MX"
  ttl     = 3600

  records = [
    "10 mx1.improvmx.com",
    "20 mx2.improvmx.com"
  ]
}

# SPF Record - Sender Policy Framework
resource "aws_route53_record" "spf" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = 3600

  records = [
    "v=spf1 include:spf.improvmx.com ~all"
  ]
}

# DMARC Record - Domain-based Message Authentication
resource "aws_route53_record" "dmarc" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "_dmarc.${var.domain_name}"
  type    = "TXT"
  ttl     = 3600

  records = [
    "v=DMARC1; p=none; rua=mailto:contato@${var.domain_name}"
  ]
}
