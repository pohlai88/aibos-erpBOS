# 🚀 M35: Time & Expenses - UI Implementation Runbook

**Module ID**: M35  
**Module Name**: Time & Expenses  
**Priority**: HIGH  
**Phase**: 10 - Extended Modules  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

M35 provides intuitive time entry and expense management for project-based businesses. Features mobile-first time tracking, OCR receipt capture, automated approval workflows, and seamless integration with project costing and payroll.

### Business Value

- **Mobile Time Entry**: Capture billable time anywhere, increasing time capture by 25%
- **Expense Automation**: OCR receipt scanning reduces expense processing from 5 min to 30 sec
- **Approval Efficiency**: Automated workflows reduce approval time from days to hours
- **Revenue Optimization**: Better time tracking increases billable hours captured by 15-20%
- **Employee Satisfaction**: Easy-to-use mobile app reduces administrative burden

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-mobile-time-entry], [ADR-###-ocr-expense-capture], [ADR-###-approval-workflows]

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

**Time Entry** (5 endpoints):

- ✅ `/api/time-expenses/timesheets` - List timesheets
- ✅ `/api/time-expenses/timesheets/[id]` - Timesheet details
- ✅ `/api/time-expenses/time/submit` - Submit time entry
- ✅ `/api/time-expenses/time/timer` - Start/stop timer
- ✅ `/api/time-expenses/time/recent` - Recent projects/tasks

**Expense Management** (5 endpoints):

- ✅ `/api/time-expenses/expenses` - List expenses
- ✅ `/api/time-expenses/expenses/[id]` - Expense details
- ✅ `/api/time-expenses/expenses/submit` - Submit expense
- ✅ `/api/time-expenses/expenses/ocr` - OCR receipt scanning
- ✅ `/api/time-expenses/expenses/policy-check` - Validate against policy

**Approval Workflows** (4 endpoints):

- ✅ `/api/time-expenses/approvals` - List pending approvals
- ✅ `/api/time-expenses/approvals/approve` - Approve items
- ✅ `/api/time-expenses/approvals/reject` - Reject items
- ✅ `/api/time-expenses/approvals/batch` - Batch approve/reject

**Reporting** (2 endpoints):

- ✅ `/api/time-expenses/reports/utilization` - Employee utilization
- ✅ `/api/time-expenses/reports/expense-analytics` - Expense analytics

**Total Endpoints**: 16 (4 categories)

### Risks & Blockers

| Risk                            | Impact | Mitigation                                                        | Owner     |
| ------------------------------- | ------ | ----------------------------------------------------------------- | --------- |
| OCR accuracy for receipts       | HIGH   | Use proven OCR engine; manual review fallback; test suite         | @ops      |
| Mobile offline sync reliability | MED    | Service worker; conflict resolution; retry logic; monitoring      | @frontend |
| Approval workflow complexity    | MED    | Flexible rule engine; clear escalation paths; comprehensive tests | @ops      |
| Policy compliance enforcement   | HIGH   | Server-side validation; approval blocks; audit trail              | @finance  |

---

## 🎯 3 Killer Features

### 1. **Mobile-First Time Entry** 🚀

**Description**: Beautiful mobile-optimized time entry interface with quick entry shortcuts, recent projects/tasks, timer functionality, and offline capability. Features one-tap entry for recurring activities and bulk time entry for the week.

**Why It's Killer**:

- **Mobile-First Design**: 80% of time entry happens on mobile (competitors have clunky mobile UIs)
- **Quick Entry**: Log time in 3 taps vs. 10+ taps in SAP/Oracle
- **Offline Mode**: Capture time without internet, syncs when connected
- **Measurable Impact**: Increase time entry compliance from 70% to 95%
- **Vs Replicon/TSheets**: Better UI and native ERP integration (standalone tools require syncing)

**Implementation**:

```typescript
import { Card, Button, Select, Input, Badge, Timer } from "aibos-ui";
import { useTimeEntry, useStartTimer } from "@/hooks/useTimeExpenses";

export default function MobileTimeEntry() {
  const { submitTime, recentProjects } = useTimeEntry();
  const { timer, startTimer, stopTimer } = useStartTimer();

  return (
    <div className="max-w-md mx-auto space-y-4">
      {timer.running && (
        <Card className="bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{timer.project_name}</h3>
              <p className="text-sm text-gray-600">{timer.task_name}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {timer.elapsed_time}
              </div>
              <Button size="sm" variant="error" onClick={stopTimer}>
                Stop & Save
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card title="Quick Time Entry">
        <Form onSubmit={submitTime} className="space-y-4">
          <Input type="date" label="Date" name="date" defaultValue={today} />
          <Select
            label="Project"
            name="project_id"
            options={recentProjects}
            searchable
          />
          <Select
            label="Task"
            name="task_id"
            options={/* tasks */}
            searchable
          />
          <Input
            type="number"
            label="Hours"
            name="hours"
            step="0.25"
            required
          />
          <Textarea label="Description" name="description" rows={2} />
          <div className="flex items-center gap-2">
            <Checkbox label="Billable" name="billable" defaultChecked />
          </div>
          <Button type="submit" variant="primary" fullWidth>
            Log Time
          </Button>
        </Form>
      </Card>

      <Card title="Recent Projects">
        <div className="space-y-2">
          {recentProjects.map((project) => (
            <Button
              key={project.id}
              variant="outline"
              fullWidth
              onClick={() => startTimer(project)}
              className="justify-between"
            >
              <span>{project.name}</span>
              <Badge>{project.recent_hours}h this week</Badge>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

### 2. **OCR Expense Capture** ⚡

**Description**: AI-powered receipt scanning that extracts vendor, date, amount, and category from photos. Features multi-receipt batch upload, automatic mileage calculation, and policy compliance checking.

**Why It's Killer**:

- **OCR Accuracy**: 95%+ accurate data extraction from receipts (best-in-class)
- **Speed**: Process expenses in 30 seconds vs. 5 minutes manual entry
- **Policy Enforcement**: Flags out-of-policy expenses before submission
- **Measurable Impact**: Reduce expense processing costs by 70%
- **Vs Concur/Expensify**: Better OCR and native ERP integration

**Implementation**:

```typescript
import { Card, Button, FileUpload, Badge, DataTable, Alert } from "aibos-ui";
import { useExpenseSubmission, useOCR } from "@/hooks/useTimeExpenses";

export default function OCRExpenseCapture() {
  const { submitExpense, expenses } = useExpenseSubmission();
  const { scanReceipt, ocrResult } = useOCR();

  return (
    <div className="space-y-6">
      <Card title="Scan Receipt">
        <FileUpload
          accept="image/*,application/pdf"
          capture="environment"
          onUpload={scanReceipt}
          label="Take Photo or Upload Receipt"
        />

        {ocrResult && (
          <div className="mt-4 space-y-4">
            {ocrResult.policy_violations.length > 0 && (
              <Alert variant="warning">
                <strong>Policy Violation Detected:</strong>
                <ul>
                  {ocrResult.policy_violations.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Vendor"
                name="vendor"
                value={ocrResult.vendor}
                readOnly
              />
              <Input
                label="Date"
                type="date"
                name="date"
                value={ocrResult.date}
                readOnly
              />
              <Input
                label="Amount"
                type="number"
                name="amount"
                value={ocrResult.amount}
                prefix="$"
              />
              <Select
                label="Category"
                name="category"
                value={ocrResult.category}
                options={expenseCategories}
              />
            </div>

            <Input label="Project (Optional)" name="project_id" />
            <Textarea label="Business Purpose" name="description" required />

            <Button variant="primary" onClick={submitExpense}>
              Submit Expense
            </Button>
          </div>
        )}
      </Card>

      <Card title="Pending Expenses">
        <DataTable
          data={expenses.filter((e) => e.status === "Draft")}
          columns={[
            { key: "date", label: "Date" },
            { key: "vendor", label: "Vendor" },
            { key: "category", label: "Category" },
            {
              key: "amount",
              label: "Amount",
              render: (_, row) => `$${row.amount.toLocaleString()}`,
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <Button size="sm" variant="outline">
                  Edit
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

### 3. **Approval Workflow Engine** 💎

**Description**: Configurable multi-level approval workflows for timesheets and expenses. Features automatic routing based on amount/project, batch approvals, mobile approval capability, and approval analytics.

**Why It's Killer**:

- **Flexible Routing**: Approval rules based on amount, project, department (competitors have rigid workflows)
- **Batch Approvals**: Approve 50 timesheets in one click (vs. one-by-one in Oracle)
- **Mobile Approvals**: Managers approve on the go (SAP mobile approval is clunky)
- **Measurable Impact**: Reduce average approval time from 5 days to 1 day

**Implementation**:

```typescript
import { Card, Badge, DataTable, Button, Tabs } from "aibos-ui";
import { useApprovals, useApproveItems } from "@/hooks/useTimeExpenses";

export default function ApprovalWorkflowEngine() {
  const { timesheets, expenses, stats } = useApprovals();
  const { approve, reject, batchApprove } = useApproveItems();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Pending Approvals</h3>
          <div className="text-4xl font-bold text-orange-600">
            {stats.pending}
          </div>
        </Card>
        <Card>
          <h3>Total Amount</h3>
          <div className="text-3xl font-bold">
            ${stats.total_amount.toLocaleString()}
          </div>
        </Card>
        <Card>
          <h3>Avg Approval Time</h3>
          <div className="text-3xl font-bold">{stats.avg_approval_time}</div>
          <p className="text-sm text-gray-600">hours</p>
        </Card>
      </div>

      <Card>
        <Tabs
          tabs={[
            { id: "timesheets", label: `Timesheets (${timesheets.length})` },
            { id: "expenses", label: `Expenses (${expenses.length})` },
          ]}
        >
          <Tab id="timesheets">
            <div className="flex justify-between mb-4">
              <h3>Timesheet Approvals</h3>
              <Button
                variant="success"
                onClick={() => batchApprove(selectedItems)}
                disabled={selectedItems.length === 0}
              >
                Approve Selected ({selectedItems.length})
              </Button>
            </div>
            <DataTable
              data={timesheets}
              selectable
              onSelectionChange={setSelectedItems}
              columns={[
                { key: "employee_name", label: "Employee" },
                { key: "week_ending", label: "Week Ending" },
                { key: "total_hours", label: "Hours" },
                {
                  key: "billable_pct",
                  label: "Billable %",
                  render: (_, row) => (
                    <Badge
                      variant={
                        row.billable_pct >= 75
                          ? "success"
                          : row.billable_pct >= 60
                          ? "warning"
                          : "error"
                      }
                    >
                      {row.billable_pct}%
                    </Badge>
                  ),
                },
                { key: "submitted_date", label: "Submitted" },
                {
                  key: "actions",
                  label: "Actions",
                  render: (_, row) => (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => approve(row.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="error"
                        onClick={() => reject(row.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </Tab>

          <Tab id="expenses">
            <DataTable
              data={expenses}
              columns={[
                { key: "employee_name", label: "Employee" },
                { key: "date", label: "Date" },
                { key: "vendor", label: "Vendor" },
                { key: "category", label: "Category" },
                {
                  key: "amount",
                  label: "Amount",
                  render: (_, row) => `$${row.amount.toLocaleString()}`,
                },
                {
                  key: "policy_compliant",
                  label: "Policy",
                  render: (_, row) => (
                    <Badge variant={row.policy_compliant ? "success" : "error"}>
                      {row.policy_compliant ? "Compliant" : "Review Required"}
                    </Badge>
                  ),
                },
                {
                  key: "actions",
                  label: "Actions",
                  render: (_, row) => (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewReceipt(row.id)}
                      >
                        Receipt
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => approve(row.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="error"
                        onClick={() => reject(row.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </Tab>
        </Tabs>
      </Card>
    </div>
  );
}
```

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Time Entry (`/time-expenses/time`)

**Components**: Card, Form, Input, Select, Timer, Button
**File**: `apps/web/app/(dashboard)/time-expenses/time/page.tsx`

#### 2. Expense Entry (`/time-expenses/expenses`)

**Components**: FileUpload, Form, Card, Alert
**File**: `apps/web/app/(dashboard)/time-expenses/expenses/page.tsx`

#### 3. Approvals (`/time-expenses/approvals`)

**Components**: DataTable, Button, Badge, Tabs
**File**: `apps/web/app/(dashboard)/time-expenses/approvals/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                     | Target          | Measurement          |
| -------------------------- | --------------- | -------------------- |
| TTFB (staging)             | ≤ 70ms          | Server timing header |
| Client TTI for `/time`     | ≤ 200ms         | Lighthouse CI        |
| Mobile time entry          | < 1s submit     | Performance profiler |
| OCR processing time        | < 5s            | API response time    |
| Offline sync (100 entries) | < 10s           | Service worker perf  |
| Approval batch (50 items)  | < 2s            | API response time    |
| UI bundle size             | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access for all time/expense forms
- **Focus Management**: Logical tab order; focus indicators
- **ARIA**: Timer status announced; approval status communicated
- **Screen Reader**: All form fields labeled; dynamic updates announced
- **Axe Target**: 0 serious/critical violations
- **Mobile A11y**: Touch targets ≥44px; iOS VoiceOver and Android TalkBack tested

### Security

| Layer           | Requirement                                                        |
| --------------- | ------------------------------------------------------------------ |
| RBAC Scopes     | `time.submit`, `time.approve`, `expense.submit`, `expense.approve` |
| Enforcement     | Server-side on all endpoints                                       |
| Data Exposure   | Only show time/expense data user has permission for                |
| Audit Trail     | Immutable logs for all submissions/approvals                       |
| Policy Rules    | Server-side enforcement; client-side hints only                    |
| Receipt Storage | Encrypted at rest; auto-delete after retention period              |

#### UI Permissions Matrix

| Role               | View | Submit Time | Approve Time | Submit Expense | Approve Expense | Admin |
| ------------------ | ---- | ----------- | ------------ | -------------- | --------------- | ----- |
| time.submit        | ✅   | ✅          | ❌           | ❌             | ❌              | ❌    |
| time.approve       | ✅   | ✅          | ✅           | ❌             | ❌              | ❌    |
| expense.submit     | ✅   | ❌          | ❌           | ✅             | ❌              | ❌    |
| expense.approve    | ✅   | ❌          | ❌           | ✅             | ✅              | ❌    |
| time-expense.admin | ✅   | ✅          | ✅           | ✅             | ✅              | ✅    |

### Reliability & Observability

- **SLO**: 99.5% successful time/expense submissions; 95% OCR accuracy
- **SLA Dashboards**: Real-time metrics on submission success rate, OCR accuracy
- **Events Emitted**: `TimeExpense.TimeSubmitted`, `TimeExpense.ExpenseSubmitted`, `TimeExpense.Approved`
- **Logging**: Structured logs with employee IDs for all operations
- **Tracing**: Distributed tracing for OCR workflows

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Time & Expense Business Rules

| Rule                     | Enforcement                                         |
| ------------------------ | --------------------------------------------------- |
| **Time Entry**           | Must link to valid project/task or be non-billable  |
| **Billable Hours**       | Max 24 hours per day; alert at >12 hours            |
| **Expense Policy**       | Server-side validation against policy rules         |
| **Approval Authority**   | Based on amount, department, project                |
| **Duplicate Prevention** | Check for similar time entries within 1 hour window |
| **Timesheet Periods**    | Weekly (Mon-Sun); lock after 2 weeks                |
| **Receipt Requirements** | Mandatory for expenses >$25 (configurable)          |

### Time/Expense States

- **Time Entry**: Draft → Submitted → Approved → Posted → Locked
- **Expense**: Draft → Submitted → Approved → Reimbursed → Archived
- **Approval**: Pending → Approved / Rejected / Escalated

### Archive Semantics

- **Timesheet History**: Retain all timesheets (7-year minimum)
- **Receipt Storage**: Encrypted storage; auto-delete after 7 years
- **Guard Rails**:
  - ❌ Deny deletion of approved/posted timesheets
  - ❌ Deny changes to locked periods
  - ✅ Allow draft deletions

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                    | User Action     |
| --------------------- | ----------------------------- | --------------- |
| **Empty**             | "No time entries yet"         | "Log Time"      |
| **Loading**           | Skeleton forms/tables         | N/A             |
| **Error**             | Error message + retry         | Retry / Support |
| **Draft**             | Gray badge "Draft"            | Submit          |
| **Submitted**         | Blue badge "Pending Approval" | View            |
| **Approved**          | Green badge "Approved"        | View            |
| **Rejected**          | Red badge "Rejected"          | Edit / Resubmit |
| **Posted**            | Green badge "Posted"          | View only       |
| **Locked**            | Gray badge "Locked"           | View only       |
| **Offline**           | Orange banner "Offline mode"  | Continue entry  |
| **Syncing**           | Blue badge "Syncing..."       | Wait            |
| **Permission Denied** | "Access restricted"           | Back            |

### Form Validation

- **Time Entry**: Validate hours (0.25 increments), project/task required if billable
- **Expense Entry**: Validate amount, category, receipt if >$25
- **Policy Validation**: Check against expense policy rules

### Network Errors

| HTTP Status | UI Message                                 | Action              |
| ----------- | ------------------------------------------ | ------------------- |
| 400         | "Invalid time/expense data. Check inputs." | Inline field errors |
| 401         | "Session expired. Please log in again."    | Redirect to login   |
| 403         | "You don't have permission."               | Hide action         |
| 404         | "Project/Task not found."                  | Refresh options     |
| 409         | "Duplicate entry detected. Review."        | Show diff modal     |
| 422         | "Policy violation detected."               | Inline errors       |
| 500         | "Something went wrong. Try again."         | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/time-expenses.json`.

### Page Titles & Headers

| Context       | Copy                | i18n Key                      |
| ------------- | ------------------- | ----------------------------- |
| Time Entry    | "Log Time"          | `timeExpense.time.title`      |
| Expense Entry | "Submit Expense"    | `timeExpense.expense.title`   |
| Approvals     | "Pending Approvals" | `timeExpense.approvals.title` |
| Timer         | "Time Tracker"      | `timeExpense.timer.title`     |

### State Messages

| State    | Title                 | Message                         | Action Button | i18n Key                 |
| -------- | --------------------- | ------------------------------- | ------------- | ------------------------ |
| Empty    | "No time entries yet" | "Start logging your time"       | "Log Time"    | `timeExpense.empty.*`    |
| Offline  | "Offline mode"        | "Entries will sync when online" | "Continue"    | `timeExpense.offline.*`  |
| Rejected | "Entry rejected"      | "Review feedback and resubmit"  | "Edit"        | `timeExpense.rejected.*` |

### Success Messages (Toast)

| Action            | Message                               | i18n Key                      | Shortcut |
| ----------------- | ------------------------------------- | ----------------------------- | -------- |
| Time Submitted    | "Time entry submitted for approval"   | `timeExpense.time.success`    | `t`      |
| Expense Submitted | "Expense submitted for approval"      | `timeExpense.expense.success` | `e`      |
| Approved          | "{count} items approved successfully" | `timeExpense.approve.success` | `a`      |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useTimeExpenses.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useTimesheets(filters = {}) {
  return useQuery({
    queryKey: ["timesheets", "list", filters],
    queryFn: () =>
      apiClient.GET("/api/time-expenses/timesheets", { query: filters }),
    staleTime: 1 * 60_000, // 1min (frequently updated)
    retry: 2,
    select: (response) => response.data,
  });
}

export function useSubmitTime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (timeData: any) =>
      apiClient.POST("/api/time-expenses/time/submit", { body: timeData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["projects", "costing"] });
      toast.success("Time entry submitted for approval");
    },
    onError: () => {
      toast.error("Failed to submit time entry.");
    },
  });
}

export function useTimer() {
  return useQuery({
    queryKey: ["timer", "active"],
    queryFn: () => apiClient.GET("/api/time-expenses/time/timer"),
    staleTime: 30_000, // 30s
    refetchInterval: 30_000, // Update every 30s while timer running
    select: (response) => response.data,
  });
}

export function useStartTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectData: any) =>
      apiClient.POST("/api/time-expenses/time/timer", {
        body: { action: "start", ...projectData },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timer"] });
      toast.success("Timer started");
    },
  });
}

export function useStopTimer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.POST("/api/time-expenses/time/timer", {
        body: { action: "stop" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timer"] });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      toast.success("Time saved successfully");
    },
  });
}

export function useExpenses(filters = {}) {
  return useQuery({
    queryKey: ["expenses", "list", filters],
    queryFn: () =>
      apiClient.GET("/api/time-expenses/expenses", { query: filters }),
    staleTime: 2 * 60_000, // 2min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useOCR() {
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("receipt", file);
      return apiClient.POST("/api/time-expenses/expenses/ocr", {
        body: formData,
      });
    },
    onSuccess: (data) => {
      if (data.policy_violations && data.policy_violations.length > 0) {
        toast.warning("Policy violations detected. Please review.");
      } else {
        toast.success("Receipt scanned successfully");
      }
    },
    onError: () => {
      toast.error(
        "Failed to scan receipt. Please try again or enter manually."
      );
    },
  });
}

