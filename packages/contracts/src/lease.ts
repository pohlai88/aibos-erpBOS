import { z } from "zod";

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
    status: z.enum(['DRAFT', 'ACTIVE', 'TERMINATED', 'EXPIRED']).default('DRAFT')
});

export const LeaseCashflowRow = z.object({
    due_on: z.string(), // YYYY-MM-DD
    amount: z.number().positive(),
    in_substance_fixed: z.boolean().default(true),
    variable_flag: z.boolean().default(false),
    index_base: z.number().optional(), // base index rate for variable payments
    index_link_id: z.string().optional()
});

export const LeaseQuery = z.object({
    asset_class: z.enum(['Land/Building', 'IT/Equipment', 'Vehicles', 'Others']).optional(),
    status: z.enum(['DRAFT', 'ACTIVE', 'TERMINATED', 'EXPIRED']).optional(),
    commence_from: z.string().optional(), // YYYY-MM-DD
    commence_to: z.string().optional(), // YYYY-MM-DD
    lessor: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(50),
    offset: z.number().int().min(0).default(0)
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
    notes: z.string().optional()
});

// Lease Run (Monthly Posting)
export const LeaseRunReq = z.object({
    year: z.number().int().min(2020).max(2100),
    month: z.number().int().min(1).max(12),
    dry_run: z.boolean().default(true)
});

export const LeaseRunResponse = z.object({
    run_id: z.string(),
    status: z.enum(['DRAFT', 'POSTED', 'ERROR']),
    stats: z.object({
        total_leases: z.number().int(),
        total_interest: z.number(),
        total_payments: z.number(),
        total_amortization: z.number(),
        fx_revaluations: z.number()
    }),
    journal_lines: z.array(z.object({
        lease_code: z.string(),
        dr_account: z.string(),
        cr_account: z.string(),
        amount: z.number(),
        memo: z.string()
    }))
});

// Lease Schedule Query
export const LeaseScheduleQuery = z.object({
    lease_code: z.string().optional(),
    year: z.number().int().min(2020).max(2100).optional(),
    month: z.number().int().min(1).max(12).optional(),
    present: z.string().length(3).optional() // presentation currency for view-only conversion
});

// Lease Disclosures
export const LeaseDisclosureReq = z.object({
    year: z.number().int().min(2020).max(2100),
    month: z.number().int().min(1).max(12)
});

export const LeaseDisclosureResponse = z.object({
    maturity_analysis: z.object({
        within_1_year: z.number(),
        between_1_2_years: z.number(),
        between_2_3_years: z.number(),
        between_3_5_years: z.number(),
        beyond_5_years: z.number(),
        total_undiscounted: z.number()
    }),
    rollforward: z.object({
        opening_liability: z.number(),
        interest_expense: z.number(),
        payments: z.number(),
        remeasurements: z.number(),
        fx_revaluations: z.number(),
        closing_liability: z.number()
    }),
    wadr: z.number(), // weighted average discount rate
    expenses: z.object({
        short_term: z.number(),
        low_value: z.number(),
        variable: z.number()
    }),
    total_cash_outflow: z.number()
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
        cashflows: z.string() // JSON string of cashflow array
    }),
    content_hash: z.string().optional() // for idempotency
});

// Lease Evidence (M26.4 Integration)
export const LeaseEvidenceReq = z.object({
    lease_code: z.string(),
    evidence_id: z.string(), // references M26.4 evidence vault
    attachment_type: z.enum(['AGREEMENT', 'CPI_NOTICE', 'IDC_SUPPORT', 'OTHER']),
    description: z.string().optional()
});

// M28.1: CPI Index Management
export const LeaseCpiUpsert = z.object({
    index_code: z.string().min(1).max(50),
    rows: z.array(z.object({
        date: z.string(), // YYYY-MM-DD
        value: z.number().positive()
    })),
    lag_months: z.number().int().min(0).max(12).default(0)
});

export const LeaseCpiQuery = z.object({
    index_code: z.string().optional(),
    date_from: z.string().optional(), // YYYY-MM-DD
    date_to: z.string().optional() // YYYY-MM-DD
});

// M28.1: Event Application (Apply Remeasurements)
export const LeaseEventApplyReq = z.object({
    lease_code: z.string(),
    event_id: z.string()
});

export const LeaseEventApplyResponse = z.object({
    event_id: z.string(),
    artifact_id: z.string(),
    delta_liability: z.number(),
    delta_rou: z.number(),
    new_discount_rate: z.number(),
    schedule_rebuilt: z.boolean(),
    proof_checksum: z.string()
});

// M28.1: Schedule Rebuild
export const LeaseScheduleRebuildReq = z.object({
    lease_code: z.string(),
    as_of: z.string() // YYYY-MM-DD
});

export const LeaseScheduleRebuildResponse = z.object({
    lease_id: z.string(),
    rebuild_date: z.string(),
    total_months: z.number().int(),
    new_present_value: z.number(),
    monthly_rate: z.number()
});

