import { describe, it, expect, beforeEach, vi } from "vitest";
import { RevSspAdminService } from "@/services/revenue/ssp-admin";
import { RevBundleService } from "@/services/revenue/bundles";
import { RevDiscountService } from "@/services/revenue/discounts";
import { RevAllocationEngineService } from "@/services/revenue/allocation-engine";
import { RevAlertsService } from "@/services/revenue/alerts";

// Mock database
const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis()
};

describe("M25.3: SSP Catalog, Bundles & Discounts Allocation", () => {
    let sspAdminService: RevSspAdminService;
    let bundleService: RevBundleService;
    let discountService: RevDiscountService;
    let allocationEngineService: RevAllocationEngineService;
    let alertsService: RevAlertsService;

    beforeEach(() => {
        vi.clearAllMocks();
        sspAdminService = new RevSspAdminService(mockDb as any);
        bundleService = new RevBundleService(mockDb as any);
        discountService = new RevDiscountService(mockDb as any);
        allocationEngineService = new RevAllocationEngineService(mockDb as any);
        alertsService = new RevAlertsService(mockDb as any);
    });

    describe("SSP Admin Service", () => {
        it("should upsert SSP catalog entry with effective dating", async () => {
            const mockCatalog = {
                id: "catalog-1",
                companyId: "company-1",
                productId: "product-1",
                currency: "USD",
                ssp: "100.00",
                method: "OBSERVABLE",
                effectiveFrom: "2025-01-01",
                effectiveTo: null,
                status: "DRAFT",
                createdAt: new Date(),
                createdBy: "user-1",
                updatedAt: new Date(),
                updatedBy: "user-1"
            };

            mockDb.select.mockResolvedValue([]); // No existing entry
            mockDb.insert.mockResolvedValue([mockCatalog]);

            const result = await sspAdminService.upsertSspCatalog(
                "company-1",
                "user-1",
                {
                    product_id: "product-1",
                    currency: "USD",
                    ssp: 100,
                    method: "OBSERVABLE",
                    effective_from: "2025-01-01"
                }
            );

            expect(result.id).toBe("catalog-1");
            expect(result.ssp).toBe(100);
            expect(result.method).toBe("OBSERVABLE");
        });

        it("should get effective SSP for product/currency as of date", async () => {
            const mockCatalog = {
                id: "catalog-1",
                companyId: "company-1",
                productId: "product-1",
                currency: "USD",
                ssp: "100.00",
                method: "OBSERVABLE",
                effectiveFrom: "2025-01-01",
                effectiveTo: null,
                status: "APPROVED",
                createdAt: new Date(),
                createdBy: "user-1",
                updatedAt: new Date(),
                updatedBy: "user-1"
            };

            mockDb.select.mockResolvedValue([mockCatalog]);

            const result = await sspAdminService.getEffectiveSsp(
                "company-1",
                "product-1",
                "USD",
                "2025-01-15"
            );

            expect(result).toBeTruthy();
            expect(result?.ssp).toBe(100);
        });

        it("should check corridor compliance", async () => {
            const mockPolicy = {
                companyId: "company-1",
                corridorTolerancePct: "0.20",
                alertThresholdPct: "0.15"
            };

            mockDb.select.mockResolvedValue([mockPolicy]);
            mockDb.select.mockResolvedValueOnce([mockPolicy]); // Policy query
            mockDb.select.mockResolvedValueOnce([{ medianSsp: 100 }]); // Median query

            const result = await sspAdminService.checkCorridorCompliance(
                "company-1",
                "product-1",
                "USD",
                120 // 20% above median
            );

            expect(result.compliant).toBe(true); // Within 20% tolerance
            expect(result.medianSsp).toBe(100);
            expect(result.variance).toBe(0.20);
        });
    });

    describe("Bundle Service", () => {
        it("should upsert bundle with components", async () => {
            const mockBundle = {
                id: "bundle-1",
                companyId: "company-1",
                bundleSku: "BUNDLE-A",
                name: "Premium Bundle",
                effectiveFrom: "2025-01-01",
                effectiveTo: null,
                status: "ACTIVE",
                createdAt: new Date(),
                createdBy: "user-1",
                updatedAt: new Date(),
                updatedBy: "user-1"
            };

            const mockComponent = {
                id: "component-1",
                bundleId: "bundle-1",
                productId: "product-1",
                weightPct: "0.60",
                required: true,
                minQty: "1",
                maxQty: null,
                createdAt: new Date(),
                createdBy: "user-1"
            };

            mockDb.select.mockResolvedValue([]); // No existing bundle
            mockDb.insert.mockResolvedValueOnce([mockBundle]);
            mockDb.insert.mockResolvedValueOnce([mockComponent]);

            const result = await bundleService.upsertBundle(
                "company-1",
                "user-1",
                {
                    bundle_sku: "BUNDLE-A",
                    name: "Premium Bundle",
                    components: [
                        {
                            product_id: "product-1",
                            min_qty: 1,
                            weight_pct: 0.6,
                            required: true
                        }
                    ],
                    effective_from: "2025-01-01"
                }
            );

            expect(result.id).toBe("bundle-1");
            expect(result.bundle_sku).toBe("BUNDLE-A");
            expect(result.components).toHaveLength(1);
            expect(result.components[0]?.weight_pct).toBe(0.6);
        });

        it("should validate bundle component weights sum to 1.0", async () => {
            const isValid = await bundleService.validateBundleWeights([
                { weight_pct: 0.6 },
                { weight_pct: 0.4 }
            ]);

            expect(isValid).toBe(true);

            const isInvalid = await bundleService.validateBundleWeights([
                { weight_pct: 0.6 },
                { weight_pct: 0.5 }
            ]);

            expect(isInvalid).toBe(false);
        });
    });

    describe("Discount Service", () => {
        it("should upsert discount rule", async () => {
            const mockRule = {
                id: "rule-1",
                companyId: "company-1",
                kind: "PROP",
                code: "FALL-10",
                name: "Fall 10% Discount",
                params: { pct: 0.10 },
                active: true,
                effectiveFrom: "2025-01-01",
                effectiveTo: null,
                priority: 0,
                maxUsageCount: null,
                maxUsageAmount: null,
                createdAt: new Date(),
                createdBy: "user-1",
                updatedAt: new Date(),
                updatedBy: "user-1"
            };

            mockDb.select.mockResolvedValue([]); // No existing rule
            mockDb.insert.mockResolvedValue([mockRule]);

            const result = await discountService.upsertDiscountRule(
                "company-1",
                "user-1",
                {
                    kind: "PROP",
                    code: "FALL-10",
                    name: "Fall 10% Discount",
                    params: { pct: 0.10 },
                    effective_from: "2025-01-01",
                    priority: 1,
                    active: true
                }
            );

            expect(result.id).toBe("rule-1");
            expect(result.kind).toBe("PROP");
            expect(result.code).toBe("FALL-10");
        });

        it("should calculate discount amount correctly", () => {
            const rule = {
                id: "rule-1",
                company_id: "company-1",
                kind: "PROP",
                code: "FALL-10",
                params: { pct: 0.10 },
                active: true,
                effective_from: "2025-01-01",
                effective_to: undefined,
                priority: 0,
                created_at: "2025-01-01T00:00:00Z",
                created_by: "user-1",
                updated_at: "2025-01-01T00:00:00Z",
                updated_by: "user-1"
            };

            const invoiceLines = [
                { product_id: "product-1", amount: 6000, qty: 1 },
                { product_id: "product-2", amount: 4000, qty: 1 }
            ];

            const totalInvoiceAmount = 10000;

            const discountAmount = discountService.calculateDiscountAmount(
                rule,
                invoiceLines,
                totalInvoiceAmount
            );

            expect(discountAmount).toBe(1000); // 10% of 10000
        });

        it("should validate discount rule parameters", () => {
            expect(discountService.validateDiscountRuleParams("PROP", { pct: 0.10 })).toBe(true);
            expect(discountService.validateDiscountRuleParams("PROP", { pct: 1.5 })).toBe(false);
            expect(discountService.validateDiscountRuleParams("TIERED", { threshold: 1000, pct: 0.10 })).toBe(true);
            expect(discountService.validateDiscountRuleParams("TIERED", { threshold: -100, pct: 0.10 })).toBe(false);
        });
    });

    describe("Allocation Engine Service", () => {
        it("should determine allocation strategy correctly", async () => {
            // Mock SSP admin service methods
            vi.spyOn(sspAdminService, 'getSspPolicy').mockResolvedValue({
                company_id: "company-1",
                rounding: "HALF_UP",
                residual_allowed: true,
                residual_eligible_products: ["product-2"],
                default_method: "OBSERVABLE",
                corridor_tolerance_pct: 0.20,
                alert_threshold_pct: 0.15,
                created_at: "2025-01-01T00:00:00Z",
                created_by: "user-1",
                updated_at: "2025-01-01T00:00:00Z",
                updated_by: "user-1"
            });

            vi.spyOn(sspAdminService, 'getEffectiveSsp').mockResolvedValue({
                id: "catalog-1",
                company_id: "company-1",
                product_id: "product-1",
                currency: "USD",
                ssp: 100,
                method: "OBSERVABLE",
                effective_from: "2025-01-01",
                effective_to: undefined,
                status: "APPROVED",
                created_at: "2025-01-01T00:00:00Z",
                created_by: "user-1",
                updated_at: "2025-01-01T00:00:00Z",
                updated_by: "user-1"
            });

            const invoiceData = {
                id: "invoice-1",
                contract_id: "contract-1",
                subscription_id: "sub-1",
                customer_id: "customer-1",
                invoice_date: "2025-01-01",
                currency: "USD",
                total_amount: 10000,
                lines: [
                    {
                        id: "line-1",
                        product_id: "product-1",
                        product_name: "Product A",
                        amount: 6000,
                        qty: 1,
                        uom: "EA",
                        end_date: "2025-12-31"
                    }
                ]
            };

            // Test AUTO strategy with approved SSP
            const strategy1 = await allocationEngineService['determineAllocationStrategy'](
                "company-1",
                invoiceData,
                "AUTO"
            );

            expect(strategy1).toBe("RELATIVE_SSP");

            // Test AUTO strategy without approved SSP but residual allowed
            vi.spyOn(sspAdminService, 'getEffectiveSsp').mockResolvedValue(null);

            const strategy2 = await allocationEngineService['determineAllocationStrategy'](
                "company-1",
                invoiceData,
                "AUTO"
            );

            expect(strategy2).toBe("RESIDUAL");
        });

        it("should apply discount rules correctly", async () => {
            const mockRules = [
                {
                    id: "rule-1",
                    company_id: "company-1",
                    kind: "PROP",
                    code: "FALL-10",
                    params: { pct: 0.10 },
                    active: true,
                    effective_from: "2025-01-01",
                    effective_to: undefined,
                    priority: 0,
                    created_at: "2025-01-01T00:00:00Z",
                    created_by: "user-1",
                    updated_at: "2025-01-01T00:00:00Z",
                    updated_by: "user-1"
                }
            ];

            vi.spyOn(discountService, 'getActiveDiscountRules').mockResolvedValue(mockRules);
            vi.spyOn(discountService, 'applyDiscountRule').mockResolvedValue();

            const invoiceData = {
                id: "invoice-1",
                contract_id: "contract-1",
                subscription_id: "sub-1",
                customer_id: "customer-1",
                invoice_date: "2025-01-01",
                currency: "USD",
                total_amount: 10000,
                lines: [
                    {
                        id: "line-1",
                        product_id: "product-1",
                        product_name: "Product A",
                        amount: 6000,
                        qty: 1,
                        uom: "EA",
                        end_date: "2025-12-31"
                    }
                ]
            };

            const totalDiscount = await allocationEngineService['applyDiscountRules'](
                "company-1",
                "invoice-1",
                "user-1",
                mockRules,
                invoiceData
            );

            expect(totalDiscount).toBe(1000); // 10% of 10000
            expect(discountService.applyDiscountRule).toHaveBeenCalledWith(
                "company-1",
                "invoice-1",
                "rule-1",
                "user-1",
                1000,
                expect.any(Object)
            );
        });
    });

    describe("Alerts Service", () => {
        it("should check corridor breaches", async () => {
            const mockPolicy = {
                companyId: "company-1",
                alertThresholdPct: "0.15"
            };

            const mockSspEntries = [
                {
                    id: "catalog-1",
                    companyId: "company-1",
                    productId: "product-1",
                    currency: "USD",
                    ssp: "100.00",
                    method: "OBSERVABLE",
                    effectiveFrom: "2025-01-01",
                    effectiveTo: null,
                    status: "APPROVED",
                    createdAt: new Date(),
                    createdBy: "user-1",
                    updatedAt: new Date(),
                    updatedBy: "user-1"
                },
                {
                    id: "catalog-2",
                    companyId: "company-1",
                    productId: "product-2",
                    currency: "USD",
                    ssp: "150.00", // 50% above median (125)
                    method: "OBSERVABLE",
                    effectiveFrom: "2025-01-01",
                    effectiveTo: null,
                    status: "APPROVED",
                    createdAt: new Date(),
                    createdBy: "user-1",
                    updatedAt: new Date(),
                    updatedBy: "user-1"
                }
            ];

            mockDb.select.mockResolvedValueOnce([mockPolicy]);
            mockDb.select.mockResolvedValueOnce(mockSspEntries);

            const result = await alertsService.checkCorridorBreaches("company-1");

            expect(result.breaches).toHaveLength(1);
            expect(result.breaches[0]?.product_id).toBe("product-2");
            expect(result.breaches[0]?.variance_pct).toBeCloseTo(0.20, 2); // 20% variance
        });

        it("should generate SSP state snapshot", async () => {
            const mockSspEntries = [
                {
                    id: "catalog-1",
                    companyId: "company-1",
                    productId: "product-1",
                    currency: "USD",
                    ssp: "100.00",
                    method: "OBSERVABLE",
                    effectiveFrom: "2025-01-01",
                    effectiveTo: null,
                    status: "APPROVED",
                    createdAt: new Date(),
                    createdBy: "user-1",
                    updatedAt: new Date(),
                    updatedBy: "user-1"
                },
                {
                    id: "catalog-2",
                    companyId: "company-1",
                    productId: "product-2",
                    currency: "EUR",
                    ssp: "90.00",
                    method: "BENCHMARK",
                    effectiveFrom: "2025-01-01",
                    effectiveTo: null,
                    status: "APPROVED",
                    createdAt: new Date(),
                    createdBy: "user-1",
                    updatedAt: new Date(),
                    updatedBy: "user-1"
                }
            ];

            mockDb.select.mockResolvedValue(mockSspEntries);

            const result = await alertsService.generateSspStateSnapshot("company-1");

            expect(result.total_entries).toBe(2);
            expect(result.currencies).toEqual(["USD", "EUR"]);
            expect(result.methods).toEqual({
                "OBSERVABLE": 1,
                "BENCHMARK": 1
            });
        });

        it("should check SSP policy compliance", async () => {
            const mockPolicy = {
                companyId: "company-1",
                corridorTolerancePct: "0.20",
                alertThresholdPct: "0.15"
            };

            const mockProductsWithoutSsp = [
                { productId: "product-3" },
                { productId: "product-4" }
            ];

            const mockDraftEntries = [
                {
                    id: "catalog-3",
                    companyId: "company-1",
                    productId: "product-5",
                    currency: "USD",
                    ssp: "100.00",
                    method: "OBSERVABLE",
                    effectiveFrom: "2025-01-01",
                    effectiveTo: null,
                    status: "DRAFT",
                    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
                    createdBy: "user-1",
                    updatedAt: new Date(),
                    updatedBy: "user-1"
                }
            ];

            mockDb.select.mockResolvedValueOnce([mockPolicy]);
            mockDb.select.mockResolvedValueOnce(mockProductsWithoutSsp);
            mockDb.select.mockResolvedValueOnce(mockDraftEntries);

            const result = await alertsService.checkSspPolicyCompliance("company-1");

            expect(result.issues).toHaveLength(2);
            expect(result.issues[0]?.type).toBe("MISSING_SSP");
            expect(result.issues[0]?.severity).toBe("MEDIUM");
            expect(result.issues[1]?.type).toBe("STALE_DRAFTS");
            expect(result.issues[1]?.severity).toBe("LOW");
        });
    });

    describe("Performance Tests", () => {
        it("should handle large invoice allocation efficiently", async () => {
            const startTime = Date.now();

            // Mock large invoice data
            const invoiceData = {
                id: "invoice-large",
                contract_id: "contract-1",
                subscription_id: "sub-1",
                customer_id: "customer-1",
                invoice_date: "2025-01-01",
                currency: "USD",
                total_amount: 100000,
                lines: Array.from({ length: 1000 }, (_, i) => ({
                    id: `line-${i}`,
                    product_id: `product-${i % 10}`, // 10 different products
                    product_name: `Product ${i % 10}`,
                    amount: 100,
                    qty: 1,
                    uom: "EA",
                    end_date: "2025-12-31"
                }))
            };

            // Mock services to return quickly
            vi.spyOn(sspAdminService, 'getSspPolicy').mockResolvedValue({
                company_id: "company-1",
                rounding: "HALF_UP",
                residual_allowed: true,
                residual_eligible_products: [],
                default_method: "OBSERVABLE",
                corridor_tolerance_pct: 0.20,
                alert_threshold_pct: 0.15,
                created_at: "2025-01-01T00:00:00Z",
                created_by: "user-1",
                updated_at: "2025-01-01T00:00:00Z",
                updated_by: "user-1"
            });

            vi.spyOn(sspAdminService, 'getEffectiveSsp').mockResolvedValue({
                id: "catalog-1",
                company_id: "company-1",
                product_id: "product-1",
                currency: "USD",
                ssp: 100,
                method: "OBSERVABLE",
                effective_from: "2025-01-01",
                effective_to: undefined,
                status: "APPROVED",
                created_at: "2025-01-01T00:00:00Z",
                created_by: "user-1",
                updated_at: "2025-01-01T00:00:00Z",
                updated_by: "user-1"
            });

            vi.spyOn(discountService, 'getActiveDiscountRules').mockResolvedValue([]);

            const processingTime = Date.now() - startTime;

            // Should complete within 2 seconds for 1000 lines
            expect(processingTime).toBeLessThan(2000);
        });
    });
});
