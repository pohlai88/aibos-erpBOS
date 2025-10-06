# 🚀 M33: Sale-Leaseback - UI Implementation Runbook

**Module ID**: M33  
**Module Name**: Sale-Leaseback  
**Priority**: LOW  
**Phase**: 9 - Lease Accounting  
**Estimated Effort**: 1 day  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

M33 handles complex sale-leaseback transactions where a company sells an asset and immediately leases it back. This module manages gain/loss recognition, deferred gain amortization, lease classification, and ongoing sale-leaseback accounting per ASC 842/IFRS 16.

### Business Value

- **Transaction Support**: Proper accounting for complex sale-leaseback financing arrangements
- **Compliance**: ASC 842 / IFRS 16 compliant gain/loss recognition and deferral
- **Capital Optimization**: Track sale-leaseback as financing strategy to free up capital
- **Audit Ready**: Complete documentation and journal entries for auditors
- **Transparency**: Clear view of all sale-leaseback obligations and deferred gains

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 5 endpoints implemented       |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/slb/transactions` - Sale-leaseback transaction management
- ✅ `/api/slb/gain-loss` - Gain/loss recognition
- ✅ `/api/slb/amortization` - Deferred gain amortization

**Total Endpoints**: 5

---

## 🎯 3 Killer Features

### 1. **Sale-Leaseback Transaction Manager** 🚀

**Description**: Comprehensive transaction processor that handles sale-leaseback setup, calculates gain/loss recognition, determines deferral treatment, and sets up leaseback accounting. Features ASC 842 compliance rules and automated journal entry generation.

**Why It's Killer**:

- **Gain/Loss Logic**: Automated ASC 842 gain/loss recognition rules (eliminate manual calculations)
- **Transaction Setup**: One form captures entire sale-leaseback in minutes (vs. hours in spreadsheets)
- **Journal Entry Generation**: Auto-creates complex JE for sale, gain deferral, and leaseback
- **Measurable Impact**: Process sale-leaseback transactions 10x faster than manual methods

**Implementation**:

```typescript
import { Card, Form, Input, Select, Button, Badge, Alert } from "aibos-ui";
import {
  useSaleLeaseback,
  useProcessTransaction,
} from "@/hooks/useSaleLeaseback";

