import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DatabaseAdapter } from '@aibos/db-adapter';
import * as schema from '@aibos/db-adapter/schema';

const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  return url;
};

export const pool = new Pool({
  connectionString: getDatabaseUrl(),
});
export const db = drizzle(pool, { schema });
export const adapter = new DatabaseAdapter(getDatabaseUrl());
export const tx = adapter;
export const repo = adapter;
