# 🚀 M26: Recurring Billing - UI Implementation Runbook

**Module ID**: M26  
**Module Name**: Recurring Billing  
**Priority**: MEDIUM  
**Phase**: 7 - Payments & Billing  
**Estimated Effort**: 1 day  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Recurring Billing manages **subscription-based billing** with automated invoice generation, proration, and revenue recognition integration.

### Business Value

- Automated subscription billing cycles
- Proration and plan changes
- Dunning management for failed payments
- Revenue recognition automation
- Customer self-service plan management

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-subscription-billing], [ADR-###-proration], [ADR-###-revenue-recognition]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 13 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

**Subscription Management** (5 endpoints):

- ✅ `/api/subscriptions` - List subscriptions
- ✅ `/api/subscriptions/[id]` - Subscription details
- ✅ `/api/subscriptions/create` - Create subscription
- ✅ `/api/subscriptions/update` - Update subscription
- ✅ `/api/subscriptions/cancel` - Cancel subscription

**Billing & Invoicing** (4 endpoints):

- ✅ `/api/billing/run` - Execute billing run
- ✅ `/api/billing/schedule` - Billing schedule
- ✅ `/api/billing/preview` - Preview upcoming charges
- ✅ `/api/billing/history` - Billing run history

**Plans & Pricing** (2 endpoints):

- ✅ `/api/plans` - List billing plans
- ✅ `/api/plans/[id]` - Plan details

**Revenue Recognition** (2 endpoints):

- ✅ `/api/revenue/recognize` - Revenue recognition schedule
- ✅ `/api/revenue/deferred` - Deferred revenue report

**Total Endpoints**: 13 (4 categories)

### Risks & Blockers

| Risk                                   | Impact   | Mitigation                                                       | Owner    |
| -------------------------------------- | -------- | ---------------------------------------------------------------- | -------- |
| Proration calculation accuracy         | HIGH     | Comprehensive test coverage; reference implementation validation | @backend |
| Revenue recognition ASC 606 compliance | CRITICAL | Integration with M12; audit trail; accounting review             | @finance |
| Billing timing and timezone handling   | HIGH     | UTC-based scheduling; customer timezone support; cron monitoring | @backend |
| Failed payment dunning                 | MED      | Integration with M24; automated retry; notification workflows    | @backend |
| MRR/ARR calculation accuracy           | HIGH     | Automated tests; financial reconciliation; monthly audits        | @finance |

---

## 🎯 3 Killer Features

### 1. **Subscription Management Dashboard** 🔄

**Description**: Visual dashboard for managing all subscription plans, billing cycles, and customer subscriptions.

**Why It's Killer**:

- Drag-and-drop plan builder
- Automated billing runs
- Real-time MRR tracking
- Churn analysis
- Better than Stripe Billing

**Implementation**:

```typescript
import { DataTable, Card, Chart } from "aibos-ui";

export default function SubscriptionDashboard() {
  const { subscriptions } = useSubscriptions();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>MRR</h3>
          <div className="text-3xl">{formatCurrency(subscriptions.mrr)}</div>
          <Badge variant="success">+{subscriptions.mrr_growth}%</Badge>
        </Card>
        <Card>
          <h3>Active Subscriptions</h3>
          <div className="text-3xl">{subscriptions.active_count}</div>
        </Card>
        <Card>
          <h3>Churn Rate</h3>
          <div className="text-3xl">{subscriptions.churn_rate}%</div>
        </Card>
        <Card>
          <h3>ARR</h3>
          <div className="text-3xl">{formatCurrency(subscriptions.arr)}</div>
        </Card>
      </div>

      <Chart
        type="line"
        data={subscriptions.mrr_trend}
        title="MRR Trend (12 Months)"
      />
    </div>
  );
}
```

### 2. **Automated Billing Runs** ⚡

**Description**: Scheduled billing runs with automatic invoice generation and payment processing.

**Why It's Killer**:

- Automated monthly/annual billing
- Smart proration calculations
- Failed payment retry logic
- Automatic revenue recognition
- Industry-first billing automation

**Implementation**:

```typescript
import { Button, Card, Timeline } from "aibos-ui";

export default function BillingRuns() {
  const { runs, execute } = useBillingRuns();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h3>Next Billing Run</h3>
            <p>Scheduled for {runs.next_run_date}</p>
          </div>
          <Button onClick={execute} variant="primary">
            Run Billing Now
          </Button>
        </div>
      </Card>

      <Timeline
        items={runs.history.map((run) => ({
          date: run.date,
          title: `Billing Run #${run.number}`,
          description: `${run.invoices_created} invoices, ${formatCurrency(
            run.total_amount
          )}`,
          status: run.status,
        }))}
      />
    </div>
  );
}
```

### 3. **Revenue Recognition Integration** 📊

**Description**: Automatic revenue recognition journal entries based on subscription billing.

**Why It's Killer**:

- ASC 606 compliant revenue recognition
- Automatic deferred revenue tracking
- Revenue waterfall visualization
- Integration with M12
- Better than manual revenue recognition

**Implementation**:

```typescript
import { Chart, Card } from "aibos-ui";

