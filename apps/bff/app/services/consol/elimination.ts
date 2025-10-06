import { pool } from '@/lib/db';
import { ulid } from 'ulid';
import { postJournal, JournalEntry } from '@/services/gl/journals';
import { IcElimRunRequestType } from '@aibos/contracts';
import { getIcMatches } from './ic';
import { getIcElimRules } from './ic-workbench';

// --- IC Elimination Engine (M21) -------------------------------------------
export interface IcElimRun {
  id: string;
  companyId: string;
  groupCode: string;
  year: number;
  month: number;
  mode: string;
  createdAt: string;
  createdBy: string;
  lines?: IcElimLine[];
}

export interface IcElimLine {
  id: string;
  runId: string;
  entityCode: string;
  cpCode: string;
  amountBase: number;
  note?: string;
}

export interface IcElimRunResult {
  runId: string;
  lines: IcElimLine[];
  summary: {
    totalEliminations: number;
    journalsPosted?: number;
  };
}

export async function runIcElimination(
  companyId: string,
  data: IcElimRunRequestType,
  actor: string
): Promise<IcElimRunResult> {
  const runId = ulid();

  // Check for existing lock (idempotency)
  if (!data.dry_run) {
    const { rows: lockRows } = await pool.query(
      `
      SELECT 1 FROM ic_elim_lock 
      WHERE company_id = $1 AND group_code = $2 AND year = $3 AND month = $4
    `,
      [companyId, data.group_code, data.year, data.month]
    );

    if (lockRows.length > 0) {
      throw new Error(
        `IC elimination already committed for ${data.group_code} ${data.year}-${data.month}`
      );
    }
  }

  // Create run record
  await pool.query(
    `
    INSERT INTO ic_elim_run (id, company_id, group_code, year, month, mode, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `,
    [
      runId,
      companyId,
      data.group_code,
      data.year,
      data.month,
      data.dry_run ? 'dry_run' : 'commit',
      actor,
    ]
  );

  // Get matched IC transactions for the period
  const matches = await getIcMatches(
    companyId,
    data.group_code,
    data.year,
    data.month
  );

  const lines: IcElimLine[] = [];
  let totalEliminations = 0;
  let journalsPosted = 0;

  // Process each match group
  for (const match of matches) {
    if (!match.links || match.links.length < 2) continue;

    // Group links by entity pair
    const entityPairs = new Map<
      string,
      { entityA: string; entityB: string; amount: number }
    >();

    for (const link of match.links) {
      const pairKey = [link.entityCode, link.coEntityCp].sort().join('|');
      if (!entityPairs.has(pairKey)) {
        entityPairs.set(pairKey, {
          entityA: link.entityCode,
          entityB: link.coEntityCp,
          amount: 0,
        });
      }
      entityPairs.get(pairKey)!.amount += link.amountBase;
    }

    // Create elimination lines for each entity pair
    for (const [pairKey, pair] of entityPairs) {
      if (Math.abs(pair.amount) > match.tolerance) {
        const lineId = ulid();
        const line: IcElimLine = {
          id: lineId,
          runId,
          entityCode: pair.entityA,
          cpCode: pair.entityB,
          amountBase: Math.abs(pair.amount),
          note: `IC elimination: ${pair.entityA} ↔ ${pair.entityB}`,
        };

        lines.push(line);
        totalEliminations += line.amountBase;

        // Store line
        await pool.query(
          `
          INSERT INTO ic_elim_line (id, run_id, entity_code, cp_code, amount_base, note)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [
            lineId,
            runId,
            pair.entityA,
            pair.entityB,
            line.amountBase,
            line.note,
          ]
        );
      }
    }
  }

  // Post elimination journals if committing
  if (!data.dry_run && lines.length > 0) {
    journalsPosted = await postIcEliminationJournals(
      companyId,
      data.group_code,
      data.year,
      data.month,
      lines,
      actor,
      data.memo
    );

    // Create lock
    await pool.query(
      `
      INSERT INTO ic_elim_lock (company_id, group_code, year, month)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
    `,
      [companyId, data.group_code, data.year, data.month]
    );
  }

  return {
    runId,
    lines,
    summary: {
      totalEliminations,
      ...(data.dry_run ? {} : { journalsPosted }),
    },
  };
}

async function postIcEliminationJournals(
  companyId: string,
  groupCode: string,
  year: number,
  month: number,
  lines: IcElimLine[],
  actor: string,
  memo?: string
): Promise<number> {
  // Get IC elimination account mapping
  const { rows: accountMapRows } = await pool.query(
    `
    SELECT account FROM consol_account_map 
    WHERE company_id = $1 AND purpose = 'IC_ELIM'
  `,
    [companyId]
  );

  const elimAccount =
    accountMapRows.length > 0 ? accountMapRows[0].account : '9890'; // Default IC elimination account

  let journalsPosted = 0;

  // Group lines by entity pair for journal posting
  const entityPairMap = new Map<string, IcElimLine[]>();

  for (const line of lines) {
    const pairKey = `${line.entityCode}|${line.cpCode}`;
    if (!entityPairMap.has(pairKey)) {
      entityPairMap.set(pairKey, []);
    }
    entityPairMap.get(pairKey)!.push(line);
  }

  // Post one journal per entity pair
  for (const [pairKey, pairLines] of entityPairMap) {
    const totalAmount = pairLines.reduce(
      (sum, line) => sum + line.amountBase,
      0
    );

    if (totalAmount > 0) {
      const journalLines = [
        {
          accountId: elimAccount,
          debit: totalAmount,
          credit: 0,
          description: `IC Elimination: ${pairKey}`,
        },
        {
          accountId: elimAccount,
          debit: 0,
          credit: totalAmount,
          description: `IC Elimination: ${pairKey}`,
        },
      ];

      const journalEntry: JournalEntry = {
        date: new Date(year, month - 1, 1),
        memo: memo || `IC Elimination: ${groupCode} ${year}-${month}`,
        lines: journalLines,
        tags: { module: 'consol', type: 'ic_elim', group: groupCode },
      };

      await postJournal(companyId, journalEntry);
      journalsPosted++;
    }
  }

  return journalsPosted;
}

export async function getIcElimRuns(
  companyId: string,
  groupCode?: string,
  year?: number,
  month?: number
): Promise<IcElimRun[]> {
  let query = `
    SELECT id, company_id, group_code, year, month, mode, created_at, created_by
    FROM ic_elim_run 
    WHERE company_id = $1
  `;
  const params: any[] = [companyId];
  let paramIndex = 2;

  if (groupCode) {
    query += ` AND group_code = $${paramIndex}`;
    params.push(groupCode);
    paramIndex++;
  }

  if (year) {
    query += ` AND year = $${paramIndex}`;
    params.push(year);
    paramIndex++;
  }

  if (month) {
    query += ` AND month = $${paramIndex}`;
    params.push(month);
    paramIndex++;
  }

  query += ` ORDER BY created_at DESC`;

  const { rows } = await pool.query(query, params);

  const runs: IcElimRun[] = [];

  for (const row of rows) {
    // Get lines for this run
    const { rows: lineRows } = await pool.query(
      `
      SELECT id, run_id, entity_code, cp_code, amount_base, note
      FROM ic_elim_line 
      WHERE run_id = $1
    `,
      [row.id]
    );

    runs.push({
      id: row.id,
      companyId: row.company_id,
      groupCode: row.group_code,
      year: row.year,
      month: row.month,
      mode: row.mode,
      createdAt: row.created_at,
      createdBy: row.created_by,
      lines: lineRows.map(lineRow => ({
        id: lineRow.id,
        runId: lineRow.run_id,
        entityCode: lineRow.entity_code,
        cpCode: lineRow.cp_code,
        amountBase: Number(lineRow.amount_base),
        note: lineRow.note,
      })),
    });
  }

  return runs;
}

// --- Rule-Based Elimination (M21.2) -------------------------------------------
export async function runRuleBasedElimination(
  companyId: string,
  groupCode: string,
  year: number,
  month: number,
  ruleCode?: string,
  dryRun: boolean = true,
  actor: string = 'system'
): Promise<IcElimRunResult> {
  const runId = ulid();

  // Check for existing rule lock (idempotency)
  if (!dryRun && ruleCode) {
    const { rows: lockRows } = await pool.query(
      `
            SELECT 1 FROM ic_elim_rule_lock 
            WHERE company_id = $1 AND group_code = $2 AND year = $3 AND month = $4 AND rule_code = $5
        `,
      [companyId, groupCode, year, month, ruleCode]
    );

    if (lockRows.length > 0) {
      throw new Error(
        `Rule-based elimination already committed for ${groupCode} ${year}-${month} rule ${ruleCode}`
      );
    }
  }

  // Create run record
  await pool.query(
    `
        INSERT INTO ic_elim_run (id, company_id, group_code, year, month, mode, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      runId,
      companyId,
      groupCode,
      year,
      month,
      dryRun ? 'dry_run' : 'commit',
      actor,
    ]
  );

  // Get elimination rules
  const elimRules = await getIcElimRules(companyId);
  const rulesToProcess = ruleCode
    ? elimRules.filter(r => r.ruleCode === ruleCode)
    : elimRules;

  const allElimLines: IcElimLine[] = [];
  let totalEliminations = 0;

  // Process each rule
  for (const rule of rulesToProcess) {
    const ruleElimLines = await processEliminationRule(
      companyId,
      groupCode,
      year,
      month,
      rule,
      runId
    );

    allElimLines.push(...ruleElimLines);
    totalEliminations += ruleElimLines.length;

    // Create rule lock if committing
    if (!dryRun) {
      await pool.query(
        `
                INSERT INTO ic_elim_rule_lock (company_id, group_code, year, month, rule_code)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT DO NOTHING
            `,
        [companyId, groupCode, year, month, rule.ruleCode]
      );
    }
  }

  // Post elimination journals if not dry run
  let journalsPosted = 0;
  if (!dryRun && allElimLines.length > 0) {
    journalsPosted = await postEliminationJournals(
      companyId,
      allElimLines,
      groupCode,
      year,
      month
    );
  }

  return {
    runId,
    lines: allElimLines,
    summary: {
      totalEliminations,
      journalsPosted,
    },
  };
}

async function processEliminationRule(
  companyId: string,
  groupCode: string,
  year: number,
  month: number,
  rule: any,
  runId: string
): Promise<IcElimLine[]> {
  const elimLines: IcElimLine[] = [];

  // Get IC matches for the period
  const icMatches = await getIcMatches(companyId, groupCode, year, month);

  for (const match of icMatches) {
    // Get IC links for this match
    const { rows: linkRows } = await pool.query(
      `
            SELECT il.entity_code, il.co_entity_cp, il.amount_base, il.source_type
            FROM ic_match_line iml
            JOIN ic_link il ON iml.ic_link_id = il.id
            WHERE iml.match_id = $1
        `,
      [match.id]
    );

    // Group links by entity pairs
    const entityPairs = new Map<string, any[]>();
    for (const link of linkRows) {
      const pairKey = `${link.entity_code}|${link.co_entity_cp}`;
      if (!entityPairs.has(pairKey)) {
        entityPairs.set(pairKey, []);
      }
      entityPairs.get(pairKey)!.push(link);
    }

    // Process each entity pair
    for (const [pairKey, links] of entityPairs) {
      const [entityA, entityB] = pairKey.split('|');

      // Check if this pair matches the rule pattern
      if (matchesRulePattern(links, rule)) {
        const totalAmount = links.reduce(
          (sum, link) => sum + Number(link.amount_base),
          0
        );

        if (Math.abs(totalAmount) > 0.01) {
          const elimLineId = ulid();
          elimLines.push({
            id: elimLineId,
            runId,
            entityCode: entityA || '',
            cpCode: entityB || '',
            amountBase: Math.abs(totalAmount),
            note: `Rule: ${rule.ruleCode}`,
          });

          // Save elimination line
          await pool.query(
            `
                        INSERT INTO ic_elim_line (id, run_id, entity_code, cp_code, amount_base, note)
                        VALUES ($1, $2, $3, $4, $5, $6)
                    `,
            [
              elimLineId,
              runId,
              entityA,
              entityB,
              Math.abs(totalAmount),
              `Rule: ${rule.ruleCode}`,
            ]
          );
        }
      }
    }
  }

  return elimLines;
}

function matchesRulePattern(links: any[], rule: any): boolean {
  if (!rule.src_account_like && !rule.cp_account_like) {
    return true; // No pattern specified, match all
  }

  for (const link of links) {
    const srcMatch =
      !rule.src_account_like ||
      link.source_type.includes(rule.src_account_like);
    const cpMatch =
      !rule.cp_account_like || link.source_type.includes(rule.cp_account_like);

    if (srcMatch && cpMatch) {
      return true;
    }
  }

  return false;
}

async function postEliminationJournals(
  companyId: string,
  elimLines: IcElimLine[],
  groupCode: string,
  year: number,
  month: number
): Promise<number> {
  // Get IC elimination account mapping
  const { rows: accountMapRows } = await pool.query(
    `
        SELECT account FROM consol_account_map 
        WHERE company_id = $1 AND purpose = 'IC_ELIM'
    `,
    [companyId]
  );

  const elimAccount =
    accountMapRows.length > 0 ? accountMapRows[0].account : '9890';

  let journalsPosted = 0;

  // Group eliminations by entity pair for journal posting
  const elimGroups = new Map<string, IcElimLine[]>();
  for (const elim of elimLines) {
    const groupKey = `${elim.entityCode}|${elim.cpCode}`;
    if (!elimGroups.has(groupKey)) {
      elimGroups.set(groupKey, []);
    }
    elimGroups.get(groupKey)!.push(elim);
  }

  // Post journal for each entity pair
  for (const [groupKey, elims] of elimGroups) {
    const [entityA, entityB] = groupKey.split('|');
    const totalAmount = elims.reduce((sum, elim) => sum + elim.amountBase, 0);

    if (Math.abs(totalAmount) > 0.01) {
      const journalId = ulid();
      const idempotencyKey = `ic-elim-${groupCode}-${year}-${month}-${entityA}-${entityB}`;

      const journal: JournalEntry = {
        date: new Date(year, month - 1, 1),
        memo: `IC Elimination: ${groupCode} ${year}-${month}`,
        lines: [
          {
            accountId: elimAccount,
            debit: totalAmount,
            description: `IC Elimination: ${entityA} ↔ ${entityB}`,
          },
          {
            accountId: elimAccount,
            credit: totalAmount,
            description: `IC Elimination: ${entityA} ↔ ${entityB}`,
          },
        ],
      };

      await postJournal(companyId, journal);
      journalsPosted++;
    }
  }

  return journalsPosted;
}
