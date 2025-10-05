import { Pool } from "pg";
// Worker can use WORKER_DATABASE_URL for isolation, fallback to DATABASE_URL
function getWorkerDbUrl() {
    const workerUrl = process.env.WORKER_DATABASE_URL;
    if (workerUrl) {
        return workerUrl;
    }
    // Fallback to DATABASE_URL with validation
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error("DATABASE_URL is required. For local dev, put it in .env.local (web/bff) or .env (root).");
    }
    return url;
}
export const pool = new Pool({ connectionString: getWorkerDbUrl() });
