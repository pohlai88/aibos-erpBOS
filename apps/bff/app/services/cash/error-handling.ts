// M15.2 Phase 1: Enhanced Error Handling & Circuit Breaker
// Production-ready error handling with circuit breaker pattern

export interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
}

export interface RetryConfig {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
}

export class CircuitBreaker {
    private failures = 0;
    private lastFailureTime = 0;
    private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

    constructor(private config: CircuitBreakerConfig) { }

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
                this.state = 'HALF_OPEN';
            } else {
                throw new Error('Circuit breaker is OPEN');
            }
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess(): void {
        this.failures = 0;
        this.state = 'CLOSED';
    }

    private onFailure(): void {
        this.failures++;
        this.lastFailureTime = Date.now();

        if (this.failures >= this.config.failureThreshold) {
            this.state = 'OPEN';
        }
    }

    getState(): string {
        return this.state;
    }
}

export class RetryHandler {
    constructor(private config: RetryConfig) { }

    async executeWithRetry<T>(
        operation: () => Promise<T>,
        context: string = 'operation'
    ): Promise<T> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;

                if (attempt === this.config.maxAttempts) {
                    console.error(`❌ ${context} failed after ${attempt} attempts:`, error);
                    break;
                }

                const delay = this.calculateDelay(attempt);
                console.warn(`⚠️ ${context} attempt ${attempt} failed, retrying in ${delay}ms:`, error);

                await this.sleep(delay);
            }
        }

        throw lastError || new Error(`${context} failed after ${this.config.maxAttempts} attempts`);
    }

    private calculateDelay(attempt: number): number {
        const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
        return Math.min(delay, this.config.maxDelay);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export class ErrorHandler {
    private circuitBreakers = new Map<string, CircuitBreaker>();
    private retryHandlers = new Map<string, RetryHandler>();

    constructor() {
        // Initialize circuit breakers for different operations
        this.circuitBreakers.set('database', new CircuitBreaker({
            failureThreshold: 5,
            recoveryTimeout: 30000, // 30 seconds
            monitoringPeriod: 60000, // 1 minute
        }));

        this.circuitBreakers.set('external_api', new CircuitBreaker({
            failureThreshold: 3,
            recoveryTimeout: 60000, // 1 minute
            monitoringPeriod: 300000, // 5 minutes
        }));

        // Initialize retry handlers
        this.retryHandlers.set('database', new RetryHandler({
            maxAttempts: 3,
            baseDelay: 1000,
            maxDelay: 10000,
            backoffMultiplier: 2,
        }));

        this.retryHandlers.set('external_api', new RetryHandler({
            maxAttempts: 5,
            baseDelay: 500,
            maxDelay: 5000,
            backoffMultiplier: 1.5,
        }));
    }

    async executeWithErrorHandling<T>(
        operation: () => Promise<T>,
        operationType: 'database' | 'external_api' = 'database',
        context: string = 'operation'
    ): Promise<T> {
        const circuitBreaker = this.circuitBreakers.get(operationType);
        const retryHandler = this.retryHandlers.get(operationType);

        if (!circuitBreaker || !retryHandler) {
            throw new Error(`No error handling configured for operation type: ${operationType}`);
        }

        return await circuitBreaker.execute(async () => {
            return await retryHandler.executeWithRetry(operation, context);
        });
    }

    getCircuitBreakerState(operationType: string): string {
        return this.circuitBreakers.get(operationType)?.getState() || 'UNKNOWN';
    }

    resetCircuitBreaker(operationType: string): void {
        const circuitBreaker = this.circuitBreakers.get(operationType);
        if (circuitBreaker) {
            // Reset by creating new instance
            this.circuitBreakers.set(operationType, new CircuitBreaker({
                failureThreshold: 5,
                recoveryTimeout: 30000,
                monitoringPeriod: 60000,
            }));
        }
    }
}

// Enhanced error types
export class CashAlertsError extends Error {
    constructor(
        message: string,
        public code: string,
        public companyId?: string,
        public context?: Record<string, any>
    ) {
        super(message);
        this.name = 'CashAlertsError';
    }
}

export class DatabaseError extends CashAlertsError {
    constructor(message: string, companyId?: string, context?: Record<string, any>) {
        super(message, 'DATABASE_ERROR', companyId, context);
        this.name = 'DatabaseError';
    }
}

export class EvaluationError extends CashAlertsError {
    constructor(message: string, companyId?: string, context?: Record<string, any>) {
        super(message, 'EVALUATION_ERROR', companyId, context);
        this.name = 'EvaluationError';
    }
}

export class DispatchError extends CashAlertsError {
    constructor(message: string, companyId?: string, context?: Record<string, any>) {
        super(message, 'DISPATCH_ERROR', companyId, context);
        this.name = 'DispatchError';
    }
}
