import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const lambda = new LambdaClient({});

/* Supported platform LISTING url patterns (auto-detect). Curated set of real
   product/store pages with public reviews — expand as new ones are added. */
const PLATFORMS = [
  { name: 'Chrome Web Store', re: /^(https:\/\/)?chromewebstore\.google\.com\/detail\/[\w-]+/i },
  { name: 'Firefox Add-ons', re: /^(https:\/\/)?addons\.mozilla\.org\/.*firefox\/addon\/[\w.-]+/i },
  { name: 'Edge Add-ons', re: /^(https:\/\/)?microsoftedge\.microsoft\.com\/addons\/detail\/[\w-]+/i },
  { name: 'Product Hunt', re: /^(https:\/\/)?(www\.)?producthunt\.com\/(products|posts)\/[\w-]+/i },
  { name: 'Google Play Store', re: /^(https:\/\/)?play\.google\.com\/store\/apps\/details\?id=[\w.]+/i },
  { name: 'Apple App Store', re: /^(https:\/\/)?apps\.apple\.com\/[a-z]{2}\/app\/[\w-]+\/id\d+/i },
  { name: 'VS Code Marketplace', re: /^(https:\/\/)?marketplace\.visualstudio\.com\/items\?itemName=[\w.-]+/i },
  { name: 'JetBrains Marketplace', re: /^(https:\/\/)?plugins\.jetbrains\.com\/plugin\/[\w.-]+/i },
  { name: 'Shopify App Store', re: /^(https:\/\/)?apps\.shopify\.com\/[\w-]+/i },
  { name: 'WordPress Plugins', re: /^(https:\/\/)?wordpress\.org\/plugins\/[\w-]+/i },
  { name: 'G2', re: /^(https:\/\/)?(www\.)?g2\.com\/products\/[\w-]+/i },
  { name: 'Capterra', re: /^(https:\/\/)?(www\.)?capterra\.com\/(p|software|reviews)\/[\w/-]+/i },
  { name: 'itch.io', re: /^(https:\/\/)?([\w-]+\.)?itch\.io\/[\w-]+/i },
  { name: 'Slack App Directory', re: /^(https:\/\/)?([\w-]+\.)?slack\.com\/apps\/[\w-]+/i },
  { name: 'Gumroad', re: /^(https:\/\/)?([\w-]+\.)?gumroad\.com\/(l\/)?[\w-]+/i },
  { name: 'npm', re: /^(https:\/\/)?(www\.)?npmjs\.com\/package\/(@[\w-]+\/)?[\w.-]+/i },
];
const PLAN_LIMITS = { free: 25, pro: 25, studio: Infinity };

/* Badges we can award honestly from stored stats (no time/streak/word-count
   guesses). Purely additive — never removes an earned badge. Kept in sync with
   lambda/incoming and the backfill. `seal` = founding launch cohort. */
export function earnedBadges(u, productCount = 0) {
  const b = new Set(u.badges ?? []);
  const vg = u.verifiedGiven ?? 0, fg = u.flaggedGiven ?? 0, given = u.given ?? 0;
  const rc = u.ratingCount ?? 0, avg = rc > 0 ? (u.ratingSum ?? 0) / rc : 0;
  b.add('seal');
  if (productCount >= 1) b.add('box');       // Shipped
  if (productCount >= 5) b.add('boxes');      // Portfolio
  if (productCount >= 10) b.add('factory');   // Product Studio
  if (vg >= 1) b.add('quill');                // First Ink
  if (vg >= 10) b.add('stack');               // Ten Deep
  if (vg >= 50) b.add('medal');               // Fifty Club
  if (vg >= 100) b.add('trophy');             // Century
  if (given >= 10 && vg / given >= 0.95) b.add('shield'); // Trusted
  if (vg >= 25 && fg === 0) b.add('diamond');  // Flawless
  if (rc >= 25 && avg >= 4.8) b.add('laurel'); // Laureate
  return [...b];
}

