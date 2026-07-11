import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, GetCommand, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

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
  avatarData: u.avatarData ?? null, createdAt: u.createdAt,
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

    // claim any entitlement parked by the payment webhook before signup
    if (fresh.email) {
      const { Items = [] } = await client.send(new QueryCommand({
        TableName: process.env.USERS_TABLE,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :e',
        ExpressionAttributeValues: { ':e': fresh.email.toLowerCase() },
      })).catch(() => ({ Items: [] }));
      const parked = Items.find(i => String(i.userId).startsWith('pending#'));
      if (parked?.plan) {
        fresh.plan = parked.plan;
        await client.send(new DeleteCommand({
          TableName: process.env.USERS_TABLE,
          Key: { userId: parked.userId },
        })).catch(() => {});
      }
    }

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
    if (body.avatarData === null) {
      sets.push('avatarData = :avatar');
      values[':avatar'] = null;
    } else if (typeof body.avatarData === 'string' && body.avatarData.startsWith('data:image/') && body.avatarData.length < 100000) {
      // small client-resized data URL (~128px); cap keeps DynamoDB item well under 400KB
      sets.push('avatarData = :avatar');
      values[':avatar'] = body.avatarData;
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
