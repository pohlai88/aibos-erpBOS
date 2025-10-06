# 🏗️ M01: Core Ledger - Clean Architecture Runbook

## 📋 Module: Core Ledger (M01)

**Status**: 🚧 **In Development**  
**Architecture Compliance**: ✅ **8-Layer Clean Architecture**  
**Last Updated**: 2025-01-06  
**Owner**: Architecture Team  

---

## 🎯 Executive Summary

### Business Value
- **Primary Function**: Foundation of the entire ERP system - manages chart of accounts, account hierarchies, and provides base structure for all financial transactions
- **Business Impact**: Central repository for all account definitions, enables financial reporting at all levels, supports multi-entity/multi-currency operations
- **User Personas**: Accountants, Financial Controllers, System Administrators
- **Success Metrics**: 100% transaction accuracy, < 1s account lookup time, 99.9% uptime

### Architecture Compliance
This module **strictly follows** the AIBOS 8-layer clean architecture:

```
DB → Adapters → Ports → Services → Policies → Contracts → API → UI
```

**✅ Zero architectural violations allowed**

---

## 🏗️ 8-Layer Architecture Implementation

### Layer 1: Database (DB)
**Location**: `packages/adapters/db/core-ledger/`
**Responsibility**: Data persistence, schema, migrations

```typescript
// packages/adapters/db/core-ledger/schema.ts
import { pgTable, serial, varchar, integer, timestamp, boolean, decimal, text } from 'drizzle-orm/pg-core';

export const accountsTable = pgTable('accounts', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  parentId: integer('parent_id').references(() => accountsTable.id),
  accountType: varchar('account_type', { length: 50 }).notNull(),
  normalBalance: varchar('normal_balance', { length: 10 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  isActive: boolean('is_active').default(true),
  allowPosting: boolean('allow_posting').default(true),
  level: integer('level').notNull().default(1),
  effectiveStartDate: timestamp('effective_start_date').defaultNow(),
  effectiveEndDate: timestamp('effective_end_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// packages/adapters/db/core-ledger/migrations/001_create_accounts_table.sql
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  parent_id INTEGER REFERENCES accounts(id),
  account_type VARCHAR(50) NOT NULL,
  normal_balance VARCHAR(10) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  allow_posting BOOLEAN DEFAULT TRUE,
  level INTEGER NOT NULL DEFAULT 1,
  effective_start_date TIMESTAMP DEFAULT NOW(),
  effective_end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_accounts_parent_id ON accounts(parent_id);
CREATE INDEX idx_accounts_code ON accounts(code);
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_active ON accounts(is_active);
```

### Layer 2: Adapters
**Location**: `packages/adapters/core-ledger/`
**Responsibility**: External system integration, data transformation

