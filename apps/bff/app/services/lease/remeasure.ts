import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte, asc } from 'drizzle-orm';
import {
  lease,
  leaseCashflow,
  leaseOpening,
  leaseSchedule,
  leaseEvent,
  leasePostLock,
  leaseDisclosure,
  leaseAttachment,
  leaseComponent,
  leaseComponentSched,
  leaseImpLine,
  leaseImpTest,
  leaseImpPost,
  leaseImpPostLock,
  leaseCgu,
  leaseImpIndicator,
  leaseOnerousAssessment,
  leaseOnerousRoll,
  sublease,
  subleaseSchedule,
  slbTxn,
  slbAllocation,
} from '@aibos/db-adapter/schema';
import type {
  LeaseEventUpsertType,
  LeaseDisclosureReqType,
  LeaseDisclosureResponseType,
  LeaseEvidenceReqType,
  LeaseDisclosureSnapshotReqType,
  LeaseDisclosureSnapshotResponseType,
  ImpairmentOnerousDisclosureReqType,
  ImpairmentOnerousDisclosureResponseType,
} from '@aibos/contracts';

export class LeaseRemeasureService {
  constructor(private dbInstance = db) {}

  /**
   * Record lease remeasurement or modification
   */
  async recordEvent(
    companyId: string,
    userId: string,
    data: LeaseEventUpsertType
  ): Promise<string> {
    // Find lease by code
    const leaseRecord = await this.dbInstance
      .select()
      .from(lease)
      .where(
        and(
          eq(lease.leaseCode, data.lease_code),
          eq(lease.companyId, companyId)
        )
      )
      .limit(1);

    if (leaseRecord.length === 0) {
      throw new Error('Lease not found');
    }

    const eventId = ulid();

    // Insert lease event
    await this.dbInstance.insert(leaseEvent).values({
      id: eventId,
      leaseId: leaseRecord[0]?.id || '',
      kind: data.kind,
      effectiveOn: data.effective_on,
      terminationFlag: data.termination_flag,
      notes: data.notes,
      indexRate: data.index_rate?.toString(),
      deltaTerm: data.delta_term,
      deltaPay: data.delta_pay?.toString(),
      scopeChangePct: data.scope_change_pct?.toString(),
      createdAt: new Date(),
      createdBy: userId,
    });

    return eventId;
  }

  /**
   * Generate lease disclosure
   */
  async generateDisclosure(
    companyId: string,
    userId: string,
    data: LeaseDisclosureReqType
  ): Promise<LeaseDisclosureResponseType> {
    const { year, month } = data;

    // Get lease data
    const leases = await this.dbInstance
      .select()
      .from(lease)
      .where(eq(lease.companyId, companyId));

    // Get lease components
    const components = await this.dbInstance
      .select()
      .from(leaseComponent)
      .where(eq(leaseComponent.companyId, companyId));

    // Get lease schedules
    const schedules = await this.dbInstance
      .select()
      .from(leaseComponentSched)
      .where(
        and(
          eq(leaseComponentSched.companyId, companyId),
          eq(leaseComponentSched.year, year),
          eq(leaseComponentSched.month, month)
        )
      );

    // Calculate disclosure totals
    const disclosureData = this.calculateDisclosureTotals(
      leases,
      components,
      schedules
    );

    // Insert disclosure record
    const disclosureId = ulid();
    await this.dbInstance.insert(leaseDisclosure).values({
      id: disclosureId,
      companyId,
      year,
      month,
      maturityJsonb: disclosureData.maturity_analysis,
      rollforwardJsonb: disclosureData.rollforward,
      wadr: disclosureData.wadr.toString(),
      shortTermExpense: disclosureData.short_term_expense.toString(),
      lowValueExpense: disclosureData.low_value_expense.toString(),
      variableExpense: disclosureData.variable_expense.toString(),
      totalCashOutflow: disclosureData.total_cash_outflow.toString(),
    });

    return {
      maturity_analysis: disclosureData.maturity_analysis,
      rollforward: disclosureData.rollforward,
      wadr: disclosureData.wadr,
      expenses: {
        short_term: disclosureData.short_term_expense,
        low_value: disclosureData.low_value_expense,
        variable: disclosureData.variable_expense,
      },
      total_cash_outflow: disclosureData.total_cash_outflow,
    };
  }

