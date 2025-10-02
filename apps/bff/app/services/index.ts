// BFF-facing façade to avoid deep relative imports from route handlers.
// This provides a stable interface to services without brittle relative paths.

// Re-export commonly used services with stable paths
export { bulkPostAssets } from "../services/assets/bulkPost";
export { importCapexCsv } from "../services/capex/importCsv";
export { importIntangiblesCsv } from "../services/intangibles/importCsv";
export { revalueMonetaryAccounts } from "../services/fx/revalue";

// Allocation services (M19)
export { upsertAllocRule, getActiveAllocRules, deleteAllocRule } from "../services/alloc/rules";
export { upsertAllocDriverValues, getAllocDriverValues } from "../services/alloc/rules";
export { runAllocation } from "../services/alloc/engine";
export { importAllocRulesCsv, importAllocDriversCsv } from "../services/alloc/import";

// Tax Return services (M20)
export {
    upsertTaxPartner, getTaxPartners,
    upsertTaxTemplate, getTaxTemplate,
    upsertTaxBoxMap, getTaxBoxMap,
    runTaxReturn,
    upsertTaxAdjustment, getTaxAdjustments,
    getTaxReturns, getTaxReturnDetails
} from "../services/tax_return/templates";
export { exportTaxReturn, getTaxReturnExports } from "../services/tax_return/export";

// Consolidation services (M21)
export {
    upsertEntity, upsertGroup, upsertOwnership,
    getEntities, getGroups, getOwnershipTree
} from "../services/consol/entities";
export {
    createIcLink, createIcMatch, getIcMatches, getIcLinks
} from "../services/consol/ic";
export {
    runIcElimination, getIcElimRuns
} from "../services/consol/elimination";
export {
    runConsolidation, getConsolRuns
} from "../services/consol/consolidation";