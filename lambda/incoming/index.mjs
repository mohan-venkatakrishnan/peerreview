import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const lambda = new LambdaClient({});

/* Trust Score — ARCHITECTURE.md §5, locked formula */
const computeTrust = (u) => {
  const V = ((u.verifiedGiven ?? 0) + 2) / ((u.verifiedGiven ?? 0) + (u.flaggedGiven ?? 0) + 4);
  const R = (u.ratingCount ?? 0) > 0 ? (u.ratingSum / u.ratingCount) / 5 : 0.70;
  const G = Math.min((u.given ?? 0) / Math.max(u.received ?? 0, 1), 1.5) / 1.5;
  return Math.round(5 * (0.45 * V + 0.35 * R + 0.20 * G) * 10) / 10;
};

const maskName = (name = '') => name.split(' ')
  .map(p => p.length <= 2 ? p : p[0] + '•'.repeat(Math.min(p.length - 2, 4)) + p[p.length - 1]).join(' ');

const getAssignment = async (assignmentId) => {
  const { Item } = await client.send(new GetCommand({
    TableName: process.env.ASSIGNMENTS_TABLE, Key: { assignmentId },
  }));
  return Item;
};

export const handler = async (event) => {
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) return respond(401, { message: 'Unauthorized' });
  const path = event.path ?? '';

  if (event.httpMethod === 'GET') {
    const { Items = [] } = await client.send(new QueryCommand({
      TableName: process.env.ASSIGNMENTS_TABLE,
      IndexName: 'owner-index',
      KeyConditionExpression: 'ownerId = :o',
      ExpressionAttributeValues: { ':o': userId },
      ScanIndexForward: false,
      Limit: 50,
    }));
    const relevant = Items.filter(a => ['submitted', 'verified', 'flagged'].includes(a.state));
    const out = [];
    for (const a of relevant) {
      const { Item: reviewer } = await client.send(new GetCommand({
        TableName: process.env.USERS_TABLE, Key: { userId: a.reviewerId },
      }));
      out.push({
        assignmentId: a.assignmentId,
        productId: a.productId,
        state: a.state,
        reviewLink: a.reviewLink,
        reviewText: a.reviewText,
        submittedAt: a.submittedAt,
        ownerRating: a.ownerRating,
        reviewer: reviewer ? {
          // privacy by architecture: masking happens HERE, server-side
          name: reviewer.privacy?.showName ? reviewer.name : maskName(reviewer.name),
          trustScore: reviewer.trustScore,
          given: reviewer.given,
        } : { name: 'Former member', trustScore: null, given: 0 },
      });
    }
    return respond(200, out);
  }

  if (event.httpMethod === 'POST' && path.endsWith('/verify')) {
    const body = JSON.parse(event.body ?? '{}');
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));
    const a = await getAssignment(body.assignmentId);
    if (!a || a.ownerId !== userId) return respond(404, { message: 'Assignment not found' });
    if (a.state !== 'submitted') return respond(409, { message: `Already ${a.state}` });

    await client.send(new UpdateCommand({
      TableName: process.env.ASSIGNMENTS_TABLE,
      Key: { assignmentId: a.assignmentId },
      UpdateExpression: 'SET #s = :v, verifiedAt = :now, ownerRating = :r',
      ConditionExpression: '#s = :submitted',
      ExpressionAttributeNames: { '#s': 'state' },
      ExpressionAttributeValues: { ':v': 'verified', ':submitted': 'submitted', ':now': new Date().toISOString(), ':r': rating },
    }));

    // reviewer: +1 credit, verified count, owner rating → recompute trust
    const { Attributes: reviewer } = await client.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId: a.reviewerId },
      UpdateExpression: 'ADD creditBalance :one, verifiedGiven :one, ratingSum :r, ratingCount :one',
      ExpressionAttributeValues: { ':one': 1, ':r': rating },
      ReturnValues: 'ALL_NEW',
    }));
    await client.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId: a.reviewerId },
      UpdateExpression: 'SET trustScore = :t',
      ExpressionAttributeValues: { ':t': computeTrust(reviewer) },
    }));

    // owner: received count; product: received count
    await client.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
      UpdateExpression: 'ADD received :one',
      ExpressionAttributeValues: { ':one': 1 },
    }));
    await client.send(new UpdateCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Key: { userId, productId: a.productId },
      UpdateExpression: 'ADD receivedCount :one',
      ExpressionAttributeValues: { ':one': 1 },
    })).catch(() => {});

    // one-for-one: the credit converts into a queued slot for one of the
    // reviewer's products (oldest active not already queued)
    const { Items: revProducts = [] } = await client.send(new QueryCommand({
      TableName: process.env.PRODUCTS_TABLE,
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': a.reviewerId },
    }));
    const target = revProducts
      .filter(p => p.status === 'active' && p.poolStatus !== 'queued')
      .sort((x, y) => (x.enqueuedAt ?? x.createdAt).localeCompare(y.enqueuedAt ?? y.createdAt))[0];
    if (target) {
      await client.send(new UpdateCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Key: { userId: target.userId, productId: target.productId },
        UpdateExpression: 'SET poolStatus = :q, enqueuedAt = :now ADD creditSpent :zero',
        ExpressionAttributeValues: { ':q': 'queued', ':now': new Date().toISOString(), ':zero': 0 },
      }));
      await client.send(new UpdateCommand({
        TableName: process.env.USERS_TABLE,
        Key: { userId: a.reviewerId },
        UpdateExpression: 'ADD creditBalance :minus',
        ExpressionAttributeValues: { ':minus': -1 },
      }));
    }

    // fire the matcher so the queue moves immediately
    await lambda.send(new InvokeCommand({
      FunctionName: process.env.MATCHER_FUNCTION,
      InvocationType: 'Event',
      Payload: JSON.stringify({ trigger: 'verify' }),
    })).catch(() => {}); // hourly schedule is the safety net

    return respond(200, { ok: true, state: 'verified' });
  }

  if (event.httpMethod === 'POST' && path.endsWith('/flag')) {
    const body = JSON.parse(event.body ?? '{}');
    const a = await getAssignment(body.assignmentId);
    if (!a || a.ownerId !== userId) return respond(404, { message: 'Assignment not found' });
    if (a.state !== 'submitted') return respond(409, { message: `Already ${a.state}` });

    await client.send(new UpdateCommand({
      TableName: process.env.ASSIGNMENTS_TABLE,
      Key: { assignmentId: a.assignmentId },
      UpdateExpression: 'SET #s = :f, flaggedAt = :now, flagReason = :reason',
      ConditionExpression: '#s = :submitted',
      ExpressionAttributeNames: { '#s': 'state' },
      ExpressionAttributeValues: { ':f': 'flagged', ':submitted': 'submitted', ':now': new Date().toISOString(), ':reason': String(body.reason ?? '').slice(0, 280) },
    }));

    const { Attributes: reviewer } = await client.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId: a.reviewerId },
      UpdateExpression: 'ADD flaggedGiven :one',
      ExpressionAttributeValues: { ':one': 1 },
      ReturnValues: 'ALL_NEW',
    }));
    await client.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId: a.reviewerId },
      UpdateExpression: 'SET trustScore = :t',
      ExpressionAttributeValues: { ':t': computeTrust(reviewer) },
    }));

    // the product still deserves a genuine review — back in the pool
    await client.send(new UpdateCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Key: { userId, productId: a.productId },
      UpdateExpression: 'SET poolStatus = :q, enqueuedAt = :at',
      ExpressionAttributeValues: { ':q': 'queued', ':at': a.assignedAt },
    })).catch(() => {});

    return respond(200, { ok: true, state: 'flagged' });
  }

  return respond(405, { message: 'Method not allowed' });
};

const respond = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
});
