# M26.7 — Attestations Portal (Mgmt & Process Owners)

## Overview

M26.7 delivers quarterly 302/annual 404 sub-certifications with immutable attest packs and escalation. This module rides on M26 controls + M26.4 evidence + M26.6 Close Cockpit, providing a complete attestations management system.

## Features

### ✅ Programs & Campaigns

- Define certification programs (e.g., "Q4 FY2025 302")
- Spin campaigns that auto-create sub-cert tasks for all assignees
- Support for QUARTERLY, ANNUAL, and ADHOC frequencies

### ✅ Questionnaires

- Versioned templates with Y/N, text, multi-select, attachment-required questions
- JSON schema-based question definitions
- Evidence requirement flags per question

### ✅ Attest Tasks

- Per-assignee packets with due dates and reminders
- Exception capture and eBinder links
- State management: OPEN → IN_PROGRESS → SUBMITTED → RETURNED → APPROVED → REVOKED

### ✅ Evidence & eBinder

- Attach M26.4 evidence records
- Final attestation pack is content-addressed with manifest & signature
- SHA256 hash for immutable verification

### ✅ Escalations & SLA

- Integrates with M26.6 Close Cockpit SLA engine
- Comments and @mentions support
- Automatic escalation for overdue tasks

### ✅ Audit-proof

- Hash, signer, timestamp for each pack
- Immutable final state
- Downloadable auditor pack (JSON/ZIP formats)

## Database Schema

### Core Tables

- `attest_program` - Certification programs
- `attest_template` - Questionnaire templates
- `attest_campaign` - Campaign instances
- `attest_task` - Individual attestation tasks
- `attest_response` - Task responses and exceptions
- `attest_evidence_link` - Links to M26.4 evidence
- `attest_pack` - Immutable attestation packs
- `attest_assignment` - Default assignees per scope

### Migrations

- `0250_attest_core.sql` - Core tables
- `0251_attest_assignments.sql` - Assignment table
- `0252_attest_perf_idx.sql` - Performance indexes
- `0253_attest_rbac_caps.sql` - RBAC capabilities
- `0254_attest_fk_hardening.sql` - Foreign key constraints
- `0255_attest_link_close_board.sql` - Close Board integration
- `0256_attest_outbox.sql` - Outbox events
- `0257_attest_defaults.sql` - Seed data
- `0258_attest_views.sql` - Heat map views
- `0259_attest_materialize.sql` - Materialized views (optional)

## RBAC Integration

### Capability Definitions

The attestation system introduces the following RBAC capabilities:

```typescript
export type Capability =
  // ... existing capabilities ...
  | "attest:program" // Manage programs/templates/assignments
  | "attest:campaign" // Issue/close campaigns
  | "attest:respond" // Assignees respond to tasks
  | "attest:approve" // Review/approve tasks
  | "attest:export" // Download packs
  | "close:board:view" // View Close Board items
  | "close:board:manage"; // Manage Close Board items
```

### Role Assignments

**Admin Role** - Full attestation management:

- `attest:program` - Create/update programs, templates, assignments
- `attest:campaign` - Issue and close campaigns
- `attest:respond` - Respond to tasks (as assignee)
- `attest:approve` - Review and approve tasks
- `attest:export` - Download attestation packs
- `close:board:view` - View Close Board items
- `close:board:manage` - Manage Close Board items

**Accountant Role** - Limited attestation access:

- `attest:respond` - Respond to assigned tasks
- `attest:approve` - Approve tasks (if assigned as approver)
- `attest:export` - Download packs for review
- `close:board:view` - View Close Board items

**Ops Role** - Basic attestation access:

- `attest:respond` - Respond to assigned tasks only

### Integration Steps

1. **Add Capabilities to RBAC System**:

   ```typescript
   // In apps/bff/app/lib/rbac.ts
   export type Capability =
     // ... existing capabilities ...
     | "attest:program"
     | "attest:campaign"
     | "attest:respond"
     | "attest:approve"
     | "attest:export"
     | "close:board:view"
     | "close:board:manage";
   ```

2. **Update Role Capabilities**:

   ```typescript
   export const ROLE_CAPS = {
     admin: [
       // ... existing capabilities ...
       "attest:program",
       "attest:campaign",
       "attest:respond",
       "attest:approve",
       "attest:export",
       "close:board:view",
       "close:board:manage",
     ],
     accountant: [
       // ... existing capabilities ...
       "attest:respond",
       "attest:approve",
       "attest:export",
       "close:board:view",
     ],
     ops: [
       // ... existing capabilities ...
       "attest:respond",
     ],
   };
   ```

3. **Verify API Endpoint Protection**:
   All attestation endpoints use `requireCapability()` to enforce RBAC:
   ```typescript
   await requireCapability(auth, "attest:program");
   ```

### Close Board Integration

The Close Board capabilities (`close:board:view`, `close:board:manage`) are used by:

