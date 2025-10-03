import { pool } from "@/lib/db";
import { ulid } from "ulid";
import { createHash } from "crypto";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import {
    arDunningPolicy,
    arDunningLog,
    commTemplate,
    arAgeSnapshot
} from "@aibos/adapters-db/schema";
import type {
    DunningPolicyUpsertType,
    TemplateUpsertType,
    DunningRunResultType
} from "@aibos/contracts";

// --- AR Dunning Service (M24) ---------------------------------------------------

export interface ArInvoice {
    id: string;
    customerId: string;
    customerName: string;
    invoiceNo: string;
    invoiceDate: string;
    dueDate: string;
    amount: number;
    currency: string;
    daysOverdue: number;
    bucket: string;
}

export interface DunningContext {
    companyId: string;
    customerId: string;
    customerName: string;
    invoices: ArInvoice[];
    totalDue: number;
    oldestDays: number;
    bucket: string;
}

export class ArDunningService {
    constructor(private db = pool) { }

    // Build aging buckets for all customers
    async buildAgingBuckets(companyId: string, asOfDate: string): Promise<Map<string, ArInvoice[]>> {
        const query = `
      WITH ar_aging AS (
        SELECT 
          jl.party_id as customer_id,
          jl.journal_id as invoice_id,
          j.posting_date,
          jl.amount,
          j.currency,
          j.source_id as invoice_no,
          j.source_doctype,
          CASE 
            WHEN j.posting_date >= $2::date - INTERVAL '30 days' THEN 'CURRENT'
            WHEN j.posting_date >= $2::date - INTERVAL '60 days' THEN '1-30'
            WHEN j.posting_date >= $2::date - INTERVAL '90 days' THEN '31-60'
            WHEN j.posting_date >= $2::date - INTERVAL '120 days' THEN '61-90'
            ELSE '90+'
          END as bucket,
          EXTRACT(DAYS FROM $2::date - j.posting_date)::int as days_overdue
        FROM journal_line jl
        JOIN journal j ON jl.journal_id = j.id
        WHERE j.company_id = $1
          AND jl.party_type = 'Customer'
          AND jl.dc = 'D'
          AND j.posting_date <= $2::date
          AND j.source_doctype IN ('Sales Invoice', 'AR Invoice')
      )
      SELECT 
        customer_id,
        invoice_id,
        posting_date::text as invoice_date,
        amount::numeric,
        currency,
        invoice_no,
        bucket,
        days_overdue,
        COALESCE(c.name, 'Unknown Customer') as customer_name
      FROM ar_aging a
      LEFT JOIN customer c ON a.customer_id = c.id
      ORDER BY customer_id, days_overdue DESC
    `;

        const { rows } = await this.db.query(query, [companyId, asOfDate]);

        const buckets = new Map<string, ArInvoice[]>();
        for (const row of rows) {
            const invoice: ArInvoice = {
                id: row.invoice_id,
                customerId: row.customer_id,
                customerName: row.customer_name,
                invoiceNo: row.invoice_no,
                invoiceDate: row.invoice_date,
                dueDate: row.invoice_date, // Simplified - would need proper due date logic
                amount: Number(row.amount),
                currency: row.currency,
                daysOverdue: row.days_overdue,
                bucket: row.bucket,
            };

            const key = `${row.customer_id}:${row.bucket}`;
            if (!buckets.has(key)) {
                buckets.set(key, []);
            }
            buckets.get(key)!.push(invoice);
        }

        return buckets;
    }

    // Get dunning policy for customer/bucket
    async getDunningPolicy(
        companyId: string,
        customerId: string,
        bucket: string
    ): Promise<DunningPolicyUpsertType[]> {
        // First try segment-specific policy, then fall back to default
        const policies = await this.db
            .select()
            .from(arDunningPolicy)
            .where(
                and(
                    eq(arDunningPolicy.companyId, companyId),
                    eq(arDunningPolicy.fromBucket, bucket)
                )
            )
            .orderBy(arDunningPolicy.stepIdx);

        return policies.map(p => ({
            policy_code: p.policyCode,
            segment: p.segment || undefined,
            from_bucket: p.fromBucket as any,
            step_idx: p.stepIdx,
            wait_days: p.waitDays,
            channel: p.channel as any,
            template_id: p.templateId,
            throttle_days: p.throttleDays,
        }));
    }

