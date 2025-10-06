import { pool } from '../../../lib/db';
import { created, ok, unprocessable } from '../../../lib/http';
import {
  requireAuth,
  enforceCompanyMatch,
  requireCapability,
} from '../../../lib/auth';
import { withRouteErrors, isResponse } from '../../../lib/route-utils';

type Body = {
  id?: string;
  company_id: string;
  item_id: string;
  qty: number;
  unit_cost: number;
  currency: string;
};

export const GET = withRouteErrors(async (req: Request) => {
  const url = new URL(req.url);
  const company_id = url.searchParams.get('company_id')!;
  const id = url.searchParams.get('id')!;
  const { rows } = await pool.query(
    `select * from stock_ledger where company_id=$1 and move_id=$2 and kind='in' limit 1`,
    [company_id, id]
  );
  if (!rows.length) return new Response('Not found', { status: 404 });
  return ok({ ok: true, data: rows[0] });
});

export const POST = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, 'inventory:move');
  if (isResponse(capCheck)) return capCheck;

  const b = (await req.json()) as Body;
  const id = b.id ?? crypto.randomUUID();

  const companyMatchResult = enforceCompanyMatch(auth, b.company_id);
  if (isResponse(companyMatchResult)) return companyMatchResult;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Idempotency check
    const exist = await client.query(
      `select id, move_id, total_cost, created_at from stock_ledger where company_id=$1 and move_id=$2 and kind='in' limit 1`,
      [b.company_id, id]
    );
    if (exist.rows.length) {
      await client.query('COMMIT');
      return ok(
        {
          ok: true,
          data: {
            move_id: id,
            company_id: b.company_id,
            item_id: b.item_id,
            qty: b.qty,
            unit_cost: b.unit_cost,
            currency: b.currency,
            total_cost: Number(b.qty) * Number(b.unit_cost),
            created_at: exist.rows[0].created_at,
          },
          replay: true,
        },
        {
          'X-Idempotent-Replay': 'true',
          Location: `/api/inventory/receipts?company_id=${b.company_id}&id=${id}`,
        }
      );
    }

    const qty = Number(b.qty);
    const ucost = Number(b.unit_cost);
    if (qty <= 0 || ucost < 0) {
      await client.query('ROLLBACK');
      return unprocessable('Invalid qty or unit_cost');
    }

    // read current cost state (or zero)
    const curr = await client.query(
      `select on_hand_qty::numeric as q, moving_avg_cost::numeric as mac, total_value::numeric as tv
       from item_costs where company_id=$1 and item_id=$2`,
      [b.company_id, b.item_id]
    );
    const q0 = Number(curr.rows[0]?.q ?? 0);
    const tv0 = Number(curr.rows[0]?.tv ?? 0);

    const in_total = qty * ucost;
    const q1 = q0 + qty;
    const tv1 = tv0 + in_total;
    const mac1 = q1 === 0 ? 0 : tv1 / q1;

    // 1) append ledger
    const ledgerId = crypto.randomUUID();
    await client.query(
      `insert into stock_ledger(id, company_id, item_id, move_id, kind, qty, unit_cost, total_cost)
       values ($1,$2,$3,$4,'in',$5,$6,$7)`,
      [ledgerId, b.company_id, b.item_id, id, qty, ucost, in_total.toFixed(2)]
    );

    // 2) upsert item_costs
    await client.query(
      `insert into item_costs(company_id, item_id, on_hand_qty, moving_avg_cost, total_value)
       values ($1,$2,$3,$4,$5)
       on conflict (company_id, item_id) do update
       set on_hand_qty = excluded.on_hand_qty,
           moving_avg_cost = excluded.moving_avg_cost,
           total_value = excluded.total_value,
           updated_at = now()`,
      [b.company_id, b.item_id, q1.toFixed(6), mac1.toFixed(6), tv1.toFixed(2)]
    );

    await client.query('COMMIT');
    return created(
      {
        ok: true,
        data: {
          move_id: id,
          journal_id: null,
          company_id: b.company_id,
          item_id: b.item_id,
          qty,
          unit_cost: ucost,
          total_cost: in_total.toFixed(2),
          currency: b.currency,
          on_hand_after: q1.toFixed(6),
          mac_after: mac1.toFixed(6),
        },
      },
      `/api/inventory/receipts?company_id=${b.company_id}&id=${id}`
    );
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

export const OPTIONS = withRouteErrors(async (req: Request) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
});