export function useSubmitExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseData: any) =>
      apiClient.POST("/api/time-expenses/expenses/submit", {
        body: expenseData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense submitted for approval");
    },
    onError: () => {
      toast.error("Failed to submit expense.");
    },
  });
}

export function useApprovals() {
  return useQuery({
    queryKey: ["time-expense", "approvals"],
    queryFn: () => apiClient.GET("/api/time-expenses/approvals"),
    staleTime: 1 * 60_000, // 1min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useApproveItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      ids,
      type,
    }: {
      ids: string[];
      type: "approve" | "reject";
    }) =>
      apiClient.POST(`/api/time-expenses/approvals/${type}`, { body: { ids } }),
    onSuccess: (_, { ids, type }) => {
      queryClient.invalidateQueries({
        queryKey: ["time-expense", "approvals"],
      });
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(`${ids.length} items ${type}d successfully`);
    },
    onError: () => {
      toast.error("Failed to process approvals.");
    },
  });
}
```

### Error Mapping

| API Error         | User Message                               | UI Action            |
| ----------------- | ------------------------------------------ | -------------------- |
| 400 (Bad Request) | "Invalid time/expense data. Check inputs." | Inline field errors  |
| 409 (Conflict)    | "Duplicate entry detected. Review."        | Show diff modal      |
| 422 (Validation)  | "Policy violation detected."               | Inline errors        |
| 403 (Forbidden)   | "You don't have permission."               | Hide action          |
| 500 (Server)      | "Something went wrong. Try again."         | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for OCR processing
- **Offline Queue**: Store failed mutations locally; retry when online

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["timesheets", "list", { filters }][("timesheets", "detail", timesheetId)][
  ("expenses", "list", { filters })
][("timer", "active")][("time-expense", "approvals")];
```

