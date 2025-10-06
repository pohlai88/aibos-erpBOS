// @api:nonstandard (CORS headers)
/* eslint-disable no-restricted-syntax */

import { NextRequest } from 'next/server';
import { SupplierPolicyAssign } from '@aibos/contracts';
import { assignSupplierPolicy } from '@/services/payments/policy';
import { requireAuth } from '@/lib/auth';

// --- Supplier Policy Assignment Routes (M23.1) --------------------------------
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const json = await req.json();
    const data = SupplierPolicyAssign.parse(json);

    const policy = await assignSupplierPolicy(auth.company_id, data);

    return Response.json(
      {
        policy,
        message: 'Supplier policy assigned successfully',
      },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Error assigning supplier policy:', error);
    return Response.json(
      { error: 'Failed to assign supplier policy' },
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
