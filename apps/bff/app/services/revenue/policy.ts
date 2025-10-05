import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc } from "drizzle-orm";
import {
    revPolicy,
    revProdPolicy,
    revRpoSnapshot,
    revArtifact,
    revRecRun,
    rbProduct
} from "@aibos/db-adapter/schema";
import type {
    RevPolicyUpsertType,
    RevProdPolicyUpsertType,
    RPOSnapshotCreateType,
    RPOSnapshotQueryType,
    ExportReqType,
    ExportRespType,
    RevPolicyResponseType,
    RevProdPolicyResponseType,
    RPOSnapshotResponseType
} from "@aibos/contracts";

export class RevPolicyService {
    constructor(private dbInstance = db) { }

    /**
     * Upsert revenue policy for company
     */
    async upsertPolicy(
        companyId: string,
        userId: string,
        data: RevPolicyUpsertType
    ): Promise<RevPolicyResponseType> {
        const policy = {
            companyId,
            revAccount: data.rev_account,
            unbilledArAccount: data.unbilled_ar_account,
            deferredRevAccount: data.deferred_rev_account,
            rounding: data.rounding,
            updatedAt: new Date(),
            updatedBy: userId
        };

        await this.dbInstance
            .insert(revPolicy)
            .values(policy)
            .onConflictDoUpdate({
                target: revPolicy.companyId,
                set: {
                    revAccount: policy.revAccount,
                    unbilledArAccount: policy.unbilledArAccount,
                    deferredRevAccount: policy.deferredRevAccount,
                    rounding: policy.rounding,
                    updatedAt: policy.updatedAt,
                    updatedBy: policy.updatedBy
                }
            });

        return {
            company_id: companyId,
            rev_account: data.rev_account,
            unbilled_ar_account: data.unbilled_ar_account,
            deferred_rev_account: data.deferred_rev_account,
            rounding: data.rounding,
            updated_at: new Date().toISOString(),
            updated_by: userId
        };
    }

    /**
     * Get revenue policy for company
     */
    async getPolicy(companyId: string): Promise<RevPolicyResponseType | null> {
        const policies = await this.dbInstance
            .select()
            .from(revPolicy)
            .where(eq(revPolicy.companyId, companyId))
            .limit(1);

        if (policies.length === 0) {
            return null;
        }

        const policy = policies[0]!;
        return {
            company_id: policy.companyId,
            rev_account: policy.revAccount,
            unbilled_ar_account: policy.unbilledArAccount,
            deferred_rev_account: policy.deferredRevAccount,
            rounding: policy.rounding,
            updated_at: policy.updatedAt.toISOString(),
            updated_by: policy.updatedBy
        };
    }

    /**
     * Upsert product-specific policy
     */
    async upsertProdPolicy(
        companyId: string,
        userId: string,
        data: RevProdPolicyUpsertType
    ): Promise<RevProdPolicyResponseType> {
        const policyId = ulid();
        const policy = {
            id: policyId,
            companyId,
            productId: data.product_id,
            method: data.method,
            revAccount: data.rev_account,
            updatedAt: new Date(),
            updatedBy: userId
        };

        await this.dbInstance
            .insert(revProdPolicy)
            .values(policy)
            .onConflictDoUpdate({
                target: [revProdPolicy.companyId, revProdPolicy.productId],
                set: {
                    method: policy.method,
                    revAccount: policy.revAccount,
                    updatedAt: policy.updatedAt,
                    updatedBy: policy.updatedBy
                }
            });

        return {
            id: policyId,
            company_id: companyId,
            product_id: data.product_id,
            method: data.method,
            rev_account: data.rev_account,
            updated_at: new Date().toISOString(),
            updated_by: userId
        };
    }

    /**
     * Get product policies for company
     */
    async getProdPolicies(companyId: string): Promise<RevProdPolicyResponseType[]> {
        const policies = await this.dbInstance
            .select()
            .from(revProdPolicy)
            .where(eq(revProdPolicy.companyId, companyId))
            .orderBy(asc(revProdPolicy.productId));

        return policies.map(policy => ({
            id: policy.id,
            company_id: policy.companyId,
            product_id: policy.productId,
            method: policy.method,
            rev_account: policy.revAccount || undefined,
            updated_at: policy.updatedAt.toISOString(),
            updated_by: policy.updatedBy
        }));
    }
}

export class RevRpoService {
    constructor(private dbInstance = db) { }

    /**
     * Create RPO snapshot
     */
    async createSnapshot(
        companyId: string,
        userId: string,
        data: RPOSnapshotCreateType
    ): Promise<RPOSnapshotResponseType> {
        // Calculate RPO amounts from open POBs
        const rpoAmounts = await this.calculateRPOAmounts(companyId, data.as_of_date);

        const snapshotId = ulid();
        const snapshot = {
            id: snapshotId,
            companyId,
            asOfDate: data.as_of_date,
            currency: data.currency,
            totalRpo: rpoAmounts.total.toString(),
            dueWithin12m: rpoAmounts.dueWithin12m.toString(),
            dueAfter12m: rpoAmounts.dueAfter12m.toString(),
            createdAt: new Date(),
            createdBy: userId
        };

        await this.dbInstance
            .insert(revRpoSnapshot)
            .values(snapshot)
            .onConflictDoUpdate({
                target: [revRpoSnapshot.companyId, revRpoSnapshot.asOfDate, revRpoSnapshot.currency],
                set: {
                    totalRpo: snapshot.totalRpo,
                    dueWithin12m: snapshot.dueWithin12m,
                    dueAfter12m: snapshot.dueAfter12m,
                    createdAt: snapshot.createdAt,
                    createdBy: snapshot.createdBy
                }
            });

        return {
            id: snapshotId,
            company_id: companyId,
            as_of_date: data.as_of_date,
            currency: data.currency,
            total_rpo: rpoAmounts.total,
            due_within_12m: rpoAmounts.dueWithin12m,
            due_after_12m: rpoAmounts.dueAfter12m,
            created_at: new Date().toISOString(),
            created_by: userId
        };
    }

