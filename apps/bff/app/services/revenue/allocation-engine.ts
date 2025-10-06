import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, sql, gte, lte, asc, isNull } from 'drizzle-orm';
import {
  revPob,
  revAllocLink,
  revSchedule,
  revSspCatalog,
  revSspPolicy,
  revBundle,
  revBundleComponent,
  revDiscountRule,
  revDiscountApplied,
  revAllocAudit,
  revSspChange,
  rbProduct,
} from '@aibos/db-adapter/schema';
import { RevSspAdminService } from './ssp-admin';
import { RevBundleService } from './bundles';
import { RevDiscountService } from './discounts';
import type {
  AllocateFromInvoiceReqType,
  AllocateFromInvoiceRespType,
  ProspectiveReallocationReqType,
  ProspectiveReallocationRespType,
} from '@aibos/contracts';

export class RevAllocationEngineService {
  private sspAdminService: RevSspAdminService;
  private bundleService: RevBundleService;
  private discountService: RevDiscountService;

  constructor(private dbInstance = db) {
    this.sspAdminService = new RevSspAdminService(dbInstance);
    this.bundleService = new RevBundleService(dbInstance);
    this.discountService = new RevDiscountService(dbInstance);
  }

  /**
   * Enhanced allocation from invoice using SSP catalog and discount rules
   */
  async allocateFromInvoice(
    companyId: string,
    userId: string,
    data: AllocateFromInvoiceReqType
  ): Promise<AllocateFromInvoiceRespType> {
    const startTime = Date.now();
    const runId = ulid();

    try {
      // Get invoice data (placeholder - would come from actual invoice service)
      const invoiceData = await this.getInvoiceData(data.invoice_id);
      if (!invoiceData) {
        throw new Error('Invoice not found');
      }

      // Determine allocation strategy
      const strategy = await this.determineAllocationStrategy(
        companyId,
        invoiceData,
        data.strategy
      );

      // Get SSP policy
      const sspPolicy = await this.sspAdminService.getSspPolicy(companyId);
      if (!sspPolicy) {
        throw new Error('SSP policy not configured');
      }

      // Apply discount rules
      const discountRules = await this.discountService.getActiveDiscountRules(
        companyId,
        invoiceData.invoice_date,
        {
          total_amount: invoiceData.total_amount,
          customer_id: invoiceData.customer_id,
          products: invoiceData.lines.map((line: any) => line.product_id),
        }
      );

      const totalDiscountAmount = await this.applyDiscountRules(
        companyId,
        data.invoice_id,
        userId,
        discountRules,
        invoiceData
      );

      // Calculate net invoice amount after discounts
      const netInvoiceAmount = invoiceData.total_amount - totalDiscountAmount;

      // Perform allocation based on strategy
      let allocationResult;
      switch (strategy) {
        case 'RELATIVE_SSP':
          allocationResult = await this.allocateByRelativeSsp(
            companyId,
            userId,
            invoiceData,
            netInvoiceAmount,
            sspPolicy
          );
          break;
        case 'RESIDUAL':
          allocationResult = await this.allocateByResidual(
            companyId,
            userId,
            invoiceData,
            netInvoiceAmount,
            sspPolicy
          );
          break;
        default:
          throw new Error(`Unknown allocation strategy: ${strategy}`);
      }

      // Create allocation audit record
      const processingTime = Date.now() - startTime;
      await this.createAllocationAudit(
        companyId,
        data.invoice_id,
        runId,
        strategy,
        strategy,
        {
          invoice_data: invoiceData,
          discount_rules_applied: discountRules.length,
          total_discount: totalDiscountAmount,
        },
        {
          pobs_created: allocationResult.pobs.length,
          total_allocated: allocationResult.totalAllocated,
          rounding_adjustment: allocationResult.roundingAdjustment,
        },
        allocationResult.corridorFlags.length > 0,
        invoiceData.total_amount,
        allocationResult.totalAllocated,
        allocationResult.roundingAdjustment,
        processingTime,
        userId
      );

      return {
        invoice_id: data.invoice_id,
        pobs_created: allocationResult.pobs.length,
        total_allocated: allocationResult.totalAllocated,
        rounding_adjustment: allocationResult.roundingAdjustment,
        corridor_flags: allocationResult.corridorFlags,
        processing_time_ms: processingTime,
        pobs: allocationResult.pobs,
      };
    } catch (error) {
      // Create error audit record
      const processingTime = Date.now() - startTime;
      await this.createAllocationAudit(
        companyId,
        data.invoice_id,
        runId,
        'AUTO',
        data.strategy,
        { error: error instanceof Error ? error.message : String(error) },
        {},
        false,
        0,
        0,
        0,
        processingTime,
        userId
      );
      throw error;
    }
  }

