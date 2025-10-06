import { NextResponse } from 'next/server';

export function ok<T>(data: T, init?: number | ResponseInit) {
  return NextResponse.json(
    { ok: true, data },
    typeof init === 'number' ? { status: init } : init
  );
}
export function badRequest(message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: 'BadRequest', message, details },
    { status: 400 }
  );
}
export function unprocessable(message: string, details?: unknown) {
  return NextResponse.json(
    { ok: false, error: 'UnprocessableEntity', message, details },
    { status: 422 }
  );
}
export function serverError(
  message = 'Internal Server Error',
  details?: unknown
) {
  return NextResponse.json(
    { ok: false, error: 'InternalServerError', message, details },
    { status: 500 }
  );
}
export function notFound(message = 'Not Found', details?: unknown) {
  return NextResponse.json(
    { ok: false, error: 'NotFound', message, details },
    { status: 404 }
  );
}
export function cors204() {
  const res = new NextResponse(null, { status: 204 });
  res.headers.set('Access-Control-Allow-Origin', '*');
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  return res;
}

export function fileUploadResponse<T>(data: T, init?: ResponseInit) {
  const response = NextResponse.json({ ok: true, data }, init);
  response.headers.set('Access-Control-Allow-Origin', '*');
  return response;
}
