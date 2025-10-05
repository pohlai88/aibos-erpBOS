// Stripe Gateway Adapter for M24.2 Customer Portal
// Real implementation using Stripe SDK

import Stripe from 'stripe';
import { env } from '@/lib/env';
import type { Gateway, GatewayIntent, GatewayCapture, GatewayRefund, GatewayWebhookVerification, GatewayWebhookEvent } from './types';

export class StripeGateway implements Gateway {
    private stripe: Stripe;

    constructor() {
        if (!env.STRIPE_SECRET_KEY) {
            throw new Error('STRIPE_SECRET_KEY is required');
        }

        this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
            apiVersion: '2023-10-16',
        });
    }

    async createIntent(params: {
        amount: number;
        ccy: string;
        customerRef: string;
        saveMethod?: boolean;
    }): Promise<GatewayIntent> {
        try {
            // Convert amount to cents
            const amountCents = Math.round(params.amount * 100);

            // Create payment intent
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: amountCents,
                currency: params.ccy.toLowerCase(),
                customer: params.customerRef,
                ...(params.saveMethod && { setup_future_usage: 'off_session' }),
                metadata: {
                    customer_ref: params.customerRef,
                },
            });

            return {
                ...(paymentIntent.client_secret && { clientSecret: paymentIntent.client_secret }),
                extRef: paymentIntent.id,
            };
        } catch (error) {
            console.error('Stripe createIntent error:', error);
            throw new Error(`Failed to create Stripe payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async capture(params: {
        extRef: string;
        paymentMethod?: any;
    }): Promise<GatewayCapture> {
        try {
            const paymentIntent = await this.stripe.paymentIntents.capture(params.extRef);

            // Get the latest charge to calculate fees
            const charges = await this.stripe.charges.list({
                payment_intent: params.extRef,
                limit: 1
            });

            const fee = charges.data[0]?.balance_transaction ?
                await this.getStripeFee(charges.data[0].balance_transaction as string) : undefined;

            return {
                extRef: paymentIntent.id,
                capturedAmount: paymentIntent.amount / 100, // Convert from cents
                ...(fee !== undefined && { fee })
            };
        } catch (error) {
            console.error('Stripe capture error:', error);
            throw new Error(`Failed to capture Stripe payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async refund(params: {
        extRef: string;
        amount?: number;
    }): Promise<GatewayRefund> {
        try {
            const refundParams: any = {
                payment_intent: params.extRef,
            };

            if (params.amount) {
                refundParams.amount = Math.round(params.amount * 100);
            }

            const refund = await this.stripe.refunds.create(refundParams);

            return {
                extRef: refund.id,
                refundedAmount: refund.amount / 100, // Convert from cents
            };
        } catch (error) {
            console.error('Stripe refund error:', error);
            throw new Error(`Failed to refund Stripe payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    verifyWebhook(headers: Record<string, string>, rawBody: string): GatewayWebhookVerification {
        try {
            const signature = headers['stripe-signature'];
            if (!signature) {
                return { ok: false, reason: 'Missing stripe-signature header' };
            }

            if (!env.STRIPE_WEBHOOK_SECRET) {
                return { ok: false, reason: 'STRIPE_WEBHOOK_SECRET not configured' };
            }

            const event = this.stripe.webhooks.constructEvent(
                rawBody,
                signature,
                env.STRIPE_WEBHOOK_SECRET
            );

            return { ok: true };
        } catch (error) {
            console.error('Stripe webhook verification error:', error);
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

            switch (event.type) {
                case 'payment_intent.succeeded':
                    eventType = 'captured';
                    extRef = event.data.object.id;
                    amount = event.data.object.amount / 100;
                    ccy = event.data.object.currency.toUpperCase();
                    break;
                case 'payment_intent.payment_failed':
                    eventType = 'failed';
                    extRef = event.data.object.id;
                    amount = event.data.object.amount / 100;
                    ccy = event.data.object.currency.toUpperCase();
                    break;
                case 'charge.dispute.created':
                    eventType = 'voided';
                    extRef = event.data.object.payment_intent;
                    amount = event.data.object.amount / 100;
                    ccy = event.data.object.currency.toUpperCase();
                    break;
                default:
                    throw new Error(`Unhandled Stripe event type: ${event.type}`);
            }

            return {
                event: eventType,
                extRef,
                amount,
                ccy,
                payload: event,
            };
        } catch (error) {
            console.error('Stripe webhook parsing error:', error);
            throw new Error(`Failed to parse Stripe webhook: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async getStripeFee(balanceTransactionId: string): Promise<number> {
        try {
            const balanceTransaction = await this.stripe.balanceTransactions.retrieve(balanceTransactionId);
            return balanceTransaction.fee_details.reduce((total: number, fee: any) => total + fee.amount, 0) / 100;
        } catch (error) {
            console.error('Failed to get Stripe fee:', error);
            return 0;
        }
    }
}
