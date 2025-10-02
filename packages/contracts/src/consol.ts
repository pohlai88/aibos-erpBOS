import { z } from "zod";

// --- Entity & Group Management (M21) ----------------------------------------
export const EntityUpsert = z.object({
    entity_code: z.string().min(1),
    name: z.string().min(1),
    base_ccy: z.string().length(3),
    active: z.boolean().default(true),
});

export const GroupUpsert = z.object({
    group_code: z.string().min(1),
    name: z.string().min(1),
    presentation_ccy: z.string().length(3),
});

export const OwnershipUpsert = z.object({
    group_code: z.string().min(1),
    parent_code: z.string().min(1),
    child_code: z.string().min(1),
    pct: z.number().min(0).max(1),
    eff_from: z.string(),
    eff_to: z.string().optional(),
});

// --- Intercompany Tagging & Matching (M21) --------------------------------
export const IcLinkCreate = z.object({
    entity_code: z.string().min(1),
    co_entity_cp: z.string().min(1),
    source_type: z.enum(["AR", "AP", "JE"]),
    source_id: z.string().min(1),
    ext_ref: z.string().optional(),
    amount_base: z.number(),
});

export const IcMatchCreate = z.object({
    group_code: z.string().min(1),
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    link_ids: z.array(z.string()).min(2),
    tolerance: z.number().default(0.01),
});

// --- IC Elimination Run (M21) ----------------------------------------------
export const IcElimRunRequest = z.object({
    group_code: z.string().min(1),
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    dry_run: z.boolean().default(true),
    memo: z.string().optional(),
});

// --- Consolidation Run (M21) ------------------------------------------------
export const ConsolRunRequest = z.object({
    group_code: z.string().min(1),
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    dry_run: z.boolean().default(true),
    present_ccy: z.string().length(3).optional(),
    memo: z.string().optional(),
});

// --- Account Mapping (M21) ------------------------------------------------
export const ConsolAccountMapUpsert = z.object({
    purpose: z.enum(["IC_ELIM", "CTA", "MINORITY"]),
    account: z.string().min(1),
});

// --- Consolidation Policy Engine (M21.1) -----------------------------------
export const ConsolRatePolicyUpsert = z.object({
    class: z.enum(["ASSET", "LIAB", "EQUITY", "REVENUE", "EXPENSE"]),
    method: z.enum(["CLOSING", "AVERAGE", "HISTORICAL"]),
});

export const ConsolRateOverrideUpsert = z.object({
    account: z.string().min(1),
    method: z.enum(["CLOSING", "AVERAGE", "HISTORICAL"]),
    note: z.string().optional(),
});

export const ConsolCtaPolicyUpsert = z.object({
    cta_account: z.string().min(1),
    re_account: z.string().min(1),
});

export const ConsolNciMapUpsert = z.object({
    nci_equity_account: z.string().min(1),
    nci_ni_account: z.string().min(1),
});

export const ConsolLedgerOptionUpsert = z.object({
    enabled: z.boolean().default(false),
    ledger_entity: z.string().optional(),
    summary_account: z.string().optional(),
});

// --- Intercompany Auto-Matching & Workbench (M21.2) ---------------------------
export const IcElimRuleUpsert = z.object({
    rule_code: z.string().min(1),
    src_account_like: z.string().optional(),
    cp_account_like: z.string().optional(),
    note: z.string().optional(),
    active: z.boolean().default(true),
});

export const IcAutoMatchRequest = z.object({
    group_code: z.string().min(1),
    year: z.number().int(),
    month: z.number().int().min(1).max(12),
    tolerance: z.number().default(0.01),
    window_days: z.number().default(7),
});

export const IcProposalDecision = z.object({
    proposal_id: z.string().min(1),
    decision: z.enum(["accept", "reject", "split"]),
    reason: z.string().optional(),
});

// --- Response Types (M21) -------------------------------------------------
export const EntityResponse = z.object({
    entity_code: z.string(),
    name: z.string(),
    base_ccy: z.string(),
    active: z.boolean(),
});

export const GroupResponse = z.object({
    group_code: z.string(),
    name: z.string(),
    presentation_ccy: z.string(),
});

export const OwnershipResponse = z.object({
    group_code: z.string(),
    parent_code: z.string(),
    child_code: z.string(),
    pct: z.number(),
    eff_from: z.string(),
    eff_to: z.string().optional(),
});

export const IcLinkResponse = z.object({
    id: z.string(),
    entity_code: z.string(),
    co_entity_cp: z.string(),
    source_type: z.string(),
    source_id: z.string(),
    ext_ref: z.string().optional(),
    amount_base: z.number(),
    posted_at: z.string(),
});

export const IcMatchResponse = z.object({
    id: z.string(),
    group_code: z.string(),
    year: z.number(),
    month: z.number(),
    tolerance: z.number(),
    created_at: z.string(),
    created_by: z.string(),
    links: z.array(IcLinkResponse).optional(),
});

export const IcElimRunResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    group_code: z.string(),
    year: z.number(),
    month: z.number(),
    mode: z.string(),
    created_at: z.string(),
    created_by: z.string(),
    lines: z.array(z.object({
        id: z.string(),
        entity_code: z.string(),
        cp_code: z.string(),
        amount_base: z.number(),
        note: z.string().optional(),
    })).optional(),
    summary: z.object({
        total_eliminations: z.number(),
        journals_posted: z.number().optional(),
    }).optional(),
});

