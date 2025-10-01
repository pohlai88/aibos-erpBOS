import type { LedgerRepo, RepoJournal, RepoJournalLine, Tx, TxManager } from "@aibos/ports";

// Minimal in-memory ledger + trial balance for demo (fallback implementation)
type Money = { amount: string; currency: string };

export type JournalLine = {
  id: string;
  account_code: string;
  dc: "D" | "C";
  amount: Money; // string decimal
  currency: string;
  party_type?: "Customer" | "Supplier";
  party_id?: string;
};

export type Journal = {
  id: string;
  company_id: string;
  posting_date: string; // ISO
  currency: string;
  source: { doctype: string; id: string };
  lines: JournalLine[];
};

const journals = new Map<string, Journal>();          // key = idempotency key OR journal_id
const byId = new Map<string, Journal>();              // quick lookup by journal_id

export function genId(prefix = "JRN"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function insertJournal(j: Omit<Journal, "id"> & { id?: string }, idempotencyKey: string): Promise<Journal> {
  const existing = journals.get(idempotencyKey);
  if (existing) return existing;
  const id = j.id ?? genId();
  const journal: Journal = { id, ...j };
  journals.set(idempotencyKey, journal);
  byId.set(id, journal);
  return journal;
}

export async function getJournal(journalId: string): Promise<Journal | null> {
  return byId.get(journalId) ?? null;
}

export type TrialBalanceRow = {
  account_code: string;
  debit: string;   // decimal string
  credit: string;  // decimal string
  currency: string;
};

export async function trialBalance(company_id: string, currency: string): Promise<TrialBalanceRow[]> {
  // Aggregate all lines for the company/currency
  const acc = new Map<string, { d: number; c: number }>();
  for (const j of byId.values()) {
    if (j.company_id !== company_id || j.currency !== currency) continue;
    for (const l of j.lines) {
      const key = `${l.account_code}:${l.currency}`;
      const slot = acc.get(key) ?? { d: 0, c: 0 };
      const amt = Number(l.amount.amount); // demo only; real impl should use decimal lib
      if (l.dc === "D") slot.d += amt; else slot.c += amt;
      acc.set(key, slot);
    }
  }
  const rows: TrialBalanceRow[] = [];
  for (const [key, v] of acc.entries()) {
    const [account_code, curr] = key.split(":");
    rows.push({
      account_code: account_code || "",
      debit: v.d.toFixed(2),
      credit: v.c.toFixed(2),
      currency: curr || "",
    });
  }
  // sort for stable UI
  rows.sort((a, b) => a.account_code.localeCompare(b.account_code));
  return rows;
}

// Service class that can use either database or in-memory implementation
export class LedgerService {
  constructor(
    private ledgerRepo?: LedgerRepo,
    private txManager?: TxManager
  ) { }

  async insertJournal(journal: Omit<RepoJournal, "id">): Promise<{ id: string; lines: RepoJournalLine[] }> {
    if (this.ledgerRepo && this.txManager) {
      // Use database implementation
      return await this.txManager.run(async (tx) => {
        // Check for existing journal by idempotency key
        const exists = await this.ledgerRepo!.existsByKey(journal.idempotency_key, tx);
        if (exists) {
          throw new Error(`Journal with idempotency key ${journal.idempotency_key} already exists`);
        }

        // Insert journal and lines
        const result = await this.ledgerRepo!.insertJournal(journal, tx);

        // Enqueue outbox event
        await this.ledgerRepo!.enqueueOutbox({
          type: "JournalCreated",
          payload: { journalId: result.id, companyId: journal.company_id },
          timestamp: new Date(),
          aggregateId: journal.company_id
        }, tx);

        return result;
      });
    } else {
      // Fallback to in-memory implementation
      const idempotencyKey = journal.idempotency_key;
      const existing = journals.get(idempotencyKey);
      if (existing) {
        return {
          id: existing.id,
          lines: existing.lines.map(l => ({
            id: l.id,
            account_code: l.account_code,
            dc: l.dc,
            amount: l.amount,
            currency: l.currency,
            ...(l.party_type && { party_type: l.party_type }),
            ...(l.party_id && { party_id: l.party_id })
          }))
        };
      }

      const id = genId();
      const journalWithId: Journal = {
        id,
        company_id: journal.company_id,
        posting_date: journal.posting_date,
        currency: journal.currency,
        source: { doctype: journal.source_doctype, id: journal.source_id },
        lines: journal.lines.map(l => ({
          id: genId("JRL"),
          account_code: l.account_code,
          dc: l.dc,
          amount: l.amount,
          currency: l.currency,
          ...(l.party_type && { party_type: l.party_type }),
          ...(l.party_id && { party_id: l.party_id })
        }))
      };

      journals.set(idempotencyKey, journalWithId);
      byId.set(id, journalWithId);

      return {
        id,
        lines: journalWithId.lines.map(l => ({
          id: l.id,
          account_code: l.account_code,
          dc: l.dc,
          amount: l.amount,
          currency: l.currency,
          ...(l.party_type && { party_type: l.party_type }),
          ...(l.party_id && { party_id: l.party_id })
        }))
      };
    }
  }

  async getJournal(journalId: string): Promise<Journal | null> {
    if (this.ledgerRepo) {
      // Database implementation would go here
      // For now, fallback to in-memory
    }
    return byId.get(journalId) ?? null;
  }

  async trialBalance(companyId: string, currency: string): Promise<TrialBalanceRow[]> {
    if (this.ledgerRepo && this.txManager) {
      // Database implementation
      return await this.txManager.run(async (tx: Tx) => {
        if (!this.ledgerRepo?.trialBalance) {
          throw new Error("Trial balance not supported by this repository");
        }
        const rows = await this.ledgerRepo.trialBalance(companyId, currency, tx);
        return rows.map((r: any) => ({
          account_code: r.account_code,
          debit: r.debit,
          credit: r.credit,
          currency: r.currency
        }));
      });
    } else {
      // Fallback to in-memory implementation
      return trialBalance(companyId, currency);
    }
  }
}
