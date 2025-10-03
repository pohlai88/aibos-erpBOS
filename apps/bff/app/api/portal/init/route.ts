import { NextRequest, NextResponse } from "next/server";
import { ArPortalService } from "@/services/ar/portal";
import { PortalInitReq } from "@aibos/contracts";

const portalService = new ArPortalService();

// POST /api/portal/init - Initialize portal session
// DEPRECATED: Use /api/ar/portal/sessions (authenticated) instead
// This route lacks company context and should not be used in production
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const req = PortalInitReq.parse(body);

        // DEPRECATED: This route cannot determine company context
        // Portal sessions should be created via /api/ar/portal/sessions
        const result = await portalService.initSession(
            'deprecated-route', // Cannot determine company context
            req,
            'portal-system'
        );

        return NextResponse.json({
            ...result,
            warning: 'This route is deprecated. Use /api/ar/portal/sessions instead.'
        });
    } catch (error) {
        console.error('Portal init error:', error);
        return NextResponse.json(
            { error: 'Failed to initialize portal session' },
            { status: 500 }
        );
    }
}