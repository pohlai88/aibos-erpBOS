import { Pool } from "pg";

function getDbUrl() {
    // Prefer explicit worker var, else global, else sane default.
    const u = process.env.WORKER_DATABASE_URL
        || process.env.DATABASE_URL
        || "postgres://aibos:aibos@localhost:5432/aibos";
    // Guard common misconfigurations:
    if (typeof u !== "string" || !u.includes("://")) {
        throw new Error("Invalid DATABASE_URL / WORKER_DATABASE_URL");
    }
    return u;
}

export const pool = new Pool({ connectionString: getDbUrl() });
