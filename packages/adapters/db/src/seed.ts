import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL || "postgresql://aibos:aibos@localhost:5432/aibos" });
const db = drizzle(pool, { schema });

async function main() {
    // company
    await db.insert(schema.company).values({ id: "COMP-1", code: "COMP-1", name: "Demo Co", currency: "MYR" }).onConflictDoNothing();

    // minimal accounts
    await db.insert(schema.account).values([
        { id: "ACC-AR", companyId: "COMP-1", code: "Trade Receivables", name: "Trade Receivables", type: "Asset", normalBalance: "D" },
        { id: "ACC-SALES", companyId: "COMP-1", code: "Sales", name: "Sales", type: "Income", normalBalance: "C" },
        { id: "ACC-TAX", companyId: "COMP-1", code: "Output Tax", name: "Output Tax", type: "Liability", normalBalance: "C" }
    ]).onConflictDoNothing();

    console.log("Seeded company + accounts");
    await pool.end();
}
main().catch(e => { console.error(e); process.exit(1); });
