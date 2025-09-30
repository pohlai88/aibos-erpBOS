import { NextRequest } from "next/server";
import { getJournal } from "@aibos/services/src/ledger";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const journalId = url.searchParams.get("id");
    
    if (!journalId) {
      return Response.json({ error: "Journal ID required" }, { status: 400 });
    }
    
    const journal = await getJournal(journalId);
    
    if (!journal) {
      return Response.json({ error: "Journal not found" }, { status: 404 });
    }
    
    return Response.json({ journal }, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (error) {
    console.error("Get journal error:", error);
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
