# 🚀 M20: Close Management - UI Implementation Runbook

**Module ID**: M20  
**Module Name**: Close Management  
**Priority**: CRITICAL  
**Phase**: 6 - Compliance & Controls  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Close Management provides **financial close process management** with task tracking, approvals, and close calendar automation for faster month-end closes.

### Business Value

- Structured financial close process
- Task assignment and tracking
- Approval workflows and sign-offs
- Close metrics and analytics
- Integration with all GL modules

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-close-checklist], [ADR-###-close-calendar], [ADR-###-close-metrics]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 24 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/close/periods` - List close periods
- ✅ `/api/close/tasks` - Close task management
- ✅ `/api/close/checklist` - Get checklist for period
- ✅ `/api/close/calendar` - Close calendar view
- ✅ `/api/close/metrics` - Close performance metrics
- ✅ `/api/close/approvals` - Approval workflow
- ✅ `/api/close/rollforward` - Rollforward automation
- ✅ `/api/close/templates` - Close task templates

**Total Endpoints**: 24 (8 main + 16 sub-endpoints)

### Risks & Blockers

| Risk                            | Impact | Mitigation                                                       | Owner    |
| ------------------------------- | ------ | ---------------------------------------------------------------- | -------- |
| Task dependency complexity      | HIGH   | Visual dependency mapping; dry-run validator; circular detection | @backend |
| Close timeline delays           | HIGH   | Real-time progress tracking; bottleneck alerts; escalation       | @ops     |
| Multi-user task conflicts       | MED    | Optimistic locking; conflict resolution UI; audit trail          | @backend |
| Historical close data integrity | MED    | Immutable close snapshots; version tracking; backup/restore      | @ops     |

---

## 🎯 3 Killer Features

### 1. **Interactive Close Checklist** ✅

**Description**: Dynamic close checklist with task dependencies, assignments, and real-time status tracking in Kanban-style board.

**Why It's Killer**:

- Visual task board (Kanban-style)
- Automated task dependencies
- Real-time completion tracking
- Mobile task updates
- Better than Trintech's static checklists

**Implementation**:

```typescript
import { Kanban, Card, Badge, Button } from "aibos-ui";

export default function CloseChecklist() {
  const { tasks, updateTask } = useCloseTasks();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2>Month-End Close - October 2025</h2>
        <div className="flex gap-4">
          <Badge variant="info">
            {tasks.completed}/{tasks.total} Complete
          </Badge>
          <Badge variant="warning">
            Day {tasks.days_elapsed} of {tasks.target_days}
          </Badge>
        </div>
      </div>

      <Kanban
        columns={[
          { id: "not_started", title: "Not Started", color: "gray" },
          { id: "in_progress", title: "In Progress", color: "blue" },
          { id: "review", title: "Under Review", color: "orange" },
          { id: "completed", title: "Completed", color: "green" },
        ]}
        tasks={tasks.list.map((task) => ({
          id: task.id,
          title: task.name,
          column: task.status,
          assignee: task.owner,
          dueDate: task.due_date,
          dependencies: task.dependencies,
          priority: task.priority,
          renderCard: (task) => (
            <Card className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4>{task.title}</h4>
                  <p className="text-sm text-muted">{task.assignee}</p>
                </div>
                <Badge
                  variant={task.priority === "High" ? "destructive" : "default"}
                >
                  {task.priority}
                </Badge>
              </div>
              <div className="mt-2">
                <Badge variant="outline">{task.dueDate}</Badge>
                {task.dependencies.length > 0 && (
                  <span className="text-sm text-muted ml-2">
                    ⏳ {task.dependencies.length} blockers
                  </span>
                )}
              </div>
            </Card>
          ),
        }))}
        onTaskMove={updateTask}
      />
    </div>
  );
}
```

### 2. **Close Calendar with Gantt View** 📅

**Description**: Visual close calendar showing all tasks across timeline with critical path analysis and drag-to-reschedule.

**Why It's Killer**:

- Gantt chart visualization
- Critical path identification
- Drag-to-reschedule tasks
- Historical close time tracking
- Industry-first visual close calendar

**Implementation**:

```typescript
import { Gantt, Card, Chart } from "aibos-ui";

export default function CloseCalendar() {
  const { schedule } = useCloseSchedule();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Target Close Date</h3>
          <div className="text-2xl">{schedule.target_date}</div>
        </Card>
        <Card>
          <h3>Projected Close</h3>
          <div className="text-2xl">{schedule.projected_date}</div>
        </Card>
        <Card>
          <h3>Days Remaining</h3>
          <div className="text-3xl">{schedule.days_remaining}</div>
        </Card>
        <Card>
          <h3>On-Time Probability</h3>
          <div className="text-3xl text-green-600">
            {schedule.on_time_probability}%
          </div>
        </Card>
      </div>

      <Gantt
        tasks={schedule.tasks.map((task) => ({
          id: task.id,
          name: task.name,
          start: task.start_date,
          end: task.due_date,
          progress: task.completion_pct,
          dependencies: task.dependencies,
          critical: task.is_critical_path,
          owner: task.owner,
        }))}
        onTaskUpdate={(taskId, updates) => rescheduleTask(taskId, updates)}
        highlightCriticalPath
      />

      <Card>
        <h3>Critical Path Tasks</h3>
        <div className="space-y-2">
          {schedule.critical_path.map((task) => (
            <div
              key={task.id}
              className="flex justify-between items-center p-2 bg-red-50 rounded"
            >
              <span>{task.name}</span>
              <Badge variant="destructive">Critical</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

### 3. **Close Metrics Dashboard** 📊

**Description**: Real-time close performance metrics with trend analysis, bottleneck identification, and benchmarking.

**Why It's Killer**:

- Days-to-close tracking
- Task completion velocity
- Bottleneck identification
- Period-over-period comparison
- Better than manual close tracking

**Implementation**:

```typescript
import { Chart, Card, DataTable, Badge } from "aibos-ui";

export default function CloseMetrics() {
  const { metrics } = useCloseMetrics();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Avg Days to Close</h3>
          <div className="text-4xl">{metrics.avg_days}</div>
          <Badge
            variant={metrics.trend === "improving" ? "success" : "warning"}
          >
            {metrics.trend === "improving" ? "↓" : "↑"} {metrics.trend_pct}% vs
            last quarter
          </Badge>
        </Card>
        <Card>
          <h3>This Month Progress</h3>
          <div className="text-4xl">{metrics.current_progress}%</div>
          <div className="text-sm text-muted">
            Day {metrics.day} of {metrics.target_days}
          </div>
        </Card>
        <Card>
          <h3>On-Time Close Rate</h3>
          <div className="text-4xl">{metrics.on_time_rate}%</div>
          <div className="text-sm text-muted">Last 12 months</div>
        </Card>
      </div>

      <Chart
        type="line"
        data={metrics.historical}
        series={[
          { key: "days_to_close", label: "Days to Close", color: "blue" },
          { key: "target", label: "Target", color: "green", style: "dashed" },
        ]}
        title="Close Performance Trend (12 Months)"
      />

      <Card>
        <h3>Bottleneck Analysis</h3>
        <DataTable
          data={metrics.bottlenecks}
          columns={[
            { key: "task_category", label: "Category" },
            { key: "avg_hours", label: "Avg Hours" },
            { key: "variance", label: "Variance" },
            { key: "owner", label: "Owner" },
            {
              key: "impact",
              label: "Impact",
              render: (val) => (
                <Badge variant={val === "High" ? "destructive" : "warning"}>
                  {val}
                </Badge>
              ),
            },
          ]}
        />
      </Card>

      <Chart
        type="bar"
        data={metrics.by_department}
        title="Completion Rate by Department"
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
**File**: `apps/web/app/(dashboard)/close/tasks/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                   | Target          | Measurement          |
| ------------------------ | --------------- | -------------------- |
| TTFB (staging)           | ≤ 70ms          | Server timing header |
| Client TTI for `/close`  | ≤ 200ms         | Lighthouse CI        |
| Checklist load           | < 1s            | Performance profiler |
| Task update (optimistic) | < 100ms         | User perception      |
| Gantt chart render       | < 2s            | Performance profiler |
| UI bundle size           | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to Kanban, Gantt, task management
- **Focus Management**: Focus trap in modals; visible indicators
- **ARIA**: Live regions for task updates; proper roles for Kanban/Gantt
- **Screen Reader**: All tasks and status changes announced; close progress communicated
- **Axe Target**: 0 serious/critical violations
- **Drag-and-Drop**: Keyboard alternative for task moves (button-based)

### Security

| Layer          | Requirement                                                |
| -------------- | ---------------------------------------------------------- |
| RBAC Scopes    | `close.read`, `close.task`, `close.approve`, `close.admin` |
| Enforcement    | Server-side on all endpoints                               |
| Data Exposure  | Only show tasks/data for authorized entities               |
| Sensitive Data | Mask sensitive close data for non-finance users            |
| Audit Trail    | All task updates, approvals logged                         |

#### UI Permissions Matrix

| Role          | View | Task Update | Approve | Rollforward | Admin |
| ------------- | ---- | ----------- | ------- | ----------- | ----- |
| close.read    | ✅   | ❌          | ❌      | ❌          | ❌    |
| close.task    | ✅   | ✅          | ❌      | ❌          | ❌    |
| close.approve | ✅   | ✅          | ✅      | ❌          | ❌    |
| close.admin   | ✅   | ✅          | ✅      | ✅          | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful task updates; 100% close accuracy
- **SLA Dashboards**: Real-time metrics on close progress, task completion
- **Events Emitted**: `Close.TaskUpdated`, `Close.Approved`, `Close.Completed`
- **Logging**: Structured logs with correlation IDs for all close operations
- **Tracing**: Distributed tracing for close workflows
- **Monitoring**: Close progress; task completion velocity; bottleneck detection

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Close Management Rules

| Rule                   | Enforcement                                                 |
| ---------------------- | ----------------------------------------------------------- |
| **Close Period**       | One active close per entity per period                      |
| **Task Dependencies**  | Tasks with dependencies cannot complete until blockers done |
| **Approval Workflow**  | Tasks requiring approval cannot close without sign-off      |
| **Close Finalization** | All critical tasks must complete before period close        |
| **Rollforward Rules**  | Only approved closes can be rolled forward                  |
| **Task Ownership**     | Each task has one primary owner (can have collaborators)    |
| **Close Snapshot**     | Immutable snapshot created on finalization                  |
| **Reopening Rules**    | Closed periods can reopen with approval + audit trail       |

### Currency & Rounding

- **Display**: Show all amounts in entity's functional currency
- **Close Metrics**: Days-to-close, task completion %, on-time rate
- **Date Handling**: Track start date, target date, actual close date

### Archive Semantics

- **Historical Closes**: Retain all close history indefinitely
- **Task History**: Maintain full audit trail of all task updates
- **Guard Rails**:
  - ❌ Deny delete of closed periods
  - ❌ Deny delete of approved tasks
  - ✅ Allow archive of incomplete/cancelled closes

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                             | User Action     |
| --------------------- | -------------------------------------- | --------------- |
| **Empty**             | "No active close"                      | "Start Close"   |
| **Loading**           | Skeleton checklist                     | N/A             |
| **Error**             | Error message + retry                  | Retry / Support |
| **In Progress**       | Kanban with task cards                 | Update tasks    |
| **Blocked**           | Orange badge "Waiting on dependencies" | View blockers   |
| **Under Review**      | Yellow badge "Under Review"            | Approve/Reject  |
| **Approved**          | Green badge "Approved"                 | N/A             |
| **Completed**         | Green checkmark "Completed"            | View details    |
| **Overdue**           | Red badge "Overdue"                    | Escalate        |
| **On Track**          | Green indicator "On Track"             | N/A             |
| **At Risk**           | Yellow indicator "At Risk"             | Review critical |
| **Delayed**           | Red indicator "Delayed"                | Escalate        |
| **Permission Denied** | "Access restricted"                    | Back            |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Real-time Validation**: Check task dependencies, approval requirements
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal

### Network Errors

| HTTP Status | UI Message                                          | Action              |
| ----------- | --------------------------------------------------- | ------------------- |
| 400         | "Invalid task data. Check your input."              | Inline field errors |
| 401         | "Session expired. Please log in again."             | Redirect to login   |
| 403         | "You don't have permission for this action."        | Hide action         |
| 404         | "Task not found."                                   | Return to list      |
| 409         | "Task was updated by another user. Review changes." | Show conflict modal |
| 422         | "Validation failed: Task dependencies not met."     | Inline errors       |
| 500         | "Close update failed. Our team has been notified."  | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/close.json`.

### Page Titles & Headers

| Context         | Copy                | i18n Key                |
| --------------- | ------------------- | ----------------------- |
| Main Page       | "Close Management"  | `close.main.title`      |
| Close Checklist | "Close Checklist"   | `close.checklist.title` |
| Close Calendar  | "Close Calendar"    | `close.calendar.title`  |
| Close Metrics   | "Close Performance" | `close.metrics.title`   |
| Task Detail     | "Task Details"      | `close.task.title`      |

### State Messages

| State             | Title                  | Message                                             | Action Button       | i18n Key                   |
| ----------------- | ---------------------- | --------------------------------------------------- | ------------------- | -------------------------- |
| Empty             | "No active close"      | "Start your month-end close process"                | "Start Close"       | `close.empty.*`            |
| Loading           | —                      | —                                                   | —                   | —                          |
| Error             | "Unable to load close" | "Something went wrong. Our team has been notified." | "Retry" / "Support" | `close.error.*`            |
| In Progress       | "Close in progress"    | "{progress}% complete • Day {day} of {target}"      | —                   | `close.inProgress.*`       |
| Blocked           | "Task blocked"         | "Waiting on {count} dependencies"                   | "View Blockers"     | `close.blocked.*`          |
| Under Review      | "Pending approval"     | "Submitted for approval by {approver}"              | —                   | `close.underReview.*`      |
| Approved          | "Task approved"        | "Approved by {approver} on {date}"                  | —                   | `close.approved.*`         |
| Completed         | "Task completed"       | "Completed by {owner} on {date}"                    | "View Details"      | `close.completed.*`        |
| Overdue           | "Task overdue"         | "Due {days} days ago"                               | "Escalate"          | `close.overdue.*`          |
| On Track          | "On track"             | "Close projected to complete on time"               | —                   | `close.onTrack.*`          |
| At Risk           | "At risk"              | "{count} critical tasks at risk"                    | "Review Critical"   | `close.atRisk.*`           |
| Delayed           | "Close delayed"        | "Projected {days} days late"                        | "Escalate"          | `close.delayed.*`          |
| Permission Denied | "Access restricted"    | "You don't have permission for close management"    | "Back"              | `close.permissionDenied.*` |

### Action Confirmations

| Action         | Title             | Message                                                       | Confirm Button | Cancel Button | i18n Key                      |
| -------------- | ----------------- | ------------------------------------------------------------- | -------------- | ------------- | ----------------------------- |
| Start Close    | "Start close?"    | "Begin month-end close for {period}?"                         | "Start"        | "Cancel"      | `close.start.confirm.*`       |
| Finalize Close | "Finalize close?" | "Finalize close for {period}? This action cannot be undone."  | "Finalize"     | "Cancel"      | `close.finalize.confirm.*`    |
| Reopen Close   | "Reopen close?"   | "Reopen {period}? This requires approval and will be logged." | "Reopen"       | "Cancel"      | `close.reopen.confirm.*`      |
| Approve Task   | "Approve task?"   | "Approve '{task}' for close?"                                 | "Approve"      | "Cancel"      | `close.approve.confirm.*`     |
| Rollforward    | "Roll forward?"   | "Roll forward close template to next period?"                 | "Roll Forward" | "Cancel"      | `close.rollforward.confirm.*` |

### Success Messages (Toast)

| Action               | Message                                          | i18n Key                    |
| -------------------- | ------------------------------------------------ | --------------------------- |
| Close Started        | "Close started for {period}"                     | `close.start.success`       |
| Task Updated         | "Task '{name}' updated successfully"             | `close.taskUpdate.success`  |
| Task Approved        | "Task approved by {approver}"                    | `close.approve.success`     |
| Close Finalized      | "Close finalized for {period}"                   | `close.finalize.success`    |
| Rollforward Complete | "Close template rolled forward to {next_period}" | `close.rollforward.success` |

### Error Messages (Toast)

| Scenario             | Message                                               | i18n Key                      |
| -------------------- | ----------------------------------------------------- | ----------------------------- |
| Start Failed         | "Failed to start close. Check prerequisites."         | `close.start.error`           |
| Task Update Failed   | "Failed to update task. Try again."                   | `close.taskUpdate.error`      |
| Dependencies Not Met | "Cannot complete: {count} dependencies not met."      | `close.errorDependencies`     |
| Approval Required    | "Task requires approval before completion."           | `close.errorApprovalRequired` |
| Already Finalized    | "Close already finalized for {period}."               | `close.errorAlreadyFinalized` |
| Permission Denied    | "You don't have permission for this action."          | `close.errorPermission`       |
| Network Error        | "Network error. Check your connection and try again." | `close.error.network`         |

### Form Labels & Help Text

| Field                | Label          | Placeholder           | Help Text                                 | i18n Key                     |
| -------------------- | -------------- | --------------------- | ----------------------------------------- | ---------------------------- |
| Task Name            | "Task Name"    | "e.g., Bank Rec"      | "Descriptive name for this task"          | `close.field.taskName.*`     |
| Owner                | "Task Owner"   | "Select owner"        | "Person responsible for completing task"  | `close.field.owner.*`        |
| Due Date             | "Due Date"     | "YYYY-MM-DD"          | "Target completion date"                  | `close.field.dueDate.*`      |
| Priority             | "Priority"     | "Select priority"     | "Task urgency level"                      | `close.field.priority.*`     |
| Dependencies         | "Dependencies" | "Select dependencies" | "Tasks that must complete first"          | `close.field.dependencies.*` |
| Target Days to Close | "Target Days"  | "5"                   | "Target number of days to complete close" | `close.field.targetDays.*`   |

### Keyboard Shortcuts Help

| Shortcut | Description          | i18n Key                     |
| -------- | -------------------- | ---------------------------- |
| `/`      | "Focus search"       | `close.shortcuts.search`     |
| `c`      | "Start new close"    | `close.shortcuts.startClose` |
| `k`      | "View checklist"     | `close.shortcuts.checklist`  |
| `g`      | "View Gantt"         | `close.shortcuts.gantt`      |
| `m`      | "View metrics"       | `close.shortcuts.metrics`    |
| `a`      | "Approve selected"   | `close.shortcuts.approve`    |
| `↑ / ↓`  | "Navigate tasks"     | `close.shortcuts.navigate`   |
| `Enter`  | "Open selected"      | `close.shortcuts.open`       |
| `Escape` | "Close modal/cancel" | `close.shortcuts.cancel`     |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useClose.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useClosePeriods() {
  return useQuery({
    queryKey: ["close", "periods"],
    queryFn: () => apiClient.GET("/api/close/periods"),
    staleTime: 60_000, // 1min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useCloseTasks(periodId: string) {
  return useQuery({
    queryKey: ["close", "tasks", periodId],
    queryFn: () =>
      apiClient.GET("/api/close/tasks", { query: { period_id: periodId } }),
    staleTime: 30_000, // 30s - frequent updates
    refetchInterval: 30_000, // Poll every 30s for real-time updates
    enabled: !!periodId,
    select: (response) => response.data,
  });
}

export function useStartClose() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { period: string; template_id?: string }) =>
      apiClient.POST("/api/close/start", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["close"] });
      toast.success(`Close started for ${data.period}`);
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Failed to start close. Check prerequisites.");
      } else {
        toast.error("Close start failed.");
      }
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      task_id: string;
      status?: string;
      notes?: string;
      completion_pct?: number;
    }) =>
      apiClient.PUT("/api/close/tasks/[id]", {
        params: { id: data.task_id },
        body: data,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["close", "tasks"] });
      toast.success(`Task '${data.name}' updated successfully`);
    },
    onError: () => {
      toast.error("Failed to update task. Try again.");
    },
  });
}