  /**
   * Calculate disclosure totals
   */
  private calculateDisclosureTotals(
    leases: any[],
    components: any[],
    schedules: any[]
  ): any {
    const totals = {
      maturity_analysis: {
        within_1_year: 0,
        between_1_2_years: 0,
        between_2_3_years: 0,
        between_3_5_years: 0,
        beyond_5_years: 0,
        total_undiscounted: 0,
      },
      rollforward: {
        opening_rou: 0,
        opening_liability: 0,
        additions: 0,
        disposals: 0,
        modifications: 0,
        closing_rou: 0,
        closing_liability: 0,
      },
      wadr: 0,
      short_term_expense: 0,
      low_value_expense: 0,
      variable_expense: 0,
      total_cash_outflow: 0,
    };

    // Calculate totals from schedules
    schedules.forEach(schedule => {
      totals.rollforward.closing_rou += Number(schedule.closeCarry || 0);
      totals.rollforward.closing_liability += Number(schedule.closeCarry || 0);
    });

    return totals;
  }

  /**
   * Generate impairment disclosure
   */
  async generateImpairmentDisclosure(
    companyId: string,
    userId: string,
    data: ImpairmentOnerousDisclosureReqType
  ): Promise<ImpairmentOnerousDisclosureResponseType> {
    const { year, month } = data;

    // Get impairment test data
    const impairmentTests = await this.dbInstance
      .select()
      .from(leaseImpTest)
      .where(eq(leaseImpTest.companyId, companyId));

    // Get impairment lines
    const impairmentLines = await this.dbInstance
      .select()
      .from(leaseImpLine)
      .where(eq(leaseImpLine.posted, true));

    // Get onerous assessment data
    const onerousAssessments = await this.dbInstance
      .select()
      .from(leaseOnerousAssessment)
      .where(
        and(
          eq(leaseOnerousAssessment.companyId, companyId),
          eq(leaseOnerousAssessment.status, 'ACTIVE')
        )
      );

    // Get onerous roll data
    const onerousRolls = await this.dbInstance
      .select()
      .from(leaseOnerousRoll)
      .where(
        and(eq(leaseOnerousRoll.year, year), eq(leaseOnerousRoll.month, month))
      );

    // Calculate impairment totals
    const impairmentTotals = this.calculateImpairmentTotals(impairmentLines);

    // Calculate onerous totals
    const onerousTotals = this.calculateOnerousTotals(onerousRolls);

    // Insert disclosure record
    const disclosureId = ulid();
    await this.dbInstance.insert(leaseDisclosure).values({
      id: disclosureId,
      companyId,
      year,
      month,
      maturityJsonb: {
        impairment_summary: impairmentTotals,
        onerous_summary: onerousTotals,
      },
      rollforwardJsonb: {},
      wadr: '0',
      shortTermExpense: '0',
      lowValueExpense: '0',
      variableExpense: '0',
      totalCashOutflow: '0',
    });

    return {
      impairment_summary: impairmentTotals,
      onerous_summary: onerousTotals,
      indicators_summary: {
        total_indicators: 0,
        severity_breakdown: {},
        kind_breakdown: {},
      },
    };
  }

  /**
   * Calculate impairment totals
   */
  private calculateImpairmentTotals(impairmentLines: any[]): {
    total_loss: number;
    total_reversal: number;
    cgu_count: number;
    method_breakdown: Record<string, number>;
  } {
    const totals = {
      total_loss: 0,
      total_reversal: 0,
      cgu_count: 0,
      method_breakdown: {} as Record<string, number>,
    };

    impairmentLines.forEach(line => {
      const loss = Number(line.allocatedLoss || 0);
      const reversal = Number(line.allocatedReversal || 0);

      totals.total_loss += loss;
      totals.total_reversal += reversal;
      totals.cgu_count += 1;

      // Method breakdown (simplified)
      const method = 'STRAIGHT_LINE'; // This should come from the test
      totals.method_breakdown[method] =
        (totals.method_breakdown[method] || 0) + loss;
    });

    return totals;
  }

  /**
   * Calculate onerous totals
   */
  private calculateOnerousTotals(onerousRolls: any[]): {
    total_opening: number;
    total_charge: number;
    total_unwind: number;
    total_utilization: number;
    total_closing: number;
    assessment_count: number;
  } {
    const totals = {
      total_opening: 0,
      total_charge: 0,
      total_unwind: 0,
      total_utilization: 0,
      total_closing: 0,
      assessment_count: onerousRolls.length,
    };

    onerousRolls.forEach(roll => {
      totals.total_opening += Number(roll.opening || 0);
      totals.total_charge += Number(roll.charge || 0);
      totals.total_unwind += Number(roll.unwind || 0);
      totals.total_utilization += Number(roll.utilization || 0);
      totals.total_closing += Number(roll.closing || 0);
    });

    return totals;
  }

