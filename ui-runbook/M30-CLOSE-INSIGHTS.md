# 🚀 M30: Close Insights - UI Implementation Runbook

**Module ID**: M30  
**Module Name**: Close Insights  
**Priority**: MEDIUM  
**Phase**: 8 - SOX & ITGC  
**Estimated Effort**: 1 day  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

M30 delivers advanced analytics and intelligence for the financial close process, providing predictive insights, performance metrics, and bottleneck identification. This module transforms close management from reactive to proactive, enabling finance teams to anticipate issues and optimize close performance.

### Business Value

- **Predictive Intelligence**: AI forecasts close completion date with 95% accuracy by Day 3
- **Performance Optimization**: Identifies bottlenecks reducing close time by 30%
- **Executive Visibility**: Real-time dashboards show close health to CFO/CEO
- **Trend Analysis**: Historical insights guide continuous process improvement
- **Risk Mitigation**: Early warning alerts prevent close delays before they occur

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-close-analytics], [ADR-###-predictive-modeling], [ADR-###-benchmarking]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 8 endpoints implemented       |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

**Performance Analytics** (3 endpoints):

- ✅ `/api/insights/close-performance` - Current close metrics
- ✅ `/api/insights/bottlenecks` - Bottleneck detection
- ✅ `/api/insights/velocity` - Task completion velocity

**Predictive Analytics** (3 endpoints):

- ✅ `/api/insights/predictions` - Close completion predictions
- ✅ `/api/insights/scenarios` - Scenario analysis
- ✅ `/api/insights/confidence` - Prediction confidence scores

**Trend Analysis** (2 endpoints):

- ✅ `/api/insights/trends` - Historical trend analysis
- ✅ `/api/insights/benchmarks` - Industry benchmarking

**Total Endpoints**: 8 (3 categories)

### Risks & Blockers

| Risk                              | Impact | Mitigation                                                   | Owner        |
| --------------------------------- | ------ | ------------------------------------------------------------ | ------------ |
| Prediction accuracy < 90%         | HIGH   | Continuous model training; historical data validation        | @data-sci    |
| Historical data quality issues    | HIGH   | Data validation; anomaly detection; manual review            | @data-ops    |
| Real-time refresh performance     | MED    | Caching strategy; incremental updates; background processing | @backend-eng |
| Industry benchmark data freshness | MED    | Quarterly benchmark updates; vendor integration              | @analytics   |
| User trust in AI predictions      | MED    | Confidence scores; explainability; historical accuracy stats | @product     |

---

## 🎯 3 Killer Features

### 1. **Close Performance Analytics** 🚀

**Description**: Comprehensive dashboard showing real-time close progress, cycle time trends, task completion velocity, and comparison to prior periods. Features drill-down by entity, department, and task type with automated variance analysis.

**Why It's Killer**:

- **Real-Time Tracking**: Live close progress updates every 15 minutes (SAP shows static data)
- **Comparative Analysis**: Instantly compare to prior 12 closes (Oracle requires manual reports)
- **Velocity Metrics**: Shows completion rate to predict finish date (competitors lack this)
- **Measurable Impact**: Teams reduce close time from 10 days to 5 days using insights
- **Vs BlackLine**: More visual, executive-friendly dashboards (BlackLine is task-focused)

**Implementation**:

```typescript
import { Card, Chart, Badge, DataTable, ProgressBar } from "aibos-ui";
import { useCloseInsights } from "@/hooks/useCloseInsights";

export default function ClosePerformanceDashboard() {
  const { currentClose, comparison, velocity } = useCloseInsights();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Current Close</h3>
          <div className="text-2xl font-bold">
            {currentClose.period} - Day {currentClose.day}
          </div>
          <Badge
            variant={
              currentClose.status === "On Track"
                ? "success"
                : currentClose.status === "At Risk"
                ? "warning"
                : "error"
            }
          >
            {currentClose.status}
          </Badge>
        </Card>
        <Card>
          <h3>Overall Progress</h3>
          <div className="text-4xl font-bold">
            {currentClose.completion_pct}%
          </div>
          <ProgressBar value={currentClose.completion_pct} />
        </Card>
        <Card>
          <h3>Tasks Remaining</h3>
          <div className="text-4xl font-bold text-orange-600">
            {currentClose.tasks_remaining}
          </div>
          <p className="text-sm text-gray-600">of {currentClose.total_tasks}</p>
        </Card>
        <Card>
          <h3>Predicted Finish</h3>
          <div className="text-2xl font-bold">
            {currentClose.predicted_completion_date}
          </div>
          <Badge variant={currentClose.days_ahead >= 0 ? "success" : "error"}>
            {currentClose.days_ahead >= 0 ? "+" : ""}
            {currentClose.days_ahead} days vs target
          </Badge>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Close Cycle Time Trend">
          <Chart
            type="line"
            data={{
              labels: comparison.periods,
              datasets: [
                {
                  label: "Days to Close",
                  data: comparison.days_to_close,
                  borderColor: "rgb(59, 130, 246)",
                  fill: false,
                },
                {
                  label: "Target",
                  data: comparison.target,
                  borderColor: "rgb(34, 197, 94)",
                  borderDash: [5, 5],
                  fill: false,
                },
              ],
            }}
            options={{
              scales: {
                y: {
                  beginAtZero: false,
                  title: { display: true, text: "Days" },
                },
              },
            }}
          />
        </Card>

        <Card title="Task Completion Velocity">
          <Chart
            type="bar"
            data={{
              labels: velocity.days,
              datasets: [
                {
                  label: "Tasks Completed",
                  data: velocity.completed,
                  backgroundColor: "rgb(34, 197, 94)",
                },
                {
                  label: "Target Velocity",
                  data: velocity.target,
                  backgroundColor: "rgb(203, 213, 225)",
                },
              ],
            }}
          />
          <p className="mt-4 text-sm text-gray-600">
            Average: {velocity.avg_per_day} tasks/day (Target:{" "}
            {velocity.target_avg})
          </p>
        </Card>
      </div>

      <Card title="Performance by Entity">
        <DataTable
          data={currentClose.by_entity}
          columns={[
            { key: "entity_name", label: "Entity" },
            {
              key: "completion_pct",
              label: "Progress",
              render: (_, row) => (
                <div className="w-full">
                  <div className="flex justify-between mb-1">
                    <span>{row.completion_pct}%</span>
                    <span className="text-sm text-gray-600">
                      {row.completed}/{row.total} tasks
                    </span>
                  </div>
                  <ProgressBar value={row.completion_pct} />
                </div>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (_, row) => (
                <Badge
                  variant={
                    row.status === "Complete"
                      ? "success"
                      : row.status === "On Track"
                      ? "info"
                      : row.status === "At Risk"
                      ? "warning"
                      : "error"
                  }
                >
                  {row.status}
                </Badge>
              ),
            },
            { key: "days_vs_target", label: "vs Target" },
            { key: "bottlenecks", label: "Bottlenecks" },
          ]}
        />
      </Card>
    </div>
  );
}
```

### 2. **Trend Analysis & Benchmarking** ⚡

**Description**: Historical analysis showing close performance trends, year-over-year improvements, and benchmarking against industry standards. Features automated insights highlighting improvement opportunities and best practices.

**Why It's Killer**:

- **Historical Intelligence**: 36-month trend analysis identifies patterns (competitors show current close only)
- **Industry Benchmarks**: Compare your close time to industry peers (unique to aibos)
- **Automated Insights**: AI identifies "why" close is faster/slower (others just show data)
- **Measurable Impact**: Finance teams present CFO with proof of continuous improvement

**Implementation**:

```typescript
import { Card, Chart, Badge, Alert } from "aibos-ui";
import { useTrendAnalysis } from "@/hooks/useCloseInsights";

export default function TrendAnalysis() {
  const { trends, insights, benchmarks } = useTrendAnalysis();

  return (
    <div className="space-y-6">
      <Alert variant="info">
        <strong>AI Insight:</strong> {insights.primary_finding}
      </Alert>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Avg Close Time (Last 12 Months)</h3>
          <div className="text-4xl font-bold">{trends.avg_days} days</div>
          <Badge variant={trends.trend === "improving" ? "success" : "error"}>
            {trends.change_pct}% vs prior year
          </Badge>
        </Card>
        <Card>
          <h3>Industry Benchmark</h3>
          <div className="text-4xl font-bold">
            {benchmarks.industry_avg} days
          </div>
          <p className="text-sm text-gray-600">
            You're {benchmarks.vs_industry} days {benchmarks.position}
          </p>
        </Card>
        <Card>
          <h3>Best-in-Class</h3>
          <div className="text-4xl font-bold">
            {benchmarks.best_in_class} days
          </div>
          <p className="text-sm text-gray-600">Top 10% of companies</p>
        </Card>
      </div>

      <Card title="Close Time Trend (36 Months)">
        <Chart
          type="line"
          data={{
            labels: trends.months,
            datasets: [
              {
                label: "Your Close Time",
                data: trends.your_data,
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                fill: true,
              },
              {
                label: "Industry Average",
                data: trends.industry_data,
                borderColor: "rgb(156, 163, 175)",
                borderDash: [5, 5],
                fill: false,
              },
              {
                label: "Best-in-Class",
                data: trends.best_in_class_data,
                borderColor: "rgb(34, 197, 94)",
                borderDash: [5, 5],
                fill: false,
              },
            ],
          }}
        />
      </Card>

      <Card title="Key Insights">
        <div className="space-y-4">
          {insights.findings.map((finding, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Badge variant="info">{finding.type}</Badge>
                <div>
                  <h4 className="font-semibold">{finding.title}</h4>
                  <p className="text-sm text-gray-600">{finding.description}</p>
                  <p className="text-sm text-blue-600 mt-2">
                    💡 Recommendation: {finding.recommendation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Improvement Areas">
          <DataTable
            data={trends.improvement_opportunities}
            columns={[
              { key: "area", label: "Process Area" },
              { key: "current_avg", label: "Current Avg" },
              { key: "target", label: "Target" },
              {
                key: "potential_savings",
                label: "Potential",
                render: (_, row) => (
                  <Badge variant="success">{row.potential_savings} days</Badge>
                ),
              },
            ]}
          />
        </Card>

        <Card title="Best Practices Achieved">
          <div className="space-y-3">
            {trends.best_practices.map((practice, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Badge variant="success">✓</Badge>
                <div>
                  <div className="font-semibold">{practice.name}</div>
                  <div className="text-sm text-gray-600">
                    {practice.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
```

### 3. **Predictive Close Completion** 💎

**Description**: AI-powered prediction engine that forecasts close completion date based on current progress, historical patterns, and bottleneck analysis. Features daily updates, confidence scoring, and scenario analysis.

**Why It's Killer**:

- **Accurate Predictions**: 95% accuracy by Day 3 (vs. manual guesses)
- **Early Warnings**: Alerts CFO 3-4 days before potential delays (competitors react after delays)
- **Scenario Planning**: Shows "what-if" analysis for resource allocation
- **Measurable Impact**: Eliminates surprise close delays and last-minute panic

**Implementation**:

```typescript
import { Card, Chart, Badge, Alert, Button } from "aibos-ui";
import { usePredictiveAnalytics } from "@/hooks/useCloseInsights";

export default function PredictiveCloseCompletion() {
  const { prediction, scenarios, factors } = usePredictiveAnalytics();

  return (
    <div className="space-y-6">
      {prediction.confidence >= 80 && prediction.days_late > 0 && (
        <Alert variant="warning">
          <strong>⚠️ Close Delay Predicted!</strong>
          <p>
            Current trajectory shows close finishing {prediction.days_late} days
            late. Review bottlenecks below.
          </p>
        </Alert>
      )}

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Predicted Completion</h3>
          <div className="text-2xl font-bold">{prediction.predicted_date}</div>
          <Badge
            variant={
              prediction.confidence >= 90
                ? "success"
                : prediction.confidence >= 70
                ? "warning"
                : "error"
            }
          >
            {prediction.confidence}% confidence
          </Badge>
        </Card>
        <Card>
          <h3>Target Date</h3>
          <div className="text-2xl font-bold">{prediction.target_date}</div>
          <p className="text-sm text-gray-600">
            Business Day {prediction.target_day}
          </p>
        </Card>
        <Card>
          <h3>Current Trajectory</h3>
          <div className="text-4xl font-bold">
            {prediction.days_late > 0 ? "+" : ""}
            {prediction.days_late}
          </div>
          <Badge variant={prediction.days_late <= 0 ? "success" : "error"}>
            days {prediction.days_late > 0 ? "late" : "early"}
          </Badge>
        </Card>
        <Card>
          <h3>Completion Probability</h3>
          <div className="text-4xl font-bold">
            {prediction.on_time_probability}%
          </div>
          <p className="text-sm text-gray-600">On-time finish</p>
        </Card>
      </div>

      <Card title="Predicted Timeline">
        <Chart
          type="line"
          data={{
            labels: prediction.timeline.days,
            datasets: [
              {
                label: "Predicted Progress",
                data: prediction.timeline.predicted,
                borderColor: "rgb(59, 130, 246)",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                fill: true,
              },
              {
                label: "Target Progress",
                data: prediction.timeline.target,
                borderColor: "rgb(34, 197, 94)",
                borderDash: [5, 5],
                fill: false,
              },
              {
                label: "Actual Progress",
                data: prediction.timeline.actual,
                borderColor: "rgb(249, 115, 22)",
                fill: false,
              },
            ],
          }}
          options={{
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: { display: true, text: "% Complete" },
              },
            },
          }}
        />
      </Card>

      <Card title="Key Factors Impacting Prediction">
        <DataTable
          data={factors}
          columns={[
            { key: "factor", label: "Factor" },
            {
              key: "impact",
              label: "Impact",
              render: (_, row) => (
                <Badge
                  variant={
                    row.impact === "High"
                      ? "error"
                      : row.impact === "Medium"
                      ? "warning"
                      : "success"
                  }
                >
                  {row.impact}
                </Badge>
              ),
            },
            { key: "description", label: "Description" },
            { key: "days_impact", label: "Days Impact" },
            {
              key: "actions",
              label: "Action",
              render: (_, row) =>
                row.actionable && (
                  <Button size="sm" variant="outline">
                    Address Issue
                  </Button>
                ),
            },
          ]}
        />
      </Card>

      <Card title="Scenario Analysis">
        <p className="mb-4 text-gray-600">
          What-if scenarios to improve close timing:
        </p>
        <DataTable
          data={scenarios}
          columns={[
            { key: "scenario_name", label: "Scenario" },
            { key: "description", label: "Action" },
            {
              key: "predicted_impact",
              label: "Time Saved",
              render: (_, row) => (
                <Badge variant="success">{row.predicted_impact} days</Badge>
              ),
            },
            { key: "effort", label: "Effort" },
            { key: "new_completion_date", label: "New Est. Finish" },
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

#### 1. Main Page (`/insights/dashboard`)

**Components**: Card, Chart, Badge, ProgressBar, DataTable
**File**: `apps/web/app/(dashboard)/insights/page.tsx`

#### 2. Trends Page (`/insights/trends`)

**Components**: Chart, Card, Badge, Alert
**File**: `apps/web/app/(dashboard)/insights/trends/page.tsx`

#### 3. Predictions Page (`/insights/predictions`)

**Components**: Chart, Card, Badge, Alert, Button
**File**: `apps/web/app/(dashboard)/insights/predictions/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                     | Target          | Measurement          |
| -------------------------- | --------------- | -------------------- |
| TTFB (staging)             | ≤ 70ms          | Server timing header |
| Client TTI for `/insights` | ≤ 200ms         | Lighthouse CI        |
| Dashboard load             | < 1s            | Performance profiler |
| Chart rendering            | < 500ms         | Browser profiler     |
| Prediction calculation     | < 2s            | API response time    |
| Trend analysis load        | < 3s            | Performance profiler |
| Real-time refresh          | Every 15 min    | Automatic polling    |
| UI bundle size             | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to all charts and data tables
- **Focus Management**: Focus trap in modals; chart navigation
- **ARIA**: Chart data announced; prediction updates communicated
- **Screen Reader**: All metrics and insights announced; trends described
- **Axe Target**: 0 serious/critical violations

### Security

| Layer         | Requirement                                      |
| ------------- | ------------------------------------------------ |
| RBAC Scopes   | `insights.read`, `insights.admin`                |
| Enforcement   | Server-side on all endpoints                     |
| Data Exposure | Only show close data user has permission to view |
| Audit Trail   | Log all insights access and prediction requests  |
| AI Model      | Secure model storage; prevent model extraction   |
| Rate Limiting | Protect prediction endpoints; prevent abuse      |

#### UI Permissions Matrix

| Role           | View Dashboard | View Trends | View Predictions | Export Data | Admin |
| -------------- | -------------- | ----------- | ---------------- | ----------- | ----- |
| insights.read  | ✅             | ✅          | ✅               | ❌          | ❌    |
| insights.admin | ✅             | ✅          | ✅               | ✅          | ✅    |

### Reliability & Observability

- **SLO**: 99.9% insights dashboard availability; 95% prediction accuracy
- **SLA Dashboards**: Real-time metrics on dashboard performance, prediction accuracy
- **Events Emitted**: `Insights.DashboardViewed`, `Insights.PredictionGenerated`, `Insights.BenchmarkCompared`
- **Logging**: Structured logs with close IDs for all insights requests
- **Tracing**: Distributed tracing for prediction calculations
- **Monitoring**: Dashboard load time; prediction accuracy; model performance

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Close Insights Rules

| Rule                    | Enforcement                                                |
| ----------------------- | ---------------------------------------------------------- |
| **Prediction Accuracy** | Maintain ≥95% accuracy by Day 3; continuous model training |
| **Historical Data**     | Minimum 12 months for trend analysis; 3 years preferred    |
| **Real-Time Updates**   | Refresh every 15 minutes; manual refresh available         |
| **Confidence Scoring**  | Show confidence for all predictions; >80% = reliable       |
| **Benchmark Freshness** | Industry benchmarks updated quarterly                      |
| **Data Quality**        | Validate historical data; flag anomalies                   |
| **Scenario Analysis**   | Show impact of 3-5 scenarios; ranked by feasibility        |
| **Audit Trail**         | Log all insight requests; track prediction accuracy        |

### Insight States

- **Close Status**: Not Started → In Progress → On Track → At Risk → Delayed → Complete
- **Prediction Confidence**: Low (< 70%) → Medium (70-89%) → High (≥ 90%)
- **Trend**: Improving → Stable → Declining
- **Benchmark Position**: Best-in-Class → Above Average → Average → Below Average

### Archive Semantics

- **Historical Data**: Retain all close performance data indefinitely
- **Prediction History**: Maintain prediction accuracy tracking for 3 years
- **Benchmarks**: Archive outdated benchmarks; maintain version history
- **Guard Rails**:
  - ❌ Deny deletion of current close data
  - ❌ Deny modification of historical actuals
  - ✅ Allow recalculation of predictions with updated models
  - ✅ Allow benchmark refresh

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                    | User Action      |
| --------------------- | ----------------------------- | ---------------- |
| **Empty**             | "No close data available"     | "Configure"      |
| **Loading**           | Skeleton charts               | N/A              |
| **Error**             | Error message + retry         | Retry / Support  |
| **On Track**          | Green badge "On Track"        | View details     |
| **At Risk**           | Orange badge "At Risk"        | View bottlenecks |
| **Delayed**           | Red badge "Delayed"           | View factors     |
| **Complete**          | Green badge "Complete"        | View summary     |
| **Low Confidence**    | Yellow badge "Low Confidence" | View factors     |
| **High Confidence**   | Green badge "High Confidence" | View prediction  |
| **Insufficient Data** | "Not enough historical data"  | Continue close   |
| **Permission Denied** | "Access restricted"           | Back             |

### Form Validation

- **Date Ranges**: Validate historical date ranges; prevent future dates
- **Filters**: Validate entity/department filters
- **Scenario Inputs**: Validate scenario assumptions

### Network Errors

| HTTP Status | UI Message                                      | Action              |
| ----------- | ----------------------------------------------- | ------------------- |
| 400         | "Invalid request. Check your filters."          | Inline field errors |
| 401         | "Session expired. Please log in again."         | Redirect to login   |
| 403         | "You don't have permission for insights."       | Hide action         |
| 404         | "Close data not found."                         | Return to list      |
| 422         | "Validation failed."                            | Inline errors       |
| 500         | "Analytics failed. Our team has been notified." | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/insights.json`.

### Page Titles & Headers

| Context     | Copy                   | i18n Key                     |
| ----------- | ---------------------- | ---------------------------- |
| Dashboard   | "Close Insights"       | `insights.dashboard.title`   |
| Trends      | "Trend Analysis"       | `insights.trends.title`      |
| Predictions | "Predictive Analytics" | `insights.predictions.title` |
| Benchmarks  | "Industry Benchmarks"  | `insights.benchmarks.title`  |

### State Messages

| State           | Title                        | Message                                  | Action Button | i18n Key               |
| --------------- | ---------------------------- | ---------------------------------------- | ------------- | ---------------------- |
| Empty           | "No insights available"      | "Complete at least one close to view"    | "Back"        | `insights.empty.*`     |
| On Track        | "Close on track"             | "Projected to finish on time"            | "View"        | `insights.onTrack.*`   |
| At Risk         | "Close at risk"              | "Review bottlenecks to stay on target"   | "View"        | `insights.atRisk.*`    |
| Delayed         | "Close delayed"              | "Immediate action required"              | "Review"      | `insights.delayed.*`   |
| High Confidence | "High confidence prediction" | "95% confidence based on current data"   | "View"        | `insights.confident.*` |
| Low Confidence  | "Low confidence"             | "More data needed for accurate forecast" | "Continue"    | `insights.lowConf.*`   |

### Success Messages (Toast)

| Action             | Message                         | i18n Key                      |
| ------------------ | ------------------------------- | ----------------------------- |
| Dashboard Loaded   | "Insights loaded successfully"  | `insights.load.success`       |
| Prediction Updated | "Prediction updated"            | `insights.prediction.success` |
| Benchmark Compared | "Benchmark comparison complete" | `insights.benchmark.success`  |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useCloseInsights.ts
"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useCloseInsights(filters = {}) {
  return useQuery({
    queryKey: ["insights", "close-performance", filters],
    queryFn: () =>
      apiClient.GET("/api/insights/close-performance", { query: filters }),
    staleTime: 15 * 60_000, // 15min
    retry: 2,
    select: (response) => response.data,
    onError: () => {
      toast.error("Failed to load close insights.");
    },
  });
}

export function useBottlenecks(closeId: string) {
  return useQuery({
    queryKey: ["insights", "bottlenecks", closeId],
    queryFn: () =>
      apiClient.GET("/api/insights/bottlenecks", {
        query: { close_id: closeId },
      }),
    staleTime: 5 * 60_000, // 5min
    retry: 2,
    enabled: !!closeId,
    select: (response) => response.data,
  });
}

export function useTrendAnalysis(filters = {}) {
  return useQuery({
    queryKey: ["insights", "trends", filters],
    queryFn: () => apiClient.GET("/api/insights/trends", { query: filters }),
    staleTime: 60 * 60_000, // 1 hour
    retry: 2,
    select: (response) => response.data,
  });
}

export function useBenchmarks() {
  return useQuery({
    queryKey: ["insights", "benchmarks"],
    queryFn: () => apiClient.GET("/api/insights/benchmarks"),
    staleTime: 24 * 60 * 60_000, // 24 hours
    retry: 2,
    select: (response) => response.data,
  });
}

export function usePredictiveAnalytics(closeId: string) {
  return useQuery({
    queryKey: ["insights", "predictions", closeId],
    queryFn: () =>
      apiClient.GET("/api/insights/predictions", {
        query: { close_id: closeId },
      }),
    staleTime: 15 * 60_000, // 15min
    refetchInterval: 15 * 60 * 1000, // Auto-refresh every 15 minutes
    retry: 2,
    enabled: !!closeId,
    select: (response) => response.data,
  });
}

export function useScenarioAnalysis(closeId: string) {
  return useQuery({
    queryKey: ["insights", "scenarios", closeId],
    queryFn: () =>
      apiClient.GET("/api/insights/scenarios", {
        query: { close_id: closeId },
      }),
    staleTime: 30 * 60_000, // 30min
    retry: 2,
    enabled: !!closeId,
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error        | User Message                                    | UI Action            |
| ---------------- | ----------------------------------------------- | -------------------- |
| 400 (Bad Req)    | "Invalid request. Check your filters."          | Inline field errors  |
| 403 (Forbidden)  | "You don't have permission for insights."       | Hide action          |
| 404 (Not Found)  | "Close data not found."                         | Return to list       |
| 422 (Validation) | "Validation failed."                            | Inline errors        |
| 500 (Server)     | "Analytics failed. Our team has been notified." | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Predictions**: Auto-refresh every 15 minutes during active close
- **Network timeouts**: 10s for queries, 30s for predictions

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["insights", "close-performance", { filters }][
  ("insights", "bottlenecks", closeId)
][("insights", "trends", { filters })][("insights", "benchmarks")][
  ("insights", "predictions", closeId)
][("insights", "scenarios", closeId)];
```

### Invalidation Rules

| Action              | Invalidates                            |
| ------------------- | -------------------------------------- |
| Close Task Complete | `["insights"]` (all)                   |
| Close Status Change | `["insights", "close-performance"]`    |
| Manual Refresh      | `["insights", "predictions", closeId]` |

### Stale Time

| Query Type        | Stale Time | Reasoning                        |
| ----------------- | ---------- | -------------------------------- |
| Close Performance | 15min      | Moderate update frequency        |
| Bottlenecks       | 5min       | Active monitoring during close   |
| Trends            | 1 hour     | Historical data changes slowly   |
| Benchmarks        | 24 hours   | Updated quarterly                |
| Predictions       | 15min      | Auto-refresh during active close |
| Scenarios         | 30min      | What-if analysis                 |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("insights-performance");
revalidateTag("insights-predictions");
revalidateTag("insights-trends");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/insights.fixtures.ts`

**Datasets**:

- `minimalInsights`: 1 active close with basic metrics
- `standardInsights`: 12 months historical data, current close
- `complexInsights`: 36 months data, multiple entities, benchmarks
- `edgeCases`: Edge cases (delayed closes, low confidence predictions)

**Edge Cases Covered**:

- Close with no historical data (first close)
- Close significantly delayed (> 5 days late)
- Close with missing task data
- Prediction confidence < 70%
- Industry benchmark unavailable
- Scenario with impossible assumptions

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
- **Interactive Parts**: Mark with `"use client"` (charts, filters)

### Data Fetching Strategy

| Scenario          | Strategy                          | Benefit           |
| ----------------- | --------------------------------- | ----------------- |
| Initial Dashboard | Server-side fetch + stream        | Faster TTFB       |
| Predictions       | Client-side with auto-refresh     | Real-time updates |
| Trend Analysis    | Server component with static data | SEO + performance |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function refreshPredictions(close_id: string) {
  // ... mutation logic
  revalidateTag("insights-predictions");
  revalidateTag("insights-performance");
}
```

---

## 📊 Analytics & Audit Events

| Event                        | When                     | Properties                                 |
| ---------------------------- | ------------------------ | ------------------------------------------ |
| Insights.DashboardViewed     | Dashboard opened         | `close_id`, `user_id`                      |
| Insights.PredictionGenerated | Prediction calculated    | `close_id`, `confidence`, `predicted_date` |
| Insights.BenchmarkCompared   | Benchmark viewed         | `close_id`, `industry`, `position`         |
| Insights.TrendAnalyzed       | Trend analysis viewed    | `period_range`, `entities`                 |
| Insights.ScenarioViewed      | Scenario analysis opened | `close_id`, `scenario_count`               |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Insights.PredictionGenerated", {
  close_id: "close_123",
  confidence: 95,
  predicted_date: "2025-10-15",
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/insights.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties; test with Arabic locale

### Keyboard Shortcuts

| Key      | Action                | Scope       |
| -------- | --------------------- | ----------- |
| `/`      | Focus search          | Any page    |
| `r`      | Refresh data          | Dashboard   |
| `t`      | Switch to trends      | Dashboard   |
| `p`      | Switch to predictions | Dashboard   |
| `b`      | View benchmarks       | Trends page |
| `↑ / ↓`  | Navigate items        | Any list    |
| `Enter`  | Open item             | Any list    |
| `Escape` | Close modal           | Modal/Form  |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["r", () => refetchInsights()],
  ["t", () => router.push("/insights/trends")],
  ["p", () => router.push("/insights/predictions")],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                      | Duration | Rollback Trigger |
| ----------- | ---------------- | ----------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                      | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, prediction accuracy ≥95%          | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, dashboard load < 1s, accuracy ≥95% | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained              | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m30_insights: false,                    // Master toggle
  m30_insights_predictions: false,        // Predictive analytics
  m30_insights_benchmarks: false,         // Industry benchmarks
  m30_insights_scenarios: false,          // Scenario analysis
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Dashboard load time (< 1s required)
- Prediction accuracy (≥95% required)
- Chart rendering performance
- Auto-refresh success rate
- User engagement

**Alert Thresholds**:

- Prediction accuracy < 95% → investigate model
- Dashboard load > 2s → performance issue
- Auto-refresh failure → check API
- Chart rendering error → fix immediately

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m30_insights = false`

   ```powershell
   pnpm run flags:set m30_insights=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("insights-performance");
   revalidateTag("insights-predictions");
   revalidateTag("insights-trends");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/insights/*"
   ```

4. **Monitor for 15 minutes**:

   - Error rate drops below 0.1%
   - No new Sentry issues
   - Users see fallback message

5. **Post-mortem**:
   - Create incident report
   - Identify root cause
   - Add regression test
   - Update prediction model if needed

**Rollback Decision Matrix**:

| Scenario                   | Action             | Approval Required |
| -------------------------- | ------------------ | ----------------- |
| Prediction accuracy < 90%  | Immediate rollback | No (auto-trigger) |
| Dashboard performance > 3s | Immediate rollback | No (auto-trigger) |
| Data quality issues        | Immediate rollback | No (auto-trigger) |
| Chart rendering errors     | Immediate rollback | No (auto-trigger) |
| User complaints > 5        | Investigate first  | Analytics lead    |

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

- BlackLine: Close management insights
- Prophix: Financial analytics
- Adaptive Insights: Predictive forecasting
- Tableau: Data visualization
- Power BI: Executive dashboards

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Prediction Accuracy < 90%

**Mitigation**: Continuous model training on historical data; validation against actual close times; confidence scoring; manual override capability

### Risk #2: Historical Data Quality Issues

**Mitigation**: Data validation on import; anomaly detection; manual review for outliers; data quality dashboard

### Risk #3: Real-Time Refresh Performance

**Mitigation**: Caching strategy (15-minute stale time); incremental updates; background processing; CDN caching

### Risk #4: User Trust in AI Predictions

**Mitigation**: Confidence scores displayed prominently; explainability (show factors); historical accuracy stats; allow manual adjustments

---

## 📝 Implementation Guide

### Day 1: Complete Implementation (8 hours)

1. Build close performance dashboard with real-time metrics (3 hours)
2. Implement trend analysis with historical comparison (2.5 hours)
3. Create predictive analytics with scenario analysis (2.5 hours)

**Total**: 1 day (8 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Close completion percentage calculation
- [ ] Prediction accuracy scoring
- [ ] Trend analysis calculations

### Integration Tests

- [ ] Real-time data updates from close management
- [ ] Historical data aggregation
- [ ] Prediction model integration

### E2E Tests

- [ ] User can view close performance dashboard
- [ ] User can analyze historical trends
- [ ] User can see predictive completion date
- [ ] User can view bottlenecks
- [ ] User can analyze scenarios
- [ ] User can compare benchmarks
- [ ] Keyboard-only flow: navigate → view trends → check predictions

### Accessibility Tests

- [ ] Keyboard navigation works (chart navigation)
- [ ] Screen reader announces metrics and predictions
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
- [ ] Dashboard load < 1s
- [ ] Chart rendering < 500ms
- [ ] Prediction calculation < 2s

---

## 📅 Timeline

| Day | Deliverable                                             |
| --- | ------------------------------------------------------- |
| 1   | Complete insights dashboard with all analytics features |

**Total**: 1 day (8 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M20: Close Management (for data source)

### Enables These Modules

- Enhanced M20: Close Management with insights integration

---

## 🎯 Success Criteria

### Must Have

- [ ] Real-time close performance dashboard
- [ ] Historical trend analysis with benchmarking
- [ ] Predictive close completion with confidence scoring
- [ ] Prediction accuracy ≥95%, Dashboard load < 1s

### Should Have

- [ ] AI-powered insights and recommendations
- [ ] Scenario analysis for resource planning
- [ ] Industry benchmark comparison
- [ ] Auto-refresh every 15 minutes

### Nice to Have

- [ ] Natural language query ("When will we finish?")
- [ ] Mobile alerts for predicted delays
- [ ] Integration with executive dashboards
- [ ] Export insights to PowerPoint/PDF

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created (`/insights/dashboard`, `/insights/trends`, `/insights/predictions`)
- [ ] Close performance dashboard working (real-time metrics)
- [ ] Trend analysis working (36-month history)
- [ ] Predictive analytics working (≥95% accuracy)
- [ ] Industry benchmarks working
- [ ] Scenario analysis working
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
- [ ] Integration tests: All insights covered
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/insights`
- [ ] Dashboard load: < 1s
- [ ] Chart rendering: < 500ms
- [ ] Prediction calculation: < 2s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced
- [ ] Chart data accessible

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90

### Observability 📊

- [ ] SLO dashboards created
- [ ] All analytics events firing
- [ ] Error tracking integrated
- [ ] Performance monitoring active
- [ ] Prediction accuracy tracked (≥95%)
- [ ] Dashboard load time monitored (< 1s)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced
- [ ] Close data access controlled
- [ ] Audit trail complete
- [ ] AI model secured
- [ ] Prediction logging validated

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All tests passed
- [ ] **Design**: UI matches specs
- [ ] **PM**: Feature complete
- [ ] **Security**: Security review passed
- [ ] **Accessibility**: A11y audit passed
- [ ] **Analytics**: Prediction accuracy validated

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M29 - Operations Automation  
**Next**: M31 - Lease Accounting
