// M01: Core Ledger - Accounts Contracts
// Clean architecture - Type-safe contracts

import { z } from 'zod';

// ===== Domain Types =====

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type NormalBalance = 'DEBIT' | 'CREDIT';

// ===== Request/Response Types =====

export interface CreateAccountRequest {
    code: string;
    name: string;
    parentCode?: string;
    accountType: AccountType;
    currency?: string;
    requireCostCenter?: boolean;
    requireProject?: boolean;
    class?: string;
}

export interface UpdateAccountRequest {
    code?: string;
    name?: string;
    parentCode?: string;
    accountType?: AccountType;
    currency?: string;
    requireCostCenter?: boolean;
    requireProject?: boolean;
    class?: string;
}

export interface AccountResponse {
    id: string;
    code: string;
    name: string;
    parentCode?: string;
    accountType: string;
    normalBalance: string;
    requireCostCenter: boolean;
    requireProject: boolean;
    class?: string;
    createdAt: string;
    updatedAt: string;
}

export interface AccountHierarchyResponse {
    accounts: AccountResponse[];
    hierarchy: AccountHierarchyNode[];
}

export interface AccountHierarchyNode extends AccountResponse {
    children: AccountHierarchyNode[];
}

export interface ReparentValidationResponse {
    valid: boolean;
    message: string;
}

export interface SearchFilters {
    accountType?: string;
    currency?: string;
    isActive?: boolean;
}

// ===== Validation Schemas =====

export const createAccountSchema = z.object({
    code: z.string()
        .min(3, 'Account code must be at least 3 characters')
        .max(50, 'Account code must be at most 50 characters')
        .regex(/^[A-Z0-9-]+$/, 'Account code must contain only uppercase letters, numbers, and hyphens'),
    name: z.string()
        .min(5, 'Account name must be at least 5 characters')
        .max(255, 'Account name must be at most 255 characters'),
    parentCode: z.string().optional(),
    accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
    requireCostCenter: z.boolean().default(false),
    requireProject: z.boolean().default(false),
    class: z.string().optional(),
});

export const updateAccountSchema = z.object({
    code: z.string()
        .min(3, 'Account code must be at least 3 characters')
        .max(50, 'Account code must be at most 50 characters')
        .regex(/^[A-Z0-9-]+$/, 'Account code must contain only uppercase letters, numbers, and hyphens')
        .optional(),
    name: z.string()
        .min(5, 'Account name must be at least 5 characters')
        .max(255, 'Account name must be at most 255 characters')
        .optional(),
    parentCode: z.string().optional(),
    accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).optional(),
    requireCostCenter: z.boolean().optional(),
    requireProject: z.boolean().optional(),
    class: z.string().optional(),
});

export const accountResponseSchema = z.object({
    id: z.number(),
    code: z.string(),
    name: z.string(),
    parentId: z.number().optional(),
    accountType: z.string(),
    normalBalance: z.string(),
    currency: z.string(),
    isActive: z.boolean(),
    allowPosting: z.boolean(),
    level: z.number(),
    effectiveStartDate: z.string(),
    effectiveEndDate: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string()
});

export const reparentRequestSchema = z.object({
    accountId: z.number().positive(),
    newParentId: z.number().positive().nullable()
});

// ===== Domain Entity (Internal) =====

export interface Account {
    id: string;
    companyId: string;
    code: string;
    name: string;
    type: string;
    normalBalance: string;
    parentCode?: string | null;
    requireCostCenter: boolean;
    requireProject: boolean;
    class?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// ===== Custom Errors =====

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
    }
}

export class BusinessError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BusinessError';
    }
}
