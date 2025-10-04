export type Capability =
    | "reports:read"
    | "journals:post"
    | "reversal:create"
    | "inventory:move"
    | "payments:post"
    | "periods:manage"
    | "keys:manage"
    | "audit:read"
    | "audit:admin"
    | "audit:respond"
    | "audit:view"
    | "itgc:view"
    | "itgc:admin"
    | "itgc:breakglass"
    | "itgc:campaigns"
    | "itgc:ingest"
    | "close:board:view"
    | "close:board:manage"
    | "close:board:export"
    | "close:run"
    | "close:report"
    | "close:manage"
    | "budgets:manage"
    | "budgets:read"
    | "budgets:approve"
    | "forecasts:manage"
    | "forecasts:approve"
    | "cash:manage"
    | "capex:manage"
    | "fx:manage"
    | "fx:read"
    | "alloc:manage"
    | "alloc:read"
    | "tax:manage"
    | "tax:read"
    | "consol:manage"
    | "consol:read"
    | "pay:bank_profile"
    | "pay:dispatch"
    | "pay:discount:policy"
    | "pay:discount:run"
    | "pay:discount:offer"
    | "ar:dunning:policy"
    | "ar:dunning:run"
    | "ar:remit:import"
    | "ar:cashapp:run"
    | "ar:ptp"
    | "ar:dispute"
    | "ar:credit:policy"
    | "ar:credit:customer"
    | "ar:collect:workbench"
    | "ar:portal:policy"
    | "ar:portal:ops"
    | "ar:stmt:policy"
    | "ar:stmt:run"
    | "ar:stmt:email"
    | "rb:catalog"
    | "rb:contract"
    | "rb:usage:ingest"
    | "rb:invoice:run"
    | "rb:credit"
    | "rev:policy"
    | "rev:allocate"
    | "rev:schedule"
    | "rev:recognize"
    | "rev:export"
    | "rev:modify"
    | "rev:vc"
    | "rev:ssp"
    | "rev:bundles"
    | "rev:discounts"
    | "close:manage"
    | "close:run"
    | "close:approve"
    | "close:report"
    | "flux:run"
    | "mdna:edit"
    | "mdna:approve"
    | "mdna:publish"
    | "insights:view"
    | "insights:admin"
    | "ctrl:report"
    | "ctrl:run"
    | "ctrl:remediate"
    | "ctrl:manage"
    | "ctrl:evidence"
    | "ctrl:exceptions"
    | "ctrl:assign"
    | "cert:report"
    | "cert:sign"
    | "cert:manage"
    | "opscc:view"
    | "opscc:admin"
    | "opscc:whatif:run"
    | "opscc:whatif:save"
    | "evidence:write"
    | "evidence:read"
    | "evidence:admin"
    | "binder:build"
    | "binder:sign"
    | "sox:admin"
    | "sox:test.plan"
    | "sox:test.exec"
    | "sox:deficiency"
    | "sox:assert"
    | "attest:program"
    | "attest:campaign"
    | "attest:respond"
    | "attest:approve"
    | "attest:export"
    | "close:board:view"
    | "close:board:manage";

