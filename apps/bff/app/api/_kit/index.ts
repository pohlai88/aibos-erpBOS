import { NextRequest, NextResponse } from 'next/server';

/**
 * Error boundary wrapper for API routes
 * Automatically catches errors and returns standardized error responses
 */
export function withRouteErrors<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<Response>
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      console.error('API Route Error:', error);

      if (error instanceof Error) {
        return NextResponse.json(
          {
            ok: false,
            error: 'InternalServerError',
            message: error.message,
            details:
              process.env.NODE_ENV === 'development' ? error.stack : undefined,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          ok: false,
          error: 'InternalServerError',
          message: 'An unexpected error occurred',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Rate limiting utility
 */
export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetTime: number;
}

// Simple in-memory rate limiter (for development)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = options.key;
  const windowMs = options.windowMs;
  const limit = options.limit;

  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetTime) {
    // Reset or create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });

    return {
      ok: true,
      remaining: limit - 1,
      resetTime: now + windowMs,
    };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetTime: existing.resetTime,
    };
  }

  existing.count++;
  return {
    ok: true,
    remaining: limit - existing.count,
    resetTime: existing.resetTime,
  };
}

/**
 * Audit logging utility
 */
export interface AuditAttempt {
  action: string;
  module: string;
  companyId: string;
  actorId: string;
  at: number;
  details?: Record<string, any>;
}

export async function logAuditAttempt(attempt: AuditAttempt): Promise<void> {
  try {
    // In a real implementation, this would send to an audit service
    console.log('AUDIT:', JSON.stringify(attempt));
  } catch (error) {
    console.error('Failed to log audit attempt:', error);
  }
}

/**
 * Rate limit exceeded response
 */
export function tooManyRequests(message = 'Too many requests'): Response {
  return NextResponse.json(
    {
      ok: false,
      error: 'TooManyRequests',
      message,
    },
    { status: 429 }
  );
}

/**
 * Success response helper
 */
export function ok(data: any, status = 200): Response {
  return NextResponse.json(
    {
      ok: true,
      data,
    },
    { status }
  );
}
