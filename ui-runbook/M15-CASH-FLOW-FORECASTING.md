# 🚀 M15: Cash Flow Forecasting - UI Implementation Runbook

**Module ID**: M15  
**Module Name**: Cash Flow Forecasting  
**Priority**: MEDIUM  
**Phase**: 4 - Advanced Financial  
**Estimated Effort**: 1 day  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Cash Flow Forecasting provides **AI-powered cash flow predictions** based on AR aging, AP due dates, and historical patterns to prevent cash crunches.

### Business Value

- AI-powered cash flow predictions (13-week rolling)
- Integration with AR aging and AP due dates
- Scenario modeling for cash planning
- Cash shortage early warning alerts
- Bank balance reconciliation and monitoring

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 3 endpoints implemented       |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/[path]` - [Endpoint description]
- ✅ `/api/[path]` - [Endpoint description]

**Total Endpoints**: 3

---

## 🎯 3 Killer Features

### 1. **13-Week Cash Flow Forecast** 📅

**Description**: Rolling 13-week cash flow forecast with automatic updates from AR collections and AP payments.

**Why It's Killer**:

- AI-powered collection and payment predictions
- Automatic updates from actual transactions
- Scenario modeling (optimistic/realistic/pessimistic)
- Cash shortage alerts
- Industry-first intelligent cash forecasting

**Implementation**:

```typescript
import { Chart, Card, DataTable, Alert } from "aibos-ui";

