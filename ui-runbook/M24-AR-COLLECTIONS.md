# 🚀 M24: AR Collections - UI Implementation Runbook

**Module ID**: M24  
**Module Name**: AR Collections  
**Priority**: HIGH  
**Phase**: 7 - Payments & Billing  
**Estimated Effort**: 2.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

AR Collections manages **automated collections workflows** with AI-powered prioritization, dunning sequences, and collector performance tracking.

### Business Value

- AI-powered collection prioritization
- Automated dunning email sequences
- Collector workload management
- Collections performance analytics
- Integration with customer portal and payments

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 27 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/[path]` - [Endpoint description]
- ✅ `/api/[path]` - [Endpoint description]

**Total Endpoints**: 27

---

## 🎯 3 Killer Features

### 1. **AI Collections Prioritization** 🤖

**Description**: AI-powered customer ranking based on payment probability, relationship value, and collection likelihood.

**Why It's Killer**:

- ML-based payment probability scoring
- Customer lifetime value weighting
- Optimal contact timing recommendations
- Automated work queue generation
- Industry-first AI-powered collections

**Implementation**:

```typescript
import { DataTable, Badge, Card, Chart } from "aibos-ui";

export default function CollectionsPriority() {
  const { customers, call } = useCollectionsPriority();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>High Priority</h3>
          <div className="text-3xl text-red-600">
            {customers.high_priority_count}
          </div>
          <div className="text-sm">
            {formatCurrency(customers.high_priority_amount)}
          </div>
        </Card>
        <Card>
          <h3>Expected Collections</h3>
          <div className="text-3xl text-green-600">
            {formatCurrency(customers.expected_today)}
          </div>
        </Card>
        <Card>
          <h3>Success Rate</h3>
          <div className="text-3xl">{customers.success_rate}%</div>
        </Card>
        <Card>
          <h3>Avg DSO</h3>
          <div className="text-3xl">{customers.avg_dso} days</div>
        </Card>
      </div>

      <DataTable
        data={customers.list}
        columns={[
          { key: "customer", label: "Customer" },
          { key: "amount_due", label: "Amount Due", render: formatCurrency },
          { key: "days_overdue", label: "Days Overdue" },
          {
            key: "ai_score",
            label: "AI Score",
            render: (score) => (
              <Badge
                variant={
                  score > 70
                    ? "success"
                    : score > 40
                    ? "warning"
                    : "destructive"
                }
              >
                {score}%
              </Badge>
            ),
          },
          { key: "best_contact_time", label: "Best Time" },
          {
            key: "actions",
            label: "Actions",
            render: (_, row) => (
              <Button size="sm" onClick={() => call(row.id)}>
                Call Now
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
```

### 2. **Automated Dunning Workflows** 📧

**Description**: Multi-touch automated email sequences with escalation rules and payment links.

**Why It's Killer**:

- Multi-level dunning sequences
- Personalized email templates
- Automatic escalation rules
- Embedded payment links
- Better than manual dunning emails

**Implementation**:

```typescript
import { Timeline, Card, Form, Button } from "aibos-ui";

export default function DunningWorkflows() {
  const { sequences, create } = useDunningSequences();

  return (
    <div className="space-y-6">
      <Card>
        <h3>Create Dunning Sequence</h3>
        <Form onSubmit={create}>
          <Input label="Sequence Name" name="name" />
          <Select
            label="Trigger"
            options={["15 days overdue", "30 days", "60 days"]}
            name="trigger"
          />
          <Timeline
            items={[
              { day: 0, action: "Friendly reminder email" },
              { day: 7, action: "Payment request with link" },
              { day: 14, action: "Escalation to manager" },
              { day: 21, action: "Final notice" },
            ]}
          />
          <Button type="submit">Create Sequence</Button>
        </Form>
      </Card>

      <DataTable
        data={sequences}
        columns={[
          { key: "name", label: "Sequence" },
          { key: "active_customers", label: "Active" },
          { key: "success_rate", label: "Success Rate" },
          { key: "avg_days_to_payment", label: "Avg Days" },
        ]}
      />
    </div>
  );
}
```

### 3. **Collections Performance Dashboard** 📊

**Description**: Real-time collections metrics with collector performance tracking and trend analysis.

**Why It's Killer**:

- Collector performance leaderboard
- Collections efficiency metrics
- Trend analysis and forecasting
- Goal tracking and alerts
- Better than manual collections tracking

**Implementation**:

```typescript
import { Chart, Card, DataTable } from "aibos-ui";

export default function CollectionsPerformance() {
  const { metrics } = useCollectionsMetrics();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Collections This Month</h3>
          <div className="text-4xl">
            {formatCurrency(metrics.month_collected)}
          </div>
          <Badge variant="success">
            +{metrics.vs_last_month}% vs last month
          </Badge>
        </Card>
        <Card>
          <h3>DSO Improvement</h3>
          <div className="text-4xl text-green-600">
            -{metrics.dso_improvement} days
          </div>
        </Card>
        <Card>
          <h3>Success Rate</h3>
          <div className="text-4xl">{metrics.success_rate}%</div>
        </Card>
      </div>

      <Chart
        type="line"
        data={metrics.trend}
        title="Collections Trend (12 Months)"
      />

      <Card>
        <h3>Collector Performance</h3>
        <DataTable
          data={metrics.collectors}
          columns={[
            { key: "name", label: "Collector" },
            { key: "collected", label: "Collected", render: formatCurrency },
            { key: "calls_made", label: "Calls" },
            { key: "success_rate", label: "Success %" },
            { key: "avg_dso", label: "Avg DSO" },
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

#### 1. Main Page (`/[module]/[page]`)

**Components**: DataTable, Button, Card, Form
**File**: `apps/web/app/(dashboard)/[module]/page.tsx`

#### 2. Detail Page (`/[module]/[id]`)

**Components**: Form, Button, Card, Badge
**File**: `apps/web/app/(dashboard)/[module]/[id]/page.tsx`

---

## 🔌 API Integration

```typescript
// apps/web/hooks/useARCollections.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@aibos/api-client';

export function useARCollections(filters = {}) {
  return useQuery({
    queryKey: ['m24', filters],
    queryFn: () => apiClient.GET('/api/[path]', { query: filters }),
  });
}

export function useCreateARCollections() {
  return useMutation({
    mutationFn: data => apiClient.POST('/api/[path]', { body: data }),
    onSuccess: () => queryClient.invalidateQueries(['m24']),
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

### Day 3: [Tasks] (8 hours)

1. [Task 1] (X hours)
2. [Task 2] (X hours)
3. [Task 3] (X hours)

**Total**: 2.5 days (20 hours)

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
| 3   | [Deliverable description] |

**Total**: 2.5 days (20 hours)

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

**Previous**: M23 - [Previous Module]  
**Next**: M25 - [Next Module]
