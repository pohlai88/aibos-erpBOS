// apps/bff/app/reports/pivot-params.ts
// Rollup parameter parsing for cost center hierarchy

export type Rollup = "none" | "root" | `level:${number}`;

export function parseRollup(search: URLSearchParams): Rollup {
    const v = search.get("rollup") ?? "none";
    if (v === "root" || v === "none") return v;
    if (v.startsWith("level:")) {
        const level = Number(v.split(":")[1]);
        if (Number.isFinite(level) && level >= 0) {
            return v as Rollup;
        }
    }
    return "none";
}

export function parseRollupLevel(search: URLSearchParams): number | null {
    const rollup = parseRollup(search);
    if (rollup.startsWith("level:")) {
        return Number(rollup.split(":")[1]);
    }
    return null;
}