  /**
   * Generate disclosure snapshot
   */
  async generateDisclosureSnapshot(
    companyId: string,
    userId: string,
    data: LeaseDisclosureSnapshotReqType
  ): Promise<LeaseDisclosureSnapshotResponseType> {
    const { year, month } = data;

    // Get existing disclosure
    const disclosure = await this.dbInstance
      .select()
      .from(leaseDisclosure)
      .where(
        and(
          eq(leaseDisclosure.companyId, companyId),
          eq(leaseDisclosure.year, year),
          eq(leaseDisclosure.month, month)
        )
      )
      .orderBy(desc(leaseDisclosure.createdAt))
      .limit(1);

    if (disclosure.length === 0) {
      throw new Error('No disclosure found for the specified period');
    }

    const snapshotId = ulid();

    // Create snapshot
    await this.dbInstance.insert(leaseDisclosure).values({
      id: snapshotId,
      companyId,
      year,
      month,
      maturityJsonb: disclosure[0]?.maturityJsonb || {},
      rollforwardJsonb: disclosure[0]?.rollforwardJsonb || {},
      wadr: disclosure[0]?.wadr || '0',
      shortTermExpense: disclosure[0]?.shortTermExpense || '0',
      lowValueExpense: disclosure[0]?.lowValueExpense || '0',
      variableExpense: disclosure[0]?.variableExpense || '0',
      totalCashOutflow: disclosure[0]?.totalCashOutflow || '0',
    });

    return {
      snapshot_id: snapshotId,
      period: `${year}-${month.toString().padStart(2, '0')}`,
      maturity_analysis: (disclosure[0]?.maturityJsonb as any) || {},
      rollforward: (disclosure[0]?.rollforwardJsonb as any) || {},
      wadr: Number(disclosure[0]?.wadr || '0'),
      expenses: {
        short_term: Number(disclosure[0]?.shortTermExpense || '0'),
        low_value: Number(disclosure[0]?.lowValueExpense || '0'),
        variable: Number(disclosure[0]?.variableExpense || '0'),
      },
      total_cash_outflow: Number(disclosure[0]?.totalCashOutflow || '0'),
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Get lease evidence
   */
  async getLeaseEvidence(
    companyId: string,
    data: LeaseEvidenceReqType
  ): Promise<any> {
    const { lease_code, evidence_id } = data;

    // Find lease by code
    const leaseRecord = await this.dbInstance
      .select()
      .from(lease)
      .where(
        and(eq(lease.leaseCode, lease_code), eq(lease.companyId, companyId))
      )
      .limit(1);

    if (leaseRecord.length === 0) {
      throw new Error('Lease not found');
    }

    // Get lease attachments
    const attachments = await this.dbInstance
      .select()
      .from(leaseAttachment)
      .where(
        and(
          eq(leaseAttachment.leaseId, leaseRecord[0]?.id || ''),
          eq(leaseAttachment.evidenceId, evidence_id)
        )
      );

    return {
      lease_code,
      evidence_id,
      attachments: attachments.map(att => ({
        id: att.id,
        attachment_type: att.attachmentType,
        description: att.description,
        uploaded_at: att.uploadedAt,
        uploaded_by: att.uploadedBy,
      })),
    };
  }

  /**
   * Get component disclosures for a specific period
   */
  async getComponentDisclosures(
    companyId: string,
    year: number,
    month: number
  ): Promise<any> {
    // Get lease components
    const components = await this.dbInstance
      .select()
      .from(leaseComponent)
      .where(
        and(
          eq(leaseComponent.companyId, companyId),
          eq(leaseComponent.status, 'ACTIVE')
        )
      );

    // Get component schedules for the period
    const schedules = await this.dbInstance
      .select()
      .from(leaseComponentSched)
      .where(
        and(
          eq(leaseComponentSched.companyId, companyId),
          eq(leaseComponentSched.year, year),
          eq(leaseComponentSched.month, month)
        )
      );

    // Get leases for context
    const leases = await this.dbInstance
      .select()
      .from(lease)
      .where(eq(lease.companyId, companyId));

    // Build component disclosure data
    const componentDisclosures = components.map(component => {
      const lease = leases.find(l => l.id === component.leaseId);
      const schedule = schedules.find(s => s.leaseComponentId === component.id);

      return {
        component_id: component.id,
        component_code: component.code,
        component_name: component.name,
        lease_id: component.leaseId,
        lease_code: lease?.leaseCode,
        asset_class: lease?.assetClass,
        carrying_amount: schedule ? Number(schedule.closeCarry || 0) : 0,
        liability_amount: schedule ? Number(schedule.closeCarry || 0) : 0,
        interest_expense: schedule ? Number(schedule.liabInterest || 0) : 0,
        amortization_expense: schedule ? Number(schedule.rouAmort || 0) : 0,
        year,
        month,
      };
    });

    return {
      period: `${year}-${month.toString().padStart(2, '0')}`,
      component_count: componentDisclosures.length,
      total_carrying_amount: componentDisclosures.reduce(
        (sum, comp) => sum + comp.carrying_amount,
        0
      ),
      total_liability_amount: componentDisclosures.reduce(
        (sum, comp) => sum + comp.liability_amount,
        0
      ),
      total_interest_expense: componentDisclosures.reduce(
        (sum, comp) => sum + comp.interest_expense,
        0
      ),
      total_amortization_expense: componentDisclosures.reduce(
        (sum, comp) => sum + comp.amortization_expense,
        0
      ),
      components: componentDisclosures,
    };
  }

  /**
   * Post lease remeasurement
   */
  async postRemeasurement(
    companyId: string,
    userId: string,
    data: {
      year: number;
      month: number;
      leaseIds: string[];
    }
  ): Promise<{ success: boolean; message: string; journalId?: string }> {
    try {
      const { year, month, leaseIds } = data;

      // Get lease data for posting
      const leases = await this.dbInstance
        .select()
        .from(lease)
        .where(
          and(
            eq(lease.companyId, companyId),
            sql`${lease.id} = ANY(${leaseIds})`
          )
        );

      if (leases.length === 0) {
        return {
          success: false,
          message: 'No leases found for posting',
        };
      }

      // Create post lock
      const postLockId = ulid();
      await this.dbInstance.insert(leasePostLock).values({
        id: postLockId,
        companyId,
        year,
        month,
        status: 'POSTED',
        postedAt: new Date(),
        postedBy: userId,
      });

      return {
        success: true,
        message: 'Remeasurement posted successfully',
        journalId: postLockId,
      };
    } catch (error) {
      console.error('Error posting remeasurement:', error);
      return {
        success: false,
        message: `Failed to post remeasurement: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Get lease events for a specific lease
   */
  async getLeaseEvents(companyId: string, leaseCode: string): Promise<any[]> {
    // Find lease by code
    const leaseRecord = await this.dbInstance
      .select()
      .from(lease)
      .where(
        and(eq(lease.leaseCode, leaseCode), eq(lease.companyId, companyId))
      )
      .limit(1);

    if (leaseRecord.length === 0) {
      throw new Error('Lease not found');
    }

    // Get lease events
    const events = await this.dbInstance
      .select()
      .from(leaseEvent)
      .where(eq(leaseEvent.leaseId, leaseRecord[0]?.id || ''))
      .orderBy(desc(leaseEvent.effectiveOn));

    return events.map(event => ({
      id: event.id,
      kind: event.kind,
      effective_on: event.effectiveOn,
      termination_flag: event.terminationFlag,
      notes: event.notes,
      index_rate: event.indexRate ? Number(event.indexRate) : null,
      delta_term: event.deltaTerm,
      delta_pay: event.deltaPay ? Number(event.deltaPay) : null,
      scope_change_pct: event.scopeChangePct
        ? Number(event.scopeChangePct)
        : null,
      created_at: event.createdAt,
      created_by: event.createdBy,
    }));
  }

  /**
   * Generate disclosures (alias for generateDisclosure)
   */
  async generateDisclosures(
    companyId: string,
    userId: string,
    data: LeaseDisclosureReqType
  ): Promise<LeaseDisclosureResponseType> {
    return this.generateDisclosure(companyId, userId, data);
  }

  /**
   * Get impairment disclosures (alias for generateImpairmentDisclosure)
   */
  async getImpairmentDisclosures(
    companyId: string,
    userId: string,
    data: ImpairmentOnerousDisclosureReqType
  ): Promise<ImpairmentOnerousDisclosureResponseType> {
    return this.generateImpairmentDisclosure(companyId, userId, data);
  }

  /**
   * Store disclosures
   */
  async storeDisclosures(
    companyId: string,
    userId: string,
    data: LeaseDisclosureReqType
  ): Promise<string> {
    const result = await this.generateDisclosure(companyId, userId, data);
    // Return a mock ID for now
    return ulid();
  }

  /**
   * Generate sublease SLB disclosure
   */
  async generateSubleaseSlbDisclosure(
    companyId: string,
    userId: string,
    data: any
  ): Promise<any> {
    // Mock implementation
    return {
      sublease_summary: {},
      slb_summary: {},
      generated_at: new Date().toISOString(),
    };
  }

  /**
   * Link evidence
   */
  async linkEvidence(
    companyId: string,
    userId: string,
    data: any
  ): Promise<string> {
    // Mock implementation
    return ulid();
  }
}

// Export aliases for backward compatibility
export const LeaseDisclosureService = LeaseRemeasureService;
export const LeaseEvidenceService = LeaseRemeasureService;
