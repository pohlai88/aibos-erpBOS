# 🚀 M12: Revenue Recognition - UI Implementation Runbook

**Module ID**: M12  
**Module Name**: Revenue Recognition  
**Priority**: HIGH  
**Phase**: 4 - Advanced Financial  
**Estimated Effort**: 2.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Revenue Recognition manages **ASC 606 compliant revenue accounting** with performance obligation tracking, contract modifications, and deferred revenue management.

### Business Value

- Full ASC 606 / IFRS 15 compliance automation
- Performance obligation allocation and tracking
- Variable consideration and constraint estimation
- Contract modification accounting
- Deferred revenue waterfall and forecast

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 26 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/[path]` - [Endpoint description]
- ✅ `/api/[path]` - [Endpoint description]

**Total Endpoints**: 26

---

## 🎯 3 Killer Features

### 1. **ASC 606 Five-Step Wizard** 🪄

**Description**: Interactive wizard that guides users through the five-step ASC 606 revenue recognition framework.

**Why It's Killer**:

- Step-by-step guidance through contract analysis
- Automatic performance obligation identification
- Transaction price allocation engine
- Variable consideration calculator with constraint
- Industry-first visual ASC 606 compliance tool

**Implementation**:

```typescript
import { Wizard, Card, Form, Chart } from "aibos-ui";

