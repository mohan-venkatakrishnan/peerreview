import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

/* Closed platform list — product LISTING url patterns (auto-detect) */
const PLATFORMS = [
  { name: 'Chrome Web Store', re: /^(https:\/\/)?chromewebstore\.google\.com\/detail\/[\w-]+/i },
  { name: 'Firefox Add-ons', re: /^(https:\/\/)?addons\.mozilla\.org\/.*firefox\/addon\/[\w.-]+/i },
  { name: 'Edge Add-ons', re: /^(https:\/\/)?microsoftedge\.microsoft\.com\/addons\/detail\/[\w-]+/i },
  { name: 'Product Hunt', re: /^(https:\/\/)?(www\.)?producthunt\.com\/(products|posts)\/[\w-]+/i },
  { name: 'Google Play Store', re: /^(https:\/\/)?play\.google\.com\/store\/apps\/details\?id=[\w.]+/i },
  { name: 'Apple App Store', re: /^(https:\/\/)?apps\.apple\.com\/[a-z]{2}\/app\/[\w-]+\/id\d+/i },
];
const PLAN_LIMITS = { free: 5, pro: 10, studio: Infinity };

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

    // keep the matcher's category eligibility current
    const categories = [...new Set([...(user.categories ?? []), product.category].filter(Boolean))];
    await client.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'SET categories = :c',
      ExpressionAttributeValues: { ':c': categories },
    }));

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
