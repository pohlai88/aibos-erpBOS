import { NextRequest } from "next/server";
import { trialBalance } from "@aibos/services/src/ledger";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const company_id = url.searchParams.get("company_id") ?? "COMP-1";
    const currency = url.searchParams.get("currency") ?? "MYR";
    const rows = await trialBalance(company_id, currency);

    // add control totals
    const totals = rows.reduce(
      (acc, r) => {
        acc.debit += Number(r.debit);
        acc.credit += Number(r.credit);
        return acc;
      },
      { debit: 0, credit: 0 }
    );

    return Response.json({
      company_id, 
      currency, 
      rows,
      control: { 
        debit: totals.debit.toFixed(2), 
        credit: totals.credit.toFixed(2) 
      }
    }, {
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