export function useApproveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { task_id: string; notes?: string }) =>
      apiClient.POST("/api/close/approvals", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["close", "tasks"] });
      toast.success(`Task approved by ${data.approver}`);
    },
    onError: () => {
      toast.error("Approval failed.");
    },
  });
}

export function useFinalizeClose() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { period_id: string }) =>
      apiClient.POST("/api/close/finalize", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["close"] });
      toast.success(`Close finalized for ${data.period}`);
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Cannot finalize: Critical tasks incomplete.");
      } else {
        toast.error("Finalization failed.");
      }
    },
  });
}

export function useCloseMetrics(periodId?: string) {
  return useQuery({
    queryKey: ["close", "metrics", periodId],
    queryFn: () =>
      apiClient.GET("/api/close/metrics", { query: { period_id: periodId } }),
    staleTime: 60_000, // 1min
    select: (response) => response.data,
  });
}

export function useRollforward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { from_period: string; to_period: string }) =>
      apiClient.POST("/api/close/rollforward", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["close"] });
      toast.success(`Template rolled forward to ${data.to_period}`);
    },
    onError: () => {
      toast.error("Rollforward failed.");
    },
  });
}
```

### Error Mapping

| API Error         | User Message                                        | UI Action            |
| ----------------- | --------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid task data. Check your input."              | Inline field errors  |
| 409 (Conflict)    | "Task was updated by another user. Review changes." | Show conflict modal  |
| 422 (Validation)  | "Validation failed: Task dependencies not met."     | Inline errors        |
| 403 (Forbidden)   | "You don't have permission for this action."        | Hide action          |
| 500 (Server)      | "Close update failed. Our team has been notified."  | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Task Polling**: 30s interval; stop polling after 5min inactivity

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["close", "periods"][("close", "tasks", periodId)][
  ("close", "metrics", periodId)
][("close", "calendar", periodId)];
```