### Invalidation Rules

| Action           | Invalidates                                                       |
| ---------------- | ----------------------------------------------------------------- |
| Submit Time      | `["timesheets"]`, `["projects", "costing"]`                       |
| Submit Expense   | `["expenses"]`                                                    |
| Approve/Reject   | `["time-expense", "approvals"]`, `["timesheets"]`, `["expenses"]` |
| Timer Start/Stop | `["timer"]`, `["timesheets"]`                                     |

### Stale Time

| Query Type | Stale Time | Reasoning                     |
| ---------- | ---------- | ----------------------------- |
| Timesheets | 1min       | Real-time submission tracking |
| Expenses   | 2min       | Moderate update frequency     |
| Timer      | 30s        | Real-time timer display       |
| Approvals  | 1min       | Frequent monitoring           |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("time-expenses");
revalidateTag("timesheets");
revalidateTag("expenses");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/time-expenses.fixtures.ts`

**Datasets**:

- `minimalTimeEntries`: 5 time entries (various projects)
- `standardTimesheets`: 20 timesheets across states
- `complexExpenses`: 30 expenses with various categories
- `edgeCases`: Edge cases (>12 hrs/day, policy violations, duplicate entries)

**Edge Cases Covered**:

- Time entries exceeding 12 hours/day
- Expenses over policy limits
- Missing receipts for >$25 expenses
- Duplicate time entries
- Offline entries requiring sync

---

## 🔗 API Contract Sync (CI Enforcement)

### Prevent Drift

**CI Step**: Fail build if `packages/contracts/openapi/openapi.json` changes without regenerating `types.gen.ts`.

---

## 🖥️ RSC/SSR & App Router Compatibility

### Server/Client Boundaries

- **Pages**: Server components by default
- **Interactive Parts**: Mark with `"use client"` (forms, timer, file upload)

### Data Fetching Strategy

| Scenario       | Strategy                          | Benefit         |
| -------------- | --------------------------------- | --------------- |
| Timesheet List | Server-side fetch + stream        | Faster TTFB     |
| Time Entry     | Client-side with offline support  | Mobile UX       |
| Approvals      | Client-side with real-time update | Live monitoring |

---

## 📊 Analytics & Audit Events

| Event                        | When                  | Properties                                              |
| ---------------------------- | --------------------- | ------------------------------------------------------- |
| TimeExpense.TimeSubmitted    | Time entry submitted  | `employee_id`, `project_id`, `hours`, `billable`        |
| TimeExpense.ExpenseSubmitted | Expense submitted     | `employee_id`, `amount`, `category`, `policy_compliant` |
| TimeExpense.Approved         | Item approved         | `approver_id`, `item_type`, `item_id`, `amount`         |
| TimeExpense.Rejected         | Item rejected         | `approver_id`, `item_type`, `item_id`, `reason`         |
| TimeExpense.OCRScanned       | Receipt OCR processed | `accuracy_score`, `processing_time_ms`                  |

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/time-expenses.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency**: Support multiple currencies for international expenses

### Keyboard Shortcuts

| Key      | Action           | Scope        |
| -------- | ---------------- | ------------ |
| `/`      | Focus search     | Any page     |
| `t`      | Log time         | Time list    |
| `e`      | Submit expense   | Expense list |
| `a`      | Approve selected | Approvals    |
| `Space`  | Start/stop timer | Timer        |
| `Enter`  | Submit form      | Forms        |
| `Escape` | Close modal      | Modal        |

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                             | Duration | Rollback Trigger |
| ----------- | ---------------- | -------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                             | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, OCR accuracy ≥90%        | 2 days   | Test failures    |
| Production  | Beta users (10%) | Error rate < 0.5%, OCR accuracy ≥95%         | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 1 week, approval time < 24 hours | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m35_time_expenses: false,     // Master toggle
  m35_timer: false,             // Timer functionality
  m35_ocr: false,               // OCR expense capture
  m35_offline: false,           // Offline mode
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Time/expense submission success rate (≥99.5%)
- OCR accuracy (≥95%)
- Approval processing time (< 24 hours)
- Offline sync success rate

**Alert Thresholds**:

- OCR accuracy < 90% → investigate
- Submission error rate > 1% → escalate
- Offline sync failures > 5% → rollback

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m35_time_expenses = false`
2. **Invalidate cache**: `revalidateTag("time-expenses")`
3. **Clear CDN cache**: `pnpm run cache:purge --path="/time-expenses/*"`
4. **Monitor for 15 minutes**
5. **Post-mortem**

