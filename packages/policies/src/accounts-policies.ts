// M01: Core Ledger - Accounts Policies
// Business rules, validation, and constraints

import type { Account, CreateAccountRequest, UpdateAccountRequest } from '@aibos/contracts';
import { ValidationError } from '@aibos/contracts';

export class AccountsPolicies {
    /**
     * Validate account creation request
     */
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

    /**
     * Validate account update request
     */
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

    /**
     * Validate parent-child relationship
     */
    static async validateParentChild(parent: Account, child: CreateAccountRequest): Promise<void> {
        // Business Rule: Parent and child must have compatible account types
        const parentChildRules: Record<string, string[]> = {
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

    /**
     * Validate account archive operation
     */
    static async validateArchive(account: Account): Promise<void> {
        if (!account.isActive) {
            throw new ValidationError('Account is already archived');
        }

        // Note: Additional checks (has children, has balance, used in open periods)
        // should be done in the service layer by querying the repository
    }
}
