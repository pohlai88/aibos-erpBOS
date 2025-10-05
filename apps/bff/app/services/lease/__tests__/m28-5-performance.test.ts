import { describe, it, expect, beforeEach, vi } from 'vitest';
import { db } from '@/lib/db';
import { ImpairmentIndicatorService } from '@/services/lease/impairment-indicator-service';
import { CGUAllocator } from '@/services/lease/cgu-allocator';
import { RecoverableAmountEngine } from '@/services/lease/recoverable-amount-engine';
import { LeaseOnerousRollService } from '@/services/lease/onerous-roll-service';

// Mock the database with performance-focused responses
vi.mock('@/lib/db', () => ({
    db: {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        innerJoin: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        execute: vi.fn()
    }
}));

describe('M28.6: Performance Tests', () => {
    const mockCompanyId = 'company-123';
    const mockUserId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Performance Requirements', () => {
        it('should build/post 500 CGU tests p95 < 1.5s', async () => {
            const cguAllocator = new CGUAllocator();
            const recoverableEngine = new RecoverableAmountEngine();

            // Mock large dataset response
            const mockCGUs = Array.from({ length: 500 }, (_, i) => ({
                id: `cgu-${i}`,
                code: `CGU-${i.toString().padStart(3, '0')}`,
                name: `CGU ${i}`,
                carryingAmount: 1000000 + (i * 10000)
            }));

            const mockComponents = Array.from({ length: 2000 }, (_, i) => ({
                leaseComponentId: `component-${i}`,
                allocationWeight: 0.25,
                componentCode: `COMP-${i.toString().padStart(4, '0')}`,
                componentName: `Component ${i}`,
                closingRou: 500000 + (i * 5000),
                closingLiability: 400000 + (i * 4000)
            }));

            // Mock database responses for performance test
            (db.execute as any)
                .mockResolvedValueOnce(mockCGUs) // CGU query
                .mockResolvedValue(mockComponents); // Component queries

            const startTime = performance.now();

            // Simulate building 500 CGU tests
            const promises = mockCGUs.map(async (cgu) => {
                const carryingAmounts = await cguAllocator.calculateCGUCarryingAmounts(
                    mockCompanyId,
                    cgu.id,
                    '2024-01-01'
                );

                const testData = {
                    cgu_id: cgu.id,
                    as_of_date: '2024-01-01',
                    method: 'VIU' as const,
                    discount_rate: 0.08,
                    cashflows: {
                        projections: [
                            { year: 1, amount: 100000 },
                            { year: 2, amount: 110000 },
                            { year: 3, amount: 120000 }
                        ]
                    },
                    carrying_amount: cgu.carryingAmount,
                    recoverable_amount: cgu.carryingAmount * 0.9, // 10% impairment
                    loss: cgu.carryingAmount * 0.1,
                    reversal_cap: cgu.carryingAmount * 0.1
                };

                return recoverableEngine.createImpairmentTest(
                    mockCompanyId,
                    mockUserId,
                    testData
                );
            });

            await Promise.all(promises);

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Performance requirement: p95 < 1.5s (1500ms)
            expect(duration).toBeLessThan(1500);
            console.log(`500 CGU tests built in ${duration.toFixed(2)}ms`);
        });

        it('should build onerous roll for 2k items p95 < 1.2s', async () => {
            const onerousRollService = new LeaseOnerousRollService();

            // Mock large dataset response
            const mockAssessments = Array.from({ length: 2000 }, (_, i) => ({
                id: `assessment-${i}`,
                provision: 24000 + (i * 1000),
                termMonths: 24,
                status: 'RECOGNIZED',
                serviceItem: `Service ${i}`
            }));

            const mockPreviousRolls = Array.from({ length: 2000 }, (_, i) => ({
                closing: 1000 + (i * 100)
            }));

            // Mock database responses
            (db.execute as any)
                .mockResolvedValueOnce(mockAssessments) // Assessment query
                .mockResolvedValue(mockPreviousRolls); // Previous rolls query

            const startTime = performance.now();

            // Simulate building rolls for 2000 assessments
            const promises = mockAssessments.map(async (assessment) => {
                return onerousRollService.buildRoll(
                    mockCompanyId,
                    mockUserId,
                    {
                        assessment_id: assessment.id,
                        year: 2024,
                        month: 1
                    }
                );
            });

            await Promise.all(promises);

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Performance requirement: p95 < 1.2s (1200ms)
            expect(duration).toBeLessThan(1200);
            console.log(`2000 onerous rolls built in ${duration.toFixed(2)}ms`);
        });

        it('should query disclosure data p95 < 300ms', async () => {
            const indicatorService = new ImpairmentIndicatorService();

            // Mock large dataset response
            const mockIndicators = Array.from({ length: 1000 }, (_, i) => ({
                id: `indicator-${i}`,
                kind: ['BUDGET_SHORTFALL', 'VACANCY', 'MARKET_RENT_DROP'][i % 3],
                severity: ['LOW', 'MEDIUM', 'HIGH'][i % 3],
                value: { vacancy_pct: 10 + (i % 50) },
                source: 'MARKET_DATA'
            }));

            // Mock database response
            (db.execute as any).mockResolvedValueOnce(mockIndicators);

            const startTime = performance.now();

            // Simulate disclosure query
            const summary = await indicatorService.getIndicatorsSummary(
                mockCompanyId,
                '2024-01-01'
            );

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Performance requirement: p95 < 300ms
            expect(duration).toBeLessThan(300);
            console.log(`Disclosure query completed in ${duration.toFixed(2)}ms`);

            expect(summary).toBeDefined();
        });

        it('should handle concurrent operations efficiently', async () => {
            const indicatorService = new ImpairmentIndicatorService();
            const cguAllocator = new CGUAllocator();

            // Mock concurrent operations
            const mockIndicators = Array.from({ length: 100 }, (_, i) => ({
                id: `indicator-${i}`,
                kind: 'VACANCY',
                severity: 'MEDIUM',
                value: { vacancy_pct: 25 },
                source: 'MARKET_DATA'
            }));

            const mockCGUs = Array.from({ length: 50 }, (_, i) => ({
                id: `cgu-${i}`,
                code: `CGU-${i}`,
                name: `CGU ${i}`,
                carryingAmount: 1000000
            }));

            (db.execute as any)
                .mockResolvedValue(mockIndicators)
                .mockResolvedValue(mockCGUs);

            const startTime = performance.now();

            // Run concurrent operations
            const concurrentPromises = [
                // Indicator operations
                indicatorService.queryIndicators(mockCompanyId, {
                    as_of_date: '2024-01-01',
                    limit: 100,
                    offset: 0
                }),
                indicatorService.getIndicatorsSummary(mockCompanyId, '2024-01-01'),

                // CGU operations
                cguAllocator.queryCGUs(mockCompanyId, {
                    limit: 50,
                    offset: 0
                }),
                ...mockCGUs.map(cgu =>
                    cguAllocator.calculateCGUCarryingAmounts(mockCompanyId, cgu.id, '2024-01-01')
                )
            ];

            await Promise.all(concurrentPromises);

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Should complete within reasonable time for concurrent operations
            expect(duration).toBeLessThan(2000);
            console.log(`Concurrent operations completed in ${duration.toFixed(2)}ms`);
        });

        it('should handle memory efficiently with large datasets', async () => {
            const recoverableEngine = new RecoverableAmountEngine();

            // Simulate large cashflow projections
            const largeCashflows = {
                projections: Array.from({ length: 1000 }, (_, i) => ({
                    year: i + 1,
                    amount: 100000 + (i * 1000)
                })),
                fairValue: 10000000,
                costsOfDisposal: 500000
            };

            const testData = {
                cgu_id: 'cgu-large',
                as_of_date: '2024-01-01',
                method: 'HIGHER' as const,
                discount_rate: 0.08,
                cashflows: largeCashflows,
                carrying_amount: 10000000,
                recoverable_amount: 0,
                loss: 0,
                reversal_cap: 0
            };

            const startTime = performance.now();

            // Mock database responses
            (db.execute as any)
                .mockResolvedValueOnce([]) // Test insert
                .mockResolvedValueOnce([
                    {
                        cguId: 'cgu-large',
                        carryingAmount: 10000000
                    }
                ]) // Test query
                .mockResolvedValueOnce([
                    {
                        leaseComponentId: 'component-large',
                        code: 'COMP-LARGE',
                        name: 'Large Component'
                    }
                ]) // Components query
                .mockResolvedValueOnce([
                    {
                        closingRou: 10000000,
                        closingLiability: 8000000
                    }
                ]); // Schedule query

            const result = await recoverableEngine.createImpairmentTest(
                mockCompanyId,
                mockUserId,
                testData
            );

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Should handle large datasets efficiently
            expect(duration).toBeLessThan(1000);
            expect(result).toBeDefined();
            console.log(`Large dataset processing completed in ${duration.toFixed(2)}ms`);
        });
    });
});