**Rollback Decision Matrix**:

| Scenario                   | Action             | Approval Required |
| -------------------------- | ------------------ | ----------------- |
| OCR accuracy < 80%         | Immediate rollback | No (auto-trigger) |
| Submission error > 5%      | Immediate rollback | No (auto-trigger) |
| Offline sync failures >10% | Immediate rollback | No (auto-trigger) |
| User complaints > 5        | Investigate first  | Ops lead          |

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

- Replicon: Time tracking UI patterns
- Expensify: Expense OCR and mobile UX
- Concur: Approval workflows
- TSheets: Timer functionality

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: OCR Accuracy for Receipts

**Mitigation**: Use proven OCR engine (Google Vision API or Textract); manual review fallback; comprehensive test suite with real receipts; accuracy monitoring dashboard

### Risk #2: Mobile Offline Sync Reliability

**Mitigation**: Service worker implementation; conflict resolution strategy; retry logic with exponential backoff; sync status monitoring

### Risk #3: Approval Workflow Complexity

**Mitigation**: Flexible rule engine with clear documentation; visual workflow designer; escalation paths; comprehensive tests; admin override capability

### Risk #4: Policy Compliance Enforcement

**Mitigation**: Server-side validation; approval blocks for violations; audit trail; policy rule documentation; regular policy reviews

