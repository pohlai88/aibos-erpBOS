import "dotenv/config";
import { pool } from "./db.js";
import { reverseJournal } from "@aibos/services";

export async function processDueReversals() {
  const { rows } = await pool.query(
    `select id, company_id, auto_reverse_on
       from journal
      where auto_reverse_on is not null
        and auto_reverse_on::date <= now()::date
        and is_reversal = 'false'
        and not exists (
          select 1 from journal r where r.reverses_journal_id = journal.id
        )
      limit 10`
  );
  for (const r of rows) {
    try {
      await reverseJournal(r.id, new Date().toISOString());
      console.log("[REVERSAL] created for", r.id);
    } catch (e) {
      console.error("[REVERSAL] failed for", r.id, e);
    }
  }
}
