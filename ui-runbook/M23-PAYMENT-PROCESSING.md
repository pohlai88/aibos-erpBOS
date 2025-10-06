# 🚀 M23: Payment Processing - UI Implementation Runbook

**Module ID**: M23  
**Module Name**: Payment Processing  
**Priority**: HIGH  
**Phase**: 7 - Payments & Billing  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Payment Processing handles **end-to-end payment workflows** including payment methods, batch processing, ACH/wire transfers, and payment reconciliation.

### Business Value

- Multi-channel payment processing (ACH, wire, check, card)
- Batch payment creation and approval
- Payment method vault with PCI compliance
- Automated payment reconciliation
- Real-time payment status tracking

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-payment-batch], [ADR-###-payment-vault], [ADR-###-ach-processing]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 32 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

**Payment Batches** (8 endpoints):

- ✅ `/api/payments/batches` - List payment batches
- ✅ `/api/payments/batches/create` - Create batch
- ✅ `/api/payments/batches/[id]` - Batch details
- ✅ `/api/payments/batches/approve` - Approve batch
- ✅ `/api/payments/batches/process` - Process batch
- ✅ `/api/payments/batches/cancel` - Cancel batch
- ✅ `/api/payments/batches/generate-file` - Generate ACH/wire file
- ✅ `/api/payments/batches/history` - Batch history

**Payment Methods** (6 endpoints):

- ✅ `/api/payments/methods` - List payment methods
- ✅ `/api/payments/methods/add` - Add payment method
- ✅ `/api/payments/methods/verify` - Verify bank account
- ✅ `/api/payments/methods/[id]` - Method details
- ✅ `/api/payments/methods/delete` - Remove method
- ✅ `/api/payments/methods/set-default` - Set default

**Individual Payments** (8 endpoints):

- ✅ `/api/payments` - List payments
- ✅ `/api/payments/[id]` - Payment details
- ✅ `/api/payments/create` - Create payment
- ✅ `/api/payments/update` - Update payment
- ✅ `/api/payments/void` - Void payment
- ✅ `/api/payments/status` - Get payment status
- ✅ `/api/payments/reconcile` - Reconcile payment
- ✅ `/api/payments/history` - Payment history

**Payment Scheduling** (5 endpoints):

- ✅ `/api/payments/schedule` - Get payment schedule
- ✅ `/api/payments/schedule/optimize` - Optimize schedule
- ✅ `/api/payments/schedule/create` - Schedule payment
- ✅ `/api/payments/schedule/update` - Update schedule
- ✅ `/api/payments/schedule/delete` - Delete schedule

**Reporting & Files** (5 endpoints):

- ✅ `/api/payments/reports/aging` - Aging report
- ✅ `/api/payments/reports/cash-flow` - Cash flow forecast
- ✅ `/api/payments/files/ach` - Generate ACH file
- ✅ `/api/payments/files/wire` - Generate wire file
- ✅ `/api/payments/files/positive-pay` - Positive pay file

**Total Endpoints**: 32 (5 categories)

### Risks & Blockers

| Risk                              | Impact   | Mitigation                                                            | Owner     |
| --------------------------------- | -------- | --------------------------------------------------------------------- | --------- |
| PCI compliance for payment vault  | CRITICAL | Use tokenization; no raw card data stored; external vault integration | @security |
| ACH file format compliance        | HIGH     | Follow NACHA standards; validation before generation; file testing    | @backend  |
| Payment timing & cut-off times    | HIGH     | Clear cut-off time display; timezone handling; same-day ACH support   | @backend  |
| Payment reconciliation complexity | MED      | Automated matching; manual review queue; audit trail                  | @backend  |
| Multi-currency payment support    | MED      | FX rate locking; multi-currency accounts; conversion tracking         | @backend  |

---

## 🎯 3 Killer Features

### 1. **Batch Payment Dashboard** 💳

**Description**: Visual batch payment interface with payment approval workflow and one-click ACH/wire file generation.

**Why It's Killer**:

- Create payment batches from AP aging
- Multi-approver workflow
- One-click ACH/NACHA file generation
- Real-time payment status tracking
- Better than Bill.com's payment interface

**Implementation**:

```typescript
import { DataTable, Button, Card, Badge } from "aibos-ui";

export default function BatchPaymentDashboard() {
  const { batches, createBatch, approve } = usePaymentBatches();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2>Payment Batches</h2>
        <Button onClick={createBatch} variant="primary">
          Create New Batch
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Total Payments Today</h3>
          <div className="text-3xl">{formatCurrency(batches.today_total)}</div>
        </Card>
        <Card>
          <h3>Pending Approval</h3>
          <div className="text-3xl text-orange-600">
            {batches.pending_count}
          </div>
        </Card>
        <Card>
          <h3>In Process</h3>
          <div className="text-3xl text-blue-600">
            {batches.processing_count}
          </div>
        </Card>
        <Card>
          <h3>Completed</h3>
          <div className="text-3xl text-green-600">
            {batches.completed_count}
          </div>
        </Card>
      </div>

      <DataTable
        data={batches.list}
        columns={[
          { key: "batch_number", label: "Batch #" },
          { key: "payment_count", label: "Payments" },
          { key: "total_amount", label: "Amount", render: formatCurrency },
          { key: "payment_method", label: "Method" },
          {
            key: "status",
            label: "Status",
            render: (val) => (
              <Badge
                variant={
                  val === "Approved"
                    ? "success"
                    : val === "Pending"
                    ? "warning"
                    : "default"
                }
              >
                {val}
              </Badge>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (_, row) =>
              row.status === "Pending" && (
                <Button size="sm" onClick={() => approve(row.id)}>
                  Approve
                </Button>
              ),
          },
        ]}
      />
    </div>
  );
}
```

### 2. **Payment Method Vault** 🔒

**Description**: Secure payment method vault with tokenization and PCI-compliant storage of bank accounts and cards.

**Why It's Killer**:

- PCI-compliant tokenization
- Bank account verification
- Multi-payment method support
- Automatic method selection
- Industry-first secure payment vault

**Implementation**:

```typescript
import { Card, DataTable, Button, Form } from "aibos-ui";

export default function PaymentMethodVault() {
  const { methods, addMethod } = usePaymentMethods();

  return (
    <div className="space-y-6">
      <Card>
        <h3>Add Payment Method</h3>
        <Form onSubmit={addMethod}>
          <Select
            label="Method Type"
            options={["ACH", "Wire", "Check", "Card"]}
            name="type"
          />
          <Input label="Bank Name" name="bank_name" />
          <Input label="Account Number" name="account_number" type="password" />
          <Input label="Routing Number" name="routing_number" />
          <Button type="submit">Add & Verify</Button>
        </Form>
      </Card>

      <DataTable
        data={methods}
        columns={[
          { key: "method_type", label: "Type" },
          { key: "last_four", label: "Account ***" },
          { key: "bank_name", label: "Bank" },
          {
            key: "verified",
            label: "Status",
            render: (val) => (
              <Badge variant={val ? "success" : "warning"}>
                {val ? "Verified" : "Pending"}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
```

### 3. **Automated Payment Scheduling** ⏰

**Description**: Smart payment scheduling with optimal payment date calculation and automated batch creation.

**Why It's Killer**:

- AI-optimized payment timing
- Cash flow aware scheduling
- Early payment discount capture
- Automatic batch creation
- Better than manual payment scheduling

**Implementation**:

```typescript
import { Chart, Card, Button } from "aibos-ui";

export default function PaymentScheduling() {
  const { schedule, optimize } = usePaymentSchedule();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h3>Payment Schedule</h3>
            <p className="text-muted">Optimized for cash flow and discounts</p>
          </div>
          <Button onClick={optimize} variant="primary">
            Optimize Schedule
          </Button>
        </div>
      </Card>

      <Chart
        type="timeline"
        data={schedule.upcoming}
        title="Upcoming Payments (30 Days)"
      />

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Next 7 Days</h3>
          <div className="text-3xl">{formatCurrency(schedule.next_7_days)}</div>
          <Badge variant="info">{schedule.next_7_count} payments</Badge>
        </Card>
        <Card>
          <h3>Discounts Available</h3>
          <div className="text-3xl text-green-600">
            {formatCurrency(schedule.discount_available)}
          </div>
        </Card>
        <Card>
          <h3>Projected Cash</h3>
          <div className="text-3xl">
            {formatCurrency(schedule.projected_cash)}
          </div>
        </Card>
      </div>
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
**File**: `apps/web/app/(dashboard)/payments/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                     | Target          | Measurement          |
| -------------------------- | --------------- | -------------------- |
| TTFB (staging)             | ≤ 70ms          | Server timing header |
| Client TTI for `/payments` | ≤ 200ms         | Lighthouse CI        |
| Batch load                 | < 1s            | Performance profiler |
| File generation (ACH/wire) | < 3s            | User perception      |
| Payment status check       | < 500ms         | APM traces           |
| UI bundle size             | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to batch operations, payment methods
- **Focus Management**: Focus trap in payment modals; visible indicators
- **ARIA**: Payment status announced; batch progress communicated
- **Screen Reader**: All payment details announced; ACH/wire generation described
- **Axe Target**: 0 serious/critical violations
- **Payment Interface**: Keyboard accessible; screen reader announces amounts

### Security

| Layer          | Requirement                                                          |
| -------------- | -------------------------------------------------------------------- |
| RBAC Scopes    | `payment.read`, `payment.create`, `payment.approve`, `payment.admin` |
| Enforcement    | Server-side on all endpoints                                         |
| Data Exposure  | Only show payments for authorized entities                           |
| Sensitive Data | Encrypt payment method details; PCI-compliant tokenization           |
| Audit Trail    | All payments, approvals, voids logged                                |
| PCI Compliance | No raw card data stored; use external vault; tokenization            |

#### UI Permissions Matrix

| Role            | View | Create | Approve | Void | Process | Generate Files | Admin |
| --------------- | ---- | ------ | ------- | ---- | ------- | -------------- | ----- |
| payment.read    | ✅   | ❌     | ❌      | ❌   | ❌      | ❌             | ❌    |
| payment.create  | ✅   | ✅     | ❌      | ❌   | ❌      | ❌             | ❌    |
| payment.approve | ✅   | ✅     | ✅      | ❌   | ✅      | ✅             | ❌    |
| payment.admin   | ✅   | ✅     | ✅      | ✅   | ✅      | ✅             | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful payments; 100% payment reconciliation accuracy
- **SLA Dashboards**: Real-time metrics on payment success, batch processing
- **Events Emitted**: `Payment.Created`, `Payment.Approved`, `Payment.Processed`
- **Logging**: Structured logs with correlation IDs for all payment operations
- **Tracing**: Distributed tracing for payment workflows
- **Monitoring**: Payment success rate; batch processing time; file generation success

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Payment Processing Rules

| Rule                            | Enforcement                                                      |
| ------------------------------- | ---------------------------------------------------------------- |
| **Payment Immutability**        | Once processed, payments are immutable; void creates reversal    |
| **Batch Approval**              | Batches require multi-level approval before processing           |
| **Cut-Off Time**                | Same-day ACH requires submission before 2pm ET; display timezone |
| **Payment Method Verification** | Bank accounts must be verified before use                        |
| **Duplicate Detection**         | Prevent duplicate payments; check vendor + amount + date         |
| **Reconciliation**              | All payments must reconcile with bank statements                 |
| **ACH/Wire Format**             | Follow NACHA/SWIFT standards; validate before generation         |
| **Void Rules**                  | Can only void unprocessed payments; processed requires reversal  |

### Payment Workflow

- **Status**: Draft → Pending Approval → Approved → Scheduled → Processing → Completed/Failed
- **Approval Routing**: Multi-level approval based on amount thresholds
- **Cut-Off Times**: ACH (2pm ET), Wire (4pm ET), Check (5pm ET)
- **Reconciliation**: Auto-match with bank statements; manual review queue

### Archive Semantics

- **Payment History**: Retain all payment records indefinitely
- **Audit Trail**: Maintain full audit trail of all payment operations
- **Guard Rails**:
  - ❌ Deny delete of processed payments
  - ❌ Deny modification of approved payments
  - ✅ Allow void of pending payments

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                        | User Action      |
| --------------------- | --------------------------------- | ---------------- |
| **Empty**             | "No payments"                     | "Create Payment" |
| **Loading**           | Skeleton table                    | N/A              |
| **Error**             | Error message + retry             | Retry / Support  |
| **Draft**             | Gray badge "Draft"                | Edit / Submit    |
| **Pending Approval**  | Yellow badge "Pending Approval"   | Approve          |
| **Approved**          | Green badge "Approved"            | Process          |
| **Scheduled**         | Blue badge "Scheduled for {date}" | View schedule    |
| **Processing**        | Orange badge "Processing"         | N/A              |
| **Completed**         | Green checkmark "Completed"       | View details     |
| **Failed**            | Red badge "Failed"                | Retry            |
| **Voided**            | Gray badge "Voided"               | View reason      |
| **Permission Denied** | "Access restricted"               | Back             |

### Form Validation

- **Amount**: Must be > 0; validate format
- **Payment Method**: Required; must be verified
- **Vendor**: Required; must exist
- **Server Errors**: Map 422 → inline field errors; 409 → duplicate detection modal

### Network Errors

| HTTP Status | UI Message                                               | Action               |
| ----------- | -------------------------------------------------------- | -------------------- |
| 400         | "Invalid payment data. Check your input."                | Inline field errors  |
| 401         | "Session expired. Please log in again."                  | Redirect to login    |
| 403         | "You don't have permission to create payments."          | Hide action          |
| 404         | "Payment not found."                                     | Return to list       |
| 409         | "Duplicate payment detected. Review existing payment."   | Show duplicate modal |
| 422         | "Payment validation failed."                             | Inline errors        |
| 500         | "Payment processing failed. Our team has been notified." | Retry button         |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/payment.json`.

### Page Titles & Headers

| Context         | Copy               | i18n Key                 |
| --------------- | ------------------ | ------------------------ |
| Main Page       | "Payments"         | `payment.main.title`     |
| Batch Dashboard | "Payment Batches"  | `payment.batch.title`    |
| Payment Detail  | "Payment Details"  | `payment.detail.title`   |
| Payment Methods | "Payment Methods"  | `payment.methods.title`  |
| Schedule        | "Payment Schedule" | `payment.schedule.title` |

### State Messages

| State             | Title                     | Message                                             | Action Button       | i18n Key                     |
| ----------------- | ------------------------- | --------------------------------------------------- | ------------------- | ---------------------------- |
| Empty             | "No payments"             | "Create your first payment"                         | "Create Payment"    | `payment.empty.*`            |
| Loading           | —                         | —                                                   | —                   | —                            |
| Error             | "Unable to load payments" | "Something went wrong. Our team has been notified." | "Retry" / "Support" | `payment.error.*`            |
| Draft             | "Draft"                   | "Complete and submit for approval"                  | "Edit"              | `payment.draft.*`            |
| Pending Approval  | "Pending approval"        | "Awaiting approval from {approver}"                 | "View Status"       | `payment.pendingApproval.*`  |
| Approved          | "Approved"                | "Approved by {approver} on {date}"                  | "Process"           | `payment.approved.*`         |
| Scheduled         | "Scheduled"               | "Scheduled for {date}"                              | "View Schedule"     | `payment.scheduled.*`        |
| Processing        | "Processing"              | "Payment is being processed"                        | —                   | `payment.processing.*`       |
| Completed         | "Completed"               | "Payment completed on {date}"                       | "View Details"      | `payment.completed.*`        |
| Failed            | "Failed"                  | "Payment failed: {reason}"                          | "Retry"             | `payment.failed.*`           |
| Voided            | "Voided"                  | "Payment voided by {user}"                          | "View Reason"       | `payment.voided.*`           |
| Permission Denied | "Access restricted"       | "You don't have permission to view this payment"    | "Back"              | `payment.permissionDenied.*` |

### Success Messages (Toast)

| Action             | Message                                        | i18n Key                  |
| ------------------ | ---------------------------------------------- | ------------------------- |
| Payment Created    | "Payment created successfully"                 | `payment.create.success`  |
| Payment Approved   | "Payment approved by {approver}"               | `payment.approve.success` |
| Payment Processed  | "Payment processed successfully"               | `payment.process.success` |
| Batch Created      | "Batch '{name}' created with {count} payments" | `payment.batch.success`   |
| ACH File Generated | "ACH file generated: {filename}"               | `payment.achFile.success` |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/usePayments.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function usePaymentBatches(filters = {}) {
  return useQuery({
    queryKey: ["payment", "batches", filters],
    queryFn: () => apiClient.GET("/api/payments/batches", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });
}

export function useCreateBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      payment_ids: string[];
      payment_method: string;
    }) => apiClient.POST("/api/payments/batches/create", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      toast.success(
        `Batch '${data.name}' created with ${data.payment_count} payments`
      );
    },
    onError: () => {
      toast.error("Failed to create batch.");
    },
  });
}

export function useApproveBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { batch_id: string; notes?: string }) =>
      apiClient.POST("/api/payments/batches/approve", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["payment"] });
      toast.success(`Batch approved successfully`);
    },
    onError: () => {
      toast.error("Approval failed.");
    },
  });
}

export function useGenerateACHFile() {
  return useMutation({
    mutationFn: (batch_id: string) =>
      apiClient.POST("/api/payments/files/ach", { body: { batch_id } }),
    onSuccess: (data) => {
      toast.success(`ACH file generated: ${data.filename}`);
      // Trigger file download
      window.location.href = data.download_url;
    },
    onError: () => {
      toast.error("ACH file generation failed.");
    },
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ["payment", "methods"],
    queryFn: () => apiClient.GET("/api/payments/methods"),
    staleTime: 5 * 60_000, // 5min
    select: (response) => response.data,
  });
}

export function useAddPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      type: string;
      bank_name: string;
      account_number: string;
      routing_number: string;
    }) => apiClient.POST("/api/payments/methods/add", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment", "methods"] });
      toast.success("Payment method added. Verification pending.");
    },
    onError: () => {
      toast.error("Failed to add payment method.");
    },
  });
}
```

### Error Mapping

| API Error         | User Message                                             | UI Action            |
| ----------------- | -------------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid payment data. Check your input."                | Inline field errors  |
| 409 (Duplicate)   | "Duplicate payment detected. Review existing payment."   | Show duplicate modal |
| 422 (Validation)  | "Payment validation failed."                             | Inline errors        |
| 403 (Forbidden)   | "You don't have permission to create payments."          | Hide action          |
| 500 (Server)      | "Payment processing failed. Our team has been notified." | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for mutations

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["payment", "batches", { filters }][("payment", "detail", paymentId)][
  ("payment", "methods")
][("payment", "schedule")];
```

### Invalidation Rules

| Action             | Invalidates              |
| ------------------ | ------------------------ |
| Create Payment     | `["payment"]` (all)      |
| Approve Batch      | `["payment", "batches"]` |
| Process Payment    | `["payment"]` (all)      |
| Add Payment Method | `["payment", "methods"]` |

### Stale Time

| Query Type       | Stale Time | Reasoning                   |
| ---------------- | ---------- | --------------------------- |
| Payment Batches  | 30s        | Frequent status changes     |
| Payment Detail   | 1min       | Changes less frequently     |
| Payment Methods  | 5min       | Methods change rarely       |
| Payment Schedule | 1min       | Schedule changes moderately |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("payment-batches");
revalidateTag("payment-methods");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/payment.fixtures.ts`

**Datasets**:

- `minimalPayments`: 5 payments (various methods)
- `standardPayments`: 30 payments with batches and approvals
- `complexPayments`: 50+ payments with scheduling and reconciliation
- `edgeCases`: Edge cases (duplicates, failures, voids)

**Edge Cases Covered**:

- Duplicate payment detection
- Failed payment scenario
- Voided payment with reversal
- Multi-level approval workflow
- ACH file generation
- Payment method verification
- Cut-off time validation

```typescript
// Example fixture
export const standardPaymentsFixture: PaymentFixture[] = [
  {
    id: "pay_1",
    vendor: "Acme Corp",
    amount: 10000.0,
    payment_method: "ACH",
    status: "approved",
    batch_id: "batch_1",
    scheduled_date: "2025-10-15",
    created_at: "2025-10-01T10:00:00Z",
  },
  // ... more payments
];
```

### E2E Seed Data

**Location**: `tests/seeds/payment.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:payment
```

**Dataset**:

- 25 payments (ACH, wire, check, card)
- Complete workflow (draft → approval → processing → complete)
- Payment batches with multi-level approvals
- Payment methods (verified and pending)
- Historical payments

**Cleanup Command**:

```powershell
pnpm run seed:payment:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic "Demo Corp" payment workflows
- 20 payments covering all payment types
- Batch payment examples
- Multi-level approval scenarios
- ACH/wire file generation
- Payment reconciliation examples

**Regeneration**:

```powershell
pnpm run demo:reset:payment
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] All vendors exist
- [ ] Payment amounts valid
- [ ] ACH files NACHA compliant
- [ ] Batch totals correct

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
- **Interactive Parts**: Mark with `"use client"` (batch operations, payment creation)

