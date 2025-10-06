import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentDesignService, ComponentScheduleService } from '../component';
import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and } from 'drizzle-orm';
import {
  lease,
  leaseComponent,
  leaseComponentSched,
  leaseOpening,
} from '@aibos/db-adapter/schema';
import type { LeaseComponentDesignReqType } from '@aibos/contracts';

describe('ComponentDesignService', () => {
  let service: ComponentDesignService;
  let testCompanyId: string;
  let testUserId: string;
  let testLeaseId: string;

  beforeEach(async () => {
    service = new ComponentDesignService();
    testCompanyId = ulid();
    testUserId = ulid();
    testLeaseId = ulid();

    // Create test lease
    await db.insert(lease).values({
      id: testLeaseId,
      companyId: testCompanyId,
      leaseCode: 'TEST-LEASE-001',
      lessor: 'Test Lessor',
      assetClass: 'Building',
      ccy: 'USD',
      commenceOn: '2024-01-01',
      endOn: '2026-12-31',
      paymentFrequency: 'MONTHLY',
      discountRate: '0.05',
      rateKind: 'fixed',
      status: 'ACTIVE',
      createdAt: new Date(),
      createdBy: testUserId,
      updatedAt: new Date(),
      updatedBy: testUserId,
    });

    // Create opening measures
    await db.insert(leaseOpening).values({
      id: ulid(),
      leaseId: testLeaseId,
      initialLiability: '100000',
      initialRou: '100000',
      incentivesReceived: '5000',
      initialDirectCosts: '2000',
      restorationCost: '3000',
      computedAt: new Date(),
      computedBy: testUserId,
    });
  });

  afterEach(async () => {
    // Clean up test data
    await db
      .delete(leaseComponentSched)
      .where(eq(leaseComponentSched.companyId, testCompanyId));
    await db
      .delete(leaseComponent)
      .where(eq(leaseComponent.companyId, testCompanyId));
    await db.delete(leaseOpening).where(eq(leaseOpening.leaseId, testLeaseId));
    await db.delete(lease).where(eq(lease.id, testLeaseId));
  });

  describe('designFromAllocation', () => {
    it('should create components from valid allocation splits', async () => {
      const splits: LeaseComponentDesignReqType['splits'] = [
        {
          code: 'LAND',
          name: 'Land Component',
          class: 'Land',
          pct_of_rou: 0.3,
          useful_life_months: 36,
          method: 'SL',
        },
        {
          code: 'BUILDING',
          name: 'Building Component',
          class: 'Building',
          pct_of_rou: 0.7,
          useful_life_months: 36,
          method: 'SL',
        },
      ];

      const result = await service.designFromAllocation(
        testCompanyId,
        testUserId,
        testLeaseId,
        splits
      );

      expect(result.lease_id).toBe(testLeaseId);
      expect(result.components).toHaveLength(2);
      expect(result.total_rou).toBe(100000);
      expect(result.total_incentives).toBe(5000);
      expect(result.total_restoration).toBe(3000);
      expect(result.design_proof.total_pct).toBeCloseTo(1.0, 5);
      expect(result.design_proof.validation_passed).toBe(true);

      // Verify components were created in database
      const components = await service.getLeaseComponents(
        testCompanyId,
        testLeaseId
      );
      expect(components).toHaveLength(2);
    });

    it('should throw error for invalid percentage sum', async () => {
      const splits: LeaseComponentDesignReqType['splits'] = [
        {
          code: 'LAND',
          name: 'Land Component',
          class: 'Land',
          pct_of_rou: 0.3,
          useful_life_months: 36,
          method: 'SL',
        },
        {
          code: 'BUILDING',
          name: 'Building Component',
          class: 'Building',
          pct_of_rou: 0.5, // Total = 0.8, not 1.0
          useful_life_months: 36,
          method: 'SL',
        },
      ];

      await expect(
        service.designFromAllocation(
          testCompanyId,
          testUserId,
          testLeaseId,
          splits
        )
      ).rejects.toThrow('Component percentages must sum to 1.00000');
    });

    it('should throw error for useful life exceeding lease term', async () => {
      const splits: LeaseComponentDesignReqType['splits'] = [
        {
          code: 'LAND',
          name: 'Land Component',
          class: 'Land',
          pct_of_rou: 1.0,
          useful_life_months: 48, // Exceeds 36-month lease term
          method: 'SL',
        },
      ];

      await expect(
        service.designFromAllocation(
          testCompanyId,
          testUserId,
          testLeaseId,
          splits
        )
      ).rejects.toThrow(
        'useful life (48 months) exceeds lease term (36 months)'
      );
    });

    it('should throw error for empty splits array', async () => {
      await expect(
        service.designFromAllocation(testCompanyId, testUserId, testLeaseId, [])
      ).rejects.toThrow('At least one component split is required');
    });

    it('should throw error for missing required fields', async () => {
      const splits: LeaseComponentDesignReqType['splits'] = [
        {
          code: '', // Empty code
          name: 'Land Component',
          class: 'Land',
          pct_of_rou: 1.0,
          useful_life_months: 36,
          method: 'SL',
        },
      ];

      await expect(
        service.designFromAllocation(
          testCompanyId,
          testUserId,
          testLeaseId,
          splits
        )
      ).rejects.toThrow('Each component split must have code, name, and class');
    });

    it('should throw error for invalid percentage range', async () => {
      const splits: LeaseComponentDesignReqType['splits'] = [
        {
          code: 'LAND',
          name: 'Land Component',
          class: 'Land',
          pct_of_rou: 1.5, // Invalid: > 1
          useful_life_months: 36,
          method: 'SL',
        },
      ];

      await expect(
        service.designFromAllocation(
          testCompanyId,
          testUserId,
          testLeaseId,
          splits
        )
      ).rejects.toThrow('percentage must be between 0 and 1');
    });
  });

  describe('getLeaseComponents', () => {
    it('should return components for a lease', async () => {
      // First create components
      const splits: LeaseComponentDesignReqType['splits'] = [
        {
          code: 'LAND',
          name: 'Land Component',
          class: 'Land',
          pct_of_rou: 1.0,
          useful_life_months: 36,
          method: 'SL',
        },
      ];

      await service.designFromAllocation(
        testCompanyId,
        testUserId,
        testLeaseId,
        splits
      );

      const components = await service.getLeaseComponents(
        testCompanyId,
        testLeaseId
      );
      expect(components).toHaveLength(1);
      expect(components[0]!.code).toBe('LAND');
      expect(components[0]!.name).toBe('Land Component');
      expect(components[0]!.class).toBe('Land');
    });
  });

  describe('updateComponentAllocation', () => {
    it('should update component allocation', async () => {
      // First create a component
      const splits: LeaseComponentDesignReqType['splits'] = [
        {
          code: 'LAND',
          name: 'Land Component',
          class: 'Land',
          pct_of_rou: 1.0,
          useful_life_months: 36,
          method: 'SL',
        },
      ];

      await service.designFromAllocation(
        testCompanyId,
        testUserId,
        testLeaseId,
        splits
      );
      const components = await service.getLeaseComponents(
        testCompanyId,
        testLeaseId
      );
      const componentId = components[0]!.id;

      // Update the component
      await service.updateComponentAllocation(
        testCompanyId,
        testUserId,
        componentId,
        {
          name: 'Updated Land Component',
          useful_life_months: 30,
        }
      );

      const updatedComponents = await service.getLeaseComponents(
        testCompanyId,
        testLeaseId
      );
      expect(updatedComponents[0]!.name).toBe('Updated Land Component');
    });
  });
});

