output "distribution_id" {
  description = "ID da distribuição CloudFront"
  value       = aws_cloudfront_distribution.website.id
}

output "distribution_arn" {
  description = "ARN da distribuição CloudFront"
  value       = aws_cloudfront_distribution.website.arn
}

output "distribution_domain_name" {
  description = "Domain name da distribuição CloudFront"
  value       = aws_cloudfront_distribution.website.domain_name
}

output "distribution_hosted_zone_id" {
  description = "Hosted zone ID da distribuição CloudFront"
  value       = aws_cloudfront_distribution.website.hosted_zone_id
}
