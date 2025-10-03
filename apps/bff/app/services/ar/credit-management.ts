import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, gte, lte, desc, sql, isNull, isNotNull } from "drizzle-orm";
import {
    arCreditPolicy,
    arCustomerCredit,
    arCreditHoldLog,
    arCollectionsNote,
    arCollectionsKpi,
    arPtp,
    arDispute,
    arCashApp,
    arCashAppLink
} from "@aibos/db-adapter/schema";
import type {
    CreditPolicyUpsertType,
    CustomerCreditUpsertType,
    WorkbenchQueryType,
    CollectionsNoteCreateType,
    CreditEvaluateReqType,
    CreditEvaluateResultType,
    WorkbenchCustomerType,
    CollectionsKpiSnapshotType
} from "@aibos/contracts";

// --- AR Credit Management Service (M24.1) -----------------------------------------

export class ArCreditManagementService {
    constructor(private dbInstance = db) { }

    /**
     * Calculate customer exposure and DSO
     */
    async calculateExposureAndDso(
        companyId: string,
        customerId: string,
        asOfDate: string
    ): Promise<{ exposure: number; dso: number; disputesOpen: number; ptpOpen: number }> {
        // Calculate exposure: open AR + open PTP - recent cash applications
        const exposureResult = await this.dbInstance.execute(sql`
            WITH open_ar AS (
                SELECT COALESCE(SUM(gross_amount), 0) as ar_amount
                FROM ar_invoice 
                WHERE company_id = ${companyId} 
                AND customer_id = ${customerId}
                AND status = 'open'
            ),
            open_ptp AS (
                SELECT COALESCE(SUM(amount), 0) as ptp_amount
                FROM ar_ptp 
                WHERE company_id = ${companyId} 
                AND customer_id = ${customerId}
                AND status = 'open'
            ),
            recent_cash AS (
                SELECT COALESCE(SUM(ca.amount), 0) as cash_amount
                FROM ar_cash_app ca
                JOIN ar_cash_app_link cal ON ca.id = cal.cash_app_id
                WHERE ca.company_id = ${companyId} 
                AND ca.customer_id = ${customerId}
                AND ca.receipt_date >= ${asOfDate}::date - INTERVAL '30 days'
                AND ca.status = 'matched'
            )
            SELECT 
                (SELECT ar_amount FROM open_ar) + 
                (SELECT ptp_amount FROM open_ptp) - 
                (SELECT cash_amount FROM recent_cash) as exposure
        `);

        const exposure = Number(exposureResult.rows[0]?.exposure || 0);

        // Calculate DSO (simplified: rolling 90 days)
        const dsoResult = await this.dbInstance.execute(sql`
            WITH sales_90d AS (
                SELECT COALESCE(SUM(gross_amount), 0) as sales_amount
                FROM ar_invoice 
                WHERE company_id = ${companyId} 
                AND customer_id = ${customerId}
                AND invoice_date >= ${asOfDate}::date - INTERVAL '90 days'
            ),
            ar_balance AS (
                SELECT COALESCE(SUM(gross_amount), 0) as ar_amount
                FROM ar_invoice 
                WHERE company_id = ${companyId} 
                AND customer_id = ${customerId}
                AND status = 'open'
            )
            SELECT 
                CASE 
                    WHEN (SELECT sales_amount FROM sales_90d) > 0 
                    THEN ((SELECT ar_amount FROM ar_balance) / (SELECT sales_amount FROM sales_90d)) * 90
                    ELSE 0 
                END as dso
        `);

        const dso = Number(dsoResult.rows[0]?.dso || 0);

        // Count open disputes and PTPs
        const disputesResult = await this.dbInstance
            .select({ count: sql<number>`count(*)` })
            .from(arDispute)
            .where(
                and(
                    eq(arDispute.companyId, companyId),
                    eq(arDispute.customerId, customerId),
                    eq(arDispute.status, 'open')
                )
            );

        const ptpResult = await this.dbInstance
            .select({ count: sql<number>`count(*)` })
            .from(arPtp)
            .where(
                and(
                    eq(arPtp.companyId, companyId),
                    eq(arPtp.customerId, customerId),
                    eq(arPtp.status, 'open')
                )
            );

        return {
            exposure,
            dso,
            disputesOpen: Number(disputesResult[0]?.count || 0),
            ptpOpen: Number(ptpResult[0]?.count || 0)
        };
    }

