import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, PoolClient } from "pg";
import * as schema from "./schema";
import { eq, and } from "drizzle-orm";
import type { LedgerRepo, RepoJournal, RepoJournalLine, Tx, TxManager } from "@aibos/ports";
import crypto from "node:crypto";

export type DbTx = { client: PoolClient };
export class DrizzleTxManager implements TxManager {
  constructor(private pool: Pool) { }
  async run<T>(fn: (tx: DbTx) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const res = await fn({ client });
      await client.query("COMMIT");
      return res;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}

export class DrizzleLedgerRepo implements LedgerRepo {
  private db;
  constructor(private pool: Pool) {
    this.db = drizzle(pool, { schema });
  }

  private dbFrom(tx?: DbTx) {
    return tx ? drizzle(tx.client, { schema }) : this.db;
  }

  async existsByKey(key: string, tx?: DbTx): Promise<boolean> {
    const db = this.dbFrom(tx);
    const rows = await db.select({ id: schema.journal.id })
      .from(schema.journal)
      .where(eq(schema.journal.idempotencyKey, key))
      .limit(1);
    return rows.length > 0;
  }

  async getIdByKey(key: string, tx?: DbTx): Promise<string | null> {
    const db = this.dbFrom(tx);
    const rows = await db.select({ id: schema.journal.id })
      .from(schema.journal)
      .where(eq(schema.journal.idempotencyKey, key))
      .limit(1);
    return rows[0]?.id ?? null;
  }

  async insertJournal(j: Omit<RepoJournal, "id">, tx?: DbTx) {
    const db = this.dbFrom(tx);
    const id = crypto.randomUUID();
    await db.insert(schema.journal).values({
      id,
      companyId: j.company_id,
      postingDate: new Date(j.posting_date),
      currency: j.currency,
      sourceDoctype: j.source_doctype,
      sourceId: j.source_id,
      idempotencyKey: j.idempotency_key,
      baseCurrency: (j as any).base_currency,
      rateUsed: (j as any).rate_used
    });
    for (const l of j.lines) {
      await db.insert(schema.journalLine).values({
        id: crypto.randomUUID(),
        journalId: id,
        accountCode: l.account_code,
        dc: l.dc,
        amount: l.amount.amount,
        currency: l.currency,
        partyType: l.party_type,
        partyId: l.party_id,
        baseAmount: (l as any).base_amount?.amount,
        baseCurrency: (l as any).base_currency,
        txnAmount: (l as any).txn_amount?.amount,
        txnCurrency: (l as any).txn_currency,
        // Dimensions (M14)
        costCenterId: (l as any).cost_center_id,
        projectId: (l as any).project_id
      });
    }
    return { id, lines: j.lines };
  }

  async trialBalance(companyId: string, currency: string, tx?: DbTx): Promise<Array<{ account_code: string, debit: string, credit: string, currency: string }>> {
    const db = this.dbFrom(tx);

    // Query journal lines for the company - use base_amount if available, fallback to amount
    const lines = await db
      .select({
        account_code: schema.journalLine.accountCode,
        dc: schema.journalLine.dc,
        amount: schema.journalLine.amount,
        base_amount: schema.journalLine.baseAmount,
        base_currency: schema.journalLine.baseCurrency,
        currency: schema.journalLine.currency
      })
      .from(schema.journalLine)
      .innerJoin(schema.journal, eq(schema.journalLine.journalId, schema.journal.id))
      .where(eq(schema.journal.companyId, companyId));

    // Aggregate by account
    const acc = new Map<string, { d: number; c: number }>();
    for (const line of lines) {
      const key = line.account_code;
      const slot = acc.get(key) ?? { d: 0, c: 0 };

      // Use base_amount if available and matches requested currency, otherwise use amount
      const amt = (line.base_amount && line.base_currency === currency)
        ? Number(line.base_amount)
        : Number(line.amount);

      if (line.dc === "D") slot.d += amt; else slot.c += amt;
      acc.set(key, slot);
    }

    // Convert to trial balance rows
    const rows: Array<{ account_code: string, debit: string, credit: string, currency: string }> = [];
    for (const [account_code, v] of acc.entries()) {
      rows.push({
        account_code,
        debit: v.d.toFixed(2),
        credit: v.c.toFixed(2),
        currency
      });
    }

    // Sort for stable UI
    rows.sort((a, b) => a.account_code.localeCompare(b.account_code));
    return rows;
  }

  async enqueueOutbox(event: unknown, tx?: DbTx): Promise<void> {
    const db = this.dbFrom(tx);
    await db.insert(schema.outbox).values({
      id: crypto.randomUUID(),
      topic: (event as any)?._meta?.name ?? "Event",
      payload: JSON.stringify(event)
    });
  }
}

// FX Rate adapter functions
export async function getFxQuotesForDateOrBefore(db: Pool, from: string, to: string, onISO: string, daysBack = 30) {
  // fetch within window to reduce scan
  const { rows } = await db.query(`
    select date::text as date, from_ccy as from, to_ccy as to, rate::text
    from fx_rate
    where from_ccy = $1 and to_ccy = $2 and date <= $3 and date >= ($3::date - $4::int)
    order by date desc
    limit 30
  `, [from, to, onISO, daysBack]);
  return rows.map(r => ({ date: r.date, from: r.from, to: r.to, rate: Number(r.rate) }));
}

export async function getPresentQuotes(db: Pool, base: string, present: string, onISO: string) {
  const { rows } = await db.query(
    `select date::text as date, from_ccy as from, to_ccy as to, rate::text
       from fx_rate
      where from_ccy=$1 and to_ccy=$2 and date <= $3
      order by date desc
      limit 1`,
    [base, present, onISO]
  );
  return rows.map(r => ({ date: r.date, from: r.from, to: r.to, rate: Number(r.rate) }));
}
