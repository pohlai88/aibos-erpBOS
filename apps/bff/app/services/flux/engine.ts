import { db } from '@/lib/db';
import {
  fluxRun,
  fluxLine,
  fluxComment,
  fluxRule,
} from '@aibos/db-adapter/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { ulid } from 'ulid';
import { logLine } from '@/lib/log';
import type {
  FluxRunReqType,
  FluxCommentReqType,
  FluxQueryType,
  FluxRuleUpsertType,
  FluxRuleQueryType,
  FluxRunResponseType,
  FluxLineResponseType,
  FluxCommentResponseType,
  FluxRuleResponseType,
} from '@aibos/contracts';

export class FluxEngineService {
  /**
   * Run flux analysis comparing two periods
   */
  async runFluxAnalysis(
    companyId: string,
    userId: string,
    data: FluxRunReqType
  ): Promise<FluxRunResponseType> {
    const runId = ulid();

    // Create flux run
    const newRunResult = await db
      .insert(fluxRun)
      .values({
        id: runId,
        companyId,
        baseYear: data.base.y,
        baseMonth: data.base.m,
        cmpYear: data.cmp.y,
        cmpMonth: data.cmp.m,
        presentCcy: data.present || 'USD',
        status: 'RUNNING',
        createdBy: userId,
      })
      .returning();

    const newRun = newRunResult[0];
    if (!newRun) {
      throw new Error('Failed to create flux run');
    }

    try {
      // Get flux rules for the company and scope
      const rules = await db
        .select()
        .from(fluxRule)
        .where(
          and(
            eq(fluxRule.companyId, companyId),
            eq(fluxRule.scope, data.scope),
            eq(fluxRule.active, true)
          )
        );

      // Generate flux lines (this would integrate with your report builders)
      const fluxLines = await this.generateFluxLines(
        companyId,
        runId,
        data.base,
        data.cmp,
        data.present || 'USD',
        rules
      );

      // Insert flux lines
      await db.insert(fluxLine).values(fluxLines);

      // Update run status to completed
      await db
        .update(fluxRun)
        .set({ status: 'COMPLETED' })
        .where(eq(fluxRun.id, runId));

      logLine({
        msg: `Completed flux analysis ${runId} for ${companyId}`,
        runId,
        companyId,
      });

      return {
        id: newRun.id,
        company_id: newRun.companyId,
        run_id: undefined, // Not linked to close run
        base_year: newRun.baseYear,
        base_month: newRun.baseMonth,
        cmp_year: newRun.cmpYear,
        cmp_month: newRun.cmpMonth,
        present_ccy: newRun.presentCcy,
        status: 'COMPLETED',
        created_at: newRun.createdAt.toISOString(),
        created_by: newRun.createdBy,
      };
    } catch (error) {
      // Update run status to error
      await db
        .update(fluxRun)
        .set({ status: 'ERROR' })
        .where(eq(fluxRun.id, runId));

      logLine({
        msg: `Flux analysis ${runId} failed: ${error}`,
        runId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Generate flux lines by comparing periods
   */
  private async generateFluxLines(
    companyId: string,
    runId: string,
    base: { y: number; m: number },
    cmp: { y: number; m: number },
    presentCcy: string,
    rules: any[]
  ): Promise<any[]> {
    // This would integrate with your existing report builders
    // For now, return mock data structure
    const mockLines = [
      {
        id: ulid(),
        runId,
        accountCode: '4000',
        dimKey: 'REVENUE',
        baseAmount: '100000',
        cmpAmount: '110000',
        delta: '10000',
        deltaPct: '0.10',
        requiresComment: false,
        material: true,
        createdAt: new Date(),
      },
      {
        id: ulid(),
        runId,
        accountCode: '5000',
        dimKey: 'COGS',
        baseAmount: '60000',
        cmpAmount: '65000',
        delta: '5000',
        deltaPct: '0.083',
        requiresComment: false,
        material: true,
        createdAt: new Date(),
      },
    ];

    // Apply materiality rules
    return mockLines.map(line => {
      const rule = rules.find(r => r.dim === 'ACCOUNT');
      if (rule) {
        const absThreshold = Number(rule.thresholdAbs) || 0;
        const pctThreshold = Number(rule.thresholdPct) || 0;
        const baseAmount = Number(line.baseAmount);

        line.material =
          Math.abs(Number(line.delta)) >= absThreshold ||
          Math.abs(Number(line.deltaPct)) >= pctThreshold;
        line.requiresComment = line.material && rule.requireComment;
      }
      return line;
    });
  }

  /**
   * Query flux runs
   */
  async queryFluxRuns(
    companyId: string,
    query: FluxQueryType
  ): Promise<FluxRunResponseType[]> {
    let whereConditions = [eq(fluxRun.companyId, companyId)];

    if (query.run_id !== undefined) {
      whereConditions.push(eq(fluxRun.id, query.run_id));
    }
    if (query.base_year !== undefined) {
      whereConditions.push(eq(fluxRun.baseYear, query.base_year));
    }
    if (query.base_month !== undefined) {
      whereConditions.push(eq(fluxRun.baseMonth, query.base_month));
    }
    if (query.cmp_year !== undefined) {
      whereConditions.push(eq(fluxRun.cmpYear, query.cmp_year));
    }
    if (query.cmp_month !== undefined) {
      whereConditions.push(eq(fluxRun.cmpMonth, query.cmp_month));
    }

    const runs = await db
      .select()
      .from(fluxRun)
      .where(and(...whereConditions))
      .orderBy(desc(fluxRun.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    return runs.map(run => ({
      id: run.id,
      company_id: run.companyId,
      run_id: run.runId || undefined,
      base_year: run.baseYear,
      base_month: run.baseMonth,
      cmp_year: run.cmpYear,
      cmp_month: run.cmpMonth,
      present_ccy: run.presentCcy,
      status: run.status,
      created_at: run.createdAt.toISOString(),
      created_by: run.createdBy,
    }));
  }

  /**
   * Query flux lines
   */
  async queryFluxLines(
    companyId: string,
    query: FluxQueryType
  ): Promise<FluxLineResponseType[]> {
    let whereConditions = [];

    if (query.run_id !== undefined) {
      whereConditions.push(eq(fluxLine.runId, query.run_id));
    }
    if (query.material_only !== undefined && query.material_only) {
      whereConditions.push(eq(fluxLine.material, true));
    }
    if (query.requires_comment !== undefined) {
      whereConditions.push(
        eq(fluxLine.requiresComment, query.requires_comment)
      );
    }

    const lines = await db
      .select()
      .from(fluxLine)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(sql`ABS(${fluxLine.delta})`))
      .limit(query.limit)
      .offset(query.offset);

    return lines.map(line => ({
      id: line.id,
      run_id: line.runId,
      account_code: line.accountCode,
      dim_key: line.dimKey || undefined,
      base_amount: Number(line.baseAmount),
      cmp_amount: Number(line.cmpAmount),
      delta: Number(line.delta),
      delta_pct: Number(line.deltaPct),
      requires_comment: line.requiresComment,
      material: line.material,
      created_at: line.createdAt.toISOString(),
    }));
  }

  /**
   * Add comment to a flux line
   */
  async addFluxComment(
    companyId: string,
    userId: string,
    data: FluxCommentReqType
  ): Promise<FluxCommentResponseType> {
    const newCommentResult = await db
      .insert(fluxComment)
      .values({
        id: ulid(),
        runId: '', // Will be populated from line
        lineId: data.line_id,
        author: userId,
        body: data.body,
      })
      .returning();

    const newComment = newCommentResult[0];
    if (!newComment) {
      throw new Error('Failed to create flux comment');
    }

    // Get the run ID from the line
    const line = await db
      .select()
      .from(fluxLine)
      .where(eq(fluxLine.id, data.line_id))
      .limit(1);

    let lineData: any = null;
    if (line.length > 0) {
      lineData = line[0];
      if (!lineData) {
        throw new Error('Line data not found');
      }

      await db
        .update(fluxComment)
        .set({ runId: lineData.runId })
        .where(eq(fluxComment.id, newComment.id));
    }

    return {
      id: newComment.id,
      run_id: lineData?.runId || '',
      line_id: newComment.lineId,
      author: newComment.author,
      body: newComment.body,
      created_at: newComment.createdAt.toISOString(),
    };
  }

  /**
   * Query flux comments
   */
  async queryFluxComments(
    companyId: string,
    query: FluxQueryType
  ): Promise<FluxCommentResponseType[]> {
    let whereConditions = [];

    if (query.run_id !== undefined) {
      whereConditions.push(eq(fluxComment.runId, query.run_id));
    }

    const comments = await db
      .select()
      .from(fluxComment)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(fluxComment.createdAt))
      .limit(query.limit)
      .offset(query.offset);

    return comments.map(comment => ({
      id: comment.id,
      run_id: comment.runId,
      line_id: comment.lineId,
      author: comment.author,
      body: comment.body,
      created_at: comment.createdAt.toISOString(),
    }));
  }

  /**
   * Upsert flux rule
   */
  async upsertFluxRule(
    companyId: string,
    userId: string,
    data: FluxRuleUpsertType
  ): Promise<FluxRuleResponseType> {
    const ruleResult = await db
      .insert(fluxRule)
      .values({
        id: ulid(),
        companyId,
        scope: data.scope,
        dim: data.dim,
        thresholdAbs: data.threshold_abs?.toString(),
        thresholdPct: data.threshold_pct?.toString(),
        requireComment: data.require_comment,
        active: data.active,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    const rule = ruleResult[0];
    if (!rule) {
      throw new Error('Failed to create flux rule');
    }

    return {
      id: rule.id,
      company_id: rule.companyId,
      scope: rule.scope,
      dim: rule.dim,
      threshold_abs: rule.thresholdAbs ? Number(rule.thresholdAbs) : undefined,
      threshold_pct: rule.thresholdPct ? Number(rule.thresholdPct) : undefined,
      require_comment: rule.requireComment,
      active: rule.active,
      created_at: rule.createdAt.toISOString(),
      created_by: rule.createdBy,
      updated_at: rule.updatedAt.toISOString(),
      updated_by: rule.updatedBy,
    };
  }

  /**
   * Query flux rules
   */
  async queryFluxRules(
    companyId: string,
    query: FluxRuleQueryType
  ): Promise<FluxRuleResponseType[]> {
    let whereConditions = [eq(fluxRule.companyId, companyId)];

    if (query.scope !== undefined) {
      whereConditions.push(eq(fluxRule.scope, query.scope));
    }
    if (query.dim !== undefined) {
      whereConditions.push(eq(fluxRule.dim, query.dim));
    }
    if (query.active !== undefined) {
      whereConditions.push(eq(fluxRule.active, query.active));
    }

    const rules = await db
      .select()
      .from(fluxRule)
      .where(and(...whereConditions))
      .orderBy(asc(fluxRule.scope), asc(fluxRule.dim))
      .limit(query.limit)
      .offset(query.offset);

    return rules.map(rule => ({
      id: rule.id,
      company_id: rule.companyId,
      scope: rule.scope,
      dim: rule.dim,
      threshold_abs: rule.thresholdAbs ? Number(rule.thresholdAbs) : undefined,
      threshold_pct: rule.thresholdPct ? Number(rule.thresholdPct) : undefined,
      require_comment: rule.requireComment,
      active: rule.active,
      created_at: rule.createdAt.toISOString(),
      created_by: rule.createdBy,
      updated_at: rule.updatedAt.toISOString(),
      updated_by: rule.updatedBy,
    }));
  }

  /**
   * Get top movers for a flux run
   */
  async getTopMovers(
    runId: string,
    limit: number = 10
  ): Promise<FluxLineResponseType[]> {
    const lines = await db
      .select()
      .from(fluxLine)
      .where(and(eq(fluxLine.runId, runId), eq(fluxLine.material, true)))
      .orderBy(desc(sql`ABS(${fluxLine.delta})`))
      .limit(limit);

    return lines.map(line => ({
      id: line.id,
      run_id: line.runId,
      account_code: line.accountCode,
      dim_key: line.dimKey || undefined,
      base_amount: Number(line.baseAmount),
      cmp_amount: Number(line.cmpAmount),
      delta: Number(line.delta),
      delta_pct: Number(line.deltaPct),
      requires_comment: line.requiresComment,
      material: line.material,
      created_at: line.createdAt.toISOString(),
    }));
  }
}