    /**
     * Evaluate credit holds/releases for customers
     */
    async evaluateCreditHolds(
        companyId: string,
        req: CreditEvaluateReqType,
        createdBy: string
    ): Promise<CreditEvaluateResultType> {
        const customersEvaluated = 0;
        let holdsTriggered = 0;
        let releasesTriggered = 0;
        let errors = 0;
        const details: any[] = [];

        try {
            // Get all customers or specific ones
            let customers: { customer_id: string }[] = [];

            if (req.customer_ids && req.customer_ids.length > 0) {
                customers = req.customer_ids.map((id: string) => ({ customer_id: id }));
            } else {
                const allCustomersResult = await this.dbInstance.execute(sql`
                    SELECT DISTINCT customer_id 
                    FROM ar_customer_credit 
                    WHERE company_id = ${companyId}
                `);
                customers = allCustomersResult.rows as { customer_id: string }[];
            }

            for (const customer of customers) {
                try {
                    const customerId = customer.customer_id;
                    const asOfDate = new Date().toISOString().split('T')[0]!;

                    // Get customer credit info
                    const creditInfo = await this.dbInstance
                        .select()
                        .from(arCustomerCredit)
                        .where(
                            and(
                                eq(arCustomerCredit.companyId, companyId),
                                eq(arCustomerCredit.customerId, customerId)
                            )
                        )
                        .limit(1);

                    if (creditInfo.length === 0) {
                        continue; // No credit policy for this customer
                    }

                    const credit = creditInfo[0];
                    if (!credit) continue;

                    // Get policy
                    const policyInfo = await this.dbInstance
                        .select()
                        .from(arCreditPolicy)
                        .where(
                            and(
                                eq(arCreditPolicy.companyId, companyId),
                                eq(arCreditPolicy.policyCode, credit.policyCode)
                            )
                        )
                        .limit(1);

                    if (policyInfo.length === 0) {
                        continue;
                    }

                    const policy = policyInfo[0];
                    if (!policy) continue;

                    // Calculate metrics
                    const metrics = await this.calculateExposureAndDso(companyId, customerId, asOfDate);

                    // Check for breaches
                    const breaches = [];
                    let action: "HOLD" | "RELEASE" | "NO_CHANGE" = "NO_CHANGE";
                    let reason = "";

                    // Exposure breach
                    if (metrics.exposure > Number(credit.creditLimit)) {
                        breaches.push(`Exposure ${metrics.exposure} exceeds limit ${credit.creditLimit}`);
                    }

                    // DSO breach
                    if (metrics.dso > Number(policy.dsoTarget) + Number(policy.graceDays)) {
                        breaches.push(`DSO ${metrics.dso} exceeds target ${policy.dsoTarget} + grace ${policy.graceDays}`);
                    }

                    // Risk score breach
                    if (credit.riskScore && (Number(credit.riskScore) * Number(policy.riskWeight)) > 0.7) {
                        breaches.push(`Risk score ${credit.riskScore} * weight ${policy.riskWeight} > 0.7`);
                    }

                    // PTP tolerance breach
                    if (metrics.ptpOpen > Number(policy.ptpTolerance)) {
                        breaches.push(`Open PTPs ${metrics.ptpOpen} exceed tolerance ${policy.ptpTolerance}`);
                    }

                    // Determine action
                    if (breaches.length > 0 && !credit.onHold) {
                        action = "HOLD";
                        reason = breaches.join("; ");
                        holdsTriggered++;
                    } else if (breaches.length === 0 && credit.onHold) {
                        // Check if we should release (no broken PTPs in last 7 days)
                        const recentBrokenPtp = await this.dbInstance.execute(sql`
                            SELECT COUNT(*) as count
                            FROM ar_ptp 
                            WHERE company_id = ${companyId} 
                            AND customer_id = ${customerId}
                            AND status = 'broken'
                            AND decided_at >= ${asOfDate}::date - INTERVAL '7 days'
                        `);

                        if (Number(recentBrokenPtp.rows[0]?.count || 0) === 0) {
                            action = "RELEASE";
                            reason = "No breaches detected and no recent broken PTPs";
                            releasesTriggered++;
                        }
                    }

                    // Execute action if not dry run
                    if (!req.dry_run && action !== "NO_CHANGE") {
                        await this.dbInstance
                            .update(arCustomerCredit)
                            .set({
                                onHold: action === "HOLD",
                                holdReason: action === "HOLD" ? reason : null,
                                updatedAt: new Date(),
                                updatedBy: createdBy
                            })
                            .where(
                                and(
                                    eq(arCustomerCredit.companyId, companyId),
                                    eq(arCustomerCredit.customerId, customerId)
                                )
                            );

                        // Log the event
                        await this.dbInstance.insert(arCreditHoldLog).values({
                            id: ulid(),
                            companyId,
                            customerId,
                            event: action,
                            reason,
                            snapshot: {
                                exposure: metrics.exposure,
                                dso: metrics.dso,
                                riskScore: credit.riskScore,
                                disputesOpen: metrics.disputesOpen,
                                ptpOpen: metrics.ptpOpen
                            },
                            createdBy
                        });
                    }

                    details.push({
                        customer_id: customerId,
                        action,
                        reason,
                        exposure: metrics.exposure,
                        dso: metrics.dso,
                        risk_score: credit.riskScore
                    });

                } catch (error) {
                    console.error(`Error evaluating customer ${customer.customer_id}:`, error);
                    errors++;
                }
            }

            return {
                customers_evaluated: customers.length,
                holds_triggered: holdsTriggered,
                releases_triggered: releasesTriggered,
                errors,
                details
            };

        } catch (error) {
            console.error('Error in evaluateCreditHolds:', error);
            throw error;
        }
    }

