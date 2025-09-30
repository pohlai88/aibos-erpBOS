// Services with port-based architecture
export { LedgerService, genId, type Journal, type JournalLine, type TrialBalanceRow } from "./ledger.js";
export { postSalesInvoice } from "./posting.js";
export { pingService } from "./ping.js";

// Re-export port types for convenience
export type { LedgerRepo, TxManager, Tx, RepoJournal, RepoJournalLine } from "@aibos/ports";
