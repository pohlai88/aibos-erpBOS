import { pool } from "../../../lib/db";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { created, unprocessable } from "../../../lib/http";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";

export const POST = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, "periods:manage");
  if (isResponse(capCheck)) return capCheck;

  const b = await req.json() as { items: any[] };
  if (!Array.isArray(b.items) || !b.items.length) return unprocessable("items required");
  
  for (const it of b.items) {
    await pool.query(
      `insert into tax_code(id,name,kind,rate,rounding,precision)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (id) do update set name=excluded.name, kind=excluded.kind, rate=excluded.rate, rounding=excluded.rounding, precision=excluded.precision`,
      [it.id, it.name, it.kind ?? "both", it.rate ?? 0, it.rounding ?? "half_up", it.precision ?? 2]
    );
  }
  return created({ count: b.items.length }, "/api/tax/codes");
});
