# PeerReview — one-time setup checklist

Everything the project needs from your accounts. Do these in order; each takes a few minutes.

## 1. GitHub repo + Pages

```bash
cd C:\Users\Administrator\Desktop\peerreview
git init
git add .
git commit -m "PeerReview frontend"
gh repo create peerreview --public --source . --push   # or create on github.com and push
```

Then on github.com → repo → **Settings → Pages → Source: "GitHub Actions"**.
The deploy workflow is already in the repo (`.github/workflows/deploy.yml`) — it builds,
adds the SPA 404 fallback, and writes the `peerreview.tapdot.org` CNAME file on every
push to `main`.

## 2. GoDaddy DNS (same pattern as tools.tapdot.org)

GoDaddy → tapdot.org → DNS → **Add record**:

| Type  | Name         | Value                       |
|-------|--------------|------------------------------|
| CNAME | `peerreview` | `<your-github-username>.github.io` |

Then repo → Settings → Pages → **Custom domain**: `peerreview.tapdot.org` → save,
and tick **Enforce HTTPS** once the certificate is issued (can take ~15 min).

## 3. AWS backend (LaunchPad stack — see ARCHITECTURE.md, approve it first)

Reuses your existing AWS account (same one as LaunchPad; resources are namespaced
`peerreview-*`). Needed in `.env` for Terraform: `AWS_ACCESS_KEY_ID`,
`AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_ACCOUNT_ID` — same values LaunchPad uses.

Google OAuth: Google Cloud Console → APIs & Services → Credentials → new OAuth
client (or reuse LaunchPad's pattern). Authorized origins:
`https://peerreview.tapdot.org` + the Cognito hosted-UI domain Terraform will output.
Put client id/secret in `.env` (`GOOGLE_CLIENT_ID/SECRET`) — Terraform feeds them
to Cognito; they never ship to the browser.

Note: if hosting moves to Amplify per ARCHITECTURE.md, the GoDaddy CNAME in step 2
points at the Amplify domain instead of github.io — decide after reading the doc.

## 4. .env

```bash
copy .env.example .env
```

Fill in the AWS + Google values (LaunchPad's `.env` has the same shape — copy the
AWS block from there). Keep `VITE_USE_MOCK=true` until the backend is built — the
app runs fully on mock data without it. The `VITE_COGNITO_*` / `VITE_API_URL`
values come out of `terraform apply` later. `.env` is gitignored.

## 5. Hand back to Claude

Tell Claude: the repo URL, that DNS is set, and paste nothing secret into chat —
just confirm the `.env` is filled. Run `! gh auth status` in the prompt so Claude
can push/deploy directly.