describe('ComponentScheduleService', () => {
  let service: ComponentScheduleService;
  let designService: ComponentDesignService;
  let testCompanyId: string;
  let testUserId: string;
  let testLeaseId: string;

  beforeEach(async () => {
    service = new ComponentScheduleService();
    designService = new ComponentDesignService();
    testCompanyId = ulid();
    testUserId = ulid();
    testLeaseId = ulid();

    // Create test lease
    await db.insert(lease).values({
      id: testLeaseId,
      companyId: testCompanyId,
      leaseCode: 'TEST-LEASE-002',
      lessor: 'Test Lessor',
      assetClass: 'Building',
      ccy: 'USD',
      commenceOn: '2024-01-01',
      endOn: '2024-12-31', // 12-month lease for testing
      paymentFrequency: 'MONTHLY',
      discountRate: '0.05',
      rateKind: 'fixed',
      status: 'ACTIVE',
      createdAt: new Date(),
      createdBy: testUserId,
      updatedAt: new Date(),
      updatedBy: testUserId,
    });

    // Create opening measures
    await db.insert(leaseOpening).values({
      id: ulid(),
      leaseId: testLeaseId,
      initialLiability: '120000',
      initialRou: '120000',
      incentivesReceived: '6000',
      initialDirectCosts: '2400',
      restorationCost: '3600',
      computedAt: new Date(),
      computedBy: testUserId,
    });
  });

  afterEach(async () => {
    // Clean up test data
    await db
      .delete(leaseComponentSched)
      .where(eq(leaseComponentSched.companyId, testCompanyId));
    await db
      .delete(leaseComponent)
      .where(eq(leaseComponent.companyId, testCompanyId));
    await db.delete(leaseOpening).where(eq(leaseOpening.leaseId, testLeaseId));
    await db.delete(lease).where(eq(lease.id, testLeaseId));
  });

  describe('buildSchedules', () => {
    it('should build schedules for components', async () => {
      // First create components
      const splits: LeaseComponentDesignReqType['splits'] = [
        {
          code: 'LAND',
          name: 'Land Component',
          class: 'Land',
          pct_of_rou: 0.4,
          useful_life_months: 12,
          method: 'SL',
        },
        {
          code: 'BUILDING',
          name: 'Building Component',
          class: 'Building',
          pct_of_rou: 0.6,
          useful_life_months: 12,
          method: 'SL',
        },
      ];

      await designService.designFromAllocation(
        testCompanyId,
        testUserId,
        testLeaseId,
        splits
      );

      const result = await service.buildSchedules(
        testCompanyId,
        testUserId,
        testLeaseId
      );

      expect(result.lease_id).toBe(testLeaseId);
      expect(result.component_schedules).toHaveLength(2);
      expect(result.reconciliation.total_component_rou).toBeCloseTo(120000, 2);
      expect(result.reconciliation.total_lease_rou).toBeCloseTo(120000, 2);
      expect(result.reconciliation.reconciliation_passed).toBe(true);

      // Verify schedules were created
      const schedules = await service.getComponentSchedule(
        testCompanyId,
        result.component_schedules[0]!.component_id
      );
      expect(schedules.length).toBeGreaterThan(0);
    });

    it('should handle DDB method correctly', async () => {
      const splits: LeaseComponentDesignReqType['splits'] = [
        {
          code: 'EQUIPMENT',
          name: 'Equipment Component',
          class: 'IT/Equipment',
          pct_of_rou: 1.0,
          useful_life_months: 12,
          method: 'DDB',
        },
      ];

      await designService.designFromAllocation(
        testCompanyId,
        testUserId,
        testLeaseId,
        splits
      );
      const result = await service.buildSchedules(
        testCompanyId,
        testUserId,
        testLeaseId
      );

      expect(result.component_schedules).toHaveLength(1);
      expect(result.component_schedules[0]!.method).toBe('DDB');
    });
  });

  describe('getComponentSchedule', () => {
    it('should return component schedule for specific period', async () => {
      // Create component and build schedules
      const splits: LeaseComponentDesignReqType['splits'] = [
        {
          code: 'LAND',
          name: 'Land Component',
          class: 'Land',
          pct_of_rou: 1.0,
          useful_life_months: 12,
          method: 'SL',
        },
      ];

      await designService.designFromAllocation(
        testCompanyId,
        testUserId,
        testLeaseId,
        splits
      );
      await service.buildSchedules(testCompanyId, testUserId, testLeaseId);

      const components = await designService.getLeaseComponents(
        testCompanyId,
        testLeaseId
      );
      const componentId = components[0]!.id;

      const schedules = await service.getComponentSchedule(
        testCompanyId,
        componentId,
        2024,
        1
      );
      expect(schedules).toHaveLength(1);
      expect(schedules[0]!.year).toBe(2024);
      expect(schedules[0]!.month).toBe(1);
    });
  });
});
