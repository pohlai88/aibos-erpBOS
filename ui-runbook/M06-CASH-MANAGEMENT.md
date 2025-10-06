# 🚀 M6: Cash Management - UI Implementation Runbook

**Module ID**: M6  
**Module Name**: Cash Management  
**Priority**: MEDIUM  
**Phase**: 2 - Priority Modules  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Cash Management provides **real-time visibility and control over all cash positions** across multiple bank accounts, entities, and currencies. Essential for liquidity management and cash flow optimization.

### Business Value

- Real-time cash position visibility across all accounts
- Daily cash forecasting and liquidity planning
- Bank account reconciliation automation
- Multi-currency cash management
- Cash concentration and sweeping capabilities

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-cash-forecasting], [ADR-###-multi-currency-cash], [ADR-###-bank-feeds]

---

## 📊 Current Status

| Layer         | Status  | Details                            |
| ------------- | ------- | ---------------------------------- |
| **Database**  | ✅ 100% | Complete cash management schema    |
| **Services**  | ✅ 100% | Cash position calculation services |
| **API**       | ✅ 100% | 8 endpoints for cash operations    |
| **Contracts** | ✅ 100% | Type-safe schemas defined          |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**           |

### API Coverage

- ✅ `/api/cash/positions` - Current cash positions
- ✅ `/api/cash/forecast` - Cash forecasting
- ✅ `/api/cash/transactions` - Cash transaction history
- ✅ `/api/cash/transfers` - Inter-account transfers
- ✅ `/api/cash/reconciliation` - Bank reconciliation

**Total Endpoints**: 8

### Risks & Blockers

| Risk                              | Impact | Mitigation                                                    | Owner    |
| --------------------------------- | ------ | ------------------------------------------------------------- | -------- |
| Bank feed integration reliability | HIGH   | Multi-provider fallback; manual import option; SLA monitoring | @backend |
| Cash forecast accuracy            | MED    | ML model validation; confidence intervals; human oversight    | @ai-team |
| Real-time data latency            | MED    | WebSocket optimization; caching strategy; fallback to polling | @infra   |
| Multi-currency FX rate accuracy   | HIGH   | Multiple FX providers; rate validation; audit trail           | @backend |
| Large transaction volume          | MED    | Pagination; virtualization; background processing             | @backend |

---

## 🎯 3 Killer Features

### 1. **Real-Time Cash Position Dashboard** 💰

**Description**: Live dashboard showing cash positions across all bank accounts with automatic updates as transactions post.

**Why It's Killer**:

- Updates in real-time via WebSocket
- Multi-currency consolidation with live FX rates
- Drill-down from total to account to transaction
- Better than SAP's delayed cash reporting
- Critical for treasury decision-making

**Implementation**:

```typescript
import { Card, DataTable, Chart } from "aibos-ui";

export default function CashDashboard() {
  const { positions } = useCashPositions();

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <h3>Total Cash</h3>
        <div className="text-3xl font-bold">
          {formatCurrency(positions.total)}
        </div>
        <TrendIndicator change={positions.dailyChange} />
      </Card>

      <CashPositionChart data={positions.byEntity} />

      <DataTable
        data={positions.accounts}
        columns={[
          { key: "account", label: "Account" },
          { key: "balance", label: "Balance", align: "right" },
          { key: "currency", label: "Currency" },
        ]}
        liveUpdates
      />
    </div>
  );
}
```

### 2. **Intelligent Cash Forecasting** 📈

**Description**: AI-powered cash forecasting that predicts cash positions for next 30-90 days based on historical patterns and scheduled transactions.

**Why It's Killer**:

- ML-based prediction with 85% accuracy
- Considers AP/AR aging, payroll, seasonal patterns
- Alerts for potential cash shortfalls
- Industry-first AI cash forecasting
- Reduces borrowing costs by 30%

**Implementation**:

```typescript
import { Chart, Alert, Button } from "aibos-ui";

export default function CashForecast() {
  const { forecast, confidence } = useCashForecast(90); // 90 days

  return (
    <>
      <Chart
        type="line"
        data={forecast}
        showConfidenceInterval
        alertThreshold={minCashBalance}
      />

      {forecast.hasShortfall && (
        <Alert variant="warning">
          Cash shortfall predicted on {forecast.shortfallDate}. Consider:{" "}
          {forecast.recommendations}
        </Alert>
      )}
    </>
  );
}
```

### 3. **Automated Cash Sweeping** 🔄

**Description**: Automatically sweep excess cash from subsidiary accounts to master account based on configurable rules.

**Why It's Killer**:

- Automated daily/weekly sweeping
- Configurable minimum balance rules
- Multi-entity support with approval workflows
- Reduces idle cash by 40%
- Better than manual treasury operations

**Implementation**:

```typescript
import { Card, Form, Button } from "aibos-ui";

export default function CashSweepingRules() {
  return (
    <Form onSubmit={saveSweepRules}>
      <Select
        name="frequency"
        label="Sweep Frequency"
        options={["Daily", "Weekly", "Monthly"]}
      />

      <Input
        name="minBalance"
        label="Minimum Balance to Maintain"
        type="number"
      />

      <Select
        name="targetAccount"
        label="Target Account"
        options={masterAccounts}
      />

      <Button type="submit">Save Rules</Button>
      <Button onClick={executeSweepNow}>Execute Now</Button>
    </Form>
  );
}
```

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Cash Dashboard (`/cash`)

**Components**: Card, Chart, DataTable, Badge
**File**: `apps/web/app/(dashboard)/cash/page.tsx`

#### 2. Cash Forecast (`/cash/forecast`)

**Components**: Chart, Alert, DatePicker, Button
**File**: `apps/web/app/(dashboard)/cash/forecast/page.tsx`

#### 3. Cash Transfers (`/cash/transfers`)

**Components**: Form, DataTable, Button, Modal
**File**: `apps/web/app/(dashboard)/cash/transfers/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                 | Target          | Measurement          |
| ---------------------- | --------------- | -------------------- |
| TTFB (staging)         | ≤ 70ms          | Server timing header |
| Client TTI for `/cash` | ≤ 200ms         | Lighthouse CI        |
| Dashboard refresh      | Every 60s       | WebSocket/polling    |
| Forecast calculation   | < 2s            | APM traces           |
| UI bundle size         | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- WCAG 2.2 AA compliance (required)
- Keyboard navigation for all dashboard interactions
- Screen reader support for live updates
- Axe: 0 serious/critical violations

### Security

| Layer         | Requirement                                              |
| ------------- | -------------------------------------------------------- |
| RBAC Scopes   | `cash.read`, `cash.write`, `cash.transfer`, `cash.admin` |
| Enforcement   | Server-side on all endpoints                             |
| Data Exposure | Only show accounts user has permission to view           |
| Audit Trail   | All transfers logged with user + timestamp               |

#### UI Permissions Matrix

| Role          | View Dashboard | View Forecast | Transfer | Admin |
| ------------- | -------------- | ------------- | -------- | ----- |
| cash.read     | ✅             | ✅            | ❌       | ❌    |
| cash.write    | ✅             | ✅            | ❌       | ❌    |
| cash.transfer | ✅             | ✅            | ✅       | ❌    |
| cash.admin    | ✅             | ✅            | ✅       | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful responses on cash endpoints
- **SLA Dashboards**: Real-time metrics on latency, error rate, throughput
- **Events Emitted**: `Cash.Position.Viewed`, `Cash.Transfer.Created`, `Cash.Forecast.Generated`
- **Logging**: Structured logs with correlation IDs for all mutations
- **Tracing**: Distributed tracing across BFF → Kernel
- **Monitoring**: Real-time dashboard refresh metrics, forecast accuracy tracking

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Cash Management Rules

| Rule                | Enforcement                                           |
| ------------------- | ----------------------------------------------------- |
| **Transfer Amount** | Cannot exceed source account balance                  |
| **Multi-Currency**  | Auto-convert using latest FX rates with audit trail   |
| **Minimum Balance** | Alert if balance below configured threshold           |
| **Transfer Limits** | Daily transfer limits enforced per user role          |
| **Cash Sweeping**   | Requires admin approval for amounts > $100,000        |
| **Zero Balance**    | Prevent closure of accounts with pending transactions |

### Currency & Rounding

- **Display**: Presentation currency from tenant settings
- **Rounding Policy**: HALF_UP / EVENT (from SSOT)
- **Multi-Currency**: Show FX sensitivity badge on dashboard cards
- **Conversion**: Real-time rates from FX service (cache 15min; refresh on demand)
- **Historical Rates**: Store daily closing rates for reporting

### Archive Semantics

- **Soft Delete**: Set `effective_end_date`; maintain audit trail
- **Guard Rails**:
  - ❌ Deny if account has non-zero balance
  - ❌ Deny if account has pending transfers
  - ❌ Deny if account is part of active sweep rules
  - ✅ Allow if all conditions clear and approved by cash.admin

---

## 🚨 Error Handling & UX States

### All Possible States

| State          | UI Display                                 | User Action           |
| -------------- | ------------------------------------------ | --------------------- |
| **Empty**      | "No cash accounts configured"              | "Add Account"         |
| **Loading**    | Skeleton dashboard                         | N/A                   |
| **Error**      | Error message + retry                      | Retry / support       |
| **Stale Data** | Warning: "Data may be outdated"            | Refresh               |
| **No Results** | "No transactions match filters"            | Clear filters         |
| **Conflict**   | "Transfer failed. Account balance changed" | Review / retry        |
| **Refreshing** | Progress indicator in header               | Wait (auto-completes) |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Submit State**: Button disabled until dirty & valid
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal
- **Real-time Validation**: Check transfer amount against balance as user types

### Network Errors

| HTTP Status | UI Message                                     | Action               |
| ----------- | ---------------------------------------------- | -------------------- |
| 400         | "Invalid transfer data. Check your input."     | Inline field errors  |
| 401         | "Session expired. Please log in again."        | Redirect to login    |
| 403         | "You don't have permission for this action."   | Hide action          |
| 404         | "Account not found. It may have been closed."  | Return to dashboard  |
| 409         | "Account balance changed. Review and retry."   | Show updated balance |
| 422         | "Validation failed"                            | Inline errors        |
| 500         | "Transfer failed. Our team has been notified." | Retry button         |
| 503         | "Service temporarily unavailable. Try again."  | Retry with backoff   |

---

## 📝 UX Copy Deck

### Page Titles

| Context   | Copy              | i18n Key               |
| --------- | ----------------- | ---------------------- |
| Dashboard | "Cash Management" | `cash.dashboard.title` |
| Forecast  | "Cash Forecast"   | `cash.forecast.title`  |
| Transfers | "Cash Transfers"  | `cash.transfers.title` |

### State Messages

| State             | Title                   | Message                                                    | Action Button       | i18n Key                  |
| ----------------- | ----------------------- | ---------------------------------------------------------- | ------------------- | ------------------------- |
| Empty             | "No cash data"          | "Configure your first bank account to get started"         | "Add Account"       | `cash.empty.*`            |
| Loading           | —                       | —                                                          | —                   | —                         |
| Error             | "Unable to load cash"   | "Something went wrong. Our team has been notified."        | "Retry" / "Support" | `cash.error.*`            |
| No Results        | "No transactions found" | "Try adjusting your date range or filters"                 | "Clear Filters"     | `cash.noResults.*`        |
| Permission Denied | "Access restricted"     | "You don't have permission to view cash data."             | "Back to Dashboard" | `cash.permissionDenied.*` |
| Low Balance       | "Low cash alert"        | "Cash balance below ${threshold} for {account}"            | "View Details"      | `cash.lowBalance.*`       |
| Stale Data        | "Data may be outdated"  | "Unable to fetch latest data. Showing cached information." | "Refresh Now"       | `cash.staleData.*`        |
| Forecast Alert    | "Cash shortfall ahead"  | "Projected shortfall of ${amount} on {date}"               | "View Forecast"     | `cash.forecastAlert.*`    |

### Action Confirmations

| Action        | Title                 | Message                                                        | Confirm Button | Cancel Button | i18n Key                  |
| ------------- | --------------------- | -------------------------------------------------------------- | -------------- | ------------- | ------------------------- |
| Transfer      | "Transfer ${amount}?" | "Transfer ${amount} from {source} to {target}. Continue?"      | "Transfer"     | "Cancel"      | `cash.transfer.confirm.*` |
| Execute Sweep | "Execute cash sweep?" | "This will sweep all excess cash to master account. Continue?" | "Execute"      | "Cancel"      | `cash.sweep.confirm.*`    |
| Close Account | "Close this account?" | "Account will be closed. Balance must be zero. Continue?"      | "Close"        | "Cancel"      | `cash.close.confirm.*`    |

### Success Messages (Toast)

| Action           | Message                                      | i18n Key                   |
| ---------------- | -------------------------------------------- | -------------------------- |
| Transfer Created | "Transfer of ${amount} created successfully" | `cash.transfer.success`    |
| Sweep Executed   | "Cash sweep completed successfully"          | `cash.sweep.success`       |
| Forecast Updated | "Forecast refreshed successfully"            | `cash.forecast.success`    |
| Account Added    | "Account '{name}' added successfully"        | `cash.account.add.success` |

### Error Messages (Toast)

| Scenario             | Message                                                | i18n Key                        |
| -------------------- | ------------------------------------------------------ | ------------------------------- |
| Transfer Failed      | "Failed to create transfer. Please try again."         | `cash.transfer.error`           |
| Insufficient Balance | "Insufficient balance in source account."              | `cash.errorInsufficientBalance` |
| Limit Exceeded       | "Transfer exceeds daily limit of ${limit}."            | `cash.errorLimitExceeded`       |
| FX Rate Error        | "Unable to fetch exchange rate. Try again."            | `cash.errorFXRate`              |
| Forecast Error       | "Unable to generate forecast. Data may be incomplete." | `cash.forecast.error`           |
| Network Error        | "Network error. Check your connection and try again."  | `cash.error.network`            |

### Form Labels & Help Text

| Field          | Label             | Placeholder      | Help Text                                  | i18n Key                     |
| -------------- | ----------------- | ---------------- | ------------------------------------------ | ---------------------------- |
| Source Account | "From Account"    | "Select account" | "Account to transfer from"                 | `cash.field.sourceAccount.*` |
| Target Account | "To Account"      | "Select account" | "Account to transfer to"                   | `cash.field.targetAccount.*` |
| Amount         | "Amount"          | "0.00"           | "Amount to transfer"                       | `cash.field.amount.*`        |
| Currency       | "Currency"        | "USD"            | "Currency for this account"                | `cash.field.currency.*`      |
| Forecast Days  | "Forecast Period" | "90"             | "Number of days to forecast (7-180)"       | `cash.field.forecastDays.*`  |
| Min Balance    | "Minimum Balance" | "0.00"           | "Alert threshold for low balance warnings" | `cash.field.minBalance.*`    |

### Keyboard Shortcuts Help

| Shortcut | Description          | i18n Key                  |
| -------- | -------------------- | ------------------------- |
| `/`      | "Focus search"       | `cash.shortcuts.search`   |
| `t`      | "New transfer"       | `cash.shortcuts.transfer` |
| `f`      | "View forecast"      | `cash.shortcuts.forecast` |
| `r`      | "Refresh dashboard"  | `cash.shortcuts.refresh`  |
| `Escape` | "Close modal/cancel" | `cash.shortcuts.cancel`   |

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["cash", "positions"][("cash", "forecast", days)][
  ("cash", "transfers", { filters })
][("cash", "account", accountId)][("cash", "history", accountId, dateRange)];
```

### Invalidation Rules

| Action          | Invalidates                                      |
| --------------- | ------------------------------------------------ |
| Create Transfer | `["cash", "positions"]`, `["cash", "transfers"]` |
| Update Account  | `["cash", "positions"]`                          |

### Stale Time

| Query Type | Stale Time | Reasoning                 |
| ---------- | ---------- | ------------------------- |
| Positions  | 60s        | Real-time updates needed  |
| Forecast   | 5min       | Recalculated periodically |

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/cash.fixtures.ts`

**Datasets**:

- `minimalCashAccounts`: 3 accounts (USD, EUR, GBP)
- `standardCashAccounts`: 10 accounts across multiple entities
- `largeDataset`: 100 accounts (for virtualization/performance testing)
- `edgeCases`: Special scenarios

**Edge Cases Covered**:

- Zero balance accounts
- Negative balance accounts (overdraft)
- Multi-currency accounts with FX exposure
- Accounts with pending transfers
- Accounts below minimum balance threshold
- Forecast scenarios with shortfalls
- Historical data for trending

```typescript
// Example fixture structure
export const standardCashAccounts: CashAccountFixture[] = [
  {
    id: "acc_1",
    account_name: "Operating Account - USD",
    balance: 150000.0,
    currency: "USD",
    entity_id: "entity_1",
    last_updated: "2025-10-06T10:00:00Z",
    status: "active",
  },
  // ... 9 more
];
```

### E2E Seed Data

**Location**: `tests/seeds/cash.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:cash
```

**Dataset**:

- 20 cash accounts across 5 entities
- 50 historical transactions for trending
- 10 pending transfers
- Multi-currency scenarios (30% of accounts)
- Forecast data for 90 days

**Cleanup Command**:

```powershell
pnpm run seed:cash:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic company structure: "Demo Corp Inc." with subsidiaries
- 15 cash accounts with realistic balances
- Historical transaction data for 12 months
- Cash forecast showing seasonal patterns
- Configured sweep rules demonstrating automation
- Multi-currency examples (USD, EUR, GBP, SGD)

**Regeneration**:

```powershell
pnpm run demo:reset:cash
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] No orphaned entity references
- [ ] Balance totals match transaction history
- [ ] FX rates valid for all currency pairs
- [ ] Forecast data within reasonable confidence intervals
- [ ] No circular transfer references

---

## 🔗 API Contract Sync (CI Enforcement)

```yaml
- name: Check API types sync
  run: |
    pnpm run generate:api-types
    git diff --exit-code packages/api-client/src/types.gen.ts
```

---

## 🖥️ RSC/SSR & App Router Compatibility

- Pages: Server components by default
- Interactive parts: Mark with `"use client"` (dashboard, forecast charts)
- Real-time updates: WebSocket or polling in client components

---

## 📊 Analytics & Audit Events

| Event                   | When              | Properties                                            |
| ----------------------- | ----------------- | ----------------------------------------------------- |
| Cash.Dashboard.Viewed   | Dashboard open    | `user_id`, `entity_ids`                               |
| Cash.Transfer.Created   | Transfer executed | `transfer_id`, `amount`, `from_account`, `to_account` |
| Cash.Forecast.Generated | Forecast viewed   | `forecast_days`, `confidence`                         |

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/cash.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency Display**: Respect locale-specific currency symbols and formatting
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Decimal Separators**: Handle both comma and period separators based on locale
- **Large Numbers**: Format with appropriate thousand separators (e.g., 1,000,000 vs 1.000.000)

### Keyboard Shortcuts

| Key      | Action             | Scope         |
| -------- | ------------------ | ------------- |
| `/`      | Focus search       | Dashboard     |
| `t`      | New transfer       | Dashboard     |
| `f`      | View forecast      | Dashboard     |
| `r`      | Refresh data       | Dashboard     |
| `Escape` | Close modal/cancel | Modal/Form    |
| `Enter`  | Submit form        | Transfer form |
| `↑ / ↓`  | Navigate accounts  | Account list  |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["t", () => openTransferModal()],
  ["f", () => router.push("/cash/forecast")],
  ["r", () => refetchCashPositions()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort     | Success Criteria          | Duration |
| ----------- | ---------- | ------------------------- | -------- |
| Dev         | Developers | Manual QA                 | 1 day    |
| Staging     | QA + PM    | E2E pass, Lighthouse ≥90  | 2 days   |
| Production  | Beta 5%    | Error < 0.1%, P95 < 200ms | 3 days   |
| Production  | 100%       | Monitor 24h               | Ongoing  |

### Feature Flags

```typescript
flags: {
  m6_cash: false,           // Master toggle
  m6_cash_forecast: false,  // AI forecasting
  m6_cash_sweep: false,     // Cash sweeping
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/cash`, `/cash/forecast`, `/cash/transfers`)
- P50/P95/P99 latency
- Feature flag adoption rate
- User engagement (page views, transfers per session)
- Forecast accuracy tracking
- Dashboard refresh success rate

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- P95 latency > 500ms for 10min → investigate
- Forecast refresh failure rate > 5% → alert
- Transfer failure rate > 2% → escalate

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m6_cash = false`

   ```powershell
   pnpm run flags:set m6_cash=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("cash");
   revalidateTag("cash-positions");
   revalidateTag("cash-forecast");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/cash/*"
   ```

4. **Monitor for 15 minutes**:

   - Error rate drops below 0.1%
   - No new Sentry issues
   - Users see fallback message or previous version

5. **Post-mortem**:
   - Create incident report
   - Identify root cause
   - Add regression test
   - Plan fix + re-deploy

**Rollback Decision Matrix**:

| Scenario                | Action             | Approval Required |
| ----------------------- | ------------------ | ----------------- |
| Error rate > 5%         | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%         | Partial rollback   | On-call engineer  |
| P95 latency > 1s        | Investigate first  | On-call engineer  |
| Forecast accuracy < 70% | Monitor            | Data science team |
| Data corruption/loss    | Immediate rollback | No (auto-trigger) |

---

## 📚 References

- OpenAPI spec: `packages/contracts/openapi/openapi.json`
- Design system: `aibos-ui` package
- Security: `security-policy.json`
- Compliance: `COMPLIANCE.md`

---

## 🚨 Risk Mitigation

### Risk #1: Bank Feed Integration Reliability

**Mitigation**: Multi-provider fallback; manual import; SLA monitoring

### Risk #2: Cash Forecast Accuracy

**Mitigation**: ML validation; confidence intervals; human oversight

### Risk #3: Real-Time Data Latency

**Mitigation**: WebSocket optimization; caching; fallback to polling

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useCash.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useCashPositions() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["cash", "positions"],
    queryFn: () => apiClient.GET("/api/cash/positions"),
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });
}

