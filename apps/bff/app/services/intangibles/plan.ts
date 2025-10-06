// M16.1: Intangible Plan Service
// Handles intangible plan import/upsert with idempotency

import { pool } from '../../lib/db';
import { ulid } from 'ulid';
import { createHash } from 'crypto';

export interface IntangiblePlanUpsertPayload {
  class: string;
  description: string;
  amount: number;
  currency: string;
  present_ccy: string;
  in_service: string;
  life_m: number;
  cost_center?: string | undefined;
  project?: string | undefined;
}

export interface IntangiblePlanResult {
  id: string;
  source_hash: string;
  created: boolean;
}

function generateSourceHash(
  companyId: string,
  payload: IntangiblePlanUpsertPayload
): string {
  const data = JSON.stringify({ companyId, payload });
  return createHash('sha256').update(data).digest('hex');
}

export async function upsertIntangiblePlan(
  companyId: string,
  actor: string,
  payload: IntangiblePlanUpsertPayload
): Promise<IntangiblePlanResult> {
  const sourceHash = generateSourceHash(companyId, payload);

  // Check if plan already exists with this source hash
  const existingResult = await pool.query(
    `SELECT id FROM intangible_plan WHERE company_id = $1 AND source_hash = $2 LIMIT 1`,
    [companyId, sourceHash]
  );

  if (existingResult.rows.length > 0) {
    return {
      id: existingResult.rows[0].id,
      source_hash: sourceHash,
      created: false,
    };
  }

  // Create new plan
  const id = ulid();
  await pool.query(
    `INSERT INTO intangible_plan (
      id, company_id, class, description, amount, currency, present_ccy,
      in_service, life_m, cost_center, project, source_hash, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [
      id,
      companyId,
      payload.class,
      payload.description,
      payload.amount,
      payload.currency,
      payload.present_ccy,
      payload.in_service,
      payload.life_m,
      payload.cost_center ?? null,
      payload.project ?? null,
      sourceHash,
      actor,
    ]
  );

  return {
    id,
    source_hash: sourceHash,
    created: true,
  };
}

export async function getIntangiblePlan(companyId: string, planId: string) {
  const result = await pool.query(
    `SELECT * FROM intangible_plan WHERE company_id = $1 AND id = $2 LIMIT 1`,
    [companyId, planId]
  );

  return result.rows[0] || null;
}

export async function listIntangiblePlans(
  companyId: string,
  limit: number = 100
) {
  const result = await pool.query(
    `SELECT * FROM intangible_plan WHERE company_id = $1 ORDER BY created_at LIMIT $2`,
    [companyId, limit]
  );

  return result.rows;
}
