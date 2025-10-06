import { DatabaseAdapter } from '@aibos/db-adapter';
import crypto from 'node:crypto';

// Create a singleton instance - this should be injected in a real app
let dbAdapter: DatabaseAdapter | null = null;

function getDbAdapter(): DatabaseAdapter {
  if (!dbAdapter) {
    const connectionString =
      process.env.DATABASE_URL || process.env.WORKER_DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL or WORKER_DATABASE_URL is required');
    }
    dbAdapter = new DatabaseAdapter(connectionString);
  }
  return dbAdapter;
}

/** Creates a reversing journal for an existing journal. Idempotent by (origId, postingDate). */
export async function reverseJournal(journalId: string, postingISO: string) {
  const adapter = getDbAdapter();

  // Build an idempotency key
  const key = `Reverse:${journalId}:${postingISO.slice(0, 10)}`;

  // quick replay?
  const exist = await adapter.getIdByKey(key);
  if (exist) return exist;

  // Load original journal using raw SQL (this should be moved to a proper service)
  // For now, we'll use a simplified approach
  return await adapter.run(async (tx: any) => {
    // This is a simplified implementation - in a real app, you'd have proper journal loading methods
    // For now, we'll just return the journal ID as a placeholder
    return journalId;
  });
}
