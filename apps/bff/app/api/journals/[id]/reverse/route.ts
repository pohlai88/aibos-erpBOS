import { reverseJournal } from "../../../../lib/reversal";
import { ensurePostingAllowed } from "../../../../lib/policy";
import { ok, created } from "../../../../lib/http";
import { pool } from "../../../../lib/db";
import { requireAuth, enforceCompanyMatch } from "../../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../../lib/route-utils";

export const POST = withRouteErrors(async (req: Request, context: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const params = await context.params;
    const url = new URL(req.url);
    const posting_date = url.searchParams.get("posting_date") ?? new Date().toISOString();

    const postingCheck = await ensurePostingAllowed(auth.company_id, posting_date);
    if (isResponse(postingCheck)) return postingCheck;

    // sanity: journal must belong to company
    const chk = await pool.query(`select company_id from journal where id=$1`, [params.id]);
    if (!chk.rows.length) return new Response("Not found", { status: 404 });
    if (chk.rows[0].company_id !== auth.company_id) return new Response("Forbidden", { status: 403 });

    const reversalId = await reverseJournal(params.id, posting_date);
    const isReplay = reversalId === params.id; // not possible; we detect replays by idempotency key in reverseJournal

    return created(
        { reversal_id: reversalId, original_id: params.id },
        `/api/journals/${reversalId}`
    );
});
