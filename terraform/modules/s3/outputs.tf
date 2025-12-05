output "bucket_id" {
  description = "ID do bucket S3"
  value       = aws_s3_bucket.website.id
}

output "bucket_arn" {
  description = "ARN do bucket S3"
  value       = aws_s3_bucket.website.arn
}

output "bucket_domain_name" {
  description = "Domain name do bucket S3"
  value       = aws_s3_bucket.website.bucket_domain_name
}

output "website_endpoint" {
  description = "Endpoint do website S3"
  value       = aws_s3_bucket_website_configuration.website.website_endpoint
}

output "website_domain" {
  description = "Domain do website S3"
  value       = aws_s3_bucket_website_configuration.website.website_domain
}
