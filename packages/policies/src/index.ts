import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export type StatementLine =
    | { line: string; accounts: string[]; sign: 1 | -1 }
    | { line: string; formula: string };

export type Disclosure = {
    currency: string;
    pl: StatementLine[];
    bs: StatementLine[];
};

let cache: Disclosure | null = null;
export function getDisclosure(): Disclosure {
    if (cache) return cache;
    const raw = fs.readFileSync(path.join(__dirname, "disclosure.json"), "utf8");
    cache = JSON.parse(raw) as Disclosure;
    return cache!;
}

export function clearCache(): void {
    cache = null;
}

// Export FX policy
export * from "./fx.js";

// Export Tax policy
export * from "./tax.js";