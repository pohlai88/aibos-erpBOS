export type Rollup = "none" | "root" | `level:${number}`;

export function parseRollup(search: URLSearchParams): Rollup {
    const v = search.get("rollup") ?? "none";
    if (v === "none" || v === "root") return v;
    if (v.startsWith("level:")) return v as Rollup;
    return "none";
}
