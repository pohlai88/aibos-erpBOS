// @api:nonstandard (CORS headers)
/* eslint-disable no-restricted-syntax */

import { NextRequest } from 'next/server';
import { PayRunApprove } from '@aibos/contracts';
import { approvePayRun } from '@/services/payments/payments';
import { requireAuth } from '@/lib/auth';

// --- Payment Run Approval Routes (M23) ---------------------------------------
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const json = await req.json();
    const data = PayRunApprove.parse(json);

    const run = await approvePayRun(auth.company_id, data, auth.user_id);

    return Response.json(
      {
        run,
        message: 'Payment run approved successfully',
      },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Error approving payment run:', error);
    return Response.json(
      { error: 'Failed to approve payment run' },
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