    /**
     * Calculate RPO amounts from open POBs
     */
    private async calculateRPOAmounts(companyId: string, asOfDate: string): Promise<{
        total: number;
        dueWithin12m: number;
        dueAfter12m: number;
    }> {
        // This is a simplified calculation
        // In a real implementation, you'd query open POBs and their remaining amounts
        const snapshotDate = new Date(asOfDate);
        const twelveMonthsLater = new Date(snapshotDate);
        twelveMonthsLater.setMonth(twelveMonthsLater.getMonth() + 12);

        // Placeholder calculation - would be replaced with actual POB queries
        const total = 100000; // Total RPO
        const dueWithin12m = 60000; // RPO due within 12 months
        const dueAfter12m = 40000; // RPO due after 12 months

        return { total, dueWithin12m, dueAfter12m };
    }

    /**
     * Query RPO snapshots
     */
    async querySnapshots(
        companyId: string,
        query: RPOSnapshotQueryType
    ): Promise<RPOSnapshotResponseType[]> {
        const conditions = [eq(revRpoSnapshot.companyId, companyId)];

        if (query.as_of_date_from) {
            conditions.push(gte(revRpoSnapshot.asOfDate, query.as_of_date_from));
        }
        if (query.as_of_date_to) {
            conditions.push(lte(revRpoSnapshot.asOfDate, query.as_of_date_to));
        }
        if (query.currency) {
            conditions.push(eq(revRpoSnapshot.currency, query.currency));
        }

        const snapshots = await this.dbInstance
            .select()
            .from(revRpoSnapshot)
            .where(and(...conditions))
            .orderBy(desc(revRpoSnapshot.asOfDate))
            .limit(query.limit)
            .offset(query.offset);

        return snapshots.map(snapshot => ({
            id: snapshot.id,
            company_id: snapshot.companyId,
            as_of_date: snapshot.asOfDate,
            currency: snapshot.currency,
            total_rpo: Number(snapshot.totalRpo),
            due_within_12m: Number(snapshot.dueWithin12m),
            due_after_12m: Number(snapshot.dueAfter12m),
            created_at: snapshot.createdAt.toISOString(),
            created_by: snapshot.createdBy
        }));
    }
}

export class RevArtifactsService {
    constructor(private dbInstance = db) { }

    /**
     * Export recognition run artifacts
     */
    async exportRun(
        companyId: string,
        userId: string,
        data: ExportReqType
    ): Promise<ExportRespType> {
        // Get run details
        const runs = await this.dbInstance
            .select()
            .from(revRecRun)
            .where(and(
                eq(revRecRun.companyId, companyId),
                eq(revRecRun.id, data.run_id)
            ))
            .limit(1);

        if (runs.length === 0) {
            throw new Error("Recognition run not found");
        }

        const run = runs[0]!;

        // Generate artifact
        const artifactId = ulid();
        const filename = `rev-recognition-${run.periodYear}-${run.periodMonth.toString().padStart(2, '0')}-${data.kind.toLowerCase()}`;
        const content = await this.generateExportContent(run, data.kind);
        const sha256 = this.calculateSHA256(content);
        const bytes = Buffer.byteLength(content, 'utf8');
        const storageUri = `s3://artifacts/revenue/${artifactId}`;

        // Store artifact
        await this.dbInstance.insert(revArtifact).values({
            id: artifactId,
            runId: data.run_id,
            kind: data.kind,
            filename,
            sha256,
            bytes,
            storageUri,
            createdAt: new Date(),
            createdBy: userId
        });

        return {
            artifact_id: artifactId,
            filename,
            sha256,
            bytes,
            storage_uri: storageUri,
            download_url: `/api/rev/artifacts/${artifactId}/download`
        };
    }

    /**
     * Generate export content
     */
    private async generateExportContent(run: any, kind: string): Promise<string> {
        if (kind === 'JSON') {
            return JSON.stringify({
                run_id: run.id,
                period_year: run.periodYear,
                period_month: run.periodMonth,
                status: run.status,
                stats: run.stats,
                created_at: run.createdAt
            }, null, 2);
        } else {
            // CSV format
            return `run_id,period_year,period_month,status,created_at\n${run.id},${run.periodYear},${run.periodMonth},${run.status},${run.createdAt.toISOString()}`;
        }
    }

    /**
     * Calculate SHA256 hash
     */
    private calculateSHA256(content: string): string {
        // In a real implementation, you'd use crypto.createHash('sha256')
        return `sha256-${Buffer.from(content).toString('base64').substring(0, 16)}`;
    }
}