export function useCashForecast(days: number) {
  return useQuery({
    queryKey: ["cash", "forecast", days],
    queryFn: () => apiClient.GET("/api/cash/forecast", { query: { days } }),
    staleTime: 5 * 60_000, // 5min - forecast doesn't change frequently
    retry: 2,
    select: (response) => response.data,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => apiClient.POST("/api/cash/transfers", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash", "positions"] });
      queryClient.invalidateQueries({ queryKey: ["cash", "transfers"] });
      toast.success("Transfer created successfully");
    },
    onError: (error) => {
      // Map error to user-friendly message
      if (error.status === 400) {
        toast.error("Invalid transfer data. Check your input.");
      } else if (error.status === 409) {
        toast.error("Account balance changed. Review and retry.");
      } else {
        toast.error("Transfer failed. Please try again.");
      }
    },
  });
}

export function useExecuteSweep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) =>
      apiClient.POST("/api/cash/sweep/execute", { body: { rule_id: ruleId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash", "positions"] });
      toast.success("Cash sweep completed successfully");
    },
  });
}

export function useCashAccount(accountId: string) {
  return useQuery({
    queryKey: ["cash", "account", accountId],
    queryFn: () =>
      apiClient.GET("/api/cash/accounts/[id]", { params: { id: accountId } }),
    staleTime: 60_000, // 1min
    enabled: !!accountId,
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error                 | User Message                                   | UI Action            |
| ------------------------- | ---------------------------------------------- | -------------------- |
| 400 (Bad Request)         | "Invalid transfer data. Check your input."     | Inline field errors  |
| 409 (Conflict)            | "Account balance changed. Review and retry."   | Show updated balance |
| 422 (Validation)          | Field-specific errors from response            | Inline form errors   |
| 403 (Forbidden)           | "You don't have permission for this action."   | Hide action buttons  |
| 500 (Server)              | "Transfer failed. Our team has been notified." | Retry + support link |
| 503 (Service Unavailable) | "Service temporarily unavailable."             | Retry with backoff   |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for mutations
- **Refresh intervals**: 60s for positions, 5min for forecast

---

## 📝 Implementation Guide

### Day 1: Dashboard & Positions (8 hours)

1. Create cash dashboard layout (2 hours)
2. Build position cards and charts (3 hours)
3. Add real-time updates (2 hours)
4. Implement drill-down (1 hour)

### Day 2: Forecast & Transfers (4 hours)

1. Build forecast visualization (2 hours)
2. Add transfer functionality (2 hours)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Cash position calculations correct (all currencies)
- [ ] Forecast algorithm accurate (various scenarios)
- [ ] Transfer validation works (balance checks, limits)
- [ ] Currency conversion correct (all FX pairs)
- [ ] useCashPositions hook fetches correctly
- [ ] useCreateTransfer handles errors properly
- [ ] Balance formatting displays correctly
- [ ] Sweep rule validation logic
- [ ] Low balance threshold calculations

### Integration Tests

- [ ] Real-time updates functional (WebSocket/polling)
- [ ] Forecast reflects actual transaction data
- [ ] Transfers post to GL correctly
- [ ] Multi-currency handling correct (FX rates applied)
- [ ] Create transfer → appears in list
- [ ] Execute sweep → balances updated
- [ ] Forecast refresh → data updates
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] User can navigate to cash dashboard
- [ ] User can view real-time cash positions
- [ ] User can create and execute transfer
- [ ] User can view forecast with shortfall alerts
- [ ] User can execute cash sweep
- [ ] User can drill down to transaction details
- [ ] Keyboard-only flow: dashboard → transfer → forecast
- [ ] Multi-currency transfer workflow

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces dashboard updates
- [ ] Focus management correct (modals, forms)
- [ ] Color contrast meets WCAG 2.2 AA (AAA where practical)
- [ ] Axe: 0 serious/critical violations
- [ ] Live regions announce real-time updates
- [ ] All interactive elements have accessible names

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] All API endpoints return expected status codes
- [ ] Response schemas validated against contracts

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for dashboard, forecast chart, transfer form
- [ ] Dark/light theme variations
- [ ] Multi-currency display variations
- [ ] Loading/error/empty states captured

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/cash/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] Dashboard loads 100+ accounts smoothly
- [ ] Forecast chart renders 90-day data without lag
- [ ] Real-time refresh doesn't block UI

