export type Money = { amount: string; currency: string };

export type RepoJournalLine = {
    id: string;
    account_code: string;
    dc: "D" | "C";
    amount: Money;
    currency: string;
    party_type?: "Customer" | "Supplier";
    party_id?: string;
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
};

export interface Tx {
    // tag interface for driver-specific transaction object
}
export interface TxManager {
    run<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
}

export interface LedgerRepo {
    existsByKey(key: string, tx?: Tx): Promise<boolean>;
    insertJournal(j: Omit<RepoJournal, "id">, tx?: Tx): Promise<{ id: string; lines: RepoJournalLine[] }>;
    enqueueOutbox(event: unknown, tx?: Tx): Promise<void>;
    trialBalance?(companyId: string, currency: string, tx?: Tx): Promise<Array<{account_code: string, debit: string, credit: string, currency: string}>>;
}
