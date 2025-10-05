export function ok<T>(data: T, headers: Record<string, string> = {}) {
    return Response.json(data, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            ...headers
        }
    });
}

export function created<T>(data: T, location: string, headers: Record<string, string> = {}) {
    return Response.json(data, {
        status: 201,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Location': location,
            ...headers
        }
    });
}

export function badRequest(message: string, details?: any) {
    return Response.json({ error: message, details }, {
        status: 400,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}

export function unprocessable(message: string, details?: any) {
    return Response.json({ error: message, details }, {
        status: 422,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}

export function unauthorized(message: string) {
    return Response.json({ error: message }, {
        status: 401,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}

export function forbidden(message: string) {
    return Response.json({ error: message }, {
        status: 403,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}

export function notFound(message: string) {
    return Response.json({ error: message }, {
        status: 404,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}

export function serverError(message: string) {
    return Response.json({ error: message }, {
        status: 500,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}

export function cors204() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}

// Helper function to check if a value is a Response object
export function isResponse(value: any): value is Response {
    return value instanceof Response;
}