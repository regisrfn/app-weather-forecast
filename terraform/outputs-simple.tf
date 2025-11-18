# Outputs para S3 (sem CloudFront)
output "s3_bucket_name" {
  description = "Nome do bucket S3"
  value       = aws_s3_bucket.website_simple.id
}

output "s3_website_endpoint" {
  description = "URL do website no S3"
  value       = aws_s3_bucket_website_configuration.website_simple.website_endpoint
}

output "website_url" {
  description = "URL completa do website"
  value       = "http://${aws_s3_bucket_website_configuration.website_simple.website_endpoint}"
}

output "deploy_command" {
  description = "Comando para fazer deploy"
  value       = "aws s3 sync ../dist/ s3://${aws_s3_bucket.website_simple.id}/ --delete --cache-control 'public, max-age=3600'"
}
