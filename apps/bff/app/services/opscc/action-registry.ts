import { z } from "zod";
import type { ActionDescriptorM27_2 } from "@aibos/contracts";

/**
 * M27.2: Action Registry
 * 
 * Declarative map of safe actions with schemas & inverse actions
 * Wired to existing M22/M23/M24/M25/M26/M27.1 actions with safety guards
 */
export class ActionRegistry {
    private actions: Map<string, ActionDescriptorM27_2> = new Map();

    constructor() {
        this.registerDefaultActions();
    }

    /**
     * Register a new action
     */
    registerAction(descriptor: ActionDescriptorM27_2): void {
        this.actions.set(descriptor.code, descriptor);
    }

    /**
     * Get action descriptor by code
     */
    getAction(code: string): ActionDescriptorM27_2 | undefined {
        return this.actions.get(code);
    }

    /**
     * List all registered actions
     */
    listActions(): ActionDescriptorM27_2[] {
        return Array.from(this.actions.values());
    }

    /**
     * Validate action input against schema
     */
    validateInput(code: string, input: any): { valid: boolean; errors: string[] } {
        const action = this.getAction(code);
        if (!action) {
            return { valid: false, errors: [`Action ${code} not found`] };
        }

        try {
            action.inputSchema.parse(input);
            return { valid: true, errors: [] };
        } catch (error) {
            if (error instanceof z.ZodError) {
                return {
                    valid: false,
                    errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
                };
            }
            return { valid: false, errors: ['Unknown validation error'] };
        }
    }

    /**
     * Execute an action (placeholder - would call actual service)
     */
    async executeAction(
        code: string,
        input: any,
        context: { companyId: string; userId: string; dryRun?: boolean }
    ): Promise<{ output: any; metrics: any }> {
        const action = this.getAction(code);
        if (!action) {
            throw new Error(`Action ${code} not found`);
        }

        // Validate input
        const validation = this.validateInput(code, input);
        if (!validation.valid) {
            throw new Error(`Invalid input: ${validation.errors.join(', ')}`);
        }

        // Check if action is dry-run only
        if (!context.dryRun && action.dryRunOnly) {
            throw new Error(`Action ${code} is dry-run only`);
        }

        // Execute action (placeholder implementation)
        return await this.executeActionInternal(action, input, context);
    }

    /**
     * Get inverse action for rollback
     */
    getInverseAction(code: string, stepOutput: any): ActionDescriptorM27_2 | undefined {
        const action = this.getAction(code);
        if (!action?.inverse) {
            return undefined;
        }

        const inverseCode = action.inverse.code;
        const inverseAction = this.getAction(inverseCode);

        if (!inverseAction) {
            return undefined;
        }

        // Derive input for inverse action
        const inverseInput = action.inverse.deriveInput
            ? action.inverse.deriveInput(stepOutput)
            : stepOutput;

        return {
            ...inverseAction,
            inputSchema: inverseAction.inputSchema
        };
    }

