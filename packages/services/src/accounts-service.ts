// M01: Core Ledger - Accounts Service
// Business logic orchestration layer

import type {
    Account,
    CreateAccountRequest,
    UpdateAccountRequest,
    AccountResponse,
    AccountHierarchyResponse,
    AccountHierarchyNode,
    ReparentValidationResponse,
    SearchFilters,
} from '@aibos/contracts';
import type { AccountsRepository, AccountsService, Logger } from '@aibos/ports';
import { AccountsPolicies } from '@aibos/policies';
import { NotFoundError, BusinessError } from '@aibos/contracts';

export class AccountsServiceImpl implements AccountsService {
    constructor(
        private repository: AccountsRepository,
        private logger: Logger
    ) { }

    async createAccount(data: CreateAccountRequest): Promise<AccountResponse> {
        this.logger.info('Creating account', { code: data.code });

        // 1. Validate input using policies
        await AccountsPolicies.validateCreate(data);

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
            await AccountsPolicies.validateParentChild(parentAccount, data);
        }

        // 4. Create account
        const account = await this.repository.create(data);

        this.logger.info('Account created successfully', { id: account.id });

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
        await AccountsPolicies.validateUpdate(data);

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
        await AccountsPolicies.validateArchive(account);

        // 3. Check for children
        const children = await this.repository.findChildren(account.id);
        if (children.length > 0) {
            throw new BusinessError('Cannot archive account with children');
        }

        // 4. Archive account
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
        let currentId: number | undefined = newParentId;
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
            currentId = parent?.parentId;
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