export default function RevenueRecognition() {
  const { revenue } = useSubscriptionRevenue();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Recognized This Month</h3>
          <div className="text-3xl">{formatCurrency(revenue.recognized)}</div>
        </Card>
        <Card>
          <h3>Deferred Revenue</h3>
          <div className="text-3xl">{formatCurrency(revenue.deferred)}</div>
        </Card>
        <Card>
          <h3>Unbilled Revenue</h3>
          <div className="text-3xl">{formatCurrency(revenue.unbilled)}</div>
        </Card>
      </div>

      <Chart
        type="waterfall"
        data={revenue.waterfall}
        title="Revenue Movement"
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
**File**: `apps/web/app/(dashboard)/subscriptions/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                          | Target          | Measurement          |
| ------------------------------- | --------------- | -------------------- |
| TTFB (staging)                  | ≤ 70ms          | Server timing header |
| Client TTI for `/subscriptions` | ≤ 200ms         | Lighthouse CI        |
| Dashboard load                  | < 1s            | Performance profiler |
| Billing run execution           | < 30s           | Background job       |
| MRR calculation                 | < 2s            | Performance profiler |
| UI bundle size                  | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to subscription management
- **Focus Management**: Focus trap in subscription forms; visible indicators
- **ARIA**: Billing status announced; MRR metrics communicated
- **Screen Reader**: All subscription details announced; billing actions described
- **Axe Target**: 0 serious/critical violations

### Security

| Layer          | Requirement                                       |
| -------------- | ------------------------------------------------- |
| RBAC Scopes    | `billing.read`, `billing.manage`, `billing.admin` |
| Enforcement    | Server-side on all endpoints                      |
| Data Exposure  | Only show subscriptions for authorized customers  |
| Sensitive Data | Encrypt payment details; secure revenue data      |
| Audit Trail    | All subscription changes logged                   |
| Rate Limiting  | Protect billing runs; prevent abuse               |

#### UI Permissions Matrix

| Role           | View | Create | Update | Cancel | Run Billing | View Revenue |
| -------------- | ---- | ------ | ------ | ------ | ----------- | ------------ |
| billing.read   | ✅   | ❌     | ❌     | ❌     | ❌          | ✅           |
| billing.manage | ✅   | ✅     | ✅     | ✅     | ❌          | ✅           |
| billing.admin  | ✅   | ✅     | ✅     | ✅     | ✅          | ✅           |

### Reliability & Observability

- **SLO**: 99.9% successful billing runs; 100% revenue recognition accuracy
- **SLA Dashboards**: Real-time metrics on billing success, MRR/ARR trends
- **Events Emitted**: `Billing.SubscriptionCreated`, `Billing.InvoiceGenerated`, `Billing.RunCompleted`
- **Logging**: Structured logs with subscription IDs for all operations
- **Tracing**: Distributed tracing for billing workflows
- **Monitoring**: Billing run success rate; MRR accuracy; revenue recognition integrity

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Recurring Billing Rules

| Rule                        | Enforcement                                                 |
| --------------------------- | ----------------------------------------------------------- |
| **Proration Accuracy**      | Calculate prorated amounts using standard daily proration   |
| **Billing Cycle Timing**    | Bill on customer's billing anniversary; respect timezone    |
| **Revenue Recognition**     | Recognize revenue evenly over subscription period (ASC 606) |
| **Subscription Changes**    | Apply immediately with proration or at next billing cycle   |
| **Failed Payment Handling** | Retry 3 times over 7 days; trigger dunning after failures   |
| **MRR/ARR Calculation**     | MRR = sum of active monthly subscriptions; ARR = MRR × 12   |
| **Cancellation**            | Immediate or end-of-period; no refunds unless specified     |
| **Plan Changes**            | Upgrade immediate; downgrade at renewal; prorate difference |

### Billing Workflow

- **Status**: Draft → Active → Past Due → Cancelled/Expired
- **Billing Cycle**: Monthly, Quarterly, Annual, Custom
- **Proration**: Daily calculation; credit unused time; charge new plan prorated
- **Revenue Recognition**: Deferred → Recognized evenly over period → Completed

### Archive Semantics

- **Subscription History**: Retain all subscription data indefinitely
- **Audit Trail**: Maintain full audit trail of all changes
- **Guard Rails**:
  - ❌ Deny delete of active subscriptions
  - ❌ Deny modification of historical billing runs
  - ✅ Allow cancel of active subscriptions

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                            | User Action     |
| --------------------- | ------------------------------------- | --------------- |
| **Empty**             | "No subscriptions"                    | "Create"        |
| **Loading**           | Skeleton table                        | N/A             |
| **Error**             | Error message + retry                 | Retry / Support |
| **Draft**             | Gray badge "Draft"                    | Activate        |
| **Active**            | Green badge "Active"                  | Manage          |
| **Trial**             | Blue badge "Trial ({days} days left)" | Convert         |
| **Past Due**          | Red badge "Past Due"                  | Retry payment   |
| **Cancelled**         | Gray badge "Cancelled"                | View details    |
| **Expired**           | Gray badge "Expired"                  | Renew           |
| **Permission Denied** | "Access restricted"                   | Back            |

### Form Validation

- **Plan Selection**: Required; must be valid active plan
- **Billing Cycle**: Required; validate against plan options
- **Start Date**: Must be future date or today
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal

### Network Errors

| HTTP Status | UI Message                                                   | Action              |
| ----------- | ------------------------------------------------------------ | ------------------- |
| 400         | "Invalid subscription data. Check your input."               | Inline field errors |
| 401         | "Session expired. Please log in again."                      | Redirect to login   |
| 403         | "You don't have permission to manage subscriptions."         | Hide action         |
| 404         | "Subscription not found."                                    | Return to list      |
| 409         | "Subscription already exists for this customer."             | Show existing       |
| 422         | "Validation failed."                                         | Inline errors       |
| 500         | "Subscription operation failed. Our team has been notified." | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/billing.json`.

### Page Titles & Headers

| Context       | Copy                  | i18n Key                      |
| ------------- | --------------------- | ----------------------------- |
| Dashboard     | "Recurring Billing"   | `billing.dashboard.title`     |
| Subscriptions | "Subscriptions"       | `billing.subscriptions.title` |
| Billing Runs  | "Billing Runs"        | `billing.runs.title`          |
| Revenue       | "Revenue Recognition" | `billing.revenue.title`       |
| Plans         | "Billing Plans"       | `billing.plans.title`         |

### State Messages

| State     | Title                    | Message                                         | Action Button  | i18n Key              |
| --------- | ------------------------ | ----------------------------------------------- | -------------- | --------------------- |
| Empty     | "No subscriptions"       | "Create your first subscription"                | "Create"       | `billing.empty.*`     |
| Active    | "Active subscription"    | "Next billing date: {date}"                     | "Manage"       | `billing.active.*`    |
| Trial     | "Trial period"           | "Trial ends on {date}"                          | "Convert"      | `billing.trial.*`     |
| Past Due  | "Payment failed"         | "Payment failed. Please update payment method." | "Retry"        | `billing.pastDue.*`   |
| Cancelled | "Subscription cancelled" | "Access until {date}"                           | "View Details" | `billing.cancelled.*` |

### Success Messages (Toast)

| Action                 | Message                                             | i18n Key                 |
| ---------------------- | --------------------------------------------------- | ------------------------ |
| Subscription Created   | "Subscription created successfully"                 | `billing.create.success` |
| Plan Changed           | "Plan changed to {plan}. Prorated amount: {amount}" | `billing.change.success` |
| Billing Run Completed  | "Billing run completed: {count} invoices generated" | `billing.run.success`    |
| Subscription Cancelled | "Subscription cancelled"                            | `billing.cancel.success` |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useBilling.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useSubscriptions(filters = {}) {
  return useQuery({
    queryKey: ["billing", "subscriptions", filters],
    queryFn: () => apiClient.GET("/api/subscriptions", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      customer_id: string;
      plan_id: string;
      start_date: string;
    }) => apiClient.POST("/api/subscriptions/create", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      toast.success("Subscription created successfully");
    },
    onError: () => {
      toast.error("Failed to create subscription.");
    },
  });
}

