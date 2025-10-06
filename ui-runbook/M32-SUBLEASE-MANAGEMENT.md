# 🚀 M32: Sublease Management - UI Implementation Runbook

**Module ID**: M32  
**Module Name**: Sublease Management  
**Priority**: LOW  
**Phase**: 9 - Lease Accounting  
**Estimated Effort**: 1 day  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

M32 enables companies to manage sublease arrangements where they act as both lessee (master lease) and lessor (sublease). This module handles complex accounting for sublease income, ROU asset impairment testing, and dual reporting requirements under ASC 842.

### Business Value

- **Revenue Optimization**: Track sublease income opportunities across underutilized space
- **Accounting Compliance**: Automated sublease accounting per ASC 842/IFRS 16
- **Impairment Testing**: Continuous ROU asset monitoring for sublease-related impairment
- **Portfolio Visibility**: See master lease vs. sublease economics in one view
- **Cost Recovery**: Identify opportunities to recover 30-70% of lease costs through subleasing

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

- ✅ `/api/subleases` - Sublease management
- ✅ `/api/subleases/income` - Sublease income tracking
- ✅ `/api/subleases/impairment` - ROU asset impairment testing

**Total Endpoints**: 3

---

## 🎯 3 Killer Features

### 1. **Sublease Income Tracker** 🚀

**Description**: Comprehensive dashboard showing all sublease arrangements with income recognition, master lease comparison, and profitability analysis. Features automated lease vs. sublease matching and variance reporting.

**Why It's Killer**:

- **Master/Sub Matching**: Automatically links subleases to master leases (competitors require manual tracking)
- **Income Recognition**: Proper ASC 842 straight-line sublease income calculation
- **Profitability View**: Instantly see net cost after sublease income
- **Measurable Impact**: Companies recover $50K-$500K annually through better sublease management

**Implementation**:

```typescript
import { Card, Badge, DataTable, Chart } from "aibos-ui";
import { useSubleases } from "@/hooks/useSubleases";

export default function SubleaseIncomeTracker() {
  const { subleases, stats } = useSubleases();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Active Subleases</h3>
          <div className="text-4xl font-bold">{stats.active_count}</div>
        </Card>
        <Card>
          <h3>Annual Sublease Income</h3>
          <div className="text-3xl font-bold text-green-600">
            ${(stats.annual_income / 1000).toFixed(0)}K
          </div>
        </Card>
        <Card>
          <h3>Master Lease Cost</h3>
          <div className="text-3xl font-bold text-red-600">
            ${(stats.master_lease_cost / 1000).toFixed(0)}K
          </div>
        </Card>
        <Card>
          <h3>Net Cost Savings</h3>
          <div className="text-3xl font-bold text-green-600">
            ${(stats.net_savings / 1000).toFixed(0)}K
          </div>
          <Badge variant="success">{stats.recovery_pct}% recovered</Badge>
        </Card>
      </div>

      <Card title="Sublease Portfolio">
        <DataTable
          data={subleases}
          columns={[
            { key: "sublease_id", label: "Sublease ID" },
            { key: "master_lease_id", label: "Master Lease" },
            { key: "subtenant_name", label: "Subtenant" },
            { key: "commencement_date", label: "Start Date" },
            { key: "expiration_date", label: "End Date" },
            {
              key: "monthly_income",
              label: "Monthly Income",
              render: (_, row) => (
                <span className="text-green-600">
                  ${row.monthly_income.toLocaleString()}
                </span>
              ),
            },
            {
              key: "master_payment",
              label: "Master Payment",
              render: (_, row) => (
                <span className="text-red-600">
                  ${row.master_payment.toLocaleString()}
                </span>
              ),
            },
            {
              key: "net_monthly",
              label: "Net Monthly",
              render: (_, row) => (
                <Badge variant={row.net_monthly >= 0 ? "success" : "error"}>
                  ${Math.abs(row.net_monthly).toLocaleString()}
                </Badge>
              ),
            },
          ]}
        />
      </Card>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Sublease Income Recognition">
          <Chart
            type="line"
            data={{
              labels: stats.months,
              datasets: [
                {
                  label: "Sublease Income",
                  data: stats.monthly_income,
                  borderColor: "rgb(34, 197, 94)",
                  fill: false,
                },
                {
                  label: "Master Lease Expense",
                  data: stats.monthly_expense,
                  borderColor: "rgb(239, 68, 68)",
                  fill: false,
                },
              ],
            }}
          />
        </Card>

        <Card title="Space Utilization">
          <Chart
            type="pie"
            data={{
              labels: ["Subleased", "Self-Occupied", "Vacant"],
              datasets: [
                {
                  data: [
                    stats.subleased_sqft,
                    stats.occupied_sqft,
                    stats.vacant_sqft,
                  ],
                  backgroundColor: [
                    "rgb(34, 197, 94)",
                    "rgb(59, 130, 246)",
                    "rgb(156, 163, 175)",
                  ],
                },
              ],
            }}
          />
        </Card>
      </div>
    </div>
  );
}
```

