# 🚀 M34: Projects & Jobs - UI Implementation Runbook

**Module ID**: M34  
**Module Name**: Projects & Jobs  
**Priority**: HIGH  
**Phase**: 10 - Extended Modules  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

M34 delivers comprehensive project-based accounting for professional services, construction, and project-driven businesses. Track project profitability, labor costs, materials, expenses, and WIP (Work in Progress) with real-time budget variance analysis.

### Business Value

- **Project Profitability**: Real-time P&L by project eliminates month-end surprises
- **Budget Control**: Prevent cost overruns with live budget vs. actual tracking
- **Resource Optimization**: Identify underperforming projects to reallocate resources
- **Client Billing**: Accurate time & materials billing increases revenue capture by 15%
- **WIP Management**: Proper revenue recognition for long-term contracts per ASC 606

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-project-costing], [ADR-###-wip-revenue-recognition], [ADR-###-evm-metrics]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 18 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

**Project Management** (6 endpoints):

- ✅ `/api/projects` - List projects
- ✅ `/api/projects/[id]` - Project details
- ✅ `/api/projects/create` - Create project
- ✅ `/api/projects/update` - Update project
- ✅ `/api/projects/close` - Close project
- ✅ `/api/projects/status` - Update project status

**Costing & Budgets** (6 endpoints):

- ✅ `/api/projects/costing` - Project costing data
- ✅ `/api/projects/costing/[id]` - Detailed project costs
- ✅ `/api/projects/budgets` - Budget tracking
- ✅ `/api/projects/budgets/variance` - Budget variance analysis
- ✅ `/api/projects/budgets/forecast` - Forecast to complete
- ✅ `/api/projects/evm` - Earned value management metrics

**WIP & Revenue Recognition** (4 endpoints):

- ✅ `/api/projects/wip` - Work in progress schedules
- ✅ `/api/projects/wip/[id]` - WIP details by project
- ✅ `/api/projects/revenue-recognition` - Revenue recognition calculation
- ✅ `/api/projects/wip/post` - Post WIP journal entries

**Reporting & Analytics** (2 endpoints):

- ✅ `/api/projects/profitability` - Profitability analysis
- ✅ `/api/projects/utilization` - Resource utilization metrics

**Total Endpoints**: 18 (4 categories)

### Risks & Blockers

| Risk                           | Impact | Mitigation                                                          | Owner       |
| ------------------------------ | ------ | ------------------------------------------------------------------- | ----------- |
| Revenue recognition complexity | HIGH   | ASC 606 compliant WIP calculation; external audit validation        | @accounting |
| Cost allocation accuracy       | HIGH   | Automated cost posting; reconciliation with GL; comprehensive tests | @accounting |
| Budget forecast reliability    | MED    | EVM metrics; historical data analysis; trend forecasting            | @pm-ops     |
| Time integration data quality  | MED    | Validation rules; approval workflow; data quality monitoring        | @pm-ops     |

---

## 🎯 3 Killer Features

### 1. **Project Costing Dashboard** 🚀

**Description**: Real-time project P&L with labor, materials, expenses, and overhead allocation. Features drill-down by cost category, phase, and task with budget variance alerts. Interactive charts show profitability trends and cost burn rate.

**Why It's Killer**:

- **Real-Time Costing**: Live project costs update as time/expenses are entered (vs. monthly in SAP/Oracle)
- **Profitability View**: Instant project margin analysis (competitors require custom reports)
- **Cost Breakdown**: Drill into labor, materials, overhead by phase/task
- **Measurable Impact**: Project managers save 10+ hours/week eliminating manual cost tracking
- **Vs Deltek**: More intuitive UI and tighter ERP integration (Deltek is standalone)

**Implementation**:

```typescript
import { Card, Chart, Badge, DataTable, ProgressBar } from "aibos-ui";
import { useProjectCosting } from "@/hooks/useProjects";

export default function ProjectCostingDashboard() {
  const { project, costs, profitability } = useProjectCosting();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-gray-600">{project.client_name}</p>
            <Badge
              variant={project.status === "Active" ? "success" : "default"}
            >
              {project.status}
            </Badge>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">
              ${project.contract_value.toLocaleString()}
            </div>
            <p className="text-sm text-gray-600">Contract Value</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Total Costs</h3>
          <div className="text-3xl font-bold text-red-600">
            ${costs.total.toLocaleString()}
          </div>
          <ProgressBar
            value={(costs.total / project.budget) * 100}
            variant="error"
          />
          <p className="text-sm text-gray-600 mt-2">
            {((costs.total / project.budget) * 100).toFixed(0)}% of budget
          </p>
        </Card>
        <Card>
          <h3>Labor Costs</h3>
          <div className="text-3xl font-bold">
            ${costs.labor.toLocaleString()}
          </div>
          <Badge variant="info">{costs.labor_hours} hours</Badge>
        </Card>
        <Card>
          <h3>Materials & Expenses</h3>
          <div className="text-3xl font-bold">
            ${costs.materials.toLocaleString()}
          </div>
        </Card>
        <Card>
          <h3>Project Margin</h3>
          <div className="text-3xl font-bold text-green-600">
            {profitability.margin_pct}%
          </div>
          <Badge
            variant={profitability.margin_pct >= 20 ? "success" : "warning"}
          >
            ${profitability.profit.toLocaleString()} profit
          </Badge>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Cost Breakdown">
          <Chart
            type="doughnut"
            data={{
              labels: ["Labor", "Materials", "Expenses", "Overhead"],
              datasets: [
                {
                  data: [
                    costs.labor,
                    costs.materials,
                    costs.expenses,
                    costs.overhead,
                  ],
                  backgroundColor: [
                    "rgb(59, 130, 246)",
                    "rgb(34, 197, 94)",
                    "rgb(249, 115, 22)",
                    "rgb(156, 163, 175)",
                  ],
                },
              ],
            }}
          />
        </Card>

        <Card title="Cost Burn Rate">
          <Chart
            type="line"
            data={{
              labels: costs.by_month.months,
              datasets: [
                {
                  label: "Actual Costs",
                  data: costs.by_month.actual,
                  borderColor: "rgb(239, 68, 68)",
                  fill: false,
                },
                {
                  label: "Budgeted Costs",
                  data: costs.by_month.budget,
                  borderColor: "rgb(34, 197, 94)",
                  borderDash: [5, 5],
                  fill: false,
                },
              ],
            }}
          />
        </Card>
      </div>

      <Card title="Cost Detail by Phase">
        <DataTable
          data={costs.by_phase}
          columns={[
            { key: "phase_name", label: "Phase" },
            {
              key: "budget",
              label: "Budget",
              render: (_, row) => `$${row.budget.toLocaleString()}`,
            },
            {
              key: "actual",
              label: "Actual",
              render: (_, row) => `$${row.actual.toLocaleString()}`,
            },
            {
              key: "variance",
              label: "Variance",
              render: (_, row) => (
                <Badge variant={row.variance >= 0 ? "success" : "error"}>
                  ${Math.abs(row.variance).toLocaleString()}
                  {row.variance >= 0 ? " under" : " over"}
                </Badge>
              ),
            },
            {
              key: "completion_pct",
              label: "Progress",
              render: (_, row) => (
                <div className="w-full">
                  <ProgressBar value={row.completion_pct} />
                  <span className="text-sm">{row.completion_pct}%</span>
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

### 2. **Time Tracking Integration** ⚡

**Description**: Seamless integration with time entry (M35) showing labor hours and costs by project, employee, and task. Features time variance analysis, billable vs. non-billable tracking, and labor efficiency metrics.

**Why It's Killer**:

- **Billable Utilization**: Track billable hours vs. total hours to optimize revenue
- **Labor Efficiency**: Compare estimated hours vs. actual hours by task
- **Cost Allocation**: Automatic labor cost posting to projects
- **Measurable Impact**: Increase billable utilization from 65% to 80%

**Implementation**:

```typescript
import { Card, DataTable, Chart, Badge } from "aibos-ui";
import { useProjectTimeTracking } from "@/hooks/useProjects";

export default function ProjectTimeTracking() {
  const { timesheets, utilization, variance } = useProjectTimeTracking();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Total Hours</h3>
          <div className="text-4xl font-bold">{utilization.total_hours}</div>
        </Card>
        <Card>
          <h3>Billable Hours</h3>
          <div className="text-4xl font-bold text-green-600">
            {utilization.billable_hours}
          </div>
          <Badge variant="success">{utilization.billable_pct}% billable</Badge>
        </Card>
        <Card>
          <h3>Labor Cost</h3>
          <div className="text-3xl font-bold">
            ${utilization.labor_cost.toLocaleString()}
          </div>
        </Card>
      </div>

      <Card title="Time by Employee">
        <DataTable
          data={timesheets}
          columns={[
            { key: "employee_name", label: "Employee" },
            { key: "role", label: "Role" },
            { key: "hours", label: "Hours" },
            { key: "billable_hours", label: "Billable" },
            {
              key: "billable_pct",
              label: "Utilization",
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
            {
              key: "labor_cost",
              label: "Cost",
              render: (_, row) => `$${row.labor_cost.toLocaleString()}`,
            },
          ]}
        />
      </Card>
    </div>
  );
}
```

### 3. **Budget vs. Actual Analysis** 💎

**Description**: Interactive budget variance reporting with early warning alerts for cost overruns. Features scenario analysis, forecast-to-complete, and earned value management (EVM) calculations.

**Why It's Killer**:

- **Early Warnings**: Automated alerts when project exceeds 80% of budget
- **Forecast to Complete**: Predicts final project cost based on current burn rate
- **EVM Metrics**: CPI (Cost Performance Index) and SPI (Schedule Performance Index)
- **Measurable Impact**: Reduce project cost overruns by 40%

**Implementation**:

```typescript
import { Card, Alert, Chart, DataTable, Badge } from "aibos-ui";
import { useBudgetVsActual } from "@/hooks/useProjects";

export default function BudgetVsActualAnalysis() {
  const { projects, alerts } = useBudgetVsActual();

  return (
    <div className="space-y-6">
      {alerts.critical.length > 0 && (
        <Alert variant="error">
          <strong>{alerts.critical.length} Projects Over Budget!</strong>
          <p>Immediate action required for projects exceeding budget.</p>
        </Alert>
      )}

      <Card title="Project Budget Performance">
        <DataTable
          data={projects}
          columns={[
            { key: "project_name", label: "Project" },
            {
              key: "budget",
              label: "Budget",
              render: (_, row) => `$${row.budget.toLocaleString()}`,
            },
            {
              key: "actual",
              label: "Actual",
              render: (_, row) => `$${row.actual.toLocaleString()}`,
            },
            {
              key: "variance",
              label: "Variance",
              render: (_, row) => (
                <Badge variant={row.variance >= 0 ? "success" : "error"}>
                  ${Math.abs(row.variance).toLocaleString()}
                  {row.variance >= 0 ? " under" : " over"}
                </Badge>
              ),
            },
            {
              key: "forecast_to_complete",
              label: "Forecast",
              render: (_, row) =>
                `$${row.forecast_to_complete.toLocaleString()}`,
            },
            {
              key: "cpi",
              label: "CPI",
              render: (_, row) => (
                <Badge variant={row.cpi >= 1 ? "success" : "error"}>
                  {row.cpi.toFixed(2)}
                </Badge>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
```

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Main Page (`/projects/dashboard`)

**Components**: Card, DataTable, Chart, Badge
**File**: `apps/web/app/(dashboard)/projects/page.tsx`

#### 2. Project Detail (`/projects/[id]`)

**Components**: Card, Chart, DataTable, ProgressBar
**File**: `apps/web/app/(dashboard)/projects/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                       | Target          | Measurement          |
| ---------------------------- | --------------- | -------------------- |
| TTFB (staging)               | ≤ 70ms          | Server timing header |
| Client TTI for `/projects`   | ≤ 200ms         | Lighthouse CI        |
| Costing dashboard load       | < 2s            | Performance profiler |
| Budget variance calculation  | < 1s            | API response time    |
| EVM metrics calculation      | < 1s            | API response time    |
| Project list (100+ projects) | < 1s            | Virtualization       |
| UI bundle size               | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to all charts and tables
- **Focus Management**: Focus trap in modals; logical navigation order
- **ARIA**: Budget alerts announced; cost updates communicated
- **Screen Reader**: All project data announced; financial metrics described
- **Axe Target**: 0 serious/critical violations

### Security

| Layer         | Requirement                                         |
| ------------- | --------------------------------------------------- |
| RBAC Scopes   | `projects.read`, `projects.write`, `projects.admin` |
| Enforcement   | Server-side on all endpoints                        |
| Data Exposure | Only show project data user has permission for      |
| Audit Trail   | Immutable audit logs for all cost/budget changes    |
| Rate Limiting | Protect calculation endpoints; prevent abuse        |

#### UI Permissions Matrix

| Role           | View | Create | Edit | Close | View Costs | Edit Budget | Admin |
| -------------- | ---- | ------ | ---- | ----- | ---------- | ----------- | ----- |
| projects.read  | ✅   | ❌     | ❌   | ❌    | ✅         | ❌          | ❌    |
| projects.write | ✅   | ✅     | ✅   | ❌    | ✅         | ✅          | ❌    |
| projects.admin | ✅   | ✅     | ✅   | ✅    | ✅         | ✅          | ✅    |

### Reliability & Observability

- **SLO**: 99.9% cost calculation accuracy; 99.9% budget tracking reliability
- **SLA Dashboards**: Real-time metrics on project performance
- **Events Emitted**: `Projects.Created`, `Projects.CostUpdated`, `Projects.BudgetAlert`
- **Logging**: Structured logs with project IDs for all operations
- **Tracing**: Distributed tracing for complex costing workflows

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Project Accounting Rules

| Rule                        | Enforcement                                         |
| --------------------------- | --------------------------------------------------- |
| **Cost Allocation**         | All costs must link to valid project/phase/task     |
| **WIP Revenue Recognition** | ASC 606 % completion method for long-term contracts |
| **Budget Enforcement**      | Alert at 80% of budget; prevent cost entry at 100%  |
| **Time Integration**        | Real-time labor cost posting from time entries      |
| **Project States**          | Draft → Active → On Hold → Completed → Closed       |
| **Phase Completion**        | Parent phase completion ≥ child phases avg          |
| **EVM Calculations**        | CPI = EV / AC; SPI = EV / PV; always positive       |

### Project States

- **Project**: Draft → Active → On Hold → Completing → Completed → Closed → Archived
- **Budget Status**: Under Budget → On Track → At Risk (>80%) → Over Budget (>100%)
- **Phase Status**: Not Started → In Progress → Completed

### Archive Semantics

- **Project History**: Retain all project data (7-year minimum)
- **Cost History**: Maintain complete cost audit trail
- **Guard Rails**:
  - ❌ Deny deletion of active projects
  - ❌ Deny changes to completed/closed projects
  - ✅ Allow archive after 7 years with proper approval

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display              | User Action      |
| --------------------- | ----------------------- | ---------------- |
| **Empty**             | "No projects yet"       | "Create Project" |
| **Loading**           | Skeleton forms/tables   | N/A              |
| **Error**             | Error message + retry   | Retry / Support  |
| **Draft**             | Gray badge "Draft"      | Activate         |
| **Active**            | Green badge "Active"    | View / Edit      |
| **On Hold**           | Orange badge "On Hold"  | Resume / Close   |
| **Budget Alert**      | Red badge "Over Budget" | Review Costs     |
| **Completing**        | Blue badge "Completing" | Finalize         |
| **Completed**         | Green badge "Completed" | Close            |
| **Closed**            | Gray badge "Closed"     | View history     |
| **Permission Denied** | "Access restricted"     | Back             |

### Form Validation

- **Project Information**: Validate project name, client, contract value
- **Budget Data**: Validate budget amounts, allocation percentages
- **Phase/Task Data**: Validate phase hierarchy, completion percentages

### Network Errors

| HTTP Status | UI Message                                          | Action              |
| ----------- | --------------------------------------------------- | ------------------- |
| 400         | "Invalid project data. Check your inputs."          | Inline field errors |
| 401         | "Session expired. Please log in again."             | Redirect to login   |
| 403         | "You don't have permission for project operations." | Hide action         |
| 404         | "Project not found."                                | Return to list      |
| 409         | "Project was modified. Review changes."             | Show diff modal     |
| 422         | "Validation failed. Check budget constraints."      | Inline errors       |
| 500         | "Calculation failed. Our team has been notified."   | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/projects.json`.

### Page Titles & Headers

| Context         | Copy                    | i18n Key                   |
| --------------- | ----------------------- | -------------------------- |
| Dashboard       | "Projects & Jobs"       | `projects.dashboard.title` |
| Project Detail  | "Project Costing"       | `projects.detail.title`    |
| Budget Analysis | "Budget vs. Actual"     | `projects.budget.title`    |
| Time Tracking   | "Project Time Tracking" | `projects.time.title`      |

### State Messages

| State        | Title                 | Message                     | Action Button    | i18n Key                 |
| ------------ | --------------------- | --------------------------- | ---------------- | ------------------------ |
| Empty        | "No projects yet"     | "Create your first project" | "Create Project" | `projects.empty.*`       |
| Budget Alert | "Budget alert"        | "Project is 80% of budget"  | "Review Costs"   | `projects.budgetAlert.*` |
| Over Budget  | "Project over budget" | "Immediate action required" | "Review"         | `projects.overBudget.*`  |

### Success Messages (Toast)

| Action          | Message                                 | i18n Key                  | Shortcut |
| --------------- | --------------------------------------- | ------------------------- | -------- |
| Project Created | "Project '{name}' created successfully" | `projects.create.success` | `n`      |
| Budget Updated  | "Budget updated successfully"           | `projects.budget.success` | `b`      |
| Project Closed  | "Project '{name}' closed"               | `projects.close.success`  | `c`      |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useProjects.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useProjects(filters = {}) {
  return useQuery({
    queryKey: ["projects", "list", filters],
    queryFn: () => apiClient.GET("/api/projects", { query: filters }),
    staleTime: 5 * 60_000, // 5min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", "detail", id],
    queryFn: () => apiClient.GET("/api/projects/[id]", { params: { id } }),
    staleTime: 2 * 60_000, // 2min (frequently updated)
    retry: 2,
    enabled: !!id,
    select: (response) => response.data,
  });
}

export function useProjectCosting(id: string) {
  return useQuery({
    queryKey: ["projects", "costing", id],
    queryFn: () =>
      apiClient.GET("/api/projects/costing/[id]", { params: { id } }),
    staleTime: 1 * 60_000, // 1min (real-time costing)
    retry: 2,
    enabled: !!id,
    select: (response) => response.data,
  });
}

export function useBudgetVsActual() {
  return useQuery({
    queryKey: ["projects", "budget-variance"],
    queryFn: () => apiClient.GET("/api/projects/budgets/variance"),
    staleTime: 2 * 60_000, // 2min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useEVMMetrics(id: string) {
  return useQuery({
    queryKey: ["projects", "evm", id],
    queryFn: () =>
      apiClient.GET("/api/projects/evm", { query: { projectId: id } }),
    staleTime: 5 * 60_000, // 5min
    retry: 2,
    enabled: !!id,
    select: (response) => response.data,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectData: any) =>
      apiClient.POST("/api/projects/create", { body: projectData }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(`Project '${data.name}' created successfully`);
    },
    onError: () => {
      toast.error("Failed to create project.");
    },
  });
}

export function useCloseProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.POST("/api/projects/close", { body: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project closed successfully");
    },
    onError: () => {
      toast.error("Failed to close project.");
    },
  });
}
```

### Error Mapping

| API Error         | User Message                                   | UI Action            |
| ----------------- | ---------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid project data. Check your inputs."     | Inline field errors  |
| 409 (Conflict)    | "Project was modified. Review changes."        | Show diff modal      |
| 422 (Validation)  | "Validation failed. Check budget constraints." | Inline errors        |
| 403 (Forbidden)   | "You don't have permission for project ops."   | Hide action          |
| 500 (Server)      | "Calculation failed. Our team is notified."    | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for calculations

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["projects", "list", { filters }][("projects", "detail", projectId)][
  ("projects", "costing", projectId)
][("projects", "budget-variance")][("projects", "evm", projectId)];
```

### Invalidation Rules

| Action         | Invalidates                                                     |
| -------------- | --------------------------------------------------------------- |
| Create Project | `["projects"]` (all)                                            |
| Update Project | `["projects"]`, `["projects", "detail", id]`                    |
| Update Budget  | `["projects", "budget-variance"]`, `["projects", "detail", id]` |
| Close Project  | `["projects"]`                                                  |
| Post Cost      | `["projects", "costing", id]`                                   |

### Stale Time

| Query Type      | Stale Time | Reasoning                 |
| --------------- | ---------- | ------------------------- |
| Project List    | 5min       | Moderate update frequency |
| Project Detail  | 2min       | Frequently viewed/updated |
| Costing         | 1min       | Real-time cost tracking   |
| Budget Variance | 2min       | Frequent monitoring       |
| EVM Metrics     | 5min       | Calculated periodically   |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("projects");
revalidateTag("project-costing");
revalidateTag("project-budgets");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/projects.fixtures.ts`

**Datasets**:

- `minimalProjects`: 3 projects (draft, active, completed)
- `standardProjects`: 20 projects across all states
- `complexProjects`: 50+ projects with varied scenarios
- `edgeCases`: Edge cases (budget overruns, negative margins, multiple phases)

**Edge Cases Covered**:

- Projects over budget (>100%)
- Projects with negative margins
- Projects with multiple phases/tasks
- Long-duration projects (multi-year)
- Fixed-price vs. time & materials

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
- **Interactive Parts**: Mark with `"use client"` (forms, charts, dashboards)

### Data Fetching Strategy

| Scenario          | Strategy                          | Benefit           |
| ----------------- | --------------------------------- | ----------------- |
| Project List      | Server-side fetch + stream        | Faster TTFB       |
| Costing Dashboard | Client-side with real-time update | Live metrics      |
| Budget Analysis   | Server component with static data | SEO + performance |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function createProject(projectData: any) {
  // ... mutation logic
  revalidateTag("projects");
}
```

---

## 📊 Analytics & Audit Events

| Event                   | When                      | Properties                                        |
| ----------------------- | ------------------------- | ------------------------------------------------- |
| Projects.Created        | Project created           | `project_id`, `client_name`, `contract_value`     |
| Projects.CostUpdated    | Cost posted to project    | `project_id`, `cost_type`, `amount`               |
| Projects.BudgetAlert    | Budget threshold exceeded | `project_id`, `budget`, `actual`, `threshold_pct` |
| Projects.PhaseCompleted | Phase marked complete     | `project_id`, `phase_id`, `completion_pct`        |
| Projects.Closed         | Project closed            | `project_id`, `final_cost`, `final_margin`        |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Projects.BudgetAlert", {
  project_id: "proj_123",
  budget: 100000,
  actual: 82000,
  threshold_pct: 80,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/projects.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Currency**: Support multiple currencies for international projects

### Keyboard Shortcuts

| Key      | Action             | Scope          |
| -------- | ------------------ | -------------- |
| `/`      | Focus search       | Any page       |
| `n`      | New project        | Project list   |
| `b`      | Update budget      | Project detail |
| `c`      | Close project      | Project detail |
| `↑ / ↓`  | Navigate list      | Any list       |
| `Enter`  | Open item          | Any list       |
| `Escape` | Close modal/cancel | Modal/Form     |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateProjectModal()],
  ["b", () => openBudgetModal()],
  ["c", () => closeProject()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                 | Duration | Rollback Trigger |
| ----------- | ---------------- | ------------------------------------------------ | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                 | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, costing accuracy 100%        | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, budget tracking correct       | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 1 week, project accounting validated | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m34_projects: false,                 // Master toggle
  m34_projects_evm: false,             // EVM metrics
  m34_projects_wip: false,             // WIP revenue recognition
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Cost calculation accuracy (100% required)
- Budget tracking reliability
- Dashboard load time
- Time integration success rate

**Alert Thresholds**:

- Cost calculation error → immediate investigation
- Budget alert not triggered → escalate
- Dashboard load > 5s → performance issue

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m34_projects = false`
2. **Invalidate cache**: `revalidateTag("projects")`
3. **Clear CDN cache**: `pnpm run cache:purge --path="/projects/*"`
4. **Monitor for 15 minutes**
5. **Post-mortem**

**Rollback Decision Matrix**:

| Scenario                    | Action             | Approval Required |
| --------------------------- | ------------------ | ----------------- |
| Cost calculation error      | Immediate rollback | No (auto-trigger) |
| Budget tracking error       | Immediate rollback | No (auto-trigger) |
| Dashboard performance > 10s | Immediate rollback | No (auto-trigger) |
| User complaints > 3         | Investigate first  | PM ops lead       |

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

- ASC 606 project revenue recognition (% completion method)
- Earned Value Management (PMBOK Guide)
- Deltek: Project accounting
- Workday PSA: Professional services automation
- Microsoft Dynamics 365 Project Operations

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Revenue Recognition Complexity

**Mitigation**: ASC 606 compliant % completion method; external audit validation; comprehensive test suite; parallel manual validation during pilot

### Risk #2: Cost Allocation Accuracy

**Mitigation**: Automated cost posting from time/expense entries; reconciliation with GL; comprehensive tests; audit trail for all allocations

### Risk #3: Budget Forecast Reliability

**Mitigation**: EVM metrics (CPI/SPI); historical data analysis; trend forecasting; conservative estimates; regular forecast reviews

### Risk #4: Time Integration Data Quality

**Mitigation**: Validation rules on time entries; approval workflow; data quality monitoring; automated anomaly detection

---

## 📝 Implementation Guide

### Day 1: Project Management & Costing (8 hours)

1. Build project list and detail pages (2 hours)
2. Implement project costing dashboard (3 hours)
3. Add cost breakdown charts (2 hours)
4. Integrate time tracking display (1 hour)

### Day 2: Budget & Analysis (8 hours)

1. Build budget vs. actual analysis (3 hours)
2. Implement EVM metrics calculation (2 hours)
3. Add forecast-to-complete (2 hours)
4. Create budget alert system (1 hour)

### Day 3: WIP & Polish (8 hours)

1. Implement WIP revenue recognition (3 hours)
2. Add profitability analysis (2 hours)
3. Comprehensive testing (2 hours)
4. Polish UI and add analytics (1 hour)

**Total**: 3 days (24 hours)

---

## ✅ Testing Checklist

### Unit Tests (9 tests)

- [ ] Cost allocation calculation (labor, materials, overhead)
- [ ] Budget variance calculation (actual vs. budget)
- [ ] EVM metrics calculation (CPI, SPI, EAC, VAC)
- [ ] % completion calculation (for WIP revenue recognition)
- [ ] Forecast to complete calculation
- [ ] Phase completion aggregation
- [ ] Profit margin calculation
- [ ] Multi-currency cost conversion
- [ ] Time cost allocation (hourly rates × hours)

### Integration Tests (6 tests)

- [ ] Project creation → appears in list
- [ ] Cost posting → updates project costing dashboard
- [ ] Time entry integration → updates labor costs
- [ ] Budget threshold → triggers alert
- [ ] Project close → finalizes costs and WIP
- [ ] EVM calculation → uses correct formulas

### E2E Tests (7 flows)

- [ ] User can create new project
- [ ] User can view project costing dashboard
- [ ] User can analyze budget vs. actual
- [ ] Budget alerts trigger and display correctly
- [ ] Time tracking integrates with project costs
- [ ] User can close project
- [ ] WIP revenue recognition calculates correctly

### Accessibility Tests

- [ ] Keyboard navigation works (all charts and tables accessible)
- [ ] Screen reader announces budget alerts
- [ ] Focus management correct (modals, forms)
- [ ] Color contrast meets WCAG 2.2 AA
- [ ] Axe: 0 serious/critical violations

### Contract Tests

- [ ] API calls match OpenAPI spec
- [ ] Generated types match API responses

### Visual Regression Tests

- [ ] Storybook snapshots for costing dashboard
- [ ] Budget variance charts
- [ ] Project status badges

### Performance Tests

- [ ] Bundle size < 250KB gzipped
- [ ] Costing dashboard loads < 2s
- [ ] Budget calculation < 1s
- [ ] Project list (100+ projects) renders smoothly

---

## 📅 Timeline & Milestones

| Day | Tasks                                    | Deliverable                         | Flag Status |
| --- | ---------------------------------------- | ----------------------------------- | ----------- |
| 1   | Setup + Project CRUD + Costing Dashboard | Basic project management functional | WIP         |
| 2   | Budget Analysis + EVM + Time Integration | Budget tracking complete            | WIP         |
| 3   | WIP Revenue Recognition + Tests + Polish | Production-ready module             | GA          |

**Total Effort**: 3 days (24 hours)

**Feature Flags**:

- Day 1-2: `flags.m34_projects = false` (hidden)
- Day 3: `flags.m34_projects = true` after all tests pass
- Post-launch: Enable `m34_projects_evm` and `m34_projects_wip` incrementally

---

## 🔗 Dependencies

### Must Complete Before Starting

- ✅ M1: Core Ledger (for cost posting)
- ✅ M2: Journal Entries (for WIP journal entries)
- ✅ M35: Time & Expenses (for time integration)
- ✅ M12: Revenue Recognition (for ASC 606 compliance)
- 🆕 Feature flag service
- 🆕 Analytics provider
- 🆕 Budget alert notification system

### Blocks These Modules

- Enhanced M12: Revenue Recognition (WIP calculations)
- Enhanced M37: Sales Orders (project billing)
- Enhanced M36: Purchase Orders (project materials tracking)
- M40: API Gateway (project-related APIs)

---

## 🎯 Success Criteria

### Must Have (Measurable)

- [ ] Display all projects with real-time costing
- [ ] Create/edit/close projects with validation
- [ ] Budget vs. actual tracking with variance analysis
- [ ] Cost allocation from time/expenses (100% accurate)
- [ ] Budget alerts trigger at 80% threshold
- [ ] EVM metrics (CPI/SPI) calculated correctly
- [ ] Dashboard loads < 2s (P95)
- [ ] Axe: 0 serious/critical violations

### Should Have

- [ ] WIP revenue recognition per ASC 606
- [ ] Forecast-to-complete calculation
- [ ] Profitability analysis by project
- [ ] Phase/task-level costing
- [ ] Multi-project portfolio view
- [ ] Export to Excel/CSV

### Nice to Have

- [ ] AI-powered cost prediction
- [ ] Resource allocation optimization
- [ ] Project portfolio optimization
- [ ] Gantt chart visualization
- [ ] Risk scoring by project

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/projects`, `/projects/[id]`, `/projects/costing`)
- [ ] All CRUD operations working (Create, Read, Update, Close)
- [ ] Cost allocation from time/expenses automated
- [ ] Budget tracking with alerts (80% and 100% thresholds)
- [ ] EVM metrics calculated correctly
- [ ] Time integration working
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

- [ ] Unit tests: ≥95% line coverage (calculation-heavy module)
- [ ] Integration tests: All project workflows covered
- [ ] E2E tests: All user flows covered (create → cost → close)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Cost calculation logic
- Budget variance calculation
- EVM metrics calculation
- WIP revenue recognition

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/projects/*` routes
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/projects`
- [ ] Costing dashboard: Load < 2s
- [ ] Budget calculation: < 1s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Calculation Accuracy 💯

**CRITICAL - 100% accuracy for all project accounting calculations required before production!**

- [ ] Cost allocation accuracy verified by accounting team
- [ ] Budget variance calculations match manual calculations
- [ ] EVM metrics (CPI/SPI) validated against PMBOK formulas
- [ ] WIP revenue recognition per ASC 606 (external audit validation)
- [ ] Time cost allocation matches payroll data
- [ ] Multi-currency conversion accurate

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `Projects.Created`
  - `Projects.CostUpdated`
  - `Projects.BudgetAlert`
  - `Projects.PhaseCompleted`
  - `Projects.Closed`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (cost errors, budget alerts, dashboard latency)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Rate limiting tested (calculation endpoints)
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] Audit trail for all cost/budget changes

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
  - `flags.m34_projects = false` (ready to enable)
  - `flags.m34_projects_evm = false` (phase 2)
  - `flags.m34_projects_wip = false` (phase 2)
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
- [ ] **Accounting**: Cost calculations verified
- [ ] **Finance Lead**: WIP revenue recognition validated

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M33 - Sale-Leaseback  
**Next**: M35 - Time & Expenses
