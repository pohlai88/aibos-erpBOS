import { pool } from '../../../lib/db';
import { postByRule } from '../../../lib/posting';
import { ok, created, unprocessable } from '../../../lib/http';
import { ensurePostingAllowed } from '../../../lib/policy';
import {
  requireAuth,
  enforceCompanyMatch,
  requireCapability,
} from '../../../lib/auth';
import { withRouteErrors, isResponse } from '../../../lib/route-utils';
import { computeRealizedFX } from '../../../lib/realized-fx';
import crypto from 'node:crypto';

type Body = {
  id?: string;
  company_id: string;
  party_id: string; // customer id
  doc_date: string; // ISO
  currency: string;
  amount: number;
  allocations?: Array<{ doctype: 'SalesInvoice'; id: string; amount: number }>;
};

export const POST = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, 'payments:post');
  if (isResponse(capCheck)) return capCheck;

  const b = (await req.json()) as Body;
  const id = b.id ?? crypto.randomUUID();

  const companyMatchResult = enforceCompanyMatch(auth, b.company_id);
  if (isResponse(companyMatchResult)) return companyMatchResult;

  const postingCheck = await ensurePostingAllowed(auth.company_id, b.doc_date);
  if (isResponse(postingCheck)) return postingCheck;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // idempotency
    const exist = await client.query(
      "select journal_id from payment where id=$1 and company_id=$2 and kind='AR'",
      [id, auth.company_id]
    );
    if (exist.rows.length) {
      await client.query('COMMIT');
      return ok(
        { payment_id: id, journal_id: exist.rows[0].journal_id },
        {
          'X-Idempotent-Replay': 'true',
          Location: `/api/payments/receive?id=${id}&company_id=${auth.company_id}`,
        }
      );
    }

    if (Number(b.amount) <= 0) {
      await client.query('ROLLBACK');
      return unprocessable('Amount must be > 0');
    }

    // insert payment shell
    await client.query(
      `insert into payment(id, company_id, kind, party_type, party_id, doc_date, currency, amount)
     values ($1,$2,'AR','Customer',$3,$4,$5,$6)`,
      [
        id,
        auth.company_id,
        b.party_id,
        b.doc_date,
        b.currency,
        b.amount.toFixed(2),
      ]
    );

    // optional allocations (partial/multi)
    if (b.allocations?.length) {
      for (const a of b.allocations) {
        await client.query(
          `insert into payment_allocation(id, payment_id, apply_doctype, apply_id, amount)
         values ($1,$2,$3,$4,$5)`,
          [crypto.randomUUID(), id, a.doctype, a.id, a.amount.toFixed(2)]
        );
      }
    }

    // GL posting (DR Bank / CR AR)
    const journalId = await postByRule(
      'CustomerPayment',
      id,
      b.currency,
      auth.company_id,
      {
        amount: { amount: b.amount.toFixed(2), currency: b.currency },
        party_id: b.party_id,
      }
    );

    // Compute and post realized FX if there are allocations
    if (b.allocations?.length) {
      try {
        const fxLines = await computeRealizedFX(
          id,
          b.doc_date,
          b.currency,
          b.amount,
          auth.company_id
        );

        if (fxLines.length > 0) {
          // Post additional FX lines to the same journal
          for (const fxLine of fxLines) {
            await client.query(
              `
                            insert into journal_line(id, journal_id, account_code, dc, amount, currency, base_amount, base_currency, txn_amount, txn_currency)
                            values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        `,
              [
                crypto.randomUUID(),
                journalId,
                fxLine.account_code,
                fxLine.dc,
                fxLine.amount.toFixed(2),
                fxLine.currency,
                fxLine.amount.toFixed(2),
                fxLine.currency,
                fxLine.amount.toFixed(2),
                fxLine.currency,
              ]
            );
          }
        }
      } catch (error) {
        console.warn('Realized FX computation failed:', error);
        // Continue without FX - don't fail the payment
      }
    }

    await client.query(`update payment set journal_id=$1 where id=$2`, [
      journalId,
      id,
    ]);
    await client.query('COMMIT');
    return created(
      { payment_id: id, journal_id: journalId },
      `/api/payments/receive?id=${id}&company_id=${auth.company_id}`
    );
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});

export const GET = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const url = new URL(req.url);
  const id = url.searchParams.get('id')!;
  const { rows } = await pool.query(
    'select * from payment where id=$1 and company_id=$2',
    [id, auth.company_id]
  );
  if (!rows.length) return new Response('Not found', { status: 404 });
  const alloc = await pool.query(
    'select apply_doctype, apply_id, amount from payment_allocation where payment_id=$1',
    [id]
  );
  return ok({ payment: rows[0], allocations: alloc.rows });
});

export const OPTIONS = withRouteErrors(async (req: Request) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
});
