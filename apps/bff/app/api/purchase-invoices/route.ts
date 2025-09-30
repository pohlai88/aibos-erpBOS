import { PurchaseInvoice } from "@aibos/contracts/http/purchase/purchase-invoice.schema";
import { postPurchaseInvoice } from "@aibos/services/src/posting-pi";
import { repo, tx } from "../../lib/db";

export async function POST(req: Request) {
    try {
        const input = PurchaseInvoice.parse(await req.json());
        const journal = await postPurchaseInvoice(input, { repo, tx });
        return Response.json({ journal_id: journal.id }, {
            status: 201,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    } catch (error) {
        console.error("Purchase invoice error:", error);
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
