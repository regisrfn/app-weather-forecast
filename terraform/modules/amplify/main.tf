# ============================================
# AWS Amplify Hosting Module
# ============================================

# IAM Role para Amplify
resource "aws_iam_role" "amplify" {
  name = "${var.app_name}-amplify-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "amplify.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.tags
}

# Attach AWS managed policy para Amplify
resource "aws_iam_role_policy_attachment" "amplify_backend_deploy" {
  role       = aws_iam_role.amplify.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess-Amplify"
}

# Amplify App
resource "aws_amplify_app" "app" {
  name       = var.app_name
  repository = var.repository_url

  # GitHub OAuth token
  access_token = var.github_token

  # IAM Role
  iam_service_role_arn = aws_iam_role.amplify.arn

  # Build settings
  build_spec = var.build_spec_content

  # Environment variables
  environment_variables = merge(
    var.environment_variables,
    {
      _LIVE_UPDATES = jsonencode([{
        pkg     = "node"
        type    = "nvm"
        version = var.node_version
      }])
    }
  )

  # SPA routing rules
  dynamic "custom_rule" {
    for_each = var.enable_spa_routing ? [1] : []
    content {
      source = "/<*>"
      status = "404"
      target = "/index.html"
    }
  }

  dynamic "custom_rule" {
    for_each = var.enable_spa_routing ? [1] : []
    content {
      source = "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>"
      status = "200"
      target = "/index.html"
    }
  }

  # Additional custom rules
  dynamic "custom_rule" {
    for_each = var.custom_rules
    content {
      source = custom_rule.value.source
      status = custom_rule.value.status
      target = custom_rule.value.target
    }
  }

  enable_branch_auto_deletion = var.enable_branch_auto_deletion
  enable_basic_auth           = var.enable_basic_auth

  tags = var.tags
}

# Branch configuration
resource "aws_amplify_branch" "branch" {
  for_each = var.branches

  app_id      = aws_amplify_app.app.id
  branch_name = each.key

  enable_auto_build       = each.value.enable_auto_build
  enable_performance_mode = each.value.enable_performance_mode

  environment_variables = each.value.environment_variables

  tags = merge(
    var.tags,
    {
      Branch = each.key
    }
  )
}

# Custom domain (optional)
resource "aws_amplify_domain_association" "domain" {
  count = var.custom_domain != null ? 1 : 0

  app_id      = aws_amplify_app.app.id
  domain_name = var.custom_domain.domain_name

  enable_auto_sub_domain = var.custom_domain.enable_auto_sub_domain

  # Subdomains
  dynamic "sub_domain" {
    for_each = var.custom_domain.sub_domains
    content {
      branch_name = sub_domain.value.branch_name
      prefix      = sub_domain.value.prefix
    }
  }

  wait_for_verification = var.custom_domain.wait_for_verification
}