    /**
     * Get collections workbench prioritized list
     */
    async getWorkbenchList(
        companyId: string,
        query: WorkbenchQueryType
    ): Promise<WorkbenchCustomerType[]> {
        const maxRows = query.max_rows || 100;
        const asOfDate = new Date().toISOString().split('T')[0]!;

        // Build dynamic query based on filters
        let whereConditions = sql`cc.company_id = ${companyId}`;

        if (query.on_hold !== undefined) {
            whereConditions = sql`${whereConditions} AND cc.on_hold = ${query.on_hold}`;
        }

        if (query.min_exposure !== undefined) {
            whereConditions = sql`${whereConditions} AND metrics.exposure >= ${query.min_exposure}`;
        }

        const workbenchResult = await this.dbInstance.execute(sql`
            WITH customer_metrics AS (
                SELECT 
                    cc.customer_id,
                    cc.on_hold,
                    cc.hold_reason,
                    COALESCE(metrics.exposure, 0) as exposure,
                    COALESCE(metrics.dso, 0) as dso,
                    COALESCE(metrics.disputes_open, 0) as disputes_open,
                    COALESCE(metrics.ptp_open, 0) as ptp_open,
                    CASE 
                        WHEN COALESCE(metrics.dso, 0) <= 30 THEN 'CURRENT'
                        WHEN COALESCE(metrics.dso, 0) <= 60 THEN '1-30'
                        WHEN COALESCE(metrics.dso, 0) <= 90 THEN '31-60'
                        WHEN COALESCE(metrics.dso, 0) <= 120 THEN '61-90'
                        ELSE '90+'
                    END as bucket,
                    cn.last_contact,
                    cn.next_action_date
                FROM ar_customer_credit cc
                LEFT JOIN LATERAL (
                    SELECT 
                        exposure, dso, disputes_open, ptp_open
                    FROM (
                        SELECT 
                            ${companyId} as company_id,
                            cc.customer_id,
                            ${asOfDate} as as_of_date
                    ) params
                    CROSS JOIN LATERAL (
                        SELECT 
                            -- This would call calculateExposureAndDso logic
                            0 as exposure, 0 as dso, 0 as disputes_open, 0 as ptp_open
                    ) metrics
                ) metrics ON true
                LEFT JOIN LATERAL (
                    SELECT 
                        MAX(created_at) as last_contact,
                        MIN(next_action_date) as next_action_date
                    FROM ar_collections_note
                    WHERE company_id = ${companyId} 
                    AND customer_id = cc.customer_id
                ) cn ON true
                WHERE ${whereConditions}
            )
            SELECT 
                customer_id,
                'Customer ' || customer_id as customer_name,
                exposure,
                dso,
                bucket,
                on_hold,
                hold_reason,
                disputes_open,
                ptp_open,
                last_contact,
                next_action_date,
                -- Priority score: exposure * delinquency factor
                exposure * (1 + dso / 30.0) as priority_score
            FROM customer_metrics
            ORDER BY priority_score DESC, dso DESC
            LIMIT ${maxRows}
        `);

        return workbenchResult.rows.map((row: any) => ({
            customer_id: row.customer_id,
            customer_name: row.customer_name,
            exposure: Number(row.exposure),
            dso: Number(row.dso),
            bucket: row.bucket,
            on_hold: row.on_hold,
            hold_reason: row.hold_reason,
            disputes_open: Number(row.disputes_open),
            ptp_open: Number(row.ptp_open),
            last_contact: row.last_contact,
            next_action_date: row.next_action_date,
            priority_score: Number(row.priority_score)
        }));
    }

