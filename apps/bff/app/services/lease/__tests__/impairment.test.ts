import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ImpairIndicatorService, ImpairMeasureService, ImpairPostingService } from '../impairment';
import { ComponentDesignService } from '../component';
import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and } from 'drizzle-orm';
import {
    lease,
    leaseComponent,
    leaseComponentSched,
    leaseOpening,
    leaseImpTest,
    leaseImpLine,
    leaseImpPost,
    leaseImpPostLock
} from '@aibos/db-adapter/schema';
import type {
    LeaseComponentDesignReqType,
    LeaseImpairAssessReqType,
    LeaseImpairPostReqType
} from '@aibos/contracts';

describe('ImpairIndicatorService', () => {
    let service: ImpairIndicatorService;
    let testCompanyId: string;
    let testCguCode: string;
    let testAsOfDate: string;

    beforeEach(() => {
        service = new ImpairIndicatorService();
        testCompanyId = ulid();
        testCguCode = 'CGU-001';
        testAsOfDate = '2024-06-30';
    });

    describe('checkImpairmentIndicators', () => {
        it('should return empty array when no indicators found', async () => {
            const indicators = await service.checkImpairmentIndicators(
                testCompanyId,
                testCguCode,
                testAsOfDate
            );

            expect(indicators).toEqual([]);
        });

        it('should check for cash-generating deterioration', async () => {
            const indicators = await service.checkImpairmentIndicators(
                testCompanyId,
                testCguCode,
                testAsOfDate
            );

            // Should not throw error and return array
            expect(Array.isArray(indicators)).toBe(true);
        });
    });
});