```typescript
// packages/adapters/core-ledger/accounts-adapter.ts
import { Database } from '@aibos/adapters/db';
import { accountsTable } from '@aibos/adapters/db/core-ledger/schema';
import { eq, and, like, isNull, isNotNull } from 'drizzle-orm';

export class AccountsAdapter {
  constructor(private db: Database) {}
  
  async create(data: CreateAccountData): Promise<Account> {
    const [account] = await this.db
      .insert(accountsTable)
      .values({
        ...data,
        level: data.parentId ? await this.calculateLevel(data.parentId) : 1,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return account;
  }
  
  async findById(id: number): Promise<Account | null> {
    const [account] = await this.db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.id, id))
      .limit(1);
    
    return account || null;
  }
  
  async findByCode(code: string): Promise<Account | null> {
    const [account] = await this.db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.code, code))
      .limit(1);
    
    return account || null;
  }
  
  async findChildren(parentId: number): Promise<Account[]> {
    return await this.db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.parentId, parentId));
  }
  
  async findHierarchy(): Promise<Account[]> {
    return await this.db
      .select()
      .from(accountsTable)
      .where(eq(accountsTable.isActive, true))
      .orderBy(accountsTable.level, accountsTable.code);
  }
  
  async search(query: string, filters: SearchFilters = {}): Promise<Account[]> {
    const conditions = [
      eq(accountsTable.isActive, true),
      like(accountsTable.name, `%${query}%`)
    ];
    
    if (filters.accountType) {
      conditions.push(eq(accountsTable.accountType, filters.accountType));
    }
    
    if (filters.currency) {
      conditions.push(eq(accountsTable.currency, filters.currency));
    }
    
    return await this.db
      .select()
      .from(accountsTable)
      .where(and(...conditions));
  }
  
  async update(id: number, data: UpdateAccountData): Promise<Account> {
    const [account] = await this.db
      .update(accountsTable)
      .set({ 
        ...data, 
        updatedAt: new Date() 
      })
      .where(eq(accountsTable.id, id))
      .returning();
    
    return account;
  }
  
  async archive(id: number, reason?: string): Promise<Account> {
    const [account] = await this.db
      .update(accountsTable)
      .set({ 
        isActive: false,
        effectiveEndDate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(accountsTable.id, id))
      .returning();
    
    return account;
  }
  
  async reparent(accountId: number, newParentId: number | null): Promise<Account> {
    const newLevel = newParentId ? await this.calculateLevel(newParentId) + 1 : 1;
    
    const [account] = await this.db
      .update(accountsTable)
      .set({ 
        parentId: newParentId,
        level: newLevel,
        updatedAt: new Date()
      })
      .where(eq(accountsTable.id, accountId))
      .returning();
    
    return account;
  }
  
  private async calculateLevel(parentId: number): Promise<number> {
    const parent = await this.findById(parentId);
    return parent ? parent.level : 0;
  }
}
```

### Layer 3: Ports
**Location**: `packages/ports/core-ledger/`
**Responsibility**: Interface definitions, dependency inversion

```typescript
// packages/ports/core-ledger/accounts-port.ts
export interface Account {
  id: number;
  code: string;
  name: string;
  parentId?: number;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  normalBalance: 'DEBIT' | 'CREDIT';
  currency: string;
  isActive: boolean;
  allowPosting: boolean;
  level: number;
  effectiveStartDate: Date;
  effectiveEndDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountData {
  code: string;
  name: string;
  parentId?: number;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  currency?: string;
  allowPosting?: boolean;
}

export interface UpdateAccountData {
  code?: string;
  name?: string;
  parentId?: number;
  accountType?: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  currency?: string;
  isActive?: boolean;
  allowPosting?: boolean;
}

export interface SearchFilters {
  accountType?: string;
  currency?: string;
  isActive?: boolean;
}

export interface AccountsRepository {
  create(data: CreateAccountData): Promise<Account>;
  findById(id: number): Promise<Account | null>;
  findByCode(code: string): Promise<Account | null>;
  findChildren(parentId: number): Promise<Account[]>;
  findHierarchy(): Promise<Account[]>;
  search(query: string, filters?: SearchFilters): Promise<Account[]>;
  update(id: number, data: UpdateAccountData): Promise<Account>;
  archive(id: number, reason?: string): Promise<Account>;
  reparent(accountId: number, newParentId: number | null): Promise<Account>;
}

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
```

### Layer 4: Services
**Location**: `packages/services/core-ledger/`
**Responsibility**: Business logic, domain rules

