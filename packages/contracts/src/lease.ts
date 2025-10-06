import { z } from 'zod';

// --- Lease Accounting Core Contracts (M28 - MFRS 16) ------------------------------------------------

// Lease Management
export const LeaseUpsert = z.object({
  lease_code: z.string().min(1).max(50),
  lessor: z.string().min(1).max(200),
  asset_class: z.enum(['Land/Building', 'IT/Equipment', 'Vehicles', 'Others']),
  ccy: z.string().length(3),
  commence_on: z.string(), // YYYY-MM-DD
  end_on: z.string(), // YYYY-MM-DD
  payment_frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUALLY']),
  discount_rate: z.number().min(0).max(1), // decimal rate (e.g., 0.085 for 8.5%)
  rate_kind: z.enum(['fixed', 'floating']).default('fixed'),
  index_code: z.string().optional(), // CPI index for floating rates
  short_term_exempt: z.boolean().default(false),
  low_value_exempt: z.boolean().default(false),
  present_ccy: z.string().length(3).optional(), // presentation currency (M17)
  status: z.enum(['DRAFT', 'ACTIVE', 'TERMINATED', 'EXPIRED']).default('DRAFT'),
});

export const LeaseCashflowRow = z.object({
  due_on: z.string(), // YYYY-MM-DD
  amount: z.number().positive(),
  in_substance_fixed: z.boolean().default(true),
  variable_flag: z.boolean().default(false),
  index_base: z.number().optional(), // base index rate for variable payments
  index_link_id: z.string().optional(),
});

export const LeaseQuery = z.object({
  asset_class: z
    .enum(['Land/Building', 'IT/Equipment', 'Vehicles', 'Others'])
    .optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'TERMINATED', 'EXPIRED']).optional(),
  commence_from: z.string().optional(), // YYYY-MM-DD
  commence_to: z.string().optional(), // YYYY-MM-DD
  lessor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Lease Events (Remeasurements/Modifications)
export const LeaseEventUpsert = z.object({
  lease_code: z.string(),
  kind: z.enum(['INDEX', 'RATE', 'TERM', 'SCOPE', 'TERMINATION']),
  effective_on: z.string(), // YYYY-MM-DD
  index_rate: z.number().optional(), // new index rate for CPI changes
  delta_term: z.number().int().optional(), // change in lease term (months)
  delta_pay: z.number().optional(), // change in payment amount
  scope_change_pct: z.number().min(0).max(100).optional(), // percentage change in scope
  termination_flag: z.boolean().default(false),
  notes: z.string().optional(),
});

// Lease Run (Monthly Posting)
export const LeaseRunReq = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  dry_run: z.boolean().default(true),
});

export const LeaseRunResponse = z.object({
  run_id: z.string(),
  status: z.enum(['DRAFT', 'POSTED', 'ERROR']),
  stats: z.object({
    total_leases: z.number().int(),
    total_interest: z.number(),
    total_payments: z.number(),
    total_amortization: z.number(),
    fx_revaluations: z.number(),
  }),
  journal_lines: z.array(
    z.object({
      lease_code: z.string(),
      dr_account: z.string(),
      cr_account: z.string(),
      amount: z.number(),
      memo: z.string(),
    })
  ),
});

// Lease Schedule Query
export const LeaseScheduleQuery = z.object({
  lease_code: z.string().optional(),
  year: z.number().int().min(2020).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional(),
  present: z.string().length(3).optional(), // presentation currency for view-only conversion
});

// Lease Disclosures
export const LeaseDisclosureReq = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

export const LeaseDisclosureResponse = z.object({
  maturity_analysis: z.object({
    within_1_year: z.number(),
    between_1_2_years: z.number(),
    between_2_3_years: z.number(),
    between_3_5_years: z.number(),
    beyond_5_years: z.number(),
    total_undiscounted: z.number(),
  }),
  rollforward: z.object({
    opening_liability: z.number(),
    interest_expense: z.number(),
    payments: z.number(),
    remeasurements: z.number(),
    fx_revaluations: z.number(),
    closing_liability: z.number(),
  }),
  wadr: z.number(), // weighted average discount rate
  expenses: z.object({
    short_term: z.number(),
    low_value: z.number(),
    variable: z.number(),
  }),
  total_cash_outflow: z.number(),
  // M28.5: Sublease & SLB disclosures
  sublease_income: z.number().optional(),
  finance_sublease_interest: z.number().optional(),
  nis_closing: z.number().optional(),
  slb_gains: z.number().optional(),
  slb_deferred_gain_carry: z.number().optional(),
  slb_cash_proceeds: z.number().optional(),
});

// Lease Import
export const LeaseImportReq = z.object({
  mapping: z.object({
    lease_code: z.string(),
    lessor: z.string(),
    asset_class: z.string(),
    ccy: z.string(),
    commence_on: z.string(),
    end_on: z.string(),
    payment_frequency: z.string(),
    discount_rate: z.string(),
    cashflows: z.string(), // JSON string of cashflow array
  }),
  content_hash: z.string().optional(), // for idempotency
});

// Lease Evidence (M26.4 Integration)
export const LeaseEvidenceReq = z.object({
  lease_code: z.string(),
  evidence_id: z.string(), // references M26.4 evidence vault
  attachment_type: z.enum(['AGREEMENT', 'CPI_NOTICE', 'IDC_SUPPORT', 'OTHER']),
  description: z.string().optional(),
});

// M28.1: CPI Index Management
export const LeaseCpiUpsert = z.object({
  index_code: z.string().min(1).max(50),
  rows: z.array(
    z.object({
      date: z.string(), // YYYY-MM-DD
      value: z.number().positive(),
    })
  ),
  lag_months: z.number().int().min(0).max(12).default(0),
});

export const LeaseCpiQuery = z.object({
  index_code: z.string().optional(),
  date_from: z.string().optional(), // YYYY-MM-DD
  date_to: z.string().optional(), // YYYY-MM-DD
});

// M28.1: Event Application (Apply Remeasurements)
export const LeaseEventApplyReq = z.object({
  lease_code: z.string(),
  event_id: z.string(),
});

