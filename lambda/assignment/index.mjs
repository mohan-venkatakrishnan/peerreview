import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

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
    Limit: 20,
  }));
  return {
    current: Items.find(a => a.state === 'assigned') ?? null,
    history: Items.filter(a => a.state !== 'assigned'),
  };
};

export const handler = async (event) => {
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) return respond(401, { message: 'Unauthorized' });
  const path = event.path ?? '';

  if (event.httpMethod === 'GET') {
    const { current, history } = await getCurrent(userId);
    let product = null;
    if (current) {
      const { Item } = await client.send(new GetCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Key: { userId: current.ownerId, productId: current.productId },
      }));
      // owner identity follows the owner's own privacy choice: name shown only
      // if they've turned on showName, else a neutral label. Trust score is
      // public (it's on the leaderboard), so always include it.
      const { Item: owner } = await client.send(new GetCommand({
        TableName: process.env.USERS_TABLE, Key: { userId: current.ownerId },
      })).catch(() => ({ Item: null }));
      product = Item ? {
        name: Item.name, url: Item.url, platform: Item.platform,
        category: Item.category, description: Item.description,
        ownerName: owner?.privacy?.showName ? owner.name : 'a fellow developer',
        ownerScore: owner?.trustScore ?? null,
      } : null;
    }
    return respond(200, { current, product, history });
  }

  if (event.httpMethod === 'POST' && path.endsWith('/submit')) {
    const body = JSON.parse(event.body ?? '{}');
    const { current } = await getCurrent(userId);
    if (!current) return respond(404, { message: 'No active assignment' });

    const link = String(body.link ?? '').trim();
    const pattern = REVIEW_PATTERNS[current.platform];
    if (!pattern || !pattern.test(link)) {
      return respond(400, { message: `Link doesn't match a ${current.platform} URL`, code: 'INVALID_REVIEW_LINK' });
    }

    await client.send(new UpdateCommand({
      TableName: process.env.ASSIGNMENTS_TABLE,
      Key: { assignmentId: current.assignmentId },
      UpdateExpression: 'SET #s = :submitted, submittedAt = :now, reviewLink = :link, reviewText = :text',
      ConditionExpression: '#s = :assigned',
      ExpressionAttributeNames: { '#s': 'state' },
      ExpressionAttributeValues: {
        ':submitted': 'submitted', ':assigned': 'assigned',
        ':now': new Date().toISOString(), ':link': link,
        ':text': String(body.text ?? '').slice(0, 4000),
      },
    }));

    // given counts submissions; verified counts land on owner verification.
    // Clearing activeAssignmentId frees the reviewer for the next match.
    await client.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'ADD given :one REMOVE activeAssignmentId',
      ExpressionAttributeValues: { ':one': 1 },
    }));

    // tell the product owner a review is waiting for their verification
    const { Item: owner } = await client.send(new GetCommand({
      TableName: process.env.USERS_TABLE, Key: { userId: current.ownerId },
    })).catch(() => ({ Item: null }));
    await notify(owner?.email, 'Your product received a review',
      `A reviewer just left a review on one of your products.

Read it on the platform, then verify or flag it here:
${process.env.SITE_URL}/app/product`);

    return respond(200, { ok: true, state: 'submitted' });
  }

  if (event.httpMethod === 'POST' && path.endsWith('/skip')) {
    const { current } = await getCurrent(userId);
    if (!current) return respond(404, { message: 'No active assignment' });

    await client.send(new UpdateCommand({
      TableName: process.env.ASSIGNMENTS_TABLE,
      Key: { assignmentId: current.assignmentId },
      UpdateExpression: 'SET #s = :skipped',
      ConditionExpression: '#s = :assigned',
      ExpressionAttributeNames: { '#s': 'state' },
      ExpressionAttributeValues: { ':skipped': 'skipped', ':assigned': 'assigned' },
    }));
    // put the product back near the front of the pool (keeps its priority)
    await client.send(new UpdateCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Key: { userId: current.ownerId, productId: current.productId },
      UpdateExpression: 'SET poolStatus = :q, enqueuedAt = :at',
      ExpressionAttributeValues: { ':q': 'queued', ':at': current.assignedAt },
    }));
    await client.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'REMOVE activeAssignmentId',
    }));

    return respond(200, { ok: true, state: 'skipped' });
  }

  return respond(405, { message: 'Method not allowed' });
};

const respond = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
});
