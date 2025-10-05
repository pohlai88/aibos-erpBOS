// TEMP: Remove once @aibos/contracts exports these types.

export type SalesInvoice = {
    id: string;
    company_id: string;
    currency: string;
    doc_date: string;
    lines: Array<{ account: string; amount: number }>;
    [k: string]: unknown;
};

export type PurchaseInvoice = {
    id: string;
    company_id: string;
    currency: string;
    doc_date: string;
    lines: Array<{ account: string; amount: number }>;
    [k: string]: unknown;
};
