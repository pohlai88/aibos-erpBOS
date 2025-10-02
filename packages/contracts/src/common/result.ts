export type Warning = { code: string; message: string; hint?: string };

export type ResultOk<T> = { ok: true; data: T; warnings?: Warning[] | undefined };
export type ResultErr<E = { code: string; message: string }> = { ok: false; error: E; warnings?: Warning[] | undefined };

export type Result<T, E = { code: string; message: string }> = ResultOk<T> | ResultErr<E>;

export const ok = <T>(data: T, warnings?: Warning[]): ResultOk<T> => ({ ok: true, data, warnings });
export const err = <E extends { code: string; message: string }>(error: E, warnings?: Warning[]): ResultErr<E> => ({
    ok: false, error, warnings
});
