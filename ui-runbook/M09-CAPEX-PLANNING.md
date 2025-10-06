# 🚀 M09: CAPEX Planning - UI Implementation Runbook

**Module ID**: M09  
**Module Name**: CAPEX Planning  
**Priority**: MEDIUM  
**Phase**: 3 - Asset Management  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

CAPEX Planning manages **capital expenditure budgeting, approval workflows, and ROI tracking** for major investments. Essential for strategic planning and capital allocation optimization.

### Business Value

- Multi-year capital expenditure planning and forecasting
- ROI and NPV analysis for investment decisions
- Approval workflow automation with business case tracking
- Integration with fixed assets upon project completion
- Compliance with capital budgeting policies

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-capex-approval], [ADR-###-roi-calculation], [ADR-###-project-lifecycle]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 4 endpoints implemented       |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/capex/projects` - Project list with filters
- ✅ `/api/capex/projects/[id]` - Project details
- ✅ `/api/capex/projects/[id]/approve` - Approval action
- ✅ `/api/capex/roi-calculate` - ROI/NPV calculations

**Total Endpoints**: 4

### Risks & Blockers

| Risk                          | Impact | Mitigation                                               | Owner    |
| ----------------------------- | ------ | -------------------------------------------------------- | -------- |
| ROI calculation accuracy      | HIGH   | Third-party validation; accounting review; test coverage | @finance |
| Approval workflow complexity  | HIGH   | Configurable rules; parallel/sequential options; testing | @backend |
| Integration with Fixed Assets | MED    | Clear handoff process; data mapping validation           | @backend |
| Multi-year forecast accuracy  | MED    | Rolling forecasts; variance analysis; regular reviews    | @finance |

---

## 🎯 3 Killer Features

### 1. **Interactive CAPEX Portfolio Dashboard** 📊

**Description**: Visual dashboard showing all capital projects with real-time status, spend vs budget, and ROI projections.

**Why It's Killer**:

- Interactive Gantt chart for project timelines
- Real-time spend tracking against approved budgets
- ROI and payback period calculations
- Portfolio-level capital allocation optimization
- Better than SAP's static capital planning reports

**Implementation**:

```typescript
import { Chart, DataTable, Card } from "aibos-ui";

export default function CapexDashboard() {
  const { projects } = useCapexProjects();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Total Approved</h3>
          <div className="text-3xl">
            {formatCurrency(projects.totalApproved)}
          </div>
        </Card>
        <Card>
          <h3>YTD Spend</h3>
          <div className="text-3xl">{formatCurrency(projects.ytdSpend)}</div>
        </Card>
        <Card>
          <h3>Expected ROI</h3>
          <div className="text-3xl">{projects.avgROI}%</div>
        </Card>
      </div>

      <Chart
        type="gantt"
        data={projects.list}
        showMilestones
        showDependencies
      />
    </div>
  );
}
```

### 2. **AI-Powered ROI Calculator** 🤖

**Description**: Intelligent ROI and NPV calculator that factors in depreciation, tax benefits, and opportunity costs.

**Why It's Killer**:

- Automated NPV/IRR calculations
- Tax benefit modeling including accelerated depreciation
- Sensitivity analysis with what-if scenarios
- Comparison to alternative investments
- Industry-first AI-powered capital decision support

**Implementation**:

```typescript
import { Form, Card, Chart } from "aibos-ui";

export default function ROICalculator() {
  const { calculate } = useROICalculation();

  return (
    <Form onSubmit={calculate}>
      <Input
        name="initial_investment"
        label="Initial Investment"
        type="number"
      />
      <Input name="useful_life" label="Useful Life (years)" type="number" />
      <Input
        name="annual_revenue"
        label="Expected Annual Revenue"
        type="number"
      />
      <Input name="annual_cost" label="Annual Operating Cost" type="number" />

      <Card className="bg-blue-50">
        <h3>Calculated Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>NPV:</strong> {formatCurrency(results.npv)}
          </div>
          <div>
            <strong>IRR:</strong> {results.irr}%
          </div>
          <div>
            <strong>Payback Period:</strong> {results.payback} years
          </div>
          <div>
            <strong>ROI:</strong> {results.roi}%
          </div>
        </div>
      </Card>

      <Chart type="line" data={results.cashFlow} title="Projected Cash Flows" />
    </Form>
  );
}
```

### 3. **Multi-Level Approval Workflow** ✅

**Description**: Configurable approval workflow with automatic routing based on project size and type.

**Why It's Killer**:

- Automated routing to appropriate approvers
- Parallel and sequential approval paths
- Mobile approval capability
- Full audit trail with approval rationale
- Faster than manual approval processes

**Implementation**:

```typescript
import { Timeline, Card, Button, Modal } from "aibos-ui";

export default function ApprovalWorkflow({ project }) {
  const { approve, reject } = useProjectApproval(project.id);

  return (
    <Card>
      <Timeline
        items={project.approvals.map((a) => ({
          date: a.date,
          user: a.approver,
          status: a.status,
          comments: a.comments,
        }))}
      />

      {project.needsMyApproval && (
        <div className="flex gap-4 mt-4">
          <Button onClick={() => approve()} variant="primary">
            Approve
          </Button>
          <Button onClick={() => reject()} variant="destructive">
            Reject
          </Button>
        </div>
      )}
    </Card>
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
**File**: `apps/web/app/(dashboard)/capex/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                           | Target          | Measurement          |
| -------------------------------- | --------------- | -------------------- |
| TTFB (staging)                   | ≤ 70ms          | Server timing header |
| Client TTI for `/capex`          | ≤ 200ms         | Lighthouse CI        |
| ROI calculation                  | < 2s            | Progress tracking    |
| Dashboard load (100 projects)    | < 1s            | APM traces           |
| UI bundle size                   | ≤ 250KB gzipped | Webpack analyzer     |
| Gantt chart render (50 projects) | < 500ms         | Performance profiler |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to all approval actions
- **Focus Management**: Focus trap in approval modals; visible indicators
- **ARIA**: Live regions for approval status updates; proper roles
- **Screen Reader**: All metrics and charts announced; approval rationale read
- **Axe Target**: 0 serious/critical violations
- **Chart Accessibility**: Alternative data table views for all visualizations

### Security

| Layer           | Requirement                                                 |
| --------------- | ----------------------------------------------------------- |
| RBAC Scopes     | `capex.read`, `capex.write`, `capex.approve`, `capex.admin` |
| Enforcement     | Server-side on all endpoints                                |
| Data Exposure   | Only show projects user has permission to view/approve      |
| Approval Rights | Multi-level approval based on project value and role        |
| Audit Trail     | All approvals/rejections logged with rationale              |

#### UI Permissions Matrix

| Role          | View | Create | Edit | Submit | Approve Level 1 | Approve Level 2 | Admin |
| ------------- | ---- | ------ | ---- | ------ | --------------- | --------------- | ----- |
| capex.read    | ✅   | ❌     | ❌   | ❌     | ❌              | ❌              | ❌    |
| capex.write   | ✅   | ✅     | ✅   | ✅     | ❌              | ❌              | ❌    |
| capex.approve | ✅   | ✅     | ✅   | ✅     | ✅              | ❌              | ❌    |
| capex.admin   | ✅   | ✅     | ✅   | ✅     | ✅              | ✅              | ✅    |

**Approval Levels**:

- **Level 1**: Projects < $100,000
- **Level 2**: Projects ≥ $100,000

### Reliability & Observability

- **SLO**: 99.9% successful approval transactions
- **SLA Dashboards**: Real-time metrics on approval times, project status, ROI accuracy
- **Events Emitted**: `CAPEX.Project.Created`, `CAPEX.Project.Approved`, `CAPEX.ROI.Calculated`
- **Logging**: Structured logs with correlation IDs for all mutations
- **Tracing**: Distributed tracing for approval workflows
- **Monitoring**: Approval SLA tracking, ROI calculation accuracy

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### CAPEX Project Rules

| Rule                        | Enforcement                                           |
| --------------------------- | ----------------------------------------------------- |
| **Project Budget**          | Must be > 0; cannot exceed approved amount            |
| **Approval Threshold**      | Projects ≥ $100K require Level 2 approval             |
| **ROI Calculation**         | Required for all projects > $50K                      |
| **Project Status**          | Draft → Submitted → Approved → In Progress → Complete |
| **Start Date**              | Cannot be before approval date                        |
| **Completion Date**         | Must be after start date                              |
| **Budget Variance**         | Alert if actual spend exceeds approved budget by 10%  |
| **Fixed Asset Integration** | Completed projects automatically create fixed assets  |

### Currency & Rounding

- **Display**: Presentation currency from tenant settings
- **Rounding Policy**: HALF_UP for all financial calculations
- **Multi-Currency**: Projects in foreign currency; track FX at approval date
- **NPV Calculations**: Use tenant's discount rate (default 8%)

### Archive Semantics

- **Soft Delete**: Set `archived_date`; maintain historical records
- **Guard Rails**:
  - ❌ Deny if project is In Progress
  - ❌ Deny if project has active approvals pending
  - ❌ Deny if actual spend recorded
  - ✅ Allow if project is Draft or Rejected

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                            | User Action         |
| --------------------- | ------------------------------------- | ------------------- |
| **Empty**             | "No projects planned"                 | "Create Project"    |
| **Loading**           | Skeleton project cards                | N/A                 |
| **Error**             | Error message + retry                 | Retry / Support     |
| **Calculating ROI**   | Progress bar with spinner             | Wait                |
| **Pending Approval**  | Yellow badge "Awaiting Approval"      | View status         |
| **Approved**          | Green badge "Approved"                | Start project       |
| **Rejected**          | Red badge "Rejected"                  | View feedback       |
| **In Progress**       | Blue badge "In Progress" + % complete | Update progress     |
| **Completed**         | Green checkmark "Complete"            | View assets created |
| **Over Budget**       | Orange warning badge                  | Review variance     |
| **Permission Denied** | "Access restricted"                   | Back                |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Submit State**: Button disabled until dirty & valid
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal
- **Real-time Validation**: Check budget > 0, dates valid as user types

### Network Errors

| HTTP Status | UI Message                                           | Action              |
| ----------- | ---------------------------------------------------- | ------------------- |
| 400         | "Invalid project data. Check your input."            | Inline field errors |
| 401         | "Session expired. Please log in again."              | Redirect to login   |
| 403         | "You don't have permission to approve this project." | Hide action         |
| 404         | "Project not found. It may have been archived."      | Return to list      |
| 409         | "Project already approved/rejected."                 | Show conflict modal |
| 422         | "Validation failed: Budget must be greater than 0."  | Inline errors       |
| 500         | "Operation failed. Our team has been notified."      | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/capex.json`.

### Page Titles & Headers

| Context        | Copy                        | i18n Key                    |
| -------------- | --------------------------- | --------------------------- |
| List Page      | "CAPEX Projects"            | `capex.list.title`          |
| Dashboard      | "CAPEX Portfolio Dashboard" | `capex.dashboard.title`     |
| Detail Page    | "Project Details"           | `capex.detail.title`        |
| Create Modal   | "Create CAPEX Project"      | `capex.create.title`        |
| Approval Page  | "Approve Project"           | `capex.approval.title`      |
| ROI Calculator | "ROI Calculator"            | `capex.roiCalculator.title` |

### State Messages

| State             | Title                     | Message                                               | Action Button       | i18n Key                   |
| ----------------- | ------------------------- | ----------------------------------------------------- | ------------------- | -------------------------- |
| Empty             | "No projects planned"     | "Create your first capital project to begin"          | "Create Project"    | `capex.empty.*`            |
| Loading           | —                         | —                                                     | —                   | —                          |
| Error             | "Unable to load projects" | "Something went wrong. Our team has been notified."   | "Retry" / "Support" | `capex.error.*`            |
| No Results        | "No projects found"       | "Try adjusting your filters or search terms"          | "Clear Filters"     | `capex.noResults.*`        |
| Permission Denied | "Access restricted"       | "You don't have permission to view CAPEX projects."   | "Back"              | `capex.permissionDenied.*` |
| Calculating       | "Calculating ROI..."      | "Running financial analysis. This may take a moment." | —                   | `capex.calculating.*`      |
| Pending Approval  | "Awaiting approval"       | "This project is pending approval from {approver}"    | "View Status"       | `capex.pendingApproval.*`  |
| Over Budget       | "Budget exceeded"         | "Actual spend is {percent}% over approved budget"     | "Review Variance"   | `capex.overBudget.*`       |

### Action Confirmations

| Action         | Title                   | Message                                                       | Confirm Button   | Cancel Button | i18n Key                   |
| -------------- | ----------------------- | ------------------------------------------------------------- | ---------------- | ------------- | -------------------------- |
| Submit         | "Submit for approval?"  | "Submit {project} for approval? This cannot be edited after." | "Submit"         | "Cancel"      | `capex.submit.confirm.*`   |
| Approve        | "Approve this project?" | "Approve capital project of {amount}? This authorizes spend." | "Approve"        | "Cancel"      | `capex.approve.confirm.*`  |
| Reject         | "Reject this project?"  | "Reject {project}? Provide feedback for the submitter."       | "Reject"         | "Cancel"      | `capex.reject.confirm.*`   |
| Cancel Project | "Cancel this project?"  | "Cancel {project}? This cannot be easily undone."             | "Cancel Project" | "Cancel"      | `capex.cancel.confirm.*`   |
| Complete       | "Mark as complete?"     | "Mark {project} as complete? This creates fixed assets."      | "Complete"       | "Cancel"      | `capex.complete.confirm.*` |

### Success Messages (Toast)

| Action            | Message                                      | i18n Key                 |
| ----------------- | -------------------------------------------- | ------------------------ |
| Project Created   | "Project '{name}' created successfully"      | `capex.create.success`   |
| Project Updated   | "Project '{name}' updated successfully"      | `capex.update.success`   |
| Project Submitted | "Project submitted for approval"             | `capex.submit.success`   |
| Project Approved  | "Project approved successfully"              | `capex.approve.success`  |
| Project Rejected  | "Project rejected"                           | `capex.reject.success`   |
| Project Completed | "Project completed. {count} assets created." | `capex.complete.success` |
| ROI Calculated    | "ROI analysis completed"                     | `capex.roi.success`      |

### Error Messages (Toast)

| Scenario            | Message                                                  | i18n Key                        |
| ------------------- | -------------------------------------------------------- | ------------------------------- |
| Create Failed       | "Failed to create project. Please try again."            | `capex.create.error`            |
| Submit Failed       | "Failed to submit project. Check all required fields."   | `capex.submit.error`            |
| Approval Failed     | "Failed to approve project. Please try again."           | `capex.approve.error`           |
| Invalid Budget      | "Budget must be greater than 0."                         | `capex.errorBudget`             |
| Invalid Dates       | "Start date must be before completion date."             | `capex.errorDates`              |
| Missing ROI         | "ROI calculation required for projects > $50,000."       | `capex.errorMissingROI`         |
| Already Approved    | "Project already approved. Cannot edit."                 | `capex.errorAlreadyApproved`    |
| Insufficient Rights | "You don't have permission to approve projects > $100K." | `capex.errorInsufficientRights` |
| Network Error       | "Network error. Check your connection and try again."    | `capex.error.network`           |

### Form Labels & Help Text

| Field           | Label                    | Placeholder           | Help Text                                   | i18n Key                       |
| --------------- | ------------------------ | --------------------- | ------------------------------------------- | ------------------------------ |
| Project Name    | "Project Name"           | "e.g., New Warehouse" | "Descriptive name for this capital project" | `capex.field.projectName.*`    |
| Description     | "Description"            | "Brief description"   | "Detailed description of the project"       | `capex.field.description.*`    |
| Budget          | "Approved Budget"        | "0.00"                | "Total approved capital budget"             | `capex.field.budget.*`         |
| Start Date      | "Planned Start Date"     | "Select date"         | "Expected project start date"               | `capex.field.startDate.*`      |
| Completion Date | "Expected Completion"    | "Select date"         | "Expected project completion date"          | `capex.field.completionDate.*` |
| Category        | "Project Category"       | "Select category"     | "Buildings, Equipment, Technology, etc."    | `capex.field.category.*`       |
| Expected ROI    | "Expected ROI (%)"       | "0.0"                 | "Expected return on investment percentage"  | `capex.field.roi.*`            |
| Payback Period  | "Payback Period (years)" | "0"                   | "Expected years to recover investment"      | `capex.field.paybackPeriod.*`  |

### Keyboard Shortcuts Help

| Shortcut | Description             | i18n Key                   |
| -------- | ----------------------- | -------------------------- |
| `/`      | "Focus search"          | `capex.shortcuts.search`   |
| `n`      | "Create new project"    | `capex.shortcuts.new`      |
| `a`      | "Approve selected"      | `capex.shortcuts.approve`  |
| `↑ / ↓`  | "Navigate projects"     | `capex.shortcuts.navigate` |
| `Enter`  | "Open selected project" | `capex.shortcuts.open`     |
| `Escape` | "Close modal/cancel"    | `capex.shortcuts.cancel`   |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useCapex.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useCapexProjects(filters = {}) {
  const queryClient = useQueryClient();

  const {
    data: projects,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["capex", "list", filters],
    queryFn: () => apiClient.GET("/api/capex/projects", { query: filters }),
    staleTime: 60_000, // 1min
    retry: 2,
    select: (response) => response.data,
  });

  const createProject = useMutation({
    mutationFn: (data) => apiClient.POST("/api/capex/projects", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["capex"] });
      toast.success(`Project '${data.name}' created successfully`);
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Validation failed. Check your input.");
      } else {
        toast.error("Failed to create project.");
      }
    },
  });

  const updateProject = useMutation({
    mutationFn: ({ id, data }) =>
      apiClient.PUT("/api/capex/projects/[id]", { params: { id }, body: data }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["capex"] });
      queryClient.invalidateQueries({ queryKey: ["capex", "project", id] });
      toast.success("Project updated successfully");
    },
  });

  return {
    projects: projects || [],
    isLoading,
    error,
    createProject: createProject.mutate,
    updateProject: updateProject.mutate,
  };
}

export function useCapexProject(id: string) {
  return useQuery({
    queryKey: ["capex", "project", id],
    queryFn: () =>
      apiClient.GET("/api/capex/projects/[id]", { params: { id } }),
    staleTime: 60_000, // 1min
    enabled: !!id,
    select: (response) => response.data,
  });
}

export function useSubmitProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.POST("/api/capex/projects/[id]/submit", {
        params: { id: projectId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capex"] });
      queryClient.invalidateQueries({
        queryKey: ["capex", "project", projectId],
      });
      toast.success("Project submitted for approval");
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Failed to submit. Check all required fields.");
      } else {
        toast.error("Submission failed.");
      }
    },
  });
}

export function useApproveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { project_id: string; comments?: string }) =>
      apiClient.POST("/api/capex/projects/[id]/approve", {
        params: { id: data.project_id },
        body: { comments: data.comments },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capex"] });
      toast.success("Project approved successfully");
    },
    onError: (error) => {
      if (error.status === 403) {
        toast.error("You don't have permission to approve this project.");
      } else if (error.status === 409) {
        toast.error("Project already approved/rejected.");
      } else {
        toast.error("Approval failed.");
      }
    },
  });
}

export function useRejectProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { project_id: string; reason: string }) =>
      apiClient.POST("/api/capex/projects/[id]/reject", {
        params: { id: data.project_id },
        body: { reason: data.reason },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["capex"] });
      toast.success("Project rejected");
    },
  });
}

export function useCalculateROI() {
  return useMutation({
    mutationFn: (data: {
      initial_investment: number;
      useful_life: number;
      annual_revenue: number;
      annual_cost: number;
    }) => apiClient.POST("/api/capex/roi-calculate", { body: data }),
    onSuccess: (data) => {
      toast.success("ROI analysis completed");
      return data;
    },
    onError: () => {
      toast.error("ROI calculation failed. Check your inputs.");
    },
  });
}

export function useCompleteProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.POST("/api/capex/projects/[id]/complete", {
        params: { id: projectId },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["capex"] });
      queryClient.invalidateQueries({
        queryKey: ["capex", "project", projectId],
      });
      toast.success(
        `Project completed. ${data.assets_created} assets created.`
      );
    },
    onError: () => {
      toast.error("Failed to complete project.");
    },
  });
}
```

### Error Mapping

| API Error         | User Message                                         | UI Action            |
| ----------------- | ---------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid project data. Check your input."            | Inline field errors  |
| 409 (Conflict)    | "Project already approved/rejected."                 | Show conflict modal  |
| 422 (Validation)  | "Validation failed: {field_errors}"                  | Inline errors        |
| 403 (Forbidden)   | "You don't have permission to approve this project." | Hide action buttons  |
| 500 (Server)      | "Operation failed. Our team has been notified."      | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **ROI calculations**: 5s timeout

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["capex", "list", { filters }][("capex", "project", projectId)][
  ("capex", "dashboard")
][("capex", "approvals", "pending")];
```

### Invalidation Rules

| Action           | Invalidates                                                               |
| ---------------- | ------------------------------------------------------------------------- |
| Create Project   | `["capex", "list"]`                                                       |
| Update Project   | `["capex", "list"]`, `["capex", "project", id]`                           |
| Submit Project   | `["capex", "list"]`, `["capex", "project", id]`, `["capex", "approvals"]` |
| Approve Project  | `["capex", "list"]`, `["capex", "project", id]`, `["capex", "approvals"]` |
| Complete Project | `["capex", "list"]`, `["capex", "project", id]`                           |

### Stale Time

| Query Type        | Stale Time | Reasoning                        |
| ----------------- | ---------- | -------------------------------- |
| Project List      | 1min       | Moderate changes; status updates |
| Project Detail    | 1min       | Less frequently changed          |
| Dashboard Metrics | 2min       | Aggregated data; can be cached   |
| Pending Approvals | 30s        | Time-sensitive; frequent checks  |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("capex"); // After mutations
revalidateTag(`capex-${projectId}`); // Specific project
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/capex.fixtures.ts`

**Datasets**:

- `minimalProjects`: 5 projects (various statuses)
- `standardProjects`: 30 projects with complete approval workflows
- `largePortfolio`: 100 projects (for performance testing)
- `edgeCases`: Special scenarios

**Edge Cases Covered**:

- Projects at exact approval thresholds ($100K)
- Multi-year projects (5+ years)
- Projects with negative NPV
- Projects pending multiple approval levels
- Over-budget projects
- Completed projects with fixed assets created

```typescript
// Example fixture structure
export const standardProjects: CapexProjectFixture[] = [
  {
    id: "project_1",
    name: "New Warehouse Facility",
    description: "Expand warehouse capacity",
    budget: 2500000.0,
    start_date: "2026-01-01",
    completion_date: "2026-12-31",
    category: "Buildings",
    status: "approved",
    expected_roi: 15.5,
    payback_period: 6.5,
    approvals: [
      {
        level: 1,
        approver: "john.doe@company.com",
        approved_at: "2025-10-05",
        status: "approved",
      },
      {
        level: 2,
        approver: "jane.smith@company.com",
        approved_at: "2025-10-06",
        status: "approved",
      },
    ],
  },
  // ... 29 more
];
```

### E2E Seed Data

**Location**: `tests/seeds/capex.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:capex
```

**Dataset**:

- 50 projects across all statuses
- 10 draft projects
- 15 pending approval
- 20 approved projects
- 5 completed projects (with fixed assets)
- Multi-year projects
- Various budget ranges

**Cleanup Command**:

```powershell
pnpm run seed:capex:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic company: "Demo Corp Inc." with $10M capital budget
- 25 projects demonstrating all features
- Complete approval workflows showing parallel/sequential approvals
- ROI calculations with realistic metrics
- Mix of project categories (Buildings 30%, Equipment 40%, Technology 30%)
- Examples of budget variance tracking

**Regeneration**:

```powershell
pnpm run demo:reset:capex
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] Budget > 0 for all projects
- [ ] Start Date < Completion Date
- [ ] Approval levels match budget thresholds
- [ ] Status transitions valid (Draft → Submitted → Approved...)
- [ ] ROI calculations mathematically correct

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
- **Interactive Parts**: Mark with `"use client"` (approval forms, ROI calculator, dashboard)

