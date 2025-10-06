import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import { getDatabaseUrl } from './db-url.js';

const pool = new Pool({ connectionString: getDatabaseUrl() });
const db = drizzle(pool, { schema });

async function main() {
  // company
  await db
    .insert(schema.company)
    .values({ id: 'COMP-1', code: 'COMP-1', name: 'Demo Co', currency: 'MYR' })
    .onConflictDoNothing();

  // minimal accounts
  await db
    .insert(schema.account)
    .values([
      {
        id: 'ACC-AR',
        companyId: 'COMP-1',
        code: 'Trade Receivables',
        name: 'Trade Receivables',
        type: 'Asset',
        normalBalance: 'D',
      },
      {
        id: 'ACC-SALES',
        companyId: 'COMP-1',
        code: 'Sales',
        name: 'Sales',
        type: 'Income',
        normalBalance: 'C',
      },
      {
        id: 'ACC-TAX',
        companyId: 'COMP-1',
        code: 'Output Tax',
        name: 'Output Tax',
        type: 'Liability',
        normalBalance: 'C',
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.account)
    .values([
      {
        id: 'ACC-AP',
        companyId: 'COMP-1',
        code: 'Trade Payables',
        name: 'Trade Payables',
        type: 'Liability',
        normalBalance: 'C',
      },
      {
        id: 'ACC-ITAX',
        companyId: 'COMP-1',
        code: 'Input Tax',
        name: 'Input Tax',
        type: 'Asset',
        normalBalance: 'D',
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(schema.account)
    .values([
      {
        id: 'ACC-EXP',
        companyId: 'COMP-1',
        code: 'Expense',
        name: 'Expense',
        type: 'Expense',
        normalBalance: 'D',
      },
    ])
    .onConflictDoNothing();

  // inventory accounts
  await db
    .insert(schema.account)
    .values([
      {
        id: 'ACC-INV',
        companyId: 'COMP-1',
        code: 'Inventory',
        name: 'Inventory',
        type: 'Asset',
        normalBalance: 'D',
      },
      {
        id: 'ACC-COGS',
        companyId: 'COMP-1',
        code: 'COGS',
        name: 'COGS',
        type: 'Expense',
        normalBalance: 'D',
      },
    ])
    .onConflictDoNothing();

  // bank account
  await db
    .insert(schema.account)
    .values([
      {
        id: 'ACC-BANK',
        companyId: 'COMP-1',
        code: 'Bank',
        name: 'Bank',
        type: 'Asset',
        normalBalance: 'D',
      },
    ])
    .onConflictDoNothing();

  // demo item
  await db
    .insert(schema.item)
    .values({
      id: 'ITEM-1',
      code: 'ITEM-1',
      name: 'Demo Item',
      uom: 'EA',
    })
    .onConflictDoNothing();

  // Open the current month by default (idempotent)
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  end.setHours(23, 59, 59, 999);
  await db
    .insert(schema.accountingPeriod)
    .values({
      id: 'PERIOD-CURR',
      companyId: 'COMP-1',
      code: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`,
      startDate: start,
      endDate: end,
      status: 'OPEN',
    })
    .onConflictDoNothing();

  // Auth seed data
  await db
    .insert(schema.appUser)
    .values({ id: 'USR-DEV', email: 'dev@example.com', name: 'Dev' })
    .onConflictDoNothing();
  await db
    .insert(schema.membership)
    .values({ userId: 'USR-DEV', companyId: 'COMP-1', role: 'admin' })
    .onConflictDoNothing();

  console.log('Seeded company + accounts + current period + auth');
  await pool.end();
}
main().catch(e => {
  console.error(e);
  process.exit(1);
});
