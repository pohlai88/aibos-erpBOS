# 🚀 M32: Sublease Management - UI Implementation Runbook

**Module ID**: M32  
**Module Name**: Sublease Management  
**Priority**: MEDIUM  
**Phase**: 9 - Lease Accounting  
**Estimated Effort**: 2 days  
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

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-sublease-accounting], [ADR-###-rou-impairment], [ADR-###-sublease-income]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 12 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

**Sublease Management** (5 endpoints):

- ✅ `/api/subleases` - List subleases
- ✅ `/api/subleases/[id]` - Sublease details
- ✅ `/api/subleases/create` - Create sublease
- ✅ `/api/subleases/update` - Update sublease
- ✅ `/api/subleases/terminate` - Terminate sublease

**Income & Accounting** (4 endpoints):

- ✅ `/api/subleases/income` - Sublease income tracking
- ✅ `/api/subleases/income/schedule` - Income recognition schedule
- ✅ `/api/subleases/master-lease-link` - Link to master lease
- ✅ `/api/subleases/profitability` - Profitability analysis

**Impairment Testing** (3 endpoints):

- ✅ `/api/subleases/impairment` - Run impairment tests
- ✅ `/api/subleases/impairment/indicators` - Impairment indicators
- ✅ `/api/subleases/impairment/record` - Record impairment loss

**Total Endpoints**: 12 (3 categories)

### Risks & Blockers

| Risk                                 | Impact | Mitigation                                                  | Owner       |
| ------------------------------------ | ------ | ----------------------------------------------------------- | ----------- |
| Sublease income recognition accuracy | HIGH   | ASC 842 compliant straight-line recognition; external audit | @accounting |
| ROU impairment testing complexity    | HIGH   | Automated quarterly testing; external audit validation      | @accounting |
| Master lease linkage errors          | MED    | Validation rules; audit trail; manual review workflow       | @lease-ops  |
| Market rate estimation accuracy      | MED    | Third-party data integration; manual override capability    | @lease-ops  |

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

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                         | Target          | Measurement          |
| ------------------------------ | --------------- | -------------------- |
| TTFB (staging)                 | ≤ 70ms          | Server timing header |
| Client TTI for `/subleases`    | ≤ 200ms         | Lighthouse CI        |
| Impairment test computation    | < 3s            | Performance profiler |
| Income recognition calculation | < 1s            | API response time    |
| UI bundle size                 | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to forms and tables
- **Focus Management**: Focus trap in modals; form field navigation
- **ARIA**: Impairment alerts announced; income updates communicated
- **Screen Reader**: All sublease data announced; financial metrics described
- **Axe Target**: 0 serious/critical violations

### Security

| Layer         | Requirement                                            |
| ------------- | ------------------------------------------------------ |
| RBAC Scopes   | `subleases.read`, `subleases.write`, `subleases.admin` |
| Enforcement   | Server-side on all endpoints                           |
| Data Exposure | Only show sublease data user has permission to view    |
| Audit Trail   | Immutable audit logs for all sublease transactions     |
| Rate Limiting | Protect calculation endpoints; prevent abuse           |

#### UI Permissions Matrix

| Role            | View | Create | Modify | Test Impairment | Record Loss | Admin |
| --------------- | ---- | ------ | ------ | --------------- | ----------- | ----- |
| subleases.read  | ✅   | ❌     | ❌     | ❌              | ❌          | ❌    |
| subleases.write | ✅   | ✅     | ✅     | ✅              | ❌          | ❌    |
| subleases.admin | ✅   | ✅     | ✅     | ✅              | ✅          | ✅    |

### Reliability & Observability

- **SLO**: 99.9% income calculation accuracy; 99.9% impairment test reliability
- **SLA Dashboards**: Real-time metrics on sublease performance, impairment testing
- **Events Emitted**: `Subleases.Created`, `Subleases.ImpairmentTested`, `Subleases.ImpairmentRecorded`
- **Logging**: Structured logs with sublease IDs for all operations
- **Tracing**: Distributed tracing for impairment test workflows

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Sublease Accounting Rules (ASC 842)

| Rule                            | Enforcement                                                   |
| ------------------------------- | ------------------------------------------------------------- |
| **Income Recognition**          | Straight-line method over sublease term (ASC 842)             |
| **Master Lease Linkage**        | Every sublease must link to valid master lease                |
| **ROU Impairment Testing**      | Quarterly testing when sublease income < master lease expense |
| **Impairment Loss Recording**   | Record when carrying value > recoverable amount               |
| **Sublease Term Constraint**    | Sublease end date ≤ master lease end date                     |
| **Income vs. Expense Tracking** | Track sublease income separate from master lease expense      |

### Sublease States

- **Sublease**: Draft → Active → Modified → Terminated → Archived
- **Impairment Test**: Scheduled → Running → Passed / Failed → Recorded
- **Income Recognition**: Not Started → In Progress → Completed

### Archive Semantics

- **Sublease History**: Retain all sublease data (7-year minimum)
- **Impairment History**: Maintain complete impairment test audit trail
- **Guard Rails**:
  - ❌ Deny deletion of active subleases
  - ❌ Deny changes to historical impairment tests
  - ✅ Allow termination with proper accounting treatment

---

## 🚨 Error Handling & UX States

### All Possible States

| State                    | UI Display                          | User Action     |
| ------------------------ | ----------------------------------- | --------------- |
| **Empty**                | "No subleases yet"                  | "Add Sublease"  |
| **Loading**              | Skeleton forms/tables               | N/A             |
| **Error**                | Error message + retry               | Retry / Support |
| **Draft**                | Gray badge "Draft"                  | Complete / Save |
| **Active**               | Green badge "Active"                | View / Modify   |
| **Impairment Indicator** | Orange badge "Impairment Indicator" | Run Test        |
| **Impaired**             | Red badge "Impaired"                | Record Loss     |
| **Terminated**           | Gray badge "Terminated"             | View history    |
| **Permission Denied**    | "Access restricted"                 | Back            |

### Form Validation

- **Sublease Terms**: Validate end date ≤ master lease end date
- **Financial Data**: Validate income > 0, proper accounting treatment
- **Master Lease Link**: Validate master lease exists and is active

### Network Errors

| HTTP Status | UI Message                                            | Action              |
| ----------- | ----------------------------------------------------- | ------------------- |
| 400         | "Invalid sublease data. Check your inputs."           | Inline field errors |
| 401         | "Session expired. Please log in again."               | Redirect to login   |
| 403         | "You don't have permission for sublease operations."  | Hide action         |
| 404         | "Sublease or master lease not found."                 | Return to list      |
| 409         | "Sublease was modified. Review changes."              | Show diff modal     |
| 422         | "Validation failed. Check sublease term constraints." | Inline errors       |
| 500         | "Calculation failed. Our team has been notified."     | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/subleases.json`.

### Page Titles & Headers

| Context        | Copy                      | i18n Key                        |
| -------------- | ------------------------- | ------------------------------- |
| Dashboard      | "Sublease Management"     | `subleases.dashboard.title`     |
| Income Tracker | "Sublease Income Tracker" | `subleases.income.title`        |
| Impairment     | "ROU Impairment Testing"  | `subleases.impairment.title`    |
| Opportunities  | "Sublease Opportunities"  | `subleases.opportunities.title` |

### State Messages

| State                | Title                  | Message                                   | Action Button  | i18n Key                 |
| -------------------- | ---------------------- | ----------------------------------------- | -------------- | ------------------------ |
| Empty                | "No subleases yet"     | "Add your first sublease to track income" | "Add Sublease" | `subleases.empty.*`      |
| Impairment Indicator | "Impairment indicator" | "Run impairment test to assess ROU asset" | "Run Test"     | `subleases.impairment.*` |
| Impaired             | "ROU asset impaired"   | "Record impairment loss"                  | "Record Loss"  | `subleases.impaired.*`   |

### Success Messages (Toast)

| Action            | Message                                 | i18n Key                       | Shortcut |
| ----------------- | --------------------------------------- | ------------------------------ | -------- |
| Sublease Created  | "Sublease for '{subtenant}' created"    | `subleases.create.success`     | `n`      |
| Impairment Tested | "Impairment test completed"             | `subleases.impairment.success` | `t`      |
| Loss Recorded     | "Impairment loss of ${amount} recorded" | `subleases.loss.success`       | `r`      |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useSubleases.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useSubleases(filters = {}) {
  return useQuery({
    queryKey: ["subleases", "list", filters],
    queryFn: () => apiClient.GET("/api/subleases", { query: filters }),
    staleTime: 5 * 60_000, // 5min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useSublease(id: string) {
  return useQuery({
    queryKey: ["subleases", "detail", id],
    queryFn: () => apiClient.GET("/api/subleases/[id]", { params: { id } }),
    staleTime: 10 * 60_000, // 10min
    retry: 2,
    enabled: !!id,
    select: (response) => response.data,
  });
}

export function useCreateSublease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (subleaseData: any) =>
      apiClient.POST("/api/subleases/create", { body: subleaseData }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subleases"] });
      toast.success(`Sublease for '${data.subtenant_name}' created`);
    },
    onError: () => {
      toast.error("Failed to create sublease.");
    },
  });
}

export function useSubleaseIncome(filters = {}) {
  return useQuery({
    queryKey: ["subleases", "income", filters],
    queryFn: () => apiClient.GET("/api/subleases/income", { query: filters }),
    staleTime: 5 * 60_000, // 5min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useImpairmentTesting() {
  return useQuery({
    queryKey: ["subleases", "impairment"],
    queryFn: () => apiClient.GET("/api/subleases/impairment"),
    staleTime: 1 * 60_000, // 1min (frequent testing)
    retry: 2,
    select: (response) => response.data,
  });
}

export function useRunImpairmentTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lease_id: string) =>
      apiClient.POST("/api/subleases/impairment", { body: { lease_id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subleases", "impairment"] });
      toast.success("Impairment test completed");
    },
    onError: () => {
      toast.error("Impairment test failed.");
    },
  });
}

export function useRecordImpairmentLoss() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      apiClient.POST("/api/subleases/impairment/record", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subleases"] });
      toast.success(`Impairment loss of $${data.amount} recorded`);
    },
    onError: () => {
      toast.error("Failed to record impairment loss.");
    },
  });
}
```

### Error Mapping

| API Error         | User Message                                          | UI Action            |
| ----------------- | ----------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid sublease data. Check your inputs."           | Inline field errors  |
| 409 (Conflict)    | "Sublease was modified. Review changes."              | Show diff modal      |
| 422 (Validation)  | "Validation failed. Check sublease term constraints." | Inline errors        |
| 403 (Forbidden)   | "You don't have permission for sublease operations."  | Hide action          |
| 500 (Server)      | "Calculation failed. Our team has been notified."     | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for calculations

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["subleases", "list", { filters }][("subleases", "detail", subleaseId)][
  ("subleases", "income", { filters })
][("subleases", "impairment")];
```

### Invalidation Rules

| Action              | Invalidates                                    |
| ------------------- | ---------------------------------------------- |
| Create Sublease     | `["subleases"]` (all)                          |
| Modify Sublease     | `["subleases"]`, `["subleases", "detail", id]` |
| Run Impairment Test | `["subleases", "impairment"]`                  |
| Record Impairment   | `["subleases"]`, `["subleases", "impairment"]` |
| Terminate Sublease  | `["subleases"]`                                |

### Stale Time

| Query Type      | Stale Time | Reasoning                           |
| --------------- | ---------- | ----------------------------------- |
| Sublease List   | 5min       | Moderate update frequency           |
| Sublease Detail | 10min      | Less frequently changed             |
| Income Tracking | 5min       | Active income monitoring            |
| Impairment      | 1min       | Frequent testing during quarter-end |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("subleases");
revalidateTag("sublease-income");
revalidateTag("sublease-impairment");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/subleases.fixtures.ts`

**Datasets**:

- `minimalSubleases`: 3 subleases (active, impaired, terminated)
- `standardSubleases`: 20 subleases across all states
- `complexSubleases`: 50+ subleases with varied scenarios
- `edgeCases`: Edge cases (short-term, break-even, highly profitable)

**Edge Cases Covered**:

- Subleases with income > master lease payment (profitable)
- Subleases with income < master lease payment (impairment indicator)
- Subleases terminating before master lease
- Multiple subleases on same master lease

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
- **Interactive Parts**: Mark with `"use client"` (forms, impairment testing)

### Data Fetching Strategy

| Scenario        | Strategy                          | Benefit          |
| --------------- | --------------------------------- | ---------------- |
| Sublease List   | Server-side fetch + stream        | Faster TTFB      |
| Income Tracker  | Client-side with real-time update | Live metrics     |
| Impairment Test | Client-side mutation              | Instant feedback |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function createSublease(subleaseData: any) {
  // ... mutation logic
  revalidateTag("subleases");
  revalidateTag("sublease-income");
}
```

---

## 📊 Analytics & Audit Events

| Event                        | When                      | Properties                                           |
| ---------------------------- | ------------------------- | ---------------------------------------------------- |
| Subleases.Created            | Sublease created          | `sublease_id`, `master_lease_id`, `subtenant_name`   |
| Subleases.ImpairmentTested   | Impairment test run       | `sublease_id`, `test_result`, `impairment_amount`    |
| Subleases.ImpairmentRecorded | Impairment loss recorded  | `sublease_id`, `impairment_loss`, `journal_entry_id` |
| Subleases.Terminated         | Sublease terminated       | `sublease_id`, `termination_date`, `reason`          |
| Subleases.IncomeRecognized   | Income recognition posted | `sublease_id`, `period`, `income_amount`             |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Subleases.ImpairmentTested", {
  sublease_id: "sub_123",
  test_result: "failed",
  impairment_amount: 50000,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/subleases.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Currency**: Support multiple currencies for international subleases

### Keyboard Shortcuts

| Key      | Action              | Scope           |
| -------- | ------------------- | --------------- |
| `/`      | Focus search        | Any page        |
| `n`      | New sublease        | Sublease list   |
| `t`      | Run impairment test | Impairment page |
| `r`      | Record loss         | Impairment page |
| `↑ / ↓`  | Navigate list       | Any list        |
| `Enter`  | Open item           | Any list        |
| `Escape` | Close modal/cancel  | Modal/Form      |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateSubleaseModal()],
  ["t", () => runImpairmentTest()],
  ["r", () => recordImpairmentLoss()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                      | Duration | Rollback Trigger |
| ----------- | ---------------- | ----------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                      | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, income calc accuracy 100%         | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, impairment tests working correctly | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 1 week, accounting validation complete    | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m32_subleases: false,                    // Master toggle
  m32_subleases_impairment: false,         // Impairment testing
  m32_subleases_opportunities: false,      // Opportunity identifier
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Income calculation accuracy (100% required)
- Impairment test reliability
- Sublease dashboard load time
- Master lease linkage accuracy

**Alert Thresholds**:

- Income calculation error → immediate investigation
- Impairment test failure → escalate
- Dashboard load > 5s → performance issue

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m32_subleases = false`

   ```powershell
   pnpm run flags:set m32_subleases=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("subleases");
   revalidateTag("sublease-income");
   revalidateTag("sublease-impairment");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/subleases/*"
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
| Income calculation error    | Immediate rollback | No (auto-trigger) |
| Impairment test failure     | Immediate rollback | No (auto-trigger) |
| Master lease linkage error  | Immediate rollback | No (auto-trigger) |
| Dashboard performance > 10s | Immediate rollback | No (auto-trigger) |
| User complaints > 3         | Investigate first  | Sublease ops lead |

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

- ASC 842 sublease guidance (FASB)
- LeaseQuery: Sublease accounting
- CoStar: Sublease market intelligence
- Deloitte sublease impairment guidance

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Sublease Income Recognition Accuracy

**Mitigation**: ASC 842 compliant straight-line recognition; external audit validation; comprehensive test suite; parallel manual validation during pilot

### Risk #2: ROU Impairment Testing Complexity

**Mitigation**: Automated quarterly testing; external audit review of methodology; comprehensive impairment scenarios tested; impairment calculation engine validated

### Risk #3: Master Lease Linkage Errors

**Mitigation**: Validation rules; audit trail; manual review workflow for complex scenarios; automated reconciliation

### Risk #4: Market Rate Estimation Accuracy

**Mitigation**: Third-party data integration (CoStar, etc.); manual override capability; market data refresh frequency monitoring

---

## 📝 Implementation Guide

### Day 1: Income Tracker & Impairment (8 hours)

1. Build sublease income tracker with master lease linking (3 hours)
2. Implement ROU impairment testing workflow (3 hours)
3. Create impairment loss recording (2 hours)

### Day 2: Opportunities & Polish (8 hours)

1. Build opportunity identifier with AI scoring (3 hours)
2. Implement market rate comparison (2 hours)
3. Add comprehensive testing (2 hours)
4. Polish UI and add analytics (1 hour)

**Total**: 2 days (16 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Sublease income recognition calculation (straight-line ASC 842)
- [ ] Impairment test logic (all scenarios)
- [ ] Opportunity scoring algorithm
- [ ] Master lease linkage validation
- [ ] Sublease term constraint checking
- [ ] Income vs. expense reconciliation logic

### Integration Tests

- [ ] Sublease creation and tracking (complete lifecycle)
- [ ] Impairment testing workflow (schedule → run → record)
- [ ] Income recognition posting
- [ ] Master lease linkage updates
- [ ] Portfolio aggregations

### E2E Tests

- [ ] User can create sublease linked to master lease
- [ ] User can track sublease income
- [ ] User can run impairment test
- [ ] User can record impairment loss
- [ ] User can identify sublease opportunities
- [ ] User can view profitability analysis

### Accessibility Tests

- [ ] Keyboard navigation works (forms, tables, impairment testing)
- [ ] Screen reader announces impairment alerts
- [ ] Focus management correct (modals, forms)
- [ ] Color contrast meets WCAG 2.2 AAA
- [ ] Axe: 0 serious/critical violations

### Contract Tests

- [ ] API calls match OpenAPI spec
- [ ] Income calculations match accounting standards

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for all components

### Performance Tests

- [ ] Bundle size < 250KB gzipped
- [ ] TTFB ≤ 70ms on staging
- [ ] Impairment test computation < 3s
- [ ] Income recognition calculation < 1s

---

## 📅 Timeline & Milestones

| Day | Tasks                                               | Deliverable                         | Flag Status |
| --- | --------------------------------------------------- | ----------------------------------- | ----------- |
| 1   | Setup + Hooks + Income Tracker + Master Linking     | Sublease income tracking functional | WIP         |
| 2   | Impairment testing + Opportunities + Tests + Polish | Production-ready module             | GA          |

**Total Effort**: 2 days (16 hours)

---

## 🔗 Dependencies

### Must Complete Before Starting

- ✅ M31: Lease Accounting (for master lease data)
- 🆕 ASC 842 sublease income recognition engine
- 🆕 ROU impairment testing framework

### Blocks These Modules

- M33: Sale-Leaseback (related lease transactions)

---

## 🎯 Success Criteria

### Must Have (Measurable)

- [ ] Sublease income tracking with master lease matching (100% accuracy)
- [ ] Automated ROU asset impairment testing (quarterly)
- [ ] Sublease portfolio dashboard with profitability analysis
- [ ] Income recognition accuracy: 100% (straight-line ASC 842)
- [ ] Impairment test reliability: 99.9%
- [ ] Master lease linkage: 100% validated
- [ ] Axe: 0 serious/critical violations

### Should Have

- [ ] Opportunity identification with AI scoring
- [ ] Market rate comparison (CoStar integration)
- [ ] Impairment journal entry generation
- [ ] Income vs. expense reconciliation report
- [ ] Export to Excel/PDF

### Nice to Have

- [ ] Tenant matching AI (find suitable subtenants)
- [ ] Sublease listing generation (automated marketing)
- [ ] Integration with property listing platforms
- [ ] What-if scenario analysis (sublease profitability)

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/subleases/*`)
- [ ] All CRUD operations working (Create, Read, Update, Terminate)
- [ ] Sublease income tracker with master lease linking
- [ ] ROU impairment testing with quarterly schedule
- [ ] Impairment loss recording with journal entries
- [ ] Opportunity identifier with AI scoring
- [ ] Profitability analysis (income vs. expense)
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

