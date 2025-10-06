# 🚀 M3: Trial Balance - UI Implementation Runbook

**Module ID**: M3  
**Module Name**: Trial Balance  
**Priority**: HIGH  
**Phase**: 1 - Foundation  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

The Trial Balance module provides **real-time financial reporting** showing all account balances for a specific period. It's essential for month-end close, financial analysis, and ensuring the general ledger is balanced.

### Business Value

- Instant financial position visibility
- Foundation for financial statements
- Month-end close verification
- Drill-down to transaction details
- Multi-period comparison capabilities

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-005-trial-balance-realtime], [ADR-006-drill-down-performance]

---

## 📊 Current Status

| Layer         | Status  | Details                              |
| ------------- | ------- | ------------------------------------ |
| **Database**  | ✅ 100% | Views and aggregation queries ready  |
| **Services**  | ✅ 100% | Report generation service complete   |
| **API**       | ✅ 100% | Trial balance endpoints implemented  |
| **Contracts** | ✅ 100% | Type-safe schemas defined            |
| **UI**        | ⚠️ 10%  | Basic page exists, needs enhancement |

### API Coverage

- ✅ `/api/reports/trial-balance` - Generate trial balance
- ✅ `/api/reports/trial-balance/export` - Export to Excel/CSV
- ✅ `/api/reports/trial-balance/drill-down` - Transaction details

**Total Endpoints**: 3+
**Existing UI**: `apps/web/app/reports/trial-balance/page.tsx` (needs enhancement)

### Risks & Blockers

| Risk                         | Impact | Mitigation                                       | Owner    |
| ---------------------------- | ------ | ------------------------------------------------ | -------- |
| Large dataset performance    | HIGH   | Server-side aggregation + pagination + caching   | @backend |
| Real-time update latency     | MED    | WebSocket optimization + differential updates    | @backend |
| Drill-down query performance | HIGH   | Indexed queries + query result caching           | @backend |
| Export file size limitations | MED    | Streaming export + compression for large reports | @backend |

---

## 🎯 3 Killer Features

### 1. **Real-Time Live Balance Updates** ⚡

**Description**: Trial balance updates in real-time as transactions are posted, no page refresh needed.

**Why It's Killer**:

- See changes instantly without regenerating report
- WebSocket-based live updates
- No competitor has true real-time trial balance
- Critical for high-volume environments
- Reduces month-end close time by 50%

**Implementation**:

```typescript
import { DataTable } from "aibos-ui";
import { useWebSocket } from "@/hooks/useWebSocket";

export default function TrialBalancePage() {
  const { data, isLoading } = useTrialBalance(asOfDate);

  // Subscribe to live updates
  useWebSocket("trial-balance-updates", (update) => {
    queryClient.setQueryData(["trial-balance", asOfDate], (old) =>
      updateBalance(old, update)
    );
  });

  return <DataTable data={data} liveUpdates highlightChanges animateUpdates />;
}
```

### 2. **One-Click Drill-Down to Transactions** 🔍

**Description**: Click any account balance to instantly see all source transactions contributing to that balance.

**Why It's Killer**:

- Instant transaction detail (no separate query needed)
- Shows transaction breakdown by type
- Navigate directly to source documents
- Better than SAP/Oracle's multi-step drill-down
- Reduces investigation time by 80%

**Implementation**:

```typescript
import { Popover, DataTable } from "aibos-ui";

<DataTable
  columns={[
    {
      key: "balance",
      label: "Balance",
      render: (value, row) => (
        <Popover
          trigger={
            <button className="hover:underline cursor-pointer">
              {formatCurrency(value)}
            </button>
          }
          content={
            <TransactionDrillDown
              accountId={row.account_id}
              asOfDate={asOfDate}
              onNavigate={(txn) => router.push(`/journals/${txn.journal_id}`)}
            />
          }
          placement="right"
          width="large"
        />
      ),
    },
  ]}
/>;
```

### 3. **Multi-Period Comparison with Variance Analysis** 📊

**Description**: Compare trial balances across multiple periods side-by-side with automatic variance calculations.

**Why It's Killer**:

- Side-by-side comparison of up to 6 periods
- Automatic variance calculation (amount & %)
- Visual indicators for significant changes
- Identifies trends and anomalies
- Industry-first multi-period trial balance view

**Implementation**:

