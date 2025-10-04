import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { OpsPlaybookEngine } from "@/services";
import {
    PlaybookUpsert,
    DryRunRequest
} from "@aibos/contracts";

// GET /api/ops/playbooks - Get playbooks
export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ops:playbooks:admin");

    const authCtx = auth as AuthCtx;

    // TODO: Implement getPlaybooks method
    const playbooks: any[] = []; // Placeholder

    return NextResponse.json({ playbooks });
});

// POST /api/ops/playbooks - Create or update playbook
export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ops:playbooks:admin");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = PlaybookUpsert.parse(body);

    const service = new OpsPlaybookEngine();
    const playbook = await service.upsertPlaybook(authCtx.company_id, authCtx.user_id, validatedData);

    return NextResponse.json({ playbook });
});

// POST /api/ops/playbooks/dry-run - Execute playbook in dry-run mode
export const PUT = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ops:actions:execute");

    const authCtx = auth as AuthCtx;
    const body = await request.json();
    const validatedData = DryRunRequest.parse(body);

    const service = new OpsPlaybookEngine();
    const result = await service.executePlaybook(authCtx.company_id, authCtx.user_id, validatedData);

    return NextResponse.json({ result });
});
