import { db } from "@/lib/db";
import { ulid } from "ulid";
import { eq, and, gte, desc } from "drizzle-orm";
import {
    arPortalSession,
    arInvoice,
    arSavedMethod,
    arPtp,
    arDispute
} from "@aibos/db-adapter/schema";
import type {
    PortalInitReqType,
    PortalInvoicesResType,
    PortalInvoiceType
} from "@aibos/contracts";
import { env } from "@/lib/env";
import { randomBytes } from "crypto";
import { emailService } from "../email/portal";

export class ArPortalService {
    constructor(private dbInstance = db) { }

    /**
     * Initialize portal session and send magic link
     */
    async initSession(
        companyId: string,
        req: PortalInitReqType,
        createdBy: string
    ): Promise<{ success: boolean; message: string }> {
        // Generate secure token
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + req.ttl_minutes);

        // Create session
        const sessionId = ulid();
        await this.dbInstance.insert(arPortalSession).values({
            id: sessionId,
            companyId,
            customerId: req.customer_id,
            token,
            expiresAt,
            createdBy,
        });

        // Generate magic link
        const baseUrl = env.PORTAL_BASE_URL;
        const magicLink = `${baseUrl}?token=${token}`;

        // Send magic link email via M15.2 email service
        try {
            const emailResult = await emailService.sendMagicLink(
                req.email,
                magicLink,
                undefined, // customer name not available in request
                'AI-BOS' // TODO: Get actual company name
            );

            if (!emailResult.success) {
                console.error('Failed to send magic link email:', emailResult.error);
                // Don't fail the session creation, just log the error
            }
        } catch (error) {
            console.error('Email service error:', error);
            // Don't fail the session creation, just log the error
        }

        return {
            success: true,
            message: `Portal link sent to ${req.email}`
        };
    }

    /**
     * Resolve token and get customer view
     */
    async resolveToken(token: string): Promise<{
        companyId: string;
        customerId: string;
        sessionId: string;
        expiresAt: Date;
    } | null> {
        const now = new Date();

        const sessions = await this.dbInstance
            .select()
            .from(arPortalSession)
            .where(
                and(
                    eq(arPortalSession.token, token),
                    gte(arPortalSession.expiresAt, now)
                )
            )
            .limit(1);

        if (sessions.length === 0) {
            return null;
        }

        const session = sessions[0]!;

        // Mark as used (single-use token)
        await this.dbInstance
            .update(arPortalSession)
            .set({ usedAt: now })
            .where(eq(arPortalSession.id, session.id));

        return {
            companyId: session.companyId,
            customerId: session.customerId,
            sessionId: session.id,
            expiresAt: session.expiresAt
        };
    }

    /**
     * List customer invoices
     */
    async listInvoices(
        companyId: string,
        customerId: string,
        includePaid: boolean = false
    ): Promise<PortalInvoicesResType> {
        // Get invoices
        const conditions = [
            eq(arInvoice.companyId, companyId),
            eq(arInvoice.customerId, customerId)
        ];

        if (!includePaid) {
            conditions.push(eq(arInvoice.status, 'OPEN'));
        }

        const invoices = await this.dbInstance
            .select()
            .from(arInvoice)
            .where(and(...conditions))
            .orderBy(desc(arInvoice.invoiceDate));

        // Get default payment method
        const defaultMethod = await this.dbInstance
            .select()
            .from(arSavedMethod)
            .where(
                and(
                    eq(arSavedMethod.companyId, companyId),
                    eq(arSavedMethod.customerId, customerId),
                    eq(arSavedMethod.isDefault, true)
                )
            )
            .limit(1);

        // Transform invoices
        const portalInvoices: PortalInvoiceType[] = invoices.map(inv => ({
            id: inv.id,
            invoice_no: inv.invoiceNo,
            invoice_date: inv.invoiceDate.toString().split('T')[0]!,
            due_date: inv.dueDate.toString().split('T')[0]!,
            gross_amount: parseFloat(inv.grossAmount),
            paid_amount: parseFloat(inv.paidAmount),
            remaining_amount: parseFloat(inv.grossAmount) - parseFloat(inv.paidAmount),
            ccy: inv.ccy,
            status: inv.status as 'OPEN' | 'PAID' | 'CANCELLED' | 'VOID',
            portal_link: inv.portalLink || undefined
        }));

        return {
            invoices: portalInvoices,
            customer_name: `Customer ${customerId}`, // TODO: Get from customer table
            default_method: defaultMethod.length > 0 ? {
                id: defaultMethod[0]!.id,
                brand: defaultMethod[0]!.brand || 'unknown',
                last4: defaultMethod[0]!.last4 || '****',
                exp_month: defaultMethod[0]!.expMonth || undefined,
                exp_year: defaultMethod[0]!.expYear || undefined
            } : undefined
        };
    }

    /**
     * Create PTP from portal
     */
    async createPtp(
        companyId: string,
        customerId: string,
        invoiceId: string,
        promisedDate: string,
        amount: number,
        note?: string
    ): Promise<{ ptp_id: string; status: string; message: string }> {
        const ptpId = ulid();

        await this.dbInstance.insert(arPtp).values({
            id: ptpId,
            companyId,
            customerId,
            invoiceId,
            promisedDate,
            amount: amount.toString(),
            reason: note || null,
            status: 'open',
            createdBy: 'portal-user'
        });

        return {
            ptp_id: ptpId,
            status: 'created',
            message: 'Promise-to-pay created successfully'
        };
    }

    /**
     * Create dispute from portal
     */
    async createDispute(
        companyId: string,
        customerId: string,
        invoiceId: string,
        reasonCode: string,
        detail?: string
    ): Promise<{ dispute_id: string; status: string; message: string }> {
        const disputeId = ulid();

        await this.dbInstance.insert(arDispute).values({
            id: disputeId,
            companyId,
            customerId,
            invoiceId,
            reasonCode: reasonCode as 'PRICING' | 'SERVICE' | 'GOODS' | 'ADMIN',
            detail: detail || null,
            status: 'open',
            createdBy: 'portal-user'
        });

        return {
            dispute_id: disputeId,
            status: 'created',
            message: 'Dispute created successfully'
        };
    }
}
