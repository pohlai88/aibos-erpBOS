import * as crypto from 'node:crypto';
import { pool } from './db';
import { Capability, normalizeScopes } from './rbac';
import { rateLimitCheck, retryAfterSecs } from './ratelimit';
import { logLine } from './log';

export type AuthCtx = {
  user_id: string;
  company_id: string;
  role: 'admin' | 'accountant' | 'ops';
  scopes: Capability[];
  api_key_id?: string;
};

function sha256(x: string) {
  return crypto.createHash('sha256').update(x, 'utf8').digest('hex');
}

export async function requireAuth(req: Request): Promise<AuthCtx | Response> {
  const raw = req.headers.get('x-api-key');
  if (!raw)
    return new Response(
      JSON.stringify({ ok: false, message: 'Missing X-API-Key' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );

  const [id, secret] = raw.split(':');
  if (!id || !secret)
    return new Response(
      JSON.stringify({ ok: false, message: 'Invalid API key format' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );

  // rate limit per key id (even before DB lookup)
  if (!rateLimitCheck(id)) {
    const ra = retryAfterSecs(id);
    const headers = new Headers({
      'Retry-After': String(ra),
      'Content-Type': 'application/json',
    });
    return new Response(
      JSON.stringify({ ok: false, message: 'rate limited' }),
      { status: 429, headers }
    );
  }

  const { rows } = await pool.query(
    `select k.user_id, k.company_id, k.enabled, k.hash, k.scopes, k.prefix, m.role
       from api_key k
       join membership m on m.user_id = k.user_id and m.company_id = k.company_id
      where k.id = $1
      limit 1`,
    [id]
  );
  const k = rows[0];
  if (!k || k.enabled !== 'true')
    return new Response(
      JSON.stringify({ ok: false, message: 'API key disabled or not found' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  if (sha256(secret) !== k.hash)
    return new Response(
      JSON.stringify({ ok: false, message: 'Invalid API key secret' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );

  // touch last_used_at asynchronously (don't block path)
  pool
    .query(`update api_key set last_used_at = now() where id = $1`, [id])
    .catch(() => {});

  const role = (k.role as 'admin' | 'accountant' | 'ops') ?? 'ops';
  const reqScopes: string[] = Array.isArray(k.scopes) ? k.scopes : [];
  const scopes = normalizeScopes(role, reqScopes);

  return { user_id: k.user_id, company_id: k.company_id, role, scopes };
}

/** Ensure any provided company_id matches auth */
export function enforceCompanyMatch(
  auth: AuthCtx,
  provided?: string | null
): Response | void {
  if (!provided) return;
  if (provided !== auth.company_id) {
    return new Response(
      JSON.stringify({ ok: false, message: 'company_id mismatch' }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }
}

export function parseKeyIdFromHeader(req: Request): string | null {
  const raw = req.headers.get('x-api-key');
  if (!raw) return null;
  const [id] = raw.split(':');
  return id || null;
}

export function requireCapability(
  auth: AuthCtx,
  cap: Capability
): Response | void {
  if (!auth.scopes.includes(cap)) {
    return new Response(
      JSON.stringify({ ok: false, message: `forbidden: missing scope ${cap}` }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    );
  }
}
