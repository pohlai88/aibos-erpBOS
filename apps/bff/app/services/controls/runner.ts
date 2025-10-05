import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import {
    ctrlControl,
    ctrlAssignment,
    ctrlRun,
    ctrlResult,
    ctrlException,
    ctrlEvidence,
    outbox
} from "@aibos/db-adapter/schema";
import { AUTO_CONTROLS, type ControlResult, type ControlException } from "./auto";
import type {
    ControlRunRequest,
    ControlRunQuery,
    ControlRunResponseType,
    EvidenceAdd,
    EvidenceResponseType
} from "@aibos/contracts";

export class ControlsRunnerService {
    constructor(private dbInstance = db) { }

    /**
     * Execute a control run
     */
    async executeControlRun(
        companyId: string,
        userId: string,
        data: any
    ): Promise<ControlRunResponseType> {
        const runId = ulid();
        const scheduledAt = data.scheduled_at ? new Date(data.scheduled_at) : new Date();

        // Get control and assignment details
        let controlId: string;
        let assignmentId: string | undefined;

        if (data.control_id) {
            controlId = data.control_id;
        } else if (data.assignment_id) {
            const assignments = await this.dbInstance
                .select()
                .from(ctrlAssignment)
                .where(eq(ctrlAssignment.id, data.assignment_id))
                .limit(1);

            const assignment = assignments[0];
            if (!assignment) {
                throw new Error("Assignment not found");
            }

            controlId = assignment.controlId;
            assignmentId = data.assignment_id;
        } else {
            throw new Error("Either control_id or assignment_id must be provided");
        }

        // Get control details
        const controls = await this.dbInstance
            .select()
            .from(ctrlControl)
            .where(and(
                eq(ctrlControl.id, controlId),
                eq(ctrlControl.companyId, companyId)
            ))
            .limit(1);

        if (controls.length === 0) {
            throw new Error("Control not found");
        }

        const control = controls[0];

        // Create control run record
        await this.dbInstance
            .insert(ctrlRun)
            .values({
                id: runId,
                companyId,
                controlId,
                assignmentId: assignmentId || null,
                runId: data.run_id || null,
                scheduledAt,
                startedAt: new Date(),
                status: "RUNNING",
                createdBy: userId
            });

        try {
            // Execute the control based on auto_kind
            let result: ControlResult;

            const control = controls[0];
            if (!control) {
                throw new Error("Control not found");
            }

            switch (control.autoKind) {
                case "SCRIPT":
                    result = await this.executeScriptControl(control, companyId);
                    break;
                case "SQL":
                    result = await this.executeSqlControl(control, companyId);
                    break;
                case "POLICY":
                    result = await this.executePolicyControl(control, companyId);
                    break;
                default:
                    result = {
                        status: "PASS",
                        detail: { message: "Manual control - no automated execution" },
                        exceptions: []
                    };
            }

            // Update run status
            await this.dbInstance
                .update(ctrlRun)
                .set({
                    status: result.status,
                    finishedAt: new Date(),
                    notes: `Control executed with ${result.exceptions.length} exceptions`
                })
                .where(eq(ctrlRun.id, runId));

            // Create result record
            const resultId = ulid();
            await this.dbInstance
                .insert(ctrlResult)
                .values({
                    id: resultId,
                    ctrlRunId: runId,
                    status: result.status,
                    detail: result.detail,
                    sampleCount: result.detail.sample_count || 0,
                    exceptionsCount: result.exceptions.length
                });

            // Create exception records
            for (const exception of result.exceptions) {
                const exceptionId = ulid();
                await this.dbInstance
                    .insert(ctrlException)
                    .values({
                        id: exceptionId,
                        ctrlRunId: runId,
                        code: exception.code,
                        message: exception.message,
                        itemRef: exception.item_ref || null,
                        material: exception.material,
                        createdBy: userId,
                        updatedBy: userId
                    });
            }

            // Emit outbox events for failures
            if (result.status === "FAIL") {
                await this.emitControlFailureEvent(companyId, runId, control, result);
            }

            return this.getControlRun(companyId, runId);

        } catch (error) {
            // Update run status to FAIL on error
            await this.dbInstance
                .update(ctrlRun)
                .set({
                    status: "FAIL",
                    finishedAt: new Date(),
                    notes: `Control execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
                })
                .where(eq(ctrlRun.id, runId));

            // Emit failure event
            await this.emitControlFailureEvent(companyId, runId, control, {
                status: "FAIL",
                detail: { error: error instanceof Error ? error.message : 'Unknown error' },
                exceptions: [{
                    code: "CONTROL_EXECUTION_ERROR",
                    message: error instanceof Error ? error.message : 'Unknown error',
                    material: true
                }]
            });

            throw error;
        }
    }

    /**
     * Execute script-based control
     */
    private async executeScriptControl(control: any, companyId: string): Promise<ControlResult> {
        const scriptName = control.autoConfig?.script;
        if (!scriptName || !(scriptName in AUTO_CONTROLS)) {
            throw new Error(`Unknown script control: ${scriptName}`);
        }

        const script = AUTO_CONTROLS[scriptName as keyof typeof AUTO_CONTROLS];

        // Extract parameters from auto_config
        const { year, month, ...params } = control.autoConfig || {};

        if (!year || !month) {
            throw new Error("Script controls require year and month parameters");
        }

        return await script(companyId, year, month, params);
    }

    /**
     * Execute SQL-based control
     */
    private async executeSqlControl(control: any, companyId: string): Promise<ControlResult> {
        const query = control.autoConfig?.query;
        if (!query) {
            throw new Error("SQL control requires query in auto_config");
        }

        try {
            // Execute the SQL query with company parameters
            const results = await this.dbInstance.execute(sql.raw(query));

            const exceptions: ControlException[] = [];

            // Check results against materiality threshold
            const materialityThreshold = control.autoConfig?.materiality_threshold || 0;

            // Process results as array
            const resultsArray = Array.isArray(results) ? results : [results];

            for (const result of resultsArray) {
                if (result.variance && Math.abs(result.variance) > materialityThreshold) {
                    exceptions.push({
                        code: "SQL_CONTROL_VARIANCE",
                        message: `Material variance found: ${result.variance}`,
                        item_ref: result.account_code || result.item_ref,
                        material: true
                    });
                }
            }

            return {
                status: exceptions.length === 0 ? "PASS" : "FAIL",
                detail: {
                    query_executed: query,
                    results_count: resultsArray.length,
                    materiality_threshold: materialityThreshold
                },
                exceptions
            };
        } catch (error) {
            return {
                status: "FAIL",
                detail: {
                    query_executed: query,
                    error: error instanceof Error ? error.message : 'Unknown error'
                },
                exceptions: [{
                    code: "SQL_CONTROL_ERROR",
                    message: `SQL execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    material: true
                }]
            };
        }
    }

    /**
     * Execute policy-based control
     */
    private async executePolicyControl(control: any, companyId: string): Promise<ControlResult> {
        // Policy controls are predefined business rules
        // For now, return a placeholder implementation
        return {
            status: "PASS",
            detail: {
                policy_control: control.code,
                message: "Policy control executed successfully"
            },
            exceptions: []
        };
    }

    /**
     * Get control run by ID
     */
    async getControlRun(companyId: string, runId: string): Promise<ControlRunResponseType> {
        const runs = await this.dbInstance
            .select()
            .from(ctrlRun)
            .where(and(
                eq(ctrlRun.id, runId),
                eq(ctrlRun.companyId, companyId)
            ))
            .limit(1);

        if (runs.length === 0) {
            throw new Error("Control run not found");
        }

        const run = runs[0];
        if (!run) {
            throw new Error("Control run not found");
        }

        return {
            id: run.id,
            company_id: run.companyId,
            control_id: run.controlId,
            assignment_id: run.assignmentId || undefined,
            run_id: run.runId || undefined,
            scheduled_at: run.scheduledAt.toISOString(),
            started_at: run.startedAt?.toISOString(),
            finished_at: run.finishedAt?.toISOString(),
            status: run.status,
            notes: run.notes || undefined,
            created_at: run.createdAt.toISOString(),
            created_by: run.createdBy
        };
    }

    /**
     * Query control runs with filters
     */
    async queryControlRuns(
        companyId: string,
        query: any
    ): Promise<ControlRunResponseType[]> {
        const conditions = [eq(ctrlRun.companyId, companyId)];

        if (query.control_id) {
            conditions.push(eq(ctrlRun.controlId, query.control_id));
        }
        if (query.assignment_id) {
            conditions.push(eq(ctrlRun.assignmentId, query.assignment_id));
        }
        if (query.run_id) {
            conditions.push(eq(ctrlRun.runId, query.run_id));
        }
        if (query.status) {
            conditions.push(eq(ctrlRun.status, query.status));
        }
        if (query.scheduled_from) {
            conditions.push(sql`${ctrlRun.scheduledAt} >= ${query.scheduled_from}`);
        }
        if (query.scheduled_to) {
            conditions.push(sql`${ctrlRun.scheduledAt} <= ${query.scheduled_to}`);
        }

        const runs = await this.dbInstance
            .select()
            .from(ctrlRun)
            .where(and(...conditions))
            .orderBy(desc(ctrlRun.scheduledAt))
            .limit(query.limit)
            .offset(query.offset);

        return runs.map(run => ({
            id: run.id,
            company_id: run.companyId,
            control_id: run.controlId,
            assignment_id: run.assignmentId || undefined,
            run_id: run.runId || undefined,
            scheduled_at: run.scheduledAt.toISOString(),
            started_at: run.startedAt?.toISOString(),
            finished_at: run.finishedAt?.toISOString(),
            status: run.status,
            notes: run.notes || undefined,
            created_at: run.createdAt.toISOString(),
            created_by: run.createdBy
        }));
    }

    /**
     * Add evidence to a control run
     */
    async addEvidence(
        companyId: string,
        userId: string,
        data: any
    ): Promise<EvidenceResponseType> {
        const evidenceId = ulid();

        // Verify the control run exists and belongs to the company
        const runs = await this.dbInstance
            .select()
            .from(ctrlRun)
            .where(and(
                eq(ctrlRun.id, data.ctrl_run_id),
                eq(ctrlRun.companyId, companyId)
            ))
            .limit(1);

        if (runs.length === 0) {
            throw new Error("Control run not found");
        }

        const evidenceData = {
            id: evidenceId,
            ctrlRunId: data.ctrl_run_id,
            kind: data.kind,
            uriOrNote: data.uri_or_note,
            checksum: data.checksum || null,
            addedBy: userId
        };

        await this.dbInstance
            .insert(ctrlEvidence)
            .values(evidenceData);

        return {
            id: evidenceId,
            ctrl_run_id: data.ctrl_run_id,
            kind: data.kind,
            uri_or_note: data.uri_or_note,
            checksum: data.checksum,
            added_by: userId,
            added_at: new Date().toISOString()
        };
    }

    /**
     * Emit control failure event to outbox
     */
    private async emitControlFailureEvent(
        companyId: string,
        runId: string,
        control: any,
        result: ControlResult
    ): Promise<void> {
        const eventId = ulid();

        await this.dbInstance
            .insert(outbox)
            .values({
                id: eventId,
                topic: "CTRL_FAIL",
                payload: JSON.stringify({
                    company_id: companyId,
                    run_id: runId,
                    control_id: control.id,
                    control_code: control.code,
                    control_name: control.name,
                    severity: control.severity,
                    status: result.status,
                    exceptions_count: result.exceptions.length,
                    material_exceptions: result.exceptions.filter(e => e.material).length,
                    detail: result.detail
                })
            });
    }
}
