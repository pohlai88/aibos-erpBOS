// Gateway Factory for M24.2 Customer Portal
// Creates gateway instances based on environment configuration

import { env } from '@/lib/env';
import type { Gateway } from './types';
import { MockGateway } from './mock';
import { StripeGateway } from './stripe';
import { AdyenGateway } from './adyen';
import { PayPalGateway } from './paypal';

export function createGateway(): Gateway {
  switch (env.PAY_GATEWAY) {
    case 'STRIPE':
      if (!env.STRIPE_SECRET_KEY) {
        throw new Error(
          'STRIPE_SECRET_KEY is required when PAY_GATEWAY=STRIPE'
        );
      }
      return new StripeGateway();

    case 'ADYEN':
      if (!env.ADYEN_API_KEY || !env.ADYEN_HMAC_KEY) {
        throw new Error(
          'ADYEN_API_KEY and ADYEN_HMAC_KEY are required when PAY_GATEWAY=ADYEN'
        );
      }
      return new AdyenGateway();

    case 'PAYPAL':
      if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_SECRET) {
        throw new Error(
          'PAYPAL_CLIENT_ID and PAYPAL_SECRET are required when PAY_GATEWAY=PAYPAL'
        );
      }
      return new PayPalGateway();

    case 'MOCK':
    default:
      return new MockGateway();
  }
}

// Singleton instance for the application
export const gateway = createGateway();
