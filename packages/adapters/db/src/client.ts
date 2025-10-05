import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";
import { getDatabaseUrl } from "./db-url.js";

// Create a singleton database connection
const pool = new Pool({ connectionString: getDatabaseUrl() });
export const db = drizzle(pool, { schema });

// Export schema for direct access
export { schema };
export * from "./schema.js";
