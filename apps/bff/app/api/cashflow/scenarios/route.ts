// @api:nonstandard (CORS headers)
/* eslint-disable no-restricted-syntax */

import { NextRequest } from 'next/server';
import { CfScenarioUpsert } from '@aibos/contracts';
import { upsertCfScenario, getCfScenarios } from '@/services/cashflow/cashflow';
import { requireAuth } from '@/lib/auth';

// --- Cash Flow Scenarios Routes (M22) ----------------------------------------
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const scenarios = await getCfScenarios(auth.company_id);

    return Response.json(
      { scenarios },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Error fetching cash flow scenarios:', error);
    return Response.json(
      { error: 'Failed to fetch cash flow scenarios' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const json = await req.json();
    const data = CfScenarioUpsert.parse(json);

    const scenario = await upsertCfScenario(
      auth.company_id,
      data,
      auth.user_id
    );

    return Response.json(
      { scenario },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Error upserting cash flow scenario:', error);
    return Response.json(
      { error: 'Failed to upsert cash flow scenario' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(_req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
