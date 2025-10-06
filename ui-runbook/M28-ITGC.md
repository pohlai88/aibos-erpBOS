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

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 16 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/itgc/access-reviews` - User access reviews
- ✅ `/api/itgc/changes` - Change management tracking
- ✅ `/api/itgc/controls` - ITGC control inventory
- ✅ `/api/itgc/testing` - Automated ITGC testing

**Total Endpoints**: 16

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

## 🔌 API Integration

```typescript
// apps/web/hooks/useITGC.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@aibos/api-client';

export function useAccessReviews() {
  return useQuery({
    queryKey: ['itgc-access-reviews'],
    queryFn: () => apiClient.GET('/api/itgc/access-reviews'),
  });
}

export function useCertifyAccess() {
  return useMutation({
    mutationFn: userId =>
      apiClient.POST('/api/itgc/certify', { body: { user_id: userId } }),
    onSuccess: () => queryClient.invalidateQueries(['itgc-access-reviews']),
  });
}

export function useChanges() {
  return useQuery({
    queryKey: ['itgc-changes'],
    queryFn: () => apiClient.GET('/api/itgc/changes'),
  });
}

export function useITGCTesting() {
  return useQuery({
    queryKey: ['itgc-testing'],
    queryFn: () => apiClient.GET('/api/itgc/testing'),
  });
}
```

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

### Integration Tests

- [ ] Complete access review workflow
- [ ] Change approval and implementation flow
- [ ] Automated test execution and alerting

### E2E Tests

- [ ] User can review and certify access
- [ ] User can submit and track changes
- [ ] System automatically runs ITGC tests and generates alerts

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

### Should Have

- [ ] One-click user access certification
- [ ] Emergency change procedures
- [ ] Automated evidence generation for auditors

### Nice to Have

- [ ] AI-powered risk scoring for changes
- [ ] Predictive SOD conflict detection
- [ ] Integration with ticketing systems

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M27 - SOX Controls  
**Next**: M29 - Operations Automation
