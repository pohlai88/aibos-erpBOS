import fs from "node:fs";
import path from "node:path";
import JSON5 from "json5";

export type RuleLine = {
    account: string;
    amountField: string;           // e.g. "totals.total"
    party?: { type: "Customer" | "Supplier", field: string };
};
export type PostingRule = {
    doctype: string;
    idempotencyKey: string[];      // e.g. ["doctype","id","version"]
    debits: RuleLine[];
    credits: RuleLine[];
};

// tiny memoized loader
const cache = new Map<string, PostingRule>();

export function loadRule(name: string): PostingRule {
    if (cache.has(name)) return cache.get(name)!;
    const file = path.join(path.dirname(new URL(import.meta.url).pathname), `${name}.json5`);
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON5.parse(raw) as PostingRule;
    cache.set(name, parsed);
    return parsed;
}

// dot-path getter for plain objects
export function get(obj: any, dot: string): any {
    return dot.split(".").reduce((a, k) => (a == null ? undefined : a[k]), obj);
}
