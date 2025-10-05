export function getDatabaseUrl(): string {
    const url = process.env.DATABASE_URL;
    if (!url) {
        // During build time, provide a fallback URL to prevent build failures
        if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
            return "postgresql://aibos:aibos@localhost:5432/aibos";
        }
        throw new Error(
            "DATABASE_URL is required. For local dev, put it in .env.local (web/bff) or .env (root)."
        );
    }
    return url;
}
