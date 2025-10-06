import { z } from 'zod';

const Env = z.object({
  // Database
  DATABASE_URL: z.string().min(1),

  // Portal Configuration
  PORTAL_BASE_URL: z.string().url(),
  RECEIPTS_FROM_EMAIL: z.string().email(),

  // Gateway Configuration (optional - only required when using specific gateway)
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  ADYEN_API_KEY: z.string().min(1).optional(),
  ADYEN_HMAC_KEY: z.string().min(1).optional(),
  PAYPAL_CLIENT_ID: z.string().min(1).optional(),
  PAYPAL_SECRET: z.string().min(1).optional(),

  // Gateway Selection
  PAY_GATEWAY: z.enum(['STRIPE', 'ADYEN', 'PAYPAL', 'MOCK']).default('MOCK'),

  // Optional Redis for event processing
  REDIS_URL: z.string().url().optional(),
});

export const env = (() => {
  const parsed = Env.safeParse(process.env);
  if (!parsed.success) {
    // Show crisp list of missing vars at boot
    const missingVars = parsed.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    throw new Error(`Missing/invalid ENV variables: ${missingVars}`);
  }
  return parsed.data;
})();

// Type-safe environment access
export type EnvConfig = z.infer<typeof Env>;
