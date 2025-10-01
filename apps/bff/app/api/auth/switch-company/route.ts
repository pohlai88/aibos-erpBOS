import { pool } from "../../../lib/db";
import { requireAuth } from "../../../lib/auth";
import { ok, unprocessable } from "../../../lib/http";

/** Creates a scoped API key for the requested company if user is a member. */
export async function POST(req: Request) {
  const auth = await requireAuth(req);
  const b = await req.json() as { company_id: string; name?: string };
  if (!b?.company_id) return unprocessable("company_id required");

  const mem = await pool.query(
    `select role from membership where user_id=$1 and company_id=$2 limit 1`,
    [auth.user_id, b.company_id]
  );
  if (!mem.rows.length) return new Response(JSON.stringify({ ok:false, message:"Not a member of company" }), { status: 403, headers: { "content-type":"application/json" }});

  // Issue a new key for that company
  const cryptoMod = await import("node:crypto");
  const id = "ak_" + cryptoMod.randomUUID().replace(/-/g,"").slice(0,24);
  const secret = cryptoMod.randomBytes(24).toString("base64url");
  const hash = cryptoMod.createHash("sha256").update(secret, "utf8").digest("hex");

  await pool.query(
    `insert into api_key(id, user_id, company_id, name, hash, enabled) values ($1,$2,$3,$4,$5,'true')`,
    [id, auth.user_id, b.company_id, b.name ?? "switched", hash]
  );
  return ok({ id, secret, company_id: b.company_id });
}
