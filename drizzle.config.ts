import type { Config } from "drizzle-kit";

export default {
    schema: "./packages/adapters/db/src/schema.ts",
    out: "./packages/adapters/db/migrations",
    dialect: "postgresql",
    dbCredentials: { connectionString: process.env.DATABASE_URL || "postgresql://aibos:aibos@localhost:5432/aibos" }
} satisfies Config;
