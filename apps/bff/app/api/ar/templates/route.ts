import { NextRequest } from "next/server";
import { TemplateUpsert } from "@aibos/contracts";
import { ArDunningService } from "@/services/ar/dunning";
import { requireAuth, requireCapability } from "@/lib/auth";
import { withRouteErrors, ok } from "@/api/_kit";

// --- AR Templates Routes (M24) --------------------------------------------------
export const GET = withRouteErrors(async (req: NextRequest) => { try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const service = new ArDunningService();
        const templates = await service.getAllTemplates(auth.company_id);

        return ok({ templates }, 200);
    } catch (error) {
        console.error('Error fetching AR templates:', error);
        return ok({ error: 'Failed to fetch AR templates' }, 500);
    } });
export const POST = withRouteErrors(async (req: NextRequest) => { try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:dunning:policy");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const data = TemplateUpsert.parse(json);

        const service = new ArDunningService();
        const templateId = await service.upsertTemplate(auth.company_id, data, auth.user_id);

        return ok({
                    template_id: templateId,
                    message: 'Template updated successfully'
                }, 200);
    } catch (error) {
        console.error('Error upserting AR template:', error);
        return ok({ error: 'Failed to upsert AR template' }, 500);
    } });
