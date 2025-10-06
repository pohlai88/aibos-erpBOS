import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte, asc } from 'drizzle-orm';
import {
  lease,
  leaseComponent,
  leaseComponentSched,
  leaseImpTest,
  leaseImpLine,
  leaseImpPost,
  leaseImpPostLock,
  leaseSchedule,
} from '@aibos/db-adapter/schema';
import type {
  LeaseImpairAssessReqType,
  LeaseImpairAssessResponseType,
  LeaseImpairPostReqType,
  LeaseImpairPostResponseType,
  LeaseImpairTestQueryType,
  LeaseImpairTestResponseType,
} from '@aibos/contracts';

export class ImpairIndicatorService {
  constructor(private dbInstance = db) {}

  /**
   * Check for impairment indicators
   */
  async checkImpairmentIndicators(
    companyId: string,
    cguCode: string,
    asOfDate: string
  ): Promise<any[]> {
    const indicators = [];

    // Check for cash-generating deterioration
    const deteriorationIndicators = await this.checkCashGeneratingDeterioration(
      companyId,
      cguCode,
      asOfDate
    );
    indicators.push(...deteriorationIndicators);

    // Check for vacancy issues
    const vacancyIndicators = await this.checkVacancyIssues(
      companyId,
      cguCode,
      asOfDate
    );
    indicators.push(...vacancyIndicators);

    // Check for sublease losses
    const subleaseIndicators = await this.checkSubleaseLosses(
      companyId,
      cguCode,
      asOfDate
    );
    indicators.push(...subleaseIndicators);

    // Check for obsolescence
    const obsolescenceIndicators = await this.checkObsolescence(
      companyId,
      cguCode,
      asOfDate
    );
    indicators.push(...obsolescenceIndicators);

    // Check for CGU underperformance
    const underperformanceIndicators = await this.checkCGUUnderperformance(
      companyId,
      cguCode,
      asOfDate
    );
    indicators.push(...underperformanceIndicators);

    return indicators;
  }

