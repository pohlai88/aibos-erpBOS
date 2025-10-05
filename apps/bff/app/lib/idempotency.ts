import crypto from "crypto";

export function getIdemKey(h: Headers): string | null {
    const k = h.get("Idempotency-Key");
    return k && k.trim().length ? k.trim() : null;
}

export function hashPayload(body: unknown): string {
    return crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex");
}

export async function checkIdempotency(key: string, companyId: string): Promise<any | null> {
    // TODO: Implement actual idempotency check using your existing lock tables
    // For now, return null (no existing result)
    return null;
}

export async function recordIdempotency(key: string, companyId: string, purpose: string, result: any): Promise<void> {
    // TODO: Implement actual idempotency recording using your existing lock tables
    // For now, just log it
    console.log(`Idempotency recorded: ${key} for ${companyId} - ${purpose}`);
}