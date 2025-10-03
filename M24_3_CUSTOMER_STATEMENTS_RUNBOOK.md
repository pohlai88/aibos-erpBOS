# M24.3 Customer Statements & Portal Ledger Runbook

**Order-to-Cash v1.3** - Monthly statements (PDF/CSV), customer-facing ledger in the portal, optional finance charges, and fully auditable email dispatch.

## Overview

This module provides comprehensive customer statement generation and portal ledger access for AR management. It integrates seamlessly with existing AR data models and provides:

- **Monthly Statement Generation**: Automated PDF/CSV generation with finance charges
- **Portal Ledger Access**: Token-based customer access to their ledger
- **Email Dispatch**: Automated statement delivery with retry logic
- **Finance Charge Management**: Configurable late payment charges
- **Full Audit Trail**: Complete tracking of all statement activities

## Architecture

### Database Schema

The module adds 6 new tables to the AR schema:

1. **`ar_finance_charge_policy`** - Company-level finance charge configuration
2. **`ar_statement_run`** - Statement generation runs with metadata
3. **`ar_statement_line`** - Individual ledger lines per customer
4. **`ar_statement_artifact`** - Generated PDF/CSV files with checksums
5. **`ar_statement_email`** - Email dispatch tracking and status
6. **`ar_portal_ledger_token`** - Secure token-based portal access

### Service Layer

- **`ArStatementService`** - Core statement generation and management
- **`ArPortalLedgerService`** - Portal access and token management
- **Finance Charge Calculator** - Automated late payment charge computation
- **Email Dispatcher** - Statement delivery with retry logic

### API Endpoints

#### Admin/Ops Routes (RBAC Required)

- `GET/POST /api/ar/finance-charge/policy` - Finance charge policy management
- `POST /api/ar/statements/run` - Generate statements
- `GET /api/ar/statements/runs` - List statement runs
- `GET /api/ar/statements/[run_id]/customers` - Get customers for a run
- `POST /api/ar/statements/email` - Send statement emails
- `GET /api/ar/statements/artifacts/[artifact_id]` - Download artifacts

#### Portal Routes (Public Token)

- `POST /api/portal/ledger` - Get customer ledger via token
- `GET /api/portal/statements/latest?token=...` - Get latest statement URLs

## Deployment Guide

### 1. Database Migration

```bash
# Run migrations in order
psql -d $DB -f packages/adapters/db/migrations/0139_ar_finance_charge_policy.sql
psql -d $DB -f packages/adapters/db/migrations/0140_ar_statement_run.sql
psql -d $DB -f packages/adapters/db/migrations/0141_ar_statement_line.sql
psql -d $DB -f packages/adapters/db/migrations/0142_ar_statement_artifact.sql
psql -d $DB -f packages/adapters/db/migrations/0143_ar_statement_email.sql
psql -d $DB -f packages/adapters/db/migrations/0144_ar_portal_ledger_token.sql
psql -d $DB -f packages/adapters/db/migrations/0145_ar_perf_idx4.sql
psql -d $DB -f packages/adapters/db/migrations/0146_ar_view_customer_ledger.sql
```

### 2. RBAC Configuration

Grant required capabilities to appropriate roles:

```sql
-- Grant to admin role
INSERT INTO rbac_role_capability (role_id, capability) VALUES
('admin', 'ar:stmt:policy'),
('admin', 'ar:stmt:run'),
('admin', 'ar:stmt:email');

-- Grant to accountant role
INSERT INTO rbac_role_capability (role_id, capability) VALUES
('accountant', 'ar:stmt:policy'),
('accountant', 'ar:stmt:run'),
('accountant', 'ar:stmt:email');
```

### 3. Initial Configuration

Set up finance charge policy for each company:

```sql
INSERT INTO ar_finance_charge_policy(
    company_id,
    enabled,
    annual_pct,
    min_fee,
    grace_days,
    comp_method,
    updated_by
) VALUES (
    '<company_id>',
    false,  -- Start disabled
    0.18,   -- 18% APR
    5.00,   -- $5 minimum fee
    10,     -- 10 days grace period
    'simple',
    'ops'
) ON CONFLICT (company_id) DO UPDATE SET
    annual_pct = EXCLUDED.annual_pct,
    min_fee = EXCLUDED.min_fee,
    grace_days = EXCLUDED.grace_days;
```

### 4. Cron Job Setup

The system includes automated cron jobs via Inngest:

