variable "alert_email" { type = string }

variable "google_client_id" { type = string }
variable "google_client_secret" {
  type      = string
  sensitive = true
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "aws_account_id" { type = string }

variable "lemonsqueezy_webhook_secret" {
  type      = string
  sensitive = true
  default   = "" # payments dormant until LemonSqueezy is set up
}

variable "cognito_domain_prefix" {
  type        = string
  description = "Must be globally unique across all Cognito domains"
  default     = "peerreview-auth"
}

variable "root_domain" {
  type    = string
  default = "tapdot.org"
}

variable "subdomain_prefix" {
  type    = string
  default = "peerreview"
}

variable "notify_enabled" {
  type        = string
  default     = "false" # flip to "true" after SES DKIM verified + production access
  description = "Whether lambdas send transactional emails via SES"
}
