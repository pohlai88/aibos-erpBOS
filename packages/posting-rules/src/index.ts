import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSON5 from 'json5';

export type RuleLine = {
  account: string;
  amountField: string;
  party?: { type: 'Customer' | 'Supplier'; field: string };
};
export type PostingRule = {
  doctype: string;
  idempotencyKey: string[];
  debits: RuleLine[];
  credits: RuleLine[];
};

const cache = new Map<string, PostingRule>();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadRule(name: string): PostingRule {
  if (cache.has(name)) return cache.get(name)!;
  const file = path.join(__dirname, `${name}.json5`);
  const raw = fs.readFileSync(file, 'utf8');
  const parsed = JSON5.parse(raw) as PostingRule;
  cache.set(name, parsed);
  return parsed;
}

export function get(obj: Record<string, unknown>, dot: string): unknown {
  return dot
    .split('.')
    .reduce<unknown>(
      (a, k) => (a == null ? undefined : (a as Record<string, unknown>)[k]),
      obj
    );
}
