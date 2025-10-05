import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthCtx } from "@/lib/auth";
import { requireCapability } from "@/lib/rbac";
import { withRouteErrors } from "@/lib/route-utils";
import { ControlsAdminService } from "@/services/controls/admin";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { ok } from "@/api/_kit";

export const POST = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ctrl:manage");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    const adminService = new ControlsAdminService();

    try {
        // Seed baseline controls for the company
        await adminService.seedBaselineControls(authCtx.company_id, authCtx.user_id);

        return ok({
                    success: true,
                    message: "Baseline controls seeded successfully",
                    company_id: authCtx.company_id
                });
    } catch (error) {
        console.error("Error seeding baseline controls:", error);
        return ok({
                        success: false,
                        error: error instanceof Error ? error.message : "Unknown error"
                    }, 500);
    }
});

export const GET = withRouteErrors(async (request: NextRequest) => {
    const auth = await requireAuth(request);
    await requireCapability(auth, "ctrl:report");

    // Type assertion: after requireCapability, auth is definitely AuthCtx
    const authCtx = auth as AuthCtx;

    try {
        // Check if baseline controls already exist
        const existingControls = await db.execute(sql`
            SELECT COUNT(*) as count
            FROM ctrl_control 
            WHERE company_id = ${authCtx.company_id}
        `);

        const count = (existingControls.rows[0]?.count as number) || 0;

        return ok({
                    company_id: authCtx.company_id,
                    controls_count: count,
                    baseline_seeded: count > 0,
                    message: count > 0 ? "Baseline controls already exist" : "No baseline controls found"
                });
    } catch (error) {
        console.error("Error checking baseline controls:", error);
        return ok({
                        success: false,
                        error: error instanceof Error ? error.message : "Unknown error"
                    }, 500);
    }
});
