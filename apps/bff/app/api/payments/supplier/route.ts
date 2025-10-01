import { pool } from "../../../lib/db";
import { postByRule } from "../../../lib/posting";
import { ok, created, unprocessable } from "../../../lib/http";
import { ensurePostingAllowed } from "../../../lib/policy";
import { requireAuth, enforceCompanyMatch } from "../../../lib/auth";

type Body = {
    id?: string;
    company_id: string;
    party_id: string;   // supplier id
    doc_date: string;
    currency: string;
    amount: number;
    allocations?: Array<{ doctype: "PurchaseInvoice"; id: string; amount: number }>;
};

export async function POST(req: Request) {
    try {
        const auth = await requireAuth(req);
        const b = await req.json() as Body;
        const id = b.id ?? crypto.randomUUID();

        enforceCompanyMatch(auth, b.company_id);
        await ensurePostingAllowed(auth.company_id, b.doc_date);

        const client = await pool.connect();

        try {
            await client.query("BEGIN");
            const exist = await client.query("select journal_id from payment where id=$1 and company_id=$2 and kind='AP'", [id, auth.company_id]);
            if (exist.rows.length) {
                await client.query("COMMIT");
                return ok({ payment_id: id, journal_id: exist.rows[0].journal_id }, {
                    "X-Idempotent-Replay": "true",
                    "Location": `/api/payments/supplier?id=${id}&company_id=${auth.company_id}`
                });
            }

            if (Number(b.amount) <= 0) {
                await client.query("ROLLBACK");
                return unprocessable("Amount must be > 0");
            }

            await client.query(
                `insert into payment(id, company_id, kind, party_type, party_id, doc_date, currency, amount)
         values ($1,$2,'AP','Supplier',$3,$4,$5,$6)`,
                [id, auth.company_id, b.party_id, b.doc_date, b.currency, b.amount.toFixed(2)]
            );

            if (b.allocations?.length) {
                for (const a of b.allocations) {
                    await client.query(
                        `insert into payment_allocation(id, payment_id, apply_doctype, apply_id, amount)
             values ($1,$2,$3,$4,$5)`,
                        [crypto.randomUUID(), id, a.doctype, a.id, a.amount.toFixed(2)]
                    );
                }
            }

            // GL posting (DR AP / CR Bank)
            const journalId = await postByRule("SupplierPayment", id, b.currency, auth.company_id, {
                amount: { amount: b.amount.toFixed(2), currency: b.currency },
                party_id: b.party_id
            });

            await client.query(`update payment set journal_id=$1 where id=$2`, [journalId, id]);
            await client.query("COMMIT");
            return created({ payment_id: id, journal_id: journalId }, `/api/payments/supplier?id=${id}&company_id=${auth.company_id}`);
        } catch (e) {
            await client.query("ROLLBACK");
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Supplier payment error:", error);
        // Re-throw Response objects from policy checks
        if (error instanceof Response) {
            throw error;
        }
        return Response.json({ error: "Invalid request data" }, {
            status: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    }
}

export async function GET(req: Request) {
    const auth = await requireAuth(req);
    const url = new URL(req.url);
    const id = url.searchParams.get("id")!;
    const { rows } = await pool.query("select * from payment where id=$1 and company_id=$2", [id, auth.company_id]);
    if (!rows.length) return new Response("Not found", { status: 404 });
    const alloc = await pool.query("select apply_doctype, apply_id, amount from payment_allocation where payment_id=$1", [id]);
    return ok({ payment: rows[0], allocations: alloc.rows });
}

export async function OPTIONS(req: Request) {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
