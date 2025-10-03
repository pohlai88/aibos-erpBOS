// PayPal Gateway Adapter for M24.2 Customer Portal
// Real implementation using PayPal SDK

import { PayPalApi } from '@paypal/checkout-server-sdk';
import { env } from '@/lib/env';
import { createHmac } from 'crypto';
import type { Gateway, GatewayIntent, GatewayCapture, GatewayRefund, GatewayWebhookVerification, GatewayWebhookEvent } from './types';

export class PayPalGateway implements Gateway {
    private client: PayPalApi;

    constructor() {
        if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_SECRET) {
            throw new Error('PAYPAL_CLIENT_ID and PAYPAL_SECRET are required');
        }

        const environment = new PayPalApi.Environment.Sandbox(env.PAYPAL_CLIENT_ID, env.PAYPAL_SECRET);
        this.client = new PayPalApi(environment);
    }

    async createIntent(params: {
        amount: number;
        ccy: string;
        customerRef: string;
        saveMethod?: boolean;
    }): Promise<GatewayIntent> {
        try {
            const request = new PayPalApi.Orders.OrdersCreateRequest();
            request.prefer('return=representation');
            request.requestBody({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: params.ccy,
                        value: params.amount.toFixed(2),
                    },
                    reference_id: params.customerRef,
                }],
                application_context: {
                    return_url: `${env.PORTAL_BASE_URL}/checkout/return`,
                    cancel_url: `${env.PORTAL_BASE_URL}/checkout/cancel`,
                    brand_name: 'AI-BOS Portal',
                    landing_page: 'BILLING',
                    user_action: 'PAY_NOW',
                },
            });

            const response = await this.client.execute(request);

            return {
                clientSecret: response.result.id,
                extRef: response.result.id,
            };
        } catch (error) {
            console.error('PayPal createIntent error:', error);
            throw new Error(`Failed to create PayPal order: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async capture(params: {
        extRef: string;
        paymentMethod?: any;
    }): Promise<GatewayCapture> {
        try {
            const request = new PayPalApi.Orders.OrdersCaptureRequest(params.extRef);
            request.requestBody({});

            const response = await this.client.execute(request);

            const capture = response.result.purchase_units[0]?.payments?.captures?.[0];
            const amount = capture ? parseFloat(capture.amount.value) : 0;

            return {
                extRef: capture?.id || params.extRef,
                capturedAmount: amount,
                fee: amount * 0.029 + 0.30, // PayPal fee structure
            };
        } catch (error) {
            console.error('PayPal capture error:', error);
            throw new Error(`Failed to capture PayPal payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async refund(params: {
        extRef: string;
        amount?: number;
    }): Promise<GatewayRefund> {
        try {
            const request = new PayPalApi.Payments.CapturesRefundRequest(params.extRef);
            request.requestBody({
                amount: {
                    value: params.amount?.toFixed(2) || '0.00',
                    currency_code: 'USD', // TODO: Get from original capture
                },
                note_to_payer: 'Refund requested via customer portal',
            });

            const response = await this.client.execute(request);

            return {
                extRef: response.result.id,
                refundedAmount: params.amount || 0,
            };
        } catch (error) {
            console.error('PayPal refund error:', error);
            throw new Error(`Failed to refund PayPal payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    verifyWebhook(headers: Record<string, string>, rawBody: string): GatewayWebhookVerification {
        try {
            const signature = headers['paypal-signature'];
            if (!signature) {
                return { ok: false, reason: 'Missing paypal-signature header' };
            }

            // PayPal webhook signature verification
            // Note: This is a simplified version. Real implementation would use PayPal's webhook verification API
            if (!env.PAYPAL_SECRET) {
                return { ok: false, reason: 'PAYPAL_SECRET not configured' };
            }

            const hmac = createHmac('sha256', env.PAYPAL_SECRET);
            hmac.update(rawBody);
            const calculatedSignature = hmac.digest('base64');

            if (signature !== calculatedSignature) {
                return { ok: false, reason: 'Invalid PayPal signature' };
            }

            return { ok: true };
        } catch (error) {
            console.error('PayPal webhook verification error:', error);
            return {
                ok: false,
                reason: error instanceof Error ? error.message : 'Webhook verification failed'
            };
        }
    }

    parseWebhook(rawBody: string): GatewayWebhookEvent {
        try {
            const event = JSON.parse(rawBody);

            let eventType: 'captured' | 'failed' | 'refunded' | 'voided';
            let extRef: string;
            let amount: number;
            let ccy: string;

            switch (event.event_type) {
                case 'PAYMENT.CAPTURE.COMPLETED':
                    eventType = 'captured';
                    extRef = event.resource.id;
                    amount = parseFloat(event.resource.amount.value);
                    ccy = event.resource.amount.currency_code;
                    break;
                case 'PAYMENT.CAPTURE.DENIED':
                    eventType = 'failed';
                    extRef = event.resource.id;
                    amount = parseFloat(event.resource.amount.value);
                    ccy = event.resource.amount.currency_code;
                    break;
                case 'PAYMENT.CAPTURE.REFUNDED':
                    eventType = 'refunded';
                    extRef = event.resource.id;
                    amount = parseFloat(event.resource.amount.value);
                    ccy = event.resource.amount.currency_code;
                    break;
                case 'PAYMENT.CAPTURE.VOIDED':
                    eventType = 'voided';
                    extRef = event.resource.id;
                    amount = parseFloat(event.resource.amount.value);
                    ccy = event.resource.amount.currency_code;
                    break;
                default:
                    throw new Error(`Unhandled PayPal event type: ${event.event_type}`);
            }

            return {
                event: eventType,
                extRef,
                amount,
                ccy,
                payload: event,
            };
        } catch (error) {
            console.error('PayPal webhook parsing error:', error);
            throw new Error(`Failed to parse PayPal webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
