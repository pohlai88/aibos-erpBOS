import { describe, it, expect, beforeEach } from 'vitest';
import { createIcLink, createIcMatch, getIcMatches } from '../ic';
import { pool } from '@/lib/db';

describe('Intercompany Tagging & Matching', () => {
  const companyId = 'test-company';
  const actor = 'test-user';

  beforeEach(async () => {
    // Clean up test data in correct order (children first)
    await pool.query(
      `DELETE FROM ic_match_line WHERE match_id IN (SELECT id FROM ic_match WHERE company_id = $1)`,
      [companyId]
    );
    await pool.query(`DELETE FROM ic_match WHERE company_id = $1`, [companyId]);
    await pool.query(`DELETE FROM ic_link WHERE company_id = $1`, [companyId]);

    // Also clean up any orphaned match lines
    await pool.query(
      `DELETE FROM ic_match_line WHERE ic_link_id NOT IN (SELECT id FROM ic_link)`
    );
  });

  it('should create IC link with correct counterparty', async () => {
    const linkData = {
      entity_code: 'MY-CO',
      co_entity_cp: 'SG-CO',
      source_type: 'AR' as const,
      source_id: 'INV-1001',
      ext_ref: 'SG-PO-88',
      amount_base: 1200.0,
    };

    const result = await createIcLink(companyId, linkData);

    expect(result.entityCode).toBe('MY-CO');
    expect(result.coEntityCp).toBe('SG-CO');
    expect(result.sourceType).toBe('AR');
    expect(result.sourceId).toBe('INV-1001');
    expect(result.extRef).toBe('SG-PO-88');
    expect(result.amountBase).toBe(1200.0);
  });

  it('should create IC match with tolerance validation', async () => {
    // First create two IC links that should match
    const link1 = await createIcLink(companyId, {
      entity_code: 'MY-CO',
      co_entity_cp: 'SG-CO',
      source_type: 'AR',
      source_id: 'INV-1001',
      amount_base: 1200.0,
    });

    const link2 = await createIcLink(companyId, {
      entity_code: 'SG-CO',
      co_entity_cp: 'MY-CO',
      source_type: 'AP',
      source_id: 'INV-1001',
      amount_base: -1200.0,
    });

    const matchData = {
      group_code: 'APAC-GRP',
      year: 2025,
      month: 11,
      link_ids: [link1.id, link2.id],
      tolerance: 0.01,
    };

    const result = await createIcMatch(companyId, matchData, actor);

    expect(result.groupCode).toBe('APAC-GRP');
    expect(result.year).toBe(2025);
    expect(result.month).toBe(11);
    expect(result.tolerance).toBe(0.01);
    expect(result.links).toHaveLength(2);
  });

  it('should reject IC match when tolerance exceeded', async () => {
    // Create IC links that don't balance
    const link1 = await createIcLink(companyId, {
      entity_code: 'MY-CO',
      co_entity_cp: 'SG-CO',
      source_type: 'AR',
      source_id: 'INV-1001',
      amount_base: 1200.0,
    });

    const link2 = await createIcLink(companyId, {
      entity_code: 'SG-CO',
      co_entity_cp: 'MY-CO',
      source_type: 'AP',
      source_id: 'INV-1001',
      amount_base: -1000.0, // Different amount
    });

    const matchData = {
      group_code: 'APAC-GRP',
      year: 2025,
      month: 11,
      link_ids: [link1.id, link2.id],
      tolerance: 0.01,
    };

    await expect(createIcMatch(companyId, matchData, actor)).rejects.toThrow(
      'IC match tolerance exceeded'
    );
  });

  it('should allow IC match within tolerance', async () => {
    // Create IC links with small difference within tolerance
    const link1 = await createIcLink(companyId, {
      entity_code: 'MY-CO',
      co_entity_cp: 'SG-CO',
      source_type: 'AR',
      source_id: 'INV-1001',
      amount_base: 1200.0,
    });

    const link2 = await createIcLink(companyId, {
      entity_code: 'SG-CO',
      co_entity_cp: 'MY-CO',
      source_type: 'AP',
      source_id: 'INV-1001',
      amount_base: -1199.99, // Small difference
    });

    const matchData = {
      group_code: 'APAC-GRP',
      year: 2025,
      month: 11,
      link_ids: [link1.id, link2.id],
      tolerance: 0.01,
    };

    const result = await createIcMatch(companyId, matchData, actor);
    expect(result).toBeDefined();
  });

  it('should retrieve IC matches for specific period', async () => {
    // Create a match first
    const link1 = await createIcLink(companyId, {
      entity_code: 'MY-CO',
      co_entity_cp: 'SG-CO',
      source_type: 'AR',
      source_id: 'INV-1001',
      amount_base: 1200.0,
    });

    const link2 = await createIcLink(companyId, {
      entity_code: 'SG-CO',
      co_entity_cp: 'MY-CO',
      source_type: 'AP',
      source_id: 'INV-1001',
      amount_base: -1200.0,
    });

    await createIcMatch(
      companyId,
      {
        group_code: 'APAC-GRP',
        year: 2025,
        month: 11,
        link_ids: [link1.id, link2.id],
        tolerance: 0.01,
      },
      actor
    );

    const matches = await getIcMatches(companyId, 'APAC-GRP', 2025, 11);

    expect(matches).toHaveLength(1);
    expect(matches[0]?.groupCode).toBe('APAC-GRP');
    expect(matches[0]?.year).toBe(2025);
    expect(matches[0]?.month).toBe(11);
  });
});
