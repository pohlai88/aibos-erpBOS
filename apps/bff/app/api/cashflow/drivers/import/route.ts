import { NextRequest } from "next/server";
import { importDriverData } from "@/services/cashflow/importers";
import { requireAuth } from "@/lib/auth";

// --- Driver Data Import Routes (M22) -----------------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const mapping = JSON.parse(formData.get('mapping') as string);
        const scenario = formData.get('scenario') as string;

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        const csvData = await file.text();
        const result = await importDriverData(
            auth.company_id,
            csvData,
            mapping,
            scenario || 'BASE',
            auth.user_id
        );

        return Response.json({
            result,
            message: result.success ? 'Driver data imported successfully' : 'Driver data import completed with errors'
        }, {
            status: result.success ? 200 : 400,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error importing driver data:', error);
        return Response.json({ error: 'Failed to import driver data' }, { status: 500 });
    }
}

export async function OPTIONS(_req: NextRequest) {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
    });
}
