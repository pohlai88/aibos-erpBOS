import { NextRequest, NextResponse } from 'next/server';
import { withRouteErrors } from '@/lib/route-utils';
import { AuditSessionService } from '@/services/audit/session';
import { AuditorLogin } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// POST /api/audit/session/login - Create auditor session (magic link)
export const POST = withRouteErrors(async (request: NextRequest) => {
  const body = await request.json();
  const validatedData = AuditorLogin.parse(body);

  // Extract company ID from request headers or URL
  const companyId = request.headers.get('x-company-id') || 'default';
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  const service = new AuditSessionService();
  const result = await service.createSession(
    companyId,
    validatedData.email,
    ip,
    userAgent
  );

  return ok(result);
});
