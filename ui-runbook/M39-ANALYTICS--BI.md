# 🚀 M39: Analytics & BI - UI Implementation Runbook

**Module ID**: M39  
**Module Name**: Analytics & BI  
**Priority**: MEDIUM  
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

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 12 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/analytics/dashboards` - Dashboard management
- ✅ `/api/analytics/reports` - Report generation
- ✅ `/api/analytics/insights` - AI insights
- ✅ `/api/analytics/data` - Data queries

**Total Endpoints**: 12

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

## 🔌 API Integration

```typescript
// apps/web/hooks/useAnalytics.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@aibos/api-client';

export function useDashboards() {
  return useQuery({
    queryKey: ['dashboards'],
    queryFn: () => apiClient.GET('/api/analytics/dashboards'),
  });
}

export function useAIInsights() {
  return useQuery({
    queryKey: ['ai-insights'],
    queryFn: () => apiClient.GET('/api/analytics/insights'),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

export function useReportScheduler() {
  return useQuery({
    queryKey: ['report-schedules'],
    queryFn: () => apiClient.GET('/api/analytics/reports'),
  });
}

export function useSaveDashboard() {
  return useMutation({
    mutationFn: dashboardData =>
      apiClient.POST('/api/analytics/dashboards', { body: dashboardData }),
    onSuccess: () => queryClient.invalidateQueries(['dashboards']),
  });
}
```

---

## 📝 Implementation Guide

### Day 1: Dashboard Builder (8 hours)

1. Build drag-and-drop canvas (4 hours)
2. Implement widget library (2 hours)
3. Create dashboard templates (2 hours)

### Day 2: AI Insights & Reports (8 hours)

1. Build AI insights dashboard (3 hours)
2. Implement report scheduler (3 hours)
3. Create report library (2 hours)

**Total**: 2 days (16 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Dashboard layout persistence
- [ ] Insight confidence calculation
- [ ] Report schedule generation

### Integration Tests

- [ ] Real-time data refresh
- [ ] Report generation and delivery
- [ ] AI model predictions

### E2E Tests

- [ ] User can build custom dashboard
- [ ] AI insights surface automatically
- [ ] Scheduled reports deliver via email

---

## 📅 Timeline

| Day | Deliverable                      |
| --- | -------------------------------- |
| 1   | Dashboard builder with templates |
| 2   | AI insights and report scheduler |

**Total**: 2 days (16 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger (data source)
- ✅ All other modules (data sources)

### Enables These Modules

- Enhanced all modules with analytics capabilities

---

## 🎯 Success Criteria

### Must Have

- [ ] Drag-and-drop dashboard builder
- [ ] AI-powered insights engine
- [ ] Automated report scheduler

### Should Have

- [ ] 50+ widget types
- [ ] 100+ pre-built reports
- [ ] Real-time data refresh

### Nice to Have

- [ ] Natural language query ("Show me top customers")
- [ ] Mobile dashboard app
- [ ] Embedded analytics in other modules

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M38 - CRM Integration  
**Next**: M40 - API Gateway (FINAL MODULE!)
