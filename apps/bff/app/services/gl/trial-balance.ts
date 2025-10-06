import { pool } from '../../lib/db';

export interface TrialBalanceRow {
  account_code: string;
  currency: string;
  base_currency: string;
  balance_base: number;
  balance_src: number;
}

export async function getTrialBalances(
  companyId: string,
  options: {
    year: number;
    month: number;
    monetaryOnly?: boolean;
    groupByCurrency?: boolean;
    currency?: string;
  }
): Promise<TrialBalanceRow[]> {
  const baseCurrency = options.currency || 'MYR';

  // Get month-end date
  const monthEnd = new Date(Date.UTC(options.year, options.month, 0));
  const monthEndStr = monthEnd.toISOString().split('T')[0];

  let sql = `
    SELECT
      jl.account_code,
      jl.currency,
      jl.base_currency,
      SUM(CASE WHEN jl.dc = 'D' THEN 
        CASE 
          WHEN jl.base_amount IS NOT NULL AND jl.base_currency = $2 THEN jl.base_amount::numeric
          ELSE jl.amount::numeric 
        END
        ELSE 0 END) AS debit,
      SUM(CASE WHEN jl.dc = 'C' THEN 
        CASE 
          WHEN jl.base_amount IS NOT NULL AND jl.base_currency = $2 THEN jl.base_amount::numeric
          ELSE jl.amount::numeric 
        END
        ELSE 0 END) AS credit
    FROM journal_line jl
    JOIN journal j ON j.id = jl.journal_id
    WHERE j.company_id = $1
    AND j.posting_date <= $3
  `;

  if (options.monetaryOnly) {
    // Add filter for monetary accounts (cash, AR, AP, loans, etc.)
    sql += ` AND jl.account_code IN (
      SELECT code FROM account 
      WHERE company_id = $1 
      AND type IN ('asset', 'liability')
      AND (code LIKE '1%' OR code LIKE '2%')
    )`;
  }

  sql += `
    GROUP BY jl.account_code, jl.currency, jl.base_currency
    HAVING ABS(SUM(CASE WHEN jl.dc = 'D' THEN 
      CASE 
        WHEN jl.base_amount IS NOT NULL AND jl.base_currency = $2 THEN jl.base_amount::numeric
        ELSE jl.amount::numeric 
      END
      ELSE 0 END) - SUM(CASE WHEN jl.dc = 'C' THEN 
      CASE 
        WHEN jl.base_amount IS NOT NULL AND jl.base_currency = $2 THEN jl.base_amount::numeric
        ELSE jl.amount::numeric 
      END
      ELSE 0 END)) > 0.01
    ORDER BY jl.account_code, jl.currency;
  `;

  const { rows } = await pool.query(sql, [
    companyId,
    baseCurrency,
    monthEndStr,
  ]);

  return rows.map(r => {
    const debit = Number(r.debit ?? 0);
    const credit = Number(r.credit ?? 0);
    const balance = debit - credit;

    return {
      account_code: r.account_code as string,
      currency: r.currency as string,
      base_currency: r.base_currency as string,
      balance_base: balance,
      balance_src: balance, // For now, assume same as base - this would need currency conversion logic
    };
  });
}
