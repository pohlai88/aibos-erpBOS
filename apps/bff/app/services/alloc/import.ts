import { pool } from '@/lib/db';
import { ulid } from 'ulid';
import { parseCsv } from '@/utils/csv';
import {
  AllocRuleUpsertType,
  AllocDriverUpsertType,
  AllocRuleUpsert,
  AllocDriverUpsert,
} from '@aibos/contracts';
import { upsertAllocRule, upsertAllocDriverValues } from './rules';

export interface CsvImportResult {
  auditId: string;
  rowsOk: number;
  rowsErr: number;
  errors: string[];
}

export async function importAllocRulesCsv(
  companyId: string,
  actor: string,
  csvContent: string,
  mapping: Record<string, string>,
  filename?: string
): Promise<CsvImportResult> {
  const auditId = ulid();
  const errors: string[] = [];
  let rowsOk = 0;
  let rowsErr = 0;

  try {
    const rows = parseCsv(csvContent);

    for (const [index, row] of Object.entries(rows)) {
      try {
        const ruleData: any = {};

        // Map CSV columns to rule fields
        for (const [csvCol, ruleField] of Object.entries(mapping)) {
          if (row[csvCol] !== undefined) {
            ruleData[ruleField] = row[csvCol];
          }
        }

        // Convert string values to appropriate types
        if (ruleData.active !== undefined) {
          ruleData.active =
            ruleData.active.toLowerCase() === 'true' || ruleData.active === '1';
        }
        if (ruleData.order_no !== undefined) {
          ruleData.order_no = parseInt(ruleData.order_no);
        }
        if (ruleData.rate_per_unit !== undefined) {
          ruleData.rate_per_unit = parseFloat(ruleData.rate_per_unit);
        }

        // Handle targets for PERCENT method
        if (
          ruleData.method === 'PERCENT' &&
          ruleData.target_cc &&
          ruleData.percent
        ) {
          ruleData.targets = [
            {
              target_cc: ruleData.target_cc,
              percent: parseFloat(ruleData.percent),
            },
          ];
          delete ruleData.target_cc;
          delete ruleData.percent;
        }

        // Validate and upsert rule
        const validatedRule = AllocRuleUpsert.parse(ruleData);
        await upsertAllocRule(companyId, actor, validatedRule);
        rowsOk++;
      } catch (error) {
        rowsErr++;
        errors.push(
          `Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  } catch (error) {
    rowsErr++;
    errors.push(
      `CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Record audit
  await pool.query(
    `
    INSERT INTO alloc_import_audit (
      id, company_id, kind, filename, rows_ok, rows_err, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `,
    [auditId, companyId, 'RULES', filename, rowsOk, rowsErr, actor]
  );

  return { auditId, rowsOk, rowsErr, errors };
}

export async function importAllocDriversCsv(
  companyId: string,
  actor: string,
  csvContent: string,
  mapping: Record<string, string>,
  driverCode: string,
  year: number,
  month: number,
  filename?: string
): Promise<CsvImportResult> {
  const auditId = ulid();
  const errors: string[] = [];
  let rowsOk = 0;
  let rowsErr = 0;

  try {
    const rows = parseCsv(csvContent);

    const driverRows: any[] = [];

    for (const [index, row] of Object.entries(rows)) {
      try {
        const driverData: any = {};

        // Map CSV columns to driver fields
        for (const [csvCol, driverField] of Object.entries(mapping)) {
          if (row[csvCol] !== undefined) {
            driverData[driverField] = row[csvCol];
          }
        }

        // Convert value to number
        if (driverData.value !== undefined) {
          driverData.value = parseFloat(driverData.value);
        }

        driverRows.push(driverData);
        rowsOk++;
      } catch (error) {
        rowsErr++;
        errors.push(
          `Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    if (driverRows.length > 0) {
      const driverUpsert: AllocDriverUpsertType = {
        driver_code: driverCode,
        year,
        month,
        rows: driverRows,
      };

      const validatedDriver = AllocDriverUpsert.parse(driverUpsert);
      await upsertAllocDriverValues(companyId, actor, validatedDriver);
    }
  } catch (error) {
    rowsErr++;
    errors.push(
      `CSV parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  // Record audit
  await pool.query(
    `
    INSERT INTO alloc_import_audit (
      id, company_id, kind, filename, rows_ok, rows_err, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `,
    [auditId, companyId, 'DRIVERS', filename, rowsOk, rowsErr, actor]
  );

  return { auditId, rowsOk, rowsErr, errors };
}
