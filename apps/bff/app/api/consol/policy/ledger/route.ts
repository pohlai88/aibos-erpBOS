// @api:nonstandard (CORS headers)
/* eslint-disable no-restricted-syntax */

import { NextRequest } from 'next/server';
import { ConsolLedgerOptionUpsert } from '@aibos/contracts';
import { upsertLedgerOption, getLedgerOption } from '@/services/consol/policy';
import { requireAuth } from '@/lib/auth';

// --- Ledger Option Routes (M21.1) --------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const option = await getLedgerOption(auth.company_id);

    return Response.json(
      { option },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Error fetching ledger option:', error);
    return Response.json(
      { error: 'Failed to fetch ledger option' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const json = await req.json();
    const data = ConsolLedgerOptionUpsert.parse(json);

    const option = await upsertLedgerOption(
      auth.company_id,
      data,
      auth.user_id
    );

    return Response.json(
      { option },
      {
        status: 200,
        headers: { 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error) {
    console.error('Error upserting ledger option:', error);
    return Response.json(
      { error: 'Failed to upsert ledger option' },
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