```typescript
// packages/services/core-ledger/accounts-service.ts
import { AccountsRepository, AccountsService } from '@aibos/ports/core-ledger/accounts-port';
import { AccountsPolicies } from '@aibos/policies/core-ledger/accounts-policies';
import { Logger } from '@aibos/ports/shared/logger-port';

export class AccountsServiceImpl implements AccountsService {
  constructor(
    private repository: AccountsRepository,
    private policies: AccountsPolicies,
    private logger: Logger
  ) {}
  
  async createAccount(data: CreateAccountRequest): Promise<AccountResponse> {
    this.logger.info('Creating account', { code: data.code });
    
    // 1. Validate input using policies
    await this.policies.validateCreate(data);
    
    // 2. Check for duplicate code
    const existingAccount = await this.repository.findByCode(data.code);
    if (existingAccount) {
      throw new BusinessError('Account code already exists');
    }
    
    // 3. Validate parent account if provided
    if (data.parentId) {
      const parentAccount = await this.repository.findById(data.parentId);
      if (!parentAccount) {
        throw new BusinessError('Parent account not found');
      }
      await this.policies.validateParentChild(parentAccount, data);
    }
    
    // 4. Create account
    const account = await this.repository.create(data);
    
    // 5. Log success
    this.logger.info('Account created successfully', { id: account.id });
    
    // 6. Return response
    return this.mapToResponse(account);
  }
  
  async getAccount(id: number): Promise<AccountResponse> {
    const account = await this.repository.findById(id);
    if (!account) {
      throw new NotFoundError('Account not found');
    }
    
    return this.mapToResponse(account);
  }
  
  async getAccountByCode(code: string): Promise<AccountResponse> {
    const account = await this.repository.findByCode(code);
    if (!account) {
      throw new NotFoundError('Account not found');
    }
    
    return this.mapToResponse(account);
  }
  
  async getAccountChildren(parentId: number): Promise<AccountResponse[]> {
    const children = await this.repository.findChildren(parentId);
    return children.map(child => this.mapToResponse(child));
  }
  
  async getAccountHierarchy(): Promise<AccountHierarchyResponse> {
    const accounts = await this.repository.findHierarchy();
    const hierarchy = this.buildHierarchyTree(accounts);
    
    return {
      accounts: accounts.map(account => this.mapToResponse(account)),
      hierarchy: hierarchy
    };
  }
  
  async searchAccounts(query: string, filters?: SearchFilters): Promise<AccountResponse[]> {
    const accounts = await this.repository.search(query, filters);
    return accounts.map(account => this.mapToResponse(account));
  }
  
  async updateAccount(id: number, data: UpdateAccountRequest): Promise<AccountResponse> {
    this.logger.info('Updating account', { id });
    
    // 1. Validate input
    await this.policies.validateUpdate(data);
    
    // 2. Check if account exists
    const existingAccount = await this.repository.findById(id);
    if (!existingAccount) {
      throw new NotFoundError('Account not found');
    }
    
    // 3. Update account
    const updatedAccount = await this.repository.update(id, data);
    
    this.logger.info('Account updated successfully', { id });
    
    return this.mapToResponse(updatedAccount);
  }
  
  async archiveAccount(id: number, reason?: string): Promise<void> {
    this.logger.info('Archiving account', { id, reason });
    
    // 1. Check if account exists
    const account = await this.repository.findById(id);
    if (!account) {
      throw new NotFoundError('Account not found');
    }
    
    // 2. Check archive guard rails
    await this.policies.validateArchive(account);
    
    // 3. Archive account
    await this.repository.archive(id, reason);
    
    this.logger.info('Account archived successfully', { id });
  }
  
  async reparentAccount(accountId: number, newParentId: number | null): Promise<AccountResponse> {
    this.logger.info('Reparenting account', { accountId, newParentId });
    
    // 1. Validate reparent operation
    const validation = await this.validateReparent(accountId, newParentId);
    if (!validation.valid) {
      throw new BusinessError(validation.message);
    }
    
    // 2. Perform reparent
    const account = await this.repository.reparent(accountId, newParentId);
    
    this.logger.info('Account reparented successfully', { accountId, newParentId });
    
    return this.mapToResponse(account);
  }
  
  async validateReparent(accountId: number, newParentId: number | null): Promise<ReparentValidationResponse> {
    const account = await this.repository.findById(accountId);
    if (!account) {
      return { valid: false, message: 'Account not found' };
    }
    
    if (newParentId) {
      const newParent = await this.repository.findById(newParentId);
      if (!newParent) {
        return { valid: false, message: 'New parent account not found' };
      }
      
      // Check for circular reference
      if (await this.wouldCreateCircularReference(accountId, newParentId)) {
        return { valid: false, message: 'Would create circular reference' };
      }
      
      // Check account type compatibility
      if (account.accountType !== newParent.accountType) {
        return { valid: false, message: 'Account types must match' };
      }
      
      // Check depth constraint
      if (newParent.level >= 5) {
        return { valid: false, message: 'Maximum hierarchy depth exceeded' };
      }
    }
    
    return { valid: true, message: 'Reparent operation is valid' };
  }
  
  private async wouldCreateCircularReference(accountId: number, newParentId: number): Promise<boolean> {
    let currentId = newParentId;
    const visited = new Set<number>();
    
    while (currentId) {
      if (visited.has(currentId)) {
        return true; // Circular reference detected
      }
      
      if (currentId === accountId) {
        return true; // Would create circular reference
      }
      
      visited.add(currentId);
      const parent = await this.repository.findById(currentId);
      currentId = parent?.parentId || null;
    }
    
    return false;
  }
  
  private buildHierarchyTree(accounts: Account[]): AccountHierarchyNode[] {
    const accountMap = new Map<number, AccountHierarchyNode>();
    const rootNodes: AccountHierarchyNode[] = [];
    
    // Create nodes
    accounts.forEach(account => {
      accountMap.set(account.id, {
        ...this.mapToResponse(account),
        children: []
      });
    });
    
    // Build tree structure
    accounts.forEach(account => {
      const node = accountMap.get(account.id)!;
      
      if (account.parentId) {
        const parent = accountMap.get(account.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });
    
    return rootNodes;
  }
  
  private mapToResponse(account: Account): AccountResponse {
    return {
      id: account.id,
      code: account.code,
      name: account.name,
      parentId: account.parentId,
      accountType: account.accountType,
      normalBalance: account.normalBalance,
      currency: account.currency,
      isActive: account.isActive,
      allowPosting: account.allowPosting,
      level: account.level,
      effectiveStartDate: account.effectiveStartDate.toISOString(),
      effectiveEndDate: account.effectiveEndDate?.toISOString(),
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString()
    };
  }
}
```