```typescript
import { DataTable, Select } from "aibos-ui";

export default function TrialBalanceComparison() {
  const [periods, setPeriods] = useState(["2025-09", "2025-08", "2025-07"]);

  return (
    <DataTable
      data={combinedData}
      columns={[
        { key: "account", label: "Account", frozen: true },
        ...periods.map((period) => ({
          key: `balance_${period}`,
          label: formatPeriod(period),
          align: "right",
          render: formatCurrency,
        })),
        {
          key: "variance",
          label: "Variance",
          render: (value) => (
            <VarianceCell value={value} threshold={10000} showPercentage />
          ),
        },
      ]}
      enableColumnResize
      enableExport
    />
  );
}
```

---

## 🏗️ Technical Architecture

### UI Components Needed

#### 1. Trial Balance Report Page (`/reports/trial-balance`)

**Components**:

- `DatePicker` - As of date selection
- `DataTable` - Account balances
- `Card` - Summary totals
- `Button` - Export, Print, Refresh
- `Tabs` - Standard/Adjusted/Comparison views
- `Badge` - Account types

**File**: `apps/web/app/(dashboard)/reports/trial-balance/page.tsx` (enhance existing)

#### 2. Multi-Period Comparison View

**Components**:

- `MultiSelect` - Period selection
- `DataTable` - Side-by-side comparison
- `Chart` - Variance visualization
- `Button` - Export comparison

**File**: `apps/web/app/(dashboard)/reports/trial-balance/comparison/page.tsx`

#### 3. Transaction Drill-Down Component

**Components**:

- `Popover` - Drill-down container
- `DataTable` - Transaction list
- `Badge` - Transaction types
- `Link` - Navigate to source