---

## 📝 Implementation Guide

### Day 1: Mobile Time Entry & Timer (8 hours)

1. Build mobile time entry interface (3 hours)
2. Implement timer functionality (2 hours)
3. Add offline support with service worker (2 hours)
4. Recent projects quick entry (1 hour)

### Day 2: Expense Management & OCR (8 hours)

1. Build expense submission form (2 hours)
2. Implement OCR receipt scanning (3 hours)
3. Add policy compliance validation (2 hours)
4. Receipt image upload and storage (1 hour)

### Day 3: Approval Workflows & Polish (8 hours)

1. Build approval dashboard (2 hours)
2. Implement batch approval functionality (2 hours)
3. Add approval analytics and reporting (2 hours)
4. Comprehensive testing and polish (2 hours)

**Total**: 3 days (24 hours)

---

## ✅ Testing Checklist

### Unit Tests (8 tests)

- [ ] Time calculation accuracy (hours, rounding to 0.25)
- [ ] Billable hours validation (max 24 hours/day)
- [ ] Duplicate time entry detection
- [ ] Expense policy validation rules
- [ ] OCR data extraction accuracy
- [ ] Approval routing logic (amount, department, project)
- [ ] Timer elapsed time calculation
- [ ] Offline sync conflict resolution

### Integration Tests (6 tests)

