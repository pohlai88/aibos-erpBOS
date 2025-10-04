# M26.1 — Auto-Controls & Certifications Runbook

## 🎯 Overview

M26.1 implements automated controls and certifications for the close process, providing:

- **Controls Library & Assignments** - Define controls and attach to close tasks/domains
- **Automated Tests** - Programmable checks with SQL/SCRIPT/POLICY execution
- **Control Runs & Exceptions** - Pass/fail with severity, remediation workflow
- **Attestations/Certifications** - Manager + Controller/CFO sign-offs with immutable snapshots
- **Audit Evidence** - Link artifacts, attach files/notes with checksum integrity

## 🚀 Quick Start

### 1. Run Migrations

```powershell
# Execute all M26.1 migrations
.\scripts\run-m26-1-migrations.ps1 -DatabaseUrl "postgresql://user:pass@localhost:5432/aibos_erp"
```

### 2. Seed Baseline Controls

```powershell
# Seed controls for a specific company
.\scripts\seed-baseline-controls.ps1 -ApiKey "your-api-key" -CompanyId "company-id"

# Or via API
curl -X POST "http://localhost:3000/api/ctrl/seed" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json"
```

### 3. Test APIs

```powershell
# Run comprehensive API tests
.\scripts\test-m26-1-apis.ps1 -ApiKey "your-api-key" -BaseUrl "http://localhost:3000"
```

### 4. Set Up Cron Scheduling

```bash
# Add cron jobs to crontab
crontab scripts/m26-1-cron-jobs.txt

# Or manually add:
*/15 * * * * /usr/bin/curl -X POST "http://localhost:3000/api/ctrl/cron/execute" -H "X-API-Key: ${CTRL_API_KEY}" -H "Content-Type: application/json" -d '{"trigger": "scheduled"}' >> /var/log/aibos/controls-execution.log 2>&1
```

## 📋 API Reference

### Controls Management

#### Create Control

```bash
curl -X POST "http://localhost:3000/api/ctrl/controls" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CUSTOM_CONTROL",
    "name": "Custom Control",
    "purpose": "Custom control description",
    "domain": "CLOSE",
    "frequency": "PER_RUN",
    "severity": "HIGH",
    "auto_kind": "SCRIPT",
    "auto_config": {"script": "jeContinuity"},
    "evidence_required": true,
    "status": "ACTIVE"
  }'
```

#### Query Controls

```bash
curl "http://localhost:3000/api/ctrl/controls?domain=CLOSE&severity=HIGH&limit=10" \
  -H "X-API-Key: your-api-key"
```

#### Create Assignment

```bash
curl -X POST "http://localhost:3000/api/ctrl/assignments" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "control_id": "control-id",
    "run_id": "close-run-id",
    "owner": "ops",
    "approver": "controller",
    "sla_due_at": "2025-01-15T10:00:00.000Z",
    "active": true
  }'
```

### Control Execution

#### Execute Control Run

```bash
curl -X POST "http://localhost:3000/api/ctrl/run" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "control_id": "control-id",
    "run_id": "close-run-id",
    "scheduled_at": "2025-01-15T10:00:00.000Z"
  }'
```

#### Query Control Runs

```bash
curl "http://localhost:3000/api/ctrl/run?status=PASS&limit=10" \
  -H "X-API-Key: your-api-key"
```

### Exception Management

#### Update Exception

```bash
curl -X POST "http://localhost:3000/api/ctrl/exceptions" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "exception-id",
    "remediation_state": "IN_PROGRESS",
    "assignee": "user-id",
    "resolution_note": "Working on resolution"
  }'
```

#### Query Exceptions

```bash
curl "http://localhost:3000/api/ctrl/exceptions?remediation_state=OPEN&material=true&limit=10" \
  -H "X-API-Key: your-api-key"
```

### Evidence Management

#### Add Evidence

```bash
curl -X POST "http://localhost:3000/api/ctrl/evidence" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "ctrl_run_id": "run-id",
    "kind": "NOTE",
    "uri_or_note": "Evidence description or URI"
  }'
```

#### Query Evidence

```bash
curl "http://localhost:3000/api/ctrl/evidence?ctrl_run_id=run-id&kind=NOTE&limit=10" \
  -H "X-API-Key: your-api-key"
```

### Certifications

#### Create Certification Template

```bash
curl -X POST "http://localhost:3000/api/cert/statements" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "MANAGER_STD",
    "text": "I certify that the financial statements are accurate and complete.",
    "level": "ENTITY",
    "active": true
  }'
```

#### Sign Certification

```bash
curl -X POST "http://localhost:3000/api/cert/sign" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "run_id": "close-run-id",
    "level": "ENTITY",
    "statement_id": "statement-id",
    "signer_role": "MANAGER",
    "signer_name": "Jane Manager"
  }'
```

## 🔧 Built-in Controls

### 1. JE_CONTINUITY

- **Purpose**: Ensures no gaps in journal entry sequencing
- **Domain**: CLOSE
- **Frequency**: PER_RUN
- **Severity**: HIGH

### 2. SUBLEDGER_TIEOUT_AP/AR/REV

- **Purpose**: Verifies subledger balances tie out to GL control accounts
- **Domain**: AP/AR/REV
- **Frequency**: MONTHLY
- **Severity**: HIGH

### 3. BANK_RECON_DIFF

- **Purpose**: Checks for material differences between bank statements and GL cash
- **Domain**: BANK
- **Frequency**: MONTHLY
- **Severity**: HIGH

### 4. FX_REVAL_LOCK

- **Purpose**: Ensures FX revaluation is performed and locked
- **Domain**: FX
- **Frequency**: MONTHLY
- **Severity**: HIGH

