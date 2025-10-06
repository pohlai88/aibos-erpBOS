import { pool } from '@/lib/db';
import { ulid } from 'ulid';
import {
  IcElimRuleUpsertType,
  IcAutoMatchRequestType,
  IcProposalDecisionType,
} from '@aibos/contracts';

// --- IC Auto-Matching Interfaces (M21.2) --------------------------------------
export interface IcElimRule {
  companyId: string;
  ruleCode: string;
  srcAccountLike?: string;
  cpAccountLike?: string;
  note?: string;
  active: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface IcMatchProposal {
  id: string;
  companyId: string;
  groupCode: string;
  year: number;
  month: number;
  score: number;
  createdAt: string;
  links?: IcProposalLink[];
}

export interface IcProposalLink {
  id: string;
  entityCode: string;
  coEntityCp: string;
  sourceType: string;
  sourceId: string;
  extRef?: string;
  amountBase: number;
  postedAt: string;
  hint?: string;
}

export interface IcWorkbenchDecision {
  id: string;
  proposalId: string;
  decidedBy: string;
  decision: string;
  reason?: string;
  decidedAt: string;
}

// --- IC Elimination Rule Management (M21.2) -----------------------------------
export async function upsertIcElimRule(
  companyId: string,
  data: IcElimRuleUpsertType,
  updatedBy: string
): Promise<IcElimRule> {
  await pool.query(
    `
        INSERT INTO ic_elim_map (company_id, rule_code, src_account_like, cp_account_like, note, active, updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (company_id, rule_code) 
        DO UPDATE SET src_account_like = $3, cp_account_like = $4, note = $5, active = $6, updated_by = $7, updated_at = now()
    `,
    [
      companyId,
      data.rule_code,
      data.src_account_like,
      data.cp_account_like,
      data.note,
      data.active,
      updatedBy,
    ]
  );

  const result = await pool.query(
    `
        SELECT rule_code, src_account_like, cp_account_like, note, active, updated_at, updated_by
        FROM ic_elim_map
        WHERE company_id = $1 AND rule_code = $2
    `,
    [companyId, data.rule_code]
  );

  return {
    companyId,
    ruleCode: result.rows[0].rule_code,
    srcAccountLike: result.rows[0].src_account_like,
    cpAccountLike: result.rows[0].cp_account_like,
    note: result.rows[0].note,
    active: result.rows[0].active,
    updatedAt: result.rows[0].updated_at.toISOString(),
    updatedBy: result.rows[0].updated_by,
  };
}

export async function getIcElimRules(companyId: string): Promise<IcElimRule[]> {
  const result = await pool.query(
    `
        SELECT rule_code, src_account_like, cp_account_like, note, active, updated_at, updated_by
        FROM ic_elim_map
        WHERE company_id = $1 AND active = true
        ORDER BY rule_code
    `,
    [companyId]
  );

  return result.rows.map(row => ({
    companyId,
    ruleCode: row.rule_code,
    srcAccountLike: row.src_account_like,
    cpAccountLike: row.cp_account_like,
    note: row.note,
    active: row.active,
    updatedAt: row.updated_at.toISOString(),
    updatedBy: row.updated_by,
  }));
}

// --- Auto-Matching Engine (M21.2) ---------------------------------------------
export async function generateAutoMatchProposals(
  companyId: string,
  data: IcAutoMatchRequestType
): Promise<IcMatchProposal[]> {
  // Get all IC links for the group and period
  const icLinks = await getIcLinksForPeriod(
    companyId,
    data.group_code,
    data.year,
    data.month
  );

  // Get elimination rules for pattern matching
  const elimRules = await getIcElimRules(companyId);

  // Generate proposals using heuristics
  const proposals = await generateProposalsWithHeuristics(
    icLinks,
    elimRules,
    data.tolerance,
    data.window_days
  );

  // Save proposals to database
  const savedProposals: IcMatchProposal[] = [];

  for (const proposal of proposals) {
    const proposalId = ulid();

    // Save proposal
    await pool.query(
      `
            INSERT INTO ic_match_proposal (id, company_id, group_code, year, month, score)
            VALUES ($1, $2, $3, $4, $5, $6)
        `,
      [
        proposalId,
        companyId,
        data.group_code,
        data.year,
        data.month,
        proposal.score,
      ]
    );

    // Save proposal lines
    for (const linkId of proposal.linkIds) {
      const lineId = ulid();
      await pool.query(
        `
                INSERT INTO ic_match_proposal_line (id, proposal_id, ic_link_id, hint)
                VALUES ($1, $2, $3, $4)
            `,
        [lineId, proposalId, linkId, proposal.hints.get(linkId)]
      );
    }

    savedProposals.push({
      id: proposalId,
      companyId,
      groupCode: data.group_code,
      year: data.year,
      month: data.month,
      score: proposal.score,
      createdAt: new Date().toISOString(),
      links: proposal.links,
    });
  }

  return savedProposals;
}

async function getIcLinksForPeriod(
  companyId: string,
  groupCode: string,
  year: number,
  month: number
): Promise<any[]> {
  const { rows } = await pool.query(
    `
        SELECT il.id, il.entity_code, il.co_entity_cp, il.source_type, il.source_id, 
               il.ext_ref, il.amount_base, il.posted_at
        FROM ic_link il
        JOIN co_entity e1 ON il.entity_code = e1.entity_code
        JOIN co_entity e2 ON il.co_entity_cp = e2.entity_code
        JOIN co_ownership o1 ON e1.entity_code = o1.child_code
        JOIN co_ownership o2 ON e2.entity_code = o2.child_code
        WHERE il.company_id = $1 
        AND o1.group_code = $2 AND o2.group_code = $2
        AND EXTRACT(YEAR FROM il.posted_at) = $3
        AND EXTRACT(MONTH FROM il.posted_at) = $4
        ORDER BY il.posted_at DESC
    `,
    [companyId, groupCode, year, month]
  );

  return rows;
}

async function generateProposalsWithHeuristics(
  icLinks: any[],
  elimRules: IcElimRule[],
  tolerance: number,
  windowDays: number
): Promise<
  Array<{
    linkIds: string[];
    score: number;
    hints: Map<string, string>;
    links: IcProposalLink[];
  }>
> {
  const proposals: Array<{
    linkIds: string[];
    score: number;
    hints: Map<string, string>;
    links: IcProposalLink[];
  }> = [];

  // Group links by entity pairs
  const entityPairs = new Map<string, any[]>();
  for (const link of icLinks) {
    const pairKey = `${link.entity_code}|${link.co_entity_cp}`;
    if (!entityPairs.has(pairKey)) {
      entityPairs.set(pairKey, []);
    }
    entityPairs.get(pairKey)!.push(link);
  }

  // Process each entity pair
  for (const [pairKey, links] of entityPairs) {
    const [entityA, entityB] = pairKey.split('|');

    // Find matching pairs using heuristics
    const matches = findMatchingPairs(links, elimRules, tolerance, windowDays);

    for (const match of matches) {
      const score = calculateMatchScore(match, elimRules);

      if (score > 0.3) {
        // Minimum confidence threshold
        proposals.push({
          linkIds: match.map(m => m.id),
          score,
          hints: new Map(match.map(m => [m.id, m.hint])),
          links: match.map(link => ({
            id: link.id,
            entityCode: link.entity_code,
            coEntityCp: link.co_entity_cp,
            sourceType: link.source_type,
            sourceId: link.source_id,
            extRef: link.ext_ref,
            amountBase: Number(link.amount_base),
            postedAt: link.posted_at.toISOString(),
            hint: link.hint,
          })),
        });
      }
    }
  }

  return proposals.sort((a, b) => b.score - a.score); // Sort by score descending
}

function findMatchingPairs(
  links: any[],
  elimRules: IcElimRule[],
  tolerance: number,
  windowDays: number
): any[][] {
  const matches: any[][] = [];
  const usedLinks = new Set<string>();

  for (let i = 0; i < links.length; i++) {
    if (usedLinks.has(links[i].id)) continue;

    const linkA = links[i];
    const candidates: any[] = [];

    for (let j = i + 1; j < links.length; j++) {
      if (usedLinks.has(links[j].id)) continue;

      const linkB = links[j];

      // Check if they form a valid IC pair (A->B and B->A)
      if (
        (linkA.entity_code === linkB.co_entity_cp &&
          linkA.co_entity_cp === linkB.entity_code) ||
        (linkA.entity_code === linkB.entity_code &&
          linkA.co_entity_cp === linkB.co_entity_cp)
      ) {
        const matchScore = calculatePairScore(
          linkA,
          linkB,
          elimRules,
          tolerance,
          windowDays
        );
        if (matchScore.score > 0) {
          candidates.push({
            ...linkB,
            score: matchScore.score,
            hint: matchScore.hint,
          });
        }
      }
    }

    if (candidates.length > 0) {
      // Find best match
      const bestMatch = candidates.reduce((best, current) =>
        current.score > best.score ? current : best
      );

      matches.push([linkA, bestMatch]);
      usedLinks.add(linkA.id);
      usedLinks.add(bestMatch.id);
    }
  }

  return matches;
}

function calculatePairScore(
  linkA: any,
  linkB: any,
  elimRules: IcElimRule[],
  tolerance: number,
  windowDays: number
): { score: number; hint: string } {
  let score = 0;
  const hints: string[] = [];

  // Amount parity check (strongest signal)
  const amountDiff = Math.abs(
    Number(linkA.amount_base) + Number(linkB.amount_base)
  );
  if (amountDiff <= tolerance) {
    score += 0.4;
    hints.push('amount_match');
  } else if (amountDiff <= tolerance * 10) {
    score += 0.2;
    hints.push('amount_close');
  }

  // External reference match (strong signal)
  if (
    linkA.ext_ref &&
    linkB.ext_ref &&
    normalizeExtRef(linkA.ext_ref) === normalizeExtRef(linkB.ext_ref)
  ) {
    score += 0.3;
    hints.push('ext_ref_match');
  }

  // Date proximity (medium signal)
  const dateDiff = Math.abs(
    new Date(linkA.posted_at).getTime() - new Date(linkB.posted_at).getTime()
  );
  const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
  if (daysDiff <= windowDays) {
    score += 0.2;
    hints.push('date_nearby');
  }

  // Account pattern rule match (medium signal)
  for (const rule of elimRules) {
    if (rule.srcAccountLike && rule.cpAccountLike) {
      const srcMatch =
        linkA.source_type.includes(rule.srcAccountLike) ||
        linkB.source_type.includes(rule.srcAccountLike);
      const cpMatch =
        linkA.source_type.includes(rule.cpAccountLike) ||
        linkB.source_type.includes(rule.cpAccountLike);

      if (srcMatch && cpMatch) {
        score += 0.1;
        hints.push(`rule_${rule.ruleCode}`);
      }
    }
  }

  return { score: Math.min(score, 1.0), hint: hints.join(',') };
}

function calculateMatchScore(match: any[], elimRules: IcElimRule[]): number {
  // Average score of all pairs in the match
  return match.reduce((sum, link) => sum + (link.score || 0), 0) / match.length;
}

function normalizeExtRef(extRef: string): string {
  return extRef.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// --- Workbench Management (M21.2) ---------------------------------------------
export async function getMatchProposals(
  companyId: string,
  groupCode?: string,
  year?: number,
  month?: number
): Promise<IcMatchProposal[]> {
  let query = `
        SELECT id, group_code, year, month, score, created_at
        FROM ic_match_proposal 
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

  query += ` ORDER BY score DESC, created_at DESC`;

  const { rows } = await pool.query(query, params);

  const proposals: IcMatchProposal[] = [];

  for (const row of rows) {
    // Get proposal lines with IC link details
    const { rows: lineRows } = await pool.query(
      `
            SELECT il.id, il.entity_code, il.co_entity_cp, il.source_type, il.source_id,
                   il.ext_ref, il.amount_base, il.posted_at, impl.hint
            FROM ic_match_proposal_line impl
            JOIN ic_link il ON impl.ic_link_id = il.id
            WHERE impl.proposal_id = $1
        `,
      [row.id]
    );

    proposals.push({
      id: row.id,
      companyId,
      groupCode: row.group_code,
      year: row.year,
      month: row.month,
      score: Number(row.score),
      createdAt: row.created_at.toISOString(),
      links: lineRows.map(linkRow => ({
        id: linkRow.id,
        entityCode: linkRow.entity_code,
        coEntityCp: linkRow.co_entity_cp,
        sourceType: linkRow.source_type,
        sourceId: linkRow.source_id,
        extRef: linkRow.ext_ref,
        amountBase: Number(linkRow.amount_base),
        postedAt: linkRow.posted_at.toISOString(),
        hint: linkRow.hint,
      })),
    });
  }

  return proposals;
}

export async function makeProposalDecision(
  companyId: string,
  data: IcProposalDecisionType,
  decidedBy: string
): Promise<IcWorkbenchDecision> {
  const decisionId = ulid();

  await pool.query(
    `
        INSERT INTO ic_workbench_decision (id, proposal_id, decided_by, decision, reason)
        VALUES ($1, $2, $3, $4, $5)
    `,
    [decisionId, data.proposal_id, decidedBy, data.decision, data.reason]
  );

  // If accepted, create IC match record
  if (data.decision === 'accept') {
    await createIcMatchFromProposal(companyId, data.proposal_id, decidedBy);
  }

  return {
    id: decisionId,
    proposalId: data.proposal_id,
    decidedBy,
    decision: data.decision,
    reason: data.reason || '',
    decidedAt: new Date().toISOString(),
  };
}

async function createIcMatchFromProposal(
  companyId: string,
  proposalId: string,
  createdBy: string
): Promise<void> {
  // Get proposal details
  const { rows: proposalRows } = await pool.query(
    `
        SELECT group_code, year, month
        FROM ic_match_proposal
        WHERE id = $1 AND company_id = $2
    `,
    [proposalId, companyId]
  );

  if (proposalRows.length === 0) {
    throw new Error('Proposal not found');
  }

  const proposal = proposalRows[0];

  // Get proposal lines
  const { rows: lineRows } = await pool.query(
    `
        SELECT ic_link_id
        FROM ic_match_proposal_line
        WHERE proposal_id = $1
    `,
    [proposalId]
  );

  if (lineRows.length < 2) {
    throw new Error('Proposal must have at least 2 IC links');
  }

  // Create IC match record
  const matchId = ulid();
  await pool.query(
    `
        INSERT INTO ic_match (id, company_id, group_code, year, month, tolerance, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      matchId,
      companyId,
      proposal.group_code,
      proposal.year,
      proposal.month,
      0.01,
      createdBy,
    ]
  );

  // Create IC match lines
  for (const line of lineRows) {
    const lineId = ulid();
    await pool.query(
      `
            INSERT INTO ic_match_line (id, match_id, ic_link_id)
            VALUES ($1, $2, $3)
        `,
      [lineId, matchId, line.ic_link_id]
    );
  }
}
