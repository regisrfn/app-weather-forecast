# ==============================================================================
# CLOUDFRONT MODULE
# ==============================================================================

# CloudFront Function para SPA routing
resource "aws_cloudfront_function" "spa_router" {
  name    = "${var.environment}-spa-router"
  runtime = "cloudfront-js-1.0"
  comment = "Rewrite requests for SPA routing - ${var.environment}"
  publish = true
  code    = <<-EOT
    function handler(event) {
      var request = event.request;
      var uri = request.uri;
      
      // Se a URI não contém extensão de arquivo, redirecionar para index.html
      if (!uri.includes('.')) {
        request.uri = '/index.html';
      }
      
      return request;
    }
  EOT
}

# Distribuição CloudFront
resource "aws_cloudfront_distribution" "website" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Weather Forecast App - ${var.environment}"
  default_root_object = "index.html"
  price_class         = var.price_class
  aliases             = var.enable_custom_domain ? [var.domain_name, "www.${var.domain_name}"] : []

  # Origin - S3 Bucket
  origin {
    domain_name = var.s3_website_endpoint
    origin_id   = "S3-${var.s3_bucket_name}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Comportamento padrão (index.html e páginas)
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.s3_bucket_name}"

    forwarded_values {
      query_string = false
      headers      = ["Origin"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.spa_router.arn
    }
  }

  # Comportamento para assets (cache longo)
  ordered_cache_behavior {
    path_pattern     = "/assets/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.s3_bucket_name}"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 31536000
    default_ttl            = 31536000
    max_ttl                = 31536000
    compress               = true
  }

  # Comportamento para data/json (cache médio)
  ordered_cache_behavior {
    path_pattern     = "/data/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.s3_bucket_name}"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 3600
    default_ttl            = 86400
    max_ttl                = 86400
    compress               = true
  }

  # Páginas de erro customizadas para SPA routing
  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  # Restrições geográficas (nenhuma por padrão)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Certificado SSL
  # Usa certificado customizado ACM se enable_custom_domain = true
  # Caso contrário, usa certificado padrão CloudFront
  viewer_certificate {
    cloudfront_default_certificate = !var.enable_custom_domain
    acm_certificate_arn            = var.enable_custom_domain ? var.acm_certificate_arn : null
    ssl_support_method             = var.enable_custom_domain ? "sni-only" : null
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = merge(
    var.tags,
    {
      Name        = "Weather Forecast CloudFront - ${var.environment}"
      Environment = var.environment
    }
  )
}

# Record A (IPv4) - Alias para CloudFront (opcional)
resource "aws_route53_record" "website_a" {
  count   = var.enable_custom_domain ? 1 : 0
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

# Record AAAA (IPv6) - Alias para CloudFront (opcional)
resource "aws_route53_record" "website_aaaa" {
  count   = var.enable_custom_domain ? 1 : 0
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

# Record A para www (opcional)
resource "aws_route53_record" "website_www_a" {
  count   = var.enable_custom_domain ? 1 : 0
  zone_id = var.route53_zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}

# Record AAAA para www (opcional)
resource "aws_route53_record" "website_www_aaaa" {
  count   = var.enable_custom_domain ? 1 : 0
  zone_id = var.route53_zone_id
  name    = "www.${var.domain_name}"
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.website.domain_name
    zone_id                = aws_cloudfront_distribution.website.hosted_zone_id
    evaluate_target_health = false
  }
}