- `/api/close/board` - View and manage Close Board items
- `/api/close/board/action` - Bulk actions on Close Board items
- `/api/close/ingest` - Ingest data into Close Board

These capabilities enable attestation tasks to be synchronized with the Close Board for unified SLA management and escalation workflows.

## API Endpoints

### Admin Endpoints

```
GET/POST /api/attest/programs               (attest:program)
GET/POST /api/attest/templates              (attest:program)
GET/POST /api/attest/assignments            (attest:program)
```

### Campaign Lifecycle

```
POST /api/attest/campaigns/issue            (attest:campaign)
POST /api/attest/campaigns/close            (attest:campaign)
GET  /api/attest/campaigns                  (attest:campaign|attest:program)
```

### Task Management

```
GET  /api/attest/tasks                      (attest:respond|attest:approve)
POST /api/attest/tasks/submit               (attest:respond)
POST /api/attest/tasks/return               (attest:approve)
POST /api/attest/tasks/approve              (attest:approve)
```

### Pack & Exports

```
POST /api/attest/packs/sign                 (attest:approve)
GET  /api/attest/packs/download             (attest:export)
GET  /api/attest/summary                    (attest:export)
```

### Cron Jobs

```
POST /api/attest/cron/sla                   (attest:campaign)
POST /api/attest/cron/execute               (attest:campaign)
```

## RBAC Capabilities

- `attest:program` - Manage programs/templates/assignments
- `attest:campaign` - Issue/close campaigns
- `attest:respond` - Assignees respond to tasks
- `attest:approve` - Review/approve tasks
- `attest:export` - Download packs

## Deployment Checklist

### Pre-Deployment Verification

1. **Database Migrations**:

   ```bash
   # Run migrations in order
   pnpm run migrate:up

   # Verify all attestation tables exist
   psql -d your_db -c "\dt attest_*"
   ```

2. **RBAC Integration**:

   ```bash
   # Verify capabilities are added to rbac.ts
   grep -n "attest:" apps/bff/app/lib/rbac.ts
   grep -n "close:board:" apps/bff/app/lib/rbac.ts
   ```

3. **Service Dependencies**:

   ```bash
   # Verify attestation services are implemented
   ls apps/bff/app/services/attest/
   # Should show: campaign.ts, pack.ts, programs.ts, sla.ts, tasks.ts
   ```

4. **API Endpoints**:
   ```bash
   # Verify all API routes exist
   find apps/bff/app/api/attest -name "*.ts" | wc -l
   # Should show 8+ files
   ```

### Migration Order

Run migrations in this exact order:

1. `0250_attest_core.sql` - Core tables
2. `0251_attest_assignments.sql` - Assignment table
3. `0252_attest_perf_idx.sql` - Performance indexes
4. `0253_attest_rbac_caps.sql` - RBAC capabilities (documentation)
5. `0254_attest_fk_hardening.sql` - Foreign key constraints
6. `0255_attest_link_close_board.sql` - Close Board integration
7. `0256_attest_outbox.sql` - Outbox events
8. `0257_attest_defaults.sql` - Seed data
9. `0258_attest_views.sql` - Heat map views
10. `0259_attest_materialize.sql` - Materialized views (optional)

### Post-Deployment Verification

1. **Health Checks**:

   ```bash
   # Test basic API endpoints
   curl -H "X-API-Key: <id>:<secret>" \
     "http://localhost:3000/api/attest/programs"

   # Should return empty array or existing programs
   ```

2. **RBAC Verification**:

   ```bash
   # Test capability enforcement
   curl -H "X-API-Key: <id>:<secret>" \
     -X POST "http://localhost:3000/api/attest/programs" \
     -d '{"code":"test","name":"Test Program"}'

   # Should succeed for admin, fail for ops
   ```

3. **Service Integration**:

   ```bash
   # Test Close Board integration
   curl -H "X-API-Key: <id>:<secret>" \
     "http://localhost:3000/api/close/board"

   # Should return Close Board items
   ```

4. **Cron Job Setup**:

   ```bash
   # Verify cron jobs are configured
   crontab -l | grep attest

   # Should show SLA tick, notifications, escalations
   ```

### Environment Configuration

Required environment variables:

```bash
# Database connection
DATABASE_URL=postgresql://user:pass@host:port/db

# API authentication
API_KEY_ID=your_api_key_id
API_KEY_SECRET=your_api_key_secret

# Close Board integration (if using external service)
CLOSE_BOARD_API_URL=https://close-board.example.com
CLOSE_BOARD_API_KEY=your_close_board_key

# Evidence Vault integration
EVIDENCE_VAULT_URL=https://evidence.example.com
EVIDENCE_VAULT_API_KEY=your_evidence_key
```

### Rollback Plan

If deployment fails:

