# M24 — AR Collections & Cash Application (Order-to-Cash v1) Runbook

## Overview

M24 implements a comprehensive AR Collections & Cash Application system that plugs straight into the M22/M23 stack. It provides dunning policies, remittance ingestion, cash application engine, Promise-to-Pay & Disputes tracking, and live bridge to M22 cash flow forecasting.

## Features

- **Dunning policies** (segmented), reminder sequencing, templates, throttling
- **Remittance ingestion** (lockbox/CAMT/CSV/email) with idempotent audit
- **Cash application engine** with confidence-scored auto-match + exceptions queue
- **Promise-to-Pay & Disputes** tracking that feeds ops and forecast
- **Live bridge to M22**: 13-week receipts buckets update automatically

## Architecture

### Database Schema

The system uses 10 new tables:

1. `ar_dunning_policy` - Dunning policy configuration
2. `comm_template` - Communication templates for dunning
3. `ar_remittance_import` - Remittance file imports
4. `ar_cash_app` - Cash application records
5. `ar_cash_app_link` - Links between cash applications and invoices
6. `ar_ptp` - Promise-to-Pay records
7. `ar_dispute` - Dispute tracking
8. `ar_dunning_log` - Dunning communication log
9. `ar_age_snapshot` - Aging snapshot cache
10. `cf_receipt_signal` - M22 bridge for receipt signals

### Services

- **ArDunningService**: Manages dunning policies, templates, and runs
- **ArCashApplicationService**: Handles remittance import and cash application
- **ArPtpDisputesService**: Manages Promise-to-Pay and disputes

### API Endpoints

- `GET/POST /api/ar/templates` - Template management
- `GET/POST /api/ar/policies` - Dunning policy management
- `POST /api/ar/dunning/run` - Trigger dunning run
- `POST /api/ar/remit/import` - Import remittance files
- `POST /api/ar/cashapp/run` - Run cash application
- `GET /api/ar/cashapp` - List cash application matches
- `POST /api/ar/ptp` - Create Promise-to-Pay
- `POST /api/ar/ptp/resolve` - Resolve Promise-to-Pay
- `POST /api/ar/disputes` - Create dispute
- `POST /api/ar/disputes/resolve` - Resolve dispute
- `GET /api/cf/receipts/signals` - View receipt signals

## Installation & Setup

### 1. Database Migrations

Run the following migrations in order:

```bash
# Navigate to the project root
cd /path/to/aibos-erpBOS

# Run migrations
pnpm db:migrate
```

The migrations will create:

- `0114_ar_dunning_policy.sql` - Dunning policy table
- `0115_ar_templates.sql` - Communication templates
- `0116_ar_remit_import.sql` - Remittance import tracking
- `0117_ar_cash_app.sql` - Cash application tables
- `0118_ar_ptp_dispute.sql` - PTP and dispute tables
- `0119_ar_dunning_log.sql` - Dunning communication log
- `0120_ar_perf_idx.sql` - Performance indexes
- `0121_ar_age_snapshot.sql` - Aging snapshot cache
- `0122_cf_bridge_receipts.sql` - M22 bridge table
- `0123_ar_rbac_caps.sql` - RBAC capabilities

### 2. Seed Data

Create initial templates and policies:

```sql
-- Insert default dunning template
INSERT INTO comm_template (id, company_id, kind, subject, body, updated_by)
VALUES (
  'AR-DUN-01',
  '<your-company-id>',
  'AR_DUNNING',
  'Payment Reminder — {{customer.name}}',
  'Hi {{customer.name}}, our records show {{total_due}} due across {{invoice_count}} invoice(s). Oldest {{oldest_days}} days. Link: {{portal_url}}',
  'ops'
) ON CONFLICT DO NOTHING;

-- Insert default dunning policy
INSERT INTO ar_dunning_policy (
  company_id, policy_code, segment, from_bucket, step_idx,
  wait_days, channel, template_id, throttle_days, updated_by
)
VALUES
  ('<your-company-id>', 'DEFAULT', NULL, '1-30', 0, 0, 'EMAIL', 'AR-DUN-01', 3, 'ops'),
  ('<your-company-id>', 'DEFAULT', NULL, '1-30', 1, 5, 'EMAIL', 'AR-DUN-01', 5, 'ops')
ON CONFLICT DO NOTHING;
```

