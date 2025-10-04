import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, like } from "drizzle-orm";
import {
    rbProduct,
    rbPriceBook,
    rbPrice
} from "@aibos/db-adapter/schema";
import type {
    ProductUpsertType,
    PriceBookUpsertType,
    PriceUpsertType,
    ProductQueryType,
    ProductResponseType,
    PriceBookResponseType,
    PriceResponseType
} from "@aibos/contracts";

export class RbCatalogService {
    constructor(private dbInstance = db) { }

    /**
     * Create or update a product
     */
    async upsertProduct(
        companyId: string,
        userId: string,
        data: ProductUpsertType
    ): Promise<ProductResponseType> {
        const productId = ulid();

        const product = await this.dbInstance
            .insert(rbProduct)
            .values({
                id: productId,
                companyId,
                sku: data.sku,
                name: data.name,
                kind: data.kind,
                glRevAcct: data.gl_rev_acct || null,
                status: data.status,
                updatedBy: userId
            })
            .onConflictDoUpdate({
                target: [rbProduct.companyId, rbProduct.sku],
                set: {
                    name: data.name,
                    kind: data.kind,
                    glRevAcct: data.gl_rev_acct || null,
                    status: data.status,
                    updatedBy: userId,
                    updatedAt: sql`now()`
                }
            })
            .returning();

        const p = product[0]!;
        return {
            id: p.id,
            company_id: p.companyId,
            sku: p.sku,
            name: p.name,
            kind: p.kind as "ONE_TIME" | "RECURRING" | "USAGE",
            gl_rev_acct: p.glRevAcct || undefined,
            status: p.status as "ACTIVE" | "INACTIVE",
            updated_at: p.updatedAt.toISOString(),
            updated_by: p.updatedBy
        };
    }

    /**
     * Get products with optional filtering
     */
    async getProducts(
        companyId: string,
        query: ProductQueryType
    ): Promise<ProductResponseType[]> {
        const conditions = [eq(rbProduct.companyId, companyId)];

        if (query.sku) {
            conditions.push(like(rbProduct.sku, `%${query.sku}%`));
        }
        if (query.kind) {
            conditions.push(eq(rbProduct.kind, query.kind));
        }
        if (query.status) {
            conditions.push(eq(rbProduct.status, query.status));
        }

        const products = await this.dbInstance
            .select()
            .from(rbProduct)
            .where(and(...conditions))
            .orderBy(desc(rbProduct.updatedAt))
            .limit(query.limit)
            .offset(query.offset);

        return products.map(p => ({
            id: p.id,
            company_id: p.companyId,
            sku: p.sku,
            name: p.name,
            kind: p.kind as "ONE_TIME" | "RECURRING" | "USAGE",
            gl_rev_acct: p.glRevAcct || undefined,
            status: p.status as "ACTIVE" | "INACTIVE",
            updated_at: p.updatedAt.toISOString(),
            updated_by: p.updatedBy
        }));
    }

    /**
     * Get a product by ID
     */
    async getProduct(companyId: string, productId: string): Promise<ProductResponseType | null> {
        const products = await this.dbInstance
            .select()
            .from(rbProduct)
            .where(and(
                eq(rbProduct.companyId, companyId),
                eq(rbProduct.id, productId)
            ))
            .limit(1);

        if (products.length === 0) {
            return null;
        }

        const p = products[0]!;
        return {
            id: p.id,
            company_id: p.companyId,
            sku: p.sku,
            name: p.name,
            kind: p.kind as "ONE_TIME" | "RECURRING" | "USAGE",
            gl_rev_acct: p.glRevAcct || undefined,
            status: p.status as "ACTIVE" | "INACTIVE",
            updated_at: p.updatedAt.toISOString(),
            updated_by: p.updatedBy
        };
    }

    /**
     * Create or update a price book
     */
    async upsertPriceBook(
        companyId: string,
        userId: string,
        data: PriceBookUpsertType
    ): Promise<PriceBookResponseType> {
        const bookId = ulid();

        const book = await this.dbInstance
            .insert(rbPriceBook)
            .values({
                id: bookId,
                companyId,
                code: data.code,
                currency: data.currency,
                active: data.active,
                updatedBy: userId
            })
            .onConflictDoUpdate({
                target: [rbPriceBook.companyId, rbPriceBook.code, rbPriceBook.currency],
                set: {
                    active: data.active,
                    updatedBy: userId,
                    updatedAt: sql`now()`
                }
            })
            .returning();

        const b = book[0]!;
        return {
            id: b.id,
            company_id: b.companyId,
            code: b.code,
            currency: b.currency,
            active: b.active,
            updated_at: b.updatedAt.toISOString(),
            updated_by: b.updatedBy
        };
    }

    /**
     * Get price books
     */
    async getPriceBooks(companyId: string): Promise<PriceBookResponseType[]> {
        const books = await this.dbInstance
            .select()
            .from(rbPriceBook)
            .where(eq(rbPriceBook.companyId, companyId))
            .orderBy(desc(rbPriceBook.updatedAt));

        return books.map(b => ({
            id: b.id,
            company_id: b.companyId,
            code: b.code,
            currency: b.currency,
            active: b.active,
            updated_at: b.updatedAt.toISOString(),
            updated_by: b.updatedBy
        }));
    }