### Data Fetching Strategy

| Scenario        | Strategy                              | Benefit             |
| --------------- | ------------------------------------- | ------------------- |
| Initial List    | Server-side fetch + stream            | Faster TTFB         |
| Payment Actions | Client-side with optimistic updates   | Instant feedback    |
| Batch Detail    | Server component with client approval | SEO + interactivity |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function createPayment(data) {
  // ... mutation logic
  revalidateTag("payment-batches");
}
```

---

## 📊 Analytics & Audit Events

| Event             | When               | Properties                                   |
| ----------------- | ------------------ | -------------------------------------------- |
| Payment.Created   | Payment created    | `payment_id`, `amount`, `vendor`, `method`   |
| Payment.Approved  | Payment approved   | `payment_id`, `approver_id`, `approval_date` |
| Payment.Processed | Payment processed  | `payment_id`, `batch_id`, `processed_date`   |
| Payment.Failed    | Payment failed     | `payment_id`, `reason`, `error_code`         |
| Payment.Voided    | Payment voided     | `payment_id`, `voided_by`, `reason`          |
| Batch.Created     | Batch created      | `batch_id`, `payment_count`, `total_amount`  |
| ACH.FileGenerated | ACH file generated | `batch_id`, `filename`, `payment_count`      |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Payment.Created", {
  payment_id: "pay_123",
  amount: 10000.0,
  vendor: "Acme Corp",
  method: "ACH",
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/payment.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency**: Multi-currency support; format per locale
- **RTL Support**: CSS logical properties; test with Arabic locale

### Keyboard Shortcuts

| Key      | Action             | Scope           |
| -------- | ------------------ | --------------- |
| `/`      | Focus search       | Any page        |
| `n`      | Create payment     | Payment list    |
| `b`      | Create batch       | Batch dashboard |
| `a`      | Approve selected   | Batch list      |
| `g`      | Generate ACH file  | Batch detail    |
| `↑ / ↓`  | Navigate list      | Payment list    |
| `Enter`  | Open selected      | Payment list    |
| `Escape` | Close modal/cancel | Modal/Form      |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateModal()],
  ["b", () => createBatch()],
  ["a", () => approveBatch()],
  ["g", () => generateACHFile()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                      | Duration | Rollback Trigger |
| ----------- | ---------------- | ----------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                      | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, payment success ≥99%              | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, payment success ≥99%, no data loss | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained              | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m23_payment: false,                  // Master toggle
  m23_payment_batch: false,            // Batch payments
  m23_payment_vault: false,            // Payment method vault
  m23_payment_ach: false,              // ACH file generation
  m23_payment_scheduling: false,       // Payment scheduling
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/payments/*`)
- P50/P95/P99 latency
- Payment success rate (≥99% required)
- Batch processing time
- ACH file generation success
- Payment reconciliation accuracy (100% required)

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Payment success < 99% → investigate
- ACH file generation failure → immediate alert
- Reconciliation mismatch → finance alert

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m23_payment = false`

   ```powershell
   pnpm run flags:set m23_payment=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("payment-batches");
   revalidateTag("payment-methods");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/payments/*"
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
| Error rate > 5%             | Immediate rollback | No (auto-trigger) |
| Payment failure > 5%        | Immediate rollback | No (auto-trigger) |
| Data corruption/loss        | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%             | Partial rollback   | On-call engineer  |
| ACH file generation failure | Immediate rollback | No (auto-trigger) |
| PCI compliance violation    | Immediate rollback | No (auto-trigger) |

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

- Bill.com: Payment processing workflows
- Stripe: Payment method vault
- NACHA: ACH file standards
- SWIFT: Wire transfer standards
- PCI DSS: Payment card data security

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: PCI Compliance for Payment Vault

**Mitigation**: Use tokenization; no raw card data stored; external vault integration (Stripe, etc.); regular PCI audits

### Risk #2: ACH File Format Compliance

**Mitigation**: Follow NACHA standards; validation before generation; automated testing; file format verification

### Risk #3: Payment Timing & Cut-Off Times

**Mitigation**: Clear cut-off time display; timezone handling; same-day ACH support; cut-off warnings

### Risk #4: Payment Reconciliation Complexity

**Mitigation**: Automated matching; manual review queue; comprehensive audit trail; reconciliation reports

---

## 📝 Implementation Guide

### Day 1: Batch Dashboard & Payment Methods (8 hours)

1. Build batch payment dashboard with status cards (3 hours)
2. Implement payment method vault with tokenization (3 hours)
3. Add batch approval workflow (2 hours)

### Day 2: Payments & Scheduling (4 hours)

1. Build individual payment creation/editing (2 hours)
2. Implement payment scheduling with optimization (2 hours)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Payment amount validation
- [ ] Duplicate payment detection
- [ ] Batch approval routing
- [ ] ACH file format validation
- [ ] Payment method tokenization
- [ ] Cut-off time validation

### Integration Tests

- [ ] Create payment → appears in batch
- [ ] Approve batch → status changes
- [ ] Process payment → bank integration
- [ ] Generate ACH file → NACHA compliant
- [ ] Verify payment method → micro-deposits
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] User can create payment batch
- [ ] User can approve batch
- [ ] User can generate ACH file
- [ ] User can add payment method
- [ ] User can schedule payments
- [ ] Keyboard-only flow: create → approve → process

---

## 📅 Timeline

| Day | Deliverable                          |
| --- | ------------------------------------ |
| 1   | Batch Dashboard + Methods + Approval |
| 2   | Payments + Scheduling                |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M5: Accounts Payable (for payment creation from AP)
- ✅ M6: Cash Management (for bank account integration)

### Enables These Modules

- M24: AR Collections (payment application)
- M26: Recurring Billing (automated payments)

---

## 🎯 Success Criteria

### Must Have

- [ ] Batch payment dashboard
- [ ] Payment method vault (PCI-compliant)
- [ ] ACH/wire file generation
- [ ] Multi-level approval workflow
- [ ] Payment status tracking
- [ ] Payment success ≥99%, Reconciliation accuracy 100%

### Should Have

- [ ] Automated payment scheduling
- [ ] Early payment discount capture
- [ ] Payment reconciliation
- [ ] Positive pay file generation

### Nice to Have

- [ ] AI-optimized payment timing
- [ ] Fraud detection
- [ ] Multi-currency payments
- [ ] Integration with external payment providers

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created (`/payments`, `/payments/batches`, `/payments/methods`, `/payments/schedule`)
- [ ] Batch payment dashboard working
- [ ] Payment method vault working (PCI-compliant)
- [ ] ACH/wire file generation working
- [ ] Approval workflow working
- [ ] Payment scheduling working
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
- [ ] Integration tests: All payment operations covered
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/payments`
- [ ] File generation: < 3s

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
- [ ] PCI compliance validated
- [ ] Payment data encrypted
- [ ] Audit trail complete

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All tests passed
- [ ] **Design**: UI matches specs
- [ ] **PM**: Feature complete
- [ ] **Security**: PCI compliance validated
- [ ] **Accessibility**: A11y audit passed
- [ ] **Finance**: Payment workflows approved
- [ ] **Compliance**: ACH/wire format validated

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M22 - Attestation  
**Next**: M24 - AR Collections
