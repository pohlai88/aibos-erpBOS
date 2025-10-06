// Mock Gateway Adapter for M24.2 Customer Portal
// Provides mock implementations for development and testing

import type {
  Gateway,
  GatewayIntent,
  GatewayCapture,
  GatewayRefund,
  GatewayWebhookVerification,
  GatewayWebhookEvent,
} from './types';

export class MockGateway implements Gateway {
  async createIntent(params: {
    amount: number;
    ccy: string;
    customerRef: string;
    saveMethod?: boolean;
  }): Promise<GatewayIntent> {
    // Mock implementation - always succeeds
    const extRef = `mock_intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      clientSecret: `mock_client_secret_${extRef}`,
      extRef,
    };
  }

  async capture(params: {
    extRef: string;
    paymentMethod?: any;
  }): Promise<GatewayCapture> {
    // Mock implementation - always succeeds
    return {
      extRef: params.extRef,
      capturedAmount: 1000, // Mock amount
      fee: 29, // Mock fee (2.9%)
    };
  }

  async refund(params: {
    extRef: string;
    amount?: number;
  }): Promise<GatewayRefund> {
    // Mock implementation - always succeeds
    return {
      extRef: params.extRef,
      refundedAmount: params.amount || 1000,
    };
  }

  verifyWebhook(
    headers: Record<string, string>,
    rawBody: string
  ): GatewayWebhookVerification {
    // Mock implementation - always passes verification
    return {
      ok: true,
    };
  }

  parseWebhook(rawBody: string): GatewayWebhookEvent {
    // Mock implementation - parse JSON and return mock event
    try {
      const payload = JSON.parse(rawBody);
      return {
        event: 'captured',
        extRef: payload.id || `mock_${Date.now()}`,
        amount: payload.amount || 1000,
        ccy: payload.currency || 'USD',
        payload,
      };
    } catch {
      // Fallback for invalid JSON
      return {
        event: 'captured',
        extRef: `mock_${Date.now()}`,
        amount: 1000,
        ccy: 'USD',
        payload: { raw: rawBody },
      };
    }
  }
}
