import { pool } from "../../../../../lib/db";
import { ok } from "../../../../../lib/http";
import { requireAuth, requireCapability } from "../../../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../../../lib/route-utils";

export const GET = withRouteErrors(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, "audit:read");
    if (isResponse(capCheck)) return capCheck;

    const resolvedParams = await params;

    const { rows } = await pool.query(
        `select jl.account_code, jl.dc, jl.amount::numeric as amount, jl.currency, jl.party_type, jl.party_id
       from journal_line jl
       join journal j on j.id = jl.journal_id
      where jl.journal_id = $1 and j.company_id = $2
      order by jl.dc asc, jl.account_code asc`,
        [resolvedParams.id, auth.company_id]
    );
    return ok({ items: rows });
});
