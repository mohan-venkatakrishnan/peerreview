import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const NEW_USER = (userId, email, name) => ({
  userId,
  email,
  name: name || email.split('@')[0],
  plan: 'free',
  matching: 'category',
  privacy: { showName: false, showEmail: false, showPhoto: false },
  creditBalance: 0,
  given: 0,
  received: 0,
  verifiedGiven: 0,
  flaggedGiven: 0,
  ratingSum: 0,
  ratingCount: 0,
  trustScore: 3.2,
  expiredCount: 0,
  badges: ['seal'], // Founding Member for the launch cohort
  categories: [],
  recentPartners: {},
  createdAt: new Date().toISOString(),
});

const PUBLIC_FIELDS = (u) => ({
  userId: u.userId, email: u.email, name: u.name, plan: u.plan,
  matching: u.matching, privacy: u.privacy, creditBalance: u.creditBalance,
  given: u.given, received: u.received, verifiedGiven: u.verifiedGiven,
  flaggedGiven: u.flaggedGiven, trustScore: u.trustScore, badges: u.badges,
  createdAt: u.createdAt,
});

export const handler = async (event) => {
  const claims = event.requestContext?.authorizer?.claims;
  const userId = claims?.sub;
  if (!userId) return respond(401, { message: 'Unauthorized' });

  if (event.httpMethod === 'GET') {
    const { Item } = await client.send(new GetCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
    }));
    if (Item) return respond(200, PUBLIC_FIELDS(Item));

    const fresh = NEW_USER(userId, claims.email ?? '', claims.name);
    await client.send(new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: fresh,
      ConditionExpression: 'attribute_not_exists(userId)',
    })).catch(() => {}); // concurrent first-login race: keep the winner
    return respond(200, PUBLIC_FIELDS(fresh));
  }

  if (event.httpMethod === 'PUT') {
    const body = JSON.parse(event.body ?? '{}');
    const sets = [];
    const values = {};
    if (typeof body.name === 'string' && body.name.trim()) {
      sets.push('#n = :name');
      values[':name'] = body.name.trim().slice(0, 80);
    }
    if (body.matching === 'category' || body.matching === 'open') {
      sets.push('matching = :matching');
      values[':matching'] = body.matching;
    }
    if (body.privacy && typeof body.privacy === 'object') {
      sets.push('privacy = :privacy');
      values[':privacy'] = {
        showName: !!body.privacy.showName,
        showEmail: !!body.privacy.showEmail,
        showPhoto: !!body.privacy.showPhoto,
      };
    }
    if (!sets.length) return respond(400, { message: 'Nothing to update' });

    const { Attributes } = await client.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeValues: values,
      ...(values[':name'] !== undefined ? { ExpressionAttributeNames: { '#n': 'name' } } : {}),
      ReturnValues: 'ALL_NEW',
    }));
    return respond(200, PUBLIC_FIELDS(Attributes));
  }

  return respond(405, { message: 'Method not allowed' });
};

const respond = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
});