export default function ASC606Wizard({ contractId }) {
  const { contract, allocate } = useRevenueContract(contractId);

  return (
    <Wizard
      steps={[
        {
          title: "Step 1: Identify Contract",
          content: (
            <Card>
              <h3>Contract Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Customer:</strong> {contract.customer}
                </div>
                <div>
                  <strong>Total Value:</strong>{" "}
                  {formatCurrency(contract.total_value)}
                </div>
                <div>
                  <strong>Start Date:</strong> {contract.start_date}
                </div>
                <div>
                  <strong>Term:</strong> {contract.term} months
                </div>
              </div>
            </Card>
          ),
        },
        {
          title: "Step 2: Identify Performance Obligations",
          content: (
            <Form>
              {contract.line_items.map((item, idx) => (
                <Card key={idx}>
                  <Input
                    label="Performance Obligation"
                    value={item.description}
                  />
                  <Toggle label="Distinct?" name={`distinct_${idx}`} />
                  <Select
                    label="Recognition Pattern"
                    options={["Point in time", "Over time"]}
                    name={`pattern_${idx}`}
                  />
                </Card>
              ))}
            </Form>
          ),
        },
        {
          title: "Step 3: Determine Transaction Price",
          content: (
            <Card>
              <div className="space-y-4">
                <div>
                  <strong>Base Price:</strong>{" "}
                  {formatCurrency(contract.base_price)}
                </div>
                <Input
                  label="Variable Consideration"
                  type="number"
                  name="variable_consideration"
                />
                <Input
                  label="Constraint %"
                  type="number"
                  name="constraint_percentage"
                />
                <div className="bg-blue-50 p-4 rounded">
                  <strong>Total Transaction Price:</strong>{" "}
                  {formatCurrency(contract.transaction_price)}
                </div>
              </div>
            </Card>
          ),
        },
        {
          title: "Step 4: Allocate Transaction Price",
          content: (
            <div className="space-y-4">
              {contract.performance_obligations.map((po, idx) => (
                <Card key={idx}>
                  <h4>{po.description}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <strong>Standalone Price:</strong>{" "}
                      {formatCurrency(po.standalone_price)}
                    </div>
                    <div>
                      <strong>Allocation %:</strong> {po.allocation_pct}%
                    </div>
                    <div>
                      <strong>Allocated Amount:</strong>{" "}
                      {formatCurrency(po.allocated_amount)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ),
        },
        {
          title: "Step 5: Recognize Revenue",
          content: (
            <div className="space-y-6">
              <Chart
                type="waterfall"
                data={contract.revenue_schedule}
                title="Revenue Recognition Schedule"
              />
              <DataTable
                data={contract.revenue_schedule}
                columns={[
                  { key: "period", label: "Period" },
                  {
                    key: "recognized",
                    label: "Recognized",
                    render: formatCurrency,
                  },
                  {
                    key: "deferred",
                    label: "Deferred",
                    render: formatCurrency,
                  },
                  {
                    key: "cumulative",
                    label: "Cumulative",
                    render: formatCurrency,
                  },
                ]}
              />
            </div>
          ),
        },
      ]}
      onComplete={allocate}
    />
  );
}
```

### 2. **Deferred Revenue Waterfall** 📊

**Description**: Visual waterfall chart showing deferred revenue movement: beginning balance, additions, recognition, and ending balance.

**Why It's Killer**:

- Real-time deferred revenue tracking
- Drill-down to individual contracts
- Forecast future revenue recognition
- Current vs non-current classification
- Better than NetSuite's static reports

**Implementation**:

```typescript
import { Chart, Card, DataTable } from "aibos-ui";

export default function DeferredRevenueWaterfall() {
  const { waterfall } = useDeferredRevenueWaterfall();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Beginning Balance</h3>
          <div className="text-3xl">{formatCurrency(waterfall.beginning)}</div>
        </Card>
        <Card>
          <h3>New Deferrals</h3>
          <div className="text-3xl text-green-600">
            {formatCurrency(waterfall.additions)}
          </div>
        </Card>
        <Card>
          <h3>Recognized</h3>
          <div className="text-3xl text-blue-600">
            {formatCurrency(waterfall.recognized)}
          </div>
        </Card>
        <Card>
          <h3>Ending Balance</h3>
          <div className="text-3xl">{formatCurrency(waterfall.ending)}</div>
        </Card>
      </div>

      <Chart
        type="waterfall"
        data={[
          { label: "Beginning", value: waterfall.beginning },
          {
            label: "New Deferrals",
            value: waterfall.additions,
            type: "increase",
          },
          {
            label: "Recognized",
            value: -waterfall.recognized,
            type: "decrease",
          },
          { label: "Ending", value: waterfall.ending, type: "total" },
        ]}
        title="Deferred Revenue Movement"
      />

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h3>Current Portion</h3>
          <div className="text-2xl">{formatCurrency(waterfall.current)}</div>
        </Card>
        <Card>
          <h3>Non-Current Portion</h3>
          <div className="text-2xl">
            {formatCurrency(waterfall.non_current)}
          </div>
        </Card>
      </div>
    </div>
  );
}
```

### 3. **Contract Modification Tracker** 🔄

**Description**: Automated accounting for contract modifications with prospective vs retrospective treatment analysis.

**Why It's Killer**:

- Automatic modification type identification
- Side-by-side accounting treatment comparison
- Impact analysis on revenue recognition
- Audit trail of all contract changes
- Industry-first automated contract modification accounting

**Implementation**:

```typescript
import { Form, Card, Badge, Timeline } from "aibos-ui";

export default function ContractModification({ contractId }) {
  const { contract, analyzeModification } = useContractModification(contractId);

  return (
    <div className="space-y-6">
      <Card>
        <h3>Original Contract</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <strong>Total Value:</strong>{" "}
            {formatCurrency(contract.original_value)}
          </div>
          <div>
            <strong>Term:</strong> {contract.original_term} months
          </div>
          <div>
            <strong>Status:</strong> <Badge>{contract.status}</Badge>
          </div>
        </div>
      </Card>

      <Form onSubmit={analyzeModification}>
        <h3>Proposed Modification</h3>
        <Input label="Additional Goods/Services" name="additional_items" />
        <Input
          label="Additional Consideration"
          type="number"
          name="additional_consideration"
        />
        <Select
          label="Modification Type"
          options={[
            "Separate contract",
            "Termination + new contract",
            "Continuation - prospective",
            "Continuation - retrospective",
          ]}
          name="modification_type"
        />

        <Card className="bg-blue-50">
          <h4>Accounting Treatment</h4>
          <div className="space-y-2">
            <div>
              <strong>Recommended Treatment:</strong>
              <Badge variant="primary">{analysis.recommended_treatment}</Badge>
            </div>
            <div>
              <strong>Impact on Revenue:</strong>{" "}
              {formatCurrency(analysis.revenue_impact)}
            </div>
            <div>
              <strong>Adjustment Required:</strong>
              {analysis.requires_adjustment ? "Yes" : "No"}
            </div>
          </div>
        </Card>

        <Button type="submit">Apply Modification</Button>
      </Form>

      <Timeline
        items={contract.modifications.map((mod) => ({
          date: mod.date,
          title: mod.type,
          description: `${formatCurrency(mod.amount)} - ${mod.treatment}`,
        }))}
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
// apps/web/hooks/useRevenueRecognition.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function useRevenueRecognition(filters = {}) {
  return useQuery({
    queryKey: ["m12", filters],
    queryFn: () => apiClient.GET("/api/[path]", { query: filters }),
  });
}

export function useCreateRevenueRecognition() {
  return useMutation({
    mutationFn: (data) => apiClient.POST("/api/[path]", { body: data }),
    onSuccess: () => queryClient.invalidateQueries(["m12"]),
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

**Previous**: M11 - [Previous Module]  
**Next**: M13 - [Next Module]
