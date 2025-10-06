# 🚀 M14: Budget Planning - UI Implementation Runbook

**Module ID**: M14  
**Module Name**: Budget Planning  
**Priority**: MEDIUM  
**Phase**: 4 - Advanced Financial  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Budget Planning enables **collaborative budget creation, approval workflows, and variance analysis** across departments and cost centers with rolling forecasts.

### Business Value

- Top-down and bottom-up budgeting workflows
- Multi-dimensional budget allocation (department, project, account)
- Rolling forecast with scenario planning
- Budget vs actual variance analysis
- Integration with trial balance and reporting

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-budget-workflows], [ADR-###-rolling-forecast], [ADR-###-variance-analysis]

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

- ✅ `/api/budgets` - Budget list
- ✅ `/api/budgets/[id]` - Budget details
- ✅ `/api/budgets/create` - Create budget
- ✅ `/api/budgets/[id]/lines` - Budget line items
- ✅ `/api/budgets/[id]/submit` - Submit for approval
- ✅ `/api/budgets/[id]/approve` - Approve budget
- ✅ `/api/budgets/variance` - Budget vs actual variance
- ✅ `/api/budgets/forecast/rolling` - Rolling forecast
- ✅ `/api/budgets/scenarios` - Scenario planning
- ✅ `/api/budgets/copy-forward` - Copy from prior year
- ✅ Plus 2 additional endpoints for collaboration and workflow

**Total Endpoints**: 12

### Risks & Blockers

| Risk                               | Impact | Mitigation                                                    | Owner     |
| ---------------------------------- | ------ | ------------------------------------------------------------- | --------- |
| Multi-user collaboration conflicts | HIGH   | Optimistic locking; real-time conflict detection; merge logic | @backend  |
| Variance calculation accuracy      | HIGH   | Automated reconciliation; audit trail; validation rules       | @finance  |
| Rolling forecast complexity        | MED    | Clear methodology; documented assumptions; regular review     | @planning |
| Approval workflow flexibility      | MED    | Configurable workflows; role-based routing; escalation rules  | @backend  |

---

## 🎯 3 Killer Features

### 1. **Collaborative Budget Builder** 👥

**Description**: Multi-user budget building interface with departmental worksheets, auto-totaling, and approval routing.

**Why It's Killer**:

- Drag-and-drop budget line items
- Real-time collaboration with other budget owners
- Automatic rollup to master budget
- Copy-forward from prior year with growth factors
- Better than Adaptive Insights' clunky interface

**Implementation**:

```typescript
import { DataTable, Card, Button, Badge } from "aibos-ui";

export default function BudgetBuilder() {
  const { budget, updateLine, submit } = useBudget();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2>{budget.name}</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyFromPriorYear}>
            Copy from {budget.prior_year}
          </Button>
          <Button onClick={submit} variant="primary">
            Submit for Approval
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Total Budget</h3>
          <div className="text-3xl">{formatCurrency(budget.total)}</div>
        </Card>
        <Card>
          <h3>Prior Year</h3>
          <div className="text-2xl text-muted">
            {formatCurrency(budget.prior_year_total)}
          </div>
        </Card>
        <Card>
          <h3>Change</h3>
          <div
            className={`text-2xl ${
              budget.change >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {budget.change_percent}%
          </div>
        </Card>
        <Card>
          <h3>Status</h3>
          <Badge variant={budget.status === "Approved" ? "success" : "warning"}>
            {budget.status}
          </Badge>
        </Card>
      </div>

      <DataTable
        data={budget.line_items}
        editable
        columns={[
          { key: "account", label: "Account" },
          { key: "q1", label: "Q1", type: "number", editable: true },
          { key: "q2", label: "Q2", type: "number", editable: true },
          { key: "q3", label: "Q3", type: "number", editable: true },
          { key: "q4", label: "Q4", type: "number", editable: true },
          { key: "total", label: "Total", render: formatCurrency },
          {
            key: "vs_prior",
            label: "vs Prior",
            render: (val) => (
              <Badge variant={val >= 0 ? "success" : "destructive"}>
                {val >= 0 ? "+" : ""}
                {val}%
              </Badge>
            ),
          },
        ]}
        onCellChange={updateLine}
      />
    </div>
  );
}
```

### 2. **Rolling Forecast Dashboard** 📈

**Description**: Dynamic rolling forecast that automatically updates with actuals and adjusts future periods.

**Why It's Killer**:

- Automatic actual-to-forecast conversion
- Rolling 12-month view with variance
- AI-powered trend analysis
- Scenario comparison (best/worst/likely)
- Industry-first automated rolling forecast

**Implementation**:

```typescript
import { Chart, Card, Toggle } from "aibos-ui";

