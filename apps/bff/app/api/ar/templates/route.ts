import { NextRequest } from "next/server";
import { TemplateUpsert } from "@aibos/contracts";
import { ArDunningService } from "@/services/ar/dunning";
import { requireAuth, requireCapability } from "@/lib/auth";

// --- AR Templates Routes (M24) --------------------------------------------------

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const service = new ArDunningService();
        const templates = await service.getAllTemplates(auth.company_id);

        return Response.json({ templates }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching AR templates:', error);
        return Response.json({ error: 'Failed to fetch AR templates' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "ar:dunning:policy");
        if (cap instanceof Response) return cap;

        const json = await req.json();
        const data = TemplateUpsert.parse(json);

        const service = new ArDunningService();
        const templateId = await service.upsertTemplate(auth.company_id, data, auth.user_id);

        return Response.json({
            template_id: templateId,
            message: 'Template updated successfully'
        }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error upserting AR template:', error);
        return Response.json({ error: 'Failed to upsert AR template' }, { status: 500 });
    }
}