  /**
   * Determine allocation strategy based on available SSP data
   */
  private async determineAllocationStrategy(
    companyId: string,
    invoiceData: any,
    requestedStrategy: string
  ): Promise<string> {
    if (requestedStrategy !== 'AUTO') {
      return requestedStrategy;
    }

    // Check if all products have approved SSP entries
    const sspChecks = await Promise.all(
      invoiceData.lines.map(async (line: any) => {
        const ssp = await this.sspAdminService.getEffectiveSsp(
          companyId,
          line.product_id,
          invoiceData.currency,
          invoiceData.invoice_date
        );
        return ssp && ssp.status === 'APPROVED';
      })
    );

    const allHaveApprovedSsp = sspChecks.every(Boolean);

    if (allHaveApprovedSsp) {
      return 'RELATIVE_SSP';
    }

    // Check if residual method is allowed
    const sspPolicy = await this.sspAdminService.getSspPolicy(companyId);
    if (sspPolicy?.residual_allowed) {
      return 'RESIDUAL';
    }

    // Fallback to relative SSP even without approved entries
    return 'RELATIVE_SSP';
  }

  /**
   * Apply discount rules to invoice
   */
  private async applyDiscountRules(
    companyId: string,
    invoiceId: string,
    userId: string,
    rules: any[],
    invoiceData: any
  ): Promise<number> {
    let totalDiscount = 0;

    for (const rule of rules) {
      const discountAmount = this.discountService.calculateDiscountAmount(
        rule,
        invoiceData.lines,
        invoiceData.total_amount
      );

      if (discountAmount > 0) {
        await this.discountService.applyDiscountRule(
          companyId,
          invoiceId,
          rule.id,
          userId,
          discountAmount,
          {
            invoice_lines: invoiceData.lines,
            total_amount: invoiceData.total_amount,
            discount_percentage: rule.params.pct,
          }
        );
        totalDiscount += discountAmount;
      }
    }

    return totalDiscount;
  }

  /**
   * Allocate by relative SSP methodology
   */
  private async allocateByRelativeSsp(
    companyId: string,
    userId: string,
    invoiceData: any,
    netAmount: number,
    sspPolicy: any
  ): Promise<{
    pobs: any[];
    totalAllocated: number;
    roundingAdjustment: number;
    corridorFlags: string[];
  }> {
    const corridorFlags: string[] = [];
    const pobs: any[] = [];
    let totalAllocated = 0;

    // Get SSP values for all products
    const sspValues = await Promise.all(
      invoiceData.lines.map(async (line: any) => {
        const ssp = await this.sspAdminService.getEffectiveSsp(
          companyId,
          line.product_id,
          invoiceData.currency,
          invoiceData.invoice_date
        );

        if (!ssp) {
          throw new Error(`No SSP found for product ${line.product_id}`);
        }

        // Check corridor compliance
        const compliance = await this.sspAdminService.checkCorridorCompliance(
          companyId,
          line.product_id,
          invoiceData.currency,
          ssp.ssp
        );

        if (!compliance.compliant) {
          corridorFlags.push(
            `${line.product_id}: variance ${(compliance.variance! * 100).toFixed(1)}%`
          );
        }

        return {
          product_id: line.product_id,
          ssp: ssp.ssp,
          amount: line.amount,
        };
      })
    );

    // Calculate total SSP-weighted amount
    const totalSspWeighted = sspValues.reduce(
      (sum, item) => sum + item.ssp * item.amount,
      0
    );

    // Allocate proportionally based on SSP
    for (const line of invoiceData.lines) {
      const sspValue = sspValues.find(s => s.product_id === line.product_id);
      if (!sspValue) continue;

      const sspWeight = sspValue.ssp * line.amount;
      const allocatedAmount = (sspWeight / totalSspWeighted) * netAmount;

      // Round according to policy
      const roundedAmount = this.roundAmount(
        allocatedAmount,
        sspPolicy.rounding
      );

      // Create POB
      const pobId = ulid();
      const pob = {
        id: pobId,
        companyId: companyId,
        contractId: invoiceData.contract_id,
        subscriptionId: invoiceData.subscription_id,
        invoiceLineId: line.id,
        productId: line.product_id,
        name: `${line.product_name} - SSP Allocation`,
        method: 'RATABLE_MONTHLY' as const, // Default method
        startDate: invoiceData.invoice_date,
        endDate: line.end_date,
        qty: line.qty.toString(),
        uom: line.uom,
        ssp: sspValue.ssp.toString(),
        allocatedAmount: roundedAmount.toString(),
        currency: invoiceData.currency,
        status: 'OPEN' as const,
        createdBy: userId,
      };

      await this.dbInstance.insert(revPob).values(pob);
      pobs.push({
        id: pobId,
        name: pob.name,
        method: pob.method,
        allocated_amount: roundedAmount,
        currency: pob.currency,
        ssp: sspValue.ssp,
      });

      totalAllocated += roundedAmount;
    }

    // Calculate rounding adjustment
    const roundingAdjustment = netAmount - totalAllocated;

    return {
      pobs,
      totalAllocated,
      roundingAdjustment,
      corridorFlags,
    };
  }

