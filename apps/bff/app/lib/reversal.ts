import { pool, repo, tx } from './db';

/** Creates a reversing journal for an existing journal. Idempotent by (origId, postingDate). */
export async function reverseJournal(journalId: string, postingISO: string) {
  // Build an idempotency key
  const key = `Reverse:${journalId}:${postingISO.slice(0, 10)}`;

  // quick replay?
  const exist = await repo.getIdByKey(key as any);
  if (exist) return exist;

  // Load original
  const jres = await pool.query(
    `select id, company_id, currency from journal where id=$1`,
    [journalId]
  );
  if (!jres.rows.length) throw new Error('Original journal not found');
  const j = jres.rows[0];

  const lines = await pool.query(
    `select account_code, dc, amount, currency, party_type, party_id
       from journal_line where journal_id=$1`,
    [journalId]
  );

  // Insert reversal inside a tx
  const jid = await tx.run(async (t: any) => {
    // Insert header
    const ins = await pool.query(
      `insert into journal(id, company_id, posting_date, currency, source_doctype, source_id, idempotency_key, is_reversal, reverses_journal_id)
       values ($1,$2,$3,$4,'Reversal',$5,$6,'true',$7) returning id`,
      [
        crypto.randomUUID(),
        j.company_id,
        postingISO,
        j.currency,
        journalId,
        key,
        journalId,
      ]
    );
    const newId = ins.rows[0].id;

    // Flip lines
    for (const l of lines.rows) {
      await pool.query(
        `insert into journal_line(id, journal_id, account_code, dc, amount, currency, party_type, party_id)
         values ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          crypto.randomUUID(),
          newId,
          l.account_code,
          l.dc === 'D' ? 'C' : 'D',
          l.amount,
          l.currency,
          l.party_type,
          l.party_id,
        ]
      );
    }

    // enqueue outbox
    await pool.query(
      `insert into outbox(id, topic, payload) values ($1,$2,$3)`,
      [
        crypto.randomUUID(),
        'JournalReversed',
        JSON.stringify({ original_id: journalId, reversal_id: newId }),
      ]
    );

    return newId;
  });

  return jid;
}