1. **Database Rollback**:

   ```bash
   # Rollback migrations
   pnpm run migrate:down --count=10
   ```

2. **Code Rollback**:

   ```bash
   # Revert RBAC changes
   git checkout HEAD~1 -- apps/bff/app/lib/rbac.ts
   ```

3. **Service Rollback**:
   ```bash
   # Remove attestation services
   rm -rf apps/bff/app/services/attest/
   rm -rf apps/bff/app/api/attest/
   ```

### Performance Verification

1. **Response Time Tests**:

   ```bash
   # Test API response times
   time curl -H "X-API-Key: <id>:<secret>" \
     "http://localhost:3000/api/attest/tasks"

   # Should respond in <500ms
   ```

2. **Database Performance**:

   ```bash
   # Check query performance
   psql -d your_db -c "EXPLAIN ANALYZE SELECT * FROM attest_task LIMIT 100;"

   # Should use indexes efficiently
   ```

3. **Memory Usage**:

   ```bash
   # Monitor memory usage during campaign issuance
   ps aux | grep node

   # Should not exceed baseline + 100MB
   ```

## Services

### AttestProgramsService

- `upsertProgram()` - Create/update programs
- `upsertTemplate()` - Create/update templates
- `upsertAssignment()` - Create/update assignments
- `listPrograms()`, `listTemplates()`, `listAssignments()` - List operations

### AttestCampaignService

- `issueCampaign()` - Issue new campaign and create tasks
- `closeCampaign()` - Close campaign
- `listCampaigns()` - List campaigns

### AttestTasksService

- `listTasks()` - List tasks with filtering
- `submitTask()` - Submit task response
- `returnTask()` - Return task for fixes
- `approveTask()` - Approve task

### AttestPackService

- `buildPack()` - Build and sign attestation pack
- `downloadPack()` - Download pack in JSON/ZIP format
- `getPack()` - Get pack by task ID

### AttestSlaService

- `tickSla()` - Update SLA states
- `getSlaSummary()` - Get SLA summary for campaign
- `getHeatMap()` - Get heat map data

## Cron Jobs

### SLA Tick (Every 15 minutes)

```bash
*/15 * * * * curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{"trigger":"sla_tick"}' \
  http://localhost:3000/api/attest/cron/execute
```

### Due Soon Notifications (Every hour)

```bash
0 * * * * curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{"trigger":"due_soon_notifications"}' \
  http://localhost:3000/api/attest/cron/execute
```

### Late Escalations (Every 4 hours)

```bash
0 */4 * * * curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{"trigger":"late_escalations"}' \
  http://localhost:3000/api/attest/cron/execute
```

### Close Board Sync (Every 30 minutes)

```bash
*/30 * * * * curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{"trigger":"close_board_sync"}' \
  http://localhost:3000/api/attest/cron/execute
```

### Campaign Cleanup (Daily at 2 AM)

```bash
0 2 * * * curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{"trigger":"campaign_cleanup"}' \
  http://localhost:3000/api/attest/cron/execute
```

## Quick Start Guide

### 1. Seed Data

```powershell
.\scripts\seed-attestations.ps1
```

### 2. Create Program

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "302-QUARTERLY",
    "name": "SOX 302 Sub-Cert",
    "freq": "QUARTERLY",
    "scope": ["PROCESS:R2R", "PROCESS:P2P"]
  }' \
  http://localhost:3000/api/attest/programs
```

### 3. Create Template

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "302-v1",
    "title": "SOX 302 Questionnaire",
    "version": 1,
    "schema": {
      "version": 1,
      "questions": [
        {
          "id": "q1",
          "label": "Any control changes?",
          "type": "YN",
          "requireEvidence": false,
          "required": true
        }
      ]
    }
  }' \
  http://localhost:3000/api/attest/templates
```

### 4. Create Assignment

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "programCode": "302-QUARTERLY",
    "scopeKey": "PROCESS:R2R",
    "assigneeId": "<user_id>",
    "approverId": "<manager_id>"
  }' \
  http://localhost:3000/api/attest/assignments
```

### 5. Issue Campaign

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "programCode": "302-QUARTERLY",
    "templateCode": "302-v1",
    "period": "2025-Q4",
    "dueAt": "2026-01-10T16:00:00Z"
  }' \
  http://localhost:3000/api/attest/campaigns
```

### 6. Submit Task

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "<task_id>",
    "answers": {"q1": "N"},
    "evidenceIds": ["<evidence_id>"]
  }' \
  http://localhost:3000/api/attest/tasks/submit
```

### 7. Approve Task

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{"taskId": "<task_id>"}' \
  http://localhost:3000/api/attest/tasks/approve
```

### 8. Sign Pack

```bash
curl -X POST -H "X-API-Key: <id>:<secret>" \
  -H "Content-Type: application/json" \
  -d '{"taskId": "<task_id>"}' \
  http://localhost:3000/api/attest/packs/sign
```