  /**
   * Check for cash-generating deterioration
   */
  private async checkCashGeneratingDeterioration(
    companyId: string,
    cguCode: string,
    asOfDate: string
  ): Promise<any[]> {
    // This would typically check against budget vs actual performance
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Check for vacancy issues
   */
  private async checkVacancyIssues(
    companyId: string,
    cguCode: string,
    asOfDate: string
  ): Promise<any[]> {
    // Check for high vacancy rates in building components
    const vacancyComponents = await this.dbInstance
      .select({
        component_id: leaseComponent.id,
        component_code: leaseComponent.code,
        component_name: leaseComponent.name,
        class: leaseComponent.class,
        carrying_amount: leaseComponentSched.closeCarry,
      })
      .from(leaseComponent)
      .innerJoin(
        leaseComponentSched,
        eq(leaseComponent.id, leaseComponentSched.leaseComponentId)
      )
      .where(
        and(
          eq(leaseComponent.companyId, companyId),
          eq(leaseComponent.class, 'Building'),
          eq(leaseComponentSched.year, new Date(asOfDate).getFullYear()),
          eq(leaseComponentSched.month, new Date(asOfDate).getMonth() + 1)
        )
      );

    // For demo purposes, flag components with carrying amount > 1M as potential vacancy issues
    return vacancyComponents
      .filter(c => Number(c.carrying_amount) > 1000000)
      .map(c => ({
        type: 'VACANCY',
        severity: 'MEDIUM',
        description: `High carrying amount for ${c.component_name} may indicate vacancy issues`,
        component_id: c.component_id,
        component_code: c.component_code,
        carrying_amount: Number(c.carrying_amount),
      }));
  }

  /**
   * Check for sublease losses
   */
  private async checkSubleaseLosses(
    companyId: string,
    cguCode: string,
    asOfDate: string
  ): Promise<any[]> {
    // This would typically check sublease income vs costs
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Check for obsolescence
   */
  private async checkObsolescence(
    companyId: string,
    cguCode: string,
    asOfDate: string
  ): Promise<any[]> {
    // Check for IT/Equipment components that may be obsolete
    const itComponents = await this.dbInstance
      .select({
        component_id: leaseComponent.id,
        component_code: leaseComponent.code,
        component_name: leaseComponent.name,
        useful_life_months: leaseComponent.usefulLifeMonths,
        carrying_amount: leaseComponentSched.closeCarry,
      })
      .from(leaseComponent)
      .innerJoin(
        leaseComponentSched,
        eq(leaseComponent.id, leaseComponentSched.leaseComponentId)
      )
      .where(
        and(
          eq(leaseComponent.companyId, companyId),
          eq(leaseComponent.class, 'IT/Equipment'),
          eq(leaseComponentSched.year, new Date(asOfDate).getFullYear()),
          eq(leaseComponentSched.month, new Date(asOfDate).getMonth() + 1)
        )
      );

    // Flag IT components with useful life < 24 months as potentially obsolete
    return itComponents
      .filter(c => c.useful_life_months < 24)
      .map(c => ({
        type: 'OBSOLESCENCE',
        severity: 'HIGH',
        description: `IT component ${c.component_name} has short useful life (${c.useful_life_months} months)`,
        component_id: c.component_id,
        component_code: c.component_code,
        useful_life_months: c.useful_life_months,
        carrying_amount: Number(c.carrying_amount),
      }));
  }

  /**
   * Check for CGU underperformance
   */
  private async checkCGUUnderperformance(
    companyId: string,
    cguCode: string,
    asOfDate: string
  ): Promise<any[]> {
    // This would typically check CGU performance against budget/forecast
    // For now, return empty array as placeholder
    return [];
  }
}

export class ImpairMeasureService {
  constructor(private dbInstance = db) {}

  /**
   * Assess impairment for selected components or CGU
   */
  async assessImpairment(
    companyId: string,
    userId: string,
    data: LeaseImpairAssessReqType
  ): Promise<LeaseImpairAssessResponseType> {
    // Validate input data
    if (!data.cgu_code || data.cgu_code.trim() === '') {
      throw new Error('CGU code is required');
    }
    if (data.discount_rate <= 0 || data.discount_rate >= 1) {
      throw new Error('Discount rate must be between 0 and 1');
    }
    if (data.recoverable_amount < 0) {
      throw new Error('Recoverable amount cannot be negative');
    }
    if (
      data.level === 'COMPONENT' &&
      (!data.component_ids || data.component_ids.length === 0)
    ) {
      throw new Error('Component IDs are required for component-level testing');
    }

    // Validate as_of_date format
    const testAsOfDate = new Date(data.as_of_date);
    if (isNaN(testAsOfDate.getTime())) {
      throw new Error('Invalid as_of_date format. Use YYYY-MM-DD');
    }
    const testId = ulid();
    await this.dbInstance.insert(leaseImpTest).values({
      id: testId,
      companyId,
      cguId: (data as any).cgu_id || '', // Add missing cguId field with type assertion
      cguCode: data.cgu_code,
      level: data.level,
      method: data.method,
      discountRate: data.discount_rate.toString(),
      cashflows: (data as any).cashflows || {}, // Add missing cashflows field with type assertion
      carryingAmount: (data as any).carrying_amount?.toString() || '0', // Add missing carryingAmount field with type assertion
      recoverableAmount: data.recoverable_amount.toString(),
      trigger: data.trigger,
      asOfDate: data.as_of_date,
      status: 'DRAFT',
      notes: data.notes,
      createdAt: new Date(),
      createdBy: userId,
      updatedAt: new Date(),
      updatedBy: userId,
    });

    // Get components to test
    let components;
    if (data.level === 'COMPONENT') {
      components = await this.dbInstance
        .select()
        .from(leaseComponent)
        .where(
          and(
            eq(leaseComponent.companyId, companyId),
            eq(leaseComponent.id, data.component_ids![0]!) // Simplified for single component
          )
        );
    } else {
      // CGU level - get all components in the CGU
      components = await this.dbInstance
        .select()
        .from(leaseComponent)
        .where(
          and(
            eq(leaseComponent.companyId, companyId),
            eq(leaseComponent.class, data.cgu_code) // Simplified mapping
          )
        );
    }

    if (components.length === 0) {
      throw new Error('No components found for impairment testing');
    }

    // Calculate carrying amounts at test date
    const carryingAsOfDate = new Date(data.as_of_date);
    const year = carryingAsOfDate.getFullYear();
    const month = carryingAsOfDate.getMonth() + 1;

    const componentCarryingAmounts = [];
    let totalCarryingAmount = 0;

    for (const component of components) {
      const scheduleData = await this.dbInstance
        .select()
        .from(leaseComponentSched)
        .where(
          and(
            eq(leaseComponentSched.leaseComponentId, component.id),
            eq(leaseComponentSched.year, year),
            eq(leaseComponentSched.month, month)
          )
        )
        .limit(1);

      const carryingAmount =
        scheduleData.length > 0
          ? Number(scheduleData[0]!.closeCarry)
          : Number(component.pctOfRou) * 1000000; // Fallback calculation

      componentCarryingAmounts.push({
        component_id: component.id,
        component_code: component.code,
        component_name: component.name,
        carrying_amount: carryingAmount,
      });

      totalCarryingAmount += carryingAmount;
    }

    // Calculate impairment loss
    const recoverableAmount = data.recoverable_amount;
    const impairmentLoss = Math.max(0, totalCarryingAmount - recoverableAmount);

    // Allocate loss to components
    const allocationLines = [];
    for (const component of componentCarryingAmounts) {
      const allocatedLoss =
        impairmentLoss * (component.carrying_amount / totalCarryingAmount);
      const afterAmount = Math.max(
        0,
        component.carrying_amount - allocatedLoss
      );

      // Insert allocation line
      const lineId = ulid();
      await this.dbInstance.insert(leaseImpLine).values({
        id: lineId,
        impairTestId: testId,
        leaseComponentId: component.component_id,
        carryingAmount: component.carrying_amount.toString(),
        allocatedLoss: allocatedLoss.toString(),
        allocatedReversal: '0',
        afterAmount: afterAmount.toString(),
        createdAt: new Date(),
        createdBy: userId, // Add missing createdBy field
      });

      allocationLines.push({
        component_id: component.component_id,
        component_code: component.component_code,
        component_name: component.component_name,
        carrying_amount: component.carrying_amount,
        allocated_loss: allocatedLoss,
        allocated_reversal: 0,
        after_amount: afterAmount,
      });
    }

    // Update test status to MEASURED
    await this.dbInstance
      .update(leaseImpTest)
      .set({
        status: 'MEASURED',
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(leaseImpTest.id, testId));

    return {
      test_id: testId,
      cgu_code: data.cgu_code,
      level: data.level,
      method: data.method,
      as_of_date: data.as_of_date,
      total_carrying_amount: totalCarryingAmount,
      recoverable_amount: recoverableAmount,
      impairment_loss: impairmentLoss,
      allocation_lines: allocationLines,
      measurement_proof: {
        discount_rate: data.discount_rate,
        calculation_method: data.method,
        allocation_basis: 'pro_rata_by_carrying_amount',
        validation_passed: true,
      },
    };
  }

  /**
   * Get impairment tests
   */
  async getImpairmentTests(
    companyId: string,
    query: LeaseImpairTestQueryType
  ): Promise<LeaseImpairTestResponseType[]> {
    let dbQuery = this.dbInstance
      .select({
        id: leaseImpTest.id,
        cgu_code: leaseImpTest.cguCode,
        level: leaseImpTest.level,
        method: leaseImpTest.method,
        discount_rate: leaseImpTest.discountRate,
        recoverable_amount: leaseImpTest.recoverableAmount,
        trigger: leaseImpTest.trigger,
        as_of_date: leaseImpTest.asOfDate,
        status: leaseImpTest.status,
        notes: leaseImpTest.notes,
        created_at: leaseImpTest.createdAt,
        created_by: leaseImpTest.createdBy,
      })
      .from(leaseImpTest)
      .where(eq(leaseImpTest.companyId, companyId));

    const conditions = [eq(leaseImpTest.companyId, companyId)];

    if (query.as_of_date) {
      conditions.push(eq(leaseImpTest.asOfDate, query.as_of_date));
    }
    if (query.cgu_code) {
      conditions.push(eq(leaseImpTest.cguCode, query.cgu_code));
    }
    if (query.status) {
      conditions.push(eq(leaseImpTest.status, query.status));
    }

    const tests = await this.dbInstance
      .select({
        test_id: leaseImpTest.id,
        cgu_code: leaseImpTest.cguCode,
        level: leaseImpTest.level,
        method: leaseImpTest.method,
        discount_rate: leaseImpTest.discountRate,
        recoverable_amount: leaseImpTest.recoverableAmount,
        trigger: leaseImpTest.trigger,
        as_of_date: leaseImpTest.asOfDate,
        status: leaseImpTest.status,
        notes: leaseImpTest.notes,
        created_at: leaseImpTest.createdAt,
        created_by: leaseImpTest.createdBy,
      })
      .from(leaseImpTest)
      .where(and(...conditions))
      .orderBy(desc(leaseImpTest.asOfDate));

    // Get allocation lines for each test
    const result = [];
    for (const test of tests) {
      const lines = await this.dbInstance
        .select({
          component_id: leaseImpLine.leaseComponentId,
          component_code: leaseComponent.code,
          component_name: leaseComponent.name,
          carrying_amount: leaseImpLine.carryingAmount,
          allocated_loss: leaseImpLine.allocatedLoss,
          allocated_reversal: leaseImpLine.allocatedReversal,
          after_amount: leaseImpLine.afterAmount,
        })
        .from(leaseImpLine)
        .innerJoin(
          leaseComponent,
          eq(leaseImpLine.leaseComponentId, leaseComponent.id)
        )
        .where(eq(leaseImpLine.impairTestId, test.test_id));

      result.push({
        test_id: test.test_id,
        cgu_code: test.cgu_code,
        level: test.level,
        method: test.method,
        discount_rate: Number(test.discount_rate),
        recoverable_amount: Number(test.recoverable_amount),
        trigger: test.trigger,
        as_of_date: test.as_of_date,
        status: test.status,
        notes: test.notes,
        allocation_lines: lines.map(l => ({
          component_id: l.component_id,
          component_code: l.component_code,
          component_name: l.component_name,
          carrying_amount: Number(l.carrying_amount),
          allocated_loss: Number(l.allocated_loss),
          allocated_reversal: Number(l.allocated_reversal),
          after_amount: Number(l.after_amount),
        })),
        created_at: test.created_at.toISOString(),
        created_by: test.created_by,
      });
    }

    return result;
  }

  /**
   * Get impairment test detail
   */
  async getImpairmentTestDetail(
    companyId: string,
    testId: string
  ): Promise<any> {
    const testData = await this.dbInstance
      .select()
      .from(leaseImpTest)
      .where(
        and(eq(leaseImpTest.id, testId), eq(leaseImpTest.companyId, companyId))
      )
      .limit(1);

    if (testData.length === 0) {
      throw new Error('Impairment test not found');
    }

    const test = testData[0]!;

    // Get allocation lines
    const lines = await this.dbInstance
      .select({
        component_id: leaseImpLine.leaseComponentId,
        component_code: leaseComponent.code,
        component_name: leaseComponent.name,
        component_class: leaseComponent.class,
        carrying_amount: leaseImpLine.carryingAmount,
        allocated_loss: leaseImpLine.allocatedLoss,
        allocated_reversal: leaseImpLine.allocatedReversal,
        after_amount: leaseImpLine.afterAmount,
      })
      .from(leaseImpLine)
      .innerJoin(
        leaseComponent,
        eq(leaseImpLine.leaseComponentId, leaseComponent.id)
      )
      .where(eq(leaseImpLine.impairTestId, testId));

    return {
      test_id: test.id,
      cgu_code: test.cguCode,
      level: test.level,
      method: test.method,
      discount_rate: Number(test.discountRate),
      recoverable_amount: Number(test.recoverableAmount),
      trigger: test.trigger,
      as_of_date: test.asOfDate,
      status: test.status,
      notes: test.notes,
      allocation_lines: lines.map(l => ({
        component_id: l.component_id,
        component_code: l.component_code,
        component_name: l.component_name,
        component_class: l.component_class,
        carrying_amount: Number(l.carrying_amount),
        allocated_loss: Number(l.allocated_loss),
        allocated_reversal: Number(l.allocated_reversal),
        after_amount: Number(l.after_amount),
      })),
      created_at: test.createdAt,
      created_by: test.createdBy,
      updated_at: test.updatedAt,
      updated_by: test.updatedBy,
    };
  }
}

export class ImpairPostingService {
  constructor(private dbInstance = db) {}

  /**
   * Post impairment charges/reversals
   */
  async postImpairment(
    companyId: string,
    userId: string,
    data: LeaseImpairPostReqType
  ): Promise<LeaseImpairPostResponseType> {
    // Check if test exists and is in MEASURED status
    const testData = await this.dbInstance
      .select()
      .from(leaseImpTest)
      .where(
        and(
          eq(leaseImpTest.id, data.impair_test_id),
          eq(leaseImpTest.companyId, companyId),
          eq(leaseImpTest.status, 'MEASURED')
        )
      )
      .limit(1);

    if (testData.length === 0) {
      throw new Error('Impairment test not found or not in MEASURED status');
    }

    const test = testData[0]!;

    // Check for existing lock
    const existingLock = await this.dbInstance
      .select()
      .from(leaseImpPostLock)
      .where(
        and(
          eq(leaseImpPostLock.companyId, companyId),
          eq(leaseImpPostLock.year, data.year),
          eq(leaseImpPostLock.month, data.month),
          eq(leaseImpPostLock.impairTestId, data.impair_test_id)
        )
      )
      .limit(1);

    if (existingLock.length > 0) {
      throw new Error('Period is locked for this impairment test');
    }

    // Create lock
    const lockId = ulid();
    await this.dbInstance.insert(leaseImpPostLock).values({
      id: lockId,
      companyId,
      year: data.year,
      month: data.month,
      impairTestId: data.impair_test_id,
      postedBy: userId, // Use postedBy instead of lockedBy
      postedAt: new Date(), // Use postedAt instead of lockedAt
    });

    try {
      // Get allocation lines
      const lines = await this.dbInstance
        .select()
        .from(leaseImpLine)
        .where(eq(leaseImpLine.impairTestId, data.impair_test_id));

      if (lines.length === 0) {
        throw new Error('No allocation lines found for impairment test');
      }

      // Calculate totals
      const totalLoss = lines.reduce(
        (sum, line) => sum + Number(line.allocatedLoss),
        0
      );
      const totalReversal = lines.reduce(
        (sum, line) => sum + Number(line.allocatedReversal),
        0
      );

      // Create journal entries (simplified - would integrate with GL system)
      const journalEntryId = ulid();
      const journalLines = [];

      for (const line of lines) {
        if (Number(line.allocatedLoss) > 0) {
          // Impairment loss entry
          journalLines.push({
            dr_account: 'Impairment expense – ROU',
            cr_account: 'Accumulated impairment – ROU',
            amount: Number(line.allocatedLoss),
            memo: `Impairment loss for component ${line.leaseComponentId}`,
          });
        }

        if (Number(line.allocatedReversal) > 0) {
          // Impairment reversal entry
          journalLines.push({
            dr_account: 'Accumulated impairment – ROU',
            cr_account: 'Reversal of impairment (Other income)',
            amount: Number(line.allocatedReversal),
            memo: `Impairment reversal for component ${line.leaseComponentId}`,
          });
        }
      }

      // Create posting record
      const postId = ulid();
      await this.dbInstance.insert(leaseImpPost).values({
        id: postId,
        companyId,
        impairTestId: data.impair_test_id,
        year: data.year,
        month: data.month,
        journalEntryId,
        totalLoss: totalLoss.toString(),
        totalReversal: totalReversal.toString(),
        postedBy: userId,
        postedAt: new Date(),
      });

      // Update test status to POSTED
      await this.dbInstance
        .update(leaseImpTest)
        .set({
          status: 'POSTED',
          updatedAt: new Date(),
          updatedBy: userId,
        })
        .where(eq(leaseImpTest.id, data.impair_test_id));

      return {
        post_id: postId,
        test_id: data.impair_test_id,
        journal_entry_id: journalEntryId,
        year: data.year,
        month: data.month,
        total_loss: totalLoss,
        total_reversal: totalReversal,
        journal_lines: journalLines,
        posted_at: new Date().toISOString(),
        posted_by: userId,
      };
    } catch (error) {
      // Remove lock on error
      await this.dbInstance
        .delete(leaseImpPostLock)
        .where(eq(leaseImpPostLock.id, lockId));
      throw error;
    }
  }

  /**
   * Get impairment postings for a period
   */
  async getImpairmentPostings(
    companyId: string,
    year: number,
    month: number
  ): Promise<any[]> {
    return await this.dbInstance
      .select({
        post_id: leaseImpPost.id,
        test_id: leaseImpPost.impairTestId,
        journal_entry_id: leaseImpPost.journalEntryId,
        total_loss: leaseImpPost.totalLoss,
        total_reversal: leaseImpPost.totalReversal,
        posted_at: leaseImpPost.postedAt,
        posted_by: leaseImpPost.postedBy,
        cgu_code: leaseImpTest.cguCode,
        level: leaseImpTest.level,
        method: leaseImpTest.method,
        as_of_date: leaseImpTest.asOfDate,
      })
      .from(leaseImpPost)
      .innerJoin(leaseImpTest, eq(leaseImpPost.impairTestId, leaseImpTest.id))
      .where(
        and(
          eq(leaseImpPost.companyId, companyId),
          eq(leaseImpPost.year, year),
          eq(leaseImpPost.month, month)
        )
      )
      .orderBy(desc(leaseImpPost.postedAt));
  }
}
