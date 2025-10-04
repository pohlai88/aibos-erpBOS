# M26.9 — ITGC & UAR Bridge Runbook

## Overview

M26.9 — ITGC & UAR Bridge connects your operational identity landscape (IdP, PAM, DBs, Apps) to the Close Controls suite with **continuous user-access attestations**, **toxic-combo detection**, and **auditor-ready evidence**—all using the M26 patterns you've been shipping.

## Architecture

### Core Components

1. **System Registry** - Centralized registry of IT systems in scope
2. **Connector Engine** - Automated data ingestion from various sources
3. **SoD Engine** - Separation of Duties rule evaluation and violation detection
4. **UAR Engine** - User Access Review campaign management
5. **Break-glass Engine** - Emergency access management with time-bound grants
6. **Evidence Engine** - Immutable snapshots and audit trail management

### Data Flow

```
IT Systems → Connectors → Catalog → SoD Engine → Violations
     ↓           ↓          ↓         ↓           ↓
   Registry → Ingest → Users/Roles → Rules → Evidence
     ↓           ↓          ↓         ↓           ↓
   UAR ← Campaigns ← Items ← Grants ← Violations ← Snapshots
```

## Database Schema

### Core Tables (Migrations 0270-0279)

- **it_system** - IT systems registry
- **it_connector_profile** - Connector configurations
- **it_user** - Users from connected systems
- **it_role** - Roles/Groups from connected systems
- **it_entitlement** - Entitlements (roles, groups, privileges, schemas, tables, actions)
- **it_grant** - User grants (assignments of entitlements to users)
- **it_sod_rule** - Separation of Duties rules
- **it_sod_violation** - SoD violations detected by the engine
- **uar_campaign** - User Access Review campaigns
- **uar_item** - Individual UAR items requiring certification
- **it_breakglass** - Break-glass emergency access records
- **it_snapshot** - Immutable snapshots for audit evidence
- **uar_pack** - UAR evidence packs (eBinders)

## API Endpoints

### Registry & Ingest

- `GET/POST /api/itgc/systems` - Manage IT systems
- `GET/POST /api/itgc/connectors` - Manage connector profiles
- `POST /api/itgc/ingest/run` - Run data ingestion

### Policies & SoD

- `GET/POST /api/itgc/sod/rules` - Manage SoD rules
- `POST /api/itgc/sod/evaluate` - Evaluate SoD rules
- `POST /api/itgc/sod/violation/action` - Take action on violations

### UAR Campaigns

- `GET/POST /api/itgc/uar/campaigns` - Manage UAR campaigns
- `POST /api/itgc/uar/open` - Open UAR campaign
- `POST /api/itgc/uar/decide` - Make certification decisions
- `POST /api/itgc/uar/close` - Close UAR campaign

### Break-glass

- `GET/POST /api/itgc/breakglass/open` - Open emergency access
- `POST /api/itgc/breakglass/close` - Close emergency access

### Evidence & Reports

- `POST /api/itgc/snapshot` - Take evidence snapshots
- `POST /api/itgc/uar/pack` - Build UAR evidence pack
- `GET /api/itgc/reports/overview` - Get overview reports

### Cron Jobs

- `POST /api/itgc/cron/execute` - Execute scheduled ITGC jobs

## RBAC Capabilities

- `itgc:admin` - Full administrative access to ITGC systems, connectors, and policies
- `itgc:ingest` - Ability to run manual data ingestion jobs
- `itgc:campaigns` - Create, open, close UAR campaigns and make certification decisions
- `itgc:breakglass` - Open and close emergency access grants
- `itgc:view` - View ITGC reports, violations, and system information

## Usage Examples

### 1. Add a System and Connector

```bash
# Create IT system
curl -X POST -H "X-API-Key: <id>:<secret>" -H "content-type: application/json" \
  -d '{"code":"OKTA","name":"Okta Prod","kind":"CLOUD","owner_user_id":"<uid>"}' \
  http://localhost:3000/api/itgc/systems

# Create connector profile
curl -X POST -H "X-API-Key: <id>:<secret>" -H "content-type: application/json" \
  -d '{"system_id":"<systemId>","connector":"SCIM","settings":{"baseUrl":"https://.../scim/v2","mapping":{"userId":"id","email":"userName"}},"secret_ref":"<secretId>","schedule_cron":"0 2 * * *"}' \
  http://localhost:3000/api/itgc/connectors
```

### 2. Run Data Ingestion

```bash
# Ad-hoc ingest for specific system
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{"system_id":"<systemId>"}' http://localhost:3000/api/itgc/ingest/run

# Ingest all enabled connectors
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{}' http://localhost:3000/api/itgc/ingest/run
```

### 3. Create and Evaluate SoD Rules

```bash
# Create SoD rule
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{"code":"SOD_AP_CREATE_APPROVE","name":"AP Create vs Approve","severity":"HIGH","logic":{"type":"allOf","entitlements":["CREATE_INVOICE","APPROVE_INVOICE"]}}' \
  http://localhost:3000/api/itgc/sod/rules

# Evaluate SoD rules
curl -X POST -H "X-API-Key: <k>" http://localhost:3000/api/itgc/sod/evaluate

# Take action on violation
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{"violation_id":"<violationId>","action":"waive","note":"Business justification"}' \
  http://localhost:3000/api/itgc/sod/violation/action
```

### 4. UAR Campaign Lifecycle

