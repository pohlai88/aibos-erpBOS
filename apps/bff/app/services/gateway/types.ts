// Gateway adapter interface for M24.2 Customer Portal
// Provides a consistent interface for different payment gateways

export interface GatewayIntent {
    clientSecret?: string;
    extRef: string;
}

export interface GatewayCapture {
    extRef: string;
    capturedAmount: number;
    fee?: number;
}

export interface GatewayRefund {
    extRef: string;
    refundedAmount: number;
}

export interface GatewayWebhookVerification {
    ok: boolean;
    reason?: string;
}

export interface GatewayWebhookEvent {
    event: "captured" | "failed" | "refunded" | "voided";
    extRef: string;
    amount: number;
    ccy: string;
    payload: any;
}

export interface Gateway {
    createIntent(params: {
        amount: number;
        ccy: string;
        customerRef: string;
        saveMethod?: boolean;
    }): Promise<GatewayIntent>;

    capture(params: {
        extRef: string;
        paymentMethod?: any;
    }): Promise<GatewayCapture>;

    refund(params: {
        extRef: string;
        amount?: number;
    }): Promise<GatewayRefund>;

    verifyWebhook(headers: Record<string, string>, rawBody: string): GatewayWebhookVerification;

    parseWebhook(rawBody: string): GatewayWebhookEvent;
}
