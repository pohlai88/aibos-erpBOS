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

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 12 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/[path]` - [Endpoint description]
- ✅ `/api/[path]` - [Endpoint description]

**Total Endpoints**: 12

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
**File**: `apps/web/app/(dashboard)/[module]/[id]/page.tsx`

---

## 🔌 API Integration

```typescript
// apps/web/hooks/useBudgetPlanning.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@aibos/api-client';

export function useBudgetPlanning(filters = {}) {
  return useQuery({
    queryKey: ['m14', filters],
    queryFn: () => apiClient.GET('/api/[path]', { query: filters }),
  });
}

export function useCreateBudgetPlanning() {
  return useMutation({
    mutationFn: data => apiClient.POST('/api/[path]', { body: data }),
    onSuccess: () => queryClient.invalidateQueries(['m14']),
  });
}
```

---

## 📝 Implementation Guide

### Day 1: [Tasks] (8 hours)

1. [Task 1] (X hours)
2. [Task 2] (X hours)
3. [Task 3] (X hours)

### Day 2: [Tasks] (8 hours)

1. [Task 1] (X hours)
2. [Task 2] (X hours)
3. [Task 3] (X hours)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] [Test description]
- [ ] [Test description]
- [ ] [Test description]

### Integration Tests

- [ ] [Test description]
- [ ] [Test description]
- [ ] [Test description]

### E2E Tests

- [ ] [Test description]
- [ ] [Test description]
- [ ] [Test description]

---

## 📅 Timeline

| Day | Deliverable               |
| --- | ------------------------- |
| 1   | [Deliverable description] |
| 2   | [Deliverable description] |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries

### Enables These Modules

- [Dependent module 1]
- [Dependent module 2]

---

## 🎯 Success Criteria

### Must Have

- [ ] [Core requirement 1]
- [ ] [Core requirement 2]
- [ ] [Core requirement 3]

### Should Have

- [ ] [Enhancement 1]
- [ ] [Enhancement 2]

### Nice to Have

- [ ] [Optional feature 1]
- [ ] [Optional feature 2]

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M13 - [Previous Module]  
**Next**: M15 - [Next Module]
