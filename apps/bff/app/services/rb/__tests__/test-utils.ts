// M25: Revenue & Billing Test Utils
// apps/bff/app/services/rb/__tests__/test-utils.ts

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import {
    rbProduct,
    rbPriceBook,
    rbPrice,
    rbContract,
    rbSubscription,
    rbUsageEvent,
    rbUsageRollup,
    rbInvoice,
    rbInvoiceLine,
    rbCreditMemo,
    rbCreditApply,
    rbBillingRun,
    rbPostLock,
    taxCode
} from '@aibos/db-adapter/schema';

export const testCompanyId = 'test-rb-company';
export const testCustomerId = 'test-rb-customer';
export const testUserId = 'test-rb-user';

export async function cleanupRbTestData() {
    // Simplified cleanup - just log that cleanup was called
    // In a real test environment, you would clean up test data here
    console.log('Cleaning up RB test data for company:', testCompanyId);
}

export { describe, it, expect, beforeEach, afterEach };
