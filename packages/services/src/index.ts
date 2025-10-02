// Services with port-based architecture
export { LedgerService, genId, type Journal, type JournalLine, type TrialBalanceRow } from "./ledger.js";
export { postSalesInvoice } from "./posting.js";
export { postPurchaseInvoice } from "./posting-pi.js";
export { pingService } from "./ping.js";
export { buildCashReport } from "./reports/cash-builder.js";

// Re-export port types for convenience
export type { LedgerRepo, TxManager, Tx, RepoJournal, RepoJournalLine } from "@aibos/ports";
