import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

// Create a singleton database connection
const connectionString = process.env.DATABASE_URL || "postgresql://localhost:5432/aibos";
const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });

// Export schema for direct access
export { schema };
export * from "./schema.js";
