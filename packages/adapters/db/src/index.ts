import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq } from "drizzle-orm";
import * as schema from "./schema.js";
import type { Tx, TxManager, LedgerRepo, RepoJournal, RepoJournalLine, Money } from "@aibos/ports";

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
            await client.query("BEGIN");
            const tx = drizzle(client, { schema });
            const result = await fn(tx as Tx);
            await client.query("COMMIT");
            return result;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

  async existsByKey(key: string, tx?: Tx): Promise<boolean> {
    const db = tx || this.db;
    const result = await db
      .select()
      .from(schema.journal)
      .where(eq(schema.journal.idempotencyKey, key))
      .limit(1);
    
    return result.length > 0;
  }

    async insertJournal(
        journal: Omit<RepoJournal, "id">,
        tx?: Tx
    ): Promise<{ id: string; lines: RepoJournalLine[] }> {
        const db = tx || this.db;

        // Insert journal
        const [insertedJournal] = await db
            .insert(schema.journals)
            .values({
                company_id: journal.company_id,
                posting_date: new Date(journal.posting_date),
                currency: journal.currency,
                source_doctype: journal.source_doctype,
                source_id: journal.source_id,
                idempotency_key: journal.idempotency_key,
            })
            .returning();

        // Insert journal lines
        const insertedLines = await db
            .insert(schema.journalLines)
            .values(
                journal.lines.map(line => ({
                    journal_id: insertedJournal.id,
                    account_code: line.account_code,
                    dc: line.dc,
                    amount: line.amount,
                    currency: line.currency,
                    party_type: line.party_type,
                    party_id: line.party_id,
                }))
            )
            .returning();

        return {
            id: insertedJournal.id,
            lines: insertedLines.map(line => ({
                id: line.id,
                account_code: line.account_code,
                dc: line.dc as "D" | "C",
                amount: line.amount as Money,
                currency: line.currency,
                party_type: line.party_type as "Customer" | "Supplier" | undefined,
                party_id: line.party_id || undefined,
            })),
        };
    }

    async enqueueOutbox(event: unknown, tx?: Tx): Promise<void> {
        const db = tx || this.db;

        await db.insert(schema.outbox).values({
            event_type: typeof event === "object" && event !== null && "type" in event
                ? String(event.type)
                : "unknown",
            event_data: event as Record<string, unknown>,
        });
    }

    async close(): Promise<void> {
        await this.pool.end();
    }
}

// Export types and utilities
export { schema };
export type { Tx, TxManager, LedgerRepo };
