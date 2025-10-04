# M27.2 — OpsCC Playbook Studio + Guarded Autonomy Runbook

## Overview

M27.2 extends the OpsCC (M27.1) with **visual rule/playbook editing**, **git-like versioning**, **dry-run sandboxes**, **blast-radius caps**, **human-in-the-loop approvals**, **canary mode**, and **post-action verification with rollback capabilities**. This transforms alerts into safe, explainable actions with less swivel-chair operations.

## Features

### 🎨 Visual Rule/Playbook Editor
- **Drag-and-drop interface** for creating rules and playbooks
- **Schema validation** with real-time feedback
- **Auto-versioning** with git-like history tracking
- **Change summaries** for audit trails

### 🔒 Guarded Autonomy
- **Human-in-the-loop approvals** with premortem diffs and impact estimates
- **Dual-control requirements** for high-risk operations
- **Blast-radius enforcement** with safety caps
- **Canary mode** for scoped subset testing before global rollout

### 🛡️ Safety & Verification
- **Dry-run sandboxes** for safe testing
- **Post-action verification** with outcome checks
- **Automatic rollback triggers** when guardrails are violated
- **Comprehensive audit trails** for compliance

### 📊 Observability
- **Success/failure rates** tracking
- **P50/P95/P99 duration** metrics
- **Suppressed/executed counts** analytics
- **Blast-radius impact** monitoring

## Architecture

### Database Schema (Migrations 0290-0293)

#### Core Tables
- **`ops_playbook_version`** - Git-like versioning for playbooks
- **`ops_rule_version`** - Git-like versioning for rules
- **`ops_dry_run_execution`** - Sandbox execution records
- **`ops_canary_execution`** - Canary mode execution tracking
- **`ops_approval_request`** - Human-in-the-loop approval workflow
- **`ops_action_verification`** - Post-action verification and rollback hooks
- **`ops_execution_metrics`** - Observability metrics
- **`ops_blast_radius_log`** - Blast radius tracking for safety

#### Key Features
- **Single active version** enforcement via triggers
- **Automatic expiration** of approval requests
- **Performance indexes** for common query patterns
- **Foreign key constraints** for referential integrity

### Services

#### PlaybookStudioService
- **Version Management**: Create, list, and manage playbook/rule versions
- **Visual Editor**: Save/load definitions from visual editor
- **Dry-Run Execution**: Execute playbooks safely in sandbox
- **Canary Mode**: Execute on scoped subsets before global rollout
- **Approval Workflow**: Human-in-the-loop approval management
- **Action Verification**: Post-action verification and rollback triggers
- **Observability**: Metrics and blast radius tracking

### API Endpoints

#### Versioning
- `POST /api/opscc/playbook-versions` - Create playbook version
- `GET /api/opscc/playbook-versions` - Get playbook version history
- `POST /api/opscc/rule-versions` - Create rule version
- `GET /api/opscc/rule-versions` - Get rule version history

#### Visual Editor
- `POST /api/opscc/visual-editor` - Save from visual editor
- `GET /api/opscc/visual-editor` - Load for visual editor

#### Dry-Run Sandbox
- `POST /api/opscc/dry-run` - Execute dry-run sandbox test
- `GET /api/opscc/dry-run` - Get dry-run execution history

#### Canary Mode
- `POST /api/opscc/canary` - Execute canary mode deployment
- `GET /api/opscc/canary` - Get canary execution status

#### Approval Workflow
- `POST /api/opscc/approvals` - Create approval request
- `PUT /api/opscc/approvals` - Process approval decision
- `GET /api/opscc/approvals` - Get approval requests

#### Action Verification
- `POST /api/opscc/verification` - Verify action outcome
- `GET /api/opscc/verification` - Get verification results

#### Observability
- `GET /api/opscc/observability?endpoint=metrics` - Get execution metrics
- `GET /api/opscc/observability?endpoint=blast-radius` - Get blast radius data

## Deployment Steps

### 1. Database Migrations

Run the following migrations in order:

```bash
# Navigate to project root
cd C:\AI-BOS\aibos-erpBOS

# Run M27.2 migrations
psql -d $DB -f packages/adapters/db/migrations/0290_ops_playbook_studio.sql
psql -d $DB -f packages/adapters/db/migrations/0291_ops_rbac_studio.sql
psql -d $DB -f packages/adapters/db/migrations/0292_ops_perf_idx_studio.sql
psql -d $DB -f packages/adapters/db/migrations/0293_ops_fk_hardening_studio.sql
```

### 2. Verify Migration Success

```sql
-- Check that all tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE 'ops_%'
ORDER BY table_name;

-- Check that indexes were created
SELECT indexname FROM pg_indexes
WHERE tablename LIKE 'ops_%'
ORDER BY indexname;
```

### 3. Deploy Application Code

```bash
# Build and deploy the application
pnpm -w build
pnpm -w deploy
```

### 4. Configure RBAC Capabilities

The system automatically creates the following capabilities:

- `ops:playbook:create` - Create new playbooks
- `ops:playbook:edit` - Edit existing playbooks
- `ops:playbook:version` - Create and manage playbook versions
- `ops:playbook:dryrun` - Execute dry-run sandbox tests
- `ops:playbook:approve` - Approve playbook executions
- `ops:playbook:canary` - Execute canary mode deployments
- `ops:playbook:rollback` - Trigger rollback operations
- `ops:rule:create` - Create new rules
- `ops:rule:edit` - Edit existing rules
- `ops:rule:version` - Create and manage rule versions
- `ops:rule:test` - Test rules against historical data
- `ops:blast:view` - View blast radius information
- `ops:blast:configure` - Configure blast radius limits
- `ops:metrics:view` - View execution metrics and analytics
- `ops:verification:view` - View action verification results
- `ops:verification:configure` - Configure verification rules

