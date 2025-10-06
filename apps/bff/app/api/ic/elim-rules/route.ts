// @api:nonstandard (CORS headers)
/* eslint-disable no-restricted-syntax */

import { NextRequest } from 'next/server';
import {
  IcElimRuleUpsert,
  IcAutoMatchRequest,
  IcProposalDecision,
} from '@aibos/contracts';
import {
  upsertIcElimRule,
  getIcElimRules,
  generateAutoMatchProposals,
  getMatchProposals,
  makeProposalDecision,
} from '@/services/consol/ic-workbench';
import { requireAuth } from '@/lib/auth';

// --- IC Elimination Rules Routes (M21.2) --------------------------------------
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const rules = await getIcElimRules(auth.company_id);

    return Response.json(
      { rules },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Error fetching IC elimination rules:', error);
    return Response.json(
      { error: 'Failed to fetch IC elimination rules' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const json = await req.json();
    const data = IcElimRuleUpsert.parse(json);

    const rule = await upsertIcElimRule(auth.company_id, data, auth.user_id);

    return Response.json(
      { rule },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Error upserting IC elimination rule:', error);
    return Response.json(
      { error: 'Failed to upsert IC elimination rule' },
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
