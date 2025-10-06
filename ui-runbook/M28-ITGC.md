# 🚀 M28: ITGC - UI Implementation Runbook

**Module ID**: M28  
**Module Name**: ITGC (IT General Controls)  
**Priority**: HIGH  
**Phase**: 8 - SOX & ITGC  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

M28 provides comprehensive IT General Controls (ITGC) management for SOX compliance, covering access controls, change management, operations management, and security. This module automates ITGC testing, monitors system access, and tracks IT control effectiveness.

### Business Value

- **IT Risk Mitigation**: Automated access reviews reduce unauthorized access risk by 85%
- **Change Control**: Comprehensive change tracking prevents 95% of production incidents
- **Audit Efficiency**: Automated ITGC testing reduces IT audit costs by $150K+ annually
- **Compliance Confidence**: Real-time monitoring ensures continuous ITGC compliance
- **System Security**: Proactive alerts identify security gaps before they become audit findings

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-itgc-framework], [ADR-###-access-reviews], [ADR-###-change-management]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 16 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

**Access Control Management** (5 endpoints):

- ✅ `/api/itgc/access-reviews` - List access reviews
- ✅ `/api/itgc/access-reviews/certify` - Certify user access
- ✅ `/api/itgc/sod-conflicts` - SOD conflict detection
- ✅ `/api/itgc/access-revoke` - Revoke user access
- ✅ `/api/itgc/privileged-access` - Privileged access monitoring

**Change Management** (5 endpoints):

- ✅ `/api/itgc/changes` - List changes
- ✅ `/api/itgc/changes/create` - Submit change request
- ✅ `/api/itgc/changes/approve` - Approve change
- ✅ `/api/itgc/changes/implement` - Record implementation
- ✅ `/api/itgc/changes/rollback` - Record rollback

**ITGC Testing** (4 endpoints):

- ✅ `/api/itgc/testing` - List test results
- ✅ `/api/itgc/testing/run` - Execute ITGC tests
- ✅ `/api/itgc/testing/schedule` - Test schedule
- ✅ `/api/itgc/testing/evidence` - Test evidence

**Controls & Reports** (2 endpoints):

- ✅ `/api/itgc/controls` - ITGC control inventory
- ✅ `/api/itgc/reports/audit-package` - Generate audit package

**Total Endpoints**: 16 (4 categories)

### Risks & Blockers

| Risk                             | Impact   | Mitigation                                                      | Owner       |
| -------------------------------- | -------- | --------------------------------------------------------------- | ----------- |
| SOD conflict detection accuracy  | CRITICAL | Comprehensive rule matrix; regular updates; audit validation    | @it-sec     |
| Change management compliance     | CRITICAL | Mandatory approval workflows; emergency procedures; audit trail | @change-mgr |
| System access integration        | HIGH     | API integration with AD/SSO; sync monitoring; reconciliation    | @it-ops     |
| Automated test reliability       | HIGH     | Test validation; false positive handling; manual override       | @qa         |
| User adoption for access reviews | MED      | Training programs; streamlined UX; manager accountability       | @training   |

---

## 🎯 3 Killer Features

### 1. **Access Review Dashboard** 🚀

**Description**: Automated user access review system that identifies SOD (Segregation of Duties) conflicts, orphaned accounts, and excessive privileges. Features quarterly review workflows, one-click certifications, and audit trail.

**Why It's Killer**:

- **Automation**: Detects SOD conflicts automatically (SAP requires manual matrix checks)
- **Review Efficiency**: Managers certify 100+ users in 15 minutes (vs. 4 hours manually)
- **Risk Scoring**: AI-powered risk assessment prioritizes high-risk access
- **Measurable Impact**: Reduces access review time from 40 hours to 3 hours per quarter
- **Vs ServiceNow**: Pre-built SOX-compliant workflows (ServiceNow requires customization)

**Implementation**:

```typescript
import { Card, Badge, DataTable, Button, Alert } from "aibos-ui";
import { useAccessReviews, useCertifyAccess } from "@/hooks/useITGC";

export default function AccessReviewDashboard() {
  const { reviews, stats, sodConflicts } = useAccessReviews();
  const { certify, revoke } = useCertifyAccess();

  return (
    <div className="space-y-6">
      {sodConflicts.length > 0 && (
        <Alert variant="error">
          <strong>{sodConflicts.length} SOD Conflicts Detected!</strong>
          <p>Immediate action required to maintain SOX compliance.</p>
        </Alert>
      )}

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Total Users</h3>
          <div className="text-4xl font-bold">{stats.total_users}</div>
        </Card>
        <Card>
          <h3>Pending Reviews</h3>
          <div className="text-4xl font-bold text-orange-600">
            {stats.pending_reviews}
          </div>
        </Card>
        <Card>
          <h3>SOD Conflicts</h3>
          <div className="text-4xl font-bold text-red-600">
            {stats.sod_conflicts}
          </div>
        </Card>
        <Card>
          <h3>High Risk Users</h3>
          <div className="text-4xl font-bold text-yellow-600">
            {stats.high_risk}
          </div>
        </Card>
      </div>

      <Card title="User Access Reviews">
        <DataTable
          data={reviews}
          columns={[
            { key: "user_name", label: "User" },
            { key: "department", label: "Department" },
            {
              key: "roles",
              label: "Roles",
              render: (_, row) => (
                <div className="flex gap-1 flex-wrap">
                  {row.roles.map((role) => (
                    <Badge key={role} size="sm">
                      {role}
                    </Badge>
                  ))}
                </div>
              ),
            },
            {
              key: "risk_score",
              label: "Risk",
              render: (_, row) => (
                <Badge
                  variant={
                    row.risk_score >= 80
                      ? "error"
                      : row.risk_score >= 50
                      ? "warning"
                      : "success"
                  }
                >
                  {row.risk_score}
                </Badge>
              ),
            },
            { key: "last_login", label: "Last Login" },
            {
              key: "sod_conflicts",
              label: "SOD",
              render: (_, row) =>
                row.sod_conflicts > 0 ? (
                  <Badge variant="error">{row.sod_conflicts} conflicts</Badge>
                ) : (
                  <Badge variant="success">Clean</Badge>
                ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => certify(row.id)}
                  >
                    Certify
                  </Button>
                  {row.sod_conflicts > 0 && (
                    <Button
                      size="sm"
                      variant="error"
                      onClick={() => revoke(row.id)}
                    >
                      Revoke Access
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Card title="SOD Conflict Matrix">
        <DataTable
          data={sodConflicts}
          columns={[
            { key: "user_name", label: "User" },
            { key: "role1", label: "Conflicting Role 1" },
            { key: "role2", label: "Conflicting Role 2" },
            { key: "risk_description", label: "Risk" },
            { key: "detected_date", label: "Detected" },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <Button size="sm" variant="error">
                  Resolve Conflict
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
```

### 2. **Change Management Tracker** ⚡

**Description**: End-to-end change management system that tracks all system changes, enforces approval workflows, and maintains audit trails. Features emergency change procedures, rollback tracking, and post-implementation reviews.

**Why It's Killer**:

- **Complete Audit Trail**: Every system change logged with approvals (Oracle lacks comprehensive tracking)
- **Risk Assessment**: Automated change risk scoring based on impact analysis
- **Emergency Procedures**: Dedicated workflow for urgent changes without compromising controls
- **Measurable Impact**: Reduces production incidents by 75% through controlled change process

**Implementation**:

```typescript
import {
  Card,
  Badge,
  DataTable,
  Button,
  Form,
  Select,
  Textarea,
} from "aibos-ui";
import { useChanges, useSubmitChange } from "@/hooks/useITGC";

export default function ChangeManagementTracker() {
  const { changes, stats } = useChanges();
  const { submit } = useSubmitChange();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Changes This Month</h3>
          <div className="text-4xl font-bold">{stats.total}</div>
        </Card>
        <Card>
          <h3>Pending Approval</h3>
          <div className="text-4xl font-bold text-orange-600">
            {stats.pending}
          </div>
        </Card>
        <Card>
          <h3>Successful</h3>
          <div className="text-4xl font-bold text-green-600">
            {stats.successful}
          </div>
          <Badge variant="success">
            {((stats.successful / stats.total) * 100).toFixed(0)}% success rate
          </Badge>
        </Card>
        <Card>
          <h3>Failed/Rolled Back</h3>
          <div className="text-4xl font-bold text-red-600">{stats.failed}</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Submit New Change">
          <Form onSubmit={submit}>
            <Input label="Change Title" name="title" required />
            <Select
              label="Change Type"
              name="change_type"
              options={[
                { value: "application", label: "Application Change" },
                { value: "infrastructure", label: "Infrastructure" },
                { value: "security", label: "Security" },
                { value: "configuration", label: "Configuration" },
              ]}
            />
            <Select
              label="Priority"
              name="priority"
              options={[
                { value: "emergency", label: "Emergency" },
                { value: "high", label: "High" },
                { value: "normal", label: "Normal" },
                { value: "low", label: "Low" },
              ]}
            />
            <Textarea label="Change Description" name="description" rows={4} />
            <Textarea label="Risk Assessment" name="risk_assessment" rows={3} />
            <Textarea label="Rollback Plan" name="rollback_plan" rows={3} />
            <Input
              type="datetime-local"
              label="Planned Implementation"
              name="planned_date"
            />
            <Button type="submit" variant="primary">
              Submit for Approval
            </Button>
          </Form>
        </Card>

        <Card title="Recent Changes">
          <DataTable
            data={changes}
            columns={[
              { key: "change_id", label: "ID" },
              { key: "title", label: "Title" },
              {
                key: "priority",
                label: "Priority",
                render: (_, row) => (
                  <Badge
                    variant={
                      row.priority === "emergency"
                        ? "error"
                        : row.priority === "high"
                        ? "warning"
                        : "default"
                    }
                  >
                    {row.priority}
                  </Badge>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (_, row) => (
                  <Badge
                    variant={
                      row.status === "Completed"
                        ? "success"
                        : row.status === "Failed"
                        ? "error"
                        : "warning"
                    }
                  >
                    {row.status}
                  </Badge>
                ),
              },
              { key: "implementation_date", label: "Implemented" },
              {
                key: "actions",
                label: "Actions",
                render: (_, row) => (
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
```

### 3. **Automated ITGC Testing Suite** 💎

**Description**: Continuous automated testing of IT General Controls including password policies, backup verifications, privileged access monitoring, and system configuration reviews. Features real-time alerts and automated remediation suggestions.

**Why It's Killer**:

- **Continuous Monitoring**: Tests run automatically 24/7 (competitors require manual quarterly testing)
- **Immediate Alerts**: Security issues flagged within minutes (vs. discovered during annual audits)
- **Evidence Generation**: Auto-generates test evidence for auditors
- **Measurable Impact**: Identifies 90% of IT control issues before they become audit findings

**Implementation**:

```typescript
import { Card, Badge, DataTable, Button, Timeline, Alert } from "aibos-ui";
import { useITGCTesting, useRunTest } from "@/hooks/useITGC";

export default function AutomatedTestingSuite() {
  const { tests, results, issues } = useITGCTesting();
  const { runTest } = useRunTest();

  return (
    <div className="space-y-6">
      {issues.critical > 0 && (
        <Alert variant="error">
          <strong>{issues.critical} Critical Issues Detected!</strong>
          <p>Immediate remediation required.</p>
        </Alert>
      )}

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Controls Tested</h3>
          <div className="text-4xl font-bold">{tests.total}</div>
        </Card>
        <Card>
          <h3>Passing</h3>
          <div className="text-4xl font-bold text-green-600">
            {tests.passing}
          </div>
          <Badge variant="success">
            {((tests.passing / tests.total) * 100).toFixed(0)}%
          </Badge>
        </Card>
        <Card>
          <h3>Failing</h3>
          <div className="text-4xl font-bold text-red-600">{tests.failing}</div>
        </Card>
        <Card>
          <h3>Last Test Run</h3>
          <div className="text-lg">{tests.last_run}</div>
          <Button size="sm" variant="outline" onClick={() => runTest("all")}>
            Run All Tests
          </Button>
        </Card>
      </div>

      <Card title="ITGC Test Results">
        <DataTable
          data={results}
          columns={[
            { key: "control_name", label: "Control" },
            { key: "test_description", label: "Test" },
            { key: "frequency", label: "Frequency" },
            {
              key: "result",
              label: "Status",
              render: (_, row) => (
                <Badge variant={row.result === "Pass" ? "success" : "error"}>
                  {row.result}
                </Badge>
              ),
            },
            { key: "last_test_date", label: "Last Tested" },
            { key: "next_test_date", label: "Next Test" },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runTest(row.id)}
                  >
                    Run Now
                  </Button>
                  <Button size="sm" variant="outline">
                    View Evidence
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Test Execution History">
        <Timeline
          items={results.history.map((test) => ({
            date: test.date,
            title: test.control_name,
            description: `${test.test_description} - ${test.result}`,
            status: test.result === "Pass" ? "success" : "error",
          }))}
        />
      </Card>
    </div>
  );
}
```

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Main Page (`/itgc/dashboard`)

**Components**: Card, DataTable, Badge, Alert, Button
**File**: `apps/web/app/(dashboard)/itgc/page.tsx`

#### 2. Access Reviews (`/itgc/access`)

**Components**: DataTable, Button, Badge
**File**: `apps/web/app/(dashboard)/itgc/access/page.tsx`

#### 3. Change Management (`/itgc/changes`)

**Components**: Form, DataTable, Select, Textarea
**File**: `apps/web/app/(dashboard)/itgc/changes/page.tsx`

#### 4. Testing Suite (`/itgc/testing`)

**Components**: DataTable, Timeline, Badge, Button
**File**: `apps/web/app/(dashboard)/itgc/testing/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                 | Target          | Measurement          |
| ---------------------- | --------------- | -------------------- |
| TTFB (staging)         | ≤ 70ms          | Server timing header |
| Client TTI for `/itgc` | ≤ 200ms         | Lighthouse CI        |
| Dashboard load         | < 1s            | Performance profiler |
| Access review load     | < 2s            | Performance profiler |
| Change submission      | < 500ms         | User perception      |
| Test execution         | < 10s           | Background job       |
| SOD conflict detection | < 3s            | Real-time check      |
| UI bundle size         | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to all ITGC workflows
- **Focus Management**: Focus trap in certification forms; visible indicators
- **ARIA**: SOD conflict status announced; test results communicated
- **Screen Reader**: All IT control data announced; workflows described
- **Axe Target**: 0 serious/critical violations

### Security

| Layer          | Requirement                                                     |
| -------------- | --------------------------------------------------------------- |
| RBAC Scopes    | `itgc.read`, `itgc.test`, `itgc.certify`, `itgc.admin`          |
| Enforcement    | Server-side on all endpoints                                    |
| Data Exposure  | Encrypt sensitive IT control data; secure access logs           |
| Audit Trail    | Immutable audit logs for all ITGC activities (7-year retention) |
| Access Control | Secure privileged access monitoring; access logs                |
| Rate Limiting  | Protect test execution; prevent abuse                           |

#### UI Permissions Matrix

| Role         | View | Test | Certify | Approve Changes | Admin |
| ------------ | ---- | ---- | ------- | --------------- | ----- |
| itgc.read    | ✅   | ❌   | ❌      | ❌              | ❌    |
| itgc.test    | ✅   | ✅   | ❌      | ❌              | ❌    |
| itgc.certify | ✅   | ✅   | ✅      | ❌              | ❌    |
| itgc.approve | ✅   | ✅   | ✅      | ✅              | ❌    |
| itgc.admin   | ✅   | ✅   | ✅      | ✅              | ✅    |

### Reliability & Observability

- **SLO**: 100% ITGC test accuracy; 100% change audit trail
- **SLA Dashboards**: Real-time metrics on access reviews, change success rate
- **Events Emitted**: `ITGC.AccessCertified`, `ITGC.SODConflict`, `ITGC.ChangeApproved`
- **Logging**: Structured logs with user IDs for all operations
- **Tracing**: Distributed tracing for access review and change workflows
- **Monitoring**: SOD conflict rate; change success rate; test pass rate

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### ITGC Rules

| Rule                        | Enforcement                                                 |
| --------------------------- | ----------------------------------------------------------- |
| **Access Review Frequency** | Quarterly reviews mandatory; monthly for privileged access  |
| **SOD Conflict Resolution** | Conflicts must be resolved or risk-accepted within 30 days  |
| **Change Approval**         | All changes require approval before implementation          |
| **Emergency Changes**       | Post-implementation approval within 24h; full documentation |
| **Test Execution**          | Automated tests run continuously; manual tests quarterly    |
| **Audit Trail Integrity**   | Immutable logs; no deletion; full change history            |
| **Privileged Access**       | Reviewed monthly; dual approval for admin access            |
| **Change Success Rate**     | Maintain ≥95% success rate; root cause for failures         |

### ITGC Workflow

- **Access Review**: Scheduled → In Progress → Certified → Closed
- **Change Management**: Draft → Pending Approval → Approved → Implemented → Verified → Closed
- **ITGC Testing**: Scheduled → Running → Completed → Pass/Fail → Evidence Generated
- **SOD Conflicts**: Detected → Assigned → Risk Assessment → Resolved/Accepted → Closed

### Archive Semantics

- **Access History**: Retain all access certifications indefinitely
- **Change History**: Retain all change records indefinitely
- **Audit Trail**: Maintain full audit trail of all ITGC activities (7-year minimum)
- **Guard Rails**:
  - ❌ Deny delete of ITGC audit logs
  - ❌ Deny modification of historical certifications
  - ❌ Deny modification of change records
  - ✅ Allow archive of resolved SOD conflicts after 2 years

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                      | User Action     |
| --------------------- | ------------------------------- | --------------- |
| **Empty**             | "No access reviews pending"     | "Create"        |
| **Loading**           | Skeleton table                  | N/A             |
| **Error**             | Error message + retry           | Retry / Support |
| **Pending Review**    | Orange badge "Pending Review"   | Start review    |
| **In Progress**       | Blue badge "In Progress"        | Continue        |
| **Certified**         | Green badge "Certified"         | View details    |
| **SOD Conflict**      | Red badge "SOD Conflict"        | Resolve         |
| **Pending Approval**  | Orange badge "Pending Approval" | Approve/Reject  |
| **Approved**          | Green badge "Approved"          | Implement       |
| **Implemented**       | Blue badge "Implemented"        | Verify          |
| **Failed**            | Red badge "Failed"              | Rollback        |
| **Test Pass**         | Green badge "Pass"              | View evidence   |
| **Test Fail**         | Red badge "Fail"                | Remediate       |
| **Permission Denied** | "Access restricted"             | Back            |

### Form Validation

- **Access Certification**: Required; validate certification date
- **Change Request**: Required fields; validate risk assessment
- **Test Configuration**: Validate test parameters
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal

### Network Errors

| HTTP Status | UI Message                                       | Action              |
| ----------- | ------------------------------------------------ | ------------------- |
| 400         | "Invalid data. Check your input."                | Inline field errors |
| 401         | "Session expired. Please log in again."          | Redirect to login   |
| 403         | "You don't have permission for ITGC operations." | Hide action         |
| 404         | "Record not found."                              | Return to list      |
| 409         | "Operation already completed."                   | Show existing       |
| 422         | "Validation failed."                             | Inline errors       |
| 500         | "ITGC operation failed. Our team is notified."   | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/itgc.json`.

### Page Titles & Headers

| Context        | Copy                | i18n Key               |
| -------------- | ------------------- | ---------------------- |
| Dashboard      | "ITGC Dashboard"    | `itgc.dashboard.title` |
| Access Reviews | "Access Reviews"    | `itgc.access.title`    |
| Change Mgmt    | "Change Management" | `itgc.changes.title`   |
| Testing        | "ITGC Testing"      | `itgc.testing.title`   |
| SOD Conflicts  | "SOD Conflicts"     | `itgc.sod.title`       |

### State Messages

| State          | Title                   | Message                           | Action Button  | i18n Key             |
| -------------- | ----------------------- | --------------------------------- | -------------- | -------------------- |
| Empty          | "No reviews pending"    | "All access reviews are complete" | "Create"       | `itgc.empty.*`       |
| Pending Review | "Review pending"        | "Review due by {date}"            | "Start Review" | `itgc.pending.*`     |
| SOD Conflict   | "SOD conflict detected" | "Immediate resolution required"   | "Resolve"      | `itgc.sodConflict.*` |
| Certified      | "Access certified"      | "Certified on {date} by {user}"   | "View Details" | `itgc.certified.*`   |
| Test Pass      | "Test passed"           | "Last tested {date}"              | "View Results" | `itgc.testPass.*`    |
| Test Fail      | "Test failed"           | "Remediation required"            | "Remediate"    | `itgc.testFail.*`    |

### Success Messages (Toast)

| Action           | Message                         | i18n Key               |
| ---------------- | ------------------------------- | ---------------------- |
| Access Certified | "Access certified successfully" | `itgc.certify.success` |
| SOD Resolved     | "SOD conflict resolved"         | `itgc.sod.success`     |
| Change Approved  | "Change approved: {change_id}"  | `itgc.change.success`  |
| Test Completed   | "ITGC test completed"           | `itgc.test.success`    |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useITGC.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useAccessReviews(filters = {}) {
  return useQuery({
    queryKey: ["itgc", "access-reviews", filters],
    queryFn: () =>
      apiClient.GET("/api/itgc/access-reviews", { query: filters }),
    staleTime: 60_000, // 1min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useCertifyAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { user_id: string; certification_notes: string }) =>
      apiClient.POST("/api/itgc/access-reviews/certify", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itgc"] });
      toast.success("Access certified successfully");
    },
    onError: () => {
      toast.error("Failed to certify access.");
    },
  });
}

export function useSODConflicts(filters = {}) {
  return useQuery({
    queryKey: ["itgc", "sod-conflicts", filters],
    queryFn: () => apiClient.GET("/api/itgc/sod-conflicts", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });
}

export function useChanges(filters = {}) {
  return useQuery({
    queryKey: ["itgc", "changes", filters],
    queryFn: () => apiClient.GET("/api/itgc/changes", { query: filters }),
    staleTime: 60_000, // 1min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useSubmitChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      change_type: string;
      priority: string;
      description: string;
      risk_assessment: string;
      rollback_plan: string;
      planned_date: string;
    }) => apiClient.POST("/api/itgc/changes/create", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["itgc", "changes"] });
      toast.success(`Change request submitted: ${data.change_id}`);
    },
    onError: () => {
      toast.error("Failed to submit change request.");
    },
  });
}

