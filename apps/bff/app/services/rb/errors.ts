/**
 * Revenue & Billing Error Handling Utilities
 */

import { eq, and } from 'drizzle-orm';
import { ulid } from 'ulid';

export class RbError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message);
    this.name = 'RbError';
  }
}

export class RbValidationError extends RbError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'RbValidationError';
  }
}

export class RbNotFoundError extends RbError {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`, 'NOT_FOUND', 404);
    this.name = 'RbNotFoundError';
  }
}

export class RbConflictError extends RbError {
  constructor(message: string, details?: any) {
    super(message, 'CONFLICT', 409, details);
    this.name = 'RbConflictError';
  }
}

export class RbBusinessLogicError extends RbError {
  constructor(message: string, details?: any) {
    super(message, 'BUSINESS_LOGIC_ERROR', 422, details);
    this.name = 'RbBusinessLogicError';
  }
}

/**
 * Validation utilities
 */
export class RbValidator {
  /**
   * Validate subscription upgrade request
   */
  static validateSubscriptionUpgrade(data: any): void {
    if (!data.subscription_id) {
      throw new RbValidationError('subscription_id is required');
    }
    if (!data.new_price_id) {
      throw new RbValidationError('new_price_id is required');
    }
    if (!data.effective_date) {
      throw new RbValidationError('effective_date is required');
    }
    if (data.proration && !['DAILY', 'NONE'].includes(data.proration)) {
      throw new RbValidationError('proration must be DAILY or NONE');
    }
  }

  /**
   * Validate billing run request
   */
  static validateBillingRun(data: any): void {
    if (!data.period_start) {
      throw new RbValidationError('period_start is required');
    }
    if (!data.period_end) {
      throw new RbValidationError('period_end is required');
    }
    if (!data.present) {
      throw new RbValidationError('present currency is required');
    }
    if (data.present.length !== 3) {
      throw new RbValidationError('present currency must be 3 characters');
    }

    const startDate = new Date(data.period_start);
    const endDate = new Date(data.period_end);

    if (startDate >= endDate) {
      throw new RbValidationError('period_start must be before period_end');
    }
  }

  /**
   * Validate usage ingestion request
   */
  static validateUsageIngest(data: any): void {
    if (!data.subscription_id) {
      throw new RbValidationError('subscription_id is required');
    }
    if (!data.events || !Array.isArray(data.events)) {
      throw new RbValidationError('events array is required');
    }

    for (const event of data.events) {
      if (!event.event_time) {
        throw new RbValidationError('event_time is required for each event');
      }
      if (!event.quantity || event.quantity <= 0) {
        throw new RbValidationError('quantity must be positive for each event');
      }
      if (!event.unit) {
        throw new RbValidationError('unit is required for each event');
      }
      if (!event.uniq_hash) {
        throw new RbValidationError('uniq_hash is required for each event');
      }
    }
  }

  /**
   * Validate credit memo request
   */
  static validateCreditMemo(data: any): void {
    if (!data.customer_id) {
      throw new RbValidationError('customer_id is required');
    }
    if (!data.amount || data.amount <= 0) {
      throw new RbValidationError('amount must be positive');
    }
  }

  /**
   * Validate product creation
   */
  static validateProduct(data: any): void {
    if (!data.sku) {
      throw new RbValidationError('sku is required');
    }
    if (!data.name) {
      throw new RbValidationError('name is required');
    }
    if (!data.kind || !['ONE_TIME', 'RECURRING', 'USAGE'].includes(data.kind)) {
      throw new RbValidationError('kind must be ONE_TIME, RECURRING, or USAGE');
    }
    if (data.status && !['ACTIVE', 'INACTIVE'].includes(data.status)) {
      throw new RbValidationError('status must be ACTIVE or INACTIVE');
    }
  }

  /**
   * Validate price creation
   */
  static validatePrice(data: any): void {
    if (!data.product_id) {
      throw new RbValidationError('product_id is required');
    }
    if (!data.book_id) {
      throw new RbValidationError('book_id is required');
    }
    if (
      !data.model ||
      !['FLAT', 'TIERED', 'STAIR', 'VOLUME'].includes(data.model)
    ) {
      throw new RbValidationError(
        'model must be FLAT, TIERED, STAIR, or VOLUME'
      );
    }
    if (data.model === 'FLAT' && (!data.unit_amount || data.unit_amount <= 0)) {
      throw new RbValidationError(
        'unit_amount must be positive for FLAT pricing'
      );
    }
    if (
      data.model === 'TIERED' &&
      (!data.meta?.tiers || !Array.isArray(data.meta.tiers))
    ) {
      throw new RbValidationError('tiers array is required for TIERED pricing');
    }
    if (
      data.model === 'STAIR' &&
      (!data.meta?.tiers || !Array.isArray(data.meta.tiers))
    ) {
      throw new RbValidationError('tiers array is required for STAIR pricing');
    }
    if (
      data.model === 'VOLUME' &&
      (!data.unit_amount || data.unit_amount <= 0)
    ) {
      throw new RbValidationError(
        'unit_amount must be positive for VOLUME pricing'
      );
    }
  }
}

/**
 * Error handling wrapper for async functions
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof RbError) {
        throw error;
      }

      console.error(`Error in ${context}:`, error);

      if (error instanceof Error) {
        throw new RbError(
          `Internal error in ${context}: ${error.message}`,
          'INTERNAL_ERROR',
          500,
          { originalError: error.message }
        );
      }

      throw new RbError(`Unknown error in ${context}`, 'UNKNOWN_ERROR', 500);
    }
  };
}

/**
 * Idempotency utilities
 */
export class RbIdempotency {
  /**
   * Generate idempotency key for operations
   */
  static generateKey(operation: string, ...params: any[]): string {
    const paramsStr = params
      .map(p => (typeof p === 'object' ? JSON.stringify(p) : String(p)))
      .join('|');
    return `${operation}:${paramsStr}`;
  }

  /**
   * Check if operation is already processed
   */
  static async checkProcessed(
    db: any,
    tableName: any, // Table object, not string
    key: string,
    companyId: string
  ): Promise<boolean> {
    const result = await db
      .select()
      .from(tableName)
      .where(
        and(
          eq(tableName.companyId, companyId),
          eq(tableName.idempotencyKey, key)
        )
      )
      .limit(1);

    return result.length > 0;
  }
}