**File**: `apps/web/components/reports/TransactionDrillDown.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                           | Target            | Measurement             |
| -------------------------------- | ----------------- | ----------------------- |
| TTFB (staging)                   | ≤ 70ms            | Server timing header    |
| Client TTI for `/trial-balance`  | ≤ 200ms           | Lighthouse CI           |
| Network requests (initial)       | ≤ 4               | Chrome DevTools         |
| UI bundle size                   | ≤ 250KB gzipped   | Webpack bundle analyzer |
| Report generation (10K accounts) | < 3s              | APM traces              |
| Server pagination                | Default 100/page  | API query param         |
| Drill-down response (P95)        | < 200ms           | APM traces              |
| Export generation (Excel)        | < 5s for 10K rows | APM traces              |
| WebSocket update latency         | < 100ms           | Performance profiler    |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard support for drill-down, export, date picker
- **Focus Management**: Focus trap in popovers; visible focus indicators on cells
- **ARIA**: Live region for balance updates; proper roles for data table
- **Screen Reader**: All balances, totals, and drill-down content announced
- **Axe Target**: 0 serious/critical violations

### Security

| Layer           | Requirement                                                  |
| --------------- | ------------------------------------------------------------ |
| RBAC Scopes     | `reports.trial_balance.read`, `reports.trial_balance.export` |
| Enforcement     | Server-side on all endpoints                                 |
| Client Behavior | Hide export button for users without export permission       |
| Data Exposure   | Only show accounts user has permission to view               |
| Rate Limiting   | Export limited to 5 per hour per user                        |
| Audit Trail     | All exports and drill-downs logged with user + timestamp     |

**Reference**: See `security-policy.json` for full threat model and controls.

#### UI Permissions Matrix

| Role                          | View Report | Drill-Down | Export | Multi-Period | Real-Time |
| ----------------------------- | ----------- | ---------- | ------ | ------------ | --------- |
| reports.trial_balance.read    | ✅          | ✅         | ❌     | ✅           | ✅        |
| reports.trial_balance.export  | ✅          | ✅         | ✅     | ✅           | ✅        |
| reports.trial_balance.analyst | ✅          | ✅         | ✅     | ✅           | ✅        |

**UI Implementation**:

- Hide export buttons for users without export permission
- Show read-only view for `reports.trial_balance.read` users
- Display permission-denied state if user navigates directly to restricted action

### Reliability & Observability

- **SLO**: 99.9% successful responses on trial balance endpoints
- **SLA Dashboards**: Real-time metrics on report generation time, export success rate
- **Events Emitted**: `TrialBalance.Report.Generated/Exported/DrillDown`
- **Logging**: Structured logs with correlation IDs for all report generations
- **Tracing**: Distributed tracing across BFF → Kernel → Database

---

## 🧬 Data & Domain Invariants

### Trial Balance Business Rules

| Rule                      | Enforcement                                       |
| ------------------------- | ------------------------------------------------- |
| **Balance Verification**  | Total debits must equal total credits exactly     |
| **As-of-Date Constraint** | Cannot query future dates                         |
| **Account Filtering**     | Only include posting-level accounts with activity |
| **Zero Balance Option**   | User can include/exclude zero-balance accounts    |
| **Adjustment Entries**    | Standard vs Adjusted trial balance views          |
| **Period Close Status**   | Indicate if period is closed or open              |

### Currency & Rounding

- **Display**: Presentation currency from tenant settings
- **Rounding Policy**: HALF_UP to 2 decimal places (consistent with ledger)
- **Multi-Currency**: Consolidate all currencies to presentation currency with rates
- **FX Translation**: Use rates as of the selected as-of-date

### Data Aggregation

- **Source**: Aggregate from posted journal entries
- **Real-Time**: Update on WebSocket events from posting service
- **Caching**: Cache trial balance for 5 minutes per as-of-date
- **Guard Rails**:
  - ❌ Deny if as-of-date > today
  - ❌ Warn if as-of-date in unclosed period (data may change)
  - ✅ Allow historical queries (cached results)

---

## 🚨 Error Handling & UX States

### All Possible States

| State            | UI Display                                  | User Action                   |
| ---------------- | ------------------------------------------- | ----------------------------- |
| **Empty**        | "No accounts with activity" + date selector | Change date range             |
| **Loading**      | Skeleton table (with shimmer)               | N/A                           |
| **Error**        | Error message + retry button                | Retry / contact support       |
| **Out of Bal**   | Alert: "Debits ≠ Credits" + difference      | Drill-down to investigate     |
| **No Results**   | "No accounts match filters"                 | Clear filters / adjust search |
| **Export Error** | Toast: "Export failed. Try again."          | Retry export                  |
| **Timeout**      | "Report taking longer than expected..."     | Wait / cancel                 |

### Form Validation

- **Date Validation**: Cannot select future dates
- **Period Selection**: Max 6 periods for multi-period comparison
- **Export Format**: Validate format selection (CSV, XLSX, PDF)

### Network Errors

| HTTP Status | UI Message                                         | Action               |
| ----------- | -------------------------------------------------- | -------------------- |
| 400         | "Invalid date or filters."                         | Adjust inputs        |
| 401         | "Session expired. Please log in again."            | Redirect to login    |
| 403         | "You don't have permission to view trial balance." | Hide report          |
| 404         | "No data found for selected period."               | Change date          |
| 408         | "Report generation timed out. Try shorter period." | Reduce date range    |
| 500         | "Report generation failed. Our team is notified."  | Retry + support link |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useTrialBalance.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function useTrialBalance(asOfDate: string, filters = {}) {
  return useQuery({
    queryKey: ["trial-balance", asOfDate, filters],
    queryFn: () =>
      apiClient.GET("/api/reports/trial-balance", {
        query: { as_of_date: asOfDate, ...filters },
      }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTrialBalanceExport(asOfDate: string) {
  return useMutation({
    mutationFn: (format: "csv" | "xlsx") =>
      apiClient.GET("/api/reports/trial-balance/export", {
        query: { as_of_date: asOfDate, format },
      }),
  });
}

export function useTransactionDrillDown(accountId: string, asOfDate: string) {
  return useQuery({
    queryKey: ["drill-down", accountId, asOfDate],
    queryFn: () =>
      apiClient.GET("/api/reports/trial-balance/drill-down", {
        query: { account_id: accountId, as_of_date: asOfDate },
      }),
    enabled: !!accountId,
  });
}

export function useMultiPeriodTrialBalance(periods: string[]) {
  return useQuery({
    queryKey: ["trial-balance-multi", periods],
    queryFn: async () => {
      const results = await Promise.all(
        periods.map((period) =>
          apiClient.GET("/api/reports/trial-balance", {
            query: { as_of_date: period },
          })
        )
      );
      return combinePeriodsData(results);
    },
  });
}
```

### Error Mapping