export const LeaseEventApplyResponse = z.object({
  event_id: z.string(),
  artifact_id: z.string(),
  delta_liability: z.number(),
  delta_rou: z.number(),
  new_discount_rate: z.number(),
  schedule_rebuilt: z.boolean(),
  proof_checksum: z.string(),
});

// M28.1: Schedule Rebuild
export const LeaseScheduleRebuildReq = z.object({
  lease_code: z.string(),
  as_of: z.string(), // YYYY-MM-DD
});

export const LeaseScheduleRebuildResponse = z.object({
  lease_id: z.string(),
  rebuild_date: z.string(),
  total_months: z.number().int(),
  new_present_value: z.number(),
  monthly_rate: z.number(),
});

// M28.1: Enhanced Posting Service
export const LeasePostingRunReq = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  dry_run: z.boolean().default(true),
  force: z.boolean().default(false), // override period locks
});

export const LeasePostingRunResponse = z.object({
  run_id: z.string(),
  status: z.enum(['DRAFT', 'POSTED', 'ERROR', 'LOCKED']),
  stats: z.object({
    total_leases: z.number().int(),
    total_interest: z.number(),
    total_payments: z.number(),
    total_amortization: z.number(),
    fx_revaluations: z.number(),
    journal_entries_created: z.number().int(),
  }),
  journal_lines: z.array(
    z.object({
      lease_code: z.string(),
      dr_account: z.string(),
      cr_account: z.string(),
      amount: z.number(),
      memo: z.string(),
    })
  ),
  errors: z.array(z.string()).optional(),
});

// M28.1: Enhanced Disclosures
export const LeaseDisclosureSnapshotReq = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  include_rollforward: z.boolean().default(true),
  include_maturity: z.boolean().default(true),
  include_wadr: z.boolean().default(true),
});

export const LeaseDisclosureSnapshotResponse = z.object({
  snapshot_id: z.string(),
  period: z.string(), // YYYY-MM format
  maturity_analysis: z.object({
    within_1_year: z.number(),
    between_1_2_years: z.number(),
    between_2_3_years: z.number(),
    between_3_5_years: z.number(),
    beyond_5_years: z.number(),
    total_undiscounted: z.number(),
  }),
  rollforward: z.object({
    opening_liability: z.number(),
    interest_expense: z.number(),
    payments: z.number(),
    remeasurements: z.number(),
    fx_revaluations: z.number(),
    closing_liability: z.number(),
  }),
  wadr: z.number(),
  expenses: z.object({
    short_term: z.number(),
    low_value: z.number(),
    variable: z.number(),
  }),
  total_cash_outflow: z.number(),
  generated_at: z.string(),
});

// M28.1: Remeasurement Artifact
export const LeaseRemeasureArtifactResponse = z.object({
  id: z.string(),
  lease_id: z.string(),
  event_id: z.string(),
  artifact_type: z.string(),
  inputs: z.record(z.any()),
  calculations: z.record(z.any()),
  outputs: z.record(z.any()),
  checksum: z.string(),
  computed_at: z.string(),
  computed_by: z.string(),
});

// M28.3: Componentized ROU & Impairment Contracts

// Component Design
export const LeaseComponentDesignReq = z.object({
  splits: z.array(
    z.object({
      code: z.string().min(1).max(50),
      name: z.string().min(1).max(200),
      class: z.enum([
        'Land',
        'Building',
        'Fit-out',
        'IT/Equipment',
        'Vehicles',
        'Others',
      ]),
      uom: z.string().optional(),
      pct_of_rou: z.number().min(0).max(1),
      useful_life_months: z.number().int().min(1),
      method: z.enum(['SL', 'DDB', 'Units']).default('SL'),
      units_basis: z.number().optional(),
    })
  ),
});

export const LeaseComponentDesignResponse = z.object({
  lease_id: z.string(),
  components: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
      class: z.string(),
      pct_of_rou: z.number(),
      useful_life_months: z.number(),
      method: z.string(),
      component_rou: z.number(),
      incentive_alloc: z.number(),
      restoration_alloc: z.number(),
    })
  ),
  total_rou: z.number(),
  total_incentives: z.number(),
  total_restoration: z.number(),
  design_proof: z.object({
    total_pct: z.number(),
    lease_term_months: z.number(),
    validation_passed: z.boolean(),
  }),
});

// Component Schedule
export const LeaseComponentScheduleReq = z.object({
  rebuild: z.boolean().default(true),
});

export const LeaseComponentScheduleResponse = z.object({
  lease_id: z.string(),
  component_schedules: z.array(
    z.object({
      component_id: z.string(),
      component_code: z.string(),
      component_name: z.string(),
      component_class: z.string(),
      method: z.string(),
      total_rou: z.number(),
      total_amortization: z.number(),
      useful_life_months: z.number(),
      schedule_rows: z.array(
        z.object({
          year: z.number(),
          month: z.number(),
          open_carry: z.number(),
          rou_amort: z.number(),
          interest: z.number(),
          close_carry: z.number(),
        })
      ),
    })
  ),
  reconciliation: z.object({
    total_component_rou: z.number(),
    total_lease_rou: z.number(),
    rou_difference: z.number(),
    total_component_amort: z.number(),
    total_lease_amort: z.number(),
    amort_difference: z.number(),
    reconciliation_passed: z.boolean(),
  }),
  generated_at: z.string(),
});

// Impairment Assessment
export const LeaseImpairAssessReq = z.object({
  cgu_code: z.string().min(1).max(50),
  level: z.enum(['COMPONENT', 'CGU']),
  method: z.enum(['VIU', 'FVLCD']),
  discount_rate: z.number().min(0).max(1),
  recoverable_amount: z.number().min(0),
  trigger: z.enum(['INDICATOR', 'ANNUAL', 'EVENT']),
  as_of_date: z.string(), // YYYY-MM-DD
  component_ids: z.array(z.string()).optional(), // for COMPONENT level
  notes: z.string().optional(),
});

export const LeaseImpairAssessResponse = z.object({
  test_id: z.string(),
  cgu_code: z.string(),
  level: z.string(),
  method: z.string(),
  as_of_date: z.string(),
  total_carrying_amount: z.number(),
  recoverable_amount: z.number(),
  impairment_loss: z.number(),
  allocation_lines: z.array(
    z.object({
      component_id: z.string(),
      component_code: z.string(),
      component_name: z.string(),
      carrying_amount: z.number(),
      allocated_loss: z.number(),
      allocated_reversal: z.number(),
      after_amount: z.number(),
    })
  ),
  measurement_proof: z.object({
    discount_rate: z.number(),
    calculation_method: z.string(),
    allocation_basis: z.string(),
    validation_passed: z.boolean(),
  }),
});

