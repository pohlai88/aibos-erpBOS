import { pool } from "../../lib/db";
import { ok, created, unprocessable } from "../../lib/http";
import { requireAuth, enforceCompanyMatch, requireCapability } from "../../lib/auth";
import { withRouteErrors, isResponse } from "../../lib/route-utils";

export const GET = withRouteErrors(async (req: Request) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, "budgets:manage");
    if (isResponse(capCheck)) return capCheck;

    const url = new URL(req.url);
    const companyId = url.searchParams.get("company_id");
    const summary = url.searchParams.get("summary") === "true";

    if (!companyId) {
        return unprocessable("company_id parameter is required");
    }

    const companyMatchResult = enforceCompanyMatch(auth, companyId);
    if (isResponse(companyMatchResult)) return companyMatchResult;

    let sql = `select id, name, currency, locked, created_at from budget where company_id = $1 order by created_at desc`;
    const params = [companyId];

    if (summary) {
        sql = `
            select b.id, b.name, b.currency, b.locked, b.created_at,
                   count(bl.id) as line_count
            from budget b
            left join budget_line bl on b.id = bl.budget_id
            where b.company_id = $1
            group by b.id, b.name, b.currency, b.locked, b.created_at
            order by b.created_at desc
        `;
    }

    const { rows } = await pool.query(sql, params);
    return ok({ items: rows });
});

export const POST = withRouteErrors(async (req: Request) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, "budgets:manage");
    if (isResponse(capCheck)) return capCheck;

    const b = await req.json() as {
        id: string;
        company_id: string;
        name: string;
        currency: string;
    };

    if (!b.id || !b.company_id || !b.name || !b.currency) {
        return unprocessable("id, company_id, name, and currency are required");
    }

    const companyMatchResult = enforceCompanyMatch(auth, b.company_id);
    if (isResponse(companyMatchResult)) return companyMatchResult;

    // Check if budget already exists
    const existing = await pool.query(
        `select id from budget where id = $1`,
        [b.id]
    );

    if (existing.rows.length > 0) {
        // Update existing budget
        await pool.query(
            `update budget set name = $1, currency = $2 where id = $3`,
            [b.name, b.currency, b.id]
        );
        return ok({ id: b.id, message: "Budget updated" });
    } else {
        // Create new budget
        await pool.query(
            `insert into budget(id, company_id, name, currency, locked)
             values ($1, $2, $3, $4, false)`,
            [b.id, b.company_id, b.name, b.currency]
        );
        return created({ id: b.id }, `/api/budgets?id=${b.id}`);
    }
});
