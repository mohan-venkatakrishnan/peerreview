# Activating email notifications

Everything is built and deployed — the three lifecycle Lambdas (matcher,
assignment, incoming) send transactional emails, but sending is **off** until
the two steps below are done. `NOTIFY_ENABLED=false` means they silently skip,
so nothing breaks in the meantime.

Emails sent (plain text, from `noreply@tapdot.org`):
- **You're assigned a review** → the reviewer, when the matcher assigns them.
- **Your product received a review** → the owner, when a review is submitted.
- **Your review was verified** → the reviewer, when the owner verifies.

## Step 1 — Verify the domain (GoDaddy DNS, ~15 min to propagate)

Add these to tapdot.org DNS (name shown is the host — GoDaddy appends the domain):

**DKIM (3 CNAMEs):**
```
s5azebxhccr5gmptqf4j3c2ohi6vcfxp._domainkey  CNAME  s5azebxhccr5gmptqf4j3c2ohi6vcfxp.dkim.amazonses.com
lzyyu6tywmutogidsvgph6yvlgxg5z2k._domainkey  CNAME  lzyyu6tywmutogidsvgph6yvlgxg5z2k.dkim.amazonses.com
4uufzbab6hzge5ksyembeh6f6wq3wfng._domainkey  CNAME  4uufzbab6hzge5ksyembeh6f6wq3wfng.dkim.amazonses.com
```
(Regenerate any time with `cd terraform && terraform output ses_dkim_records`.)

**MAIL FROM (better deliverability):**
```
mail  MX   10 feedback-smtp.us-east-1.amazonses.com
mail  TXT  "v=spf1 include:amazonses.com ~all"
```

SES auto-verifies once the records resolve. Check:
`aws ses get-identity-verification-attributes --identities tapdot.org`

## Step 2 — Leave the SES sandbox (AWS, ~24h approval)

New SES accounts are sandboxed: they can only email **verified** addresses.
To email any signed-up user, request production access:
AWS Console → SES → Account dashboard → **Request production access**
(use case: transactional notifications for a review-exchange web app; low volume).

To test *before* production access, verify a recipient address:
`aws ses verify-email-identity --email-address you@example.com` (click the link),
then it can receive.

## Step 3 — Flip the switch

Once the domain is verified and you have production access:
```
cd terraform
terraform apply -var="notify_enabled=true"
```
That sets `NOTIFY_ENABLED=true` on the three Lambdas and they start sending.
(Or add `notify_enabled = "true"` to terraform.tfvars so it sticks.)

## Turning it back off
`terraform apply -var="notify_enabled=false"` — instant, no code change.
