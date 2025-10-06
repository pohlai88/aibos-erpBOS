# 🚀 M16: Allocation Engine - UI Implementation Runbook

**Module ID**: M16  
**Module Name**: Allocation Engine  
**Priority**: MEDIUM  
**Phase**: 5 - Consolidation & Allocation  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Allocation Engine provides **automated cost and revenue allocation** across departments, projects, and entities with flexible allocation rules.

### Business Value

- Automated allocation of shared costs and revenues
- Multiple allocation methods (headcount, revenue, square footage)
- Allocation waterfall for tiered allocations
- Audit trail of all allocations
- Period-end close automation

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

### 1. **Drag-and-Drop Allocation Designer** 🎨

**Description**: Visual allocation rule builder with drag-and-drop configuration for complex allocation scenarios.

**Why It's Killer**:

- Visual rule builder - no coding required
- Test allocations before posting
- Multi-step allocation waterfall
- Template library for common allocations
- Better than SAP's complex cost center setup

**Implementation**:

```typescript
import { Card, Form, Button, DataTable } from "aibos-ui";

export default function AllocationDesigner() {
  const { rule, test, save } = useAllocationRule();

  return (
    <div className="space-y-6">
      <Card>
        <h3>Allocation Rule Setup</h3>
        <Form>
          <Input label="Rule Name" name="name" />
          <Select
            label="Allocation Method"
            options={[
              "Headcount",
              "Revenue",
              "Square Footage",
              "Equal",
              "Custom",
            ]}
            name="method"
          />
          <Select label="Source Account" name="source_account" searchable />
          <MultiSelect
            label="Target Departments"
            name="target_departments"
            options={departments}
          />
        </Form>
      </Card>

      <Card>
        <h3>Allocation Preview</h3>
        <DataTable
          data={rule.preview}
          columns={[
            { key: "department", label: "Department" },
            { key: "allocation_pct", label: "Allocation %" },
            { key: "amount", label: "Amount", render: formatCurrency },
          ]}
        />
        <div className="flex gap-4 mt-4">
          <Button onClick={test} variant="outline">
            Test Allocation
          </Button>
          <Button onClick={save} variant="primary">
            Save & Activate
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

### 2. **Automated Allocation Posting** ⚡

**Description**: Scheduled allocation runs that automatically post journal entries at month-end.

**Why It's Killer**:

- One-click allocation processing
- Automatic reversal of prior periods
- Email notifications on completion
- Integration with close checklist
- Industry-first fully automated allocations

**Implementation**:

```typescript
import { Button, Card, Timeline, Badge } from "aibos-ui";

export default function AllocationProcessing() {
  const { run, status } = useAllocationRun();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h3>Monthly Allocation Run</h3>
            <p className="text-muted">
              Process all allocation rules for current period
            </p>
          </div>
          <Button
            onClick={run}
            variant="primary"
            size="lg"
            disabled={status.running}
          >
            {status.running ? "Processing..." : "Run All Allocations"}
          </Button>
        </div>
      </Card>

      <Timeline
        items={status.rules.map((rule) => ({
          title: rule.name,
          status: rule.status,
          timestamp: rule.completed_at,
          details: `Allocated ${formatCurrency(rule.amount)} across ${
            rule.target_count
          } departments`,
        }))}
      />

      {status.completed && (
        <Card className="bg-green-50">
          <h4>Allocation Complete</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <strong>Rules Processed:</strong> {status.rules_count}
            </div>
            <div>
              <strong>Total Allocated:</strong>{" "}
              {formatCurrency(status.total_amount)}
            </div>
            <div>
              <strong>Journal Entries:</strong> {status.je_count}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
```

### 3. **Allocation Impact Analysis** 📊

**Description**: Pre-post analysis showing allocation impact by department and account.

**Why It's Killer**:

- Side-by-side before/after comparison
- Drill-down to allocation detail
- Exception alerts for unusual allocations
- Historical trend analysis
- Better than manual allocation reconciliations

**Implementation**:

```typescript
import { Chart, DataTable, Card, Badge } from "aibos-ui";

export default function AllocationAnalysis() {
  const { analysis } = useAllocationAnalysis();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h3>Before Allocation</h3>
          <div className="text-3xl">
            {formatCurrency(analysis.before_total)}
          </div>
        </Card>
        <Card>
          <h3>After Allocation</h3>
          <div className="text-3xl">{formatCurrency(analysis.after_total)}</div>
        </Card>
      </div>

      <Chart
        type="bar"
        data={analysis.by_department}
        series={[
          { key: "before", label: "Before", color: "gray" },
          { key: "after", label: "After", color: "blue" },
          { key: "allocated", label: "Allocated", color: "green" },
        ]}
        title="Allocation Impact by Department"
      />

      <DataTable
        data={analysis.details}
        columns={[
          { key: "department", label: "Department" },
          { key: "before", label: "Before", render: formatCurrency },
          { key: "allocated", label: "Allocated", render: formatCurrency },
          { key: "after", label: "After", render: formatCurrency },
          {
            key: "variance_pct",
            label: "Change %",
            render: (val) => (
              <Badge variant={Math.abs(val) > 20 ? "warning" : "default"}>
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
// apps/web/hooks/useAllocationEngine.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@aibos/api-client';

export function useAllocationEngine(filters = {}) {
  return useQuery({
    queryKey: ['m16', filters],
    queryFn: () => apiClient.GET('/api/[path]', { query: filters }),
  });
}

export function useCreateAllocationEngine() {
  return useMutation({
    mutationFn: data => apiClient.POST('/api/[path]', { body: data }),
    onSuccess: () => queryClient.invalidateQueries(['m16']),
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

**Previous**: M15 - [Previous Module]  
**Next**: M17 - [Next Module]
