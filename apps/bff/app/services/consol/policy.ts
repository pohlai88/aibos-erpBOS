import { pool } from '@/lib/db';
import {
  ConsolRatePolicyUpsertType,
  ConsolRateOverrideUpsertType,
  ConsolCtaPolicyUpsertType,
  ConsolNciMapUpsertType,
  ConsolLedgerOptionUpsertType,
} from '@aibos/contracts';

// --- Policy Management Interfaces (M21.1) -----------------------------------
export interface ConsolRatePolicy {
  companyId: string;
  class: string;
  method: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ConsolRateOverride {
  companyId: string;
  account: string;
  method: string;
  note?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ConsolCtaPolicy {
  companyId: string;
  ctaAccount: string;
  reAccount: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ConsolNciMap {
  companyId: string;
  nciEquityAccount: string;
  nciNiAccount: string;
  updatedAt: string;
  updatedBy: string;
}

export interface ConsolLedgerOption {
  companyId: string;
  enabled: boolean;
  ledgerEntity?: string;
  summaryAccount?: string;
  updatedAt: string;
  updatedBy: string;
}

// --- Rate Policy Management (M21.1) -------------------------------------------
export async function upsertRatePolicy(
  companyId: string,
  data: ConsolRatePolicyUpsertType,
  updatedBy: string
): Promise<ConsolRatePolicy> {
  await pool.query(
    `
        INSERT INTO consol_rate_policy (company_id, class, method, updated_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (company_id, class) 
        DO UPDATE SET method = $3, updated_by = $4, updated_at = now()
    `,
    [companyId, data.class, data.method, updatedBy]
  );

  const result = await pool.query(
    `
        SELECT class, method, updated_at, updated_by
        FROM consol_rate_policy
        WHERE company_id = $1 AND class = $2
    `,
    [companyId, data.class]
  );

  return {
    companyId,
    class: result.rows[0].class,
    method: result.rows[0].method,
    updatedAt: result.rows[0].updated_at.toISOString(),
    updatedBy: result.rows[0].updated_by,
  };
}

export async function getRatePolicies(
  companyId: string
): Promise<ConsolRatePolicy[]> {
  const result = await pool.query(
    `
        SELECT class, method, updated_at, updated_by
        FROM consol_rate_policy
        WHERE company_id = $1
        ORDER BY class
    `,
    [companyId]
  );

  return result.rows.map(row => ({
    companyId,
    class: row.class,
    method: row.method,
    updatedAt: row.updated_at.toISOString(),
    updatedBy: row.updated_by,
  }));
}

export async function upsertRateOverride(
  companyId: string,
  data: ConsolRateOverrideUpsertType,
  updatedBy: string
): Promise<ConsolRateOverride> {
  await pool.query(
    `
        INSERT INTO consol_rate_override (company_id, account, method, note, updated_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (company_id, account) 
        DO UPDATE SET method = $3, note = $4, updated_by = $5, updated_at = now()
    `,
    [companyId, data.account, data.method, data.note, updatedBy]
  );

  const result = await pool.query(
    `
        SELECT account, method, note, updated_at, updated_by
        FROM consol_rate_override
        WHERE company_id = $1 AND account = $2
    `,
    [companyId, data.account]
  );

  return {
    companyId,
    account: result.rows[0].account,
    method: result.rows[0].method,
    note: result.rows[0].note,
    updatedAt: result.rows[0].updated_at.toISOString(),
    updatedBy: result.rows[0].updated_by,
  };
}

export async function getRateOverrides(
  companyId: string
): Promise<ConsolRateOverride[]> {
  const result = await pool.query(
    `
        SELECT account, method, note, updated_at, updated_by
        FROM consol_rate_override
        WHERE company_id = $1
        ORDER BY account
    `,
    [companyId]
  );

  return result.rows.map(row => ({
    companyId,
    account: row.account,
    method: row.method,
    note: row.note,
    updatedAt: row.updated_at.toISOString(),
    updatedBy: row.updated_by,
  }));
}

// --- CTA Policy Management (M21.1) -------------------------------------------
export async function upsertCtaPolicy(
  companyId: string,
  data: ConsolCtaPolicyUpsertType,
  updatedBy: string
): Promise<ConsolCtaPolicy> {
  await pool.query(
    `
        INSERT INTO consol_cta_policy (company_id, cta_account, re_account, updated_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (company_id) 
        DO UPDATE SET cta_account = $2, re_account = $3, updated_by = $4, updated_at = now()
    `,
    [companyId, data.cta_account, data.re_account, updatedBy]
  );

  const result = await pool.query(
    `
        SELECT cta_account, re_account, updated_at, updated_by
        FROM consol_cta_policy
        WHERE company_id = $1
    `,
    [companyId]
  );

  return {
    companyId,
    ctaAccount: result.rows[0].cta_account,
    reAccount: result.rows[0].re_account,
    updatedAt: result.rows[0].updated_at.toISOString(),
    updatedBy: result.rows[0].updated_by,
  };
}

export async function getCtaPolicy(
  companyId: string
): Promise<ConsolCtaPolicy | null> {
  const result = await pool.query(
    `
        SELECT cta_account, re_account, updated_at, updated_by
        FROM consol_cta_policy
        WHERE company_id = $1
    `,
    [companyId]
  );

  if (result.rows.length === 0) return null;

  return {
    companyId,
    ctaAccount: result.rows[0].cta_account,
    reAccount: result.rows[0].re_account,
    updatedAt: result.rows[0].updated_at.toISOString(),
    updatedBy: result.rows[0].updated_by,
  };
}

// --- NCI Map Management (M21.1) -----------------------------------------------
export async function upsertNciMap(
  companyId: string,
  data: ConsolNciMapUpsertType,
  updatedBy: string
): Promise<ConsolNciMap> {
  await pool.query(
    `
        INSERT INTO consol_nci_map (company_id, nci_equity_account, nci_ni_account, updated_by)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (company_id) 
        DO UPDATE SET nci_equity_account = $2, nci_ni_account = $3, updated_by = $4, updated_at = now()
    `,
    [companyId, data.nci_equity_account, data.nci_ni_account, updatedBy]
  );

  const result = await pool.query(
    `
        SELECT nci_equity_account, nci_ni_account, updated_at, updated_by
        FROM consol_nci_map
        WHERE company_id = $1
    `,
    [companyId]
  );

  return {
    companyId,
    nciEquityAccount: result.rows[0].nci_equity_account,
    nciNiAccount: result.rows[0].nci_ni_account,
    updatedAt: result.rows[0].updated_at.toISOString(),
    updatedBy: result.rows[0].updated_by,
  };
}

export async function getNciMap(
  companyId: string
): Promise<ConsolNciMap | null> {
  const result = await pool.query(
    `
        SELECT nci_equity_account, nci_ni_account, updated_at, updated_by
        FROM consol_nci_map
        WHERE company_id = $1
    `,
    [companyId]
  );

  if (result.rows.length === 0) return null;

  return {
    companyId,
    nciEquityAccount: result.rows[0].nci_equity_account,
    nciNiAccount: result.rows[0].nci_ni_account,
    updatedAt: result.rows[0].updated_at.toISOString(),
    updatedBy: result.rows[0].updated_by,
  };
}

// --- Ledger Option Management (M21.1) -----------------------------------------
export async function upsertLedgerOption(
  companyId: string,
  data: ConsolLedgerOptionUpsertType,
  updatedBy: string
): Promise<ConsolLedgerOption> {
  await pool.query(
    `
        INSERT INTO consol_ledger_option (company_id, enabled, ledger_entity, summary_account, updated_by)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (company_id) 
        DO UPDATE SET enabled = $2, ledger_entity = $3, summary_account = $4, updated_by = $5, updated_at = now()
    `,
    [
      companyId,
      data.enabled,
      data.ledger_entity,
      data.summary_account,
      updatedBy,
    ]
  );

  const result = await pool.query(
    `
        SELECT enabled, ledger_entity, summary_account, updated_at, updated_by
        FROM consol_ledger_option
        WHERE company_id = $1
    `,
    [companyId]
  );

  return {
    companyId,
    enabled: result.rows[0].enabled,
    ledgerEntity: result.rows[0].ledger_entity,
    summaryAccount: result.rows[0].summary_account,
    updatedAt: result.rows[0].updated_at.toISOString(),
    updatedBy: result.rows[0].updated_by,
  };
}

export async function getLedgerOption(
  companyId: string
): Promise<ConsolLedgerOption | null> {
  const result = await pool.query(
    `
        SELECT enabled, ledger_entity, summary_account, updated_at, updated_by
        FROM consol_ledger_option
        WHERE company_id = $1
    `,
    [companyId]
  );

  if (result.rows.length === 0) return null;

  return {
    companyId,
    enabled: result.rows[0].enabled,
    ledgerEntity: result.rows[0].ledger_entity,
    summaryAccount: result.rows[0].summary_account,
    updatedAt: result.rows[0].updated_at.toISOString(),
    updatedBy: result.rows[0].updated_by,
  };
}

// --- Policy Resolution Engine (M21.1) -----------------------------------------
export async function resolveTranslationMethod(
  companyId: string,
  accountCode: string
): Promise<string> {
  // First check for account-specific override
  const overrideResult = await pool.query(
    `
        SELECT method FROM consol_rate_override
        WHERE company_id = $1 AND account = $2
    `,
    [companyId, accountCode]
  );

  if (overrideResult.rows.length > 0) {
    return overrideResult.rows[0].method;
  }

  // Then check account class policy
  const accountResult = await pool.query(
    `
        SELECT a.class FROM account a
        WHERE a.company_id = $1 AND a.code = $2
    `,
    [companyId, accountCode]
  );

  if (accountResult.rows.length > 0 && accountResult.rows[0].class) {
    const classResult = await pool.query(
      `
            SELECT method FROM consol_rate_policy
            WHERE company_id = $1 AND class = $2
        `,
      [companyId, accountResult.rows[0].class]
    );

    if (classResult.rows.length > 0) {
      return classResult.rows[0].method;
    }
  }

  // Default to CLOSING if no policy found
  return 'CLOSING';
}

export async function getDefaultRatePolicies(): Promise<ConsolRatePolicy[]> {
  return [
    {
      companyId: '',
      class: 'ASSET',
      method: 'CLOSING',
      updatedAt: '',
      updatedBy: '',
    },
    {
      companyId: '',
      class: 'LIAB',
      method: 'CLOSING',
      updatedAt: '',
      updatedBy: '',
    },
    {
      companyId: '',
      class: 'EQUITY',
      method: 'HISTORICAL',
      updatedAt: '',
      updatedBy: '',
    },
    {
      companyId: '',
      class: 'REVENUE',
      method: 'AVERAGE',
      updatedAt: '',
      updatedBy: '',
    },
    {
      companyId: '',
      class: 'EXPENSE',
      method: 'AVERAGE',
      updatedAt: '',
      updatedBy: '',
    },
  ];
}
