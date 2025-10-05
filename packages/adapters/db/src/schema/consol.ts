import { pgTable, text, boolean, numeric, timestamp, date, primaryKey, integer } from "drizzle-orm/pg-core";

// --- Consolidation Entities & Groups (M21) --------------------------------
export const coEntity = pgTable("co_entity", {
    companyId: text("company_id").notNull(),
    entityCode: text("entity_code").notNull(),
    name: text("name").notNull(),
    baseCcy: text("base_ccy").notNull(),
    active: boolean("active").notNull().default(true),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.entityCode] })
}));

export const coGroup = pgTable("co_group", {
    companyId: text("company_id").notNull(),
    groupCode: text("group_code").notNull(),
    name: text("name").notNull(),
    presentationCcy: text("presentation_ccy").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.groupCode] })
}));

export const coOwnership = pgTable("co_ownership", {
    companyId: text("company_id").notNull(),
    groupCode: text("group_code").notNull(),
    parentCode: text("parent_code").notNull(),
    childCode: text("child_code").notNull(),
    pct: numeric("pct").notNull(),
    effFrom: date("eff_from").notNull(),
    effTo: date("eff_to"),
}, (table) => ({
    pk: primaryKey({
        columns: [table.companyId, table.groupCode, table.parentCode, table.childCode, table.effFrom]
    })
}));

// --- Intercompany Tagging & Matching (M21) --------------------------------
export const icLink = pgTable("ic_link", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    entityCode: text("entity_code").notNull(),
    coEntityCp: text("co_entity_cp").notNull(),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    extRef: text("ext_ref"),
    amountBase: numeric("amount_base").notNull(),
    postedAt: timestamp("posted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const icMatch = pgTable("ic_match", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    groupCode: text("group_code").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    tolerance: numeric("tolerance").notNull().default("0.01"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const icMatchLine = pgTable("ic_match_line", {
    id: text("id").primaryKey(),
    matchId: text("match_id").notNull(),
    icLinkId: text("ic_link_id").notNull(),
});

// --- IC Elimination Run & Locks (M21) --------------------------------------
export const icElimRun = pgTable("ic_elim_run", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    groupCode: text("group_code").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    mode: text("mode").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const icElimLock = pgTable("ic_elim_lock", {
    companyId: text("company_id").notNull(),
    groupCode: text("group_code").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.groupCode, table.year, table.month] })
}));

export const icElimLine = pgTable("ic_elim_line", {
    id: text("id").primaryKey(),
    runId: text("run_id").notNull(),
    entityCode: text("entity_code").notNull(),
    cpCode: text("cp_code").notNull(),
    amountBase: numeric("amount_base").notNull(),
    note: text("note"),
});

// --- Consolidation Run + CTA/MI Summary (M21) ------------------------------
export const consolRun = pgTable("consol_run", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    groupCode: text("group_code").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    mode: text("mode").notNull(),
    presentCcy: text("present_ccy").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: text("created_by").notNull(),
});

export const consolLock = pgTable("consol_lock", {
    companyId: text("company_id").notNull(),
    groupCode: text("group_code").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.groupCode, table.year, table.month] })
}));

export const consolSummary = pgTable("consol_summary", {
    id: text("id").primaryKey(),
    runId: text("run_id").notNull(),
    component: text("component").notNull(),
    label: text("label").notNull(),
    amount: numeric("amount").notNull(),
});

// --- Account Map for Eliminations/CTA/MI (M21) ------------------------------
export const consolAccountMap = pgTable("consol_account_map", {
    companyId: text("company_id").notNull(),
    purpose: text("purpose").notNull(),
    account: text("account").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.purpose] })
}));

// --- Consolidation Policy Engine (M21.1) --------------------------------------
export const consolRatePolicy = pgTable("consol_rate_policy", {
    companyId: text("company_id").notNull(),
    class: text("class").notNull(),
    method: text("method").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.class] })
}));

export const consolRateOverride = pgTable("consol_rate_override", {
    companyId: text("company_id").notNull(),
    account: text("account").notNull(),
    method: text("method").notNull(),
    note: text("note"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.account] })
}));

export const consolCtaPolicy = pgTable("consol_cta_policy", {
    companyId: text("company_id").primaryKey(),
    ctaAccount: text("cta_account").notNull(),
    reAccount: text("re_account").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
});

export const consolNciMap = pgTable("consol_nci_map", {
    companyId: text("company_id").primaryKey(),
    nciEquityAccount: text("nci_equity_account").notNull(),
    nciNiAccount: text("nci_ni_account").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
});

export const consolLedgerOption = pgTable("consol_ledger_option", {
    companyId: text("company_id").primaryKey(),
    enabled: boolean("enabled").notNull().default(false),
    ledgerEntity: text("ledger_entity"),
    summaryAccount: text("summary_account"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
});

// --- Intercompany Auto-Matching & Workbench (M21.2) --------------------------
export const icElimMap = pgTable("ic_elim_map", {
    companyId: text("company_id").notNull(),
    ruleCode: text("rule_code").notNull(),
    srcAccountLike: text("src_account_like"),
    cpAccountLike: text("cp_account_like"),
    note: text("note"),
    active: boolean("active").notNull().default(true),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.ruleCode] })
}));

export const icMatchProposal = pgTable("ic_match_proposal", {
    id: text("id").primaryKey(),
    companyId: text("company_id").notNull(),
    groupCode: text("group_code").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    score: numeric("score").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const icMatchProposalLine = pgTable("ic_match_proposal_line", {
    id: text("id").primaryKey(),
    proposalId: text("proposal_id").notNull(),
    icLinkId: text("ic_link_id").notNull(),
    hint: text("hint"),
});

export const icWorkbenchDecision = pgTable("ic_workbench_decision", {
    id: text("id").primaryKey(),
    proposalId: text("proposal_id").notNull(),
    decidedBy: text("decided_by").notNull(),
    decision: text("decision").notNull(),
    reason: text("reason"),
    decidedAt: timestamp("decided_at", { withTimezone: true }).notNull().defaultNow(),
});

export const icElimRuleLock = pgTable("ic_elim_rule_lock", {
    companyId: text("company_id").notNull(),
    groupCode: text("group_code").notNull(),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    ruleCode: text("rule_code").notNull(),
}, (table) => ({
    pk: primaryKey({ columns: [table.companyId, table.groupCode, table.year, table.month, table.ruleCode] })
}));