| API Error        | User Message                                       | UI Action            |
| ---------------- | -------------------------------------------------- | -------------------- |
| 408 (Timeout)    | "Report generation timed out. Try shorter period." | Show timeout message |
| 422 (Validation) | "Invalid date or filters."                         | Inline form errors   |
| 403 (Forbidden)  | "You don't have permission to view this report."   | Hide report          |
| 500 (Server)     | "Report generation failed. Our team is notified."  | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Exports**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 60s for large exports

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/trial-balance.json`.

### Page Titles & Headers

| Context            | Copy                         | i18n Key                         |
| ------------------ | ---------------------------- | -------------------------------- |
| Report Page        | "Trial Balance"              | `trialBalance.page.title`        |
| Multi-Period Page  | "Multi-Period Trial Balance" | `trialBalance.multiPeriod.title` |
| Export Modal       | "Export Trial Balance"       | `trialBalance.export.title`      |
| Drill-Down Popover | "Transaction Details"        | `trialBalance.drillDown.title`   |

### State Messages

| State             | Title                       | Message                                                     | Action Button       | i18n Key                          |
| ----------------- | --------------------------- | ----------------------------------------------------------- | ------------------- | --------------------------------- |
| Empty             | "No activity"               | "No accounts have activity for the selected period"         | "Change Date"       | `trialBalance.empty.*`            |
| Loading           | —                           | —                                                           | —                   | —                                 |
| Error             | "Unable to generate report" | "Something went wrong. Our team has been notified."         | "Retry" / "Support" | `trialBalance.error.*`            |
| No Results        | "No accounts found"         | "Try adjusting your filters or date range"                  | "Clear Filters"     | `trialBalance.noResults.*`        |
| Permission Denied | "Access restricted"         | "You don't have permission to view trial balance reports."  | "Back to Dashboard" | `trialBalance.permissionDenied.*` |
| Out of Balance    | "Ledger out of balance"     | "Debits and credits don't match. Investigate immediately."  | "Drill Down"        | `trialBalance.outOfBalance.*`     |
| Timeout (408)     | "Report timed out"          | "Report is taking longer than expected. Try shorter period" | "Reduce Period"     | `trialBalance.timeout.*`          |

### Action Confirmations

| Action | Title            | Message                                                         | Confirm Button | Cancel Button | i18n Key                        |
| ------ | ---------------- | --------------------------------------------------------------- | -------------- | ------------- | ------------------------------- |
| Export | "Export report?" | "This will generate a {format} file with all visible accounts." | "Export"       | "Cancel"      | `trialBalance.export.confirm.*` |

### Success Messages (Toast)

| Action  | Message                               | i18n Key                       |
| ------- | ------------------------------------- | ------------------------------ |
| Export  | "Trial balance exported successfully" | `trialBalance.export.success`  |
| Refresh | "Report refreshed"                    | `trialBalance.refresh.success` |

### Error Messages (Toast)

| Scenario         | Message                                               | i18n Key                           |
| ---------------- | ----------------------------------------------------- | ---------------------------------- |
| Export Failed    | "Failed to export report. Please try again."          | `trialBalance.export.error`        |
| Future Date      | "Cannot select future date."                          | `trialBalance.errorFutureDate`     |
| Too Many Periods | "Maximum 6 periods allowed for comparison."           | `trialBalance.errorTooManyPeriods` |
| Network Error    | "Network error. Check your connection and try again." | `trialBalance.error.network`       |
| Out of Balance   | "Ledger is out of balance by {amount}. Investigate."  | `trialBalance.errorOutOfBalance`   |

### Form Labels & Help Text

| Field          | Label            | Placeholder     | Help Text                                   | i18n Key                         |
| -------------- | ---------------- | --------------- | ------------------------------------------- | -------------------------------- |
| As of Date     | "As of Date"     | "Select date"   | "Report will show balances up to this date" | `trialBalance.field.asOfDate.*`  |
| Account Filter | "Account Filter" | "All accounts"  | "Filter by account type or name"            | `trialBalance.field.filter.*`    |
| Show Zeros     | "Show Zeros"     | —               | "Include accounts with zero balance"        | `trialBalance.field.showZeros.*` |
| Export Format  | "Format"         | "Select format" | "Choose export file format"                 | `trialBalance.field.format.*`    |

### Keyboard Shortcuts Help

| Shortcut | Description         | i18n Key                           |
| -------- | ------------------- | ---------------------------------- |
| `/`      | "Focus search"      | `trialBalance.shortcuts.search`    |
| `r`      | "Refresh report"    | `trialBalance.shortcuts.refresh`   |
| `e`      | "Export"            | `trialBalance.shortcuts.export`    |
| `d`      | "Toggle drill-down" | `trialBalance.shortcuts.drillDown` |
| `Escape` | "Close popover"     | `trialBalance.shortcuts.close`     |

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["trial-balance", asOfDate, { filters }][("trial-balance-multi", periods)][
  ("drill-down", accountId, asOfDate)
][("trial-balance-export", asOfDate, format)];
```

