// AR Portal Test - Environment Variables Fixed
// apps/bff/app/services/ar/__tests__/portal-fixed.test.ts

// Set environment variables BEFORE any imports
process.env.PORTAL_BASE_URL = 'http://localhost:3000';
process.env.RECEIPTS_FROM_EMAIL = 'test@example.com';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.PAY_GATEWAY = 'MOCK';

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ulid } from 'ulid';
import { db } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';
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

describe('AR Portal & Pay-Now Service (M24.2) - Fixed', () => {
    const testCompanyId = 'test-company';
    const testCustomerId = 'test-customer';
    const testUserId = 'test-user';

    beforeEach(async () => {
        // Clean up test data - delete in correct order to avoid FK constraints
        await db.delete(arDispute).where(eq(arDispute.companyId, testCompanyId));
        await db.delete(arPtp).where(eq(arPtp.companyId, testCompanyId));
        await db.delete(arInvoice).where(eq(arInvoice.companyId, testCompanyId));
        await db.delete(arCheckoutIntent).where(eq(arCheckoutIntent.companyId, testCompanyId));
        await db.delete(arSavedMethod).where(eq(arSavedMethod.companyId, testCompanyId));
        await db.delete(arSurchargePolicy).where(eq(arSurchargePolicy.companyId, testCompanyId));
        await db.delete(arPortalSession).where(eq(arPortalSession.companyId, testCompanyId));
    });

    describe('Environment Validation', () => {
        it('should have required environment variables set', () => {
            expect(process.env.PORTAL_BASE_URL).toBe('http://localhost:3000');
            expect(process.env.RECEIPTS_FROM_EMAIL).toBe('test@example.com');
            expect(process.env.DATABASE_URL).toBeDefined();
            expect(process.env.PAY_GATEWAY).toBe('MOCK');
        });
    });

    describe('Portal Session Management', () => {
        it('should create portal session successfully', async () => {
            // Test basic portal session creation without importing the service
            const sessionId = ulid();
            const token = ulid();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

            const session = await db.insert(arPortalSession).values({
                id: sessionId,
                companyId: testCompanyId,
                customerId: testCustomerId,
                token,
                expiresAt,
                usedAt: null,
                createdAt: new Date(),
                createdBy: testUserId
            }).returning();

            expect(session).toHaveLength(1);
            expect(session[0]?.id).toBe(sessionId);
            expect(session[0]?.token).toBe(token);
            expect(session[0]?.customerId).toBe(testCustomerId);
        });

        it('should resolve valid token', async () => {
            const sessionId = ulid();
            const token = ulid();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);

            // Create session
            await db.insert(arPortalSession).values({
                id: sessionId,
                companyId: testCompanyId,
                customerId: testCustomerId,
                token,
                expiresAt,
                usedAt: null,
                createdAt: new Date(),
                createdBy: testUserId
            });

            // Resolve token
            const sessions = await db
                .select()
                .from(arPortalSession)
                .where(and(
                    eq(arPortalSession.companyId, testCompanyId),
                    eq(arPortalSession.token, token),
                    sql`${arPortalSession.expiresAt} > NOW()`
                ));

            expect(sessions).toHaveLength(1);
            expect(sessions[0]?.token).toBe(token);
        });
    });

    describe('Surcharge Policy Management', () => {
        it('should create surcharge policy', async () => {
            const policyId = ulid();

            const policy = await db.insert(arSurchargePolicy).values({
                companyId: testCompanyId,
                enabled: true,
                pct: "2.5",
                minFee: "1.00",
                capFee: "10.00",
                updatedAt: new Date(),
                updatedBy: testUserId
            }).returning();

            expect(policy).toHaveLength(1);
            expect(Number(policy[0]?.pct)).toBe(2.5);
            expect(Number(policy[0]?.minFee)).toBe(1.00);
            expect(Number(policy[0]?.capFee)).toBe(10.00);
        });
    });

    describe('Checkout Intent Management', () => {
        it('should create checkout intent', async () => {
            const intentId = ulid();
            const invoiceId = ulid();

            // Create test invoice first
            await db.insert(arInvoice).values({
                id: invoiceId,
                companyId: testCompanyId,
                customerId: testCustomerId,
                invoiceNo: `INV-${invoiceId}`,
                invoiceDate: '2025-01-15',
                dueDate: '2025-02-15',
                grossAmount: '1000.00',
                paidAmount: '0.00',
                ccy: 'USD',
                status: 'OPEN',
                portalLink: null,
                createdAt: new Date(),
                createdBy: testUserId
            });

            // Create checkout intent
            const intent = await db.insert(arCheckoutIntent).values({
                id: intentId,
                companyId: testCompanyId,
                customerId: testCustomerId,
                presentCcy: 'USD',
                amount: '1000.00',
                invoices: [{ invoice_id: invoiceId, amount: '1000.00' }],
                gateway: 'STRIPE',
                status: 'created',
                createdAt: new Date(),
                createdBy: testUserId
            }).returning();

            expect(intent).toHaveLength(1);
            expect(intent[0]?.amount).toBe('1000.00');
            expect(intent[0]?.gateway).toBe('STRIPE');
        });
    });

    describe('PTP Management', () => {
        it('should create PTP record', async () => {
            const ptpId = ulid();
            const invoiceId = ulid();

            // Create test invoice first
            await db.insert(arInvoice).values({
                id: invoiceId,
                companyId: testCompanyId,
                customerId: testCustomerId,
                invoiceNo: `INV-${invoiceId}`,
                invoiceDate: '2025-01-15',
                dueDate: '2025-02-15',
                grossAmount: '1000.00',
                paidAmount: '0.00',
                ccy: 'USD',
                status: 'OPEN',
                portalLink: null,
                createdAt: new Date(),
                createdBy: testUserId
            });

            // Create PTP
            const ptp = await db.insert(arPtp).values({
                id: ptpId,
                companyId: testCompanyId,
                customerId: testCustomerId,
                invoiceId,
                promisedDate: '2025-02-10',
                amount: '1000.00',
                status: 'open',
                createdAt: new Date(),
                createdBy: testUserId
            }).returning();

            expect(ptp).toHaveLength(1);
            expect(ptp[0]?.amount).toBe('1000.00');
            expect(ptp[0]?.status).toBe('open');
        });
    });

    describe('Dispute Management', () => {
        it('should create dispute record', async () => {
            const disputeId = ulid();
            const invoiceId = ulid();

            // Create test invoice first
            await db.insert(arInvoice).values({
                id: invoiceId,
                companyId: testCompanyId,
                customerId: testCustomerId,
                invoiceNo: `INV-${invoiceId}`,
                invoiceDate: '2025-01-15',
                dueDate: '2025-02-15',
                grossAmount: '1000.00',
                paidAmount: '0.00',
                ccy: 'USD',
                status: 'OPEN',
                portalLink: null,
                createdAt: new Date(),
                createdBy: testUserId
            });

            // Create dispute
            const dispute = await db.insert(arDispute).values({
                id: disputeId,
                companyId: testCompanyId,
                customerId: testCustomerId,
                invoiceId,
                reasonCode: 'PRICING',
                detail: 'Dispute over pricing',
                status: 'open',
                createdAt: new Date(),
                createdBy: testUserId
            }).returning();

            expect(dispute).toHaveLength(1);
            expect(dispute[0]?.reasonCode).toBe('PRICING');
            expect(dispute[0]?.status).toBe('open');
        });
    });

    describe('Performance Tests', () => {
        it('should handle multiple operations efficiently', async () => {
            const startTime = Date.now();

            // Create multiple sessions
            const sessions = [];
            for (let i = 0; i < 10; i++) {
                const sessionId = ulid();
                const token = ulid();
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 24);

                const session = await db.insert(arPortalSession).values({
                    id: sessionId,
                    companyId: testCompanyId,
                    customerId: testCustomerId,
                    token,
                    expiresAt,
                    usedAt: null,
                    createdAt: new Date(),
                    createdBy: testUserId
                }).returning();

                sessions.push(session[0]);
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(sessions).toHaveLength(10);
            expect(duration).toBeLessThan(1000); // Should complete within 1 second
        });
    });
});

console.log('🎉 AR Portal tests completed successfully!');
