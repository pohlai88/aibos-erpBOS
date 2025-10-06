import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ulid } from 'ulid';
import { pool } from '@/lib/db';
import { ArCashApplicationService } from '../cash-application';
import { testIds } from '../../payments/__tests__/utils/ids';
import { cleanCompany } from '../../payments/__tests__/utils/cleanup';

describe('AR Cash Application Service', () => {
  let ids: ReturnType<typeof testIds>;
  let service: ArCashApplicationService;

  beforeEach(async () => {
    ids = testIds(expect.getState().currentTestName!);
    await cleanCompany(ids.companyId);
    service = new ArCashApplicationService();
  });

  describe('Remittance Import', () => {
    it('should import CSV remittance file', async () => {
      const csvPayload = `date,amount,currency,payer_name,reference
2024-01-15,1000.00,USD,Test Customer,INV-001
2024-01-16,500.00,USD,Another Customer,INV-002`;

      const req = {
        source: 'CSV' as const,
        filename: 'test-remittance.csv',
        payload: csvPayload,
      };

      const result = await service.importRemittance(
        ids.companyId,
        req,
        'test-user'
      );

      expect(result.totalProcessed).toBeDefined();
      expect(result.matched).toBe(2);
      expect(result.unmatched).toBe(0);
    });

    it('should prevent duplicate imports', async () => {
      const csvPayload = `date,amount,currency,payer_name,reference
2024-01-15,1000.00,USD,Test Customer,INV-001`;

      const req = {
        source: 'CSV' as const,
        filename: 'test-remittance.csv',
        payload: csvPayload,
      };

      // First import should succeed
      const result1 = await service.importRemittance(
        ids.companyId,
        req,
        'test-user'
      );
      expect(result1.matched).toBe(1);

      // Second import should fail with duplicate error
      await expect(
        service.importRemittance(ids.companyId, req, 'test-user')
      ).rejects.toThrow('Remittance file already imported');
    });

    it('should import CAMT.054 XML file', async () => {
      const camtPayload = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.054.001.08">
  <BkToCstmrDbtCdtNtfctn>
    <Ntfctn>
      <CdtDbtInd>CRDT</CdtDbtInd>
      <Amt Ccy="USD">1000.00</Amt>
      <BookgDt>
        <Dt>2024-01-15</Dt>
      </BookgDt>
      <RmtInf>
        <Ustrd>INV-001</Ustrd>
      </RmtInf>
    </Ntfctn>
  </BkToCstmrDbtCdtNtfctn>
</Document>`;

      const req = {
        source: 'CAMT054' as const,
        filename: 'test-camt.xml',
        payload: camtPayload,
      };

      const result = await service.importRemittance(
        ids.companyId,
        req,
        'test-user'
      );

      expect(result.totalProcessed).toBeDefined();
      expect(result.matched).toBe(1);
      expect(result.unmatched).toBe(0);
    });
  });

  describe('Cash Application Run', () => {
    it('should run cash application in dry-run mode', async () => {
      // First import some remittance data
      const csvPayload = `date,amount,currency,payer_name,reference
2024-01-15,1000.00,USD,Test Customer,INV-001`;

      const req = {
        source: 'CSV' as const,
        filename: 'test-remittance.csv',
        payload: csvPayload,
      };

      await service.importRemittance(ids.companyId, req, 'test-user');

      // Run cash application in dry-run mode
      const result = await service.runCashApplication(ids.companyId, {
        dry_run: true,
        min_confidence: 0.7,
      });

      expect(result.company_id).toBe(ids.companyId);
      expect(result.dry_run).toBe(true);
      expect(result.receipts_processed).toBeGreaterThanOrEqual(0);
      expect(result.auto_matched).toBeGreaterThanOrEqual(0);
      expect(result.partial_matches).toBeGreaterThanOrEqual(0);
      expect(result.unmatched).toBeGreaterThanOrEqual(0);
    });

    it('should respect confidence threshold', async () => {
      // Import remittance data
      const csvPayload = `date,amount,currency,payer_name,reference
2024-01-15,1000.00,USD,Test Customer,INV-001`;

      const req = {
        source: 'CSV' as const,
        filename: 'test-remittance.csv',
        payload: csvPayload,
      };

      await service.importRemittance(ids.companyId, req, 'test-user');

      // Run with high confidence threshold
      const result = await service.runCashApplication(ids.companyId, {
        dry_run: true,
        min_confidence: 0.9,
      });

      expect(result.confidence_threshold).toBe(0.9);
    });
  });

  describe('Cash App Matches', () => {
    it('should get cash application matches', async () => {
      const matches = await service.getCashAppMatches(ids.companyId);

      expect(Array.isArray(matches)).toBe(true);
    });

    it('should filter matches by status', async () => {
      const matched = await service.getCashAppMatches(ids.companyId, 'matched');
      const unmatched = await service.getCashAppMatches(
        ids.companyId,
        'unmatched'
      );

      expect(Array.isArray(matched)).toBe(true);
      expect(Array.isArray(unmatched)).toBe(true);
    });
  });
});