### 3. RBAC Configuration

The system adds new capabilities to the RBAC system:

- `ar:dunning:policy` - Manage dunning policies and templates
- `ar:dunning:run` - Execute dunning runs
- `ar:remit:import` - Import remittance files
- `ar:cashapp:run` - Run cash application
- `ar:ptp` - Manage Promise-to-Pay
- `ar:dispute` - Manage disputes

These capabilities are automatically assigned to admin, accountant, and ops roles.

## Usage

### 1. Dunning Management

#### Create Communication Template

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "AR_DUNNING",
    "subject": "Payment Reminder - {{customer.name}}",
    "body": "Hi {{customer.name}}, our records show {{total_due}} due across {{invoice_count}} invoice(s). Oldest {{oldest_days}} days. Link: {{portal_url}}"
  }' \
  https://<host>/api/ar/templates
```

#### Create Dunning Policy

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "policy_code": "DEFAULT",
    "from_bucket": "1-30",
    "step_idx": 0,
    "wait_days": 0,
    "channel": "EMAIL",
    "template_id": "AR-DUN-01",
    "throttle_days": 3
  }' \
  https://<host>/api/ar/policies
```

#### Run Dunning (Dry Run)

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": true}' \
  https://<host>/api/ar/dunning/run
```

#### Run Dunning (Live)

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{"dry_run": false}' \
  https://<host>/api/ar/dunning/run
```

### 2. Remittance Import

#### Import CSV Remittance

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "CSV",
    "filename": "bank-remittance.csv",
    "payload": "date,amount,currency,payer_name,reference\n2024-01-15,1000.00,USD,Test Customer,INV-001"
  }' \
  https://<host>/api/ar/remit/import
```

#### Import CAMT.054 XML

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "CAMT054",
    "filename": "bank-statement.xml",
    "payload": "<?xml version=\"1.0\" encoding=\"UTF-8\"?>..."
  }' \
  https://<host>/api/ar/remit/import
```

### 3. Cash Application

#### Run Cash Application (Dry Run)

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "dry_run": true,
    "min_confidence": 0.7
  }' \
  https://<host>/api/ar/cashapp/run
```

#### Run Cash Application (Live)

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "dry_run": false,
    "min_confidence": 0.75
  }' \
  https://<host>/api/ar/cashapp/run
```

#### View Cash Application Matches

```bash
# Get all matches
curl -H "X-API-Key: <id>:<secret>" \
  https://<host>/api/ar/cashapp

# Get only unmatched
curl -H "X-API-Key: <id>:<secret>" \
  https://<host>/api/ar/cashapp?status=unmatched

# Get only matched
curl -H "X-API-Key: <id>:<secret>" \
  https://<host>/api/ar/cashapp?status=matched
```

### 4. Promise-to-Pay Management

#### Create Promise-to-Pay

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "customer-123",
    "invoice_id": "invoice-456",
    "promised_date": "2024-02-15",
    "amount": 1000,
    "reason": "Cash flow issues"
  }' \
  https://<host>/api/ar/ptp
```

#### Resolve Promise-to-Pay

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ptp-123",
    "outcome": "kept"
  }' \
  https://<host>/api/ar/ptp/resolve
```

#### View PTP Records

```bash
# Get all PTPs
curl -H "X-API-Key: <id>:<secret>" \
  https://<host>/api/ar/ptp

# Get only open PTPs
curl -H "X-API-Key: <id>:<secret>" \
  https://<host>/api/ar/ptp?status=open

# Get PTPs for specific customer
curl -H "X-API-Key: <id>:<secret>" \
  https://<host>/api/ar/ptp?customer_id=customer-123
```

### 5. Dispute Management

#### Create Dispute

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "customer-123",
    "invoice_id": "invoice-456",
    "reason_code": "PRICING",
    "detail": "Price discrepancy on line items"
  }' \
  https://<host>/api/ar/disputes
```

#### Resolve Dispute

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "dispute-123",
    "status": "resolved",
    "detail": "Price adjusted and customer satisfied"
  }' \
  https://<host>/api/ar/disputes/resolve
```

#### Write Off Dispute

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "dispute-123",
    "status": "written_off",
    "detail": "Dispute written off due to service issues"
  }' \
  https://<host>/api/ar/disputes/resolve
