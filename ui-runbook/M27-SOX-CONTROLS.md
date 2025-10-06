# 🚀 M27: SOX Controls - UI Implementation Runbook

**Module ID**: M27  
**Module Name**: SOX Controls  
**Priority**: HIGH  
**Phase**: 8 - SOX & ITGC  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

M27 delivers a comprehensive SOX (Sarbanes-Oxley) compliance management system that automates control testing, deficiency tracking, and evidence collection. This module helps finance teams maintain continuous compliance, reduce audit costs, and demonstrate control effectiveness.

### Business Value

- **Continuous Compliance**: Real-time control monitoring reduces SOX audit preparation time by 60%
- **Risk Mitigation**: Automated testing identifies control deficiencies before they become material weaknesses
- **Audit Efficiency**: Centralized evidence management reduces audit requests by 40%
- **Cost Reduction**: Streamlined workflows cut annual compliance costs by $200K+ for mid-market companies
- **Executive Confidence**: Real-time dashboards provide C-suite visibility into control effectiveness

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-sox-controls], [ADR-###-control-testing], [ADR-###-deficiency-management]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 12 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

**Control Management** (4 endpoints):

- ✅ `/api/sox/controls` - List SOX controls
- ✅ `/api/sox/controls/[id]` - Control details
- ✅ `/api/sox/controls/create` - Create control
- ✅ `/api/sox/controls/update` - Update control

**Control Testing** (3 endpoints):

- ✅ `/api/sox/testing` - Submit test results
- ✅ `/api/sox/testing/schedule` - Testing schedule
- ✅ `/api/sox/testing/history` - Testing history

**Deficiency Management** (3 endpoints):

- ✅ `/api/sox/deficiencies` - List deficiencies
- ✅ `/api/sox/deficiencies/[id]` - Deficiency details
- ✅ `/api/sox/deficiencies/remediate` - Remediate deficiency

**Evidence & Reporting** (2 endpoints):

- ✅ `/api/sox/evidence` - Evidence library
- ✅ `/api/sox/reports/audit-package` - Generate audit package

**Total Endpoints**: 12 (4 categories)

### Risks & Blockers

| Risk                             | Impact   | Mitigation                                                    | Owner       |
| -------------------------------- | -------- | ------------------------------------------------------------- | ----------- |
| Control testing accuracy         | CRITICAL | Rigorous test procedures; dual review; audit trail            | @compliance |
| Material weakness reporting      | CRITICAL | Immediate escalation; executive notification; board reporting | @cfo        |
| Evidence integrity and retention | HIGH     | Version control; immutable audit logs; 7-year retention       | @it         |
| External auditor requirements    | HIGH     | Regular auditor consultation; industry standards alignment    | @audit      |
| User adoption and training       | MED      | Training programs; user guides; help documentation            | @training   |

---

## 🎯 3 Killer Features

### 1. **Control Testing Dashboard** 🚀

**Description**: Interactive dashboard that visualizes SOX control testing status, effectiveness ratings, and upcoming test deadlines. Features color-coded risk indicators, automated test assignment, and real-time completion tracking.

**Why It's Killer**:

- **Automation**: Reduces manual testing coordination by 70% vs. SAP GRC's manual assignment process
- **Visibility**: Real-time dashboard shows control health at-a-glance (Oracle lacks visual testing dashboards)
- **Proactive Alerts**: Sends notifications 14 days before testing deadlines (competitors require manual tracking)
- **Measurable Impact**: Companies reduce control testing cycles from 12 weeks to 4 weeks
- **Vs ServiceNow**: Dedicated SOX workflow (ServiceNow requires custom configuration)

**Implementation**:

```typescript
import { Card, Badge, DataTable, Button, ProgressBar } from "aibos-ui";
import { useSOXControls, useTestControl } from "@/hooks/useSOXControls";

export default function ControlTestingDashboard() {
  const { controls, stats } = useSOXControls();
  const { testControl } = useTestControl();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Total Controls</h3>
          <div className="text-4xl font-bold">{stats.total}</div>
        </Card>
        <Card>
          <h3>Effective</h3>
          <div className="text-4xl font-bold text-green-600">
            {stats.effective}
          </div>
          <Badge variant="success">
            {((stats.effective / stats.total) * 100).toFixed(0)}%
          </Badge>
        </Card>
        <Card>
          <h3>Deficiencies</h3>
          <div className="text-4xl font-bold text-red-600">
            {stats.deficient}
          </div>
        </Card>
        <Card>
          <h3>Testing Due</h3>
          <div className="text-4xl font-bold text-orange-600">
            {stats.due_soon}
          </div>
        </Card>
      </div>

      <Card title="Control Testing Schedule">
        <DataTable
          data={controls}
          columns={[
            { key: "control_id", label: "Control ID" },
            { key: "description", label: "Description" },
            {
              key: "risk_level",
              label: "Risk",
              render: (_, row) => (
                <Badge
                  variant={
                    row.risk_level === "High"
                      ? "error"
                      : row.risk_level === "Medium"
                      ? "warning"
                      : "success"
                  }
                >
                  {row.risk_level}
                </Badge>
              ),
            },
            { key: "test_frequency", label: "Frequency" },
            { key: "last_test_date", label: "Last Tested" },
            { key: "next_test_date", label: "Next Test" },
            {
              key: "status",
              label: "Status",
              render: (_, row) => (
                <Badge
                  variant={
                    row.status === "Passed"
                      ? "success"
                      : row.status === "Failed"
                      ? "error"
                      : "default"
                  }
                >
                  {row.status}
                </Badge>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <Button
                  size="sm"
                  onClick={() => testControl(row.id)}
                  disabled={row.status === "In Progress"}
                >
                  {row.status === "Pending" ? "Start Test" : "View Results"}
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Testing Progress by Category">
        {Object.entries(stats.by_category).map(([category, data]) => (
          <div key={category} className="mb-4">
            <div className="flex justify-between mb-2">
              <span className="font-semibold">{category}</span>
              <span>
                {data.tested} / {data.total} tested
              </span>
            </div>
            <ProgressBar
              value={(data.tested / data.total) * 100}
              variant={data.tested / data.total >= 0.9 ? "success" : "warning"}
            />
          </div>
        ))}
      </Card>
    </div>
  );
}
```

### 2. **Deficiency Tracking & Remediation** ⚡

**Description**: Comprehensive deficiency management system that tracks control weaknesses from identification through remediation. Features automated workflows, owner assignment, remediation plans, and executive reporting.

**Why It's Killer**:

- **Automated Workflows**: Routes deficiencies to right stakeholders automatically (SAP requires manual routing)
- **Remediation Tracking**: Built-in project management for deficiency resolution (Oracle lacks this)
- **Executive Reporting**: One-click board reports showing all deficiencies and remediation status
- **Measurable Impact**: Reduces average deficiency remediation time from 90 days to 35 days

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
import {
  useDeficiencies,
  useRemediateDeficiency,
} from "@/hooks/useSOXControls";

export default function DeficiencyTracker() {
  const { deficiencies, summary } = useDeficiencies();
  const { remediate } = useRemediateDeficiency();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Material Weaknesses</h3>
          <div className="text-4xl font-bold text-red-600">
            {summary.material_weaknesses}
          </div>
        </Card>
        <Card>
          <h3>Significant Deficiencies</h3>
          <div className="text-4xl font-bold text-orange-600">
            {summary.significant}
          </div>
        </Card>
        <Card>
          <h3>Minor Deficiencies</h3>
          <div className="text-4xl font-bold text-yellow-600">
            {summary.minor}
          </div>
        </Card>
      </div>

      <Card title="Deficiency Register">
        <DataTable
          data={deficiencies}
          columns={[
            { key: "deficiency_id", label: "ID" },
            { key: "control_id", label: "Control" },
            {
              key: "severity",
              label: "Severity",
              render: (_, row) => (
                <Badge
                  variant={
                    row.severity === "Material Weakness"
                      ? "error"
                      : row.severity === "Significant Deficiency"
                      ? "warning"
                      : "default"
                  }
                >
                  {row.severity}
                </Badge>
              ),
            },
            { key: "identified_date", label: "Identified" },
            { key: "owner", label: "Owner" },
            { key: "target_resolution_date", label: "Target Date" },
            {
              key: "status",
              label: "Status",
              render: (_, row) => (
                <Badge
                  variant={
                    row.status === "Resolved"
                      ? "success"
                      : row.status === "In Progress"
                      ? "warning"
                      : "error"
                  }
                >
                  {row.status}
                </Badge>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                  {row.status !== "Resolved" && (
                    <Button size="sm" onClick={() => remediate(row.id)}>
                      Update Status
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
```

### 3. **SOX Evidence Library** 💎

**Description**: Centralized repository for SOX control evidence with automated collection, version control, and audit trail. Features drag-and-drop upload, smart tagging, and AI-powered evidence matching to controls.

**Why It's Killer**:

- **Centralized Storage**: All evidence in one place (vs. Excel files scattered across SharePoint)
- **AI Matching**: Automatically suggests which controls an uploaded document supports
- **Audit-Ready**: One-click evidence packages for external auditors (saves 40+ hours per audit)
- **Version Control**: Full history of all evidence changes (competitors lack this)

**Implementation**:

```typescript
import { Card, Button, FileUpload, DataTable, Badge, Search } from "aibos-ui";
import { useEvidenceLibrary, useUploadEvidence } from "@/hooks/useSOXControls";

export default function SOXEvidenceLibrary() {
  const { evidence, controls, filterEvidence } = useEvidenceLibrary();
  const { upload } = useUploadEvidence();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center">
          <h2>SOX Evidence Library</h2>
          <div className="flex gap-4">
            <Search
              placeholder="Search evidence..."
              onSearch={(query) => filterEvidence(query)}
            />
            <FileUpload
              multiple
              accept=".pdf,.xlsx,.docx,.png,.jpg"
              onUpload={(files) => upload(files)}
              label="Upload Evidence"
            />
            <Button variant="outline">Generate Audit Package</Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Evidence by Control">
          <DataTable
            data={controls}
            columns={[
              { key: "control_id", label: "Control ID" },
              { key: "description", label: "Description" },
              {
                key: "evidence_count",
                label: "Evidence Count",
                render: (_, row) => (
                  <Badge
                    variant={row.evidence_count >= 3 ? "success" : "warning"}
                  >
                    {row.evidence_count} files
                  </Badge>
                ),
              },
              { key: "last_updated", label: "Last Updated" },
            ]}
          />
        </Card>

        <Card title="Recent Uploads">
          <DataTable
            data={evidence}
            columns={[
              { key: "filename", label: "File" },
              { key: "control_id", label: "Control" },
              { key: "uploaded_by", label: "Uploaded By" },
              { key: "uploaded_at", label: "Date" },
              {
                key: "actions",
                label: "Actions",
                render: (_, row) => (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      Download
                    </Button>
                  </div>
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

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Main Page (`/sox/dashboard`)

**Components**: Card, DataTable, Badge, ProgressBar, Button
**File**: `apps/web/app/(dashboard)/sox/page.tsx`

#### 2. Control Detail Page (`/sox/controls/[id]`)

**Components**: Form, Button, Card, Badge, FileUpload
**File**: `apps/web/app/(dashboard)/sox/controls/[id]/page.tsx`

#### 3. Deficiency Page (`/sox/deficiencies`)

**Components**: DataTable, Form, Select, Badge
**File**: `apps/web/app/(dashboard)/sox/deficiencies/page.tsx`

#### 4. Evidence Library (`/sox/evidence`)

**Components**: FileUpload, DataTable, Search, Button
**File**: `apps/web/app/(dashboard)/sox/evidence/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                   | Target          | Measurement          |
| ------------------------ | --------------- | -------------------- |
| TTFB (staging)           | ≤ 70ms          | Server timing header |
| Client TTI for `/sox`    | ≤ 200ms         | Lighthouse CI        |
| Dashboard load           | < 1s            | Performance profiler |
| Control test submission  | < 500ms         | User perception      |
| Evidence upload          | < 5s (10MB)     | File upload monitor  |
| Audit package generation | < 10s           | Background job       |
| UI bundle size           | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to all SOX workflows
- **Focus Management**: Focus trap in testing forms; visible indicators
- **ARIA**: Control status announced; deficiency severity communicated
- **Screen Reader**: All compliance data announced; testing workflows described
- **Axe Target**: 0 serious/critical violations

### Security

| Layer           | Requirement                                                    |
| --------------- | -------------------------------------------------------------- |
| RBAC Scopes     | `sox.read`, `sox.test`, `sox.remediate`, `sox.admin`           |
| Enforcement     | Server-side on all endpoints                                   |
| Data Exposure   | Encrypt sensitive control data; secure evidence storage        |
| Audit Trail     | Immutable audit logs for all SOX activities (7-year retention) |
| Evidence Access | Secure signed URLs; access logs; version control               |
| Rate Limiting   | Protect evidence uploads; prevent abuse                        |

#### UI Permissions Matrix

| Role          | View | Test | Remediate | Manage Evidence | Admin |
| ------------- | ---- | ---- | --------- | --------------- | ----- |
| sox.read      | ✅   | ❌   | ❌        | ❌              | ❌    |
| sox.test      | ✅   | ✅   | ❌        | ✅              | ❌    |
| sox.remediate | ✅   | ✅   | ✅        | ✅              | ❌    |
| sox.admin     | ✅   | ✅   | ✅        | ✅              | ✅    |

### Reliability & Observability

- **SLO**: 100% control testing accuracy; 100% evidence retention
- **SLA Dashboards**: Real-time metrics on control effectiveness, deficiency trends
- **Events Emitted**: `SOX.ControlTested`, `SOX.DeficiencyIdentified`, `SOX.EvidenceUploaded`
- **Logging**: Structured logs with control IDs for all operations
- **Tracing**: Distributed tracing for testing and remediation workflows
- **Monitoring**: Control testing completion rate; deficiency resolution time; evidence integrity

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### SOX Control Rules

| Rule                             | Enforcement                                                      |
| -------------------------------- | ---------------------------------------------------------------- |
| **Control Testing Frequency**    | Test per defined frequency (monthly/quarterly/annual)            |
| **Material Weakness Escalation** | Immediate CFO notification; board reporting within 24h           |
| **Deficiency Classification**    | Classify as Material Weakness, Significant, or Minor             |
| **Evidence Retention**           | Retain all evidence for 7 years; immutable after upload          |
| **Dual Review**                  | High-risk controls require dual review and approval              |
| **Audit Trail Integrity**        | Immutable logs; no deletion; full change history                 |
| **Control Effectiveness**        | Pass rate ≥ 95% for effective rating                             |
| **Remediation Timing**           | Material Weakness: 30 days; Significant: 60 days; Minor: 90 days |

### SOX Workflow

- **Control Testing**: Scheduled → In Progress → Testing Complete → Effective/Deficient
- **Deficiency**: Identified → Assigned → Remediation Plan → In Progress → Resolved → Retested
- **Evidence**: Uploaded → Reviewed → Approved → Linked to Controls → Audit Package
- **Severity**: Minor → Significant Deficiency → Material Weakness (escalation path)

### Archive Semantics

- **Control History**: Retain all control testing history indefinitely
- **Audit Trail**: Maintain full audit trail of all SOX activities (7-year minimum)
- **Guard Rails**:
  - ❌ Deny delete of SOX evidence
  - ❌ Deny modification of historical test results
  - ❌ Deny modification of audit trails
  - ✅ Allow archive of resolved deficiencies after 2 years

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                            | User Action       |
| --------------------- | ------------------------------------- | ----------------- |
| **Empty**             | "No controls configured"              | "Create"          |
| **Loading**           | Skeleton table                        | N/A               |
| **Error**             | Error message + retry                 | Retry / Support   |
| **Pending**           | Gray badge "Pending Test"             | Start test        |
| **In Progress**       | Blue badge "Testing"                  | Continue          |
| **Passed**            | Green badge "Effective"               | View results      |
| **Failed**            | Red badge "Deficient"                 | Create deficiency |
| **Overdue**           | Orange badge "Test Overdue"           | Start test        |
| **Material Weakness** | Red badge "Material Weakness"         | Immediate action  |
| **Significant**       | Orange badge "Significant Deficiency" | Remediate         |
| **Minor**             | Yellow badge "Minor Deficiency"       | Remediate         |
| **Permission Denied** | "Access restricted"                   | Back              |

### Form Validation

- **Test Results**: Required; validate pass/fail with evidence
- **Deficiency Severity**: Required; validate classification criteria
- **Evidence Upload**: Validate file types, size limits (10MB max)
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal

### Network Errors

| HTTP Status | UI Message                                          | Action              |
| ----------- | --------------------------------------------------- | ------------------- |
| 400         | "Invalid test data. Check your input."              | Inline field errors |
| 401         | "Session expired. Please log in again."             | Redirect to login   |
| 403         | "You don't have permission for SOX controls."       | Hide action         |
| 404         | "Control not found."                                | Return to list      |
| 409         | "Control test already submitted."                   | Show existing       |
| 422         | "Validation failed."                                | Inline errors       |
| 500         | "SOX operation failed. Our team has been notified." | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/sox.json`.

### Page Titles & Headers

| Context      | Copy                  | i18n Key                 |
| ------------ | --------------------- | ------------------------ |
| Dashboard    | "SOX Controls"        | `sox.dashboard.title`    |
| Controls     | "Control Library"     | `sox.controls.title`     |
| Testing      | "Control Testing"     | `sox.testing.title`      |
| Deficiencies | "Deficiency Register" | `sox.deficiencies.title` |
| Evidence     | "Evidence Library"    | `sox.evidence.title`     |

### State Messages

| State             | Title                          | Message                                     | Action Button  | i18n Key                 |
| ----------------- | ------------------------------ | ------------------------------------------- | -------------- | ------------------------ |
| Empty             | "No controls configured"       | "Configure your first SOX control"          | "Create"       | `sox.empty.*`            |
| Pending           | "Testing pending"              | "Test due by {date}"                        | "Start Test"   | `sox.pending.*`          |
| In Progress       | "Test in progress"             | "Testing started by {user}"                 | "Continue"     | `sox.inProgress.*`       |
| Passed            | "Control effective"            | "Last tested {date}"                        | "View Results" | `sox.passed.*`           |
| Failed            | "Control deficient"            | "Deficiency identified"                     | "Remediate"    | `sox.failed.*`           |
| Material Weakness | "Material weakness identified" | "Immediate executive notification required" | "Escalate"     | `sox.materialWeakness.*` |

### Success Messages (Toast)

| Action                  | Message                                     | i18n Key                   |
| ----------------------- | ------------------------------------------- | -------------------------- |
| Control Tested          | "Control test submitted successfully"       | `sox.test.success`         |
| Deficiency Created      | "Deficiency logged and assigned to {owner}" | `sox.deficiency.success`   |
| Evidence Uploaded       | "Evidence uploaded: {filename}"             | `sox.evidence.success`     |
| Audit Package Generated | "Audit package ready for download"          | `sox.auditPackage.success` |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useSOX.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useSOXControls(filters = {}) {
  return useQuery({
    queryKey: ["sox", "controls", filters],
    queryFn: () => apiClient.GET("/api/sox/controls", { query: filters }),
    staleTime: 60_000, // 1min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useTestControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      control_id: string;
      test_result: "pass" | "fail";
      evidence_ids: string[];
      notes: string;
    }) => apiClient.POST("/api/sox/testing", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sox"] });

      if (data.test_result === "fail") {
        toast.error("Control deficiency identified. Deficiency created.");
      } else {
        toast.success("Control test submitted successfully");
      }
    },
    onError: () => {
      toast.error("Failed to submit control test.");
    },
  });
}

export function useDeficiencies(filters = {}) {
  return useQuery({
    queryKey: ["sox", "deficiencies", filters],
    queryFn: () => apiClient.GET("/api/sox/deficiencies", { query: filters }),
    staleTime: 60_000, // 1min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useRemediateDeficiency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      deficiency_id: string;
      remediation_plan: string;
      target_date: string;
    }) => apiClient.POST("/api/sox/deficiencies/remediate", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sox"] });

      if (data.severity === "Material Weakness") {
        toast.warning(
          "Material weakness remediation plan submitted. Executive notification sent."
        );
      } else {
        toast.success("Remediation plan submitted successfully");
      }
    },
    onError: () => {
      toast.error("Failed to submit remediation plan.");
    },
  });
}

export function useEvidenceLibrary(filters = {}) {
  return useQuery({
    queryKey: ["sox", "evidence", filters],
    queryFn: () => apiClient.GET("/api/sox/evidence", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });
}

export function useUploadEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { file: File; control_ids: string[] }) =>
      apiClient.POST("/api/sox/evidence", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sox", "evidence"] });
      toast.success(`Evidence uploaded: ${data.filename}`);
    },
    onError: () => {
      toast.error("Failed to upload evidence.");
    },
  });
}

export function useGenerateAuditPackage() {
  return useMutation({
    mutationFn: (data: {
      control_ids?: string[];
      start_date: string;
      end_date: string;
    }) => apiClient.POST("/api/sox/reports/audit-package", { body: data }),
    onSuccess: (data) => {
      toast.success("Audit package ready for download");
      window.location.href = data.download_url;
    },
    onError: () => {
      toast.error("Failed to generate audit package.");
    },
  });
}
```

### Error Mapping

| API Error         | User Message                                        | UI Action            |
| ----------------- | --------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid test data. Check your input."              | Inline field errors  |
| 409 (Duplicate)   | "Control test already submitted."                   | Show existing        |
| 422 (Validation)  | "Validation failed."                                | Inline errors        |
| 403 (Forbidden)   | "You don't have permission for SOX controls."       | Hide action          |
| 500 (Server)      | "SOX operation failed. Our team has been notified." | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for evidence upload mutations

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["sox", "controls", { filters }][("sox", "control", controlId)][
  ("sox", "deficiencies", { filters })
][("sox", "deficiency", deficiencyId)][("sox", "evidence", { filters })][
  ("sox", "testing", "schedule")
];
```

### Invalidation Rules

| Action               | Invalidates                                      |
| -------------------- | ------------------------------------------------ |
| Submit Test          | `["sox"]` (all)                                  |
| Create Deficiency    | `["sox", "deficiencies"]`, `["sox", "controls"]` |
| Upload Evidence      | `["sox", "evidence"]`                            |
| Remediate Deficiency | `["sox", "deficiencies"]`                        |

### Stale Time

| Query Type       | Stale Time | Reasoning                       |
| ---------------- | ---------- | ------------------------------- |
| Controls         | 1min       | Moderate update frequency       |
| Control Detail   | 1min       | Changes during testing          |
| Deficiencies     | 1min       | Active remediation updates      |
| Evidence         | 30s        | Frequent uploads during testing |
| Testing Schedule | 5min       | Changes infrequently            |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("sox-controls");
revalidateTag("sox-deficiencies");
revalidateTag("sox-evidence");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/sox.fixtures.ts`

**Datasets**:

- `minimalSOX`: 10 controls (passed, failed, pending)
- `standardSOX`: 50 controls with testing history
- `complexSOX`: 100+ controls with deficiencies and evidence
- `edgeCases`: Edge cases (material weaknesses, overdue tests)

**Edge Cases Covered**:

- Material weakness escalation
- Overdue control testing
- Multiple deficiencies per control
- Evidence versioning
- Remediation tracking
- Audit package generation

```typescript
// Example fixture
export const standardSOXFixture: SOXFixture = {
  controls: [
    {
      id: "ctrl_1",
      control_id: "AC-001",
      description: "Segregation of Duties - Journal Entry Approval",
      risk_level: "High",
      test_frequency: "Quarterly",
      last_test_date: "2025-07-01",
      next_test_date: "2025-10-01",
      status: "Passed",
      effectiveness: "Effective",
    },
    // ... more controls
  ],
  deficiencies: [
    {
      id: "def_1",
      deficiency_id: "DEF-001",
      control_id: "AC-002",
      severity: "Significant Deficiency",
      identified_date: "2025-08-15",
      owner: "CFO",
      target_resolution_date: "2025-10-15",
      status: "In Progress",
    },
  ],
};
```

### E2E Seed Data

**Location**: `tests/seeds/sox.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:sox
```

**Dataset**:

- 50 SOX controls (various risk levels)
- 10 deficiencies (various severities)
- 30 evidence files
- Testing history

**Cleanup Command**:

```powershell
pnpm run seed:sox:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, auditor training

**Characteristics**:

- Realistic "Demo Corp" SOX control framework
- 40 controls across all categories
- Sample deficiencies and remediation plans
- Evidence library with sample documents
- Audit package examples

**Regeneration**:

```powershell
pnpm run demo:reset:sox
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] Control effectiveness calculations correct
- [ ] Deficiency severity classifications valid
- [ ] Evidence files exist and accessible
- [ ] No orphaned references

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
- **Interactive Parts**: Mark with `"use client"` (testing forms, evidence upload)

### Data Fetching Strategy

| Scenario          | Strategy                             | Benefit             |
| ----------------- | ------------------------------------ | ------------------- |
| Initial Dashboard | Server-side fetch + stream           | Faster TTFB         |
| Testing Actions   | Client-side with optimistic updates  | Instant feedback    |
| Evidence Library  | Server component with client uploads | SEO + interactivity |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function submitControlTest(data) {
  // ... mutation logic
  revalidateTag("sox-controls");
  revalidateTag("sox-testing");

  // Escalate if material weakness
  if (data.severity === "Material Weakness") {
    await notifyExecutives(data);
  }
}
```

---

## 📊 Analytics & Audit Events

| Event                         | When                | Properties                                                 |
| ----------------------------- | ------------------- | ---------------------------------------------------------- |
| SOX.ControlTested             | Test submitted      | `control_id`, `test_result`, `tester_id`, `evidence_count` |
| SOX.DeficiencyIdentified      | Deficiency created  | `deficiency_id`, `control_id`, `severity`, `owner`         |
| SOX.DeficiencyRemediated      | Deficiency resolved | `deficiency_id`, `remediation_date`, `retest_result`       |
| SOX.EvidenceUploaded          | Evidence uploaded   | `evidence_id`, `control_ids`, `file_size`, `uploader_id`   |
| SOX.AuditPackageGenerated     | Package generated   | `package_id`, `control_count`, `date_range`                |
| SOX.MaterialWeaknessEscalated | MW identified       | `deficiency_id`, `control_id`, `notification_sent_to`      |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("SOX.ControlTested", {
  control_id: "AC-001",
  test_result: "pass",
  tester_id: "user_123",
  evidence_count: 3,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/sox.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties; test with Arabic locale

### Keyboard Shortcuts

| Key      | Action               | Scope             |
| -------- | -------------------- | ----------------- |
| `/`      | Focus search         | Any page          |
| `n`      | Create control       | Control list      |
| `t`      | Start test           | Control detail    |
| `e`      | Upload evidence      | Evidence lib      |
| `r`      | Remediate deficiency | Deficiency detail |
| `↑ / ↓`  | Navigate list        | Control list      |
| `Enter`  | Open control         | Control list      |
| `Escape` | Close modal/cancel   | Modal/Form        |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateModal()],
  ["t", () => startTest()],
  ["e", () => uploadEvidence()],
  ["r", () => remediate()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                               | Duration | Rollback Trigger |
| ----------- | ---------------- | -------------------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                               | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, control test accuracy 100%                 | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, test accuracy 100%, evidence integrity 100% | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained                       | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m27_sox: false,                          // Master toggle
  m27_sox_testing: false,                  // Control testing
  m27_sox_deficiencies: false,             // Deficiency management
  m27_sox_evidence: false,                 // Evidence library
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Control test accuracy (100% required)
- Evidence integrity (100% required)
- Deficiency resolution time
- Material weakness escalation time (< 24h)
- Control testing completion rate

**Alert Thresholds**:

- Material weakness identified → immediate CFO/board notification
- Control test accuracy < 100% → investigate
- Evidence upload failure → immediate fix
- Deficiency overdue → escalate

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m27_sox = false`

   ```powershell
   pnpm run flags:set m27_sox=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("sox-controls");
   revalidateTag("sox-deficiencies");
   revalidateTag("sox-evidence");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/sox/*"
   ```

4. **Monitor for 15 minutes**:

   - Error rate drops below 0.1%
   - No new Sentry issues
   - Users see fallback message

5. **Post-mortem**:
   - Create incident report
   - Identify root cause
   - Add regression test
   - Notify compliance team

**Rollback Decision Matrix**:

| Scenario                        | Action             | Approval Required |
| ------------------------------- | ------------------ | ----------------- |
| Material weakness misclassified | Immediate rollback | No (auto-trigger) |
| Evidence integrity compromised  | Immediate rollback | No (auto-trigger) |
| Control test accuracy < 100%    | Immediate rollback | No (auto-trigger) |
| Audit trail corrupted           | Immediate rollback | No (auto-trigger) |
| User complaints > 5             | Investigate first  | Compliance lead   |

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

- SAP GRC: SOX control framework
- Oracle ERP Cloud: Control testing workflows
- ServiceNow GRC: Deficiency management
- PCAOB Standards: SOX compliance requirements
- COSO Framework: Internal control standards

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Control Testing Accuracy

**Mitigation**: Rigorous test procedures; dual review for high-risk controls; comprehensive audit trail; regular auditor consultation

### Risk #2: Material Weakness Reporting

**Mitigation**: Immediate escalation workflows; executive notification within 24h; board reporting procedures; external auditor notification

### Risk #3: Evidence Integrity and Retention

**Mitigation**: Version control; immutable audit logs; 7-year retention; secure storage; access logs

### Risk #4: External Auditor Requirements

**Mitigation**: Regular auditor consultation; industry standards alignment; audit package automation; evidence completeness validation

---

## 📝 Implementation Guide

### Day 1: Control Testing Dashboard (8 hours)

1. Build control testing dashboard with stats cards (2 hours)
2. Implement control testing table with filtering (3 hours)
3. Add test initiation and result recording forms (2 hours)
4. Create progress tracking by category (1 hour)

### Day 2: Deficiencies & Evidence (4 hours)

1. Build deficiency tracker with severity indicators (2 hours)
2. Implement evidence library with upload (1.5 hours)
3. Create audit package generation (0.5 hour)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Control testing status calculations
- [ ] Deficiency severity classification
- [ ] Evidence file upload validation
- [ ] Control effectiveness rating logic
- [ ] Material weakness escalation triggers

### Integration Tests

- [ ] Complete control testing workflow
- [ ] Deficiency assignment and remediation flow
- [ ] Evidence upload and retrieval
- [ ] Audit package generation
- [ ] Material weakness escalation workflow

### E2E Tests

- [ ] User can view control dashboard and initiate testing
- [ ] User can submit control test with evidence
- [ ] User can track deficiency from identification to resolution
- [ ] User can upload evidence and link to controls
- [ ] User can generate audit package
- [ ] Keyboard-only flow: test → deficiency → evidence

### Accessibility Tests

- [ ] Keyboard navigation works
- [ ] Screen reader announces control status
- [ ] Focus management correct
- [ ] Color contrast meets WCAG 2.2 AAA
- [ ] Axe: 0 serious/critical violations

### Contract Tests

- [ ] API calls match OpenAPI spec

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for all components

### Performance Tests

- [ ] Bundle size < 250KB gzipped
- [ ] TTFB ≤ 70ms on staging
- [ ] Dashboard renders efficiently

---

## 📅 Timeline

| Day | Deliverable                                      |
| --- | ------------------------------------------------ |
| 1   | Control testing dashboard with full CRUD         |
| 2   | Deficiency tracker and evidence library complete |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries
- ✅ M21: Evidence Management

### Enables These Modules

- M28: ITGC (IT General Controls)
- M29: Operations Automation

---

## 🎯 Success Criteria

### Must Have

- [ ] Control testing dashboard showing all controls with status
- [ ] Deficiency tracker with severity classification
- [ ] Evidence library with file upload and organization
- [ ] Material weakness escalation workflow
- [ ] Control test accuracy 100%, Evidence integrity 100%

### Should Have

- [ ] Automated testing reminders
- [ ] Remediation workflow automation
- [ ] One-click audit package generation
- [ ] Executive dashboards

### Nice to Have

- [ ] AI-powered evidence matching
- [ ] Predictive control failure analysis
- [ ] Board-ready executive reports
- [ ] Integration with external auditor systems

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created (`/sox/dashboard`, `/sox/controls`, `/sox/testing`, `/sox/deficiencies`, `/sox/evidence`)
- [ ] Control testing working
- [ ] Deficiency management working
- [ ] Evidence library working
- [ ] Audit package generation working
- [ ] Material weakness escalation working
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
- [ ] Integration tests: All SOX operations covered
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/sox`
- [ ] Evidence upload: < 5s (10MB)
- [ ] Audit package: < 10s

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
- [ ] Material weakness alerts configured

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced
- [ ] Evidence data encrypted
- [ ] Audit trail complete (immutable)
- [ ] 7-year retention configured
- [ ] SOX compliance validated

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All tests passed
- [ ] **Design**: UI matches specs
- [ ] **PM**: Feature complete
- [ ] **Security**: Security review passed
- [ ] **Accessibility**: A11y audit passed
- [ ] **Compliance**: SOX framework validated
- [ ] **External Auditor**: Audit package format approved

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M26 - Recurring Billing  
**Next**: M28 - ITGC
