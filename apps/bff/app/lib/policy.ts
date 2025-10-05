import { pool } from "./db";
import { assertOpenPeriod } from "../services/gl/periods";

/** Returns Response with 422/423 if posting forbidden, void if allowed */
export async function ensurePostingAllowed(company_id: string, postingISO: string): Promise<Response | void> {
    try {
        await assertOpenPeriod(company_id, new Date(postingISO));
        return; // Allowed
    } catch (error: any) {
        if (error.status === 423) {
            return new Response(JSON.stringify({ ok: false, message: error.message }), {
                status: 423,
                headers: { "content-type": "application/json" }
            });
        }
        // For other errors, fall back to legacy check
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
            return new Response(JSON.stringify({ ok: false, message: "No open period for posting date" }), { status: 422, headers: { "content-type": "application/json" } });
        }
        const p = rows[0];
        if (String(p.status).toUpperCase() !== "OPEN") {
            return new Response(JSON.stringify({ ok: false, message: "Period is closed/locked" }), { status: 423, headers: { "content-type": "application/json" } });
        }
    }
}
