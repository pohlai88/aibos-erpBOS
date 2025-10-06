import { ulid } from 'ulid';
import { createHash } from 'crypto';

export function idFor(name: string, salt = ''): string {
  const h = createHash('sha256')
    .update(name + '::' + salt)
    .digest('hex')
    .slice(0, 10);
  // make id deterministic from test title, but still ULID-shaped for readability
  return ulid().slice(0, 16 - h.length) + h;
}

export function testIds(t: string) {
  const companyId = idFor(`co:${t}`);
  const bankCode = `BK-${idFor(`bk:${t}`).slice(-6)}`;
  const runId = idFor(`run:${t}`);
  const invA = idFor(`invA:${t}`);
  const invB = idFor(`invB:${t}`);
  return { companyId, bankCode, runId, invA, invB };
}
