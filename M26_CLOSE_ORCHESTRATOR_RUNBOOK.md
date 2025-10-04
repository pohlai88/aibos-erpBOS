# M26 — Consolidated Close Orchestrator & Narrative Reporting Runbook

## Overview

M26 provides a comprehensive close management system with automated flux analysis and narrative reporting capabilities. This system integrates seamlessly with existing M17 period guard, M18 FX, M22 cash flow, and M25.x revenue modules.

## Features

- **Close Orchestrator Core**: Period-aware close runs, checklists, owners, dependencies, SLAs, evidence trail, approvals, and entity/period locks
- **Flux & Materiality**: Automated PL/BS/CF variance analysis with rules & thresholds; comments & assignments
- **Narrative (MD&A) Builder**: Data-bound sections + templates, variables (KPIs/flux/cash), versioned drafts, publish & freeze

## Migration Instructions

### 1. Run Database Migrations

Execute the following migrations in order:

```bash
# Core close management tables
psql -d $DB -f packages/adapters/db/migrations/0190_close_core.sql
psql -d $DB -f packages/adapters/db/migrations/0191_close_kpi.sql
psql -d $DB -f packages/adapters/db/migrations/0192_flux_core.sql
psql -d $DB -f packages/adapters/db/migrations/0193_mdna_core.sql

# Performance optimizations
psql -d $DB -f packages/adapters/db/migrations/0194_perf_idx.sql

# RBAC capabilities
psql -d $DB -f packages/adapters/db/migrations/0195_rbac_caps.sql

# Seed baseline data
psql -d $DB -f packages/adapters/db/migrations/0196_close_seed.sql

# Auditor-friendly views
psql -d $DB -f packages/adapters/db/migrations/0197_close_views.sql

# Outbox categories
psql -d $DB -f packages/adapters/db/migrations/0198_close_outbox.sql

# Foreign key hardening
psql -d $DB -f packages/adapters/db/migrations/0199_fk_hardening.sql
```

### 2. Verify Migration Success

```sql
-- Check that all tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'close_%'
OR table_name LIKE 'flux_%'
OR table_name LIKE 'mdna_%'
ORDER BY table_name;

-- Check that views were created
SELECT viewname FROM pg_views
WHERE viewname LIKE 'vw_%'
ORDER BY viewname;
```

## Configuration

### 1. Seed Baseline Policy

Set up default close policies for each company:

```sql
INSERT INTO close_policy(company_id, materiality_abs, materiality_pct, sla_default_hours, reminder_cadence_mins, tz)
VALUES ('<company_id>', 10000, 0.02, 72, 60, 'Asia/Ho_Chi_Minh')
ON CONFLICT (company_id) DO UPDATE SET
    materiality_abs=EXCLUDED.materiality_abs,
    materiality_pct=EXCLUDED.materiality_pct,
    sla_default_hours=EXCLUDED.sla_default_hours,
    reminder_cadence_mins=EXCLUDED.reminder_cadence_mins,
    tz=EXCLUDED.tz;
```

### 2. Configure Flux Rules

Set up materiality thresholds for flux analysis:

```sql
-- PL Analysis Rules
INSERT INTO flux_rule (id, company_id, scope, dim, threshold_abs, threshold_pct, require_comment, active, created_by, updated_by)
VALUES (gen_random_uuid()::text, '<company_id>', 'PL', 'ACCOUNT', 5000, 0.05, true, true, 'system', 'system');

-- BS Analysis Rules
INSERT INTO flux_rule (id, company_id, scope, dim, threshold_abs, threshold_pct, require_comment, active, created_by, updated_by)
VALUES (gen_random_uuid()::text, '<company_id>', 'BS', 'ACCOUNT', 10000, 0.10, true, true, 'system', 'system');

-- CF Analysis Rules
INSERT INTO flux_rule (id, company_id, scope, dim, threshold_abs, threshold_pct, require_comment, active, true, 'system', 'system');
```

## API Usage Examples

### 1. Create and Start Close Run

```bash
# Create a close run
curl -sS -X POST -H "X-API-Key: <id>:<secret>" -H "content-type: application/json" \
  -d '{"year":2025,"month":1,"owner":"ops","notes":"January 2025 close"}' \
  http://localhost:3000/api/close/runs

# Start the close run (creates default tasks)
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  http://localhost:3000/api/close/runs/<run_id>/start
```

### 2. Manage Close Tasks

```bash
# List tasks for a run
curl -sS -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/close/tasks?run_id=<run_id>"

# Update task status
curl -sS -X POST -H "X-API-Key: <id>:<secret>" -H "content-type: application/json" \
  -d '{"action":"done","notes":"Task completed successfully"}' \
  "http://localhost:3000/api/close/tasks/action?task_id=<task_id>"

# Add evidence to task
curl -sS -X POST -H "X-API-Key: <id>:<secret>" -H "content-type: application/json" \
  -d '{"task_id":"<task_id>","kind":"NOTE","uri_or_note":"Reconciliation completed"}' \
  http://localhost:3000/api/close/evidence
```

### 3. Run Flux Analysis

```bash
# Run flux analysis comparing periods
curl -sS -X POST -H "X-API-Key: <id>:<secret>" -H "content-type: application/json" \
  -d '{"base":{"y":2024,"m":12},"cmp":{"y":2025,"m":1},"present":"USD","scope":"PL","dim":"ACCOUNT"}' \
  http://localhost:3000/api/close/flux/run

# Get flux lines (material variances)
curl -sS -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/close/flux/lines?run_id=<run_id>&material_only=true"

# Get top movers
curl -sS -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/close/flux/top-movers?run_id=<run_id>&limit=10"

# Add comment to flux line
curl -sS -X POST -H "X-API-Key: <id>:<secret>" -H "content-type: application/json" \
  -d '{"line_id":"<line_id>","body":"Revenue increase due to new product launch"}' \
  http://localhost:3000/api/close/flux/comments
```

