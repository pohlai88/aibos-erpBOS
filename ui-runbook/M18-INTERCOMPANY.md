# 🚀 M18: Intercompany - UI Implementation Runbook

**Module ID**: M18  
**Module Name**: Intercompany  
**Priority**: MEDIUM  
**Phase**: 5 - Consolidation & Allocation  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Intercompany manages **intercompany transaction tracking, matching, and reconciliation** across entities with automated settlements.

### Business Value

- Automated intercompany transaction matching
- Receivable/Payable reconciliation
- Intercompany settlement processing
- Mismatch identification and resolution
- Consolidation elimination support

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 7 endpoints implemented       |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/[path]` - [Endpoint description]
- ✅ `/api/[path]` - [Endpoint description]

**Total Endpoints**: 7

---

## 🎯 3 Killer Features

### 1. **Auto-Match Intercompany Transactions** 🤝

**Description**: AI-powered matching of intercompany receivables and payables across entities.

**Why It's Killer**:

- Automatic AR/AP matching
- Smart suggestions for partial matches
- Mismatch exception workflow
- Real-time match status
- Industry-first automated IC matching

**Implementation**:

```typescript
import { DataTable, Button, Badge, Card } from "aibos-ui";

export default function ICMatching() {
  const { transactions, autoMatch } = useICMatching();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2>Intercompany Matching</h2>
        <Button onClick={autoMatch} variant="primary">
          Auto-Match Transactions
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Total IC Balance</h3>
          <div className="text-3xl">{formatCurrency(transactions.total)}</div>
        </Card>
        <Card>
          <h3>Matched</h3>
          <div className="text-3xl text-green-600">
            {formatCurrency(transactions.matched)}
          </div>
        </Card>
        <Card>
          <h3>Unmatched</h3>
          <div className="text-3xl text-orange-600">
            {formatCurrency(transactions.unmatched)}
          </div>
        </Card>
        <Card>
          <h3>Match Rate</h3>
          <div className="text-3xl">{transactions.match_rate}%</div>
        </Card>
      </div>

      <DataTable
        data={transactions.list}
        columns={[
          { key: "entity_from", label: "From Entity" },
          { key: "entity_to", label: "To Entity" },
          { key: "transaction", label: "Transaction" },
          { key: "amount", label: "Amount", render: formatCurrency },
          {
            key: "match_status",
            label: "Status",
            render: (val) => (
              <Badge
                variant={
                  val === "Matched"
                    ? "success"
                    : val === "Partial"
                    ? "warning"
                    : "destructive"
                }
              >
                {val}
              </Badge>
            ),
          },
          {
            key: "confidence",
            label: "AI Confidence",
            render: (val) => <Badge variant="info">{val}%</Badge>,
          },
        ]}
      />
    </div>
  );
}
```

### 2. **Intercompany Settlement Dashboard** 💸

**Description**: Centralized view of all intercompany balances with one-click settlement.

**Why It's Killer**:

- Real-time IC balance tracking
- Net settlement calculations
- Automated payment instructions
- Settlement history and audit trail
- Better than manual IC reconciliations

**Implementation**:

```typescript
import { Card, DataTable, Button, Chart } from "aibos-ui";

export default function ICSettlement() {
  const { balances, settle } = useICSettlement();

  return (
    <div className="space-y-6">
      <Card>
        <h3>Net Settlement Matrix</h3>
        <Chart
          type="heatmap"
          data={balances.matrix}
          title="Intercompany Balances"
        />
      </Card>

      <DataTable
        data={balances.entity_pairs}
        columns={[
          { key: "entity_pair", label: "Entity Pair" },
          { key: "ar_balance", label: "AR Balance", render: formatCurrency },
          { key: "ap_balance", label: "AP Balance", render: formatCurrency },
          { key: "net_balance", label: "Net Balance", render: formatCurrency },
          {
            key: "actions",
            label: "Actions",
            render: (_, row) => (
              <Button size="sm" onClick={() => settle(row.id)}>
                Settle
              </Button>
            ),
          },
        ]}
      />

      <Card className="bg-blue-50">
        <h3>Settlement Instructions</h3>
        <div className="space-y-2">
          {balances.settlement_instructions.map((instruction, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-2 bg-white rounded"
            >
              <span>
                {instruction.from} → {instruction.to}
              </span>
              <strong>{formatCurrency(instruction.amount)}</strong>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

### 3. **IC Mismatch Resolution Workflow** 🔍

**Description**: Guided workflow for investigating and resolving intercompany mismatches.

**Why It's Killer**:

- Exception-based workflow
- Side-by-side entity comparison
- Collaborative resolution tools
- Adjustment entry generation
- Faster than email-based resolution

**Implementation**:

```typescript
import { Card, DataTable, Button, Badge, Form } from "aibos-ui";

export default function MismatchResolution({ mismatchId }) {
  const { mismatch, resolve } = useMismatchResolution(mismatchId);

  return (
    <div className="space-y-6">
      <Card>
        <h3>Mismatch Details</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4>{mismatch.entity_a} View</h4>
            <div className="space-y-2">
              <div>
                <strong>Amount:</strong> {formatCurrency(mismatch.amount_a)}
              </div>
              <div>
                <strong>Date:</strong> {mismatch.date_a}
              </div>
              <div>
                <strong>Reference:</strong> {mismatch.ref_a}
              </div>
            </div>
          </div>
          <div>
            <h4>{mismatch.entity_b} View</h4>
            <div className="space-y-2">
              <div>
                <strong>Amount:</strong> {formatCurrency(mismatch.amount_b)}
              </div>
              <div>
                <strong>Date:</strong> {mismatch.date_b}
              </div>
              <div>
                <strong>Reference:</strong> {mismatch.ref_b}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-red-50 rounded">
          <strong>Difference:</strong>{" "}
          {formatCurrency(Math.abs(mismatch.amount_a - mismatch.amount_b))}
        </div>
      </Card>

      <Card>
        <h3>Resolution Action</h3>
        <Form onSubmit={resolve}>
          <Select
            label="Resolution Type"
            name="resolution_type"
            options={[
              "Adjust Entity A",
              "Adjust Entity B",
              "Create elimination entry",
              "Write-off difference",
            ]}
          />
          <Input label="Explanation" name="explanation" multiline />
          <Input label="Adjustment Amount" name="amount" type="number" />

          <div className="flex gap-4 mt-4">
            <Button type="submit" variant="primary">
              Resolve Mismatch
            </Button>
            <Button variant="outline" onClick={() => escalate(mismatchId)}>
              Escalate to Manager
            </Button>
          </div>
        </Form>
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
// apps/web/hooks/useIntercompany.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@aibos/api-client';

export function useIntercompany(filters = {}) {
  return useQuery({
    queryKey: ['m18', filters],
    queryFn: () => apiClient.GET('/api/[path]', { query: filters }),
  });
}

export function useCreateIntercompany() {
  return useMutation({
    mutationFn: data => apiClient.POST('/api/[path]', { body: data }),
    onSuccess: () => queryClient.invalidateQueries(['m18']),
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

**Previous**: M17 - [Previous Module]  
**Next**: M19 - [Next Module]
