import { NextRequest } from "next/server";
import { CollectionsNoteCreate } from "@aibos/contracts";
import { ArCreditManagementService } from "@/services/ar/credit-management";
import { requireAuth, requireCapability } from "@/lib/auth";
import { withRouteErrors, ok } from "@/api/_kit";

// --- AR Collections Notes Route (M24.1) ------------------------------------------
export const POST = withRouteErrors(async (req: NextRequest) => { try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:collect:workbench");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const data = CollectionsNoteCreate.parse(json);

        const service = new ArCreditManagementService();
        await service.addCollectionsNote(auth.company_id, data, auth.user_id);

        return ok({
                    message: 'Collections note added successfully'
                }, 200);
    } catch (error) {
        console.error('Error adding collections note:', error);
        return ok({ error: 'Failed to add collections note' }, 500);
    } });
