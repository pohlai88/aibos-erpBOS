// BFF-facing façade to avoid deep relative imports from route handlers.
// This provides a stable interface to services without brittle relative paths.

// Ops Command Center services (M27)
export {
  KpiFabricService,
  BoardsService,
  AlertsService,
  PlaybooksService,
  WhatIfService,
} from './opscc';

// Real-Time Signals & Auto-Playbooks services (M27.1)
export { OpsSignalService, OpsRuleEngine, OpsPlaybookEngine } from './opscc';

// Playbook Studio + Guarded Autonomy services (M27.2)
export {
  PlaybookStudioService,
  RuleService,
  PlaybookService,
  GuardrailService,
  ExecutionService,
  ActionRegistry,
  OutcomeManager,
} from './opscc';

// Allocation services (M19)
export {
  upsertAllocRule,
  getActiveAllocRules,
  deleteAllocRule,
} from '../services/alloc/rules';
export {
  upsertAllocDriverValues,
  getAllocDriverValues,
} from '../services/alloc/rules';
export { runAllocation } from '../services/alloc/engine';
export {
  importAllocRulesCsv,
  importAllocDriversCsv,
} from '../services/alloc/import';

// Tax Return services (M20)
export {
  upsertTaxPartner,
  getTaxPartners,
  upsertTaxTemplate,
  getTaxTemplate,
  upsertTaxBoxMap,
  getTaxBoxMap,
  runTaxReturn,
  upsertTaxAdjustment,
  getTaxAdjustments,
  getTaxReturns,
  getTaxReturnDetails,
} from '../services/tax_return/templates';
export {
  exportTaxReturn,
  getTaxReturnExports,
} from '../services/tax_return/export';

// Consolidation services (M21)
export {
  upsertEntity,
  upsertGroup,
  upsertOwnership,
  getEntities,
  getGroups,
  getOwnershipTree,
} from '../services/consol/entities';
export {
  createIcLink,
  createIcMatch,
  getIcMatches,
  getIcLinks,
} from '../services/consol/ic';
export {
  runIcElimination,
  getIcElimRuns,
} from '../services/consol/elimination';
export {
  runConsolidation,
  getConsolRuns,
} from '../services/consol/consolidation';
