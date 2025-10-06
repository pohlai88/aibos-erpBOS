import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, asc, sql, gte, lte, inArray } from 'drizzle-orm';
import {
  opsRule,
  opsRuleStat,
  opsFire,
  opsFireStep,
  opsGuardrailLock,
  opsSignal,
} from '@aibos/db-adapter/schema';
import type {
  RuleUpsertM27_2,
  RuleResponseM27_2,
  RuleTestRequest,
  RuleTestResponse,
  FireResponse,
  QueryFires,
  SignalResponse,
} from '@aibos/contracts';
import { logLine } from '@/lib/log';
import { OpsSignalService } from './signals';

export class OpsRuleEngine {
  private signalService: OpsSignalService;

  constructor(private dbInstance = db) {
    this.signalService = new OpsSignalService(dbInstance);
  }

  /**
   * Create or update a rule
   */
  async upsertRule(
    companyId: string,
    userId: string,
    data: RuleUpsertM27_2
  ): Promise<RuleResponseM27_2> {
    try {
      // Check if rule exists (by name for now)
      const existing = await this.dbInstance
        .select()
        .from(opsRule)
        .where(
          and(eq(opsRule.company_id, companyId), eq(opsRule.name, data.name))
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing rule
        const [updated] = await this.dbInstance
          .update(opsRule)
          .set({
            name: data.name,
            kind: data.kind,
            enabled: data.enabled,
            source: data.source,
            where_jsonb: data.where,
            schedule_cron: data.schedule_cron,
            priority: data.priority,
            updated_by: userId,
            updated_at: new Date(),
          })
          .where(eq(opsRule.id, existing[0]!.id))
          .returning();

        return this.mapRuleToResponse(updated);
      } else {
        // Create new rule
        const [created] = await this.dbInstance
          .insert(opsRule)
          .values({
            id: crypto.randomUUID(),
            company_id: companyId,
            code: data.code,
            name: data.name,
            kind: data.kind,
            enabled: data.enabled,
            source: data.source,
            where_jsonb: data.where,
            schedule_cron: data.schedule_cron,
            priority: data.priority,
            created_by: userId,
            updated_by: userId,
          })
          .returning();

        // Initialize rule statistics
        await this.dbInstance.insert(opsRuleStat).values({
          rule_id: created!.id,
        });

        return this.mapRuleToResponse(created);
      }
    } catch (error) {
      logLine({
        msg: 'OpsRuleEngine.upsertRule error',
        companyId,
        userId,
        data,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Evaluate all enabled rules
   */
  async evaluateRules(
    companyId: string
  ): Promise<{ fired: number; suppressed: number }> {
    try {
      const enabledRules = await this.dbInstance
        .select()
        .from(opsRule)
        .where(
          and(eq(opsRule.company_id, companyId), eq(opsRule.enabled, true))
        );

      let fired = 0;
      let suppressed = 0;

      for (const rule of enabledRules) {
        try {
          const shouldFire = await this.evaluateRule(rule);
          if (shouldFire) {
            const wasThrottled = await this.checkThrottle(rule);
            if (!wasThrottled) {
              await this.createFire(rule, companyId);
              fired++;
            } else {
              suppressed++;
            }
          }
        } catch (error) {
          logLine({
            msg: 'OpsRuleEngine.evaluateRules rule error',
            companyId,
            ruleId: rule.id,
            error: error instanceof Error ? error.message : String(error),
          });

          // Update rule statistics with error
          await this.dbInstance
            .update(opsRuleStat)
            .set({
              last_error:
                error instanceof Error ? error.message : String(error),
              last_error_at: new Date(),
              updated_at: new Date(),
            })
            .where(eq(opsRuleStat.rule_id, rule.id));
        }
      }

      logLine({
        msg: 'OpsRuleEngine.evaluateRules completed',
        companyId,
        fired,
        suppressed,
        totalRules: enabledRules.length,
      });

      return { fired, suppressed };
    } catch (error) {
      logLine({
        msg: 'OpsRuleEngine.evaluateRules error',
        companyId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Test a rule against historical signals
   */
  async testRule(
    companyId: string,
    testRequest: RuleTestRequest
  ): Promise<RuleTestResponse> {
    try {
      const testPeriodHours = testRequest.test_period_hours;
      const windowFrom = new Date(
        Date.now() - testPeriodHours * 60 * 60 * 1000
      );
      const windowTo = new Date();

      // Get signals for test period
      const signals = await this.signalService.getWindowedSignals(
        companyId,
        windowFrom,
        windowTo,
        this.extractFiltersFromExpression(testRequest.when_expr)
      );

      const prospectiveFires = [];
      let currentWindowStart = windowFrom;

      // Slide window through the test period
      while (currentWindowStart < windowTo) {
        const currentWindowEnd = new Date(
          currentWindowStart.getTime() + testRequest.window_sec * 1000
        );
        if (currentWindowEnd > windowTo) break;

        const windowSignals = signals.filter(signal => {
          const signalTime = new Date(signal.ts);
          return (
            signalTime >= currentWindowStart && signalTime <= currentWindowEnd
          );
        });

        const shouldFire = await this.evaluateExpression(
          testRequest.when_expr,
          windowSignals,
          testRequest.threshold
        );

        if (shouldFire) {
          prospectiveFires.push({
            window_from: currentWindowStart.toISOString(),
            window_to: currentWindowEnd.toISOString(),
            reason: `Rule condition met with ${windowSignals.length} signals`,
            signal_count: windowSignals.length,
            matching_signals: windowSignals,
          });
        }

        currentWindowStart = new Date(
          currentWindowStart.getTime() + testRequest.window_sec * 1000
        );
      }

      return {
        prospective_fires: prospectiveFires,
        test_period: {
          from: windowFrom.toISOString(),
          to: windowTo.toISOString(),
        },
      };
    } catch (error) {
      logLine({
        msg: 'OpsRuleEngine.testRule error',
        companyId,
        testRequest,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Evaluate a single rule
   */
  private async evaluateRule(rule: any): Promise<boolean> {
    const windowFrom = new Date(Date.now() - rule.window_sec * 1000);
    const windowTo = new Date();

    const signals = await this.signalService.getWindowedSignals(
      rule.company_id,
      windowFrom,
      windowTo,
      this.extractFiltersFromExpression(rule.when_expr)
    );

    return await this.evaluateExpression(
      rule.when_expr,
      signals,
      rule.threshold
    );
  }

  /**
   * Evaluate rule expression against signals
   */
  private async evaluateExpression(
    whenExpr: any,
    signals: SignalResponse[],
    threshold: any
  ): Promise<boolean> {
    try {
      // Simple expression evaluation - can be enhanced with a proper expression engine
      if (whenExpr.all) {
        // All conditions must be true
        return whenExpr.all.every((condition: any) =>
          this.evaluateCondition(condition, signals, threshold)
        );
      } else if (whenExpr.any) {
        // Any condition must be true
        return whenExpr.any.some((condition: any) =>
          this.evaluateCondition(condition, signals, threshold)
        );
      } else {
        // Single condition
        return this.evaluateCondition(whenExpr, signals, threshold);
      }
    } catch (error) {
      logLine({
        msg: 'OpsRuleEngine.evaluateExpression error',
        whenExpr,
        signalCount: signals.length,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: any,
    signals: SignalResponse[],
    threshold: any
  ): boolean {
    if (condition.kpi) {
      const kpiSignals = signals.filter(s => s.kpi === condition.kpi);
      if (kpiSignals.length === 0) return false;

      const values = kpiSignals
        .map(s => s.value)
        .filter(v => v !== null) as number[];
      if (values.length === 0) return false;

      const aggregated = this.aggregateValues(values, condition.agg || 'avg');
      const thresholdValue = threshold[condition.kpi] || threshold.value || 0;

      return this.compareValues(
        aggregated,
        condition.op || '>',
        thresholdValue
      );
    }

    return false;
  }

  /**
   * Aggregate values based on aggregation type
   */
  private aggregateValues(values: number[], agg: string): number {
    switch (agg) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'max':
        return Math.max(...values);
      case 'min':
        return Math.min(...values);
      case 'count':
        return values.length;
      case 'avg':
      default:
        return values.reduce((a, b) => a + b, 0) / values.length;
    }
  }

  /**
   * Compare values based on operator
   */
  private compareValues(left: number, op: string, right: number): boolean {
    switch (op) {
      case '>':
        return left > right;
      case '<':
        return left < right;
      case '>=':
        return left >= right;
      case '<=':
        return left <= right;
      case '==':
        return left === right;
      case '!=':
        return left !== right;
      case 'abs_gt':
        return Math.abs(left) > right;
      case 'delta_gt':
        return Math.abs(left - right) > right;
      default:
        return false;
    }
  }

  /**
   * Extract filters from expression for signal querying
   */
  private extractFiltersFromExpression(whenExpr: any): {
    source?: string;
    kind?: string;
    kpi?: string;
    tags?: string[];
  } {
    const filters: any = {};

    if (whenExpr.kpi) {
      filters.kpi = whenExpr.kpi;
    }
    if (whenExpr.source) {
      filters.source = whenExpr.source;
    }
    if (whenExpr.kind) {
      filters.kind = whenExpr.kind;
    }
    if (whenExpr.tags) {
      filters.tags = whenExpr.tags;
    }

    return filters;
  }

  /**
   * Check if rule is throttled
   */
  private async checkThrottle(rule: any): Promise<boolean> {
    const stats = await this.dbInstance
      .select()
      .from(opsRuleStat)
      .where(eq(opsRuleStat.rule_id, rule.id))
      .limit(1);

    if (stats.length === 0) return false;

    const lastFired = stats[0]?.last_fired_at;
    if (!lastFired) return false;

    const throttleMs = rule.throttle_sec * 1000;
    const timeSinceLastFire = Date.now() - lastFired.getTime();

    return timeSinceLastFire < throttleMs;
  }

  /**
   * Create a fire event
   */
  private async createFire(rule: any, companyId: string): Promise<void> {
    const windowFrom = new Date(Date.now() - rule.window_sec * 1000);
    const windowTo = new Date();

    const [fire] = await this.dbInstance
      .insert(opsFire)
      .values({
        company_id: companyId,
        rule_id: rule.id,
        window_from: windowFrom,
        window_to: windowTo,
        reason: `Rule "${rule.name}" condition met`,
        approvals_needed: rule.approvals,
        created_by: 'system',
      })
      .returning();

    // Update rule statistics
    await this.dbInstance
      .update(opsRuleStat)
      .set({
        last_fired_at: new Date(),
        fire_count: sql`fire_count + 1`,
        updated_at: new Date(),
      })
      .where(eq(opsRuleStat.rule_id, rule.id));

    logLine({
      msg: 'OpsRuleEngine.createFire',
      companyId,
      ruleId: rule.id,
      fireId: fire!.id,
      reason: fire!.reason,
    });
  }

  /**
   * Map database rule to response type
   */
  private mapRuleToResponse(rule: any): RuleResponseM27_2 {
    return {
      id: rule.id,
      company_id: rule.company_id,
      code: rule.code,
      name: rule.name,
      kind: rule.kind,
      enabled: rule.enabled,
      source: rule.source,
      where: rule.where_jsonb,
      schedule_cron: rule.schedule_cron,
      priority: rule.priority,
      created_by: rule.created_by,
      updated_by: rule.updated_by,
      created_at: rule.created_at.toISOString(),
      updated_at: rule.updated_at.toISOString(),
    };
  }
}
