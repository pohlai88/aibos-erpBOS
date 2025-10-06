import { NextRequest, NextResponse } from 'next/server';
import { withRouteErrors } from '@/lib/route-utils';
import { AuditSessionService } from '@/services/audit/session';
import { AuditorSessionVerify } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// POST /api/audit/session/verify - Verify magic code and get session token
export const POST = withRouteErrors(async (request: NextRequest) => {
  const body = await request.json();
  const validatedData = AuditorSessionVerify.parse(body);

  // Extract company ID from request headers or URL
  const companyId = request.headers.get('x-company-id') || 'default';
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const service = new AuditSessionService();
  const result = await service.verifySession(
    companyId,
    validatedData.magic_code,
    ip,
    userAgent
  );

  return ok(result);
});