describe('ImpairMeasureService', () => {
    let service: ImpairMeasureService;
    let designService: ComponentDesignService;
    let testCompanyId: string;
    let testUserId: string;
    let testLeaseId: string;

    beforeEach(async () => {
        service = new ImpairMeasureService();
        designService = new ComponentDesignService();
        testCompanyId = ulid();
        testUserId = ulid();
        testLeaseId = ulid();

        // Create test lease
        await db.insert(lease).values({
            id: testLeaseId,
            companyId: testCompanyId,
            leaseCode: 'TEST-LEASE-003',
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
            updatedBy: testUserId
        });

        // Create opening measures
        await db.insert(leaseOpening).values({
            id: ulid(),
            leaseId: testLeaseId,
            initialLiability: '150000',
            initialRou: '150000',
            incentivesReceived: '7500',
            initialDirectCosts: '3000',
            restorationCost: '4500',
            computedAt: new Date(),
            computedBy: testUserId
        });

        // Create test components
        const splits: LeaseComponentDesignReqType['splits'] = [
            {
                code: 'LAND',
                name: 'Land Component',
                class: 'Land',
                pct_of_rou: 0.3,
                useful_life_months: 36,
                method: 'SL'
            },
            {
                code: 'BUILDING',
                name: 'Building Component',
                class: 'Building',
                pct_of_rou: 0.7,
                useful_life_months: 36,
                method: 'SL'
            }
        ];

        await designService.designFromAllocation(testCompanyId, testUserId, testLeaseId, splits);
    });

    afterEach(async () => {
        // Clean up test data
        await db.delete(leaseImpLine).where(eq(leaseImpLine.impairTestId, ulid()));
        await db.delete(leaseImpTest).where(eq(leaseImpTest.companyId, testCompanyId));
        await db.delete(leaseComponentSched).where(eq(leaseComponentSched.companyId, testCompanyId));
        await db.delete(leaseComponent).where(eq(leaseComponent.companyId, testCompanyId));
        await db.delete(leaseOpening).where(eq(leaseOpening.leaseId, testLeaseId));
        await db.delete(lease).where(eq(lease.id, testLeaseId));
    });

    describe('assessImpairment', () => {
        it('should assess impairment for component level', async () => {
            const components = await designService.getLeaseComponents(testCompanyId, testLeaseId);
            const componentId = components[0]!.id;

            const data: LeaseImpairAssessReqType = {
                cgu_code: 'CGU-001',
                level: 'COMPONENT',
                method: 'VIU',
                discount_rate: 0.05,
                recoverable_amount: 40000,
                trigger: 'INDICATOR',
                as_of_date: '2024-06-30',
                component_ids: [componentId],
                notes: 'Test impairment assessment'
            };

            const result = await service.assessImpairment(testCompanyId, testUserId, data);

            expect(result.test_id).toBeDefined();
            expect(result.cgu_code).toBe('CGU-001');
            expect(result.level).toBe('COMPONENT');
            expect(result.method).toBe('VIU');
            expect(result.total_carrying_amount).toBeGreaterThan(0);
            expect(result.recoverable_amount).toBe(40000);
            expect(result.allocation_lines).toHaveLength(1);
        });

        it('should assess impairment for CGU level', async () => {
            const data: LeaseImpairAssessReqType = {
                cgu_code: 'Building',
                level: 'CGU',
                method: 'FVLCD',
                discount_rate: 0.06,
                recoverable_amount: 120000,
                trigger: 'ANNUAL',
                as_of_date: '2024-06-30',
                notes: 'Annual CGU impairment test'
            };

            const result = await service.assessImpairment(testCompanyId, testUserId, data);

            expect(result.test_id).toBeDefined();
            expect(result.cgu_code).toBe('Building');
            expect(result.level).toBe('CGU');
            expect(result.method).toBe('FVLCD');
            expect(result.allocation_lines.length).toBeGreaterThan(0);
        });

        it('should throw error for invalid CGU code', async () => {
            const data: LeaseImpairAssessReqType = {
                cgu_code: '', // Invalid empty CGU code
                level: 'COMPONENT',
                method: 'VIU',
                discount_rate: 0.05,
                recoverable_amount: 40000,
                trigger: 'INDICATOR',
                as_of_date: '2024-06-30',
                component_ids: ['test-id']
            };

            await expect(
                service.assessImpairment(testCompanyId, testUserId, data)
            ).rejects.toThrow('CGU code is required');
        });

        it('should throw error for invalid discount rate', async () => {
            const data: LeaseImpairAssessReqType = {
                cgu_code: 'CGU-001',
                level: 'COMPONENT',
                method: 'VIU',
                discount_rate: 1.5, // Invalid: > 1
                recoverable_amount: 40000,
                trigger: 'INDICATOR',
                as_of_date: '2024-06-30',
                component_ids: ['test-id']
            };

            await expect(
                service.assessImpairment(testCompanyId, testUserId, data)
            ).rejects.toThrow('Discount rate must be between 0 and 1');
        });

        it('should throw error for negative recoverable amount', async () => {
            const data: LeaseImpairAssessReqType = {
                cgu_code: 'CGU-001',
                level: 'COMPONENT',
                method: 'VIU',
                discount_rate: 0.05,
                recoverable_amount: -1000, // Invalid: negative
                trigger: 'INDICATOR',
                as_of_date: '2024-06-30',
                component_ids: ['test-id']
            };

            await expect(
                service.assessImpairment(testCompanyId, testUserId, data)
            ).rejects.toThrow('Recoverable amount cannot be negative');
        });

        it('should throw error for missing component IDs at component level', async () => {
            const data: LeaseImpairAssessReqType = {
                cgu_code: 'CGU-001',
                level: 'COMPONENT',
                method: 'VIU',
                discount_rate: 0.05,
                recoverable_amount: 40000,
                trigger: 'INDICATOR',
                as_of_date: '2024-06-30'
                // Missing component_ids
            };

            await expect(
                service.assessImpairment(testCompanyId, testUserId, data)
            ).rejects.toThrow('Component IDs are required for component-level testing');
        });

        it('should throw error for invalid date format', async () => {
            const data: LeaseImpairAssessReqType = {
                cgu_code: 'CGU-001',
                level: 'COMPONENT',
                method: 'VIU',
                discount_rate: 0.05,
                recoverable_amount: 40000,
                trigger: 'INDICATOR',
                as_of_date: 'invalid-date', // Invalid date format
                component_ids: ['test-id']
            };

            await expect(
                service.assessImpairment(testCompanyId, testUserId, data)
            ).rejects.toThrow('Invalid as_of_date format');
        });
    });

    describe('getImpairmentTests', () => {
        it('should return impairment tests with filters', async () => {
            // First create a test
            const components = await designService.getLeaseComponents(testCompanyId, testLeaseId);
            const componentId = components[0]!.id;

            const data: LeaseImpairAssessReqType = {
                cgu_code: 'CGU-001',
                level: 'COMPONENT',
                method: 'VIU',
                discount_rate: 0.05,
                recoverable_amount: 40000,
                trigger: 'INDICATOR',
                as_of_date: '2024-06-30',
                component_ids: [componentId]
            };

            await service.assessImpairment(testCompanyId, testUserId, data);

            const tests = await service.getImpairmentTests(testCompanyId, {
                as_of_date: '2024-06-30',
                status: 'DRAFT'
            });

            expect(tests).toHaveLength(1);
            expect(tests[0]!.cgu_code).toBe('CGU-001');
        });
    });

    describe('getImpairmentTestDetail', () => {
        it('should return detailed test information', async () => {
            // Create a test first
            const components = await designService.getLeaseComponents(testCompanyId, testLeaseId);
            const componentId = components[0]!.id;

            const data: LeaseImpairAssessReqType = {
                cgu_code: 'CGU-001',
                level: 'COMPONENT',
                method: 'VIU',
                discount_rate: 0.05,
                recoverable_amount: 40000,
                trigger: 'INDICATOR',
                as_of_date: '2024-06-30',
                component_ids: [componentId]
            };

            const result = await service.assessImpairment(testCompanyId, testUserId, data);
            const testDetail = await service.getImpairmentTestDetail(testCompanyId, result.test_id);

            expect(testDetail.test_id).toBe(result.test_id);
            expect(testDetail.cgu_code).toBe('CGU-001');
            expect(testDetail.allocation_lines).toBeDefined();
        });
    });
});

