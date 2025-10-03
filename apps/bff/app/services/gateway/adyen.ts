// Adyen Gateway Adapter for M24.2 Customer Portal
// Real implementation using Adyen API

import { Client, Config, CheckoutAPI, Payment } from '@adyen/api-library';
import { env } from '@/lib/env';
import { createHmac } from 'crypto';
import type { Gateway, GatewayIntent, GatewayCapture, GatewayRefund, GatewayWebhookVerification, GatewayWebhookEvent } from './types';

export class AdyenGateway implements Gateway {
    private client: Client;
    private checkout: CheckoutAPI;

    constructor() {
        const config = new Config();
        config.apiKey = env.ADYEN_API_KEY;
        config.environment = 'TEST'; // TODO: Make configurable via env
        
        this.client = new Client({ config });
        this.checkout = new CheckoutAPI(this.client);
    }

    async createIntent(params: {
        amount: number;
        ccy: string;
        customerRef: string;
        saveMethod?: boolean;
    }): Promise<GatewayIntent> {
        try {
            const paymentRequest = new Payment({
                amount: {
                    currency: params.ccy,
                    value: Math.round(params.amount * 100), // Adyen uses minor units
                },
                reference: `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                merchantAccount: 'TestMerchantAccount', // TODO: Make configurable
                returnUrl: `${env.PORTAL_BASE_URL}/checkout/return`,
                shopperReference: params.customerRef,
                storePaymentMethod: params.saveMethod,
            });

            const response = await this.checkout.payments(paymentRequest);

            return {
                clientSecret: response.clientKey,
                extRef: response.pspReference || response.reference,
            };
        } catch (error) {
            console.error('Adyen createIntent error:', error);
            throw new Error(`Failed to create Adyen payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async capture(params: {
        extRef: string;
        paymentMethod?: any;
    }): Promise<GatewayCapture> {
        try {
            const captureRequest = {
                originalReference: params.extRef,
                amount: {
                    currency: 'USD', // TODO: Get from original payment
                    value: 1000, // TODO: Get from original payment
                },
                merchantAccount: 'TestMerchantAccount', // TODO: Make configurable
            };

            const response = await this.checkout.captures(captureRequest);

            return {
                extRef: response.pspReference || params.extRef,
                capturedAmount: 1000, // TODO: Calculate from response
                fee: 29, // TODO: Calculate actual fee
            };
        } catch (error) {
            console.error('Adyen capture error:', error);
            throw new Error(`Failed to capture Adyen payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async refund(params: {
        extRef: string;
        amount?: number;
    }): Promise<GatewayRefund> {
        try {
            const refundRequest = {
                originalReference: params.extRef,
                amount: {
                    currency: 'USD', // TODO: Get from original payment
                    value: params.amount ? Math.round(params.amount * 100) : 1000,
                },
                merchantAccount: 'TestMerchantAccount', // TODO: Make configurable
            };

            const response = await this.checkout.refunds(refundRequest);

            return {
                extRef: response.pspReference || `refund_${Date.now()}`,
                refundedAmount: params.amount || 10, // TODO: Calculate from response
            };
        } catch (error) {
            console.error('Adyen refund error:', error);
            throw new Error(`Failed to refund Adyen payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    verifyWebhook(headers: Record<string, string>, rawBody: string): GatewayWebhookVerification {
        try {
            const signature = headers['adyen-signature'];
            if (!signature) {
                return { ok: false, reason: 'Missing adyen-signature header' };
            }

            // Adyen HMAC verification
            const hmac = createHmac('sha256', env.ADYEN_HMAC_KEY);
            hmac.update(rawBody);
            const calculatedSignature = hmac.digest('base64');

            if (signature !== calculatedSignature) {
                return { ok: false, reason: 'Invalid HMAC signature' };
            }

            return { ok: true };
        } catch (error) {
            console.error('Adyen webhook verification error:', error);
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

            switch (event.eventCode) {
                case 'AUTHORISATION':
                    eventType = 'captured';
                    extRef = event.pspReference;
                    amount = event.amount?.value ? event.amount.value / 100 : 0;
                    ccy = event.amount?.currency || 'USD';
                    break;
                case 'REFUND':
                    eventType = 'refunded';
                    extRef = event.pspReference;
                    amount = event.amount?.value ? event.amount.value / 100 : 0;
                    ccy = event.amount?.currency || 'USD';
                    break;
                case 'CANCELLATION':
                    eventType = 'voided';
                    extRef = event.pspReference;
                    amount = event.amount?.value ? event.amount.value / 100 : 0;
                    ccy = event.amount?.currency || 'USD';
                    break;
                default:
                    throw new Error(`Unhandled Adyen event type: ${event.eventCode}`);
            }

            return {
                event: eventType,
                extRef,
                amount,
                ccy,
                payload: event,
            };
        } catch (error) {
            console.error('Adyen webhook parsing error:', error);
            throw new Error(`Failed to parse Adyen webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