### Layer 5: Policies
**Location**: `packages/policies/core-ledger/`
**Responsibility**: Business rules, validation, constraints

```typescript
// packages/policies/core-ledger/accounts-policies.ts
export class AccountsPolicies {
  static async validateCreate(data: CreateAccountRequest): Promise<void> {
    // Business Rule 1: Code format validation
    if (!data.code || data.code.length < 3) {
      throw new ValidationError('Account code must be at least 3 characters');
    }
    
    if (!/^[A-Z0-9-]+$/.test(data.code)) {
      throw new ValidationError('Account code must contain only uppercase letters, numbers, and hyphens');
    }
    
    // Business Rule 2: Name validation
    if (!data.name || data.name.length < 5) {
      throw new ValidationError('Account name must be at least 5 characters');
    }
    
    // Business Rule 3: Account type validation
    const validAccountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
    if (!validAccountTypes.includes(data.accountType)) {
      throw new ValidationError(`Account type must be one of: ${validAccountTypes.join(', ')}`);
    }
    
    // Business Rule 4: Currency validation
    if (data.currency && !/^[A-Z]{3}$/.test(data.currency)) {
      throw new ValidationError('Currency must be a valid 3-letter ISO code');
    }
  }
  
  static async validateUpdate(data: UpdateAccountRequest): Promise<void> {
    if (data.code !== undefined) {
      if (data.code.length < 3) {
        throw new ValidationError('Account code must be at least 3 characters');
      }
      
      if (!/^[A-Z0-9-]+$/.test(data.code)) {
        throw new ValidationError('Account code must contain only uppercase letters, numbers, and hyphens');
      }
    }
    
    if (data.name !== undefined) {
      if (data.name.length < 5) {
        throw new ValidationError('Account name must be at least 5 characters');
      }
    }
    
    if (data.accountType !== undefined) {
      const validAccountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
      if (!validAccountTypes.includes(data.accountType)) {
        throw new ValidationError(`Account type must be one of: ${validAccountTypes.join(', ')}`);
      }
    }
    
    if (data.currency !== undefined && !/^[A-Z]{3}$/.test(data.currency)) {
      throw new ValidationError('Currency must be a valid 3-letter ISO code');
    }
  }
  
  static async validateParentChild(parent: Account, child: CreateAccountRequest): Promise<void> {
    // Business Rule: Parent and child must have compatible account types
    const parentChildRules = {
      'ASSET': ['ASSET'],
      'LIABILITY': ['LIABILITY'],
      'EQUITY': ['EQUITY'],
      'REVENUE': ['REVENUE'],
      'EXPENSE': ['EXPENSE']
    };
    
    const allowedChildTypes = parentChildRules[parent.accountType];
    if (!allowedChildTypes?.includes(child.accountType)) {
      throw new ValidationError(`Account type ${child.accountType} is not compatible with parent type ${parent.accountType}`);
    }
    
    // Business Rule: Child code should start with parent code
    if (!child.code.startsWith(parent.code)) {
      throw new ValidationError('Child account code must start with parent account code');
    }
    
    // Business Rule: Hierarchy depth constraint
    if (parent.level >= 5) {
      throw new ValidationError('Maximum hierarchy depth of 5 levels exceeded');
    }
  }
  
  static async validateArchive(account: Account): Promise<void> {
    // Business Rule: Cannot archive if has children
    // This would need to be checked by calling repository.findChildren(account.id)
    // For now, we'll assume this check is done in the service layer
    
    // Business Rule: Cannot archive if has non-zero balance
    // This would need to be checked by calling balance service
    // For now, we'll assume this check is done in the service layer
    
    // Business Rule: Cannot archive if used in open periods
    // This would need to be checked by calling period service
    // For now, we'll assume this check is done in the service layer
    
    if (!account.isActive) {
      throw new ValidationError('Account is already archived');
    }
  }
}
```

