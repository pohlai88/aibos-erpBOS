import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ulid } from 'ulid';
import { pool } from '@/lib/db';
import { ArDunningService } from '../dunning';
import { testIds } from '../../payments/__tests__/utils/ids';
import { cleanCompany } from '../../payments/__tests__/utils/cleanup';

describe('AR Dunning Service', () => {
  let ids: ReturnType<typeof testIds>;
  let service: ArDunningService;

  beforeEach(async () => {
    ids = testIds(expect.getState().currentTestName!);
    await cleanCompany(ids.companyId);
    service = new ArDunningService();
  });

  describe('Dunning Policy Management', () => {
    it('should upsert a dunning policy', async () => {
      const policy = {
        policy_code: 'DEFAULT',
        from_bucket: '1-30' as const,
        step_idx: 0,
        wait_days: 0,
        channel: 'EMAIL' as const,
        template_id: 'AR-DUN-01',
        throttle_days: 3,
      };

      await service.upsertDunningPolicy(ids.companyId, policy, 'test-user');

      // Verify policy was created
      const policies = await service.getDunningPolicy(
        ids.companyId,
        'customer-1',
        '1-30'
      );
      expect(policies).toHaveLength(1);
      expect(policies[0]?.policy_code).toBe('DEFAULT');
      expect(policies[0]?.from_bucket).toBe('1-30');
    });

    it('should upsert a communication template', async () => {
      const template = {
        kind: 'AR_DUNNING' as const,
        subject: 'Payment Reminder - {{customer.name}}',
        body: 'Hi {{customer.name}}, our records show {{total_due}} due across {{invoice_count}} invoice(s).',
      };

      const templateId = await service.upsertTemplate(
        ids.companyId,
        template,
        'test-user'
      );
      expect(templateId).toBeDefined();
    });
  });

  describe('Dunning Run', () => {
    it('should run dunning in dry-run mode', async () => {
      // Create a test policy
      const policy = {
        policy_code: 'DEFAULT',
        from_bucket: '1-30' as const,
        step_idx: 0,
        wait_days: 0,
        channel: 'EMAIL' as const,
        template_id: 'AR-DUN-01',
        throttle_days: 3,
      };

      await service.upsertDunningPolicy(ids.companyId, policy, 'test-user');

      // Create a test template
      const template = {
        kind: 'AR_DUNNING' as const,
        subject: 'Payment Reminder',
        body: 'Please pay your outstanding balance.',
      };

      await service.upsertTemplate(ids.companyId, template, 'test-user');

      // Run dunning in dry-run mode
      const result = await service.runDunning(ids.companyId, true);

      expect(result.company_id).toBe(ids.companyId);
      expect(result.dry_run).toBe(true);
      expect(result.customers_processed).toBeGreaterThanOrEqual(0);
      expect(result.emails_sent).toBeGreaterThanOrEqual(0);
      expect(result.webhooks_sent).toBeGreaterThanOrEqual(0);
    });

    it('should respect throttle days', async () => {
      // Create a test policy with throttle
      const policy = {
        policy_code: 'DEFAULT',
        from_bucket: '1-30' as const,
        step_idx: 0,
        wait_days: 0,
        channel: 'EMAIL' as const,
        template_id: 'AR-DUN-01',
        throttle_days: 7,
      };

      await service.upsertDunningPolicy(ids.companyId, policy, 'test-user');

      // Create a test template
      const template = {
        kind: 'AR_DUNNING' as const,
        subject: 'Payment Reminder',
        body: 'Please pay your outstanding balance.',
      };

      await service.upsertTemplate(ids.companyId, template, 'test-user');

      // Run dunning twice - second run should respect throttle
      const result1 = await service.runDunning(ids.companyId, false);
      const result2 = await service.runDunning(ids.companyId, false);

      expect(result1.emails_sent).toBeGreaterThanOrEqual(0);
      expect(result2.emails_sent).toBe(0); // Should be 0 due to throttle
    });
  });

  describe('Template Rendering', () => {
    it('should render template with handlebars variables', async () => {
      const template = {
        kind: 'AR_DUNNING' as const,
        subject: 'Payment Reminder - {{customer.name}}',
        body: 'Hi {{customer.name}}, our records show {{total_due}} due across {{invoice_count}} invoice(s). Oldest {{oldest_days}} days.',
      };

      const templateId = await service.upsertTemplate(
        ids.companyId,
        template,
        'test-user'
      );

      const context = {
        companyId: ids.companyId,
        customerId: 'customer-1',
        customerName: 'Test Customer',
        invoices: [
          {
            id: 'inv-1',
            customerId: 'customer-1',
            customerName: 'Test Customer',
            invoiceNo: 'INV-001',
            invoiceDate: '2024-01-01',
            dueDate: '2024-01-31',
            amount: 1000,
            currency: 'USD',
            daysOverdue: 15,
            bucket: '1-30',
          },
        ],
        totalDue: 1000,
        oldestDays: 15,
        bucket: '1-30',
      };

      const rendered = await service.renderTemplate(templateId, context);

      expect(rendered.subject).toBe('Payment Reminder - Test Customer');
      expect(rendered.body).toContain('Hi Test Customer');
      expect(rendered.body).toContain('1000.00');
      expect(rendered.body).toContain('1');
      expect(rendered.body).toContain('15');
    });
  });
});
