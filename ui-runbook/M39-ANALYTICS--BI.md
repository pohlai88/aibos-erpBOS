# 🚀 M39: Analytics & BI - UI Implementation Runbook

**Module ID**: M39  
**Module Name**: Analytics & BI  
**Priority**: HIGH  
**Phase**: 10 - Extended Modules  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

M39 provides powerful business intelligence and analytics capabilities with custom dashboard builder, AI-powered insights, and automated report scheduling. This module transforms raw ERP data into actionable insights, empowering data-driven decision making across the organization.

### Business Value

- **Self-Service Analytics**: Business users create custom dashboards without IT (reduces BI backlog by 80%)
- **AI Insights**: Automated anomaly detection and trend analysis surface hidden opportunities
- **Real-Time Data**: Live dashboards update as transactions occur (vs. overnight batch in competitors)
- **Executive Visibility**: C-suite dashboards provide instant business health snapshot
- **Compliance Reporting**: Automated regulatory and board reports save 40+ hours/month

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-dashboard-builder], [ADR-###-ai-insights], [ADR-###-report-scheduler]

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

**Dashboards** (5 endpoints):

- ✅ `/api/analytics/dashboards` - List dashboards
- ✅ `/api/analytics/dashboards/[id]` - Dashboard details
- ✅ `/api/analytics/dashboards/create` - Create dashboard
- ✅ `/api/analytics/dashboards/widgets` - Widget library
- ✅ `/api/analytics/dashboards/templates` - Dashboard templates

**AI Insights** (4 endpoints):

- ✅ `/api/analytics/insights` - AI insights list
- ✅ `/api/analytics/insights/anomalies` - Anomaly detection
- ✅ `/api/analytics/insights/trends` - Trend analysis
- ✅ `/api/analytics/insights/predictions` - Predictive analytics

**Reports** (4 endpoints):

- ✅ `/api/analytics/reports` - Report library
- ✅ `/api/analytics/reports/schedules` - Scheduled reports
- ✅ `/api/analytics/reports/execute` - Execute report
- ✅ `/api/analytics/reports/export` - Export report

**Data Queries** (3 endpoints):

- ✅ `/api/analytics/data/query` - Custom data query
- ✅ `/api/analytics/data/sources` - Available data sources
- ✅ `/api/analytics/data/metrics` - Key metrics

**Total Endpoints**: 16 (4 categories)

### Risks & Blockers

| Risk                            | Impact | Mitigation                                                       | Owner      |
| ------------------------------- | ------ | ---------------------------------------------------------------- | ---------- |
| AI model accuracy               | HIGH   | Regular retraining; confidence thresholds; human review; testing | @data-team |
| Dashboard performance (widgets) | MED    | Widget virtualization; lazy loading; caching; query optimization | @backend   |
| Report generation scalability   | MED    | Background job queue; pagination; streaming; incremental export  | @backend   |
| Data source integration         | HIGH   | Standardized query interface; data validation; error handling    | @backend   |

---

## 🎯 3 Killer Features

### 1. **Custom Dashboard Builder** 🚀

**Description**: Drag-and-drop dashboard designer with 50+ pre-built widgets (charts, KPIs, tables, gauges). Features real-time data refresh, drill-down capabilities, filters, and dashboard sharing. No-code interface for business users.

**Why It's Killer**:

- **No-Code**: Finance users build dashboards without IT or SQL knowledge
- **Real-Time**: Data updates every 5 minutes (SAP/Oracle refresh overnight)
- **50+ Widgets**: Pre-built components for all common financial metrics
- **Measurable Impact**: Reduce BI request backlog from 3 months to zero
- **Vs Tableau/Power BI**: Native ERP integration eliminates data extraction (Tableau requires data warehouse)

**Implementation**:

```typescript
import {
  Card,
  Button,
  DashboardCanvas,
  WidgetLibrary,
  Form,
  Input,
} from "aibos-ui";
import { useDashboards, useSaveDashboard } from "@/hooks/useAnalytics";

export default function CustomDashboardBuilder() {
  const { dashboards, widgets } = useDashboards();
  const { save } = useSaveDashboard();
  const [layout, setLayout] = useState([]);

  const widgetTypes = [
    { type: "kpi", name: "KPI Card", icon: "📊" },
    { type: "line", name: "Line Chart", icon: "📈" },
    { type: "bar", name: "Bar Chart", icon: "📊" },
    { type: "pie", name: "Pie Chart", icon: "🥧" },
    { type: "table", name: "Data Table", icon: "📋" },
    { type: "gauge", name: "Gauge", icon: "🎚️" },
    { type: "waterfall", name: "Waterfall", icon: "💧" },
    { type: "heatmap", name: "Heatmap", icon: "🔥" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center">
          <h2>Dashboard Builder</h2>
          <div className="flex gap-4">
            <Input placeholder="Dashboard Name" />
            <Button variant="outline">Preview</Button>
            <Button variant="primary" onClick={() => save(layout)}>
              Save Dashboard
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <Card title="Widget Library">
            <div className="space-y-2">
              {widgetTypes.map((widget) => (
                <Button
                  key={widget.type}
                  variant="outline"
                  fullWidth
                  onClick={() => addWidget(widget.type)}
                  className="justify-start"
                >
                  <span className="mr-2">{widget.icon}</span>
                  {widget.name}
                </Button>
              ))}
            </div>

            <div className="mt-6">
              <h4 className="font-semibold mb-2">Data Sources</h4>
              <Select
                options={[
                  { value: "ledger", label: "General Ledger" },
                  { value: "ar", label: "Accounts Receivable" },
                  { value: "ap", label: "Accounts Payable" },
                  { value: "orders", label: "Sales Orders" },
                  { value: "projects", label: "Projects" },
                  { value: "budget", label: "Budget" },
                ]}
              />
            </div>
          </Card>
        </div>

        <div className="col-span-9">
          <Card title="Dashboard Canvas">
            <DashboardCanvas
              layout={layout}
              onLayoutChange={setLayout}
              widgets={widgets}
              draggable
              resizable
              gridCols={12}
              rowHeight={100}
            />
          </Card>
        </div>
      </div>

      <Card title="Pre-Built Templates">
        <div className="grid grid-cols-3 gap-4">
          {dashboards.templates.map((template) => (
            <Card
              key={template.id}
              className="cursor-pointer hover:shadow-lg"
              onClick={() => loadTemplate(template.id)}
            >
              <img
                src={template.thumbnail}
                alt={template.name}
                className="w-full h-32 object-cover rounded"
              />
              <h4 className="mt-2 font-semibold">{template.name}</h4>
              <p className="text-sm text-gray-600">{template.description}</p>
              <Badge className="mt-2">{template.widgets_count} widgets</Badge>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

### 2. **AI-Powered Insights Engine** ⚡

**Description**: Machine learning engine that analyzes ERP data to surface anomalies, trends, and opportunities. Features natural language insights, predictive analytics, and automated alerts for significant changes.

**Why It's Killer**:

- **Anomaly Detection**: AI flags unusual transactions or patterns (e.g., sudden expense spike)
- **Predictive Analytics**: Forecasts revenue, cash flow, expenses using ML models
- **Natural Language**: Insights written in plain English ("Revenue 15% above forecast because...")
- **Measurable Impact**: CFOs discover insights they would have missed manually
- **Vs Competitors**: aibos AI is purpose-built for finance (generic BI tools lack domain knowledge)

**Implementation**:

```typescript
import { Card, Badge, Alert, Chart, Button } from "aibos-ui";
import { useAIInsights, useDismissInsight } from "@/hooks/useAnalytics";

export default function AIInsightsEngine() {
  const { insights, trends, anomalies } = useAIInsights();
  const { dismiss, investigate } = useDismissInsight();

  return (
    <div className="space-y-6">
      <Card title="AI-Generated Insights">
        <div className="space-y-4">
          {insights.map((insight) => (
            <Alert
              key={insight.id}
              variant={
                insight.severity === "high"
                  ? "error"
                  : insight.severity === "medium"
                  ? "warning"
                  : "info"
              }
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={
                        insight.type === "anomaly"
                          ? "error"
                          : insight.type === "trend"
                          ? "info"
                          : "success"
                      }
                    >
                      {insight.type}
                    </Badge>
                    <Badge variant="outline">
                      {insight.confidence}% confidence
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-lg">{insight.title}</h4>
                  <p className="text-sm mt-2">{insight.description}</p>
                  {insight.impact && (
                    <div className="mt-2 text-sm">
                      <strong>Estimated Impact:</strong> {insight.impact}
                    </div>
                  )}
                  {insight.recommendation && (
                    <div className="mt-2 p-2 bg-blue-50 rounded">
                      <strong>💡 Recommendation:</strong>{" "}
                      {insight.recommendation}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => investigate(insight.id)}
                  >
                    Investigate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dismiss(insight.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Detected Anomalies">
          <div className="space-y-3">
            {anomalies.map((anomaly) => (
              <div key={anomaly.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-semibold">{anomaly.metric_name}</h5>
                    <p className="text-sm text-gray-600">
                      {anomaly.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="error">
                        Expected: ${anomaly.expected.toLocaleString()}
                      </Badge>
                      <Badge variant="warning">
                        Actual: ${anomaly.actual.toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Predicted Trends">
          <Chart
            type="line"
            data={{
              labels: trends.months,
              datasets: [
                {
                  label: "Actual",
                  data: trends.actual,
                  borderColor: "rgb(59, 130, 246)",
                  fill: false,
                },
                {
                  label: "Predicted",
                  data: trends.predicted,
                  borderColor: "rgb(249, 115, 22)",
                  borderDash: [5, 5],
                  fill: false,
                },
                {
                  label: "Confidence Interval",
                  data: trends.upper_bound,
                  borderColor: "rgba(249, 115, 22, 0.3)",
                  fill: "+1",
                  backgroundColor: "rgba(249, 115, 22, 0.1)",
                },
                {
                  label: "",
                  data: trends.lower_bound,
                  borderColor: "rgba(249, 115, 22, 0.3)",
                  fill: false,
                },
              ],
            }}
          />
        </Card>
      </div>
    </div>
  );
}
```

### 3. **Automated Report Scheduler** 💎

**Description**: Enterprise report scheduling with email delivery, PDF/Excel export, subscription management, and distribution lists. Features 100+ pre-built financial reports (P&L, balance sheet, cash flow, variance, etc.).

**Why It's Killer**:

- **100+ Pre-Built Reports**: Financial statements, variance, aging, budget reports ready out-of-box
- **Automated Delivery**: Schedule reports daily/weekly/monthly to distribution lists
- **Multi-Format**: Export to PDF, Excel, CSV with branded formatting
- **Measurable Impact**: Eliminate 20+ hours/month creating and emailing reports
- **Vs Crystal Reports/SSRS**: Modern web-based UI and native ERP integration

**Implementation**:

```typescript
import {
  Card,
  DataTable,
  Button,
  Badge,
  Form,
  Select,
  MultiSelect,
} from "aibos-ui";
import { useReportScheduler, useScheduleReport } from "@/hooks/useAnalytics";

export default function AutomatedReportScheduler() {
  const { schedules, reports } = useReportScheduler();
  const { schedule, execute } = useScheduleReport();

  return (
    <div className="space-y-6">
      <Card title="Create Report Schedule">
        <Form onSubmit={schedule}>
          <div className="grid grid-cols-2 gap-6">
            <Select
              label="Report Template"
              name="report_id"
              options={reports.map((r) => ({
                value: r.id,
                label: r.name,
                group: r.category,
              }))}
              required
              searchable
            />
            <Select
              label="Frequency"
              name="frequency"
              options={[
                { value: "daily", label: "Daily" },
                { value: "weekly", label: "Weekly" },
                { value: "monthly", label: "Monthly" },
                { value: "quarterly", label: "Quarterly" },
                { value: "annually", label: "Annually" },
              ]}
              required
            />
            <Select
              label="Format"
              name="format"
              options={[
                { value: "pdf", label: "PDF" },
                { value: "excel", label: "Excel" },
                { value: "csv", label: "CSV" },
              ]}
            />
            <Input
              type="time"
              label="Delivery Time"
              name="delivery_time"
              defaultValue="08:00"
            />
            <MultiSelect
              label="Recipients"
              name="recipients"
              options={users.map((u) => ({ value: u.email, label: u.name }))}
              required
            />
            <Input label="Subject Line" name="subject" />
          </div>

          <Textarea label="Email Message" name="message" rows={3} />

          <Button type="submit" variant="primary">
            Create Schedule
          </Button>
        </Form>
      </Card>

      <Card title="Scheduled Reports">
        <DataTable
          data={schedules}
          columns={[
            { key: "report_name", label: "Report" },
            {
              key: "frequency",
              label: "Frequency",
              render: (_, row) => <Badge>{row.frequency}</Badge>,
            },
            { key: "format", label: "Format" },
            { key: "recipients_count", label: "Recipients" },
            { key: "next_run", label: "Next Run" },
            { key: "last_run", label: "Last Run" },
            {
              key: "status",
              label: "Status",
              render: (_, row) => (
                <Badge
                  variant={
                    row.status === "Active"
                      ? "success"
                      : row.status === "Paused"
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => execute(row.id)}
                  >
                    Run Now
                  </Button>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Report Library">
        <div className="grid grid-cols-3 gap-4">
          {reports.slice(0, 9).map((report) => (
            <Card key={report.id} className="cursor-pointer hover:shadow-lg">
              <Badge>{report.category}</Badge>
              <h4 className="mt-2 font-semibold">{report.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{report.description}</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" fullWidth>
                  Preview
                </Button>
                <Button size="sm" variant="primary" fullWidth>
                  Schedule
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Dashboard Builder (`/analytics/builder`)

**Components**: DashboardCanvas, WidgetLibrary, Button, Card
**File**: `apps/web/app/(dashboard)/analytics/builder/page.tsx`

#### 2. AI Insights (`/analytics/insights`)

**Components**: Alert, Chart, Badge, Button
**File**: `apps/web/app/(dashboard)/analytics/insights/page.tsx`

#### 3. Report Scheduler (`/analytics/reports`)

**Components**: DataTable, Form, Select, Button
**File**: `apps/web/app/(dashboard)/analytics/reports/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                        | Target          | Measurement          |
| ----------------------------- | --------------- | -------------------- |
| TTFB (staging)                | ≤ 70ms          | Server timing header |
| Client TTI for `/analytics`   | ≤ 200ms         | Lighthouse CI        |
| Dashboard render (10 widgets) | < 2s            | Performance profiler |
| AI insights generation        | < 3s            | API response time    |
| Report generation (100 pages) | < 30s           | Background job       |
| Widget data refresh           | < 500ms         | API response time    |
| Export to Excel (1000 rows)   | < 5s            | Export profiler      |
| UI bundle size                | ≤ 300KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access for dashboard builder and reports
- **Focus Management**: Drag-and-drop keyboard alternative
- **ARIA**: Chart data accessible; dynamic updates announced
- **Screen Reader**: All visualizations have data tables; insights announced
- **Axe Target**: 0 serious/critical violations

### Security

| Layer          | Requirement                                                 |
| -------------- | ----------------------------------------------------------- |
| RBAC Scopes    | `analytics.read`, `analytics.build`, `analytics.admin`      |
| Enforcement    | Server-side on all endpoints                                |
| Data Exposure  | Only show data user has permission for (row-level security) |
| Audit Trail    | Immutable logs for all dashboard/report actions             |
| Query Safety   | SQL injection prevention; query sandboxing; timeout limits  |
| PII Protection | Mask sensitive data in reports; encryption at rest          |

#### UI Permissions Matrix

| Role            | View | Build Dashboards | Schedule Reports | AI Insights | Admin |
| --------------- | ---- | ---------------- | ---------------- | ----------- | ----- |
| analytics.read  | ✅   | ❌               | ❌               | ✅          | ❌    |
| analytics.build | ✅   | ✅               | ✅               | ✅          | ❌    |
| analytics.admin | ✅   | ✅               | ✅               | ✅          | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful dashboard renders; <5s report generation (P95)
- **SLA Dashboards**: Real-time metrics on query performance, widget errors
- **Events Emitted**: `Analytics.DashboardCreated`, `Analytics.ReportScheduled`, `Analytics.InsightGenerated`
- **Logging**: Structured logs with dashboard IDs for all operations
- **Tracing**: Distributed tracing for data queries

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Analytics Business Rules

| Rule                        | Enforcement                                    |
| --------------------------- | ---------------------------------------------- |
| **Data Freshness**          | Max 5min staleness; real-time option available |
| **Widget Limits**           | Max 50 widgets per dashboard for performance   |
| **Query Timeout**           | 30s max query execution; background for longer |
| **Report Retention**        | Generated reports retained 90 days             |
| **AI Confidence Threshold** | Only show insights with ≥70% confidence        |
| **Row-Level Security**      | Users only see data they have permission for   |
| **Export Limits**           | Max 100,000 rows per export (Excel limit)      |

### Dashboard States

- **Draft**: In edit mode, not published
- **Published**: Visible to users, read-only
- **Shared**: Published + shared with specific users/groups
- **Archived**: No longer visible, retained for audit

### Archive Semantics

- **Dashboards**: Soft delete; retain 2 years
- **Reports**: Generated reports retained 90 days
- **Guard Rails**:
  - ❌ Deny deletion if dashboard has active schedules
  - ✅ Allow archiving (soft delete)

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                    | User Action        |
| --------------------- | ----------------------------- | ------------------ |
| **Empty**             | "No dashboards yet"           | "Create Dashboard" |
| **Loading**           | Skeleton widgets              | N/A                |
| **Error**             | Error message + retry         | Retry / Support    |
| **Building**          | Dashboard builder canvas      | Drag widgets       |
| **Published**         | Read-only dashboard           | View / Share       |
| **Generating**        | "Generating report..."        | Wait / Cancel      |
| **AI Processing**     | "Analyzing data..."           | Wait               |
| **Query Timeout**     | "Query took too long"         | Simplify query     |
| **No Data**           | "No data for selected period" | Adjust filters     |
| **Permission Denied** | "Access restricted"           | Back               |

### Form Validation

- **Dashboard Name**: Required, unique, max 100 chars
- **Widget Config**: Valid data source, metric selection
- **Report Schedule**: Valid cron expression, recipients

### Network Errors

| HTTP Status | UI Message                                | Action              |
| ----------- | ----------------------------------------- | ------------------- |
| 400         | "Invalid query. Check your parameters."   | Inline field errors |
| 401         | "Session expired. Please log in again."   | Redirect to login   |
| 403         | "You don't have permission."              | Hide action         |
| 404         | "Dashboard not found."                    | Return to list      |
| 409         | "Dashboard name already exists."          | Suggest alternative |
| 422         | "Validation failed. Check configuration." | Inline errors       |
| 500         | "Something went wrong. Try again."        | Retry button        |
| 504         | "Query timeout. Simplify or schedule."    | Suggest schedule    |

---

## 📝 UX Copy Deck

### Page Titles & Headers

| Context           | Copy                | i18n Key                    |
| ----------------- | ------------------- | --------------------------- |
| Dashboard List    | "Analytics & BI"    | `analytics.list.title`      |
| Dashboard Builder | "Dashboard Builder" | `analytics.builder.title`   |
| AI Insights       | "AI Insights"       | `analytics.insights.title`  |
| Report Library    | "Report Library"    | `analytics.reports.title`   |
| Report Scheduler  | "Report Scheduler"  | `analytics.scheduler.title` |

### State Messages

| State        | Title               | Message                                  | Action Button   | i18n Key                |
| ------------ | ------------------- | ---------------------------------------- | --------------- | ----------------------- |
| Empty        | "No dashboards yet" | "Create your first dashboard"            | "Create"        | `analytics.empty.*`     |
| No Data      | "No data available" | "Adjust filters or date range"           | "Reset Filters" | `analytics.noData.*`    |
| AI Analyzing | "Analyzing data..." | "AI is analyzing your data for insights" | N/A             | `analytics.analyzing.*` |
| Timeout      | "Query timeout"     | "Query took too long. Try scheduling"    | "Schedule"      | `analytics.timeout.*`   |

### Success Messages (Toast)

| Action            | Message                         | i18n Key                     | Shortcut |
| ----------------- | ------------------------------- | ---------------------------- | -------- |
| Dashboard Created | "Dashboard '{name}' created"    | `analytics.create.success`   | `d`      |
| Report Scheduled  | "Report scheduled successfully" | `analytics.schedule.success` | `r`      |
| Insight Dismissed | "Insight dismissed"             | `analytics.dismiss.success`  | `x`      |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useAnalytics.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function useDashboards(filters = {}) {
  const queryClient = useQueryClient();

  const { data: dashboards, isLoading } = useQuery({
    queryKey: ["analytics-dashboards", filters],
    queryFn: () =>
      apiClient.GET("/api/analytics/dashboards", { query: filters }),
    staleTime: 5 * 60_000, // 5min
    retry: 2,
    select: (response) => response.data,
  });

  const createDashboard = useMutation({
    mutationFn: (dashboardData) =>
      apiClient.POST("/api/analytics/dashboards/create", {
        body: dashboardData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics-dashboards"] });
    },
  });

  const updateDashboard = useMutation({
    mutationFn: ({ id, data }) =>
      apiClient.PUT("/api/analytics/dashboards/[id]", {
        params: { id },
        body: data,
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["analytics-dashboards"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-dashboard", id] });
    },
  });

  return {
    dashboards: dashboards || [],
    isLoading,
    createDashboard: createDashboard.mutate,
    updateDashboard: updateDashboard.mutate,
  };
}

export function useAIInsights(filters = {}) {
  return useQuery({
    queryKey: ["analytics-insights", filters],
    queryFn: () => apiClient.GET("/api/analytics/insights", { query: filters }),
    staleTime: 5 * 60_000, // 5min
    refetchInterval: 5 * 60_000, // Refresh every 5 minutes
    retry: 2,
    select: (response) => response.data,
  });
}

export function useReportScheduler(filters = {}) {
  const queryClient = useQueryClient();

  const { data: schedules, isLoading } = useQuery({
    queryKey: ["analytics-schedules", filters],
    queryFn: () =>
      apiClient.GET("/api/analytics/reports/schedules", { query: filters }),
    staleTime: 2 * 60_000, // 2min
    retry: 2,
    select: (response) => response.data,
  });

  const createSchedule = useMutation({
    mutationFn: (scheduleData) =>
      apiClient.POST("/api/analytics/reports/schedules", {
        body: scheduleData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics-schedules"] });
    },
  });

  const executeReport = useMutation({
    mutationFn: (reportId: string) =>
      apiClient.POST("/api/analytics/reports/execute", { body: { reportId } }),
    onError: (error) => {
      if (error.status === 504) {
        toast.error("Report generation timeout. Consider scheduling.");
      }
    },
  });

  return {
    schedules: schedules || [],
    isLoading,
    createSchedule: createSchedule.mutate,
    executeReport: executeReport.mutate,
  };
}

export function useWidgetLibrary() {
  return useQuery({
    queryKey: ["analytics-widgets"],
    queryFn: () => apiClient.GET("/api/analytics/dashboards/widgets"),
    staleTime: 30 * 60_000, // 30min
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error         | User Message                              | UI Action            |
| ----------------- | ----------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid query. Check your parameters."   | Inline field errors  |
| 409 (Conflict)    | "Dashboard name already exists."          | Suggest alternative  |
| 422 (Validation)  | "Validation failed. Check configuration." | Inline errors        |
| 403 (Forbidden)   | "You don't have permission."              | Hide action          |
| 504 (Timeout)     | "Query timeout. Try scheduling report."   | Show schedule option |
| 500 (Server)      | "Something went wrong. Try again."        | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry for dashboard/report operations; user-initiated retry only
- **Query Timeouts**: 30s for data queries; background jobs for longer

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["analytics-dashboards", { filters }][("analytics-dashboard", dashboardId)][
  ("analytics-insights", { filters })
][("analytics-schedules", { filters })]["analytics-widgets"][
  "analytics-reports"
];
```

### Invalidation Rules

| Action           | Invalidates                                               |
| ---------------- | --------------------------------------------------------- |
| Create Dashboard | `["analytics-dashboards"]`                                |
| Update Dashboard | `["analytics-dashboards"]`, `["analytics-dashboard", id]` |
| Create Schedule  | `["analytics-schedules"]`                                 |
| Execute Report   | `["analytics-reports"]`                                   |
| Dismiss Insight  | `["analytics-insights"]`                                  |

### Stale Time

| Query Type       | Stale Time | Reasoning                   |
| ---------------- | ---------- | --------------------------- |
| Dashboards       | 5min       | Moderate update frequency   |
| AI Insights      | 5min       | AI regenerates periodically |
| Report Schedules | 2min       | Moderate update frequency   |
| Widgets Library  | 30min      | Rarely changes              |
| Reports          | 10min      | Moderate update frequency   |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("analytics-dashboards"); // After dashboard mutations
revalidateTag(`analytics-dashboard-${dashboardId}`); // Specific dashboard
```

---

## 📝 Implementation Guide

### Step 0: Foundation Setup (1 hour)

- Enable feature flags: `flags.m39_analytics = false`
- Configure AI insights service
- Wire analytics provider for event tracking

### Step 1: Build Dashboard Builder (4 hours)

- Drag-and-drop canvas component
- Widget library sidebar
- Dashboard save/publish functionality
- Template loader

### Step 2: Build AI Insights Dashboard (3 hours)

- Insights list with severity badges
- Anomaly detection visualization
- Trend prediction charts
- Dismiss/investigate actions

### Step 3: Build Report Scheduler (3 hours)

- Report library grid
- Schedule creation form
- Scheduled reports table
- Execute/pause controls

### Step 4: Add Widget Types (3 hours)

- KPI cards, charts (line, bar, pie, gauge)
- Data tables with drill-down
- Heatmaps, waterfall charts

### Step 5: Add Tests (2 hours)

- Unit tests for widget configuration, AI confidence
- Integration tests for data queries, report generation
- E2E tests for complete user flows

**Total**: 2 days (16 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Dashboard layout persistence and serialization
- [ ] Widget configuration validation
- [ ] AI insight confidence calculation (≥70% threshold)
- [ ] Report schedule cron expression parsing
- [ ] Query builder validation
- [ ] Export format conversion (PDF, Excel, CSV)
- [ ] Row-level security filter application

### Integration Tests

- [ ] Real-time data refresh (5min interval)
- [ ] Report generation and delivery (email)
- [ ] AI model predictions and anomaly detection
- [ ] Dashboard template loading
- [ ] Widget data queries across modules
- [ ] Scheduled report execution

### E2E Tests

- [ ] User can build custom dashboard (drag-and-drop)
- [ ] User can add/configure widgets
- [ ] User can publish and share dashboard
- [ ] AI insights surface automatically
- [ ] User can dismiss/investigate insights
- [ ] User can schedule report with recipients
- [ ] Scheduled report delivers via email
- [ ] User can export report (PDF/Excel/CSV)

### Accessibility Tests

- [ ] Keyboard navigation works (drag-and-drop alternative)
- [ ] Screen reader announces chart data
- [ ] Focus management correct
- [ ] Color contrast meets WCAG 2.2 AA
- [ ] Axe: 0 serious/critical violations

### Contract Tests

- [ ] API calls match OpenAPI spec

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for all widget types

### Performance Tests

- [ ] Bundle size < 300KB gzipped
- [ ] Dashboard render (10 widgets) < 2s
- [ ] Report generation (100 pages) < 30s

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/analytics.fixtures.ts`

**Datasets**:

- `minimalDashboard`: 3 widgets (KPI, line chart, table)
- `standardDashboard`: 10 widgets across all types
- `largeDataset`: 50 widgets (for performance testing)
- `edgeCases`: Special scenarios

**Edge Cases Covered**:

- Dashboard with max widgets (50)
- Query timeout scenarios
- AI insights with varying confidence levels
- Report with 100,000 rows (Excel limit)
- Scheduled report with multiple recipients
- Widget with no data

### E2E Seed Data

**Location**: `tests/seeds/analytics.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:analytics
```

**Dataset**:

- 20 sample dashboards (various templates)
- 50 AI insights across all modules
- 10 scheduled reports
- Historical data for trend analysis

**Cleanup Command**:

```powershell
pnpm run seed:analytics:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Executive dashboard (C-suite KPIs)
- Finance dashboard (P&L, balance sheet, cash flow)
- Operations dashboard (orders, inventory, projects)
- AI insights with realistic anomalies and trends

**Regeneration**:

```powershell
pnpm run demo:reset:analytics
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] No orphaned widget references
- [ ] Dashboard layouts are valid grid configurations

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
- **Interactive Parts**: Mark with `"use client"` (dashboard builder, widgets)

### Data Fetching Strategy

| Scenario          | Strategy                   | Benefit             |
| ----------------- | -------------------------- | ------------------- |
| Dashboard List    | Server-side fetch + stream | Faster TTFB         |
| Dashboard Builder | Client-side React Query    | Interactive updates |
| AI Insights       | Client-side with polling   | Real-time updates   |
| Report Generation | Background job             | No UI blocking      |

---

## 📊 Analytics & Audit Events

| Event                      | When               | Properties                                     |
| -------------------------- | ------------------ | ---------------------------------------------- |
| Analytics.DashboardCreated | Dashboard saved    | `dashboard_id`, `widget_count`, `data_sources` |
| Analytics.DashboardShared  | Dashboard shared   | `dashboard_id`, `shared_with`                  |
| Analytics.ReportScheduled  | Schedule created   | `report_id`, `frequency`, `recipients_count`   |
| Analytics.ReportGenerated  | Report executed    | `report_id`, `format`, `rows`, `duration_ms`   |
| Analytics.InsightGenerated | AI insight created | `insight_id`, `type`, `confidence`, `severity` |
| Analytics.InsightDismissed | Insight dismissed  | `insight_id`, `reason`                         |

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/analytics.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties

### Keyboard Shortcuts

| Key      | Action              | Scope          |
| -------- | ------------------- | -------------- |
| `/`      | Focus search        | Any page       |
| `d`      | New dashboard       | Dashboard list |
| `r`      | Schedule report     | Report library |
| `x`      | Dismiss insight     | Insights       |
| `Enter`  | Open/edit dashboard | Dashboard list |
| `Escape` | Close modal         | Modal          |

---

## 📅 Timeline & Milestones

| Day | Tasks                                                  | Deliverable              | Flag Status |
| --- | ------------------------------------------------------ | ------------------------ | ----------- |
| 1   | Setup + Dashboard Builder + Widget Library + Templates | Basic dashboard creation | WIP         |
| 2   | AI Insights + Report Scheduler + Export + Tests        | Production-ready module  | GA          |

**Total Effort**: 2 days (16 hours)

**Feature Flags**:

- Day 1: `flags.m39_analytics = false` (testing only)
- Day 2: `flags.m39_analytics = true` after all tests pass

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                          | Duration | Rollback Trigger |
| ----------- | ---------------- | ----------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                          | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, dashboard render < 2s | 2 days   | Test failures    |
| Production  | Beta users (10%) | Error rate < 0.5%, AI accuracy ≥80%       | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 1 week, no performance issues | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m39_analytics: false,              // Master toggle
  m39_analytics_ai_insights: false,  // AI insights
  m39_analytics_report_scheduler: false, // Report scheduling
  m39_analytics_exports: false,      // Export functionality
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Dashboard render time (target: <2s)
- AI insight accuracy (target: ≥80%)
- Report generation success rate (target: ≥99%)
- Query timeout rate (target: <2%)

**Alert Thresholds**:

- Dashboard render > 5s for 10min → investigate
- AI accuracy < 70% → retrain model
- Report generation failures > 2% → page on-call

### UI Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m39_analytics = false`

   ```powershell
   pnpm run flags:set m39_analytics=false
   ```

2. **Stop scheduled reports**:

   ```powershell
   pnpm run analytics:scheduler:pause
   ```

3. **Monitor for 15 minutes**:

   - No new dashboard renders
   - Users see fallback message

4. **Post-mortem**: Create incident report, add regression test

**Rollback Decision Matrix**:

| Scenario                       | Action             | Approval Required |
| ------------------------------ | ------------------ | ----------------- |
| Dashboard render > 10s         | Immediate rollback | No (auto-trigger) |
| AI accuracy < 60%              | Disable AI only    | Data team lead    |
| Report generation failures >5% | Immediate rollback | No (auto-trigger) |
| Query timeout rate > 10%       | Investigate first  | Backend lead      |

---

## 🔗 Dependencies

### Must Complete Before Starting

- ✅ M1: Core Ledger (data source)
- ✅ All other modules M2-M38 (data sources)
- 🆕 Feature flag service
- 🆕 Analytics provider
- 🆕 AI insights service
- 🆕 Report generation service

### Blocks These Modules

- Enhanced all modules with embedded analytics

---

## 🎯 Success Criteria

### Must Have (Measurable)

- [ ] Drag-and-drop dashboard builder works
- [ ] AI-powered insights engine (≥80% accuracy)
- [ ] Automated report scheduler
- [ ] Dashboard render < 2s (10 widgets)
- [ ] AI insights generation < 3s
- [ ] Report generation < 30s (100 pages)
- [ ] Axe: 0 serious/critical violations

### Should Have

- [ ] 50+ widget types available
- [ ] 100+ pre-built reports
- [ ] Real-time data refresh (5min)
- [ ] Export to PDF/Excel/CSV
- [ ] Dashboard sharing and permissions

### Nice to Have

- [ ] Natural language query interface
- [ ] Mobile dashboard app
- [ ] Embedded analytics in other modules
- [ ] Predictive analytics (ML forecasting)

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

- Tableau/Power BI UX patterns
- Looker dashboard design
- D3.js visualization patterns
- AI/ML best practices for business insights

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Cost/Scaling**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: AI Model Accuracy

**Mitigation**: Regular retraining on production data; confidence thresholds (≥70%); human review for high-impact insights; A/B testing of models; feedback loop for dismissed insights

### Risk #2: Dashboard Performance with Many Widgets

**Mitigation**: Widget virtualization; lazy loading (load on scroll); query caching; widget data pagination; real-time vs scheduled refresh options; query optimization

### Risk #3: Report Generation Scalability

**Mitigation**: Background job queue (Bull/BullMQ); pagination for large datasets; streaming export; incremental report generation; timeout limits (30s) with automatic scheduling suggestion

### Risk #4: Data Source Integration Complexity

**Mitigation**: Standardized query interface across all modules; data validation; error handling; query timeout limits; row-level security enforcement; SQL injection prevention

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional
- [ ] Dashboard builder with drag-and-drop works
- [ ] 50+ widget types available
- [ ] AI insights engine generates insights
- [ ] Report scheduler with email delivery
- [ ] 100+ pre-built reports
- [ ] Export to PDF/Excel/CSV
- [ ] Dashboard sharing and permissions
- [ ] All error states handled
- [ ] Copy deck implemented

### Quality Gates 🎯

**Enforced in CI** - Build fails if any gate not met

#### Code Quality

- [ ] TypeScript: 0 errors, 0 warnings
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Prettier: All files formatted
- [ ] No console.log or debugger statements

#### Test Coverage

- [ ] Unit tests: ≥90% line coverage, ≥95% for AI logic
- [ ] Integration tests: All query scenarios covered
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

#### AI Model Accuracy

- [ ] **CRITICAL**: AI insight accuracy ≥80% (validated on test dataset)
- [ ] Confidence calibration accurate (≥70% threshold)
- [ ] Anomaly detection precision ≥75%, recall ≥70%
- [ ] Trend prediction MAPE (Mean Absolute Percentage Error) < 15%

#### Performance Budgets

- [ ] Bundle size: ≤300KB gzipped
- [ ] TTFB: ≤70ms on staging
- [ ] Dashboard render (10 widgets): <2s
- [ ] AI insights generation: <3s
- [ ] Report generation (100 pages): <30s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable (drag-and-drop alternative)
- [ ] Screen reader: All visualizations accessible with data tables
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly
- [ ] Error tracking integrated
- [ ] Performance monitoring active
- [ ] AI model monitoring dashboards
- [ ] Alerts configured (render time, AI accuracy, report failures)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Row-level security for all queries
- [ ] Query sandboxing (SQL injection prevention)
- [ ] Timeout limits enforced (30s)
- [ ] PII masking in reports
- [ ] Security review completed

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete
- [ ] Storybook stories for all widget types
- [ ] API contracts synchronized
- [ ] i18n keys documented
- [ ] AI model documentation (training, accuracy)
- [ ] UAT passed (PM/QA sign-off)

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured
- [ ] Smoke tests passed on staging
- [ ] AI model deployed and validated (≥80% accuracy)
- [ ] Deployed to production (flags off)
- [ ] Rollback procedure tested
- [ ] Gradual rollout plan ready

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All test plans executed and passed
- [ ] **Design**: UI matches specs, brand compliance
- [ ] **PM**: Feature complete, acceptance criteria met
- [ ] **Security**: Security review passed
- [ ] **Accessibility**: A11y audit passed
- [ ] **Data Team**: AI model accuracy validated (≥80%)

---

**Ready to build? Start with Step 0! 🚀**

**Next Module**: M40 - API Gateway (FINAL MODULE!)
