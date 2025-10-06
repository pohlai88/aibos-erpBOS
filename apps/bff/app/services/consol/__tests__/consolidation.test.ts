import { describe, it, expect, beforeEach } from 'vitest';
import { pool } from '@/lib/db';
import { ulid } from 'ulid';
import { runConsolidation, getConsolRuns } from '../consolidation';
import { upsertEntity, upsertGroup, upsertOwnership } from '../entities';

describe('Consolidation Engine', () => {
  const companyId = 'test-company';
  const actor = 'test-user';

  beforeEach(async () => {
    // Clean up test data
    await pool.query('DELETE FROM consol_summary WHERE run_id LIKE $1', [
      `test-run-%`,
    ]);
    await pool.query('DELETE FROM consol_run WHERE company_id = $1', [
      companyId,
    ]);
    await pool.query('DELETE FROM consol_lock WHERE company_id = $1', [
      companyId,
    ]);
    await pool.query('DELETE FROM co_ownership WHERE company_id = $1', [
      companyId,
    ]);
    await pool.query('DELETE FROM co_group WHERE company_id = $1', [companyId]);
    await pool.query('DELETE FROM co_entity WHERE company_id = $1', [
      companyId,
    ]);
    await pool.query(
      'DELETE FROM journal_line WHERE journal_id IN (SELECT id FROM journal WHERE company_id = $1)',
      [companyId]
    );
    await pool.query('DELETE FROM journal WHERE company_id = $1', [companyId]);
    await pool.query('DELETE FROM fx_admin_rates WHERE company_id = $1', [
      companyId,
    ]);

    // Create test company
    await pool.query(
      `
            INSERT INTO company (id, code, name, currency, base_currency)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO NOTHING
        `,
      [companyId, `TEST-${Date.now()}`, 'Test Company', 'USD', 'USD']
    );

    // Add FX rates for currency translation
    await pool.query(
      `
            INSERT INTO fx_admin_rates (company_id, as_of_date, src_ccy, dst_ccy, rate, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (company_id, as_of_date, src_ccy, dst_ccy) DO NOTHING
        `,
      [companyId, new Date('2025-11-30'), 'SGD', 'USD', 0.74, 'test-user']
    );

    await pool.query(
      `
            INSERT INTO fx_admin_rates (company_id, as_of_date, src_ccy, dst_ccy, rate, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (company_id, as_of_date, src_ccy, dst_ccy) DO NOTHING
        `,
      [companyId, new Date('2025-11-30'), 'MYR', 'USD', 0.22, 'test-user']
    );
  });

  it('should run dry-run consolidation with translation', async () => {
    // Set up entities and group
    await upsertEntity(companyId, {
      entity_code: 'MY-CO',
      name: 'Malaysia Company',
      base_ccy: 'MYR',
      active: true,
    });

    await upsertEntity(companyId, {
      entity_code: 'SG-CO',
      name: 'Singapore Company',
      base_ccy: 'SGD',
      active: true,
    });

    await upsertGroup(companyId, {
      group_code: 'APAC-GRP',
      name: 'APAC Group',
      presentation_ccy: 'USD',
    });

    await upsertOwnership(companyId, {
      group_code: 'APAC-GRP',
      parent_code: 'MY-CO',
      child_code: 'SG-CO',
      pct: 1.0,
      eff_from: '2025-01-01',
    });

    const consolData = {
      group_code: 'APAC-GRP',
      year: 2025,
      month: 11,
      dry_run: true,
      present_ccy: 'USD',
      memo: 'Test consolidation',
    };

    const result = await runConsolidation(companyId, consolData, actor);

    expect(result.runId).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.consolidatedPl).toBeDefined();
    expect(result.consolidatedBs).toBeDefined();
  });

  it('should calculate minority interest correctly', async () => {
    // Set up entities with partial ownership
    await upsertEntity(companyId, {
      entity_code: 'MY-CO',
      name: 'Malaysia Company',
      base_ccy: 'MYR',
      active: true,
    });

    await upsertEntity(companyId, {
      entity_code: 'SG-CO',
      name: 'Singapore Company',
      base_ccy: 'SGD',
      active: true,
    });

    await upsertGroup(companyId, {
      group_code: 'APAC-GRP',
      name: 'APAC Group',
      presentation_ccy: 'USD',
    });

    // 70% ownership -> 30% minority interest
    await upsertOwnership(companyId, {
      group_code: 'APAC-GRP',
      parent_code: 'MY-CO',
      child_code: 'SG-CO',
      pct: 0.7,
      eff_from: '2025-01-01',
    });

    // Create trial balance data for minority interest calculation
    // Add some journal entries to create trial balance
    const journalId = ulid();
    await pool.query(
      `
            INSERT INTO journal (id, company_id, posting_date, currency, source_doctype, source_id, idempotency_key, base_currency, rate_used)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
      [
        journalId,
        companyId,
        new Date('2025-11-15'),
        'SGD',
        'SG-CO_JOURNAL',
        'test-source',
        ulid(),
        'SGD',
        1.0,
      ]
    );

    // Add journal lines for equity and P&L accounts (unbalanced to create minority interest)
    await pool.query(
      `
            INSERT INTO journal_line (id, journal_id, account_code, dc, amount, currency, base_amount, base_currency, txn_amount, txn_currency, cost_center_id, project_id)
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12),
                ($13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24),
                ($25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)
        `,
      [
        ulid(),
        journalId,
        '3000',
        'C',
        2000.0,
        'SGD',
        2000.0,
        'SGD',
        2000.0,
        'SGD',
        null,
        null, // Equity account (larger)
        ulid(),
        journalId,
        '5000',
        'D',
        1000.0,
        'SGD',
        1000.0,
        'SGD',
        1000.0,
        'SGD',
        null,
        null, // P&L account (smaller)
        ulid(),
        journalId,
        '3990',
        'C',
        300.0,
        'SGD',
        300.0,
        'SGD',
        300.0,
        'SGD',
        null,
        null, // NCI Equity account (30% of 1000 difference)
      ]
    );

    const consolData = {
      group_code: 'APAC-GRP',
      year: 2025,
      month: 11,
      dry_run: true,
      present_ccy: 'USD',
    };

    const result = await runConsolidation(companyId, consolData, actor);

    // Check that minority interest summary is created
    const minoritySummary = result.summary.find(
      s => s.component === 'MINORITY'
    );
    expect(minoritySummary).toBeDefined();
    expect(minoritySummary?.label).toBe('Minority Interest');
  });

  it('should handle currency translation with CTA', async () => {
    // Set up entities with different base currencies
    await upsertEntity(companyId, {
      entity_code: 'MY-CO',
      name: 'Malaysia Company',
      base_ccy: 'MYR',
      active: true,
    });

    await upsertEntity(companyId, {
      entity_code: 'SG-CO',
      name: 'Singapore Company',
      base_ccy: 'SGD',
      active: true,
    });

    await upsertGroup(companyId, {
      group_code: 'APAC-GRP',
      name: 'APAC Group',
      presentation_ccy: 'USD',
    });

    await upsertOwnership(companyId, {
      group_code: 'APAC-GRP',
      parent_code: 'MY-CO',
      child_code: 'SG-CO',
      pct: 1.0,
      eff_from: '2025-01-01',
    });

    // Also add MY-CO to the group (self-reference for root entity)
    await upsertOwnership(companyId, {
      group_code: 'APAC-GRP',
      parent_code: 'MY-CO',
      child_code: 'MY-CO',
      pct: 1.0,
      eff_from: '2025-01-01',
    });

    // Create trial balance data for currency translation
    const journalId = ulid();
    await pool.query(
      `
            INSERT INTO journal (id, company_id, posting_date, currency, source_doctype, source_id, idempotency_key, base_currency, rate_used)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
      [
        journalId,
        companyId,
        new Date('2025-11-15'),
        'SGD',
        'SG-CO_JOURNAL',
        'test-source',
        ulid(),
        'SGD',
        1.0,
      ]
    );

    // Add journal lines for currency translation
    await pool.query(
      `
            INSERT INTO journal_line (id, journal_id, account_code, dc, amount, currency, base_amount, base_currency, txn_amount, txn_currency, cost_center_id, project_id)
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12),
                ($13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24),
                ($25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36)
        `,
      [
        ulid(),
        journalId,
        '3000',
        'C',
        2000.0,
        'SGD',
        2000.0,
        'SGD',
        2000.0,
        'SGD',
        null,
        null, // Equity account (larger)
        ulid(),
        journalId,
        '5000',
        'D',
        1000.0,
        'SGD',
        1000.0,
        'SGD',
        1000.0,
        'SGD',
        null,
        null, // P&L account (smaller)
        ulid(),
        journalId,
        'CTA',
        'C',
        150.0,
        'SGD',
        150.0,
        'SGD',
        150.0,
        'SGD',
        null,
        null, // Currency Translation Adjustment
      ]
    );

    const consolData = {
      group_code: 'APAC-GRP',
      year: 2025,
      month: 11,
      dry_run: true,
      present_ccy: 'USD',
    };

    const result = await runConsolidation(companyId, consolData, actor);

    // Check that translation summary is created
    const translationSummary = result.summary.find(
      s => s.component === 'TRANSLATION'
    );
    expect(translationSummary).toBeDefined();
    expect(translationSummary?.label).toBe('Currency Translation Adjustment');
  });

  it('should be idempotent on multiple runs', async () => {
    // Set up basic consolidation structure
    await upsertEntity(companyId, {
      entity_code: 'MY-CO',
      name: 'Malaysia Company',
      base_ccy: 'MYR',
      active: true,
    });

    await upsertGroup(companyId, {
      group_code: 'APAC-GRP',
      name: 'APAC Group',
      presentation_ccy: 'USD',
    });

    const consolData = {
      group_code: 'APAC-GRP',
      year: 2025,
      month: 11,
      dry_run: true,
      present_ccy: 'USD',
    };

    const result1 = await runConsolidation(companyId, consolData, actor);
    const result2 = await runConsolidation(companyId, consolData, actor);

    // Both runs should produce consistent results
    expect(result1.summary).toHaveLength(result2.summary.length);
    expect(result1.consolidatedPl).toHaveLength(
      result2.consolidatedPl?.length || 0
    );
    expect(result1.consolidatedBs).toHaveLength(
      result2.consolidatedBs?.length || 0
    );
  });

  it('should retrieve consolidation runs', async () => {
    // Run a consolidation first
    await upsertEntity(companyId, {
      entity_code: 'MY-CO',
      name: 'Malaysia Company',
      base_ccy: 'MYR',
      active: true,
    });

    await upsertGroup(companyId, {
      group_code: 'APAC-GRP',
      name: 'APAC Group',
      presentation_ccy: 'USD',
    });

    await runConsolidation(
      companyId,
      {
        group_code: 'APAC-GRP',
        year: 2025,
        month: 11,
        dry_run: true,
        present_ccy: 'USD',
      },
      actor
    );

    const runs = await getConsolRuns(companyId, 'APAC-GRP', 2025, 11);

    expect(runs).toHaveLength(1);
    expect(runs[0]?.groupCode).toBe('APAC-GRP');
    expect(runs[0]?.year).toBe(2025);
    expect(runs[0]?.month).toBe(11);
    expect(runs[0]?.mode).toBe('dry_run');
    expect(runs[0]?.presentCcy).toBe('USD');
  });
});
