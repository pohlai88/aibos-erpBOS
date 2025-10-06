import { NextResponse } from 'next/server';

// Demo _kit file with NextResponse.json patterns that need fixing

export function withRouteErrors<T extends any[]>(
  handler: (req: any, ...args: T) => Promise<Response>
) {
  return async (req: any, ...args: T): Promise<Response> => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      console.error('API Route Error:', error);

      if (error instanceof Error) {
        // ❌ Pattern: NextResponse.json with error structure
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

      // ❌ Pattern: NextResponse.json with simple error
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

// ❌ Pattern: NextResponse.json with success structure
export function testSuccess(data: any) {
  return NextResponse.json(
    {
      ok: true,
      data: data,
    },
    { status: 200 }
  );
}

// ❌ Pattern: Simple NextResponse.json
export function testSimple(data: any) {
  return NextResponse.json(data, { status: 200 });
}
