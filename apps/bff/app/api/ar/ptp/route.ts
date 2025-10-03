import { NextRequest } from "next/server";
import { PtpCreate } from "@aibos/contracts";
import { ArPtpDisputesService } from "@/services/ar/ptp-disputes";
import { requireAuth, requireCapability } from "@/lib/auth";

// --- AR Promise-to-Pay Routes (M24) ----------------------------------------------

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:ptp");
        if (cap instanceof Response) return cap;

        const url = new URL(req.url);
        const status = url.searchParams.get('status') as 'open' | 'kept' | 'broken' | 'cancelled' | undefined;
        const customerId = url.searchParams.get('customer_id') || undefined;

        const service = new ArPtpDisputesService();
        const records = await service.getPtpRecords(auth.company_id, status, customerId);

        return Response.json({ records }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching PTP records:', error);
        return Response.json({ error: 'Failed to fetch PTP records' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:ptp");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const data = PtpCreate.parse(json);

        const service = new ArPtpDisputesService();
        const ptpId = await service.createPtp(auth.company_id, data, auth.user_id);

        return Response.json({
            ptp_id: ptpId,
            message: 'Promise-to-Pay created successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error creating PTP:', error);
        return Response.json({ error: 'Failed to create PTP' }, { status: 500 });
    }
}