// Impairment Posting
export const LeaseImpairPostReq = z.object({
  impair_test_id: z.string(),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  dry_run: z.boolean().default(false),
});

export const LeaseImpairPostResponse = z.object({
  post_id: z.string(),
  test_id: z.string(),
  journal_entry_id: z.string(),
  year: z.number(),
  month: z.number(),
  total_loss: z.number(),
  total_reversal: z.number(),
  journal_lines: z.array(
    z.object({
      dr_account: z.string(),
      cr_account: z.string(),
      amount: z.number(),
      memo: z.string(),
    })
  ),
  posted_at: z.string(),
  posted_by: z.string(),
});

// Impairment Test Query
export const LeaseImpairTestQuery = z.object({
  as_of_date: z.string().optional(),
  cgu_code: z.string().optional(),
  status: z.enum(['DRAFT', 'MEASURED', 'POSTED']).optional(),
});

export const LeaseImpairTestResponse = z.object({
  test_id: z.string(),
  cgu_code: z.string(),
  level: z.string(),
  method: z.string(),
  discount_rate: z.number(),
  recoverable_amount: z.number(),
  trigger: z.string(),
  as_of_date: z.string(),
  status: z.string(),
  notes: z.string().nullable(),
  allocation_lines: z.array(
    z.object({
      component_id: z.string(),
      component_code: z.string(),
      component_name: z.string(),
      carrying_amount: z.number(),
      allocated_loss: z.number(),
      allocated_reversal: z.number(),
      after_amount: z.number(),
    })
  ),
  created_at: z.string(),
  created_by: z.string(),
});

// Component Disclosures
export const LeaseComponentDisclosureResponse = z.object({
  year: z.number(),
  month: z.number(),
  component_carrying_amounts: z.object({
    Land: z.number(),
    Building: z.number(),
    'Fit-out': z.number(),
    'IT/Equipment': z.number(),
    Vehicles: z.number(),
    Others: z.number(),
  }),
  component_amortization: z.object({
    Land: z.number(),
    Building: z.number(),
    'Fit-out': z.number(),
    'IT/Equipment': z.number(),
    Vehicles: z.number(),
    Others: z.number(),
  }),
  restoration_provisions_movement: z.object({
    opening: z.number(),
    additions: z.number(),
    unwind_interest: z.number(),
    utilizations: z.number(),
    remeasurements: z.number(),
    closing: z.number(),
  }),
});

// Impairment Disclosures
export const LeaseImpairmentDisclosureResponse = z.object({
  year: z.number(),
  month: z.number(),
  impairment_charges: z.object({
    by_class: z.object({
      Land: z.number(),
      Building: z.number(),
      'Fit-out': z.number(),
      'IT/Equipment': z.number(),
      Vehicles: z.number(),
      Others: z.number(),
    }),
    by_cgu: z.record(z.number()),
    total: z.number(),
  }),
  impairment_reversals: z.object({
    by_class: z.object({
      Land: z.number(),
      Building: z.number(),
      'Fit-out': z.number(),
      'IT/Equipment': z.number(),
      Vehicles: z.number(),
      Others: z.number(),
    }),
    by_cgu: z.record(z.number()),
    total: z.number(),
  }),
  net_impairment: z.number(),
});

// Lease Maturity Analysis
export const LeaseMaturityQuery = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  asset_class: z
    .enum(['Land/Building', 'IT/Equipment', 'Vehicles', 'Others'])
    .optional(),
});

export const LeaseMaturityResponse = z.object({
  maturity_bands: z.array(
    z.object({
      band: z.string(), // "≤1y", "1-2y", "2-3y", "3-5y", ">5y"
      undiscounted_amount: z.number(),
      discounted_amount: z.number(),
      lease_count: z.number().int(),
    })
  ),
  total_undiscounted: z.number(),
  total_discounted: z.number(),
  total_leases: z.number().int(),
});

// Response Types
export const LeaseResponse = z.object({
  id: z.string(),
  lease_code: z.string(),
  lessor: z.string(),
  asset_class: z.string(),
  ccy: z.string(),
  commence_on: z.string(),
  end_on: z.string(),
  payment_frequency: z.string(),
  discount_rate: z.number(),
  rate_kind: z.string(),
  index_code: z.string().nullable(),
  short_term_exempt: z.boolean(),
  low_value_exempt: z.boolean(),
  present_ccy: z.string().nullable(),
  status: z.string(),
  created_at: z.string(),
  created_by: z.string(),
  updated_at: z.string(),
  updated_by: z.string(),
});

export const LeaseScheduleResponse = z.object({
  lease_code: z.string(),
  year: z.number().int(),
  month: z.number().int(),
  open_liab: z.number(),
  interest: z.number(),
  payment: z.number(),
  fx_reval: z.number(),
  close_liab: z.number(),
  rou_amort: z.number(),
  rou_carry: z.number(),
  notes: z.string().nullable(),
});

export const LeaseEventResponse = z.object({
  id: z.string(),
  lease_code: z.string(),
  kind: z.string(),
  effective_on: z.string(),
  index_rate: z.number().nullable(),
  delta_term: z.number().int().nullable(),
  delta_pay: z.number().nullable(),
  scope_change_pct: z.number().nullable(),
  termination_flag: z.boolean(),
  notes: z.string().nullable(),
  created_at: z.string(),
  created_by: z.string(),
});

// Error Response
export const LeaseErrorResponse = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
});

// Type exports
export type LeaseUpsertType = z.infer<typeof LeaseUpsert>;
export type LeaseCashflowRowType = z.infer<typeof LeaseCashflowRow>;
export type LeaseQueryType = z.infer<typeof LeaseQuery>;
export type LeaseEventUpsertType = z.infer<typeof LeaseEventUpsert>;
export type LeaseRunReqType = z.infer<typeof LeaseRunReq>;
export type LeaseRunResponseType = z.infer<typeof LeaseRunResponse>;
export type LeaseScheduleQueryType = z.infer<typeof LeaseScheduleQuery>;
export type LeaseDisclosureReqType = z.infer<typeof LeaseDisclosureReq>;
export type LeaseDisclosureResponseType = z.infer<
  typeof LeaseDisclosureResponse
