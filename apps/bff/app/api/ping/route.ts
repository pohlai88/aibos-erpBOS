import { NextRequest } from "next/server";
import { PingRequest, PingResponse } from "@aibos/contracts/http/ping.schema";
import { pingService } from "@aibos/services/src/ping";

export async function POST(req: NextRequest) {
  const json = await req.json();
  const input = PingRequest.parse(json);
  const out = await pingService(input.msg);
  return Response.json(PingResponse.parse(out), { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
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
