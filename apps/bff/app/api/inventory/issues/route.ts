import { pool } from "../../../lib/db";
import { postByRule } from "../../../lib/posting";
import { created, ok, unprocessable } from "../../../lib/http";
import { ensurePostingAllowed } from "../../../lib/policy";
import { requireAuth, enforceCompanyMatch, requireCapability } from "../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";

type Body = { id?: string; company_id: string; item_id: string; qty: number; currency: string };

export const GET = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const url = new URL(req.url);
  const id = url.searchParams.get("id")!;
  const { rows } = await pool.query(
    `select * from stock_ledger where company_id=$1 and move_id=$2 and kind='out' limit 1`,
    [auth.company_id, id]
  );
  if (!rows.length) return new Response("Not found", { status: 404 });
  return ok({ ok: true, data: rows[0] });
});

export const POST = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, "inventory:move");
  if (isResponse(capCheck)) return capCheck;

  const b = await req.json() as Body;
  const id = b.id ?? crypto.randomUUID();

  const companyMatchResult = enforceCompanyMatch(auth, b.company_id);
  if (isResponse(companyMatchResult)) return companyMatchResult;

  const postingISO = new Date().toISOString();
  const postingCheck = await ensurePostingAllowed(auth.company_id, postingISO);
  if (isResponse(postingCheck)) return postingCheck;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // replay?
    const exist = await client.query(
      `select id, total_cost from stock_ledger where company_id=$1 and move_id=$2 and kind='out' limit 1`,
      [auth.company_id, id]
    );
    if (exist.rows.length) {
      await client.query("COMMIT");
      return ok({ ok: true, data: { move_id: id }, replay: true }, { "X-Idempotent-Replay": "true", "Location": `/api/inventory/issues?company_id=${auth.company_id}&id=${id}` });
    }

    // load cost state
    const s = await client.query(
      `select on_hand_qty::numeric as q, moving_avg_cost::numeric as mac, total_value::numeric as tv
       from item_costs where company_id=$1 and item_id=$2`,
      [auth.company_id, b.item_id]
    );
    const q0 = Number(s.rows[0]?.q ?? 0);
    const mac0 = Number(s.rows[0]?.mac ?? 0);
    if (Number(b.qty) <= 0) {
      await client.query("ROLLBACK");
      return unprocessable("Invalid qty");
    }
    if (q0 < Number(b.qty)) {
      await client.query("ROLLBACK");
      return unprocessable("Insufficient stock", { available: q0 });
    }

    const out_total = Number(b.qty) * mac0;
    const q1 = q0 - Number(b.qty);
    const tv1 = Number(s.rows[0]?.tv ?? 0) - out_total;
    const mac1 = q1 === 0 ? 0 : tv1 / q1;

    // 1) ledger
    const ledgerId = crypto.randomUUID();
    await client.query(
      `insert into stock_ledger(id, company_id, item_id, move_id, kind, qty, unit_cost, total_cost)
       values ($1,$2,$3,$4,'out',$5,$6,$7)`,
      [ledgerId, auth.company_id, b.item_id, id, b.qty, mac0.toFixed(6), out_total.toFixed(2)]
    );

    // 2) update item_costs
    await client.query(
      `update item_costs set on_hand_qty=$3, moving_avg_cost=$4, total_value=$5, updated_at=now()
       where company_id=$1 and item_id=$2`,
      [auth.company_id, b.item_id, q1.toFixed(6), mac1.toFixed(6), tv1.toFixed(2)]
    );

    // 3) GL posting (DR COGS / CR Inventory)
    const jid = await postByRule("StockIssue", id, b.currency, auth.company_id, {
      cost: { amount: out_total.toFixed(2), currency: b.currency }
    });

    await client.query("COMMIT");
    return created(
      { ok: true, data: { move_id: id, journal_id: jid, qty: b.qty, unit_cost: mac0.toFixed(6), total_cost: out_total.toFixed(2), on_hand_after: q1.toFixed(6), mac_after: mac1.toFixed(6) } },
      `/api/inventory/issues?company_id=${auth.company_id}&id=${id}`
    );
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