>;
export type LeaseImportReqType = z.infer<typeof LeaseImportReq>;
export type LeaseEvidenceReqType = z.infer<typeof LeaseEvidenceReq>;
export type LeaseMaturityQueryType = z.infer<typeof LeaseMaturityQuery>;
export type LeaseMaturityResponseType = z.infer<typeof LeaseMaturityResponse>;
export type LeaseResponseType = z.infer<typeof LeaseResponse>;
export type LeaseScheduleResponseType = z.infer<typeof LeaseScheduleResponse>;
export type LeaseEventResponseType = z.infer<typeof LeaseEventResponse>;
export type LeaseErrorResponseType = z.infer<typeof LeaseErrorResponse>;

// M28.1: New Type Exports
export type LeaseCpiUpsertType = z.infer<typeof LeaseCpiUpsert>;
export type LeaseCpiQueryType = z.infer<typeof LeaseCpiQuery>;
export type LeaseEventApplyReqType = z.infer<typeof LeaseEventApplyReq>;
export type LeaseEventApplyResponseType = z.infer<
  typeof LeaseEventApplyResponse
>;
export type LeaseScheduleRebuildReqType = z.infer<
  typeof LeaseScheduleRebuildReq
>;
export type LeaseScheduleRebuildResponseType = z.infer<
  typeof LeaseScheduleRebuildResponse
>;
export type LeasePostingRunReqType = z.infer<typeof LeasePostingRunReq>;
export type LeasePostingRunResponseType = z.infer<
  typeof LeasePostingRunResponse
>;
export type LeaseDisclosureSnapshotReqType = z.infer<
  typeof LeaseDisclosureSnapshotReq
>;
export type LeaseDisclosureSnapshotResponseType = z.infer<
  typeof LeaseDisclosureSnapshotResponse
>;
export type LeaseRemeasureArtifactResponseType = z.infer<
  typeof LeaseRemeasureArtifactResponse
>;

// M28.3: Componentized ROU & Impairment Type Exports
export type LeaseComponentDesignReqType = z.infer<
  typeof LeaseComponentDesignReq
>;
export type LeaseComponentDesignResponseType = z.infer<
  typeof LeaseComponentDesignResponse
>;
export type LeaseComponentScheduleReqType = z.infer<
  typeof LeaseComponentScheduleReq
>;
export type LeaseComponentScheduleResponseType = z.infer<
  typeof LeaseComponentScheduleResponse
>;
export type LeaseImpairAssessReqType = z.infer<typeof LeaseImpairAssessReq>;
export type LeaseImpairAssessResponseType = z.infer<
  typeof LeaseImpairAssessResponse
>;
export type LeaseImpairPostReqType = z.infer<typeof LeaseImpairPostReq>;
export type LeaseImpairPostResponseType = z.infer<
  typeof LeaseImpairPostResponse
>;
export type LeaseImpairTestQueryType = z.infer<typeof LeaseImpairTestQuery>;
export type LeaseImpairTestResponseType = z.infer<
  typeof LeaseImpairTestResponse
>;
export type LeaseComponentDisclosureResponseType = z.infer<
  typeof LeaseComponentDisclosureResponse
>;
export type LeaseImpairmentDisclosureResponseType = z.infer<
  typeof LeaseImpairmentDisclosureResponse
>;

// M28.4: Lease Modifications & Indexation Remeasurements Contracts

// Indexation
export const LeaseIndexValueImportReq = z.object({
  index_code: z.string().min(1).max(50),
  rows: z.array(
    z.object({
      index_date: z.string(), // YYYY-MM-DD
      value: z.number().positive(),
    })
  ),
});

export const LeaseIndexPlanReq = z.object({
  lease_id: z.string(),
  as_of: z.string(), // YYYY-MM-DD
});

export const LeaseIndexPlanResponse = z.object({
  lease_id: z.string(),
  planned_resets: z.array(
    z.object({
      index_code: z.string(),
      current_value: z.number(),
      new_value: z.number(),
      effective_date: z.string(),
      reset_frequency: z.string(),
      cap_applied: z.boolean(),
      floor_applied: z.boolean(),
    })
  ),
  candidate_mod_id: z.string().optional(),
});

// Modifications
export const LeaseModCreateReq = z.object({
  lease_id: z.string(),
  effective_on: z.string(), // YYYY-MM-DD
  kind: z.enum(['INDEXATION', 'CONCESSION', 'SCOPE', 'TERM']),
  reason: z.string().min(1).max(500),
  lines: z.array(
    z.object({
      lease_component_id: z.string().optional(),
      action: z.enum([
        'INCREASE',
        'DECREASE',
        'RENT_FREE',
        'DEFERRAL',
        'EXTEND',
        'SHORTEN',
        'RATE_RESET',
        'AREA_CHANGE',
      ]),
      qty_delta: z.number().optional(),
      amount_delta: z.number().optional(),
      notes: z.record(z.any()).optional(),
    })
  ),
});

export const LeaseModCreateResponse = z.object({
  mod_id: z.string(),
  lease_id: z.string(),
  status: z.string(),
  created_at: z.string(),
});

export const LeaseModApplyReq = z.object({
  mod_id: z.string(),
  dry_run: z.boolean().default(true),
});

export const LeaseModApplyResponse = z.object({
  mod_id: z.string(),
  status: z.string(),
  pre_carrying: z.object({
    total_liability: z.number(),
    total_rou: z.number(),
    component_carryings: z.array(
      z.object({
        component_id: z.string(),
        component_code: z.string(),
        carrying_amount: z.number(),
      })
    ),
  }),
  post_carrying: z.object({
    total_liability: z.number(),
    total_rou: z.number(),
    component_carryings: z.array(
      z.object({
        component_id: z.string(),
        component_code: z.string(),
        carrying_amount: z.number(),
      })
    ),
  }),
  deltas: z.object({
    liability_delta: z.number(),
    rou_delta: z.number(),
    component_deltas: z.array(
      z.object({
        component_id: z.string(),
        component_code: z.string(),
        liability_delta: z.number(),
        rou_delta: z.number(),
      })
    ),
  }),
  schedule_deltas: z.array(
    z.object({
      component_id: z.string(),
      year: z.number(),
      month: z.number(),
      liab_delta: z.number(),
      rou_delta: z.number(),
      interest_delta: z.number(),
    })
  ),
});