### Invalidation Rules

| Action         | Invalidates          |
| -------------- | -------------------- |
| Start Close    | `["close"]` (all)    |
| Update Task    | `["close", "tasks"]` |
| Approve Task   | `["close", "tasks"]` |
| Finalize Close | `["close"]` (all)    |
| Rollforward    | `["close"]` (all)    |

### Stale Time

| Query Type | Stale Time | Reasoning                            |
| ---------- | ---------- | ------------------------------------ |
| Periods    | 1min       | Changes infrequently                 |
| Tasks      | 30s        | Frequent updates; real-time tracking |
| Metrics    | 1min       | Updated periodically                 |
| Calendar   | 1min       | Schedule changes infrequently        |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("close-periods");
revalidateTag("close-tasks");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/close.fixtures.ts`

**Datasets**:

- `minimalClose`: Single period, 10 tasks
- `standardClose`: Full close with 30 tasks, dependencies, approvals
- `complexClose`: Multi-entity, 50+ tasks, critical path
- `edgeCases`: Edge cases (overdue tasks, circular dependencies, conflicts)

**Edge Cases Covered**:

- Task with circular dependencies
- Overdue critical task
- Multi-user task conflict
- Approval workflow (pending, approved, rejected)
- Dependency blocking task completion
- Close rollforward scenarios

```typescript
// Example fixture
export const standardCloseFixture: CloseFixture = {
  period_id: "2025-10",
  status: "in_progress",
  start_date: "2025-10-31",
  target_date: "2025-11-05",
  projected_date: "2025-11-04",
  days_elapsed: 3,
  target_days: 5,
  completion_pct: 60,
  tasks: [
    {
      id: "task_1",
      name: "Bank Reconciliation",
      owner: "john@example.com",
      status: "completed",
      due_date: "2025-11-01",
      priority: "High",
      dependencies: [],
      is_critical_path: true,
    },
    // ... more tasks
  ],
};
```

### E2E Seed Data

**Location**: `tests/seeds/close.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:close
```

**Dataset**:

- 3 close periods (current, previous 2 months)
- Complete task workflow (not started → in progress → review → approved → completed)
- Approval workflows
- Historical close metrics

**Cleanup Command**:

```powershell
pnpm run seed:close:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic "Demo Corp" close process
- 25 tasks covering all functional areas (GL, AP, AR, Bank Rec, etc.)
- Task dependencies and approvals configured
- Historical close data (last 6 months) with improving trend
- Critical path examples