    // Check if step was already sent within throttle period
    async wasStepSentRecently(
        companyId: string,
        customerId: string,
        bucket: string,
        stepIdx: number,
        throttleDays: number
    ): Promise<boolean> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - throttleDays);

        const recent = await this.db
            .select({ id: arDunningLog.id })
            .from(arDunningLog)
            .where(
                and(
                    eq(arDunningLog.companyId, companyId),
                    eq(arDunningLog.customerId, customerId),
                    eq(arDunningLog.bucket, bucket),
                    eq(arDunningLog.stepIdx, stepIdx),
                    gte(arDunningLog.sentAt, cutoffDate)
                )
            )
            .limit(1);

        return recent.length > 0;
    }

    // Render template with handlebars variables
    async renderTemplate(
        templateId: string,
        context: DunningContext
    ): Promise<{ subject: string; body: string }> {
        const template = await this.db
            .select()
            .from(commTemplate)
            .where(eq(commTemplate.id, templateId))
            .limit(1);

        if (template.length === 0) {
            throw new Error(`Template ${templateId} not found`);
        }

        const t = template[0];

        // Simple handlebars-like replacement
        let subject = t.subject;
        let body = t.body;

        const vars = {
            '{{customer.name}}': context.customerName,
            '{{total_due}}': context.totalDue.toFixed(2),
            '{{invoice_count}}': context.invoices.length.toString(),
            '{{oldest_days}}': context.oldestDays.toString(),
            '{{bucket}}': context.bucket,
            '{{portal_url}}': `https://portal.example.com/ar/${context.customerId}`,
        };

        for (const [key, value] of Object.entries(vars)) {
            subject = subject.replace(new RegExp(key, 'g'), value);
            body = body.replace(new RegExp(key, 'g'), value);
        }

        return { subject, body };
    }

    // Send dunning communication
    async sendDunning(
        companyId: string,
        customerId: string,
        bucket: string,
        stepIdx: number,
        channel: 'EMAIL' | 'WEBHOOK',
        templateId: string,
        context: DunningContext
    ): Promise<void> {
        const { subject, body } = await this.renderTemplate(templateId, context);

        // Log the dunning attempt
        const logId = ulid();
        await this.db.insert(arDunningLog).values({
            id: logId,
            companyId,
            customerId,
            bucket,
            stepIdx,
            channel,
            templateId,
            status: 'sent',
        });

        // TODO: Integrate with actual email/webhook dispatcher
        console.log(`Dunning sent via ${channel}:`, {
            to: customerId,
            subject,
            body: body.substring(0, 100) + '...',
        });
    }

    // Run dunning process
    async runDunning(
        companyId: string,
        dryRun: boolean = true
    ): Promise<DunningRunResultType> {
        const runId = ulid();
        const asOfDate = new Date().toISOString().split('T')[0];

        let customersProcessed = 0;
        let emailsSent = 0;
        let webhooksSent = 0;
        let errors = 0;

        try {
            // Build aging buckets
            const buckets = await this.buildAgingBuckets(companyId, asOfDate);

            for (const [key, invoices] of buckets) {
                const [customerId, bucket] = key.split(':');
                customersProcessed++;

                // Get dunning policies for this bucket
                const policies = await this.getDunningPolicy(companyId, customerId, bucket);

                if (policies.length === 0) {
                    continue; // No policy defined for this bucket
                }

                // Build context
                const totalDue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
                const oldestDays = Math.max(...invoices.map(inv => inv.daysOverdue));
                const customerName = invoices[0]?.customerName || 'Unknown Customer';

                const context: DunningContext = {
                    companyId,
                    customerId,
                    customerName,
                    invoices,
                    totalDue,
                    oldestDays,
                    bucket,
                };

                // Process each policy step
                for (const policy of policies) {
                    try {
                        // Check throttle
                        const wasSent = await this.wasStepSentRecently(
                            companyId,
                            customerId,
                            bucket,
                            policy.step_idx,
                            policy.throttle_days
                        );

                        if (wasSent) {
                            continue; // Skip if sent recently
                        }

                        // Check wait days
                        if (policy.wait_days > 0) {
                            const waitDate = new Date();
                            waitDate.setDate(waitDate.getDate() - policy.wait_days);

                            const hasRecentInvoice = invoices.some(inv =>
                                new Date(inv.invoiceDate) > waitDate
                            );

                            if (hasRecentInvoice) {
                                continue; // Skip if invoice is too recent
                            }
                        }

                        if (!dryRun) {
                            await this.sendDunning(
                                companyId,
                                customerId,
                                bucket,
                                policy.step_idx,
                                policy.channel,
                                policy.template_id,
                                context
                            );
                        }

                        if (policy.channel === 'EMAIL') {
                            emailsSent++;
                        } else {
                            webhooksSent++;
                        }

                    } catch (error) {
                        console.error(`Error processing dunning step for ${customerId}:`, error);
                        errors++;
                    }
                }
            }

        } catch (error) {
            console.error('Error in dunning run:', error);
            throw error;
        }

        return {
            company_id: companyId,
            customers_processed: customersProcessed,
            emails_sent: emailsSent,
            webhooks_sent: webhooksSent,
            errors,
            dry_run: dryRun,
            run_id: runId,
        };
    }

    // Upsert dunning policy
    async upsertDunningPolicy(
        companyId: string,
        policy: DunningPolicyUpsertType,
        updatedBy: string
    ): Promise<void> {
        await this.db
            .insert(arDunningPolicy)
            .values({
                companyId,
                policyCode: policy.policy_code,
                segment: policy.segment || null,
                fromBucket: policy.from_bucket,
                stepIdx: policy.step_idx,
                waitDays: policy.wait_days,
                channel: policy.channel,
                templateId: policy.template_id,
                throttleDays: policy.throttle_days,
                updatedBy,
            })
            .onConflictDoUpdate({
                target: [arDunningPolicy.companyId, arDunningPolicy.policyCode, arDunningPolicy.fromBucket, arDunningPolicy.stepIdx],
                set: {
                    waitDays: policy.wait_days,
                    channel: policy.channel,
                    templateId: policy.template_id,
                    throttleDays: policy.throttle_days,
                    updatedBy,
                },
            });
    }

    // Upsert communication template
    async upsertTemplate(
        companyId: string,
        template: TemplateUpsertType,
        updatedBy: string
    ): Promise<string> {
        const id = template.id || ulid();

        await this.db
            .insert(commTemplate)
            .values({
                id,
                companyId,
                kind: template.kind,
                subject: template.subject,
                body: template.body,
                updatedBy,
            })
            .onConflictDoUpdate({
                target: commTemplate.id,
                set: {
                    kind: template.kind,
                    subject: template.subject,
                    body: template.body,
                    updatedBy,
                },
            });

        return id;
    }
}
