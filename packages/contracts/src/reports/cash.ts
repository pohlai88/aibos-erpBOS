export type CashMoney = { currency: string; amount: number };

export type CashReportLine = {
    id: string;
    name: string;
    values: CashMoney[];   // month buckets or segments
    total: CashMoney;      // precomputed total
};

export type CashReport = {
    companyId: string;
    period: { year: number; month?: number };
    lines: CashReportLine[];
};
