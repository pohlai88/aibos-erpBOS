import 'dotenv/config';
import { pool } from './db.js';
import { processDueReversals } from './reversals.js';
import { processWebhooksOnce } from './webhooks.js';

async function runOnce() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // pick a small batch
    const { rows } = await client.query(
      'SELECT id, topic, payload FROM outbox ORDER BY created_at ASC LIMIT 10 FOR UPDATE SKIP LOCKED'
    );
    for (const r of rows) {
      // "deliver" (demo: just log)
      console.log(`[OUTBOX] ${r.topic} ${r.id}`, r.payload);

      // delete (consider keeping for audit in real impl)
      await client.query('DELETE FROM outbox WHERE id = $1', [r.id]);
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Outbox error', e);
  } finally {
    client.release();
  }
}

async function main() {
  console.log('Worker started');
  // simple poller
  while (true) {
    await runOnce(); // existing outbox drain logs, etc.
    await processDueReversals(); // from M6
    await processWebhooksOnce(); // NEW
    await new Promise(r => setTimeout(r, 1500));
  }
}
main().catch(e => {
  console.error(e);
  process.exit(1);
});
