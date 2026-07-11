resource "aws_cognito_user_pool" "main" {
  name = "peerreview-users"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = var.cognito_domain_prefix
  user_pool_id = aws_cognito_user_pool.main.id
}

resource "aws_cognito_identity_provider" "google" {
  user_pool_id  = aws_cognito_user_pool.main.id
  provider_name = "Google"
  provider_type = "Google"

  provider_details = {
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
    authorize_scopes = "openid email profile"
  }

  attribute_mapping = {
    email    = "email"
    username = "sub"
    name     = "name"
    picture  = "picture"
  }
}

resource "aws_cognito_user_pool_client" "web" {
  name         = "peerreview-web"
  user_pool_id = aws_cognito_user_pool.main.id

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]

  callback_urls = [
    "http://localhost:5180/auth/callback",
    "https://${var.subdomain_prefix}.${var.root_domain}/auth/callback",
    "https://main.${aws_amplify_app.peerreview.default_domain}/auth/callback",
  ]

  logout_urls = [
    "http://localhost:5180",
    "https://${var.subdomain_prefix}.${var.root_domain}",
    "https://main.${aws_amplify_app.peerreview.default_domain}",
  ]

  supported_identity_providers = ["Google"]
  generate_secret              = false

  explicit_auth_flows = [
    "ALLOW_ADMIN_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
  ]

  # LaunchPad lesson: a 1-hour id token logged users out mid-session — 24h
  id_token_validity      = 24
  access_token_validity  = 24
  refresh_token_validity = 30
}
