import { db } from '@/lib/db';
import { ulid } from 'ulid';
import {
  eq,
  and,
  desc,
  sql,
  gte,
  lte,
  asc,
  isNull,
  inArray,
} from 'drizzle-orm';
import {
  revSspCatalog,
  revSspEvidence,
  revSspPolicy,
  revSspChange,
  rbProduct,
} from '@aibos/db-adapter/schema';
import type {
  SspUpsertType,
  SspEvidenceUpsertType,
  SspPolicyUpsertType,
  SspChangeRequestType,
  SspChangeDecisionType,
  SspQueryType,
  SspCatalogResponseType,
  SspEvidenceResponseType,
  SspPolicyResponseType,
  SspChangeResponseType,
} from '@aibos/contracts';

export class RevSspAdminService {
  constructor(private dbInstance = db) {}

  /**
   * Upsert SSP catalog entry with effective dating
   */
  async upsertSspCatalog(
    companyId: string,
    userId: string,
    data: SspUpsertType
  ): Promise<SspCatalogResponseType> {
    const catalogId = ulid();

    // Check for existing active entry
    const existing = await this.dbInstance
      .select()
      .from(revSspCatalog)
      .where(
        and(
          eq(revSspCatalog.companyId, companyId),
          eq(revSspCatalog.productId, data.product_id),
          eq(revSspCatalog.currency, data.currency),
          eq(revSspCatalog.status, 'APPROVED'),
          isNull(revSspCatalog.effectiveTo)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // End-date the existing entry
      await this.dbInstance
        .update(revSspCatalog)
        .set({
          effectiveTo: data.effective_from,
          updatedAt: new Date(),
          updatedBy: userId,
        })
        .where(eq(revSspCatalog.id, existing[0]!.id));
    }

    // Create new entry
    const [catalog] = await this.dbInstance
      .insert(revSspCatalog)
      .values({
        id: catalogId,
        companyId,
        productId: data.product_id,
        currency: data.currency,
        ssp: data.ssp.toString(),
        method: data.method,
        effectiveFrom: data.effective_from,
        effectiveTo: data.effective_to || null,
        corridorMinPct: data.corridor_min_pct?.toString() || null,
        corridorMaxPct: data.corridor_max_pct?.toString() || null,
        status: 'DRAFT',
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    return this.mapCatalogToResponse(catalog);
  }

  /**
   * Add evidence to SSP catalog entry
   */
  async addSspEvidence(
    companyId: string,
    userId: string,
    data: SspEvidenceUpsertType
  ): Promise<SspEvidenceResponseType> {
    const evidenceId = ulid();

    const [evidence] = await this.dbInstance
      .insert(revSspEvidence)
      .values({
        id: evidenceId,
        catalogId: data.catalog_id,
        source: data.source,
        note: data.note || null,
        value: data.value?.toString() || null,
        docUri: data.doc_uri || null,
        createdBy: userId,
      })
      .returning();

    return this.mapEvidenceToResponse(evidence);
  }

  /**
   * Upsert SSP policy for company
   */
  async upsertSspPolicy(
    companyId: string,
    userId: string,
    data: SspPolicyUpsertType
  ): Promise<SspPolicyResponseType> {
    const [policy] = await this.dbInstance
      .insert(revSspPolicy)
      .values({
        companyId,
        rounding: data.rounding,
        residualAllowed: data.residual_allowed,
        residualEligibleProducts: data.residual_eligible_products,
        defaultMethod: data.default_method,
        corridorTolerancePct: data.corridor_tolerance_pct.toString(),
        alertThresholdPct: data.alert_threshold_pct.toString(),
        createdBy: userId,
        updatedBy: userId,
      })
      .onConflictDoUpdate({
        target: revSspPolicy.companyId,
        set: {
          rounding: data.rounding,
          residualAllowed: data.residual_allowed,
          residualEligibleProducts: data.residual_eligible_products,
          defaultMethod: data.default_method,
          corridorTolerancePct: data.corridor_tolerance_pct.toString(),
          alertThresholdPct: data.alert_threshold_pct.toString(),
          updatedAt: new Date(),
          updatedBy: userId,
        },
      })
      .returning();

    return this.mapPolicyToResponse(policy);
  }

  /**
   * Get SSP policy for company
   */
  async getSspPolicy(companyId: string): Promise<SspPolicyResponseType | null> {
    const [policy] = await this.dbInstance
      .select()
      .from(revSspPolicy)
      .where(eq(revSspPolicy.companyId, companyId))
      .limit(1);

    return policy ? this.mapPolicyToResponse(policy) : null;
  }

  /**
   * Query SSP catalog entries
   */
  async querySspCatalog(
    companyId: string,
    query: SspQueryType
  ): Promise<SspCatalogResponseType[]> {
    const conditions = [eq(revSspCatalog.companyId, companyId)];

    if (query.product_id) {
      conditions.push(eq(revSspCatalog.productId, query.product_id));
    }
    if (query.currency) {
      conditions.push(eq(revSspCatalog.currency, query.currency));
    }
    if (query.method) {
      conditions.push(eq(revSspCatalog.method, query.method));
    }
    if (query.status) {
      conditions.push(eq(revSspCatalog.status, query.status));
    }
    if (query.effective_from) {
      conditions.push(gte(revSspCatalog.effectiveFrom, query.effective_from));
    }
    if (query.effective_to) {
      conditions.push(
        lte(
          revSspCatalog.effectiveTo || revSspCatalog.effectiveFrom,
          query.effective_to
        )
      );
    }

    const catalogs = await this.dbInstance
      .select()
      .from(revSspCatalog)
      .where(and(...conditions))
      .orderBy(desc(revSspCatalog.effectiveFrom), desc(revSspCatalog.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    return catalogs.map(this.mapCatalogToResponse);
  }

  /**
   * Get effective SSP for product/currency as of date
   */
  async getEffectiveSsp(
    companyId: string,
    productId: string,
    currency: string,
    asOfDate: string
  ): Promise<SspCatalogResponseType | null> {
    const [catalog] = await this.dbInstance
      .select()
      .from(revSspCatalog)
      .where(
        and(
          eq(revSspCatalog.companyId, companyId),
          eq(revSspCatalog.productId, productId),
          eq(revSspCatalog.currency, currency),
          eq(revSspCatalog.status, 'APPROVED'),
          lte(revSspCatalog.effectiveFrom, asOfDate),
          sql`(${revSspCatalog.effectiveTo} IS NULL OR ${revSspCatalog.effectiveTo} > ${asOfDate})`
        )
      )
      .orderBy(desc(revSspCatalog.effectiveFrom))
      .limit(1);

    return catalog ? this.mapCatalogToResponse(catalog) : null;
  }

  /**
   * Create SSP change request
   */
  async createSspChangeRequest(
    companyId: string,
    userId: string,
    data: SspChangeRequestType
  ): Promise<SspChangeResponseType> {
    const changeId = ulid();

    const [change] = await this.dbInstance
      .insert(revSspChange)
      .values({
        id: changeId,
        companyId,
        requestor: userId,
        reason: data.reason,
        diff: data.diff,
        status: 'DRAFT',
      })
      .returning();

    return this.mapChangeToResponse(change);
  }

  /**
   * Approve or reject SSP change request
   */
  async decideSspChange(
    companyId: string,
    changeId: string,
    userId: string,
    data: SspChangeDecisionType
  ): Promise<SspChangeResponseType> {
    const [change] = await this.dbInstance
      .update(revSspChange)
      .set({
        status: data.status,
        decidedBy: userId,
        decidedAt: new Date(),
        decisionNotes: data.decision_notes || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(revSspChange.id, changeId),
          eq(revSspChange.companyId, companyId)
        )
      )
      .returning();

    if (!change) {
      throw new Error('SSP change request not found');
    }

    return this.mapChangeToResponse(change);
  }

  /**
   * Query SSP change requests
   */
  async querySspChanges(
    companyId: string,
    status?: string,
    limit = 50,
    offset = 0
  ): Promise<SspChangeResponseType[]> {
    const conditions = [eq(revSspChange.companyId, companyId)];

    if (status) {
      conditions.push(eq(revSspChange.status, status as any));
    }

    const changes = await this.dbInstance
      .select()
      .from(revSspChange)
      .where(and(...conditions))
      .orderBy(desc(revSspChange.createdAt))
      .limit(limit)
      .offset(offset);

    return changes.map(this.mapChangeToResponse);
  }

  /**
   * Check corridor compliance for SSP values
   */
  async checkCorridorCompliance(
    companyId: string,
    productId: string,
    currency: string,
    ssp: number
  ): Promise<{ compliant: boolean; medianSsp?: number; variance?: number }> {
    // Get policy for corridor settings
    const policy = await this.getSspPolicy(companyId);
    if (!policy) {
      return { compliant: true }; // No policy means no corridor checks
    }

    // Get median SSP for similar products
    const medianResult = await this.dbInstance
      .select({
        medianSsp: sql<number>`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${revSspCatalog.ssp}::numeric)`,
      })
      .from(revSspCatalog)
      .where(
        and(
          eq(revSspCatalog.companyId, companyId),
          eq(revSspCatalog.currency, currency),
          eq(revSspCatalog.status, 'APPROVED')
        )
      );

    const medianSsp = medianResult[0]?.medianSsp;
    if (!medianSsp) {
      return { compliant: true }; // No historical data
    }

    const variance = Math.abs(ssp - medianSsp) / medianSsp;
    const compliant = variance <= policy.corridor_tolerance_pct;

    return {
      compliant,
      medianSsp,
      variance,
    };
  }

  // Helper methods for mapping database records to response types
  private mapCatalogToResponse(catalog: any): SspCatalogResponseType {
    return {
      id: catalog.id,
      company_id: catalog.companyId,
      product_id: catalog.productId,
      currency: catalog.currency,
      ssp: parseFloat(catalog.ssp),
      method: catalog.method,
      effective_from: catalog.effectiveFrom,
      effective_to: catalog.effectiveTo,
      corridor_min_pct: catalog.corridorMinPct
        ? parseFloat(catalog.corridorMinPct)
        : undefined,
      corridor_max_pct: catalog.corridorMaxPct
        ? parseFloat(catalog.corridorMaxPct)
        : undefined,
      status: catalog.status,
      created_at: catalog.createdAt.toISOString(),
      created_by: catalog.createdBy,
      updated_at: catalog.updatedAt.toISOString(),
      updated_by: catalog.updatedBy,
    };
  }

  private mapEvidenceToResponse(evidence: any): SspEvidenceResponseType {
    return {
      id: evidence.id,
      catalog_id: evidence.catalogId,
      source: evidence.source,
      note: evidence.note,
      value: evidence.value ? parseFloat(evidence.value) : undefined,
      doc_uri: evidence.docUri,
      created_at: evidence.createdAt.toISOString(),
      created_by: evidence.createdBy,
    };
  }

  private mapPolicyToResponse(policy: any): SspPolicyResponseType {
    return {
      company_id: policy.companyId,
      rounding: policy.rounding,
      residual_allowed: policy.residualAllowed,
      residual_eligible_products: policy.residualEligibleProducts || [],
      default_method: policy.defaultMethod,
      corridor_tolerance_pct: parseFloat(policy.corridorTolerancePct),
      alert_threshold_pct: parseFloat(policy.alertThresholdPct),
      created_at: policy.createdAt.toISOString(),
      created_by: policy.createdBy,
      updated_at: policy.updatedAt.toISOString(),
      updated_by: policy.updatedBy,
    };
  }

  private mapChangeToResponse(change: any): SspChangeResponseType {
    return {
      id: change.id,
      company_id: change.companyId,
      requestor: change.requestor,
      reason: change.reason,
      diff: change.diff,
      status: change.status,
      decided_by: change.decidedBy,
      decided_at: change.decidedAt?.toISOString(),
      decision_notes: change.decisionNotes,
      created_at: change.createdAt.toISOString(),
      updated_at: change.updatedAt.toISOString(),
    };
  }
}
