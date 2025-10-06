// @api:nonstandard (CORS headers)
/* eslint-disable no-restricted-syntax */

import { NextRequest } from 'next/server';
import { IcProposalDecision } from '@aibos/contracts';
import { makeProposalDecision } from '@/services/consol/ic-workbench';
import { requireAuth } from '@/lib/auth';

// --- IC Proposal Decision Routes (M21.2) --------------------------------------
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const json = await req.json();
    const data = IcProposalDecision.parse(json);

    const decision = await makeProposalDecision(
      auth.company_id,
      data,
      auth.user_id
    );

    return Response.json(
      { decision },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Error making proposal decision:', error);
    return Response.json(
      { error: 'Failed to make proposal decision' },
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