### 9. Download Pack

```bash
curl -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/attest/packs/download?taskId=<task_id>&format=json"
```

## Data Model Examples

### Template Schema

```json
{
  "version": 2,
  "questions": [
    {
      "id": "q1",
      "label": "Any material control changes?",
      "type": "YN",
      "requireEvidence": false,
      "required": true
    },
    {
      "id": "q2",
      "label": "Exceptions to policy?",
      "type": "TEXT",
      "requireEvidence": false,
      "required": false
    },
    {
      "id": "q3",
      "label": "Attach JE continuity evidence",
      "type": "EVIDENCE",
      "requireEvidence": true,
      "required": true
    }
  ]
}
```

### Attest Pack Manifest

```json
{
  "taskId": "task_123",
  "template": {
    "code": "302-v2",
    "version": 2
  },
  "answers": {
    "q1": "Y",
    "q2": "None",
    "q3": "attached"
  },
  "evidence": [
    {
      "evdRecordId": "evd_456",
      "sha256": "abc123...",
      "name": "je_continuity.csv"
    }
  ],
  "assignee": {
    "id": "user_789",
    "display": "Jane Controller"
  },
  "timestamps": {
    "issued": "2025-01-01T00:00:00Z",
    "submitted": "2025-01-15T10:30:00Z",
    "approved": "2025-01-16T14:20:00Z"
  },
  "sha256": "def456..."
}
```

## Integration Points

### M26.4 Evidence Vault

- Tasks can link to evidence records
- Pack manifests include evidence metadata
- SHA256 hashes for integrity verification

### M26.6 Close Cockpit

- SLA engine integration for due dates
- Heat map visualization
- Escalation workflows
- Close Board item synchronization

### Outbox Events

- `ATTEST_TASK_ISSUED` - Task created
- `ATTEST_DUE_SOON` - Task approaching due date
- `ATTEST_LATE` - Task overdue
- `ATTEST_SUBMITTED` - Task submitted
- `ATTEST_RETURNED` - Task returned for fixes
- `ATTEST_APPROVED` - Task approved
- `ATTEST_PACK_SIGNED` - Pack signed

## Testing

Run the test suite:

```bash
pnpm test apps/bff/app/services/attest/__tests__/attest.test.ts
```

## Performance Considerations

### Database Optimization

- **Indexes**: Optimized indexes on `company_id`, `campaign_id`, `state`, `sla_state`
- **Pagination**: Large result sets paginated with configurable limits
- **Materialized Views**: Heavy reporting queries use materialized views
- **Query Optimization**: Complex queries analyzed and optimized

### Performance Targets

- **API Response Time**: < 500ms for 95% of requests
- **Database Queries**: < 100ms for simple queries, < 1s for complex reports
- **Campaign Issuance**: < 5s for campaigns with < 100 tasks
- **Pack Generation**: < 2s for standard attestation packs
- **Concurrent Users**: Support 50+ concurrent users without degradation

### Monitoring & Observability

#### Key Metrics to Monitor

1. **API Performance**:

   - Response time percentiles (p50, p95, p99)
   - Request rate per endpoint
   - Error rate by endpoint
   - Database connection pool utilization

2. **Business Metrics**:

   - Campaign completion rate
   - SLA breach rate
   - Task submission velocity
   - Pack generation success rate

3. **System Health**:
   - Memory usage trends
   - CPU utilization
   - Database query performance
   - Background job processing time

#### Alerting Rules

```yaml
# Example alerting configuration
alerts:
  - name: "High API Response Time"
    condition: "avg(response_time) > 1000ms"
    duration: "5m"
    severity: "warning"

  - name: "SLA Breach Rate High"
    condition: "sla_breach_rate > 10%"
    duration: "10m"
    severity: "critical"

  - name: "Database Connection Pool Exhausted"
    condition: "db_connections_active > 80%"
    duration: "2m"
    severity: "critical"
```

#### Dashboard Queries

```sql
-- Campaign Performance Dashboard
SELECT
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as campaigns_issued,
  AVG(EXTRACT(EPOCH FROM (closed_at - created_at))/3600) as avg_duration_hours
FROM attest_campaign
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY hour
ORDER BY hour;

-- Task Completion Velocity
SELECT
  campaign_id,
  COUNT(*) as total_tasks,
  COUNT(CASE WHEN state = 'APPROVED' THEN 1 END) as completed_tasks,
  ROUND(COUNT(CASE WHEN state = 'APPROVED' THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
FROM attest_task
GROUP BY campaign_id
ORDER BY completion_rate DESC;

-- SLA Performance
SELECT
  sla_state,
  COUNT(*) as task_count,
  AVG(EXTRACT(EPOCH FROM (due_at - created_at))/86400) as avg_days_to_due
FROM attest_task
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY sla_state;
```

### Scalability Considerations

