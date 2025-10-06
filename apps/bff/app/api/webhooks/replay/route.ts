import { pool } from '../../../lib/db';
import { ok, unprocessable } from '../../../lib/http';
import { requireAuth, requireCapability } from '../../../lib/auth';
import { withRouteErrors, isResponse } from '../../../lib/route-utils';
import crypto from 'node:crypto';

export const POST = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, 'keys:manage');
  if (isResponse(capCheck)) return capCheck;

  const b = (await req.json()) as { event_id: string };
  if (!b?.event_id) return unprocessable('event_id required');

  // Load event (outbox)
  const ev = await pool.query(
    `select id, topic, payload, created_at from outbox where id=$1`,
    [b.event_id]
  );
  if (!ev.rows.length) return unprocessable('event not found');
  const event = ev.rows[0];

  // Fanout to webhooks for this company (no company_id on outbox; payload should contain company id, or we deliver to all hooks of the current company)
  const hooks = await pool.query(
    `select id, url, secret, topics from webhook where company_id=$1 and enabled=true`,
    [auth.company_id]
  );
  const rows = hooks.rows.filter((h: any) => h.topics.includes(event.topic));

  // Enqueue attempts
  for (const h of rows) {
    await pool.query(
      `insert into webhook_attempt(id, webhook_id, event_id, topic, payload, status)
       values ($1,$2,$3,$4,$5,'pending')`,
      [crypto.randomUUID(), h.id, event.id, event.topic, event.payload]
    );
  }
  return ok({ enqueued: rows.length });
});