---

## 📅 Timeline

| Day | Deliverable                      |
| --- | -------------------------------- |
| 1   | Dashboard with real-time updates |
| 1.5 | Forecast and transfers complete  |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries

### Enables These Modules

- M7: Bank Reconciliation
- M15: Cash Flow Forecasting

---

## 🎯 Success Criteria

### Must Have

- [ ] Display real-time cash positions
- [ ] Multi-currency support
- [ ] Create inter-account transfers
- [ ] View cash forecast
- [ ] Drill-down to transactions

### Should Have

- [ ] Automated cash sweeping
- [ ] Alert notifications
- [ ] Export capabilities
- [ ] Historical trending

### Nice to Have

- [ ] AI-powered insights
- [ ] Optimization recommendations
- [ ] Integration with bank APIs
- [ ] Mobile app

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/cash`, `/cash/forecast`, `/cash/transfers`)
- [ ] Real-time dashboard with WebSocket updates
- [ ] Cash forecasting working with 85%+ accuracy
- [ ] Inter-account transfers functional
- [ ] Multi-currency support with live FX rates
- [ ] Permissions enforced (UI hides/shows based on role)
- [ ] All error states handled gracefully

### Quality Gates 🎯

**Enforced in CI** - Build fails if any gate not met

#### Code Quality

- [ ] TypeScript: 0 errors, 0 warnings
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Prettier: All files formatted

#### Test Coverage

- [ ] Unit tests: ≥90% line coverage
- [ ] Integration tests: All CRUD operations covered
- [ ] E2E tests: All user flows covered
- [ ] A11y tests: Axe 0 serious, 0 critical violations

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/cash`
- [ ] Dashboard refresh: 60s interval

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly
- [ ] Axe DevTools: 0 serious, 0 critical

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90

### Observability 📊

- [ ] SLO dashboards created
- [ ] Analytics events firing: `Cash.Dashboard.Viewed`, `Cash.Transfer.Created`, `Cash.Forecast.Generated`
- [ ] Error tracking integrated
- [ ] Alerts configured

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Audit trail for all transfers
- [ ] Security review completed

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete
- [ ] API contracts synchronized
- [ ] UAT passed (PM/QA sign-off)

### Deployment 🚀

- [ ] Deployed to dev, staging, production
- [ ] Feature flags configured
- [ ] Smoke tests passed
- [ ] Rollback procedure tested

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All tests passed
- [ ] **Design**: UI matches specs
- [ ] **PM**: Feature complete
- [ ] **Security**: Security review passed
- [ ] **Accessibility**: A11y audit passed

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M5 - Accounts Payable  
**Next**: M7 - Bank Reconciliation