**Regeneration**:

```powershell
pnpm run demo:reset:close
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] No circular dependencies in task graph
- [ ] All task owners exist
- [ ] Critical tasks identified correctly
- [ ] Close metrics calculations accurate

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
- **Interactive Parts**: Mark with `"use client"` (Kanban, Gantt, task updates)

### Data Fetching Strategy

| Scenario          | Strategy                               | Benefit             |
| ----------------- | -------------------------------------- | ------------------- |
| Initial Checklist | Server-side fetch + stream             | Faster TTFB         |
| Task Updates      | Client-side with optimistic updates    | Instant feedback    |
| Metrics           | Server component with client charts    | SEO + interactivity |
| Calendar          | Client component for Gantt interaction | Rich interactivity  |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function updateTask(data) {
  // ... mutation logic
  revalidateTag("close-tasks");
}
```

---

## 📊 Analytics & Audit Events

| Event              | When               | Properties                                        |
| ------------------ | ------------------ | ------------------------------------------------- |
| Close.Started      | Close initiated    | `period`, `template_id`, `user_id`                |
| Close.TaskUpdated  | Task status change | `task_id`, `old_status`, `new_status`, `user_id`  |
| Close.TaskApproved | Task approved      | `task_id`, `approver_id`, `approval_date`         |
| Close.Finalized    | Close finalized    | `period`, `actual_days`, `total_tasks`, `on_time` |
| Close.Reopened     | Close reopened     | `period`, `reason`, `approver_id`                 |
| Close.Rollforward  | Template rolled    | `from_period`, `to_period`, `task_count`          |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Close.Finalized", {
  period: "2025-10",
  actual_days: 4,
  total_tasks: 30,
  on_time: true,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/close.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Task Names**: Support international characters
