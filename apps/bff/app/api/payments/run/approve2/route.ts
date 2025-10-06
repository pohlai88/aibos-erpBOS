// @api:nonstandard (CORS headers)
/* eslint-disable no-restricted-syntax */

import { NextRequest } from 'next/server';
import { RunApprove2 } from '@aibos/contracts';
import { approve2PayRun } from '@/services/payments/policy';
import { requireAuth } from '@/lib/auth';

// --- Payment Run Second Approval Routes (M23.1) ------------------------------
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const json = await req.json();
    const data = RunApprove2.parse(json);

    await approve2PayRun(auth.company_id, data, auth.user_id);

    return Response.json(
      {
        message:
          data.decision === 'approve'
            ? 'Payment run second approved successfully'
            : 'Payment run rejected',
      },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Error second approving payment run:', error);
    return Response.json(
      { error: 'Failed to second approve payment run' },
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
