import { pool } from '@/lib/db';
import { ulid } from 'ulid';
import { postJournal, JournalEntry } from '@/services/gl/journals';
import {
  EntityUpsertType,
  GroupUpsertType,
  OwnershipUpsertType,
  IcLinkCreateType,
  IcMatchCreateType,
  IcElimRunRequestType,
  ConsolRunRequestType,
} from '@aibos/contracts';

// --- Entity & Group Management (M21) ----------------------------------------
export interface CoEntity {
  companyId: string;
  entityCode: string;
  name: string;
  baseCcy: string;
  active: boolean;
}

export interface CoGroup {
  companyId: string;
  groupCode: string;
  name: string;
  presentationCcy: string;
}

export interface CoOwnership {
  companyId: string;
  groupCode: string;
  parentCode: string;
  childCode: string;
  pct: number;
  effFrom: string;
  effTo?: string | undefined;
}

export async function upsertEntity(
  companyId: string,
  data: EntityUpsertType
): Promise<CoEntity> {
  await pool.query(
    `
    INSERT INTO co_entity (company_id, entity_code, name, base_ccy, active)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (company_id, entity_code) 
    DO UPDATE SET name = $3, base_ccy = $4, active = $5
  `,
    [companyId, data.entity_code, data.name, data.base_ccy, data.active]
  );

  return {
    companyId,
    entityCode: data.entity_code,
    name: data.name,
    baseCcy: data.base_ccy,
    active: data.active,
  };
}

export async function upsertGroup(
  companyId: string,
  data: GroupUpsertType
): Promise<CoGroup> {
  await pool.query(
    `
    INSERT INTO co_group (company_id, group_code, name, presentation_ccy)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (company_id, group_code) 
    DO UPDATE SET name = $3, presentation_ccy = $4
  `,
    [companyId, data.group_code, data.name, data.presentation_ccy]
  );

  return {
    companyId,
    groupCode: data.group_code,
    name: data.name,
    presentationCcy: data.presentation_ccy,
  };
}

export async function upsertOwnership(
  companyId: string,
  data: OwnershipUpsertType
): Promise<CoOwnership> {
  await pool.query(
    `
    INSERT INTO co_ownership (company_id, group_code, parent_code, child_code, pct, eff_from, eff_to)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (company_id, group_code, parent_code, child_code, eff_from) 
    DO UPDATE SET pct = $5, eff_to = $7
  `,
    [
      companyId,
      data.group_code,
      data.parent_code,
      data.child_code,
      data.pct,
      data.eff_from,
      data.eff_to,
    ]
  );

  return {
    companyId,
    groupCode: data.group_code,
    parentCode: data.parent_code,
    childCode: data.child_code,
    pct: data.pct,
    effFrom: data.eff_from,
    effTo: data.eff_to,
  };
}

export async function getEntities(companyId: string): Promise<CoEntity[]> {
  const { rows } = await pool.query(
    `
    SELECT company_id, entity_code, name, base_ccy, active
    FROM co_entity 
    WHERE company_id = $1 AND active = true
    ORDER BY entity_code
  `,
    [companyId]
  );

  return rows.map(row => ({
    companyId: row.company_id,
    entityCode: row.entity_code,
    name: row.name,
    baseCcy: row.base_ccy,
    active: row.active,
  }));
}

export async function getGroups(companyId: string): Promise<CoGroup[]> {
  const { rows } = await pool.query(
    `
    SELECT company_id, group_code, name, presentation_ccy
    FROM co_group 
    WHERE company_id = $1
    ORDER BY group_code
  `,
    [companyId]
  );

  return rows.map(row => ({
    companyId: row.company_id,
    groupCode: row.group_code,
    name: row.name,
    presentationCcy: row.presentation_ccy,
  }));
}

export async function getOwnershipTree(
  companyId: string,
  groupCode: string,
  asOfDate: string
): Promise<CoOwnership[]> {
  const { rows } = await pool.query(
    `
    SELECT company_id, group_code, parent_code, child_code, pct, eff_from, eff_to
    FROM co_ownership 
    WHERE company_id = $1 AND group_code = $2
      AND eff_from <= $3 AND (eff_to IS NULL OR eff_to >= $3)
    ORDER BY parent_code, child_code
  `,
    [companyId, groupCode, asOfDate]
  );

  return rows.map(row => ({
    companyId: row.company_id,
    groupCode: row.group_code,
    parentCode: row.parent_code,
    childCode: row.child_code,
    pct: Number(row.pct),
    effFrom: row.eff_from,
    effTo: row.eff_to,
  }));
}
