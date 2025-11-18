# S3 Bucket para hospedagem do site estático (SEM CloudFront)
resource "aws_s3_bucket" "website_simple" {
  bucket = "${var.project_name}-${var.environment}-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "Weather Forecast Website"
  }
}

# Sufixo aleatório para nome único do bucket
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Configuração de website estático
resource "aws_s3_bucket_website_configuration" "website_simple" {
  bucket = aws_s3_bucket.website_simple.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Permitir acesso público para leitura
resource "aws_s3_bucket_public_access_block" "website_simple" {
  bucket = aws_s3_bucket.website_simple.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Versionamento do bucket
resource "aws_s3_bucket_versioning" "website_simple" {
  bucket = aws_s3_bucket.website_simple.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Criptografia do bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "website_simple" {
  bucket = aws_s3_bucket.website_simple.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Policy do S3 para permitir acesso público
resource "aws_s3_bucket_policy" "website_simple" {
  depends_on = [aws_s3_bucket_public_access_block.website_simple]
  bucket     = aws_s3_bucket.website_simple.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website_simple.arn}/*"
      }
    ]
  })
}
