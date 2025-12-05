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
