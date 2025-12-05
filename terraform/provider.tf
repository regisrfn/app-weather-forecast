terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Provider principal para recursos em sa-east-1 (São Paulo)
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "weather-forecast-app"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Provider para us-east-1 (obrigatório para ACM com CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "weather-forecast-app"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
