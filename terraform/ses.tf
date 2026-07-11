# Transactional email via SES. Sends from noreply@<root_domain> once (1) the
# DKIM records below are added to GoDaddy and (2) the account is out of the SES
# sandbox (aws support case). Until then, lambdas keep NOTIFY_ENABLED=false and
# simply skip sending — the core flow never depends on email.

resource "aws_ses_domain_identity" "main" {
  domain = var.root_domain
}

resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

# Custom MAIL FROM improves deliverability (SPF alignment)
resource "aws_ses_domain_mail_from" "main" {
  domain           = aws_ses_domain_identity.main.domain
  mail_from_domain = "mail.${var.root_domain}"
}

data "aws_iam_policy_document" "lambda_ses" {
  statement {
    actions   = ["ses:SendEmail", "ses:SendRawEmail"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "lambda_ses" {
  name   = "peerreview-lambda-ses"
  role   = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_ses.json
}

output "ses_dkim_records" {
  description = "Add these 3 CNAMEs to GoDaddy to verify SES DKIM"
  value       = [for t in aws_ses_domain_dkim.main.dkim_tokens : "${t}._domainkey  CNAME  ${t}.dkim.amazonses.com"]
}

output "ses_mail_from_records" {
  description = "Add to GoDaddy for the custom MAIL FROM (SPF + MX)"
  value = [
    "mail  MX  10 feedback-smtp.${var.aws_region}.amazonses.com",
    "mail  TXT  \"v=spf1 include:amazonses.com ~all\"",
  ]
}
