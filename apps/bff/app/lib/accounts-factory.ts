// M01: Core Ledger - Accounts Service Factory
// Simple dependency injection container

/**
 * Console logger implementation
 */
class ConsoleLogger {
    info(message: string, context?: Record<string, any>): void {
        console.log(`[INFO] ${message}`, context || '');
    }

    warn(message: string, context?: Record<string, any>): void {
        console.warn(`[WARN] ${message}`, context || '');
    }

    error(message: string, error?: Error, context?: Record<string, any>): void {
        console.error(`[ERROR] ${message}`, error, context || '');
    }

    debug(message: string, context?: Record<string, any>): void {
        console.debug(`[DEBUG] ${message}`, context || '');
    }
}

/**
 * Create logger instance
 */
export function createLogger() {
    return new ConsoleLogger();
}

// Note: Full service factory will be implemented once adapters are complete
// For now, export the logger for use in API routes
