import { NextRequest, NextResponse } from "next/server";
import { ArPortalService } from "@/services/ar/portal";
import { PortalInitReq } from "@aibos/contracts";

const portalService = new ArPortalService();

// POST /api/portal/init - Initialize portal session
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const req = PortalInitReq.parse(body);

        const result = await portalService.initSession(
            req.company_id,
            req,
            'portal-system'
        );

        return NextResponse.json(result);
    } catch (error) {
        console.error('Portal init error:', error);
        return NextResponse.json(
            { error: 'Failed to initialize portal session' },
            { status: 500 }
        );
    }
}