### 2. **ROU Asset Impairment Testing** ⚡

**Description**: Automated impairment testing for ROU assets when sublease income is less than master lease payments. Features quarterly testing, impairment calculations, and journal entry generation per ASC 842.

**Why It's Killer**:

- **Automated Testing**: Runs impairment tests quarterly vs. annual manual process
- **ASC 842 Compliant**: Proper sublease impairment accounting (unique feature)
- **Early Warning**: Identifies impairment risk before quarter-end close
- **Measurable Impact**: Prevents surprise impairment charges during audits

**Implementation**:

```typescript
import { Card, Badge, DataTable, Alert, Button } from "aibos-ui";
import { useImpairmentTesting } from "@/hooks/useSubleases";

export default function ROUAssetImpairmentTesting() {
  const { tests, indicators } = useImpairmentTesting();

  return (
    <div className="space-y-6">
      {indicators.at_risk > 0 && (
        <Alert variant="warning">
          <strong>{indicators.at_risk} Leases At Risk of Impairment</strong>
          <p>
            Review subleases with sublease income below master lease payments.
          </p>
        </Alert>
      )}

      <Card title="Impairment Testing Results">
        <DataTable
          data={tests}
          columns={[
            { key: "master_lease_id", label: "Master Lease" },
            { key: "rou_asset_balance", label: "ROU Asset" },
            {
              key: "estimated_recoverable",
              label: "Est. Recoverable",
              render: (_, row) =>
                `$${row.estimated_recoverable.toLocaleString()}`,
            },
            {
              key: "impairment_indicator",
              label: "Impairment Indicator",
              render: (_, row) => (
                <Badge
                  variant={row.impairment_indicator ? "warning" : "success"}
                >
                  {row.impairment_indicator ? "Yes" : "No"}
                </Badge>
              ),
            },
            {
              key: "impairment_loss",
              label: "Impairment Loss",
              render: (_, row) =>
                row.impairment_loss > 0 ? (
                  <span className="text-red-600">
                    ${row.impairment_loss.toLocaleString()}
                  </span>
                ) : (
                  "-"
                ),
            },
            {
              key: "status",
              label: "Status",
              render: (_, row) => (
                <Badge
                  variant={
                    row.status === "Passed"
                      ? "success"
                      : row.status === "Failed"
                      ? "error"
                      : "warning"
                  }
                >
                  {row.status}
                </Badge>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) =>
                row.impairment_loss > 0 && (
                  <Button size="sm" variant="error">
                    Record Impairment
                  </Button>
                ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
```

### 3. **Sublease Opportunity Identifier** 💎

**Description**: AI-powered analysis that identifies underutilized space suitable for subleasing, estimates potential sublease income, and provides market rate comparisons. Features sublease listing generation and tenant matching.

**Why It's Killer**:

- **Opportunity Detection**: AI identifies space that could be subleased (unique to aibos)
- **Market Intelligence**: Suggests sublease rates based on local market data
- **ROI Calculator**: Shows potential cost savings from subleasing
- **Measurable Impact**: Companies identify $100K+ in annual sublease opportunities

**Implementation**:

```typescript
import { Card, Badge, DataTable, Button } from "aibos-ui";
import { useSubleaseOpportunities } from "@/hooks/useSubleases";

export default function SubleaseOpportunityIdentifier() {
  const { opportunities, market_data } = useSubleaseOpportunities();

  return (
    <div className="space-y-6">
      <Card title="Sublease Opportunities">
        <p className="mb-4 text-gray-600">
          AI-identified spaces with sublease potential:
        </p>
        <DataTable
          data={opportunities}
          columns={[
            { key: "lease_id", label: "Lease" },
            { key: "location", label: "Location" },
            { key: "available_sqft", label: "Available Sq Ft" },
            {
              key: "current_cost",
              label: "Current Monthly Cost",
              render: (_, row) => `$${row.current_cost.toLocaleString()}`,
            },
            {
              key: "estimated_sublease_income",
              label: "Est. Sublease Income",
              render: (_, row) => (
                <span className="text-green-600">
                  ${row.estimated_sublease_income.toLocaleString()}/mo
                </span>
              ),
            },
            {
              key: "potential_savings",
              label: "Annual Savings",
              render: (_, row) => (
                <Badge variant="success">
                  ${row.potential_savings.toLocaleString()}
                </Badge>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <Button size="sm" variant="primary">
                  Create Listing
                </Button>
              ),
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

#### 1. Main Page (`/subleases/dashboard`)

**Components**: Card, DataTable, Chart, Badge
**File**: `apps/web/app/(dashboard)/subleases/page.tsx`

#### 2. Impairment Testing (`/subleases/impairment`)

**Components**: DataTable, Alert, Badge, Button
**File**: `apps/web/app/(dashboard)/subleases/impairment/page.tsx`

---

## 🔌 API Integration

```typescript
// apps/web/hooks/useSubleases.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@aibos/api-client';

export function useSubleases() {
  return useQuery({
    queryKey: ['subleases'],
    queryFn: () => apiClient.GET('/api/subleases'),
  });
}

export function useImpairmentTesting() {
  return useQuery({
    queryKey: ['sublease-impairment'],
    queryFn: () => apiClient.GET('/api/subleases/impairment'),
  });
}
```

---

## 📝 Implementation Guide

### Day 1: Complete Implementation (8 hours)

1. Build sublease income tracker (3 hours)
2. Implement ROU impairment testing (3 hours)
3. Create opportunity identifier (2 hours)

**Total**: 1 day (8 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Sublease income recognition calculation
- [ ] Impairment test logic
- [ ] Opportunity scoring algorithm

### Integration Tests

- [ ] Sublease creation and tracking
- [ ] Impairment testing workflow
- [ ] Income vs. expense reconciliation

### E2E Tests

- [ ] User can create and track subleases
- [ ] System runs impairment tests
- [ ] User can identify sublease opportunities

---

## 📅 Timeline

| Day | Deliverable                                  |
| --- | -------------------------------------------- |
| 1   | Complete sublease management with impairment |

**Total**: 1 day (8 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M31: Lease Accounting

### Enables These Modules

- M33: Sale-Leaseback (related lease transactions)

---

## 🎯 Success Criteria

### Must Have

- [ ] Sublease income tracking with master lease matching
- [ ] Automated ROU asset impairment testing
- [ ] Sublease portfolio dashboard

### Should Have

- [ ] Opportunity identification
- [ ] Market rate comparison
- [ ] Impairment journal entry generation

### Nice to Have

- [ ] Tenant matching AI
- [ ] Sublease listing generation
- [ ] Integration with property listing platforms

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M31 - Lease Accounting  
**Next**: M33 - Sale-Leaseback
