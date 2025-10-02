# M18 — FX Admin & Month-End Revaluation Runbook

## Overview

This runbook covers the complete M18 implementation for FX Admin Rates and Month-End Revaluation functionality.

## Prerequisites

- M17 implementation completed (period guards, cost center rollups)
- PostgreSQL database with `ltree` extension
- BFF running and accessible

## 1. Database Migrations

Apply the three SQL migrations in order:

```bash
# Connect to your PostgreSQL database
psql -h localhost -U aibos -d aibos

# Apply migrations
\i packages/adapters/db/migrations/0047_fx_reval_log.sql
\i packages/adapters/db/migrations/0048_fx_account_map.sql
\i packages/adapters/db/migrations/0049_fx_admin_rates_uk.sql
```

Or using Docker:

```bash
docker exec aibos-postgres psql -U aibos -d aibos -f /path/to/0047_fx_reval_log.sql
docker exec aibos-postgres psql -U aibos -d aibos -f /path/to/0048_fx_account_map.sql
docker exec aibos-postgres psql -U aibos -d aibos -f /path/to/0049_fx_admin_rates_uk.sql
```

## 2. Seed Data

### 2.1 FX Account Mapping

Map monetary GL accounts to unrealized gain/loss accounts:

```sql
INSERT INTO fx_account_map(company_id, gl_account, unreal_gain_account, unreal_loss_account)
VALUES
  ('<your-company-id>', '1100', '7190', '8190'),  -- Cash accounts
  ('<your-company-id>', '1200', '7190', '8190'),  -- AR accounts
  ('<your-company-id>', '2100', '7190', '8190'),  -- AP accounts
  ('<your-company-id>', '2200', '7190', '8190')   -- Other monetary liabilities
ON CONFLICT (company_id, gl_account) DO NOTHING;
```

### 2.2 Admin Rates (Example)

Seed month-end admin rates:

```sql
INSERT INTO fx_admin_rates(company_id, as_of_date, src_ccy, dst_ccy, rate, updated_by)
VALUES
  ('<your-company-id>', '2025-11-30', 'USD', 'MYR', 4.65, 'ops'),
  ('<your-company-id>', '2025-11-30', 'EUR', 'MYR', 5.12, 'ops'),
  ('<your-company-id>', '2025-11-30', 'SGD', 'MYR', 3.45, 'ops')
ON CONFLICT (company_id, as_of_date, src_ccy, dst_ccy) DO NOTHING;
```

## 3. API Testing

### 3.1 Rates CRUD

```bash
# List all rates
curl -H "X-API-Key: <your-api-key>" \
  "http://localhost:3000/api/fx/rates"

# List rates for specific month
curl -H "X-API-Key: <your-api-key>" \
  "http://localhost:3000/api/fx/rates?year=2025&month=11"

# Add/update a rate
curl -X POST -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"as_of_date":"2025-11-30","src_ccy":"USD","dst_ccy":"MYR","rate":4.65}' \
  "http://localhost:3000/api/fx/rates"
```

### 3.2 CSV Import

Create a test CSV file `rates_test.csv`:

```csv
as_of_date,src_ccy,dst_ccy,rate
2025-11-30,USD,MYR,4.65
2025-11-30,EUR,MYR,5.12
2025-11-30,SGD,MYR,3.45
```

```bash
curl -X POST -H "X-API-Key: <your-api-key>" \
  -F "file=@rates_test.csv" \
  "http://localhost:3000/api/fx/rates/import"
```

### 3.3 Dry-Run Revaluation

```bash
curl -X POST -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"year":2025,"month":11,"dry_run":true}' \
  "http://localhost:3000/api/fx/revalue"
```

Expected response:

```json
{
  "run_id": "01H...",
  "lines": 3,
  "delta_total": 1250.5
}
```

### 3.4 Commit Revaluation

```bash
curl -X POST -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"year":2025,"month":11,"dry_run":false,"memo":"Month-end FX revaluation"}' \
  "http://localhost:3000/api/fx/revalue"
```

