import { describe, it, expect } from 'vitest';
import { importRatesCsv } from '../ratesCsv';

describe('FX rates CSV import', () => {
  it('parses CSV with default mapping', async () => {
    const csvContent = `as_of_date,src_ccy,dst_ccy,rate
2025-11-30,USD,MYR,4.65
2025-11-30,EUR,MYR,5.12`;

    // Mock the upsertRate function to avoid DB calls
    const result = await importRatesCsv('test-co', 'test-user', csvContent);

    expect(result.upserted).toBe(2);
    expect(result.errors).toHaveLength(0);
  });

  it('handles custom column mapping', async () => {
    const csvContent = `Date,From,To,Rate
2025-11-30,USD,MYR,4.65`;

    const mapping = {
      as_of_date: 'Date',
      src_ccy: 'From',
      dst_ccy: 'To',
      rate: 'Rate',
    };

    const result = await importRatesCsv(
      'test-co',
      'test-user',
      csvContent,
      mapping
    );

    expect(result.upserted).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it('reports errors for invalid data', async () => {
    const csvContent = `as_of_date,src_ccy,dst_ccy,rate
2025-11-30,USD,MYR,invalid
2025-11-30,,MYR,4.65`;

    const result = await importRatesCsv('test-co', 'test-user', csvContent);

    expect(result.upserted).toBe(0);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].line).toBe(2);
    expect(result.errors[1].line).toBe(3);
  });
});