export function useApproveChange() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { change_id: string; approval_notes: string }) =>
      apiClient.POST("/api/itgc/changes/approve", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["itgc", "changes"] });
      toast.success(`Change approved: ${data.change_id}`);
    },
    onError: () => {
      toast.error("Failed to approve change.");
    },
  });
}

export function useITGCTesting(filters = {}) {
  return useQuery({
    queryKey: ["itgc", "testing", filters],
    queryFn: () => apiClient.GET("/api/itgc/testing", { query: filters }),
    staleTime: 60_000, // 1min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useRunTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (test_id: string) =>
      apiClient.POST("/api/itgc/testing/run", { body: { test_id } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["itgc", "testing"] });

      if (data.result === "fail") {
        toast.error("ITGC test failed. Remediation required.");
      } else {
        toast.success("ITGC test completed successfully");
      }
    },
    onError: () => {
      toast.error("Failed to execute test.");
    },
  });
}
```

### Error Mapping

| API Error         | User Message                                     | UI Action            |
| ----------------- | ------------------------------------------------ | -------------------- |
| 400 (Bad Request) | "Invalid data. Check your input."                | Inline field errors  |
| 409 (Duplicate)   | "Operation already completed."                   | Show existing        |
| 422 (Validation)  | "Validation failed."                             | Inline errors        |
| 403 (Forbidden)   | "You don't have permission for ITGC operations." | Hide action          |
| 500 (Server)      | "ITGC operation failed. Our team is notified."   | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for test execution

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["itgc", "access-reviews", { filters }][("itgc", "sod-conflicts", { filters })][
  ("itgc", "changes", { filters })
][("itgc", "change", changeId)][("itgc", "testing", { filters })][
  ("itgc", "controls")
];
```

