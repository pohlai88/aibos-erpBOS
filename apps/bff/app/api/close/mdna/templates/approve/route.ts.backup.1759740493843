import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { MdnaService } from '@/services/mdna/templates';
import { ok } from '@/api/_kit';

export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'mdna:approve');

  // Type assertion: after requireCapability, auth is definitely AuthCtx
  const authCtx = auth as AuthCtx;

  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('template_id');
  if (!templateId) {
    return ok({ error: 'template_id is required' }, 400);
  }

  const service = new MdnaService();
  await service.approveTemplate(
    authCtx.company_id,
    templateId,
    authCtx.user_id
  );

  return ok({ success: true });
});
