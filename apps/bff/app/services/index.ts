// BFF-facing façade to avoid deep relative imports from route handlers.
// This provides a stable interface to services without brittle relative paths.

// Re-export commonly used services with stable paths
export { bulkPostAssets } from "../services/assets/bulkPost";
export { importCapexCsv } from "../services/capex/importCsv";
export { importIntangibleCsv } from "../services/intangibles/importCsv";
export { revalueFx } from "../services/fx/revalue";
