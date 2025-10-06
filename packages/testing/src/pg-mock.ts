import type { QueryResult } from 'pg';

export type RowLike = Record<string, unknown>;

export function mockQueryResult<T extends RowLike>(rows: T[]): QueryResult<T> {
  return {
    command: 'SELECT',
    rowCount: rows.length,
    oid: 0,
    fields: [],
    rows,
  };
}

export function createPoolMock<T extends RowLike>(fixtures: {
  [sql: string]: T[] | ((...params: unknown[]) => T[]);
}) {
  return {
    query: async (text: string, params?: unknown[]) =>
      mockQueryResult(
        typeof fixtures[text] === 'function'
          ? (fixtures[text] as (...params: unknown[]) => T[])(...(params ?? []))
          : (fixtures[text] ?? [])
      ),
    end: async () => undefined,
    connect: async () => ({
      query: async (text: string, params?: unknown[]) =>
        mockQueryResult(
          typeof fixtures[text] === 'function'
            ? (fixtures[text] as (...params: unknown[]) => T[])(
                ...(params ?? [])
              )
            : (fixtures[text] ?? [])
        ),
      release: () => undefined,
    }),
  };
}
