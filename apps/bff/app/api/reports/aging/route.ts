// @api:nonstandard (CORS headers)

import { pool } from "../../../lib/db";
import { ok } from "../../../lib/http";

// Very simple ageing using journal lines by party + allocations; assumes
// sales invoices credit Sales & Output Tax and debit AR with party;
// purchase invoices debit Expense/Input Tax and credit AP with party;
// payments post with party as well, so net balance per party is computable.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const company_id = url.searchParams.get("company_id") ?? "COMP-1";
  const today = new Date();

  // We'll compute AR balances from journal lines tagged party_type='Customer'
  const sql = `
    with jl as (
      select j.posting_date::date as dt, jl.party_id, jl.party_type, jl.dc, jl.amount::numeric as amt
      from journal_line jl
      join journal j on j.id = jl.journal_id
      where j.company_id = $1 and jl.party_type in ('Customer','Supplier')
    ),
    ar as (
      select party_id,
             sum(case when dc='D' then amt else -amt end) as balance,
             max(dt) as last_tx
      from jl where party_type='Customer' group by party_id
    ),
    ap as (
      select party_id,
             sum(case when dc='D' then amt else -amt end) as balance,
             max(dt) as last_tx
      from jl where party_type='Supplier' group by party_id
    )
    select 'AR' as kind, party_id, balance, last_tx from ar where balance<>0
    union all
    select 'AP' as kind, party_id, balance, last_tx from ap where balance<>0
  `;
  const { rows } = await pool.query(sql, [company_id]);

  function bucket(dt: string) {
    const d = new Date(dt);
    const days = Math.floor((+today - +d) / (1000 * 60 * 60 * 24));
    if (days <= 30) return "0-30";
    if (days <= 60) return "31-60";
    if (days <= 90) return "61-90";
    return "90+";
  }

  const items = rows.map(r => ({
    kind: r.kind as "AR" | "AP",
    party_id: r.party_id as string,
    balance: Number(r.balance).toFixed(2),
    bucket: bucket(String(r.last_tx))
  }));

  // rollup
  const totals: Record<string, number> = {};
  for (const i of items) {
    const key = `${i.kind}:${i.bucket}`;
    totals[key] = (totals[key] ?? 0) + Number(i.balance);
  }

  return ok({ company_id, items, totals: Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, v.toFixed(2)])) });
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