- [ ] Time entry submission → updates project costing
- [ ] Expense submission → creates AP entry
- [ ] Approval workflow → posts to GL
- [ ] Timer stop → saves time entry
- [ ] OCR scan → populates expense form
- [ ] Batch approval → updates multiple items

### E2E Tests (8 flows)

- [ ] User can enter time via mobile
- [ ] User can start/stop timer
- [ ] User can scan and submit expense with OCR
- [ ] User can submit expense manually
- [ ] Manager can view pending approvals
- [ ] Manager can approve/reject time entries
- [ ] Manager can batch approve expenses
- [ ] Offline time entry syncs when online

### Accessibility Tests

- [ ] Keyboard navigation works (all forms accessible)
- [ ] Screen reader announces timer status
- [ ] Focus management correct (modals, forms)
- [ ] Mobile touch targets ≥44px
- [ ] Color contrast meets WCAG 2.2 AA
- [ ] Axe: 0 serious/critical violations
- [ ] iOS VoiceOver and Android TalkBack tested

### Contract Tests

- [ ] API calls match OpenAPI spec
- [ ] Generated types match API responses

### Visual Regression Tests

- [ ] Storybook snapshots for mobile time entry
- [ ] Expense OCR UI
- [ ] Approval dashboard

### Performance Tests

