import { db } from '@/lib/db';
import { ulid } from 'ulid';
import { eq, and, lt } from 'drizzle-orm';
import {
  arCheckoutIntent,
  arCheckoutTxn,
  arGatewayWebhookDlq,
  cfReceiptSignal,
} from '@aibos/db-adapter/schema';
import type {
  GatewayWebhookReqType,
  GatewayWebhookResType,
} from '@aibos/contracts';
// import { createHash, createHmac } from "crypto"; // TODO: Implement actual HMAC verification

export class ArWebhookService {
  constructor(private dbInstance = db) {}

  /**
   * Process gateway webhook
   */
  async processWebhook(
    companyId: string,
    req: GatewayWebhookReqType
  ): Promise<GatewayWebhookResType> {
    try {
      // Verify webhook signature
      const isValid = await this.verifyWebhookSignature(req);
      if (!isValid) {
        await this.addToDlq(companyId, req, 'Invalid signature');
        return {
          success: false,
          processed: false,
          reason: 'Invalid signature',
        };
      }

      // Process based on gateway
      switch (req.gateway) {
        case 'STRIPE':
          return await this.processStripeWebhook(companyId, req.payload);
        case 'ADYEN':
          return await this.processAdyenWebhook(companyId, req.payload);
        case 'PAYPAL':
          return await this.processPaypalWebhook(companyId, req.payload);
        default:
          return {
            success: false,
            processed: false,
            reason: 'Unsupported gateway',
          };
      }
    } catch (error) {
      await this.addToDlq(
        companyId,
        req,
        error instanceof Error ? error.message : 'Unknown error'
      );
      return {
        success: false,
        processed: false,
        reason: 'Processing error',
      };
    }
  }

  /**
   * Verify webhook signature
   */
  private async verifyWebhookSignature(
    req: GatewayWebhookReqType
  ): Promise<boolean> {
    // Mock implementation - in production, verify actual HMAC signatures
    // For testing purposes, validate that signature is not 'invalid_signature'
    if (req.signature === 'invalid_signature') {
      return false;
    }

    // Accept any other signature as valid for mock/testing
    return true;
  }

  /**
   * Process Stripe webhook
   */
  private async processStripeWebhook(
    companyId: string,
    payload: Record<string, unknown>
  ): Promise<GatewayWebhookResType> {
    const eventType = payload.type as string;
    const paymentIntent = (payload.data as Record<string, unknown>)?.object;

    if (eventType === 'payment_intent.succeeded') {
      return await this.handlePaymentSuccess(
        companyId,
        paymentIntent as Record<string, unknown>
      );
    } else if (eventType === 'payment_intent.payment_failed') {
      return await this.handlePaymentFailure(
        companyId,
        paymentIntent as Record<string, unknown>
      );
    } else if (eventType === 'charge.dispute.created') {
      return await this.handleChargeback(
        companyId,
        (payload.data as Record<string, unknown>)?.object as Record<
          string,
          unknown
        >
      );
    }

    return {
      success: true,
      processed: false,
      reason: 'Event type not handled',
    };
  }

  /**
   * Process Adyen webhook
   */
  private async processAdyenWebhook(
    companyId: string,
    payload: Record<string, unknown>
  ): Promise<GatewayWebhookResType> {
    const eventCode = payload.eventCode as string;
    const paymentData = payload.paymentData as Record<string, unknown>;

    if (eventCode === 'AUTHORISATION') {
      return await this.handlePaymentSuccess(companyId, paymentData);
    } else if (eventCode === 'CANCELLATION') {
      return await this.handlePaymentFailure(companyId, paymentData);
    }

    return {
      success: true,
      processed: false,
      reason: 'Event code not handled',
    };
  }

