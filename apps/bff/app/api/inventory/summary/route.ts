import { pool } from "../../../lib/db";
import { ok } from "../../../lib/http";

export async function GET(_req: Request) {
    const url = new URL(_req.url);
    const company_id = url.searchParams.get("company_id") ?? "COMP-1";
    const item_id = url.searchParams.get("item_id") ?? "ITEM-1";
    const { rows } = await pool.query(
        `select on_hand_qty::numeric as q, moving_avg_cost::numeric as mac, total_value::numeric as tv, updated_at
     from item_costs where company_id=$1 and item_id=$2`,
        [company_id, item_id]
    );
    const r = rows[0] ?? { q: 0, mac: 0, tv: 0, updated_at: null };
    return ok({ company_id, item_id, on_hand_qty: Number(r.q).toFixed(6), moving_avg_cost: Number(r.mac).toFixed(6), total_value: Number(r.tv).toFixed(2), updated_at: r.updated_at });
}

export async function OPTIONS(_req: Request) {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}