import type { QueryResult } from "pg";

export type RowLike = Record<string, unknown>;

export function mockQueryResult<T extends RowLike>(rows: T[]): QueryResult<T> {
    return {
        command: "SELECT",
        rowCount: rows.length,
        oid: 0,
        fields: [],
        rows,
    };
}

export function createPoolMock<T extends RowLike>(fixtures: {
    [sql: string]: T[] | ((...params: any[]) => T[]);
}) {
    return {
        query: async (text: string, params?: any[]) =>
            mockQueryResult(
                typeof fixtures[text] === "function" ? (fixtures[text] as any)(...(params ?? [])) : (fixtures[text] ?? [])
            ),
        end: async () => undefined,
        connect: async () => ({
            query: async (text: string, params?: any[]) =>
                mockQueryResult(
                    typeof fixtures[text] === "function" ? (fixtures[text] as any)(...(params ?? [])) : (fixtures[text] ?? [])
                ),
            release: () => undefined,
        }),
    };
}