    /**
     * Add collections note
     */
    async addCollectionsNote(
        companyId: string,
        note: CollectionsNoteCreateType,
        createdBy: string
    ): Promise<void> {
        await this.dbInstance.insert(arCollectionsNote).values({
            id: ulid(),
            companyId,
            customerId: note.customer_id,
            invoiceId: note.invoice_id,
            kind: note.kind,
            body: note.body,
            nextActionDate: note.next_action_date ? note.next_action_date : null,
            createdBy
        });
    }

    /**
     * Generate collections KPI snapshot
     */
    async generateKpiSnapshot(
        companyId: string,
        asOfDate: string
    ): Promise<CollectionsKpiSnapshotType> {
        // Get all customers with credit policies
        const customers = await this.dbInstance
            .select()
            .from(arCustomerCredit)
            .where(eq(arCustomerCredit.companyId, companyId));

        let totalExposure = 0;
        let totalDso = 0;
        let customersOnHold = 0;
        let totalDisputes = 0;
        let totalPtp = 0;

        const customerDetails = [];

        for (const customer of customers) {
            const metrics = await this.calculateExposureAndDso(companyId, customer.customerId, asOfDate);

            totalExposure += metrics.exposure;
            totalDso += metrics.dso;
            if (customer.onHold) customersOnHold++;
            totalDisputes += metrics.disputesOpen;
            totalPtp += metrics.ptpOpen;

            customerDetails.push({
                customer_id: customer.customerId,
                customer_name: `Customer ${customer.customerId}`,
                exposure: metrics.exposure,
                dso: metrics.dso,
                disputes_open: metrics.disputesOpen,
                ptp_open: metrics.ptpOpen,
                on_hold: customer.onHold
            });
        }

        const avgDso = customers.length > 0 ? totalDso / customers.length : 0;

        // Store snapshot
        await this.dbInstance.insert(arCollectionsKpi).values({
            id: ulid(),
            companyId,
            asOfDate: asOfDate,
            dso: avgDso.toString(),
            disputesOpen: totalDisputes,
            ptpOpen: totalPtp,
            exposure: totalExposure.toString()
        });

        return {
            as_of_date: asOfDate,
            total_exposure: totalExposure,
            total_dso: avgDso,
            customers_on_hold: customersOnHold,
            total_disputes: totalDisputes,
            total_ptp: totalPtp,
            customers: customerDetails
        };
    }
}
