import { reverseJournal } from "../../../../lib/reversal";
import { ensurePostingAllowed } from "../../../../lib/policy";
import { ok, created } from "../../../../lib/http";
import { pool } from "../../../../lib/db";
import { requireAuth, enforceCompanyMatch } from "../../../../lib/auth";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
    const auth = await requireAuth(req);
    const params = await context.params;
    const url = new URL(req.url);
    const posting_date = url.searchParams.get("posting_date") ?? new Date().toISOString();

    await ensurePostingAllowed(auth.company_id, posting_date);

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
}
