# 🚀 M33: Sale-Leaseback - UI Implementation Runbook

**Module ID**: M33  
**Module Name**: Sale-Leaseback  
**Priority**: MEDIUM  
**Phase**: 9 - Lease Accounting  
**Estimated Effort**: 2 days  
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

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-sale-leaseback-accounting], [ADR-###-deferred-gain-amortization], [ADR-###-asc842-sale-test]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 14 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

**Transaction Management** (5 endpoints):

- ✅ `/api/slb/transactions` - List sale-leaseback transactions
- ✅ `/api/slb/transactions/[id]` - Transaction details
- ✅ `/api/slb/transactions/create` - Create transaction
- ✅ `/api/slb/transactions/validate` - Validate sale test (ASC 606)
- ✅ `/api/slb/transactions/preview` - Preview accounting impact

**Gain/Loss Recognition** (4 endpoints):

- ✅ `/api/slb/gain-loss` - Calculate gain/loss
- ✅ `/api/slb/gain-loss/recognition` - Immediate vs. deferred
- ✅ `/api/slb/gain-loss/journal-entries` - Generate JEs
- ✅ `/api/slb/gain-loss/summary` - Portfolio gain/loss summary

**Amortization & Tracking** (5 endpoints):

- ✅ `/api/slb/amortization` - Amortization schedules
- ✅ `/api/slb/amortization/[id]` - Schedule details
- ✅ `/api/slb/amortization/post` - Post monthly amortization
- ✅ `/api/slb/portfolio` - Portfolio dashboard data
- ✅ `/api/slb/analytics` - Sale-leaseback analytics

**Total Endpoints**: 14 (3 categories)

### Risks & Blockers

| Risk                                | Impact   | Mitigation                                                       | Owner       |
| ----------------------------------- | -------- | ---------------------------------------------------------------- | ----------- |
| ASC 606 sale test accuracy          | CRITICAL | Automated validation; external audit review; comprehensive tests | @accounting |
| Gain/loss recognition complexity    | HIGH     | ASC 842 compliant logic; external audit validation; test suite   | @accounting |
| Deferred gain amortization accuracy | HIGH     | Automated schedules; monthly validation; external audit          | @accounting |
| Control transfer determination      | HIGH     | ASC 606 checklist; legal review; manual override capability      | @accounting |

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

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                           | Target          | Measurement          |
| -------------------------------- | --------------- | -------------------- |
| TTFB (staging)                   | ≤ 70ms          | Server timing header |
| Client TTI for `/sale-leaseback` | ≤ 200ms         | Lighthouse CI        |
| Transaction validation           | < 2s            | Performance profiler |
| Gain/loss calculation            | < 1s            | API response time    |
| Amortization schedule generation | < 2s            | API response time    |
| UI bundle size                   | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to forms and tables
- **Focus Management**: Focus trap in modals; form field navigation
- **ARIA**: Sale test alerts announced; gain/loss updates communicated
- **Screen Reader**: All transaction data announced; financial metrics described
- **Axe Target**: 0 serious/critical violations

### Security

| Layer         | Requirement                                           |
| ------------- | ----------------------------------------------------- |
| RBAC Scopes   | `slb.read`, `slb.write`, `slb.approve`, `slb.admin`   |
| Enforcement   | Server-side on all endpoints                          |
| Data Exposure | Only show sale-leaseback data user has permission for |
| Audit Trail   | Immutable audit logs (7-year retention)               |
| Rate Limiting | Protect calculation endpoints; prevent abuse          |

#### UI Permissions Matrix

| Role        | View | Create | Validate | Approve | Admin |
| ----------- | ---- | ------ | -------- | ------- | ----- |
| slb.read    | ✅   | ❌     | ❌       | ❌      | ❌    |
| slb.write   | ✅   | ✅     | ✅       | ❌      | ❌    |
| slb.approve | ✅   | ✅     | ✅       | ✅      | ❌    |
| slb.admin   | ✅   | ✅     | ✅       | ✅      | ✅    |

### Reliability & Observability

- **SLO**: 99.9% sale test accuracy; 100% gain/loss calculation accuracy
- **SLA Dashboards**: Real-time metrics on transaction processing
- **Events Emitted**: `SaleLeaseback.TransactionCreated`, `SaleLeaseback.GainRecognized`
- **Logging**: Structured logs with transaction IDs for all operations
- **Tracing**: Distributed tracing for complex sale-leaseback workflows

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Sale-Leaseback Accounting Rules (ASC 842 / ASC 606)

| Rule                            | Enforcement                                                     |
| ------------------------------- | --------------------------------------------------------------- |
| **ASC 606 Sale Test**           | Transfer of control per ASC 606; if failed, treat as financing  |
| **Gain/Loss Recognition**       | Immediate if sale; defer if leaseback retains substantial right |
| **Deferred Gain Amortization**  | Amortize over lease term (straight-line or usage pattern)       |
| **Leaseback Classification**    | Apply ASC 842 5 tests to classify as finance or operating       |
| **Asset Derecognition**         | Remove asset from books if sale test passed                     |
| **Lease Liability Recognition** | Record lease liability at PV of lease payments                  |
| **Journal Entry Generation**    | Auto-generate complex multi-entry JE for entire transaction     |

### Sale-Leaseback States

- **Transaction**: Draft → Validated → Approved → Active → Amortizing → Complete
- **Sale Test**: Pending → In Review → Passed / Failed
- **Gain Recognition**: Immediate / Deferred → Amortizing → Fully Recognized

### Archive Semantics

- **Transaction History**: Retain all sale-leaseback data (7-year minimum)
- **Amortization History**: Maintain complete amortization audit trail
- **Guard Rails**:
  - ❌ Deny deletion of active transactions
  - ❌ Deny changes to historical gain recognition
  - ✅ Allow reversal with proper accounting treatment

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                               | User Action      |
| --------------------- | ---------------------------------------- | ---------------- |
| **Empty**             | "No sale-leaseback transactions yet"     | "Create"         |
| **Loading**           | Skeleton forms/tables                    | N/A              |
| **Error**             | Error message + retry                    | Retry / Support  |
| **Draft**             | Gray badge "Draft"                       | Complete / Save  |
| **Sale Test Pending** | Orange badge "Validation Pending"        | Run Test         |
| **Sale Test Passed**  | Green badge "Sale Qualified"             | Process          |
| **Sale Test Failed**  | Red badge "Failed Sale Test - Financing" | Review / Reclass |
| **Active**            | Green badge "Active"                     | View / Modify    |
| **Amortizing**        | Blue badge "Amortizing"                  | View Schedule    |
| **Complete**          | Gray badge "Complete"                    | View history     |
| **Permission Denied** | "Access restricted"                      | Back             |

### Form Validation

- **Sale Information**: Validate sale price, carrying value, transaction costs
- **Leaseback Terms**: Validate lease term, payments, discount rate
- **Control Transfer**: ASC 606 checklist (5 criteria)

### Network Errors

| HTTP Status | UI Message                                             | Action              |
| ----------- | ------------------------------------------------------ | ------------------- |
| 400         | "Invalid transaction data. Check your inputs."         | Inline field errors |
| 401         | "Session expired. Please log in again."                | Redirect to login   |
| 403         | "You don't have permission for sale-leaseback ops."    | Hide action         |
| 404         | "Transaction not found."                               | Return to list      |
| 409         | "Transaction was modified. Review changes."            | Show diff modal     |
| 422         | "Validation failed. Check ASC 606 sale test criteria." | Inline errors       |
| 500         | "Calculation failed. Our team has been notified."      | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/sale-leaseback.json`.

### Page Titles & Headers

| Context      | Copy                         | i18n Key                 |
| ------------ | ---------------------------- | ------------------------ |
| Dashboard    | "Sale-Leaseback Management"  | `slb.dashboard.title`    |
| Transactions | "Create Transaction"         | `slb.transactions.title` |
| Amortization | "Gain Amortization Schedule" | `slb.amortization.title` |
| Portfolio    | "Portfolio Dashboard"        | `slb.portfolio.title`    |

### State Messages

| State            | Title                 | Message                                        | Action Button | i18n Key           |
| ---------------- | --------------------- | ---------------------------------------------- | ------------- | ------------------ |
| Empty            | "No transactions yet" | "Create your first sale-leaseback transaction" | "Create"      | `slb.empty.*`      |
| Sale Test Passed | "Sale test passed"    | "Transaction qualifies as a sale"              | "Process"     | `slb.saleTest.*`   |
| Sale Test Failed | "Failed sale test"    | "Treat as financing arrangement"               | "Review"      | `slb.failedTest.*` |

### Success Messages (Toast)

| Action              | Message                                    | i18n Key             | Shortcut |
| ------------------- | ------------------------------------------ | -------------------- | -------- |
| Transaction Created | "Sale-leaseback transaction created"       | `slb.create.success` | `n`      |
| Sale Test Passed    | "Sale test passed - transaction qualified" | `slb.test.success`   | `v`      |
| Gain Recognized     | "Gain of ${amount} recognized"             | `slb.gain.success`   | `g`      |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useSaleLeaseback.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useSaleLeasebackTransactions(filters = {}) {
  return useQuery({
    queryKey: ["slb", "transactions", filters],
    queryFn: () => apiClient.GET("/api/slb/transactions", { query: filters }),
    staleTime: 5 * 60_000, // 5min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useSaleLeasebackTransaction(id: string) {
  return useQuery({
    queryKey: ["slb", "transaction", id],
    queryFn: () =>
      apiClient.GET("/api/slb/transactions/[id]", { params: { id } }),
    staleTime: 10 * 60_000, // 10min
    retry: 2,
    enabled: !!id,
    select: (response) => response.data,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactionData: any) =>
      apiClient.POST("/api/slb/transactions/create", { body: transactionData }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["slb"] });
      toast.success("Sale-leaseback transaction created");
    },
    onError: () => {
      toast.error("Failed to create transaction.");
    },
  });
}

export function useValidateSaleTest() {
  return useMutation({
    mutationFn: (transactionId: string) =>
      apiClient.POST("/api/slb/transactions/validate", {
        body: { transactionId },
      }),
    onSuccess: (data) => {
      if (data.passed) {
        toast.success("Sale test passed - transaction qualified");
      } else {
        toast.warning("Sale test failed - treat as financing");
      }
    },
    onError: () => {
      toast.error("Sale test validation failed.");
    },
  });
}

export function usePreviewAccounting() {
  return useMutation({
    mutationFn: (transactionData: any) =>
      apiClient.POST("/api/slb/transactions/preview", {
        body: transactionData,
      }),
    onSuccess: () => {
      // Preview modal will show results
    },
  });
}

export function useGainLoss(transactionId: string) {
  return useQuery({
    queryKey: ["slb", "gain-loss", transactionId],
    queryFn: () =>
      apiClient.GET("/api/slb/gain-loss", { query: { transactionId } }),
    staleTime: Never, // Always fresh for accuracy
    retry: 2,
    enabled: !!transactionId,
    select: (response) => response.data,
  });
}

export function useAmortizationSchedule(transactionId: string) {
  return useQuery({
    queryKey: ["slb", "amortization", transactionId],
    queryFn: () =>
      apiClient.GET("/api/slb/amortization", { query: { transactionId } }),
    staleTime: 5 * 60_000, // 5min
    retry: 2,
    enabled: !!transactionId,
    select: (response) => response.data,
  });
}

export function usePostAmortization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      apiClient.POST("/api/slb/amortization/post", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["slb", "amortization"] });
      toast.success(`Gain of $${data.amount} recognized`);
    },
    onError: () => {
      toast.error("Failed to post amortization.");
    },
  });
}

export function useSaleLeasebackPortfolio() {
  return useQuery({
    queryKey: ["slb", "portfolio"],
    queryFn: () => apiClient.GET("/api/slb/portfolio"),
    staleTime: 5 * 60_000, // 5min
    retry: 2,
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error         | User Message                                           | UI Action            |
| ----------------- | ------------------------------------------------------ | -------------------- |
| 400 (Bad Request) | "Invalid transaction data. Check your inputs."         | Inline field errors  |
| 409 (Conflict)    | "Transaction was modified. Review changes."            | Show diff modal      |
| 422 (Validation)  | "Validation failed. Check ASC 606 sale test criteria." | Inline errors        |
| 403 (Forbidden)   | "You don't have permission for sale-leaseback ops."    | Hide action          |
| 500 (Server)      | "Calculation failed. Our team has been notified."      | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for calculations

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["slb", "transactions", { filters }][("slb", "transaction", transactionId)][
  ("slb", "gain-loss", transactionId)
][("slb", "amortization", transactionId)][("slb", "portfolio")];
```

### Invalidation Rules

| Action              | Invalidates                                       |
| ------------------- | ------------------------------------------------- |
| Create Transaction  | `["slb"]` (all)                                   |
| Validate Sale Test  | `["slb", "transaction", id]`                      |
| Post Amortization   | `["slb", "amortization"]`, `["slb", "portfolio"]` |
| Process Transaction | `["slb"]`                                         |

### Stale Time

| Query Type       | Stale Time | Reasoning                      |
| ---------------- | ---------- | ------------------------------ |
| Transaction List | 5min       | Moderate update frequency      |
| Transaction Det. | 10min      | Less frequently changed        |
| Gain/Loss        | Never      | Always fresh for accuracy      |
| Amortization     | 5min       | Active amortization monitoring |
| Portfolio        | 5min       | Dashboard refresh              |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("slb");
revalidateTag("slb-amortization");
revalidateTag("slb-portfolio");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/sale-leaseback.fixtures.ts`

**Datasets**:

- `minimalTransactions`: 3 transactions (sale passed, sale failed, active)
- `standardTransactions`: 15 transactions across all states
- `complexTransactions`: 30+ transactions with varied scenarios
- `edgeCases`: Edge cases (near-market sale, bargain leaseback, financing)

**Edge Cases Covered**:

- Sale test passed (control transferred)
- Sale test failed (treated as financing)
- Gain recognition immediate
- Gain recognition deferred (amortizing)
- Finance leaseback
- Operating leaseback

---

## 🔗 API Contract Sync (CI Enforcement)

### Prevent Drift

**CI Step**: Fail build if `packages/contracts/openapi/openapi.json` changes without regenerating `types.gen.ts`.

```yaml
# .github/workflows/ci.yml
- name: Check API types sync
  run: |
    pnpm run generate:api-types
    git diff --exit-code packages/api-client/src/types.gen.ts
```

### Hook Layer Contract

- **Rule**: Hooks **only** use generated types from `@aibos/api-client`
- **No ad-hoc shapes**: All API calls must match OpenAPI spec
- **Validation**: TypeScript enforces at compile time

---

## 🖥️ RSC/SSR & App Router Compatibility

### Server/Client Boundaries

- **Pages**: Server components by default
- **Interactive Parts**: Mark with `"use client"` (forms, sale test validation)

### Data Fetching Strategy

| Scenario            | Strategy                          | Benefit           |
| ------------------- | --------------------------------- | ----------------- |
| Transaction List    | Server-side fetch + stream        | Faster TTFB       |
| Transaction Form    | Client-side with optimistic UI    | Instant feedback  |
| Amortization Sched. | Server component with static data | SEO + performance |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function createSaleLeasebackTransaction(data: any) {
  // ... mutation logic
  revalidateTag("slb");
  revalidateTag("slb-portfolio");
}
```

---

## 📊 Analytics & Audit Events

| Event                             | When                        | Properties                                             |
| --------------------------------- | --------------------------- | ------------------------------------------------------ |
| SaleLeaseback.TransactionCreated  | Transaction created         | `transaction_id`, `sale_price`, `asset_description`    |
| SaleLeaseback.SaleTestRun         | Sale test validation        | `transaction_id`, `test_result`, `control_transferred` |
| SaleLeaseback.GainRecognized      | Gain/loss recognized        | `transaction_id`, `gain_amount`, `recognition_type`    |
| SaleLeaseback.AmortizationPosted  | Amortization posted         | `transaction_id`, `period`, `amortization_amount`      |
| SaleLeaseback.TransactionComplete | Transaction fully amortized | `transaction_id`, `total_gain_recognized`              |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("SaleLeaseback.TransactionCreated", {
  transaction_id: "slb_123",
  sale_price: 1000000,
  asset_description: "Building A",
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/sale-leaseback.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Currency**: Support multiple currencies for international transactions

### Keyboard Shortcuts

| Key      | Action             | Scope              |
| -------- | ------------------ | ------------------ |
| `/`      | Focus search       | Any page           |
| `n`      | New transaction    | Transaction list   |
| `v`      | Validate sale test | Transaction detail |
| `g`      | View gain schedule | Transaction detail |
| `↑ / ↓`  | Navigate list      | Any list           |
| `Enter`  | Open item          | Any list           |
| `Escape` | Close modal/cancel | Modal/Form         |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateTransactionModal()],
  ["v", () => validateSaleTest()],
  ["g", () => viewGainSchedule()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                   | Duration | Rollback Trigger |
| ----------- | ---------------- | -------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                   | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, sale test accuracy 100%        | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, gain/loss calc correct          | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 1 week, accounting validation complete | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m33_sale_leaseback: false,              // Master toggle
  m33_sale_leaseback_validation: false,   // ASC 606 sale test
  m33_sale_leaseback_amortization: false, // Auto amortization
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Sale test accuracy (100% required)
- Gain/loss calculation accuracy (100% required)
- Amortization posting reliability
- Transaction processing time

**Alert Thresholds**:

- Sale test error → immediate investigation
- Gain/loss calculation error → escalate
- Dashboard load > 5s → performance issue

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m33_sale_leaseback = false`

   ```powershell
   pnpm run flags:set m33_sale_leaseback=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("slb");
   revalidateTag("slb-amortization");
   revalidateTag("slb-portfolio");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/sale-leaseback/*"
   ```

4. **Monitor for 15 minutes**:

   - Error rate drops below 0.1%
   - No new Sentry issues
   - Users see fallback message

5. **Post-mortem**:
   - Create incident report
   - Identify root cause
   - Add regression test

**Rollback Decision Matrix**:

| Scenario                    | Action             | Approval Required |
| --------------------------- | ------------------ | ----------------- |
| Sale test error             | Immediate rollback | No (auto-trigger) |
| Gain/loss calculation error | Immediate rollback | No (auto-trigger) |
| Amortization posting error  | Immediate rollback | No (auto-trigger) |
| Dashboard performance > 10s | Immediate rollback | No (auto-trigger) |
| User complaints > 3         | Investigate first  | SLB ops lead      |

---

## 📚 References

### API Documentation

- OpenAPI spec: `packages/contracts/openapi/openapi.json`
- Type definitions: `packages/api-client/src/types.gen.ts`

### Design System

- Component library: `aibos-ui` package
- Design tokens: Import from `aibos-ui/tokens`
- Style guide: Follow dark-first theme

### Best Practices

- ASC 842 sale-leaseback guidance (FASB)
- ASC 606 control transfer criteria
- Deloitte sale-leaseback implementation guide
- PwC ASC 842 technical library
- LeaseQuery: Sale-leaseback accounting

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: ASC 606 Sale Test Accuracy

**Mitigation**: Automated validation checklist (5 control transfer criteria); external audit review; comprehensive test suite; legal review for complex scenarios; manual override with justification required

### Risk #2: Gain/Loss Recognition Complexity

**Mitigation**: ASC 842 compliant logic engine; external audit validation of methodology; comprehensive test scenarios; parallel manual validation during pilot

### Risk #3: Deferred Gain Amortization Accuracy

**Mitigation**: Automated amortization schedules; monthly validation reconciliation; external audit review; comprehensive edge case testing

### Risk #4: Control Transfer Determination

**Mitigation**: ASC 606 checklist integrated in UI; legal review workflow for complex cases; manual override capability with audit trail; training for finance team

---

## 📝 Implementation Guide

### Day 1: Transaction Manager & Validation (8 hours)

1. Build sale-leaseback transaction form with ASC 606 checklist (3 hours)
2. Implement sale test validation workflow (2 hours)
3. Create gain/loss calculation preview (2 hours)
4. Add journal entry generation (1 hour)

### Day 2: Amortization & Portfolio (8 hours)

1. Build deferred gain amortization schedule (3 hours)
2. Implement automated monthly amortization posting (2 hours)
3. Create portfolio dashboard with analytics (2 hours)
4. Add comprehensive testing (1 hour)

**Total**: 2 days (16 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] ASC 606 sale test logic (5 control transfer criteria)
- [ ] Gain/loss calculation (all scenarios)
- [ ] Deferred gain amortization schedule generation
- [ ] ASC 842 leaseback classification logic
- [ ] Journal entry generation (complex multi-entry)
- [ ] Transaction validation rules

### Integration Tests

- [ ] Complete sale-leaseback transaction flow (draft → processed)
- [ ] Sale test validation workflow (passed & failed scenarios)
- [ ] Automated amortization posting (monthly)
- [ ] Journal entry generation and posting
- [ ] Portfolio aggregations and analytics

### E2E Tests

- [ ] User can create sale-leaseback transaction
- [ ] User can run ASC 606 sale test validation
- [ ] User can preview accounting impact
- [ ] System generates amortization schedule
- [ ] User can post monthly amortization
- [ ] User can view portfolio dashboard

### Accessibility Tests

- [ ] Keyboard navigation works (forms, tables, validation)
- [ ] Screen reader announces sale test results
- [ ] Focus management correct (modals, forms)
- [ ] Color contrast meets WCAG 2.2 AAA
- [ ] Axe: 0 serious/critical violations

### Contract Tests

- [ ] API calls match OpenAPI spec
- [ ] Gain/loss calculations match accounting standards

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for all components

### Performance Tests

- [ ] Bundle size < 250KB gzipped
- [ ] TTFB ≤ 70ms on staging
- [ ] Transaction validation < 2s
- [ ] Gain/loss calculation < 1s
- [ ] Amortization schedule generation < 2s

---

## 📅 Timeline & Milestones

| Day | Tasks                                                   | Deliverable                       | Flag Status |
| --- | ------------------------------------------------------- | --------------------------------- | ----------- |
| 1   | Setup + Transaction Form + ASC 606 Validation + Preview | Transaction processing functional | WIP         |
| 2   | Amortization + Portfolio + Tests + Polish               | Production-ready module           | GA          |

**Total Effort**: 2 days (16 hours)

---

## 🔗 Dependencies

### Must Complete Before Starting

- ✅ M31: Lease Accounting (for leaseback classification)
- ✅ M8: Fixed Assets (for asset derecognition)
- 🆕 ASC 606 sale test validation engine
- 🆕 ASC 842 gain/loss recognition engine
- 🆕 Deferred gain amortization scheduler

### Blocks These Modules

- Enhanced M8: Fixed Assets with sale-leaseback tracking
- Enhanced financial reporting with sale-leaseback disclosures

---

## 🎯 Success Criteria

### Must Have (Measurable)

- [ ] Sale-leaseback transaction processor (ASC 842 / ASC 606 compliant)
- [ ] ASC 606 sale test validation (100% accuracy)
- [ ] Gain/loss recognition (100% calculation accuracy)
- [ ] Deferred gain amortization automation (straight-line over lease term)
- [ ] Portfolio dashboard with obligations tracking
- [ ] Sale test accuracy: 100%
- [ ] Gain/loss calc accuracy: 100%
- [ ] Amortization posting reliability: 99.9%
- [ ] Axe: 0 serious/critical violations

### Should Have

- [ ] Gain/loss recognition journal entries (auto-generated)
- [ ] ASC 606 compliance checklist (5 criteria in UI)
- [ ] Amortization schedule reporting with exports
- [ ] Transaction approval workflow
- [ ] Sale vs. financing comparison analysis

### Nice to Have

- [ ] Sale-leaseback vs. traditional financing comparison tool
- [ ] What-if scenario analysis (different lease terms)
- [ ] Integration with asset management systems
- [ ] AI-powered sale test recommendations

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/sale-leaseback/*`)
- [ ] All CRUD operations working (Create, Validate, Process, Track)
- [ ] Sale-leaseback transaction manager with ASC 606 checklist
- [ ] ASC 606 sale test validation workflow
- [ ] Gain/loss calculation preview
- [ ] Deferred gain amortization schedule
- [ ] Automated monthly amortization posting
- [ ] Portfolio dashboard with analytics
- [ ] Journal entry generation
- [ ] All error states handled
- [ ] Copy deck implemented

### Quality Gates 🎯

**Enforced in CI** - Build fails if any gate not met

#### Code Quality

- [ ] TypeScript: 0 errors, 0 warnings
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Prettier: All files formatted
- [ ] No console.log or debugger statements

#### Test Coverage

- [ ] Unit tests: ≥90% line coverage, ≥95% for sale test & gain/loss logic
- [ ] Integration tests: All sale-leaseback lifecycle events covered
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- [ ] Sale test validation flow (ASC 606)
- [ ] Gain/loss recognition flow
- [ ] Deferred gain amortization flow
- [ ] Transaction processing flow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/sale-leaseback/*` routes
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/sale-leaseback`
- [ ] Transaction validation: < 2s
- [ ] Gain/loss calculation: < 1s
- [ ] Amortization schedule generation: < 2s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly
- [ ] Focus management: Logical order, visible indicators
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Accounting Accuracy ✅

**CRITICAL - External Audit Validation**

- [ ] ASC 606 sale test validation: 100% accuracy
- [ ] Gain/loss recognition: 100% calculation accuracy
- [ ] Deferred gain amortization: 100% accuracy (straight-line over lease term)
- [ ] Leaseback classification: 100% accurate per ASC 842
- [ ] Journal entries: 100% correct per GAAP

**Validation**: External auditor review of sale-leaseback accounting methodology

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `SaleLeaseback.TransactionCreated`
  - `SaleLeaseback.SaleTestRun`
  - `SaleLeaseback.GainRecognized`
  - `SaleLeaseback.AmortizationPosted`
  - `SaleLeaseback.TransactionComplete`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (sale test errors, gain/loss calc errors)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented (4 roles)
- [ ] RBAC enforced (server + client)
- [ ] Audit trail immutable (7-year retention)
- [ ] Rate limiting tested (calculation endpoints)
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] ASC 842 / ASC 606 compliance verified

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized
- [ ] i18n keys documented
- [ ] External auditor documentation package (sale-leaseback methodology)
- [ ] UAT passed (PM/QA sign-off)

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m33_sale_leaseback = false` (ready to enable)
  - `flags.m33_sale_leaseback_validation = false`
  - `flags.m33_sale_leaseback_amortization = false`
- [ ] Smoke tests passed on staging
- [ ] Load tests passed (≥1000 concurrent users, 50+ transactions)
- [ ] Deployed to production (flags off)
- [ ] Rollback procedure tested
- [ ] Gradual rollout plan ready (5% → 100%)

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All test plans executed and passed
- [ ] **Design**: UI matches specs, brand compliance
- [ ] **PM**: Feature complete, acceptance criteria met
- [ ] **Security**: Security review passed
- [ ] **Accessibility**: A11y audit passed
- [ ] **Finance/Accounting**: Sale test & gain/loss methodology verified

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M32 - Sublease Management  
**Next**: M34 - Projects & Jobs