- **Horizontal Scaling**: Stateless services can scale horizontally
- **Database Scaling**: Read replicas for reporting queries
- **Caching Strategy**: Redis cache for frequently accessed data
- **Background Processing**: Queue-based processing for heavy operations

### Load Testing

```bash
# Example load test scenarios
# 1. Campaign Issuance Load Test
artillery run --config artillery-config.yml campaign-load-test.yml

# 2. Concurrent Task Submission
artillery run --config artillery-config.yml task-submission-test.yml

# 3. Pack Generation Stress Test
artillery run --config artillery-config.yml pack-generation-test.yml
```

### Performance Troubleshooting

1. **Slow API Responses**:

   - Check database query performance
   - Verify index usage with EXPLAIN ANALYZE
   - Review application logs for bottlenecks

2. **High Memory Usage**:

   - Monitor for memory leaks in long-running processes
   - Check for large result sets not being paginated
   - Review background job memory consumption

3. **Database Performance Issues**:
   - Analyze slow query log
   - Check for missing indexes
   - Review connection pool configuration

### Background Processing

- **SLA Tick**: Every 15 minutes, processes ~1000 tasks
- **Notifications**: Every hour, sends ~500 notifications
- **Escalations**: Every 4 hours, processes ~100 escalations
- **Cleanup**: Daily at 2 AM, archives old campaigns

## Security

### Access Control

- **RBAC Enforcement**: All endpoints protected with `requireCapability()` checks
- **Role-Based Access**: Admin (full), Accountant (limited), Ops (basic) access levels
- **API Key Authentication**: All requests require valid API key with proper scopes
- **Session Management**: User sessions tracked for audit purposes

### Data Protection

- **Content-Addressed Packs**: SHA256 hashes ensure data integrity
- **Immutable Final State**: Signed packs cannot be modified after approval
- **Encryption at Rest**: Sensitive data encrypted in database
- **PII Handling**: Personal information redacted based on evidence policies

### Audit Trail

- **State Change Logging**: All task state transitions logged with timestamps
- **User Attribution**: Every action tied to authenticated user ID
- **Digital Signatures**: Pack signatures include signer identity and timestamp
- **Outbox Events**: All significant events published for external audit systems

### Compliance

- **SOX Compliance**: Attestation packs meet SOX 302/404 requirements
- **Data Retention**: Configurable retention periods for different data types
- **Right to Erasure**: GDPR-compliant data deletion procedures
- **Audit Logging**: Comprehensive logs for external auditor review

### Encryption Details

- **In Transit**: All API communications use TLS 1.3
- **At Rest**: Database encryption using AES-256
- **Key Management**: API keys rotated every 90 days
- **Hash Algorithms**: SHA-256 for content verification, SHA-3 for signatures

### Access Patterns

- **Principle of Least Privilege**: Users only access data they need
- **Data Segregation**: Company data isolated by tenant
- **Evidence Access**: Evidence visibility controlled by PII level
- **Pack Downloads**: Download access logged and rate-limited

### Security Monitoring

- **Failed Authentication**: Multiple failed attempts trigger account lockout
- **Unusual Access Patterns**: Anomaly detection for suspicious activity
- **Rate Limiting**: API endpoints protected against abuse
- **Audit Log Analysis**: Regular review of access patterns and changes

## Data Retention Policy

### SOX Compliance Requirements

- **Attestation Packs**: Retained for 7 years (SOX requirement)
- **Audit Trails**: Retained for 7 years minimum
- **Evidence Links**: Retained for 7 years or until pack expiry
- **Task Responses**: Retained for 7 years for audit purposes

### Retention Periods by Data Type

| Data Type         | Retention Period | Archive Location | Deletion Policy                 |
| ----------------- | ---------------- | ---------------- | ------------------------------- |
| Attestation Packs | 7 years          | Cold storage     | Automatic deletion after expiry |
| Task Responses    | 7 years          | Database         | Soft delete, then hard delete   |
| Evidence Links    | 7 years          | Database         | Cascade delete with packs       |
| Audit Logs        | 7 years          | Log aggregation  | Compressed after 1 year         |
| Campaign Metadata | 3 years          | Database         | Archive to cold storage         |
| Template Versions | 5 years          | Database         | Keep for historical reference   |
| SLA History       | 2 years          | Database         | Aggregated into reports         |

### Data Lifecycle Management

#### Active Phase (0-1 year)

- **Hot Storage**: All data in primary database
- **Full Access**: Complete read/write access
- **Real-time Processing**: SLA updates, notifications active

#### Archive Phase (1-3 years)

- **Warm Storage**: Moved to read-optimized storage
- **Read-Only Access**: Data immutable, read-only queries
- **Reduced Processing**: SLA processing suspended

#### Cold Storage Phase (3-7 years)

- **Cold Storage**: Compressed, encrypted storage
- **Audit Access Only**: Access only for compliance/audit
- **Minimal Processing**: No background processing

