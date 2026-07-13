import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
const ses = new SESClient({});
/* Transactional email — never throws into the core flow. No-op until
   NOTIFY_ENABLED=true (SES DKIM verified + out of sandbox). */
async function notify(to, subject, body) {
  if (process.env.NOTIFY_ENABLED !== 'true' || !to) return;
  try {
    await ses.send(new SendEmailCommand({
      Source: process.env.NOTIFY_FROM,
      Destination: { ToAddresses: [to] },
      Message: { Subject: { Data: subject }, Body: { Text: { Data: body } } },
    }));
  } catch (e) { console.log('notify failed for', to, '-', e.message); }
}


/* REVIEW links only need to be ON the right platform's domain — review URLs
   take many shapes (/detail/…/reviews, /reviews/<uuid>, ?see-all=reviews, …).
   The owner reads and verifies the actual review by hand, so domain-level is
   the right gate; a stricter path check just blocks legitimate links. */
const REVIEW_PATTERNS = {
  'Chrome Web Store': /^(https:\/\/)?(chromewebstore\.google\.com|chrome\.google\.com\/webstore)\//i,
  'Firefox Add-ons': /^(https:\/\/)?addons\.mozilla\.org\//i,
  'Edge Add-ons': /^(https:\/\/)?microsoftedge\.microsoft\.com\//i,
  'Product Hunt': /^(https:\/\/)?(www\.)?producthunt\.com\//i,
  'Google Play Store': /^(https:\/\/)?play\.google\.com\//i,
  'Apple App Store': /^(https:\/\/)?apps\.apple\.com\//i,
  'VS Code Marketplace': /^(https:\/\/)?marketplace\.visualstudio\.com\//i,
  'JetBrains Marketplace': /^(https:\/\/)?plugins\.jetbrains\.com\//i,
  'Shopify App Store': /^(https:\/\/)?apps\.shopify\.com\//i,
  'WordPress Plugins': /^(https:\/\/)?wordpress\.org\//i,
  'G2': /^(https:\/\/)?(www\.)?g2\.com\//i,
  'Capterra': /^(https:\/\/)?(www\.)?capterra\.com\//i,
  'itch.io': /^(https:\/\/)?([\w-]+\.)?itch\.io\//i,
  'Slack App Directory': /^(https:\/\/)?([\w-]+\.)?slack\.com\//i,
  'Gumroad': /^(https:\/\/)?([\w-]+\.)?gumroad\.com\//i,
  'npm': /^(https:\/\/)?(www\.)?npmjs\.com\//i,
};

const getCurrent = async (reviewerId) => {
  const { Items = [] } = await client.send(new QueryCommand({
    TableName: process.env.ASSIGNMENTS_TABLE,
    IndexName: 'reviewer-index',
    KeyConditionExpression: 'reviewerId = :r',
    ExpressionAttributeValues: { ':r': reviewerId },
    ScanIndexForward: false,
    Limit: 50,
  }));
  return {
    current: Items.find(a => a.state === 'assigned') ?? null,
    history: Items.filter(a => a.state !== 'assigned'),
    all: Items,
  };
};

const maskName = (name = '') => name.split(' ')
  .map(p => p.length <= 2 ? p : p[0] + '•'.repeat(Math.min(p.length - 2, 4)) + p[p.length - 1]).join(' ');

// skippedProductIds is a DynamoDB string set (comes back as a JS Set); tolerate
// array/undefined too.
const skipSize = (v) => (v ? (v.size ?? (Array.isArray(v) ? v.length : 0)) : 0);
const skipHas = (v, id) => v ? (v.has ? v.has(id) : (Array.isArray(v) && v.includes(id))) : false;

/* Trust Score — ARCHITECTURE.md §5, plus a bounded "not-interested" penalty:
   each product a member parks in their Not-interested list gently lowers the
   score (capped at 15%); moving items back to the queue restores it. Kept
   identical to lambda/incoming so verify/flag and skip agree. */
const computeTrust = (u) => {
  const V = ((u.verifiedGiven ?? 0) + 2) / ((u.verifiedGiven ?? 0) + (u.flaggedGiven ?? 0) + 4);
  const R = (u.ratingCount ?? 0) > 0 ? (u.ratingSum / u.ratingCount) / 5 : 0.70;
  const G = Math.min((u.given ?? 0) / Math.max(u.received ?? 0, 1), 1.5) / 1.5;
  const base = 0.45 * V + 0.35 * R + 0.20 * G;
  const penalty = Math.min(0.15, skipSize(u.skippedProductIds) * 0.03);
  return Math.round(5 * base * (1 - penalty) * 10) / 10;
};

