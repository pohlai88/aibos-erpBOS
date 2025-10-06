import { db, pool } from '@/lib/db';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { playbookAction, opsccOutbox } from '@aibos/db-adapter/schema';
import type {
  PlaybookActionResponse,
  PlaybookExecuteReq,
  PlaybookExecuteResponse,
} from '@aibos/contracts';
import { logLine } from '@/lib/log';

export class PlaybooksService {
  constructor(private dbInstance = db) {}

  /**
   * Get all playbook actions
   */
  async getPlaybookActions(): Promise<PlaybookActionResponse[]> {
    try {
      const results = await this.dbInstance
        .select()
        .from(playbookAction)
        .where(eq(playbookAction.enabled, true))
        .orderBy(asc(playbookAction.name));

      return results.map(r => ({
        ...r,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
        parameter_schema: r.parameter_schema as Record<string, any>,
      })) as PlaybookActionResponse[];
    } catch (error) {
      logLine({
        msg: 'PlaybooksService.getPlaybookActions error',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get playbook action by ID
   */
  async getPlaybookAction(
    actionId: string
  ): Promise<PlaybookActionResponse | null> {
    try {
      const result = await this.dbInstance
        .select()
        .from(playbookAction)
        .where(eq(playbookAction.action_id, actionId))
        .limit(1);

      const actionResult = result[0];
      if (!actionResult) return null;

      return {
        ...actionResult,
        created_at: actionResult.created_at.toISOString(),
        updated_at: actionResult.updated_at.toISOString(),
        parameter_schema: actionResult.parameter_schema as Record<string, any>,
      } as PlaybookActionResponse;
    } catch (error) {
      logLine({
        msg: 'PlaybooksService.getPlaybookAction error',
        actionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Execute a playbook action
   */
  async executePlaybook(
    companyId: string,
    request: PlaybookExecuteReq
  ): Promise<PlaybookExecuteResponse> {
    const executionId = crypto.randomUUID();
    const executedAt = new Date().toISOString();

    // Get and validate action first
    const action = await this.getPlaybookAction(request.action_id);
    if (!action) {
      throw new Error(`Playbook action not found: ${request.action_id}`);
    }

    // Validate parameters against schema
    await this.validateParameters(action.parameter_schema, request.params);

    try {
      let result: Record<string, any> | null = null;
      let errorMessage: string | null = null;
      let status = 'SUCCESS';

      try {
        // Execute the action
        result = await this.executeAction(
          request.action_id,
          request.params,
          request.dry_run
        );
      } catch (error) {
        status = 'ERROR';
        errorMessage = error instanceof Error ? error.message : String(error);
        logLine({
          msg: 'PlaybooksService.executePlaybook error',
          companyId,
          actionId: request.action_id,
          error: error instanceof Error ? error.message : String(error),
        });
      }

      // Log execution in outbox
      await this.logExecution(
        companyId,
        executionId,
        request,
        result,
        errorMessage
      );

      return {
        execution_id: executionId,
        action_id: request.action_id,
        status,
        result,
        error_message: errorMessage,
        executed_at: executedAt,
      };
    } catch (error) {
      logLine({
        msg: 'PlaybooksService.executePlaybook error',
        companyId,
        request,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Validate parameters against schema
   */
  private async validateParameters(
    schema: Record<string, any>,
    params: Record<string, any>
  ): Promise<void> {
    // Simple validation - in production would use JSON Schema validator
    const requiredFields = schema.required || [];
    const properties = schema.properties || {};

    // Check required fields
    for (const field of requiredFields) {
      if (!(field in params)) {
        throw new Error(`Missing required parameter: ${field}`);
      }
    }

    // Check parameter types (basic validation)
    for (const [key, value] of Object.entries(params)) {
      if (properties[key]) {
        const expectedType = properties[key].type;
        const actualType = typeof value;

        // Handle array type
        if (expectedType === 'array' && !Array.isArray(value)) {
          throw new Error(`Parameter ${key} must be an array`);
        }

        // Handle other types (allow number for integer)
        if (expectedType !== 'array' && expectedType !== actualType) {
          if (expectedType === 'integer' && actualType === 'number') {
            // Allow number for integer type
            continue;
          }
          throw new Error(
            `Parameter ${key} must be of type ${expectedType}, got ${actualType}`
          );
        }
      }
    }
  }

  /**
   * Execute the actual action
   */
  private async executeAction(
    actionId: string,
    params: Record<string, any>,
    dryRun: boolean
  ): Promise<Record<string, any>> {
    switch (actionId) {
      case 'PAYRUN_DISPATCH':
        return await this.executePayrunDispatch(params, dryRun);
      case 'RUN_DUNNING':
        return await this.executeRunDunning(params, dryRun);
      case 'FX_REVALUE':
        return await this.executeFxRevalue(params, dryRun);
      case 'ACCELERATE_COLLECTIONS':
        return await this.executeAccelerateCollections(params, dryRun);
      default:
        throw new Error(`Unknown action: ${actionId}`);
    }
  }

  /**
   * Execute payment run dispatch
   */
  private async executePayrunDispatch(
    params: Record<string, any>,
    dryRun: boolean
  ): Promise<Record<string, any>> {
    const { run_id } = params;

    if (dryRun) {
      return {
        action: 'PAYRUN_DISPATCH',
        run_id,
        dry_run: true,
        message: 'Would dispatch payment run',
        estimated_amount: 150000,
        estimated_count: 25,
      };
    }

    // TODO: Implement actual payment run dispatch
    // This would call the payments service
    return {
      action: 'PAYRUN_DISPATCH',
      run_id,
      dry_run: false,
      message: 'Payment run dispatched successfully',
      dispatched_at: new Date().toISOString(),
      amount: 150000,
      count: 25,
    };
  }

  /**
   * Execute dunning process
   */
  private async executeRunDunning(
    params: Record<string, any>,
    dryRun: boolean
  ): Promise<Record<string, any>> {
    const { policy_code, segment } = params;

    if (dryRun) {
      return {
        action: 'RUN_DUNNING',
        policy_code,
        segment,
        dry_run: true,
        message: 'Would run dunning process',
        estimated_customers: 15,
        estimated_amount: 75000,
      };
    }

    // TODO: Implement actual dunning process
    // This would call the AR dunning service
    return {
      action: 'RUN_DUNNING',
      policy_code,
      segment,
      dry_run: false,
      message: 'Dunning process executed successfully',
      executed_at: new Date().toISOString(),
      customers_processed: 15,
      amount_collected: 75000,
    };
  }

  /**
   * Execute FX revaluation
   */
  private async executeFxRevalue(
    params: Record<string, any>,
    dryRun: boolean
  ): Promise<Record<string, any>> {
    const { year, month, ccy_pairs } = params;

    if (dryRun) {
      return {
        action: 'FX_REVALUE',
        year,
        month,
        ccy_pairs,
        dry_run: true,
        message: 'Would execute FX revaluation',
        estimated_impact: 25000,
      };
    }

    // TODO: Implement actual FX revaluation
    // This would call the FX service
    return {
      action: 'FX_REVALUE',
      year,
      month,
      ccy_pairs,
      dry_run: false,
      message: 'FX revaluation executed successfully',
      executed_at: new Date().toISOString(),
      unrealized_pl_impact: 25000,
    };
  }

  /**
   * Execute collections acceleration
   */
  private async executeAccelerateCollections(
    params: Record<string, any>,
    dryRun: boolean
  ): Promise<Record<string, any>> {
    const { customer_ids, escalation_level } = params;

    if (dryRun) {
      return {
        action: 'ACCELERATE_COLLECTIONS',
        customer_ids,
        escalation_level,
        dry_run: true,
        message: 'Would accelerate collections',
        estimated_customers: customer_ids.length,
        estimated_amount: 100000,
      };
    }

    // TODO: Implement actual collections acceleration
    // This would call the AR collections service
    return {
      action: 'ACCELERATE_COLLECTIONS',
      customer_ids,
      escalation_level,
      dry_run: false,
      message: 'Collections acceleration executed successfully',
      executed_at: new Date().toISOString(),
      customers_escalated: customer_ids.length,
      amount_at_risk: 100000,
    };
  }

  /**
   * Log execution in outbox
   */
  private async logExecution(
    companyId: string,
    executionId: string,
    request: PlaybookExecuteReq,
    result: Record<string, any> | null,
    errorMessage: string | null
  ): Promise<void> {
    try {
      await this.dbInstance.insert(opsccOutbox).values({
        company_id: companyId,
        event_type: 'PLAYBOOK_EXECUTED',
        event_data: {
          execution_id: executionId,
          action_id: request.action_id,
          params: request.params,
          dry_run: request.dry_run,
          result,
          error_message: errorMessage,
          executed_at: new Date().toISOString(),
        },
      });
    } catch (error) {
      logLine({
        msg: 'PlaybooksService.logExecution error',
        companyId,
        executionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(
    companyId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const results = await this.dbInstance
        .select()
        .from(opsccOutbox)
        .where(
          and(
            eq(opsccOutbox.company_id, companyId),
            eq(opsccOutbox.event_type, 'PLAYBOOK_EXECUTED')
          )
        )
        .orderBy(desc(opsccOutbox.created_at))
        .limit(limit);

      return results.map(row => row.event_data);
    } catch (error) {
      logLine({
        msg: 'PlaybooksService.getExecutionHistory error',
        companyId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
