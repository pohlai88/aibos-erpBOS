import { db, pool } from '@/lib/db';
import { eq, and, desc, asc, sql, gte, lte, inArray } from 'drizzle-orm';
import {
  alertRule,
  alertEvent,
  playbookAction,
  kpiSnapshot,
  opsccOutbox,
} from '@aibos/db-adapter/schema';
import type {
  AlertRuleUpsert,
  AlertRuleResponse,
  AlertEventResponse,
  AlertSeverity,
  AlertStatus,
  BoardType,
} from '@aibos/contracts';
import { logLine } from '@/lib/log';

export class AlertsService {
  constructor(private dbInstance = db) {}

  /**
   * Get alert rules for a company
   */
  async getAlertRules(companyId: string): Promise<AlertRuleResponse[]> {
    try {
      const results = await this.dbInstance
        .select()
        .from(alertRule)
        .where(eq(alertRule.company_id, companyId))
        .orderBy(asc(alertRule.board), asc(alertRule.kpi));

      return results.map(r => ({
        ...r,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
        last_fired_at: r.last_fired_at?.toISOString() || null,
      })) as AlertRuleResponse[];
    } catch (error) {
      logLine({
        msg: 'AlertsService.getAlertRules error',
        companyId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get alert rules for a specific board
   */
  async getAlertRulesByBoard(
    companyId: string,
    board: BoardType
  ): Promise<AlertRuleResponse[]> {
    try {
      const results = await this.dbInstance
        .select()
        .from(alertRule)
        .where(
          and(eq(alertRule.company_id, companyId), eq(alertRule.board, board))
        )
        .orderBy(asc(alertRule.kpi));

      return results.map(r => ({
        ...r,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
        last_fired_at: r.last_fired_at?.toISOString() || null,
      })) as AlertRuleResponse[];
    } catch (error) {
      logLine({
        msg: 'AlertsService.getAlertRulesByBoard error',
        companyId,
        board,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Upsert alert rule
   */
  async upsertAlertRule(
    companyId: string,
    rule: AlertRuleUpsert
  ): Promise<AlertRuleResponse> {
    try {
      const existing = await this.dbInstance
        .select()
        .from(alertRule)
        .where(
          and(
            eq(alertRule.company_id, companyId),
            eq(alertRule.rule_id, rule.rule_id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        const result = await this.dbInstance
          .update(alertRule)
          .set({
            board: rule.board,
            kpi: rule.kpi,
            expr: rule.expr,
            severity: rule.severity as any, // Type assertion for MED vs MEDIUM
            throttle_sec: rule.throttle_sec,
            enabled: rule.enabled,
            updated_at: new Date(),
          })
          .where(
            and(
              eq(alertRule.company_id, companyId),
              eq(alertRule.rule_id, rule.rule_id)
            )
          )
          .returning();

        const updated = result[0];
        if (!updated) {
          throw new Error('Failed to update alert rule');
        }

        return {
          ...updated,
          created_at: updated.created_at.toISOString(),
          updated_at: updated.updated_at.toISOString(),
          last_fired_at: updated.last_fired_at?.toISOString() || null,
        } as AlertRuleResponse;
      } else {
        // Insert new
        const result = await this.dbInstance
          .insert(alertRule)
          .values({
            company_id: companyId,
            board: rule.board,
            kpi: rule.kpi,
            rule_id: rule.rule_id,
            expr: rule.expr,
            severity: rule.severity as any, // Type assertion for MED vs MEDIUM
            throttle_sec: rule.throttle_sec,
            enabled: rule.enabled,
          })
          .returning();

        const inserted = result[0];
        if (!inserted) {
          throw new Error('Failed to insert alert rule');
        }

        return {
          ...inserted,
          created_at: inserted.created_at.toISOString(),
          updated_at: inserted.updated_at.toISOString(),
          last_fired_at: inserted.last_fired_at?.toISOString() || null,
        } as AlertRuleResponse;
      }
    } catch (error) {
      logLine({
        msg: 'AlertsService.upsertAlertRule error',
        companyId,
        rule,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete alert rule
   */
  async deleteAlertRule(companyId: string, ruleId: string): Promise<void> {
    try {
      await this.dbInstance
        .delete(alertRule)
        .where(
          and(
            eq(alertRule.company_id, companyId),
            eq(alertRule.rule_id, ruleId)
          )
        );
    } catch (error) {
      logLine({
        msg: 'AlertsService.deleteAlertRule error',
        companyId,
        ruleId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get active alert events
   */
  async getActiveAlerts(companyId: string): Promise<AlertEventResponse[]> {
    try {
      const results = await this.dbInstance
        .select()
        .from(alertEvent)
        .where(
          and(
            eq(alertEvent.company_id, companyId),
            eq(alertEvent.status, 'OPEN')
          )
        )
        .orderBy(desc(alertEvent.fired_at));

      return results.map(r => ({
        ...r,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
        fired_at: r.fired_at.toISOString(),
        acked_at: r.acked_at?.toISOString() || null,
        resolved_at: r.resolved_at?.toISOString() || null,
      })) as AlertEventResponse[];
    } catch (error) {
      logLine({
        msg: 'AlertsService.getActiveAlerts error',
        companyId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get alert events by status
   */
  async getAlertEventsByStatus(
    companyId: string,
    status: AlertStatus
  ): Promise<AlertEventResponse[]> {
    try {
      const results = await this.dbInstance
        .select()
        .from(alertEvent)
        .where(
          and(
            eq(alertEvent.company_id, companyId),
            eq(alertEvent.status, status)
          )
        )
        .orderBy(desc(alertEvent.fired_at));

      return results.map(r => ({
        ...r,
        created_at: r.created_at.toISOString(),
        updated_at: r.updated_at.toISOString(),
        fired_at: r.fired_at.toISOString(),
        acked_at: r.acked_at?.toISOString() || null,
        resolved_at: r.resolved_at?.toISOString() || null,
      })) as AlertEventResponse[];
    } catch (error) {
      logLine({
        msg: 'AlertsService.getAlertEventsByStatus error',
        companyId,
        status,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(companyId: string, eventId: string): Promise<void> {
    try {
      await this.dbInstance
        .update(alertEvent)
        .set({
          status: 'ACK',
          acked_at: new Date(),
          updated_at: new Date(),
        })
        .where(
          and(eq(alertEvent.company_id, companyId), eq(alertEvent.id, eventId))
        );
    } catch (error) {
      logLine({
        msg: 'AlertsService.acknowledgeAlert error',
        companyId,
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(companyId: string, eventId: string): Promise<void> {
    try {
      await this.dbInstance
        .update(alertEvent)
        .set({
          status: 'RESOLVED',
          resolved_at: new Date(),
          updated_at: new Date(),
        })
        .where(
          and(eq(alertEvent.company_id, companyId), eq(alertEvent.id, eventId))
        );
    } catch (error) {
      logLine({
        msg: 'AlertsService.resolveAlert error',
        companyId,
        eventId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Fire alerts for a company
   */
  async fireAlerts(companyId: string): Promise<void> {
    try {
      const rules = await this.getAlertRules(companyId);
      const enabledRules = rules.filter(rule => rule.enabled);

      for (const rule of enabledRules) {
        await this.evaluateAndFireAlert(companyId, rule);
      }
    } catch (error) {
      logLine({
        msg: 'AlertsService.fireAlerts error',
        companyId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Evaluate and fire a single alert
   */
  private async evaluateAndFireAlert(
    companyId: string,
    rule: AlertRuleResponse
  ): Promise<void> {
    try {
      // Check throttle
      if (rule.last_fired_at) {
        const lastFired = new Date(rule.last_fired_at);
        const now = new Date();
        const throttleMs = rule.throttle_sec * 1000;

        if (now.getTime() - lastFired.getTime() < throttleMs) {
          return; // Still in throttle period
        }
      }

      // Get latest KPI data
      const kpiData = await this.dbInstance
        .select()
        .from(kpiSnapshot)
        .where(
          and(
            eq(kpiSnapshot.company_id, companyId),
            eq(kpiSnapshot.board, rule.board),
            eq(kpiSnapshot.kpi, rule.kpi)
          )
        )
        .orderBy(desc(kpiSnapshot.ts_utc))
        .limit(1);

      if (kpiData.length === 0) {
        return; // No KPI data available
      }

      const kpi = kpiData[0];
      if (!kpi || !kpi.value) {
        return; // No value to evaluate
      }

      // Evaluate expression
      const shouldFire = await this.evaluateExpression(
        rule.expr,
        parseFloat(kpi.value.toString())
      );

      if (shouldFire) {
        // Create alert event
        await this.dbInstance.insert(alertEvent).values({
          company_id: companyId,
          rule_id: rule.id,
          board: rule.board,
          kpi: rule.kpi,
          snapshot_id: kpi.id,
          severity: rule.severity as any, // Type assertion for MED vs MEDIUM
          message: `Alert fired for ${rule.kpi}: ${rule.expr}`,
          status: 'OPEN',
        });

        // Update last fired timestamp
        await this.dbInstance
          .update(alertRule)
          .set({
            last_fired_at: new Date(),
            updated_at: new Date(),
          })
          .where(eq(alertRule.id, rule.id));

        // Add to outbox for notification
        await this.dbInstance.insert(opsccOutbox).values({
          company_id: companyId,
          event_type: 'ALERT_FIRED',
          event_data: {
            rule_id: rule.id,
            board: rule.board,
            kpi: rule.kpi,
            severity: rule.severity,
            message: `Alert fired for ${rule.kpi}: ${rule.expr}`,
          },
        });
      }
    } catch (error) {
      logLine({
        msg: 'AlertsService.evaluateAndFireAlert error',
        companyId,
        rule: rule.rule_id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Simple expression evaluator
   */
  private async evaluateExpression(
    expr: string,
    value: number
  ): Promise<boolean> {
    try {
      // Simple threshold-based expressions
      if (expr.includes('<')) {
        const parts = expr.split('<');
        if (parts.length === 2 && parts[1]) {
          const threshold = parseFloat(parts[1].trim());
          return value < threshold;
        }
      } else if (expr.includes('>')) {
        const parts = expr.split('>');
        if (parts.length === 2 && parts[1]) {
          const threshold = parseFloat(parts[1].trim());
          return value > threshold;
        }
      } else if (expr.includes('==')) {
        const parts = expr.split('==');
        if (parts.length === 2 && parts[1]) {
          const threshold = parseFloat(parts[1].trim());
          return value === threshold;
        }
      }

      return false;
    } catch (error) {
      logLine({
        msg: 'AlertsService.evaluateExpression error',
        expr,
        value,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
