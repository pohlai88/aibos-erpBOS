import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { taxCode } from "@aibos/db-adapter/schema";

export interface TaxCalculationResult {
    taxCode: string;
    taxAmount: number;
    taxRate: number;
}

export interface TaxLineItem {
    productId?: string;
    amount: number;
    customerId: string;
    companyId: string;
}

export class RbTaxService {
    constructor(private dbInstance = db) { }

    /**
     * Calculate tax for invoice line items
     */
    async calculateTaxForLines(
        companyId: string,
        customerId: string,
        lines: TaxLineItem[]
    ): Promise<{ totalTax: number; lineTaxes: TaxCalculationResult[] }> {
        let totalTax = 0;
        const lineTaxes: TaxCalculationResult[] = [];

        for (const line of lines) {
            const taxResult = await this.calculateTaxForLine(
                companyId,
                customerId,
                line
            );

            lineTaxes.push(taxResult);
            totalTax += taxResult.taxAmount;
        }

        return { totalTax, lineTaxes };
    }

    /**
     * Calculate tax for a single line item
     */
    async calculateTaxForLine(
        companyId: string,
        customerId: string,
        line: TaxLineItem
    ): Promise<TaxCalculationResult> {
        // Get tax code for the product or customer
        const taxCodeResult = await this.getTaxCodeForLine(
            companyId,
            customerId,
            line.productId
        );

        if (!taxCodeResult) {
            return {
                taxCode: "NO_TAX",
                taxAmount: 0,
                taxRate: 0
            };
        }

        const taxAmount = line.amount * (taxCodeResult.rate / 100);

        return {
            taxCode: taxCodeResult.code,
            taxAmount: Math.round(taxAmount * 100) / 100, // Round to 2 decimal places
            taxRate: taxCodeResult.rate
        };
    }

    /**
     * Get tax code for a line item (product-specific or customer default)
     */
    private async getTaxCodeForLine(
        companyId: string,
        customerId: string,
        productId?: string
    ): Promise<{ code: string; rate: number } | null> {
        // First try to get product-specific tax code
        if (productId) {
            const productTaxCode = await this.dbInstance
                .select()
                .from(taxCode)
                .where(and(
                    eq(taxCode.companyId, companyId),
                    eq(taxCode.productId, productId),
                    eq(taxCode.active, true)
                ))
                .limit(1);

            if (productTaxCode.length > 0) {
                return {
                    code: productTaxCode[0].code,
                    rate: productTaxCode[0].rate
                };
            }
        }

        // Fall back to customer default tax code
        const customerTaxCode = await this.dbInstance
            .select()
            .from(taxCode)
            .where(and(
                eq(taxCode.companyId, companyId),
                eq(taxCode.customerId, customerId),
                eq(taxCode.active, true)
            ))
            .limit(1);

        if (customerTaxCode.length > 0) {
            return {
                code: customerTaxCode[0].code,
                rate: customerTaxCode[0].rate
            };
        }

        // Fall back to company default tax code
        const defaultTaxCode = await this.dbInstance
            .select()
            .from(taxCode)
            .where(and(
                eq(taxCode.companyId, companyId),
                eq(taxCode.isDefault, true),
                eq(taxCode.active, true)
            ))
            .limit(1);

        if (defaultTaxCode.length > 0) {
            return {
                code: defaultTaxCode[0].code,
                rate: defaultTaxCode[0].rate
            };
        }

        return null; // No tax code found
    }

    /**
     * Get tax code details by code
     */
    async getTaxCodeByCode(
        companyId: string,
        code: string
    ): Promise<{ code: string; rate: number; description: string } | null> {
        const taxCodes = await this.dbInstance
            .select()
            .from(taxCode)
            .where(and(
                eq(taxCode.companyId, companyId),
                eq(taxCode.code, code),
                eq(taxCode.active, true)
            ))
            .limit(1);

        if (taxCodes.length === 0) {
            return null;
        }

        const tc = taxCodes[0];
        return {
            code: tc.code,
            rate: tc.rate,
            description: tc.description || ""
        };
    }
}
