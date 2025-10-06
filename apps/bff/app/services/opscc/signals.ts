import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, desc, asc, sql, gte, lte, inArray } from 'drizzle-orm';
import {
  opsSignal,
  opsRule,
  opsRuleStat,
  opsFire,
  opsFireStep,
  opsGuardrailLock,
} from '@aibos/db-adapter/schema';
import type {
  SignalIngest,
  SignalIngestBatch,
  SignalResponse,
  QuerySignals,
  RuleUpsert,
  RuleResponse,
  RuleTestRequest,
  RuleTestResponse,
  FireResponse,
  QueryFires,
} from '@aibos/contracts';
import { logLine } from '@/lib/log';
import { createHash } from 'crypto';

export class OpsSignalService {
  constructor(private dbInstance = db) {}

  /**
   * Ingest batch of signals with deduplication
   */
  async ingestSignals(
    companyId: string,
    batch: SignalIngestBatch
  ): Promise<{ ingested: number; deduplicated: number }> {
    try {
      let ingested = 0;
      let deduplicated = 0;

      for (const signal of batch.signals) {
        // Generate content hash for deduplication
        const hash = this.generateSignalHash(signal);

        // Check if signal already exists
        const existing = await this.dbInstance
          .select({ id: opsSignal.id })
          .from(opsSignal)
          .where(
            and(eq(opsSignal.company_id, companyId), eq(opsSignal.hash, hash))
          )
          .limit(1);

        if (existing.length > 0) {
          deduplicated++;
          continue;
        }

        // Insert new signal
        await this.dbInstance.insert(opsSignal).values({
          company_id: companyId,
          source: signal.source,
          kind: signal.kind,
          key: signal.key,
          ts: new Date(signal.ts || new Date()),
          payload: signal.payload,
          hash,
          dedup_until: signal.ts
            ? new Date(new Date(signal.ts).getTime() + 3600000)
            : null, // 1 hour dedup window
          severity: this.determineSeverity(signal),
          kpi: signal.kpi || null,
          value: signal.value ? signal.value.toString() : null,
          unit: signal.unit || null,
          tags: signal.tags || [],
        });

        ingested++;
      }

      logLine({
        msg: 'OpsSignalService.ingestSignals completed',
        companyId,
        ingested,
        deduplicated,
        total: batch.signals.length,
      });

      return { ingested, deduplicated };
    } catch (error) {
      logLine({
        msg: 'OpsSignalService.ingestSignals error',
        companyId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Query signals with filters
   */
  async querySignals(
    companyId: string,
    query: QuerySignals
  ): Promise<SignalResponse[]> {
    try {
      let whereConditions: any = eq(opsSignal.company_id, companyId);

      if (query.source) {
        whereConditions = and(
          whereConditions,
          eq(opsSignal.source, query.source)
        );
      }
      if (query.kind) {
        whereConditions = and(whereConditions, eq(opsSignal.kind, query.kind));
      }
      if (query.kpi) {
        whereConditions = and(whereConditions, eq(opsSignal.kpi, query.kpi));
      }
      if (query.severity) {
        whereConditions = and(
          whereConditions,
          eq(opsSignal.severity, query.severity)
        );
      }
      if (query.from_ts) {
        whereConditions = and(
          whereConditions,
          gte(opsSignal.ts, new Date(query.from_ts))
        );
      }
      if (query.to_ts) {
        whereConditions = and(
          whereConditions,
          lte(opsSignal.ts, new Date(query.to_ts))
        );
      }
      if (query.tags && query.tags.length > 0) {
        whereConditions = and(
          whereConditions,
          sql`${opsSignal.tags} && ${query.tags}`
        );
      }

      const signals = await this.dbInstance
        .select()
        .from(opsSignal)
        .where(whereConditions)
        .orderBy(desc(opsSignal.ts))
        .limit(query.limit)
        .offset(query.offset);

      return signals.map(signal => ({
        id: signal.id,
        company_id: signal.company_id,
        source: signal.source,
        kind: signal.kind,
        key: signal.key,
        ts: signal.ts.toISOString(),
        payload: signal.payload as Record<string, any>,
        hash: signal.hash,
        dedup_until: signal.dedup_until?.toISOString() || null,
        severity: signal.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        kpi: signal.kpi,
        value: signal.value ? parseFloat(signal.value) : null,
        unit: signal.unit,
        tags: signal.tags || [],
        inserted_at: signal.inserted_at.toISOString(),
      }));
    } catch (error) {
      logLine({
        msg: 'OpsSignalService.querySignals error',
        companyId,
        query,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get windowed signals for rule evaluation
   */
  async getWindowedSignals(
    companyId: string,
    windowFrom: Date,
    windowTo: Date,
    filters: {
      source?: string;
      kind?: string;
      kpi?: string;
      tags?: string[];
    } = {}
  ): Promise<SignalResponse[]> {
    try {
      let whereConditions: any = and(
        eq(opsSignal.company_id, companyId),
        gte(opsSignal.ts, windowFrom),
        lte(opsSignal.ts, windowTo)
      );

      if (filters.source) {
        whereConditions = and(
          whereConditions,
          eq(opsSignal.source, filters.source)
        );
      }
      if (filters.kind) {
        whereConditions = and(
          whereConditions,
          eq(opsSignal.kind, filters.kind)
        );
      }
      if (filters.kpi) {
        whereConditions = and(whereConditions, eq(opsSignal.kpi, filters.kpi));
      }
      if (filters.tags && filters.tags.length > 0) {
        whereConditions = and(
          whereConditions,
          sql`${opsSignal.tags} && ${filters.tags}`
        );
      }

      const signals = await this.dbInstance
        .select()
        .from(opsSignal)
        .where(whereConditions)
        .orderBy(asc(opsSignal.ts));

      return signals.map(signal => ({
        id: signal.id,
        company_id: signal.company_id,
        source: signal.source,
        kind: signal.kind,
        key: signal.key,
        ts: signal.ts.toISOString(),
        payload: signal.payload as Record<string, any>,
        hash: signal.hash,
        dedup_until: signal.dedup_until?.toISOString() || null,
        severity: signal.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
        kpi: signal.kpi,
        value: signal.value ? parseFloat(signal.value) : null,
        unit: signal.unit,
        tags: signal.tags || [],
        inserted_at: signal.inserted_at.toISOString(),
      }));
    } catch (error) {
      logLine({
        msg: 'OpsSignalService.getWindowedSignals error',
        companyId,
        windowFrom: windowFrom.toISOString(),
        windowTo: windowTo.toISOString(),
        filters,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Generate content hash for signal deduplication
   */
  private generateSignalHash(signal: SignalIngest): string {
    const content = JSON.stringify({
      source: signal.source,
      kind: signal.kind,
      key: signal.key,
      kpi: signal.kpi,
      value: signal.value,
      unit: signal.unit,
      payload: signal.payload,
    });
    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Determine signal severity based on content
   */
  private determineSeverity(
    signal: SignalIngest
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // Default logic - can be enhanced based on business rules
    if (signal.tags.includes('critical')) return 'CRITICAL';
    if (signal.tags.includes('high')) return 'HIGH';
    if (signal.tags.includes('low')) return 'LOW';

    // Severity based on value thresholds (example)
    if (signal.value !== undefined) {
      if (signal.kpi === 'PTP_BROKEN_RATE' && signal.value > 10)
        return 'CRITICAL';
      if (signal.kpi === 'DSO' && signal.value > 60) return 'HIGH';
      if (signal.kpi === 'CASH_BURN_4W' && signal.value > 100000) return 'HIGH';
    }

    return 'MEDIUM';
  }
}
