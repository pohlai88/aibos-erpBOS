// M16.3: Asset Impairments API Route
// Handles asset impairment operations

import { NextRequest } from "next/server";
import { ok, badRequest, forbidden } from "../../../lib/http";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { ImpairmentCreate, ImpairmentListResponse } from "@aibos/contracts";
import { createImpairment, listImpairments } from "../../../services/assets/impairments";
import { withRouteErrors } from "@/api/_kit";

export const POST = withRouteErrors(async (req: NextRequest) => { const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const capCheck = requireCapability(auth, "capex:manage");
    if (capCheck instanceof Response) return capCheck;

    try {
        const input = ImpairmentCreate.parse(await req.json());

        const result = await createImpairment(auth.company_id, auth.user_id ?? "unknown", input);
        return ok(result);
    } catch (error) {
        if (error instanceof Error) {
            return badRequest(`Failed to create impairment: ${error.message}`);
        }
        return badRequest("Failed to create impairment");
    } });
export const GET = withRouteErrors(async (req: NextRequest) => { const auth = await requireAuth(req);
    if (auth instanceof Response) return auth;

    const capCheck = requireCapability(auth, "capex:manage");
    if (capCheck instanceof Response) return capCheck;

    try {
        const url = new URL(req.url);
        const planKind = url.searchParams.get("plan_kind") as "capex" | "intangible" | undefined;
        const planId = url.searchParams.get("plan_id") || undefined;

        const impairments = await listImpairments(auth.company_id, planKind, planId);

        const response: ImpairmentListResponse = {
            impairments: impairments.map(imp => ({
                id: imp.id,
                company_id: auth.company_id,
                plan_kind: imp.plan_kind as "capex" | "intangible",
                plan_id: imp.plan_id,
                date: imp.date,
                amount: imp.amount,
                memo: imp.memo ?? undefined,
                created_at: imp.created_at,
                created_by: imp.created_by,
            })),
            total: impairments.length,
        };

        return ok(response);
    } catch (error) {
        if (error instanceof Error) {
            return badRequest(`Failed to list impairments: ${error.message}`);
        }
        return badRequest("Failed to list impairments");
    } });
