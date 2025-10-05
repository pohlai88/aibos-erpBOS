import { z } from "zod";
export declare const BudgetImportMapping: z.ZodObject<{
    account_code: z.ZodString;
    month: z.ZodString;
    amount: z.ZodString;
    cost_center: z.ZodOptional<z.ZodString>;
    project: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    month: string;
    amount: string;
    account_code: string;
    cost_center?: string | undefined;
    project?: string | undefined;
}, {
    month: string;
    amount: string;
    account_code: string;
    cost_center?: string | undefined;
    project?: string | undefined;
}>;
export declare const BudgetImportDefaults: z.ZodObject<{
    currency: z.ZodString;
    year: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    year: number;
    currency: string;
}, {
    year: number;
    currency: string;
}>;
export declare const BudgetImportRequest: z.ZodObject<{
    mapping: z.ZodObject<{
        account_code: z.ZodString;
        month: z.ZodString;
        amount: z.ZodString;
        cost_center: z.ZodOptional<z.ZodString>;
        project: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        month: string;
        amount: string;
        account_code: string;
        cost_center?: string | undefined;
        project?: string | undefined;
    }, {
        month: string;
        amount: string;
        account_code: string;
        cost_center?: string | undefined;
        project?: string | undefined;
    }>;
    defaults: z.ZodObject<{
        currency: z.ZodString;
        year: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        year: number;
        currency: string;
    }, {
        year: number;
        currency: string;
    }>;
    precision: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    mapping: {
        month: string;
        amount: string;
        account_code: string;
        cost_center?: string | undefined;
        project?: string | undefined;
    };
    defaults: {
        year: number;
        currency: string;
    };
    precision: number;
}, {
    mapping: {
        month: string;
        amount: string;
        account_code: string;
        cost_center?: string | undefined;
        project?: string | undefined;
    };
    defaults: {
        year: number;
        currency: string;
    };
    precision?: number | undefined;
}>;
export declare const BudgetImportError: z.ZodObject<{
    row: z.ZodNumber;
    issues: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    issues: string[];
    row: number;
}, {
    issues: string[];
    row: number;
}>;
export declare const BudgetImportSummary: z.ZodObject<{
    importId: z.ZodString;
    source_name: z.ZodString;
    rows_total: z.ZodNumber;
    rows_valid: z.ZodNumber;
    rows_invalid: z.ZodNumber;
    status: z.ZodEnum<["pending", "dry_run_ok", "committed", "failed"]>;
    errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        row: z.ZodNumber;
        issues: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        issues: string[];
        row: number;
    }, {
        issues: string[];
        row: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "dry_run_ok" | "committed" | "failed";
    importId: string;
    source_name: string;
    rows_total: number;
    rows_valid: number;
    rows_invalid: number;
    errors?: {
        issues: string[];
        row: number;
    }[] | undefined;
}, {
    status: "pending" | "dry_run_ok" | "committed" | "failed";
    importId: string;
    source_name: string;
    rows_total: number;
    rows_valid: number;
    rows_invalid: number;
    errors?: {
        issues: string[];
        row: number;
    }[] | undefined;
}>;
export declare const BudgetImportResponse: z.ZodObject<{
    summary: z.ZodObject<{
        importId: z.ZodString;
        source_name: z.ZodString;
        rows_total: z.ZodNumber;
        rows_valid: z.ZodNumber;
        rows_invalid: z.ZodNumber;
        status: z.ZodEnum<["pending", "dry_run_ok", "committed", "failed"]>;
        errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
            row: z.ZodNumber;
            issues: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            issues: string[];
            row: number;
        }, {
            issues: string[];
            row: number;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        status: "pending" | "dry_run_ok" | "committed" | "failed";
        importId: string;
        source_name: string;
        rows_total: number;
        rows_valid: number;
        rows_invalid: number;
        errors?: {
            issues: string[];
            row: number;
        }[] | undefined;
    }, {
        status: "pending" | "dry_run_ok" | "committed" | "failed";
        importId: string;
        source_name: string;
        rows_total: number;
        rows_valid: number;
        rows_invalid: number;
        errors?: {
            issues: string[];
            row: number;
        }[] | undefined;
    }>;
    errors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        row: z.ZodNumber;
        issues: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        issues: string[];
        row: number;
    }, {
        issues: string[];
        row: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    summary: {
        status: "pending" | "dry_run_ok" | "committed" | "failed";
        importId: string;
        source_name: string;
        rows_total: number;
        rows_valid: number;
        rows_invalid: number;
        errors?: {
            issues: string[];
            row: number;
        }[] | undefined;
    };
    errors?: {
        issues: string[];
        row: number;
    }[] | undefined;
}, {
    summary: {
        status: "pending" | "dry_run_ok" | "committed" | "failed";
        importId: string;
        source_name: string;
        rows_total: number;
        rows_valid: number;
        rows_invalid: number;
        errors?: {
            issues: string[];
            row: number;
        }[] | undefined;
    };
    errors?: {
        issues: string[];
        row: number;
    }[] | undefined;
}>;
export type BudgetImportRequest = z.infer<typeof BudgetImportRequest>;
export type BudgetImportMapping = z.infer<typeof BudgetImportMapping>;
export type BudgetImportDefaults = z.infer<typeof BudgetImportDefaults>;
export type BudgetImportError = z.infer<typeof BudgetImportError>;
export type BudgetImportSummary = z.infer<typeof BudgetImportSummary>;
export type BudgetImportResponse = z.infer<typeof BudgetImportResponse>;
