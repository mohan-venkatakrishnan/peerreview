import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

/* REVIEW url patterns per platform — the link must point at the platform,
   review anchors/params allowed. Owner verification remains the human gate. */
const REVIEW_PATTERNS = {
  'Chrome Web Store': /^(https:\/\/)?chromewebstore\.google\.com\/detail\/[\w-]+/i,
  'Firefox Add-ons': /^(https:\/\/)?addons\.mozilla\.org\/.*firefox\/addon\/[\w.-]+/i,
  'Edge Add-ons': /^(https:\/\/)?microsoftedge\.microsoft\.com\/addons\/detail\/[\w-]+/i,
  'Product Hunt': /^(https:\/\/)?(www\.)?producthunt\.com\/(products|posts)\/[\w-]+/i,
  'Google Play Store': /^(https:\/\/)?play\.google\.com\/store\/apps\/details\?id=[\w.]+/i,
  'Apple App Store': /^(https:\/\/)?apps\.apple\.com\/[a-z]{2}\/app\/[\w-]+\/id\d+/i,
  'VS Code Marketplace': /^(https:\/\/)?marketplace\.visualstudio\.com\/items\?itemName=[\w.-]+/i,
  'JetBrains Marketplace': /^(https:\/\/)?plugins\.jetbrains\.com\/plugin\/[\w.-]+/i,
  'Shopify App Store': /^(https:\/\/)?apps\.shopify\.com\/[\w-]+/i,
  'WordPress Plugins': /^(https:\/\/)?wordpress\.org\/plugins\/[\w-]+/i,
  'G2': /^(https:\/\/)?(www\.)?g2\.com\/products\/[\w-]+/i,
  'Capterra': /^(https:\/\/)?(www\.)?capterra\.com\/(p|software|reviews)\/[\w/-]+/i,
  'itch.io': /^(https:\/\/)?([\w-]+\.)?itch\.io\/[\w-]+/i,
  'Slack App Directory': /^(https:\/\/)?([\w-]+\.)?slack\.com\/apps\/[\w-]+/i,
  'Gumroad': /^(https:\/\/)?([\w-]+\.)?gumroad\.com\/(l\/)?[\w-]+/i,
  'npm': /^(https:\/\/)?(www\.)?npmjs\.com\/package\/(@[\w-]+\/)?[\w.-]+/i,
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
      product = Item ? {
        name: Item.name, url: Item.url, platform: Item.platform,
        category: Item.category, description: Item.description,
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
