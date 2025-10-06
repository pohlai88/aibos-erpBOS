import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte, asc } from 'drizzle-orm';
import {
  leaseOnerousAssessment,
  leaseOnerousRoll,
  leaseOnerousPostLock,
  leaseComponent,
} from '@aibos/db-adapter/schema';
import { postJournal } from '@/services/gl/journals';

export interface OnerousRollData {
  assessmentId: string;
  year: number;
  month: number;
  openingBalance: number;
  charge: number;
  unwind: number;
  utilization: number;
  closingBalance: number;
}

export interface OnerousRollRequest {
  companyId: string;
  year: number;
  month: number;
  userId: string;
}

export interface OnerousRollResponse {
  success: boolean;
  message: string;
  rollId?: string;
  journalId?: string;
  linesPosted?: number;
}

export class LeaseOnerousRollService {
  private dbInstance = db;

  /**
   * Create onerous roll for a specific period
   */
  async createOnerousRoll(
    request: OnerousRollRequest
  ): Promise<OnerousRollResponse> {
    try {
      const { companyId, year, month, userId } = request;

      // Get all active onerous assessments for the company
      const assessments = await this.dbInstance
        .select({
          id: leaseOnerousAssessment.id,
          leaseComponentId: leaseOnerousAssessment.leaseComponentId,
          asOfDate: leaseOnerousAssessment.asOfDate,
          status: leaseOnerousAssessment.status,
        })
        .from(leaseOnerousAssessment)
        .where(
          and(
            eq(leaseOnerousAssessment.companyId, companyId),
            eq(leaseOnerousAssessment.status, 'ACTIVE')
          )
        );

      if (assessments.length === 0) {
        return {
          success: false,
          message: 'No active onerous assessments found for the company',
        };
      }

      const rollId = ulid();
      const rollData: OnerousRollData[] = [];

      // Process each assessment
      for (const assessment of assessments) {
        const previousRoll = await this.getPreviousRoll(
          assessment.id,
          year,
          month
        );
        const openingBalance = previousRoll?.closingBalance || 0;

        // Calculate charge, unwind, utilization, and closing balance
        const charge = this.calculateCharge(assessment, year, month);
        const unwind = this.calculateUnwind(assessment, year, month);
        const utilization = this.calculateUtilization(assessment, year, month);
        const closingBalance = openingBalance + charge - unwind - utilization;

        rollData.push({
          assessmentId: assessment.id,
          year,
          month,
          openingBalance,
          charge,
          unwind,
          utilization,
          closingBalance,
        });
      }

      // Insert roll records
      await this.dbInstance.insert(leaseOnerousRoll).values(
        rollData.map(data => ({
          id: ulid(),
          assessmentId: data.assessmentId,
          year: data.year,
          month: data.month,
          opening: data.openingBalance.toString(),
          charge: data.charge.toString(),
          unwind: data.unwind.toString(),
          utilization: data.utilization.toString(),
          closing: data.closingBalance.toString(),
          createdAt: new Date(),
          createdBy: userId,
        }))
      );

      // Post journal entries
      const journalResult = await this.postOnerousJournal(
        companyId,
        year,
        month,
        rollData,
        userId
      );

      return {
        success: true,
        message: 'Onerous roll created successfully',
        rollId,
        journalId: journalResult.journalId,
        linesPosted: journalResult.linesPosted,
      };
    } catch (error) {
      console.error('Error creating onerous roll:', error);
      return {
        success: false,
        message: `Failed to create onerous roll: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get previous roll data for an assessment
   */
  private async getPreviousRoll(
    assessmentId: string,
    year: number,
    month: number
  ): Promise<OnerousRollData | null> {
    const previousMonth =
      month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };

    const roll = await this.dbInstance
      .select({
        assessmentId: leaseOnerousRoll.assessmentId,
        year: leaseOnerousRoll.year,
        month: leaseOnerousRoll.month,
        openingBalance: leaseOnerousRoll.opening,
        charge: leaseOnerousRoll.charge,
        unwind: leaseOnerousRoll.unwind,
        utilization: leaseOnerousRoll.utilization,
        closingBalance: leaseOnerousRoll.closing,
      })
      .from(leaseOnerousRoll)
      .where(
        and(
          eq(leaseOnerousRoll.assessmentId, assessmentId),
          eq(leaseOnerousRoll.year, previousMonth.year),
          eq(leaseOnerousRoll.month, previousMonth.month)
        )
      )
      .orderBy(desc(leaseOnerousRoll.createdAt))
      .limit(1);

    if (roll.length === 0) return null;

    const data = roll[0];
    if (!data) return null;

    return {
      assessmentId: data.assessmentId,
      year: data.year,
      month: data.month,
      openingBalance: Number(data.openingBalance),
      charge: Number(data.charge),
      unwind: Number(data.unwind),
      utilization: Number(data.utilization),
      closingBalance: Number(data.closingBalance),
    };
  }

  /**
   * Calculate onerous charge for a period
   */
  private calculateCharge(
    assessment: any,
    year: number,
    month: number
  ): number {
    // Implementation depends on business logic
    // For now, return a placeholder calculation
    return 1000; // This should be replaced with actual calculation
  }

  /**
   * Calculate onerous unwind for a period
   */
  private calculateUnwind(
    assessment: any,
    year: number,
    month: number
  ): number {
    // Implementation depends on business logic
    // For now, return a placeholder calculation
    return 500; // This should be replaced with actual calculation
  }

  /**
   * Calculate onerous utilization for a period
   */
  private calculateUtilization(
    assessment: any,
    year: number,
    month: number
  ): number {
    // Implementation depends on business logic
    // For now, return a placeholder calculation
    return 200; // This should be replaced with actual calculation
  }

  /**
   * Post journal entries for onerous roll
   */
  private async postOnerousJournal(
    companyId: string,
    year: number,
    month: number,
    rollData: OnerousRollData[],
    userId: string
  ): Promise<{ journalId: string; linesPosted: number }> {
    const journalLines = rollData.map(data => ({
      accountId: 'LEASE_ONEROUS_PROVISION',
      credit: data.closingBalance,
      description: `Onerous provision roll for ${year}-${month.toString().padStart(2, '0')}`,
    }));

    const journalResult = await postJournal(companyId, {
      date: new Date(year, month - 1, 1), // Convert year/month to Date
      memo: `Onerous provision roll for ${year}-${month.toString().padStart(2, '0')}`,
      lines: journalLines,
    });

    // Update post lock
    await this.dbInstance.insert(leaseOnerousPostLock).values({
      id: ulid(),
      companyId,
      year,
      month,
      assessmentId: rollData[0]?.assessmentId || '',
      journalId: journalResult.journalId,
      postedAt: new Date(),
      postedBy: userId,
      createdAt: new Date(),
    });

    return journalResult;
  }

  /**
   * Post onerous roll for a specific assessment and period
   */
  async postRoll(
    companyId: string,
    userId: string,
    data: {
      assessment_id: string;
      year: number;
      month: number;
      dry_run: boolean;
    }
  ): Promise<{
    success: boolean;
    message: string;
    journalId?: string;
    linesPosted?: number;
    dryRun?: boolean;
  }> {
    try {
      const { assessment_id, year, month, dry_run } = data;

      // Get the assessment
      const assessment = await this.dbInstance
        .select()
        .from(leaseOnerousAssessment)
        .where(
          and(
            eq(leaseOnerousAssessment.id, assessment_id),
            eq(leaseOnerousAssessment.companyId, companyId),
            eq(leaseOnerousAssessment.status, 'ACTIVE')
          )
        )
        .limit(1);

      if (assessment.length === 0) {
        return {
          success: false,
          message: 'Onerous assessment not found or not active',
        };
      }

      // Get existing roll data for this assessment and period
      const existingRoll = await this.dbInstance
        .select()
        .from(leaseOnerousRoll)
        .where(
          and(
            eq(leaseOnerousRoll.assessmentId, assessment_id),
            eq(leaseOnerousRoll.year, year),
            eq(leaseOnerousRoll.month, month)
          )
        )
        .limit(1);

      if (existingRoll.length === 0) {
        return {
          success: false,
          message: 'No roll data found for the specified period',
        };
      }

      const rollData = existingRoll[0];
      if (!rollData) {
        return {
          success: false,
          message: 'No roll data found for the specified period',
        };
      }

      // Check if already posted
      const postLock = await this.dbInstance
        .select()
        .from(leaseOnerousPostLock)
        .where(
          and(
            eq(leaseOnerousPostLock.assessmentId, assessment_id),
            eq(leaseOnerousPostLock.year, year),
            eq(leaseOnerousPostLock.month, month)
          )
        )
        .limit(1);

      if (postLock.length > 0) {
        return {
          success: false,
          message: 'Roll already posted for this period',
        };
      }

      if (dry_run) {
        return {
          success: true,
          message: 'Dry run completed - roll would be posted',
          dryRun: true,
          linesPosted: 1,
        };
      }

      // Post journal entries
      const journalLines = [
        {
          accountId: 'LEASE_ONEROUS_PROVISION',
          credit: Number(rollData.closing),
          description: `Onerous provision roll for ${year}-${month.toString().padStart(2, '0')}`,
        },
      ];

      const journalResult = await postJournal(companyId, {
        date: new Date(year, month - 1, 1),
        memo: `Onerous provision roll for ${year}-${month.toString().padStart(2, '0')}`,
        lines: journalLines,
      });

      // Create post lock
      await this.dbInstance.insert(leaseOnerousPostLock).values({
        id: ulid(),
        companyId,
        year,
        month,
        assessmentId: assessment_id,
        journalId: journalResult.journalId,
        postedAt: new Date(),
        postedBy: userId,
        createdAt: new Date(),
      });

      return {
        success: true,
        message: 'Onerous roll posted successfully',
        journalId: journalResult.journalId,
        linesPosted: journalResult.linesPosted,
      };
    } catch (error) {
      console.error('Error posting onerous roll:', error);
      return {
        success: false,
        message: `Failed to post onerous roll: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get onerous roll history for an assessment
   */
  async getOnerousRollHistory(
    assessmentId: string
  ): Promise<OnerousRollData[]> {
    const rolls = await this.dbInstance
      .select({
        assessmentId: leaseOnerousRoll.assessmentId,
        year: leaseOnerousRoll.year,
        month: leaseOnerousRoll.month,
        openingBalance: leaseOnerousRoll.opening,
        charge: leaseOnerousRoll.charge,
        unwind: leaseOnerousRoll.unwind,
        utilization: leaseOnerousRoll.utilization,
        closingBalance: leaseOnerousRoll.closing,
      })
      .from(leaseOnerousRoll)
      .where(eq(leaseOnerousRoll.assessmentId, assessmentId))
      .orderBy(asc(leaseOnerousRoll.year), asc(leaseOnerousRoll.month));

    return rolls.map(roll => ({
      assessmentId: roll.assessmentId,
      year: roll.year,
      month: roll.month,
      openingBalance: Number(roll.openingBalance),
      charge: Number(roll.charge),
      unwind: Number(roll.unwind),
      utilization: Number(roll.utilization),
      closingBalance: Number(roll.closingBalance),
    }));
  }

  /**
   * Get onerous roll summary for a company
   */
  async getOnerousRollSummary(
    companyId: string,
    year: number,
    month: number
  ): Promise<{
    totalOpening: number;
    totalCharge: number;
    totalUnwind: number;
    totalUtilization: number;
    totalClosing: number;
    assessmentCount: number;
  }> {
    const rolls = await this.dbInstance
      .select({
        openingBalance: leaseOnerousRoll.opening,
        charge: leaseOnerousRoll.charge,
        unwind: leaseOnerousRoll.unwind,
        utilization: leaseOnerousRoll.utilization,
        closingBalance: leaseOnerousRoll.closing,
      })
      .from(leaseOnerousRoll)
      .innerJoin(
        leaseOnerousAssessment,
        eq(leaseOnerousRoll.assessmentId, leaseOnerousAssessment.id)
      )
      .where(
        and(
          eq(leaseOnerousAssessment.companyId, companyId),
          eq(leaseOnerousRoll.year, year),
          eq(leaseOnerousRoll.month, month)
        )
      );

    const summary = rolls.reduce(
      (acc, roll) => {
        if (!roll) return acc;
        return {
          totalOpening: acc.totalOpening + Number(roll.openingBalance),
          totalCharge: acc.totalCharge + Number(roll.charge),
          totalUnwind: acc.totalUnwind + Number(roll.unwind),
          totalUtilization: acc.totalUtilization + Number(roll.utilization),
          totalClosing: acc.totalClosing + Number(roll.closingBalance),
          assessmentCount: acc.assessmentCount + 1,
        };
      },
      {
        totalOpening: 0,
        totalCharge: 0,
        totalUnwind: 0,
        totalUtilization: 0,
        totalClosing: 0,
        assessmentCount: 0,
      }
    );

    return summary;
  }

  /**
   * Build onerous roll for assessment
   */
  async buildRoll(
    companyId: string,
    userId: string,
    data: {
      assessment_id: string;
      year: number;
      month: number;
    }
  ): Promise<{
    success: boolean;
    message: string;
    rollId?: string;
    rollData?: OnerousRollData;
  }> {
    try {
      const { assessment_id, year, month } = data;

      // Get assessment details
      const assessment = await this.dbInstance
        .select()
        .from(leaseOnerousAssessment)
        .where(
          and(
            eq(leaseOnerousAssessment.id, assessment_id),
            eq(leaseOnerousAssessment.companyId, companyId),
            eq(leaseOnerousAssessment.status, 'ACTIVE')
          )
        )
        .limit(1);

      if (assessment.length === 0) {
        return {
          success: false,
          message: 'Onerous assessment not found or not active',
        };
      }

      // Get previous roll for opening balance
      const previousRoll = await this.getPreviousRoll(
        assessment_id,
        year,
        month
      );

      // Calculate roll data
      const rollData: OnerousRollData = {
        assessmentId: assessment_id,
        year,
        month,
        openingBalance: previousRoll?.openingBalance || 0,
        charge: Number(assessment[0]?.provision || 0),
        unwind: 0, // Would calculate based on discount rate
        utilization: 0, // Would calculate based on actual usage
        closingBalance:
          (previousRoll?.openingBalance || 0) +
          Number(assessment[0]?.provision || 0),
      };

      // Create roll record
      const rollId = ulid();
      await this.dbInstance.insert(leaseOnerousRoll).values({
        id: rollId,
        assessmentId: assessment_id,
        year,
        month,
        opening: rollData.openingBalance.toString(), // Use 'opening' instead of 'openingBalance'
        charge: rollData.charge.toString(),
        unwind: rollData.unwind.toString(),
        utilization: rollData.utilization.toString(),
        closing: rollData.closingBalance.toString(), // Use 'closing' instead of 'closingBalance'
        createdAt: new Date(),
        createdBy: userId,
      });

      return {
        success: true,
        message: 'Onerous roll built successfully',
        rollId,
        rollData,
      };
    } catch (error) {
      console.error('Error building onerous roll:', error);
      return {
        success: false,
        message: `Failed to build onerous roll: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get roll summary for assessment
   */
  async getRollSummary(assessmentId: string): Promise<{
    success: boolean;
    message: string;
    summary?: {
      totalRolls: number;
      latestRoll?: OnerousRollData;
      totalOpening: number;
      totalCharge: number;
      totalUnwind: number;
      totalUtilization: number;
      totalClosing: number;
    };
  }> {
    try {
      const rolls = await this.getOnerousRollHistory(assessmentId);

      if (rolls.length === 0) {
        return {
          success: true,
          message: 'No rolls found for assessment',
          summary: {
            totalRolls: 0,
            totalOpening: 0,
            totalCharge: 0,
            totalUnwind: 0,
            totalUtilization: 0,
            totalClosing: 0,
          },
        };
      }

      const summary = rolls.reduce(
        (acc, roll) => ({
          totalRolls: acc.totalRolls + 1,
          latestRoll: roll, // Will be the last one after reduce
          totalOpening: acc.totalOpening + Number(roll.openingBalance),
          totalCharge: acc.totalCharge + Number(roll.charge),
          totalUnwind: acc.totalUnwind + Number(roll.unwind),
          totalUtilization: acc.totalUtilization + Number(roll.utilization),
          totalClosing: acc.totalClosing + Number(roll.closingBalance),
        }),
        {
          totalRolls: 0,
          latestRoll: undefined as any, // Use any type to avoid strict typing issues
          totalOpening: 0,
          totalCharge: 0,
          totalUnwind: 0,
          totalUtilization: 0,
          totalClosing: 0,
        }
      );

      return {
        success: true,
        message: 'Roll summary retrieved successfully',
        summary,
      };
    } catch (error) {
      console.error('Error getting roll summary:', error);
      return {
        success: false,
        message: `Failed to get roll summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
