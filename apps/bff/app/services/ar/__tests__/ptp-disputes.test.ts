import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ulid } from 'ulid';
import { pool } from '@/lib/db';
import { ArPtpDisputesService } from '../ptp-disputes';
import { testIds } from '../../payments/__tests__/utils/ids';
import { cleanCompany } from '../../payments/__tests__/utils/cleanup';

describe('AR PTP & Disputes Service', () => {
  let ids: ReturnType<typeof testIds>;
  let service: ArPtpDisputesService;

  beforeEach(async () => {
    ids = testIds(expect.getState().currentTestName!);
    await cleanCompany(ids.companyId);
    service = new ArPtpDisputesService();
  });

  describe('Promise-to-Pay Management', () => {
    it('should create a PTP record', async () => {
      const ptpData = {
        customer_id: 'customer-1',
        invoice_id: 'invoice-1',
        promised_date: '2024-02-15',
        amount: 1000,
        reason: 'Cash flow issues',
      };

      const ptpRecord = await service.createPtp(
        ids.companyId,
        ptpData,
        'test-user'
      );

      expect(ptpRecord.id).toBeDefined();

      // Verify PTP was created
      const records = await service.getPtpRecords(ids.companyId);
      expect(records).toHaveLength(1);
      expect(records[0]?.id).toBe(ptpRecord.id);
      expect(records[0]?.customerId).toBe('customer-1');
      expect(records[0]?.status).toBe('open');
    });

    it('should resolve a PTP as kept', async () => {
      // Create a PTP first
      const ptpData = {
        customer_id: 'customer-1',
        invoice_id: 'invoice-1',
        promised_date: '2024-02-15',
        amount: 1000,
        reason: 'Cash flow issues',
      };

      const ptpRecord = await service.createPtp(
        ids.companyId,
        ptpData,
        'test-user'
      );

      // Resolve as kept
      await service.resolvePtp(
        ids.companyId,
        {
          id: ptpRecord.id,
          outcome: 'kept',
        },
        'test-user'
      );

      // Verify resolution
      const records = await service.getPtpRecords(ids.companyId);
      expect(records).toHaveLength(1);
      expect(records[0]?.status).toBe('kept');
      expect(records[0]?.decidedAt).toBeDefined();
    });

    it('should resolve a PTP as broken', async () => {
      // Create a PTP first
      const ptpData = {
        customer_id: 'customer-1',
        invoice_id: 'invoice-1',
        promised_date: '2024-02-15',
        amount: 1000,
        reason: 'Cash flow issues',
      };

      const ptpRecord = await service.createPtp(
        ids.companyId,
        ptpData,
        'test-user'
      );

      // Resolve as broken
      await service.resolvePtp(
        ids.companyId,
        {
          id: ptpRecord.id,
          outcome: 'broken',
        },
        'test-user'
      );

      // Verify resolution
      const records = await service.getPtpRecords(ids.companyId);
      expect(records).toHaveLength(1);
      expect(records[0]?.status).toBe('broken');
    });

    it('should get overdue PTPs', async () => {
      // Create an overdue PTP
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const ptpData = {
        customer_id: 'customer-1',
        invoice_id: 'invoice-1',
        promised_date: pastDate.toISOString().split('T')[0]!,
        amount: 1000,
        reason: 'Cash flow issues',
      };

      await service.createPtp(ids.companyId, ptpData, 'test-user');

      // Get overdue PTPs
      const overdue = await service.getOverduePtps(ids.companyId);
      expect(overdue).toHaveLength(1);
      expect(overdue[0]?.status).toBe('open');
    });
  });

  describe('Dispute Management', () => {
    it('should create a dispute record', async () => {
      const disputeData = {
        customer_id: 'customer-1',
        invoice_id: 'invoice-1',
        reason_code: 'PRICING' as const,
        detail: 'Price discrepancy on line items',
      };

      const disputeRecord = await service.createDispute(
        ids.companyId,
        disputeData,
        'test-user'
      );

      expect(disputeRecord.id).toBeDefined();

      // Verify dispute was created
      const records = await service.getDisputeRecords(ids.companyId);
      expect(records).toHaveLength(1);
      expect(records[0]?.id).toBe(disputeRecord.id);
      expect(records[0]?.customerId).toBe('customer-1');
      expect(records[0]?.status).toBe('open');
      expect(records[0]?.reasonCode).toBe('PRICING');
    });

    it('should resolve a dispute', async () => {
      // Create a dispute first
      const disputeData = {
        customer_id: 'customer-1',
        invoice_id: 'invoice-1',
        reason_code: 'PRICING' as const,
        detail: 'Price discrepancy on line items',
      };

      const disputeRecord = await service.createDispute(
        ids.companyId,
        disputeData,
        'test-user'
      );

      // Resolve the dispute
      await service.resolveDispute(
        ids.companyId,
        {
          id: disputeRecord.id,
          status: 'resolved',
          detail: 'Price adjusted and customer satisfied',
        },
        'test-user'
      );

      // Verify resolution
      const records = await service.getDisputeRecords(ids.companyId);
      expect(records).toHaveLength(1);
      expect(records[0]?.status).toBe('resolved');
      expect(records[0]?.resolvedAt).toBeDefined();
    });

    it('should write off a dispute', async () => {
      // Create a dispute first
      const disputeData = {
        customer_id: 'customer-1',
        invoice_id: 'invoice-1',
        reason_code: 'SERVICE' as const,
        detail: 'Service quality issues',
      };

      const disputeRecord = await service.createDispute(
        ids.companyId,
        disputeData,
        'test-user'
      );

      // Write off the dispute
      await service.resolveDispute(
        ids.companyId,
        {
          id: disputeRecord.id,
          status: 'written_off',
          detail: 'Dispute written off due to service issues',
        },
        'test-user'
      );

      // Verify write-off
      const records = await service.getDisputeRecords(ids.companyId);
      expect(records).toHaveLength(1);
      expect(records[0]?.status).toBe('written_off');
    });
  });

  describe('Statistics', () => {
    it('should get PTP statistics', async () => {
      // Create some test PTPs
      const ptpData1 = {
        customer_id: 'customer-1',
        invoice_id: 'invoice-1',
        promised_date: '2024-02-15',
        amount: 1000,
        reason: 'Cash flow issues',
      };

      const ptpData2 = {
        customer_id: 'customer-2',
        invoice_id: 'invoice-2',
        promised_date: '2024-02-20',
        amount: 500,
        reason: 'Payment processing delay',
      };

      const ptpRecord1 = await service.createPtp(
        ids.companyId,
        ptpData1,
        'test-user'
      );
      const ptpRecord2 = await service.createPtp(
        ids.companyId,
        ptpData2,
        'test-user'
      );

      // Resolve one as kept
      await service.resolvePtp(
        ids.companyId,
        {
          id: ptpRecord1.id,
          outcome: 'kept',
        },
        'test-user'
      );

      // Get statistics
      const stats = await service.getPtpStats(ids.companyId);

      expect(stats.total_open).toBe(1);
      expect(stats.total_kept).toBe(1);
      expect(stats.total_broken).toBe(0);
      expect(stats.total_cancelled).toBe(0);
      expect(stats.total_amount_open).toBe(500);
      expect(stats.total_amount_kept).toBe(1000);
    });

    it('should get dispute statistics', async () => {
      // Create some test disputes
      const disputeData1 = {
        customer_id: 'customer-1',
        invoice_id: 'invoice-1',
        reason_code: 'PRICING' as const,
        detail: 'Price discrepancy',
      };

      const disputeData2 = {
        customer_id: 'customer-2',
        invoice_id: 'invoice-2',
        reason_code: 'SERVICE' as const,
        detail: 'Service quality issues',
      };

      const disputeRecord1 = await service.createDispute(
        ids.companyId,
        disputeData1,
        'test-user'
      );
      const disputeRecord2 = await service.createDispute(
        ids.companyId,
        disputeData2,
        'test-user'
      );

      // Resolve one dispute
      await service.resolveDispute(
        ids.companyId,
        {
          id: disputeRecord1.id,
          status: 'resolved',
          detail: 'Price adjusted',
        },
        'test-user'
      );

      // Get statistics
      const stats = await service.getDisputeStats(ids.companyId);

      expect(stats.total_open).toBe(1);
      expect(stats.total_resolved).toBe(1);
      expect(stats.total_written_off).toBe(0);
      expect(stats.by_reason.PRICING).toBe(1);
      expect(stats.by_reason.SERVICE).toBe(1);
    });
  });

  describe('Filtering', () => {
    it('should filter PTPs by status', async () => {
      // Create PTPs with different statuses
      const ptpData1 = {
        customer_id: 'customer-1',
        invoice_id: 'invoice-1',
        promised_date: '2024-02-15',
        amount: 1000,
        reason: 'Cash flow issues',
      };

      const ptpData2 = {
        customer_id: 'customer-2',
        invoice_id: 'invoice-2',
        promised_date: '2024-02-20',
        amount: 500,
        reason: 'Payment processing delay',
      };

      const ptpRecord1 = await service.createPtp(
        ids.companyId,
        ptpData1,
        'test-user'
      );
      const ptpRecord2 = await service.createPtp(
        ids.companyId,
        ptpData2,
        'test-user'
      );

      // Resolve one as kept
      await service.resolvePtp(
        ids.companyId,
        {
          id: ptpRecord1.id,
          outcome: 'kept',
        },
        'test-user'
      );

      // Filter by status
      const openPtp = await service.getPtpRecords(ids.companyId, 'open');
      const keptPtp = await service.getPtpRecords(ids.companyId, 'kept');

      expect(openPtp).toHaveLength(1);
      expect(keptPtp).toHaveLength(1);
      expect(openPtp[0]?.status).toBe('open');
      expect(keptPtp[0]?.status).toBe('kept');
    });

    it('should filter disputes by reason code', async () => {
      // Create disputes with different reason codes
      const disputeData1 = {
        customer_id: 'customer-1',
        invoice_id: 'invoice-1',
        reason_code: 'PRICING' as const,
        detail: 'Price discrepancy',
      };

      const disputeData2 = {
        customer_id: 'customer-2',
        invoice_id: 'invoice-2',
        reason_code: 'SERVICE' as const,
        detail: 'Service quality issues',
      };

      await service.createDispute(ids.companyId, disputeData1, 'test-user');
      await service.createDispute(ids.companyId, disputeData2, 'test-user');

      // Get all disputes
      const allDisputes = await service.getDisputeRecords(ids.companyId);
      expect(allDisputes).toHaveLength(2);

      // Verify reason codes
      const reasonCodes = allDisputes.map(d => d.reasonCode);
      expect(reasonCodes).toContain('PRICING');
      expect(reasonCodes).toContain('SERVICE');
    });
  });
});
