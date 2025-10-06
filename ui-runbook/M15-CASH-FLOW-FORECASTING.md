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

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-cash-forecasting], [ADR-###-ai-predictions], [ADR-###-scenario-modeling]

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

- ✅ `/api/cash-flow/forecast/13-week` - 13-week rolling forecast
- ✅ `/api/cash-flow/collections/predict` - AI collection predictions
- ✅ `/api/cash-flow/scenarios` - Scenario modeling
- ✅ Plus integrations with AR aging (`/api/ar/aging`) and AP due dates (`/api/ap/aging`)

**Total Endpoints**: 3 core + 2 integrations

### Risks & Blockers

| Risk                             | Impact | Mitigation                                                    | Owner     |
| -------------------------------- | ------ | ------------------------------------------------------------- | --------- |
| AI prediction accuracy           | HIGH   | Regular model retraining; confidence scoring; fallback logic  | @data-sci |
| Integration with AR/AP data      | HIGH   | Real-time sync; data validation; reconciliation checks        | @backend  |
| Scenario calculation performance | MED    | Caching; async processing; progress indicators                | @backend  |
| Cash shortage alert reliability  | HIGH   | Multiple thresholds; escalation rules; manual override option | @finance  |

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
**File**: `apps/web/app/(dashboard)/cash-flow/scenarios/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                      | Target          | Measurement          |
| --------------------------- | --------------- | -------------------- |
| TTFB (staging)              | ≤ 70ms          | Server timing header |
| Client TTI for `/cash-flow` | ≤ 200ms         | Lighthouse CI        |
| 13-week forecast generation | < 2s            | Progress tracking    |
| AI prediction calculation   | < 1s            | APM traces           |
| Scenario calculation        | < 3s            | Progress tracking    |
| UI bundle size              | ≤ 250KB gzipped | Webpack analyzer     |
| Chart rendering (13 weeks)  | < 100ms         | Performance profiler |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to forecast tables, scenario inputs, chart interactions
- **Focus Management**: Focus trap in modals; visible indicators
- **ARIA**: Live regions for prediction updates; proper roles for charts
- **Screen Reader**: All amounts and forecasts announced; AI insights communicated; chart data tables provided
- **Axe Target**: 0 serious/critical violations
- **Chart Accessibility**: Data table alternatives for all charts

### Security

| Layer          | Requirement                                                      |
| -------------- | ---------------------------------------------------------------- |
| RBAC Scopes    | `cashflow.read`, `cashflow.forecast`, `cashflow.admin`           |
| Enforcement    | Server-side on all endpoints                                     |
| Data Exposure  | Only show forecasts user has permission to view                  |
| Sensitive Data | Mask cash amounts for non-finance users                          |
| AI Predictions | Log all predictions for audit trail; confidence scoring required |

#### UI Permissions Matrix

| Role              | View | Forecast | Scenarios | AI Predict | Admin |
| ----------------- | ---- | -------- | --------- | ---------- | ----- |
| cashflow.read     | ✅   | ❌       | ❌        | ❌         | ❌    |
| cashflow.forecast | ✅   | ✅       | ✅        | ✅         | ❌    |
| cashflow.admin    | ✅   | ✅       | ✅        | ✅         | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful forecast operations; 95% AI prediction accuracy
- **SLA Dashboards**: Real-time metrics on forecast accuracy, AI confidence, scenario performance
- **Events Emitted**: `CashFlow.ForecastGenerated`, `CashFlow.ShortageDetected`, `CashFlow.ScenarioCalculated`
- **Logging**: Structured logs with correlation IDs for all forecasts
- **Tracing**: Distributed tracing for AI prediction pipeline
- **Monitoring**: AI model drift; forecast accuracy vs actuals; shortage alert effectiveness

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Cash Flow Forecasting Rules

| Rule                         | Enforcement                                               |
| ---------------------------- | --------------------------------------------------------- |
| **13-Week Window**           | Always rolling; recalculate daily                         |
| **Beginning Balance**        | Must match actual bank balance                            |
| **Cash Inflows**             | AR collections + other receipts                           |
| **Cash Outflows**            | AP payments + payroll + other disbursements               |
| **Ending Balance**           | Beginning + Inflows - Outflows                            |
| **Minimum Required Cash**    | Configurable threshold; default 10% of monthly expenses   |
| **Shortage Alert**           | Trigger when projected below minimum for ≥1 week          |
| **AI Prediction Confidence** | Must be ≥60% to display; flag predictions <80% confidence |
| **Scenario Consistency**     | All scenarios use same base data; vary only assumptions   |
| **DSO Calculation**          | (AR Balance / Revenue) × Days in Period                   |

### Currency & Rounding

- **Display**: Presentation currency from tenant settings
- **Rounding Policy**: HALF_UP for forecast calculations
- **Multi-Currency**: Consolidate at current FX rate
- **FX Impact**: Show sensitivity to FX rate changes

### Archive Semantics

- **Historical Forecasts**: Retain for accuracy tracking; compare to actuals
- **Scenario Versions**: Soft delete; maintain version history
- **Guard Rails**:
  - ❌ Deny delete if forecast referenced in reports
  - ❌ Deny delete if scenario shared with team
  - ✅ Allow archive after 6 months

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                            | User Action     |
| --------------------- | ------------------------------------- | --------------- |
| **Empty**             | "No forecast"                         | "Generate"      |
| **Loading**           | Progress bar "Generating forecast..." | Wait            |
| **Error**             | Error message + retry                 | Retry / Support |
| **Calculating**       | Progress "Calculating scenarios..."   | Wait            |
| **AI Predicting**     | Progress "Running AI predictions..."  | Wait            |
| **Shortage Detected** | Red alert "Cash shortage Week X"      | Review / Plan   |
| **Low Confidence**    | Yellow warning "AI confidence <80%"   | Review manually |
| **Stale Data**        | Orange badge "Forecast outdated"      | Refresh         |
| **Integration Error** | Red alert "AR/AP data sync failed"    | Retry sync      |
| **Permission Denied** | "Access restricted"                   | Back            |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Real-time Validation**: Check amounts > 0, dates valid, confidence ≥60%
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal

### Network Errors

| HTTP Status | UI Message                                                 | Action              |
| ----------- | ---------------------------------------------------------- | ------------------- |
| 400         | "Invalid forecast parameters. Check your input."           | Inline field errors |
| 401         | "Session expired. Please log in again."                    | Redirect to login   |
| 403         | "You don't have permission for forecasting."               | Hide action         |
| 404         | "Forecast data not found."                                 | Return to list      |
| 409         | "Forecast was modified. Refresh to see latest."            | Show refresh button |
| 422         | "Validation failed: Minimum cash must be > 0."             | Inline errors       |
| 500         | "Forecast generation failed. Our team has been notified."  | Retry button        |
| 503         | "AI prediction service unavailable. Using fallback logic." | Show warning        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/cash-flow.json`.

### Page Titles & Headers

| Context              | Copy                     | i18n Key                     |
| -------------------- | ------------------------ | ---------------------------- |
| Main Page            | "Cash Flow Forecasting"  | `cashflow.main.title`        |
| 13-Week Forecast     | "13-Week Cash Forecast"  | `cashflow.forecast.title`    |
| Collection Predictor | "Collection Predictions" | `cashflow.collections.title` |
| Scenario Planner     | "Cash Flow Scenarios"    | `cashflow.scenarios.title`   |
| Shortage Alerts      | "Cash Shortage Alerts"   | `cashflow.alerts.title`      |

### State Messages

| State             | Title                         | Message                                                | Action Button       | i18n Key                      |
| ----------------- | ----------------------------- | ------------------------------------------------------ | ------------------- | ----------------------------- |
| Empty             | "No forecast available"       | "Generate your first cash flow forecast"               | "Generate Forecast" | `cashflow.empty.*`            |
| Loading           | —                             | —                                                      | —                   | —                             |
| Error             | "Unable to generate forecast" | "Something went wrong. Our team has been notified."    | "Retry" / "Support" | `cashflow.error.*`            |
| Calculating       | "Calculating..."              | "Running forecast scenarios. This may take a moment."  | —                   | `cashflow.calculating.*`      |
| AI Predicting     | "Running AI predictions..."   | "Analyzing historical patterns and customer behavior." | —                   | `cashflow.aiPredicting.*`     |
| Shortage Detected | "⚠️ Cash shortage projected"  | "Cash shortage in Week {week}: {amount}"               | "View Forecast"     | `cashflow.shortage.*`         |
| Low Confidence    | "Low prediction confidence"   | "AI confidence <80%. Manual review recommended."       | "Review"            | `cashflow.lowConfidence.*`    |
| Stale Data        | "Forecast outdated"           | "Forecast is {days} days old. Refresh for latest."     | "Refresh"           | `cashflow.stale.*`            |
| Integration Error | "Data sync failed"            | "Unable to sync AR/AP data. Using last known values."  | "Retry Sync"        | `cashflow.syncError.*`        |
| Permission Denied | "Access restricted"           | "You don't have permission for cash flow forecasting." | "Back"              | `cashflow.permissionDenied.*` |

### Action Confirmations

| Action            | Title                    | Message                                                    | Confirm Button | Cancel Button | i18n Key                            |
| ----------------- | ------------------------ | ---------------------------------------------------------- | -------------- | ------------- | ----------------------------------- |
| Generate Forecast | "Generate forecast?"     | "Generate 13-week cash flow forecast? This will take ~2s." | "Generate"     | "Cancel"      | `cashflow.generate.confirm.*`       |
| Recalculate       | "Recalculate scenarios?" | "Recalculate all scenarios with current data?"             | "Recalculate"  | "Cancel"      | `cashflow.recalculate.confirm.*`    |
| Save Scenario     | "Save scenario?"         | "Save '{name}' scenario for future reference?"             | "Save"         | "Cancel"      | `cashflow.saveScenario.confirm.*`   |
| Delete Scenario   | "Delete scenario?"       | "Delete '{name}' scenario? This cannot be undone."         | "Delete"       | "Cancel"      | `cashflow.deleteScenario.confirm.*` |

### Success Messages (Toast)

| Action                  | Message                                   | i18n Key                        |
| ----------------------- | ----------------------------------------- | ------------------------------- |
| Forecast Generated      | "13-week forecast generated successfully" | `cashflow.generate.success`     |
| Scenarios Calculated    | "All scenarios calculated successfully"   | `cashflow.scenarios.success`    |
| Scenario Saved          | "Scenario '{name}' saved successfully"    | `cashflow.saveScenario.success` |
| AI Predictions Complete | "AI collection predictions completed"     | `cashflow.aiPredict.success`    |
| Data Synced             | "AR/AP data synced successfully"          | `cashflow.sync.success`         |

### Error Messages (Toast)

| Scenario                    | Message                                                  | i18n Key                         |
| --------------------------- | -------------------------------------------------------- | -------------------------------- |
| Generate Failed             | "Failed to generate forecast. Check AR/AP data."         | `cashflow.generate.error`        |
| AI Prediction Failed        | "AI predictions unavailable. Using historical averages." | `cashflow.aiPredict.error`       |
| Scenario Calculation Failed | "Scenario calculation failed. Check inputs."             | `cashflow.scenarios.error`       |
| Insufficient Data           | "Insufficient historical data for accurate predictions." | `cashflow.errorInsufficientData` |
| Integration Error           | "AR/AP data sync failed. Using last known values."       | `cashflow.errorIntegration`      |
| Low Confidence Warning      | "Prediction confidence <60%. Results may be inaccurate." | `cashflow.errorLowConfidence`    |
| Network Error               | "Network error. Check your connection and try again."    | `cashflow.error.network`         |

### Form Labels & Help Text

| Field                 | Label               | Placeholder     | Help Text                            | i18n Key                          |
| --------------------- | ------------------- | --------------- | ------------------------------------ | --------------------------------- |
| Forecast Start Date   | "Start Date"        | "YYYY-MM-DD"    | "First week of forecast period"      | `cashflow.field.startDate.*`      |
| Minimum Required Cash | "Minimum Cash"      | "0.00"          | "Minimum cash balance to maintain"   | `cashflow.field.minCash.*`        |
| Collection Rate       | "Collection Rate %" | "90"            | "Expected AR collection rate"        | `cashflow.field.collectionRate.*` |
| Payment Delay Days    | "Payment Delay"     | "0"             | "Average AP payment delay (days)"    | `cashflow.field.paymentDelay.*`   |
| New Revenue Forecast  | "New Revenue"       | "0.00"          | "Projected new sales revenue"        | `cashflow.field.newRevenue.*`     |
| Confidence Threshold  | "Confidence %"      | "80"            | "Minimum AI prediction confidence"   | `cashflow.field.confidence.*`     |
| Scenario Name         | "Scenario Name"     | "e.g., Q4 Plan" | "Descriptive name for this scenario" | `cashflow.field.scenarioName.*`   |

### Keyboard Shortcuts Help

| Shortcut | Description            | i18n Key                       |
| -------- | ---------------------- | ------------------------------ |
| `/`      | "Focus search"         | `cashflow.shortcuts.search`    |
| `g`      | "Generate forecast"    | `cashflow.shortcuts.generate`  |
| `s`      | "Open scenarios"       | `cashflow.shortcuts.scenarios` |
| `p`      | "View AI predictions"  | `cashflow.shortcuts.predict`   |
| `a`      | "View shortage alerts" | `cashflow.shortcuts.alerts`    |
| `r`      | "Refresh forecast"     | `cashflow.shortcuts.refresh`   |
| `Enter`  | "Open selected week"   | `cashflow.shortcuts.open`      |
| `Escape` | "Close modal/cancel"   | `cashflow.shortcuts.cancel`    |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useCashFlowForecasting.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function use13WeekForecast(options = {}) {
  return useQuery({
    queryKey: ["cashflow", "forecast", "13-week", options],
    queryFn: () =>
      apiClient.GET("/api/cash-flow/forecast/13-week", { query: options }),
    staleTime: 5 * 60_000, // 5min (forecasts expire quickly)
    retry: 2,
    select: (response) => response.data,
  });
}

export function useGenerateForecast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { start_date: string; weeks?: number }) =>
      apiClient.POST("/api/cash-flow/forecast/generate", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cashflow", "forecast"] });
      toast.success("13-week forecast generated successfully");
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Failed to generate forecast. Check AR/AP data.");
      } else {
        toast.error("Forecast generation failed.");
      }
    },
  });
}

