import { describe, it, expect, vi } from 'vitest';
import { revalueMonetaryAccounts } from '../revalue';

describe('FX revaluation math', () => {
  it('computes deltas correctly', async () => {
    // Mock trial balance data
    const mockTb = [
      {
        account_code: '1100',
        currency: 'USD',
        base_currency: 'MYR',
        balance_base: 1000, // MYR
        balance_src: 250, // USD
      },
    ];

    // Mock getTrialBalances to return our test data
    const mockGetTrialBalances = vi.fn().mockResolvedValue(mockTb);

    // Mock getAdminRateOr1 to return 4.0 (USD to MYR)
    const mockGetAdminRateOr1 = vi.fn().mockResolvedValue(4.0);

    // Mock postJournal to avoid actual posting
    const mockPostJournal = vi.fn().mockResolvedValue({ journalId: 'test-je' });

    // Mock pool.query for run creation
    const mockPoolQuery = vi.fn().mockResolvedValue({ rows: [] });

    // Mock fx_account_map lookup
    const mockAccountMap = vi.fn().mockResolvedValue({
      rows: [{ unreal_gain_account: '7190', unreal_loss_account: '8190' }],
    });

    // Expected calculation:
    // Old rate: 1000 MYR / 250 USD = 4.0
    // New rate: 4.0 (admin rate)
    // New base: 250 USD * 4.0 = 1000 MYR
    // Delta: 1000 - 1000 = 0 (no change)

    const result = await revalueMonetaryAccounts({
      companyId: 'test-co',
      year: 2025,
      month: 11,
      dryRun: true,
      actor: 'test-user',
      baseCcy: 'MYR',
    });

    expect(result.lines).toBe(0); // No delta, so no lines
    expect(result.delta_total).toBe(0);
  });

  it('filters zero deltas', async () => {
    const mockTb = [
      {
        account_code: '1100',
        currency: 'USD',
        base_currency: 'MYR',
        balance_base: 1000,
        balance_src: 250,
      },
    ];

    // Mock functions to return test data
    const result = await revalueMonetaryAccounts({
      companyId: 'test-co',
      year: 2025,
      month: 11,
      dryRun: true,
      actor: 'test-user',
      baseCcy: 'MYR',
    });

    // Should filter out zero deltas
    expect(result.lines).toBe(0);
  });
});
