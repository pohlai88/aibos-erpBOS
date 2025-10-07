export type Money = { amount: string; currency: string };

export type RepoJournalLine = {
  id: string;
  account_code: string;
  dc: 'D' | 'C';
  amount: Money;
  currency: string;
  party_type?: 'Customer' | 'Supplier';
  party_id?: string;
  // Multi-currency fields
  base_amount?: Money;
  base_currency?: string;
  txn_amount?: Money;
  txn_currency?: string;
};

export type RepoJournal = {
  id: string;
  company_id: string;
  posting_date: string;
  currency: string;
  source_doctype: string;
  source_id: string;
  idempotency_key: string;
  lines: RepoJournalLine[];
  // Multi-currency fields
  base_currency?: string;
  rate_used?: number;
};

export interface Tx {
  // tag interface for driver-specific transaction object
}

export interface TxManager {
  run<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
}

export interface LedgerRepo {
  existsByKey(key: string, tx?: Tx): Promise<boolean>;
  getIdByKey(key: string, tx?: Tx): Promise<string | null>;
  insertJournal(
    j: Omit<RepoJournal, 'id'>,
    tx?: Tx
  ): Promise<{ id: string; lines: RepoJournalLine[] }>;
  enqueueOutbox(event: unknown, tx?: Tx): Promise<void>;
  trialBalance?(
    companyId: string,
    currency: string,
    tx?: Tx
  ): Promise<
    Array<{
      account_code: string;
      debit: string;
      credit: string;
      currency: string;
    }>
  >;
}

// Export Accounts Port (M01: Core Ledger)
export * from './accounts-port.js';

// Make sure they're exported as types for consumers:
export type { LedgerRepo as LedgerRepoType, TxManager as TxManagerType };
