import { db } from "../../lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc } from "drizzle-orm";
// Temporarily comment out problematic imports
// import {
//     lease,
//     leaseIndexProfile,
//     leaseIndexValue,
//     leaseMod,
//     leaseModLine,
//     leaseCashflow,
//     leaseComponent
// } from "@aibos/db-adapter/schema";
import type {
    LeaseIndexValueImportReqType,
    LeaseIndexPlanReqType,
    LeaseIndexPlanResponseType
} from "@aibos/contracts";

export class IndexationService {
    constructor(private dbInstance = db) { }

    /**
     * Ingest index values (CPI/FX) for a given index code
     */
    async ingestIndexValues(
        companyId: string,
        userId: string,
        data: LeaseIndexValueImportReqType
    ): Promise<void> {
        // TODO: Implement when schema imports are fixed
        console.log("IndexationService.ingestIndexValues called", { companyId, userId, data });
    }

    /**
     * Plan resets for a lease - determines due resets based on frequency and lag
     */
    async planResets(
        companyId: string,
        data: LeaseIndexPlanReqType
    ): Promise<LeaseIndexPlanResponseType> {
        // TODO: Implement when schema imports are fixed
        return {
            lease_id: data.lease_id,
            planned_resets: [],
            candidate_mod_id: undefined
        };
    }

    /**
     * Apply index reset - recalculates impacted cashflows and rebuilds liability PV
     */
    async applyIndexReset(
        companyId: string,
        userId: string,
        modId: string
    ): Promise<void> {
        // TODO: Implement when schema imports are fixed
        console.log("IndexationService.applyIndexReset called", { companyId, userId, modId });
    }

    /**
     * Get index values for a specific index code and date range
     */
    async getIndexValues(
        companyId: string,
        indexCode: string,
        fromDate?: string,
        toDate?: string
    ): Promise<Array<{ index_date: string; value: number }>> {
        // TODO: Implement when schema imports are fixed
        return [];
    }

    /**
     * Create or update index profile for a lease
     */
    async upsertIndexProfile(
        companyId: string,
        userId: string,
        leaseId: string,
        indexCode: string,
        profile: {
            lagMonths: number;
            capPct?: number;
            floorPct?: number;
            fxSrcCcy?: string;
            resetFreq: 'M' | 'Q' | 'SA' | 'A';
            nextResetOn: string;
            lastIndexValue?: number;
        }
    ): Promise<string> {
        // TODO: Implement when schema imports are fixed
        return ulid();
    }
}