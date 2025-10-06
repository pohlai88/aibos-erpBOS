import { pool } from '../../../lib/db';
import { ok, unprocessable } from '../../../lib/http';
import { requireAuth, requireCapability } from '../../../lib/auth';
import { withRouteErrors, isResponse } from '../../../lib/route-utils';

/**
 * GET /api/audit/events?topic=JournalPosted&from=ISO&to=ISO&limit=50&cursor=base64(created_at,id)
 */
export const GET = withRouteErrors(async (req: Request) => {
  const auth = await requireAuth(req);
  if (isResponse(auth)) return auth; // company scope not needed; outbox is global to DB, but keep auth required.

  const capCheck = requireCapability(auth, 'audit:read');
  if (isResponse(capCheck)) return capCheck;

  const u = new URL(req.url);
  const topic = u.searchParams.get('topic'); // optional
  const from = u.searchParams.get('from');
  const to = u.searchParams.get('to');
  const limit = Math.min(Number(u.searchParams.get('limit') ?? 50), 100);
  const cursor = u.searchParams.get('cursor');

  let afterTs: string | null = null,
    afterId: string | null = null;
  if (cursor) {
    try {
      const [ts, id] = Buffer.from(cursor, 'base64url')
        .toString('utf8')
        .split('|');
      afterTs = ts || null;
      afterId = id || null;
    } catch {
      return unprocessable('bad cursor');
    }
  }

  const where: string[] = ['1=1'];
  const params: any[] = [];
  let p = 0;

  if (topic) {
    where.push(`topic = $${++p}`);
    params.push(topic);
  }
  if (from) {
    where.push(`created_at >= $${++p}`);
    params.push(from);
  }
  if (to) {
    where.push(`created_at <= $${++p}`);
    params.push(to);
  }
  if (afterTs && afterId) {
    where.push(
      `(created_at < $${++p} or (created_at = $${p} and id < $${++p}))`
    );
    params.push(afterTs, afterId);
  }

  const sql = `
    select id, topic, payload, created_at
      from outbox
     where ${where.join(' and ')}
     order by created_at desc, id desc
     limit ${limit + 1}
  `;
  const { rows } = await pool.query(sql, params);

  const hasMore = rows.length > limit;
  const slice = rows.slice(0, limit);
  const next =
    hasMore && slice.length
      ? Buffer.from(
          `${slice[slice.length - 1].created_at}|${slice[slice.length - 1].id}`
        ).toString('base64url')
      : null;

  return ok({ items: slice, next });
});
