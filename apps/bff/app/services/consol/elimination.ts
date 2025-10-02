import { pool } from "@/lib/db";
import { ulid } from "ulid";
import { postJournal, JournalEntry } from "@/services/gl/journals";
import { IcElimRunRequestType } from "@aibos/contracts";
import { getIcMatches } from "./ic";

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
        const { rows: lockRows } = await pool.query(`
      SELECT 1 FROM ic_elim_lock 
      WHERE company_id = $1 AND group_code = $2 AND year = $3 AND month = $4
    `, [companyId, data.group_code, data.year, data.month]);

        if (lockRows.length > 0) {
            throw new Error(`IC elimination already committed for ${data.group_code} ${data.year}-${data.month}`);
        }
    }

    // Create run record
    await pool.query(`
    INSERT INTO ic_elim_run (id, company_id, group_code, year, month, mode, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [runId, companyId, data.group_code, data.year, data.month, data.dry_run ? 'dry_run' : 'commit', actor]);

    // Get matched IC transactions for the period
    const matches = await getIcMatches(companyId, data.group_code, data.year, data.month);

    const lines: IcElimLine[] = [];
    let totalEliminations = 0;
    let journalsPosted = 0;

    // Process each match group
    for (const match of matches) {
        if (!match.links || match.links.length < 2) continue;

        // Group links by entity pair
        const entityPairs = new Map<string, { entityA: string; entityB: string; amount: number }>();

        for (const link of match.links) {
            const pairKey = [link.entityCode, link.coEntityCp].sort().join('|');
            if (!entityPairs.has(pairKey)) {
                entityPairs.set(pairKey, {
                    entityA: link.entityCode,
                    entityB: link.coEntityCp,
                    amount: 0
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
                    note: `IC elimination: ${pair.entityA} ↔ ${pair.entityB}`
                };

                lines.push(line);
                totalEliminations += line.amountBase;

                // Store line
                await pool.query(`
          INSERT INTO ic_elim_line (id, run_id, entity_code, cp_code, amount_base, note)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [lineId, runId, pair.entityA, pair.entityB, line.amountBase, line.note]);
            }
        }
    }

    // Post elimination journals if committing
    if (!data.dry_run && lines.length > 0) {
        journalsPosted = await postIcEliminationJournals(
            companyId, data.group_code, data.year, data.month, lines, actor, data.memo
        );

        // Create lock
        await pool.query(`
      INSERT INTO ic_elim_lock (company_id, group_code, year, month)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
    `, [companyId, data.group_code, data.year, data.month]);
    }

    return {
        runId,
        lines,
        summary: {
            totalEliminations,
            ...(data.dry_run ? {} : { journalsPosted })
        }
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
    const { rows: accountMapRows } = await pool.query(`
    SELECT account FROM consol_account_map 
    WHERE company_id = $1 AND purpose = 'IC_ELIM'
  `, [companyId]);

    const elimAccount = accountMapRows.length > 0
        ? accountMapRows[0].account
        : '9890'; // Default IC elimination account

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
        const totalAmount = pairLines.reduce((sum, line) => sum + line.amountBase, 0);

        if (totalAmount > 0) {
            const journalLines = [
                {
                    accountId: elimAccount,
                    debit: totalAmount,
                    credit: 0,
                    description: `IC Elimination: ${pairKey}`
                },
                {
                    accountId: elimAccount,
                    debit: 0,
                    credit: totalAmount,
                    description: `IC Elimination: ${pairKey}`
                }
            ];

            const journalEntry: JournalEntry = {
                date: new Date(year, month - 1, 1),
                memo: memo || `IC Elimination: ${groupCode} ${year}-${month}`,
                lines: journalLines,
                tags: { module: 'consol', type: 'ic_elim', group: groupCode }
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
        const { rows: lineRows } = await pool.query(`
      SELECT id, run_id, entity_code, cp_code, amount_base, note
      FROM ic_elim_line 
      WHERE run_id = $1
    `, [row.id]);

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
                note: lineRow.note
            }))
        });
    }

    return runs;
}