## Integration Points

### M22/M23/M24/M25/M26 Action Integrations

The PlaybookStudioService integrates with existing domain services:

#### M22 Cash Flow Actions
- `cash_forecast_update` - Update cash flow forecasts
- `cash_position_alert` - Alert on cash position changes

#### M23 AP Actions  
- `ap_send_payment` - Send payment instructions
- `ap_hold_payment` - Hold payments for approval
- `ap_release_payment` - Release held payments

#### M24 AR Actions
- `ar_send_dunning` - Send dunning communications
- `ar_hold_invoice` - Hold invoices for collection
- `ar_release_invoice` - Release held invoices

#### M25 Revenue Actions
- `rev_generate_invoice` - Generate invoices
- `rev_process_credit` - Process credit memos
- `rev_update_contract` - Update contract terms

#### M26 Close Actions
- `close_lock_period` - Lock accounting periods
- `close_generate_report` - Generate close reports
- `close_approve_flux` - Approve flux analysis

### Outcome Attestation & Rollback Hooks

Each action includes:
- **Expected outcome** definition
- **Verification rules** for success criteria
- **Rollback procedures** for failure scenarios
- **Audit trail** for compliance

## Usage Examples

### 1. Create Playbook Version

```typescript
const version = await playbookStudio.createPlaybookVersion(companyId, userId, {
    playbook_id: "pb-123",
    name: "AR Dunning Process v2",
    description: "Updated dunning process with new templates",
    steps: [
        {
            action_code: "ar_send_dunning",
            payload: { template_id: "template-v2", severity: "HIGH" },
            when: "customer.dso > 30",
            on_error: "CONTINUE"
        }
    ],
    max_blast_radius: 50,
    dry_run_default: true,
    require_dual_control: true,
    change_summary: "Added severity-based template selection"
});
```

### 2. Execute Dry-Run Test

```typescript
const result = await playbookStudio.executeDryRun(
    companyId,
    userId,
    "pb-123",
    2, // version 2
    { customer_segment: "enterprise" }
);

console.log(`Dry-run completed in ${result.total_duration_ms}ms`);
console.log(`Steps executed: ${result.steps.length}`);
```

### 3. Canary Mode Execution

```typescript
const canary = await playbookStudio.executeCanary(companyId, userId, {
    fire_id: "fire-456",
    playbook_id: "pb-123",
    canary_scope: {
        entity_type: "customer",
        filter_criteria: { segment: "enterprise" },
        percentage: 5,
        max_entities: 10
    },
    dry_run: false
});
```

### 4. Approval Workflow

```typescript
const approval = await playbookStudio.createApprovalRequest(companyId, userId, {
    fire_id: "fire-456",
    playbook_id: "pb-123",
    approval_type: "BLAST_RADIUS",
    impact_estimate: {
        customers_affected: 25,
        estimated_impact: "Medium risk"
    },
    diff_summary: {
        changes: ["Updated dunning template", "Added severity filter"],
        risk_factors: ["New template not tested"]
    },
    blast_radius_count: 25,
    risk_score: 0.3,
    expires_in_hours: 24
});
```

### 5. Action Verification

```typescript
const verification = await playbookStudio.verifyActionOutcome(companyId, userId, {
    fire_id: "fire-456",
    step_id: "step-789",
    action_code: "ar_send_dunning",
    verification_type: "OUTCOME_CHECK",
    expected_outcome: {
        emails_sent: 25,
        success_rate: 95
    },
    verification_rules: [
        {
            rule_type: "success_rate",
            threshold: { min: 90 },
            action: "PASS"
        },
        {
            rule_type: "blast_radius",
            threshold: { max: 50 },
            action: "ROLLBACK"
        }
    ]
});
```

## Performance Considerations

- **Dry-run execution** target: p95 < 2s for 10-step playbooks
- **Canary execution** target: p95 < 30s for 5% subset
- **Approval workflow** target: p95 < 1s for approval decisions
- **Verification** target: p95 < 5s for outcome checks
- **Database indexes** optimized for common query patterns
- **Automated cleanup** of old dry-run executions (configurable retention)

## Definition of Done

✅ **Visual Editor**: Create/edit/clone rules & playbooks with schema validation and git-like history  
✅ **Canary Mode**: Auto-execute on scoped subset (e.g., 5% customers) before global rollout  
✅ **Blast-Radius Caps**: Enforce safety limits with dual-control approvals working end-to-end  
✅ **Action Verification**: Post-action outcome attestation + rollback hooks wired to domain services  
✅ **Observability**: Success/failure rates, p50/p95 durations, suppressed/executed counts  
✅ **RBAC**: Proper capability enforcement for all M27.2 operations  
✅ **Performance**: All operations meet p95 latency targets  
✅ **Audit Trail**: Complete audit trail for compliance and debugging  

## Support

For issues or questions:

1. Check the audit logs for detailed error information
2. Review the dry-run execution history for testing issues
3. Verify RBAC permissions for the user/role
4. Check database constraints and foreign key relationships
5. Review blast-radius logs for safety violations

The M27.2 Playbook Studio provides a robust, safe foundation for operational automation with comprehensive guardrails, versioning, and observability that integrates seamlessly with your existing M22-M26 ERP infrastructure.
