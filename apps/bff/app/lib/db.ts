import { Pool } from "pg";
import { DrizzleLedgerRepo, DrizzleTxManager } from "../../../../packages/adapters/db/src/repo";
import { getDatabaseUrl } from "../../../../packages/adapters/db/src/db-url";

export const pool = new Pool({
    connectionString: getDatabaseUrl()
});
export const tx = new DrizzleTxManager(pool);
export const repo = new DrizzleLedgerRepo(pool);