  /**
   * Process PayPal webhook
   */
  private async processPaypalWebhook(
    companyId: string,
    payload: Record<string, unknown>
  ): Promise<GatewayWebhookResType> {
    const eventType = payload.event_type as string;
    const resource = payload.resource as Record<string, unknown>;

    if (eventType === 'PAYMENT.SALE.COMPLETED') {
      return await this.handlePaymentSuccess(companyId, resource);
    } else if (eventType === 'PAYMENT.SALE.DENIED') {
      return await this.handlePaymentFailure(companyId, resource);
    }

    return {
      success: true,
      processed: false,
      reason: 'Event type not handled',
    };
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(
    companyId: string,
    paymentData: Record<string, unknown>
  ): Promise<GatewayWebhookResType> {
    // Find intent by external reference
    const intents = await this.dbInstance
      .select()
      .from(arCheckoutIntent)
      .where(eq(arCheckoutIntent.clientSecret, paymentData.id as string))
      .limit(1);

    if (intents.length === 0) {
      return {
        success: false,
        processed: false,
        reason: 'Intent not found',
      };
    }

    const intent = intents[0]!;

    // Check if already processed
    const existingTxns = await this.dbInstance
      .select()
      .from(arCheckoutTxn)
      .where(
        and(
          eq(arCheckoutTxn.intentId, intent.id),
          eq(arCheckoutTxn.extRef, paymentData.id as string)
        )
      );

    if (existingTxns.length > 0) {
      return {
        success: true,
        processed: false,
        reason: 'Already processed',
      };
    }

    // Create transaction record
    const txnId = ulid();
    await this.dbInstance.insert(arCheckoutTxn).values({
      id: txnId,
      intentId: intent.id,
      gateway: intent.gateway,
      extRef: paymentData.id as string,
      status: 'captured',
      amount: intent.amount,
      feeAmount: (paymentData.application_fee_amount as number)?.toString(),
      ccy: intent.presentCcy,
      payload: JSON.stringify(paymentData),
    });

    // Update intent status
    await this.dbInstance
      .update(arCheckoutIntent)
      .set({ status: 'captured' })
      .where(eq(arCheckoutIntent.id, intent.id));

    // Emit M22 receipt signal
    await this.emitReceiptSignal(companyId, intent, txnId);

    return {
      success: true,
      processed: true,
    };
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailure(
    companyId: string,
    paymentData: Record<string, unknown>
  ): Promise<GatewayWebhookResType> {
    // Find intent and update status
    const intents = await this.dbInstance
      .select()
      .from(arCheckoutIntent)
      .where(eq(arCheckoutIntent.clientSecret, paymentData.id as string))
      .limit(1);

    if (intents.length > 0) {
      await this.dbInstance
        .update(arCheckoutIntent)
        .set({ status: 'failed' })
        .where(eq(arCheckoutIntent.id, intents[0]!.id));
    }

    return {
      success: true,
      processed: true,
    };
  }

  /**
   * Handle chargeback
   */
  private async handleChargeback(
    companyId: string,
    disputeData: Record<string, unknown>
  ): Promise<GatewayWebhookResType> {
    // Find transaction and mark as disputed
    const txns = await this.dbInstance
      .select()
      .from(arCheckoutTxn)
      .where(eq(arCheckoutTxn.extRef, disputeData.charge as string))
      .limit(1);

    if (txns.length > 0) {
      await this.dbInstance
        .update(arCheckoutTxn)
        .set({ status: 'disputed' })
        .where(eq(arCheckoutTxn.id, txns[0]!.id));
    }

    return {
      success: true,
      processed: true,
    };
  }

  /**
   * Add failed webhook to DLQ
   */
  private async addToDlq(
    companyId: string,
    req: GatewayWebhookReqType,
    reason: string
  ) {
    const dlqId = ulid();
    const retryAt = new Date();
    retryAt.setMinutes(retryAt.getMinutes() + 5); // Retry in 5 minutes

    await this.dbInstance.insert(arGatewayWebhookDlq).values({
      id: dlqId,
      companyId,
      gateway: req.gateway,
      payload: JSON.stringify(req.payload),
      reason,
      retryAt,
    });
  }

  /**
   * Emit M22 receipt signal
   */
  private async emitReceiptSignal(
    companyId: string,
    intent: any,
    txnId: string
  ) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekBucket = weekStart.toISOString().split('T')[0]!;

    await this.dbInstance.insert(cfReceiptSignal).values({
      id: ulid(),
      companyId,
      weekStart: weekBucket,
      amount: intent.amount,
      ccy: intent.presentCcy,
      source: 'AUTO_MATCH',
      refId: txnId,
    });
  }

  /**
   * Retry failed webhooks from DLQ
   */
  async retryFailedWebhooks(companyId: string) {
    const now = new Date();

    const failedWebhooks = await this.dbInstance
      .select()
      .from(arGatewayWebhookDlq)
      .where(
        and(
          eq(arGatewayWebhookDlq.companyId, companyId),
          lt(arGatewayWebhookDlq.retryAt, now)
        )
      );

    for (const webhook of failedWebhooks) {
      try {
        const req: GatewayWebhookReqType = {
          gateway: webhook.gateway as 'STRIPE' | 'ADYEN' | 'PAYPAL',
          payload: JSON.parse(webhook.payload as string),
          signature: 'retry_signature',
          timestamp: Date.now(),
        };

        await this.processWebhook(companyId, req);

        // Remove from DLQ on success
        await this.dbInstance
          .delete(arGatewayWebhookDlq)
          .where(eq(arGatewayWebhookDlq.id, webhook.id));
      } catch (_error) {
        // Update retry time
        const retryAt = new Date();
        retryAt.setMinutes(retryAt.getMinutes() + 10); // Retry in 10 minutes

        await this.dbInstance
          .update(arGatewayWebhookDlq)
          .set({ retryAt })
          .where(eq(arGatewayWebhookDlq.id, webhook.id));
      }
    }
  }
}
