// M14.3: Budget Import API Route
import { ok, badRequest, forbidden, unprocessable } from '../../../lib/http';
import { requireAuth, requireCapability } from '../../../lib/auth';
import { withRouteErrors, isResponse } from '../../../lib/route-utils';
import { pool } from '../../../lib/db';
import { resolveDimensionsForRows } from '../../../services/budgets/validateDimensions';
import { insertBudgetLinesTxn } from '../../../services/budgets/insert';
import {
  parseCsvStream,
  normalizeMonth,
  normalizeAmount,
} from '../../../lib/csv-parser';
import { createHash } from 'crypto';

// Inline types for now to avoid module resolution issues
interface BudgetImportMapping {
  account_code: string;
  month: string;
  amount: string;
  cost_center?: string;
  project?: string;
}

interface BudgetImportDefaults {
  currency: string;
  year: number;
}

interface BudgetImportRequest {
  mapping: BudgetImportMapping;
  defaults: BudgetImportDefaults;
  precision: number;
}

interface BudgetImportError {
  row: number;
  issues: string[];
}

interface BudgetImportSummary {
  importId: string;
  source_name: string;
  rows_total: number;
  rows_valid: number;
  rows_invalid: number;
  status: 'pending' | 'dry_run_ok' | 'committed' | 'failed';
  errors?: BudgetImportError[];
}

export const POST = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth;

  const capCheck = requireCapability(auth, 'budgets:manage');
  if (isResponse(capCheck)) return capCheck;

  const form = await req.formData();
  const file = form.get('file');
  const json = form.get('json');

  if (!(file instanceof File) || typeof json !== 'string') {
    return badRequest('Expected multipart file and json');
  }

  // Parse and validate request
  let payload: BudgetImportRequest;
  try {
    const parsed = JSON.parse(json);

    // Basic validation
    if (!parsed.mapping || !parsed.defaults) {
      throw new Error('Missing required fields: mapping and defaults');
    }

    if (
      !parsed.mapping.account_code ||
      !parsed.mapping.month ||
      !parsed.mapping.amount
    ) {
      throw new Error(
        'Missing required mapping fields: account_code, month, amount'
      );
    }

    if (!parsed.defaults.currency || !parsed.defaults.year) {
      throw new Error('Missing required defaults: currency, year');
    }

    payload = {
      mapping: {
        account_code: parsed.mapping.account_code,
        month: parsed.mapping.month,
        amount: parsed.mapping.amount,
        cost_center: parsed.mapping.cost_center,
        project: parsed.mapping.project,
      },
      defaults: {
        currency: parsed.defaults.currency,
        year: parsed.defaults.year,
      },
      precision: parsed.precision || 2,
    };
  } catch (error) {
    return unprocessable('Invalid request format', error);
  }

  // Generate source hash for idempotency
  const bytes = new Uint8Array(await file.arrayBuffer());
  const sourceHash = createHash('sha256')
    .update(bytes)
    .update(json)
    .digest('hex');

  // Check for existing import (idempotency)
  const existingCheck = await pool.query(
    `SELECT id, status, rows_total, rows_valid, rows_invalid, error_report 
             FROM budget_import 
             WHERE company_id = $1 AND source_hash = $2`,
    [auth.company_id, sourceHash]
  );

  if (existingCheck.rows.length > 0) {
    const existing = existingCheck.rows[0];
    return ok(
      {
        summary: {
          importId: existing.id,
          source_name: file.name,
          rows_total: existing.rows_total,
          rows_valid: existing.rows_valid,
          rows_invalid: existing.rows_invalid,
          status: existing.status,
          errors: existing.error_report || [],
        },
      },
      { 'X-Idempotent-Replay': 'true' }
    );
  }

  // Parse CSV
  const parseResult = await parseCsvStream(bytes, payload);

  // Validate dimensions for parsed rows
  const dimRes = await resolveDimensionsForRows(
    auth.company_id,
    parseResult.rows.map(r => ({
      costCenter: r.cost_center || undefined,
      project: r.project || undefined,
    }))
  );

  // Add dimension validation errors
  let anyDimIssues = false;
  for (let i = 0; i < parseResult.rows.length; i++) {
    const r = parseResult.rows[i];
    const res = dimRes[i];
    if (res && res.issues.length) {
      anyDimIssues = true;
      parseResult.errors.push({ row: i + 2, issues: res.issues }); // +2 for 1-based + header
    } else if (res) {
      // Update the row with resolved dimension IDs
      (r as any).costCenterId = res.costCenterId ?? null;
      (r as any).projectId = res.projectId ?? null;
    }
  }

  // Update validation counts
  const totalErrors = parseResult.errors.length;
  const validRows = parseResult.rows.length - totalErrors;

  const url = new URL(req.url);
  const isDryRun = url.searchParams.get('dry_run') === 'true';
  const versionCode = url.searchParams.get('version'); // M14.4: Target version for import

  // M14.4: Resolve version if specified
  let targetVersionId: string | null = null;
  if (versionCode) {
    const versionResult = await pool.query(
      `SELECT id, status FROM budget_version WHERE company_id = $1 AND code = $2`,
      [auth.company_id, versionCode]
    );

    if (versionResult.rows.length === 0) {
      return badRequest(`Budget version '${versionCode}' not found`);
    }

    const version = versionResult.rows[0];
    if (version.status !== 'draft') {
      return badRequest(
        `Cannot import to version '${versionCode}' in ${version.status} status. Must be draft.`
      );
    }

    targetVersionId = version.id;
  }

  if (isDryRun) {
    // Record dry-run metadata
    const importId = `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await pool.query(
      `INSERT INTO budget_import 
                 (id, company_id, source_name, source_hash, mapping_json, rows_total, rows_valid, rows_invalid, status, error_report, created_by_key)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        importId,
        auth.company_id,
        file.name,
        sourceHash,
        JSON.stringify(payload),
        parseResult.meta.rows_total,
        validRows,
        totalErrors,
        totalErrors > 0 ? 'pending' : 'dry_run_ok',
        totalErrors > 0 ? JSON.stringify(parseResult.errors) : null,
        auth.user_id,
      ]
    );

    return ok({
      summary: {
        importId,
        source_name: file.name,
        rows_total: parseResult.meta.rows_total,
        rows_valid: validRows,
        rows_invalid: totalErrors,
        status: totalErrors > 0 ? 'pending' : 'dry_run_ok',
        errors: parseResult.errors,
      },
    });
  }

  // Commit phase - validate no errors
  if (totalErrors > 0) {
    return badRequest(
      'Cannot commit with validation errors',
      parseResult.errors
    );
  }

  // Use the new insert service
  const res = await insertBudgetLinesTxn(
    auth.company_id,
    sourceHash,
    file.name,
    payload,
    parseResult.rows.map(r => ({
      accountCode: r.account_code,
      year: payload.defaults.year,
      month: parseInt(
        normalizeMonth(r.month, payload.defaults.year).split('-')[1] || '1'
      ),
      amount: normalizeAmount(r.amount, payload.precision),
      currency: payload.defaults.currency,
      costCenter: r.cost_center || undefined,
      project: r.project || undefined,
    })),
    auth.user_id,
    targetVersionId ? { versionId: targetVersionId } : {} // M14.4: Pass version ID to insert service
  );

  return ok({
    summary: {
      importId: res.importId,
      source_name: file.name,
      rows_total: parseResult.meta.rows_total,
      rows_valid: validRows,
      rows_invalid: totalErrors,
      status: 'committed',
    },
  });
});
