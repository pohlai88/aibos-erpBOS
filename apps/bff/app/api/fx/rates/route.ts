import { pool } from "../../../lib/db";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { ok, created, unprocessable } from "../../../lib/http";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";
import crypto from "node:crypto";

export const POST = withRouteErrors(async (req: Request) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, "periods:manage"); // reuse admin-ish
    if (isResponse(capCheck)) return capCheck;

    const body = await req.json() as { items: { date: string; from: string; to: string; rate: number }[] };
    if (!Array.isArray(body.items) || body.items.length === 0) return unprocessable("items required");

    for (const it of body.items) {
        await pool.query(
            `insert into fx_rate(id, date, from_ccy, to_ccy, rate, source)
       values ($1,$2,$3,$4,$5,'manual')
       on conflict (id) do nothing`,
            [crypto.randomUUID(), it.date.slice(0, 10), it.from, it.to, it.rate]
        );
    }
    return created({ count: body.items.length }, "/api/fx/rates");
});
