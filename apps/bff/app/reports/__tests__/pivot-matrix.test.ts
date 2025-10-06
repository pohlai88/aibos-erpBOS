// Simple test runner for pivot matrix functionality
// This is a basic test without external dependencies

import { describe, it, expect } from 'vitest';
import { buildPivotMatrix } from '../pivot-matrix';

describe('buildPivotMatrix', () => {
  it('builds rows and totals with null label', () => {
    const lines = [
      {
        account_code: '6000',
        account_name: 'COGS',
        cost_center: 'CC-OPS',
        amount: 100,
      },
      {
        account_code: '6000',
        account_name: 'COGS',
        cost_center: null,
        amount: 50,
      },
      {
        account_code: '6100',
        account_name: 'Freight',
        cost_center: 'CC-OPS',
        amount: 30,
      },
    ];
    const m = buildPivotMatrix(
      lines,
      l => `${l.account_code} ${l.account_name}`,
      {
        pivotKey: 'cost_center',
        nullLabel: 'Unassigned',
        precision: 2,
        grandTotal: true,
        valueKey: 'amount',
      }
    );
    expect(m.pivots).toEqual(['CC-OPS', 'Unassigned']);
    expect(m.rows.find(r => r.row.startsWith('6000'))?.total).toBe(150);
    expect(m.totals_by_pivot['CC-OPS']).toBe(130);
    expect(m.totals_by_pivot['grand_total']).toBe(180);
  });

  it('handles project pivot', () => {
    const lines = [
      {
        account_code: '6000',
        account_name: 'COGS',
        project: 'PRJ-ALPHA',
        amount: 100,
      },
      {
        account_code: '6000',
        account_name: 'COGS',
        project: 'PRJ-BETA',
        amount: 50,
      },
      {
        account_code: '6100',
        account_name: 'Freight',
        project: 'PRJ-ALPHA',
        amount: 30,
      },
    ];
    const m = buildPivotMatrix(
      lines,
      l => `${l.account_code} ${l.account_name}`,
      {
        pivotKey: 'project',
        nullLabel: 'Unassigned',
        precision: 2,
        grandTotal: false,
        valueKey: 'amount',
      }
    );
    expect(m.pivots).toEqual(['PRJ-ALPHA', 'PRJ-BETA']);
    expect(m.rows.find(r => r.row.startsWith('6000'))?.total).toBe(150);
    expect(m.totals_by_pivot['PRJ-ALPHA']).toBe(130);
    expect(m.totals_by_pivot['grand_total']).toBeUndefined();
  });

  it('handles precision correctly', () => {
    const lines = [
      {
        account_code: '6000',
        account_name: 'COGS',
        cost_center: 'CC-OPS',
        amount: 100.123456,
      },
    ];
    const m = buildPivotMatrix(
      lines,
      l => `${l.account_code} ${l.account_name}`,
      {
        pivotKey: 'cost_center',
        nullLabel: 'Unassigned',
        precision: 3,
        grandTotal: true,
        valueKey: 'amount',
      }
    );
    expect(m.rows[0]?.['CC-OPS']).toBe(100.123);
    expect(m.totals_by_pivot['CC-OPS']).toBe(100.123);
  });
});
