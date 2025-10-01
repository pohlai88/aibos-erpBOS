import { SalesInvoice } from "@aibos/contracts/http/sales/sales-invoice.schema";
import { postSalesInvoice } from "@aibos/services/src/posting";
import { repo, tx } from "../../lib/db";
import { ensurePostingAllowed } from "../../lib/policy";
import { requireAuth, enforceCompanyMatch } from "../../lib/auth";

export async function POST(req: Request) {
  try {
    const auth = await requireAuth(req);
    const input = SalesInvoice.parse(await req.json());

    enforceCompanyMatch(auth, input.company_id);
    await ensurePostingAllowed(auth.company_id, input.doc_date);

    // Check for existing journal by idempotency key
    const rule = await import("@aibos/posting-rules").then(m => m.loadRule("sales-invoice"));
    const idParts = rule.idempotencyKey.map((k: string) =>
      k === "doctype" ? "SalesInvoice" :
        k === "id" ? input.id :
          k === "version" ? "v1" :
            (input as any)[k] ?? String((input as any)[k])
    );
    const key = idParts.join(":");

    const existingId = await repo.getIdByKey(key);
    if (existingId) {
      return Response.json({ journal_id: existingId }, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'X-Idempotent-Replay': 'true',
        }
      });
    }

    const journal = await postSalesInvoice({ ...input, company_id: auth.company_id }, { repo, tx });
    return Response.json({ journal_id: journal.id }, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error) {
    console.error("Sales invoice error:", error);
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
