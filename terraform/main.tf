# ==============================================================================
# MAIN TERRAFORM CONFIGURATION - MODULAR
# ==============================================================================

locals {
  bucket_name = var.bucket_name != "" ? var.bucket_name : "${var.environment}-weather-forecast-${var.aws_region}"
}

# ==============================================================================
# ROUTE53 MODULE (OPCIONAL)
# ==============================================================================
# Só cria Route53 Hosted Zone se enable_custom_domain = true

module "route53" {
  count  = var.enable_custom_domain ? 1 : 0
  source = "./modules/route53"

  domain_name = var.domain_name
  environment = var.environment
  tags        = var.tags
}

# ==============================================================================
# ACM MODULE (US-EAST-1) (OPCIONAL)
# ==============================================================================
# Só cria certificado SSL se enable_custom_domain = true

module "acm" {
  count  = var.enable_custom_domain ? 1 : 0
  source = "./modules/acm"

  providers = {
    aws = aws.us_east_1
  }

  domain_name      = var.domain_name
  route53_zone_id  = module.route53[0].zone_id
  environment      = var.environment
  tags             = var.tags
}

# ==============================================================================
# S3 MODULE
# ==============================================================================

module "s3" {
  source = "./modules/s3"

  bucket_name        = local.bucket_name
  enable_versioning  = var.enable_versioning
  environment        = var.environment
  tags               = var.tags
}

# ==============================================================================
# CLOUDFRONT MODULE
# ==============================================================================

module "cloudfront" {
  source = "./modules/cloudfront"

  enable_custom_domain  = var.enable_custom_domain
  domain_name           = var.enable_custom_domain ? var.domain_name : ""
  s3_website_endpoint   = module.s3.website_endpoint
  s3_bucket_name        = module.s3.bucket_id
  acm_certificate_arn   = var.enable_custom_domain ? module.acm[0].validated_certificate_arn : ""
  route53_zone_id       = var.enable_custom_domain ? module.route53[0].zone_id : ""
  price_class           = var.cloudfront_price_class
  environment           = var.environment
  tags                  = var.tags

  depends_on = [
    module.s3
  ]
}

