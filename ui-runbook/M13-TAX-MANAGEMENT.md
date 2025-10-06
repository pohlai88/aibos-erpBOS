# 🚀 M13: Tax Management - UI Implementation Runbook

**Module ID**: M13  
**Module Name**: Tax Management  
**Priority**: HIGH  
**Phase**: 4 - Advanced Financial  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Tax Management handles **corporate income tax provisioning, deferred tax calculations, and tax return preparation** with ASC 740 compliance and multi-jurisdiction support.

### Business Value

- Automated tax provision calculations
- Deferred tax asset and liability tracking
- Multi-jurisdiction tax rate management
- ASC 740 uncertain tax position (UTP) tracking
- Integration with tax return preparation

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 16 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/[path]` - [Endpoint description]
- ✅ `/api/[path]` - [Endpoint description]

**Total Endpoints**: 16

---

## 🎯 3 Killer Features

### 1. **Automated Tax Provision Calculator** 🧮

**Description**: Real-time tax provision calculation with current and deferred tax components, supporting multiple jurisdictions.

**Why It's Killer**:

- Automated current and deferred tax calculations
- Multi-jurisdiction tax rate engine
- Book-to-tax adjustments tracking
- Effective tax rate (ETR) analysis
- Better than OneSource's manual tax provision tools

**Implementation**:

```typescript
import { Form, Card, DataTable, Chart } from "aibos-ui";

export default function TaxProvisionCalculator() {
  const { calculate } = useTaxProvision();

  return (
    <Form onSubmit={calculate}>
      <Card>
        <h3>Pre-Tax Income</h3>
        <Input
          label="Book Income Before Tax"
          type="number"
          name="book_income"
        />
      </Card>

      <Card>
        <h3>Book-to-Tax Adjustments</h3>
        <DataTable
          data={adjustments}
          columns={[
            { key: "description", label: "Description" },
            { key: "amount", label: "Amount", render: formatCurrency },
            { key: "type", label: "Type", render: (v) => <Badge>{v}</Badge> },
          ]}
        />
        <Button size="sm" onClick={addAdjustment}>
          + Add Adjustment
        </Button>
      </Card>

      <Card className="bg-blue-50">
        <h3>Tax Provision Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4>Current Tax</h4>
            <div className="space-y-2">
              <div>
                <strong>Federal:</strong>{" "}
                {formatCurrency(provision.current_federal)}
              </div>
              <div>
                <strong>State:</strong>{" "}
                {formatCurrency(provision.current_state)}
              </div>
              <div>
                <strong>Foreign:</strong>{" "}
                {formatCurrency(provision.current_foreign)}
              </div>
              <div className="text-xl pt-2">
                <strong>Total Current:</strong>{" "}
                {formatCurrency(provision.total_current)}
              </div>
            </div>
          </div>
          <div>
            <h4>Deferred Tax</h4>
            <div className="space-y-2">
              <div>
                <strong>Federal:</strong>{" "}
                {formatCurrency(provision.deferred_federal)}
              </div>
              <div>
                <strong>State:</strong>{" "}
                {formatCurrency(provision.deferred_state)}
              </div>
              <div>
                <strong>Foreign:</strong>{" "}
                {formatCurrency(provision.deferred_foreign)}
              </div>
              <div className="text-xl pt-2">
                <strong>Total Deferred:</strong>{" "}
                {formatCurrency(provision.total_deferred)}
              </div>
            </div>
          </div>
        </div>
        <div className="text-2xl mt-4 pt-4 border-t">
          <strong>Total Tax Expense:</strong>{" "}
          {formatCurrency(provision.total_expense)}
        </div>
        <div className="text-lg mt-2">
          <strong>Effective Tax Rate:</strong> {provision.effective_rate}%
        </div>
      </Card>
    </Form>
  );
}
```

### 2. **Deferred Tax Asset/Liability Tracker** 📊

**Description**: Visual tracking of deferred tax assets and liabilities with automatic calculation of temporary differences.

**Why It's Killer**:

- Automatic temporary difference identification
- DTA/DTL scheduling and reversal projection
- Valuation allowance calculator
- ASC 740 compliant disclosure generation
- Industry-first visual deferred tax tracking

**Implementation**:

```typescript
import { DataTable, Chart, Card } from "aibos-ui";

