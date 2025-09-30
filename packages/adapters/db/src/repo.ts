import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, PoolClient } from "pg";
import * as schema from "./schema";
import { eq, and } from "drizzle-orm";
import type { LedgerRepo, RepoJournal, RepoJournalLine, Tx, TxManager } from "@aibos/ports";

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
      idempotencyKey: j.idempotency_key
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
        partyId: l.party_id
      });
    }
    return { id, lines: j.lines };
  }

  async trialBalance(companyId: string, currency: string, tx?: DbTx): Promise<Array<{ account_code: string, debit: string, credit: string, currency: string }>> {
    const db = this.dbFrom(tx);

    // Query journal lines for the company and currency
    const lines = await db
      .select({
        account_code: schema.journalLine.accountCode,
        dc: schema.journalLine.dc,
        amount: schema.journalLine.amount,
        currency: schema.journalLine.currency
      })
      .from(schema.journalLine)
      .innerJoin(schema.journal, eq(schema.journalLine.journalId, schema.journal.id))
      .where(
        and(
          eq(schema.journal.companyId, companyId),
          eq(schema.journalLine.currency, currency)
        )
      );

    // Aggregate by account
    const acc = new Map<string, { d: number; c: number }>();
    for (const line of lines) {
      const key = line.account_code;
      const slot = acc.get(key) ?? { d: 0, c: 0 };
      const amt = Number(line.amount);
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