### Invalidation Rules

| Action           | Invalidates                           |
| ---------------- | ------------------------------------- |
| Journal Posted   | `["trial-balance"]`, `["drill-down"]` |
| Journal Reversed | `["trial-balance"]`, `["drill-down"]` |
| Period Closed    | `["trial-balance", closedPeriodDate]` |
| Manual Refresh   | `["trial-balance", currentAsOfDate]`  |

### Stale Time

| Query Type    | Stale Time | Reasoning                             |
| ------------- | ---------- | ------------------------------------- |
| Trial Balance | 5min       | Balances change with postings         |
| Drill-Down    | 3min       | Transaction details relatively stable |
| Multi-Period  | 10min      | Historical data changes infrequently  |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("trial-balance"); // After journal posting
revalidateTag(`trial-balance-${asOfDate}`); // Specific date
```

---

## 📝 Implementation Guide

### Step 1: Enhance Existing Trial Balance Page (3 hours)

```typescript
// apps/web/app/(dashboard)/reports/trial-balance/page.tsx
import { DatePicker, DataTable, Card, Button, Tabs } from "aibos-ui";
import { useTrialBalance } from "@/hooks/useTrialBalance";

export default function TrialBalancePage() {
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [view, setView] = useState("standard");
  const { data, isLoading, refetch } = useTrialBalance(asOfDate);
  const { mutate: exportReport } = useTrialBalanceExport(asOfDate);

  const debitTotal = data?.accounts.reduce((sum, a) => sum + a.debit, 0) || 0;
  const creditTotal = data?.accounts.reduce((sum, a) => sum + a.credit, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trial Balance</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => exportReport("xlsx")}>
            Export to Excel
          </Button>
          <Button variant="secondary" onClick={() => exportReport("csv")}>
            Export to CSV
          </Button>
          <Button onClick={() => refetch()}>Refresh</Button>
        </div>
      </div>

      <Card className="flex gap-4 items-center">
        <DatePicker
          value={asOfDate}
          onChange={setAsOfDate}
          label="As of Date"
          maxDate={new Date()}
        />
        <Select
          value={view}
          onChange={setView}
          options={[
            { value: "standard", label: "Standard View" },
            { value: "comparison", label: "Multi-Period Comparison" },
          ]}
        />
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-gray-500">Total Debits</div>
          <div className="text-2xl font-bold">{formatCurrency(debitTotal)}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Total Credits</div>
          <div className="text-2xl font-bold">
            {formatCurrency(creditTotal)}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Difference</div>
          <div
            className={`text-2xl font-bold ${
              debitTotal === creditTotal ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(Math.abs(debitTotal - creditTotal))}
          </div>
        </Card>
      </div>

      {/* Main Trial Balance Table */}
      <DataTable
        data={data?.accounts || []}
        columns={[
          {
            key: "code",
            label: "Account Code",
            frozen: true,
            width: 150,
          },
          {
            key: "name",
            label: "Account Name",
            frozen: true,
            width: 300,
          },
          {
            key: "type",
            label: "Type",
            render: (value) => <Badge>{value}</Badge>,
          },
          {
            key: "debit",
            label: "Debit",
            align: "right",
            render: (value) => (value > 0 ? formatCurrency(value) : "-"),
          },
          {
            key: "credit",
            label: "Credit",
            align: "right",
            render: (value) => (value > 0 ? formatCurrency(value) : "-"),
          },
          {
            key: "balance",
            label: "Balance",
            align: "right",
            render: (value, row) => (
              <DrillDownBalance
                value={value}
                accountId={row.account_id}
                asOfDate={asOfDate}
              />
            ),
          },
        ]}
        footer={{
          name: "TOTAL",
          debit: debitTotal,
          credit: creditTotal,
          balance: debitTotal - creditTotal,
        }}
        footerClassName="font-bold bg-gray-100"
        enableSearch
        enableExport
        isLoading={isLoading}
      />
    </div>
  );
}
```

### Step 2: Build Drill-Down Component (2 hours)

```typescript
// apps/web/components/reports/TransactionDrillDown.tsx
import { DataTable, Badge, Link } from "aibos-ui";
import { useTransactionDrillDown } from "@/hooks/useTrialBalance";

export function TransactionDrillDown({ accountId, asOfDate, onNavigate }) {
  const { data, isLoading } = useTransactionDrillDown(accountId, asOfDate);

  return (
    <div className="w-[600px] p-4">
      <h3 className="text-lg font-semibold mb-3">Transaction Details</h3>
      <DataTable
        data={data?.transactions || []}
        columns={[
          {
            key: "date",
            label: "Date",
            render: formatDate,
          },
          {
            key: "journal_id",
            label: "Journal #",
            render: (value) => (
              <Link onClick={() => onNavigate({ journal_id: value })}>
                {value}
              </Link>
            ),
          },
          {
            key: "description",
            label: "Description",
          },
          {
            key: "debit",
            label: "Debit",
            align: "right",
            render: (v) => (v > 0 ? formatCurrency(v) : "-"),
          },
          {
            key: "credit",
            label: "Credit",
            align: "right",
            render: (v) => (v > 0 ? formatCurrency(v) : "-"),
          },
        ]}
        compact
        maxHeight="400px"
        isLoading={isLoading}
      />
    </div>
  );
}
```

### Step 3: Build Multi-Period Comparison (3 hours)

Create comparison view with variance analysis.

### Step 4: Add Tests (2 hours)

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/trial-balance.fixtures.ts`

**Datasets**:

- `minimalTrialBalance`: 10 accounts (balanced)
- `standardTrialBalance`: 100 accounts across all types
- `largeDataset`: 1,000 accounts (for performance testing)
- `edgeCases`: Special scenarios

**Edge Cases Covered**:

- Trial balance perfectly balanced (debits = credits)
- Trial balance out of balance (investigate scenario)
- Zero-balance accounts (include/exclude toggle)
- Very large balances (10M+)
- Multi-currency consolidated view
- Historical periods (closed vs open)

```typescript
// Example fixture structure
export const standardTrialBalance: TrialBalanceFixture = {
  as_of_date: "2025-10-06",
  accounts: [
    {
      account_id: "acc_1",
      code: "1000",
      name: "Cash and Cash Equivalents",
      type: "asset",
      debit: 250000.0,
      credit: 0,
      balance: 250000.0,
    },
    // ... 99 more accounts
  ],
  totals: {
    total_debit: 5000000.0,
    total_credit: 5000000.0,
    difference: 0,
  },
};
```

### E2E Seed Data

**Location**: `tests/seeds/trial-balance.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:trial-balance
```

**Dataset**:

- 200 accounts with realistic balances
- 3 months of historical data
- Mix of balanced and edge-case periods
- Multi-entity consolidation data

**Cleanup Command**:

```powershell
pnpm run seed:trial-balance:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic trial balance for "Demo Corp Inc."
- 150 accounts with activity
- Perfectly balanced (debits = credits)
- Multi-period comparison data (6 months)
- Varied account types and balances

**Regeneration**:

```powershell
pnpm run demo:reset:trial-balance
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] Total debits equal total credits
- [ ] All account references exist in ledger
- [ ] As-of-dates are valid (not future)
- [ ] Currency amounts rounded correctly
- [ ] No negative balances on wrong account types

---

## 📊 Analytics & Audit Events

| Event                            | When               | Properties                                       |
| -------------------------------- | ------------------ | ------------------------------------------------ |
| TrialBalance.Report.Generated    | Report loaded      | `as_of_date`, `account_count`, `generation_time` |
| TrialBalance.Report.Exported     | After 2xx response | `as_of_date`, `format`, `account_count`          |
| TrialBalance.DrillDown.Opened    | Popover opened     | `account_id`, `as_of_date`                       |
| TrialBalance.MultiPeriod.Viewed  | Comparison viewed  | `period_count`, `periods`                        |
| TrialBalance.Report.OutOfBalance | Debits ≠ Credits   | `as_of_date`, `difference_amount`                |
| TrialBalance.Search.Performed    | Search executed    | `query`, `results_count`, `duration_ms`          |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("TrialBalance.Report.Generated", {
  as_of_date: asOfDate,
  account_count: data.accounts.length,
  generation_time: performance.now() - startTime,
  is_balanced: debitTotal === creditTotal,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/trial-balance.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties; test with Arabic
- **Currency Display**: Format with tenant's presentation currency and locale

### Keyboard Shortcuts

| Key      | Action              | Scope         |
| -------- | ------------------- | ------------- |
| `/`      | Focus search        | Report        |
| `r`      | Refresh report      | Report        |
| `e`      | Export              | Report        |
| `d`      | Toggle drill-down   | Account row   |
| `Escape` | Close popover/modal | Popover/Modal |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["r", () => refetch()],
  ["e", () => openExportModal()],
]);
```

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
- **Interactive Parts**: Mark with `"use client"` (date pickers, export buttons, popovers)

### Data Fetching Strategy

| Scenario       | Strategy                   | Benefit            |
| -------------- | -------------------------- | ------------------ |
| Initial Report | Server-side fetch + stream | Faster TTFB        |
| Refresh        | Client-side React Query    | Optimistic updates |
| Export         | Client-side mutation       | Progress tracking  |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function generateTrialBalance(asOfDate: string) {
  // ... report generation logic
  revalidateTag("trial-balance");
  revalidateTag(`trial-balance-${asOfDate}`);
}
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                         | Duration | Rollback Trigger |
| ----------- | ---------------- | ---------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                         | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, Lighthouse ≥90       | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, P95 latency < 200ms   | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained | Ongoing  | Error rate spike |

### Feature Flag Configuration

```typescript
// Feature flags for gradual rollout
flags: {
  m3_trial_balance: true,              // Master toggle
  m3_trial_balance_realtime: false,    // WebSocket updates (phase 2)
  m3_trial_balance_multi: false,       // Multi-period (phase 2)
  m3_trial_balance_export: true,       // Export functionality
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/reports/trial-balance`)
- P50/P95/P99 report generation time
- Export success rate
- Drill-down usage
- Out-of-balance alerts

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- P95 latency > 5s for 10min → investigate
- Out-of-balance alerts > 3 per day → accounting review

### UI Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m3_trial_balance = false`

   ```powershell
   pnpm run flags:set m3_trial_balance=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("trial-balance");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/reports/trial-balance/*"
   ```

4. **Monitor for 15 minutes**:

   - Error rate drops below 0.1%
   - No new Sentry issues
   - Users see fallback message

5. **Post-mortem**:
   - Create incident report
   - Add regression test
   - Plan fix + re-deploy

**Rollback Decision Matrix**:

| Scenario                | Action             | Approval Required |
| ----------------------- | ------------------ | ----------------- |
| Error rate > 5%         | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%         | Partial rollback   | On-call engineer  |
| Report generation > 10s | Investigate first  | On-call engineer  |
| Out-of-balance alerts   | Investigate first  | Accounting lead   |
| Data integrity issues   | Immediate rollback | No (auto-trigger) |

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Trial balance calculates totals correctly (debits, credits, difference)
- [ ] Date filtering works (cannot select future dates)
- [ ] Export functions generate correct files (CSV, XLSX, PDF)
- [ ] Drill-down shows correct transactions for account
- [ ] Currency formatting with rounding policies
- [ ] Zero-balance account filtering
- [ ] Out-of-balance detection and alert

### Integration Tests

- [ ] Trial balance reflects posted journals
- [ ] Real-time updates work (WebSocket)
- [ ] Multi-period comparison accurate
- [ ] Export includes all data and totals
- [ ] Search filters accounts correctly
- [ ] Pagination works for large datasets
- [ ] Drill-down queries perform within SLA

### E2E Tests

- [ ] User can navigate to trial balance page
- [ ] User can select as-of-date
- [ ] User can view trial balance report
- [ ] User can drill down to transactions
- [ ] User can export to Excel/CSV
- [ ] User can compare multiple periods
- [ ] User can toggle zero-balance accounts
- [ ] Keyboard-only flow: navigate → drill-down → export

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Arrow keys)
- [ ] Screen reader announces balances and totals
- [ ] Focus management correct (popovers, modals)
- [ ] Color contrast meets WCAG 2.2 AAA
- [ ] Axe: 0 serious/critical violations
- [ ] Date picker accessible via keyboard

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for table, drill-down, export modal
- [ ] Dark/light theme variations

