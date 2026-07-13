import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

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

  // Privacy by architecture: masked values are computed here — the raw value of
  // a member who has masked a field NEVER leaves the server. Name & photo are
  // shown by default; email is masked by default (opt-in to show).
  const showName = privacy.showName ?? true;
  const showPhoto = privacy.showPhoto ?? true;
  const showEmail = privacy.showEmail ?? false;

  // Product listings are public (they're in the review pool for everyone), so
  // no masking — show what this member has listed and how many reviews each got.
  const { Items: prods = [] } = await client.send(new QueryCommand({
    TableName: process.env.PRODUCTS_TABLE,
    KeyConditionExpression: 'userId = :u',
    ExpressionAttributeValues: { ':u': memberId },
  })).catch(() => ({ Items: [] }));
  const products = prods
    .filter(p => (p.status ?? 'active') === 'active')
    .map(p => ({
      productId: p.productId,
      name: p.name,
      platform: p.platform,
      category: p.category,
      icon: p.icon ?? null,
      url: p.url,
      reviews: p.receivedCount ?? 0,               // verified reviews received
      reviewers: (p.reviewerIds ?? []).length,     // total who reviewed it
    }));

  return respond(200, {
    userId: u.userId,
    name: (self || showName) ? u.name : maskName(u.name),
    nameShared: showName,
    email: (self || showEmail) ? u.email : maskEmail(u.email),
    emailShared: showEmail,
    photoShared: showPhoto,
    avatarData: (self || showPhoto) ? (u.avatarData ?? null) : null,
    trustScore: u.trustScore,
    given: u.given ?? 0,
    received: u.received ?? 0,
    verifiedGiven: u.verifiedGiven ?? 0,
    badges: u.badges ?? [],
    categories: u.categories ?? [],
    memberSince: u.createdAt,
    products,
  });
};

const respond = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body),
});