#### Deletion Phase (7+ years)

- **Soft Delete**: Marked for deletion, 30-day grace period
- **Hard Delete**: Permanent removal from all systems
- **Audit Trail**: Deletion event logged for compliance

### Archival Process

```bash
# Daily archival job (runs at 3 AM)
#!/bin/bash
# Archive campaigns older than 1 year
psql -d attest_db -c "
  UPDATE attest_campaign
  SET archived_at = NOW()
  WHERE created_at < NOW() - INTERVAL '1 year'
  AND archived_at IS NULL;
"

# Move archived data to cold storage
aws s3 cp /data/archived/ s3://attest-cold-storage/archived/ --recursive
```

### Compliance Procedures

#### Right to Erasure (GDPR)

```sql
-- Soft delete user data
UPDATE attest_task
SET deleted_at = NOW(),
    assignee_id = NULL,
    approver_id = NULL
WHERE assignee_id = $user_id OR approver_id = $user_id;

-- Hard delete after grace period
DELETE FROM attest_task
WHERE deleted_at < NOW() - INTERVAL '30 days';
```

#### Data Export (GDPR)

```sql
-- Export all user data
SELECT
  t.id as task_id,
  t.state,
  t.created_at,
  t.submitted_at,
  r.answers,
  p.manifest
FROM attest_task t
LEFT JOIN attest_response r ON t.id = r.task_id
LEFT JOIN attest_pack p ON t.id = p.task_id
WHERE t.assignee_id = $user_id OR t.approver_id = $user_id;
```

#### Audit Trail Preservation

- **Immutable Logs**: All state changes logged with cryptographic signatures
- **Chain of Custody**: Complete audit trail from creation to deletion
- **External Verification**: Logs can be verified by external auditors
- **Tamper Detection**: Any modification attempts are detected and logged

### Storage Optimization

#### Compression Strategy

- **Active Data**: Uncompressed for performance
- **Archived Data**: Compressed with gzip (60-80% reduction)
- **Cold Data**: Highly compressed with LZ4 (80-90% reduction)

#### Index Management

- **Active Indexes**: Full indexes for all queries
- **Archive Indexes**: Reduced indexes for common queries only
- **Cold Indexes**: Minimal indexes for audit access only

### Monitoring & Alerts

```yaml
# Data retention monitoring
retention_alerts:
  - name: "Data Approaching Retention Limit"
    condition: "data_age > retention_period - 30_days"
    action: "notify_data_team"

  - name: "Failed Archival Job"
    condition: "archival_job_failed"
    action: "alert_oncall"

  - name: "Storage Quota Exceeded"
    condition: "storage_usage > 90%"
    action: "escalate_to_admin"
```

## What This Unlocks Next

- **M26.8 Auditor Workspace** — Read-only access to packs/evidence with watermark & expiry
- **M26.9 ITGC/UAR Bridge** — Add IT access attestation flows into the same engine
- Rollups for **302→404** narratives in the **Close Summary** pack (M26.6/M26.4 integration)

## Integration Testing Guide

### End-to-End Test Scenarios

#### Scenario 1: Complete Attestation Workflow

```bash
#!/bin/bash
# Complete workflow test
set -e

echo "=== Starting Complete Attestation Workflow Test ==="

# 1. Create program
PROGRAM_RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -X POST "http://localhost:3000/api/attest/programs" \
  -d '{
    "code": "TEST-302-Q4",
    "name": "Test SOX 302 Program",
    "freq": "QUARTERLY",
    "scope": ["PROCESS:R2R"]
  }')

PROGRAM_ID=$(echo $PROGRAM_RESPONSE | jq -r '.id')
echo "✓ Created program: $PROGRAM_ID"

# 2. Create template
TEMPLATE_RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -X POST "http://localhost:3000/api/attest/templates" \
  -d '{
    "code": "TEST-302-v1",
    "title": "Test SOX 302 Template",
    "version": 1,
    "schema": {
      "version": 1,
      "questions": [
        {
          "id": "q1",
          "label": "Any control changes?",
          "type": "YN",
          "requireEvidence": false,
          "required": true
        }
      ]
    }
  }')

TEMPLATE_ID=$(echo $TEMPLATE_RESPONSE | jq -r '.id')
echo "✓ Created template: $TEMPLATE_ID"

# 3. Create assignment
ASSIGNMENT_RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -X POST "http://localhost:3000/api/attest/assignments" \
  -d '{
    "programCode": "TEST-302-Q4",
    "scopeKey": "PROCESS:R2R",
    "assigneeId": "'$TEST_USER_ID'",
    "approverId": "'$TEST_MANAGER_ID'"
  }')

echo "✓ Created assignment"

# 4. Issue campaign
CAMPAIGN_RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -X POST "http://localhost:3000/api/attest/campaigns" \
  -d '{
    "programCode": "TEST-302-Q4",
    "templateCode": "TEST-302-v1",
    "period": "2025-Q4",
    "dueAt": "'$(date -d '+7 days' -Iseconds)'"
  }')

CAMPAIGN_ID=$(echo $CAMPAIGN_RESPONSE | jq -r '.id')
echo "✓ Issued campaign: $CAMPAIGN_ID"

# 5. Submit task
TASKS_RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" \
  "http://localhost:3000/api/attest/tasks?campaignId=$CAMPAIGN_ID")

TASK_ID=$(echo $TASKS_RESPONSE | jq -r '.tasks[0].id')

SUBMIT_RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -X POST "http://localhost:3000/api/attest/tasks/submit" \
  -d '{
    "taskId": "'$TASK_ID'",
    "answers": {"q1": "N"}
  }')

echo "✓ Submitted task: $TASK_ID"

# 6. Approve task
APPROVE_RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -X POST "http://localhost:3000/api/attest/tasks/approve" \
  -d '{"taskId": "'$TASK_ID'"}')

echo "✓ Approved task"

# 7. Sign pack
SIGN_RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -X POST "http://localhost:3000/api/attest/packs/sign" \
  -d '{"taskId": "'$TASK_ID'"}')

echo "✓ Signed pack"

# 8. Download pack
DOWNLOAD_RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" \
  "http://localhost:3000/api/attest/packs/download?taskId=$TASK_ID&format=json")

echo "✓ Downloaded pack"

echo "=== Complete Attestation Workflow Test PASSED ==="
```

