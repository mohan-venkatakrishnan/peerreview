output "cognito_user_pool_id" { value = aws_cognito_user_pool.main.id }
output "cognito_client_id" { value = aws_cognito_user_pool_client.web.id }
output "cognito_domain" { value = "${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com" }
output "api_url" { value = aws_api_gateway_stage.prod.invoke_url }
output "aws_region" { value = var.aws_region }
output "amplify_app_id" { value = aws_amplify_app.peerreview.id }
output "amplify_default_domain" { value = aws_amplify_app.peerreview.default_domain }
output "amplify_url" { value = "https://main.${aws_amplify_app.peerreview.default_domain}" }

output "godaddy_cname_target" {
  value       = aws_amplify_app.peerreview.default_domain
  description = "Add a CNAME: peerreview -> main.<this value> in GoDaddy DNS"
}

output "google_cloud_redirect_uri" {
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com/oauth2/idpresponse"
  description = "Must be registered as a redirect URI in the Google Cloud OAuth client"
}
