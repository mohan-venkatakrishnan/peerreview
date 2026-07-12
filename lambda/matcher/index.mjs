import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand, TransactWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

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


const DEADLINE_DAYS = 7;
const RECIPROCITY_DAYS = 30;
const MAX_EXPIRIES = 3; // per ARCHITECTURE.md — pause matching after 3 expiries

export const handler = async () => {
  const now = new Date();
  const nowIso = now.toISOString();

  /* ---- 1. Expire overdue assignments ---- */
  const { Items: active = [] } = await client.send(new QueryCommand({
    TableName: process.env.ASSIGNMENTS_TABLE,
    IndexName: 'state-index',
    KeyConditionExpression: '#s = :assigned',
    ExpressionAttributeNames: { '#s': 'state' },
    ExpressionAttributeValues: { ':assigned': 'assigned' },
  }));
  for (const a of active.filter(a => a.dueAt < nowIso)) {
    await client.send(new UpdateCommand({
      TableName: process.env.ASSIGNMENTS_TABLE,
      Key: { assignmentId: a.assignmentId },
      UpdateExpression: 'SET #s = :expired',
      ConditionExpression: '#s = :assigned',
      ExpressionAttributeNames: { '#s': 'state' },
      ExpressionAttributeValues: { ':expired': 'expired', ':assigned': 'assigned' },
    })).catch(() => null);
    // product goes back to the pool with its original priority
    await client.send(new UpdateCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Key: { userId: a.ownerId, productId: a.productId },
      UpdateExpression: 'SET poolStatus = :q, enqueuedAt = :at',
      ExpressionAttributeValues: { ':q': 'queued', ':at': a.assignedAt },
    })).catch(() => null);
    await client.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId: a.reviewerId },
      UpdateExpression: 'ADD expiredCount :one REMOVE activeAssignmentId',
      ExpressionAttributeValues: { ':one': 1 },
    })).catch(() => null);
  }

  /* ---- 2. Assign queued products ---- */
  const { Items: pool = [] } = await client.send(new QueryCommand({
    TableName: process.env.PRODUCTS_TABLE,
    IndexName: 'pool-index',
    KeyConditionExpression: 'poolStatus = :q',
    ExpressionAttributeValues: { ':q': 'queued' },
    ScanIndexForward: true, // oldest first
    Limit: 25,
  }));
  if (!pool.length) return { assigned: 0, expired: active.length };

  // small-scale candidate set; revisit when the pool grows
  const { Items: users = [] } = await client.send(new ScanCommand({
    TableName: process.env.USERS_TABLE,
    Limit: 500,
  }));

  const cutoff = new Date(now.getTime() - RECIPROCITY_DAYS * 86400000).toISOString();
  let assigned = 0;

  for (const product of pool) {
    // each product carries its own matching preference now
    const requireCategory = (product.matching ?? 'category') === 'category' && !!product.category;
    // Hard constraints — never relaxed: real person, not the owner, free,
    // not banned for expiries, category (if the owner requires it).
    const baseEligible = (u) =>
      !String(u.userId).startsWith('pending#') &&
      u.userId !== product.userId &&
      !u.activeAssignmentId &&
      (u.expiredCount ?? 0) < MAX_EXPIRIES &&
      // HARD: never re-offer a product to someone already assigned it. This is
      // what stops a skipped product from bouncing straight back to the skipper.
      !(product.reviewerIds ?? []).includes(u.userId) &&
      (!requireCategory || (u.categories ?? []).includes(product.category));

    // Prefer a non-reciprocal reviewer; relax ONLY anti-reciprocity for a small
    // pool. We never relax the has-not-reviewed rule — re-offering the same
    // product to the same person is never desirable.
    let candidates = users.filter(u => baseEligible(u) &&
      !((u.recentPartners ?? {})[product.userId] > cutoff));
    if (!candidates.length) {
      candidates = users.filter(u => baseEligible(u));
    }
    if (!candidates.length) continue;

    // fairness: least-recently-assigned first
    candidates.sort((a, b) => String(a.lastAssignedAt ?? '').localeCompare(String(b.lastAssignedAt ?? '')));
    const reviewer = candidates[0];

    const assignment = {
      assignmentId: randomUUID(),
      reviewerId: reviewer.userId,
      ownerId: product.userId,
      productId: product.productId,
      platform: product.platform,
      category: product.category,
      state: 'assigned',
      assignedAt: nowIso,
      dueAt: new Date(now.getTime() + DEADLINE_DAYS * 86400000).toISOString(),
    };

    try {
      await client.send(new TransactWriteCommand({
        TransactItems: [
          { Put: { TableName: process.env.ASSIGNMENTS_TABLE, Item: assignment } },
          {
            Update: {
              TableName: process.env.USERS_TABLE,
              Key: { userId: reviewer.userId },
              UpdateExpression: 'SET activeAssignmentId = :aid, lastAssignedAt = :now, recentPartners.#owner = :now',
              ConditionExpression: 'attribute_not_exists(activeAssignmentId)',
              ExpressionAttributeNames: { '#owner': product.userId },
              ExpressionAttributeValues: { ':aid': assignment.assignmentId, ':now': nowIso },
            },
          },
          {
            // mark the edge on the owner too — blocks the reverse A<->B match
            // inside the reciprocity window (quid-pro-quo prevention)
            Update: {
              TableName: process.env.USERS_TABLE,
              Key: { userId: product.userId },
              UpdateExpression: 'SET recentPartners.#reviewer = :now',
              ExpressionAttributeNames: { '#reviewer': reviewer.userId },
              ExpressionAttributeValues: { ':now': nowIso },
            },
          },
          {
            Update: {
              TableName: process.env.PRODUCTS_TABLE,
              Key: { userId: product.userId, productId: product.productId },
              UpdateExpression: 'REMOVE poolStatus, enqueuedAt SET reviewerIds = list_append(if_not_exists(reviewerIds, :empty), :rid)',
              ConditionExpression: 'poolStatus = :q',
              ExpressionAttributeValues: { ':q': 'queued', ':rid': [reviewer.userId], ':empty': [] },
            },
          },
        ],
      }));
      reviewer.activeAssignmentId = assignment.assignmentId; // don't reuse in this run
      assigned += 1;
      await notify(reviewer.email, 'A product is waiting for your review',
        `You've been matched with a product to review on PeerReview.

Review it on its listing, then paste your review link back here:
${process.env.SITE_URL}/app/review

Every review you give earns one back. Due in 7 days.`);
    } catch {
      // conditional failure = raced with another matcher run; next pass retries
    }
  }

  /* ---- 3. Spend banked credits ----
     A credit couldn't enqueue at verify time if the product was already
     queued; once that slot is consumed, convert waiting credits to slots. */
  for (const u of users.filter(u => (u.creditBalance ?? 0) > 0)) {
    const { Items: prods = [] } = await client.send(new QueryCommand({
      TableName: process.env.PRODUCTS_TABLE,
      KeyConditionExpression: 'userId = :u',
      ExpressionAttributeValues: { ':u': u.userId },
    }));
    const target = prods.find(p => p.status === 'active' && p.poolStatus !== 'queued');
    if (!target) continue;
    try {
      await client.send(new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: process.env.PRODUCTS_TABLE,
              Key: { userId: target.userId, productId: target.productId },
              UpdateExpression: 'SET poolStatus = :q, enqueuedAt = :now',
              ConditionExpression: 'attribute_not_exists(poolStatus)',
              ExpressionAttributeValues: { ':q': 'queued', ':now': nowIso },
            },
          },
          {
            Update: {
              TableName: process.env.USERS_TABLE,
              Key: { userId: u.userId },
              UpdateExpression: 'ADD creditBalance :minus',
              ConditionExpression: 'creditBalance > :zero',
              ExpressionAttributeValues: { ':minus': -1, ':zero': 0 },
            },
          },
        ],
      }));
    } catch { /* raced — retry next run */ }
  }

  return { assigned, expired: active.filter(a => a.dueAt < nowIso).length };
};
