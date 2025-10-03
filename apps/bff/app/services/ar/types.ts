// AR Service Types - Clean Implementation
// ======================================

export interface ArInvoice {
    id: string;
    customerId: string;
    customerName: string;
    invoiceNo: string;
    invoiceDate: string;
    dueDate: string;
    amount: number;
    currency: string;
    daysOverdue: number;
    bucket: string;
}

export interface RemittanceRow {
    date: string;
    currency: string;
    amount: number;
    references: string[];
}

export interface MatchResult {
    invoiceId: string;
    matchAmount: number;
    confidence: number;
    reason: string;
}

export interface DunningContext {
    companyId: string;
    customerId: string;
    customerName: string;
    invoices: ArInvoice[];
    totalDue: number;
    oldestDays: number;
    bucket: string;
}

export interface PtpRecord {
    id: string;
    companyId: string;
    customerId: string;
    invoiceId: string;
    promisedDate: string;
    amount: number;
    reason?: string;
    status: 'open' | 'kept' | 'broken' | 'cancelled';
    createdAt: string;
    createdBy: string;
    decidedAt?: string;
    decidedBy?: string;
}

export interface DisputeRecord {
    id: string;
    companyId: string;
    customerId: string;
    invoiceId: string;
    reasonCode: string;
    detail?: string;
    status: 'open' | 'resolved' | 'written_off';
    createdAt: string;
    createdBy: string;
    resolvedAt?: string;
    resolvedBy?: string;
}

// Service Result Types
export interface ServiceResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    warnings?: string[];
}

export interface CashApplicationResult {
    totalProcessed: number;
    matched: number;
    partial: number;
    unmatched: number;
    errors: number;
}

export interface DunningRunResult {
    runId: string;
    customersProcessed: number;
    emailsSent: number;
    webhooksSent: number;
    errors: number;
    dryRun: boolean;
}
