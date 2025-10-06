import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { EnhancedEvidenceService } from '@/services/evidence/enhanced';
import {
  EvidenceUploadReq,
  EvidenceLinkReq,
  RedactionRuleUpsert,
  ManifestBuildReq,
  BinderBuildReq,
  AttestReq,
} from '@aibos/contracts';

// POST /api/evidence/upload - Upload evidence with content-addressed storage
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'evidence:write');

  const authCtx = auth as AuthCtx;
  const formData = await request.formData();

  const metaData = formData.get('meta');
  if (!metaData || typeof metaData !== 'string') {
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
  }

  const validatedData = EvidenceUploadReq.parse(JSON.parse(metaData));
  const file = formData.get('file') as File | null;

  const service = new EnhancedEvidenceService();

  // Convert ReadableStream to Readable
  let fileStream: Readable | undefined;
  if (file) {
    const readableStream = file.stream();
    fileStream = Readable.fromWeb(readableStream as any);
  }

  const result = await service.uploadEvidence(
    authCtx.company_id,
    authCtx.user_id,
    validatedData,
    fileStream
  );

  return NextResponse.json({ result });
});