### Data Fetching Strategy

| Scenario          | Strategy                                 | Benefit             |
| ----------------- | ---------------------------------------- | ------------------- |
| Initial List      | Server-side fetch + stream               | Faster TTFB         |
| CRUD Operations   | Client-side React Query                  | Optimistic updates  |
| Dashboard Metrics | Server component wrapper + client charts | SEO + interactivity |
| Approval Actions  | Client-side mutations with optimistic UI | Immediate feedback  |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function approveProject(projectId: string) {
  // ... mutation logic
  revalidateTag("capex");
  revalidateTag(`capex-${projectId}`);
}
```

---

## 📊 Analytics & Audit Events

| Event                   | When                   | Properties                                                 |
| ----------------------- | ---------------------- | ---------------------------------------------------------- |
| CAPEX.Project.Created   | After 2xx              | `project_id`, `name`, `budget`, `category`                 |
| CAPEX.Project.Updated   | After 2xx              | `project_id`, changed fields                               |
| CAPEX.Project.Submitted | Submitted for approval | `project_id`, `budget`, `submitter`                        |
| CAPEX.Project.Approved  | Approval granted       | `project_id`, `approver`, `approval_level`, `comments`     |
| CAPEX.Project.Rejected  | Approval denied        | `project_id`, `approver`, `reason`                         |
| CAPEX.Project.Completed | Marked complete        | `project_id`, `assets_created`, `actual_spend`, `variance` |
| CAPEX.ROI.Calculated    | ROI calculation run    | `project_id`, `npv`, `irr`, `payback_period`, `roi`        |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("CAPEX.Project.Approved", {
  project_id: project.id,
  approver: user.email,
  approval_level: 2,
  budget: project.budget,
  comments: approvalComments,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/capex.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency Display**: Respect locale-specific currency symbols
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Amount Display**: Handle both comma and period decimal separators
- **Multi-Year Display**: Show fiscal year format based on tenant settings

### Keyboard Shortcuts

| Key      | Action                | Scope        |
| -------- | --------------------- | ------------ |
| `/`      | Focus search          | Project list |
| `n`      | Create new project    | Project list |
| `a`      | Approve selected      | Approval     |
| `r`      | Reject selected       | Approval     |
| `↑ / ↓`  | Navigate projects     | Table        |
| `Enter`  | Open selected project | Table        |
| `Escape` | Close modal/cancel    | Modal/Form   |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateModal()],
  ["a", () => canApprove && approveProject()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                         | Duration | Rollback Trigger |
| ----------- | ---------------- | ---------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                         | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, Lighthouse ≥90       | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, Approval SLA < 2hrs   | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m9_capex: false,                 // Master toggle
  m9_capex_roi_calculator: false,  // ROI calculator feature
  m9_capex_gantt_chart: false,     // Gantt visualization
  m9_capex_multi_approval: false,  // Multi-level approvals
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/capex`, `/capex/approvals`)
- P50/P95/P99 latency
- Approval SLA (time from submission to approval)
- ROI calculation accuracy
- Budget variance alerts

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Approval SLA > 2hrs → alert finance team
- ROI calculation error → immediate alert
- P95 latency > 500ms for 10min → investigate

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m9_capex = false`

   ```powershell
   pnpm run flags:set m9_capex=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("capex");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/capex/*"
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

| Scenario                  | Action             | Approval Required |
| ------------------------- | ------------------ | ----------------- |
| Error rate > 5%           | Immediate rollback | No (auto-trigger) |
| Approval workflow failure | Immediate rollback | No (auto-trigger) |
| ROI calculation error     | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%           | Partial rollback   | On-call engineer  |
| P95 latency > 1s          | Investigate first  | On-call engineer  |
| Data corruption/loss      | Immediate rollback | No (auto-trigger) |

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

- ERPNext patterns: CAPEX budgeting workflows
- Oracle EBS: Multi-level approval processes
- SAP: ROI calculation methodologies
- QuickBooks: Project budget tracking

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: ROI Calculation Accuracy

**Mitigation**: Third-party validation; comprehensive test coverage; accounting review; documented methodology

### Risk #2: Approval Workflow Complexity

**Mitigation**: Configurable rules engine; parallel/sequential options; thorough testing; clear documentation

### Risk #3: Integration with Fixed Assets

**Mitigation**: Clear handoff process; data mapping validation; E2E testing; rollback procedure

### Risk #4: Multi-Year Forecast Accuracy

**Mitigation**: Rolling forecasts; variance analysis; regular reviews; sensitivity analysis

---

## 📝 Implementation Guide

### Day 1: Dashboard & Projects (8 hours)

1. Build project list table (3 hours)
2. Create dashboard with metrics (3 hours)
3. Implement Gantt chart visualization (2 hours)

### Day 2: Approval & ROI (4 hours)

1. Build approval workflow interface (2 hours)
2. Create ROI calculator (2 hours)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] ROI calculations accurate (NPV, IRR, payback period)
- [ ] Approval routing logic correct (level 1/2 based on budget)
- [ ] Budget validation works
- [ ] Date validation (start < completion)
- [ ] useCapexProjects hook fetches correctly
- [ ] useApproveProject handles permissions
- [ ] Currency formatting displays correctly
- [ ] Status transition validation

### Integration Tests

- [ ] Create project → appears in list
- [ ] Submit project → routed to correct approver
- [ ] Approve project → status changes, notifications sent
- [ ] Reject project → status changes, reason captured
- [ ] Complete project → fixed assets created
- [ ] Budget variance alerts trigger correctly
- [ ] Multi-level approval workflow completes
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] User can navigate to CAPEX page
- [ ] User can create new project with all fields
- [ ] User can submit project for approval
- [ ] Approver can approve/reject with comments
- [ ] User can run ROI calculator
- [ ] User can view dashboard metrics
- [ ] User can complete project and see assets created
- [ ] Keyboard-only flow: create → submit → approve
- [ ] Gantt chart displays project timelines

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Approval actions accessible
- [ ] Screen reader announces status changes
- [ ] Focus management correct (modals, forms)
- [ ] Color contrast meets WCAG 2.2 AA (AAA where practical)
- [ ] Axe: 0 serious/critical violations
- [ ] Charts have accessible data table alternatives
- [ ] All interactive elements have accessible names

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] All API endpoints return expected status codes
- [ ] ROI calculation results validated against spec

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for dashboard, list, approval page
- [ ] Dark/light theme variations
- [ ] Project status badge variations
- [ ] Loading/error/empty states captured
- [ ] Gantt chart rendering

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/capex/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] ROI calculation completes in < 2s
- [ ] Dashboard loads 100 projects in < 1s
- [ ] Gantt chart renders 50 projects in < 500ms

---

## 📅 Timeline

| Day | Deliverable                            |
| --- | -------------------------------------- |
| 1   | Dashboard + Project list + Gantt chart |
| 1.5 | Approval workflow + ROI calculator     |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries
- ✅ M8: Fixed Assets (for integration)

### Enables These Modules

- M10: Intangible Assets
- Financial planning modules

---

## 🎯 Success Criteria

### Must Have

- [ ] Create and manage capital projects
- [ ] Multi-level approval workflow
- [ ] ROI/NPV calculations
- [ ] Budget tracking with variance alerts
- [ ] Integration with fixed assets
- [ ] Dashboard with portfolio metrics
- [ ] Search and filtering (status, category, budget range)

### Should Have

- [ ] Gantt chart visualization
- [ ] Sensitivity analysis for ROI
- [ ] Approval SLA tracking
- [ ] Mobile approval capability
- [ ] Budget variance reports

### Nice to Have

- [ ] AI-powered project prioritization
- [ ] Integration with project management tools
- [ ] Predictive budget variance alerts
- [ ] Portfolio optimization recommendations

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/capex`, `/capex/[id]`, `/capex/dashboard`, `/capex/approvals`)
- [ ] All CRUD operations working (Create, Read, Update, Submit, Approve, Reject, Complete)
- [ ] ROI calculator working (NPV, IRR, payback period calculations)
- [ ] Multi-level approval workflow (Level 1: < $100K, Level 2: ≥ $100K)
- [ ] Budget variance tracking and alerts
- [ ] Integration with fixed assets upon project completion
- [ ] Search and filtering working (status, category, budget)
- [ ] Permissions enforced (UI hides/shows based on role and approval level)
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
- [ ] Integration tests: All CRUD + approval operations covered
- [ ] E2E tests: All user flows covered (create → submit → approve → complete)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Project creation flow
- Approval workflow (submit → approve/reject)
- ROI calculation flow
- Project completion with asset integration

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/capex/*` routes
- [ ] TTFB: ≤70ms on staging (Server-Timing header)
- [ ] TTI: ≤200ms for `/capex` (Lighthouse CI)
- [ ] ROI calculation: < 2s
- [ ] Dashboard load: < 1s for 100 projects
- [ ] Gantt chart: < 500ms for 50 projects

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues
- [ ] Charts have accessible data table alternatives

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `CAPEX.Project.Created`
  - `CAPEX.Project.Submitted`
  - `CAPEX.Project.Approved`
  - `CAPEX.Project.Rejected`
  - `CAPEX.Project.Completed`
  - `CAPEX.ROI.Calculated`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, approval SLA)
- [ ] Approval SLA tracking (< 2hrs target)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Multi-level approval rights enforced
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] Audit trail maintained for all approvals/rejections

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
  - `flags.m9_capex = false` (ready to enable)
  - `flags.m9_capex_roi_calculator = false` (phase 2)
  - `flags.m9_capex_gantt_chart = false` (phase 2)
  - `flags.m9_capex_multi_approval = false` (phase 2)
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

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M8 - Fixed Assets  
**Next**: M10 - Intangible Assets
