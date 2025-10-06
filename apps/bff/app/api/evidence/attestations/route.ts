import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthCtx } from '@/lib/auth';
import { requireCapability } from '@/lib/rbac';
import { withRouteErrors } from '@/lib/route-utils';
import { EvidenceVaultService } from '@/services/evidence/vault';
import { EvidenceAttestationAdd } from '@aibos/contracts';
import { ok } from '@/api/_kit';

// POST /api/evidence/attestations - Add digital attestation
export const POST = withRouteErrors(async (request: NextRequest) => {
  const auth = await requireAuth(request);
  await requireCapability(auth, 'cert:sign');

  const authCtx = auth as AuthCtx;
  const body = await request.json();
  const data = EvidenceAttestationAdd.parse(body);

  const service = new EvidenceVaultService();
  const attestation = await service.addEvidenceAttestation(
    authCtx.company_id,
    authCtx.user_id,
    data
  );

  return ok({ attestation });
});
