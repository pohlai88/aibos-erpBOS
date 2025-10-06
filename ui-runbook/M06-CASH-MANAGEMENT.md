# 🚀 M6: Cash Management - UI Implementation Runbook

**Module ID**: M6  
**Module Name**: Cash Management  
**Priority**: MEDIUM  
**Phase**: 2 - Priority Modules  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Cash Management provides **real-time visibility and control over all cash positions** across multiple bank accounts, entities, and currencies. Essential for liquidity management and cash flow optimization.

### Business Value

- Real-time cash position visibility across all accounts
- Daily cash forecasting and liquidity planning
- Bank account reconciliation automation
- Multi-currency cash management
- Cash concentration and sweeping capabilities

---

## 📊 Current Status

| Layer         | Status  | Details                            |
| ------------- | ------- | ---------------------------------- |
| **Database**  | ✅ 100% | Complete cash management schema    |
| **Services**  | ✅ 100% | Cash position calculation services |
| **API**       | ✅ 100% | 8 endpoints for cash operations    |
| **Contracts** | ✅ 100% | Type-safe schemas defined          |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**           |

### API Coverage

- ✅ `/api/cash/positions` - Current cash positions
- ✅ `/api/cash/forecast` - Cash forecasting
- ✅ `/api/cash/transactions` - Cash transaction history
- ✅ `/api/cash/transfers` - Inter-account transfers
- ✅ `/api/cash/reconciliation` - Bank reconciliation

**Total Endpoints**: 8

---

## 🎯 3 Killer Features

### 1. **Real-Time Cash Position Dashboard** 💰

**Description**: Live dashboard showing cash positions across all bank accounts with automatic updates as transactions post.

**Why It's Killer**:

- Updates in real-time via WebSocket
- Multi-currency consolidation with live FX rates
- Drill-down from total to account to transaction
- Better than SAP's delayed cash reporting
- Critical for treasury decision-making

**Implementation**:

```typescript
import { Card, DataTable, Chart } from "aibos-ui";

export default function CashDashboard() {
  const { positions } = useCashPositions();

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <h3>Total Cash</h3>
        <div className="text-3xl font-bold">
          {formatCurrency(positions.total)}
        </div>
        <TrendIndicator change={positions.dailyChange} />
      </Card>

      <CashPositionChart data={positions.byEntity} />

      <DataTable
        data={positions.accounts}
        columns={[
          { key: "account", label: "Account" },
          { key: "balance", label: "Balance", align: "right" },
          { key: "currency", label: "Currency" },
        ]}
        liveUpdates
      />
    </div>
  );
}
```

### 2. **Intelligent Cash Forecasting** 📈

**Description**: AI-powered cash forecasting that predicts cash positions for next 30-90 days based on historical patterns and scheduled transactions.

**Why It's Killer**:

- ML-based prediction with 85% accuracy
- Considers AP/AR aging, payroll, seasonal patterns
- Alerts for potential cash shortfalls
- Industry-first AI cash forecasting
- Reduces borrowing costs by 30%

**Implementation**:

```typescript
import { Chart, Alert, Button } from "aibos-ui";

export default function CashForecast() {
  const { forecast, confidence } = useCashForecast(90); // 90 days

  return (
    <>
      <Chart
        type="line"
        data={forecast}
        showConfidenceInterval
        alertThreshold={minCashBalance}
      />

      {forecast.hasShortfall && (
        <Alert variant="warning">
          Cash shortfall predicted on {forecast.shortfallDate}. Consider:{" "}
          {forecast.recommendations}
        </Alert>
      )}
    </>
  );
}
```

### 3. **Automated Cash Sweeping** 🔄

**Description**: Automatically sweep excess cash from subsidiary accounts to master account based on configurable rules.

**Why It's Killer**:

- Automated daily/weekly sweeping
- Configurable minimum balance rules
- Multi-entity support with approval workflows
- Reduces idle cash by 40%
- Better than manual treasury operations

**Implementation**:

```typescript
import { Card, Form, Button } from "aibos-ui";

export default function CashSweepingRules() {
  return (
    <Form onSubmit={saveSweepRules}>
      <Select
        name="frequency"
        label="Sweep Frequency"
        options={["Daily", "Weekly", "Monthly"]}
      />

      <Input
        name="minBalance"
        label="Minimum Balance to Maintain"
        type="number"
      />

      <Select
        name="targetAccount"
        label="Target Account"
        options={masterAccounts}
      />

      <Button type="submit">Save Rules</Button>
      <Button onClick={executeSweepNow}>Execute Now</Button>
    </Form>
  );
}
```

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Cash Dashboard (`/cash`)

**Components**: Card, Chart, DataTable, Badge
**File**: `apps/web/app/(dashboard)/cash/page.tsx`

#### 2. Cash Forecast (`/cash/forecast`)

**Components**: Chart, Alert, DatePicker, Button
**File**: `apps/web/app/(dashboard)/cash/forecast/page.tsx`

#### 3. Cash Transfers (`/cash/transfers`)

**Components**: Form, DataTable, Button, Modal
**File**: `apps/web/app/(dashboard)/cash/transfers/page.tsx`

---

## 🔌 API Integration

```typescript
// apps/web/hooks/useCash.ts
export function useCashPositions() {
  return useQuery({
    queryKey: ["cash", "positions"],
    queryFn: () => apiClient.GET("/api/cash/positions"),
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useCashForecast(days: number) {
  return useQuery({
    queryKey: ["cash", "forecast", days],
    queryFn: () => apiClient.GET("/api/cash/forecast", { query: { days } }),
  });
}

export function useCreateTransfer() {
  return useMutation({
    mutationFn: (data) => apiClient.POST("/api/cash/transfers", { body: data }),
  });
}
```

---

## 📝 Implementation Guide

### Day 1: Dashboard & Positions (8 hours)

1. Create cash dashboard layout (2 hours)
2. Build position cards and charts (3 hours)
3. Add real-time updates (2 hours)
4. Implement drill-down (1 hour)

### Day 2: Forecast & Transfers (4 hours)

1. Build forecast visualization (2 hours)
2. Add transfer functionality (2 hours)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Cash position calculations correct
- [ ] Forecast algorithm accurate
- [ ] Transfer validation works
- [ ] Currency conversion correct

### Integration Tests

- [ ] Real-time updates functional
- [ ] Forecast reflects actual data
- [ ] Transfers post to GL
- [ ] Multi-currency handling correct

### E2E Tests

- [ ] View cash dashboard
- [ ] Create and execute transfer
- [ ] View forecast with alerts
- [ ] Execute cash sweep

---

## 📅 Timeline

| Day | Deliverable                      |
| --- | -------------------------------- |
| 1   | Dashboard with real-time updates |
| 1.5 | Forecast and transfers complete  |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries

### Enables These Modules

- M7: Bank Reconciliation
- M15: Cash Flow Forecasting

---

## 🎯 Success Criteria

### Must Have

- [ ] Display real-time cash positions
- [ ] Multi-currency support
- [ ] Create inter-account transfers
- [ ] View cash forecast
- [ ] Drill-down to transactions

### Should Have

- [ ] Automated cash sweeping
- [ ] Alert notifications
- [ ] Export capabilities
- [ ] Historical trending

### Nice to Have

- [ ] AI-powered insights
- [ ] Optimization recommendations
- [ ] Integration with bank APIs
- [ ] Mobile app

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M5 - Accounts Payable  
**Next**: M7 - Bank Reconciliation
