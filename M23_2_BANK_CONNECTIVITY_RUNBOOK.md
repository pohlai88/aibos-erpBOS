# M23.2 — Bank Connectivity & Acknowledgments Runbook

## Overview

This runbook provides step-by-step instructions for deploying and operating the M23.2 Bank Connectivity & Acknowledgments system. This system enables automated outbound dispatch of PAIN.001 files and inbound polling of bank feedback (pain.002 and camt.054) with a robust state machine.

## Prerequisites

- Database access with migration permissions
- API access with appropriate RBAC capabilities
- Bank connectivity credentials (SFTP keys or API tokens)
- Understanding of PAIN.001, pain.002, and camt.054 formats

## Deployment Steps

### 1. Database Migration

Run the following migrations in order:

```bash
# Navigate to the project root
cd /path/to/aibos-erpBOS

# Run migrations
psql -d $DATABASE_URL -f packages/adapters/db/migrations/0099_bank_conn_profile.sql
psql -d $DATABASE_URL -f packages/adapters/db/migrations/0100_bank_outbox_jobs.sql
psql -d $DATABASE_URL -f packages/adapters/db/migrations/0101_bank_ack_maps.sql
psql -d $DATABASE_URL -f packages/adapters/db/migrations/0102_bank_reason_norm.sql
psql -d $DATABASE_URL -f packages/adapters/db/migrations/0103_ap_pay_run_state_ext.sql
psql -d $DATABASE_URL -f packages/adapters/db/migrations/0104_bank_inbox_audit.sql
psql -d $DATABASE_URL -f packages/adapters/db/migrations/0105_bank_perf_indexes.sql
psql -d $DATABASE_URL -f packages/adapters/db/migrations/0106_secret_ref.sql
```

### 2. Deploy Application Code

```bash
# Build and deploy the application
pnpm -w build
pnpm -w deploy
```

### 3. Configure Bank Profiles

Set up bank connection profiles for each bank you'll be working with:

```sql
-- Example: HSBC Malaysia SFTP profile
INSERT INTO bank_conn_profile(company_id, bank_code, kind, config, updated_by)
VALUES (
    'your-company-id',
    'HSBC-MY',
    'SFTP',
    '{
        "host": "sftp.hsbc.my",
        "port": 22,
        "username": "your-username",
        "key_ref": "HSBC_SSH_KEY",
        "out_dir": "/outgoing",
        "in_dir": "/incoming"
    }',
    'ops'
);

-- Example: DBS Singapore API profile
INSERT INTO bank_conn_profile(company_id, bank_code, kind, config, updated_by)
VALUES (
    'your-company-id',
    'DBS-SG',
    'API',
    '{
        "api_base": "https://api.dbs.sg/v1",
        "auth_ref": "DBS_API_TOKEN"
    }',
    'ops'
);
```

### 4. Configure Reason Code Normalization

Set up reason code mappings for each bank:

```sql
-- HSBC Malaysia reason codes
INSERT INTO bank_reason_norm(bank_code, code, norm_status, norm_label)
VALUES
    ('HSBC-MY', 'ACCP', 'ack', 'Accepted'),
    ('HSBC-MY', 'ACSC', 'exec_ok', 'AcceptedSettlementCompleted'),
    ('HSBC-MY', 'RJCT', 'exec_fail', 'Rejected'),
    ('HSBC-MY', 'PDNG', 'partial', 'Pending');

-- DBS Singapore reason codes
INSERT INTO bank_reason_norm(bank_code, code, norm_status, norm_label)
VALUES
    ('DBS-SG', 'ACCEPTED', 'ack', 'Accepted'),
    ('DBS-SG', 'SETTLED', 'exec_ok', 'Settled'),
    ('DBS-SG', 'REJECTED', 'exec_fail', 'Rejected'),
    ('DBS-SG', 'PENDING', 'partial', 'Pending');
```

