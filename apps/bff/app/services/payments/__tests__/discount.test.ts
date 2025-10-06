import { describe, it, expect, beforeEach } from 'vitest';
import { ulid } from 'ulid';
import { pool } from '@/lib/db';
import {
  parsePaymentTerms,
  calculateAPR,
  getDiscountPolicy,
  upsertDiscountPolicy,
  scanDiscountCandidates,
  optimizeAndCommitDiscountRun,
  createDiscountOffer,
  decideDiscountOffer,
} from '@/services/payments/discount';
import { testIds } from './utils/ids';
import { cleanCompany } from './utils/cleanup';

describe('Early Payment Discounts (M23.3)', () => {
  let ids: ReturnType<typeof testIds>;

  beforeEach(async () => {
    ids = testIds(expect.getState().currentTestName!);
    await cleanCompany(ids.companyId);
  });

  describe('Payment Terms Parsing', () => {
    it('should parse standard 2/10 net 30 terms', () => {
      const result = parsePaymentTerms('2/10, net 30');
      expect(result).toEqual({
        discount_pct: 0.02,
        discount_days: 10,
        net_days: 30,
      });
    });

    it('should parse terms without comma', () => {
      const result = parsePaymentTerms('2/10 net 30');
      expect(result).toEqual({
        discount_pct: 0.02,
        discount_days: 10,
        net_days: 30,
      });
    });

    it('should parse decimal discount percentages', () => {
      const result = parsePaymentTerms('1.5/10 net 30');
      expect(result).toEqual({
        discount_pct: 0.015,
        discount_days: 10,
        net_days: 30,
      });
    });

    it('should return null for invalid terms', () => {
      expect(parsePaymentTerms('net 30')).toBeNull();
      expect(parsePaymentTerms('invalid')).toBeNull();
    });
  });

  describe('APR Calculation', () => {
    it('should calculate APR for 2/10 net 30 correctly', () => {
      // 2/10 net 30 should give approximately 36.73% APR
      const apr = calculateAPR(0.02, 10, 30);
      expect(apr).toBeCloseTo(0.3673, 3); // ~36.73%
    });

    it('should calculate APR for 1/10 net 30', () => {
      const apr = calculateAPR(0.01, 10, 30);
      expect(apr).toBeCloseTo(0.1818, 3); // ~18.18%
    });

    it('should return 0 for invalid tenor', () => {
      const apr = calculateAPR(0.02, 30, 30);
      expect(apr).toBe(0);
    });
  });

  describe('Discount Policy Management', () => {
    it('should create a discount policy', async () => {
      const policyData = {
        hurdle_apy: 0.2, // 20%
        min_savings_amt: 50,
        min_savings_pct: 0.002, // 0.2%
        liquidity_buffer: 100000,
        posting_mode: 'OTHER_INCOME' as const,
        posting_account: '4905-DISCOUNT-INCOME',
        max_tenor_days: 30,
      };

      const policy = await upsertDiscountPolicy(
        ids.companyId,
        policyData,
        'test-user'
      );

      expect(policy.companyId).toBe(ids.companyId);
      expect(policy.hurdleApy).toBe(0.2);
      expect(policy.minSavingsAmt).toBe(50);
      expect(policy.postingMode).toBe('OTHER_INCOME');
    });

    it('should update existing policy', async () => {
      const policyData = {
        hurdle_apy: 0.2,
        min_savings_amt: 50,
        min_savings_pct: 0.002,
        liquidity_buffer: 100000,
        posting_mode: 'OTHER_INCOME' as const,
        max_tenor_days: 30,
      };

      await upsertDiscountPolicy(ids.companyId, policyData, 'test-user');

      const updated = await upsertDiscountPolicy(
        ids.companyId,
        {
          ...policyData,
          hurdle_apy: 0.25, // Update hurdle rate
        },
        'test-user'
      );

      expect(updated.hurdleApy).toBe(0.25);
    });

    it('should retrieve discount policy', async () => {
      const policyData = {
        hurdle_apy: 0.2,
        min_savings_amt: 50,
        min_savings_pct: 0.002,
        liquidity_buffer: 100000,
        posting_mode: 'OTHER_INCOME' as const,
        max_tenor_days: 30,
      };

      await upsertDiscountPolicy(ids.companyId, policyData, 'test-user');

      const retrieved = await getDiscountPolicy(ids.companyId);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.hurdleApy).toBe(0.2);
    });

    it('should return null for non-existent policy', async () => {
      const policy = await getDiscountPolicy(ids.companyId);
      expect(policy).toBeNull();
    });
  });

  describe('Discount Candidate Scanning', () => {
    it('should scan eligible invoices with discount terms', async () => {
      // Setup policy
      await upsertDiscountPolicy(
        ids.companyId,
        {
          hurdle_apy: 0.2,
          min_savings_amt: 50,
          min_savings_pct: 0.002,
          liquidity_buffer: 100000,
          posting_mode: 'OTHER_INCOME',
          max_tenor_days: 30,
        },
        'test-user'
      );

      // Create test invoices with discount terms
      const invoiceId = ulid();
      await pool.query(
        `
        INSERT INTO ap_invoice(id, company_id, supplier_id, invoice_no, invoice_date, due_date, gross_amount, ccy, status, created_by, discount_pct, discount_days, net_days, discount_due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `,
        [
          invoiceId,
          ids.companyId,
          'SUP001',
          'INV001',
          '2025-10-01',
          '2025-10-31',
          10000,
          'USD',
          'OPEN',
          'test-user',
          0.02,
          10,
          30,
          '2025-10-11',
        ]
      );

      const run = await scanDiscountCandidates(
        ids.companyId,
        {
          window_from: '2025-10-01',
          window_to: '2025-10-31',
        },
        'test-user'
      );

      expect(run.status).toBe('dry_run');
      expect(run.lines).toBeDefined();
      expect(run.lines!.length).toBe(1);

      const line = run.lines?.[0];
      expect(line).toBeDefined();
      expect(line!.invoiceId).toBe(invoiceId);
      expect(line!.baseAmount).toBe(10000);
      expect(line!.discountAmt).toBe(200); // 2% of 10000
      expect(line!.earlyPayAmt).toBe(9800);
      expect(line!.apr).toBeCloseTo(0.3673, 3); // 36.73%
      expect(line!.selected).toBe(false);
    });

    it('should reject invoices below hurdle rate', async () => {
      // Setup policy with high hurdle (40%)
      await upsertDiscountPolicy(
        ids.companyId,
        {
          hurdle_apy: 0.4, // 40% hurdle
          min_savings_amt: 0,
          min_savings_pct: 0,
          liquidity_buffer: 0,
          posting_mode: 'OTHER_INCOME',
          max_tenor_days: 30,
        },
        'test-user'
      );

      // Create invoice with 2/10 net 30 (36.73% APR - below hurdle)
      await pool.query(
        `
        INSERT INTO ap_invoice(id, company_id, supplier_id, invoice_no, invoice_date, due_date, gross_amount, ccy, status, created_by, discount_pct, discount_days, net_days, discount_due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `,
        [
          ulid(),
          ids.companyId,
          'SUP001',
          'INV001',
          '2025-10-01',
          '2025-10-31',
          10000,
          'USD',
          'OPEN',
          'test-user',
          0.02,
          10,
          30,
          '2025-10-11',
        ]
      );

      const run = await scanDiscountCandidates(
        ids.companyId,
        {
          window_from: '2025-10-01',
          window_to: '2025-10-31',
        },
        'test-user'
      );

      expect(run.lines!.length).toBe(0); // Should be rejected
    });

    it('should reject invoices below minimum savings amount', async () => {
      await upsertDiscountPolicy(
        ids.companyId,
        {
          hurdle_apy: 0.2,
          min_savings_amt: 500, // Require at least $500 savings
          min_savings_pct: 0,
          liquidity_buffer: 0,
          posting_mode: 'OTHER_INCOME',
          max_tenor_days: 30,
        },
        'test-user'
      );

      // Create invoice with only $200 savings (2% of 10000)
      await pool.query(
        `
        INSERT INTO ap_invoice(id, company_id, supplier_id, invoice_no, invoice_date, due_date, gross_amount, ccy, status, created_by, discount_pct, discount_days, net_days, discount_due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `,
        [
          ulid(),
          ids.companyId,
          'SUP001',
          'INV001',
          '2025-10-01',
          '2025-10-31',
          10000,
          'USD',
          'OPEN',
          'test-user',
          0.02,
          10,
          30,
          '2025-10-11',
        ]
      );

      const run = await scanDiscountCandidates(
        ids.companyId,
        {
          window_from: '2025-10-01',
          window_to: '2025-10-31',
        },
        'test-user'
      );

      expect(run.lines!.length).toBe(0); // Should be rejected
    });
  });

  describe('Cash-Constrained Optimization', () => {
    it('should select highest APR invoices first', async () => {
      await upsertDiscountPolicy(
        ids.companyId,
        {
          hurdle_apy: 0.15,
          min_savings_amt: 0,
          min_savings_pct: 0,
          liquidity_buffer: 0,
          posting_mode: 'OTHER_INCOME',
          max_tenor_days: 30,
        },
        'test-user'
      );

      // Create two invoices with different APRs
      // Invoice 1: 3/10 net 30 (54.5% APR)
      await pool.query(
        `
        INSERT INTO ap_invoice(id, company_id, supplier_id, invoice_no, invoice_date, due_date, gross_amount, ccy, status, created_by, discount_pct, discount_days, net_days, discount_due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `,
        [
          ulid(),
          ids.companyId,
          'SUP001',
          'INV001',
          '2025-10-01',
          '2025-10-31',
          5000,
          'USD',
          'OPEN',
          'test-user',
          0.03,
          10,
          30,
          '2025-10-11',
        ]
      );

      // Invoice 2: 2/10 net 30 (36.73% APR)
      await pool.query(
        `
        INSERT INTO ap_invoice(id, company_id, supplier_id, invoice_no, invoice_date, due_date, gross_amount, ccy, status, created_by, discount_pct, discount_days, net_days, discount_due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `,
        [
          ulid(),
          ids.companyId,
          'SUP002',
          'INV002',
          '2025-10-01',
          '2025-10-31',
          5000,
          'USD',
          'OPEN',
          'test-user',
          0.02,
          10,
          30,
          '2025-10-11',
        ]
      );

      // Run with cash cap allowing only one invoice
      const run = await optimizeAndCommitDiscountRun(
        ids.companyId,
        {
          window_from: '2025-10-01',
          window_to: '2025-10-31',
          cash_cap: 5000, // Can only afford one
          dry_run: true,
        },
        'test-user'
      );

      const selectedLines = run.lines?.filter(l => l.selected) || [];
      expect(selectedLines.length).toBe(1);
      expect(selectedLines[0]?.apr).toBeCloseTo(0.5567, 2); // Should select higher APR (3/10 net 30 = 55.67%)
    });

    it('should respect liquidity buffer', async () => {
      await upsertDiscountPolicy(
        ids.companyId,
        {
          hurdle_apy: 0.15,
          min_savings_amt: 0,
          min_savings_pct: 0,
          liquidity_buffer: 3000, // Reserve $3000
          posting_mode: 'OTHER_INCOME',
          max_tenor_days: 30,
        },
        'test-user'
      );

      await pool.query(
        `
        INSERT INTO ap_invoice(id, company_id, supplier_id, invoice_no, invoice_date, due_date, gross_amount, ccy, status, created_by, discount_pct, discount_days, net_days, discount_due_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `,
        [
          ulid(),
          ids.companyId,
          'SUP001',
          'INV001',
          '2025-10-01',
          '2025-10-31',
          10000,
          'USD',
          'OPEN',
          'test-user',
          0.02,
          10,
          30,
          '2025-10-11',
        ]
      );

      // Cap of 10000, but buffer of 3000, so effective cap is 7000
      // Invoice needs 9800, so should not be selected
      const run = await optimizeAndCommitDiscountRun(
        ids.companyId,
        {
          window_from: '2025-10-01',
          window_to: '2025-10-31',
          cash_cap: 10000,
          dry_run: true,
        },
        'test-user'
      );

      const selectedLines = run.lines?.filter(l => l.selected) || [];
      expect(selectedLines.length).toBe(0);
    });
  });

  describe('Dynamic Offers', () => {
    it('should create a discount offer', async () => {
      const invoiceId = ulid();
      await pool.query(
        `
        INSERT INTO ap_invoice(id, company_id, supplier_id, invoice_no, invoice_date, due_date, gross_amount, ccy, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
        [
          invoiceId,
          ids.companyId,
          'SUP001',
          'INV001',
          '2025-10-01',
          '2025-10-31',
          10000,
          'USD',
          'OPEN',
          'test-user',
        ]
      );

      const offer = await createDiscountOffer(
        ids.companyId,
        {
          invoice_id: invoiceId,
          supplier_id: 'SUP001',
          offer_pct: 0.015, // 1.5%
          pay_by_date: '2025-10-15',
        },
        'test-user'
      );

      expect(offer.invoiceId).toBe(invoiceId);
      expect(offer.offerPct).toBe(0.015);
      expect(offer.status).toBe('proposed');
      expect(offer.token).toBeDefined();
    });

    it('should accept an offer and update invoice terms', async () => {
      const invoiceId = ulid();
      await pool.query(
        `
        INSERT INTO ap_invoice(id, company_id, supplier_id, invoice_no, invoice_date, due_date, gross_amount, ccy, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
        [
          invoiceId,
          ids.companyId,
          'SUP001',
          'INV001',
          '2025-10-01',
          '2025-10-31',
          10000,
          'USD',
          'OPEN',
          'test-user',
        ]
      );

      const offer = await createDiscountOffer(
        ids.companyId,
        {
          invoice_id: invoiceId,
          supplier_id: 'SUP001',
          offer_pct: 0.015,
          pay_by_date: '2025-10-15',
        },
        'test-user'
      );

      const decided = await decideDiscountOffer({
        token: offer.token,
        decision: 'accepted',
      });

      expect(decided.status).toBe('accepted');
      expect(decided.decidedAt).toBeDefined();

      // Verify invoice was updated with discount terms
      const { rows } = await pool.query(
        `
        SELECT discount_pct, discount_due_date FROM ap_invoice WHERE id = $1
      `,
        [invoiceId]
      );

      expect(parseFloat(rows[0].discount_pct)).toBe(0.015);
      expect(rows[0].discount_due_date).toBeDefined();
    });

    it('should decline an offer without updating invoice', async () => {
      const invoiceId = ulid();
      await pool.query(
        `
        INSERT INTO ap_invoice(id, company_id, supplier_id, invoice_no, invoice_date, due_date, gross_amount, ccy, status, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
        [
          invoiceId,
          ids.companyId,
          'SUP001',
          'INV001',
          '2025-10-01',
          '2025-10-31',
          10000,
          'USD',
          'OPEN',
          'test-user',
        ]
      );

      const offer = await createDiscountOffer(
        ids.companyId,
        {
          invoice_id: invoiceId,
          supplier_id: 'SUP001',
          offer_pct: 0.015,
          pay_by_date: '2025-10-15',
        },
        'test-user'
      );

      const decided = await decideDiscountOffer({
        token: offer.token,
        decision: 'declined',
      });

      expect(decided.status).toBe('declined');

      // Verify invoice was NOT updated
      const { rows } = await pool.query(
        `
        SELECT discount_pct FROM ap_invoice WHERE id = $1
      `,
        [invoiceId]
      );

      expect(rows[0].discount_pct).toBeNull();
    });
  });
});