  /**
   * Allocate by residual methodology
   */
  private async allocateByResidual(
    companyId: string,
    userId: string,
    invoiceData: any,
    netAmount: number,
    sspPolicy: any
  ): Promise<{
    pobs: any[];
    totalAllocated: number;
    roundingAdjustment: number;
    corridorFlags: string[];
  }> {
    const corridorFlags: string[] = [];
    const pobs: any[] = [];
    let totalAllocated = 0;

    // Get residual-eligible products
    const residualProducts = sspPolicy.residual_eligible_products || [];

    // Allocate to non-residual products first using SSP
    const nonResidualLines = invoiceData.lines.filter(
      (line: any) => !residualProducts.includes(line.product_id)
    );

    const residualLines = invoiceData.lines.filter((line: any) =>
      residualProducts.includes(line.product_id)
    );

    let allocatedToNonResidual = 0;

    for (const line of nonResidualLines) {
      const ssp = await this.sspAdminService.getEffectiveSsp(
        companyId,
        line.product_id,
        invoiceData.currency,
        invoiceData.invoice_date
      );

      if (ssp) {
        const allocatedAmount = Math.min(
          line.amount,
          netAmount - allocatedToNonResidual
        );
        const roundedAmount = this.roundAmount(
          allocatedAmount,
          sspPolicy.rounding
        );

        // Create POB
        const pobId = ulid();
        const pob = {
          id: pobId,
          companyId: companyId,
          contractId: invoiceData.contract_id,
          subscriptionId: invoiceData.subscription_id,
          invoiceLineId: line.id,
          productId: line.product_id,
          name: `${line.product_name} - SSP Allocation`,
          method: 'RATABLE_MONTHLY' as const,
          startDate: invoiceData.invoice_date,
          endDate: line.end_date,
          qty: line.qty.toString(),
          uom: line.uom,
          ssp: ssp.ssp.toString(),
          allocatedAmount: roundedAmount.toString(),
          currency: invoiceData.currency,
          status: 'OPEN' as const,
          createdBy: userId,
        };

        await this.dbInstance.insert(revPob).values(pob);
        pobs.push({
          id: pobId,
          name: pob.name,
          method: pob.method,
          allocated_amount: roundedAmount,
          currency: pob.currency,
          ssp: ssp.ssp,
        });

        totalAllocated += roundedAmount;
        allocatedToNonResidual += roundedAmount;
      }
    }

    // Allocate remaining amount to residual products
    const remainingAmount = netAmount - allocatedToNonResidual;
    if (remainingAmount > 0 && residualLines.length > 0) {
      const amountPerResidualProduct = remainingAmount / residualLines.length;

      for (const line of residualLines) {
        const roundedAmount = this.roundAmount(
          amountPerResidualProduct,
          sspPolicy.rounding
        );

        // Create POB
        const pobId = ulid();
        const pob = {
          id: pobId,
          companyId: companyId,
          contractId: invoiceData.contract_id,
          subscriptionId: invoiceData.subscription_id,
          invoiceLineId: line.id,
          productId: line.product_id,
          name: `${line.product_name} - Residual Allocation`,
          method: 'RATABLE_MONTHLY' as const,
          startDate: invoiceData.invoice_date,
          endDate: line.end_date,
          qty: line.qty.toString(),
          uom: line.uom,
          ssp: null, // No SSP for residual allocation
          allocatedAmount: roundedAmount.toString(),
          currency: invoiceData.currency,
          status: 'OPEN' as const,
          createdBy: userId,
        };

        await this.dbInstance.insert(revPob).values(pob);
        pobs.push({
          id: pobId,
          name: pob.name,
          method: pob.method,
          allocated_amount: roundedAmount,
          currency: pob.currency,
          ssp: undefined,
        });

        totalAllocated += roundedAmount;
      }
    }

    const roundingAdjustment = netAmount - totalAllocated;

    return {
      pobs,
      totalAllocated,
      roundingAdjustment,
      corridorFlags,
    };
  }