### 5. Verify Cron Jobs

Ensure the cron jobs are properly configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/payments/bank/process?action=dispatch",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/payments/bank/process?action=fetch",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Operational Procedures

### Testing Bank Connectivity

#### 1. Test Profile Creation

```bash
curl -X POST -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "bank_code": "HSBC-MY",
    "kind": "SFTP",
    "config": {
      "host": "sftp.hsbc.my",
      "port": 22,
      "username": "test-user",
      "key_ref": "HSBC_SSH_KEY",
      "out_dir": "/out",
      "in_dir": "/in"
    },
    "active": true
  }' \
  https://your-domain/api/payments/bank/profile
```

#### 2. Test Payment Dispatch (Dry Run)

```bash
curl -X POST -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "run_id": "your-run-id",
    "bank_code": "HSBC-MY",
    "dry_run": true
  }' \
  https://your-domain/api/payments/bank/dispatch
```

#### 3. Test Bank File Fetching

```bash
curl -X POST -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "bank_code": "HSBC-MY",
    "channel": "pain002",
    "max_files": 10
  }' \
  https://your-domain/api/payments/bank/fetch
```

### Monitoring and Troubleshooting

#### 1. Check Job Logs

```bash
curl -H "X-API-Key: your-api-key" \
  "https://your-domain/api/payments/bank/jobs?bank_code=HSBC-MY&limit=20"
```

#### 2. Monitor Outbox Queue

```sql
-- Check queued dispatches
SELECT id, run_id, bank_code, filename, status, attempts, last_error, created_at
FROM bank_outbox
WHERE company_id = 'your-company-id' AND status = 'queued'
ORDER BY created_at DESC;

-- Check failed dispatches
SELECT id, run_id, bank_code, filename, status, attempts, last_error, created_at
FROM bank_outbox
WHERE company_id = 'your-company-id' AND status = 'error'
ORDER BY created_at DESC;
```

#### 3. Check Acknowledgment Processing

```sql
-- Check recent acknowledgments
SELECT ba.id, ba.bank_code, ba.ack_kind, ba.filename, ba.created_at,
       COUNT(bam.id) as mapping_count
FROM bank_ack ba
LEFT JOIN bank_ack_map bam ON ba.id = bam.ack_id
WHERE ba.company_id = 'your-company-id'
GROUP BY ba.id, ba.bank_code, ba.ack_kind, ba.filename, ba.created_at
ORDER BY ba.created_at DESC
LIMIT 10;

-- Check acknowledgment mappings
SELECT bam.id, bam.run_id, bam.status, bam.reason_code, bam.reason_label,
       apr.status as run_status, apr.acknowledged_at
FROM bank_ack_map bam
JOIN bank_ack ba ON bam.ack_id = ba.id
LEFT JOIN ap_pay_run apr ON bam.run_id = apr.id
WHERE ba.company_id = 'your-company-id'
ORDER BY ba.created_at DESC
LIMIT 20;
```

#### 4. Check Payment Run State Machine

```sql
-- Check runs in different states
SELECT id, status, acknowledged_at, failed_reason, created_at
FROM ap_pay_run
WHERE company_id = 'your-company-id'
ORDER BY created_at DESC
LIMIT 10;
```

### Common Issues and Solutions

#### 1. Dispatch Failures

**Issue**: Outbox items stuck in 'queued' or 'error' status

**Solutions**:

- Check bank profile configuration
- Verify SFTP/API connectivity
- Check secret references are valid
- Review job logs for specific error messages

```sql
-- Check specific error
SELECT last_error FROM bank_outbox WHERE id = 'your-outbox-id';
```

#### 2. Fetch Failures

**Issue**: No acknowledgments being received

**Solutions**:

- Verify bank profile is active
- Check SFTP directory permissions or API endpoint
- Ensure bank is actually sending files
- Check fetch cursor position

