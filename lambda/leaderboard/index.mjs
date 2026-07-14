import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const maskName = (name = '') => name.split(' ')
  .map(p => p.length <= 2 ? p : p[0] + '•'.repeat(Math.min(p.length - 2, 4)) + p[p.length - 1]).join(' ');

/* Public endpoint (landing-page trust signal). Scan is fine at launch scale;
   swap for an S3 snapshot when the pool grows past a few thousand users. */
export const handler = async () => {
  const users = [];
  let ExclusiveStartKey;
  do {
    const page = await client.send(new ScanCommand({
      TableName: process.env.USERS_TABLE,
      ExclusiveStartKey,
      Limit: 500,
    }));
    users.push(...(page.Items ?? []));
    ExclusiveStartKey = page.LastEvaluatedKey;
  } while (ExclusiveStartKey && users.length < 2000);

  const rows = users
    .filter(u => (u.given ?? 0) > 0 || (u.received ?? 0) > 0)
    .sort((a, b) => (b.trustScore ?? 0) - (a.trustScore ?? 0) || (b.verifiedGiven ?? 0) - (a.verifiedGiven ?? 0))
    .slice(0, 50)
    .map((u, i) => ({
      rank: i + 1,
      userId: u.userId,
      name: (u.privacy?.showName ?? true) ? u.name : maskName(u.name),
      given: u.given ?? 0,
      received: u.received ?? 0,
      verified: u.verifiedGiven ?? 0,
      score: u.trustScore ?? 0,
      badges: u.badges ?? [],
      category: (u.categories ?? [])[0] ?? '',
    }));

  // Aggregate "state of the exchange" stats for the dashboard + landing panels.
  const real = users.filter(u => !String(u.userId).startsWith('pending#'));
  const members = real.length;
  const reviewsExchanged = real.reduce((s, u) => s + (u.given ?? 0), 0);
  const totalReceived = real.reduce((s, u) => s + (u.received ?? 0), 0);
  // Public give/get health — aggregate only (never names anyone; that stays admin).
  const activeMembers = real.filter(u => (u.given ?? 0) + (u.received ?? 0) > 0);
  const givers = activeMembers.filter(u => (u.given ?? 0) >= (u.received ?? 0)).length;

  let products = 0, pKey;
  do {
    const pg = await client.send(new ScanCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Select: 'COUNT',
      FilterExpression: '#s = :active',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':active': 'active' },
      ExclusiveStartKey: pKey,
    }));
    products += pg.Count ?? 0;
    pKey = pg.LastEvaluatedKey;
  } while (pKey);

  const stats = {
    members,
    products,
    reviewsExchanged,
    avgReceived: products ? Math.round((totalReceived / products) * 10) / 10 : 0,
    givers,
    takers: activeMembers.length - givers,
  };

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=30', // ~live for the stats panels
    },
    body: JSON.stringify({ rows, stats }),
  };
};
