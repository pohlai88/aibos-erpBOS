import crypto from 'node:crypto';
import { pool } from '../../../lib/db';
import { ok, unprocessable } from '../../../lib/http';
import { requireAuth, requireCapability } from '../../../lib/auth';
import { withRouteErrors, isResponse } from '../../../lib/route-utils';

function newSecret() {
  return crypto.randomBytes(32).toString('base64url');
}

export const PATCH = withRouteErrors(
  async (req: Request, context: { params: Promise<{ id: string }> }) => {
    const params = await context.params;
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, 'keys:manage');
    if (isResponse(capCheck)) return capCheck;

    const b = (await req.json()) as {
      enabled?: boolean;
      rotate_secret?: boolean;
      url?: string;
      topics?: string[];
    };
    const updates: string[] = [];
    const vals: any[] = [];
    let p = 0;

    if (typeof b.enabled === 'boolean') {
      updates.push(`enabled=$${++p}`);
      vals.push(b.enabled);
    }
    if (b.url) {
      updates.push(`url=$${++p}`);
      vals.push(b.url);
    }
    if (Array.isArray(b.topics)) {
      updates.push(`topics=$${++p}`);
      vals.push(b.topics);
    }

    let rotatedSecret: string | undefined;
    if (b.rotate_secret) {
      rotatedSecret = newSecret();
      updates.push(`secret=$${++p}, rotated_at=now()`);
      vals.push(rotatedSecret);
    }

    if (!updates.length) return unprocessable('no changes');
    vals.push(params.id, auth.company_id);

    const q = `update webhook set ${updates.join(', ')} where id=$${++p} and company_id=$${++p}`;
    await pool.query(q, vals);

    return ok({ id: params.id, rotated_secret: rotatedSecret });
  }
);
