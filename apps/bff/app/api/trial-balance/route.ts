import { NextRequest } from "next/server";
import { trialBalance } from "@aibos/services/src/ledger";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const company_id = url.searchParams.get("company_id") || "COMP-1";
    const currency = url.searchParams.get("currency") || "MYR";
    
    const tb = await trialBalance(company_id, currency);
    
    return Response.json({ trial_balance: tb }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error) {
    console.error("Trial balance error:", error);
    return Response.json({ error: "Internal server error" }, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