- **Monthly Statement Generation**: Runs on the 1st of each month at 02:00 UTC
- **Email Retry**: Runs every hour to retry failed statement emails

Ensure Inngest is properly configured and the functions are registered.

## Usage Guide

### Finance Charge Policy Management

```bash
# Get current policy
curl -H "X-API-Key: <key>" \
  https://<host>/api/ar/finance-charge/policy

# Update policy
curl -X POST -H "X-API-Key: <key>" \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "annual_pct": 0.18,
    "min_fee": 5.00,
    "grace_days": 10,
    "comp_method": "simple",
    "present_ccy": "USD"
  }' \
  https://<host>/api/ar/finance-charge/policy
```

### Statement Generation

```bash
# Generate statements for previous month
curl -X POST -H "X-API-Key: <key>" \
  -H "Content-Type: application/json" \
  -d '{
    "as_of_date": "2024-09-30",
    "present": "USD",
    "finalize": true,
    "include_pdf": true,
    "include_csv": true
  }' \
  https://<host>/api/ar/statements/run
```

### Email Dispatch

```bash
# Send all statement emails
curl -X POST -H "X-API-Key: <key>" \
  -H "Content-Type: application/json" \
  -d '{
    "run_id": "<run_id>",
    "resend_failed": true
  }' \
  https://<host>/api/ar/statements/email
```

### Portal Ledger Access

```bash
# Generate portal token (internal)
# This would typically be done by your customer portal system
# when sending statement emails or providing portal access

# Get customer ledger via token
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "token": "<portal_token>",
    "since": "2024-07-01",
    "until": "2024-09-30",
    "include_disputes": true
  }' \
  https://<host>/api/portal/ledger

# Get latest statement artifacts
curl "https://<host>/api/portal/statements/latest?token=<portal_token>"
```

## Monitoring & Observability

### Key Metrics

- **Statement Generation Performance**: Target p95 < 90s for 2k customers
- **Per-Customer PDF Generation**: Target p95 < 250ms
- **Email Success Rate**: Monitor delivery success/failure rates
- **Finance Charge Accuracy**: Verify calculations against policy

### Logging

The system provides comprehensive logging for:

- Statement generation progress and errors
- Email dispatch status and failures
- Portal access attempts and token validation
- Finance charge calculations and policy changes

### Alerts

Set up monitoring for:

- Failed statement generation runs
- High email failure rates (>5%)
- Portal token abuse attempts
- Finance charge calculation errors

## Troubleshooting

### Common Issues

1. **Statement Generation Fails**

   - Check database connectivity
   - Verify AR invoice data integrity
   - Review finance charge policy configuration

2. **Email Delivery Issues**

   - Check SMTP configuration
   - Verify customer email addresses
   - Review email retry logs

3. **Portal Access Problems**
   - Verify token expiration
   - Check customer ID mapping
   - Review portal session logs

### Performance Optimization

1. **Database Indexes**: Ensure all performance indexes are created
2. **Batch Processing**: Use appropriate batch sizes for large datasets
3. **Caching**: Consider caching frequently accessed data
4. **Storage**: Use efficient storage for PDF/CSV artifacts

## Security Considerations

- **Token Security**: Portal tokens are cryptographically secure and time-limited
- **RBAC**: All admin operations require proper capabilities
- **Data Privacy**: Customer data is properly isolated by company
- **Audit Trail**: All operations are fully logged and auditable

## Testing

The module includes comprehensive tests covering:

- Finance charge policy management
- Statement generation with various scenarios
- Email dispatch and retry logic
- Portal ledger access and token validation
- Performance benchmarks (100 customers in <5s)

Run tests with:

```bash
pnpm --filter bff test -- ar-statements
```

## Definition of Done

✅ **Statements** generated with accurate ledger, aging, and optional finance charges  
✅ **Artifacts** (PDF/CSV) stored with checksums and downloadable  
✅ **Email dispatch** tracked with retries & status  
✅ **Portal ledger** live with token-based access + latest statement links  
✅ **RBAC/observability** in place; p95 performance targets met

## Support

For issues or questions:

1. Check the comprehensive test suite for usage examples
2. Review the service layer documentation
3. Monitor logs for detailed error information
4. Contact the development team for complex issues

---

**Version**: 1.0  
**Last Updated**: 2024-12-19  
**Compatibility**: Requires M24.1 (Credit Management) and M24.2 (Customer Portal)
