import { pool } from "../../lib/db";
import { ok, created, unprocessable } from "../../lib/http";
import { requireAuth, enforceCompanyMatch, requireCapability } from "../../lib/auth";
import { withRouteErrors, isResponse } from "../../lib/route-utils";
import { setPeriodState, getPeriodState } from "../../services/gl/periods";

export const GET = withRouteErrors(async (req: Request) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const url = new URL(req.url);
    const year = url.searchParams.get("year");

    let sql = `SELECT year, month, state, updated_at, updated_by 
               FROM periods 
               WHERE company_id = $1`;
    const params: any[] = [auth.company_id];

    if (year) {
        sql += ` AND year = $2`;
        params.push(parseInt(year));
    }

    sql += ` ORDER BY year DESC, month DESC`;

    const { rows } = await pool.query(sql, params);
    return ok({ items: rows });
});

export const POST = withRouteErrors(async (req: Request) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, "periods:manage");
    if (isResponse(capCheck)) return capCheck;

    const b = await req.json() as {
        company_id: string;
        year: number;
        month: number;
        state: "open" | "pending_close" | "closed";
    };

    const companyMatchResult = enforceCompanyMatch(auth, b.company_id);
    if (isResponse(companyMatchResult)) return companyMatchResult;

    if (b.month < 1 || b.month > 12) {
        return unprocessable("month must be between 1 and 12");
    }

    await setPeriodState(auth.company_id, b.year, b.month, b.state, auth.user_id);

    return created({
        company_id: auth.company_id,
        year: b.year,
        month: b.month,
        state: b.state
    }, `/api/periods?company_id=${auth.company_id}&year=${b.year}`);
});
