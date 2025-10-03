// Gateway Factory for M24.2 Customer Portal
// Creates gateway instances based on environment configuration

import { env } from "@/lib/env";
import type { Gateway } from "./types";
import { MockGateway } from "./mock";

// TODO: Add real gateway implementations
// import { StripeGateway } from "./stripe";
// import { AdyenGateway } from "./adyen";
// import { PayPalGateway } from "./paypal";

export function createGateway(): Gateway {
    switch (env.PAY_GATEWAY) {
        case "STRIPE":
            // TODO: Implement StripeGateway
            console.warn("Stripe gateway not implemented, falling back to MOCK");
            return new MockGateway();

        case "ADYEN":
            // TODO: Implement AdyenGateway
            console.warn("Adyen gateway not implemented, falling back to MOCK");
            return new MockGateway();

        case "PAYPAL":
            // TODO: Implement PayPalGateway
            console.warn("PayPal gateway not implemented, falling back to MOCK");
            return new MockGateway();

        case "MOCK":
        default:
            return new MockGateway();
    }
}

// Singleton instance for the application
export const gateway = createGateway();