export const LeaseModPostReq = z.object({
  mod_id: z.string(),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  dry_run: z.boolean().default(true),
});

export const LeaseModPostResponse = z.object({
  post_id: z.string(),
  mod_id: z.string(),
  journal_entry_id: z.string(),
  year: z.number(),
  month: z.number(),
  total_liability_delta: z.number(),
  total_rou_delta: z.number(),
  journal_lines: z.array(
    z.object({
      dr_account: z.string(),
      cr_account: z.string(),
      amount: z.number(),
      memo: z.string(),
    })
  ),
  posted_at: z.string(),
  posted_by: z.string(),
});

export const LeaseModDetailResponse = z.object({
  mod_id: z.string(),
  lease_id: z.string(),
  lease_code: z.string(),
  effective_on: z.string(),
  kind: z.string(),
  reason: z.string(),
  status: z.string(),
  pre_carrying: z.object({
    total_liability: z.number(),
    total_rou: z.number(),
  }),
  post_carrying: z.object({
    total_liability: z.number(),
    total_rou: z.number(),
  }),
  allocation_lines: z.array(
    z.object({
      component_id: z.string(),
      component_code: z.string(),
      component_name: z.string(),
      action: z.string(),
      qty_delta: z.number().optional(),
      amount_delta: z.number().optional(),
      notes: z.record(z.any()).optional(),
    })
  ),
  evidence_links: z.array(z.string()),
  created_at: z.string(),
  created_by: z.string(),
});

// Disclosures
export const LeaseRemeasureDisclosureReq = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

export const LeaseRemeasureDisclosureResponse = z.object({
  year: z.number(),
  month: z.number(),
  remeasurements: z.object({
    total_adjustments: z.number(),
    by_type: z.object({
      indexation: z.number(),
      concessions: z.number(),
      scope_changes: z.number(),
      term_changes: z.number(),
    }),
    by_class: z.record(z.number()),
    by_cgu: z.record(z.number()),
  }),
  rollforward: z.object({
    opening_liability: z.number(),
    interest_expense: z.number(),
    payments: z.number(),
    remeasurements: z.number(),
    closing_liability: z.number(),
  }),
  qualitative_notes: z.object({
    indexation_bases: z.array(z.string()),
    concession_types: z.array(z.string()),
    modification_types: z.array(z.string()),
  }),
});

// Type Exports
export type LeaseIndexValueImportReqType = z.infer<
  typeof LeaseIndexValueImportReq
>;
export type LeaseIndexPlanReqType = z.infer<typeof LeaseIndexPlanReq>;
export type LeaseIndexPlanResponseType = z.infer<typeof LeaseIndexPlanResponse>;
export type LeaseModCreateReqType = z.infer<typeof LeaseModCreateReq>;
export type LeaseModCreateResponseType = z.infer<typeof LeaseModCreateResponse>;
export type LeaseModApplyReqType = z.infer<typeof LeaseModApplyReq>;
export type LeaseModApplyResponseType = z.infer<typeof LeaseModApplyResponse>;
export type LeaseModPostReqType = z.infer<typeof LeaseModPostReq>;
export type LeaseModPostResponseType = z.infer<typeof LeaseModPostResponse>;
export type LeaseModDetailResponseType = z.infer<typeof LeaseModDetailResponse>;
export type LeaseRemeasureDisclosureReqType = z.infer<
  typeof LeaseRemeasureDisclosureReq
>;
export type LeaseRemeasureDisclosureResponseType = z.infer<
  typeof LeaseRemeasureDisclosureResponse
>;

// --- M28.6: Lease Impairment & Onerous Contracts (MFRS/IFRS 16 + IAS 36/37) -------------------------

// Cash Generating Units (CGU)
export const CGUUpsert = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  notes: z.string().optional(),
});