// M28.1: Enhanced Posting Service
export const LeasePostingRunReq = z.object({
    year: z.number().int().min(2020).max(2100),
    month: z.number().int().min(1).max(12),
    dry_run: z.boolean().default(true),
    force: z.boolean().default(false) // override period locks
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
        journal_entries_created: z.number().int()
    }),
    journal_lines: z.array(z.object({
        lease_code: z.string(),
        dr_account: z.string(),
        cr_account: z.string(),
        amount: z.number(),
        memo: z.string()
    })),
    errors: z.array(z.string()).optional()
});

// M28.1: Enhanced Disclosures
export const LeaseDisclosureSnapshotReq = z.object({
    year: z.number().int().min(2020).max(2100),
    month: z.number().int().min(1).max(12),
    include_rollforward: z.boolean().default(true),
    include_maturity: z.boolean().default(true),
    include_wadr: z.boolean().default(true)
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
        total_undiscounted: z.number()
    }),
    rollforward: z.object({
        opening_liability: z.number(),
        interest_expense: z.number(),
        payments: z.number(),
        remeasurements: z.number(),
        fx_revaluations: z.number(),
        closing_liability: z.number()
    }),
    wadr: z.number(),
    expenses: z.object({
        short_term: z.number(),
        low_value: z.number(),
        variable: z.number()
    }),
    total_cash_outflow: z.number(),
    generated_at: z.string()
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
    computed_by: z.string()
});

// M28.3: Componentized ROU & Impairment Contracts

// Component Design
export const LeaseComponentDesignReq = z.object({
    splits: z.array(z.object({
        code: z.string().min(1).max(50),
        name: z.string().min(1).max(200),
        class: z.enum(['Land', 'Building', 'Fit-out', 'IT/Equipment', 'Vehicles', 'Others']),
        uom: z.string().optional(),
        pct_of_rou: z.number().min(0).max(1),
        useful_life_months: z.number().int().min(1),
        method: z.enum(['SL', 'DDB', 'Units']).default('SL'),
        units_basis: z.number().optional()
    }))
});

export const LeaseComponentDesignResponse = z.object({
    lease_id: z.string(),
    components: z.array(z.object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        class: z.string(),
        pct_of_rou: z.number(),
        useful_life_months: z.number(),
        method: z.string(),
        component_rou: z.number(),
        incentive_alloc: z.number(),
        restoration_alloc: z.number()
    })),
    total_rou: z.number(),
    total_incentives: z.number(),
    total_restoration: z.number(),
    design_proof: z.object({
        total_pct: z.number(),
        lease_term_months: z.number(),
        validation_passed: z.boolean()
    })
});

// Component Schedule
export const LeaseComponentScheduleReq = z.object({
    rebuild: z.boolean().default(true)
});

export const LeaseComponentScheduleResponse = z.object({
    lease_id: z.string(),
    component_schedules: z.array(z.object({
        component_id: z.string(),
        component_code: z.string(),
        component_name: z.string(),
        component_class: z.string(),
        method: z.string(),
        total_rou: z.number(),
        total_amortization: z.number(),
        useful_life_months: z.number(),
        schedule_rows: z.array(z.object({
            year: z.number(),
            month: z.number(),
            open_carry: z.number(),
            rou_amort: z.number(),
            interest: z.number(),
            close_carry: z.number()
        }))
    })),
    reconciliation: z.object({
        total_component_rou: z.number(),
        total_lease_rou: z.number(),
        rou_difference: z.number(),
        total_component_amort: z.number(),
        total_lease_amort: z.number(),
        amort_difference: z.number(),
        reconciliation_passed: z.boolean()
    }),
    generated_at: z.string()
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
    notes: z.string().optional()
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
    allocation_lines: z.array(z.object({
        component_id: z.string(),
        component_code: z.string(),
        component_name: z.string(),
        carrying_amount: z.number(),
        allocated_loss: z.number(),
        allocated_reversal: z.number(),
        after_amount: z.number()
    })),
    measurement_proof: z.object({
        discount_rate: z.number(),
        calculation_method: z.string(),
        allocation_basis: z.string(),
        validation_passed: z.boolean()
    })
});

// Impairment Posting
export const LeaseImpairPostReq = z.object({
    impair_test_id: z.string(),
    year: z.number().int().min(2020).max(2100),
    month: z.number().int().min(1).max(12),
    dry_run: z.boolean().default(false)
});

export const LeaseImpairPostResponse = z.object({
    post_id: z.string(),
    test_id: z.string(),
    journal_entry_id: z.string(),
    year: z.number(),
    month: z.number(),
    total_loss: z.number(),
    total_reversal: z.number(),
    journal_lines: z.array(z.object({
        dr_account: z.string(),
        cr_account: z.string(),
        amount: z.number(),
        memo: z.string()
    })),
    posted_at: z.string(),
    posted_by: z.string()
});