export function useCollectionPredictions() {
  return useQuery({
    queryKey: ["cashflow", "collections", "predict"],
    queryFn: () => apiClient.GET("/api/cash-flow/collections/predict"),
    staleTime: 10 * 60_000, // 10min (AI predictions are expensive)
    retry: 1,
    select: (response) => response.data,
    onError: (error) => {
      if (error.status === 503) {
        toast.warning("AI predictions unavailable. Using historical averages.");
      }
    },
  });
}

export function useCashScenarios(scenarios: string[]) {
  const queryClient = useQueryClient();

  const { data: results, refetch: calculate } = useQuery({
    queryKey: ["cashflow", "scenarios", scenarios],
    queryFn: () =>
      apiClient.POST("/api/cash-flow/scenarios/calculate", {
        body: { scenarios },
      }),
    enabled: false, // Manual trigger
    staleTime: 60_000, // 1min
    select: (response) => response.data,
  });

  return {
    results: results || {},
    calculate: () => calculate(),
  };
}

export function useSaveScenario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; assumptions: any }) =>
      apiClient.POST("/api/cash-flow/scenarios", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cashflow", "scenarios"] });
      toast.success(`Scenario '${data.name}' saved successfully`);
    },
  });
}

export function useShortageAlerts() {
  return useQuery({
    queryKey: ["cashflow", "shortage", "alerts"],
    queryFn: () => apiClient.GET("/api/cash-flow/shortage/alerts"),
    staleTime: 5 * 60_000, // 5min
    refetchInterval: 5 * 60_000, // Refresh every 5min for alerts
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error         | User Message                                               | UI Action            |
| ----------------- | ---------------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid forecast parameters. Check your input."           | Inline field errors  |
| 409 (Conflict)    | "Forecast was modified. Refresh to see latest."            | Show refresh button  |
| 422 (Validation)  | "Validation failed: Minimum cash must be > 0."             | Inline errors        |
| 403 (Forbidden)   | "You don't have permission for forecasting."               | Hide action          |
| 500 (Server)      | "Forecast generation failed. Our team has been notified."  | Retry + support link |
| 503 (Service)     | "AI prediction service unavailable. Using fallback logic." | Show warning         |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s) except AI predictions (1 retry)
- **Mutations**: No auto-retry; user-initiated retry only
- **Forecast generation**: 10s timeout
- **AI predictions**: 15s timeout (expensive operation)

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["cashflow", "forecast", "13-week", options][
  ("cashflow", "collections", "predict")
][("cashflow", "scenarios", scenarios)][("cashflow", "shortage", "alerts")];
```

### Invalidation Rules

| Action                   | Invalidates                                               |
| ------------------------ | --------------------------------------------------------- |
| Generate Forecast        | `["cashflow", "forecast"]`                                |
| Calculate Scenarios      | `["cashflow", "scenarios"]`                               |
| Save Scenario            | `["cashflow", "scenarios"]`                               |
| AR Collection (external) | `["cashflow", "forecast"]`, `["cashflow", "collections"]` |
| AP Payment (external)    | `["cashflow", "forecast"]`                                |

### Stale Time

| Query Type                | Stale Time | Reasoning                                    |
| ------------------------- | ---------- | -------------------------------------------- |
| 13-Week Forecast          | 5min       | Needs frequent refresh as actuals change     |
| AI Collection Predictions | 10min      | Expensive operation; refresh less frequently |
| Scenarios                 | 1min       | Manual calculation trigger                   |
| Shortage Alerts           | 5min       | Critical alerts need regular refresh         |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("cashflow-forecast"); // After forecast generation
revalidateTag("cashflow-collections"); // After AR updates
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/cash-flow.fixtures.ts`

**Datasets**:

- `minimal13WeekForecast`: Simple 13-week projection
- `standardForecast`: Complete forecast with inflows/outflows
- `shortageScenario`: Forecast with projected shortage in Week 8
- `highConfidencePredictions`: AI predictions with >90% confidence
- `lowConfidencePredictions`: AI predictions with 60-70% confidence
- `multipleScenarios`: Base, optimistic, pessimistic scenarios

**Edge Cases Covered**:

- Cash shortage in first week
- Multiple consecutive shortage weeks
- Negative ending balance
- AI prediction confidence <60% (should not display)
- Stale forecast (>7 days old)
- Integration errors (AR/AP data unavailable)

```typescript
// Example fixture structure
export const standard13WeekForecast: ForecastFixture = {
  current_cash: 500000,
  total_inflows: 1200000,
  total_outflows: 1100000,
  ending_cash: 600000,
  minimum_required: 250000,
  has_shortage: false,
  weeks: [
    {
      week: 1,
      beginning_balance: 500000,
      receipts: 100000,
      payments: 90000,
      ending_balance: 510000,
      status: "OK",
    },
    // ... 12 more weeks
  ],
};
```

### E2E Seed Data

**Location**: `tests/seeds/cash-flow.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:cashflow
```

**Dataset**:

- 13-week historical data for accuracy testing
- 50 AR invoices (20 overdue, 30 current) for collection prediction
- 30 AP bills (15 due this week, 15 future) for payment projection
- 5 saved scenarios (base, optimistic, pessimistic, Q4 plan, worst case)
- 3 shortage alerts (Week 5, Week 9, Week 12)

**Cleanup Command**:

```powershell
pnpm run seed:cashflow:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic company: "Demo Corp Inc." with $5M cash balance
- Complete 13-week forecast with gradual cash decline to Week 10 (shortage), then recovery
- AI predictions with varied confidence (60%-95%)
- 3 scenarios showing different outcomes
- Shortage alerts for realistic planning demonstration

**Regeneration**:

```powershell
pnpm run demo:reset:cashflow
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] Beginning + Inflows - Outflows = Ending (each week)
- [ ] Week sequence is continuous (1-13)
- [ ] AI predictions have confidence 0-100
- [ ] Scenarios use consistent base data
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
- **Interactive Parts**: Mark with `"use client"` (forecast generation, scenarios, charts)

### Data Fetching Strategy

| Scenario              | Strategy                       | Benefit            |
| --------------------- | ------------------------------ | ------------------ |
| Initial Forecast View | Server-side fetch + stream     | Faster TTFB        |
| Forecast Generation   | Client-side React Query        | Progress tracking  |
| AI Predictions        | Client-side with loading state | Real-time feedback |
| Scenario Calculations | Client-side manual trigger     | User control       |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function generateForecast(data) {
  // ... mutation logic
  revalidateTag("cashflow-forecast");
}
```

---

## 📊 Analytics & Audit Events

| Event                       | When                   | Properties                                                    |
| --------------------------- | ---------------------- | ------------------------------------------------------------- |
| CashFlow.ForecastGenerated  | Forecast complete      | `weeks`, `start_date`, `current_cash`, `ending_cash`          |
| CashFlow.ShortageDetected   | Shortage in forecast   | `week`, `amount`, `projected_balance`, `minimum_required`     |
| CashFlow.ScenarioCalculated | Scenario run           | `scenario_name`, `assumptions`, `ending_cash`, `minimum_cash` |
| CashFlow.AIPredictionRun    | AI prediction complete | `confidence_avg`, `predictions_count`, `dso`, `model_version` |
| CashFlow.AlertViewed        | User views shortage    | `alert_id`, `week`, `amount`                                  |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("CashFlow.ForecastGenerated", {
  weeks: 13,
  start_date: forecast.start_date,
  ending_cash: forecast.ending_cash,
  has_shortage: forecast.has_shortage,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/cash-flow.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency Display**: Respect locale-specific currency symbols
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Week Display**: Respect regional week start (Sunday/Monday)

### Keyboard Shortcuts

| Key      | Action               | Scope         |
| -------- | -------------------- | ------------- |
| `/`      | Focus search         | Any page      |
| `g`      | Generate forecast    | Main page     |
| `s`      | Open scenarios       | Main page     |
| `p`      | View AI predictions  | Main page     |
| `a`      | View shortage alerts | Main page     |
| `r`      | Refresh forecast     | Forecast view |
| `↑ / ↓`  | Navigate weeks       | Table         |
| `Enter`  | Open selected week   | Table         |
| `Escape` | Close modal/cancel   | Modal/Form    |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["g", () => generateForecast()],
  ["s", () => router.push("/cash-flow/scenarios")],
  ["p", () => router.push("/cash-flow/collections")],
  ["a", () => router.push("/cash-flow/alerts")],
  ["r", () => refetchForecast()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                          | Duration | Rollback Trigger |
| ----------- | ---------------- | --------------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                          | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, AI predictions accurate               | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, AI confidence ≥70%, Forecasts accurate | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained                  | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m15_cashflow: false,              // Master toggle
  m15_cashflow_13week: false,       // 13-week forecast
  m15_cashflow_ai_predict: false,   // AI predictions
  m15_cashflow_scenarios: false,    // Scenario modeling
  m15_cashflow_alerts: false,       // Shortage alerts
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/cash-flow/*`)
- P50/P95/P99 latency
- Forecast generation time
- AI prediction confidence average
- Shortage alert accuracy
- Forecast accuracy (vs actuals)

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- AI prediction confidence < 60% → alert data science team
- Forecast generation > 5s → investigate performance
- P95 latency > 500ms for 10min → investigate

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m15_cashflow = false`

   ```powershell
   pnpm run flags:set m15_cashflow=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("cashflow-forecast");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/cash-flow/*"
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

| Scenario                   | Action                 | Approval Required |
| -------------------------- | ---------------------- | ----------------- |
| Error rate > 5%            | Immediate rollback     | No (auto-trigger) |
| AI prediction failure      | Fallback to historical | On-call engineer  |
| Forecast calculation error | Immediate rollback     | No (auto-trigger) |
| Error rate 1-5%            | Partial rollback       | On-call engineer  |
| P95 latency > 1s           | Investigate first      | On-call engineer  |
| Data corruption/loss       | Immediate rollback     | No (auto-trigger) |

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

- Float: Cash flow forecasting
- Pulse: Cash position monitoring
- Jirav: Scenario modeling
- ERPNext: Cash flow management

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: AI Prediction Accuracy

**Mitigation**: Regular model retraining; confidence scoring (≥60% required); fallback to historical averages; manual override capability

### Risk #2: Integration with AR/AP Data

**Mitigation**: Real-time sync; data validation checks; reconciliation with GL; fallback to last known values

### Risk #3: Scenario Calculation Performance

**Mitigation**: Async processing with progress indicators; caching of base calculations; timeout limits (3s)

### Risk #4: Cash Shortage Alert Reliability

**Mitigation**: Multiple thresholds (warning, critical); escalation rules; manual override; test against historical data

---

## 📝 Implementation Guide

### Day 1: 13-Week Forecast & AI Predictions (8 hours)

1. Build 13-week forecast table with chart (3 hours)
2. Implement AI collection predictor (3 hours)
3. Add shortage alerts (2 hours)

**Total**: 1 day (8 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Forecast calculation (Beginning + Inflows - Outflows = Ending)
- [ ] DSO calculation ((AR / Revenue) × Days)
- [ ] Shortage detection (balance < minimum for ≥1 week)
- [ ] AI confidence filtering (≥60% to display)
- [ ] Scenario consistency (same base data)
- [ ] use13WeekForecast hook fetches correctly
- [ ] Currency formatting displays correctly
- [ ] Week sequence validation (1-13)

### Integration Tests

- [ ] Generate forecast → appears with 13 weeks
- [ ] AR collection → forecast updates inflows
- [ ] AP payment → forecast updates outflows
- [ ] Calculate scenarios → all 3 scenarios complete
- [ ] Save scenario → appears in list
- [ ] Shortage alert triggers → notification sent
- [ ] Permission-based UI hiding works
- [ ] AI prediction fallback on service failure

### E2E Tests

- [ ] User can navigate to cash flow page
- [ ] User can generate 13-week forecast
- [ ] User can view AI collection predictions
- [ ] User can create and save scenario
- [ ] User can view shortage alerts
- [ ] User can refresh forecast
- [ ] Keyboard-only flow: generate → view → scenarios
- [ ] Forecast accuracy tracking works

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Charts have data table alternatives
- [ ] Screen reader announces forecasts and predictions
- [ ] Focus management correct (modals, forms, charts)
- [ ] Color contrast meets WCAG 2.2 AA (AAA where practical)
- [ ] Axe: 0 serious/critical violations
- [ ] Shortage alerts have non-color indicators

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] All API endpoints return expected status codes

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for forecast, predictions, scenarios
- [ ] Dark/light theme variations
- [ ] Shortage alert states
- [ ] Loading/error/empty states captured

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/cash-flow/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] Forecast generation < 2s
- [ ] AI predictions < 1s
- [ ] Scenario calculation < 3s
- [ ] Chart rendering < 100ms

---

## 📅 Timeline

| Day | Deliverable                                |
| --- | ------------------------------------------ |
| 1   | 13-Week Forecast + AI Predictions + Alerts |

**Total**: 1 day (8 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M4: Accounts Receivable (for AR aging data)
- ✅ M5: Accounts Payable (for AP due dates)
- ✅ M6: Cash Management (for current cash balance)

### Enables These Modules

- M20: Close Management (cash flow review in close checklist)
- Financial planning & reporting modules

---

## 🎯 Success Criteria

### Must Have

- [ ] Generate and display 13-week rolling forecast
- [ ] Show cash inflows (AR collections) and outflows (AP payments)
- [ ] Calculate and display ending cash balance per week
- [ ] Detect and alert on cash shortages (below minimum)
- [ ] AI-powered collection predictions with confidence scoring
- [ ] Scenario modeling (base, optimistic, pessimistic)
- [ ] Integration with AR aging and AP due dates

### Should Have

- [ ] DSO (Days Sales Outstanding) calculation and tracking
- [ ] Cash shortage alerts with configurable thresholds
- [ ] Save and share scenarios
- [ ] Historical forecast accuracy tracking
- [ ] What-if scenario adjustments

### Nice to Have

- [ ] Automated weekly forecast email
- [ ] Cash flow forecast export (Excel/PDF)
- [ ] Integration with budget for variance analysis
- [ ] Working capital analysis

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/cash-flow`, `/cash-flow/forecast`, `/cash-flow/collections`, `/cash-flow/scenarios`, `/cash-flow/alerts`)
- [ ] 13-week forecast generation working
- [ ] AI collection predictions working (with confidence scoring)
- [ ] Scenario modeling functional (3 scenarios minimum)
- [ ] Shortage alerts working (with configurable thresholds)
- [ ] Integration with AR/AP data complete
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
- [ ] Integration tests: All forecast + AI + scenario operations covered
- [ ] E2E tests: All user flows covered (generate → view → scenarios)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Forecast generation flow
- AI prediction flow
- Scenario calculation flow
- Shortage detection flow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/cash-flow/*` routes
- [ ] TTFB: ≤70ms on staging (Server-Timing header)
- [ ] TTI: ≤200ms for `/cash-flow` (Lighthouse CI)
- [ ] Forecast generation: < 2s
- [ ] AI predictions: < 1s
- [ ] Scenario calculation: < 3s
- [ ] Chart rendering: < 100ms

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues
- [ ] Charts: Data table alternatives provided

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `CashFlow.ForecastGenerated`
  - `CashFlow.ShortageDetected`
  - `CashFlow.ScenarioCalculated`
  - `CashFlow.AIPredictionRun`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, AI accuracy, forecast performance)
- [ ] AI model monitoring (drift detection)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Cash amounts masked for non-finance users
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] AI predictions logged for audit trail
- [ ] Data retention policy enforced

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete (changes, testing, screenshots)
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized (OpenAPI hash verified)
- [ ] i18n keys documented in copy deck
- [ ] User acceptance testing passed (PM/QA sign-off)
- [ ] AI model documentation complete

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m15_cashflow = false` (ready to enable)
  - `flags.m15_cashflow_13week = false` (phase 2)
  - `flags.m15_cashflow_ai_predict = false` (phase 2)
  - `flags.m15_cashflow_scenarios = false` (phase 2)
  - `flags.m15_cashflow_alerts = false` (phase 2)
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
- [ ] **Data Science**: AI model accuracy validated (≥70% confidence average)
- [ ] **Finance/Treasury**: Forecast methodology and calculations validated

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M14 - Budget Planning  
**Next**: M16 - Consolidation
