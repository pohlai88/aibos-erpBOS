import crypto from "node:crypto";
import { pool } from "../../../lib/db";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { ok, created, unprocessable } from "../../../lib/http";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";
import { normalizeScopes } from "../../../lib/rbac";

function sha256(x: string) { return crypto.createHash("sha256").update(x, "utf8").digest("hex"); }
function newKeyId() { return "ak_" + crypto.randomUUID().replace(/-/g, "").slice(0, 24); }
function newSecret() { return crypto.randomBytes(24).toString("base64url"); }

export const GET = withRouteErrors(async (req: Request) => {
  const authResult = await requireAuth(req);
  if (isResponse(authResult)) return authResult;

  const { rows } = await pool.query(
    `select id, name, enabled, created_at, scopes from api_key where user_id=$1 and company_id=$2 order by created_at desc`,
    [authResult.user_id, authResult.company_id]
  );
  return ok({ items: rows.map((r: any) => ({ id: r.id, name: r.name, enabled: r.enabled, created_at: r.created_at, scopes: r.scopes ?? [] })) });
});

export const POST = withRouteErrors(async (req: Request) => {
  const authResult = await requireAuth(req);
  if (isResponse(authResult)) return authResult;

  const b = await req.json() as { name: string; scopes?: string[] };
  if (!b?.name) return unprocessable("name required");

  // Only someone with keys:manage can create keys
  const capCheck = requireCapability(authResult, "keys:manage");
  if (isResponse(capCheck)) return capCheck;

  const id = newKeyId();
  const secret = newSecret();
  const hash = sha256(secret);

  // clamp requested scopes to role's caps
  const eff = normalizeScopes(authResult.role, b.scopes);

  // After auth + capability check:
  const creatorKeyId = (req.headers.get("x-api-key") || "").split(":")[0] || null;
  const prefix = "ak"; // or use "ak_live" / "ak_test" by env

  await pool.query(
    `insert into api_key(id, user_id, company_id, name, hash, enabled, scopes, created_by_key_id, prefix)
     values ($1,$2,$3,$4,$5,'true',$6,$7,$8)`,
    [id, authResult.user_id, authResult.company_id, b.name, hash, JSON.stringify(eff), creatorKeyId, prefix]
  );

  // Show secret ONCE
  return created({ id, secret, name: b.name, scopes: eff }, `/api/auth/keys/${id}`);
});