// Impairment Test Query
export const LeaseImpairTestQuery = z.object({
    as_of_date: z.string().optional(),
    cgu_code: z.string().optional(),
    status: z.enum(['DRAFT', 'MEASURED', 'POSTED']).optional()
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
    allocation_lines: z.array(z.object({
        component_id: z.string(),
        component_code: z.string(),
        component_name: z.string(),
        carrying_amount: z.number(),
        allocated_loss: z.number(),
        allocated_reversal: z.number(),
        after_amount: z.number()
    })),
    created_at: z.string(),
    created_by: z.string()
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
        Others: z.number()
    }),
    component_amortization: z.object({
        Land: z.number(),
        Building: z.number(),
        'Fit-out': z.number(),
        'IT/Equipment': z.number(),
        Vehicles: z.number(),
        Others: z.number()
    }),
    restoration_provisions_movement: z.object({
        opening: z.number(),
        additions: z.number(),
        unwind_interest: z.number(),
        utilizations: z.number(),
        remeasurements: z.number(),
        closing: z.number()
    })
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
            Others: z.number()
        }),
        by_cgu: z.record(z.number()),
        total: z.number()
    }),
    impairment_reversals: z.object({
        by_class: z.object({
            Land: z.number(),
            Building: z.number(),
            'Fit-out': z.number(),
            'IT/Equipment': z.number(),
            Vehicles: z.number(),
            Others: z.number()
        }),
        by_cgu: z.record(z.number()),
        total: z.number()
    }),
    net_impairment: z.number()
});

// Lease Maturity Analysis
export const LeaseMaturityQuery = z.object({
    year: z.number().int().min(2020).max(2100),
    month: z.number().int().min(1).max(12),
    asset_class: z.enum(['Land/Building', 'IT/Equipment', 'Vehicles', 'Others']).optional()
});

export const LeaseMaturityResponse = z.object({
    maturity_bands: z.array(z.object({
        band: z.string(), // "≤1y", "1-2y", "2-3y", "3-5y", ">5y"
        undiscounted_amount: z.number(),
        discounted_amount: z.number(),
        lease_count: z.number().int()
    })),
    total_undiscounted: z.number(),
    total_discounted: z.number(),
    total_leases: z.number().int()
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
    updated_by: z.string()
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
    notes: z.string().nullable()
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
    created_by: z.string()
});

// Error Response
export const LeaseErrorResponse = z.object({
    error: z.string(),
    code: z.string().optional(),
    details: z.record(z.any()).optional()
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
export type LeaseDisclosureResponseType = z.infer<typeof LeaseDisclosureResponse>;
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
export type LeaseEventApplyResponseType = z.infer<typeof LeaseEventApplyResponse>;
export type LeaseScheduleRebuildReqType = z.infer<typeof LeaseScheduleRebuildReq>;
export type LeaseScheduleRebuildResponseType = z.infer<typeof LeaseScheduleRebuildResponse>;
export type LeasePostingRunReqType = z.infer<typeof LeasePostingRunReq>;
export type LeasePostingRunResponseType = z.infer<typeof LeasePostingRunResponse>;
export type LeaseDisclosureSnapshotReqType = z.infer<typeof LeaseDisclosureSnapshotReq>;
export type LeaseDisclosureSnapshotResponseType = z.infer<typeof LeaseDisclosureSnapshotResponse>;
export type LeaseRemeasureArtifactResponseType = z.infer<typeof LeaseRemeasureArtifactResponse>;

// M28.3: Componentized ROU & Impairment Type Exports
export type LeaseComponentDesignReqType = z.infer<typeof LeaseComponentDesignReq>;
export type LeaseComponentDesignResponseType = z.infer<typeof LeaseComponentDesignResponse>;
export type LeaseComponentScheduleReqType = z.infer<typeof LeaseComponentScheduleReq>;
export type LeaseComponentScheduleResponseType = z.infer<typeof LeaseComponentScheduleResponse>;
export type LeaseImpairAssessReqType = z.infer<typeof LeaseImpairAssessReq>;
export type LeaseImpairAssessResponseType = z.infer<typeof LeaseImpairAssessResponse>;
export type LeaseImpairPostReqType = z.infer<typeof LeaseImpairPostReq>;
export type LeaseImpairPostResponseType = z.infer<typeof LeaseImpairPostResponse>;
export type LeaseImpairTestQueryType = z.infer<typeof LeaseImpairTestQuery>;
export type LeaseImpairTestResponseType = z.infer<typeof LeaseImpairTestResponse>;
export type LeaseComponentDisclosureResponseType = z.infer<typeof LeaseComponentDisclosureResponse>;
export type LeaseImpairmentDisclosureResponseType = z.infer<typeof LeaseImpairmentDisclosureResponse>;