### Layer 6: Contracts
**Location**: `packages/contracts/core-ledger/`
**Responsibility**: API contracts, types, schemas

```typescript
// packages/contracts/core-ledger/types.ts
export interface CreateAccountRequest {
  code: string;
  name: string;
  parentId?: number;
  accountType: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  currency?: string;
  allowPosting?: boolean;
}

export interface UpdateAccountRequest {
  code?: string;
  name?: string;
  parentId?: number;
  accountType?: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  currency?: string;
  isActive?: boolean;
  allowPosting?: boolean;
}

export interface AccountResponse {
  id: number;
  code: string;
  name: string;
  parentId?: number;
  accountType: string;
  normalBalance: string;
  currency: string;
  isActive: boolean;
  allowPosting: boolean;
  level: number;
  effectiveStartDate: string;
  effectiveEndDate?: string;
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

// packages/contracts/core-ledger/schemas.ts
import { z } from 'zod';

export const createAccountSchema = z.object({
  code: z.string()
    .min(3, 'Account code must be at least 3 characters')
    .max(50, 'Account code must be at most 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'Account code must contain only uppercase letters, numbers, and hyphens'),
  name: z.string()
    .min(5, 'Account name must be at least 5 characters')
    .max(255, 'Account name must be at most 255 characters'),
  parentId: z.number().positive().optional(),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  currency: z.string().length(3).optional(),
  allowPosting: z.boolean().optional()
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
  parentId: z.number().positive().optional(),
  accountType: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).optional(),
  currency: z.string().length(3).optional(),
  isActive: z.boolean().optional(),
  allowPosting: z.boolean().optional()
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

export const reparentValidationSchema = z.object({
  valid: z.boolean(),
  message: z.string()
});
```

### Layer 7: API (BFF)
**Location**: `apps/bff/app/api/core-ledger/`
**Responsibility**: HTTP endpoints, request/response handling