export default function CashFlowForecast() {
  const { forecast } = use13WeekForecast();

  return (
    <div className="space-y-6">
      {forecast.has_shortage && (
        <Alert variant="destructive">
          ⚠️ Cash shortage projected in Week {forecast.shortage_week}:
          {formatCurrency(forecast.shortage_amount)}
        </Alert>
      )}

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Current Cash</h3>
          <div className="text-3xl">
            {formatCurrency(forecast.current_cash)}
          </div>
        </Card>
        <Card>
          <h3>Expected Inflows</h3>
          <div className="text-3xl text-green-600">
            {formatCurrency(forecast.total_inflows)}
          </div>
        </Card>
        <Card>
          <h3>Expected Outflows</h3>
          <div className="text-3xl text-red-600">
            {formatCurrency(forecast.total_outflows)}
          </div>
        </Card>
        <Card>
          <h3>Ending Cash (Week 13)</h3>
          <div
            className={`text-3xl ${
              forecast.ending_cash < forecast.minimum_required
                ? "text-red-600"
                : "text-green-600"
            }`}
          >
            {formatCurrency(forecast.ending_cash)}
          </div>
        </Card>
      </div>

      <Chart
        type="line"
        data={forecast.weeks}
        series={[
          { key: "cash_balance", label: "Projected Cash", color: "blue" },
          {
            key: "minimum_required",
            label: "Minimum Required",
            color: "red",
            style: "dashed",
          },
        ]}
        title="13-Week Cash Forecast"
      />

      <DataTable
        data={forecast.weeks}
        columns={[
          { key: "week", label: "Week" },
          {
            key: "beginning_balance",
            label: "Beginning",
            render: formatCurrency,
          },
          { key: "receipts", label: "Receipts", render: formatCurrency },
          { key: "payments", label: "Payments", render: formatCurrency },
          { key: "ending_balance", label: "Ending", render: formatCurrency },
          {
            key: "status",
            label: "Status",
            render: (val) => (
              <Badge variant={val === "OK" ? "success" : "warning"}>
                {val}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
```

### 2. **AI-Powered Collection Predictor** 🤖

**Description**: Machine learning model that predicts AR collection timing based on customer payment history.

**Why It's Killer**:

- Customer-specific payment pattern analysis
- Confidence scoring for predictions
- Automatic DSO (Days Sales Outstanding) calculation
- Collection probability by invoice
- Better than simple aging-based forecasts

**Implementation**:

```typescript
import { DataTable, Badge, Card, Chart } from "aibos-ui";

export default function CollectionPredictor() {
  const { predictions } = useCollectionPredictions();

  return (
    <div className="space-y-6">
      <Card>
        <h3>Collection Forecast Summary</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <strong>This Week:</strong> {formatCurrency(predictions.this_week)}
            <div className="text-sm text-muted">
              Confidence:{" "}
              <Badge variant="success">
                {predictions.this_week_confidence}%
              </Badge>
            </div>
          </div>
          <div>
            <strong>Next 30 Days:</strong>{" "}
            {formatCurrency(predictions.next_30_days)}
            <div className="text-sm text-muted">
              Confidence:{" "}
              <Badge variant="success">{predictions.next_30_confidence}%</Badge>
            </div>
          </div>
          <div>
            <strong>DSO:</strong> {predictions.dso} days
            <div className="text-sm text-muted">
              Trend:{" "}
              <Badge
                variant={
                  predictions.dso_trend === "improving" ? "success" : "warning"
                }
              >
                {predictions.dso_trend}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <Chart
        type="bar"
        data={predictions.by_customer}
        title="Top 10 Expected Collections This Week"
        sort="desc"
        limit={10}
      />

      <DataTable
        data={predictions.invoices}
        columns={[
          { key: "customer", label: "Customer" },
          { key: "invoice", label: "Invoice" },
          { key: "amount", label: "Amount", render: formatCurrency },
          { key: "due_date", label: "Due Date" },
          {
            key: "predicted_date",
            label: "Predicted Payment",
            render: (date, row) => (
              <div>
                {date}
                <Badge variant="info" className="ml-2">
                  {row.confidence}% confidence
                </Badge>
              </div>
            ),
          },
          { key: "customer_avg_days", label: "Customer Avg" },
        ]}
      />

      <Card className="bg-blue-50">
        <h4>AI Insights</h4>
        <ul className="space-y-2">
          {predictions.insights.map((insight, idx) => (
            <li key={idx}>{insight}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
```

### 3. **Cash Scenario Planner** 🎯

**Description**: Interactive scenario modeling for cash flow planning with what-if analysis.

**Why It's Killer**:

- Compare multiple scenarios side-by-side
- Adjust collections, payments, and timing
- Visualize impact on cash position
- Save and share scenarios
- Better than static spreadsheet modeling

**Implementation**:

```typescript
import { Form, Card, Chart, Button } from "aibos-ui";

export default function ScenarioPlanner() {
  const [scenarios, setScenarios] = useState([
    "base",
    "optimistic",
    "pessimistic",
  ]);
  const { results, calculate } = useCashScenarios(scenarios);

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        {scenarios.map((scenario) => (
          <Card key={scenario} className="flex-1">
            <h3 className="capitalize">{scenario} Case</h3>
            <Form>
              <Input
                label="Collection Rate"
                name={`${scenario}_collection_rate`}
                type="number"
                suffix="%"
              />
              <Input
                label="Payment Delay"
                name={`${scenario}_payment_delay`}
                type="number"
                suffix="days"
              />
              <Input
                label="New Revenue"
                name={`${scenario}_new_revenue`}
                type="number"
              />
            </Form>
          </Card>
        ))}
      </div>

      <Button onClick={calculate} variant="primary" size="lg">
        Calculate Scenarios
      </Button>

      <Chart
        type="line"
        data={results.timeline}
        series={scenarios.map((s) => ({
          key: s,
          label: `${s} Case`,
          color: s === "base" ? "blue" : s === "optimistic" ? "green" : "red",
        }))}
        title="Cash Position Comparison"
      />

      <div className="grid grid-cols-3 gap-4">
        {scenarios.map((scenario) => (
          <Card key={scenario}>
            <h4 className="capitalize">{scenario}</h4>
            <div className="space-y-2">
              <div>
                <strong>Week 13 Cash:</strong>
                <div className="text-2xl">
                  {formatCurrency(results[scenario].ending_cash)}
                </div>
              </div>
              <div>
                <strong>Minimum Cash:</strong>
                <div className="text-lg">
                  {formatCurrency(results[scenario].minimum_cash)}
                </div>
              </div>
              <div>
                <strong>Cash Cushion:</strong>
                <Badge
                  variant={
                    results[scenario].cushion > 0 ? "success" : "destructive"
                  }
                >
                  {formatCurrency(results[scenario].cushion)}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>
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
// apps/web/hooks/useCashFlowForecasting.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function useCashFlowForecasting(filters = {}) {
  return useQuery({
    queryKey: ["m15", filters],
    queryFn: () => apiClient.GET("/api/[path]", { query: filters }),
  });
}

export function useCreateCashFlowForecasting() {
  return useMutation({
    mutationFn: (data) => apiClient.POST("/api/[path]", { body: data }),
    onSuccess: () => queryClient.invalidateQueries(["m15"]),
  });
}
```

---

## 📝 Implementation Guide

### Day 1: [Tasks] (8 hours)

1. [Task 1] (X hours)
2. [Task 2] (X hours)

**Total**: 1 day (8 hours)

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

**Total**: 1 day (8 hours)

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

**Previous**: M14 - [Previous Module]  
**Next**: M16 - [Next Module]