- [ ] Unit tests: ≥90% line coverage, ≥95% for income & impairment logic
- [ ] Integration tests: All sublease lifecycle events covered
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- [ ] Sublease income recognition flow (straight-line ASC 842)
- [ ] ROU impairment testing flow
- [ ] Impairment loss recording flow
- [ ] Master lease linkage validation

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/subleases/*` routes
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/subleases`
- [ ] Impairment test computation: < 3s
- [ ] Income recognition calculation: < 1s

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

- [ ] Sublease income recognition: 100% accuracy (straight-line ASC 842)
- [ ] Impairment test calculations: 100% accuracy
- [ ] Master lease linkage: 100% validated
- [ ] Income vs. expense reconciliation: 100% accurate

**Validation**: External auditor review of sublease accounting methodology

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `Subleases.Created`
  - `Subleases.ImpairmentTested`
  - `Subleases.ImpairmentRecorded`
  - `Subleases.Terminated`
  - `Subleases.IncomeRecognized`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (income errors, impairment test failures)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Audit trail immutable (7-year retention)
- [ ] Rate limiting tested (calculation endpoints)
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] ASC 842 sublease compliance verified

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized
- [ ] i18n keys documented
- [ ] External auditor documentation package (sublease methodology)
- [ ] UAT passed (PM/QA sign-off)

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m32_subleases = false` (ready to enable)
  - `flags.m32_subleases_impairment = false`
  - `flags.m32_subleases_opportunities = false`
- [ ] Smoke tests passed on staging
- [ ] Load tests passed (≥1000 concurrent users, 100+ subleases)
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
- [ ] **Finance/Accounting**: Income recognition & impairment methodology verified

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M31 - Lease Accounting  
**Next**: M33 - Sale-Leaseback
