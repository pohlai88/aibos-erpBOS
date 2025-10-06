import { describe, it, expect, beforeEach } from 'vitest';
import {
  TaxExportRequest,
  TaxCarryForwardScanRequest,
  TaxCarryForwardProposeRequest,
  TaxCarryForwardAcceptRequest,
} from '@aibos/contracts';
import { getExporter, getAvailableProfiles } from '../exporters';

describe('M20.1 - Authority-Specific Exporters', () => {
  describe('MY-SST-02-CSV Profile', () => {
    it('should validate required boxes', () => {
      const exporter = getExporter('MY-SST-02-CSV');
      const run = { id: 'test', partner_code: 'MY-SST', period_key: '2025-01' };
      const lines = [
        {
          box_id: 'OUTPUT_TAX',
          amount: 100.0,
          box_label: 'Output Tax',
          ordinal: 1,
        },
        {
          box_id: 'INPUT_TAX',
          amount: 50.0,
          box_label: 'Input Tax',
          ordinal: 2,
        },
      ];

      expect(() => exporter.validate(run, lines)).not.toThrow();
    });

    it('should reject missing OUTPUT_TAX', () => {
      const exporter = getExporter('MY-SST-02-CSV');
      const run = { id: 'test', partner_code: 'MY-SST', period_key: '2025-01' };
      const lines = [
        {
          box_id: 'INPUT_TAX',
          amount: 50.0,
          box_label: 'Input Tax',
          ordinal: 1,
        },
      ];

      expect(() => exporter.validate(run, lines)).toThrow(
        'Required box OUTPUT_TAX is missing'
      );
    });

    it('should validate rounding to 2dp', () => {
      const exporter = getExporter('MY-SST-02-CSV');
      const run = { id: 'test', partner_code: 'MY-SST', period_key: '2025-01' };
      const lines = [
        {
          box_id: 'OUTPUT_TAX',
          amount: 100.123,
          box_label: 'Output Tax',
          ordinal: 1,
        },
        {
          box_id: 'INPUT_TAX',
          amount: 50.0,
          box_label: 'Input Tax',
          ordinal: 2,
        },
      ];

      expect(() => exporter.validate(run, lines)).toThrow(
        'must be rounded to 2 decimal places'
      );
    });

    it('should generate proper CSV format', () => {
      const exporter = getExporter('MY-SST-02-CSV');
      const run = { id: 'test', partner_code: 'MY-SST', period_key: '2025-01' };
      const lines = [
        {
          box_id: 'OUTPUT_TAX',
          amount: 100.0,
          box_label: 'Output Tax',
          ordinal: 1,
        },
        {
          box_id: 'INPUT_TAX',
          amount: 50.0,
          box_label: 'Input Tax',
          ordinal: 2,
        },
      ];

      const csv = exporter.render(run, lines);
      expect(csv).toContain('Box ID,Box Label,Amount (RM)');
      expect(csv).toContain('OUTPUT_TAX,"Output Tax",100.00');
      expect(csv).toContain('INPUT_TAX,"Input Tax",50.00');
    });

    it('should generate deterministic filename', () => {
      const exporter = getExporter('MY-SST-02-CSV');
      const run = {
        id: 'run123',
        partner_code: 'MY-SST',
        period_key: '2025-01',
      };

      const filename = exporter.filename(run);
      expect(filename).toBe('MY-SST-2025-01-run123.csv');
    });
  });

  describe('UK-VAT100-XML Profile', () => {
    it('should validate required boxes 1-9', () => {
      const exporter = getExporter('UK-VAT100-XML');
      const run = { id: 'test', partner_code: 'UK-VAT', period_key: '2025-01' };
      const lines = [
        { box_id: '1', amount: 100, box_label: 'Box 1', ordinal: 1 },
        { box_id: '2', amount: 200, box_label: 'Box 2', ordinal: 2 },
        { box_id: '3', amount: 300, box_label: 'Box 3', ordinal: 3 },
        { box_id: '4', amount: 50, box_label: 'Box 4', ordinal: 4 },
        { box_id: '5', amount: 600, box_label: 'Box 5', ordinal: 5 }, // 1+2+3 = 600
        { box_id: '6', amount: 100, box_label: 'Box 6', ordinal: 6 },
        { box_id: '7', amount: 100, box_label: 'Box 7', ordinal: 7 },
        { box_id: '8', amount: 100, box_label: 'Box 8', ordinal: 8 },
        { box_id: '9', amount: 100, box_label: 'Box 9', ordinal: 9 },
      ];

      expect(() => exporter.validate(run, lines)).not.toThrow();
    });

    it('should reject missing box 5', () => {
      const exporter = getExporter('UK-VAT100-XML');
      const run = { id: 'test', partner_code: 'UK-VAT', period_key: '2025-01' };
      const lines = Array.from({ length: 8 }, (_, i) => ({
        box_id: (i + 1).toString(),
        amount: 100,
        box_label: `Box ${i + 1}`,
        ordinal: i + 1,
      }));

      expect(() => exporter.validate(run, lines)).toThrow(
        'Required box 9 is missing'
      );
    });

    it('should validate integer pennies', () => {
      const exporter = getExporter('UK-VAT100-XML');
      const run = { id: 'test', partner_code: 'UK-VAT', period_key: '2025-01' };
      const lines = Array.from({ length: 9 }, (_, i) => ({
        box_id: (i + 1).toString(),
        amount: 100.5, // Not integer pennies
        box_label: `Box ${i + 1}`,
        ordinal: i + 1,
      }));

      expect(() => exporter.validate(run, lines)).toThrow(
        'must be in whole pennies'
      );
    });

    it('should validate totals reconciliation', () => {
      const exporter = getExporter('UK-VAT100-XML');
      const run = { id: 'test', partner_code: 'UK-VAT', period_key: '2025-01' };
      const lines = [
        { box_id: '1', amount: 100, box_label: 'Box 1', ordinal: 1 },
        { box_id: '2', amount: 200, box_label: 'Box 2', ordinal: 2 },
        { box_id: '3', amount: 300, box_label: 'Box 3', ordinal: 3 },
        { box_id: '4', amount: 50, box_label: 'Box 4', ordinal: 4 },
        { box_id: '5', amount: 500, box_label: 'Box 5', ordinal: 5 }, // Wrong total
        { box_id: '6', amount: 100, box_label: 'Box 6', ordinal: 6 },
        { box_id: '7', amount: 100, box_label: 'Box 7', ordinal: 7 },
        { box_id: '8', amount: 100, box_label: 'Box 8', ordinal: 8 },
        { box_id: '9', amount: 100, box_label: 'Box 9', ordinal: 9 },
      ];

      expect(() => exporter.validate(run, lines)).toThrow(
        'Box 5 total 500 does not match sum of boxes 1+2+3 (600)'
      );
    });

    it('should generate proper XML format', () => {
      const exporter = getExporter('UK-VAT100-XML');
      const run = {
        id: 'test',
        partner_code: 'UK-VAT',
        period_key: '2025-01',
        version: '2025',
        created_at: '2025-01-01',
      };
      const lines = [
        { box_id: '1', amount: 100, box_label: 'Box 1', ordinal: 1 },
      ];

      const xml = exporter.render(run, lines);
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<VAT100>');
      expect(xml).toContain('<Period>2025-01</Period>');
      expect(xml).toContain('<Number>1</Number>');
      expect(xml).toContain('<Amount>100</Amount>');
    });
  });

  describe('Registry', () => {
    it('should return available profiles', () => {
      const profiles = getAvailableProfiles();
      expect(profiles).toContain('MY-SST-02-CSV');
      expect(profiles).toContain('UK-VAT100-XML');
    });

    it('should throw for unknown profile', () => {
      expect(() => getExporter('UNKNOWN-PROFILE')).toThrow(
        'Unknown export profile: UNKNOWN-PROFILE'
      );
    });
  });
});

