/**
 * Shared HTTP response types for consistent API contracts
 * 
 * These types help eliminate `any` usage in API responses and provide
 * better type safety across the BFF and frontend.
 * 
 * Note: These complement the existing Result types in ./common/result.ts
 * which include warnings support. Use these for simple HTTP responses.
 */

export type HttpOk<T> = {
    ok: true;
    data: T
};

export type HttpErr = {
    ok: false;
    error: string;
    code?: string
};

export type HttpResponse<T> = HttpOk<T> | HttpErr;

/**
 * Standard pagination metadata
 */
export type PaginationMeta = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

/**
 * Paginated response wrapper
 */
export type PaginatedResult<T> = {
    data: T[];
    meta: PaginationMeta;
};

/**
 * Common API error codes
 */
export const API_ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    RATE_LIMITED: 'RATE_LIMITED',
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

/**
 * Helper functions for creating HTTP responses
 */
export const createHttpOk = <T>(data: T): HttpOk<T> => ({ ok: true, data });
export const createHttpErr = (error: string, code?: ApiErrorCode): HttpErr => ({
    ok: false,
    error,
    ...(code && { code })
});

/**
 * Type guard functions for HTTP responses
 */
export const isHttpOk = <T>(response: HttpResponse<T>): response is HttpOk<T> => response.ok === true;
export const isHttpErr = <T>(response: HttpResponse<T>): response is HttpErr => response.ok === false;