export default function SaleLeasebackTransactionManager() {
  const { process, preview } = useProcessTransaction();

  return (
    <div className="space-y-6">
      <Alert variant="info">
        <strong>ASC 842 Guidance:</strong> Sale-leaseback accounting depends on
        whether the transfer qualifies as a sale. If not a sale, treat as
        financing.
      </Alert>

      <Card title="Create Sale-Leaseback Transaction">
        <Form onSubmit={process}>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Sale Information</h3>
              <Input
                label="Asset Description"
                name="asset_description"
                required
              />
              <Input type="date" label="Sale Date" name="sale_date" required />
              <Input
                type="number"
                label="Sale Price"
                name="sale_price"
                required
                prefix="$"
              />
              <Input
                type="number"
                label="Asset Carrying Value"
                name="carrying_value"
                required
                prefix="$"
                helpText="Net book value before sale"
              />
              <Input
                type="number"
                label="Transaction Costs"
                name="transaction_costs"
                prefix="$"
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Leaseback Terms</h3>
              <Input
                type="date"
                label="Lease Commencement"
                name="commencement_date"
                required
              />
              <Input
                type="number"
                label="Lease Term (months)"
                name="lease_term"
                required
              />
              <Input
                type="number"
                label="Monthly Lease Payment"
                name="monthly_payment"
                required
                prefix="$"
              />
              <Input
                type="number"
                label="Discount Rate (%)"
                name="discount_rate"
                required
                suffix="%"
              />
              <Select
                label="Control Transfer?"
                name="control_transferred"
                options={[
                  { value: "yes", label: "Yes - Qualifies as Sale" },
                  { value: "no", label: "No - Failed Sale Test" },
                ]}
                required
                helpText="Per ASC 606 revenue recognition criteria"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button type="button" variant="outline" onClick={preview}>
              Preview Accounting
            </Button>
            <Button type="submit" variant="primary">
              Process Transaction
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
```

### 2. **Deferred Gain Amortization Schedule** ⚡

**Description**: Automated amortization of deferred gains from sale-leaseback transactions over the lease term. Features amortization schedule generation, automated monthly posting, and gain recognition tracking.

**Why It's Killer**:

- **Automated Amortization**: Monthly gain recognition without manual intervention
- **ASC 842 Compliant**: Proper amortization pattern based on lease classification
- **Schedule Generation**: Complete amortization table from day one
- **Measurable Impact**: Eliminate monthly manual journal entries for gain recognition

**Implementation**:

```typescript
import { Card, DataTable, Chart, Badge } from "aibos-ui";
import { useDeferredGainAmortization } from "@/hooks/useSaleLeaseback";

export default function DeferredGainAmortizationSchedule() {
  const { transactions, schedule } = useDeferredGainAmortization();

  return (
    <div className="space-y-6">
      <Card title="Active Sale-Leaseback Transactions">
        <DataTable
          data={transactions}
          columns={[
            { key: "transaction_id", label: "Transaction" },
            { key: "asset_description", label: "Asset" },
            { key: "sale_date", label: "Sale Date" },
            {
              key: "deferred_gain",
              label: "Deferred Gain",
              render: (_, row) => `$${row.deferred_gain.toLocaleString()}`,
            },
            {
              key: "amortized_to_date",
              label: "Recognized to Date",
              render: (_, row) => (
                <span className="text-green-600">
                  ${row.amortized_to_date.toLocaleString()}
                </span>
              ),
            },
            {
              key: "remaining_balance",
              label: "Remaining",
              render: (_, row) => `$${row.remaining_balance.toLocaleString()}`,
            },
            {
              key: "status",
              label: "Status",
              render: (_, row) => (
                <Badge
                  variant={
                    row.status === "Active"
                      ? "success"
                      : row.status === "Complete"
                      ? "info"
                      : "default"
                  }
                >
                  {row.status}
                </Badge>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Amortization Schedule">
        <DataTable
          data={schedule}
          columns={[
            { key: "period", label: "Period" },
            { key: "period_date", label: "Date" },
            {
              key: "amortization_amount",
              label: "Amortization",
              render: (_, row) =>
                `$${row.amortization_amount.toLocaleString()}`,
            },
            {
              key: "cumulative_amortization",
              label: "Cumulative",
              render: (_, row) =>
                `$${row.cumulative_amortization.toLocaleString()}`,
            },
            {
              key: "remaining_deferred_gain",
              label: "Remaining",
              render: (_, row) =>
                `$${row.remaining_deferred_gain.toLocaleString()}`,
            },
            {
              key: "posted",
              label: "Posted",
              render: (_, row) => (
                <Badge variant={row.posted ? "success" : "default"}>
                  {row.posted ? "Yes" : "Pending"}
                </Badge>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Gain Recognition Trend">
        <Chart
          type="area"
          data={{
            labels: schedule.map((s) => s.period_date),
            datasets: [
              {
                label: "Monthly Gain Recognition",
                data: schedule.map((s) => s.amortization_amount),
                backgroundColor: "rgba(34, 197, 94, 0.2)",
                borderColor: "rgb(34, 197, 94)",
              },
            ],
          }}
        />
      </Card>
    </div>
  );
}
```

### 3. **Sale-Leaseback Portfolio Dashboard** 💎

**Description**: Comprehensive view of all sale-leaseback transactions with financial impact analysis, gain/loss summary, and lease obligation tracking. Features comparison of sale-leaseback vs. traditional financing alternatives.

**Why It's Killer**:

- **Portfolio View**: See all sale-leasebacks and their financial impact at once
- **Financial Analysis**: Compare sale-leaseback economics vs. traditional loan
- **Obligation Tracking**: Monitor lease obligations from sale-leaseback
- **Measurable Impact**: CFOs can evaluate sale-leaseback as capital strategy

**Implementation**:

```typescript
import { Card, Chart, Badge, DataTable } from "aibos-ui";
import { useSaleLeasebackPortfolio } from "@/hooks/useSaleLeaseback";

export default function SaleLeasebackPortfolio() {
  const { portfolio, stats } = useSaleLeasebackPortfolio();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Total Transactions</h3>
          <div className="text-4xl font-bold">{stats.total_count}</div>
        </Card>
        <Card>
          <h3>Cash Proceeds</h3>
          <div className="text-3xl font-bold text-green-600">
            ${(stats.total_proceeds / 1_000_000).toFixed(1)}M
          </div>
          <Badge variant="success">Capital Raised</Badge>
        </Card>
        <Card>
          <h3>Deferred Gains</h3>
          <div className="text-3xl font-bold">
            ${(stats.total_deferred_gain / 1_000).toFixed(0)}K
          </div>
          <p className="text-sm text-gray-600">Not yet recognized</p>
        </Card>
        <Card>
          <h3>Lease Obligations</h3>
          <div className="text-3xl font-bold text-red-600">
            ${(stats.total_lease_liability / 1_000_000).toFixed(1)}M
          </div>
          <Badge variant="error">Balance Sheet</Badge>
        </Card>
      </div>

      <Card title="Sale-Leaseback Portfolio">
        <DataTable
          data={portfolio}
          columns={[
            { key: "transaction_id", label: "Transaction" },
            { key: "asset_description", label: "Asset" },
            { key: "sale_date", label: "Sale Date" },
            {
              key: "sale_price",
              label: "Sale Price",
              render: (_, row) => `$${row.sale_price.toLocaleString()}`,
            },
            {
              key: "gain_loss",
              label: "Gain/(Loss)",
              render: (_, row) => (
                <span
                  className={
                    row.gain_loss >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  ${Math.abs(row.gain_loss).toLocaleString()}
                </span>
              ),
            },
            {
              key: "lease_classification",
              label: "Lease Type",
              render: (_, row) => (
                <Badge
                  variant={
                    row.lease_classification === "Finance" ? "error" : "info"
                  }
                >
                  {row.lease_classification}
                </Badge>
              ),
            },
            { key: "lease_term", label: "Term" },
            {
              key: "monthly_payment",
              label: "Monthly Payment",
              render: (_, row) => `$${row.monthly_payment.toLocaleString()}`,
            },
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

#### 1. Main Page (`/sale-leaseback/dashboard`)

**Components**: Card, DataTable, Chart, Badge
**File**: `apps/web/app/(dashboard)/sale-leaseback/page.tsx`

#### 2. Transaction Manager (`/sale-leaseback/transactions`)

**Components**: Form, Input, Select, Alert, Button
**File**: `apps/web/app/(dashboard)/sale-leaseback/transactions/page.tsx`

---

## 🔌 API Integration

```typescript
// apps/web/hooks/useSaleLeaseback.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@aibos/api-client';

export function useProcessTransaction() {
  return useMutation({
    mutationFn: transactionData =>
      apiClient.POST('/api/slb/transactions', { body: transactionData }),
    onSuccess: () => queryClient.invalidateQueries(['sale-leaseback']),
  });
}

export function useDeferredGainAmortization() {
  return useQuery({
    queryKey: ['slb-amortization'],
    queryFn: () => apiClient.GET('/api/slb/amortization'),
  });
}

export function useSaleLeasebackPortfolio() {
  return useQuery({
    queryKey: ['slb-portfolio'],
    queryFn: () => apiClient.GET('/api/slb/transactions'),
  });
}
```

---

## 📝 Implementation Guide

### Day 1: Complete Implementation (8 hours)

1. Build sale-leaseback transaction form (3 hours)
2. Implement deferred gain amortization schedule (3 hours)
3. Create portfolio dashboard (2 hours)

**Total**: 1 day (8 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Gain/loss calculation
- [ ] Amortization schedule generation
- [ ] ASC 842 classification logic

### Integration Tests

- [ ] Complete sale-leaseback transaction flow
- [ ] Automated amortization posting
- [ ] Journal entry generation

### E2E Tests

- [ ] User can create sale-leaseback transaction
- [ ] System generates amortization schedule
- [ ] User can view portfolio dashboard

---

## 📅 Timeline

| Day | Deliverable                                        |
| --- | -------------------------------------------------- |
| 1   | Complete sale-leaseback management with automation |

**Total**: 1 day (8 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M31: Lease Accounting
- ✅ M8: Fixed Assets (for asset sale)

### Enables These Modules

- Enhanced financial reporting with sale-leaseback disclosures

---

## 🎯 Success Criteria

### Must Have

- [ ] Sale-leaseback transaction processor
- [ ] Deferred gain amortization automation
- [ ] Portfolio dashboard with obligations

### Should Have

- [ ] Gain/loss recognition journal entries
- [ ] ASC 842 compliance validation
- [ ] Amortization schedule reporting

### Nice to Have

- [ ] Sale-leaseback vs. financing comparison tool
- [ ] What-if scenario analysis
- [ ] Integration with asset management systems

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M32 - Sublease Management  
**Next**: M34 - Projects & Jobs