```bash
# Create UAR campaign
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{"code":"UAR-2025Q1","name":"Q1 Access Review","period_start":"2025-01-01","period_end":"2025-03-31","due_at":"2025-04-15T23:59:59Z"}' \
  http://localhost:3000/api/itgc/uar/campaigns

# Open campaign (creates items)
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{"campaign_id":"<campaignId>","include_systems":["<systemId>"]}' \
  http://localhost:3000/api/itgc/uar/open

# Make certification decisions
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{"campaign_id":"<campaignId>","items":[{"user_id":"<userId>","system_id":"<systemId>","decision":"CERTIFIED"}]}' \
  http://localhost:3000/api/itgc/uar/decide

# Close campaign and build evidence pack
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{"campaign_id":"<campaignId>","build_evidence_pack":true}' \
  http://localhost:3000/api/itgc/uar/close
```

### 5. Break-glass Access Management

```bash
# Open emergency access
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{"system_id":"<systemId>","user_id":"<userId>","expires_at":"2025-01-15T23:59:59Z","ticket":"INC-12345","reason":"Emergency maintenance"}' \
  http://localhost:3000/api/itgc/breakglass/open

# Close emergency access
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{"breakglass_id":"<breakglassId>","reason":"Maintenance completed"}' \
  http://localhost:3000/api/itgc/breakglass/close
```

### 6. Evidence Management

```bash
# Take snapshot
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{"scope":"USERS","systems":["<systemId>"]}' \
  http://localhost:3000/api/itgc/snapshot

# Build UAR evidence pack
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{"campaign_id":"<campaignId>"}' \
  http://localhost:3000/api/itgc/uar/pack
```

## Scheduled Jobs

### Cron Job Triggers

```bash
# Connector pulls (nightly at 2 AM)
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{"trigger":"connector_pull"}' \
  http://localhost:3000/api/itgc/cron/execute

# SoD scan (nightly at 2:30 AM)
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{"trigger":"sod_scan"}' \
  http://localhost:3000/api/itgc/cron/execute

# UAR reminders (daily at 9 AM)
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{"trigger":"uar_reminders"}' \
  http://localhost:3000/api/itgc/cron/execute

# Break-glass expiry check (every 15 minutes)
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{"trigger":"breakglass_expiry"}' \
  http://localhost:3000/api/itgc/cron/execute

# Evidence snapshots (month-end)
curl -X POST -H "X-API-Key: <k>" -H "content-type: application/json" \
  -d '{"trigger":"evidence_snapshots"}' \
  http://localhost:3000/api/itgc/cron/execute
```

## Performance Targets

- **Ingest**: 50k users / 200k grants p95 < 6 min (batched upserts)
- **SoD evaluation**: 200 rules over 200k grants p95 < 90s (set-based SQL + bitmap join)
- **UAR build**: 10k items p95 < 120s (pre-aggregated snapshots)
- **Reports**: sub-300ms with covering indexes

## Security Features

- **Least privilege**: No writeback to IdP/DB—read-only ingestion
- **PII protection**: Strip PII beyond display essentials in snapshots
- **Secure downloads**: Every download routed via short-lived key (M26.8)
- **Secret management**: All connector secrets stored via `secret_ref` (0106)
- **Dual control**: Optional dual control for campaign close

## Integration Points

### M26.4 Evidence Vault

- Snapshots stored as content-addressed blobs
- SHA256 hashes for integrity verification
- Immutable audit trail

### M26.8 Auditor Workspace

- UAR packs published as eBinders
- Auditor grants with expiry
- Watermarked previews

### M26.1 Controls

- SoD violations trigger control failures
- Evidence snapshots support control testing
- Break-glass access monitored

## Monitoring & Alerting

### Key Metrics

- Connector success/failure rates
- SoD violation counts by severity
- UAR campaign completion rates
- Break-glass access frequency
- Evidence snapshot coverage

### Alerts

- Connector failures
- New SoD violations (HIGH/CRITICAL)
- Overdue UAR campaigns
- Expired break-glass access
- Evidence snapshot failures

## Troubleshooting

### Common Issues

1. **Connector failures**

   - Check secret_ref validity
   - Verify endpoint connectivity
   - Review mapping configuration

2. **SoD rule evaluation errors**

   - Validate rule logic syntax
   - Check entitlement/role codes
   - Review user grant data

3. **UAR campaign issues**

   - Verify system ownership
   - Check user/role data completeness
   - Review campaign scope

4. **Break-glass access problems**
   - Verify system/user existence
   - Check expiration times
   - Review ticket references

### Debug Commands

```bash
# Check connector status
curl -H "X-API-Key: <k>" http://localhost:3000/api/itgc/connectors?system_id=<systemId>

# Get SoD violations
curl -H "X-API-Key: <k>" http://localhost:3000/api/itgc/sod/rules?status=OPEN

# Check UAR campaign status
curl -H "X-API-Key: <k>" http://localhost:3000/api/itgc/uar/campaigns

# Get active break-glass records
curl -H "X-API-Key: <k>" http://localhost:3000/api/itgc/breakglass/open
```

## What This Unlocks

- **Real-time control** over privileged access & SoD—evidence at your fingertips
- **Quarterly UAR** becomes a **days-not-weeks** task with immutable proof
- **Auditor delight**: zero-exfiltration, expiring access, watermarked previews
- **Continuous compliance** with automated monitoring and alerting
- **Risk reduction** through toxic combination detection and break-glass controls

## Next Steps

1. **Deploy migrations** 0270-0279
2. **Configure systems** and connectors
3. **Set up SoD rules** for critical processes
4. **Schedule cron jobs** for automated operations
5. **Train users** on UAR campaign management
6. **Integrate with** M26.4 Evidence Vault and M26.8 Auditor Workspace
7. **Monitor performance** and adjust as needed

---

**M26.9 — ITGC & UAR Bridge** is now ready to transform your identity governance and access review processes with enterprise-grade automation, compliance, and audit capabilities! 🚀