    private async executeActionInternal(
        action: ActionDescriptorM27_2,
        input: any,
        context: { companyId: string; userId: string; dryRun?: boolean }
    ): Promise<{ output: any; metrics: any }> {
        // This is a placeholder implementation
        // In production, this would call the actual service methods

        const startTime = Date.now();

        try {
            let output: any;
            let metrics: any = {};

            // Route to appropriate service based on action code
            if (action.code.startsWith('payments.')) {
                output = await this.executePaymentAction(action.code, input, context);
            } else if (action.code.startsWith('ar.')) {
                output = await this.executeArAction(action.code, input, context);
            } else if (action.code.startsWith('fx.')) {
                output = await this.executeFxAction(action.code, input, context);
            } else if (action.code.startsWith('alloc.')) {
                output = await this.executeAllocAction(action.code, input, context);
            } else if (action.code.startsWith('rev.')) {
                output = await this.executeRevenueAction(action.code, input, context);
            } else if (action.code.startsWith('ctrl.')) {
                output = await this.executeControlAction(action.code, input, context);
            } else if (action.code.startsWith('insights.')) {
                output = await this.executeInsightsAction(action.code, input, context);
            } else if (action.code.startsWith('cash.')) {
                output = await this.executeCashAction(action.code, input, context);
            } else {
                throw new Error(`Unknown action category: ${action.code}`);
            }

            const duration = Date.now() - startTime;
            metrics = {
                duration_ms: duration,
                entities_affected: this.countAffectedEntities(output),
                success: true
            };

            return { output, metrics };
        } catch (error) {
            const duration = Date.now() - startTime;
            return {
                output: null,
                metrics: {
                    duration_ms: duration,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }

    private async executePaymentAction(code: string, input: any, context: any): Promise<any> {
        // M23: Payments actions
        switch (code) {
            case 'payments.run.select':
                return { selected_payments: [], count: 0 };
            case 'payments.run.approve':
                return { approved_payments: [], count: 0 };
            case 'payments.run.export':
                return { export_id: 'exp_123', file_url: '/exports/payments.csv' };
            case 'payments.run.dispatch':
                return { dispatched_payments: [], count: 0 };
            default:
                throw new Error(`Unknown payment action: ${code}`);
        }
    }

    private async executeArAction(code: string, input: any, context: any): Promise<any> {
        // M24: AR actions
        switch (code) {
            case 'ar.dunning.run':
                return { dunning_letters_sent: [], count: 0 };
            case 'ar.cashapp.run':
                return { cash_applied: [], amount: 0 };
            default:
                throw new Error(`Unknown AR action: ${code}`);
        }
    }

    private async executeFxAction(code: string, input: any, context: any): Promise<any> {
        // M18: FX actions
        switch (code) {
            case 'fx.revalue.run':
                return { revalued_accounts: [], total_delta: 0 };
            default:
                throw new Error(`Unknown FX action: ${code}`);
        }
    }

    private async executeAllocAction(code: string, input: any, context: any): Promise<any> {
        // M19: Allocation actions
        switch (code) {
            case 'alloc.run':
                return { allocated_amounts: [], total_allocated: 0 };
            default:
                throw new Error(`Unknown allocation action: ${code}`);
        }
    }

    private async executeRevenueAction(code: string, input: any, context: any): Promise<any> {
        // M25: Revenue actions
        switch (code) {
            case 'rev.recognize.run':
                return { recognized_revenue: [], amount: 0 };
            default:
                throw new Error(`Unknown revenue action: ${code}`);
        }
    }

    private async executeControlAction(code: string, input: any, context: any): Promise<any> {
        // M26.1: Control actions
        switch (code) {
            case 'ctrl.execute':
                return { executed_controls: [], passed: 0, failed: 0 };
            default:
                throw new Error(`Unknown control action: ${code}`);
        }
    }

    private async executeInsightsAction(code: string, input: any, context: any): Promise<any> {
        // M26.2: Insights actions
        switch (code) {
            case 'insights.harvest':
                return { harvested_metrics: [], count: 0 };
            default:
                throw new Error(`Unknown insights action: ${code}`);
        }
    }

    private async executeCashAction(code: string, input: any, context: any): Promise<any> {
        // M22: Cash actions
        switch (code) {
            case 'cash.alerts.run':
                return { alerts_generated: [], count: 0 };
            default:
                throw new Error(`Unknown cash action: ${code}`);
        }
    }

    private countAffectedEntities(output: any): number {
        if (!output) return 0;

        if (Array.isArray(output)) {
            return output.length;
        }

        if (typeof output === 'object') {
            if (output.count !== undefined) {
                return output.count;
            }
            if (output.entities && Array.isArray(output.entities)) {
                return output.entities.length;
            }
        }

        return 1;
    }

    private registerDefaultActions(): void {
        // M22: Cash Flow Actions
        this.registerAction({
            code: 'cash.alerts.run',
            inputSchema: z.object({
                scenario: z.string(),
                company_ids: z.array(z.string()).optional()
            }),
            effect: 'write:alerts',
            dryRunOnly: false,
            defaultGuards: {
                maxEntities: 50
            }
        });

        // M23: Payments Actions
        this.registerAction({
            code: 'payments.run.select',
            inputSchema: z.object({
                vendor_ids: z.array(z.string()).optional(),
                amount_min: z.number().optional(),
                amount_max: z.number().optional()
            }),
            effect: 'read',
            dryRunOnly: false
        });

        this.registerAction({
            code: 'payments.run.approve',
            inputSchema: z.object({
                payment_ids: z.array(z.string())
            }),
            effect: 'write:payments',
            dryRunOnly: false,
            defaultGuards: {
                maxEntities: 100
            }
        });

        this.registerAction({
            code: 'payments.run.export',
            inputSchema: z.object({
                format: z.enum(['csv', 'xlsx']),
                filters: z.record(z.any()).optional()
            }),
            effect: 'read',
            dryRunOnly: false
        });

        this.registerAction({
            code: 'payments.run.dispatch',
            inputSchema: z.object({
                run_id: z.string(),
                dry_run: z.boolean().default(false)
            }),
            effect: 'write:payments',
            dryRunOnly: false,
            defaultGuards: {
                maxEntities: 50
            },
            inverse: {
                code: 'payments.run.reverse',
                deriveInput: (output: any) => ({ payment_ids: output.dispatched_payments })
            }
        });

        // M18: FX Actions
        this.registerAction({
            code: 'fx.revalue.run',
            inputSchema: z.object({
                company_id: z.string(),
                year: z.number(),
                month: z.number(),
                dry_run: z.boolean().default(true)
            }),
            effect: 'write:journals',
            dryRunOnly: true, // Default to dry-run unless capability present
            defaultGuards: {
                canaryRequired: true
            }
        });

        // M24: AR Actions
        this.registerAction({
            code: 'ar.dunning.run',
            inputSchema: z.object({
                customer_ids: z.array(z.string()).optional(),
                template_id: z.string().optional()
            }),
            effect: 'write:alerts',
            dryRunOnly: false,
            defaultGuards: {
                maxEntities: 200
            }
        });

        this.registerAction({
            code: 'ar.cashapp.run',
            inputSchema: z.object({
                payment_ids: z.array(z.string()),
                invoice_ids: z.array(z.string())
            }),
            effect: 'write:journals',
            dryRunOnly: false,
            defaultGuards: {
                maxEntities: 100
            }
        });

        // M19: Allocation Actions
        this.registerAction({
            code: 'alloc.run',
            inputSchema: z.object({
                allocation_rule_id: z.string(),
                period: z.string()
            }),
            effect: 'write:journals',
            dryRunOnly: false,
            defaultGuards: {
                canaryRequired: true,
                maxEntities: 50
            }
        });

        // M25: Revenue Actions
        this.registerAction({
            code: 'rev.recognize.run',
            inputSchema: z.object({
                contract_ids: z.array(z.string()),
                recognition_date: z.string()
            }),
            effect: 'write:journals',
            dryRunOnly: true, // Default to dry-run unless capability present
            defaultGuards: {
                maxEntities: 25
            }
        });

        // M26.1: Control Actions
        this.registerAction({
            code: 'ctrl.execute',
            inputSchema: z.object({
                control_ids: z.array(z.string()),
                test_period: z.string()
            }),
            effect: 'read',
            dryRunOnly: false
        });

        // M26.2: Insights Actions
        this.registerAction({
            code: 'insights.harvest',
            inputSchema: z.object({
                metric_types: z.array(z.string()),
                date_range: z.object({
                    from: z.string(),
                    to: z.string()
                })
            }),
            effect: 'read',
            dryRunOnly: false
        });
    }
}