### 3.5 View Revaluation Runs

```bash
curl -H "X-API-Key: <your-api-key>" \
  "http://localhost:3000/api/fx/revalue/runs"
```

## 4. Verification Steps

### 4.1 Database Verification

```sql
-- Check reval runs
SELECT * FROM fx_reval_run ORDER BY created_at DESC LIMIT 5;

-- Check reval lines
SELECT rl.*, rr.mode, rr.created_at
FROM fx_reval_line rl
JOIN fx_reval_run rr ON rl.run_id = rr.id
ORDER BY rr.created_at DESC LIMIT 10;

-- Check posted journals
SELECT * FROM journal
WHERE tags->>'module' = 'fx_reval'
ORDER BY created_at DESC LIMIT 5;
```

### 4.2 Idempotency Test

Run the same revaluation twice - the second run should produce 0 new journals:

```bash
# First run
curl -X POST -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"year":2025,"month":11,"dry_run":false}' \
  "http://localhost:3000/api/fx/revalue"

# Second run (should be idempotent)
curl -X POST -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"year":2025,"month":11,"dry_run":false}' \
  "http://localhost:3000/api/fx/revalue"
```

### 4.3 Period Guard Test

Close a period and try to run revaluation:

```sql
-- Close November 2025
INSERT INTO periods(company_id, year, month, state, updated_by)
VALUES ('<your-company-id>', 2025, 11, 'closed', 'ops')
ON CONFLICT (company_id, year, month)
DO UPDATE SET state = 'closed', updated_by = 'ops';
```

```bash
# This should return 423 Locked
curl -X POST -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"year":2025,"month":11,"dry_run":false}' \
  "http://localhost:3000/api/fx/revalue"
```

## 5. Definition of Done Checklist

- ✅ **Admin rates**: CRUD + CSV import; unique per (company, month-end, src, dst)
- ✅ **Revaluation engine**: Computes deltas on monetary accounts, posts balanced unrealized FX JEs, **idempotent** per account/currency/period
- ✅ **Controls**: Period must be OPEN (global guard), RBAC `fx:manage`
- ✅ **Logs**: Run header + line details stored; easy to audit
- ✅ **Reports**: Unrealized FX lines flow to PL; presentation currency toggle remains view-only

## 6. Troubleshooting

### Common Issues

1. **"Period is closed" error**: Ensure the period is open in the `periods` table
2. **"No account mapping"**: Verify `fx_account_map` has entries for your GL accounts
3. **"No admin rates"**: Check `fx_admin_rates` table has rates for the period
4. **Zero deltas**: Verify trial balance has foreign currency balances

### Debug Queries

```sql
-- Check period status
SELECT * FROM periods WHERE company_id = '<your-company-id>' AND year = 2025 AND month = 11;

-- Check account mappings
SELECT * FROM fx_account_map WHERE company_id = '<your-company-id>';

-- Check admin rates
SELECT * FROM fx_admin_rates WHERE company_id = '<your-company-id>' AND as_of_date = '2025-11-30';

-- Check trial balance for foreign currencies
SELECT account_code, currency, SUM(debit - credit) as balance
FROM journal_line jl
JOIN journal j ON j.id = jl.journal_id
WHERE j.company_id = '<your-company-id>' AND j.date <= '2025-11-30'
GROUP BY account_code, currency
HAVING currency != 'MYR' AND ABS(SUM(debit - credit)) > 0.01;
```

## 7. Performance Notes

- GiST index on `fx_admin_rates` ensures fast lookups
- Revaluation is O(accounts × currencies) - typically very fast
- Idempotency locks prevent duplicate processing
- Dry-run mode allows safe testing without posting

## 8. Integration Points

- **M17 Period Guards**: Automatically enforced via `postJournal()`
- **M17 Presentation Currency**: Uses same `getAdminRateOr1()` function
- **Existing Reports**: PL will show unrealized FX gains/losses from posted JEs
- **RBAC**: Requires `fx:manage` capability for write operations

---

**M18 Implementation Complete!** 🎉
