import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { arSurchargePolicy } from '@aibos/db-adapter/schema';

export class ArSurchargeService {
  constructor(private dbInstance = db) {}

  /**
   * Calculate surcharge based on policy
   */
  async calculateSurcharge(companyId: string, amount: number): Promise<number> {
    const policies = await this.dbInstance
      .select()
      .from(arSurchargePolicy)
      .where(eq(arSurchargePolicy.companyId, companyId))
      .limit(1);

    if (policies.length === 0 || !policies[0]!.enabled) {
      return 0;
    }

    const policy = policies[0]!;

    // Calculate percentage-based fee
    const pctFee = amount * parseFloat(policy.pct);

    // Apply minimum fee
    const minFee = parseFloat(policy.minFee);
    let surcharge = Math.max(pctFee, minFee);

    // Apply cap if specified
    if (policy.capFee) {
      const capFee = parseFloat(policy.capFee);
      surcharge = Math.min(surcharge, capFee);
    }

    // Round to 2 decimal places
    return Math.round(surcharge * 100) / 100;
  }

  /**
   * Get surcharge policy
   */
  async getPolicy(companyId: string) {
    const policies = await this.dbInstance
      .select()
      .from(arSurchargePolicy)
      .where(eq(arSurchargePolicy.companyId, companyId))
      .limit(1);

    if (policies.length === 0) {
      return {
        company_id: companyId,
        enabled: false,
        pct: 0,
        min_fee: 0,
        cap_fee: undefined,
        updated_at: new Date().toISOString(),
        updated_by: 'system',
      };
    }

    const policy = policies[0]!;
    return {
      company_id: companyId,
      enabled: policy.enabled,
      pct: parseFloat(policy.pct),
      min_fee: parseFloat(policy.minFee),
      cap_fee: policy.capFee ? parseFloat(policy.capFee) : undefined,
      updated_at: policy.updatedAt.toISOString(),
      updated_by: policy.updatedBy,
    };
  }

  /**
   * Update surcharge policy
   */
  async updatePolicy(
    companyId: string,
    policy: {
      enabled: boolean;
      pct: number;
      min_fee: number;
      cap_fee?: number;
    },
    updatedBy: string
  ) {
    await this.dbInstance
      .insert(arSurchargePolicy)
      .values({
        companyId,
        enabled: policy.enabled,
        pct: policy.pct.toString(),
        minFee: policy.min_fee.toString(),
        capFee: policy.cap_fee ? policy.cap_fee.toString() : null,
        updatedBy,
      })
      .onConflictDoUpdate({
        target: arSurchargePolicy.companyId,
        set: {
          enabled: policy.enabled,
          pct: policy.pct.toString(),
          minFee: policy.min_fee.toString(),
          capFee: policy.cap_fee ? policy.cap_fee.toString() : null,
          updatedBy,
          updatedAt: new Date(),
        },
      });
  }
}
