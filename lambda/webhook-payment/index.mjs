import { createHmac, timingSafeEqual } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

/* LemonSqueezy subscription webhook — dormant until the secret is configured.
   Same email→userId resolution pattern as LaunchPad. */
export const handler = async (event) => {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return respond(503, { message: 'Payments not configured' });

  const signature = event.headers?.['X-Signature'] ?? event.headers?.['x-signature'] ?? '';
  const digest = createHmac('sha256', secret).update(event.body ?? '').digest('hex');
  const valid = signature.length === digest.length &&
    timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  if (!valid) return respond(401, { message: 'Invalid signature' });

  const payload = JSON.parse(event.body ?? '{}');
  const eventName = payload.meta?.event_name ?? '';
  const attrs = payload.data?.attributes ?? {};
  const email = (attrs.user_email ?? '').toLowerCase();
  if (!email) return respond(400, { message: 'No payer email' });

  const variant = String(attrs.variant_name ?? attrs.product_name ?? '').toLowerCase();
  let plan = null;
  if (['subscription_created', 'subscription_updated', 'subscription_resumed', 'subscription_unpaused'].includes(eventName)) {
    plan = variant.includes('studio') ? 'studio' : variant.includes('pro') ? 'pro' : null;
  } else if (['subscription_cancelled', 'subscription_expired'].includes(eventName)) {
    plan = 'free';
  }
  if (!plan) return respond(200, { ok: true, ignored: eventName });

  const { Items = [] } = await client.send(new QueryCommand({
    TableName: process.env.USERS_TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :e',
    ExpressionAttributeValues: { ':e': email },
  }));
  if (!Items.length) return respond(200, { ok: true, note: 'no matching user yet' });

  await client.send(new UpdateCommand({
    TableName: process.env.USERS_TABLE,
    Key: { userId: Items[0].userId },
    UpdateExpression: 'SET #p = :plan',
    ExpressionAttributeNames: { '#p': 'plan' },
    ExpressionAttributeValues: { ':plan': plan },
  }));

  return respond(200, { ok: true, plan });
};

const respond = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
