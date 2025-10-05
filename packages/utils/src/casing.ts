export const toCamel = (o: unknown): unknown =>
    Array.isArray(o)
        ? o.map(toCamel)
        : o && typeof o === 'object' && o.constructor === Object
            ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), toCamel(v)]))
            : o;

export const toSnake = (o: unknown): unknown =>
    Array.isArray(o)
        ? o.map(toSnake)
        : o && typeof o === 'object' && o.constructor === Object
            ? Object.fromEntries(
                Object.entries(o).map(([k, v]) => [k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`), toSnake(v)])
            )
            : o;
