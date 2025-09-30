import { SalesInvoice } from "@aibos/contracts/http/sales/sales-invoice.schema";
import { postSalesInvoice } from "@aibos/services/src/posting";
import { repo, tx } from "../../lib/db";

export async function POST(req: Request) {
  try {
    const input = SalesInvoice.parse(await req.json());
    const journal = await postSalesInvoice(input, { repo, tx });
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