export const handler = async (event) => {
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) return respond(401, { message: 'Unauthorized' });

  if (event.httpMethod === 'GET') {
    const { Items } = await client.send(new QueryCommand({
      TableName: process.env.PRODUCTS_TABLE,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    }));
    return respond(200, (Items ?? []).filter(p => p.status !== 'removed'));
  }

  if (event.httpMethod === 'POST') {
    const body = JSON.parse(event.body ?? '{}');
    const url = String(body.url ?? '').trim();
    const platform = PLATFORMS.find(p => p.re.test(url))?.name;
    if (!platform) return respond(400, { message: 'URL must be a live listing on a supported platform', code: 'INVALID_PLATFORM_URL' });
    if (!body.name?.trim()) return respond(400, { message: 'Product name is required' });

    const { Item: user } = await client.send(new GetCommand({
      TableName: process.env.USERS_TABLE, Key: { userId },
    }));
    if (!user) return respond(400, { message: 'Sign in first' });

    const { Items: existing = [] } = await client.send(new QueryCommand({
      TableName: process.env.PRODUCTS_TABLE,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    }));
    const active = existing.filter(p => p.status === 'active');
    const editing = body.productId && existing.some(p => p.productId === body.productId);
    const limit = PLAN_LIMITS[user.plan ?? 'free'];
    if (!editing && active.length >= limit) {
      return respond(403, { message: `Your ${user.plan} plan allows ${limit} listing${limit === 1 ? '' : 's'}`, code: 'PLAN_LIMIT' });
    }

    const now = new Date().toISOString();
    const product = {
      userId,
      productId: editing ? body.productId : randomUUID(),
      name: body.name.trim().slice(0, 80),
      url,
      platform,
      category: String(body.category ?? '').slice(0, 40),
      description: String(body.description ?? '').slice(0, 280),
      matching: body.matching === 'open' ? 'open' : 'category',
      status: 'active',
      receivedCount: editing ? existing.find(p => p.productId === body.productId).receivedCount ?? 0 : 0,
      reviewerIds: editing ? existing.find(p => p.productId === body.productId).reviewerIds ?? [] : [],
      createdAt: editing ? existing.find(p => p.productId === body.productId).createdAt : now,
      // A new listing seeds ONE slot into the matching pool — this bootstraps
      // the exchange (first review arrives before you've earned a credit);
      // every later review of it is paid for by your earned credits.
      ...(!editing ? { poolStatus: 'queued', enqueuedAt: now } : {}),
    };
    await client.send(new PutCommand({ TableName: process.env.PRODUCTS_TABLE, Item: product }));

    // keep the matcher's category eligibility current + award listing badges
    const categories = [...new Set([...(user.categories ?? []), product.category].filter(Boolean))];
    const productCount = active.length + (editing ? 0 : 1);
    const badges = earnedBadges(user, productCount);
    await client.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET categories = :c, badges = :b',
      ExpressionAttributeValues: { ':c': categories, ':b': badges },
    }));

    // a fresh listing enters the pool — run the matcher now so the owner
    // isn't stuck on "nothing assigned" until the next hourly sweep
    if (!editing) {
      await lambda.send(new InvokeCommand({
        FunctionName: process.env.MATCHER_FUNCTION,
        InvocationType: 'Event',
        Payload: JSON.stringify({ trigger: 'listing' }),
      })).catch(() => {}); // hourly schedule is the safety net
    }

    return respond(200, product);
  }

  if (event.httpMethod === 'DELETE') {
    const productId = event.pathParameters?.id;
    if (!productId) return respond(400, { message: 'Missing product id' });
    await client.send(new UpdateCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Key: { userId, productId },
      UpdateExpression: 'SET #s = :removed REMOVE poolStatus, enqueuedAt',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':removed': 'removed' },
      ConditionExpression: 'attribute_exists(productId)',
    })).catch(() => null);
    return respond(200, { ok: true });
  }

  return respond(405, { message: 'Method not allowed' });
};

const respond = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
});
