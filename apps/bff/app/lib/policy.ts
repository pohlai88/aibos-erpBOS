import { pool } from "./db";

/** Throws Response with 422/423 if posting forbidden */
export async function ensurePostingAllowed(company_id: string, postingISO: string) {
    const { rows } = await pool.query(
        `select id, status, start_date, end_date
       from accounting_period
      where company_id=$1
        and start_date <= $2::timestamptz
        and end_date   >= $2::timestamptz
      order by start_date desc
      limit 1`,
        [company_id, postingISO]
    );
    if (!rows.length) {
        throw new Response(JSON.stringify({ ok: false, message: "No open period for posting date" }), { status: 422, headers: { "content-type": "application/json" } });
    }
    const p = rows[0];
    if (String(p.status).toUpperCase() !== "OPEN") {
        throw new Response(JSON.stringify({ ok: false, message: "Period is closed/locked" }), { status: 423, headers: { "content-type": "application/json" } });
    }
}