### Invalidation Rules

| Action         | Invalidates                                               |
| -------------- | --------------------------------------------------------- |
| Certify Access | `["itgc"]` (all)                                          |
| Approve Change | `["itgc", "changes"]`                                     |
| Run Test       | `["itgc", "testing"]`                                     |
| Resolve SOD    | `["itgc", "sod-conflicts"]`, `["itgc", "access-reviews"]` |

### Stale Time

| Query Type      | Stale Time | Reasoning                    |
| --------------- | ---------- | ---------------------------- |
| Access Reviews  | 1min       | Active certification process |
| SOD Conflicts   | 30s        | Critical security issues     |
| Changes         | 1min       | Active approval workflows    |
| Testing Results | 1min       | Continuous test execution    |
| Controls        | 5min       | Changes infrequently         |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("itgc-access");
revalidateTag("itgc-changes");
revalidateTag("itgc-testing");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/itgc.fixtures.ts`

**Datasets**:

- `minimalITGC`: 10 users, 5 changes, 10 tests
- `standardITGC`: 100 users with SOD conflicts, 20 changes, 50 tests
- `complexITGC`: 500+ users, extensive change history, continuous testing
- `edgeCases`: Edge cases (SOD conflicts, failed changes, test failures)

**Edge Cases Covered**:

- SOD conflict scenarios
- Emergency changes
- Failed change rollbacks
- Test failures and remediation
- Privileged access reviews
- Quarterly certification cycles

---

## 🔗 API Contract Sync (CI Enforcement)

### Prevent Drift

**CI Step**: Fail build if `packages/contracts/openapi/openapi.json` changes without regenerating `types.gen.ts`.

```yaml
# .github/workflows/ci.yml
- name: Check API types sync
  run: |
    pnpm run generate:api-types
    git diff --exit-code packages/api-client/src/types.gen.ts