export const CGUQuery = z.object({
  code: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// CGU Allocation Links
export const CGULinkUpsert = z.object({
  lease_component_id: z.string(),
  cgu_id: z.string(),
  weight: z.number().min(0).max(1), // allocation weight (0-1)
});

// Impairment Indicators
export const ImpairmentIndicatorUpsert = z.object({
  as_of_date: z.string(), // YYYY-MM-DD
  cgu_id: z.string().optional(), // null for component-specific indicators
  lease_component_id: z.string().optional(), // null for CGU-level indicators
  kind: z.enum([
    'BUDGET_SHORTFALL',
    'VACANCY',
    'MARKET_RENT_DROP',
    'SUBLEASE_LOSS',
    'OTHER',
  ]),
  value: z.record(z.any()), // indicator-specific data
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  source: z.string().min(1).max(100), // source of indicator
});

export const ImpairmentIndicatorQuery = z.object({
  as_of_date: z.string().optional(), // YYYY-MM-DD
  cgu_id: z.string().optional(),
  lease_component_id: z.string().optional(),
  kind: z
    .enum([
      'BUDGET_SHORTFALL',
      'VACANCY',
      'MARKET_RENT_DROP',
      'SUBLEASE_LOSS',
      'OTHER',
    ])
    .optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Impairment Tests
export const ImpairmentTestUpsert = z.object({
  cgu_id: z.string(),
  as_of_date: z.string(), // YYYY-MM-DD
  method: z.enum(['VIU', 'FVLCD', 'HIGHER']), // Value in Use, Fair Value Less Costs of Disposal, Higher of both
  discount_rate: z.number().min(0).max(1), // discount rate (e.g., 0.085 for 8.5%)
  cashflows: z.record(z.any()), // discounted cash flow projections
  carrying_amount: z.number().positive(),
  recoverable_amount: z.number().positive(),
  loss: z.number().min(0).default(0),
  reversal_cap: z.number().min(0).default(0),
});

export const ImpairmentTestQuery = z.object({
  as_of_date: z.string().optional(), // YYYY-MM-DD
  cgu_id: z.string().optional(),
  method: z.enum(['VIU', 'FVLCD', 'HIGHER']).optional(),
  status: z.enum(['DRAFT', 'POSTED']).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Impairment Test Posting
export const ImpairmentTestPostReq = z.object({
  test_id: z.string(),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  dry_run: z.boolean().default(true),
});

// Onerous Contract Assessments
export const OnerousAssessmentUpsert = z.object({
  as_of_date: z.string(), // YYYY-MM-DD
  lease_component_id: z.string().optional(), // null for non-lease service components
  service_item: z.string().min(1).max(200), // description of service component
  term_months: z.number().int().positive(), // remaining term in months
  unavoidable_cost: z.number().positive(), // unavoidable costs to fulfill contract
  expected_benefit: z.number().min(0), // expected economic benefits
  provision: z.number().min(0).default(0), // provision amount
});

export const OnerousAssessmentQuery = z.object({
  as_of_date: z.string().optional(), // YYYY-MM-DD
  lease_component_id: z.string().optional(),
  service_item: z.string().optional(),
  status: z.enum(['DRAFT', 'RECOGNIZED', 'RELEASED']).optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

// Onerous Contract Roll
export const OnerousRollReq = z.object({
  assessment_id: z.string(),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

export const OnerousRollPostReq = z.object({
  assessment_id: z.string(),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  dry_run: z.boolean().default(true),
});

// Impairment & Onerous Disclosures
export const ImpairmentOnerousDisclosureReq = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

export const ImpairmentOnerousDisclosureResponse = z.object({
  impairment_summary: z.object({
    total_loss: z.number(),
    total_reversal: z.number(),
    cgu_count: z.number().int(),
    method_breakdown: z.record(z.number()),
  }),
  onerous_summary: z.object({
    total_opening: z.number(),
    total_charge: z.number(),
    total_unwind: z.number(),
    total_utilization: z.number(),
    total_closing: z.number(),
    assessment_count: z.number().int(),
  }),
  indicators_summary: z.object({
    total_indicators: z.number().int(),
    severity_breakdown: z.record(z.number().int()),
    kind_breakdown: z.record(z.number().int()),
  }),
});

// --- M28.5: Subleases & Sale-and-Leaseback Contracts (MFRS 16) -----------------------------------------

// Sublease Contracts
export const SubleaseCreateReq = z.object({
  headLeaseId: z.string(),
  subleaseCode: z.string().min(1).max(50),
  startOn: z.string(), // YYYY-MM-DD
  endOn: z.string(), // YYYY-MM-DD
  classification: z.enum(['FINANCE', 'OPERATING']).optional(),
  ccy: z.string().length(3),
  discountRate: z.number().min(0).max(1).optional(), // for classification calculation
  cashflows: z
    .array(
      z.object({
        dueOn: z.string(), // YYYY-MM-DD
        amount: z.number().positive(),
        variable: z.any().optional(),
      })
    )
    .optional(),
  componentLinks: z
    .array(
      z.object({
        leaseComponentId: z.string(),
        proportion: z.number().min(0).max(1),
        method: z.enum(['PROPORTIONATE', 'SPECIFIC']).default('PROPORTIONATE'),
        notes: z.string().optional(),
      })
    )
    .optional(),
});

export const SubleaseCreateResponse = z.object({
  subleaseId: z.string(),
  classification: z.enum(['FINANCE', 'OPERATING']),
  effectiveRate: z.number().nullable(),
  status: z.string(),
});

export const SubleaseQuery = z.object({
  headLeaseId: z.string().optional(),
  classification: z.enum(['FINANCE', 'OPERATING']).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'TERMINATED', 'EXPIRED']).optional(),
  startFrom: z.string().optional(), // YYYY-MM-DD
  startTo: z.string().optional(), // YYYY-MM-DD
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const SubleaseDetailResponse = z.object({
  id: z.string(),
  subleaseCode: z.string(),
  headLeaseId: z.string(),
  headLeaseCode: z.string().nullable(),
  headLessor: z.string().nullable(),
  headAssetClass: z.string().nullable(),
  startOn: z.string(),
  endOn: z.string(),
  classification: z.enum(['FINANCE', 'OPERATING']),
  ccy: z.string(),
  rate: z.number().nullable(),
  status: z.string(),
  createdAt: z.string(),
  createdBy: z.string(),
  cashflows: z
    .array(
      z.object({
        id: z.string(),
        dueOn: z.string(),
        amount: z.number(),
        variable: z.any().nullable(),
      })
    )
    .optional(),
  componentLinks: z
    .array(
      z.object({
        id: z.string(),
        leaseComponentId: z.string(),
        componentCode: z.string().nullable(),
        componentName: z.string().nullable(),
        componentClass: z.string().nullable(),
        proportion: z.number(),
        method: z.string(),
        notes: z.string().nullable(),
      })
    )
    .optional(),
});

export const SubleaseScheduleRebuildReq = z.object({
  subleaseId: z.string(),
});

export const SubleaseScheduleRebuildResponse = z.object({
  subleaseId: z.string(),
  classification: z.enum(['FINANCE', 'OPERATING']),
  scheduleRows: z.number(),
  totalReceipts: z.number(),
  totalInterestIncome: z.number(),
  totalLeaseIncome: z.number(),
});

export const SubleaseScheduleQuery = z.object({
  subleaseId: z.string().optional(),
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
  classification: z.enum(['FINANCE', 'OPERATING']).optional(),
});

export const SubleaseScheduleResponse = z.object({
  id: z.string(),
  subleaseId: z.string(),
  subleaseCode: z.string().nullable(),
  classification: z.string().nullable(),
  ccy: z.string().nullable(),
  rate: z.number().nullable(),
  year: z.number(),
  month: z.number(),
  openingNis: z.number().nullable(),
  interestIncome: z.number().nullable(),
  receipt: z.number(),
  closingNis: z.number().nullable(),
  leaseIncome: z.number().nullable(),
  notes: z.any().nullable(),
  createdAt: z.string(),
});

export const SubleasePostingReq = z.object({
  subleaseId: z.string(),
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
  dryRun: z.boolean().default(false),
});

export const SubleasePostingResponse = z.object({
  subleaseId: z.string(),
  year: z.number(),
  month: z.number(),
  journalId: z.string().nullable(),
  status: z.string(),
  message: z.string(),
});

export const HeadLeaseAdjustmentReq = z.object({
  subleaseId: z.string(),
});

export const HeadLeaseAdjustmentResponse = z.object({
  modId: z.string(),
  subleaseId: z.string(),
  headLeaseId: z.string(),
  totalRouReduction: z.number(),
  affectedComponents: z.number(),
  scheduleDeltas: z.number(),
  status: z.string(),
});

// Sale-and-Leaseback Contracts
export const SlbCreateReq = z.object({
  assetId: z.string().optional(),
  assetDesc: z.string().min(1).max(200),
  saleDate: z.string(), // YYYY-MM-DD
  salePrice: z.number().positive(),
  fmv: z.number().positive(),
  ccy: z.string().length(3),
  leasebackId: z.string().optional(),
  abilityToDirectUse: z.boolean().optional(),
  abilityToPreventOthers: z.boolean().optional(),
  presentRightToPayment: z.boolean().optional(),
  risksRewardsTransferred: z.boolean().optional(),
  leasebackTerms: z.any().optional(),
  adjustments: z
    .array(
      z.object({
        kind: z.enum(['ABOVE_FAIR_VALUE', 'BELOW_FAIR_VALUE', 'COSTS']),
        amount: z.number(),
        memo: z.string().optional(),
      })
    )
    .optional(),
});

export const SlbCreateResponse = z.object({
  slbId: z.string(),
  controlTransferred: z.boolean(),
  status: z.string(),
  assessment: z.any(),
});

export const SlbQuery = z.object({
  assetId: z.string().optional(),
  status: z.enum(['DRAFT', 'MEASURED', 'POSTED', 'COMPLETED']).optional(),
  saleDateFrom: z.string().optional(), // YYYY-MM-DD
  saleDateTo: z.string().optional(), // YYYY-MM-DD
  controlTransferred: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const SlbDetailResponse = z.object({
  id: z.string(),
  assetId: z.string().nullable(),
  assetDesc: z.string(),
  saleDate: z.string(),
  salePrice: z.number(),
  fmv: z.number(),
  ccy: z.string(),
  controlTransferred: z.boolean(),
  leasebackId: z.string().nullable(),
  leasebackCode: z.string().nullable(),
  leasebackLessor: z.string().nullable(),
  leasebackAssetClass: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
  createdBy: z.string(),
  allocation: z
    .object({
      proportionTransferred: z.number(),
      gainRecognized: z.number(),
      gainDeferred: z.number(),
      rouRetained: z.number(),
      notes: z.any().nullable(),
    })
    .nullable(),
  adjustments: z
    .array(
      z.object({
        id: z.string(),
        kind: z.string(),
        amount: z.number(),
        memo: z.string().nullable(),
        createdAt: z.string(),
      })
    )
    .optional(),
});

export const SlbMeasureReq = z.object({
  slbId: z.string(),
});

export const SlbMeasureResponse = z.object({
  slbId: z.string(),
  proportionTransferred: z.number(),
  gainRecognized: z.number(),
  gainDeferred: z.number(),
  rouRetained: z.number(),
  leasebackLiability: z.number(),
  status: z.string(),
  measurement: z.any(),
});

export const SlbPostingReq = z.object({
  slbId: z.string(),
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
  dryRun: z.boolean().default(false),
});

export const SlbPostingResponse = z.object({
  slbId: z.string(),
  journalId: z.string().nullable(),
  status: z.string(),
  message: z.string(),
});

// --- M28.7: Lease Derecognition, Early Termination & Surrenders Contracts ---

// Lease Exit Management
export const LeaseExitUpsert = z.object({
  lease_code: z.string().min(1).max(50),
  component_code: z.string().optional(), // nullable for lease-level exits
  event_date: z.string(), // YYYY-MM-DD
  kind: z.enum(['FULL', 'PARTIAL', 'BUYOUT', 'EXPIRY']),
  reason: z.string().min(1).max(500),
  settlement: z.number().default(0), // settlement payment amount
  penalty: z.number().default(0), // penalty/fee amount
  restoration: z.number().default(0), // restoration cost estimate
  share_pct: z.number().min(0).max(100).optional(), // percentage share for partial exits
  notes: z.string().optional(),
});

export const LeaseExitQuery = z.object({
  lease_code: z.string().optional(),
  component_code: z.string().optional(),
  kind: z.enum(['FULL', 'PARTIAL', 'BUYOUT', 'EXPIRY']).optional(),
  status: z.enum(['DRAFT', 'POSTED']).optional(),
  event_date_from: z.string().optional(), // YYYY-MM-DD
  event_date_to: z.string().optional(), // YYYY-MM-DD
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const LeaseExitPostReq = z.object({
  exit_id: z.string(),
  dry_run: z.boolean().default(true),
});

export const LeaseExitPostResponse = z.object({
  exit_id: z.string(),
  journal_id: z.string().nullable(),
  status: z.enum(['DRAFT', 'POSTED', 'ERROR']),
  message: z.string(),
  calculations: z.object({
    carrying_rou: z.number(),
    carrying_liab: z.number(),
    derecog_rou: z.number(),
    derecog_liab: z.number(),
    gain_loss: z.number(),
    settlement: z.number(),
    penalty: z.number(),
  }),
  journal_lines: z.array(
    z.object({
      account: z.string(),
      debit: z.number(),
      credit: z.number(),
      memo: z.string(),
    })
  ),
});

// Restoration Provisions (IAS 37)
export const LeaseRestorationUpsert = z.object({
  lease_code: z.string().min(1).max(50),
  component_code: z.string().optional(), // nullable for lease-level provisions
  as_of_date: z.string(), // YYYY-MM-DD
  estimate: z.number().positive(),
  discount_rate: z.number().min(0).max(1), // decimal rate
  notes: z.string().optional(),
});

export const LeaseRestorationQuery = z.object({
  lease_code: z.string().optional(),
  component_code: z.string().optional(),
  as_of_date_from: z.string().optional(), // YYYY-MM-DD
  as_of_date_to: z.string().optional(), // YYYY-MM-DD
  posted: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export const LeaseRestorationPostReq = z.object({
  restoration_id: z.string(),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  dry_run: z.boolean().default(true),
});

export const LeaseRestorationPostResponse = z.object({
  restoration_id: z.string(),
  journal_id: z.string().nullable(),
  status: z.enum(['DRAFT', 'POSTED', 'ERROR']),
  message: z.string(),
  movements: z.object({
    opening: z.number(),
    charge: z.number(),
    unwind: z.number(),
    utilization: z.number(),
    closing: z.number(),
  }),
  journal_lines: z.array(
    z.object({
      account: z.string(),
      debit: z.number(),
      credit: z.number(),
      memo: z.string(),
    })
  ),
});

// Exit Disclosures
export const LeaseExitDisclosureReq = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

export const LeaseExitDisclosureResponse = z.object({
  year: z.number(),
  month: z.number(),
  terminations: z.object({
    count: z.number(),
    amount: z.number(),
    by_kind: z.record(
      z.object({
        count: z.number(),
        amount: z.number(),
      })
    ),
  }),
  partial_derecognition: z.object({
    count: z.number(),
    amount: z.number(),
    avg_share_pct: z.number(),
  }),
  buyouts: z.object({
    count: z.number(),
    amount: z.number(),
    fa_transfers: z.number(),
  }),
  restoration_provisions: z.object({
    opening: z.number(),
    charge: z.number(),
    unwind: z.number(),
    utilization: z.number(),
    closing: z.number(),
  }),
  narrative: z.string(),
});

// Evidence Management
export const LeaseExitEvidenceReq = z.object({
  exit_id: z.string(),
  evidence_id: z.string(),
  evidence_type: z.enum([
    'TERMINATION_LETTER',
    'SETTLEMENT_INVOICE',
    'MAKE_GOOD_REPORT',
    'BUYOUT_AGREEMENT',
    'RESTORATION_QUOTE',
    'OTHER',
  ]),
  description: z.string().optional(),
});

// Type Exports for M28.7
export type LeaseExitUpsertType = z.infer<typeof LeaseExitUpsert>;
export type LeaseExitQueryType = z.infer<typeof LeaseExitQuery>;
export type LeaseExitPostReqType = z.infer<typeof LeaseExitPostReq>;
export type LeaseExitPostResponseType = z.infer<typeof LeaseExitPostResponse>;
export type LeaseRestorationUpsertType = z.infer<typeof LeaseRestorationUpsert>;
export type LeaseRestorationQueryType = z.infer<typeof LeaseRestorationQuery>;
export type LeaseRestorationPostReqType = z.infer<
  typeof LeaseRestorationPostReq
>;
export type LeaseRestorationPostResponseType = z.infer<
  typeof LeaseRestorationPostResponse
>;
export type LeaseExitDisclosureReqType = z.infer<typeof LeaseExitDisclosureReq>;
export type LeaseExitDisclosureResponseType = z.infer<
  typeof LeaseExitDisclosureResponse
>;
export type LeaseExitEvidenceReqType = z.infer<typeof LeaseExitEvidenceReq>;

// Type Exports for M28.6
export type CGUUpsertType = z.infer<typeof CGUUpsert>;
export type CGUQueryType = z.infer<typeof CGUQuery>;
export type CGULinkUpsertType = z.infer<typeof CGULinkUpsert>;
export type ImpairmentIndicatorUpsertType = z.infer<
  typeof ImpairmentIndicatorUpsert
>;
export type ImpairmentIndicatorQueryType = z.infer<
  typeof ImpairmentIndicatorQuery
>;
export type ImpairmentTestUpsertType = z.infer<typeof ImpairmentTestUpsert>;
export type ImpairmentTestQueryType = z.infer<typeof ImpairmentTestQuery>;
export type ImpairmentTestPostReqType = z.infer<typeof ImpairmentTestPostReq>;
export type OnerousAssessmentUpsertType = z.infer<
  typeof OnerousAssessmentUpsert
>;
export type OnerousAssessmentQueryType = z.infer<typeof OnerousAssessmentQuery>;
export type OnerousRollReqType = z.infer<typeof OnerousRollReq>;
export type OnerousRollPostReqType = z.infer<typeof OnerousRollPostReq>;
export type ImpairmentOnerousDisclosureReqType = z.infer<
  typeof ImpairmentOnerousDisclosureReq
>;
export type ImpairmentOnerousDisclosureResponseType = z.infer<
  typeof ImpairmentOnerousDisclosureResponse
>;

// Type Exports for M28.5
export type SubleaseCreateReqType = z.infer<typeof SubleaseCreateReq>;
export type SubleaseCreateResponseType = z.infer<typeof SubleaseCreateResponse>;
export type SubleaseQueryType = z.infer<typeof SubleaseQuery>;
export type SubleaseDetailResponseType = z.infer<typeof SubleaseDetailResponse>;
export type SubleaseScheduleRebuildReqType = z.infer<
  typeof SubleaseScheduleRebuildReq
>;
export type SubleaseScheduleRebuildResponseType = z.infer<
  typeof SubleaseScheduleRebuildResponse
>;
export type SubleaseScheduleQueryType = z.infer<typeof SubleaseScheduleQuery>;
export type SubleaseScheduleResponseType = z.infer<
  typeof SubleaseScheduleResponse
>;
export type SubleasePostingReqType = z.infer<typeof SubleasePostingReq>;
export type SubleasePostingResponseType = z.infer<
  typeof SubleasePostingResponse
>;
export type HeadLeaseAdjustmentReqType = z.infer<typeof HeadLeaseAdjustmentReq>;
export type HeadLeaseAdjustmentResponseType = z.infer<
  typeof HeadLeaseAdjustmentResponse
>;
export type SlbCreateReqType = z.infer<typeof SlbCreateReq>;
export type SlbCreateResponseType = z.infer<typeof SlbCreateResponse>;
export type SlbQueryType = z.infer<typeof SlbQuery>;
export type SlbDetailResponseType = z.infer<typeof SlbDetailResponse>;
export type SlbMeasureReqType = z.infer<typeof SlbMeasureReq>;
export type SlbMeasureResponseType = z.infer<typeof SlbMeasureResponse>;
export type SlbPostingReqType = z.infer<typeof SlbPostingReq>;
export type SlbPostingResponseType = z.infer<typeof SlbPostingResponse>;