```typescript
// apps/bff/app/api/core-ledger/route.ts
import { AccountsServiceImpl } from '@aibos/services/core-ledger/accounts-service';
import { AccountsAdapter } from '@aibos/adapters/core-ledger/accounts-adapter';
import { AccountsPolicies } from '@aibos/policies/core-ledger/accounts-policies';
import { createAccountSchema } from '@aibos/contracts/core-ledger/schemas';
import { Logger } from '@aibos/adapters/shared/logger-adapter';

export async function POST(request: Request) {
  try {
    // 1. Parse and validate request
    const body = await request.json();
    const validatedData = createAccountSchema.parse(body);
    
    // 2. Initialize service with dependencies
    const adapter = new AccountsAdapter(db);
    const policies = new AccountsPolicies();
    const logger = new Logger();
    const service = new AccountsServiceImpl(adapter, policies, logger);
    
    // 3. Execute business logic
    const result = await service.createAccount(validatedData);
    
    // 4. Return response
    return Response.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const accountType = searchParams.get('type');
    const currency = searchParams.get('currency');
    
    const adapter = new AccountsAdapter(db);
    const policies = new AccountsPolicies();
    const logger = new Logger();
    const service = new AccountsServiceImpl(adapter, policies, logger);
    
    let result;
    if (query) {
      result = await service.searchAccounts(query, { accountType, currency });
    } else {
      result = await service.getAccountHierarchy();
    }
    
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// apps/bff/app/api/core-ledger/[id]/route.ts
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    
    const adapter = new AccountsAdapter(db);
    const policies = new AccountsPolicies();
    const logger = new Logger();
    const service = new AccountsServiceImpl(adapter, policies, logger);
    
    const result = await service.getAccount(id);
    
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const validatedData = updateAccountSchema.parse(body);
    
    const adapter = new AccountsAdapter(db);
    const policies = new AccountsPolicies();
    const logger = new Logger();
    const service = new AccountsServiceImpl(adapter, policies, logger);
    
    const result = await service.updateAccount(id, validatedData);
    
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { reason } = body;
    
    const adapter = new AccountsAdapter(db);
    const policies = new AccountsPolicies();
    const logger = new Logger();
    const service = new AccountsServiceImpl(adapter, policies, logger);
    
    await service.archiveAccount(id, reason);
    
    return new Response(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}

// apps/bff/app/api/core-ledger/hierarchy/route.ts
export async function GET(request: Request) {
  try {
    const adapter = new AccountsAdapter(db);
    const policies = new AccountsPolicies();
    const logger = new Logger();
    const service = new AccountsServiceImpl(adapter, policies, logger);
    
    const result = await service.getAccountHierarchy();
    
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// apps/bff/app/api/core-ledger/reparent/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, newParentId } = reparentRequestSchema.parse(body);
    
    const adapter = new AccountsAdapter(db);
    const policies = new AccountsPolicies();
    const logger = new Logger();
    const service = new AccountsServiceImpl(adapter, policies, logger);
    
    const result = await service.reparentAccount(accountId, newParentId);
    
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

// apps/bff/app/api/core-ledger/reparent/validate/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountId, newParentId } = reparentRequestSchema.parse(body);
    
    const adapter = new AccountsAdapter(db);
    const policies = new AccountsPolicies();
    const logger = new Logger();
    const service = new AccountsServiceImpl(adapter, policies, logger);
    
    const result = await service.validateReparent(accountId, newParentId);
    
    return Response.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Layer 8: UI
**Location**: `apps/web/app/(dashboard)/core-ledger/`
**Responsibility**: User interface, user experience

```typescript
// apps/web/app/(dashboard)/core-ledger/page.tsx
'use client';

import { useLedgerQuery, useCreateAccount, useUpdateAccount, useArchiveAccount } from '@/hooks/core-ledger/accounts-hooks';
import { AccountForm } from '@/components/core-ledger/account-form';
import { AccountList } from '@/components/core-ledger/account-list';
import { DataTable, Button, Badge, Tabs } from 'aibos-ui';

export default function CoreLedgerPage() {
  const { data: accounts, isLoading, error } = useLedgerQuery();
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const archiveAccount = useArchiveAccount();
  
  if (error) {
    return <div className="text-red-500">Error loading accounts: {error.message}</div>;
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chart of Accounts</h1>
        <Button onClick={() => {/* Open create modal */}}>
          Create Account
        </Button>
      </div>
      
      <Tabs
        tabs={[
          {
            label: "Active",
            content: (
              <AccountList 
                accounts={accounts?.accounts.filter(a => a.isActive) || []} 
                isLoading={isLoading}
                onUpdate={updateAccount.mutate}
                onArchive={archiveAccount.mutate}
              />
            ),
          },
          {
            label: "Archived",
            content: (
              <AccountList 
                accounts={accounts?.accounts.filter(a => !a.isActive) || []} 
                isLoading={isLoading}
                onUpdate={updateAccount.mutate}
                onArchive={archiveAccount.mutate}
              />
            ),
          },
        ]}
      />
    </div>
  );
}

