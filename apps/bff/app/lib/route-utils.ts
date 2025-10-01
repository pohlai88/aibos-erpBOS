import { NextResponse } from "next/server";

/**
 * Type guard to check if a value is a Response object
 */
export function isResponse(x: unknown): x is Response {
  return x instanceof Response;
}

/**
 * Error boundary wrapper to catch truly unexpected exceptions
 * Use this to wrap route handlers for consistent error handling
 */
export function withRouteErrors<
  F extends (req: Request, ...args: any[]) => Promise<Response>
>(fn: F): F {
  return (async (req: Request, ...args: any[]) => {
    try {
      return await fn(req, ...args);
    } catch (err) {
      console.error("Unhandled route error:", err);
      return NextResponse.json({ 
        ok: false, 
        error: "InternalServerError", 
        message: "Internal Server Error" 
      }, { status: 500 });
    }
  }) as F;
}