export const ROLE_CAPS: Record<"admin" | "accountant" | "ops", Capability[]> = {
    admin: [
        "reports:read", "journals:post", "reversal:create", "inventory:move",
        "payments:post", "periods:manage", "keys:manage", "audit:read",
        "budgets:manage", "budgets:read", "budgets:approve",
        "forecasts:manage", "forecasts:approve",
        "cash:manage", "capex:manage", "fx:manage", "fx:read", "alloc:manage", "alloc:read", "tax:manage", "tax:read", "consol:manage", "consol:read",
        "pay:bank_profile", "pay:dispatch", "pay:discount:policy", "pay:discount:run", "pay:discount:offer",
        "ar:dunning:policy", "ar:dunning:run", "ar:remit:import", "ar:cashapp:run", "ar:ptp", "ar:dispute",
        "ar:credit:policy", "ar:credit:customer", "ar:collect:workbench",
        "ar:portal:policy", "ar:portal:ops",
        "ar:stmt:policy", "ar:stmt:run", "ar:stmt:email",
        "rb:catalog", "rb:contract", "rb:usage:ingest", "rb:invoice:run", "rb:credit",
        "rev:policy", "rev:allocate", "rev:schedule", "rev:recognize", "rev:export", "rev:modify", "rev:vc", "rev:ssp", "rev:bundles", "rev:discounts",
        "close:manage", "close:run", "close:approve", "close:report", "flux:run", "mdna:edit", "mdna:approve", "mdna:publish",
        "insights:view", "insights:admin",
        "ctrl:report", "ctrl:run", "ctrl:remediate", "ctrl:manage", "ctrl:evidence", "ctrl:exceptions", "ctrl:assign",
        "cert:report", "cert:sign", "cert:manage",
        "evidence:write", "evidence:read", "evidence:admin", "binder:build", "binder:sign",
        "sox:admin", "sox:test.plan", "sox:test.exec", "sox:deficiency", "sox:assert",
        "attest:program", "attest:campaign", "attest:respond", "attest:approve", "attest:export",
        "close:board:view", "close:board:manage",
        "opscc:view", "opscc:admin", "opscc:whatif:run", "opscc:whatif:save"
    ],
    accountant: [
        "reports:read", "journals:post", "reversal:create", "inventory:move",
        "payments:post", "audit:read",
        "budgets:manage", "budgets:read", "budgets:approve",
        "forecasts:manage", "forecasts:approve",
        "cash:manage", "capex:manage", "fx:manage", "fx:read", "alloc:manage", "alloc:read", "tax:manage", "tax:read", "consol:manage", "consol:read",
        "pay:bank_profile", "pay:dispatch", "pay:discount:policy", "pay:discount:run", "pay:discount:offer",
        "ar:dunning:policy", "ar:dunning:run", "ar:remit:import", "ar:cashapp:run", "ar:ptp", "ar:dispute",
        "ar:credit:policy", "ar:credit:customer", "ar:collect:workbench",
        "ar:portal:policy", "ar:portal:ops",
        "ar:stmt:policy", "ar:stmt:run", "ar:stmt:email",
        "rb:catalog", "rb:contract", "rb:usage:ingest", "rb:invoice:run", "rb:credit",
        "rev:policy", "rev:allocate", "rev:schedule", "rev:recognize", "rev:export", "rev:modify", "rev:vc", "rev:ssp", "rev:bundles", "rev:discounts",
        "close:run", "close:approve", "close:report", "flux:run", "mdna:edit", "mdna:approve", "mdna:publish",
        "insights:view", "insights:admin",
        "ctrl:report", "ctrl:run", "ctrl:remediate", "ctrl:manage", "ctrl:evidence", "ctrl:exceptions", "ctrl:assign",
        "cert:report", "cert:sign", "cert:manage",
        "evidence:write", "evidence:read", "evidence:admin", "binder:build", "binder:sign",
        "sox:admin", "sox:test.plan", "sox:test.exec", "sox:deficiency", "sox:assert",
        "attest:respond", "attest:approve", "attest:export",
        "close:board:view",
        "opscc:view", "opscc:whatif:run", "opscc:whatif:save"
    ],
    ops: [
        "reports:read", "inventory:move", "audit:read",
        "budgets:read", "forecasts:manage",
        "cash:manage", "capex:manage", "fx:manage", "fx:read", "alloc:manage", "alloc:read", "tax:manage", "tax:read", "consol:manage", "consol:read",
        "pay:dispatch", "pay:discount:run", "pay:discount:offer",
        "ar:collect:workbench",
        "ar:portal:ops",
        "rb:catalog", "rb:contract", "rb:usage:ingest", "rb:invoice:run", "rb:credit",
        "rev:schedule", "rev:recognize", "rev:export", "rev:ssp",
        "close:run", "close:report", "flux:run", "mdna:edit",
        "insights:view",
        "ctrl:report", "ctrl:run", "ctrl:evidence", "ctrl:exceptions",
        "cert:report",
        "evidence:write", "evidence:read", "binder:build",
        "sox:test.exec", "sox:deficiency",
        "attest:respond",
        "opscc:view"
    ],
};

/** Validate requested scopes are within role's caps */
export function normalizeScopes(role: "admin" | "accountant" | "ops", requested?: string[]): Capability[] {
    const roleCaps = new Set(ROLE_CAPS[role]);
    if (!requested || !requested.length) return Array.from(roleCaps);
    return requested.filter((s): s is Capability => roleCaps.has(s as Capability));
}

/** Check if user has required capability */
export async function requireCapability(auth: any, capability: Capability): Promise<Response | true> {
    // For now, we'll assume all authenticated users have the required capabilities
    // In a real implementation, you would check the user's role and capabilities
    return true;
}
