import crypto from 'node:crypto';
import { pool } from '../../lib/db';
import { ok, created, unprocessable } from '../../lib/http';
import { requireAuth, requireCapability } from '../../lib/auth';
import { withRouteErrors, isResponse } from '../../lib/route-utils';

function newSecret() {
  return crypto.randomBytes(32).toString('base64url');
}

export const GET = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, 'keys:manage'); // reuse admin power for webhooks admin
  if (isResponse(capCheck)) return capCheck;

  const { rows } = await pool.query(
    `select id, url, topics, enabled, created_at, disabled_at, rotated_at
       from webhook where company_id=$1 order by created_at desc`,
    [auth.company_id]
  );
  return ok({ items: rows });
});

export const POST = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, 'keys:manage');
  if (isResponse(capCheck)) return capCheck;

  const b = (await req.json()) as {
    url: string;
    topics: string[];
    id?: string;
  };
  if (!b?.url || !Array.isArray(b.topics) || b.topics.length === 0)
    return unprocessable('url and topics required');

  const id = b.id ?? crypto.randomUUID();
  const secret = newSecret();

  await pool.query(
    `insert into webhook(id, company_id, url, secret, topics, enabled) values ($1,$2,$3,$4,$5,true)
     on conflict (id) do nothing`,
    [id, auth.company_id, b.url, secret, b.topics]
  );

  // show secret once
  return created(
    { id, url: b.url, topics: b.topics, secret },
    `/api/webhooks/${id}`
  );
});
