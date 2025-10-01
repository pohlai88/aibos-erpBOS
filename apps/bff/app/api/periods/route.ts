import { pool } from "../../lib/db";
import { ok, created, unprocessable } from "../../lib/http";
import { requireAuth, enforceCompanyMatch } from "../../lib/auth";

export async function GET(req: Request) {
    const auth = await requireAuth(req);
    const { rows } = await pool.query(
        `select id, code, start_date, end_date, status from accounting_period where company_id=$1 order by start_date desc`,
        [auth.company_id]
    );
    return ok({ items: rows });
}

export async function POST(req: Request) {
    const auth = await requireAuth(req);
    const b = await req.json() as {
        company_id: string;
        code: string;
        start_date: string; end_date: string;
        status: "OPEN" | "CLOSED";
    };

    enforceCompanyMatch(auth, b.company_id);

    if (new Date(b.start_date) > new Date(b.end_date)) {
        return unprocessable("start_date must be <= end_date");
    }

    const id = `PERIOD-${b.code}`;
    await pool.query(
        `insert into accounting_period(id, company_id, code, start_date, end_date, status)
     values ($1,$2,$3,$4,$5,$6)
     on conflict (id) do update set start_date=$4, end_date=$5, status=$6`,
        [id, auth.company_id, b.code, b.start_date, b.end_date, b.status]
    );
    return created({ id }, `/api/periods?company_id=${auth.company_id}`);
}