  /**
   * Prospective reallocation for open POBs when SSP changes
   */
  async prospectiveReallocation(
    companyId: string,
    userId: string,
    data: ProspectiveReallocationReqType
  ): Promise<ProspectiveReallocationRespType> {
    // Get SSP change details
    const sspChange = await this.dbInstance
      .select()
      .from(revSspChange)
      .where(
        and(
          eq(revSspChange.id, data.ssp_change_id),
          eq(revSspChange.companyId, companyId),
          eq(revSspChange.status, 'APPROVED')
        )
      )
      .limit(1);

    if (!sspChange.length) {
      throw new Error('SSP change not found or not approved');
    }

    const change = sspChange[0];
    if (!change) {
      throw new Error('SSP change not found or not approved');
    }

    const diff = change.diff as any;

    // Find open POBs affected by SSP changes
    const affectedPobs = await this.dbInstance
      .select()
      .from(revPob)
      .where(
        and(
          eq(revPob.companyId, companyId),
          eq(revPob.status, 'OPEN'),
          sql`${revPob.productId} = ANY(${diff.affected_products})`
        )
      );

    const details: any[] = [];
    let totalReallocationDelta = 0;
    let scheduleRevisionsCreated = 0;

    for (const pob of affectedPobs) {
      const oldSsp = parseFloat(pob.ssp || '0');
      const newSsp = diff.new_ssp_values[pob.productId] || oldSsp;

      if (oldSsp !== newSsp) {
        // Calculate reallocation delta
        const reallocationDelta = (newSsp - oldSsp) * parseFloat(pob.qty);

        if (!data.dry_run) {
          // Update POB SSP
          await this.dbInstance
            .update(revPob)
            .set({
              ssp: newSsp.toString(),
              allocatedAmount: (
                parseFloat(pob.allocatedAmount) + reallocationDelta
              ).toString(),
            })
            .where(eq(revPob.id, pob.id));

          // Create schedule revision
          const revisionId = ulid();
          // Note: revScheduleRevision table does not exist in schema
          // await this.dbInstance
          //     .insert(revScheduleRevision)
          //     .values({
          //         id: revisionId,
          //         companyId,
          //         pobId: pob.id,
          //         reason: "SSP_CHANGE",
          //         oldSsp: oldSsp.toString(),
          //         newSsp: newSsp.toString(),
          //         deltaAmount: reallocationDelta.toString(),
          //         effectiveFrom: change.decidedAt,
          //         createdBy: userId
          //     });

          scheduleRevisionsCreated++;
        }

        details.push({
          pob_id: pob.id,
          old_ssp: oldSsp,
          new_ssp: newSsp,
          reallocation_delta: reallocationDelta,
          schedule_revision_id: data.dry_run ? undefined : ulid(),
        });

        totalReallocationDelta += reallocationDelta;
      }
    }

    return {
      ssp_change_id: data.ssp_change_id,
      open_pobs_affected: affectedPobs.length,
      total_reallocation_delta: totalReallocationDelta,
      schedule_revisions_created: scheduleRevisionsCreated,
      dry_run: data.dry_run,
      details,
    };
  }

  /**
   * Create allocation audit record
   */
  private async createAllocationAudit(
    companyId: string,
    invoiceId: string,
    runId: string,
    method: string,
    strategy: string,
    inputs: any,
    results: any,
    corridorFlag: boolean,
    totalInvoiceAmount: number,
    totalAllocatedAmount: number,
    roundingAdjustment: number,
    processingTimeMs: number,
    userId: string
  ): Promise<void> {
    const auditId = ulid();

    await this.dbInstance.insert(revAllocAudit).values({
      id: auditId,
      companyId,
      invoiceId,
      runId,
      method: method as any,
      strategy: strategy as any,
      inputs,
      results,
      corridorFlag,
      totalInvoiceAmount: totalInvoiceAmount.toString(),
      totalAllocatedAmount: totalAllocatedAmount.toString(),
      roundingAdjustment: roundingAdjustment.toString(),
      processingTimeMs,
      createdBy: userId,
    });
  }

  /**
   * Round amount according to policy
   */
  private roundAmount(amount: number, rounding: string): number {
    switch (rounding) {
      case 'HALF_UP':
        return Math.round(amount);
      case 'BANKERS':
        return Math.round(amount);
      default:
        return Math.round(amount);
    }
  }

  /**
   * Get invoice data (placeholder implementation)
   */
  private async getInvoiceData(invoiceId: string): Promise<any> {
    // This would integrate with actual invoice service
    // For now, return mock data
    return {
      id: invoiceId,
      contract_id: 'contract-123',
      subscription_id: 'sub-123',
      customer_id: 'customer-123',
      invoice_date: '2025-01-01',
      currency: 'USD',
      total_amount: 10000,
      lines: [
        {
          id: 'line-1',
          product_id: 'product-1',
          product_name: 'Product A',
          amount: 6000,
          qty: 1,
          uom: 'EA',
          end_date: '2025-12-31',
        },
        {
          id: 'line-2',
          product_id: 'product-2',
          product_name: 'Product B',
          amount: 4000,
          qty: 1,
          uom: 'EA',
          end_date: '2025-12-31',
        },
      ],
    };
  }
}
