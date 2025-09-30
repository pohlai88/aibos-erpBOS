import { NextRequest } from "next/server";
import { SalesInvoice } from "@aibos/contracts/http/sales/sales-invoice.schema";
import { postSalesInvoice } from "@aibos/services/src/posting";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const input = SalesInvoice.parse(json);
    const journal = await postSalesInvoice(input);
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
    return Response.json({ error: "Internal server error" }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }
}

export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
