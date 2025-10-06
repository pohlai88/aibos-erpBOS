import { db } from '@/lib/db';
import { closePolicy } from '@aibos/db-adapter/schema';
import { eq } from 'drizzle-orm';
import { logLine } from '@/lib/log';
import type {
  ClosePolicyUpsertType,
  ClosePolicyResponseType,
} from '@aibos/contracts';

export class ClosePolicyService {
  /**
   * Upsert close policy for a company
   */
  async upsertClosePolicy(
    companyId: string,
    userId: string,
    data: ClosePolicyUpsertType
  ): Promise<ClosePolicyResponseType> {
    const policyResult = await db
      .insert(closePolicy)
      .values({
        companyId,
        materialityAbs: data.materiality_abs.toString(),
        materialityPct: data.materiality_pct.toString(),
        slaDefaultHours: data.sla_default_hours,
        reminderCadenceMins: data.reminder_cadence_mins,
        tz: data.tz,
        createdBy: userId,
        updatedBy: userId,
      })
      .onConflictDoUpdate({
        target: closePolicy.companyId,
        set: {
          materialityAbs: data.materiality_abs.toString(),
          materialityPct: data.materiality_pct.toString(),
          slaDefaultHours: data.sla_default_hours,
          reminderCadenceMins: data.reminder_cadence_mins,
          tz: data.tz,
          updatedBy: userId,
        },
      })
      .returning();

    const policy = policyResult[0];
    if (!policy) {
      throw new Error('Failed to upsert close policy');
    }

    logLine({
      msg: `Updated close policy for company ${companyId}`,
      companyId,
    });

    return {
      company_id: policy.companyId,
      materiality_abs: Number(policy.materialityAbs),
      materiality_pct: Number(policy.materialityPct),
      sla_default_hours: policy.slaDefaultHours,
      reminder_cadence_mins: policy.reminderCadenceMins,
      tz: policy.tz,
      created_at: policy.createdAt.toISOString(),
      created_by: policy.createdBy,
      updated_at: policy.updatedAt.toISOString(),
      updated_by: policy.updatedBy,
    };
  }

  /**
   * Get close policy for a company
   */
  async getClosePolicy(
    companyId: string
  ): Promise<ClosePolicyResponseType | null> {
    const [policy] = await db
      .select()
      .from(closePolicy)
      .where(eq(closePolicy.companyId, companyId))
      .limit(1);

    if (!policy) {
      return null;
    }

    return {
      company_id: policy.companyId,
      materiality_abs: Number(policy.materialityAbs),
      materiality_pct: Number(policy.materialityPct),
      sla_default_hours: policy.slaDefaultHours,
      reminder_cadence_mins: policy.reminderCadenceMins,
      tz: policy.tz,
      created_at: policy.createdAt.toISOString(),
      created_by: policy.createdBy,
      updated_at: policy.updatedAt.toISOString(),
      updated_by: policy.updatedBy,
    };
  }

  /**
   * Compute materiality threshold for a company
   */
  async computeMaterialityThreshold(
    companyId: string,
    baseAmount: number
  ): Promise<{
    absThreshold: number;
    pctThreshold: number;
    isMaterial: boolean;
  }> {
    const policy = await this.getClosePolicy(companyId);

    if (!policy) {
      throw new Error(`Close policy not found for company ${companyId}`);
    }

    const absThreshold = policy.materiality_abs;
    const pctThreshold = baseAmount * policy.materiality_pct;
    const isMaterial =
      Math.abs(baseAmount) >= absThreshold ||
      Math.abs(baseAmount) >= pctThreshold;

    return {
      absThreshold,
      pctThreshold,
      isMaterial,
    };
  }

  /**
   * Get SLA default hours for a company
   */
  async getSlaDefaultHours(companyId: string): Promise<number> {
    const policy = await this.getClosePolicy(companyId);
    return policy?.sla_default_hours || 72; // Default 72 hours
  }

  /**
   * Get reminder cadence for a company
   */
  async getReminderCadenceMins(companyId: string): Promise<number> {
    const policy = await this.getClosePolicy(companyId);
    return policy?.reminder_cadence_mins || 60; // Default 60 minutes
  }

  /**
   * Get company timezone
   */
  async getCompanyTimezone(companyId: string): Promise<string> {
    const policy = await this.getClosePolicy(companyId);
    return policy?.tz || 'UTC';
  }
}