export default function RollingForecast() {
  const [scenario, setScenario] = useState("likely");
  const { forecast } = useRollingForecast({ scenario });

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2>Rolling 12-Month Forecast</h2>
        <div className="flex gap-2">
          <Button
            variant={scenario === "best" ? "primary" : "outline"}
            onClick={() => setScenario("best")}
          >
            Best Case
          </Button>
          <Button
            variant={scenario === "likely" ? "primary" : "outline"}
            onClick={() => setScenario("likely")}
          >
            Most Likely
          </Button>
          <Button
            variant={scenario === "worst" ? "primary" : "outline"}
            onClick={() => setScenario("worst")}
          >
            Worst Case
          </Button>
        </div>
      </div>

      <Chart
        type="line"
        data={forecast.periods}
        series={[
          { key: "actual", label: "Actual", color: "blue" },
          { key: "budget", label: "Budget", color: "gray" },
          { key: "forecast", label: "Forecast", color: "green" },
        ]}
        title="Revenue Trend"
      />

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>YTD Actual</h3>
          <div className="text-3xl">{formatCurrency(forecast.ytd_actual)}</div>
        </Card>
        <Card>
          <h3>Forecast Remaining</h3>
          <div className="text-3xl">
            {formatCurrency(forecast.remaining_forecast)}
          </div>
        </Card>
        <Card>
          <h3>Full Year Estimate</h3>
          <div className="text-3xl">{formatCurrency(forecast.full_year)}</div>
        </Card>
      </div>

      <Card>
        <h3>AI Insights</h3>
        <ul className="space-y-2">
          {forecast.insights.map((insight, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <Badge variant="info">AI</Badge>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
```

### 3. **Budget vs Actual Variance Analysis** 📊

**Description**: Real-time variance analysis with drill-down to transaction detail and automated exception alerts.

**Why It's Killer**:

- Color-coded variance highlighting
- One-click drill-down to GL detail
- Automated variance explanations
- Favorable/unfavorable variance classification
- Better than static Excel variance reports

**Implementation**:

```typescript
import { DataTable, Chart, Badge, Card } from "aibos-ui";

export default function VarianceAnalysis() {
  const { variance } = useBudgetVariance();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Budget</h3>
          <div className="text-3xl">{formatCurrency(variance.budget)}</div>
        </Card>
        <Card>
          <h3>Actual</h3>
          <div className="text-3xl">{formatCurrency(variance.actual)}</div>
        </Card>
        <Card>
          <h3>Variance</h3>
          <div
            className={`text-3xl ${
              variance.total_variance >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(Math.abs(variance.total_variance))}
          </div>
        </Card>
        <Card>
          <h3>Variance %</h3>
          <div
            className={`text-3xl ${
              variance.variance_pct >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {variance.variance_pct}%
          </div>
        </Card>
      </div>

      <Chart
        type="bar"
        data={variance.by_department}
        series={[
          { key: "budget", label: "Budget", color: "gray" },
          { key: "actual", label: "Actual", color: "blue" },
        ]}
        title="Budget vs Actual by Department"
      />

      <DataTable
        data={variance.line_items}
        columns={[
          { key: "account", label: "Account" },
          { key: "budget", label: "Budget", render: formatCurrency },
          { key: "actual", label: "Actual", render: formatCurrency },
          {
            key: "variance",
            label: "Variance",
            render: (val) => (
              <span className={val >= 0 ? "text-green-600" : "text-red-600"}>
                {formatCurrency(Math.abs(val))}
              </span>
            ),
          },
          {
            key: "variance_pct",
            label: "%",
            render: (val) => (
              <Badge variant={Math.abs(val) > 10 ? "warning" : "default"}>
                {val}%
              </Badge>
            ),
          },
          {
            key: "fav_unfav",
            label: "F/U",
            render: (val) => (
              <Badge variant={val === "F" ? "success" : "destructive"}>
                {val}
              </Badge>
            ),
          },
        ]}
        onRowClick={(row) => drillDown(row.account_id)}
      />
    </div>
  );
}
```

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Main Page (`/[module]/[page]`)

**Components**: DataTable, Button, Card, Form
**File**: `apps/web/app/(dashboard)/[module]/page.tsx`

#### 2. Detail Page (`/[module]/[id]`)

**Components**: Form, Button, Card, Badge
**File**: `apps/web/app/(dashboard)/budgets/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                       | Target          | Measurement          |
| ---------------------------- | --------------- | -------------------- |
| TTFB (staging)               | ≤ 70ms          | Server timing header |
| Client TTI for `/budgets`    | ≤ 200ms         | Lighthouse CI        |
| Budget variance calculation  | < 3s            | Progress tracking    |
| Rolling forecast generation  | < 5s            | APM traces           |
| UI bundle size               | ≤ 250KB gzipped | Webpack analyzer     |
| Real-time collaboration sync | < 500ms         | WebSocket latency    |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to budget builder, editable tables, workflows
- **Focus Management**: Focus trap in modals; visible indicators
- **ARIA**: Live regions for variance updates; proper roles
- **Screen Reader**: All amounts and variances announced; collaboration updates communicated
- **Axe Target**: 0 serious/critical violations
- **Editable Tables**: Full keyboard navigation in budget line items

### Security

| Layer          | Requirement                                                     |
| -------------- | --------------------------------------------------------------- |
| RBAC Scopes    | `budget.read`, `budget.write`, `budget.approve`, `budget.admin` |
| Enforcement    | Server-side on all endpoints                                    |
| Data Exposure  | Only show budgets user has permission to view                   |
| Sensitive Data | Mask budget amounts for non-finance users                       |
| Audit Trail    | All submissions, approvals, and variances logged                |

#### UI Permissions Matrix

| Role           | View | Create | Edit | Submit | Approve | Copy Forward | Variance | Admin |
| -------------- | ---- | ------ | ---- | ------ | ------- | ------------ | -------- | ----- |
| budget.read    | ✅   | ❌     | ❌   | ❌     | ❌      | ❌           | ✅       | ❌    |
| budget.write   | ✅   | ✅     | ✅   | ✅     | ❌      | ✅           | ✅       | ❌    |
| budget.approve | ✅   | ✅     | ✅   | ✅     | ✅      | ✅           | ✅       | ❌    |
| budget.admin   | ✅   | ✅     | ✅   | ✅     | ✅      | ✅           | ✅       | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful budget operations
- **SLA Dashboards**: Real-time metrics on collaboration, variance accuracy, forecast reliability
- **Events Emitted**: `Budget.Created`, `Budget.Submitted`, `Budget.Approved`, `Budget.VarianceCalculated`
- **Logging**: Structured logs with correlation IDs for all workflows
- **Tracing**: Distributed tracing for complex variance calculations
- **Monitoring**: Collaboration conflicts; variance accuracy; approval SLA

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Budget Planning Rules

| Rule                        | Enforcement                                                   |
| --------------------------- | ------------------------------------------------------------- |
| **Budget Periods**          | Must be sequential; no gaps allowed                           |
| **Line Item Totals**        | Sum of periods must equal annual total                        |
| **Department Rollup**       | Department budgets roll up to corporate                       |
| **Approval Workflow**       | Must follow sequential approval (department → division → CFO) |
| **Variance Threshold**      | Variances > 10% flagged for review                            |
| **Forecast Reconciliation** | Rolling forecast must reconcile to actuals + remaining budget |
| **Scenario Consistency**    | Scenarios must use consistent assumptions                     |
| **Copy Forward**            | Prior year budget locked after copy forward                   |

### Currency & Rounding

- **Display**: Presentation currency from tenant settings
- **Rounding Policy**: HALF_UP for budget calculations
- **Multi-Currency**: Consolidate foreign budgets at budget rate
- **FX Impact**: Track foreign exchange impact on variance

### Archive Semantics

- **Soft Delete**: Set `inactive_date`; maintain historical records
- **Guard Rails**:
  - ❌ Deny if budget referenced in variance reports
  - ❌ Deny if budget has approved status
  - ❌ Deny if budget is current year
  - ✅ Allow if draft and prior year

---

## 🚨 Error Handling & UX States

### All Possible States

| State                      | UI Display                             | User Action     |
| -------------------------- | -------------------------------------- | --------------- |
| **Empty**                  | "No budgets"                           | "Create Budget" |
| **Loading**                | Skeleton budget cards                  | N/A             |
| **Error**                  | Error message + retry                  | Retry / Support |
| **Draft**                  | Gray badge "Draft"                     | Edit / Submit   |
| **In Review**              | Orange badge "In Review"               | View / Withdraw |
| **Approved**               | Green badge "Approved"                 | View / Lock     |
| **Rejected**               | Red badge "Rejected"                   | Edit / Resubmit |
| **Calculating**            | Progress bar "Calculating variance..." | Wait            |
| **Variance Exceeded**      | Yellow warning "Variance > 10%"        | Review variance |
| **Collaboration Conflict** | Red alert "Another user is editing"    | Merge / Wait    |
| **Permission Denied**      | "Access restricted"                    | Back            |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Submit State**: Button disabled until dirty & valid
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal
- **Real-time Validation**: Check amounts > 0, periods sum correctly, dates valid

### Network Errors

| HTTP Status | UI Message                                             | Action              |
| ----------- | ------------------------------------------------------ | ------------------- |
| 400         | "Invalid budget data. Check your input."               | Inline field errors |
| 401         | "Session expired. Please log in again."                | Redirect to login   |
| 403         | "You don't have permission to approve budgets."        | Hide action         |
| 404         | "Budget not found. It may have been deleted."          | Return to list      |
| 409         | "Budget was modified by another user."                 | Show conflict modal |
| 422         | "Validation failed: Periods must sum to annual total." | Inline errors       |
| 500         | "Operation failed. Our team has been notified."        | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/budget.json`.

### Page Titles & Headers

| Context           | Copy               | i18n Key                |
| ----------------- | ------------------ | ----------------------- |
| List Page         | "Budget Planning"  | `budget.list.title`     |
| Detail Page       | "Budget Details"   | `budget.detail.title`   |
| Create Modal      | "Create Budget"    | `budget.create.title`   |
| Budget Builder    | "Budget Builder"   | `budget.builder.title`  |
| Variance Analysis | "Budget vs Actual" | `budget.variance.title` |
| Rolling Forecast  | "Rolling Forecast" | `budget.forecast.title` |
| Approval Workflow | "Budget Approvals" | `budget.approval.title` |

### State Messages

| State                  | Title                         | Message                                                        | Action Button       | i18n Key                    |
| ---------------------- | ----------------------------- | -------------------------------------------------------------- | ------------------- | --------------------------- |
| Empty                  | "No budgets"                  | "Create your first budget to begin planning"                   | "Create Budget"     | `budget.empty.*`            |
| Loading                | —                             | —                                                              | —                   | —                           |
| Error                  | "Unable to load budgets"      | "Something went wrong. Our team has been notified."            | "Retry" / "Support" | `budget.error.*`            |
| No Results             | "No budgets found"            | "Try adjusting your filters or search terms"                   | "Clear Filters"     | `budget.noResults.*`        |
| Permission Denied      | "Access restricted"           | "You don't have permission to view budgets."                   | "Back"              | `budget.permissionDenied.*` |
| Calculating            | "Calculating..."              | "Running variance calculation. This may take a moment."        | —                   | `budget.calculating.*`      |
| In Review              | "Awaiting approval"           | "{count} budgets awaiting approval"                            | "Review Now"        | `budget.inReview.*`         |
| Variance Exceeded      | "Variance threshold exceeded" | "Review variances over 10% threshold"                          | "View Variance"     | `budget.varianceExceeded.*` |
| Collaboration Conflict | "Editing conflict"            | "Another user is editing this budget. Refresh to see changes." | "Refresh"           | `budget.conflict.*`         |

### Action Confirmations

| Action              | Title                   | Message                                                           | Confirm Button | Cancel Button | i18n Key                       |
| ------------------- | ----------------------- | ----------------------------------------------------------------- | -------------- | ------------- | ------------------------------ |
| Submit for Approval | "Submit budget?"        | "Submit {name} for approval? You cannot edit after submission."   | "Submit"       | "Cancel"      | `budget.submit.confirm.*`      |
| Approve Budget      | "Approve budget?"       | "Approve {name}? This locks the budget."                          | "Approve"      | "Cancel"      | `budget.approve.confirm.*`     |
| Reject Budget       | "Reject budget?"        | "Reject {name}? Provide reason for rejection."                    | "Reject"       | "Cancel"      | `budget.reject.confirm.*`      |
| Copy Forward        | "Copy from prior year?" | "Copy {prior_year} budget as starting point? You can edit after." | "Copy"         | "Cancel"      | `budget.copyForward.confirm.*` |
| Lock Budget         | "Lock budget?"          | "Lock {name}? No further changes allowed."                        | "Lock"         | "Cancel"      | `budget.lock.confirm.*`        |

### Success Messages (Toast)

| Action                | Message                                 | i18n Key                     |
| --------------------- | --------------------------------------- | ---------------------------- |
| Budget Created        | "Budget '{name}' created successfully"  | `budget.create.success`      |
| Budget Updated        | "Budget '{name}' updated successfully"  | `budget.update.success`      |
| Budget Submitted      | "Budget submitted for approval"         | `budget.submit.success`      |
| Budget Approved       | "Budget '{name}' approved successfully" | `budget.approve.success`     |
| Budget Rejected       | "Budget rejected with comments"         | `budget.reject.success`      |
| Copy Forward Complete | "Prior year budget copied successfully" | `budget.copyForward.success` |
| Variance Calculated   | "Variance calculated for {period}"      | `budget.variance.success`    |

### Error Messages (Toast)

| Scenario                    | Message                                                      | i18n Key                       |
| --------------------------- | ------------------------------------------------------------ | ------------------------------ |
| Create Failed               | "Failed to create budget. Please try again."                 | `budget.create.error`          |
| Submit Failed               | "Failed to submit budget. Check for missing data."           | `budget.submit.error`          |
| Invalid Period Sum          | "Periods must sum to annual total."                          | `budget.errorPeriodSum`        |
| Variance Calculation Failed | "Variance calculation failed. Check actual data."            | `budget.variance.error`        |
| Collaboration Conflict      | "Another user modified this budget. Refresh to see changes." | `budget.errorConflict`         |
| Approval Failed             | "Approval failed. Check approval permissions."               | `budget.approve.error`         |
| Already Submitted           | "Budget already submitted for approval."                     | `budget.errorAlreadySubmitted` |
| Already Approved            | "Budget already approved. Cannot modify."                    | `budget.errorAlreadyApproved`  |
| Network Error               | "Network error. Check your connection and try again."        | `budget.error.network`         |

### Form Labels & Help Text

| Field         | Label             | Placeholder         | Help Text                               | i18n Key                      |
| ------------- | ----------------- | ------------------- | --------------------------------------- | ----------------------------- |
| Budget Name   | "Budget Name"     | "e.g., FY 2025"     | "Descriptive name for this budget"      | `budget.field.name.*`         |
| Fiscal Year   | "Fiscal Year"     | "2025"              | "Year this budget covers"               | `budget.field.fiscalYear.*`   |
| Department    | "Department"      | "Select department" | "Department or cost center"             | `budget.field.department.*`   |
| Budget Type   | "Budget Type"     | "Select type"       | "Operating, Capital, or Project budget" | `budget.field.type.*`         |
| Annual Total  | "Annual Total"    | "0.00"              | "Total budget for the year"             | `budget.field.annualTotal.*`  |
| Q1 Amount     | "Q1"              | "0.00"              | "First quarter budget"                  | `budget.field.q1.*`           |
| Q2 Amount     | "Q2"              | "0.00"              | "Second quarter budget"                 | `budget.field.q2.*`           |
| Q3 Amount     | "Q3"              | "0.00"              | "Third quarter budget"                  | `budget.field.q3.*`           |
| Q4 Amount     | "Q4"              | "0.00"              | "Fourth quarter budget"                 | `budget.field.q4.*`           |
| Growth Factor | "Growth Factor %" | "0"                 | "Year-over-year growth percentage"      | `budget.field.growthFactor.*` |
| Comments      | "Comments"        | "Add notes..."      | "Notes or assumptions for this budget"  | `budget.field.comments.*`     |

### Keyboard Shortcuts Help

| Shortcut | Description              | i18n Key                    |
| -------- | ------------------------ | --------------------------- |
| `/`      | "Focus search"           | `budget.shortcuts.search`   |
| `n`      | "Create new budget"      | `budget.shortcuts.new`      |
| `b`      | "Open budget builder"    | `budget.shortcuts.builder`  |
| `v`      | "View variance analysis" | `budget.shortcuts.variance` |
| `f`      | "View rolling forecast"  | `budget.shortcuts.forecast` |
| `↑ / ↓`  | "Navigate budgets"       | `budget.shortcuts.navigate` |
| `Enter`  | "Open selected budget"   | `budget.shortcuts.open`     |
| `Escape` | "Close modal/cancel"     | `budget.shortcuts.cancel`   |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useBudgetPlanning.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useBudgets(filters = {}) {
  const queryClient = useQueryClient();

  const {
    data: budgets,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["budget", "list", filters],
    queryFn: () => apiClient.GET("/api/budgets", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });

  const createBudget = useMutation({
    mutationFn: (data) => apiClient.POST("/api/budgets/create", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      toast.success(`Budget '${data.name}' created successfully`);
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Validation failed. Check your input.");
      } else {
        toast.error("Failed to create budget.");
      }
    },
  });

  const updateBudget = useMutation({
    mutationFn: ({ id, data }) =>
      apiClient.PUT("/api/budgets/[id]", { params: { id }, body: data }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      queryClient.invalidateQueries({ queryKey: ["budget", "detail", id] });
      toast.success("Budget updated successfully");
    },
  });

  return {
    budgets: budgets || [],
    isLoading,
    error,
    createBudget: createBudget.mutate,
    updateBudget: updateBudget.mutate,
  };
}

export function useBudget(id: string) {
  return useQuery({
    queryKey: ["budget", "detail", id],
    queryFn: () => apiClient.GET("/api/budgets/[id]", { params: { id } }),
    staleTime: 30_000, // 30s
    enabled: !!id,
    select: (response) => response.data,
  });
}

export function useSubmitBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { budget_id: string; comments?: string }) =>
      apiClient.POST("/api/budgets/[id]/submit", {
        params: { id: data.budget_id },
        body: { comments: data.comments },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      toast.success("Budget submitted for approval");
    },
    onError: (error) => {
      if (error.status === 409) {
        toast.error("Budget already submitted for approval.");
      } else if (error.status === 422) {
        toast.error("Failed to submit budget. Check for missing data.");
      } else {
        toast.error("Submit failed.");
      }
    },
  });
}

export function useApproveBudget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { budget_id: string; comments?: string }) =>
      apiClient.POST("/api/budgets/[id]/approve", {
        params: { id: data.budget_id },
        body: { comments: data.comments },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      toast.success(`Budget '${data.name}' approved successfully`);
    },
    onError: (error) => {
      if (error.status === 403) {
        toast.error("You don't have permission to approve budgets.");
      } else {
        toast.error("Approval failed. Check approval permissions.");
      }
    },
  });
}

export function useBudgetVariance(filters = {}) {
  return useQuery({
    queryKey: ["budget", "variance", filters],
    queryFn: () => apiClient.GET("/api/budgets/variance", { query: filters }),
    staleTime: 5 * 60_000, // 5min
    select: (response) => response.data,
  });
}

export function useRollingForecast(options = {}) {
  return useQuery({
    queryKey: ["budget", "forecast", "rolling", options],
    queryFn: () =>
      apiClient.GET("/api/budgets/forecast/rolling", { query: options }),
    staleTime: 10 * 60_000, // 10min
    select: (response) => response.data,
  });
}

export function useCopyForward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      source_budget_id: string;
      target_year: number;
      growth_factor?: number;
    }) => apiClient.POST("/api/budgets/copy-forward", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      toast.success("Prior year budget copied successfully");
    },
    onError: () => {
      toast.error("Copy forward failed.");
    },
  });
}
```

### Error Mapping

| API Error         | User Message                                           | UI Action            |
| ----------------- | ------------------------------------------------------ | -------------------- |
| 400 (Bad Request) | "Invalid budget data. Check your input."               | Inline field errors  |
| 409 (Conflict)    | "Budget was modified by another user."                 | Show conflict modal  |
| 422 (Validation)  | "Validation failed: Periods must sum to annual total." | Inline errors        |
| 403 (Forbidden)   | "You don't have permission to approve budgets."        | Hide action buttons  |
| 500 (Server)      | "Operation failed. Our team has been notified."        | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Budget calculations**: 10s timeout; complex variance/forecast calculations

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["budget", "list", { filters }][("budget", "detail", budgetId)][
  ("budget", "variance", { filters })
][("budget", "forecast", "rolling", options)];
```

### Invalidation Rules

| Action            | Invalidates                                          |
| ----------------- | ---------------------------------------------------- |
| Create Budget     | `["budget", "list"]`                                 |
| Update Budget     | `["budget", "list"]`, `["budget", "detail", id]`     |
| Submit Budget     | `["budget", "list"]`, `["budget", "detail", id]`     |
| Approve Budget    | `["budget", "list"]`, `["budget", "detail", id]`     |
| Copy Forward      | `["budget", "list"]`                                 |
| Update Line Items | `["budget", "detail", id]`, `["budget", "variance"]` |

### Stale Time

| Query Type       | Stale Time | Reasoning                                      |
| ---------------- | ---------- | ---------------------------------------------- |
| Budget List      | 30s        | Frequent updates; collaboration ongoing        |
| Budget Detail    | 30s        | Moderate changes                               |
| Variance         | 5min       | Refresh periodically for dashboards            |
| Rolling Forecast | 10min      | Expensive calculation; changes less frequently |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("budget"); // After mutations
revalidateTag(`budget-${budgetId}`); // Specific budget
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/budget.fixtures.ts`

**Datasets**:

- `minimalBudgets`: 5 budgets (basic set)
- `standardBudgets`: 50 budgets with various departments, statuses
- `complexBudgets`: Budgets with approvals, variances, scenarios
- `edgeCases`: Special scenarios

**Edge Cases Covered**:

- Single department budgets
- Multi-department rollup budgets
- Budgets in various approval states (draft, review, approved, rejected)
- Budgets with large variances (>10%)
- Budgets with collaboration conflicts
- Prior year budgets for copy forward
- Rolling forecast scenarios (best, worst, likely)

```typescript
// Example fixture structure
export const standardBudgets: BudgetFixture[] = [
  {
    id: "budget_1",
    name: "FY 2025 Operating Budget",
    fiscal_year: 2025,
    department: "Sales",
    type: "Operating",
    annual_total: 5000000,
    q1: 1200000,
    q2: 1250000,
    q3: 1300000,
    q4: 1250000,
    status: "Approved",
    variance_ytd: -50000, // Favorable variance
    variance_pct: -2.5,
  },
  // ... 49 more
];
```

### E2E Seed Data

**Location**: `tests/seeds/budget.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:budget
```

**Dataset**:

- 30 budgets across various departments
- 10 in draft
- 10 in review
- 10 approved
- Mix of budget types (operating, capital, project)
- Prior year budgets for copy forward testing
- Variance data for analysis testing

**Cleanup Command**:

```powershell
pnpm run seed:budget:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic company: "Demo Corp Inc." with $50M annual budget
- 20 budgets demonstrating all features
- Complete approval workflows
- Example variance scenarios
- Rolling forecast data
- Scenario planning examples

**Regeneration**:

```powershell
pnpm run demo:reset:budget
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] Q1 + Q2 + Q3 + Q4 = Annual Total
- [ ] Valid department references
- [ ] Valid budget types
- [ ] Status transitions valid
- [ ] Variance calculations correct
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
- **Interactive Parts**: Mark with `"use client"` (budget builder, editable tables, workflows)

### Data Fetching Strategy

| Scenario        | Strategy                               | Benefit             |
| --------------- | -------------------------------------- | ------------------- |
| Initial List    | Server-side fetch + stream             | Faster TTFB         |
| CRUD Operations | Client-side React Query                | Optimistic updates  |
| Detail Page     | Server component wrapper + client form | SEO + interactivity |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function submitBudget(data) {
  // ... mutation logic
  revalidateTag("budget");
}
```

---

## 📊 Analytics & Audit Events

| Event                     | When              | Properties                                               |
| ------------------------- | ----------------- | -------------------------------------------------------- |
| Budget.Created            | After 2xx         | `budget_id`, `name`, `fiscal_year`, `department`         |
| Budget.Updated            | After 2xx         | `budget_id`, changed fields                              |
| Budget.Submitted          | Submit complete   | `budget_id`, `submitter`, `timestamp`                    |
| Budget.Approved           | Approval complete | `budget_id`, `approver`, `level`, `timestamp`            |
| Budget.Rejected           | Rejection         | `budget_id`, `rejector`, `reason`, `timestamp`           |
| Budget.VarianceCalculated | Variance run      | `budget_id`, `period`, `variance_amount`, `variance_pct` |
| Budget.CopyForward        | Copy complete     | `source_id`, `target_id`, `growth_factor`                |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Budget.Submitted", {
  budget_id: budget.id,
  name: budget.name,
  submitter: currentUser.id,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/budget.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency Display**: Respect locale-specific currency symbols
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Fiscal Year**: Respect regional fiscal year conventions

### Keyboard Shortcuts

| Key      | Action                 | Scope       |
| -------- | ---------------------- | ----------- |
| `/`      | Focus search           | Budget list |
| `n`      | Create new budget      | Budget list |
| `b`      | Open budget builder    | Any page    |
| `v`      | View variance analysis | Any page    |
| `f`      | View rolling forecast  | Any page    |
| `↑ / ↓`  | Navigate budgets       | Table       |
| `Enter`  | Open selected budget   | Table       |
| `Escape` | Close modal/cancel     | Modal/Form  |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateModal()],
  ["b", () => router.push("/budgets/builder")],
  ["v", () => router.push("/budgets/variance")],
  ["f", () => router.push("/budgets/forecast")],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                | Duration | Rollback Trigger |
| ----------- | ---------------- | ----------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, Lighthouse ≥90              | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, Collaboration works smoothly | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained        | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m14_budget: false,                  // Master toggle
  m14_budget_builder: false,          // Budget builder
  m14_budget_variance: false,         // Variance analysis
  m14_budget_forecast: false,         // Rolling forecast
  m14_budget_collaboration: false,    // Real-time collaboration
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/budgets`, `/budgets/builder`, `/budgets/variance`)
- P50/P95/P99 latency
- Collaboration sync latency
- Variance calculation accuracy
- Approval workflow SLA

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Collaboration sync > 1s → investigate
- Variance calculation error → alert finance team
- P95 latency > 500ms for 10min → investigate

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m14_budget = false`

   ```powershell
   pnpm run flags:set m14_budget=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("budget");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/budgets/*"
   ```

4. **Monitor for 15 minutes**:

   - Error rate drops below 0.1%
   - No new Sentry issues
   - Users see fallback message

5. **Post-mortem**:
   - Create incident report
   - Identify root cause
   - Add regression test

**Rollback Decision Matrix**:

| Scenario                   | Action             | Approval Required |
| -------------------------- | ------------------ | ----------------- |
| Error rate > 5%            | Immediate rollback | No (auto-trigger) |
| Collaboration sync failure | Immediate rollback | No (auto-trigger) |
| Variance calculation error | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%            | Partial rollback   | On-call engineer  |
| P95 latency > 1s           | Investigate first  | On-call engineer  |
| Data corruption/loss       | Immediate rollback | No (auto-trigger) |

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

- Adaptive Insights: Budget planning workflows
- Anaplan: Scenario planning
- Planful: Rolling forecasts
- ERPNext: Budget management

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Multi-User Collaboration Conflicts

**Mitigation**: Optimistic locking; real-time conflict detection; merge logic; clear conflict resolution UI

### Risk #2: Variance Calculation Accuracy

**Mitigation**: Automated reconciliation; audit trail; validation rules; regular comparison to GL

### Risk #3: Rolling Forecast Complexity

**Mitigation**: Clear methodology; documented assumptions; regular review; scenario testing

### Risk #4: Approval Workflow Flexibility

**Mitigation**: Configurable workflows; role-based routing; escalation rules; clear status tracking

---

## 📝 Implementation Guide

### Day 1: Budget Builder & Workflows (8 hours)

1. Build budget list table (2 hours)
2. Create budget builder with editable cells (4 hours)
3. Implement approval workflow (2 hours)

### Day 2: Variance & Forecast (4 hours)

1. Build variance analysis dashboard (2 hours)
2. Create rolling forecast view (2 hours)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Budget period sum validation (Q1+Q2+Q3+Q4 = Annual)
- [ ] Variance calculation (Budget - Actual)
- [ ] Growth factor calculation for copy forward
- [ ] Approval workflow state transitions
- [ ] useBudgets hook fetches correctly
- [ ] Currency formatting displays correctly
- [ ] Department rollup calculations

### Integration Tests

- [ ] Create budget → appears in list
- [ ] Update line items → totals recalculated
- [ ] Submit budget → status changes to In Review
- [ ] Approve budget → status changes to Approved
- [ ] Copy forward → creates new budget with growth factor applied
- [ ] Permission-based UI hiding works
- [ ] Collaboration conflict detection

### E2E Tests

- [ ] User can navigate to budget page
- [ ] User can create budget with line items
- [ ] User can edit budget in builder
- [ ] User can submit budget for approval
- [ ] User can approve/reject budget
- [ ] User can view variance analysis
- [ ] User can view rolling forecast
- [ ] User can copy forward from prior year
- [ ] Keyboard-only flow: create → edit → submit → approve

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Editable tables accessible
- [ ] Screen reader announces amounts and variances
- [ ] Focus management correct (builder, modals, forms)
- [ ] Color contrast meets WCAG 2.2 AA (AAA where practical)
- [ ] Axe: 0 serious/critical violations
- [ ] Variance color coding has non-color indicators

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] All API endpoints return expected status codes

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for budgets, builder, variance, forecast
- [ ] Dark/light theme variations
- [ ] Budget status badge variations
- [ ] Loading/error/empty states captured

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/budgets/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] Budget variance calculation completes in < 3s
- [ ] Rolling forecast generates in < 5s
- [ ] Collaboration sync < 500ms

---

## 📅 Timeline

| Day | Deliverable                          |
| --- | ------------------------------------ |
| 1   | Budget Builder + Workflows           |
| 2   | Variance Analysis + Rolling Forecast |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries
- ✅ M3: Trial Balance (for actuals data)

### Enables These Modules

- M15: Cash Flow Forecasting (budget inputs)
- M20: Close Management (budget vs actual in close checklist)
- Financial reporting modules

---

## 🎯 Success Criteria

### Must Have

- [ ] Create and manage budgets
- [ ] Multi-period budget line items (Q1-Q4)
- [ ] Approval workflows (submit, approve, reject)
- [ ] Budget vs actual variance analysis
- [ ] Copy forward from prior year
- [ ] Department rollup
- [ ] Search and filtering (department, status, year)

### Should Have

- [ ] Rolling 12-month forecast
- [ ] Scenario planning (best/worst/likely)
- [ ] Real-time collaboration
- [ ] Growth factor calculations
- [ ] Variance threshold alerts

### Nice to Have

- [ ] AI-powered trend analysis
- [ ] Automated variance explanations
- [ ] Budget templates
- [ ] What-if scenario modeling

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/budgets`, `/budgets/[id]`, `/budgets/builder`, `/budgets/variance`, `/budgets/forecast`)
- [ ] All CRUD operations working (Create, Read, Update, Submit, Approve, Reject, Copy Forward)
- [ ] Budget builder with editable cells complete
- [ ] Approval workflows working
- [ ] Variance analysis functional
- [ ] Rolling forecast working
- [ ] Search and filtering working (department, status, year)
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

- [ ] Unit tests: ≥90% line coverage, ≥95% for critical paths
- [ ] Integration tests: All CRUD + workflow operations covered
- [ ] E2E tests: All user flows covered (create → edit → submit → approve)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Budget creation flow
- Budget builder flow
- Approval workflow flow
- Variance calculation flow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/budgets/*` routes
- [ ] TTFB: ≤70ms on staging (Server-Timing header)
- [ ] TTI: ≤200ms for `/budgets` (Lighthouse CI)
- [ ] Variance calculation: < 3s
- [ ] Rolling forecast: < 5s
- [ ] Collaboration sync: < 500ms

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues
- [ ] Editable tables: Full keyboard navigation

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `Budget.Created`
  - `Budget.Submitted`
  - `Budget.Approved`
  - `Budget.VarianceCalculated`
  - `Budget.CopyForward`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, collaboration sync, variance accuracy)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Budget amounts masked for non-finance users
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] Audit trail maintained for all submissions and approvals
- [ ] Collaboration conflicts handled gracefully

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete (changes, testing, screenshots)
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized (OpenAPI hash verified)
- [ ] i18n keys documented in copy deck
- [ ] User acceptance testing passed (PM/QA sign-off)
- [ ] Workflow documentation complete

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m14_budget = false` (ready to enable)
  - `flags.m14_budget_builder = false` (phase 2)
  - `flags.m14_budget_variance = false` (phase 2)
  - `flags.m14_budget_forecast = false` (phase 2)
  - `flags.m14_budget_collaboration = false` (phase 3)
- [ ] Smoke tests passed on staging
- [ ] Load tests passed (≥1000 concurrent users)
- [ ] Deployed to production (flags off)
- [ ] Rollback procedure tested
- [ ] Gradual rollout plan ready (5% → 100%)

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All test plans executed and passed
- [ ] **Design**: UI matches specs, brand compliance
- [ ] **PM**: Feature complete, acceptance criteria met
- [ ] **Security**: Security review passed
- [ ] **Accessibility**: A11y audit passed
- [ ] **Finance/Planning**: Workflow and calculation accuracy validated

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M13 - Tax Management  
**Next**: M15 - Cash Flow Forecasting
