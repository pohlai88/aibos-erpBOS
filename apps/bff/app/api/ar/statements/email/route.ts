import { NextRequest, NextResponse } from 'next/server';
import { ArStatementService } from '@/services/ar/statements';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError } from '@/api/_lib/http';
import { StatementEmailReq } from '@aibos/contracts';
import { withRouteErrors } from '@/api/_kit';

const statementService = new ArStatementService();

// POST /api/ar/statements/email - Send statement emails
export const POST = withRouteErrors(async (request: NextRequest) => {
  try {
    const auth = await requireAuth(request);
    if (auth instanceof Response) return auth;

    const cap = requireCapability(auth, 'ar:stmt:email');
    if (cap instanceof Response) return cap;

    const body = await request.json();
    const validatedBody = StatementEmailReq.parse(body);

    const result = await statementService.sendStatementEmails(
      auth.company_id,
      validatedBody,
      auth.user_id
    );

    return ok(result);
  } catch (error) {
    console.error('Statement email error:', error);
    if (error instanceof Error && error.name === 'ZodError') {
      return badRequest('Invalid request body', error);
    }
    return serverError('Failed to send statement emails');
  }
});