export default function DeferredTaxTracker() {
  const { deferredTax } = useDeferredTax();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Deferred Tax Assets</h3>
          <div className="text-3xl">{formatCurrency(deferredTax.assets)}</div>
        </Card>
        <Card>
          <h3>Valuation Allowance</h3>
          <div className="text-3xl text-red-600">
            ({formatCurrency(deferredTax.valuation_allowance)})
          </div>
        </Card>
        <Card>
          <h3>Deferred Tax Liabilities</h3>
          <div className="text-3xl">
            {formatCurrency(deferredTax.liabilities)}
          </div>
        </Card>
      </div>

      <DataTable
        data={deferredTax.items}
        columns={[
          { key: "category", label: "Category" },
          { key: "book_basis", label: "Book Basis", render: formatCurrency },
          { key: "tax_basis", label: "Tax Basis", render: formatCurrency },
          { key: "difference", label: "Difference", render: formatCurrency },
          { key: "tax_rate", label: "Tax Rate" },
          {
            key: "deferred_tax",
            label: "Deferred Tax",
            render: (val) => (
              <Badge variant={val > 0 ? "success" : "destructive"}>
                {formatCurrency(val)}
              </Badge>
            ),
          },
        ]}
      />

      <Chart
        type="waterfall"
        data={deferredTax.reconciliation}
        title="Deferred Tax Movement"
      />
    </div>
  );
}
```

### 3. **Multi-Jurisdiction Tax Rate Manager** 🌍

**Description**: Centralized management of tax rates across multiple jurisdictions with automatic rate updates and apportionment.

**Why It's Killer**:

- Multi-jurisdiction tax rate library
- State apportionment formula calculator
- Foreign tax credit management
- Automatic rate updates via API
- Better than manual jurisdiction tracking

**Implementation**:

```typescript
import { DataTable, Form, Card, Badge } from "aibos-ui";

export default function TaxRateManager() {
  const { jurisdictions, updateRate } = useTaxJurisdictions();

  return (
    <div className="space-y-6">
      <Card>
        <h3>Effective Tax Rate by Jurisdiction</h3>
        <Chart
          type="bar"
          data={jurisdictions.map((j) => ({
            jurisdiction: j.name,
            rate: j.effective_rate,
          }))}
        />
      </Card>

      <DataTable
        data={jurisdictions}
        columns={[
          { key: "jurisdiction", label: "Jurisdiction" },
          {
            key: "type",
            label: "Type",
            render: (v) => <Badge>{v}</Badge>,
          },
          { key: "statutory_rate", label: "Statutory Rate" },
          { key: "effective_rate", label: "Effective Rate" },
          {
            key: "income_allocated",
            label: "Income Allocated",
            render: formatCurrency,
          },
          { key: "tax_expense", label: "Tax Expense", render: formatCurrency },
          {
            key: "actions",
            label: "Actions",
            render: (_, row) => (
              <Button size="sm" onClick={() => updateRate(row.id)}>
                Update Rate
              </Button>
            ),
          },
        ]}
      />

      <Card>
        <h3>State Apportionment</h3>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Sales Factor %" type="number" name="sales_factor" />
          <Input label="Payroll Factor %" type="number" name="payroll_factor" />
          <Input
            label="Property Factor %"
            type="number"
            name="property_factor"
          />
        </div>
        <div className="bg-blue-50 p-4 rounded mt-4">
          <strong>Apportionment %:</strong> {apportionment.total}%
        </div>
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
// apps/web/hooks/useTaxManagement.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@aibos/api-client';

export function useTaxManagement(filters = {}) {
  return useQuery({
    queryKey: ['m13', filters],
    queryFn: () => apiClient.GET('/api/[path]', { query: filters }),
  });
}

export function useCreateTaxManagement() {
  return useMutation({
    mutationFn: data => apiClient.POST('/api/[path]', { body: data }),
    onSuccess: () => queryClient.invalidateQueries(['m13']),
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

**Total**: 2 days (16 hours)

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

**Total**: 2 days (16 hours)

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

**Previous**: M12 - [Previous Module]  
**Next**: M14 - [Next Module]
