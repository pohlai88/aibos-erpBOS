import { pool } from '../../lib/db';

type ParsedRow = {
  accountCode: string;
  year: number;
  month: number;
  amount: number;
  currency: string;
  costCenter?: string | undefined;
  project?: string | undefined;
};

export async function insertBudgetLinesTxn(
  companyId: string,
  sourceHash: string,
  sourceName: string,
  payload: any,
  parsedRows: ParsedRow[],
  apiKeyId: string,
  opts?: {
    accountResolver?: (code: string) => Promise<string | null>;
    versionId?: string; // M14.4: Target version for budget lines
  }
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const importId = `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Resolve account codes → account ids (batch if you have a table)
    const accountIdByCode = new Map<string, string>();
    if (opts?.accountResolver) {
      const codes = Array.from(new Set(parsedRows.map(r => r.accountCode)));
      const results = await Promise.all(
        codes.map(async c => [c, await opts.accountResolver!(c)] as const)
      );
      for (const [c, id] of results) if (id) accountIdByCode.set(c, id);
    }

    // Insert import meta
    await client.query(
      `INSERT INTO budget_import 
       (id, company_id, source_name, source_hash, mapping_json, delimiter, rows_total, rows_valid, rows_invalid, status, created_by_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        importId,
        companyId,
        sourceName,
        sourceHash,
        JSON.stringify(payload),
        ',',
        parsedRows.length,
        parsedRows.length,
        0,
        'committed',
        apiKeyId,
      ]
    );

    // Insert budget lines
    let insertedCount = 0;
    for (const r of parsedRows) {
      const periodMonth = `${r.year}-${r.month.toString().padStart(2, '0')}`;
      const budgetLineId = `bl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await client.query(
        `INSERT INTO budget_line 
         (id, budget_id, company_id, period_month, account_code, cost_center_id, project_id, amount_base, import_id, version_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          budgetLineId,
          r.year.toString(), // Use year as budget_id for now
          companyId,
          periodMonth,
          r.accountCode,
          r.costCenter || null,
          r.project || null,
          r.amount,
          importId,
          opts?.versionId || null, // M14.4: Include version ID
        ]
      );

      insertedCount++;
    }

    await client.query('COMMIT');

    return {
      importId,
      inserted: insertedCount,
      totals: {
        amount: Number(
          parsedRows
            .reduce((a, r) => a + r.amount, 0)
            .toFixed(payload.precision ?? 2)
        ),
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
