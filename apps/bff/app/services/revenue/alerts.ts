import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql, gte, lte, asc, isNull } from "drizzle-orm";
import {
    revSspCatalog,
    revSspPolicy,
    revAllocAudit,
    rbProduct
} from "@aibos/db-adapter/schema";

export class RevAlertsService {
    constructor(private dbInstance = db) { }

    /**
     * Check for corridor breaches and generate alerts
     */
    async checkCorridorBreaches(companyId: string): Promise<{
        breaches: Array<{
            product_id: string;
            currency: string;
            ssp: number;
            median_ssp: number;
            variance_pct: number;
            threshold_pct: number;
        }>;
        alert_sent: boolean;
    }> {
        // Get SSP policy for threshold
        const [policy] = await this.dbInstance
            .select()
            .from(revSspPolicy)
            .where(eq(revSspPolicy.companyId, companyId))
            .limit(1);

        if (!policy) {
            return { breaches: [], alert_sent: false };
        }

        if (!policy.alertThresholdPct) {
            return { breaches: [], alert_sent: false };
        }

        const thresholdPct = parseFloat(policy.alertThresholdPct);

        // Get all approved SSP entries
        const sspEntries = await this.dbInstance
            .select()
            .from(revSspCatalog)
            .where(
                and(
                    eq(revSspCatalog.companyId, companyId),
                    eq(revSspCatalog.status, "APPROVED")
                )
            );

        const breaches: any[] = [];

        // Group by currency for median calculation
        const currencyGroups = sspEntries.reduce((groups, entry) => {
            const currency = entry.currency;
            if (!groups[currency]) {
                groups[currency] = [];
            }
            groups[currency]!.push(entry);
            return groups;
        }, {} as Record<string, any[]>);

        // Check each currency group
        for (const [currency, entries] of Object.entries(currencyGroups)) {
            if (entries.length < 2) continue; // Need at least 2 entries for median

            const ssps = entries.map(e => parseFloat(e.ssp)).sort((a, b) => a - b);
            const medianSsp = ssps[Math.floor(ssps.length / 2)];

            if (!medianSsp) continue; // Skip if no valid median

            // Check each entry against median
            for (const entry of entries) {
                const ssp = parseFloat(entry.ssp);
                const variancePct = Math.abs(ssp - medianSsp) / medianSsp;

                if (variancePct > thresholdPct) {
                    breaches.push({
                        product_id: entry.productId,
                        currency: entry.currency,
                        ssp,
                        median_ssp: medianSsp,
                        variance_pct: variancePct,
                        threshold_pct: thresholdPct
                    });
                }
            }
        }

        // Send alert if breaches found
        let alertSent = false;
        if (breaches.length > 0) {
            await this.sendCorridorBreachAlert(companyId, breaches);
            alertSent = true;
        }

        return { breaches, alert_sent: alertSent };
    }

