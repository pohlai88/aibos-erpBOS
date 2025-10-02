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
    | "budgets:approve";

export const ROLE_CAPS: Record<"admin" | "accountant" | "ops", Capability[]> = {
    admin: [
        "reports:read", "journals:post", "reversal:create", "inventory:move",
        "payments:post", "periods:manage", "keys:manage", "audit:read", 
        "budgets:manage", "budgets:read", "budgets:approve"
    ],
    accountant: [
        "reports:read", "journals:post", "reversal:create", "inventory:move",
        "payments:post", "audit:read", 
        "budgets:manage", "budgets:read", "budgets:approve"
    ],
    ops: [
        "reports:read", "inventory:move", "audit:read",
        "budgets:read"
    ],
};

/** Validate requested scopes are within role's caps */
export function normalizeScopes(role: "admin" | "accountant" | "ops", requested?: string[]): Capability[] {
    const roleCaps = new Set(ROLE_CAPS[role]);
    if (!requested || !requested.length) return Array.from(roleCaps);
    return requested.filter((s): s is Capability => roleCaps.has(s as Capability));
}
