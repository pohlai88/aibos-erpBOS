import crypto from "node:crypto";
import { pool } from "../../../lib/db";
import { requireAuth } from "../../../lib/auth";
import { ok, created, unprocessable } from "../../../lib/http";

function sha256(x: string) { return crypto.createHash("sha256").update(x,"utf8").digest("hex"); }
function newKeyId() { return "ak_" + crypto.randomUUID().replace(/-/g,"").slice(0,24); }
function newSecret() { return crypto.randomBytes(24).toString("base64url"); }

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  const { rows } = await pool.query(
    `select id, name, enabled, created_at from api_key where user_id=$1 and company_id=$2 order by created_at desc`,
    [auth.user_id, auth.company_id]
  );
  return ok({ items: rows });
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  const b = await req.json() as { name: string };
  if (!b?.name) return unprocessable("name required");

  const id = newKeyId();
  const secret = newSecret();
  const hash = sha256(secret);

  await pool.query(
    `insert into api_key(id, user_id, company_id, name, hash, enabled) values ($1,$2,$3,$4,$5,'true')`,
    [id, auth.user_id, auth.company_id, b.name, hash]
  );

  // Show secret ONCE
  return created({ id, secret, name: b.name }, `/api/auth/keys/${id}`);
}
