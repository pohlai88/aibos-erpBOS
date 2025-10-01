import { pool } from "../../../lib/db";
import { ok, unprocessable } from "../../../lib/http";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";

/**
 * GET /api/audit/journals?from=ISO&to=ISO&account=Sales&party_id=CUST-1&source=SalesInvoice
 *   &min=10.00&max=500.00&limit=50&cursor=base64(posting_date,id)
 * Returns keyset-paginated list of journals with simple totals.
 */
export const GET = withRouteErrors(async (req: Request) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, "audit:read");
    if (isResponse(capCheck)) return capCheck;

    const u = new URL(req.url);

    const from = u.searchParams.get("from");
    const to = u.searchParams.get("to");
    const account = u.searchParams.get("account");
    const party_id = u.searchParams.get("party_id");
    const source = u.searchParams.get("source");
    const min = u.searchParams.get("min");
    const max = u.searchParams.get("max");
    const limit = Math.min(Number(u.searchParams.get("limit") ?? 50), 100);
    const cursor = u.searchParams.get("cursor"); // base64 "ts|id"

    let afterTs: string | null = null, afterId: string | null = null;
    if (cursor) {
        try {
            const [ts, id] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
            afterTs = ts || null; afterId = id || null;
        } catch { return unprocessable("bad cursor"); }
    }

    // Build dynamic filters
    const where: string[] = ["j.company_id = $1"];
    const params: any[] = [auth.company_id];
    let p = params.length;

    if (from) { where.push(`j.posting_date >= $${++p}`); params.push(from); }
    if (to) { where.push(`j.posting_date <= $${++p}`); params.push(to); }
    if (source) { where.push(`j.source_doctype = $${++p}`); params.push(source); }

    // If filters hit lines, we join journal_line with grouping later
    const joinLine = !!(account || party_id || min || max);

    // Keyset (after)
    if (afterTs && afterId) {
        where.push(`(j.posting_date < $${++p} OR (j.posting_date = $${p} AND j.id < $${++p}))`);
        params.push(afterTs, afterId);
    }

    const base = `
    select j.id, j.posting_date, j.source_doctype, j.source_id, j.currency
    , sum(case when jl.dc='D' then jl.amount::numeric else 0 end) as debit
    , sum(case when jl.dc='C' then jl.amount::numeric else 0 end) as credit
    from journal j
    join journal_line jl on jl.journal_id = j.id
    ${joinLine && account ? " and jl.account_code = $" + (p + 1) : ""}
    ${joinLine && party_id ? " and jl.party_id = $" + (p + (account ? 2 : 1)) : ""}
    where ${where.join(" and ")}
    group by j.id, j.posting_date, j.source_doctype, j.source_id, j.currency
    order by j.posting_date desc, j.id desc
    limit ${limit + 1}
  `;

    // Push joined filters' params in the right order
    if (account) params.push(account);
    if (party_id) params.push(party_id);

    // amount filter must be applied after aggregation
    const { rows } = await pool.query(base, params);
    const filtered = rows.filter(r => {
        const total = Number(r.debit) + Number(r.credit);
        if (min && total < Number(min)) return false;
        if (max && total > Number(max)) return false;
        return true;
    });

    const hasMore = filtered.length > limit;
    const slice = filtered.slice(0, limit);
    const next = hasMore && slice.length
        ? Buffer.from(`${slice[slice.length - 1].posting_date}|${slice[slice.length - 1].id}`).toString("base64url")
        : null;

    return ok({ items: slice, next });
});
