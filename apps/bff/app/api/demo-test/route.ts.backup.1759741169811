import { NextRequest, NextResponse } from 'next/server';

// Demo route with all the problematic patterns we need to fix

// ❌ Pattern 1: Function declaration (should be withRouteErrors)
export async function GET(req: NextRequest) {
  return NextResponse.json({ data: 'test' }, { status: 200 });
}

// ❌ Pattern 2: NextResponse.json with error structure
export async function POST(req: NextRequest) {
  try {
    // Some logic here
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'BadRequest',
        message: 'Invalid input',
        details: error.message,
      },
      { status: 400 }
    );
  }
}

// ❌ Pattern 3: Response.json with CORS headers
export async function PUT(req: NextRequest) {
  return Response.json(
    { success: true },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}

// ❌ Pattern 4: Case block declarations (missing braces)
export async function PATCH(req: NextRequest) {
  const method = 'test';
  
  switch (method) {
    case 'test':
      const result = 'test result';
      break;
    case 'other':
      let value = 'other value';
      break;
    default:
      var defaultVar = 'default';
      break;
  }
  
  return NextResponse.json({ result });
}

// ❌ Pattern 5: Empty catch block
export async function DELETE(req: NextRequest) {
  try {
    // Some operation
  } catch (error) {
    // Empty catch block
  }
  
  return NextResponse.json({ success: true });
}

// ❌ Pattern 6: Missing global type (BodyInit)
export async function OPTIONS(req: NextRequest) {
  const body: BodyInit = 'test body';
  return NextResponse.json({ body });
}