- [ ] Bundle size < 250KB gzipped
- [ ] Mobile time entry < 1s submit
- [ ] OCR processing < 5s
- [ ] Offline sync (100 entries) < 10s

---

## 📅 Timeline & Milestones

| Day | Tasks                                                    | Deliverable                    | Flag Status |
| --- | -------------------------------------------------------- | ------------------------------ | ----------- |
| 1   | Setup + Mobile Time Entry + Timer + Offline Support      | Basic time tracking functional | WIP         |
| 2   | Expense Form + OCR + Policy Validation + Receipt Storage | Expense management complete    | WIP         |
| 3   | Approval Dashboard + Batch Approval + Analytics + Tests  | Production-ready module        | GA          |

**Total Effort**: 3 days (24 hours)

**Feature Flags**:

- Day 1-2: `flags.m35_time_expenses = false` (hidden)
- Day 2: Enable `m35_timer` and `m35_offline` incrementally
- Day 3: Enable `m35_ocr` after OCR accuracy ≥95% verified

---

## 🔗 Dependencies

### Must Complete Before Starting

- ✅ M1: Core Ledger (for cost posting)
- ✅ M34: Projects & Jobs (for project time tracking)
- ✅ M5: Accounts Payable (for expense reimbursement)
- 🆕 Feature flag service
- 🆕 Analytics provider
- 🆕 OCR service (Google Vision API or AWS Textract)
- 🆕 Service worker for offline support

