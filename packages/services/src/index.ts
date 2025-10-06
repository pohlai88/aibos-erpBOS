// Services with port-based architecture
export {
  LedgerService,
  genId,
  type Journal,
  type JournalLine,
  type TrialBalanceRow,
} from './ledger';
export { postSalesInvoice } from './posting';
export { postPurchaseInvoice } from './posting-pi';
export { pingService } from './ping';
export { buildCashReport } from './reports/cash-builder';
export { reverseJournal } from './reversal';

// Re-export port types for convenience
export type {
  LedgerRepo,
  TxManager,
  Tx,
  RepoJournal,
  RepoJournalLine,
} from '@aibos/ports';
