import { NextRequest } from "next/server";
import { importBankData } from "@/services/cashflow/importers";
import { requireAuth } from "@/lib/auth";

// --- Bank Data Import Routes (M22) -------------------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const mapping = JSON.parse(formData.get('mapping') as string);
        const acctCode = formData.get('acct_code') as string;

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!acctCode) {
            return Response.json({ error: 'Account code is required' }, { status: 400 });
        }

        const csvData = await file.text();
        const result = await importBankData(
            auth.company_id,
            csvData,
            mapping,
            acctCode,
            auth.user_id
        );

        return Response.json({
            result,
            message: result.success ? 'Bank data imported successfully' : 'Bank data import completed with errors'
        }, {
            status: result.success ? 200 : 400,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error importing bank data:', error);
        return Response.json({ error: 'Failed to import bank data' }, { status: 500 });
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