    /**
     * Create or update a price
     */
    async upsertPrice(
        companyId: string,
        data: PriceUpsertType
    ): Promise<PriceResponseType> {
        const priceId = ulid();

        const price = await this.dbInstance
            .insert(rbPrice)
            .values({
                id: priceId,
                companyId,
                productId: data.product_id,
                bookId: data.book_id,
                model: data.model,
                unitAmount: data.unit_amount ? data.unit_amount.toString() : null,
                unit: data.unit || null,
                interval: data.interval || null,
                intervalCount: data.interval_count,
                minQty: data.min_qty.toString(),
                maxQty: data.max_qty ? data.max_qty.toString() : null,
                meta: data.meta || null
            })
            .onConflictDoUpdate({
                target: [rbPrice.companyId, rbPrice.productId, rbPrice.bookId],
                set: {
                    model: data.model,
                    unitAmount: data.unit_amount ? data.unit_amount.toString() : null,
                    unit: data.unit || null,
                    interval: data.interval || null,
                    intervalCount: data.interval_count,
                    minQty: data.min_qty.toString(),
                    maxQty: data.max_qty ? data.max_qty.toString() : null,
                    meta: data.meta || null
                }
            })
            .returning();

        const p = price[0]!;
        return {
            id: p.id,
            company_id: p.companyId,
            product_id: p.productId,
            book_id: p.bookId,
            model: p.model as "FLAT" | "TIERED" | "STAIR" | "VOLUME",
            unit_amount: p.unitAmount ? Number(p.unitAmount) : undefined,
            unit: p.unit || undefined,
            interval: p.interval as "DAY" | "WEEK" | "MONTH" | "YEAR" | undefined,
            interval_count: p.intervalCount || 1,
            min_qty: Number(p.minQty),
            max_qty: p.maxQty ? Number(p.maxQty) : undefined,
            meta: p.meta || undefined
        };
    }

    /**
     * Get prices for a product
     */
    async getProductPrices(
        companyId: string,
        productId: string
    ): Promise<PriceResponseType[]> {
        const prices = await this.dbInstance
            .select()
            .from(rbPrice)
            .where(and(
                eq(rbPrice.companyId, companyId),
                eq(rbPrice.productId, productId)
            ));

        return prices.map(p => ({
            id: p.id,
            company_id: p.companyId,
            product_id: p.productId,
            book_id: p.bookId,
            model: p.model as "FLAT" | "TIERED" | "STAIR" | "VOLUME",
            unit_amount: p.unitAmount ? Number(p.unitAmount) : undefined,
            unit: p.unit || undefined,
            interval: p.interval as "DAY" | "WEEK" | "MONTH" | "YEAR" | undefined,
            interval_count: p.intervalCount || 1,
            min_qty: Number(p.minQty),
            max_qty: p.maxQty ? Number(p.maxQty) : undefined,
            meta: p.meta || undefined
        }));
    }

    /**
     * Calculate price for a given quantity (handles tiered/volume pricing)
     */
    async calculatePrice(
        companyId: string,
        productId: string,
        bookId: string,
        quantity: number
    ): Promise<number> {
        const prices = await this.dbInstance
            .select()
            .from(rbPrice)
            .where(and(
                eq(rbPrice.companyId, companyId),
                eq(rbPrice.productId, productId),
                eq(rbPrice.bookId, bookId)
            ))
            .limit(1);

        if (prices.length === 0) {
            throw new Error(`No price found for product ${productId} in book ${bookId}`);
        }

        const price = prices[0]!;

        switch (price.model) {
            case "FLAT":
                if (!price.unitAmount) {
                    throw new Error("FLAT pricing requires unit_amount");
                }
                return Number(price.unitAmount) * quantity;

            case "TIERED":
                return this.calculateTieredPrice(price, quantity);

            case "STAIR":
                return this.calculateStairPrice(price, quantity);

            case "VOLUME":
                return this.calculateVolumePrice(price, quantity);

            default:
                throw new Error(`Unsupported pricing model: ${price.model}`);
        }
    }

    /**
     * Calculate tiered pricing (each tier applies to quantity within that tier)
     */
    private calculateTieredPrice(price: any, quantity: number): number {
        if (!price.meta?.tiers || !Array.isArray(price.meta.tiers)) {
            throw new Error("TIERED pricing requires tiers in meta");
        }

        const tiers = price.meta.tiers.sort((a: any, b: any) => a.from - b.from);
        let totalAmount = 0;
        let remainingQty = quantity;

        for (const tier of tiers) {
            if (remainingQty <= 0) break;

            const tierQty = Math.min(remainingQty, tier.to - tier.from + 1);
            totalAmount += tierQty * tier.price;
            remainingQty -= tierQty;
        }

        return totalAmount;
    }

    /**
     * Calculate stair pricing (entire quantity uses highest applicable tier)
     */
    private calculateStairPrice(price: any, quantity: number): number {
        if (!price.meta?.tiers || !Array.isArray(price.meta.tiers)) {
            throw new Error("STAIR pricing requires tiers in meta");
        }

        const tiers = price.meta.tiers.sort((a: any, b: any) => a.from - b.from);

        // Find the highest tier that applies to this quantity
        let applicableTier = null;
        for (const tier of tiers) {
            if (quantity >= tier.from && quantity <= tier.to) {
                applicableTier = tier;
            }
        }

        if (!applicableTier) {
            throw new Error(`No stair tier found for quantity ${quantity}`);
        }

        return quantity * applicableTier.price;
    }

    /**
     * Calculate volume pricing (cumulative discounts)
     */
    private calculateVolumePrice(price: any, quantity: number): number {
        if (!price.unitAmount) {
            throw new Error("VOLUME pricing requires unit_amount");
        }

        const baseAmount = Number(price.unitAmount) * quantity;

        if (!price.meta?.discounts || !Array.isArray(price.meta.discounts)) {
            return baseAmount; // No discounts configured
        }

        const discounts = price.meta.discounts.sort((a: any, b: any) => b.threshold - a.threshold);

        // Find the highest applicable discount
        for (const discount of discounts) {
            if (quantity >= discount.threshold) {
                return baseAmount * (1 - discount.percentage / 100);
            }
        }

        return baseAmount;
    }
}