### 5. REVENUE_RPO_ROLLFWD

- **Purpose**: Reconciles RPO opening + bookings - recognition - mods = closing
- **Domain**: REV
- **Frequency**: MONTHLY
- **Severity**: HIGH

### 6. FLUX_COMMENTS_REQUIRED

- **Purpose**: Ensures all material flux lines have comments
- **Domain**: CLOSE
- **Frequency**: PER_RUN
- **Severity**: MEDIUM

### 7. CASHFLOW_BRIDGE

- **Purpose**: Reconciles indirect vs direct cash flow delta
- **Domain**: BANK
- **Frequency**: MONTHLY
- **Severity**: HIGH

## ⏰ Cron Scheduling

### Control Execution (Every 15 minutes)

```bash
*/15 * * * * /usr/bin/curl -X POST "http://localhost:3000/api/ctrl/cron/execute" \
  -H "X-API-Key: ${CTRL_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "scheduled"}' \
  >> /var/log/aibos/controls-execution.log 2>&1
```

### Exception Escalation (Daily at 9 AM)

```bash
0 9 * * * /usr/bin/curl -X POST "http://localhost:3000/api/ctrl/cron/escalate" \
  -H "X-API-Key: ${CTRL_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "daily_escalation"}' \
  >> /var/log/aibos/controls-escalation.log 2>&1
```

### Close Transition Controls (Every hour during business hours)

```bash
0 9-17 * * 1-5 /usr/bin/curl -X POST "http://localhost:3000/api/ctrl/cron/transition" \
  -H "X-API-Key: ${CTRL_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "close_transition"}' \
  >> /var/log/aibos/controls-transition.log 2>&1
```

### Weekly Summary Report (Mondays at 8 AM)

```bash
0 8 * * 1 /usr/bin/curl -X POST "http://localhost:3000/api/ctrl/cron/summary" \
  -H "X-API-Key: ${CTRL_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"trigger": "weekly_summary", "period": "week"}' \
  >> /var/log/aibos/controls-summary.log 2>&1
```

## 🔐 RBAC Capabilities

- `ctrl:manage` - Create, edit, and delete control definitions and assignments
- `ctrl:assign` - Assign controls to tasks or entities
- `ctrl:run` - Manually trigger control runs and view results
- `ctrl:approve` - Approve control results and exceptions
- `ctrl:waive` - Waive control runs or exceptions
- `ctrl:remediate` - Update exception remediation state
- `ctrl:evidence` - Add and manage control evidence
- `ctrl:report` - View control reports and summaries
- `cert:manage` - Create and manage certification templates
- `cert:sign` - Sign financial certifications
- `cert:report` - View certification reports

## 📊 Monitoring & Alerts

### Key Metrics to Monitor

- Control execution success rate
- Exception resolution time
- SLA breach frequency
- Certification completion rate

### Log Files

- `/var/log/aibos/controls-execution.log` - Control execution logs
- `/var/log/aibos/controls-escalation.log` - Exception escalation logs
- `/var/log/aibos/controls-transition.log` - Close transition logs
- `/var/log/aibos/controls-summary.log` - Summary report logs

### Outbox Events

- `CTRL_FAIL` - Control execution failures
- `CTRL_SLA_BREACH` - SLA breaches
- `CTRL_EXCEPTION` - Exception updates
- `CERT_SIGNED` - Certification sign-offs

## 🚨 Troubleshooting

### Common Issues

#### 1. Controls Not Executing

- Check cron job status: `crontab -l`
- Verify API key permissions
- Check database connectivity
- Review execution logs

#### 2. Exceptions Not Escalating

- Verify SLA due dates are set
- Check approver assignments
- Review escalation logs
- Confirm RBAC permissions

#### 3. Certifications Not Signing

- Verify close run status (REVIEW/APPROVED)
- Check statement templates exist
- Confirm signer role permissions
- Review snapshot generation

### Debug Commands

```bash
# Check control run status
curl "http://localhost:3000/api/ctrl/run?status=RUNNING&limit=5" \
  -H "X-API-Key: your-api-key"

# Check open exceptions
curl "http://localhost:3000/api/ctrl/exceptions?remediation_state=OPEN&limit=10" \
  -H "X-API-Key: your-api-key"

# Check certification status
curl "http://localhost:3000/api/cert/sign?run_id=run-id&limit=10" \
  -H "X-API-Key: your-api-key"
```

## 📈 Performance Optimization

### Database Indexes

- `idx_ctrl_run_status_scheduled_at` - Control run queries
- `idx_ctrl_exception_remediation_state_material` - Exception queries
- `idx_ctrl_assignment_active_sla_due_at` - Assignment queries

### Query Optimization

- Use appropriate filters in API calls
- Limit result sets with pagination
- Monitor slow query logs
- Consider read replicas for reporting

## 🔄 Maintenance

### Weekly Tasks

- Review control performance metrics
- Check exception aging reports
- Verify certification completion rates
- Update control configurations as needed

### Monthly Tasks

- Analyze control effectiveness
- Review and update SLA thresholds
- Audit evidence retention
- Update certification templates

### Quarterly Tasks

- Comprehensive control review
- RBAC permission audit
- Performance optimization review
- Disaster recovery testing

---

## 🎉 Success Criteria

✅ **M26.1 Implementation Complete** when:

- All 10 migrations executed successfully
- Baseline controls seeded for all companies
- API endpoints responding correctly
- Cron jobs scheduled and running
- RBAC permissions configured
- Monitoring and alerting active
- Documentation complete and accessible

**Ready for M26.2 — Close Insights & Benchmarks!** ⚡️
