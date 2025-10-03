// AR Services - Clean Implementation
// ==================================

export { ArCashApplicationService } from './cash-application';
export { ArDunningService } from './dunning';
export { ArPtpDisputesService } from './ptp-disputes';

// Export types
export type {
    ArInvoice,
    RemittanceRow,
    MatchResult,
    DunningContext,
    PtpRecord,
    DisputeRecord,
    ServiceResult,
    CashApplicationResult,
    DunningRunResult
} from './types';

// Service instances (singletons)
import { ArCashApplicationService } from './cash-application';
import { ArDunningService } from './dunning';
import { ArPtpDisputesService } from './ptp-disputes';

export const cashApplicationService = new ArCashApplicationService();
export const dunningService = new ArDunningService();
export const ptpDisputesService = new ArPtpDisputesService();