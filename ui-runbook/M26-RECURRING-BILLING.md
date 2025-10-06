# 🚀 M26: Recurring Billing - UI Implementation Runbook

**Module ID**: M26  
**Module Name**: Recurring Billing  
**Priority**: MEDIUM  
**Phase**: 7 - Payments & Billing  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Recurring Billing manages **subscription-based billing** with automated invoice generation, proration, and revenue recognition integration.

### Business Value

- Automated subscription billing cycles
- Proration and plan changes
- Dunning management for failed payments
- Revenue recognition automation
- Customer self-service plan management

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 13 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/[path]` - [Endpoint description]
- ✅ `/api/[path]` - [Endpoint description]

**Total Endpoints**: 13

---

## 🎯 3 Killer Features

### 1. **Subscription Management Dashboard** 🔄

**Description**: Visual dashboard for managing all subscription plans, billing cycles, and customer subscriptions.

**Why It's Killer**:

- Drag-and-drop plan builder
- Automated billing runs
- Real-time MRR tracking
- Churn analysis
- Better than Stripe Billing

**Implementation**:

```typescript
import { DataTable, Card, Chart } from "aibos-ui";

export default function SubscriptionDashboard() {
  const { subscriptions } = useSubscriptions();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>MRR</h3>
          <div className="text-3xl">{formatCurrency(subscriptions.mrr)}</div>
          <Badge variant="success">+{subscriptions.mrr_growth}%</Badge>
        </Card>
        <Card>
          <h3>Active Subscriptions</h3>
          <div className="text-3xl">{subscriptions.active_count}</div>
        </Card>
        <Card>
          <h3>Churn Rate</h3>
          <div className="text-3xl">{subscriptions.churn_rate}%</div>
        </Card>
        <Card>
          <h3>ARR</h3>
          <div className="text-3xl">{formatCurrency(subscriptions.arr)}</div>
        </Card>
      </div>

      <Chart
        type="line"
        data={subscriptions.mrr_trend}
        title="MRR Trend (12 Months)"
      />
    </div>
  );
}
```

### 2. **Automated Billing Runs** ⚡

**Description**: Scheduled billing runs with automatic invoice generation and payment processing.

**Why It's Killer**:

- Automated monthly/annual billing
- Smart proration calculations
- Failed payment retry logic
- Automatic revenue recognition
- Industry-first billing automation

**Implementation**:

```typescript
import { Button, Card, Timeline } from "aibos-ui";

export default function BillingRuns() {
  const { runs, execute } = useBillingRuns();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h3>Next Billing Run</h3>
            <p>Scheduled for {runs.next_run_date}</p>
          </div>
          <Button onClick={execute} variant="primary">
            Run Billing Now
          </Button>
        </div>
      </Card>

      <Timeline
        items={runs.history.map((run) => ({
          date: run.date,
          title: `Billing Run #${run.number}`,
          description: `${run.invoices_created} invoices, ${formatCurrency(
            run.total_amount
          )}`,
          status: run.status,
        }))}
      />
    </div>
  );
}
```

### 3. **Revenue Recognition Integration** 📊

**Description**: Automatic revenue recognition journal entries based on subscription billing.

**Why It's Killer**:

- ASC 606 compliant revenue recognition
- Automatic deferred revenue tracking
- Revenue waterfall visualization
- Integration with M12
- Better than manual revenue recognition

**Implementation**:

```typescript
import { Chart, Card } from "aibos-ui";

export default function RevenueRecognition() {
  const { revenue } = useSubscriptionRevenue();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Recognized This Month</h3>
          <div className="text-3xl">{formatCurrency(revenue.recognized)}</div>
        </Card>
        <Card>
          <h3>Deferred Revenue</h3>
          <div className="text-3xl">{formatCurrency(revenue.deferred)}</div>
        </Card>
        <Card>
          <h3>Unbilled Revenue</h3>
          <div className="text-3xl">{formatCurrency(revenue.unbilled)}</div>
        </Card>
      </div>

      <Chart
        type="waterfall"
        data={revenue.waterfall}
        title="Revenue Movement"
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
// apps/web/hooks/useRecurringBilling.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function useRecurringBilling(filters = {}) {
  return useQuery({
    queryKey: ["m26", filters],
    queryFn: () => apiClient.GET("/api/[path]", { query: filters }),
  });
}

export function useCreateRecurringBilling() {
  return useMutation({
    mutationFn: (data) => apiClient.POST("/api/[path]", { body: data }),
    onSuccess: () => queryClient.invalidateQueries(["m26"]),
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

**Previous**: M25 - [Previous Module]  
**Next**: M27 - [Next Module]
