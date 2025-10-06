# 🚀 M24: AR Collections - UI Implementation Runbook

**Module ID**: M24  
**Module Name**: AR Collections  
**Priority**: HIGH  
**Phase**: 7 - Payments & Billing  
**Estimated Effort**: 1 day  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

AR Collections manages **automated collections workflows** with AI-powered prioritization, dunning sequences, and collector performance tracking.

### Business Value

- AI-powered collection prioritization
- Automated dunning email sequences
- Collector workload management
- Collections performance analytics
- Integration with customer portal and payments

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-ai-collections], [ADR-###-dunning-workflows], [ADR-###-collections-performance]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 27 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

**Collections Priority** (7 endpoints):

- ✅ `/api/collections/priority` - AI-powered priority queue
- ✅ `/api/collections/customers` - Collections customer list
- ✅ `/api/collections/customer/[id]` - Customer collection details
- ✅ `/api/collections/call-log` - Log collection call
- ✅ `/api/collections/promise` - Record payment promise
- ✅ `/api/collections/assign` - Assign to collector
- ✅ `/api/collections/escalate` - Escalate to manager

**Dunning Workflows** (6 endpoints):

- ✅ `/api/dunning/sequences` - List dunning sequences
- ✅ `/api/dunning/create` - Create sequence
- ✅ `/api/dunning/[id]` - Sequence details
- ✅ `/api/dunning/trigger` - Manually trigger dunning
- ✅ `/api/dunning/pause` - Pause sequence
- ✅ `/api/dunning/templates` - Email templates

**Collections Performance** (6 endpoints):

- ✅ `/api/collections/metrics` - Overall metrics
- ✅ `/api/collections/collectors` - Collector performance
- ✅ `/api/collections/trends` - Historical trends
- ✅ `/api/collections/goals` - Collection goals
- ✅ `/api/collections/forecast` - Collections forecast
- ✅ `/api/collections/leaderboard` - Collector leaderboard

**Aging & Reports** (5 endpoints):

- ✅ `/api/collections/aging` - Aging report
- ✅ `/api/collections/dso` - DSO analysis
- ✅ `/api/collections/activity` - Collection activity log
- ✅ `/api/collections/disputes` - Dispute tracking
- ✅ `/api/collections/write-offs` - Write-off management

**Integration** (3 endpoints):

- ✅ `/api/collections/payment-apply` - Apply payment
- ✅ `/api/collections/portal-link` - Generate portal link
- ✅ `/api/collections/sync-status` - Sync payment status

**Total Endpoints**: 27 (5 categories)

### Risks & Blockers

| Risk                                 | Impact   | Mitigation                                                        | Owner         |
| ------------------------------------ | -------- | ----------------------------------------------------------------- | ------------- |
| AI model accuracy for prioritization | HIGH     | Continuous model training; human oversight; confidence scores     | @data-science |
| Email deliverability for dunning     | HIGH     | SPF/DKIM/DMARC setup; deliverability monitoring; bounce handling  | @ops          |
| Customer relationship damage         | CRITICAL | Tone analysis; escalation rules; opt-out capability; human review | @collections  |
| TCPA compliance for calls/emails     | HIGH     | Consent tracking; opt-out management; call time restrictions      | @legal        |
| Collector workload distribution      | MED      | Automated assignment; load balancing; capacity planning           | @collections  |

---

## 🎯 3 Killer Features

### 1. **AI Collections Prioritization** 🤖

**Description**: AI-powered customer ranking based on payment probability, relationship value, and collection likelihood.

**Why It's Killer**:

- ML-based payment probability scoring
- Customer lifetime value weighting
- Optimal contact timing recommendations
- Automated work queue generation
- Industry-first AI-powered collections

**Implementation**:

```typescript
import { DataTable, Badge, Card, Chart } from "aibos-ui";

export default function CollectionsPriority() {
  const { customers, call } = useCollectionsPriority();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>High Priority</h3>
          <div className="text-3xl text-red-600">
            {customers.high_priority_count}
          </div>
          <div className="text-sm">
            {formatCurrency(customers.high_priority_amount)}
          </div>
        </Card>
        <Card>
          <h3>Expected Collections</h3>
          <div className="text-3xl text-green-600">
            {formatCurrency(customers.expected_today)}
          </div>
        </Card>
        <Card>
          <h3>Success Rate</h3>
          <div className="text-3xl">{customers.success_rate}%</div>
        </Card>
        <Card>
          <h3>Avg DSO</h3>
          <div className="text-3xl">{customers.avg_dso} days</div>
        </Card>
      </div>

      <DataTable
        data={customers.list}
        columns={[
          { key: "customer", label: "Customer" },
          { key: "amount_due", label: "Amount Due", render: formatCurrency },
          { key: "days_overdue", label: "Days Overdue" },
          {
            key: "ai_score",
            label: "AI Score",
            render: (score) => (
              <Badge
                variant={
                  score > 70
                    ? "success"
                    : score > 40
                    ? "warning"
                    : "destructive"
                }
              >
                {score}%
              </Badge>
            ),
          },
          { key: "best_contact_time", label: "Best Time" },
          {
            key: "actions",
            label: "Actions",
            render: (_, row) => (
              <Button size="sm" onClick={() => call(row.id)}>
                Call Now
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
```

### 2. **Automated Dunning Workflows** 📧

**Description**: Multi-touch automated email sequences with escalation rules and payment links.

**Why It's Killer**:

- Multi-level dunning sequences
- Personalized email templates
- Automatic escalation rules
- Embedded payment links
- Better than manual dunning emails

**Implementation**:

```typescript
import { Timeline, Card, Form, Button } from "aibos-ui";

export default function DunningWorkflows() {
  const { sequences, create } = useDunningSequences();

  return (
    <div className="space-y-6">
      <Card>
        <h3>Create Dunning Sequence</h3>
        <Form onSubmit={create}>
          <Input label="Sequence Name" name="name" />
          <Select
            label="Trigger"
            options={["15 days overdue", "30 days", "60 days"]}
            name="trigger"
          />
          <Timeline
            items={[
              { day: 0, action: "Friendly reminder email" },
              { day: 7, action: "Payment request with link" },
              { day: 14, action: "Escalation to manager" },
              { day: 21, action: "Final notice" },
            ]}
          />
          <Button type="submit">Create Sequence</Button>
        </Form>
      </Card>

      <DataTable
        data={sequences}
        columns={[
          { key: "name", label: "Sequence" },
          { key: "active_customers", label: "Active" },
          { key: "success_rate", label: "Success Rate" },
          { key: "avg_days_to_payment", label: "Avg Days" },
        ]}
      />
    </div>
  );
}
```

### 3. **Collections Performance Dashboard** 📊

**Description**: Real-time collections metrics with collector performance tracking and trend analysis.

**Why It's Killer**:

- Collector performance leaderboard
- Collections efficiency metrics
- Trend analysis and forecasting
- Goal tracking and alerts
- Better than manual collections tracking

**Implementation**:

```typescript
import { Chart, Card, DataTable } from "aibos-ui";

export default function CollectionsPerformance() {
  const { metrics } = useCollectionsMetrics();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Collections This Month</h3>
          <div className="text-4xl">
            {formatCurrency(metrics.month_collected)}
          </div>
          <Badge variant="success">
            +{metrics.vs_last_month}% vs last month
          </Badge>
        </Card>
        <Card>
          <h3>DSO Improvement</h3>
          <div className="text-4xl text-green-600">
            -{metrics.dso_improvement} days
          </div>
        </Card>
        <Card>
          <h3>Success Rate</h3>
          <div className="text-4xl">{metrics.success_rate}%</div>
        </Card>
      </div>

      <Chart
        type="line"
        data={metrics.trend}
        title="Collections Trend (12 Months)"
      />

      <Card>
        <h3>Collector Performance</h3>
        <DataTable
          data={metrics.collectors}
          columns={[
            { key: "name", label: "Collector" },
            { key: "collected", label: "Collected", render: formatCurrency },
            { key: "calls_made", label: "Calls" },
            { key: "success_rate", label: "Success %" },
            { key: "avg_dso", label: "Avg DSO" },
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

#### 1. Main Page (`/[module]/[page]`)

**Components**: DataTable, Button, Card, Form
**File**: `apps/web/app/(dashboard)/[module]/page.tsx`

#### 2. Detail Page (`/[module]/[id]`)

**Components**: Form, Button, Card, Badge
**File**: `apps/web/app/(dashboard)/collections/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                        | Target          | Measurement          |
| ----------------------------- | --------------- | -------------------- |
| TTFB (staging)                | ≤ 70ms          | Server timing header |
| Client TTI for `/collections` | ≤ 200ms         | Lighthouse CI        |
| AI priority calculation       | < 2s            | Performance profiler |
| Dashboard load                | < 1s            | Performance profiler |
| Aging report generation       | < 3s            | User perception      |
| UI bundle size                | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to collections queue, dunning workflows
- **Focus Management**: Focus trap in call log modals; visible indicators
- **ARIA**: Collection status announced; AI scores communicated
- **Screen Reader**: All customer details announced; dunning actions described
- **Axe Target**: 0 serious/critical violations

### Security

| Layer           | Requirement                                                                        |
| --------------- | ---------------------------------------------------------------------------------- |
| RBAC Scopes     | `collections.read`, `collections.call`, `collections.approve`, `collections.admin` |
| Enforcement     | Server-side on all endpoints                                                       |
| Data Exposure   | Only show collections for authorized customers                                     |
| Sensitive Data  | Customer contact info encrypted; call recordings secured                           |
| Audit Trail     | All collection activities logged                                                   |
| TCPA Compliance | Consent tracking; opt-out management; call time restrictions                       |

#### UI Permissions Matrix

| Role                | View | Call | Log Activity | Dunning | Escalate | Write-Off | Admin |
| ------------------- | ---- | ---- | ------------ | ------- | -------- | --------- | ----- |
| collections.read    | ✅   | ❌   | ❌           | ❌      | ❌       | ❌        | ❌    |
| collections.call    | ✅   | ✅   | ✅           | ❌      | ❌       | ❌        | ❌    |
| collections.approve | ✅   | ✅   | ✅           | ✅      | ✅       | ❌        | ❌    |
| collections.admin   | ✅   | ✅   | ✅           | ✅      | ✅       | ✅        | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful dunning emails; AI model accuracy ≥80%
- **SLA Dashboards**: Real-time metrics on collections success, DSO trends
- **Events Emitted**: `Collection.Called`, `Collection.PromiseRecorded`, `Dunning.Sent`
- **Logging**: Structured logs with correlation IDs for all collection activities
- **Tracing**: Distributed tracing for dunning workflows
- **Monitoring**: Collections success rate; dunning deliverability; AI model performance

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Collections Rules

| Rule                     | Enforcement                                                     |
| ------------------------ | --------------------------------------------------------------- |
| **Priority Scoring**     | AI model updates daily; confidence scores displayed             |
| **Dunning Timing**       | Respect customer preferences; time zone aware; business hours   |
| **Payment Promise**      | Track promise vs actual; alert on broken promises               |
| **Escalation Rules**     | Automatic escalation after 3 failed attempts or 60 days overdue |
| **Call Restrictions**    | TCPA compliance; no calls before 8am or after 9pm local time    |
| **Opt-Out Honor**        | Customer opt-out immediately stops all communications           |
| **Write-Off Approval**   | Requires manager approval; audit trail maintained               |
| **Collector Assignment** | Load balancing; expertise matching; workload caps               |

### Collections Workflow

- **Status**: New → Assigned → In Progress → Promise Made → Resolved/Escalated
- **Priority Levels**: Critical (60+ days) → High (30-59) → Medium (15-29) → Low (<15)
- **Dunning Sequence**: Day 1 (friendly) → Day 7 (payment link) → Day 14 (escalation) → Day 21 (final notice)
- **DSO Targets**: <45 days (excellent), 45-60 (good), 61-90 (needs improvement), >90 (critical)

### Archive Semantics

- **Collection History**: Retain all collection activities indefinitely
- **Audit Trail**: Maintain full audit trail of all communications
- **Guard Rails**:
  - ❌ Deny delete of collection history
  - ❌ Deny modification of call logs
  - ✅ Allow archive of resolved collections

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                             | User Action     |
| --------------------- | -------------------------------------- | --------------- |
| **Empty**             | "No collections pending"               | "View All"      |
| **Loading**           | Skeleton table                         | N/A             |
| **Error**             | Error message + retry                  | Retry / Support |
| **New**               | Blue badge "New"                       | Assign          |
| **Assigned**          | Yellow badge "Assigned to {collector}" | Call            |
| **In Progress**       | Orange badge "In Progress"             | Log activity    |
| **Promise Made**      | Green badge "Promise: {date}"          | Follow up       |
| **Paid**              | Green checkmark "Paid"                 | View details    |
| **Escalated**         | Red badge "Escalated to Manager"       | Review          |
| **Disputed**          | Purple badge "Disputed"                | Resolve dispute |
| **Written Off**       | Gray badge "Written Off"               | View reason     |
| **Permission Denied** | "Access restricted"                    | Back            |

### Form Validation

- **Payment Promise**: Validate date is future; reasonable timeframe
- **Call Log**: Required fields (contact method, outcome, notes)
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal

### Network Errors

| HTTP Status | UI Message                                              | Action              |
| ----------- | ------------------------------------------------------- | ------------------- |
| 400         | "Invalid collection data. Check your input."            | Inline field errors |
| 401         | "Session expired. Please log in again."                 | Redirect to login   |
| 403         | "You don't have permission to access collections."      | Hide action         |
| 404         | "Customer not found."                                   | Return to list      |
| 409         | "Collection was updated. Review changes."               | Show conflict modal |
| 422         | "Validation failed."                                    | Inline errors       |
| 500         | "Collection update failed. Our team has been notified." | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/collections.json`.

### Page Titles & Headers

| Context           | Copy                         | i18n Key                        |
| ----------------- | ---------------------------- | ------------------------------- |
| Main Page         | "Collections"                | `collections.main.title`        |
| Priority Queue    | "Collections Priority Queue" | `collections.priority.title`    |
| Customer Detail   | "Customer Collections"       | `collections.customer.title`    |
| Dunning Workflows | "Dunning Workflows"          | `collections.dunning.title`     |
| Performance       | "Collections Performance"    | `collections.performance.title` |

### State Messages

| State        | Title             | Message                                        | Action Button | i18n Key                  |
| ------------ | ----------------- | ---------------------------------------------- | ------------- | ------------------------- |
| Empty        | "No collections"  | "All customers are current"                    | "View All"    | `collections.empty.*`     |
| New          | "New collection"  | "Assign to collector"                          | "Assign"      | `collections.new.*`       |
| Assigned     | "Assigned"        | "Assigned to {collector}"                      | "Call Now"    | `collections.assigned.*`  |
| Promise Made | "Payment promise" | "Customer promised payment by {date}"          | "Follow Up"   | `collections.promise.*`   |
| Escalated    | "Escalated"       | "Escalated to {manager} on {date}"             | "Review"      | `collections.escalated.*` |
| Disputed     | "Disputed"        | "Customer disputes {amount}. Reason: {reason}" | "Resolve"     | `collections.disputed.*`  |

### Success Messages (Toast)

| Action           | Message                                    | i18n Key                      |
| ---------------- | ------------------------------------------ | ----------------------------- |
| Call Logged      | "Call logged successfully"                 | `collections.callLog.success` |
| Promise Recorded | "Payment promise recorded for {date}"      | `collections.promise.success` |
| Dunning Sent     | "Dunning email sent to {customer}"         | `collections.dunning.success` |
| Payment Applied  | "Payment of {amount} applied successfully" | `collections.payment.success` |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useCollections.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useCollectionsPriority(filters = {}) {
  return useQuery({
    queryKey: ["collections", "priority", filters],
    queryFn: () =>
      apiClient.GET("/api/collections/priority", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });
}

export function useLogCollectionCall() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      customer_id: string;
      method: string;
      outcome: string;
      notes: string;
    }) => apiClient.POST("/api/collections/call-log", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Call logged successfully");
    },
    onError: () => {
      toast.error("Failed to log call.");
    },
  });
}

export function useRecordPaymentPromise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      customer_id: string;
      promised_date: string;
      amount: number;
    }) => apiClient.POST("/api/collections/promise", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success(`Payment promise recorded for ${data.promised_date}`);
    },
    onError: () => {
      toast.error("Failed to record promise.");
    },
  });
}

export function useDunningSequences() {
  return useQuery({
    queryKey: ["collections", "dunning"],
    queryFn: () => apiClient.GET("/api/dunning/sequences"),
    staleTime: 5 * 60_000, // 5min
    select: (response) => response.data,
  });
}

export function useCollectionsMetrics() {
  return useQuery({
    queryKey: ["collections", "metrics"],
    queryFn: () => apiClient.GET("/api/collections/metrics"),
    staleTime: 60_000, // 1min
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error         | User Message                                            | UI Action            |
| ----------------- | ------------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid collection data. Check your input."            | Inline field errors  |
| 409 (Conflict)    | "Collection was updated. Review changes."               | Show conflict modal  |
| 422 (Validation)  | "Validation failed."                                    | Inline errors        |
| 403 (Forbidden)   | "You don't have permission to access collections."      | Hide action          |
| 500 (Server)      | "Collection update failed. Our team has been notified." | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for mutations

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["collections", "priority", { filters }][
  ("collections", "customer", customerId)
][("collections", "dunning")][("collections", "metrics")];
```

### Invalidation Rules

| Action         | Invalidates                                                  |
| -------------- | ------------------------------------------------------------ |
| Log Call       | `["collections"]` (all)                                      |
| Record Promise | `["collections", "priority"]`, `["collections", "customer"]` |
| Send Dunning   | `["collections", "dunning"]`                                 |
| Apply Payment  | `["collections"]` (all)                                      |

### Stale Time

| Query Type          | Stale Time | Reasoning                 |
| ------------------- | ---------- | ------------------------- |
| Priority Queue      | 30s        | Frequent status changes   |
| Customer Detail     | 1min       | Changes moderately        |
| Dunning Sequences   | 5min       | Sequences change rarely   |
| Collections Metrics | 1min       | Metrics update frequently |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("collections-priority");
revalidateTag("collections-metrics");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/collections.fixtures.ts`

**Datasets**:

- `minimalCollections`: 5 customers (various stages)
- `standardCollections`: 25 customers with complete workflows
- `complexCollections`: 50+ customers with AI scores, dunning, promises
- `edgeCases`: Edge cases (disputes, write-offs, broken promises)

**Edge Cases Covered**:

- Customer with broken payment promises
- Disputed collections
- Write-off scenarios
- TCPA opt-out compliance
- Multi-collector assignment
- Escalation workflows
- AI priority scoring edge cases

```typescript
// Example fixture
export const standardCollectionsFixture: CollectionFixture[] = [
  {
    id: "coll_1",
    customer: "Acme Corp",
    amount_due: 50000.0,
    days_overdue: 45,
    ai_score: 75,
    status: "assigned",
    collector_id: "user_1",
    priority: "high",
    best_contact_time: "2pm-4pm ET",
  },
  // ... more collections
];
```

### E2E Seed Data

**Location**: `tests/seeds/collections.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:collections
```

**Dataset**:

- 30 collection customers (various stages)
- Complete workflow (new → assigned → promise → resolved)
- Dunning sequences with templates
- Collector performance data
- Historical collection activities

**Cleanup Command**:

```powershell
pnpm run seed:collections:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic "Demo Corp" collection scenarios
- 20 customers across all priority levels
- AI prioritization examples
- Dunning workflow demonstrations
- Collector performance metrics
- Payment promise tracking

**Regeneration**:

```powershell
pnpm run demo:reset:collections
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] All customers exist in AR
- [ ] AI scores valid (0-100)
- [ ] Dunning timings comply with TCPA
- [ ] Collector assignments valid

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
- **Interactive Parts**: Mark with `"use client"` (call logging, dunning triggers)

### Data Fetching Strategy

| Scenario           | Strategy                            | Benefit             |
| ------------------ | ----------------------------------- | ------------------- |
| Initial List       | Server-side fetch + stream          | Faster TTFB         |
| Collection Actions | Client-side with optimistic updates | Instant feedback    |
| Metrics Dashboard  | Server component with client charts | SEO + interactivity |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function logCollectionCall(data) {
  // ... mutation logic
  revalidateTag("collections-priority");
}
```

---

## 📊 Analytics & Audit Events

| Event                      | When             | Properties                                         |
| -------------------------- | ---------------- | -------------------------------------------------- |
| Collection.Called          | Call logged      | `customer_id`, `collector_id`, `method`, `outcome` |
| Collection.PromiseRecorded | Promise recorded | `customer_id`, `promised_date`, `amount`           |
| Collection.Escalated       | Escalated        | `customer_id`, `escalated_to`, `reason`            |
| Dunning.Sent               | Email sent       | `customer_id`, `sequence_id`, `template_id`        |
| Collection.PaymentApplied  | Payment applied  | `customer_id`, `amount`, `payment_id`              |
| Collection.Disputed        | Dispute raised   | `customer_id`, `amount`, `reason`                  |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Collection.Called", {
  customer_id: "cust_123",
  collector_id: "user_456",
  method: "phone",
  outcome: "promise_made",
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/collections.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency**: Format per locale
- **RTL Support**: CSS logical properties; test with Arabic locale

### Keyboard Shortcuts

| Key      | Action             | Scope           |
| -------- | ------------------ | --------------- |
| `/`      | Focus search       | Any page        |
| `c`      | Log call           | Priority queue  |
| `p`      | Record promise     | Customer detail |
| `d`      | Send dunning       | Customer detail |
| `e`      | Escalate           | Customer detail |
| `↑ / ↓`  | Navigate list      | Priority queue  |
| `Enter`  | Open customer      | Priority queue  |
| `Escape` | Close modal/cancel | Modal/Form      |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["c", () => openCallLogModal()],
  ["p", () => recordPromise()],
  ["d", () => sendDunning()],
  ["e", () => escalate()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                                  | Duration | Rollback Trigger |
| ----------- | ---------------- | ----------------------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                                  | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, AI accuracy ≥80%, dunning deliverability ≥95% | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, collections success ≥70%, DSO improvement      | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained                          | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m24_collections: false,                  // Master toggle
  m24_collections_ai: false,               // AI prioritization
  m24_collections_dunning: false,          // Automated dunning
  m24_collections_performance: false,      // Performance dashboard
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/collections/*`)
- P50/P95/P99 latency
- Collections success rate (≥70% required)
- DSO improvement trend
- AI model accuracy (≥80% required)
- Dunning email deliverability (≥95% required)

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Collections success < 70% → investigate
- AI model accuracy < 80% → data science alert
- Dunning deliverability < 95% → ops alert

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m24_collections = false`

   ```powershell
   pnpm run flags:set m24_collections=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("collections-priority");
   revalidateTag("collections-metrics");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/collections/*"
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
| Error rate > 5%              | Immediate rollback | No (auto-trigger) |
| AI model accuracy < 70%      | Immediate rollback | No (auto-trigger) |
| Customer complaints > 10     | Partial rollback   | Collections lead  |
| TCPA violation detected      | Immediate rollback | No (auto-trigger) |
| Dunning deliverability < 80% | Investigate first  | On-call engineer  |

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

- Stripe: Dunning workflow inspiration
- Zuora: Collections automation
- TCPA: Telephone Consumer Protection Act compliance
- CAN-SPAM: Email marketing compliance
- FDCPA: Fair Debt Collection Practices Act

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: AI Model Accuracy for Prioritization

**Mitigation**: Continuous model training; human oversight; confidence scores displayed; fallback to rule-based prioritization

### Risk #2: Email Deliverability for Dunning

**Mitigation**: SPF/DKIM/DMARC setup; deliverability monitoring; bounce handling; sender reputation management

### Risk #3: Customer Relationship Damage

**Mitigation**: Tone analysis; escalation rules; opt-out capability; human review for high-value customers

### Risk #4: TCPA Compliance for Calls/Emails

**Mitigation**: Consent tracking; opt-out management; call time restrictions (8am-9pm local time); audit trail

---

## 📝 Implementation Guide

### Day 1: Collections Priority & Dunning (8 hours)

1. Build AI collections priority queue (3 hours)
2. Implement dunning workflows UI (3 hours)
3. Add collector performance dashboard (2 hours)

**Total**: 1 day (8 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] AI priority scoring calculation
- [ ] Dunning timing rules
- [ ] Payment promise validation
- [ ] TCPA compliance checks
- [ ] Collector assignment logic
- [ ] DSO calculation

### Integration Tests

- [ ] Log call → updates queue
- [ ] Record promise → triggers follow-up
- [ ] Send dunning → email delivered
- [ ] Apply payment → removes from queue
- [ ] Escalate → assigns to manager
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] User can view priority queue
- [ ] User can log collection call
- [ ] User can record payment promise
- [ ] User can trigger dunning email
- [ ] User can view performance metrics
- [ ] Keyboard-only flow: queue → call → log

---

## 📅 Timeline

| Day | Deliverable                            |
| --- | -------------------------------------- |
| 1   | Priority Queue + Dunning + Performance |

**Total**: 1 day (8 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M4: Accounts Receivable (for aging data)
- ✅ M23: Payment Processing (for payment application)

### Enables These Modules

- M25: Customer Portal (customer-facing collections)

---

## 🎯 Success Criteria

### Must Have

- [ ] AI collections priority queue
- [ ] Automated dunning workflows
- [ ] Collector performance tracking
- [ ] Payment promise management
- [ ] Collections success ≥70%, DSO < 60 days

### Should Have

- [ ] Dispute tracking
- [ ] Write-off management
- [ ] Collections forecasting
- [ ] Customer portal integration

### Nice to Have

- [ ] AI-powered contact timing
- [ ] Sentiment analysis for calls
- [ ] Predictive payment probability
- [ ] Integration with call center systems

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created (`/collections`, `/collections/priority`, `/collections/dunning`, `/collections/performance`)
- [ ] AI priority queue working
- [ ] Dunning workflows working
- [ ] Collector performance dashboard working
- [ ] Call logging working
- [ ] Payment promise tracking working
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
- [ ] Integration tests: All collection operations covered
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/collections`
- [ ] AI priority calculation: < 2s

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
- [ ] TCPA compliance validated
- [ ] Customer data encrypted
- [ ] Audit trail complete

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All tests passed
- [ ] **Design**: UI matches specs
- [ ] **PM**: Feature complete
- [ ] **Security**: Security review passed
- [ ] **Accessibility**: A11y audit passed
- [ ] **Collections**: Collections workflows approved
- [ ] **Legal**: TCPA compliance validated

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M23 - Payment Processing  
**Next**: M25 - Customer Portal