/* Split the open pool into what the member can review now vs. what they've
   parked in "Not interested": open pool minus their own listings, anything
   they've already reviewed, and (when the owner asked) other categories. */
const buildQueue = async (userId, myCategories = [], skipped) => {
  const { Items: queued = [] } = await client.send(new QueryCommand({
    TableName: process.env.PRODUCTS_TABLE,
    IndexName: 'pool-index',
    KeyConditionExpression: 'poolStatus = :q',
    ExpressionAttributeValues: { ':q': 'queued' },
    ScanIndexForward: true, // oldest listings first
    Limit: 60,
  }));
  const cats = myCategories ?? [];
  const eligible = queued.filter(p =>
    p.userId !== userId &&
    (p.status ?? 'active') === 'active' &&
    !(p.reviewerIds ?? []).includes(userId) &&
    // Category-matched products are limited to reviewers in that category —
    // EXCEPT a reviewer with no categories of their own (e.g. someone here just
    // to review, no product listed yet) sees everything.
    ((p.matching ?? 'category') !== 'category' || !p.category || cats.length === 0 || cats.includes(p.category))
  );
  // masked owner identity — one lookup per distinct owner
  const owners = {};
  for (const ownerId of [...new Set(eligible.map(p => p.userId))]) {
    const { Item } = await client.send(new GetCommand({
      TableName: process.env.USERS_TABLE, Key: { userId: ownerId },
    })).catch(() => ({ Item: null }));
    owners[ownerId] = Item;
  }
  const shape = (p) => {
    const o = owners[p.userId];
    return {
      productId: p.productId,
      ownerId: p.userId,
      name: p.name,
      platform: p.platform,
      category: p.category,
      url: p.url,
      description: p.description,
      icon: p.icon ?? null,
      // owner name only if they opted to show it; trust score is public
      ownerName: (o?.privacy?.showName ?? true) ? o?.name : 'a fellow developer',
      ownerScore: o?.trustScore ?? null,
      createdAt: p.createdAt ?? p.enqueuedAt ?? null, // when the listing was created
      enqueuedAt: p.enqueuedAt,
    };
  };
  const notSkipped = eligible.filter(p => !skipHas(skipped, p.productId));
  // Featured: the top 3 products whose owners give the most reviews (given > 0),
  // pinned above everything. Only feature when there's a meaningful "rest" below.
  let featured = [];
  let rest = notSkipped;
  if (notSkipped.length > 3) {
    const ranked = notSkipped
      .filter(p => (owners[p.userId]?.given ?? 0) > 0)
      .sort((a, b) => (owners[b.userId].given - owners[a.userId].given) || String(a.enqueuedAt ?? '').localeCompare(String(b.enqueuedAt ?? '')));
    const seenOwners = new Set();
    for (const p of ranked) {
      if (seenOwners.has(p.userId)) continue; // ONE featured slot per owner
      seenOwners.add(p.userId);
      featured.push(p);
      if (featured.length === 3) break;
    }
    const fids = new Set(featured.map(p => p.productId));
    rest = notSkipped.filter(p => !fids.has(p.productId));
    // Award the Featured badge to owners who made the cut (idempotent).
    for (const p of featured) {
      const o = owners[p.userId];
      if (o && !(o.badges ?? []).includes('spotlight')) {
        await client.send(new UpdateCommand({
          TableName: process.env.USERS_TABLE,
          Key: { userId: p.userId },
          UpdateExpression: 'SET badges = list_append(if_not_exists(badges, :empty), :b)',
          ConditionExpression: 'attribute_not_exists(badges) OR NOT contains(badges, :bs)',
          ExpressionAttributeValues: { ':empty': [], ':b': ['spotlight'], ':bs': 'spotlight' },
        })).catch(() => {});
      }
    }
  }
  return {
    featured: featured.map(shape),
    pool: rest.map(shape),
    skipped: eligible.filter(p => skipHas(skipped, p.productId)).map(shape),
  };
};

