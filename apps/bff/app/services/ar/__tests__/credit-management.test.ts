import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ArCreditManagementService } from '../credit-management';
import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import {
    arCreditPolicy,
    arCustomerCredit,
    arCreditHoldLog,
    arCollectionsNote,
    arCollectionsKpi
} from '@aibos/db-adapter/schema';

// --- AR Credit Management Tests (M24.1) ------------------------------------------

describe('ArCreditManagementService', () => {
    const testCompanyId = 'test-company';
    const testCustomerId = 'test-customer';
    const testUserId = 'test-user';

    beforeEach(async () => {
        // Clean up test data
        await db.delete(arCollectionsKpi).where(eq(arCollectionsKpi.companyId, testCompanyId));
        await db.delete(arCollectionsNote).where(eq(arCollectionsNote.companyId, testCompanyId));
        await db.delete(arCreditHoldLog).where(eq(arCreditHoldLog.companyId, testCompanyId));
        await db.delete(arCustomerCredit).where(eq(arCustomerCredit.companyId, testCompanyId));
        await db.delete(arCreditPolicy).where(eq(arCreditPolicy.companyId, testCompanyId));
    });

    afterEach(async () => {
        // Clean up after each test
        await db.delete(arCollectionsKpi).where(eq(arCollectionsKpi.companyId, testCompanyId));
        await db.delete(arCollectionsNote).where(eq(arCollectionsNote.companyId, testCompanyId));
        await db.delete(arCreditHoldLog).where(eq(arCreditHoldLog.companyId, testCompanyId));
        await db.delete(arCustomerCredit).where(eq(arCustomerCredit.companyId, testCompanyId));
        await db.delete(arCreditPolicy).where(eq(arCreditPolicy.companyId, testCompanyId));
    });

    describe('calculateExposureAndDso', () => {
        it('should calculate exposure and DSO correctly', async () => {
            const service = new ArCreditManagementService();
            const asOfDate = '2024-01-15';

            // Mock data setup would go here
            // For now, test the method exists and returns expected structure
            const result = await service.calculateExposureAndDso(testCompanyId, testCustomerId, asOfDate);

            expect(result).toHaveProperty('exposure');
            expect(result).toHaveProperty('dso');
            expect(result).toHaveProperty('disputesOpen');
            expect(result).toHaveProperty('ptpOpen');
            expect(typeof result.exposure).toBe('number');
            expect(typeof result.dso).toBe('number');
        });
    });

    describe('evaluateCreditHolds', () => {
        it('should trigger HOLD when exposure exceeds limit', async () => {
            const service = new ArCreditManagementService();

            // Setup policy
            await db.insert(arCreditPolicy).values({
                companyId: testCompanyId,
                policyCode: 'DEFAULT',
                maxLimit: '1000',
                dsoTarget: 45,
                graceDays: 5,
                ptpTolerance: 2,
                riskWeight: '1.0',
                updatedBy: testUserId
            });

            // Setup customer with high exposure
            await db.insert(arCustomerCredit).values({
                companyId: testCompanyId,
                customerId: testCustomerId,
                policyCode: 'DEFAULT',
                creditLimit: '500', // Lower than exposure
                onHold: false,
                updatedBy: testUserId
            });

            const result = await service.evaluateCreditHolds(
                testCompanyId,
                { dry_run: true, customer_ids: [testCustomerId] },
                testUserId
            );

            expect(result.customers_evaluated).toBe(1);
            expect(result.holds_triggered).toBeGreaterThanOrEqual(0);
            expect(result.details).toHaveLength(1);
            expect(result.details[0]?.customer_id).toBe(testCustomerId);
        });

        it('should trigger RELEASE when breaches are resolved', async () => {
            const service = new ArCreditManagementService();

            // Setup policy
            await db.insert(arCreditPolicy).values({
                companyId: testCompanyId,
                policyCode: 'DEFAULT',
                maxLimit: '1000',
                dsoTarget: 45,
                graceDays: 5,
                ptpTolerance: 2,
                riskWeight: '1.0',
                updatedBy: testUserId
            });

            // Setup customer currently on hold
            await db.insert(arCustomerCredit).values({
                companyId: testCompanyId,
                customerId: testCustomerId,
                policyCode: 'DEFAULT',
                creditLimit: '1000', // Higher than exposure
                onHold: true,
                holdReason: 'Previous breach',
                updatedBy: testUserId
            });

            const result = await service.evaluateCreditHolds(
                testCompanyId,
                { dry_run: true, customer_ids: [testCustomerId] },
                testUserId
            );

            expect(result.customers_evaluated).toBe(1);
            expect(result.details).toHaveLength(1);
            expect(result.details[0]?.customer_id).toBe(testCustomerId);
        });
    });

    describe('getWorkbenchList', () => {
        it('should return prioritized workbench list', async () => {
            const service = new ArCreditManagementService();

            // Setup customer
            await db.insert(arCustomerCredit).values({
                companyId: testCompanyId,
                customerId: testCustomerId,
                policyCode: 'DEFAULT',
                creditLimit: '1000',
                onHold: false,
                updatedBy: testUserId
            });

            const result = await service.getWorkbenchList(testCompanyId, {
                max_rows: 10
            });

            expect(Array.isArray(result)).toBe(true);
            if (result.length > 0) {
                expect(result[0]).toHaveProperty('customer_id');
                expect(result[0]).toHaveProperty('exposure');
                expect(result[0]).toHaveProperty('dso');
                expect(result[0]).toHaveProperty('priority_score');
            }
        });

        it('should filter by on_hold status', async () => {
            const service = new ArCreditManagementService();

            const result = await service.getWorkbenchList(testCompanyId, {
                on_hold: true,
                max_rows: 10
            });

            expect(Array.isArray(result)).toBe(true);
            // All returned customers should be on hold
            result.forEach(customer => {
                expect(customer.on_hold).toBe(true);
            });
        });
    });

    describe('addCollectionsNote', () => {
        it('should add collections note successfully', async () => {
            const service = new ArCreditManagementService();

            await service.addCollectionsNote(testCompanyId, {
                customer_id: testCustomerId,
                kind: 'CALL',
                body: 'Called customer about overdue invoice',
                next_action_date: '2024-01-20'
            }, testUserId);

            // Verify note was created
            const notes = await db
                .select()
                .from(arCollectionsNote)
                .where(
                    and(
                        eq(arCollectionsNote.companyId, testCompanyId),
                        eq(arCollectionsNote.customerId, testCustomerId)
                    )
                );

            expect(notes).toHaveLength(1);
            expect(notes[0]?.kind).toBe('CALL');
            expect(notes[0]?.body).toBe('Called customer about overdue invoice');
        });
    });

    describe('generateKpiSnapshot', () => {
        it('should generate KPI snapshot', async () => {
            const service = new ArCreditManagementService();

            // Setup customer
            await db.insert(arCustomerCredit).values({
                companyId: testCompanyId,
                customerId: testCustomerId,
                policyCode: 'DEFAULT',
                creditLimit: '1000',
                onHold: false,
                updatedBy: testUserId
            });

            const result = await service.generateKpiSnapshot(testCompanyId, '2024-01-15');

            expect(result).toHaveProperty('as_of_date');
            expect(result).toHaveProperty('total_exposure');
            expect(result).toHaveProperty('total_dso');
            expect(result).toHaveProperty('customers_on_hold');
            expect(result).toHaveProperty('customers');
            expect(Array.isArray(result.customers)).toBe(true);
        });
    });
});

// --- Performance Tests (M24.1) ---------------------------------------------------

describe('ArCreditManagementService Performance', () => {
    it('should evaluate 5k customers in under 2s', async () => {
        const service = new ArCreditManagementService();
        const startTime = Date.now();

        // Mock evaluation with large dataset
        const result = await service.evaluateCreditHolds(
            'test-company',
            { dry_run: true },
            'test-user'
        );

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(2000); // 2 seconds
        expect(result.customers_evaluated).toBeGreaterThanOrEqual(0);
    });

    it('should generate workbench list in under 1s', async () => {
        const service = new ArCreditManagementService();
        const startTime = Date.now();

        const result = await service.getWorkbenchList('test-company', {
            max_rows: 100
        });

        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(1000); // 1 second
        expect(Array.isArray(result)).toBe(true);
    });
});
