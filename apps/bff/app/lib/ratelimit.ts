type Bucket = { tokens: number; updated: number };
const buckets = new Map<string, Bucket>();

// defaults: 60 req/min, burst 30
const DEFAULT_RATE = { refillPerSec: 60 / 60, capacity: 30 };

export function rateLimitCheck(
  keyId: string,
  now = Date.now(),
  rate = DEFAULT_RATE
): boolean {
  const b = buckets.get(keyId) ?? { tokens: rate.capacity, updated: now };
  const elapsed = (now - b.updated) / 1000;
  const refill = elapsed * rate.refillPerSec;
  b.tokens = Math.min(rate.capacity, b.tokens + refill);
  b.updated = now;
  if (b.tokens < 1) {
    buckets.set(keyId, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(keyId, b);
  return true;
}

/** Seconds until next token */
export function retryAfterSecs(
  keyId: string,
  now = Date.now(),
  rate = DEFAULT_RATE
): number {
  const b = buckets.get(keyId);
  if (!b) return 0;
  if (b.tokens >= 1) return 0;
  const deficit = 1 - b.tokens;
  return Math.ceil(deficit / rate.refillPerSec);
}