    /**
     * Generate SSP state snapshot for audit diffing
     */
    async generateSspStateSnapshot(companyId: string): Promise<{
        snapshot_id: string;
        total_entries: number;
        currencies: string[];
        methods: Record<string, number>;
        created_at: string;
    }> {
        const snapshotId = ulid();

        // Get all approved SSP entries
        const sspEntries = await this.dbInstance
            .select()
            .from(revSspCatalog)
            .where(
                and(
                    eq(revSspCatalog.companyId, companyId),
                    eq(revSspCatalog.status, "APPROVED")
                )
            );

        // Analyze snapshot data
        const currencies = [...new Set(sspEntries.map(e => e.currency))];
        const methods = sspEntries.reduce((acc, entry) => {
            acc[entry.method] = (acc[entry.method] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const snapshot = {
            snapshot_id: snapshotId,
            company_id: companyId,
            total_entries: sspEntries.length,
            currencies,
            methods,
            entries: sspEntries.map(entry => ({
                product_id: entry.productId,
                currency: entry.currency,
                ssp: parseFloat(entry.ssp),
                method: entry.method,
                effective_from: entry.effectiveFrom,
                effective_to: entry.effectiveTo
            })),
            created_at: new Date().toISOString()
        };

        // Store snapshot (would be stored in a dedicated table or file system)
        // For now, we'll just return the summary
        return {
            snapshot_id: snapshotId,
            total_entries: snapshot.total_entries,
            currencies: snapshot.currencies,
            methods: snapshot.methods,
            created_at: snapshot.created_at
        };
    }

    /**
     * Get allocation audit summary for reporting
     */
    async getAllocationAuditSummary(
        companyId: string,
        fromDate?: string,
        toDate?: string
    ): Promise<{
        total_allocations: number;
        corridor_breaches: number;
        avg_processing_time_ms: number;
        method_breakdown: Record<string, number>;
        total_amount_allocated: number;
    }> {
        const conditions = [eq(revAllocAudit.companyId, companyId)];

        if (fromDate) {
            conditions.push(gte(revAllocAudit.createdAt, new Date(fromDate)));
        }
        if (toDate) {
            conditions.push(lte(revAllocAudit.createdAt, new Date(toDate)));
        }

        const audits = await this.dbInstance
            .select()
            .from(revAllocAudit)
            .where(and(...conditions))
            .orderBy(desc(revAllocAudit.createdAt));

        const totalAllocations = audits.length;
        const corridorBreaches = audits.filter(a => a.corridorFlag).length;
        const avgProcessingTime = audits.reduce((sum, a) => sum + (a.processingTimeMs || 0), 0) / totalAllocations || 0;

        const methodBreakdown = audits.reduce((acc, audit) => {
            acc[audit.method] = (acc[audit.method] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const totalAmountAllocated = audits.reduce((sum, audit) =>
            sum + parseFloat(audit.totalAllocatedAmount), 0
        );

        return {
            total_allocations: totalAllocations,
            corridor_breaches: corridorBreaches,
            avg_processing_time_ms: Math.round(avgProcessingTime),
            method_breakdown: methodBreakdown,
            total_amount_allocated: totalAmountAllocated
        };
    }

    /**
     * Get recent corridor breaches for dashboard
     */
    async getRecentCorridorBreaches(
        companyId: string,
        limit = 10
    ): Promise<Array<{
        product_id: string;
        currency: string;
        ssp: number;
        variance_pct: number;
        detected_at: string;
    }>> {
        // Get recent allocation audits with corridor flags
        const audits = await this.dbInstance
            .select()
            .from(revAllocAudit)
            .where(
                and(
                    eq(revAllocAudit.companyId, companyId),
                    eq(revAllocAudit.corridorFlag, true)
                )
            )
            .orderBy(desc(revAllocAudit.createdAt))
            .limit(limit);

        // Extract corridor breach details from audit results
        const breaches: any[] = [];
        for (const audit of audits) {
            const results = audit.results as any;
            if (results.corridor_flags) {
                for (const flag of results.corridor_flags) {
                    // Parse flag format: "product_id: variance X.X%"
                    const match = flag.match(/^(.+): variance (.+)%$/);
                    if (match) {
                        breaches.push({
                            product_id: match[1],
                            currency: results.currency || "USD",
                            ssp: results.ssp || 0,
                            variance_pct: parseFloat(match[2]),
                            detected_at: audit.createdAt.toISOString()
                        });
                    }
                }
            }
        }

        return breaches;
    }

    /**
     * Send corridor breach alert (placeholder implementation)
     */
    private async sendCorridorBreachAlert(
        companyId: string,
        breaches: any[]
    ): Promise<void> {
        // This would integrate with actual alerting system (email, Slack, etc.)
        console.log(`Corridor breach alert for company ${companyId}:`, breaches);

        // Could also store in an alerts table for dashboard display
        // await this.dbInstance.insert(revAlerts).values({...});
    }

    /**
     * Check for SSP policy compliance issues
     */
    async checkSspPolicyCompliance(companyId: string): Promise<{
        issues: Array<{
            type: string;
            severity: "LOW" | "MEDIUM" | "HIGH";
            description: string;
            affected_products?: string[];
        }>;
    }> {
        const issues: any[] = [];

        // Get SSP policy
        const [policy] = await this.dbInstance
            .select()
            .from(revSspPolicy)
            .where(eq(revSspPolicy.companyId, companyId))
            .limit(1);

        if (!policy) {
            issues.push({
                type: "MISSING_POLICY",
                severity: "HIGH",
                description: "No SSP policy configured for company"
            });
            return { issues };
        }

        // Check for products without SSP entries
        const productsWithoutSsp = await this.dbInstance
            .select({ productId: rbProduct.id })
            .from(rbProduct)
            .leftJoin(revSspCatalog, eq(rbProduct.id, revSspCatalog.productId))
            .where(
                and(
                    eq(rbProduct.companyId, companyId),
                    isNull(revSspCatalog.id)
                )
            );

        if (productsWithoutSsp.length > 0) {
            issues.push({
                type: "MISSING_SSP",
                severity: "MEDIUM",
                description: `${productsWithoutSsp.length} products without SSP entries`,
                affected_products: productsWithoutSsp.map(p => p.productId)
            });
        }

        // Check for draft SSP entries that should be reviewed
        const draftEntries = await this.dbInstance
            .select()
            .from(revSspCatalog)
            .where(
                and(
                    eq(revSspCatalog.companyId, companyId),
                    eq(revSspCatalog.status, "DRAFT")
                )
            );

        const oldDrafts = draftEntries.filter(entry => {
            const createdAt = new Date(entry.createdAt);
            const daysSinceCreated = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceCreated > 7; // More than 7 days old
        });

        if (oldDrafts.length > 0) {
            issues.push({
                type: "STALE_DRAFTS",
                severity: "LOW",
                description: `${oldDrafts.length} draft SSP entries older than 7 days`,
                affected_products: oldDrafts.map(d => d.productId)
            });
        }

        return { issues };
    }
}
