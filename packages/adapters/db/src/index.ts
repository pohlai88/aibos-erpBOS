import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import * as schema from './schema.js';
import type {
  Tx,
  TxManager,
  LedgerRepo,
  RepoJournal,
  RepoJournalLine,
  Money,
} from '@aibos/ports';

export class DatabaseAdapter implements TxManager, LedgerRepo {
  private pool: Pool;
  private db: ReturnType<typeof drizzle>;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
    this.db = drizzle(this.pool, { schema });
  }

  async run<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const tx = drizzle(client, { schema });
      const result = await fn(tx as Tx);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async existsByKey(key: string, tx?: Tx): Promise<boolean> {
    const db = (tx as any) || this.db;
    const result = await db
      .select()
      .from(schema.journal)
      .where(eq(schema.journal.idempotencyKey, key))
      .limit(1);

    return result.length > 0;
  }

  async getIdByKey(key: string, tx?: Tx): Promise<string | null> {
    const db = (tx as any) || this.db;
    const result = await db
      .select({ id: schema.journal.id })
      .from(schema.journal)
      .where(eq(schema.journal.idempotencyKey, key))
      .limit(1);

    return result.length > 0 ? result[0].id : null;
  }

  async insertJournal(
    journal: Omit<RepoJournal, 'id'>,
    tx?: Tx
  ): Promise<{ id: string; lines: RepoJournalLine[] }> {
    const db = (tx as any) || this.db;

    // Insert journal
    const [insertedJournal] = await db
      .insert(schema.journal)
      .values({
        companyId: journal.company_id,
        postingDate: new Date(journal.posting_date),
        currency: journal.currency,
        sourceDoctype: journal.source_doctype,
        sourceId: journal.source_id,
        idempotencyKey: journal.idempotency_key,
      })
      .returning();

    // Insert journal lines
    const insertedLines = await db
      .insert(schema.journalLine)
      .values(
        journal.lines.map((line: RepoJournalLine) => ({
          journalId: insertedJournal.id,
          accountCode: line.account_code,
          dc: line.dc,
          amount: line.amount.amount,
          currency: line.currency,
          partyType: line.party_type,
          partyId: line.party_id,
        }))
      )
      .returning();

    return {
      id: insertedJournal.id,
      lines: insertedLines.map((line: any) => ({
        id: line.id,
        account_code: line.accountCode,
        dc: line.dc as 'D' | 'C',
        amount: { amount: line.amount, currency: line.currency } as Money,
        currency: line.currency,
        party_type: line.partyType as 'Customer' | 'Supplier' | undefined,
        party_id: line.partyId || undefined,
      })),
    };
  }

  async enqueueOutbox(event: unknown, tx?: Tx): Promise<void> {
    const db = (tx as any) || this.db;

    await db.insert(schema.outbox).values({
      topic:
        typeof event === 'object' && event !== null && 'type' in event
          ? String(event.type)
          : 'unknown',
      payload: JSON.stringify(event),
    });
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Export types and utilities
export { schema };
export type { Tx, TxManager, LedgerRepo };