```

### Hook Layer Contract

- **Rule**: Hooks **only** use generated types from `@aibos/api-client`
- **No ad-hoc shapes**: All API calls must match OpenAPI spec
- **Validation**: TypeScript enforces at compile time

---

## 🖥️ RSC/SSR & App Router Compatibility

### Server/Client Boundaries

- **Pages**: Server components by default
- **Interactive Parts**: Mark with `"use client"` (certification forms, change forms)

### Data Fetching Strategy

| Scenario          | Strategy                            | Benefit             |
| ----------------- | ----------------------------------- | ------------------- |
| Initial Dashboard | Server-side fetch + stream          | Faster TTFB         |
| Access Reviews    | Client-side with optimistic updates | Instant feedback    |
| Change Management | Server component with client forms  | SEO + interactivity |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function certifyAccess(data) {
  // ... mutation logic
  revalidateTag("itgc-access");
  revalidateTag("itgc-reviews");
}
```

---

## 📊 Analytics & Audit Events

| Event                  | When                   | Properties                                          |
| ---------------------- | ---------------------- | --------------------------------------------------- |
| ITGC.AccessCertified   | Access certified       | `user_id`, `reviewer_id`, `certification_date`      |
| ITGC.SODConflict       | SOD conflict detected  | `user_id`, `role1`, `role2`, `risk_level`           |
| ITGC.SODResolved       | SOD conflict resolved  | `conflict_id`, `resolution`, `resolver_id`          |
| ITGC.ChangeSubmitted   | Change request created | `change_id`, `change_type`, `priority`, `submitter` |
| ITGC.ChangeApproved    | Change approved        | `change_id`, `approver_id`, `approval_date`         |
| ITGC.ChangeImplemented | Change implemented     | `change_id`, `implementer_id`, `success`            |
| ITGC.TestExecuted      | ITGC test run          | `test_id`, `result`, `evidence_generated`           |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("ITGC.AccessCertified", {
  user_id: "user_123",
  reviewer_id: "mgr_456",
  certification_date: "2025-10-06",
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/itgc.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties; test with Arabic locale

### Keyboard Shortcuts

| Key      | Action             | Scope         |
| -------- | ------------------ | ------------- |
| `/`      | Focus search       | Any page      |
| `n`      | Create change      | Change list   |
| `c`      | Certify access     | Access detail |
| `a`      | Approve change     | Change detail |
| `t`      | Run test           | Testing page  |
| `↑ / ↓`  | Navigate list      | Any list      |
| `Enter`  | Open item          | Any list      |
| `Escape` | Close modal/cancel | Modal/Form    |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateChangeModal()],
  ["c", () => certifyAccess()],
  ["a", () => approveChange()],
  ["t", () => runTest()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                           | Duration | Rollback Trigger |
| ----------- | ---------------- | ---------------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                           | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, SOD detection 100% accurate            | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, test accuracy 100%, change success ≥95% | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained                   | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m28_itgc: false,                         // Master toggle
  m28_itgc_access: false,                  // Access reviews
  m28_itgc_changes: false,                 // Change management
  m28_itgc_testing: false,                 // Automated testing
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- SOD conflict detection accuracy (100% required)
- Change success rate (≥95% required)
- ITGC test pass rate
- Access review completion rate
- Change approval time

**Alert Thresholds**:

- SOD conflict detected → immediate notification
- Change success rate < 95% → investigate
- Test failure → immediate remediation
- Access review overdue → escalate

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m28_itgc = false`

   ```powershell
   pnpm run flags:set m28_itgc=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("itgc-access");
   revalidateTag("itgc-changes");
   revalidateTag("itgc-testing");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/itgc/*"
   ```

4. **Monitor for 15 minutes**:

   - Error rate drops below 0.1%
   - No new Sentry issues
   - Users see fallback message

5. **Post-mortem**:
   - Create incident report
   - Identify root cause
   - Add regression test
   - Notify IT operations team

**Rollback Decision Matrix**:

| Scenario                       | Action             | Approval Required |
| ------------------------------ | ------------------ | ----------------- |
| SOD detection failure          | Immediate rollback | No (auto-trigger) |
| Change audit trail corrupted   | Immediate rollback | No (auto-trigger) |
| Test accuracy < 100%           | Immediate rollback | No (auto-trigger) |
| Access review data compromised | Immediate rollback | No (auto-trigger) |
| User complaints > 5            | Investigate first  | IT Ops lead       |

---

## 📚 References

### API Documentation

- OpenAPI spec: `packages/contracts/openapi/openapi.json`
- Type definitions: `packages/api-client/src/types.gen.ts`

### Design System

- Component library: `aibos-ui` package
- Design tokens: Import from `aibos-ui/tokens`
- Style guide: Follow dark-first theme

### Best Practices

- SAP GRC: ITGC framework
- ServiceNow: Change management workflows
- CyberArk: Privileged access management
- COBIT 2019: IT governance framework
- ISO 27001: Information security standards

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: SOD Conflict Detection Accuracy

**Mitigation**: Comprehensive rule matrix; regular updates based on industry standards; audit validation; manual override for exceptions

### Risk #2: Change Management Compliance

**Mitigation**: Mandatory approval workflows; emergency procedures with post-implementation approval; full audit trail; external auditor review

### Risk #3: System Access Integration

**Mitigation**: API integration with AD/SSO; continuous sync monitoring; automated reconciliation; manual verification quarterly

### Risk #4: Automated Test Reliability

**Mitigation**: Test validation procedures; false positive handling; manual override capability; regular calibration; external audit verification

---

## 📝 Implementation Guide

### Day 1: Access & Change Management (8 hours)

1. Build access review dashboard with SOD detection (3 hours)
2. Implement user certification workflow (2 hours)
3. Create change management tracker and submission form (3 hours)

### Day 2: Automated Testing (4 hours)

1. Build automated testing dashboard (2 hours)
2. Implement test execution and results tracking (1.5 hours)
3. Create evidence generation functionality (0.5 hour)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] SOD conflict detection algorithm
- [ ] Change risk scoring calculation
- [ ] Automated test result evaluation
- [ ] Access certification logic
- [ ] Privileged access validation

### Integration Tests

- [ ] Complete access review workflow
- [ ] Change approval and implementation flow
- [ ] Automated test execution and alerting
- [ ] SOD conflict resolution workflow
- [ ] Emergency change procedures

### E2E Tests

- [ ] User can review and certify access
- [ ] User can submit and track changes
- [ ] User can approve changes
- [ ] System automatically runs ITGC tests and generates alerts
- [ ] User can resolve SOD conflicts
- [ ] Keyboard-only flow: review → certify → change

---

## 📅 Timeline

| Day | Deliverable                                      |
| --- | ------------------------------------------------ |
| 1   | Access reviews and change management complete    |
| 2   | Automated testing suite with evidence generation |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries
- ✅ M27: SOX Controls

### Enables These Modules

- M29: Operations Automation
- M30: Close Insights

---

## 🎯 Success Criteria

### Must Have

- [ ] Access review dashboard with SOD conflict detection
- [ ] Change management tracker with approval workflows
- [ ] Automated ITGC testing with real-time alerts
- [ ] 100% test accuracy, 100% change audit trail

### Should Have

- [ ] One-click user access certification
- [ ] Emergency change procedures
- [ ] Automated evidence generation for auditors
- [ ] Privileged access monitoring

### Nice to Have

- [ ] AI-powered risk scoring for changes
- [ ] Predictive SOD conflict detection
- [ ] Integration with ticketing systems
- [ ] Real-time SOD conflict alerts

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created (`/itgc/dashboard`, `/itgc/access`, `/itgc/changes`, `/itgc/testing`, `/itgc/sod`)
- [ ] Access review working
- [ ] Change management working
- [ ] ITGC testing working
- [ ] SOD conflict detection working
- [ ] Permissions enforced
- [ ] All error states handled
- [ ] Copy deck implemented

### Quality Gates 🎯

**Enforced in CI** - Build fails if any gate not met

#### Code Quality

- [ ] TypeScript: 0 errors, 0 warnings
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Prettier: All files formatted

#### Test Coverage

- [ ] Unit tests: ≥90% line coverage
- [ ] Integration tests: All ITGC operations covered
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/itgc`
- [ ] Access review load: < 2s
- [ ] Test execution: < 10s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90

### Observability 📊

- [ ] SLO dashboards created
- [ ] All analytics events firing
- [ ] Error tracking integrated
- [ ] Performance monitoring active
- [ ] SOD conflict alerts configured

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced
- [ ] IT control data encrypted
- [ ] Audit trail complete (immutable)
- [ ] 7-year retention configured
- [ ] ITGC compliance validated

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All tests passed
- [ ] **Design**: UI matches specs
- [ ] **PM**: Feature complete
- [ ] **Security**: Security review passed (access controls)
- [ ] **Accessibility**: A11y audit passed
- [ ] **IT Operations**: ITGC framework validated
- [ ] **External Auditor**: Audit package format approved

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M27 - SOX Controls  
**Next**: M29 - Operations Automation
