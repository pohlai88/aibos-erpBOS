// @api:nonstandard (CORS headers)

import { NextRequest } from "next/server";
import { BankFileImport } from "@aibos/contracts";
import { importBankFile } from "@/services/payments/bank-ingest";
import { requireAuth } from "@/lib/auth";

// --- Bank File Import Routes (M23) -------------------------------------------
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const json = await req.json();
        const data = BankFileImport.parse(json);

        const result = await importBankFile(auth.company_id, data, auth.user_id);

        return Response.json({
            result,
            message: result.success ? 'Bank file imported successfully' : 'Bank file import completed with errors'
        }, {
            status: result.success ? 200 : 400,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error importing bank file:', error);
        return Response.json({ error: 'Failed to import bank file' }, { status: 500 });
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
