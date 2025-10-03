// Gateway Factory for M24.2 Customer Portal
// Creates gateway instances based on environment configuration

import { env } from "@/lib/env";
import type { Gateway } from "./types";
import { MockGateway } from "./mock";
import { StripeGateway } from "./stripe";
import { AdyenGateway } from "./adyen";
import { PayPalGateway } from "./paypal";

export function createGateway(): Gateway {
    switch (env.PAY_GATEWAY) {
        case "STRIPE":
            return new StripeGateway();

        case "ADYEN":
            return new AdyenGateway();

        case "PAYPAL":
            return new PayPalGateway();

        case "MOCK":
        default:
            return new MockGateway();
    }
}

// Singleton instance for the application
export const gateway = createGateway();