- **RTL Support**: CSS logical properties; test with Arabic locale

### Keyboard Shortcuts

| Key      | Action             | Scope      |
| -------- | ------------------ | ---------- |
| `/`      | Focus search       | Any page   |
| `c`      | Start new close    | Close list |
| `k`      | View checklist     | Any page   |
| `g`      | View Gantt         | Any page   |
| `m`      | View metrics       | Any page   |
| `a`      | Approve selected   | Task list  |
| `↑ / ↓`  | Navigate tasks     | Task list  |
| `Enter`  | Open selected      | Task list  |
| `Escape` | Close modal/cancel | Modal/Form |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["c", () => startClose()],
  ["k", () => router.push("/close/checklist")],
  ["g", () => router.push("/close/calendar")],
  ["m", () => router.push("/close/metrics")],
  ["a", () => approveTask()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                   | Duration | Rollback Trigger |
| ----------- | ---------------- | -------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                   | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, close accuracy 100%            | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, task updates work, no data loss | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained           | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m20_close: false,              // Master toggle
  m20_close_kanban: false,       // Kanban view
  m20_close_gantt: false,        // Gantt calendar
  m20_close_approvals: false,    // Approval workflow
  m20_close_rollforward: false,  // Rollforward automation
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/close/*`)
- P50/P95/P99 latency
- Task update success rate
- Close completion rate (100% required)
- Average days-to-close
- Task bottleneck alerts

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Task update failure > 5% → investigate
- Close finalization failure → immediate escalation (critical)
- Days-to-close trend worsening → alert finance team

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m20_close = false`

   ```powershell
   pnpm run flags:set m20_close=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("close-periods");
   revalidateTag("close-tasks");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/close/*"
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
| Task data loss             | Immediate rollback | No (auto-trigger) |
| Close finalization failure | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%            | Partial rollback   | On-call engineer  |
| Task update delays > 5s    | Investigate first  | On-call engineer  |
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

- BlackLine: Close management process
- Trintech: Close checklist automation
- FloQast: Close calendar
- Workiva: Close collaboration

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Task Dependency Complexity

**Mitigation**: Visual dependency mapping; dry-run validator; circular dependency detection; clear dependency visualization in UI

### Risk #2: Close Timeline Delays

**Mitigation**: Real-time progress tracking; bottleneck alerts; escalation workflow; predictive analytics for delays

### Risk #3: Multi-User Task Conflicts

**Mitigation**: Optimistic locking with conflict detection; conflict resolution UI; comprehensive audit trail; real-time collaboration indicators

### Risk #4: Historical Close Data Integrity

**Mitigation**: Immutable close snapshots on finalization; version tracking; automated backups; point-in-time recovery; validation checks in CI

---

## 📝 Implementation Guide

### Day 1: Checklist & Tasks (8 hours)

1. Build close checklist with Kanban board (5 hours)
2. Implement task management CRUD (2 hours)
3. Add task dependency logic (1 hour)

### Day 2: Calendar, Metrics & Rollforward (8 hours)

1. Implement close calendar with Gantt chart (4 hours)
2. Build close metrics dashboard (3 hours)
3. Add rollforward automation (1 hour)

**Total**: 2 days (16 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Task dependency validation (circular detection)
- [ ] Close metrics calculations (days-to-close, completion %)
- [ ] Critical path identification
- [ ] Task ownership validation
- [ ] useCloseTasks hook fetches correctly
- [ ] Date formatting displays correctly

### Integration Tests

- [ ] Start close → tasks created
- [ ] Update task → status changes
- [ ] Approve task → approval recorded
- [ ] Finalize close → snapshot created
- [ ] Rollforward → tasks copied to next period
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] User can navigate to close page
- [ ] User can start close
- [ ] User can view checklist (Kanban)
- [ ] User can update tasks
- [ ] User can approve tasks
- [ ] User can view calendar (Gantt)
- [ ] User can view metrics
- [ ] User can finalize close
- [ ] Keyboard-only flow: navigate → start → update → approve
- [ ] Complete close cycle executes correctly

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Kanban keyboard accessible
- [ ] Gantt chart keyboard accessible
- [ ] Drag-and-drop keyboard alternative (button-based task moves)
- [ ] Screen reader announces tasks and status
- [ ] Focus management correct (modals, forms, Kanban)
- [ ] Color contrast meets WCAG 2.2 AA (AAA where practical)
- [ ] Axe: 0 serious/critical violations
- [ ] Progress indicators are accessible

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] All API endpoints return expected status codes

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for checklist, calendar, metrics
- [ ] Dark/light theme variations
- [ ] Task status states captured
- [ ] Loading/error/empty states captured

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/close/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] Checklist load < 1s
- [ ] Task update (optimistic) < 100ms
- [ ] Gantt chart render < 2s

---

## 📅 Timeline

| Day | Deliverable                      |
| --- | -------------------------------- |
| 1   | Checklist + Tasks + Dependencies |
| 2   | Calendar + Metrics + Rollforward |

**Total**: 2 days (16 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger (for GL integration)
- ✅ M2: Journal Entries (for close entries)
- ✅ M3: Trial Balance (for balance checks)
- ✅ All GL modules (for close tasks)

### Enables These Modules

- M21: Evidence Management (close documentation)
- M22: Attestation (close sign-offs)
- Reporting modules (close reporting)

---

## 🎯 Success Criteria

### Must Have

- [ ] Close period management (CRUD)
- [ ] Interactive close checklist (Kanban)
- [ ] Task management with dependencies
- [ ] Approval workflow
- [ ] Close calendar (Gantt)
- [ ] Close metrics dashboard
- [ ] Rollforward automation
- [ ] Close completion 100%, Days-to-close tracking

### Should Have

- [ ] AI-powered bottleneck prediction
- [ ] Critical path optimization
- [ ] Historical close comparison
- [ ] Team collaboration features
- [ ] Mobile task updates

### Nice to Have

- [ ] Predictive close date
- [ ] What-if scenario modeling
- [ ] Automated task reminders
- [ ] Visual close reporting

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/close`, `/close/checklist`, `/close/calendar`, `/close/metrics`, `/close/tasks/[id]`)
- [ ] Close period management working
- [ ] Task management CRUD working
- [ ] Kanban checklist working
- [ ] Gantt calendar working
- [ ] Approval workflow working
- [ ] Metrics dashboard working
- [ ] Rollforward automation working
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

- [ ] Unit tests: ≥90% line coverage, ≥95% for critical paths
- [ ] Integration tests: All close operations covered
- [ ] E2E tests: All user flows covered (start → update → approve → finalize)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Start close flow
- Task update flow
- Approval workflow flow
- Finalize close flow
- Rollforward flow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/close/*` routes
- [ ] TTFB: ≤70ms on staging (Server-Timing header)
- [ ] TTI: ≤200ms for `/close` (Lighthouse CI)
- [ ] Checklist load: < 1s
- [ ] Task update (optimistic): < 100ms
- [ ] Gantt chart render: < 2s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues
- [ ] Kanban/Gantt: Keyboard accessible with alternatives

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `Close.Started`
  - `Close.TaskUpdated`
  - `Close.TaskApproved`
  - `Close.Finalized`
  - `Close.Reopened`
  - `Close.Rollforward`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, task update failures, close completion)
- [ ] Close completion monitoring (100% required)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Close data masked for non-finance users
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] All task updates and approvals logged for audit
- [ ] Close snapshots immutable (finalization)

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete (changes, testing, screenshots)
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized (OpenAPI hash verified)
- [ ] i18n keys documented in copy deck
- [ ] User acceptance testing passed (PM/QA sign-off)
- [ ] Close methodology documented

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m20_close = false` (ready to enable)
  - `flags.m20_close_kanban = false` (phase 2)
  - `flags.m20_close_gantt = false` (phase 2)
  - `flags.m20_close_approvals = false` (phase 2)
  - `flags.m20_close_rollforward = false` (phase 2)
- [ ] Smoke tests passed on staging
- [ ] Load tests passed (≥1000 concurrent users, 100 tasks)
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
- [ ] **Finance/Controller**: Close methodology validated, 100% completion accuracy confirmed

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M19 - Multi-Currency  
**Next**: M21 - Evidence Management