describe('M20.2 - Late-Entry Carry-Forward', () => {
  describe('Contract Validation', () => {
    it('should validate scan request', () => {
      const validRequest = {
        partner_code: 'MY-SST',
        from_year: 2025,
        from_month: 10,
        into_year: 2025,
        into_month: 11,
      };

      expect(() =>
        TaxCarryForwardScanRequest.parse(validRequest)
      ).not.toThrow();
    });

    it('should reject invalid month', () => {
      const invalidRequest = {
        partner_code: 'MY-SST',
        from_year: 2025,
        from_month: 13, // Invalid month
        into_year: 2025,
        into_month: 11,
      };

      expect(() => TaxCarryForwardScanRequest.parse(invalidRequest)).toThrow();
    });

    it('should validate propose request', () => {
      const validRequest = {
        proposals: [
          {
            source_ref: 'INV-10023',
            box_id: 'OUTPUT_TAX',
            amount: 12.4,
            reason: 'LATE_POSTING',
          },
        ],
      };

      expect(() =>
        TaxCarryForwardProposeRequest.parse(validRequest)
      ).not.toThrow();
    });

    it('should validate accept request', () => {
      const validRequest = {
        ids: ['cf-123', 'cf-456'],
      };

      expect(() =>
        TaxCarryForwardAcceptRequest.parse(validRequest)
      ).not.toThrow();
    });
  });
});
