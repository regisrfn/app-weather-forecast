terraform {
  required_version = ">= 1.13.5"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
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

# ============================================
# AWS Amplify Hosting
# ============================================

module "amplify" {
  source = "./modules/amplify"

  app_name       = "${var.project_name}-${var.environment}"
  repository_url = var.repository_url
  github_token   = var.github_token

  build_spec_content = file("${path.module}/../amplify.yml")

  environment_variables = {
    VITE_USE_MOCK     = var.vite_use_mock
    VITE_API_BASE_URL = var.vite_api_base_url
  }

  node_version = "20"

  branches = {
    (var.branch_name) = {
      enable_auto_build       = var.enable_auto_build
      enable_performance_mode = false
      environment_variables   = {}
    }
  }

  enable_spa_routing = true

  custom_domain = var.enable_custom_domain ? {
    domain_name            = var.domain_name
    enable_auto_sub_domain = false
    wait_for_verification  = true
    sub_domains = [
      {
        branch_name = var.branch_name
        prefix      = ""
      },
      {
        branch_name = var.branch_name
        prefix      = "www"
      }
    ]
  } : null

  enable_branch_auto_deletion = false
  enable_basic_auth           = false

  tags = {
    Name        = "Weather Forecast Amplify App"
    Project     = "Weather Forecast App"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