### 4. MD&A Template and Publishing

```bash
# Create MD&A template
curl -sS -X POST -H "X-API-Key: <id>:<secret>" -H "content-type: application/json" \
  -d '{
    "name": "Monthly MD&A Template",
    "sections": {
      "executive_summary": "Executive Summary",
      "financial_highlights": "Financial Highlights",
      "operational_review": "Operational Review"
    },
    "variables": {
      "revenue_growth": "Revenue Growth %",
      "profit_margin": "Profit Margin %",
      "cash_position": "Cash Position"
    }
  }' \
  http://localhost:3000/api/close/mdna/templates

# Approve template
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/close/mdna/templates/approve?template_id=<template_id>"

# Create draft from template
curl -sS -X POST -H "X-API-Key: <id>:<secret>" -H "content-type: application/json" \
  -d '{
    "template_id": "<template_id>",
    "run_id": "<run_id>",
    "content": {
      "executive_summary": "Strong performance this month",
      "financial_highlights": "Revenue up 15%"
    },
    "variables": {
      "revenue_growth": "15%",
      "profit_margin": "12%"
    }
  }' \
  http://localhost:3000/api/close/mdna/drafts

# Approve draft
curl -sS -X POST -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/close/mdna/drafts/<draft_id>/approve"

# Publish MD&A
curl -sS -X POST -H "X-API-Key: <id>:<secret>" -H "content-type: application/json" \
  -d '{"draft_id":"<draft_id>","run_id":"<run_id>"}' \
  http://localhost:3000/api/close/mdna/publish
```

### 5. KPI Monitoring

```bash
# Get KPIs for a close run
curl -sS -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/close/kpi?run_id=<run_id>"

# Get KPI trends
curl -sS -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/close/kpi?metric=DAYS_TO_CLOSE&computed_at_from=2025-01-01"

# Get dashboard KPIs (latest values)
curl -sS -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/close/kpi/dashboard"
```

## Automated Processes

### 1. Close Reminders

The system automatically sends reminders for:

- Tasks approaching SLA deadline (24 hours before)
- Overdue tasks (past SLA deadline)

Reminders are sent every 10 minutes and respect company-specific cadence settings.

### 2. KPI Computation

KPIs are automatically computed daily at 01:15 UTC for all companies:

- Days to close
- On-time rate
- Average task age
- Late tasks count

### 3. Automated Flux Runs

Monthly flux analysis runs automatically on the 1st at 02:00 UTC, comparing:

- Previous month vs current month
- PL analysis by account
- Materiality thresholds applied

## RBAC Capabilities

The following capabilities are available:

- `close:manage` - Manage close policies and configuration
- `close:run` - Execute close runs and manage tasks
- `close:approve` - Approve close tasks and evidence
- `close:report` - View close reports and KPIs
- `flux:run` - Execute flux analysis runs
- `mdna:edit` - Edit MD&A templates and drafts
- `mdna:approve` - Approve MD&A drafts
- `mdna:publish` - Publish MD&A reports

## Monitoring and Troubleshooting

### 1. Check Close Run Status

```sql
-- View close status with task completion metrics
SELECT * FROM vw_close_status
WHERE company_id = '<company_id>'
ORDER BY year DESC, month DESC;
```

### 2. Monitor SLA Breaches

```sql
-- View tasks with SLA breaches
SELECT * FROM vw_close_sla_breaches
WHERE company_id = '<company_id>'
ORDER BY hours_overdue DESC;
```

### 3. Review Flux Top Movers

```sql
-- View material flux variances
SELECT * FROM vw_flux_top_movers
WHERE company_id = '<company_id>'
ORDER BY abs_delta DESC
LIMIT 20;
```

### 4. Check System Health

```bash
# Verify all services are running
curl -sS -H "X-API-Key: <id>:<secret>" \
  http://localhost:3000/api/healthz

# Check recent close runs
curl -sS -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/close/runs?limit=5"
```

## Performance Considerations

- Flux analysis performance target: p95 < 2s on 50k lines
- KPI computation runs in background to avoid blocking operations
- Database indexes optimized for common query patterns
- Automated cleanup of old evidence and comments (configurable retention)

## Integration Points

- **M17 Period Guard**: Respects period locks and posting restrictions
- **M18 FX**: Uses present currency conversion for flux analysis
- **M22 Cash Flow**: Integrates cash highlights into MD&A variables
- **M25.x Revenue**: Includes revenue notes and artifacts in MD&A

## Definition of Done

✅ Close run with DAG-gated tasks, SLAs, reminders, evidence, approvals, entity locks  
✅ Materiality policy drives Flux; PL/BS/CF supported; present-currency view-only consistent with M17  
✅ Comments required where rules demand; top movers endpoint available  
✅ MD&A templates → drafts → publish (versioned, checksum, immutable)  
✅ KPIs computed; dashboards derive from close_kpi & flux  
✅ RBAC enforced; logs & outbox events; performance meets targets

## Support

For issues or questions:

1. Check the audit logs for detailed error information
2. Review the outbox events for failed operations
3. Verify RBAC permissions for the user/role
4. Check database constraints and foreign key relationships

The M26 system provides a robust, scalable foundation for close management with comprehensive audit trails and automated processes that integrate seamlessly with your existing ERP infrastructure.
