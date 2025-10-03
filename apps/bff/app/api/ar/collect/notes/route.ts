import { NextRequest } from "next/server";
import { CollectionsNoteCreate } from "@aibos/contracts";
import { ArCreditManagementService } from "@/services/ar/credit-management";
import { requireAuth, requireCapability } from "@/lib/auth";

// --- AR Collections Notes Route (M24.1) ------------------------------------------

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:collect:workbench");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const data = CollectionsNoteCreate.parse(json);

        const service = new ArCreditManagementService();
        await service.addCollectionsNote(auth.company_id, data, auth.user_id);

        return Response.json({
            message: 'Collections note added successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error adding collections note:', error);
        return Response.json({ error: 'Failed to add collections note' }, { status: 500 });
    }
}
