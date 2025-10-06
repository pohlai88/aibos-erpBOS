import { pool } from '@/lib/db';
import { ulid } from 'ulid';
import {
  CfMapUpsertType,
  CfScenarioUpsertType,
  CfRunIndirectReqType,
  CfRunDirectReqType,
  CfDriverWeekUpsertType,
  CfAdjustWeekUpsertType,
  BankAccountUpsertType,
} from '@aibos/contracts';

// --- Cash Flow Interfaces (M22) ----------------------------------------------
export interface CfMap {
  companyId: string;
  mapCode: string;
  accountLike: string;
  cfSection: string;
  sign: string;
  note?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CfScenario {
  companyId: string;
  code: string;
  name: string;
  kind: string;
  active: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface CfRun {
  id: string;
  companyId: string;
  scope: string;
  year: number;
  month?: number;
  startDate?: string;
  mode: string;
  presentCcy?: string;
  scenario?: string;
  createdAt: string;
  createdBy: string;
  lines?: CfLine[];
}

export interface CfLine {
  id: string;
  runId: string;
  label: string;
  period: string;
  amount: number;
  note?: string | undefined;
}

export interface CfRunResult {
  runId: string;
  lines: CfLine[];
  summary: {
    totalLines: number;
    netCashFlow: number;
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
  };
}

// --- Cash Flow Mapping Management (M22) --------------------------------------
export async function upsertCfMap(
  companyId: string,
  data: CfMapUpsertType,
  updatedBy: string
): Promise<CfMap> {
  await pool.query(
    `
        INSERT INTO cf_map (company_id, map_code, account_like, cf_section, sign, note, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (company_id, map_code, account_like) 
        DO UPDATE SET cf_section = $4, sign = $5, note = $6, updated_by = $7, updated_at = now()
    `,
    [
      companyId,
      data.map_code,
      data.account_like,
      data.cf_section,
      data.sign,
      data.note,
      updatedBy,
    ]
  );

  const result = await pool.query(
    `
        SELECT map_code, account_like, cf_section, sign, note, updated_at, updated_by
        FROM cf_map
        WHERE company_id = $1 AND map_code = $2 AND account_like = $3
    `,
    [companyId, data.map_code, data.account_like]
  );

  return {
    companyId,
    mapCode: result.rows[0].map_code,
    accountLike: result.rows[0].account_like,
    cfSection: result.rows[0].cf_section,
    sign: result.rows[0].sign,
    note: result.rows[0].note,
    updatedAt: result.rows[0].updated_at.toISOString(),
    updatedBy: result.rows[0].updated_by,
  };
}

export async function getCfMaps(
  companyId: string,
  mapCode?: string
): Promise<CfMap[]> {
  let query = `
        SELECT map_code, account_like, cf_section, sign, note, updated_at, updated_by
        FROM cf_map
        WHERE company_id = $1
    `;
  const params: any[] = [companyId];

  if (mapCode) {
    query += ` AND map_code = $2`;
    params.push(mapCode);
  }

  query += ` ORDER BY map_code, cf_section, account_like`;

  const result = await pool.query(query, params);

  return result.rows.map(row => ({
    companyId,
    mapCode: row.map_code,
    accountLike: row.account_like,
    cfSection: row.cf_section,
    sign: row.sign,
    note: row.note,
    updatedAt: row.updated_at.toISOString(),
    updatedBy: row.updated_by,
  }));
}

// --- Scenario Management (M22) ------------------------------------------------
export async function upsertCfScenario(
  companyId: string,
  data: CfScenarioUpsertType,
  updatedBy: string
): Promise<CfScenario> {
  await pool.query(
    `
        INSERT INTO cf_scenario (company_id, code, name, kind, active, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (company_id, code) 
        DO UPDATE SET name = $3, kind = $4, active = $5, updated_by = $6, updated_at = now()
    `,
    [companyId, data.code, data.name, data.kind, data.active, updatedBy]
  );

  const result = await pool.query(
    `
        SELECT code, name, kind, active, updated_at, updated_by
        FROM cf_scenario
        WHERE company_id = $1 AND code = $2
    `,
    [companyId, data.code]
  );

  return {
    companyId,
    code: result.rows[0].code,
    name: result.rows[0].name,
    kind: result.rows[0].kind,
    active: result.rows[0].active,
    updatedAt: result.rows[0].updated_at.toISOString(),
    updatedBy: result.rows[0].updated_by,
  };
}

export async function getCfScenarios(companyId: string): Promise<CfScenario[]> {
  const result = await pool.query(
    `
        SELECT code, name, kind, active, updated_at, updated_by
        FROM cf_scenario
        WHERE company_id = $1 AND active = true
        ORDER BY kind, code
    `,
    [companyId]
  );

  return result.rows.map(row => ({
    companyId,
    code: row.code,
    name: row.name,
    kind: row.kind,
    active: row.active,
    updatedAt: row.updated_at.toISOString(),
    updatedBy: row.updated_by,
  }));
}

// --- Indirect Cash Flow Builder (M22) -----------------------------------------
export async function runIndirectCashFlow(
  companyId: string,
  data: CfRunIndirectReqType,
  actor: string
): Promise<CfRunResult> {
  const runId = ulid();
  const lockKey = `${data.year}-${data.month.toString().padStart(2, '0')}`;

  // Check for existing lock (idempotency)
  if (!data.dry_run) {
    const { rows: lockRows } = await pool.query(
      `
            SELECT 1 FROM cf_lock 
            WHERE company_id = $1 AND scope = 'INDIRECT' AND key = $2
        `,
      [companyId, lockKey]
    );

    if (lockRows.length > 0) {
      throw new Error(
        `Indirect cash flow already committed for ${data.year}-${data.month}`
      );
    }
  }

  // Create run record
  await pool.query(
    `
        INSERT INTO cf_run (id, company_id, scope, year, month, mode, present_ccy, scenario, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      runId,
      companyId,
      'INDIRECT',
      data.year,
      data.month,
      data.dry_run ? 'dry_run' : 'commit',
      data.present,
      data.scenario,
      actor,
    ]
  );

  // Build indirect cash flow from GL deltas
  const cfLines = await buildIndirectCashFlowLines(companyId, data, runId);

  // Save lines if committing
  if (!data.dry_run) {
    for (const line of cfLines) {
      await pool.query(
        `
                INSERT INTO cf_line (id, run_id, label, period, amount, note)
                VALUES ($1, $2, $3, $4, $5, $6)
            `,
        [line.id, line.runId, line.label, line.period, line.amount, line.note]
      );
    }

    // Create lock
    await pool.query(
      `
            INSERT INTO cf_lock (company_id, scope, key)
            VALUES ($1, $2, $3)
        `,
      [companyId, 'INDIRECT', lockKey]
    );
  }

  // Calculate summary
  const summary = calculateCashFlowSummary(cfLines);

  return {
    runId,
    lines: cfLines,
    summary,
  };
}

async function buildIndirectCashFlowLines(
  companyId: string,
  data: CfRunIndirectReqType,
  runId: string
): Promise<CfLine[]> {
  const lines: CfLine[] = [];
  const period = `${data.year}-${data.month.toString().padStart(2, '0')}`;

  // Get cash flow mapping rules
  const cfMaps = await getCfMaps(companyId, data.map_code);

  // Get GL balances for current and previous period
  const currentBalances = await getGlBalancesForPeriod(
    companyId,
    data.year,
    data.month
  );
  const previousBalances = await getGlBalancesForPeriod(
    companyId,
    data.year,
    data.month - 1
  );

  // Calculate deltas and apply mapping rules
  for (const map of cfMaps) {
    const currentAmount = getAccountBalance(currentBalances, map.accountLike);
    const previousAmount = getAccountBalance(previousBalances, map.accountLike);
    const delta = currentAmount - previousAmount;

    if (Math.abs(delta) > 0.01) {
      const adjustedAmount = map.sign === '+' ? delta : -delta;

      lines.push({
        id: ulid(),
        runId,
        label: `${map.cfSection}: ${map.accountLike}`,
        period,
        amount: adjustedAmount,
        note: map.note || `${map.cfSection} cash flow from ${map.accountLike}`,
      });
    }
  }

  // Add net income (if not already mapped)
  const netIncome = calculateNetIncome(currentBalances);
  if (Math.abs(netIncome) > 0.01) {
    lines.push({
      id: ulid(),
      runId,
      label: 'OPERATING: Net Income',
      period,
      amount: netIncome,
      note: 'Net income from P&L',
    });
  }

  return lines;
}

async function getGlBalancesForPeriod(
  companyId: string,
  year: number,
  month: number
): Promise<any[]> {
  const periodEnd = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

  const { rows } = await pool.query(
    `
        SELECT a.code, a.name, a.type, 
               COALESCE(SUM(CASE WHEN jl.dc = 'D' THEN jl.amount ELSE -jl.amount END), 0) as balance
        FROM account a
        LEFT JOIN journal_line jl ON a.code = jl.account_code
        LEFT JOIN journal j ON jl.journal_id = j.id
        WHERE a.company_id = $1 
        AND (j.posting_date IS NULL OR j.posting_date <= $2)
        GROUP BY a.code, a.name, a.type
        ORDER BY a.code
    `,
    [companyId, periodEnd]
  );

  return rows;
}

function getAccountBalance(balances: any[], accountPattern: string): number {
  const matchingBalances = balances.filter(balance =>
    balance.code.includes(accountPattern.replace('%', ''))
  );

  return matchingBalances.reduce(
    (sum, balance) => sum + Number(balance.balance),
    0
  );
}

function calculateNetIncome(balances: any[]): number {
  const revenueBalances = balances.filter(b => b.code.match(/^4\d{3}/));
  const expenseBalances = balances.filter(b => b.code.match(/^5\d{3}/));

  const totalRevenue = revenueBalances.reduce(
    (sum, b) => sum + Number(b.balance),
    0
  );
  const totalExpenses = expenseBalances.reduce(
    (sum, b) => sum + Number(b.balance),
    0
  );

  return totalRevenue - totalExpenses;
}

function calculateCashFlowSummary(lines: CfLine[]): {
  totalLines: number;
  netCashFlow: number;
  operatingCashFlow: number;
  investingCashFlow: number;
  financingCashFlow: number;
} {
  const operatingLines = lines.filter(l => l.label.startsWith('OPERATING:'));
  const investingLines = lines.filter(l => l.label.startsWith('INVESTING:'));
  const financingLines = lines.filter(l => l.label.startsWith('FINANCING:'));

  const operatingCashFlow = operatingLines.reduce(
    (sum, l) => sum + l.amount,
    0
  );
  const investingCashFlow = investingLines.reduce(
    (sum, l) => sum + l.amount,
    0
  );
  const financingCashFlow = financingLines.reduce(
    (sum, l) => sum + l.amount,
    0
  );
  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;

  return {
    totalLines: lines.length,
    netCashFlow,
    operatingCashFlow,
    investingCashFlow,
    financingCashFlow,
  };
}

// --- 13-Week Direct Cash Flow Builder (M22) ----------------------------------
export async function runDirect13WeekCashFlow(
  companyId: string,
  data: CfRunDirectReqType,
  actor: string
): Promise<CfRunResult> {
  const runId = ulid();
  const startDate = new Date(data.start_date);
  const year = startDate.getFullYear();
  const startWeek = getISOWeek(startDate);
  const lockKey = `${year}-W${startWeek.toString().padStart(2, '0')}:${data.weeks}`;

  // Check for existing lock (idempotency)
  if (!data.dry_run) {
    const { rows: lockRows } = await pool.query(
      `
            SELECT 1 FROM cf_lock 
            WHERE company_id = $1 AND scope = 'DIRECT13' AND key = $2
        `,
      [companyId, lockKey]
    );

    if (lockRows.length > 0) {
      throw new Error(
        `13-week direct cash flow already committed for ${lockKey}`
      );
    }
  }

  // Create run record
  await pool.query(
    `
        INSERT INTO cf_run (id, company_id, scope, year, start_date, mode, present_ccy, scenario, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      runId,
      companyId,
      'DIRECT13',
      year,
      data.start_date,
      data.dry_run ? 'dry_run' : 'commit',
      data.present,
      data.scenario,
      actor,
    ]
  );

  // Build 13-week direct cash flow
  const cfLines = await buildDirect13WeekCashFlowLines(companyId, data, runId);

  // Save lines if committing
  if (!data.dry_run) {
    for (const line of cfLines) {
      await pool.query(
        `
                INSERT INTO cf_line (id, run_id, label, period, amount, note)
                VALUES ($1, $2, $3, $4, $5, $6)
            `,
        [line.id, line.runId, line.label, line.period, line.amount, line.note]
      );
    }

    // Create lock
    await pool.query(
      `
            INSERT INTO cf_lock (company_id, scope, key)
            VALUES ($1, $2, $3)
        `,
      [companyId, 'DIRECT13', lockKey]
    );
  }

  // Calculate summary
  const summary = calculateCashFlowSummary(cfLines);

  return {
    runId,
    lines: cfLines,
    summary,
  };
}

async function buildDirect13WeekCashFlowLines(
  companyId: string,
  data: CfRunDirectReqType,
  runId: string
): Promise<CfLine[]> {
  const lines: CfLine[] = [];
  const startDate = new Date(data.start_date);

  // Get starting cash balance
  const startingCash = await getStartingCashBalance(companyId, startDate);

  lines.push({
    id: ulid(),
    runId,
    label: 'Starting Cash',
    period: `${startDate.getFullYear()}-W${getISOWeek(startDate).toString().padStart(2, '0')}`,
    amount: startingCash,
    note: 'Beginning cash balance',
  });

  // Build weekly cash flow for each week
  for (let week = 0; week < data.weeks; week++) {
    const weekDate = new Date(startDate);
    weekDate.setDate(startDate.getDate() + week * 7);

    const year = weekDate.getFullYear();
    const isoWeek = getISOWeek(weekDate);
    const period = `${year}-W${isoWeek.toString().padStart(2, '0')}`;

    // Get receipts for this week
    const receipts = await getWeeklyReceipts(
      companyId,
      year,
      isoWeek,
      data.scenario
    );
    if (Math.abs(receipts) > 0.01) {
      lines.push({
        id: ulid(),
        runId,
        label: 'RECEIPTS: Total',
        period,
        amount: receipts,
        note: `Expected receipts for week ${isoWeek}`,
      });
    }

    // Get payments for this week
    const payments = await getWeeklyPayments(
      companyId,
      year,
      isoWeek,
      data.scenario
    );
    if (Math.abs(payments) > 0.01) {
      lines.push({
        id: ulid(),
        runId,
        label: 'PAYMENTS: Total',
        period,
        amount: -payments, // Negative for payments
        note: `Expected payments for week ${isoWeek}`,
      });
    }

    // Get manual adjustments for this week
    const adjustments = await getWeeklyAdjustments(
      companyId,
      year,
      isoWeek,
      data.scenario
    );
    for (const adj of adjustments) {
      lines.push({
        id: ulid(),
        runId,
        label: `${adj.bucket}: Manual Adjustment`,
        period,
        amount: adj.bucket === 'RECEIPTS' ? adj.amount : -adj.amount,
        note: adj.memo,
      });
    }
  }

  return lines;
}

async function getStartingCashBalance(
  companyId: string,
  startDate: Date
): Promise<number> {
  // Try to get bank balance first
  const { rows: bankRows } = await pool.query(
    `
        SELECT balance FROM bank_balance_day
        WHERE company_id = $1 AND as_of_date <= $2
        ORDER BY as_of_date DESC
        LIMIT 1
    `,
    [companyId, startDate.toISOString().split('T')[0]]
  );

  if (bankRows.length > 0) {
    return Number(bankRows[0].balance);
  }

  // Fallback to GL cash accounts
  const { rows: glRows } = await pool.query(
    `
        SELECT COALESCE(SUM(CASE WHEN jl.dc = 'D' THEN jl.amount ELSE -jl.amount END), 0) as balance
        FROM account a
        LEFT JOIN journal_line jl ON a.code = jl.account_code
        LEFT JOIN journal j ON jl.journal_id = j.id
        WHERE a.company_id = $1 
        AND a.cash_equivalent = true
        AND (j.posting_date IS NULL OR j.posting_date <= $2)
    `,
    [companyId, startDate.toISOString()]
  );

  return glRows.length > 0 ? Number(glRows[0].balance) : 0;
}

async function getWeeklyReceipts(
  companyId: string,
  year: number,
  isoWeek: number,
  scenario?: string
): Promise<number> {
  const scenarioCode = scenario || 'BASE';

  // Get AR collections from drivers
  const { rows: driverRows } = await pool.query(
    `
        SELECT SUM(amount) as total
        FROM cf_driver_week
        WHERE company_id = $1 AND year = $2 AND iso_week = $3 
        AND driver_code = 'AR_COLLECTION' AND scenario = $4
    `,
    [companyId, year, isoWeek, scenarioCode]
  );

  const driverAmount = driverRows.length > 0 ? Number(driverRows[0].total) : 0;

  // Get AR aging-based collections (simplified)
  const { rows: arRows } = await pool.query(
    `
        SELECT COALESCE(SUM(amount_base), 0) as total
        FROM ar_invoice
        WHERE company_id = $1 
        AND due_date BETWEEN $2 AND $3
        AND status = 'OPEN'
    `,
    [
      companyId,
      getWeekStartDate(year, isoWeek).toISOString(),
      getWeekEndDate(year, isoWeek).toISOString(),
    ]
  );

  const arAmount = arRows.length > 0 ? Number(arRows[0].total) : 0;

  return driverAmount + arAmount;
}

async function getWeeklyPayments(
  companyId: string,
  year: number,
  isoWeek: number,
  scenario?: string
): Promise<number> {
  const scenarioCode = scenario || 'BASE';

  // Get AP payments from drivers
  const { rows: driverRows } = await pool.query(
    `
        SELECT SUM(amount) as total
        FROM cf_driver_week
        WHERE company_id = $1 AND year = $2 AND iso_week = $3 
        AND driver_code IN ('AP_PAYMENT', 'PAYROLL', 'TAX') AND scenario = $4
    `,
    [companyId, year, isoWeek, scenarioCode]
  );

  const driverAmount = driverRows.length > 0 ? Number(driverRows[0].total) : 0;

  // Get AP due payments (simplified)
  const { rows: apRows } = await pool.query(
    `
        SELECT COALESCE(SUM(amount_base), 0) as total
        FROM ap_invoice
        WHERE company_id = $1 
        AND due_date BETWEEN $2 AND $3
        AND status = 'OPEN'
    `,
    [
      companyId,
      getWeekStartDate(year, isoWeek).toISOString(),
      getWeekEndDate(year, isoWeek).toISOString(),
    ]
  );

  const apAmount = apRows.length > 0 ? Number(apRows[0].total) : 0;

  return driverAmount + apAmount;
}

async function getWeeklyAdjustments(
  companyId: string,
  year: number,
  isoWeek: number,
  scenario?: string
): Promise<Array<{ bucket: string; amount: number; memo?: string }>> {
  const scenarioCode = scenario || 'BASE';

  const { rows } = await pool.query(
    `
        SELECT bucket, amount, memo
        FROM cf_adjust_week
        WHERE company_id = $1 AND year = $2 AND iso_week = $3 AND scenario = $4
    `,
    [companyId, year, isoWeek, scenarioCode]
  );

  return rows.map(row => ({
    bucket: row.bucket,
    amount: Number(row.amount),
    memo: row.memo,
  }));
}

// --- Helper Functions (M22) -------------------------------------------------
function getISOWeek(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekStartDate(year: number, isoWeek: number): Date {
  const simple = new Date(year, 0, 1 + (isoWeek - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
}

function getWeekEndDate(year: number, isoWeek: number): Date {
  const startDate = getWeekStartDate(year, isoWeek);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return endDate;
}

// --- Multi-Entity Consolidation (M22) ----------------------------------------
export async function runConsolidatedCashFlow(
  companyId: string,
  groupCode: string,
  data: CfRunIndirectReqType | CfRunDirectReqType,
  actor: string
): Promise<CfRunResult> {
  // Get group entities and ownership structure
  const { rows: entityRows } = await pool.query(
    `
        SELECT e.entity_code, e.name, e.ccy, o.pct
        FROM co_entity e
        JOIN co_ownership o ON e.entity_code = o.child_code
        WHERE o.group_code = $1 AND o.company_id = $2
    `,
    [groupCode, companyId]
  );

  if (entityRows.length === 0) {
    throw new Error(`No entities found for group ${groupCode}`);
  }

  const consolidatedLines: CfLine[] = [];
  const runId = ulid();
  const scope = 'scope' in data ? 'INDIRECT' : 'DIRECT13';

  // Create consolidated run record
  await pool.query(
    `
        INSERT INTO cf_run (id, company_id, scope, year, month, start_date, mode, present_ccy, scenario, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `,
    [
      runId,
      companyId,
      scope,
      'year' in data ? data.year : new Date(data.start_date).getFullYear(),
      'month' in data ? data.month : null,
      'start_date' in data ? data.start_date : null,
      data.dry_run ? 'dry_run' : 'commit',
      data.present,
      data.scenario,
      actor,
    ]
  );

  // Process each entity
  for (const entity of entityRows) {
    const entityLines =
      scope === 'INDIRECT'
        ? await buildEntityIndirectCashFlowLines(
            entity.entity_code,
            data as CfRunIndirectReqType,
            runId,
            companyId
          )
        : await buildEntityDirect13WeekCashFlowLines(
            entity.entity_code,
            data as CfRunDirectReqType,
            runId
          );

    // Convert to presentation currency if needed
    const convertedLines =
      data.present && data.present !== entity.ccy
        ? await convertLinesToPresentationCurrency(
            entityLines,
            entity.ccy,
            data.present,
            companyId
          )
        : entityLines;

    // Apply ownership percentage
    const ownedLines = convertedLines.map(line => ({
      ...line,
      amount: line.amount * (Number(entity.pct) / 100),
    }));

    consolidatedLines.push(...ownedLines);
  }

  // Aggregate lines by label and period
  const aggregatedLines = aggregateConsolidatedLines(consolidatedLines);

  // Save lines if committing
  if (!data.dry_run) {
    for (const line of aggregatedLines) {
      await pool.query(
        `
                INSERT INTO cf_line (id, run_id, label, period, amount, note)
                VALUES ($1, $2, $3, $4, $5, $6)
            `,
        [line.id, line.runId, line.label, line.period, line.amount, line.note]
      );
    }
  }

  // Calculate summary
  const summary = calculateCashFlowSummary(aggregatedLines);

  return {
    runId,
    lines: aggregatedLines,
    summary,
  };
}

async function buildEntityIndirectCashFlowLines(
  entityCode: string,
  data: CfRunIndirectReqType,
  runId: string,
  companyId: string
): Promise<CfLine[]> {
  const lines: CfLine[] = [];
  const period = `${data.year}-${data.month.toString().padStart(2, '0')}`;

  // Get entity-specific GL balances
  const currentBalances = await getEntityGlBalances(
    entityCode,
    data.year,
    data.month
  );
  const previousBalances = await getEntityGlBalances(
    entityCode,
    data.year,
    data.month - 1
  );

  // Get cash flow mapping rules
  const cfMaps = await getCfMaps(companyId, data.map_code);

  // Calculate deltas and apply mapping rules
  for (const map of cfMaps) {
    const currentAmount = getAccountBalance(currentBalances, map.accountLike);
    const previousAmount = getAccountBalance(previousBalances, map.accountLike);
    const delta = currentAmount - previousAmount;

    if (Math.abs(delta) > 0.01) {
      const adjustedAmount = map.sign === '+' ? delta : -delta;

      lines.push({
        id: ulid(),
        runId,
        label: `${map.cfSection}: ${map.accountLike}`,
        period,
        amount: adjustedAmount,
        note: `${entityCode}: ${map.cfSection} cash flow from ${map.accountLike}`,
      });
    }
  }

  return lines;
}

async function buildEntityDirect13WeekCashFlowLines(
  entityCode: string,
  data: CfRunDirectReqType,
  runId: string
): Promise<CfLine[]> {
  const lines: CfLine[] = [];
  const startDate = new Date(data.start_date);

  // Get entity-specific weekly cash flow
  for (let week = 0; week < data.weeks; week++) {
    const weekDate = new Date(startDate);
    weekDate.setDate(startDate.getDate() + week * 7);

    const year = weekDate.getFullYear();
    const isoWeek = getISOWeek(weekDate);
    const period = `${year}-W${isoWeek.toString().padStart(2, '0')}`;

    // Get receipts for this entity and week
    const receipts = await getEntityWeeklyReceipts(
      entityCode,
      year,
      isoWeek,
      data.scenario
    );
    if (Math.abs(receipts) > 0.01) {
      lines.push({
        id: ulid(),
        runId,
        label: 'RECEIPTS: Total',
        period,
        amount: receipts,
        note: `${entityCode}: Expected receipts for week ${isoWeek}`,
      });
    }

    // Get payments for this entity and week
    const payments = await getEntityWeeklyPayments(
      entityCode,
      year,
      isoWeek,
      data.scenario
    );
    if (Math.abs(payments) > 0.01) {
      lines.push({
        id: ulid(),
        runId,
        label: 'PAYMENTS: Total',
        period,
        amount: -payments,
        note: `${entityCode}: Expected payments for week ${isoWeek}`,
      });
    }
  }

  return lines;
}

async function getEntityGlBalances(
  entityCode: string,
  year: number,
  month: number
): Promise<any[]> {
  const periodEnd = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

  const { rows } = await pool.query(
    `
        SELECT a.code, a.name, a.type, 
               COALESCE(SUM(CASE WHEN jl.dc = 'D' THEN jl.amount ELSE -jl.amount END), 0) as balance
        FROM account a
        LEFT JOIN journal_line jl ON a.code = jl.account_code
        LEFT JOIN journal j ON jl.journal_id = j.id
        WHERE a.entity_code = $1 
        AND (j.posting_date IS NULL OR j.posting_date <= $2)
        GROUP BY a.code, a.name, a.type
        ORDER BY a.code
    `,
    [entityCode, periodEnd]
  );

  return rows;
}

async function getEntityWeeklyReceipts(
  entityCode: string,
  year: number,
  isoWeek: number,
  scenario?: string
): Promise<number> {
  const scenarioCode = scenario || 'BASE';

  // Get entity-specific AR collections
  const { rows: arRows } = await pool.query(
    `
        SELECT COALESCE(SUM(amount_base), 0) as total
        FROM ar_invoice
        WHERE entity_code = $1 
        AND due_date BETWEEN $2 AND $3
        AND status = 'OPEN'
    `,
    [
      entityCode,
      getWeekStartDate(year, isoWeek).toISOString(),
      getWeekEndDate(year, isoWeek).toISOString(),
    ]
  );

  return arRows.length > 0 ? Number(arRows[0].total) : 0;
}

async function getEntityWeeklyPayments(
  entityCode: string,
  year: number,
  isoWeek: number,
  scenario?: string
): Promise<number> {
  const scenarioCode = scenario || 'BASE';

  // Get entity-specific AP payments
  const { rows: apRows } = await pool.query(
    `
        SELECT COALESCE(SUM(amount_base), 0) as total
        FROM ap_invoice
        WHERE entity_code = $1 
        AND due_date BETWEEN $2 AND $3
        AND status = 'OPEN'
    `,
    [
      entityCode,
      getWeekStartDate(year, isoWeek).toISOString(),
      getWeekEndDate(year, isoWeek).toISOString(),
    ]
  );

  return apRows.length > 0 ? Number(apRows[0].total) : 0;
}

async function convertLinesToPresentationCurrency(
  lines: CfLine[],
  sourceCcy: string,
  targetCcy: string,
  companyId: string
): Promise<CfLine[]> {
  // Get FX rates for conversion
  const { rows: rateRows } = await pool.query(
    `
        SELECT rate FROM fx_admin_rates
        WHERE company_id = $1 AND src_ccy = $2 AND dst_ccy = $3
        ORDER BY as_of_date DESC
        LIMIT 1
    `,
    [companyId, sourceCcy, targetCcy]
  );

  if (rateRows.length === 0) {
    throw new Error(`FX rate not found for ${sourceCcy} to ${targetCcy}`);
  }

  const rate = Number(rateRows[0].rate);

  return lines.map(line => ({
    ...line,
    amount: line.amount * rate,
    note: line.note
      ? `${line.note} (converted from ${sourceCcy})`
      : `Converted from ${sourceCcy}`,
  }));
}

function aggregateConsolidatedLines(lines: CfLine[]): CfLine[] {
  const aggregated = new Map<string, CfLine>();

  for (const line of lines) {
    const key = `${line.label}|${line.period}`;

    if (aggregated.has(key)) {
      const existing = aggregated.get(key)!;
      existing.amount += line.amount;
      existing.note = existing.note
        ? `${existing.note}; ${line.note || ''}`
        : line.note || undefined;
    } else {
      aggregated.set(key, { ...line });
    }
  }

  return Array.from(aggregated.values());
}