describe('ImpairPostingService', () => {
    let service: ImpairPostingService;
    let measureService: ImpairMeasureService;
    let designService: ComponentDesignService;
    let testCompanyId: string;
    let testUserId: string;
    let testLeaseId: string;

    beforeEach(async () => {
        service = new ImpairPostingService();
        measureService = new ImpairMeasureService();
        designService = new ComponentDesignService();
        testCompanyId = ulid();
        testUserId = ulid();
        testLeaseId = ulid();

        // Create test lease
        await db.insert(lease).values({
            id: testLeaseId,
            companyId: testCompanyId,
            leaseCode: 'TEST-LEASE-004',
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
            updatedBy: testUserId
        });

        // Create opening measures
        await db.insert(leaseOpening).values({
            id: ulid(),
            leaseId: testLeaseId,
            initialLiability: '200000',
            initialRou: '200000',
            incentivesReceived: '10000',
            initialDirectCosts: '4000',
            restorationCost: '6000',
            computedAt: new Date(),
            computedBy: testUserId
        });

        // Create test components
        const splits: LeaseComponentDesignReqType['splits'] = [
            {
                code: 'LAND',
                name: 'Land Component',
                class: 'Land',
                pct_of_rou: 0.4,
                useful_life_months: 36,
                method: 'SL'
            },
            {
                code: 'BUILDING',
                name: 'Building Component',
                class: 'Building',
                pct_of_rou: 0.6,
                useful_life_months: 36,
                method: 'SL'
            }
        ];

        await designService.designFromAllocation(testCompanyId, testUserId, testLeaseId, splits);
    });

    afterEach(async () => {
        // Clean up test data
        await db.delete(leaseImpPostLock).where(eq(leaseImpPostLock.companyId, testCompanyId));
        await db.delete(leaseImpPost).where(eq(leaseImpPost.companyId, testCompanyId));
        await db.delete(leaseImpLine).where(eq(leaseImpLine.impairTestId, ulid()));
        await db.delete(leaseImpTest).where(eq(leaseImpTest.companyId, testCompanyId));
        await db.delete(leaseComponentSched).where(eq(leaseComponentSched.companyId, testCompanyId));
        await db.delete(leaseComponent).where(eq(leaseComponent.companyId, testCompanyId));
        await db.delete(leaseOpening).where(eq(leaseOpening.leaseId, testLeaseId));
        await db.delete(lease).where(eq(lease.id, testLeaseId));
    });

    describe('postImpairment', () => {
        it('should post impairment charges', async () => {
            // First create and measure impairment
            const components = await designService.getLeaseComponents(testCompanyId, testLeaseId);
            const componentId = components[0]!.id;

            const assessData: LeaseImpairAssessReqType = {
                cgu_code: 'CGU-001',
                level: 'COMPONENT',
                method: 'VIU',
                discount_rate: 0.05,
                recoverable_amount: 30000, // Lower than carrying amount to create impairment
                trigger: 'INDICATOR',
                as_of_date: '2024-06-30',
                component_ids: [componentId]
            };

            const assessResult = await measureService.assessImpairment(testCompanyId, testUserId, assessData);

            // Update test status to MEASURED
            await db.update(leaseImpTest)
                .set({ status: 'MEASURED', updatedAt: new Date(), updatedBy: testUserId })
                .where(eq(leaseImpTest.id, assessResult.test_id));

            const postData: LeaseImpairPostReqType = {
                impair_test_id: assessResult.test_id,
                year: 2024,
                month: 6,
                dry_run: true
            };

            const result = await service.postImpairment(testCompanyId, testUserId, postData);

            expect(result.year).toBe(2024);
            expect(result.month).toBe(6);
            expect(result.journal_lines).toBeDefined();
        });

        it('should throw error for non-existent test', async () => {
            const postData: LeaseImpairPostReqType = {
                impair_test_id: 'non-existent-id',
                year: 2024,
                month: 6,
                dry_run: true
            };

            await expect(
                service.postImpairment(testCompanyId, testUserId, postData)
            ).rejects.toThrow('Impairment test not found or not in MEASURED status');
        });

        it('should throw error for test not in MEASURED status', async () => {
            // Create a test but leave it in DRAFT status
            const components = await designService.getLeaseComponents(testCompanyId, testLeaseId);
            const componentId = components[0]!.id;

            const assessData: LeaseImpairAssessReqType = {
                cgu_code: 'CGU-001',
                level: 'COMPONENT',
                method: 'VIU',
                discount_rate: 0.05,
                recoverable_amount: 30000,
                trigger: 'INDICATOR',
                as_of_date: '2024-06-30',
                component_ids: [componentId]
            };

            const assessResult = await measureService.assessImpairment(testCompanyId, testUserId, assessData);

            const postData: LeaseImpairPostReqType = {
                impair_test_id: assessResult.test_id,
                year: 2024,
                month: 6,
                dry_run: true
            };

            await expect(
                service.postImpairment(testCompanyId, testUserId, postData)
            ).rejects.toThrow('Impairment test not found or not in MEASURED status');
        });
    });
});
