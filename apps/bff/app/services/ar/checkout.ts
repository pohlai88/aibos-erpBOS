import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, desc, sql } from "drizzle-orm";
import {
    arCheckoutIntent,
    arCheckoutTxn,
    arSavedMethod,
    arInvoice,
    arReceiptEmail,
    cfReceiptSignal
} from "@aibos/db-adapter/schema";
import type {
    CheckoutIntentReqType,
    CheckoutIntentResType,
    CheckoutConfirmReqType,
    CheckoutConfirmResType
} from "@aibos/contracts";
import { ArSurchargeService } from "./surcharge";
import { ArCashApplicationService } from "./cash-application";
import { gateway } from "../gateway/factory";
import { emailService } from "../email/portal";

export class ArCheckoutService {
    private surchargeService: ArSurchargeService;
    private cashAppService: ArCashApplicationService;

    constructor(private dbInstance = db) {
        this.surchargeService = new ArSurchargeService(dbInstance);
        this.cashAppService = new ArCashApplicationService(dbInstance);
    }

    /**
     * Create checkout intent
     */
    async createIntent(
        companyId: string,
        customerId: string,
        req: CheckoutIntentReqType,
        createdBy: string
    ): Promise<CheckoutIntentResType> {
        // Validate invoices and calculate total
        const invoiceIds = req.invoices.map(inv => inv.invoice_id);
        const invoices = await this.dbInstance
            .select()
            .from(arInvoice)
            .where(
                and(
                    eq(arInvoice.companyId, companyId),
                    eq(arInvoice.customerId, customerId)
                )
            );

        const invoiceMap = new Map(invoices.map(inv => [inv.id, inv]));

        let totalAmount = 0;
        for (const inv of req.invoices) {
            const invoice = invoiceMap.get(inv.invoice_id);
            if (!invoice) {
                throw new Error(`Invoice ${inv.invoice_id} not found`);
            }
            if (invoice.status !== 'OPEN') {
                throw new Error(`Invoice ${inv.invoice_id} is not open`);
            }
            totalAmount += inv.amount;
        }

        // Calculate surcharge
        const surcharge = await this.surchargeService.calculateSurcharge(companyId, totalAmount);
        const totalWithSurcharge = totalAmount + surcharge;

        // Create gateway intent using the gateway interface
        const gatewayResult = await this.createGatewayIntent(
            req.gateway,
            totalWithSurcharge,
            req.present_ccy,
            customerId,
            req.save_method
        );

        // Create checkout intent
        const intentId = ulid();
        await this.dbInstance.insert(arCheckoutIntent).values({
            id: intentId,
            companyId,
            customerId,
            presentCcy: req.present_ccy,
            amount: totalAmount.toString(),
            invoices: JSON.stringify(req.invoices),
            surcharge: surcharge.toString(),
            gateway: req.gateway,
            status: 'created',
            clientSecret: gatewayResult.clientSecret,
            createdBy,
        });

        // Set expiration (15 minutes)
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        return {
            intent_id: intentId,
            client_secret: gatewayResult.clientSecret,
            amount: totalAmount,
            surcharge,
            total_amount: totalWithSurcharge,
            gateway: req.gateway,
            expires_at: expiresAt.toISOString()
        };
    }

    /**
     * Confirm checkout and process payment
     */
    async confirmIntent(
        companyId: string,
        req: CheckoutConfirmReqType
    ): Promise<CheckoutConfirmResType> {
        // Get intent
        const intents = await this.dbInstance
            .select()
            .from(arCheckoutIntent)
            .where(eq(arCheckoutIntent.id, req.intent_id))
            .limit(1);

        if (intents.length === 0) {
            throw new Error('Checkout intent not found');
        }

        const intent = intents[0]!;

        // Process payment with gateway
        const paymentResult = await this.processGatewayPayment(
            intent.gateway,
            req.gateway_payload,
            intent.clientSecret || 'pi_mock_' + intent.id
        );

        if (!paymentResult.success) {
            // Update intent status
            await this.dbInstance
                .update(arCheckoutIntent)
                .set({ status: 'failed' })
                .where(eq(arCheckoutIntent.id, req.intent_id));

            return {
                success: false,
                transaction_id: '',
                message: paymentResult.error || 'Payment failed'
            };
        }

        // Create transaction record
        const txnId = ulid();
        await this.dbInstance.insert(arCheckoutTxn).values({
            id: txnId,
            intentId: req.intent_id,
            gateway: intent.gateway,
            extRef: paymentResult.transactionId,
            status: 'captured',
            amount: intent.amount,
            feeAmount: paymentResult.feeAmount?.toString(),
            ccy: intent.presentCcy,
            payload: JSON.stringify(req.gateway_payload),
        });

        // Update intent status
        await this.dbInstance
            .update(arCheckoutIntent)
            .set({ status: 'captured' })
            .where(eq(arCheckoutIntent.id, req.intent_id));

        // Process cash application
        await this.processCashApplication(companyId, intent);

        // Emit M22 receipt signal
        await this.emitReceiptSignal(companyId, intent, txnId);

        // Send receipt email
        await this.sendReceiptEmail(companyId, intent, txnId);

        return {
            success: true,
            transaction_id: txnId,
            receipt_url: `${process.env.PORTAL_BASE_URL}/receipt/${txnId}`,
            message: 'Payment processed successfully'
        };
    }

