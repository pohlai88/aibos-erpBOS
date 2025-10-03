import { NextRequest, NextResponse } from "next/server";
import { ArSurchargeService } from "@/services/ar/surcharge";
import { ArPortalService } from "@/services/ar/portal";
import { requireAuth, requireCapability } from "@/lib/auth";

const surchargeService = new ArSurchargeService();
const portalService = new ArPortalService();

// GET /api/ar/portal/sessions - List portal sessions
export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:portal:ops");
        if (cap instanceof Response) return cap;

        // TODO: Implement listSessions method in ArPortalService
        const sessions: any[] = [];

        return NextResponse.json(sessions);
    } catch (error) {
        console.error('Portal sessions error:', error);
        return NextResponse.json(
            { error: 'Failed to list portal sessions' },
            { status: 500 }
        );
    }
}

// POST /api/ar/portal/sessions - Create portal session
export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:portal:ops");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const result = await portalService.initSession(
            auth.company_id,
            body,
            auth.user_id
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Portal session creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create portal session' },
            { status: 500 }
        );
    }
}