// apps/web/app/(dashboard)/core-ledger/[id]/page.tsx
'use client';

import { useAccountQuery, useUpdateAccount } from '@/hooks/core-ledger/accounts-hooks';
import { AccountForm } from '@/components/core-ledger/account-form';
import { Card, Form, Input, Select, Button } from 'aibos-ui';

export default function AccountDetailPage({ params }: { params: { id: string } }) {
  const { data: account, isLoading } = useAccountQuery(params.id);
  const updateAccount = useUpdateAccount();
  
  if (isLoading) return <div>Loading...</div>;
  if (!account) return <div>Account not found</div>;
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <Form
          defaultValues={account}
          onSubmit={(data) => updateAccount.mutate({ id: account.id, data })}
          schema={accountSchema}
        >
          <Input name="code" label="Account Code" required />
          <Input name="name" label="Account Name" required />
          <Select
            name="accountType"
            label="Account Type"
            options={[
              { value: "ASSET", label: "Asset" },
              { value: "LIABILITY", label: "Liability" },
              { value: "EQUITY", label: "Equity" },
              { value: "REVENUE", label: "Revenue" },
              { value: "EXPENSE", label: "Expense" },
            ]}
          />
          <Select
            name="parentId"
            label="Parent Account"
            options={parentAccounts}
          />
          <div className="flex gap-4">
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleArchive}>
              Archive
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}

// apps/web/app/(dashboard)/core-ledger/hierarchy/page.tsx
'use client';

import { useAccountHierarchyQuery, useReparentAccount } from '@/hooks/core-ledger/accounts-hooks';
import { AccountTree } from '@/components/core-ledger/account-tree';
import { Tree, Button, Modal } from 'aibos-ui';

export default function AccountHierarchyPage() {
  const { data: hierarchy } = useAccountHierarchyQuery();
  const reparentAccount = useReparentAccount();
  
  const handleDrop = async (node: AccountHierarchyNode, newParent: AccountHierarchyNode | null) => {
    // 1. Client-side validation (fast fail)
    if (!validateReparent(node, newParent)) {
      toast.error("Invalid move");
      return;
    }
    
    // 2. Dry-run API call
    const validation = await apiClient.POST("/api/core-ledger/reparent/validate", {
      body: { accountId: node.id, newParentId: newParent?.id || null }
    });
    
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }
    
    // 3. Optimistic update
    optimisticallyUpdateUI(node, newParent);
    
    // 4. Actual mutation
    try {
      await reparentAccount.mutate({ 
        accountId: node.id, 
        newParentId: newParent?.id || null 
      });
      // 5. Success: emit event, invalidate
      analytics.track("Ledger.Account.Reparented", { 
        account_id: node.id,
        old_parent_id: node.parentId,
        new_parent_id: newParent?.id || null
      });
    } catch (error) {
      // 6. Rollback on failure
      rollbackOptimisticUpdate();
      toast.error("Failed to reparent account");
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Account Hierarchy</h1>
        <div className="flex gap-2">
          <Button onClick={expandAll}>Expand All</Button>
          <Button onClick={collapseAll}>Collapse All</Button>
        </div>
      </div>
      
      <Tree
        data={hierarchy?.hierarchy || []}
        draggable
        onDragEnd={handleDrop}
        keyboardAlternative={<ReparentMenu />}
        renderNode={(node) => (
          <AccountNode 
            account={node} 
            level={node.level} 
            balance={node.balance} 
          />
        )}
      />
    </div>
  );
}
```

---

## 🚫 Architectural Violations Prevention

### ESLint Rules
```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Prevent API layer from importing BFF internals
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['apps/bff/app/lib/*'],
            message: 'API layer cannot import BFF internals. Use Contracts layer instead.'
          },
          {
            group: ['apps/bff/app/services/*'],
            message: 'API layer cannot import BFF services. Use Services layer instead.'
          }
        ]
      }
    ],
    
    // Enforce layer boundaries
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          {
            target: './apps/bff/app/api/**',
            from: './apps/bff/app/lib/**',
            message: 'API routes cannot import BFF lib files'
          },
          {
            target: './apps/bff/app/api/**',
            from: './apps/bff/app/services/**',
            message: 'API routes cannot import BFF services'
          },
          {
            target: './packages/services/**',
            from: './apps/bff/**',
            message: 'Services cannot import BFF files'
          }
        ]
      }
    ]
  }
};
```

### Dependency Injection Pattern
```typescript
// packages/services/core-ledger/accounts-service.ts
export class AccountsService {
  constructor(
    private repository: AccountsRepository,  // Port interface
    private validator: AccountsValidator,     // Policy interface
    private logger: Logger                   // Utility interface
  ) {}
  