#### Scenario 2: M26.4 Evidence Integration

```bash
#!/bin/bash
# Evidence integration test
set -e

echo "=== Starting Evidence Integration Test ==="

# 1. Create evidence record
EVIDENCE_RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -X POST "http://localhost:3000/api/evidence/manifests" \
  -d '{
    "control_id": "TEST-CTRL-001",
    "run_id": "TEST-RUN-001",
    "bundle_name": "test-evidence-bundle",
    "items": [
      {
        "item_type": "CSV",
        "file_name": "test-data.csv",
        "content_hash": "abc123def456"
      }
    ]
  }')

EVIDENCE_ID=$(echo $EVIDENCE_RESPONSE | jq -r '.id')
echo "✓ Created evidence: $EVIDENCE_ID"

# 2. Submit task with evidence link
TASK_RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -X POST "http://localhost:3000/api/attest/tasks/submit" \
  -d '{
    "taskId": "'$TASK_ID'",
    "answers": {"q1": "Y"},
    "evidenceIds": ["'$EVIDENCE_ID'"]
  }')

echo "✓ Linked evidence to task"

# 3. Verify evidence appears in pack
PACK_RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" \
  "http://localhost:3000/api/attest/packs/download?taskId=$TASK_ID&format=json")

EVIDENCE_IN_PACK=$(echo $PACK_RESPONSE | jq -r '.evidence[0].evdRecordId')
if [ "$EVIDENCE_IN_PACK" = "$EVIDENCE_ID" ]; then
  echo "✓ Evidence correctly included in pack"
else
  echo "✗ Evidence not found in pack"
  exit 1
fi

echo "=== Evidence Integration Test PASSED ==="
```

#### Scenario 3: M26.6 Close Board Integration

```bash
#!/bin/bash
# Close Board integration test
set -e

echo "=== Starting Close Board Integration Test ==="

# 1. Create Close Board item
BOARD_RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -X POST "http://localhost:3000/api/close/board" \
  -d '{
    "period": "2025-Q4",
    "process": "R2R",
    "kind": "ATTESTATION",
    "title": "Test Attestation Task",
    "owner_id": "'$TEST_USER_ID'",
    "due_at": "'$(date -d '+7 days' -Iseconds)'"
  }')

BOARD_ITEM_ID=$(echo $BOARD_RESPONSE | jq -r '.id')
echo "✓ Created Close Board item: $BOARD_ITEM_ID"

# 2. Link attestation task to Close Board item
LINK_RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -X POST "http://localhost:3000/api/attest/tasks/link" \
  -d '{
    "taskId": "'$TASK_ID'",
    "closeItemId": "'$BOARD_ITEM_ID'"
  }')

echo "✓ Linked task to Close Board item"

# 3. Verify SLA synchronization
SLA_RESPONSE=$(curl -s -H "X-API-Key: $API_KEY" \
  "http://localhost:3000/api/attest/summary?campaignId=$CAMPAIGN_ID")

SLA_STATE=$(echo $SLA_RESPONSE | jq -r '.tasks[0].sla_state')
if [ "$SLA_STATE" != "null" ]; then
  echo "✓ SLA state synchronized: $SLA_STATE"
else
  echo "✗ SLA state not synchronized"
  exit 1
fi

echo "=== Close Board Integration Test PASSED ==="
```