### Performance Tests

- [ ] Bundle size < 250KB gzipped
- [ ] TTFB ≤ 70ms on staging
- [ ] Report generation < 3s for 10K accounts
- [ ] Export generation < 5s for 10K rows

---

## 📅 Timeline & Milestones

| Day | Tasks                              | Deliverable                  |
| --- | ---------------------------------- | ---------------------------- |
| 1   | Enhance existing page + Drill-down | Working trial balance report |
| 2   | Multi-period + Export + Polish     | Full feature complete        |

**Total Effort**: 2 days (16 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries

### Enables These Modules

- Financial statements (P&L, Balance Sheet)
- Close management workflows

---

## 🎯 Success Criteria

### Must Have (Measurable)

- [ ] Display trial balance as of any date
- [ ] Show debit, credit, balance columns with totals
- [ ] Export to Excel/CSV/PDF
- [ ] Drill-down to transactions < 200ms (P95)
- [ ] Verify and alert if debits ≠ credits
- [ ] Report generation < 3s for 10K accounts
- [ ] Axe: 0 serious/critical violations

### Should Have

- [ ] Real-time updates (WebSocket)
- [ ] Multi-period comparison (up to 6 periods)
- [ ] Variance analysis with visual indicators
- [ ] Print-friendly format
- [ ] Zero-balance account toggle

### Nice to Have

- [ ] AI-powered variance explanations
- [ ] Anomaly detection
- [ ] Automated reconciliation
- [ ] Historical trending charts

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

- ERPNext patterns: Trial balance reporting
- QuickBooks: Export functionality
- Xero: Drill-down UX
- Zoho: Multi-period comparison

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Cost/Scaling**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Large Dataset Performance

**Mitigation**: Server-side aggregation with caching; pagination for drill-down; background job for very large exports

### Risk #2: Real-Time Update Latency

**Mitigation**: WebSocket optimization; differential updates only (changed accounts); client-side caching

### Risk #3: Out-of-Balance Data Integrity

**Mitigation**: Real-time alerts; audit trail investigation; automated reconciliation tools

### Risk #4: Export File Size Limits

**Mitigation**: Streaming export; compression; pagination for exports > 10K rows

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/reports/trial-balance`, `/comparison`)
- [ ] Report generation working for any as-of-date
- [ ] Drill-down to transactions functional
- [ ] Export to Excel/CSV/PDF working
- [ ] Real-time balance updates (WebSocket)
- [ ] Multi-period comparison working
- [ ] Search and filtering working
- [ ] Permissions enforced (UI shows/hides based on role)
- [ ] All error states handled gracefully
- [ ] Copy deck implemented (all i18n keys present)

### Quality Gates 🎯

**Enforced in CI** - Build fails if any gate not met

#### Code Quality

- [ ] TypeScript: 0 errors, 0 warnings
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Prettier: All files formatted
- [ ] No console.log or debugger statements

#### Test Coverage

- [ ] Unit tests: ≥90% line coverage, ≥95% for critical paths
- [ ] Integration tests: All report generation + drill-down covered
- [ ] E2E tests: All user flows covered (view → drill-down → export)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Report generation flow with balance verification
- Drill-down to transactions flow
- Export flow (all formats)
- Multi-period comparison flow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/reports/trial-balance` routes
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/reports/trial-balance`
- [ ] Network requests: ≤4 on initial load
- [ ] Report generation: < 3s for 10K accounts
- [ ] Export generation: < 5s for 10K rows

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `TrialBalance.Report.Generated`
  - `TrialBalance.Report.Exported`
  - `TrialBalance.DrillDown.Opened`
  - `TrialBalance.MultiPeriod.Viewed`
  - `TrialBalance.Report.OutOfBalance`
  - `TrialBalance.Search.Performed`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, latency, out-of-balance)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Rate limiting on exports (5 per hour per user)
- [ ] No sensitive data in logs/errors
- [ ] Audit trail complete (all exports and drill-downs logged)
- [ ] Security review completed

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete (changes, testing, screenshots)
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized (OpenAPI hash verified)
- [ ] i18n keys documented in copy deck
- [ ] User acceptance testing passed (PM/QA sign-off)

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m3_trial_balance = false` (ready to enable)
  - `flags.m3_trial_balance_realtime = false` (phase 2)
  - `flags.m3_trial_balance_multi = false` (phase 2)
- [ ] Smoke tests passed on staging
- [ ] Load tests passed (≥1000 concurrent users)
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

---

**Ready to build? Enhance the existing page! 🚀**

**Previous Module**: M2 - Journal Entries  
**Next Module**: M4 - Accounts Receivable