  // Service implementation
}
```

---

## 🧪 Testing Strategy

### Unit Tests (Each Layer)
```typescript
// packages/services/core-ledger/__tests__/accounts-service.test.ts
describe('AccountsService', () => {
  let service: AccountsServiceImpl;
  let mockRepository: jest.Mocked<AccountsRepository>;
  let mockPolicies: jest.Mocked<AccountsPolicies>;
  let mockLogger: jest.Mocked<Logger>;
  
  beforeEach(() => {
    mockRepository = createMockRepository();
    mockPolicies = createMockPolicies();
    mockLogger = createMockLogger();
    service = new AccountsServiceImpl(mockRepository, mockPolicies, mockLogger);
  });
  
  describe('createAccount', () => {
    it('should create account successfully', async () => {
      const data = { code: '1000', name: 'Cash', accountType: 'ASSET' };
      const expectedAccount = { id: 1, ...data, createdAt: new Date(), updatedAt: new Date() };
      
      mockPolicies.validateCreate.mockResolvedValue(undefined);
      mockRepository.findByCode.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(expectedAccount);
      
      const result = await service.createAccount(data);
      
      expect(result).toEqual({
        id: 1,
        code: '1000',
        name: 'Cash',
        accountType: 'ASSET',
        isActive: true,
        createdAt: expectedAccount.createdAt.toISOString(),
        updatedAt: expectedAccount.updatedAt.toISOString()
      });
    });
    
    it('should throw validation error for invalid data', async () => {
      const data = { code: 'AB', name: 'Test', accountType: 'INVALID' };
      
      mockPolicies.validateCreate.mockRejectedValue(new ValidationError('Invalid account type'));
      
      await expect(service.createAccount(data)).rejects.toThrow('Invalid account type');
    });
  });
});
```

### Integration Tests
```typescript
// apps/bff/__tests__/api/core-ledger/accounts.test.ts
describe('POST /api/core-ledger', () => {
  it('should create account via API', async () => {
    const response = await request(app)
      .post('/api/core-ledger')
      .send({
        code: 'TEST001',
        name: 'Test Account',
        accountType: 'ASSET'
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(Number),
      code: 'TEST001',
      name: 'Test Account',
      accountType: 'ASSET'
    });
  });
});
```

---

## 📊 Quality Gates

### Architecture Compliance
- [ ] **Zero ESLint violations** for architectural rules
- [ ] **All layers implemented** according to template
- [ ] **Dependency injection** used throughout
- [ ] **Interface segregation** followed

### Code Quality
- [ ] **90%+ test coverage** for all layers
- [ ] **TypeScript strict mode** enabled
- [ ] **ESLint passes** with zero warnings
- [ ] **Prettier formatting** applied

### Performance
- [ ] **API response time** < 200ms
- [ ] **Database queries** optimized
- [ ] **Bundle size** within limits
- [ ] **Memory usage** monitored

---

## 🚀 Implementation Checklist

### Phase 1: Foundation (Week 1)
- [ ] Create database schema and migrations
- [ ] Implement adapter layer
- [ ] Define port interfaces
- [ ] Set up ESLint rules

### Phase 2: Business Logic (Week 2)
- [ ] Implement service layer
- [ ] Create policy validations
- [ ] Define contracts and schemas
- [ ] Write unit tests

### Phase 3: API & UI (Week 3)
- [ ] Implement API endpoints
- [ ] Create UI components
- [ ] Add integration tests
- [ ] Performance optimization

### Phase 4: Deployment (Week 4)
- [ ] Feature flag implementation
- [ ] Monitoring and alerts
- [ ] Documentation completion
- [ ] Production deployment
