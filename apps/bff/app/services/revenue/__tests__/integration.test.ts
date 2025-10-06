import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RevAllocationService } from '../allocate';
import { RevScheduleService } from '../schedule';
import { RevRecognitionService } from '../recognize';
import { RevEventsService } from '../events';
import {
  RevPolicyService,
  RevRpoService,
  RevArtifactsService,
} from '../policy';
import { db } from '@/lib/db';
import { ulid } from 'ulid';

describe('M25.1 Revenue Recognition - Service Tests', () => {
  let allocationService: RevAllocationService;
  let scheduleService: RevScheduleService;
  let recognitionService: RevRecognitionService;
  let eventsService: RevEventsService;
  let policyService: RevPolicyService;
  let rpoService: RevRpoService;
  let artifactsService: RevArtifactsService;

  const testCompanyId = 'test-company-' + ulid();
  const testUserId = 'test-user-' + ulid();
  const testContractId = 'test-contract-' + ulid();
  const testProductId = 'test-product-' + ulid();

  beforeEach(() => {
    allocationService = new RevAllocationService();
    scheduleService = new RevScheduleService();
    recognitionService = new RevRecognitionService();
    eventsService = new RevEventsService();
    policyService = new RevPolicyService();
    rpoService = new RevRpoService();
    artifactsService = new RevArtifactsService();
  });

  afterEach(async () => {
    // Clean up test data
    console.log('🧹 Test cleanup would happen here');
  });

  describe('Revenue Allocation Service', () => {
    it('should create POBs from invoice allocation', async () => {
      const allocationData = {
        invoice_id: 'INV-1001',
        strategy: 'RELATIVE_SSP' as const,
      };

      const result = await allocationService.allocateFromInvoice(
        testCompanyId,
        testUserId,
        allocationData
      );

      expect(result).toBeDefined();
      expect(result.invoice_id).toBe('INV-1001');
      expect(result.pobs_created).toBeGreaterThan(0);
      expect(result.total_allocated).toBeGreaterThan(0);
      expect(result.pobs).toHaveLength(result.pobs_created);
    });

    it('should create POB manually', async () => {
      const pobData = {
        contract_id: testContractId,
        product_id: testProductId,
        name: 'Test Service POB',
        method: 'RATABLE_MONTHLY' as const,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        qty: 1,
        allocated_amount: 12000.0,
        currency: 'USD',
      };

      const result = await allocationService.createPOB(
        testCompanyId,
        testUserId,
        pobData
      );

      expect(result).toBeDefined();
      expect(result.contract_id).toBe(testContractId);
      expect(result.product_id).toBe(testProductId);
      expect(result.name).toBe('Test Service POB');
      expect(result.method).toBe('RATABLE_MONTHLY');
      expect(result.allocated_amount).toBe(12000.0);
      expect(result.status).toBe('OPEN');
    });

    it('should query POBs with filters', async () => {
      // Create a test POB first
      const pobData = {
        contract_id: testContractId,
        product_id: testProductId,
        name: 'Test Query POB',
        method: 'RATABLE_MONTHLY' as const,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        qty: 1,
        allocated_amount: 10000.0,
        currency: 'USD',
      };

      await allocationService.createPOB(testCompanyId, testUserId, pobData);

      // Query with contract filter
      const query = {
        contract_id: testContractId,
        status: 'OPEN' as const,
        limit: 10,
        offset: 0,
      };

      const result = await allocationService.queryPOBs(testCompanyId, query);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.contract_id).toBe(testContractId);
    });
  });

  describe('Revenue Schedule Service', () => {
    it('should build ratable monthly schedule', async () => {
      // First create a POB
      const pobData = {
        contract_id: testContractId,
        product_id: testProductId,
        name: 'Schedule Test POB',
        method: 'RATABLE_MONTHLY' as const,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        qty: 1,
        allocated_amount: 12000.0,
        currency: 'USD',
      };

      const pob = await allocationService.createPOB(
        testCompanyId,
        testUserId,
        pobData
      );

      // Build schedule
      const scheduleData = {
        pob_id: pob.id,
        method: 'RATABLE_MONTHLY' as const,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
      };

      const result = await scheduleService.buildSchedule(
        testCompanyId,
        testUserId,
        scheduleData
      );

      expect(result.success).toBe(true);
      expect(result.periods_created).toBe(12); // 12 months
      expect(result.message).toContain('Schedule built');
    });

    it('should build point-in-time schedule', async () => {
      // First create a POB
      const pobData = {
        contract_id: testContractId,
        product_id: testProductId,
        name: 'Point-in-Time POB',
        method: 'POINT_IN_TIME' as const,
        start_date: '2025-01-01',
        end_date: '2025-01-01',
        qty: 1,
        allocated_amount: 5000.0,
        currency: 'USD',
      };

      const pob = await allocationService.createPOB(
        testCompanyId,
        testUserId,
        pobData
      );

      // Build schedule
      const scheduleData = {
        pob_id: pob.id,
        method: 'POINT_IN_TIME' as const,
        start_date: '2025-01-01',
        end_date: '2025-01-01',
      };

      const result = await scheduleService.buildSchedule(
        testCompanyId,
        testUserId,
        scheduleData
      );

      expect(result.success).toBe(true);
      expect(result.periods_created).toBe(1); // Single period
    });

    it('should query schedule entries', async () => {
      const query = {
        year: 2025,
        month: 1,
        status: 'PLANNED' as const,
        limit: 10,
        offset: 0,
      };

      const result = await scheduleService.querySchedule(testCompanyId, query);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Revenue Recognition Service', () => {
    it('should run recognition in dry run mode', async () => {
      const recognitionData = {
        year: 2025,
        month: 1,
        dry_run: true,
      };

      const result = await recognitionService.runRecognition(
        testCompanyId,
        testUserId,
        recognitionData
      );

      expect(result).toBeDefined();
      expect(result.dry_run).toBe(true);
      expect(result.run_id).toBeDefined();
      expect(result.total_amount).toBeGreaterThanOrEqual(0);
      expect(result.lines_created).toBeGreaterThanOrEqual(0);
    });

    it('should query recognition runs', async () => {
      const query = {
        year: 2025,
        month: 1,
        status: 'DRAFT' as const,
        limit: 10,
        offset: 0,
      };

      const result = await recognitionService.queryRecognitionRuns(
        testCompanyId,
        query
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Revenue Events Service', () => {
    it('should create and process events', async () => {
      // First create a POB
      const pobData = {
        contract_id: testContractId,
        product_id: testProductId,
        name: 'Event Test POB',
        method: 'RATABLE_MONTHLY' as const,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        qty: 1,
        allocated_amount: 10000.0,
        currency: 'USD',
      };

      const pob = await allocationService.createPOB(
        testCompanyId,
        testUserId,
        pobData
      );

      // Create an event
      const eventData = {
        pob_id: pob.id,
        kind: 'ACTIVATE' as const,
        occurred_at: new Date().toISOString(),
        payload: { reason: 'Service activated' },
      };

      const result = await eventsService.createEvent(
        testCompanyId,
        testUserId,
        eventData
      );

      expect(result).toBeDefined();
      expect(result.pob_id).toBe(pob.id);
      expect(result.kind).toBe('ACTIVATE');
      expect(result.payload).toEqual({ reason: 'Service activated' });
    });

    it('should query events with filters', async () => {
      const query = {
        kind: 'ACTIVATE' as const,
        processed: false,
        limit: 10,
        offset: 0,
      };

      const result = await eventsService.queryEvents(testCompanyId, query);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Revenue Policy Service', () => {
    it('should upsert revenue policy', async () => {
      const policyData = {
        rev_account: '4000-REVENUE',
        unbilled_ar_account: '1205-UNBILLED-AR',
        deferred_rev_account: '2205-DEFERRED-REVENUE',
        rounding: 'HALF_UP' as const,
      };

      const result = await policyService.upsertPolicy(
        testCompanyId,
        testUserId,
        policyData
      );

      expect(result).toBeDefined();
      expect(result.company_id).toBe(testCompanyId);
      expect(result.rev_account).toBe('4000-REVENUE');
      expect(result.unbilled_ar_account).toBe('1205-UNBILLED-AR');
      expect(result.deferred_rev_account).toBe('2205-DEFERRED-REVENUE');
      expect(result.rounding).toBe('HALF_UP');
    });

    it('should get revenue policy', async () => {
      // First create a policy
      const policyData = {
        rev_account: '4000-REVENUE',
        unbilled_ar_account: '1205-UNBILLED-AR',
        deferred_rev_account: '2205-DEFERRED-REVENUE',
        rounding: 'HALF_UP' as const,
      };

      await policyService.upsertPolicy(testCompanyId, testUserId, policyData);

      // Get the policy
      const result = await policyService.getPolicy(testCompanyId);

      expect(result).toBeDefined();
      expect(result!.company_id).toBe(testCompanyId);
      expect(result!.rev_account).toBe('4000-REVENUE');
    });
  });

  describe('RPO Service', () => {
    it('should create RPO snapshot', async () => {
      const snapshotData = {
        as_of_date: '2025-01-31',
        currency: 'USD',
      };

      const result = await rpoService.createSnapshot(
        testCompanyId,
        testUserId,
        snapshotData
      );

      expect(result).toBeDefined();
      expect(result.company_id).toBe(testCompanyId);
      expect(result.as_of_date).toBe('2025-01-31');
      expect(result.currency).toBe('USD');
      expect(result.total_rpo).toBeGreaterThanOrEqual(0);
      expect(result.due_within_12m).toBeGreaterThanOrEqual(0);
      expect(result.due_after_12m).toBeGreaterThanOrEqual(0);
    });

    it('should query RPO snapshots', async () => {
      const query = {
        currency: 'USD',
        limit: 10,
        offset: 0,
      };

      const result = await rpoService.querySnapshots(testCompanyId, query);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Artifacts Service', () => {
    it('should export recognition run artifacts', async () => {
      // First create a recognition run
      const recognitionData = {
        year: 2025,
        month: 1,
        dry_run: true,
      };

      const recognitionResult = await recognitionService.runRecognition(
        testCompanyId,
        testUserId,
        recognitionData
      );

      // Export artifacts
      const exportData = {
        run_id: recognitionResult.run_id,
        kind: 'JSON' as const,
      };

      const result = await artifactsService.exportRun(
        testCompanyId,
        testUserId,
        exportData
      );

      expect(result).toBeDefined();
      expect(result.artifact_id).toBeDefined();
      expect(result.filename).toContain('rev-recognition');
      expect(result.bytes).toBeGreaterThan(0);
      expect(result.sha256).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should complete full revenue recognition workflow', async () => {
      // 1. Set up policy
      await policyService.upsertPolicy(testCompanyId, testUserId, {
        rev_account: '4000-REVENUE',
        unbilled_ar_account: '1205-UNBILLED-AR',
        deferred_rev_account: '2205-DEFERRED-REVENUE',
        rounding: 'HALF_UP',
      });

      // 2. Create POB
      const pob = await allocationService.createPOB(testCompanyId, testUserId, {
        contract_id: testContractId,
        product_id: testProductId,
        name: 'Integration Test POB',
        method: 'RATABLE_MONTHLY',
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        qty: 1,
        allocated_amount: 12000.0,
        currency: 'USD',
      });

      // 3. Build schedule
      const scheduleResult = await scheduleService.buildSchedule(
        testCompanyId,
        testUserId,
        {
          pob_id: pob.id,
          method: 'RATABLE_MONTHLY',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
        }
      );

      expect(scheduleResult.success).toBe(true);

      // 4. Run recognition (dry run)
      const recognitionResult = await recognitionService.runRecognition(
        testCompanyId,
        testUserId,
        {
          year: 2025,
          month: 1,
          dry_run: true,
        }
      );

      expect(recognitionResult.dry_run).toBe(true);
      expect(recognitionResult.run_id).toBeDefined();

      // 5. Create RPO snapshot
      const rpoResult = await rpoService.createSnapshot(
        testCompanyId,
        testUserId,
        {
          as_of_date: '2025-01-31',
          currency: 'USD',
        }
      );

      expect(rpoResult.total_rpo).toBeGreaterThanOrEqual(0);

      console.log(
        '✅ Full revenue recognition workflow completed successfully'
      );
    });
  });
});
