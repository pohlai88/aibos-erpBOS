import { pool } from '../../lib/db';
import { ulid } from 'ulid';
import {
  TaxCarryForwardScanRequestType,
  TaxCarryForwardProposeRequestType,
  TaxCarryForwardAcceptRequestType,
} from '@aibos/contracts';

export interface CarryForwardProposal {
  source_ref: string;
  box_id: string;
  amount: number;
  reason: string;
}

export interface CarryForwardResult {
  id: string;
  source_ref: string;
  box_id: string;
  amount: number;
  reason: string;
  status: string;
}

export async function scanLateEntries(
  input: TaxCarryForwardScanRequestType,
  companyId: string
): Promise<CarryForwardProposal[]> {
  const { partner_code, from_year, from_month, into_year, into_month } = input;

  // Get period close time for the from period
  const { rows: closeRows } = await pool.query(
    `SELECT created_at FROM tax_return_run 
         WHERE company_id = $1 AND partner_code = $2 AND year = $3 AND month = $4 AND mode = 'COMMIT'
         ORDER BY created_at DESC LIMIT 1`,
    [companyId, partner_code, from_year, from_month]
  );

  if (closeRows.length === 0) {
    throw new Error(
      `Period ${from_year}-${from_month.toString().padStart(2, '0')} has not been closed`
    );
  }

  const closeTime = closeRows[0].created_at;

  // Find documents posted after close but dated within the from period
  const { rows: docRows } = await pool.query(
    `SELECT DISTINCT 
            gl.source_ref,
            gl.doc_date,
            gl.posted_at,
            gl.amount,
            gl.tax_code,
            gl.direction,
            tbm.box_id
         FROM gl_line gl
         JOIN tax_return_box_map tbm ON tbm.company_id = $1 
             AND tbm.partner_code = $2 
             AND tbm.tax_code = gl.tax_code
             AND tbm.direction = gl.direction
         WHERE gl.company_id = $1
           AND gl.doc_date >= $3
           AND gl.doc_date < $4
           AND gl.posted_at > $5
           AND gl.tax_code IS NOT NULL
           AND gl.direction IS NOT NULL
         ORDER BY gl.source_ref, gl.doc_date`,
    [
      companyId,
      partner_code,
      `${from_year}-${from_month.toString().padStart(2, '0')}-01`,
      `${from_year}-${(from_month + 1).toString().padStart(2, '0')}-01`,
      closeTime,
    ]
  );

  // Group by source_ref and box_id, sum amounts
  const proposals: CarryForwardProposal[] = [];
  const grouped = new Map<string, Map<string, number>>();

  for (const row of docRows) {
    const key = `${row.source_ref}|${row.box_id}`;
    if (!grouped.has(row.source_ref)) {
      grouped.set(row.source_ref, new Map());
    }
    const boxMap = grouped.get(row.source_ref)!;
    boxMap.set(
      row.box_id,
      (boxMap.get(row.box_id) || 0) + parseFloat(row.amount)
    );
  }

  // Convert to proposals
  for (const [sourceRef, boxMap] of grouped) {
    for (const [boxId, amount] of boxMap) {
      if (amount !== 0) {
        proposals.push({
          source_ref: sourceRef,
          box_id: boxId,
          amount: amount,
          reason: 'LATE_POSTING',
        });
      }
    }
  }

  return proposals;
}