### Load Testing Scenarios

#### Campaign Issuance Load Test

```yaml
# artillery-config.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      X-API-Key: "${API_KEY}"
      Content-Type: "application/json"

scenarios:
  - name: "Campaign Issuance Load Test"
    weight: 100
    flow:
      - post:
          url: "/api/attest/campaigns"
          json:
            programCode: "LOAD-TEST-302"
            templateCode: "LOAD-TEST-v1"
            period: "2025-Q4"
            dueAt: "2026-01-10T16:00:00Z"
          expect:
            - statusCode: 200
```

#### Concurrent Task Submission Test

```yaml
# task-submission-test.yml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 300
      arrivalRate: 50
  defaults:
    headers:
      X-API-Key: "${API_KEY}"
      Content-Type: "application/json"

scenarios:
  - name: "Concurrent Task Submission"
    weight: 100
    flow:
      - get:
          url: "/api/attest/tasks"
          expect:
            - statusCode: 200
      - post:
          url: "/api/attest/tasks/submit"
          json:
            taskId: "{{ $randomString() }}"
            answers: { "q1": "N" }
          expect:
            - statusCode: [200, 400] # 400 for invalid task ID is expected
```

### Integration Test Automation

#### CI/CD Pipeline Integration

```yaml
# .github/workflows/attestation-integration-tests.yml
name: Attestation Integration Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: pnpm install

      - name: Run database migrations
        run: pnpm run migrate:up
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Seed test data
        run: pnpm run seed:test

      - name: Start application
        run: pnpm run dev &
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          API_KEY_ID: test-key-id
          API_KEY_SECRET: test-key-secret

      - name: Wait for application
        run: npx wait-on http://localhost:3000/api/health

      - name: Run integration tests
        run: |
          chmod +x scripts/integration-tests.sh
          ./scripts/integration-tests.sh
        env:
          API_KEY: test-key-id:test-key-secret
          TEST_USER_ID: test-user-123
          TEST_MANAGER_ID: test-manager-456

      - name: Run load tests
        run: |
          npm install -g artillery
          artillery run tests/load/campaign-load-test.yml

      - name: Cleanup
        run: pnpm run migrate:down
```

### Test Data Management

#### Test Data Setup

```sql
-- test-data-setup.sql
-- Create test users
INSERT INTO users (id, email, role) VALUES
  ('test-user-123', 'testuser@example.com', 'accountant'),
  ('test-manager-456', 'testmanager@example.com', 'admin'),
  ('test-ops-789', 'testops@example.com', 'ops');

-- Create test programs
INSERT INTO attest_program (id, company_id, code, name, freq, scope, created_by, updated_by) VALUES
  ('test-prog-001', 'test-company', 'TEST-302-Q4', 'Test SOX 302', 'QUARTERLY', ARRAY['PROCESS:R2R'], 'test-manager-456', 'test-manager-456');

-- Create test templates
INSERT INTO attest_template (id, company_id, code, title, version, schema, created_by, updated_by) VALUES
  ('test-tmpl-001', 'test-company', 'TEST-302-v1', 'Test Template', 1, '{"version":1,"questions":[{"id":"q1","label":"Test question","type":"YN","required":true}]}', 'test-manager-456', 'test-manager-456');
```

#### Test Environment Cleanup

```bash
#!/bin/bash
# cleanup-test-data.sh
echo "Cleaning up test data..."

# Remove test campaigns
psql -d test_db -c "DELETE FROM attest_campaign WHERE code LIKE 'TEST-%';"

# Remove test programs
psql -d test_db -c "DELETE FROM attest_program WHERE code LIKE 'TEST-%';"

# Remove test templates
psql -d test_db -c "DELETE FROM attest_template WHERE code LIKE 'TEST-%';"

# Remove test users
psql -d test_db -c "DELETE FROM users WHERE email LIKE '%@example.com';"

echo "Test data cleanup completed"
```

## Troubleshooting

### Common Issues

1. **Tasks not created after campaign issue**

   - Check assignments exist for the program
   - Verify template is active
   - Check campaign state is ISSUED

2. **SLA not updating**

   - Verify cron job is running
   - Check task states are OPEN or IN_PROGRESS
   - Verify due dates are set correctly

3. **Pack signing fails**
   - Ensure task is in APPROVED state
   - Check response exists
   - Verify template schema is valid

### Debug Commands

```bash
# Check campaign status
curl -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/attest/campaigns"

# Check task status
curl -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/attest/tasks?campaignId=<campaign_id>"

# Check SLA summary
curl -H "X-API-Key: <id>:<secret>" \
  "http://localhost:3000/api/attest/summary?campaignId=<campaign_id>"
```

## Support

For issues or questions:

1. Check the logs for error messages
2. Verify RBAC capabilities are assigned
3. Check database constraints and foreign keys
4. Review outbox events for processing status
