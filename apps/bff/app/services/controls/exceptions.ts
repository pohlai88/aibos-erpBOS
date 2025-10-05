import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, asc, sql, gte, lte } from "drizzle-orm";
import {
    ctrlException,
    ctrlRun,
    ctrlControl,
    outbox
} from "@aibos/db-adapter/schema";
import type {
    ExceptionUpdate,
    ExceptionQuery,
    ExceptionResponseType
} from "@aibos/contracts";

export class ControlsExceptionsService {
    constructor(private dbInstance = db) { }

    /**
     * Update exception remediation state
     */
    async updateException(
        companyId: string,
        userId: string,
        data: any
    ): Promise<ExceptionResponseType> {
        // Verify the exception exists and belongs to a control run for this company
        const exceptions = await this.dbInstance
            .select({
                exception: ctrlException,
                run: ctrlRun
            })
            .from(ctrlException)
            .innerJoin(ctrlRun, eq(ctrlException.ctrlRunId, ctrlRun.id))
            .where(and(
                eq(ctrlException.id, data.id),
                eq(ctrlRun.companyId, companyId)
            ))
            .limit(1);

        if (exceptions.length === 0) {
            throw new Error("Exception not found");
        }

        const exception = exceptions[0]?.exception;
        if (!exception) {
            throw new Error("Exception not found");
        }

        // Update the exception
        const updateData: any = {
            remediationState: data.remediation_state,
            updatedAt: new Date(),
            updatedBy: userId
        };

        if (data.assignee !== undefined) {
            updateData.assignee = data.assignee;
        }
        if (data.due_at !== undefined) {
            updateData.dueAt = data.due_at ? new Date(data.due_at) : null;
        }
        if (data.resolution_note !== undefined) {
            updateData.resolutionNote = data.resolution_note;
        }

        // Set resolved_at timestamp if transitioning to RESOLVED
        if (data.remediation_state === "RESOLVED" && exception.remediationState !== "RESOLVED") {
            updateData.resolvedAt = new Date();
        }

        await this.dbInstance
            .update(ctrlException)
            .set(updateData)
            .where(eq(ctrlException.id, data.id));

        // Emit outbox event for resolution
        if (data.remediation_state === "RESOLVED") {
            await this.emitExceptionResolvedEvent(companyId, exception, userId);
        }

        return this.getException(companyId, data.id);
    }

    /**
     * Get exception by ID
     */
    async getException(companyId: string, exceptionId: string): Promise<ExceptionResponseType> {
        const exceptions = await this.dbInstance
            .select({
                exception: ctrlException,
                run: ctrlRun
            })
            .from(ctrlException)
            .innerJoin(ctrlRun, eq(ctrlException.ctrlRunId, ctrlRun.id))
            .where(and(
                eq(ctrlException.id, exceptionId),
                eq(ctrlRun.companyId, companyId)
            ))
            .limit(1);

        if (exceptions.length === 0) {
            throw new Error("Exception not found");
        }

        const exception = exceptions[0]?.exception;
        if (!exception) {
            throw new Error("Exception not found");
        }
        return {
            id: exception.id,
            ctrl_run_id: exception.ctrlRunId,
            code: exception.code,
            message: exception.message,
            item_ref: exception.itemRef || undefined,
            material: exception.material,
            remediation_state: exception.remediationState,
            assignee: exception.assignee || undefined,
            due_at: exception.dueAt?.toISOString(),
            resolved_at: exception.resolvedAt?.toISOString(),
            resolution_note: exception.resolutionNote || undefined,
            created_at: exception.createdAt.toISOString(),
            created_by: exception.createdBy,
            updated_at: exception.updatedAt.toISOString(),
            updated_by: exception.updatedBy
        };
    }

    /**
     * Query exceptions with filters
     */
    async queryExceptions(
        companyId: string,
        query: any
    ): Promise<ExceptionResponseType[]> {
        const conditions = [eq(ctrlRun.companyId, companyId)];

        if (query.ctrl_run_id) {
            conditions.push(eq(ctrlException.ctrlRunId, query.ctrl_run_id));
        }
        if (query.remediation_state) {
            conditions.push(eq(ctrlException.remediationState, query.remediation_state));
        }
        if (query.material !== undefined) {
            conditions.push(eq(ctrlException.material, query.material));
        }
        if (query.assignee) {
            conditions.push(eq(ctrlException.assignee, query.assignee));
        }
        if (query.sla_breach) {
            conditions.push(sql`${ctrlException.dueAt} < NOW()`);
        }

        const exceptions = await this.dbInstance
            .select({
                exception: ctrlException,
                run: ctrlRun
            })
            .from(ctrlException)
            .innerJoin(ctrlRun, eq(ctrlException.ctrlRunId, ctrlRun.id))
            .where(and(...conditions))
            .orderBy(desc(ctrlException.createdAt))
            .limit(query.limit)
            .offset(query.offset);

        return exceptions.map(({ exception }) => ({
            id: exception.id,
            code: exception.code,
            message: exception.message,
            updated_at: exception.updatedAt.toISOString(),
            updated_by: exception.updatedBy,
            created_at: exception.createdAt.toISOString(),
            created_by: exception.createdBy,
            material: exception.material,
            remediation_state: exception.remediationState,
            ctrl_run_id: exception.ctrlRunId,
            resolved_at: exception.resolvedAt?.toISOString(),
            assignee: exception.assignee || undefined,
            due_at: exception.dueAt?.toISOString(),
            resolution_note: exception.resolutionNote || undefined,
            item_ref: exception.itemRef || undefined
        }));
    }

