// M01: Core Ledger - Accounts Port
// Dependency inversion - Interfaces for adapters and services

import type {
    Account,
    CreateAccountRequest,
    UpdateAccountRequest,
    AccountResponse,
    AccountHierarchyResponse,
    ReparentValidationResponse,
    SearchFilters,
} from '@aibos/contracts';

// ===== Repository Interface (Data Access) =====

export interface AccountsRepository {
    create(data: CreateAccountRequest): Promise<Account>;
    findById(id: number): Promise<Account | null>;
    findByCode(code: string): Promise<Account | null>;
    findChildren(parentId: number): Promise<Account[]>;
    findHierarchy(): Promise<Account[]>;
    search(query: string, filters?: SearchFilters): Promise<Account[]>;
    update(id: number, data: UpdateAccountRequest): Promise<Account>;
    archive(id: number, reason?: string): Promise<Account>;
    reparent(accountId: number, newParentId: number | null): Promise<Account>;
}

// ===== Service Interface (Business Logic) =====

export interface AccountsService {
    createAccount(data: CreateAccountRequest): Promise<AccountResponse>;
    getAccount(id: number): Promise<AccountResponse>;
    getAccountByCode(code: string): Promise<AccountResponse>;
    getAccountChildren(parentId: number): Promise<AccountResponse[]>;
    getAccountHierarchy(): Promise<AccountHierarchyResponse>;
    searchAccounts(query: string, filters?: SearchFilters): Promise<AccountResponse[]>;
    updateAccount(id: number, data: UpdateAccountRequest): Promise<AccountResponse>;
    archiveAccount(id: number, reason?: string): Promise<void>;
    reparentAccount(accountId: number, newParentId: number | null): Promise<AccountResponse>;
    validateReparent(accountId: number, newParentId: number | null): Promise<ReparentValidationResponse>;
}

// ===== Utility Interfaces =====

export interface Logger {
    info(message: string, context?: Record<string, any>): void;
    warn(message: string, context?: Record<string, any>): void;
    error(message: string, error?: Error, context?: Record<string, any>): void;
    debug(message: string, context?: Record<string, any>): void;
}
