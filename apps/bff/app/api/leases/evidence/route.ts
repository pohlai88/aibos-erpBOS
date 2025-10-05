import { NextRequest, NextResponse } from "next/server";
import { LeaseEvidenceService } from "@/services/lease/remeasure";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { LeaseEvidenceReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const evidenceService = new LeaseEvidenceService();

// POST /api/leases/evidence - Link evidence to lease
// GET /api/leases/evidence - Get lease evidence
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:manage");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = LeaseEvidenceReq.parse(body);

        const attachmentId = await evidenceService.linkEvidence(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok({ attachment_id: attachmentId });
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid evidence data");
        }
        console.error("Error linking evidence:", error);
        return serverError("Failed to link evidence");
    } });
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:read");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const leaseCode = url.searchParams.get('lease_code');

        if (!leaseCode) {
            return badRequest("Lease code parameter is required");
        }

        const result = await evidenceService.getLeaseEvidence(auth.company_id, {
            lease_code: leaseCode,
            evidence_id: 'default',
            attachment_type: 'OTHER' // Add required field
        });
        return ok(result);
    } catch (error) {
        console.error("Error getting lease evidence:", error);
        return serverError("Failed to get lease evidence");
    } });
