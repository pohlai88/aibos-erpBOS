# 🚀 M29: Operations Automation - UI Implementation Runbook

**Module ID**: M29  
**Module Name**: Operations Automation  
**Priority**: MEDIUM  
**Phase**: 8 - SOX & ITGC  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

M29 provides intelligent process automation for finance operations, including RPA (Robotic Process Automation), workflow orchestration, and task scheduling. This module eliminates manual tasks, reduces errors, and increases operational efficiency across the finance function.

### Business Value

- **Time Savings**: Automates 80% of repetitive finance tasks, saving 500+ hours per month
- **Error Reduction**: RPA reduces manual errors by 95% vs. human data entry
- **Cost Efficiency**: ROI of 400% within first year through labor savings
- **Scale Operations**: Handle 3x transaction volume without additional headcount
- **Employee Satisfaction**: Free finance team from mundane tasks to focus on analysis

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-workflow-automation], [ADR-###-rpa-framework], [ADR-###-process-analytics]

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

**Workflow Management** (6 endpoints):

- ✅ `/api/ops/workflows` - List workflows
- ✅ `/api/ops/workflows/[id]` - Workflow details
- ✅ `/api/ops/workflows/create` - Create workflow
- ✅ `/api/ops/workflows/execute` - Execute workflow
- ✅ `/api/ops/workflows/templates` - Workflow templates
- ✅ `/api/ops/workflows/validate` - Validate workflow

**RPA Management** (6 endpoints):

- ✅ `/api/ops/rpa-tasks` - List RPA tasks
- ✅ `/api/ops/rpa-tasks/[id]` - Task details
- ✅ `/api/ops/rpa-tasks/run` - Execute RPA bot
- ✅ `/api/ops/rpa-tasks/stop` - Stop RPA bot
- ✅ `/api/ops/rpa-tasks/logs` - Bot execution logs
- ✅ `/api/ops/rpa-tasks/schedule` - Schedule bot execution

**Task Scheduling** (3 endpoints):

- ✅ `/api/ops/schedules` - List scheduled tasks
- ✅ `/api/ops/schedules/create` - Create schedule
- ✅ `/api/ops/schedules/update` - Update schedule

**Analytics & Reports** (3 endpoints):

- ✅ `/api/ops/analytics` - Process analytics
- ✅ `/api/ops/analytics/roi` - ROI calculations
- ✅ `/api/ops/analytics/recommendations` - AI recommendations

**Total Endpoints**: 18 (4 categories)

### Risks & Blockers

| Risk                            | Impact | Mitigation                                                   | Owner     |
| ------------------------------- | ------ | ------------------------------------------------------------ | --------- |
| Workflow validation complexity  | HIGH   | Comprehensive validation rules; test harness; dry-run mode   | @ops-eng  |
| RPA bot reliability             | HIGH   | Automatic retry; error handling; human escalation procedures | @rpa-team |
| Third-party integration issues  | MED    | API monitoring; fallback procedures; vendor SLAs             | @it-ops   |
| User adoption for no-code tools | MED    | Training programs; templates library; user guides            | @training |
| Performance at scale            | MED    | Load testing; horizontal scaling; queue management           | @devops   |

---

## 🎯 3 Killer Features

### 1. **Visual Workflow Builder** 🚀

**Description**: Drag-and-drop workflow designer that lets finance teams create automated processes without coding. Features pre-built templates for common tasks (journal entry approvals, invoice processing, reconciliations), conditional logic, and multi-step approvals.

**Why It's Killer**:

- **No-Code**: Finance users build automations without IT (SAP requires consultants at $300/hour)
- **Template Library**: 50+ pre-built workflows for common finance tasks (Oracle has none)
- **Visual Design**: Flowchart interface anyone can understand (vs. code-based tools)
- **Measurable Impact**: Finance teams deploy 10+ new automations per month without IT help
- **Vs UiPath**: Finance-specific templates (UiPath is generic RPA)

**Implementation**:

```typescript
import { Card, Button, WorkflowCanvas, Select } from "aibos-ui";
import { useWorkflows, useSaveWorkflow } from "@/hooks/useOperations";

export default function WorkflowBuilder() {
  const { workflows, templates } = useWorkflows();
  const { save } = useSaveWorkflow();

  const [nodes, setNodes] = useState([
    {
      id: "1",
      type: "start",
      position: { x: 100, y: 100 },
      data: { label: "Start" },
    },
    {
      id: "2",
      type: "task",
      position: { x: 300, y: 100 },
      data: { label: "Approve Invoice" },
    },
    {
      id: "3",
      type: "condition",
      position: { x: 500, y: 100 },
      data: { label: "Amount > $10K?" },
    },
    {
      id: "4",
      type: "task",
      position: { x: 700, y: 50 },
      data: { label: "VP Approval" },
    },
    {
      id: "5",
      type: "task",
      position: { x: 700, y: 150 },
      data: { label: "Auto-Post" },
    },
    {
      id: "6",
      type: "end",
      position: { x: 900, y: 100 },
      data: { label: "End" },
    },
  ]);

  const [edges, setEdges] = useState([
    { id: "e1-2", source: "1", target: "2" },
    { id: "e2-3", source: "2", target: "3" },
    { id: "e3-4", source: "3", target: "4", label: "Yes" },
    { id: "e3-5", source: "3", target: "5", label: "No" },
    { id: "e4-6", source: "4", target: "6" },
    { id: "e5-6", source: "5", target: "6" },
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center">
          <h2>Workflow Builder</h2>
          <div className="flex gap-4">
            <Select
              placeholder="Load Template..."
              options={templates.map((t) => ({ value: t.id, label: t.name }))}
              onChange={(templateId) => loadTemplate(templateId)}
            />
            <Button variant="outline">Test Workflow</Button>
            <Button variant="primary" onClick={() => save({ nodes, edges })}>
              Save Workflow
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Workflow Canvas">
        <WorkflowCanvas
          nodes={nodes}
          edges={edges}
          onNodesChange={setNodes}
          onEdgesChange={setEdges}
          nodeTypes={{
            start: StartNode,
            task: TaskNode,
            condition: ConditionNode,
            end: EndNode,
          }}
          toolbar={
            <div className="flex gap-2 mb-4">
              <Button
                size="sm"
                variant="outline"
                onClick={() => addNode("task")}
              >
                + Task
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addNode("condition")}
              >
                + Condition
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addNode("approval")}
              >
                + Approval
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addNode("notification")}
              >
                + Notification
              </Button>
            </div>
          }
        />
      </Card>

      <Card title="Workflow Templates">
        <div className="grid grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="cursor-pointer hover:shadow-lg">
              <h4>{template.name}</h4>
              <p className="text-sm text-gray-600">{template.description}</p>
              <div className="mt-2">
                <Badge>{template.category}</Badge>
                <Badge variant="outline">{template.steps} steps</Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => loadTemplate(template.id)}
              >
                Use Template
              </Button>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

### 2. **RPA Task Manager** ⚡

**Description**: Comprehensive RPA (Robotic Process Automation) management system that executes automated tasks like data entry, report generation, email processing, and system integrations. Features task monitoring, error handling, and performance analytics.

**Why It's Killer**:

- **Pre-Built Bots**: 30+ finance-specific RPA bots ready to deploy (UiPath requires custom development)
- **Error Handling**: Automatic retry logic and human escalation (competitors crash and require manual restart)
- **Performance Tracking**: See ROI of each bot in real-time (most RPA tools lack this)
- **Measurable Impact**: Typical bot processes 500+ transactions per hour with 99.9% accuracy

**Implementation**:

```typescript
import { Card, Badge, DataTable, Button, Chart } from "aibos-ui";
import { useRPATasks, useRunBot } from "@/hooks/useOperations";

export default function RPATaskManager() {
  const { tasks, stats, performance } = useRPATasks();
  const { runBot, stopBot } = useRunBot();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Active Bots</h3>
          <div className="text-4xl font-bold text-green-600">
            {stats.active_bots}
          </div>
        </Card>
        <Card>
          <h3>Tasks Today</h3>
          <div className="text-4xl font-bold">{stats.tasks_today}</div>
        </Card>
        <Card>
          <h3>Success Rate</h3>
          <div className="text-4xl font-bold text-green-600">
            {stats.success_rate}%
          </div>
        </Card>
        <Card>
          <h3>Time Saved</h3>
          <div className="text-4xl font-bold">{stats.hours_saved}hrs</div>
          <Badge variant="success">This Month</Badge>
        </Card>
      </div>

      <Card title="RPA Bots">
        <DataTable
          data={tasks}
          columns={[
            { key: "bot_name", label: "Bot Name" },
            { key: "description", label: "Description" },
            {
              key: "status",
              label: "Status",
              render: (_, row) => (
                <Badge
                  variant={
                    row.status === "Running"
                      ? "success"
                      : row.status === "Error"
                      ? "error"
                      : "default"
                  }
                >
                  {row.status}
                </Badge>
              ),
            },
            { key: "executions_today", label: "Today's Runs" },
            { key: "success_rate", label: "Success Rate" },
            { key: "avg_duration", label: "Avg Duration" },
            { key: "last_run", label: "Last Run" },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <div className="flex gap-2">
                  {row.status === "Stopped" ? (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => runBot(row.id)}
                    >
                      Start
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="error"
                      onClick={() => stopBot(row.id)}
                    >
                      Stop
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    View Logs
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Bot Performance (Last 30 Days)">
        <Chart
          type="line"
          data={{
            labels: performance.dates,
            datasets: [
              {
                label: "Tasks Completed",
                data: performance.completed,
                borderColor: "rgb(34, 197, 94)",
              },
              {
                label: "Errors",
                data: performance.errors,
                borderColor: "rgb(239, 68, 68)",
              },
            ],
          }}
        />
      </Card>
    </div>
  );
}
```

### 3. **Process Analytics Dashboard** 💎

**Description**: Comprehensive analytics showing automation ROI, process efficiency, bottleneck identification, and time savings. Features predictive analytics to identify processes ready for automation.

**Why It's Killer**:

- **ROI Tracking**: Calculate exact dollar savings from each automation
- **Bottleneck Detection**: AI identifies manual processes slowing down operations
- **Predictive Suggestions**: Recommends next best processes to automate
- **Measurable Impact**: Finance teams can prove automation value to CFO with hard data

**Implementation**:

```typescript
import { Card, Chart, Badge, DataTable } from "aibos-ui";
import { useProcessAnalytics } from "@/hooks/useOperations";

export default function ProcessAnalyticsDashboard() {
  const { analytics, trends, recommendations } = useProcessAnalytics();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Annual Savings</h3>
          <div className="text-4xl font-bold text-green-600">
            ${(analytics.annual_savings / 1000).toFixed(0)}K
          </div>
          <Badge variant="success">↑ 145% vs last year</Badge>
        </Card>
        <Card>
          <h3>Hours Automated</h3>
          <div className="text-4xl font-bold">{analytics.hours_automated}</div>
          <p className="text-sm text-gray-600">This month</p>
        </Card>
        <Card>
          <h3>Process Efficiency</h3>
          <div className="text-4xl font-bold">{analytics.efficiency}%</div>
          <Badge variant="success">↑ 23% improvement</Badge>
        </Card>
        <Card>
          <h3>Active Workflows</h3>
          <div className="text-4xl font-bold">{analytics.active_workflows}</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Time Savings Trend">
          <Chart
            type="bar"
            data={{
              labels: trends.months,
              datasets: [
                {
                  label: "Hours Saved",
                  data: trends.hours_saved,
                  backgroundColor: "rgb(59, 130, 246)",
                },
              ],
            }}
          />
        </Card>

        <Card title="Top Performing Automations">
          <DataTable
            data={analytics.top_automations}
            columns={[
              { key: "name", label: "Automation" },
              {
                key: "executions",
                label: "Executions",
                render: (_, row) => (
                  <Badge variant="info">{row.executions}</Badge>
                ),
              },
              { key: "time_saved", label: "Time Saved" },
              { key: "savings", label: "$ Savings" },
            ]}
          />
        </Card>
      </div>

      <Card title="Automation Recommendations">
        <p className="mb-4 text-gray-600">
          AI-powered suggestions for processes ready for automation:
        </p>
        <DataTable
          data={recommendations}
          columns={[
            { key: "process_name", label: "Process" },
            { key: "current_time", label: "Current Time" },
            { key: "estimated_savings", label: "Est. Savings" },
            {
              key: "complexity",
              label: "Complexity",
              render: (_, row) => (
                <Badge
                  variant={
                    row.complexity === "Low"
                      ? "success"
                      : row.complexity === "Medium"
                      ? "warning"
                      : "error"
                  }
                >
                  {row.complexity}
                </Badge>
              ),
            },
            { key: "roi_months", label: "ROI Timeline" },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <Button size="sm" variant="primary">
                  Create Automation
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

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Main Page (`/ops/dashboard`)

**Components**: Card, Chart, Badge, Button
**File**: `apps/web/app/(dashboard)/ops/page.tsx`

#### 2. Workflow Builder (`/ops/workflows`)

**Components**: WorkflowCanvas, Button, Card
**File**: `apps/web/app/(dashboard)/ops/workflows/page.tsx`

#### 3. RPA Manager (`/ops/rpa`)

**Components**: DataTable, Button, Chart
**File**: `apps/web/app/(dashboard)/ops/rpa/page.tsx`

#### 4. Analytics (`/ops/analytics`)

**Components**: Chart, DataTable, Badge
**File**: `apps/web/app/(dashboard)/ops/analytics/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                | Target          | Measurement          |
| --------------------- | --------------- | -------------------- |
| TTFB (staging)        | ≤ 70ms          | Server timing header |
| Client TTI for `/ops` | ≤ 200ms         | Lighthouse CI        |
| Workflow canvas load  | < 2s            | Performance profiler |
| Workflow execution    | < 5s            | Background job       |
| Bot execution         | < 30s           | Task monitor         |
| Analytics dashboard   | < 1s            | Performance profiler |
| ROI calculation       | < 500ms         | Real-time calc       |
| UI bundle size        | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to workflow builder
- **Focus Management**: Focus trap in modals; workflow node navigation
- **ARIA**: Workflow status announced; bot execution communicated
- **Screen Reader**: All automation data announced; workflows described
- **Axe Target**: 0 serious/critical violations

### Security

| Layer         | Requirement                                             |
| ------------- | ------------------------------------------------------- |
| RBAC Scopes   | `ops.read`, `ops.create`, `ops.execute`, `ops.admin`    |
| Enforcement   | Server-side on all endpoints                            |
| Data Exposure | Encrypt sensitive workflow data; secure bot credentials |
| Audit Trail   | Immutable audit logs for all automation activities      |
| Bot Security  | Secure credential storage; least privilege access       |
| Rate Limiting | Protect workflow execution; prevent abuse               |

#### UI Permissions Matrix

| Role        | View | Create | Execute | Manage Bots | Admin |
| ----------- | ---- | ------ | ------- | ----------- | ----- |
| ops.read    | ✅   | ❌     | ❌      | ❌          | ❌    |
| ops.create  | ✅   | ✅     | ❌      | ❌          | ❌    |
| ops.execute | ✅   | ✅     | ✅      | ✅          | ❌    |
| ops.admin   | ✅   | ✅     | ✅      | ✅          | ✅    |

### Reliability & Observability

- **SLO**: 99.5% workflow execution success; 99.9% bot uptime
- **SLA Dashboards**: Real-time metrics on workflow performance, bot success rate
- **Events Emitted**: `Ops.WorkflowCreated`, `Ops.BotExecuted`, `Ops.ProcessAutomated`
- **Logging**: Structured logs with workflow IDs for all operations
- **Tracing**: Distributed tracing for workflow and bot execution
- **Monitoring**: Workflow success rate; bot performance; ROI tracking

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Operations Automation Rules

| Rule                    | Enforcement                                                |
| ----------------------- | ---------------------------------------------------------- |
| **Workflow Validation** | All workflows validated before execution; dry-run mode     |
| **Bot Execution**       | Automatic retry (3 attempts); human escalation on failure  |
| **Schedule Management** | Timezone-aware scheduling; conflict detection              |
| **Error Handling**      | Automatic rollback on failure; state preservation          |
| **Audit Trail**         | Immutable logs for all automation executions               |
| **Resource Limits**     | Max 100 concurrent workflows; 50 concurrent bots           |
| **Execution Timeout**   | Workflows: 5 min; Bots: 30 min; auto-terminate if exceeded |
| **Success Rate Target** | Maintain ≥99% success rate; investigate failures           |

### Workflow States

- **Workflow**: Draft → Validated → Active → Executing → Completed/Failed → Archived
- **RPA Bot**: Stopped → Starting → Running → Completed/Error → Stopped
- **Schedule**: Inactive → Active → Paused → Archived
- **Execution**: Queued → Running → Completed → Failed → Rolled Back

### Archive Semantics

- **Workflow History**: Retain all execution logs indefinitely
- **Bot Logs**: Retain detailed logs for 90 days; summary forever
- **Audit Trail**: Maintain full audit trail of all operations (7-year minimum)
- **Guard Rails**:
  - ❌ Deny delete of active workflows
  - ❌ Deny delete of running bots
  - ❌ Deny modification of execution history
  - ✅ Allow archive of inactive workflows after 90 days

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                | User Action     |
| --------------------- | ------------------------- | --------------- |
| **Empty**             | "No workflows configured" | "Create"        |
| **Loading**           | Skeleton canvas           | N/A             |
| **Error**             | Error message + retry     | Retry / Support |
| **Draft**             | Gray badge "Draft"        | Edit / Validate |
| **Active**            | Green badge "Active"      | Execute         |
| **Executing**         | Blue badge "Running"      | View progress   |
| **Completed**         | Green badge "Completed"   | View results    |
| **Failed**            | Red badge "Failed"        | Retry / Debug   |
| **Bot Running**       | Blue badge "Bot Running"  | View logs       |
| **Bot Error**         | Red badge "Bot Error"     | Retry / Fix     |
| **Paused**            | Orange badge "Paused"     | Resume          |
| **Permission Denied** | "Access restricted"       | Back            |

### Form Validation

- **Workflow Creation**: Validate all nodes; check for circular dependencies
- **Bot Configuration**: Validate credentials; test connectivity
- **Schedule Setup**: Validate cron expressions; timezone settings
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal

### Network Errors

| HTTP Status | UI Message                                       | Action              |
| ----------- | ------------------------------------------------ | ------------------- |
| 400         | "Invalid workflow configuration."                | Inline field errors |
| 401         | "Session expired. Please log in again."          | Redirect to login   |
| 403         | "You don't have permission for this automation." | Hide action         |
| 404         | "Workflow not found."                            | Return to list      |
| 409         | "Workflow already running."                      | Show status         |
| 422         | "Validation failed."                             | Inline errors       |
| 500         | "Automation failed. Our team has been notified." | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/ops.json`.

### Page Titles & Headers

| Context   | Copy                    | i18n Key              |
| --------- | ----------------------- | --------------------- |
| Dashboard | "Operations Automation" | `ops.dashboard.title` |
| Workflows | "Workflow Builder"      | `ops.workflows.title` |
| RPA       | "RPA Task Manager"      | `ops.rpa.title`       |
| Analytics | "Process Analytics"     | `ops.analytics.title` |
| Templates | "Workflow Templates"    | `ops.templates.title` |

### State Messages

| State       | Title                   | Message                        | Action Button | i18n Key           |
| ----------- | ----------------------- | ------------------------------ | ------------- | ------------------ |
| Empty       | "No workflows yet"      | "Create your first automation" | "Create"      | `ops.empty.*`      |
| Executing   | "Workflow running"      | "Workflow started at {time}"   | "View"        | `ops.executing.*`  |
| Completed   | "Workflow completed"    | "Completed in {duration}"      | "View Report" | `ops.completed.*`  |
| Failed      | "Workflow failed"       | "Error at step {step}"         | "Debug"       | `ops.failed.*`     |
| Bot Running | "Bot executing"         | "Processing {count} items"     | "View Logs"   | `ops.botRunning.*` |
| Bot Error   | "Bot encountered error" | "Automatic retry in {time}"    | "Force Stop"  | `ops.botError.*`   |

### Success Messages (Toast)

| Action             | Message                                  | i18n Key                |
| ------------------ | ---------------------------------------- | ----------------------- |
| Workflow Created   | "Workflow '{name}' created successfully" | `ops.workflow.success`  |
| Bot Started        | "Bot started: {name}"                    | `ops.bot.success`       |
| Workflow Completed | "Workflow completed successfully"        | `ops.execution.success` |
| Schedule Created   | "Schedule created: {name}"               | `ops.schedule.success`  |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useOperations.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useWorkflows(filters = {}) {
  return useQuery({
    queryKey: ["ops", "workflows", filters],
    queryFn: () => apiClient.GET("/api/ops/workflows", { query: filters }),
    staleTime: 60_000, // 1min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useSaveWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; nodes: any[]; edges: any[] }) =>
      apiClient.POST("/api/ops/workflows/create", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ops", "workflows"] });
      toast.success(`Workflow '${data.name}' created successfully`);
    },
    onError: () => {
      toast.error("Failed to create workflow.");
    },
  });
}

export function useExecuteWorkflow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workflow_id: string) =>
      apiClient.POST("/api/ops/workflows/execute", { body: { workflow_id } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ops"] });
      toast.success("Workflow execution started");
    },
    onError: () => {
      toast.error("Failed to execute workflow.");
    },
  });
}

export function useRPATasks(filters = {}) {
  return useQuery({
    queryKey: ["ops", "rpa-tasks", filters],
    queryFn: () => apiClient.GET("/api/ops/rpa-tasks", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });
}

export function useRunBot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bot_id: string) =>
      apiClient.POST("/api/ops/rpa-tasks/run", { body: { bot_id } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ops", "rpa-tasks"] });
      toast.success(`Bot started: ${data.bot_name}`);
    },
    onError: () => {
      toast.error("Failed to start bot.");
    },
  });
}

export function useStopBot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bot_id: string) =>
      apiClient.POST("/api/ops/rpa-tasks/stop", { body: { bot_id } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ops", "rpa-tasks"] });
      toast.success(`Bot stopped: ${data.bot_name}`);
    },
    onError: () => {
      toast.error("Failed to stop bot.");
    },
  });
}

