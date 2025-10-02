export const toCamel = <T extends Record<string, any>>(o: T): any =>
    Array.isArray(o)
        ? o.map(toCamel)
        : o && o.constructor === Object
            ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()), toCamel(v)]))
            : o;

export const toSnake = <T extends Record<string, any>>(o: T): any =>
    Array.isArray(o)
        ? o.map(toSnake)
        : o && o.constructor === Object
            ? Object.fromEntries(
                Object.entries(o).map(([k, v]) => [k.replace(/[A-Z]/g, c => `_${c.toLowerCase()}`), toSnake(v)])
            )
            : o;
