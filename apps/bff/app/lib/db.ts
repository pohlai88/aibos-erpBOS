import { Pool } from "pg";
import { DrizzleLedgerRepo, DrizzleTxManager } from "../../../../packages/adapters/db/src/repo";

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://aibos:aibos@localhost:5432/aibos"
});
export const tx = new DrizzleTxManager(pool);
export const repo = new DrizzleLedgerRepo(pool);
