import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import {
    arDunningPolicy,
    arDunningLog,
    commTemplate,
    arAgeSnapshot
} from "@aibos/db-adapter/schema";
import type {
    DunningPolicyUpsertType,
    TemplateUpsertType,
    DunningRunResultType
} from "@aibos/contracts";
import type { ArInvoice, DunningContext, DunningRunResult } from "./types";

export class ArDunningService {
    constructor(private dbInstance = db) { }

    /**
     * Run dunning process for all customers
     */
    async runDunning(
        companyId: string,
        dryRun: boolean = true
    ): Promise<DunningRunResultType> {
        const runId = ulid();
        const asOfDate = new Date().toISOString().split('T')[0]!;

        let customersProcessed = 0;
        let emailsSent = 0;
        let webhooksSent = 0;
        let errors = 0;

        try {
            // Build aging buckets
            const buckets = await this.buildAgingBuckets(companyId, asOfDate);

            for (const [key, invoices] of buckets) {
                const parts = key.split(':');
                const customerId = parts[0];
                const bucket = parts[1];

                if (!customerId || !bucket) {
                    continue;
                }
                customersProcessed++;

                // Get dunning policies for this bucket
                const policies = await this.getDunningPolicy(companyId, customerId, bucket);

                if (policies.length === 0) {
                    continue; // No policy defined for this bucket
                }

                // Build context
                const totalDue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
                const oldestDays = Math.max(...invoices.map(inv => inv.daysOverdue));
                const customerName: string = invoices[0]?.customerName || 'Unknown Customer';

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
                            continue; // Skip if recently sent
                        }

                        // Check if invoice is too recent for this step
                        if (policy.wait_days > 0) {
                            const cutoffDate = new Date();
                            cutoffDate.setDate(cutoffDate.getDate() - policy.wait_days);

                            const hasRecentInvoice = invoices.some(inv => {
                                const invoiceDate = new Date(inv.invoiceDate);
                                return invoiceDate > cutoffDate;
                            });

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

                            if (policy.channel === 'EMAIL') {
                                emailsSent++;
                            } else if (policy.channel === 'WEBHOOK') {
                                webhooksSent++;
                            }
                        }
                    } catch (error) {
                        console.error(`Error processing policy step:`, error);
                        errors++;
                    }
                }
            }
        } catch (error) {
            console.error('Dunning run failed:', error);
            errors++;
        }

        return {
            run_id: runId,
            company_id: companyId,
            customers_processed: customersProcessed,
            emails_sent: emailsSent,
            webhooks_sent: webhooksSent,
            errors,
            dry_run: dryRun
        };
    }

    /**
     * Build aging buckets for all customers
     */
    async buildAgingBuckets(companyId: string, asOfDate: string): Promise<Map<string, ArInvoice[]>> {
        // For now, return empty buckets since we don't have journal data
        // In production, this would query the database for open invoices
        const buckets = new Map<string, ArInvoice[]>();
        return buckets;
    }

    /**
     * Get dunning policies for a customer/bucket combination
     */
    async getDunningPolicy(
        companyId: string,
        customerId: string,
        bucket: string
    ): Promise<DunningPolicyUpsertType[]> {
        const policies = await this.dbInstance
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

    /**
     * Check if a dunning step was sent recently
     */
    async wasStepSentRecently(
        companyId: string,
        customerId: string,
        bucket: string,
        stepIdx: number,
        throttleDays: number
    ): Promise<boolean> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - throttleDays);

        const recent = await this.dbInstance
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

    /**
     * Send dunning communication
     */
    async sendDunning(
        companyId: string,
        customerId: string,
        bucket: string,
        stepIdx: number,
        channel: string,
        templateId: string,
        context: DunningContext
    ): Promise<void> {
        const { subject, body } = await this.renderTemplate(templateId, context);

        // Log the dunning attempt
        const logId = ulid();
        await this.dbInstance.insert(arDunningLog).values({
            id: logId,
            companyId,
            customerId,
            bucket,
            stepIdx,
            channel,
            templateId,
            status: 'sent',
        });

        // In production, this would actually send the email/webhook
        console.log(`Sending ${channel} dunning:`, { subject, body });
    }

    /**
     * Render template with context variables
     */
    async renderTemplate(templateId: string, context: DunningContext): Promise<{ subject: string; body: string }> {
        const template = await this.dbInstance
            .select()
            .from(commTemplate)
            .where(eq(commTemplate.id, templateId))
            .limit(1);

        if (template.length === 0) {
            throw new Error(`Template ${templateId} not found`);
        }

        const t = template[0]!;

        // Simple handlebars-like replacement
        let subject = t.subject;
        let body = t.body;

        const vars = {
            '{{customer.name}}': context.customerName,
            '{{total_due}}': context.totalDue.toFixed(2),
            '{{invoice_count}}': context.invoices.length.toString(),
            '{{oldest_days}}': context.oldestDays.toString(),
            '{{bucket}}': context.bucket,
        };

        for (const [key, value] of Object.entries(vars)) {
            subject = subject.replace(new RegExp(key, 'g'), value);
            body = body.replace(new RegExp(key, 'g'), value);
        }

        return { subject, body };
    }

    /**
     * Get all dunning policies for company
     */
    async getAllDunningPolicies(companyId: string): Promise<DunningPolicyUpsertType[]> {
        const policies = await this.dbInstance
            .select()
            .from(arDunningPolicy)
            .where(eq(arDunningPolicy.companyId, companyId))
            .orderBy(arDunningPolicy.policyCode, arDunningPolicy.fromBucket, arDunningPolicy.stepIdx);

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

    /**
     * Upsert a dunning policy
     */
    async upsertDunningPolicy(
        companyId: string,
        policy: DunningPolicyUpsertType,
        createdBy: string
    ): Promise<void> {
        const policyId = ulid();

        await this.dbInstance.insert(arDunningPolicy).values({
            companyId,
            policyCode: policy.policy_code,
            segment: policy.segment || null,
            fromBucket: policy.from_bucket,
            stepIdx: policy.step_idx,
            waitDays: policy.wait_days,
            channel: policy.channel,
            templateId: policy.template_id,
            throttleDays: policy.throttle_days || 3,
            updatedBy: createdBy,
        } as any);
    }

    /**
     * Upsert a communication template
     */
    async upsertTemplate(
        companyId: string,
        template: TemplateUpsertType,
        createdBy: string
    ): Promise<string> {
        const templateId = ulid();

        await this.dbInstance.insert(commTemplate).values({
            id: templateId,
            companyId,
            kind: template.kind,
            subject: template.subject,
            body: template.body,
            updatedBy: createdBy,
        });

        return templateId;
    }

    /**
     * Get all communication templates for company
     */
    async getAllTemplates(companyId: string): Promise<TemplateUpsertType[]> {
        const templates = await this.dbInstance
            .select()
            .from(commTemplate)
            .where(eq(commTemplate.companyId, companyId))
            .orderBy(commTemplate.kind, commTemplate.id);

        return templates.map((t: any) => ({
            kind: t.kind,
            subject: t.subject,
            body: t.body,
        }));
    }
}