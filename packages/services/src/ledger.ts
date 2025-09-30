// Minimal in-memory ledger + trial balance for demo
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
  return `${prefix}-${Math.random().toString(36).slice(2,10)}`;
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
      account_code,
      debit: v.d.toFixed(2),
      credit: v.c.toFixed(2),
      currency: curr,
    });
  }
  // sort for stable UI
  rows.sort((a,b) => a.account_code.localeCompare(b.account_code));
  return rows;
}
