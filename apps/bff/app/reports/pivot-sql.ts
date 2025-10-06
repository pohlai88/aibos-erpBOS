import { sql } from 'drizzle-orm';
import type { Rollup } from './rollup';

export function costCenterPivotExpr(rollup: Rollup) {
  if (rollup === 'root')
    return sql`COALESCE(subpath(cc.path,0,1)::text, cc.code)`;
  if (rollup.startsWith('level:')) {
    const lvl = Number(rollup.split(':')[1] || '0');
    return sql`COALESCE(subpath(cc.path,0,${lvl + 1})::text, cc.code)`;
  }
  return sql`cc.code`;
}
