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