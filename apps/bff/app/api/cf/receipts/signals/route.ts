import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, desc, and } from "drizzle-orm";
import { cfReceiptSignal } from "@aibos/db-adapter/schema";

// --- Cash Flow Receipt Signals Route (M24) ---------------------------------------

export async function GET(req: NextRequest) {
    try {
        const auth = await requireAuth(req);
        if (auth instanceof Response) return auth;

        const url = new URL(req.url);
        const weekStart = url.searchParams.get('week_start');
        const source = url.searchParams.get('source') as 'AUTO_MATCH' | 'PTP' | 'MANUAL' | undefined;

        const conditions = [eq(cfReceiptSignal.companyId, auth.company_id)];

        if (weekStart) {
            conditions.push(eq(cfReceiptSignal.weekStart, weekStart));
        }

        if (source) {
            conditions.push(eq(cfReceiptSignal.source, source));
        }

        const signals = await db
            .select()
            .from(cfReceiptSignal)
            .where(and(...conditions))
            .orderBy(desc(cfReceiptSignal.createdAt));

        const results = signals.map((signal: any) => ({
            id: signal.id,
            week_start: signal.weekStart,
            ccy: signal.ccy,
            amount: Number(signal.amount),
            source: signal.source,
            ref_id: signal.refId || undefined,
            created_at: signal.createdAt.toISOString(),
        }));

        return Response.json({ signals: results }, {
            status: 200,
            headers: { 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        console.error('Error fetching receipt signals:', error);
        return Response.json({ error: 'Failed to fetch receipt signals' }, { status: 500 });
    }
}
