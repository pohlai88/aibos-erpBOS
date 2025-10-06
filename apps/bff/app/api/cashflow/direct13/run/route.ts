// @api:nonstandard (CORS headers)
/* eslint-disable no-restricted-syntax */

import { NextRequest } from 'next/server';
import { CfRunDirectReq } from '@aibos/contracts';
import { runDirect13WeekCashFlow } from '@/services/cashflow/cashflow';
import { requireAuth } from '@/lib/auth';

// --- Direct 13-Week Cash Flow Run Routes (M22) -------------------------------
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const json = await req.json();
    const data = CfRunDirectReq.parse(json);

    const result = await runDirect13WeekCashFlow(
      auth.company_id,
      data,
      auth.user_id
    );

    return Response.json(
      {
        result,
        message: data.dry_run
          ? 'Dry run completed successfully'
          : '13-week direct cash flow run completed successfully',
      },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Error running 13-week direct cash flow:', error);
    return Response.json(
      { error: 'Failed to run 13-week direct cash flow' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(_req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
