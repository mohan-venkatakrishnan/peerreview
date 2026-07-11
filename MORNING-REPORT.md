# Overnight build report — 2026-07-10/11

## TL;DR
The backend is **built, deployed to your AWS account, and tested end-to-end**.
The full one-for-one loop ran on real infrastructure with three test users:
list product → matcher assigns → submit review (link validated) → owner
verifies with rating → credit earned → trust recomputed → leaderboard ranked
with server-side privacy masking. All test data was cleaned up afterwards.
Code is pushed to github.com/mohan-venkatakrishnan/peerreview.

**UPDATE — everything finished, including hosting.** us-east-1 throttled
Amplify `CreateApp` for 7+ hours (account-level; quota not the issue), so the
Amplify app was created in **us-west-2** instead — hosting region is
irrelevant (CDN-served), and all data/auth stays us-east-1.

**The site is LIVE (real mode, not mock): https://main.d1p9of17tenl4g.amplifyapp.com**
Verified in a browser: landing renders, /app redirects to /signin, and
"Continue with Google" walks Cognito → Google correctly.

**Your ONE remaining task — GoDaddy DNS (2 min):**
```
Type: CNAME   Name: peerreview   Value: d2h2ab92s9yzvv.cloudfront.net
```
Amplify then verifies the domain and issues the certificate automatically
(status is PENDING_VERIFICATION until the record exists). After that,
https://peerreview.tapdot.org is live — its callback URL is already
registered in Cognito.

## What exists in AWS now (all `peerreview-*`, LaunchPad untouched)
- Cognito user pool + Google sign-in (hosted UI `peerreview-auth.auth.us-east-1.amazoncognito.com`)
  — verified: it redirects to Google with your OAuth client. 24h tokens.
- API Gateway `https://t3ym6tu8gl.execute-api.us-east-1.amazonaws.com/prod`
  with Cognito authorizer + the CORS-on-401 fixes from LaunchPad.
- 8 Lambdas: me, products, assignment, incoming, member, leaderboard, matcher
  (hourly EventBridge + fired on verify), webhook-payment (dormant, needs LemonSqueezy).
- DynamoDB: users (email GSI), products (pool GSI), assignments (3 GSIs).
- Budget: $5/month cap alerts to rkmohanchn@gmail.com at 70%/100% (peerreview-tagged spend).

## Frontend
- `VITE_USE_MOCK=true` (current .env): app runs exactly as before on mock data.
- `VITE_USE_MOCK=false`: real Google sign-in → /auth/callback → live API.
  All pages consume one unified data layer (src/state.jsx); api.js adapts
  backend shapes to the existing UI. Mock mode regression-tested in browser.
- New-product listing seeds ONE pool slot (bootstrap — solves the cold-start
  deadlock; documented in products lambda). Every later review costs a credit.

## Morning checklist (15 min)
1. **DNS (after Amplify exists)**: `terraform output godaddy_cname_target`
   → GoDaddy CNAME `peerreview` → `main.<that domain>`.
2. **Try real sign-in locally**: set `VITE_USE_MOCK=false` in .env, restart
   dev-server.bat, open http://localhost:5180 → Continue with Google.
3. Optional CI deploys: add the secrets listed in .github/workflows/deploy.yml
   to the repo, then enable the push trigger.
4. Optional payments: create LemonSqueezy Pro/Studio products, register the
   webhook at `<api_url>/webhook/payment`, put the secret in terraform.tfvars,
   re-apply.

## Known gaps / decisions I left open
- **Amplify + custom domain**: blocked on the CreateApp throttle (see TL;DR).
  Once created: re-add the Amplify callback URL in terraform/cognito.tf
  (marked TODO), apply, and run the deploy workflow or `aws amplify create-deployment`.
- **Avatars**: stay browser-local (not synced to S3) — masked-by-default makes
  this low-priority; S3 + presigned URLs is a later step.
- **Leaderboard** computes via table scan (fine to ~2k users), not the S3
  snapshot from ARCHITECTURE.md — swap when scale demands.
- **Owner identity pre-review** shows as "a fellow developer" (owner name is
  not exposed to the reviewer until after verification — anti-collusion).
- **Streaks/badge automation**: badges array exists (everyone gets `seal`
  Founding Member); earn logic for the other five isn't automated yet.
- The GitHub PAT is embedded in the local git remote URL (.git/config) for
  pushes from this machine — rotate it if the machine is ever shared.

## Costs
Everything pay-per-request; overnight testing cost ≈ $0. Budget alarm at $5.
