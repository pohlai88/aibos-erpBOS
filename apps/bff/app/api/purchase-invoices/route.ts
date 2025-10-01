import { PurchaseInvoice } from "@aibos/contracts/http/purchase/purchase-invoice.schema";
import { postPurchaseInvoice } from "@aibos/services/src/posting-pi";
import { repo, tx } from "../../lib/db";
import { ok, created } from "../../lib/http";
import { ensurePostingAllowed } from "../../lib/policy";
import { requireAuth, enforceCompanyMatch } from "../../lib/auth";

export async function POST(req: Request) {
    try {
        const auth = await requireAuth(req);
        const input = PurchaseInvoice.parse(await req.json());

        enforceCompanyMatch(auth, input.company_id);
        await ensurePostingAllowed(auth.company_id, input.doc_date);

        // derive idempotency key like the service does (PurchaseInvoice:<id>:v1)
        const idemKey = `PurchaseInvoice:${input.id}:v1`;

        // quick existence probe
        const existing = await repo.getIdByKey(idemKey as any);
        if (existing) {
            return ok({ journal_id: existing }, {
                "X-Idempotent-Replay": "true",
                "Location": `/api/journals/${existing}`
            });
        }

        const journal = await postPurchaseInvoice({ ...input, company_id: auth.company_id }, { repo, tx });
        return created({ journal_id: journal.id }, `/api/journals/${journal.id}`);
    } catch (error) {
        console.error("Purchase invoice error:", error);
        // Re-throw Response objects from policy checks
        if (error instanceof Response) {
            throw error;
        }
        return Response.json({ error: "Invalid request data" }, {
            status: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    }
}

export async function OPTIONS(req: Request) {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
