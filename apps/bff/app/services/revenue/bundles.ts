import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc, isNull } from "drizzle-orm";
import {
    revBundle,
    revBundleComponent,
    rbProduct
} from "@aibos/db-adapter/schema";
import type {
    BundleUpsertType,
    BundleQueryType,
    BundleResponseType
} from "@aibos/contracts";

export class RevBundleService {
    constructor(private dbInstance = db) { }

    /**
     * Upsert bundle definition with components
     */
    async upsertBundle(
        companyId: string,
        userId: string,
        data: BundleUpsertType
    ): Promise<BundleResponseType> {
        const bundleId = ulid();

        // Check for existing active bundle
        const existing = await this.dbInstance
            .select()
            .from(revBundle)
            .where(
                and(
                    eq(revBundle.companyId, companyId),
                    eq(revBundle.bundleSku, data.bundle_sku),
                    eq(revBundle.status, "ACTIVE"),
                    isNull(revBundle.effectiveTo)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            // End-date the existing bundle
            await this.dbInstance
                .update(revBundle)
                .set({
                    effectiveTo: data.effective_from,
                    updatedAt: new Date(),
                    updatedBy: userId
                })
                .where(eq(revBundle.id, existing[0]!.id));
        }

        // Create new bundle
        const [bundle] = await this.dbInstance
            .insert(revBundle)
            .values({
                id: bundleId,
                companyId,
                bundleSku: data.bundle_sku,
                name: data.name,
                effectiveFrom: data.effective_from,
                effectiveTo: data.effective_to || null,
                status: "ACTIVE",
                createdBy: userId,
                updatedBy: userId
            })
            .returning();

        // Create bundle components
        const components = await Promise.all(
            data.components.map(async (component) => {
                const componentId = ulid();
                const compResult = await this.dbInstance
                    .insert(revBundleComponent)
                    .values({
                        id: componentId,
                        bundleId: bundleId,
                        productId: component.product_id,
                        weightPct: component.weight_pct.toString(),
                        required: component.required,
                        minQty: component.min_qty?.toString() || "1",
                        maxQty: component.max_qty?.toString() || null,
                        createdBy: userId
                    })
                    .returning();

                const comp = compResult[0];
                if (!comp) {
                    throw new Error("Failed to create bundle component");
                }

                return {
                    id: comp.id,
                    product_id: comp.productId,
                    weight_pct: parseFloat(comp.weightPct),
                    required: comp.required,
                    min_qty: comp.minQty ? parseFloat(comp.minQty) : undefined,
                    max_qty: comp.maxQty ? parseFloat(comp.maxQty) : undefined
                };
            })
        );

        return this.mapBundleToResponse(bundle, components);
    }

    /**
     * Query bundles
     */
    async queryBundles(
        companyId: string,
        query: BundleQueryType
    ): Promise<BundleResponseType[]> {
        const conditions = [eq(revBundle.companyId, companyId)];

        if (query.bundle_sku) {
            conditions.push(eq(revBundle.bundleSku, query.bundle_sku));
        }
        if (query.status) {
            conditions.push(eq(revBundle.status, query.status));
        }
        if (query.effective_from) {
            conditions.push(gte(revBundle.effectiveFrom, query.effective_from));
        }
        if (query.effective_to) {
            conditions.push(lte(revBundle.effectiveTo || revBundle.effectiveFrom, query.effective_to));
        }

        const bundles = await this.dbInstance
            .select()
            .from(revBundle)
            .where(and(...conditions))
            .orderBy(desc(revBundle.effectiveFrom), desc(revBundle.createdAt))
            .limit(query.limit)
            .offset(query.offset);

        // Get components for each bundle
        const bundlesWithComponents = await Promise.all(
            bundles.map(async (bundle) => {
                const components = await this.dbInstance
                    .select()
                    .from(revBundleComponent)
                    .where(eq(revBundleComponent.bundleId, bundle.id));

                const mappedComponents = components.map(comp => ({
                    id: comp.id,
                    product_id: comp.productId,
                    weight_pct: parseFloat(comp.weightPct),
                    required: comp.required,
                    min_qty: comp.minQty ? parseFloat(comp.minQty) : undefined,
                    max_qty: comp.maxQty ? parseFloat(comp.maxQty) : undefined
                }));

                return this.mapBundleToResponse(bundle, mappedComponents);
            })
        );

        return bundlesWithComponents;
    }

    /**
     * Get bundle by ID
     */
    async getBundle(
        companyId: string,
        bundleId: string
    ): Promise<BundleResponseType | null> {
        const [bundle] = await this.dbInstance
            .select()
            .from(revBundle)
            .where(
                and(
                    eq(revBundle.id, bundleId),
                    eq(revBundle.companyId, companyId)
                )
            )
            .limit(1);

        if (!bundle) {
            return null;
        }

        const components = await this.dbInstance
            .select()
            .from(revBundleComponent)
            .where(eq(revBundleComponent.bundleId, bundleId));

        const mappedComponents = components.map(comp => ({
            id: comp.id,
            product_id: comp.productId,
            weight_pct: parseFloat(comp.weightPct),
            required: comp.required,
            min_qty: comp.minQty ? parseFloat(comp.minQty) : undefined,
            max_qty: comp.maxQty ? parseFloat(comp.maxQty) : undefined
        }));

        return this.mapBundleToResponse(bundle, mappedComponents);
    }

    /**
     * Get effective bundle as of date
     */
    async getEffectiveBundle(
        companyId: string,
        bundleSku: string,
        asOfDate: string
    ): Promise<BundleResponseType | null> {
        const [bundle] = await this.dbInstance
            .select()
            .from(revBundle)
            .where(
                and(
                    eq(revBundle.companyId, companyId),
                    eq(revBundle.bundleSku, bundleSku),
                    eq(revBundle.status, "ACTIVE"),
                    lte(revBundle.effectiveFrom, asOfDate),
                    sql`(${revBundle.effectiveTo} IS NULL OR ${revBundle.effectiveTo} > ${asOfDate})`
                )
            )
            .orderBy(desc(revBundle.effectiveFrom))
            .limit(1);

        if (!bundle) {
            return null;
        }

        const components = await this.dbInstance
            .select()
            .from(revBundleComponent)
            .where(eq(revBundleComponent.bundleId, bundle.id));

        const mappedComponents = components.map(comp => ({
            id: comp.id,
            product_id: comp.productId,
            weight_pct: parseFloat(comp.weightPct),
            required: comp.required,
            min_qty: comp.minQty ? parseFloat(comp.minQty) : undefined,
            max_qty: comp.maxQty ? parseFloat(comp.maxQty) : undefined
        }));

        return this.mapBundleToResponse(bundle, mappedComponents);
    }

    /**
     * Update bundle status
     */
    async updateBundleStatus(
        companyId: string,
        bundleId: string,
        userId: string,
        status: "ACTIVE" | "INACTIVE" | "ARCHIVED"
    ): Promise<BundleResponseType> {
        const [bundle] = await this.dbInstance
            .update(revBundle)
            .set({
                status,
                updatedAt: new Date(),
                updatedBy: userId
            })
            .where(
                and(
                    eq(revBundle.id, bundleId),
                    eq(revBundle.companyId, companyId)
                )
            )
            .returning();

        if (!bundle) {
            throw new Error("Bundle not found");
        }

        const components = await this.dbInstance
            .select()
            .from(revBundleComponent)
            .where(eq(revBundleComponent.bundleId, bundleId));

        const mappedComponents = components.map(comp => ({
            id: comp.id,
            product_id: comp.productId,
            weight_pct: parseFloat(comp.weightPct),
            required: comp.required,
            min_qty: comp.minQty ? parseFloat(comp.minQty) : undefined,
            max_qty: comp.maxQty ? parseFloat(comp.maxQty) : undefined
        }));

        return this.mapBundleToResponse(bundle, mappedComponents);
    }

    /**
     * Validate bundle component weights sum to 1.0
     */
    async validateBundleWeights(components: Array<{ weight_pct: number }>): Promise<boolean> {
        const totalWeight = components.reduce((sum, comp) => sum + comp.weight_pct, 0);
        return Math.abs(totalWeight - 1.0) < 0.0001; // Allow for floating point precision
    }

    /**
     * Get bundle components by product ID
     */
    async getBundlesByProduct(
        companyId: string,
        productId: string
    ): Promise<BundleResponseType[]> {
        const bundles = await this.dbInstance
            .select({
                bundle: revBundle,
                component: revBundleComponent
            })
            .from(revBundle)
            .innerJoin(revBundleComponent, eq(revBundle.id, revBundleComponent.bundleId))
            .where(
                and(
                    eq(revBundle.companyId, companyId),
                    eq(revBundleComponent.productId, productId),
                    eq(revBundle.status, "ACTIVE")
                )
            );

        // Group by bundle and get all components
        const bundleMap = new Map<string, any>();
        bundles.forEach(({ bundle, component }) => {
            if (!bundleMap.has(bundle.id)) {
                bundleMap.set(bundle.id, {
                    bundle,
                    components: []
                });
            }
            bundleMap.get(bundle.id).components.push(component);
        });

        const result = Array.from(bundleMap.values()).map(({ bundle, components }) => {
            const mappedComponents = components.map((comp: any) => ({
                id: comp.id,
                product_id: comp.productId,
                weight_pct: parseFloat(comp.weightPct),
                required: comp.required,
                min_qty: comp.minQty ? parseFloat(comp.minQty) : undefined,
                max_qty: comp.maxQty ? parseFloat(comp.maxQty) : undefined
            }));

            return this.mapBundleToResponse(bundle, mappedComponents);
        });

        return result;
    }

    // Helper method for mapping database records to response types
    private mapBundleToResponse(bundle: any, components: any[]): BundleResponseType {
        return {
            id: bundle.id,
            company_id: bundle.companyId,
            bundle_sku: bundle.bundleSku,
            name: bundle.name,
            effective_from: bundle.effectiveFrom,
            effective_to: bundle.effectiveTo,
            status: bundle.status,
            created_at: bundle.createdAt.toISOString(),
            created_by: bundle.createdBy,
            updated_at: bundle.updatedAt.toISOString(),
            updated_by: bundle.updatedBy,
            components
        };
    }
}
