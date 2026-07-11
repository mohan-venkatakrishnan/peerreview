import { createHmac, timingSafeEqual } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

/* LemonSqueezy subscription webhook — dormant until the secret is configured.
   web-app-craft rules baked in:
   - update EVERY identity matching the payer email (email is not a primary key)
   - cancelled ≠ expired: `cancelled` = will-not-renew, tier survives until `expired`
   - park entitlements for emails that haven't signed up yet
   - log every event and every mutation */
export const handler = async (event) => {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return respond(503, { message: 'Payments not configured' });

  const signature = event.headers?.['X-Signature'] ?? event.headers?.['x-signature'] ?? '';
  const digest = createHmac('sha256', secret).update(event.body ?? '').digest('hex');
  const valid = signature.length === digest.length &&
    timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  if (!valid) {
    console.log('webhook: INVALID SIGNATURE');
    return respond(401, { message: 'Invalid signature' });
  }

  const payload = JSON.parse(event.body ?? '{}');
  const eventName = payload.meta?.event_name ?? '';
  const attrs = payload.data?.attributes ?? {};
  const email = (attrs.user_email ?? '').toLowerCase();
  const status = attrs.status ?? '';
  console.log(`webhook: event=${eventName} status=${status} email=${email}`);
  if (!email) return respond(400, { message: 'No payer email' });

  const variant = String(attrs.variant_name ?? attrs.product_name ?? '').toLowerCase();
  let plan = null;
  if (['subscription_created', 'subscription_updated', 'subscription_resumed', 'subscription_unpaused'].includes(eventName)) {
    // `subscription_updated` also fires on cancellation with status=cancelled —
    // the user keeps what they paid for until subscription_expired
    if (status === 'cancelled') {
      console.log('webhook: cancellation notice — tier kept until expiry, no mutation');
      return respond(200, { ok: true, note: 'cancelled = will-not-renew, keeping tier' });
    }
    plan = variant.includes('studio') ? 'studio' : variant.includes('pro') ? 'pro' : null;
  } else if (eventName === 'subscription_expired') {
    plan = 'free';
  } else if (eventName === 'subscription_cancelled') {
    console.log('webhook: cancellation event — tier kept until expiry, no mutation');
    return respond(200, { ok: true, note: 'cancelled = will-not-renew, keeping tier' });
  }
  if (!plan) return respond(200, { ok: true, ignored: eventName });

  const { Items = [] } = await client.send(new QueryCommand({
    TableName: process.env.USERS_TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :e',
    ExpressionAttributeValues: { ':e': email },
  }));

  const realUsers = Items.filter(u => !String(u.userId).startsWith('pending#'));
  if (!realUsers.length) {
    // park the entitlement — claimed when this email first signs in
    await client.send(new PutCommand({
      TableName: process.env.USERS_TABLE,
      Item: { userId: `pending#${email}`, email, plan, parkedAt: new Date().toISOString() },
    }));
    console.log(`webhook: no user yet — parked plan=${plan} for ${email}`);
    return respond(200, { ok: true, parked: plan });
  }

  // one identity can be many accounts: update EVERY match, not the first
  for (const u of realUsers) {
    await client.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId: u.userId },
      UpdateExpression: 'SET #p = :plan',
      ExpressionAttributeNames: { '#p': 'plan' },
      ExpressionAttributeValues: { ':plan': plan },
    }));
    console.log(`webhook: set plan=${plan} on userId=${u.userId}`);
  }

  return respond(200, { ok: true, plan, updated: realUsers.length });
};

const respond = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
