import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc, isNull } from "drizzle-orm";
import {
    revPob,
    revAllocLink,
    revSchedule,
    revRecRun,
    revRecLine,
    revEvent,
    revPolicy,
    revProdPolicy,
    revRpoSnapshot,
    revPostLock,
    revUsageBridge,
    revArtifact,
    rbContract,
    rbProduct,
    rbSubscription
} from "@aibos/db-adapter/schema";
import type {
    POBCreateType,
    POBQueryType,
    AllocFromInvoiceReqType,
    AllocFromInvoiceRespType,
    POBResponseType
} from "@aibos/contracts";

export class RevAllocationService {
    constructor(private dbInstance = db) { }

    /**
     * Create POBs from invoice allocation using relative-SSP methodology
     */
    async allocateFromInvoice(
        companyId: string,
        userId: string,
        data: AllocFromInvoiceReqType
    ): Promise<AllocFromInvoiceRespType> {
        // TODO: Implement actual invoice line retrieval and SSP calculation
        // This is a placeholder implementation

        // For now, create a single POB as an example
        const pobId = ulid();
        const pob = {
            id: pobId,
            companyId,
            contractId: 'contract-placeholder', // Would come from invoice
            productId: 'product-placeholder', // Would come from invoice line
            name: 'Service POB',
            method: 'RATABLE_MONTHLY' as const,
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            qty: '1',
            allocatedAmount: '12000.00',
            currency: 'USD',
            status: 'OPEN' as const,
            createdAt: new Date(),
            createdBy: userId
        };

        await this.dbInstance.insert(revPob).values(pob);

        // Create allocation link
        const allocLinkId = ulid();
        await this.dbInstance.insert(revAllocLink).values({
            id: allocLinkId,
            companyId,
            pobId,
            invoiceId: data.invoice_id,
            invoiceLineId: 'line-placeholder',
            lineTxnAmount: '12000.00',
            allocatedToPob: '12000.00'
        });

        return {
            invoice_id: data.invoice_id,
            pobs_created: 1,
            total_allocated: 12000.00,
            pobs: [{
                id: pobId,
                name: 'Service POB',
                method: 'RATABLE_MONTHLY',
                allocated_amount: 12000.00,
                currency: 'USD'
            }]
        };
    }

    /**
     * Create a POB manually
     */
    async createPOB(
        companyId: string,
        userId: string,
        data: POBCreateType
    ): Promise<POBResponseType> {
        const pobId = ulid();

        const pob = {
            id: pobId,
            companyId,
            contractId: data.contract_id,
            subscriptionId: data.subscription_id,
            invoiceLineId: data.invoice_line_id,
            productId: data.product_id,
            name: data.name,
            method: data.method,
            startDate: data.start_date,
            endDate: data.end_date,
            qty: data.qty.toString(),
            uom: data.uom,
            ssp: data.ssp?.toString(),
            allocatedAmount: data.allocated_amount.toString(),
            currency: data.currency,
            status: 'OPEN' as const,
            createdAt: new Date(),
            createdBy: userId
        };

        await this.dbInstance.insert(revPob).values(pob);

        return {
            id: pobId,
            company_id: companyId,
            contract_id: data.contract_id,
            subscription_id: data.subscription_id,
            invoice_line_id: data.invoice_line_id,
            product_id: data.product_id,
            name: data.name,
            method: data.method,
            start_date: data.start_date,
            end_date: data.end_date,
            qty: Number(data.qty),
            uom: data.uom,
            ssp: data.ssp,
            allocated_amount: data.allocated_amount,
            currency: data.currency,
            status: 'OPEN',
            created_at: new Date().toISOString(),
            created_by: userId
        };
    }

    /**
     * Query POBs with filters
     */
    async queryPOBs(
        companyId: string,
        query: POBQueryType
    ): Promise<POBResponseType[]> {
        const conditions = [eq(revPob.companyId, companyId)];

        if (query.contract_id) {
            conditions.push(eq(revPob.contractId, query.contract_id));
        }
        if (query.product_id) {
            conditions.push(eq(revPob.productId, query.product_id));
        }
        if (query.status) {
            conditions.push(eq(revPob.status, query.status));
        }
        if (query.method) {
            conditions.push(eq(revPob.method, query.method));
        }
        if (query.start_date_from) {
            conditions.push(gte(revPob.startDate, query.start_date_from));
        }
        if (query.start_date_to) {
            conditions.push(lte(revPob.startDate, query.start_date_to));
        }

        const pobs = await this.dbInstance
            .select()
            .from(revPob)
            .where(and(...conditions))
            .orderBy(desc(revPob.createdAt))
            .limit(query.limit)
            .offset(query.offset);

        return pobs.map(pob => ({
            id: pob.id,
            company_id: pob.companyId,
            contract_id: pob.contractId,
            subscription_id: pob.subscriptionId || undefined,
            invoice_line_id: pob.invoiceLineId || undefined,
            product_id: pob.productId,
            name: pob.name,
            method: pob.method,
            start_date: pob.startDate,
            end_date: pob.endDate || undefined,
            qty: Number(pob.qty),
            uom: pob.uom || undefined,
            ssp: pob.ssp ? Number(pob.ssp) : undefined,
            allocated_amount: Number(pob.allocatedAmount),
            currency: pob.currency,
            status: pob.status,
            created_at: pob.createdAt.toISOString(),
            created_by: pob.createdBy
        }));
    }

    /**
     * Get POB by ID
     */
    async getPOB(
        companyId: string,
        pobId: string
    ): Promise<POBResponseType | null> {
        const pobs = await this.dbInstance
            .select()
            .from(revPob)
            .where(and(
                eq(revPob.companyId, companyId),
                eq(revPob.id, pobId)
            ))
            .limit(1);

        if (pobs.length === 0) {
            return null;
        }

        const pob = pobs[0]!;
        return {
            id: pob.id,
            company_id: pob.companyId,
            contract_id: pob.contractId,
            subscription_id: pob.subscriptionId || undefined,
            invoice_line_id: pob.invoiceLineId || undefined,
            product_id: pob.productId,
            name: pob.name,
            method: pob.method,
            start_date: pob.startDate,
            end_date: pob.endDate || undefined,
            qty: Number(pob.qty),
            uom: pob.uom || undefined,
            ssp: pob.ssp ? Number(pob.ssp) : undefined,
            allocated_amount: Number(pob.allocatedAmount),
            currency: pob.currency,
            status: pob.status,
            created_at: pob.createdAt.toISOString(),
            created_by: pob.createdBy
        };
    }
}