```

### 6. M22 Integration

#### View Receipt Signals

```bash
# Get all receipt signals
curl -H "X-API-Key: <id>:<secret>" \
  https://<host>/api/cf/receipts/signals

# Get signals for specific week
curl -H "X-API-Key: <id>:<secret>" \
  https://<host>/api/cf/receipts/signals?week_start=2024-01-15

# Get signals by source
curl -H "X-API-Key: <id>:<secret>" \
  https://<host>/api/cf/receipts/signals?source=AUTO_MATCH
```

## Automated Jobs

### 1. Dunning Daily Job

The system includes an automated dunning job that runs daily at 09:00 UTC:

```typescript
// apps/bff/src/inngest/arDunningDaily.ts
export const arDunningDaily = inngest.createFunction(
  { id: "ar.dunning.daily" },
  { cron: "0 9 * * *" }, // Daily at 09:00 UTC
  async ({ step }) => {
    // Runs dunning for all companies
  }
);
```

### 2. Cash Application Hourly Job

The system includes an automated cash application job that runs hourly:

```typescript
// apps/bff/src/inngest/arCashAppHourly.ts
export const arCashAppHourly = inngest.createFunction(
  { id: "ar.cashapp.hourly" },
  { cron: "0 * * * *" }, // Hourly
  async ({ step }) => {
    // Runs cash application for all companies
  }
);
```

## Testing

### Run Tests

```bash
# Run all AR tests
pnpm test apps/bff/app/services/ar/__tests__

# Run specific test files
pnpm test apps/bff/app/services/ar/__tests__/dunning.test.ts
pnpm test apps/bff/app/services/ar/__tests__/cash-application.test.ts
pnpm test apps/bff/app/services/ar/__tests__/ptp-disputes.test.ts
```

### Test Coverage

The tests cover:

- **Dunning Service**: Policy management, template rendering, dunning runs, throttle respect
- **Cash Application Service**: Remittance import, confidence scoring, cash application runs
- **PTP & Disputes Service**: PTP lifecycle, dispute management, statistics, filtering

## Performance Targets

- **Cash application**: 2k lines p95 < 1.2s
- **Dunning**: 5k invoices p95 < 2s
- **Confidence scoring**: Real-time matching with 0.7+ threshold
- **M22 bridge**: Receipt signals update within 1s

## Monitoring & Observability

### Key Metrics

- Dunning run success rate
- Cash application match rate
- PTP kept vs broken ratio
- Dispute resolution time
- Receipt signal latency

### Logging

All operations are logged with:

- Company ID
- User ID
- Operation type
- Success/failure status
- Performance metrics

## Troubleshooting

### Common Issues

1. **Dunning not sending**: Check throttle days and policy configuration
2. **Cash application low match rate**: Adjust confidence threshold
3. **PTP not updating M22**: Verify receipt signal emission
4. **Dispute write-off not posting**: Check journal posting rules

### Debug Commands

```bash
# Check dunning log
SELECT * FROM ar_dunning_log WHERE company_id = '<company-id>' ORDER BY sent_at DESC LIMIT 10;

# Check cash application status
SELECT status, COUNT(*) FROM ar_cash_app WHERE company_id = '<company-id>' GROUP BY status;

# Check PTP statistics
SELECT status, COUNT(*), SUM(amount) FROM ar_ptp WHERE company_id = '<company-id>' GROUP BY status;

# Check receipt signals
SELECT source, COUNT(*), SUM(amount) FROM cf_receipt_signal WHERE company_id = '<company-id>' GROUP BY source;
```

## Security Considerations

- All API endpoints require authentication
- RBAC capabilities control access to different functions
- Sensitive data is encrypted in transit
- Audit trail maintained for all operations

## Future Enhancements

- **M25**: Advanced dunning workflows with escalation paths
- **M26**: Machine learning-based cash application scoring
- **M27**: Real-time dispute resolution workflow
- **M28**: Advanced reporting and analytics dashboard

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review the test cases for expected behavior
3. Check the logs for error details
4. Contact the development team

---

**M24 — AR Collections & Cash Application (Order-to-Cash v1)**  
_Clean, incremental, and plugs straight into your M22/M23 stack._
