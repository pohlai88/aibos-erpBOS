import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ulid } from 'ulid';
import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import {
    arPortalSession,
    arCheckoutIntent,
    arCheckoutTxn,
    arSavedMethod,
    arSurchargePolicy,
    arInvoice,
    arPtp,
    arDispute
} from '@aibos/db-adapter/schema';
import { ArPortalService } from '../portal';
import { ArSurchargeService } from '../surcharge';
import { ArCheckoutService } from '../checkout';
import { ArWebhookService } from '../webhook';

describe('AR Portal & Pay-Now Service (M24.2)', () => {
    const testCompanyId = 'test-company';
    const testCustomerId = 'test-customer';
    const testUserId = 'test-user';

    beforeEach(async () => {
        // Clean up test data
        await db.delete(arDispute).where(eq(arDispute.companyId, testCompanyId));
        await db.delete(arPtp).where(eq(arPtp.companyId, testCompanyId));
        await db.delete(arInvoice).where(eq(arInvoice.companyId, testCompanyId));
        await db.delete(arSurchargePolicy).where(eq(arSurchargePolicy.companyId, testCompanyId));
        await db.delete(arSavedMethod).where(eq(arSavedMethod.companyId, testCompanyId));
        await db.delete(arCheckoutTxn).where(eq(arCheckoutTxn.intentId, 'test-intent'));
        await db.delete(arCheckoutIntent).where(eq(arCheckoutIntent.companyId, testCompanyId));
        await db.delete(arPortalSession).where(eq(arPortalSession.companyId, testCompanyId));
    });

    afterEach(async () => {
        // Clean up after each test
        await db.delete(arDispute).where(eq(arDispute.companyId, testCompanyId));
        await db.delete(arPtp).where(eq(arPtp.companyId, testCompanyId));
        await db.delete(arInvoice).where(eq(arInvoice.companyId, testCompanyId));
        await db.delete(arSurchargePolicy).where(eq(arSurchargePolicy.companyId, testCompanyId));
        await db.delete(arSavedMethod).where(eq(arSavedMethod.companyId, testCompanyId));
        await db.delete(arCheckoutTxn).where(eq(arCheckoutTxn.intentId, 'test-intent'));
        await db.delete(arCheckoutIntent).where(eq(arCheckoutIntent.companyId, testCompanyId));
        await db.delete(arPortalSession).where(eq(arPortalSession.companyId, testCompanyId));
    });

    describe('Portal Session Management', () => {
        it('should create portal session and send magic link', async () => {
            const portalService = new ArPortalService();

            const result = await portalService.initSession(
                testCompanyId,
                {
                    customer_id: testCustomerId,
                    email: 'test@example.com',
                    ttl_minutes: 60
                },
                testUserId
            );

            expect(result.success).toBe(true);
            expect(result.message).toContain('test@example.com');

            // Verify session was created
            const sessions = await db
                .select()
                .from(arPortalSession)
                .where(
                    and(
                        eq(arPortalSession.companyId, testCompanyId),
                        eq(arPortalSession.customerId, testCustomerId)
                    )
                );

            expect(sessions).toHaveLength(1);
            expect(sessions[0]?.token).toBeDefined();
            expect(sessions[0]?.expiresAt).toBeDefined();
        });

        it('should resolve valid token and mark as used', async () => {
            const portalService = new ArPortalService();

            // Create session first
            await portalService.initSession(
                testCompanyId,
                {
                    customer_id: testCustomerId,
                    email: 'test@example.com',
                    ttl_minutes: 60
                },
                testUserId
            );

            const sessions = await db
                .select()
                .from(arPortalSession)
                .where(eq(arPortalSession.companyId, testCompanyId));

            const token = sessions[0]!.token;

            // Resolve token
            const session = await portalService.resolveToken(token);

            expect(session).toBeDefined();
            expect(session?.companyId).toBe(testCompanyId);
            expect(session?.customerId).toBe(testCustomerId);

            // Verify token is marked as used
            const updatedSessions = await db
                .select()
                .from(arPortalSession)
                .where(eq(arPortalSession.token, token));

            expect(updatedSessions[0]?.usedAt).toBeDefined();
        });

        it('should reject expired token', async () => {
            const portalService = new ArPortalService();

            // Create expired session
            const expiredAt = new Date();
            expiredAt.setMinutes(expiredAt.getMinutes() - 1); // 1 minute ago

            await db.insert(arPortalSession).values({
                id: ulid(),
                companyId: testCompanyId,
                customerId: testCustomerId,
                token: 'expired-token',
                expiresAt: expiredAt,
                createdBy: testUserId,
            });

            const session = await portalService.resolveToken('expired-token');
            expect(session).toBeNull();
        });
    });

    describe('Surcharge Calculation', () => {
        it('should calculate surcharge with percentage, min, and cap', async () => {
            const surchargeService = new ArSurchargeService();

            // Set up surcharge policy
            await surchargeService.updatePolicy(
                testCompanyId,
                {
                    enabled: true,
                    pct: 0.03, // 3%
                    min_fee: 2.00,
                    cap_fee: 10.00
                },
                testUserId
            );

            // Test percentage calculation
            const surcharge1 = await surchargeService.calculateSurcharge(testCompanyId, 100);
            expect(surcharge1).toBe(3.00); // 3% of 100

            // Test minimum fee
            const surcharge2 = await surchargeService.calculateSurcharge(testCompanyId, 50);
            expect(surcharge2).toBe(2.00); // Min fee of 2

            // Test cap
            const surcharge3 = await surchargeService.calculateSurcharge(testCompanyId, 500);
            expect(surcharge3).toBe(10.00); // Cap of 10

            // Test disabled policy
            await surchargeService.updatePolicy(
                testCompanyId,
                {
                    enabled: false,
                    pct: 0.03,
                    min_fee: 2.00,
                    cap_fee: 10.00
                },
                testUserId
            );

            const surcharge4 = await surchargeService.calculateSurcharge(testCompanyId, 100);
            expect(surcharge4).toBe(0);
        });
    });

    describe('Checkout Intent & Confirmation', () => {
        beforeEach(async () => {
            // Create test invoice
            await db.insert(arInvoice).values({
                id: 'test-invoice',
                companyId: testCompanyId,
                customerId: testCustomerId,
                invoiceNo: 'INV-001',
                invoiceDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                grossAmount: '1000.00',
                paidAmount: '0.00',
                ccy: 'USD',
                status: 'OPEN',
                createdBy: testUserId,
            } as any);
        });

        it('should create checkout intent with surcharge', async () => {
            const checkoutService = new ArCheckoutService();

            // Set up surcharge policy
            const surchargeService = new ArSurchargeService();
            await surchargeService.updatePolicy(
                testCompanyId,
                {
                    enabled: true,
                    pct: 0.03,
                    min_fee: 2.00,
                    cap_fee: 10.00
                },
                testUserId
            );

            const result = await checkoutService.createIntent(
                testCompanyId,
                testCustomerId,
                {
                    token: 'test-token',
                    invoices: [{ invoice_id: 'test-invoice', amount: 1000 }],
                    present_ccy: 'USD',
                    gateway: 'STRIPE',
                    save_method: false
                },
                testUserId
            );

            expect(result.intent_id).toBeDefined();
            expect(result.amount).toBe(1000);
            expect(result.surcharge).toBe(10.00); // Capped at 10
            expect(result.total_amount).toBe(1010.00);
            expect(result.gateway).toBe('STRIPE');
        });

        it('should confirm checkout and process payment', async () => {
            const checkoutService = new ArCheckoutService();

            // Create intent first
            const intentResult = await checkoutService.createIntent(
                testCompanyId,
                testCustomerId,
                {
                    token: 'test-token',
                    invoices: [{ invoice_id: 'test-invoice', amount: 1000 }],
                    present_ccy: 'USD',
                    gateway: 'STRIPE',
                    save_method: false
                },
                testUserId
            );

            // Confirm intent
            const confirmResult = await checkoutService.confirmIntent(
                testCompanyId,
                {
                    intent_id: intentResult.intent_id,
                    gateway_payload: { payment_method: 'pm_test' }
                }
            );

            expect(confirmResult.success).toBe(true);
            expect(confirmResult.transaction_id).toBeDefined();
            expect(confirmResult.message).toContain('successfully');

            // Verify transaction was created
            const txns = await db
                .select()
                .from(arCheckoutTxn)
                .where(eq(arCheckoutTxn.intentId, intentResult.intent_id));

            expect(txns).toHaveLength(1);
            expect(txns[0]?.status).toBe('captured');
        });
    });

    describe('Self-Serve PTP & Disputes', () => {
        beforeEach(async () => {
            // Create test invoice
            await db.insert(arInvoice).values({
                id: 'test-invoice',
                companyId: testCompanyId,
                customerId: testCustomerId,
                invoiceNo: 'INV-001',
                invoiceDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                grossAmount: '1000.00',
                paidAmount: '0.00',
                ccy: 'USD',
                status: 'OPEN',
                createdBy: testUserId,
            } as any);
        });

        it('should create PTP from portal', async () => {
            const portalService = new ArPortalService();

            const result = await portalService.createPtp(
                testCompanyId,
                testCustomerId,
                'test-invoice',
                '2024-02-15',
                1000,
                'Cash flow issues'
            );

            expect(result.ptp_id).toBeDefined();
            expect(result.status).toBe('created');
            expect(result.message).toContain('successfully');

            // Verify PTP was created
            const ptps = await db
                .select()
                .from(arPtp)
                .where(eq(arPtp.companyId, testCompanyId));

            expect(ptps).toHaveLength(1);
            expect(ptps[0]?.customerId).toBe(testCustomerId);
            expect(ptps[0]?.invoiceId).toBe('test-invoice');
            expect(ptps[0]?.status).toBe('open');
        });

        it('should create dispute from portal', async () => {
            const portalService = new ArPortalService();

            const result = await portalService.createDispute(
                testCompanyId,
                testCustomerId,
                'test-invoice',
                'PRICING',
                'Price discrepancy'
            );

            expect(result.dispute_id).toBeDefined();
            expect(result.status).toBe('created');
            expect(result.message).toContain('successfully');

            // Verify dispute was created
            const disputes = await db
                .select()
                .from(arDispute)
                .where(eq(arDispute.companyId, testCompanyId));

            expect(disputes).toHaveLength(1);
            expect(disputes[0]?.customerId).toBe(testCustomerId);
            expect(disputes[0]?.invoiceId).toBe('test-invoice');
            expect(disputes[0]?.reasonCode).toBe('PRICING');
            expect(disputes[0]?.status).toBe('open');
        });
    });

    describe('Webhook Processing', () => {
        it('should process Stripe webhook successfully', async () => {
            const webhookService = new ArWebhookService();

            // Create test intent first
            await db.insert(arCheckoutIntent).values({
                id: 'test-intent',
                companyId: testCompanyId,
                customerId: testCustomerId,
                presentCcy: 'USD',
                amount: '1000.00',
                invoices: JSON.stringify([{ invoice_id: 'test-invoice', amount: 1000 }]),
                surcharge: '0.00',
                gateway: 'STRIPE',
                status: 'created',
                clientSecret: 'pi_test_123',
                createdBy: testUserId,
            });

            const result = await webhookService.processWebhook(
                testCompanyId,
                {
                    gateway: 'STRIPE',
                    payload: {
                        type: 'payment_intent.succeeded',
                        data: {
                            object: {
                                id: 'pi_test_123',
                                amount: 100000, // $1000 in cents
                                application_fee_amount: 300 // $3 fee
                            }
                        }
                    },
                    signature: 'valid_signature',
                    timestamp: Date.now()
                }
            );

            expect(result.success).toBe(true);
            expect(result.processed).toBe(true);

            // Verify transaction was created
            const txns = await db
                .select()
                .from(arCheckoutTxn)
                .where(eq(arCheckoutTxn.intentId, 'test-intent'));

            expect(txns).toHaveLength(1);
            expect(txns[0]?.status).toBe('captured');
        });

        it('should handle invalid webhook signature', async () => {
            const webhookService = new ArWebhookService();

            const result = await webhookService.processWebhook(
                testCompanyId,
                {
                    gateway: 'STRIPE',
                    payload: { type: 'test' },
                    signature: 'invalid_signature',
                    timestamp: Date.now()
                }
            );

            expect(result.success).toBe(false);
            expect(result.processed).toBe(false);
            expect(result.reason).toBe('Invalid signature');
        });
    });

    describe('Performance Tests', () => {
        it('should create intent within 250ms', async () => {
            const checkoutService = new ArCheckoutService();

            // Create test invoice
            await db.insert(arInvoice).values({
                id: 'perf-invoice',
                companyId: testCompanyId,
                customerId: testCustomerId,
                invoiceNo: 'INV-PERF',
                invoiceDate: new Date('2024-01-01'),
                dueDate: new Date('2024-01-31'),
                grossAmount: '1000.00',
                paidAmount: '0.00',
                ccy: 'USD',
                status: 'OPEN',
                createdBy: testUserId,
            } as any);

            const startTime = Date.now();

            await checkoutService.createIntent(
                testCompanyId,
                testCustomerId,
                {
                    token: 'perf-token',
                    invoices: [{ invoice_id: 'perf-invoice', amount: 1000 }],
                    present_ccy: 'USD',
                    gateway: 'STRIPE',
                    save_method: false
                },
                testUserId
            );

            const duration = Date.now() - startTime;
            expect(duration).toBeLessThan(250);
        });
    });
});