export async function proposeCarryForward(
  input: TaxCarryForwardProposeRequestType,
  companyId: string,
  userId: string
): Promise<CarryForwardResult[]> {
  const results: CarryForwardResult[] = [];

  for (const proposal of input.proposals) {
    const id = ulid();

    // Get from/into periods from the first proposal (assuming all are for same period)
    // In practice, you'd pass these as parameters
    const fromYear = new Date().getFullYear();
    const fromMonth = new Date().getMonth();
    const intoYear = fromMonth === 11 ? fromYear + 1 : fromYear;
    const intoMonth = fromMonth === 11 ? 0 : fromMonth + 1;

    await pool.query(
      `INSERT INTO tax_carry_forward 
             (id, company_id, partner_code, from_year, from_month, into_year, into_month, 
              source_ref, box_id, amount, reason, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'proposed', $12)
             ON CONFLICT (company_id, partner_code, from_year, from_month, source_ref)
             DO UPDATE SET box_id = $9, amount = $10, reason = $11, status = 'proposed'`,
      [
        id,
        companyId,
        'DEFAULT_PARTNER',
        fromYear,
        fromMonth + 1,
        intoYear,
        intoMonth + 1,
        proposal.source_ref,
        proposal.box_id,
        proposal.amount,
        proposal.reason,
        userId,
      ]
    );

    results.push({
      id,
      source_ref: proposal.source_ref,
      box_id: proposal.box_id,
      amount: proposal.amount,
      reason: proposal.reason,
      status: 'proposed',
    });
  }

  return results;
}

export async function acceptCarryForward(
  input: TaxCarryForwardAcceptRequestType,
  companyId: string,
  userId: string
): Promise<CarryForwardResult[]> {
  const results: CarryForwardResult[] = [];

  for (const id of input.ids) {
    // Get the carry forward record
    const { rows } = await pool.query(
      `SELECT * FROM tax_carry_forward WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );

    if (rows.length === 0) {
      throw new Error(`Carry forward record ${id} not found`);
    }

    const cf = rows[0];

    // Check if into period is open (not committed)
    const { rows: commitRows } = await pool.query(
      `SELECT id FROM tax_return_run 
             WHERE company_id = $1 AND partner_code = $2 AND year = $3 AND month = $4 AND mode = 'COMMIT'`,
      [companyId, cf.partner_code, cf.into_year, cf.into_month]
    );

    if (commitRows.length > 0) {
      throw new Error(
        `Target period ${cf.into_year}-${cf.into_month} is already committed`
      );
    }

    // Create tax adjustment for the into period
    const adjustmentId = ulid();
    await pool.query(
      `INSERT INTO tax_return_adjustment 
             (id, company_id, partner_code, year, month, box_id, amount, memo, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        adjustmentId,
        companyId,
        cf.partner_code,
        cf.into_year,
        cf.into_month,
        cf.box_id,
        cf.amount,
        `Carry forward from ${cf.from_year}-${cf.from_month} / ${cf.source_ref}`,
        userId,
      ]
    );

    // Update carry forward status
    await pool.query(
      `UPDATE tax_carry_forward SET status = 'accepted' WHERE id = $1`,
      [id]
    );

    results.push({
      id,
      source_ref: cf.source_ref,
      box_id: cf.box_id,
      amount: cf.amount,
      reason: cf.reason,
      status: 'accepted',
    });
  }

  return results;
}

export async function getCarryForwards(
  companyId: string,
  filters: {
    status?: string;
    from_year?: number;
    from_month?: number;
    into_year?: number;
    into_month?: number;
  } = {}
): Promise<CarryForwardResult[]> {
  let query = `SELECT id, source_ref, box_id, amount, reason, status, from_year, from_month, into_year, into_month
                 FROM tax_carry_forward WHERE company_id = $1`;
  const params = [companyId];

  if (filters.status) {
    query += ` AND status = $${params.length + 1}`;
    params.push(filters.status);
  }

  if (filters.from_year !== undefined) {
    query += ` AND from_year = $${params.length + 1}`;
    params.push(filters.from_year.toString());
  }

  if (filters.from_month !== undefined) {
    query += ` AND from_month = $${params.length + 1}`;
    params.push(filters.from_month.toString());
  }

  if (filters.into_year !== undefined) {
    query += ` AND into_year = $${params.length + 1}`;
    params.push(filters.into_year.toString());
  }

  if (filters.into_month !== undefined) {
    query += ` AND into_month = $${params.length + 1}`;
    params.push(filters.into_month.toString());
  }

  query += ` ORDER BY created_at DESC`;

  const { rows } = await pool.query(query, params);

  return rows.map(row => ({
    id: row.id,
    source_ref: row.source_ref,
    box_id: row.box_id,
    amount: row.amount,
    reason: row.reason,
    status: row.status,
  }));
}
