import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const maskName = (name = '') => name.split(' ')
  .map(p => p.length <= 2 ? p : p[0] + '•'.repeat(Math.min(p.length - 2, 4)) + p[p.length - 1]).join(' ');
const maskEmail = (email = '') => {
  const [user, domain = ''] = email.split('@');
  return (user[0] ?? '•') + '•••@•••.' + (domain.split('.').pop() ?? '');
};

export const handler = async (event) => {
  const callerId = event.requestContext?.authorizer?.claims?.sub;
  if (!callerId) return respond(401, { message: 'Unauthorized' });

  const memberId = event.pathParameters?.id;
  if (!memberId) return respond(400, { message: 'Missing member id' });

  const { Item: u } = await client.send(new GetCommand({
    TableName: process.env.USERS_TABLE, Key: { userId: memberId },
  }));
  if (!u) return respond(404, { message: 'Member not found' });

  const privacy = u.privacy ?? {};
  const self = callerId === memberId;

  // Privacy by architecture: masked values are computed here — the raw
  // name/email of a member who hasn't opted in NEVER leaves the server.
  return respond(200, {
    userId: u.userId,
    name: (self || privacy.showName) ? u.name : maskName(u.name),
    nameShared: !!privacy.showName,
    email: (self || privacy.showEmail) ? u.email : maskEmail(u.email),
    emailShared: !!privacy.showEmail,
    photoShared: !!privacy.showPhoto,
    trustScore: u.trustScore,
    given: u.given ?? 0,
    received: u.received ?? 0,
    verifiedGiven: u.verifiedGiven ?? 0,
    badges: u.badges ?? [],
    categories: u.categories ?? [],
    memberSince: u.createdAt,
  });
};

const respond = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
});
