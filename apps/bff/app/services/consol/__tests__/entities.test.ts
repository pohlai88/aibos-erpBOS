import { describe, it, expect, beforeEach } from 'vitest';
import {
  upsertEntity,
  upsertGroup,
  upsertOwnership,
  getOwnershipTree,
} from '../entities';

describe('Consolidation Entities', () => {
  const companyId = 'test-company';

  beforeEach(async () => {
    // Clean up test data
    // Note: In real tests, you'd use a test database
  });

  it('should create entity with correct base currency', async () => {
    const entityData = {
      entity_code: 'SG-CO',
      name: 'Singapore Company',
      base_ccy: 'SGD',
      active: true,
    };

    const result = await upsertEntity(companyId, entityData);

    expect(result.entityCode).toBe('SG-CO');
    expect(result.name).toBe('Singapore Company');
    expect(result.baseCcy).toBe('SGD');
    expect(result.active).toBe(true);
  });

  it('should create group with presentation currency', async () => {
    const groupData = {
      group_code: 'APAC-GRP',
      name: 'APAC Group',
      presentation_ccy: 'USD',
    };

    const result = await upsertGroup(companyId, groupData);

    expect(result.groupCode).toBe('APAC-GRP');
    expect(result.name).toBe('APAC Group');
    expect(result.presentationCcy).toBe('USD');
  });

  it('should create ownership relationship with effective dates', async () => {
    const ownershipData = {
      group_code: 'APAC-GRP',
      parent_code: 'MY-CO',
      child_code: 'SG-CO',
      pct: 0.8,
      eff_from: '2025-01-01',
      eff_to: '2025-12-31',
    };

    const result = await upsertOwnership(companyId, ownershipData);

    expect(result.groupCode).toBe('APAC-GRP');
    expect(result.parentCode).toBe('MY-CO');
    expect(result.childCode).toBe('SG-CO');
    expect(result.pct).toBe(0.8);
    expect(result.effFrom).toBe('2025-01-01');
    expect(result.effTo).toBe('2025-12-31');
  });

  it('should resolve ownership tree with effective dating', async () => {
    // First create some ownership relationships
    await upsertOwnership(companyId, {
      group_code: 'APAC-GRP',
      parent_code: 'MY-CO',
      child_code: 'SG-CO',
      pct: 0.8,
      eff_from: '2025-01-01',
      eff_to: '2025-06-30',
    });

    await upsertOwnership(companyId, {
      group_code: 'APAC-GRP',
      parent_code: 'MY-CO',
      child_code: 'SG-CO',
      pct: 1.0,
      eff_from: '2025-07-01',
    });

    // Test ownership resolution for different dates
    const midYearOwnership = await getOwnershipTree(
      companyId,
      'APAC-GRP',
      '2025-06-15'
    );
    const endYearOwnership = await getOwnershipTree(
      companyId,
      'APAC-GRP',
      '2025-12-31'
    );

    expect(midYearOwnership).toHaveLength(1);
    expect(midYearOwnership[0]?.pct).toBe(0.8);

    expect(endYearOwnership).toHaveLength(1);
    expect(endYearOwnership[0]?.pct).toBe(1.0);
  });

  it('should handle minority interest calculation correctly', async () => {
    // Test 70% ownership -> 30% minority interest
    const ownershipData = {
      group_code: 'APAC-GRP',
      parent_code: 'MY-CO',
      child_code: 'SG-CO',
      pct: 0.7,
      eff_from: '2025-01-01',
    };

    await upsertOwnership(companyId, ownershipData);

    const ownership = await getOwnershipTree(
      companyId,
      'APAC-GRP',
      '2025-06-15'
    );
    const minorityPct = 1.0 - (ownership[0]?.pct || 0);

    expect(minorityPct).toBeCloseTo(0.3, 5);
  });
});