export const ConsolRunResponse = z.object({
    id: z.string(),
    company_id: z.string(),
    group_code: z.string(),
    year: z.number(),
    month: z.number(),
    mode: z.string(),
    present_ccy: z.string(),
    created_at: z.string(),
    created_by: z.string(),
    summary: z.array(z.object({
        component: z.string(),
        label: z.string(),
        amount: z.number(),
    })).optional(),
    consolidated_pl: z.array(z.object({
        account: z.string(),
        amount: z.number(),
    })).optional(),
    consolidated_bs: z.array(z.object({
        account: z.string(),
        amount: z.number(),
    })).optional(),
});

// --- Policy Response Types (M21.1) -------------------------------------------
export const ConsolRatePolicyResponse = z.object({
    class: z.string(),
    method: z.string(),
    updated_at: z.string(),
    updated_by: z.string(),
});

export const ConsolRateOverrideResponse = z.object({
    account: z.string(),
    method: z.string(),
    note: z.string().optional(),
    updated_at: z.string(),
    updated_by: z.string(),
});

export const ConsolCtaPolicyResponse = z.object({
    cta_account: z.string(),
    re_account: z.string(),
    updated_at: z.string(),
    updated_by: z.string(),
});

export const ConsolNciMapResponse = z.object({
    nci_equity_account: z.string(),
    nci_ni_account: z.string(),
    updated_at: z.string(),
    updated_by: z.string(),
});

export const ConsolLedgerOptionResponse = z.object({
    enabled: z.boolean(),
    ledger_entity: z.string().optional(),
    summary_account: z.string().optional(),
    updated_at: z.string(),
    updated_by: z.string(),
});

// --- IC Auto-Matching Response Types (M21.2) ----------------------------------
export const IcElimRuleResponse = z.object({
    rule_code: z.string(),
    src_account_like: z.string().optional(),
    cp_account_like: z.string().optional(),
    note: z.string().optional(),
    active: z.boolean(),
    updated_at: z.string(),
    updated_by: z.string(),
});

export const IcMatchProposalResponse = z.object({
    id: z.string(),
    group_code: z.string(),
    year: z.number(),
    month: z.number(),
    score: z.number(),
    created_at: z.string(),
    links: z.array(z.object({
        id: z.string(),
        entity_code: z.string(),
        co_entity_cp: z.string(),
        source_type: z.string(),
        source_id: z.string(),
        ext_ref: z.string().optional(),
        amount_base: z.number(),
        posted_at: z.string(),
        hint: z.string().optional(),
    })).optional(),
});

export const IcWorkbenchDecisionResponse = z.object({
    id: z.string(),
    proposal_id: z.string(),
    decided_by: z.string(),
    decision: z.string(),
    reason: z.string().optional(),
    decided_at: z.string(),
});

// --- Type Exports (M21) ----------------------------------------------------
export type EntityUpsertType = z.infer<typeof EntityUpsert>;
export type GroupUpsertType = z.infer<typeof GroupUpsert>;
export type OwnershipUpsertType = z.infer<typeof OwnershipUpsert>;
export type IcLinkCreateType = z.infer<typeof IcLinkCreate>;
export type IcMatchCreateType = z.infer<typeof IcMatchCreate>;
export type IcElimRunRequestType = z.infer<typeof IcElimRunRequest>;
export type ConsolRunRequestType = z.infer<typeof ConsolRunRequest>;
export type ConsolAccountMapUpsertType = z.infer<typeof ConsolAccountMapUpsert>;

// --- Policy Type Exports (M21.1) --------------------------------------------
export type ConsolRatePolicyUpsertType = z.infer<typeof ConsolRatePolicyUpsert>;
export type ConsolRateOverrideUpsertType = z.infer<typeof ConsolRateOverrideUpsert>;
export type ConsolCtaPolicyUpsertType = z.infer<typeof ConsolCtaPolicyUpsert>;
export type ConsolNciMapUpsertType = z.infer<typeof ConsolNciMapUpsert>;
export type ConsolLedgerOptionUpsertType = z.infer<typeof ConsolLedgerOptionUpsert>;

// --- IC Auto-Matching Type Exports (M21.2) -----------------------------------
export type IcElimRuleUpsertType = z.infer<typeof IcElimRuleUpsert>;
export type IcAutoMatchRequestType = z.infer<typeof IcAutoMatchRequest>;
export type IcProposalDecisionType = z.infer<typeof IcProposalDecision>;

export type EntityResponseType = z.infer<typeof EntityResponse>;
export type GroupResponseType = z.infer<typeof GroupResponse>;
export type OwnershipResponseType = z.infer<typeof OwnershipResponse>;
export type IcLinkResponseType = z.infer<typeof IcLinkResponse>;
export type IcMatchResponseType = z.infer<typeof IcMatchResponse>;
export type IcElimRunResponseType = z.infer<typeof IcElimRunResponse>;
export type ConsolRunResponseType = z.infer<typeof ConsolRunResponse>;

// --- Policy Response Type Exports (M21.1) -----------------------------------
export type ConsolRatePolicyResponseType = z.infer<typeof ConsolRatePolicyResponse>;
export type ConsolRateOverrideResponseType = z.infer<typeof ConsolRateOverrideResponse>;
export type ConsolCtaPolicyResponseType = z.infer<typeof ConsolCtaPolicyResponse>;
export type ConsolNciMapResponseType = z.infer<typeof ConsolNciMapResponse>;
export type ConsolLedgerOptionResponseType = z.infer<typeof ConsolLedgerOptionResponse>;

// --- IC Auto-Matching Response Type Exports (M21.2) --------------------------
export type IcElimRuleResponseType = z.infer<typeof IcElimRuleResponse>;
export type IcMatchProposalResponseType = z.infer<typeof IcMatchProposalResponse>;
export type IcWorkbenchDecisionResponseType = z.infer<typeof IcWorkbenchDecisionResponse>;
