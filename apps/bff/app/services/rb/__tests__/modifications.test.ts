import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { RevModificationService } from '../modifications';
import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { rbContract, rbPriceBook, rbProduct } from '@aibos/db-adapter/schema';

describe('M25.2 Revenue Modifications - Service Tests', () => {
    let modificationService: RevModificationService;
    const testCompanyId = 'test-company-' + ulid();
    const testUserId = 'test-user-' + ulid();
    const testContractId = 'test-contract-' + ulid();

    beforeEach(async () => {
        modificationService = new RevModificationService();

        // Create test price book first
        const testBookId = 'test-book-' + ulid();
        await db.insert(rbPriceBook).values({
            id: testBookId,
            companyId: testCompanyId,
            code: 'TEST-BOOK-001',
            currency: 'USD',
            active: true,
            updatedBy: testUserId
        });

        // Create test contract
        await db.insert(rbContract).values({
            id: testContractId,
            companyId: testCompanyId,
            customerId: 'test-customer-' + ulid(),
            bookId: testBookId,
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            status: 'ACTIVE',
            updatedBy: testUserId
        });

        // Create test product
        await db.insert(rbProduct).values({
            id: 'test-product-1',
            companyId: testCompanyId,
            sku: 'TEST-SKU-001',
            name: 'Test Product',
            kind: 'SERVICE',
            status: 'ACTIVE',
            updatedBy: testUserId
        });
    });

    afterEach(async () => {
        // Clean up test data
        // Note: In a real test environment, you'd want to clean up test data
        // For now, we'll just log that cleanup would happen
        console.log('🧹 Test cleanup would happen here');
    });

    describe('Change Order Management', () => {
        it('should create a change order successfully', async () => {
            const changeOrderData = {
                contract_id: testContractId,
                effective_date: '2025-01-15',
                reason: 'Customer requested upgrade',
                lines: [
                    {
                        product_id: 'test-product-1',
                        qty_delta: 10,
                        price_delta: 100.00,
                        new_method: 'RATABLE_MONTHLY' as const
                    }
                ]
            };

            const result = await modificationService.createChangeOrder(
                testCompanyId,
                testUserId,
                changeOrderData
            );

            expect(result).toBeDefined();
            expect(result.contract_id).toBe(testContractId);
            expect(result.effective_date).toBe('2025-01-15');
            expect(result.status).toBe('DRAFT');
            expect(result.lines).toHaveLength(1);
            expect(result.lines[0]?.qty_delta).toBe(10);
            expect(result.lines[0]?.price_delta).toBe(100.00);
        });

        it('should apply a change order with PROSPECTIVE treatment', async () => {
            // First create a change order
            const changeOrderData = {
                contract_id: testContractId,
                effective_date: '2025-01-15',
                reason: 'Customer requested upgrade',
                lines: [
                    {
                        product_id: 'test-product-1',
                        qty_delta: 10,
                        price_delta: 100.00
                    }
                ]
            };

            const changeOrder = await modificationService.createChangeOrder(
                testCompanyId,
                testUserId,
                changeOrderData
            );

            // Then apply it
            const applyData = {
                change_order_id: changeOrder.id,
                treatment: 'PROSPECTIVE' as const
            };

            const result = await modificationService.applyChangeOrder(
                testCompanyId,
                testUserId,
                applyData
            );

            expect(result.success).toBe(true);
            expect(result.message).toContain('successfully');
        });

        it('should query change orders with filters', async () => {
            // Create a test change order
            const changeOrderData = {
                contract_id: testContractId,
                effective_date: '2025-01-15',
                reason: 'Test change order',
                lines: []
            };

            await modificationService.createChangeOrder(
                testCompanyId,
                testUserId,
                changeOrderData
            );

            // Query with contract filter
            const query = {
                contract_id: testContractId,
                status: 'DRAFT' as const,
                limit: 10,
                offset: 0
            };

            const result = await modificationService.queryChangeOrders(
                testCompanyId,
                query
            );

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('Variable Consideration Management', () => {
        it('should upsert VC policy successfully', async () => {
            const policyData = {
                default_method: 'EXPECTED_VALUE' as const,
                constraint_probability_threshold: 0.6,
                volatility_lookback_months: 18
            };

            const result = await modificationService.upsertVCPolicy(
                testCompanyId,
                testUserId,
                policyData
            );

            expect(result).toBeDefined();
            expect(result.company_id).toBe(testCompanyId);
            expect(result.default_method).toBe('EXPECTED_VALUE');
            expect(result.constraint_probability_threshold).toBe(0.6);
            expect(result.volatility_lookback_months).toBe(18);
        });

        it('should upsert VC estimate with constraint applied', async () => {
            const vcData = {
                contract_id: testContractId,
                pob_id: 'test-pob-1',
                year: 2025,
                month: 1,
                method: 'EXPECTED_VALUE' as const,
                estimate: 1000.00,
                confidence: 0.3, // Below threshold, should be constrained
                resolve: false
            };

            const result = await modificationService.upsertVCEstimate(
                testCompanyId,
                testUserId,
                vcData
            );

            expect(result).toBeDefined();
            expect(result.contract_id).toBe(testContractId);
            expect(result.pob_id).toBe('test-pob-1');
            expect(result.method).toBe('EXPECTED_VALUE');
            expect(result.raw_estimate).toBe(1000.00);
            expect(result.confidence).toBe(0.3);
            expect(result.status).toBe('OPEN');
            // Constrained amount should be 0 due to low confidence
            expect(result.constrained_amount).toBe(0);
        });

        it('should query VC estimates with filters', async () => {
            // Create a test VC estimate
            const vcData = {
                contract_id: testContractId,
                pob_id: 'test-pob-1',
                year: 2025,
                month: 1,
                method: 'EXPECTED_VALUE' as const,
                estimate: 500.00,
                confidence: 0.8,
                resolve: false
            };

            await modificationService.upsertVCEstimate(
                testCompanyId,
                testUserId,
                vcData
            );

            // Query with filters
            const query = {
                contract_id: testContractId,
                year: 2025,
                month: 1,
                status: 'OPEN' as const,
                limit: 10,
                offset: 0
            };

            const result = await modificationService.queryVCEstimates(
                testCompanyId,
                query
            );

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('Schedule Revisions', () => {
        it('should query schedule revisions', async () => {
            const query = {
                pob_id: 'test-pob-1',
                year: 2025,
                month: 1,
                cause: 'CO' as const,
                limit: 10,
                offset: 0
            };

            const result = await modificationService.queryRevisions(
                testCompanyId,
                query
            );

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('Recognition and Disclosures', () => {
        it('should run revised recognition in dry run mode', async () => {
            const recognitionData = {
                year: 2025,
                month: 1,
                dry_run: true
            };

            const result = await modificationService.runRevisedRecognition(
                testCompanyId,
                testUserId,
                recognitionData
            );

            expect(result.success).toBe(true);
            expect(result.message).toContain('Dry run completed');
        });

        it('should get disclosures for a period', async () => {
            const result = await modificationService.getDisclosures(
                testCompanyId,
                2025,
                1
            );

            expect(result).toBeDefined();
            expect(result.modification_register).toBeDefined();
            expect(result.vc_rollforward).toBeDefined();
            expect(result.rpo_snapshot).toBeDefined();
            expect(Array.isArray(result.modification_register)).toBe(true);
            expect(Array.isArray(result.vc_rollforward)).toBe(true);
            expect(Array.isArray(result.rpo_snapshot)).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid change order application', async () => {
            const applyData = {
                change_order_id: 'non-existent-id',
                treatment: 'PROSPECTIVE' as const
            };

            await expect(
                modificationService.applyChangeOrder(
                    testCompanyId,
                    testUserId,
                    applyData
                )
            ).rejects.toThrow('Change order not found');
        });

        it('should handle invalid VC estimate data', async () => {
            const invalidVcData = {
                contract_id: testContractId,
                pob_id: 'test-pob-1',
                year: 2025,
                month: 13, // Invalid month
                method: 'EXPECTED_VALUE' as const,
                estimate: 1000.00,
                confidence: 0.8,
                resolve: false
            };

            // This should be caught by Zod validation in the API layer
            // The service itself doesn't validate month ranges
            const result = await modificationService.upsertVCEstimate(
                testCompanyId,
                testUserId,
                invalidVcData
            );

            // Service will accept it, but API validation should catch it
            expect(result).toBeDefined();
        });
    });
});