export function useProcessAnalytics(filters = {}) {
  return useQuery({
    queryKey: ["ops", "analytics", filters],
    queryFn: () => apiClient.GET("/api/ops/analytics", { query: filters }),
    staleTime: 300_000, // 5min
    retry: 2,
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error         | User Message                                     | UI Action            |
| ----------------- | ------------------------------------------------ | -------------------- |
| 400 (Bad Request) | "Invalid workflow configuration."                | Inline field errors  |
| 409 (Duplicate)   | "Workflow already running."                      | Show status          |
| 422 (Validation)  | "Validation failed."                             | Inline errors        |
| 403 (Forbidden)   | "You don't have permission for this automation." | Hide action          |
| 500 (Server)      | "Automation failed. Our team has been notified." | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 60s for workflow execution

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["ops", "workflows", { filters }][("ops", "workflow", workflowId)][
  ("ops", "rpa-tasks", { filters })
][("ops", "rpa-task", taskId)][("ops", "analytics", { filters })][
  ("ops", "templates")
];
```

### Invalidation Rules

| Action             | Invalidates                                    |
| ------------------ | ---------------------------------------------- |
| Create Workflow    | `["ops", "workflows"]`                         |
| Execute Workflow   | `["ops"]` (all)                                |
| Start Bot          | `["ops", "rpa-tasks"]`                         |
| Complete Execution | `["ops", "workflows"]`, `["ops", "analytics"]` |

### Stale Time

| Query Type | Stale Time | Reasoning                      |
| ---------- | ---------- | ------------------------------ |
| Workflows  | 1min       | Moderate update frequency      |
| RPA Tasks  | 30s        | Active execution monitoring    |
| Analytics  | 5min       | Aggregated data changes slowly |
| Templates  | 10min      | Rarely changes                 |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("ops-workflows");
revalidateTag("ops-rpa-tasks");
revalidateTag("ops-analytics");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/ops.fixtures.ts`

**Datasets**:

- `minimalOps`: 5 workflows, 10 RPA tasks
- `standardOps`: 30 workflows with executions, 50 RPA tasks
- `complexOps`: 100+ workflows, extensive execution history
- `edgeCases`: Edge cases (failed workflows, bot errors)

**Edge Cases Covered**:

- Workflow validation failures
- Bot execution errors and retries
- Circular workflow dependencies
- Schedule conflicts
- Resource limit scenarios
- Timeout handling

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
- **Interactive Parts**: Mark with `"use client"` (workflow canvas, bot controls)

### Data Fetching Strategy

| Scenario          | Strategy                           | Benefit           |
| ----------------- | ---------------------------------- | ----------------- |
| Initial Dashboard | Server-side fetch + stream         | Faster TTFB       |
| Workflow Builder  | Client-side with real-time updates | Instant feedback  |
| Analytics         | Server component with static data  | SEO + performance |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function executeWorkflow(workflow_id: string) {
  // ... mutation logic
  revalidateTag("ops-workflows");
  revalidateTag("ops-analytics");
}
```

---

## 📊 Analytics & Audit Events

| Event                 | When                    | Properties                                           |
| --------------------- | ----------------------- | ---------------------------------------------------- |
| Ops.WorkflowCreated   | Workflow created        | `workflow_id`, `name`, `template_used`, `creator`    |
| Ops.WorkflowExecuted  | Workflow started        | `workflow_id`, `execution_id`, `trigger`             |
| Ops.WorkflowCompleted | Workflow finished       | `workflow_id`, `execution_id`, `duration`, `status`  |
| Ops.BotStarted        | RPA bot started         | `bot_id`, `bot_name`, `initiator`                    |
| Ops.BotCompleted      | Bot execution complete  | `bot_id`, `tasks_processed`, `success_rate`          |
| Ops.ProcessAutomated  | New automation deployed | `automation_id`, `process_name`, `estimated_savings` |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Ops.WorkflowExecuted", {
  workflow_id: "wf_123",
  execution_id: "exec_456",
  trigger: "manual",
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/ops.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties; test with Arabic locale

### Keyboard Shortcuts

| Key      | Action             | Scope           |
| -------- | ------------------ | --------------- |
| `/`      | Focus search       | Any page        |
| `n`      | Create workflow    | Workflow list   |
| `e`      | Execute workflow   | Workflow detail |
| `s`      | Start bot          | RPA manager     |
| `d`      | Stop bot           | RPA manager     |
| `↑ / ↓`  | Navigate list      | Any list        |
| `Enter`  | Open item          | Any list        |
| `Escape` | Close modal/cancel | Modal/Form      |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateWorkflowModal()],
  ["e", () => executeWorkflow()],
  ["s", () => startBot()],
  ["d", () => stopBot()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                           | Duration | Rollback Trigger |
| ----------- | ---------------- | ---------------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                           | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, workflow success ≥99%                  | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, workflow success ≥99%, bot uptime 99.9% | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained                   | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m29_ops: false,                          // Master toggle
  m29_ops_workflows: false,                // Workflow builder
  m29_ops_rpa: false,                      // RPA management
  m29_ops_analytics: false,                // Analytics
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Workflow execution success rate (≥99% required)
- Bot uptime (≥99.9% required)
- Average workflow execution time
- ROI tracking
- User adoption rate

**Alert Thresholds**:

- Workflow success < 99% → investigate
- Bot failure → immediate notification
- Execution timeout → escalate
- ROI calculation error → fix

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m29_ops = false`

   ```powershell
   pnpm run flags:set m29_ops=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("ops-workflows");
   revalidateTag("ops-rpa-tasks");
   revalidateTag("ops-analytics");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/ops/*"
   ```

4. **Monitor for 15 minutes**:

   - Error rate drops below 0.1%
   - No new Sentry issues
   - Users see fallback message

5. **Post-mortem**:
   - Create incident report
   - Identify root cause
   - Add regression test
   - Notify operations team

**Rollback Decision Matrix**:

| Scenario                   | Action             | Approval Required |
| -------------------------- | ------------------ | ----------------- |
| Workflow execution failure | Immediate rollback | No (auto-trigger) |
| Bot data corruption        | Immediate rollback | No (auto-trigger) |
| Success rate < 99%         | Immediate rollback | No (auto-trigger) |
| ROI calculation error      | Investigate first  | Ops lead          |
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

- UiPath: RPA framework
- Microsoft Power Automate: Workflow automation
- Zapier: Integration automation
- ServiceNow: Process automation
- BPMN 2.0: Workflow modeling standards

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Workflow Validation Complexity

**Mitigation**: Comprehensive validation rules; test harness for all templates; dry-run mode before production execution; user validation feedback

### Risk #2: RPA Bot Reliability

**Mitigation**: Automatic retry logic (3 attempts); comprehensive error handling; human escalation procedures; detailed logging

### Risk #3: Third-Party Integration Issues

**Mitigation**: API monitoring; fallback procedures; vendor SLAs; timeout handling; graceful degradation

### Risk #4: User Adoption for No-Code Tools

**Mitigation**: Comprehensive training programs; extensive template library; user guides; in-app help; success stories

---

## 📝 Implementation Guide

### Day 1: Workflow Builder (8 hours)

1. Build visual workflow canvas with drag-and-drop (4 hours)
2. Implement workflow templates library (2 hours)
3. Create workflow testing and execution (2 hours)

### Day 2: RPA & Analytics (8 hours)

1. Build RPA task manager dashboard (3 hours)
2. Implement bot control and monitoring (2 hours)
3. Create process analytics dashboard (3 hours)

**Total**: 2 days (16 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Workflow node validation
- [ ] RPA task execution logic
- [ ] ROI calculation accuracy

### Integration Tests

- [ ] Complete workflow creation and execution
- [ ] RPA bot lifecycle management
- [ ] Analytics data aggregation

### E2E Tests

- [ ] User can build and deploy workflow
- [ ] User can manage RPA bots
- [ ] User can execute workflows and view results
- [ ] User can start/stop bots
- [ ] Analytics dashboard shows accurate metrics
- [ ] Keyboard-only flow: create → test → deploy workflow

### Accessibility Tests

- [ ] Keyboard navigation works (workflow canvas)
- [ ] Screen reader announces workflow status
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
- [ ] Workflow canvas renders efficiently

---

## 📅 Timeline

| Day | Deliverable                            |
| --- | -------------------------------------- |
| 1   | Visual workflow builder with templates |
| 2   | RPA task manager and process analytics |

**Total**: 2 days (16 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries
- ✅ M27: SOX Controls
- ✅ M28: ITGC

### Enables These Modules

- M30: Close Insights
- M20: Close Management (enhanced with automation)

---

## 🎯 Success Criteria

### Must Have

- [ ] Visual workflow builder with drag-and-drop
- [ ] RPA task manager with bot control
- [ ] Process analytics showing ROI
- [ ] Workflow success ≥99%, Bot uptime ≥99.9%

### Should Have

- [ ] Pre-built workflow templates (50+)
- [ ] Automated error handling and retry logic
- [ ] AI-powered automation recommendations
- [ ] Bot execution logs and monitoring

### Nice to Have

- [ ] Natural language workflow creation ("Automate invoice approvals over $10K")
- [ ] Integration marketplace for third-party tools
- [ ] Mobile app for workflow approval
- [ ] Workflow version control

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created (`/ops/dashboard`, `/ops/workflows`, `/ops/rpa`, `/ops/analytics`)
- [ ] Workflow builder working (drag-and-drop canvas)
- [ ] RPA task manager working (start/stop bots)
- [ ] Process analytics working (ROI calculations)
- [ ] Template library working (50+ templates)
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
- [ ] Integration tests: All operations covered
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/ops`
- [ ] Workflow canvas load: < 2s
- [ ] Bot execution: < 30s

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
- [ ] Workflow success rate tracked
- [ ] Bot uptime monitored

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced
- [ ] Workflow data encrypted
- [ ] Audit trail complete (immutable)
- [ ] Bot credentials secured
- [ ] Operations automation validated

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All tests passed
- [ ] **Design**: UI matches specs
- [ ] **PM**: Feature complete
- [ ] **Security**: Security review passed (bot credentials)
- [ ] **Accessibility**: A11y audit passed
- [ ] **Operations**: Automation framework validated

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M28 - ITGC  
**Next**: M30 - Close Insights
