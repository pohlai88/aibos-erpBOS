import { db } from "@/lib/db";
import { ulid } from "ulid";
import { randomBytes } from "crypto";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import {
    arPortalLedgerToken,
    arStatementLine,
    arStatementArtifact,
    arStatementRun
} from "@aibos/db-adapter/schema";
import type {
    PortalLedgerReqType,
    PortalLedgerResType
} from "@aibos/contracts";

export class ArPortalLedgerService {
    constructor(private dbInstance = db) { }

    /**
     * Validate portal ledger token
     */
    async validateToken(token: string): Promise<{
        companyId: string;
        customerId: string;
    } | null> {
        const tokenRecord = await this.dbInstance
            .select()
            .from(arPortalLedgerToken)
            .where(eq(arPortalLedgerToken.token, token))
            .limit(1);

        if (tokenRecord.length === 0) {
            return null;
        }

        const tokenData = tokenRecord[0];
        if (!tokenData || tokenData.expiresAt < new Date()) {
            return null;
        }

        return {
            companyId: tokenData.companyId,
            customerId: tokenData.customerId
        };
    }

    /**
     * Generate portal ledger token
     */
    async generateLedgerToken(
        companyId: string,
        customerId: string,
        createdBy: string,
        ttlMinutes: number = 60
    ): Promise<{ token: string; expiresAt: Date }> {
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + ttlMinutes);

        await this.dbInstance.insert(arPortalLedgerToken).values({
            id: ulid(),
            companyId,
            customerId,
            token,
            expiresAt,
            createdBy,
        });

        return { token, expiresAt };
    }

    /**
     * Get customer ledger via token
     */
    async getCustomerLedger(req: PortalLedgerReqType): Promise<PortalLedgerResType> {
        // Validate token
        const tokenRecord = await this.dbInstance
            .select()
            .from(arPortalLedgerToken)
            .where(eq(arPortalLedgerToken.token, req.token))
            .limit(1);

        if (tokenRecord.length === 0) {
            throw new Error("Invalid token");
        }

        const token = tokenRecord[0];
        if (!token || token.expiresAt < new Date()) {
            throw new Error("Token expired");
        }

        // Get latest statement run for this customer
        const latestRun = await this.dbInstance
            .select()
            .from(arStatementRun)
            .where(
                and(
                    eq(arStatementRun.companyId, token.companyId),
                    eq(arStatementRun.status, "finalized")
                )
            )
            .orderBy(desc(arStatementRun.asOfDate))
            .limit(1);

        if (latestRun.length === 0) {
            throw new Error("No statements available");
        }

        const run = latestRun[0];
        if (!run) {
            throw new Error("No statement run found for customer");
        }

        // Build date filters
        const filters = [eq(arStatementLine.runId, run.id)];

        if (req.since) {
            filters.push(gte(arStatementLine.docDate, req.since));
        }
        if (req.until) {
            filters.push(lte(arStatementLine.docDate, req.until));
        }

        // Get statement lines for this customer
        const lines = await this.dbInstance
            .select()
            .from(arStatementLine)
            .where(
                and(
                    eq(arStatementLine.companyId, token.companyId),
                    eq(arStatementLine.customerId, token.customerId),
                    ...filters
                )
            )
            .orderBy(arStatementLine.docDate, arStatementLine.sortKey);

        // Filter out disputes if requested
        const filteredLines = req.include_disputes
            ? lines
            : lines.filter(line => line.docType !== "DISPUTE_HOLD");

        // Calculate opening and closing balances
        const openingBalance = filteredLines.length > 0 ? Number(filteredLines[0]!.balance) - Number(filteredLines[0]!.debit) + Number(filteredLines[0]!.credit) : 0;
        const closingBalance = filteredLines.length > 0 ? Number(filteredLines[filteredLines.length - 1]!.balance) : 0;

        // Get latest statement artifacts
        const artifacts = await this.dbInstance
            .select()
            .from(arStatementArtifact)
            .where(
                and(
                    eq(arStatementArtifact.runId, run.id),
                    eq(arStatementArtifact.customerId, token.customerId)
                )
            );

        const pdfArtifact = artifacts.find(a => a.kind === "PDF");
        const csvArtifact = artifacts.find(a => a.kind === "CSV");

        return {
            customer_id: token.customerId,
            as_of_date: run.asOfDate,
            present_ccy: run.presentCcy,
            opening_balance: openingBalance,
            closing_balance: closingBalance,
            lines: filteredLines.map(line => ({
                doc_type: line.docType,
                doc_date: line.docDate,
                due_date: line.dueDate || undefined,
                ref: line.ref || undefined,
                memo: line.memo || undefined,
                debit: Number(line.debit),
                credit: Number(line.credit),
                balance: Number(line.balance),
                bucket: line.bucket,
                currency: line.currency
            })),
            latest_statement: {
                pdf_url: pdfArtifact ? `/api/ar/statements/artifacts/${pdfArtifact.id}` : undefined,
                csv_url: csvArtifact ? `/api/ar/statements/artifacts/${csvArtifact.id}` : undefined,
                as_of_date: run.asOfDate
            }
        };
    }

    /**
     * Get latest statement artifacts for a customer via token
     */
    async getLatestStatementArtifacts(token: string): Promise<{
        pdf_url?: string;
        csv_url?: string;
        as_of_date: string;
    }> {
        // Validate token
        const tokenData = await this.validateToken(token);
        if (!tokenData) {
            throw new Error("Invalid or expired token");
        }

        // Get latest statement run for this customer
        const run = await this.dbInstance
            .select()
            .from(arStatementRun)
            .where(
                and(
                    eq(arStatementRun.companyId, tokenData.companyId),
                    eq(arStatementRun.status, "finalized")
                )
            )
            .orderBy(desc(arStatementRun.createdAt))
            .limit(1);

        if (run.length === 0) {
            throw new Error("No finalized statement run found");
        }

        const latestRun = run[0]!;

        // Get artifacts for this customer from the latest run
        const artifacts = await this.dbInstance
            .select()
            .from(arStatementArtifact)
            .where(
                and(
                    eq(arStatementArtifact.runId, latestRun.id),
                    eq(arStatementArtifact.customerId, tokenData.customerId)
                )
            );

        const pdfArtifact = artifacts.find(a => a.kind === "PDF");
        const csvArtifact = artifacts.find(a => a.kind === "CSV");

        return {
            ...(pdfArtifact?.id && { pdf_url: `/api/ar/statements/artifacts/${pdfArtifact.id}` }),
            ...(csvArtifact?.id && { csv_url: `/api/ar/statements/artifacts/${csvArtifact.id}` }),
            as_of_date: latestRun.asOfDate
        };
    }
}