```sql
-- Check fetch cursors
SELECT bank_code, channel, cursor, updated_at
FROM bank_fetch_cursor
WHERE company_id = 'your-company-id';
```

#### 3. State Machine Issues

**Issue**: Runs not transitioning properly

**Solutions**:

- Check acknowledgment mappings
- Verify reason code normalization
- Ensure all payment lines are accounted for

```sql
-- Check mapping completeness
SELECT run_id, COUNT(*) as total_lines,
       COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_lines
FROM ap_pay_line
WHERE run_id IN (
    SELECT id FROM ap_pay_run
    WHERE company_id = 'your-company-id' AND status = 'exported'
)
GROUP BY run_id;
```

### Performance Monitoring

#### 1. Dispatch Performance

Monitor dispatch latency and success rates:

```sql
-- Dispatch success rate by bank
SELECT bank_code,
       COUNT(*) as total_dispatches,
       COUNT(CASE WHEN status = 'sent' THEN 1 END) as successful,
       ROUND(COUNT(CASE WHEN status = 'sent' THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM bank_outbox
WHERE company_id = 'your-company-id'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY bank_code;
```

#### 2. Fetch Performance

Monitor fetch processing times:

```sql
-- Fetch performance by bank and channel
SELECT bank_code, kind,
       COUNT(*) as total_jobs,
       COUNT(CASE WHEN success = true THEN 1 END) as successful,
       AVG(CASE WHEN success = true THEN 1 ELSE 0 END) as success_rate
FROM bank_job_log
WHERE company_id = 'your-company-id'
  AND kind = 'FETCH'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY bank_code, kind;
```

### Security Considerations

1. **Secret Management**: Store SFTP keys and API tokens securely using the `secret_ref` table
2. **RBAC**: Ensure only authorized users have `pay:bank_profile` and `pay:dispatch` capabilities
3. **Audit Trail**: All operations are logged in `bank_job_log` for compliance
4. **Idempotency**: Duplicate processing is prevented through checksums and unique constraints

### Backup and Recovery

#### 1. Critical Data Backup

```sql
-- Backup bank profiles
COPY bank_conn_profile TO '/backup/bank_conn_profile.csv' WITH CSV HEADER;

-- Backup reason normalizations
COPY bank_reason_norm TO '/backup/bank_reason_norm.csv' WITH CSV HEADER;

-- Backup outbox (for recovery)
COPY bank_outbox TO '/backup/bank_outbox.csv' WITH CSV HEADER;
```

#### 2. Recovery Procedures

```sql
-- Restore bank profiles
COPY bank_conn_profile FROM '/backup/bank_conn_profile.csv' WITH CSV HEADER;

-- Restore reason normalizations
COPY bank_reason_norm FROM '/backup/bank_reason_norm.csv' WITH CSV HEADER;
```

## Definition of Done Checklist

- ✅ **Profiles** for SFTP/API with secret references; active flag respected
- ✅ **Dispatcher** uploads PAIN.001 to bank, with retries, backoff, idempotency, and logs
- ✅ **Fetcher** ingests pain.002 and camt.054, dedupes by hash, parses, and maps to runs/lines
- ✅ **State machine** advances runs `exported → acknowledged → executed/failed` with normalized reasons
- ✅ **Observability**: rich job logs; circuit breaker on repeated failures
- ✅ **Security & RBAC**: `pay:bank_profile`, `pay:dispatch` enforced
- ✅ **Performance**: p95 dispatch < 300ms per file; fetch+map 3k records < 2s
- ✅ **No churn** to M23/M23.1 routes; fully additive

## Support and Escalation

For issues not covered in this runbook:

1. Check the application logs for detailed error messages
2. Review the job logs via the API endpoint
3. Consult the database directly for state inspection
4. Escalate to the development team with specific error details and context

---

**Last Updated**: 2024-01-XX  
**Version**: M23.2  
**Author**: AI-BOS Development Team