### Blocks These Modules

- Enhanced M34: Projects & Jobs (labor costing updates)
- Enhanced M5: Accounts Payable (expense reimbursements)
- Enhanced M36: Purchase Orders (indirect time allocation)
- Payroll integration (future)

---

## 🎯 Success Criteria

### Must Have (Measurable)

- [ ] Mobile-first time entry interface (responsive ≤768px)
- [ ] Timer functionality (start/stop with elapsed time)
- [ ] Time submission success rate ≥99.5%
- [ ] OCR receipt scanning (≥95% accuracy)
- [ ] Expense submission with policy validation
- [ ] Multi-level approval workflows (configurable routing)
- [ ] Batch approval (50+ items in < 2s)
- [ ] Offline mode with sync (service worker)
- [ ] Submit time < 1s (P95)
- [ ] OCR processing < 5s
- [ ] Axe: 0 serious/critical violations

### Should Have

- [ ] Recent projects quick entry
- [ ] Duplicate time entry detection
- [ ] Approval analytics dashboard
- [ ] Mobile push notifications for approvals
- [ ] Export timesheets to Excel/CSV
- [ ] Receipt image compression

### Nice to Have

- [ ] AI-powered time suggestions (ML model)
- [ ] Mileage tracking with GPS
- [ ] Voice-activated time entry (voice API)
- [ ] Smart expense categorization
- [ ] Project time budget alerts

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/time`, `/expenses`, `/approvals`)
- [ ] Mobile time entry with timer
- [ ] OCR expense capture with policy validation
- [ ] Approval workflows (single + batch)
- [ ] Offline support with sync
- [ ] Search and filtering working
- [ ] Permissions enforced (UI hides/shows based on role)
- [ ] All error states handled gracefully
- [ ] Copy deck implemented (all i18n keys present)

### Quality Gates 🎯

**Enforced in CI** - Build fails if any gate not met

#### Code Quality

- [ ] TypeScript: 0 errors, 0 warnings
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Prettier: All files formatted
- [ ] No console.log or debugger statements

#### Test Coverage

- [ ] Unit tests: ≥90% line coverage, ≥95% for OCR/timer logic
- [ ] Integration tests: All time/expense workflows covered
- [ ] E2E tests: All user flows covered (mobile + desktop)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Time entry submission
- Expense OCR processing
- Approval workflow logic
- Offline sync mechanism

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/time-expenses/*` routes
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/time`
- [ ] Mobile time entry: < 1s submit
- [ ] OCR processing: < 5s
- [ ] Offline sync (100 entries): < 10s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Mobile accessibility: Touch targets ≥44px
- [ ] Screen reader: All content announced correctly (NVDA/JAWS/VoiceOver/TalkBack)
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### OCR Accuracy 🔍

**CRITICAL - ≥95% OCR accuracy required before production!**

- [ ] OCR accuracy ≥95% on test receipt dataset (100+ receipts)
- [ ] Vendor extraction accuracy ≥90%
- [ ] Amount extraction accuracy ≥98%
- [ ] Date extraction accuracy ≥95%
- [ ] Manual review fallback for low confidence (<80%)
- [ ] OCR accuracy monitoring dashboard

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `TimeExpense.TimeSubmitted`
  - `TimeExpense.ExpenseSubmitted`
  - `TimeExpense.Approved`
  - `TimeExpense.Rejected`
  - `TimeExpense.OCRScanned`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (OCR accuracy, submission errors, sync failures)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Rate limiting tested (OCR endpoints)
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] Audit trail for all submissions/approvals
- [ ] Receipt storage encrypted at rest

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete (changes, testing, screenshots)
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized (OpenAPI hash verified)
- [ ] i18n keys documented in copy deck
- [ ] User acceptance testing passed (PM/QA sign-off)

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m35_time_expenses = false` (ready to enable)
  - `flags.m35_timer = false` (phase 2)
  - `flags.m35_ocr = false` (phase 2)
  - `flags.m35_offline = false` (phase 2)
- [ ] Smoke tests passed on staging
- [ ] Load tests passed (≥1000 concurrent users)
- [ ] Deployed to production (flags off)
- [ ] Rollback procedure tested
- [ ] Gradual rollout plan ready (10% → 100%)

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All test plans executed and passed
- [ ] **Design**: UI matches specs, brand compliance, mobile UX approved
- [ ] **PM**: Feature complete, acceptance criteria met
- [ ] **Security**: Security review passed
- [ ] **Accessibility**: A11y audit passed (mobile + desktop)
- [ ] **Operations**: OCR service configured and tested

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M34 - Projects & Jobs  
**Next**: M36 - Purchase Orders