    /**
     * Get open exceptions summary for dashboard
     */
    async getOpenExceptionsSummary(companyId: string): Promise<{
        total_open: number;
        material_open: number;
        sla_breaches: number;
        by_remediation_state: Record<string, number>;
        by_severity: Record<string, number>;
    }> {
        const summary = await this.dbInstance.execute(sql`
            SELECT 
                COUNT(*) as total_open,
                COUNT(CASE WHEN e.material = true THEN 1 END) as material_open,
                COUNT(CASE WHEN e.due_at < NOW() THEN 1 END) as sla_breaches,
                COUNT(CASE WHEN e.remediation_state = 'OPEN' THEN 1 END) as open_count,
                COUNT(CASE WHEN e.remediation_state = 'IN_PROGRESS' THEN 1 END) as in_progress_count,
                COUNT(CASE WHEN e.remediation_state = 'RESOLVED' THEN 1 END) as resolved_count,
                COUNT(CASE WHEN e.remediation_state = 'WAIVED' THEN 1 END) as waived_count
            FROM ctrl_exception e
            JOIN ctrl_run r ON e.ctrl_run_id = r.id
            JOIN ctrl_control c ON r.control_id = c.id
            WHERE r.company_id = ${companyId}
            AND e.remediation_state IN ('OPEN', 'IN_PROGRESS')
        `);

        const severitySummary = await this.dbInstance.execute(sql`
            SELECT 
                c.severity,
                COUNT(*) as count
            FROM ctrl_exception e
            JOIN ctrl_run r ON e.ctrl_run_id = r.id
            JOIN ctrl_control c ON r.control_id = c.id
            WHERE r.company_id = ${companyId}
            AND e.remediation_state IN ('OPEN', 'IN_PROGRESS')
            GROUP BY c.severity
        `);

        const result = summary.rows[0] as any;
        if (!result) {
            return {
                total_open: 0,
                material_open: 0,
                sla_breaches: 0,
                by_remediation_state: {},
                by_severity: {}
            };
        }
        const severityCounts: Record<string, number> = {};

        // Process severity summary results
        if (Array.isArray(severitySummary)) {
            for (const severity of severitySummary) {
                severityCounts[severity.severity] = severity.count;
            }
        }

        return {
            total_open: result?.total_open || 0,
            material_open: result?.material_open || 0,
            sla_breaches: result?.sla_breaches || 0,
            by_remediation_state: {
                OPEN: result?.open_count || 0,
                IN_PROGRESS: result?.in_progress_count || 0,
                RESOLVED: result?.resolved_count || 0,
                WAIVED: result?.waived_count || 0
            },
            by_severity: severityCounts
        };
    }

    /**
     * Escalate aging exceptions
     */
    async escalateAgingExceptions(companyId: string, daysThreshold: number = 7): Promise<number> {
        const agingExceptions = await this.dbInstance.execute(sql`
            SELECT e.id, e.code, e.message, e.created_at, c.severity
            FROM ctrl_exception e
            JOIN ctrl_run r ON e.ctrl_run_id = r.id
            JOIN ctrl_control c ON r.control_id = c.id
            WHERE r.company_id = ${companyId}
            AND e.remediation_state = 'OPEN'
            AND e.created_at < NOW() - INTERVAL '${daysThreshold} days'
        `);

        let escalatedCount = 0;

        // Process aging exceptions as array
        const agingArray = Array.isArray(agingExceptions) ? agingExceptions : [agingExceptions];

        for (const exception of agingArray) {
            // Emit escalation event
            await this.emitExceptionEscalatedEvent(companyId, exception);
            escalatedCount++;
        }

        return escalatedCount;
    }

    /**
     * Emit exception resolved event to outbox
     */
    private async emitExceptionResolvedEvent(
        companyId: string,
        exception: any,
        resolvedBy: string
    ): Promise<void> {
        const eventId = ulid();

        await this.dbInstance
            .insert(outbox)
            .values({
                id: eventId,
                topic: "EXCEPTION_RESOLVED",
                payload: JSON.stringify({
                    company_id: companyId,
                    exception_id: exception.id,
                    exception_code: exception.code,
                    exception_message: exception.message,
                    material: exception.material,
                    resolved_by: resolvedBy,
                    resolved_at: new Date().toISOString()
                })
            });
    }

    /**
     * Emit exception escalated event to outbox
     */
    private async emitExceptionEscalatedEvent(
        companyId: string,
        exception: any
    ): Promise<void> {
        const eventId = ulid();

        await this.dbInstance
            .insert(outbox)
            .values({
                id: eventId,
                topic: "EXCEPTION_ESCALATED",
                payload: JSON.stringify({
                    company_id: companyId,
                    exception_id: exception.id,
                    exception_code: exception.code,
                    exception_message: exception.message,
                    severity: exception.severity,
                    created_at: exception.created_at,
                    escalated_at: new Date().toISOString()
                })
            });
    }
}
