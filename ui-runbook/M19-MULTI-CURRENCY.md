# 🚀 M19: Multi-Currency - UI Implementation Runbook

**Module ID**: M19  
**Module Name**: Multi-Currency  
**Priority**: MEDIUM  
**Phase**: 5 - Consolidation & Allocation  
**Estimated Effort**: 1 day  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Multi-Currency handles **multi-currency transaction processing** with automated revaluation, currency translation, and gain/loss tracking.

### Business Value

- Multi-currency transaction support
- Automated FX revaluation
- Realized and unrealized gain/loss tracking
- Historical rate tracking for translation
- Integration with consolidation

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 4 endpoints implemented       |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/[path]` - [Endpoint description]
- ✅ `/api/[path]` - [Endpoint description]

**Total Endpoints**: 4

---

## 🎯 3 Killer Features

### 1. **Currency Revaluation Engine** 💱

**Description**: Automated monthly FX revaluation of foreign currency balances with gain/loss posting.

**Why It's Killer**:

- One-click revaluation processing
- Automatic gain/loss posting
- Account-level revaluation control
- Historical revaluation tracking
- Better than Oracle's manual revaluation

**Implementation**:

```typescript
import { Card, Button, DataTable, Chart } from "aibos-ui";

export default function CurrencyRevaluation() {
  const { revaluation, process } = useFXRevaluation();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h3>FX Revaluation</h3>
            <p className="text-muted">
              Revalue foreign currency balances at current rates
            </p>
          </div>
          <Button onClick={process} variant="primary" size="lg">
            Run Revaluation
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Total Exposure</h3>
          <div className="text-3xl">
            {formatCurrency(revaluation.total_exposure)}
          </div>
        </Card>
        <Card>
          <h3>Unrealized Gain</h3>
          <div className="text-3xl text-green-600">
            {formatCurrency(revaluation.unrealized_gain)}
          </div>
        </Card>
        <Card>
          <h3>Unrealized Loss</h3>
          <div className="text-3xl text-red-600">
            {formatCurrency(revaluation.unrealized_loss)}
          </div>
        </Card>
        <Card>
          <h3>Net Impact</h3>
          <div className="text-3xl">
            {formatCurrency(revaluation.net_impact)}
          </div>
        </Card>
      </div>

      <DataTable
        data={revaluation.accounts}
        columns={[
          { key: "account", label: "Account" },
          { key: "currency", label: "Currency" },
          { key: "foreign_amount", label: "Foreign Amount" },
          { key: "historical_rate", label: "Historical Rate" },
          { key: "current_rate", label: "Current Rate" },
          { key: "book_value", label: "Book Value", render: formatCurrency },
          { key: "fair_value", label: "Fair Value", render: formatCurrency },
          { key: "revaluation", label: "Revaluation", render: formatCurrency },
        ]}
      />
    </div>
  );
}
```

### 2. **Real-Time FX Rate Dashboard** 📈

**Description**: Live foreign exchange rates with automatic rate updates from market data feeds.

**Why It's Killer**:

- Real-time FX rate feeds
- Historical rate tracking
- Rate variance alerts
- Custom rate overrides
- Better than manual rate entry

**Implementation**:

```typescript
import { Card, DataTable, Chart, Badge } from "aibos-ui";

export default function FXRateDashboard() {
  const { rates } = useFXRates();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {rates.major_currencies.map((currency) => (
          <Card key={currency.code}>
            <div className="flex justify-between items-center">
              <div>
                <h3>{currency.code}</h3>
                <p className="text-sm text-muted">{currency.name}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl">{currency.rate}</div>
                <Badge
                  variant={currency.change >= 0 ? "success" : "destructive"}
                >
                  {currency.change >= 0 ? "+" : ""}
                  {currency.change_pct}%
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Chart
        type="line"
        data={rates.historical}
        series={rates.currencies.map((c) => ({
          key: c.code,
          label: c.code,
        }))}
        title="FX Rate Trends (30 Days)"
      />

      <DataTable
        data={rates.all}
        columns={[
          { key: "currency", label: "Currency" },
          { key: "rate", label: "Spot Rate" },
          { key: "bid", label: "Bid" },
          { key: "ask", label: "Ask" },
          { key: "last_updated", label: "Updated" },
          {
            key: "change",
            label: "24h Change",
            render: (val) => (
              <Badge variant={val >= 0 ? "success" : "destructive"}>
                {val >= 0 ? "+" : ""}
                {val}%
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
```

### 3. **Multi-Currency Trial Balance** 🌍

**Description**: Trial balance view showing both functional and foreign currency amounts side-by-side.

**Why It's Killer**:

- Dual-currency display
- Toggle between currencies
- Drill-down to transactions
- FX impact analysis
- Industry-first dual-currency TB

**Implementation**:

```typescript
import { DataTable, Toggle, Card } from "aibos-ui";

export default function MultiCurrencyTrialBalance() {
  const [showForeign, setShowForeign] = useState(true);
  const { trialBalance } = useMultiCurrencyTB();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2>Multi-Currency Trial Balance</h2>
        <Toggle
          label="Show Foreign Currency"
          checked={showForeign}
          onChange={setShowForeign}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Total Assets (USD)</h3>
          <div className="text-3xl">
            {formatCurrency(trialBalance.assets_usd)}
          </div>
        </Card>
        <Card>
          <h3>FX Impact</h3>
          <div className="text-3xl text-blue-600">
            {formatCurrency(trialBalance.fx_impact)}
          </div>
        </Card>
        <Card>
          <h3>Currencies</h3>
          <div className="text-3xl">{trialBalance.currency_count}</div>
        </Card>
      </div>

      <DataTable
        data={trialBalance.accounts}
        columns={[
          { key: "account", label: "Account" },
          showForeign && { key: "foreign_currency", label: "Currency" },
          showForeign && { key: "foreign_amount", label: "Foreign Amount" },
          showForeign && { key: "fx_rate", label: "FX Rate" },
          { key: "usd_amount", label: "USD Amount", render: formatCurrency },
          { key: "fx_gain_loss", label: "FX G/L", render: formatCurrency },
        ].filter(Boolean)}
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
// apps/web/hooks/useMulti-Currency.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function useMulti-Currency(filters = {}) {
  return useQuery({
    queryKey: ["m19", filters],
    queryFn: () => apiClient.GET("/api/[path]", { query: filters }),
  });
}

export function useCreateMulti-Currency() {
  return useMutation({
    mutationFn: (data) => apiClient.POST("/api/[path]", { body: data }),
    onSuccess: () => queryClient.invalidateQueries(["m19"]),
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

**Previous**: M18 - [Previous Module]  
**Next**: M20 - [Next Module]
