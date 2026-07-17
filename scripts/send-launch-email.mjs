/* One-off launch broadcast to PeerReview's registered users via Amazon SES.
   Requires: SES out of the sandbox (production access) AND tapdot.org verified (DKIM).
   Dry run by default — prints recipients and sends nothing.

     node scripts/send-launch-email.mjs "https://www.producthunt.com/posts/peerreview"          # dry run
     node scripts/send-launch-email.mjs "https://www.producthunt.com/posts/peerreview" --send    # actually send

   Credentials come from the environment (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_DEFAULT_REGION=us-east-1).
*/
import { execSync } from "node:child_process";

const PH_URL = process.argv[2];
const SEND = process.argv.includes("--send");
if (!PH_URL || !/^https?:\/\//.test(PH_URL)) {
  console.error('Usage: node scripts/send-launch-email.mjs "<product-hunt-url>" [--send]');
  process.exit(1);
}

const FROM = "PeerReview <noreply@tapdot.org>";
const REPLY_TO = "ceo@tapdot.org";
const TEST = new Set(["rkmohanchn@gmail.com", "rkmohanchnbackup1@gmail.com", "rkmohan333@gmail.com"]);
const ENV = { ...process.env, PYTHONIOENCODING: "utf-8" };
const aws = (c) => execSync(`aws ${c}`, { env: ENV, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });

const SUBJECT = "We're live on Product Hunt today 🚀 (you helped make this happen)";
const textBody = (url) => `Hi — you're one of the first developers on PeerReview, and today we launched on Product Hunt.

You already did the important part: gave and got genuine reviews with other builders. If PeerReview has been useful to you, an honest comment on our Product Hunt launch would mean a lot — good or bad:

${url}

No ask beyond that. Thanks for being early.
— The PeerReview team (by tapdot)
peerreview.tapdot.org

You're receiving this because you created a PeerReview account. Reply to this email to opt out of future messages.`;

const htmlBody = (url) => `<div style="font-family:-apple-system,Segoe UI,Inter,sans-serif;font-size:15px;line-height:1.6;color:#1a2233;max-width:520px">
<p>Hi — you're one of the first developers on <strong>PeerReview</strong>, and today we launched on Product Hunt.</p>
<p>You already did the important part: gave and got genuine reviews with other builders. If PeerReview has been useful to you, an honest comment on our Product Hunt launch would mean a lot — good or bad:</p>
<p><a href="${url}" style="display:inline-block;background:#C9A84C;color:#05091a;font-weight:700;text-decoration:none;padding:11px 22px;border-radius:10px">See our Product Hunt launch →</a></p>
<p>No ask beyond that. Thanks for being early.<br>— The PeerReview team (by tapdot)</p>
<p style="font-size:12px;color:#8a95b0">You're receiving this because you created a PeerReview account. Reply to opt out of future messages.</p>
</div>`;

// gather registered real users
const users = JSON.parse(aws('dynamodb scan --table-name peerreview-users --projection-expression "email" --output json').replace(/^﻿/, "")).Items || [];
const recipients = [...new Set(users.map(u => u.email?.S).filter(e => e && !TEST.has(e) && !e.startsWith("pending")))];

console.log(`${recipients.length} recipients${SEND ? "" : " (DRY RUN — nothing sent)"}`);
if (!SEND) { console.log(recipients.join("\n")); console.log("\nRe-run with --send to actually send."); process.exit(0); }

const j = (o) => JSON.stringify(JSON.stringify(o));
let sent = 0, failed = 0;
for (const to of recipients) {
  const content = j({ Simple: { Subject: { Data: SUBJECT }, Body: { Text: { Data: textBody(PH_URL) }, Html: { Data: htmlBody(PH_URL) } } } });
  try {
    aws(`sesv2 send-email --from-email-address ${j(FROM)} --destination ${j({ ToAddresses: [to] })} --reply-to-addresses ${j([REPLY_TO])} --content ${content}`);
    sent++; console.log("  sent →", to);
  } catch (e) {
    failed++; console.log("  FAILED →", to, "-", String(e.message).split("\n")[0].slice(0, 120));
  }
  execSync("node -e \"setTimeout(()=>{},120)\""); // ~throttle under the SES rate cap
}
console.log(`\nDone: ${sent} sent, ${failed} failed.`);
