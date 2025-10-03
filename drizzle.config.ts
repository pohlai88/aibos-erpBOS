import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required for Drizzle Kit commands");

export default defineConfig({
    schema: "./packages/adapters/db/dist/schema.js",
    out: "./packages/adapters/db/migrations",
    dialect: "postgresql",
    dbCredentials: { url: url },
    strict: true,
    verbose: true,
});
