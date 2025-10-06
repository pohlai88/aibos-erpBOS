import { pool } from '@/lib/db';
import { ulid } from 'ulid';
import { IcLinkCreateType, IcMatchCreateType } from '@aibos/contracts';

// --- Intercompany Tagging & Matching (M21) --------------------------------
export interface IcLink {
  id: string;
  companyId: string;
  entityCode: string;
  coEntityCp: string;
  sourceType: string;
  sourceId: string;
  extRef?: string;
  amountBase: number;
  postedAt: string;
}

export interface IcMatch {
  id: string;
  companyId: string;
  groupCode: string;
  year: number;
  month: number;
  tolerance: number;
  createdAt: string;
  createdBy: string;
  links?: IcLink[];
}

export async function createIcLink(
  companyId: string,
  data: IcLinkCreateType
): Promise<IcLink> {
  const id = ulid();

  await pool.query(
    `
    INSERT INTO ic_link (id, company_id, entity_code, co_entity_cp, source_type, source_id, ext_ref, amount_base)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `,
    [
      id,
      companyId,
      data.entity_code,
      data.co_entity_cp,
      data.source_type,
      data.source_id,
      data.ext_ref,
      data.amount_base,
    ]
  );

  const { rows } = await pool.query(
    `
    SELECT id, company_id, entity_code, co_entity_cp, source_type, source_id, ext_ref, amount_base, posted_at
    FROM ic_link WHERE id = $1
  `,
    [id]
  );

  const row = rows[0];
  return {
    id: row.id,
    companyId: row.company_id,
    entityCode: row.entity_code,
    coEntityCp: row.co_entity_cp,
    sourceType: row.source_type,
    sourceId: row.source_id,
    extRef: row.ext_ref,
    amountBase: Number(row.amount_base),
    postedAt: row.posted_at,
  };
}

export async function createIcMatch(
  companyId: string,
  data: IcMatchCreateType,
  createdBy: string
): Promise<IcMatch> {
  const matchId = ulid();

  // Validate that all links exist and belong to the company
  const { rows: linkRows } = await pool.query(
    `
    SELECT id, entity_code, co_entity_cp, amount_base
    FROM ic_link 
    WHERE id = ANY($1) AND company_id = $2
  `,
    [data.link_ids, companyId]
  );

  if (linkRows.length !== data.link_ids.length) {
    throw new Error("Some IC links not found or don't belong to company");
  }

  // Check if amounts sum to zero within tolerance
  const totalAmount = linkRows.reduce(
    (sum, link) => sum + Number(link.amount_base),
    0
  );
  if (Math.abs(totalAmount) > data.tolerance) {
    throw new Error(
      `IC match tolerance exceeded: ${totalAmount} > ${data.tolerance}`
    );
  }

  // Use transaction to ensure atomicity
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create match
    await client.query(
      `
        INSERT INTO ic_match (id, company_id, group_code, year, month, tolerance, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        matchId,
        companyId,
        data.group_code,
        data.year,
        data.month,
        data.tolerance,
        createdBy,
      ]
    );

    // Create match lines
    for (const linkId of data.link_ids) {
      const lineId = ulid();
      await client.query(
        `
          INSERT INTO ic_match_line (id, match_id, ic_link_id)
          VALUES ($1, $2, $3)
        `,
        [lineId, matchId, linkId]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return {
    id: matchId,
    companyId,
    groupCode: data.group_code,
    year: data.year,
    month: data.month,
    tolerance: data.tolerance,
    createdAt: new Date().toISOString(),
    createdBy,
    links: linkRows.map(row => ({
      id: row.id,
      companyId,
      entityCode: row.entity_code,
      coEntityCp: row.co_entity_cp,
      sourceType: '',
      sourceId: '',
      amountBase: Number(row.amount_base),
      postedAt: '',
    })),
  };
}

export async function getIcMatches(
  companyId: string,
  groupCode: string,
  year: number,
  month: number
): Promise<IcMatch[]> {
  const { rows } = await pool.query(
    `
    SELECT m.id, m.company_id, m.group_code, m.year, m.month, m.tolerance, m.created_at, m.created_by
    FROM ic_match m
    WHERE m.company_id = $1 AND m.group_code = $2 AND m.year = $3 AND m.month = $4
    ORDER BY m.created_at DESC
  `,
    [companyId, groupCode, year, month]
  );

  const matches: IcMatch[] = [];

  for (const row of rows) {
    // Get links for this match
    const { rows: linkRows } = await pool.query(
      `
      SELECT l.id, l.entity_code, l.co_entity_cp, l.source_type, l.source_id, l.ext_ref, l.amount_base, l.posted_at
      FROM ic_link l
      JOIN ic_match_line ml ON l.id = ml.ic_link_id
      WHERE ml.match_id = $1
    `,
      [row.id]
    );

    matches.push({
      id: row.id,
      companyId: row.company_id,
      groupCode: row.group_code,
      year: row.year,
      month: row.month,
      tolerance: Number(row.tolerance),
      createdAt: row.created_at,
      createdBy: row.created_by,
      links: linkRows.map(linkRow => ({
        id: linkRow.id,
        companyId,
        entityCode: linkRow.entity_code,
        coEntityCp: linkRow.co_entity_cp,
        sourceType: linkRow.source_type,
        sourceId: linkRow.source_id,
        extRef: linkRow.ext_ref,
        amountBase: Number(linkRow.amount_base),
        postedAt: linkRow.posted_at,
      })),
    });
  }

  return matches;
}

export async function getIcLinks(
  companyId: string,
  entityCode?: string,
  coEntityCp?: string
): Promise<IcLink[]> {
  let query = `
    SELECT id, company_id, entity_code, co_entity_cp, source_type, source_id, ext_ref, amount_base, posted_at
    FROM ic_link 
    WHERE company_id = $1
  `;
  const params: any[] = [companyId];
  let paramIndex = 2;

  if (entityCode) {
    query += ` AND entity_code = $${paramIndex}`;
    params.push(entityCode);
    paramIndex++;
  }

  if (coEntityCp) {
    query += ` AND co_entity_cp = $${paramIndex}`;
    params.push(coEntityCp);
    paramIndex++;
  }

  query += ` ORDER BY posted_at DESC`;

  const { rows } = await pool.query(query, params);

  return rows.map(row => ({
    id: row.id,
    companyId: row.company_id,
    entityCode: row.entity_code,
    coEntityCp: row.co_entity_cp,
    sourceType: row.source_type,
    sourceId: row.source_id,
    extRef: row.ext_ref,
    amountBase: Number(row.amount_base),
    postedAt: row.posted_at,
  }));
}