export const handler = async (event) => {
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) return respond(401, { message: 'Unauthorized' });
  const path = event.path ?? '';

  if (event.httpMethod === 'GET') {
    const { history } = await getCurrent(userId);
    // the reviewer's own categories drive category-restricted matches
    const { Item: meUser } = await client.send(new GetCommand({
      TableName: process.env.USERS_TABLE, Key: { userId },
    })).catch(() => ({ Item: null }));
    const { featured, pool, skipped } = await buildQueue(userId, meUser?.categories ?? [], meUser?.skippedProductIds);

    // enrich history with the real product name (assignments only store ids)
    const enriched = [];
    for (const h of history) {
      const { Item: p } = await client.send(new GetCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Key: { userId: h.ownerId, productId: h.productId },
      })).catch(() => ({ Item: null }));
      enriched.push({ ...h, productName: p?.name ?? 'A product' });
    }
    return respond(200, { featured, pool, skipped, history: enriched });
  }

  // Not interested / undo — reuses the existing /assignment/skip route (no new
  // infra). Parking a product hides it from the queue and dings Trust Score;
  // undo:true moves it back and restores the score.
  if (event.httpMethod === 'POST' && path.endsWith('/skip')) {
    const body = JSON.parse(event.body ?? '{}');
    const productId = String(body.productId ?? '').trim();
    if (!productId) return respond(400, { message: 'Which product?' });
    const undo = body.undo === true;
    const { Attributes: u } = await client.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
      UpdateExpression: `${undo ? 'DELETE' : 'ADD'} skippedProductIds :pid`,
      ExpressionAttributeValues: { ':pid': new Set([productId]) },
      ReturnValues: 'ALL_NEW',
    }));
    // recompute Trust Score to reflect the new not-interested count
    await client.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET trustScore = :t',
      ExpressionAttributeValues: { ':t': computeTrust(u ?? {}) },
    })).catch(() => {});
    return respond(200, { ok: true, skipped: !undo });
  }

  if (event.httpMethod === 'POST' && path.endsWith('/submit')) {
    const body = JSON.parse(event.body ?? '{}');
    const productId = String(body.productId ?? '').trim();
    const ownerId = String(body.ownerId ?? '').trim();
    if (!productId || !ownerId) return respond(400, { message: 'Pick a product to review first.' });
    if (ownerId === userId) return respond(400, { message: "You can't review your own product." });

    const { Item: product } = await client.send(new GetCommand({
      TableName: process.env.PRODUCTS_TABLE, Key: { userId: ownerId, productId },
    }));
    if (!product || (product.status ?? 'active') !== 'active') return respond(404, { message: 'That product is no longer available.' });
    if ((product.reviewerIds ?? []).includes(userId)) return respond(409, { message: "You've already reviewed this one.", code: 'ALREADY_REVIEWED' });

    const link = String(body.link ?? '').trim();
    const pattern = REVIEW_PATTERNS[product.platform];
    if (!pattern || !pattern.test(link)) {
      return respond(400, { message: `Link doesn't match a ${product.platform} URL`, code: 'INVALID_REVIEW_LINK' });
    }

    const now = new Date().toISOString();
    const assignmentId = randomUUID();
    // one atomic claim: reviewer joins the product's reviewerIds only if not
    // already there — blocks a double submit racing two tabs.
    try {
      await client.send(new UpdateCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Key: { userId: ownerId, productId },
        UpdateExpression: 'SET reviewerIds = list_append(if_not_exists(reviewerIds, :empty), :rid)',
        ConditionExpression: 'attribute_not_exists(reviewerIds) OR NOT contains(reviewerIds, :ridStr)',
        ExpressionAttributeValues: { ':empty': [], ':rid': [userId], ':ridStr': userId },
      }));
    } catch (e) {
      return respond(409, { message: "You've already reviewed this one.", code: 'ALREADY_REVIEWED' });
    }

    await client.send(new PutCommand({
      TableName: process.env.ASSIGNMENTS_TABLE,
      Item: {
        assignmentId, reviewerId: userId, ownerId, productId,
        platform: product.platform, category: product.category,
        state: 'submitted', assignedAt: now, submittedAt: now,
        reviewLink: link, reviewText: String(body.text ?? '').slice(0, 4000),
      },
    }));

    // given counts submissions; verified counts land on owner verification
    await client.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'ADD given :one',
      ExpressionAttributeValues: { ':one': 1 },
    }));

    // tell the product owner a review is waiting for their verification
    const { Item: owner } = await client.send(new GetCommand({
      TableName: process.env.USERS_TABLE, Key: { userId: ownerId },
    })).catch(() => ({ Item: null }));
    await notify(owner?.email, 'Your product received a review',
      `A reviewer just left a review on one of your products.

Read it on the platform, then verify or flag it here:
${process.env.SITE_URL}/app/product`);

    return respond(200, { ok: true, state: 'submitted', assignmentId });
  }

  return respond(405, { message: 'Method not allowed' });
};

const respond = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
});
