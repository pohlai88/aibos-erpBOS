// M16.3: UI Draft Caching Service
// Handles preview cache for UI dry-run operations

import { pool } from '../../lib/db';
import { ulid } from 'ulid';
import { UiDraftCreate, UiDraftResponse } from '@aibos/contracts';

/**
 * Stores a UI draft with TTL
 */
export async function putDraft(
  companyId: string,
  kind: 'depr' | 'amort',
  year: number,
  month: number,
  payload: Record<string, any>,
  ttlSeconds: number = 900
): Promise<string> {
  const id = ulid();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await pool.query(
    `INSERT INTO assets_ui_draft (id, company_id, kind, year, month, payload, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (company_id, kind, year, month)
     DO UPDATE SET 
       id = EXCLUDED.id,
       payload = EXCLUDED.payload,
       expires_at = EXCLUDED.expires_at`,
    [id, companyId, kind, year, month, JSON.stringify(payload), expiresAt]
  );

  return id;
}

/**
 * Retrieves a valid UI draft
 */
export async function getDraft(
  companyId: string,
  kind: 'depr' | 'amort',
  year: number,
  month: number
): Promise<UiDraftResponse | null> {
  const result = await pool.query(
    `SELECT id, payload, expires_at
     FROM assets_ui_draft
     WHERE company_id = $1 AND kind = $2 AND year = $3 AND month = $4
     AND expires_at > NOW()`,
    [companyId, kind, year, month]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    company_id: companyId,
    kind,
    year,
    month,
    payload: JSON.parse(row.payload),
    expires_at: row.expires_at,
  };
}

/**
 * Deletes expired drafts
 */
export async function cleanupExpiredDrafts(): Promise<number> {
  const result = await pool.query(
    `DELETE FROM assets_ui_draft WHERE expires_at <= NOW()`
  );
  return result.rowCount || 0;
}

/**
 * Deletes a specific draft
 */
export async function deleteDraft(
  companyId: string,
  kind: 'depr' | 'amort',
  year: number,
  month: number
): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM assets_ui_draft
     WHERE company_id = $1 AND kind = $2 AND year = $3 AND month = $4`,
    [companyId, kind, year, month]
  );
  return (result.rowCount || 0) > 0;
}

/**
 * Lists all drafts for a company
 */
export async function listDrafts(companyId: string): Promise<
  Array<{
    id: string;
    kind: string;
    year: number;
    month: number;
    expires_at: string;
  }>
> {
  const result = await pool.query(
    `SELECT id, kind, year, month, expires_at
     FROM assets_ui_draft
     WHERE company_id = $1 AND expires_at > NOW()
     ORDER BY year DESC, month DESC`,
    [companyId]
  );

  return result.rows.map(row => ({
    id: row.id,
    kind: row.kind,
    year: row.year,
    month: row.month,
    expires_at: row.expires_at,
  }));
}

/**
 * Validates draft parameters
 */
export function validateDraftParams(
  kind: 'depr' | 'amort',
  year: number,
  month: number,
  ttlSeconds?: number
): { valid: boolean; error?: string } {
  if (!['depr', 'amort'].includes(kind)) {
    return { valid: false, error: 'Invalid kind' };
  }

  if (year < 1900 || year > 2100) {
    return { valid: false, error: 'Invalid year' };
  }

  if (month < 1 || month > 12) {
    return { valid: false, error: 'Invalid month' };
  }

  if (ttlSeconds && (ttlSeconds < 60 || ttlSeconds > 3600)) {
    return { valid: false, error: 'TTL must be between 60 and 3600 seconds' };
  }

  return { valid: true };
}

/**
 * Gets draft statistics
 */
export async function getDraftStats(companyId: string): Promise<{
  total_drafts: number;
  expired_drafts: number;
  oldest_draft: string | null;
  newest_draft: string | null;
}> {
  const totalResult = await pool.query(
    `SELECT COUNT(*) as count FROM assets_ui_draft WHERE company_id = $1`,
    [companyId]
  );

  const expiredResult = await pool.query(
    `SELECT COUNT(*) as count FROM assets_ui_draft 
     WHERE company_id = $1 AND expires_at <= NOW()`,
    [companyId]
  );

  const oldestResult = await pool.query(
    `SELECT MIN(expires_at) as oldest FROM assets_ui_draft 
     WHERE company_id = $1 AND expires_at > NOW()`,
    [companyId]
  );

  const newestResult = await pool.query(
    `SELECT MAX(expires_at) as newest FROM assets_ui_draft 
     WHERE company_id = $1 AND expires_at > NOW()`,
    [companyId]
  );

  return {
    total_drafts: Number(totalResult.rows[0].count),
    expired_drafts: Number(expiredResult.rows[0].count),
    oldest_draft: oldestResult.rows[0].oldest,
    newest_draft: newestResult.rows[0].newest,
  };
}
