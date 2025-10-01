import crypto from "node:crypto";
import { pool } from "./db";

export type AuthCtx = { user_id: string; company_id: string; role: "admin"|"member" };

function sha256(x: string) {
  return crypto.createHash("sha256").update(x, "utf8").digest("hex");
}

export async function requireAuth(req: Request): Promise<AuthCtx | Response> {
  const raw = req.headers.get("x-api-key");
  if (!raw) return new Response(JSON.stringify({ ok:false, message:"Missing X-API-Key" }), { status: 401, headers: { "content-type":"application/json" }});

  const [id, secret] = raw.split(":");
  if (!id || !secret) return new Response(JSON.stringify({ ok:false, message:"Invalid API key format" }), { status: 401, headers: { "content-type":"application/json" }});

  const { rows } = await pool.query(
    `select k.user_id, k.company_id, k.enabled, k.hash, m.role
       from api_key k
       join membership m on m.user_id = k.user_id and m.company_id = k.company_id
      where k.id = $1
      limit 1`,
    [id]
  );
  const k = rows[0];
  if (!k || k.enabled !== "true") return new Response(JSON.stringify({ ok:false, message:"API key disabled or not found" }), { status: 401, headers: { "content-type":"application/json" }});
  if (sha256(secret) !== k.hash) return new Response(JSON.stringify({ ok:false, message:"Invalid API key secret" }), { status: 401, headers: { "content-type":"application/json" }});

  return { user_id: k.user_id, company_id: k.company_id, role: (k.role as any) ?? "member" };
}

/** Ensure any provided company_id matches auth */
export function enforceCompanyMatch(auth: AuthCtx, provided?: string | null): Response | void {
  if (!provided) return;
  if (provided !== auth.company_id) {
    return new Response(JSON.stringify({ ok:false, message:"company_id mismatch" }), { status: 403, headers: { "content-type":"application/json" }});
  }
}
