export type Capability =
    | "reports:read"
    | "journals:post"
    | "reversal:create"
    | "inventory:move"
    | "payments:post"
    | "periods:manage"
    | "keys:manage"
    | "audit:read"
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
    | "pay:discount:offer";

export const ROLE_CAPS: Record<"admin" | "accountant" | "ops", Capability[]> = {
    admin: [
        "reports:read", "journals:post", "reversal:create", "inventory:move",
        "payments:post", "periods:manage", "keys:manage", "audit:read",
        "budgets:manage", "budgets:read", "budgets:approve",
        "forecasts:manage", "forecasts:approve",
        "cash:manage", "capex:manage", "fx:manage", "fx:read", "alloc:manage", "alloc:read", "tax:manage", "tax:read", "consol:manage", "consol:read",
        "pay:bank_profile", "pay:dispatch", "pay:discount:policy", "pay:discount:run", "pay:discount:offer"
    ],
    accountant: [
        "reports:read", "journals:post", "reversal:create", "inventory:move",
        "payments:post", "audit:read",
        "budgets:manage", "budgets:read", "budgets:approve",
        "forecasts:manage", "forecasts:approve",
        "cash:manage", "capex:manage", "fx:manage", "fx:read", "alloc:manage", "alloc:read", "tax:manage", "tax:read", "consol:manage", "consol:read",
        "pay:bank_profile", "pay:dispatch", "pay:discount:policy", "pay:discount:run", "pay:discount:offer"
    ],
    ops: [
        "reports:read", "inventory:move", "audit:read",
        "budgets:read", "forecasts:manage",
        "cash:manage", "capex:manage", "fx:manage", "fx:read", "alloc:manage", "alloc:read", "tax:manage", "tax:read", "consol:manage", "consol:read",
        "pay:dispatch", "pay:discount:run", "pay:discount:offer"
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
