# Same pattern as LaunchPad: no git connection on purpose. Amplify's GitHub
# integration needs a token with Webhooks permission; the fine-grained PAT
# only grants repo contents. CI (.github/workflows/deploy.yml) builds the app
# and pushes the built dist/ via manual deployment instead.
resource "aws_amplify_app" "peerreview" {
  provider = aws.uswest2
  name     = "peerreview"

  custom_rule {
    source = "/<*>"
    status = "404-200"
    target = "/index.html"
  }
}

resource "aws_amplify_branch" "main" {
  provider    = aws.uswest2
  app_id      = aws_amplify_app.peerreview.id
  branch_name = "main"
  framework   = "React"

  # deploy.yml drives every release — nothing to auto-build from
  enable_auto_build = false
}

# DNS validation (GoDaddy CNAME) is a manual morning step — don't block apply
resource "aws_amplify_domain_association" "peerreview" {
  provider              = aws.uswest2
  app_id                = aws_amplify_app.peerreview.id
  domain_name           = var.root_domain
  wait_for_verification = false

  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = var.subdomain_prefix
  }
}