export function useBillingRuns() {
  return useQuery({
    queryKey: ["billing", "runs"],
    queryFn: () => apiClient.GET("/api/billing/schedule"),
    staleTime: 60_000, // 1min
    select: (response) => response.data,
  });
}

export function useExecuteBillingRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient.POST("/api/billing/run"),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      toast.success(
        `Billing run completed: ${data.invoices_created} invoices generated`
      );
    },
    onError: () => {
      toast.error("Billing run failed.");
    },
  });
}

export function useRevenueRecognition() {
  return useQuery({
    queryKey: ["billing", "revenue"],
    queryFn: () => apiClient.GET("/api/revenue/recognize"),
    staleTime: 60_000, // 1min
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error         | User Message                                                 | UI Action            |
| ----------------- | ------------------------------------------------------------ | -------------------- |
| 400 (Bad Request) | "Invalid subscription data. Check your input."               | Inline field errors  |
| 409 (Duplicate)   | "Subscription already exists for this customer."             | Show existing        |
| 422 (Validation)  | "Validation failed."                                         | Inline errors        |
| 403 (Forbidden)   | "You don't have permission to manage subscriptions."         | Hide action          |
| 500 (Server)      | "Subscription operation failed. Our team has been notified." | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 60s for billing run mutations

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["billing", "subscriptions", { filters }][
  ("billing", "subscription", subscriptionId)
][("billing", "runs")][("billing", "revenue")][("billing", "plans")];
```

### Invalidation Rules

| Action              | Invalidates                                                       |
| ------------------- | ----------------------------------------------------------------- |
| Create Subscription | `["billing"]` (all)                                               |
| Update Subscription | `["billing", "subscriptions"]`, `["billing", "subscription", id]` |
| Run Billing         | `["billing"]` (all)                                               |
| Cancel Subscription | `["billing", "subscriptions"]`                                    |

### Stale Time

| Query Type          | Stale Time | Reasoning                         |
| ------------------- | ---------- | --------------------------------- |
| Subscriptions       | 30s        | Moderate update frequency         |
| Subscription Detail | 1min       | Changes less frequently           |
| Billing Runs        | 1min       | Historical data; moderate updates |
| Revenue Recognition | 1min       | Financial data; moderate updates  |
| Plans               | 5min       | Changes rarely                    |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("billing-subscriptions");
revalidateTag("billing-revenue");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/billing.fixtures.ts`

**Datasets**:

- `minimalBilling`: 3 subscriptions (active, trial, cancelled)
- `standardBilling`: 15 subscriptions with billing history
- `complexBilling`: 30+ subscriptions with revenue recognition
- `edgeCases`: Edge cases (proration, plan changes, failures)

**Edge Cases Covered**:

- Mid-cycle plan changes with proration
- Failed payment retry scenarios
- Subscription cancellation timing
- Revenue recognition schedules
- Annual to monthly conversion
- Trial period expiry

```typescript
// Example fixture
export const standardBillingFixture: BillingFixture = {
  subscriptions: [
    {
      id: "sub_1",
      customer_id: "cust_1",
      plan_id: "plan_pro",
      status: "active",
      billing_cycle: "monthly",
      amount: 99.0,
      next_billing_date: "2025-11-01",
      mrr_contribution: 99.0,
    },
    // ... more subscriptions
  ],
  mrr: 14850.0,
  arr: 178200.0,
  churn_rate: 2.5,
};
```

### E2E Seed Data

**Location**: `tests/seeds/billing.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:billing
```

**Dataset**:

- 20 subscriptions (various statuses)
- 5 billing plans (monthly, annual)
- Billing run history
- Revenue recognition schedules

**Cleanup Command**:

```powershell
pnpm run seed:billing:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic "Demo Corp" subscriptions
- 15 subscriptions across all statuses
- MRR/ARR calculations
- Revenue recognition examples
- Proration demonstrations

**Regeneration**:

```powershell
pnpm run demo:reset:billing
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] MRR/ARR calculations correct
- [ ] Proration calculations validated
- [ ] Revenue recognition schedules accurate
- [ ] All customers exist

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
- **Interactive Parts**: Mark with `"use client"` (subscription forms, billing runs)

### Data Fetching Strategy

| Scenario             | Strategy                            | Benefit             |
| -------------------- | ----------------------------------- | ------------------- |
| Initial Dashboard    | Server-side fetch + stream          | Faster TTFB         |
| Subscription Actions | Client-side with optimistic updates | Instant feedback    |
| Revenue Reports      | Server component with client charts | SEO + interactivity |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function createSubscription(data) {
  // ... mutation logic
  revalidateTag("billing-subscriptions");
}
```

---

## 📊 Analytics & Audit Events

| Event                         | When                   | Properties                                                   |
| ----------------------------- | ---------------------- | ------------------------------------------------------------ |
| Billing.SubscriptionCreated   | Subscription created   | `subscription_id`, `customer_id`, `plan_id`, `amount`        |
| Billing.PlanChanged           | Plan changed           | `subscription_id`, `old_plan`, `new_plan`, `prorated_amount` |
| Billing.RunCompleted          | Billing run done       | `run_id`, `invoices_created`, `total_amount`, `duration_ms`  |
| Billing.SubscriptionCancelled | Subscription cancelled | `subscription_id`, `reason`, `effective_date`                |
| Revenue.Recognized            | Revenue recognized     | `subscription_id`, `amount`, `period`                        |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Billing.SubscriptionCreated", {
  subscription_id: "sub_123",
  customer_id: "cust_456",
  plan_id: "plan_pro",
  amount: 99.0,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/billing.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency**: Format per customer locale
- **RTL Support**: CSS logical properties; test with Arabic locale

### Keyboard Shortcuts

| Key      | Action              | Scope               |
| -------- | ------------------- | ------------------- |
| `/`      | Focus search        | Any page            |
| `n`      | Create subscription | Subscription list   |
| `r`      | Run billing         | Billing runs        |
| `c`      | Cancel subscription | Subscription detail |
| `↑ / ↓`  | Navigate list       | Subscription list   |
| `Enter`  | Open subscription   | Subscription list   |
| `Escape` | Close modal/cancel  | Modal/Form          |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateModal()],
  ["r", () => runBilling()],
  ["c", () => cancelSubscription()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort               | Success Criteria                                                 | Duration | Rollback Trigger |
| ----------- | -------------------- | ---------------------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers       | Manual QA passes                                                 | 1 day    | Critical bugs    |
| Staging     | QA team + PM         | All E2E tests pass, billing run success ≥99.9%                   | 2 days   | Test failures    |
| Production  | Beta customers (5%)  | Error rate < 0.1%, billing success ≥99.9%, revenue accurate 100% | 3 days   | SLO breach       |
| Production  | All customers (100%) | Monitor for 24h, error budget maintained                         | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m26_billing: false,                      // Master toggle
  m26_billing_runs: false,                 // Automated billing runs
  m26_billing_proration: false,            // Proration calculations
  m26_billing_revenue: false,              // Revenue recognition
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Billing run success rate (≥99.9% required)
- MRR/ARR accuracy (100% required)
- Revenue recognition accuracy (100% required)
- Proration calculation accuracy
- Failed payment rate

**Alert Thresholds**:

- Billing run failure → immediate page
- MRR/ARR discrepancy > 0.1% → finance alert
- Revenue recognition mismatch → finance alert
- Proration errors > 1% → investigate

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m26_billing = false`

   ```powershell
   pnpm run flags:set m26_billing=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("billing-subscriptions");
   revalidateTag("billing-revenue");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/subscriptions/*"
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

| Scenario                     | Action             | Approval Required |
| ---------------------------- | ------------------ | ----------------- |
| Billing run failure          | Immediate rollback | No (auto-trigger) |
| MRR/ARR calculation error    | Immediate rollback | No (auto-trigger) |
| Revenue recognition mismatch | Immediate rollback | No (auto-trigger) |
| Proration errors > 5%        | Immediate rollback | No (auto-trigger) |
| Customer complaints > 10     | Investigate first  | On-call engineer  |

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

- Stripe: Subscription billing UX
- Chargebee: Proration calculations
- Zuora: Revenue recognition
- ASC 606: Revenue recognition standards

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Proration Calculation Accuracy

**Mitigation**: Comprehensive test coverage; reference implementation validation; automated financial reconciliation

### Risk #2: Revenue Recognition ASC 606 Compliance

**Mitigation**: Integration with M12; audit trail; accounting review; monthly financial reconciliation

### Risk #3: Billing Timing and Timezone Handling

**Mitigation**: UTC-based scheduling; customer timezone support; cron monitoring; retry mechanisms

### Risk #4: MRR/ARR Calculation Accuracy

**Mitigation**: Automated tests; financial reconciliation; monthly audits; dashboard accuracy validation

---

## 📝 Implementation Guide

### Day 1: Subscription Management & Billing Runs & Revenue (8 hours)

1. Build subscription management dashboard (3 hours)
2. Implement billing run interface (2 hours)
3. Add revenue recognition visualizations (3 hours)

**Total**: 1 day (8 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Proration calculation accuracy
- [ ] MRR/ARR calculation
- [ ] Revenue recognition schedules
- [ ] Billing cycle timing
- [ ] Plan change logic

### Integration Tests

- [ ] Create subscription → first invoice generated
- [ ] Change plan → proration calculated correctly
- [ ] Run billing → invoices created
- [ ] Cancel subscription → access until period end
- [ ] Revenue recognition → journal entries created

### E2E Tests

- [ ] User can create subscription
- [ ] User can change plan
- [ ] User can run billing
- [ ] User can view revenue recognition
- [ ] User can cancel subscription
- [ ] Keyboard-only flow: create → manage → cancel

---

## 📅 Timeline

| Day | Deliverable                            |
| --- | -------------------------------------- |
| 1   | Subscriptions + Billing Runs + Revenue |

**Total**: 1 day (8 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M4: Accounts Receivable (for invoicing)
- ✅ M12: Revenue Recognition (for ASC 606 integration)
- ✅ M23: Payment Processing (for payment gateway)

### Enables These Modules

- M25: Customer Portal (subscription self-service)

---

## 🎯 Success Criteria

### Must Have

- [ ] Subscription management
- [ ] Automated billing runs
- [ ] Proration calculations
- [ ] Revenue recognition integration
- [ ] MRR/ARR tracking
- [ ] Billing success ≥99.9%, Revenue accuracy 100%

### Should Have

- [ ] Plan change workflows
- [ ] Trial period management
- [ ] Failed payment dunning
- [ ] Subscription analytics

### Nice to Have

- [ ] Usage-based billing
- [ ] Add-ons and overages
- [ ] Multi-currency subscriptions
- [ ] Subscription forecasting

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created (`/subscriptions`, `/subscriptions/[id]`, `/billing/runs`, `/revenue`)
- [ ] Subscription management working
- [ ] Billing runs working
- [ ] Proration working
- [ ] Revenue recognition working
- [ ] MRR/ARR tracking working
- [ ] Permissions enforced
- [ ] All error states handled
- [ ] Copy deck implemented

### Quality Gates 🎯

**Enforced in CI** - Build fails if any gate not met

#### Code Quality

- [ ] TypeScript: 0 errors, 0 warnings
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Prettier: All files formatted

#### Test Coverage

- [ ] Unit tests: ≥90% line coverage
- [ ] Integration tests: All billing operations covered
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/subscriptions`
- [ ] Billing run: < 30s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90

### Observability 📊

- [ ] SLO dashboards created
- [ ] All analytics events firing
- [ ] Error tracking integrated
- [ ] Performance monitoring active

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced
- [ ] Payment data encrypted
- [ ] Audit trail complete
- [ ] ASC 606 compliance validated

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All tests passed
- [ ] **Design**: UI matches specs
- [ ] **PM**: Feature complete
- [ ] **Security**: Security review passed
- [ ] **Accessibility**: A11y audit passed
- [ ] **Finance**: Revenue recognition validated (ASC 606)
- [ ] **Accounting**: MRR/ARR calculations approved

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M25 - Customer Portal  
**Next**: M27 - SOX Controls