    /**
     * Create gateway intent using the gateway interface
     */
    private async createGatewayIntent(
        gatewayType: string,
        amount: number,
        currency: string,
        customerRef: string,
        saveMethod?: boolean
    ): Promise<{ clientSecret?: string; extRef: string }> {
        return await gateway.createIntent({
            amount,
            ccy: currency,
            customerRef,
            saveMethod: saveMethod || false
        });
    }

    /**
     * Mock gateway payment processing
     */
    private async processGatewayPayment(
        gateway: string,
        payload: any,
        clientSecret: string
    ): Promise<{
        success: boolean;
        transactionId?: string;
        feeAmount?: number;
        error?: string;
    }> {
        // Mock implementation - in production, integrate with actual gateways
        console.log(`Processing ${gateway} payment:`, payload);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100));

        // Mock success (90% success rate)
        if (Math.random() > 0.1) {
            return {
                success: true,
                transactionId: `txn_${ulid()}`,
                feeAmount: Math.random() * 5 // Random fee
            };
        } else {
            return {
                success: false,
                error: 'Payment declined by gateway'
            };
        }
    }

    /**
     * Process cash application after successful payment
     */
    private async processCashApplication(
        companyId: string,
        intent: any
    ) {
        const invoices = typeof intent.invoices === 'string'
            ? JSON.parse(intent.invoices)
            : intent.invoices;

        // Create remittance entry for cash application
        const remittanceData = {
            date: new Date().toISOString().split('T')[0]!,
            currency: intent.presentCcy,
            amount: parseFloat(intent.amount),
            references: invoices.map((inv: any) => inv.invoice_id)
        };

        // Process through cash application service
        await this.cashAppService.importRemittance(
            companyId,
            {
                source: 'EMAIL',
                filename: `portal-payment-${intent.id}`,
                payload: JSON.stringify(remittanceData)
            },
            'portal-system'
        );
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
            refId: txnId
        });
    }

    /**
     * Send receipt email
     */
    private async sendReceiptEmail(
        companyId: string,
        intent: any,
        txnId: string
    ) {
        const emailId = ulid();

        try {
            // Get customer email from customer service
            const customerEmail = await this.getCustomerEmail(intent.customerId) || `customer-${intent.customerId}@example.com`;
            const receiptUrl = `${process.env.PORTAL_BASE_URL}/receipt/${txnId}`;
            const amount = parseFloat(intent.amount);
            const currency = intent.presentCcy;

            // Send receipt email via M15.2 email service
            const emailResult = await emailService.sendReceipt(
                customerEmail,
                txnId,
                amount,
                currency,
                receiptUrl,
                await this.getCustomerName(intent.customerId) || `Customer ${intent.customerId}`,
                'AI-BOS' // TODO: Get actual company name
            );

            await this.dbInstance.insert(arReceiptEmail).values({
                id: emailId,
                companyId,
                customerId: intent.customerId,
                intentId: intent.id,
                toAddr: customerEmail,
                status: emailResult.success ? 'sent' : 'error',
                error: emailResult.error || null
            });

            if (!emailResult.success) {
                console.error('Failed to send receipt email:', emailResult.error);
            }
        } catch (error) {
            await this.dbInstance.insert(arReceiptEmail).values({
                id: emailId,
                companyId,
                customerId: intent.customerId,
                intentId: intent.id,
                toAddr: `customer-${intent.customerId}@example.com`,
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            console.error('Receipt email service error:', error);
        }
    }

    /**
     * Get customer email from customer service
     */
    private async getCustomerEmail(customerId: string): Promise<string | null> {
        // TODO: Implement actual customer service call
        // This would typically fetch from a customer microservice
        return null;
    }

    /**
     * Get customer name from customer service
     */
    private async getCustomerName(customerId: string): Promise<string | null> {
        // TODO: Implement actual customer service call
        // This would typically fetch from a customer microservice
        return null;
    }

    /**
     * Save payment method
     */
    async savePaymentMethod(
        companyId: string,
        customerId: string,
        gateway: string,
        tokenRef: string,
        brand: string,
        last4: string,
        expMonth?: number,
        expYear?: number,
        isDefault: boolean = false,
        createdBy: string = 'portal-user'
    ) {
        const methodId = ulid();

        // If setting as default, unset other defaults
        if (isDefault) {
            await this.dbInstance
                .update(arSavedMethod)
                .set({ isDefault: false })
                .where(
                    and(
                        eq(arSavedMethod.companyId, companyId),
                        eq(arSavedMethod.customerId, customerId)
                    )
                );
        }

        await this.dbInstance.insert(arSavedMethod).values({
            id: methodId,
            companyId,
            customerId,
            gateway,
            tokenRef,
            brand,
            last4,
            expMonth: expMonth || null,
            expYear: expYear || null,
            isDefault,
            createdBy,
        });
    }

    /**
     * List checkout intents for a customer
     */
    async listIntents(
        companyId: string,
        customerId: string,
        limit: number = 50,
        offset: number = 0
    ): Promise<{
        intents: Array<{
            id: string;
            amount: number;
            ccy: string;
            status: string;
            gateway: string;
            created_at: Date;
            invoices: Array<{ invoice_id: string; amount: number }>;
        }>;
        total: number;
    }> {
        // Get total count
        const totalResult = await this.dbInstance
            .select({ count: sql<number>`count(*)` })
            .from(arCheckoutIntent)
            .where(
                and(
                    eq(arCheckoutIntent.companyId, companyId),
                    eq(arCheckoutIntent.customerId, customerId)
                )
            );

        // Get paginated intents
        const intents = await this.dbInstance
            .select()
            .from(arCheckoutIntent)
            .where(
                and(
                    eq(arCheckoutIntent.companyId, companyId),
                    eq(arCheckoutIntent.customerId, customerId)
                )
            )
            .orderBy(desc(arCheckoutIntent.createdAt))
            .limit(limit)
            .offset(offset);

        return {
            intents: intents.map(intent => ({
                id: intent.id,
                amount: parseFloat(intent.amount),
                ccy: intent.presentCcy,
                status: intent.status,
                gateway: intent.gateway,
                created_at: intent.createdAt,
                invoices: intent.invoices as Array<{ invoice_id: string; amount: number }>
            })),
            total: totalResult[0]?.count || 0
        };
    }

    /**
     * Refund a checkout intent
     */
    async refundIntent(
        companyId: string,
        intentId: string,
        refundAmount?: number,
        reason?: string,
        refundedBy: string = 'portal-user'
    ): Promise<{
        success: boolean;
        refund_id: string;
        refunded_amount: number;
        message: string;
    }> {
        // Get the intent
        const intent = await this.dbInstance
            .select()
            .from(arCheckoutIntent)
            .where(
                and(
                    eq(arCheckoutIntent.id, intentId),
                    eq(arCheckoutIntent.companyId, companyId)
                )
            )
            .limit(1);

        if (!intent.length) {
            throw new Error('Checkout intent not found');
        }

        const checkoutIntent = intent[0];
        if (!checkoutIntent) {
            throw new Error('Checkout intent not found');
        }

        if (checkoutIntent.status !== 'captured') {
            throw new Error('Only captured intents can be refunded');
        }

        // Calculate refund amount (default to full amount)
        const totalAmount = parseFloat(checkoutIntent.amount);
        const refundAmountFinal = refundAmount || totalAmount;

        if (refundAmountFinal > totalAmount) {
            throw new Error('Refund amount cannot exceed original amount');
        }

        // Create refund transaction
        const refundId = ulid();
        await this.dbInstance.insert(arCheckoutTxn).values({
            id: refundId,
            intentId: intentId,
            gateway: checkoutIntent.gateway,
            extRef: `refund_${refundId}`,
            status: 'refunded',
            amount: refundAmountFinal.toString(),
            ccy: checkoutIntent.presentCcy,
            payload: {
                reason: reason || 'Customer requested refund',
                refundedBy: refundedBy,
            }
        });

        // Update intent status
        await this.dbInstance
            .update(arCheckoutIntent)
            .set({ status: 'refunded' })
            .where(eq(arCheckoutIntent.id, intentId));

        return {
            success: true,
            refund_id: refundId,
            refunded_amount: refundAmountFinal,
            message: 'Refund processed successfully'
        };
    }
}
