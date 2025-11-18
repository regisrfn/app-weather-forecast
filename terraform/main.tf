terraform {
  required_version = ">= 1.13.5"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = "Weather Forecast App"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Provedor adicional para us-east-1 (necessário para certificado CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  
  default_tags {
    tags = {
      Project     = "Weather Forecast App"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
