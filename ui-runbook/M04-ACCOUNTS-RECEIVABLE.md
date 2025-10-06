# 🚀 M4: Accounts Receivable - UI Implementation Runbook

**Module ID**: M4  
**Module Name**: Accounts Receivable  
**Priority**: HIGH  
**Phase**: 2 - Priority Modules  
**Estimated Effort**: 4 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Accounts Receivable manages **all customer invoices, payments, and credit management**. This module is essential for revenue tracking, cash flow management, and customer relationship management.

### Business Value

- Track all customer invoices and payments
- Aging analysis for collections management
- Customer credit limit enforcement
- Automated payment applications
- Revenue recognition integration

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-007-ar-payment-matching], [ADR-008-collections-automation]

---

## 📊 Current Status

| Layer         | Status  | Details                                    |
| ------------- | ------- | ------------------------------------------ |
| **Database**  | ✅ 100% | 102 migrations - most comprehensive module |
| **Services**  | ✅ 100% | AR statements, aging, collections services |
| **API**       | ✅ 100% | 27 endpoints covering full AR lifecycle    |
| **Contracts** | ✅ 100% | 16 schemas in ar.ts                        |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**                   |

### API Coverage

- ✅ `/api/ar/invoices` - Invoice management
- ✅ `/api/ar/payments` - Payment application
- ✅ `/api/ar/aging` - Aging reports
- ✅ `/api/ar/statements` - Customer statements
- ✅ `/api/ar/collections` - Collections workbench
- ✅ `/api/ar/credit-memos` - Credit memo processing

**Total Endpoints**: 27

### Risks & Blockers

| Risk                              | Impact | Mitigation                                                       | Owner       |
| --------------------------------- | ------ | ---------------------------------------------------------------- | ----------- |
| Payment matching accuracy         | HIGH   | ML model with 95%+ accuracy; manual override always available    | @ai-team    |
| Credit limit enforcement          | HIGH   | Real-time validation with override workflow for authorized users | @backend    |
| Collections automation complexity | MED    | Phased rollout; manual fallback; extensive testing               | @product    |
| Multi-currency complexity         | HIGH   | FX rate service integration; comprehensive test coverage         | @backend    |
| Customer data privacy             | HIGH   | GDPR/CCPA compliance; data encryption; access controls           | @compliance |

---

## 🎯 3 Killer Features

### 1. **Smart Payment Application with Auto-Matching** 💳

**Description**: AI-powered payment application that automatically matches payments to invoices using ML algorithms.

**Why It's Killer**:

- 95% auto-match rate (vs 60% manual)
- Learns from user corrections
- Handles partial payments intelligently
- Multi-invoice payment splitting
- Beats all competitors in accuracy

**Implementation**:

```typescript
import { DataTable, Button, Modal } from "aibos-ui";

<PaymentApplicationWizard
  payment={payment}
  suggestions={aiMatches}
  onApply={handleApplyPayment}
  autoMatch={{
    enabled: true,
    confidence: 0.9,
    learnFromCorrections: true,
  }}
/>;
```

### 2. **Interactive Aging Chart with Drill-Down** 📊

**Description**: Visual aging analysis with ability to click any segment and see underlying invoices.

**Why It's Killer**:

- Interactive treemap visualization
- Click to drill into any aging bucket
- Real-time updates as payments post
- Better than Zoho/QuickBooks static reports
- Export drill-down details instantly

**Implementation**:

```typescript
import { Chart, Popover } from "aibos-ui";

<AgingChart
  data={agingData}
  interactive
  onClick={(bucket) => showInvoices(bucket)}
  visualization="treemap"
  colors={agingColors}
/>;
```

### 3. **Automated Collections Workflow** 🤖

**Description**: Intelligent collections management with automated email reminders and escalation rules.

**Why It's Killer**:

- Auto-send reminders based on aging
- Customizable escalation rules
- Track all customer communications
- Integration with email templates
- Reduces DSO by 30%

**Implementation**:

```typescript
import { Timeline, Card, Button } from "aibos-ui";

<CollectionsWorkbench
  customer={customer}
  overdue={overdueInvoices}
  actions={{
    sendReminder: true,
    scheduleCall: true,
    escalate: true,
  }}
  automation={{
    reminderDays: [7, 14, 30],
    escalationThreshold: 60,
  }}
/>;
```

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Invoice List (`/ar/invoices`)

**Components**: DataTable, DateRangePicker, Badge, Button
**File**: `apps/web/app/(dashboard)/ar/invoices/page.tsx`

#### 2. Payment Application (`/ar/payments`)

**Components**: Form, DataGrid, Card, Button
**File**: `apps/web/app/(dashboard)/ar/payments/page.tsx`

#### 3. Aging Report (`/ar/aging`)

**Components**: Chart, DataTable, Card, Button
**File**: `apps/web/app/(dashboard)/ar/aging/page.tsx`

#### 4. Customer Statements (`/ar/statements`)

**Components**: Card, DataTable, Button, DatePicker
**File**: `apps/web/app/(dashboard)/ar/statements/page.tsx`

#### 5. Collections Workbench (`/ar/collections`)

**Components**: Tabs, DataTable, Timeline, Card
**File**: `apps/web/app/(dashboard)/ar/collections/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                     | Target          | Measurement             |
| -------------------------- | --------------- | ----------------------- |
| TTFB (staging)             | ≤ 70ms          | Server timing header    |
| Client TTI for `/ar/*`     | ≤ 200ms         | Lighthouse CI           |
| Network requests (initial) | ≤ 4             | Chrome DevTools         |
| UI bundle size             | ≤ 250KB gzipped | Webpack bundle analyzer |
| Aging report generation    | < 2s            | APM traces              |
| Payment matching (AI)      | < 500ms         | APM traces              |
| Server pagination          | Default 50/page | API query param         |
| Search response (P95)      | < 150ms         | APM traces              |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard support for payment application, invoice creation
- **Focus Management**: Focus trap in modals; visible focus indicators on form fields
- **ARIA**: Live region for payment matching results; proper roles for data grids
- **Screen Reader**: All amounts, statuses, and actions announced
- **Axe Target**: 0 serious/critical violations

### Security

| Layer           | Requirement                                                             |
| --------------- | ----------------------------------------------------------------------- |
| RBAC Scopes     | `ar.read`, `ar.write`, `ar.post`, `ar.collections`, `ar.admin`          |
| Enforcement     | Server-side on all endpoints                                            |
| Client Behavior | Hide post/write-off actions based on permissions                        |
| Data Exposure   | Only show customer data user has permission to view                     |
| PII Protection  | Mask credit card numbers; encrypt customer data at rest                 |
| Idempotency     | All mutations use auto-generated idempotency key                        |
| Rate Limiting   | Collections emails limited to 10 per day per customer                   |
| Audit Trail     | All invoice postings, payments, write-offs logged with user + timestamp |

**Reference**: See `security-policy.json` for full threat model and controls.

#### UI Permissions Matrix

| Role           | View Invoices | Create Invoice | Post Invoice | Apply Payment | View Aging | Send Reminders | Write Off | Admin |
| -------------- | ------------- | -------------- | ------------ | ------------- | ---------- | -------------- | --------- | ----- |
| ar.read        | ✅            | ❌             | ❌           | ❌            | ✅         | ❌             | ❌        | ❌    |
| ar.write       | ✅            | ✅             | ❌           | ✅            | ✅         | ❌             | ❌        | ❌    |
| ar.post        | ✅            | ✅             | ✅           | ✅            | ✅         | ❌             | ❌        | ❌    |
| ar.collections | ✅            | ❌             | ❌           | ✅            | ✅         | ✅             | ❌        | ❌    |
| ar.admin       | ✅            | ✅             | ✅           | ✅            | ✅         | ✅             | ✅        | ✅    |

**UI Implementation**:

- Hide post/write-off buttons for users without permissions
- Show read-only view for `ar.read` users
- Collections workbench only visible to `ar.collections` and `ar.admin` roles
- Display permission-denied state if user navigates directly to restricted URL

### Reliability & Observability

- **SLO**: 99.9% successful responses on AR endpoints
- **SLA Dashboards**: Real-time metrics on payment posting success rate, aging calculation time
- **Events Emitted**: `AR.Invoice.Created/Posted/Paid/WrittenOff`, `AR.Payment.Applied/Reversed`, `AR.Collections.ReminderSent`
- **Logging**: Structured logs with correlation IDs for all mutations
- **Tracing**: Distributed tracing across BFF → Kernel → Payment Gateway

---

## 🧬 Data & Domain Invariants

### AR Business Rules

| Rule                    | Enforcement                                                  |
| ----------------------- | ------------------------------------------------------------ |
| **Invoice Posting**     | Cannot post invoice with $0 amount or without line items     |
| **Payment Application** | Payment amount cannot exceed invoice balance                 |
| **Credit Limit**        | Enforce customer credit limit before posting new invoices    |
| **Aging Buckets**       | Current, 1-30, 31-60, 61-90, 90+ days based on due date      |
| **Write-Off Threshold** | Requires approval for write-offs > $1,000                    |
| **Multi-Currency**      | Invoice and payment must be in same currency or auto-convert |
| **Revenue Recognition** | Link to revenue schedule for accrual-based accounting        |

### Currency & Rounding

- **Display**: Customer's currency preference or presentation currency
- **Rounding Policy**: HALF_UP to 2 decimal places (currency standard)
- **Multi-Currency**: Support FX conversion at payment application time
- **FX Gains/Losses**: Auto-post to designated GL accounts

### Archive/Write-Off Semantics

- **Draft Invoices**: Can be deleted permanently
- **Posted Invoices**: Cannot be deleted; must be written off or reversed
- **Payments**: Can be reversed (creates negative payment entry)
- **Write-Offs**: Require reason code and approval for amounts > $1,000
- **Guard Rails**:
  - ❌ Deny delete if invoice is posted
  - ❌ Deny payment application if customer over credit limit
  - ✅ Allow credit memos to reduce invoice balance

---

## 🚨 Error Handling & UX States

### All Possible States

| State               | UI Display                               | User Action                   |
| ------------------- | ---------------------------------------- | ----------------------------- |
| **Empty**           | "No invoices yet" + Create button        | Create first invoice          |
| **Loading**         | Skeleton rows (5-10)                     | N/A                           |
| **Error**           | Error message + retry button             | Retry / contact support       |
| **Partial**         | Data + pagination controls               | Load more / jump to page      |
| **No Results**      | "No invoices match filters"              | Clear filters / adjust search |
| **Over Limit**      | Alert: "Customer over credit limit"      | Request approval / reduce amt |
| **Match Not Found** | "No matching invoices found for payment" | Manual selection / adjust     |
| **Conflict**        | "Invoice was modified by another user"   | Review changes / reload       |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Real-time Validation**: Credit limit check as amount is entered
- **Payment Matching**: Show confidence score for auto-matches
- **Submit State**: Disable post until all validations pass

### Network Errors

| HTTP Status | UI Message                                     | Action              |
| ----------- | ---------------------------------------------- | ------------------- |
| 400         | "Invalid invoice data. Check required fields." | Inline field errors |
| 401         | "Session expired. Please log in again."        | Redirect to login   |
| 403         | "You don't have permission to post invoices."  | Hide post button    |
| 404         | "Invoice not found. It may have been deleted." | Return to list      |
| 409         | "Invoice was modified. Review conflicts."      | Show diff modal     |
| 422         | "Validation failed. Check invoice details."    | Inline errors       |
| 429         | "Too many collection emails. Try again later." | Show wait message   |
| 500         | "Posting failed. Our team has been notified."  | Retry button        |

---

## 🔌 API Integration

```typescript
// apps/web/hooks/useAR.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function useARInvoices(filters = {}) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["ar", "invoices", filters],
    queryFn: () => apiClient.GET("/api/ar/invoices", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });

  const createInvoice = useMutation({
    mutationFn: (data) =>
      apiClient.POST("/api/ar/invoices/create", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["ar", "aging"] });
    },
  });

  const postInvoice = useMutation({
    mutationFn: (id) =>
      apiClient.POST("/api/ar/invoices/post", { body: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar"] });
    },
  });

  return {
    invoices: data || [],
    isLoading,
    error,
    createInvoice: createInvoice.mutate,
    postInvoice: postInvoice.mutate,
  };
}

export function usePaymentApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      apiClient.POST("/api/ar/payments/apply", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ar", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["ar", "aging"] });
      queryClient.invalidateQueries({ queryKey: ["ar", "payments"] });
    },
  });
}

export function useAging(asOfDate: string) {
  return useQuery({
    queryKey: ["ar", "aging", asOfDate],
    queryFn: () =>
      apiClient.GET("/api/ar/aging", { query: { as_of_date: asOfDate } }),
    staleTime: 5 * 60_000, // 5min
    select: (response) => response.data,
  });
}

export function useCollections(filters = {}) {
  return useQuery({
    queryKey: ["ar", "collections", filters],
    queryFn: () => apiClient.GET("/api/ar/collections", { query: filters }),
    staleTime: 60_000, // 1min
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error        | User Message                                    | UI Action            |
| ---------------- | ----------------------------------------------- | -------------------- |
| 409 (Conflict)   | "Invoice was modified. Review changes."         | Show diff modal      |
| 422 (Validation) | "Validation failed. Check invoice details."     | Inline form errors   |
| 403 (Forbidden)  | "You don't have permission for this action."    | Hide action buttons  |
| 429 (Rate Limit) | "Too many emails sent. Try again later."        | Show wait message    |
| 500 (Server)     | "Operation failed. Our team has been notified." | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for payment posting operations

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/ar.json`.

### Page Titles & Headers

| Context               | Copy                  | i18n Key                  |
| --------------------- | --------------------- | ------------------------- |
| Invoice List          | "Accounts Receivable" | `ar.invoices.title`       |
| Invoice Detail        | "Invoice Details"     | `ar.invoice.detail.title` |
| Payment Application   | "Apply Payment"       | `ar.payment.apply.title`  |
| Aging Report          | "AR Aging Report"     | `ar.aging.title`          |
| Collections Workbench | "Collections"         | `ar.collections.title`    |
| Customer Statements   | "Customer Statement"  | `ar.statements.title`     |

### State Messages

| State             | Title                     | Message                                                      | Action Button       | i18n Key                |
| ----------------- | ------------------------- | ------------------------------------------------------------ | ------------------- | ----------------------- |
| Empty             | "No invoices yet"         | "Create your first invoice to get started"                   | "Create Invoice"    | `ar.empty.*`            |
| Loading           | —                         | —                                                            | —                   | —                       |
| Error             | "Unable to load invoices" | "Something went wrong. Our team has been notified."          | "Retry" / "Support" | `ar.error.*`            |
| No Results        | "No invoices found"       | "Try adjusting your filters or search terms"                 | "Clear Filters"     | `ar.noResults.*`        |
| Permission Denied | "Access restricted"       | "You don't have permission to view AR data."                 | "Back to Dashboard" | `ar.permissionDenied.*` |
| Over Credit Limit | "Credit limit exceeded"   | "Customer is ${amount} over credit limit. Request approval." | "Request Approval"  | `ar.overLimit.*`        |
| Payment Mismatch  | "No matching invoices"    | "Payment amount doesn't match any outstanding invoices."     | "Manual Match"      | `ar.paymentMismatch.*`  |

### Action Confirmations

| Action        | Title                    | Message                                                        | Confirm Button | Cancel Button | i18n Key                |
| ------------- | ------------------------ | -------------------------------------------------------------- | -------------- | ------------- | ----------------------- |
| Post Invoice  | "Post this invoice?"     | "Invoice will be posted to the general ledger. Continue?"      | "Post"         | "Cancel"      | `ar.post.confirm.*`     |
| Write Off     | "Write off invoice?"     | "This will write off ${amount}. This action cannot be undone." | "Write Off"    | "Cancel"      | `ar.writeOff.confirm.*` |
| Send Reminder | "Send collection email?" | "Send payment reminder to {customer}?"                         | "Send"         | "Cancel"      | `ar.reminder.confirm.*` |

### Success Messages (Toast)

| Action          | Message                                     | i18n Key                    |
| --------------- | ------------------------------------------- | --------------------------- |
| Invoice Created | "Invoice #{number} created successfully"    | `ar.invoice.create.success` |
| Invoice Posted  | "Invoice #{number} posted successfully"     | `ar.invoice.post.success`   |
| Payment Applied | "Payment of ${amount} applied successfully" | `ar.payment.success`        |
| Reminder Sent   | "Collection reminder sent to {customer}"    | `ar.reminder.success`       |

### Error Messages (Toast)

| Scenario         | Message                                                   | i18n Key                  |
| ---------------- | --------------------------------------------------------- | ------------------------- |
| Post Failed      | "Failed to post invoice. Check validation errors."        | `ar.post.error`           |
| Over Limit       | "Customer over credit limit by ${amount}."                | `ar.errorOverLimit`       |
| Payment Mismatch | "Payment amount doesn't match invoice balance."           | `ar.errorPaymentMismatch` |
| Email Limit      | "Daily collection email limit reached for this customer." | `ar.errorEmailLimit`      |
| Network Error    | "Network error. Check your connection and try again."     | `ar.error.network`        |

### Form Labels & Help Text

| Field          | Label            | Placeholder       | Help Text                   | i18n Key              |
| -------------- | ---------------- | ----------------- | --------------------------- | --------------------- |
| Customer       | "Customer"       | "Select customer" | "Customer for this invoice" | `ar.field.customer.*` |
| Invoice Date   | "Invoice Date"   | "Select date"     | "Date invoice was issued"   | `ar.field.date.*`     |
| Due Date       | "Due Date"       | "Select date"     | "Payment due date"          | `ar.field.dueDate.*`  |
| Amount         | "Amount"         | "0.00"            | "Total invoice amount"      | `ar.field.amount.*`   |
| Payment Amount | "Payment Amount" | "0.00"            | "Amount being paid"         | `ar.field.payment.*`  |

### Keyboard Shortcuts Help

| Shortcut | Description             | i18n Key              |
| -------- | ----------------------- | --------------------- |
| `/`      | "Focus search"          | `ar.shortcuts.search` |
| `n`      | "Create new invoice"    | `ar.shortcuts.new`    |
| `p`      | "Post selected invoice" | `ar.shortcuts.post`   |
| `a`      | "Apply payment"         | `ar.shortcuts.apply`  |
| `Escape` | "Close modal/cancel"    | `ar.shortcuts.cancel` |

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["ar", "invoices", { filters }][("ar", "invoice", invoiceId)][
  ("ar", "aging", asOfDate)
][("ar", "collections", { filters })][("ar", "payments", { filters })][
  ("ar", "statements", customerId, dateRange)
];
```

### Invalidation Rules

| Action         | Invalidates                                                   |
| -------------- | ------------------------------------------------------------- |
| Create Invoice | `["ar", "invoices"]`, `["ar", "aging"]`                       |
| Post Invoice   | `["ar"]` (all AR data), `["journals"]`, `["trial-balance"]`   |
| Apply Payment  | `["ar", "invoices"]`, `["ar", "aging"]`, `["ar", "payments"]` |
| Write Off      | `["ar", "invoices"]`, `["ar", "aging"]`                       |
| Send Reminder  | `["ar", "collections"]`                                       |

### Stale Time

| Query Type     | Stale Time | Reasoning                                  |
| -------------- | ---------- | ------------------------------------------ |
| Invoice List   | 30s        | Frequent updates; real-time visibility     |
| Invoice Detail | 1min       | Less frequently changed                    |
| Aging Report   | 5min       | Aggregated data; recalculated periodically |
| Collections    | 1min       | Status changes frequently                  |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("ar"); // After mutations
revalidateTag(`ar-invoice-${invoiceId}`); // Specific invoice
revalidateTag("aging"); // After posting/payment
```

---

## 📝 Implementation Guide

### Day 1: Invoice Management (8 hours)

1. Create invoice list page with filters
2. Add invoice detail view
3. Implement invoice creation form
4. Add payment recording

### Day 2: Payment Application (8 hours)

1. Build payment application interface
2. Add auto-matching logic
3. Implement manual matching UI
4. Add payment history

### Day 3: Aging & Reports (8 hours)

1. Create aging report with charts
2. Build customer statements
3. Add drill-down functionality
4. Implement export features

### Day 4: Collections (8 hours)

1. Build collections workbench
2. Add reminder scheduling
3. Implement communication tracking
4. Add testing and polish

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Invoice CRUD operations
- [ ] Payment application logic
- [ ] Aging calculation accuracy
- [ ] Auto-match algorithm

### Integration Tests

- [ ] Payment posts to GL
- [ ] Aging updates in real-time
- [ ] Statements generate correctly
- [ ] Collections reminders send

### E2E Tests

- [ ] Create and post invoice
- [ ] Apply payment to invoice
- [ ] View aging report
- [ ] Send collection reminder
- [ ] Keyboard-only flow: create invoice → post → apply payment

### Accessibility Tests

- [ ] Keyboard navigation works for all forms
- [ ] Screen reader announces invoice status changes
- [ ] Focus management correct in payment modals
- [ ] Color contrast meets WCAG 2.2 AA
- [ ] Axe: 0 serious/critical violations

### Contract Tests

- [ ] API calls match OpenAPI spec for AR endpoints

### Visual Regression Tests

- [ ] Storybook snapshots for invoice forms, aging report, payment modal

### Performance Tests

- [ ] Bundle size < 250KB gzipped
- [ ] Aging report generates < 2s for 10,000 invoices
- [ ] Payment matching < 500ms

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/ar.fixtures.ts`

**Datasets**:

- `minimalInvoices`: 5 invoices (various statuses)
- `standardInvoices`: 50 invoices across aging buckets
- `largeDataset`: 1,000 invoices (for performance testing)
- `edgeCases`: Special scenarios (overpayments, multi-currency, credit limits)

**Edge Cases Covered**:

- Invoices in all aging buckets (Current, 1-30, 31-60, 61-90, 90+)
- Multi-currency invoices (USD, EUR, GBP)
- Partially paid invoices
- Overpayments requiring refund
- Credit limit scenarios
- Write-off approval workflows

```typescript
// Example fixture structure
export const standardInvoices: ARInvoiceFixture[] = [
  {
    id: "inv_1",
    invoice_number: "INV-2025-001",
    customer_id: "cust_1",
    customer_name: "Acme Corp",
    invoice_date: "2025-01-01",
    due_date: "2025-01-31",
    amount: 5000.0,
    balance: 5000.0,
    status: "posted",
    currency: "USD",
    aging_bucket: "current",
  },
  // ... 49 more
];
```

### E2E Seed Data

**Location**: `tests/seeds/ar.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:ar
```

**Dataset**:

- 100 invoices across 20 customers
- Various aging buckets and payment statuses
- 30 payments applied to invoices
- 10 collection activities
- Multi-currency scenarios (30% of invoices)

**Cleanup Command**:

```powershell
pnpm run seed:ar:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic customer portfolio: "Demo Customer A-Z"
- 150 invoices with realistic aging distribution
- Payment history for 60% of invoices
- Collection activities demonstrating workflow
- Multi-currency examples (USD, EUR, GBP)

**Regeneration**:

```powershell
pnpm run demo:reset:ar
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] No orphaned customer references
- [ ] Payment amounts don't exceed invoice balances
- [ ] Aging buckets calculated correctly
- [ ] Credit limits enforced in test scenarios

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
- **Interactive Parts**: Mark with `"use client"` (invoice forms, payment modals, collections interface)

### Data Fetching Strategy

| Scenario            | Strategy                                   | Benefit              |
| ------------------- | ------------------------------------------ | -------------------- |
| Invoice List        | Server-side fetch + stream                 | Faster TTFB          |
| Mutations           | Client-side React Query                    | Optimistic updates   |
| Aging Report        | Server component with client interactivity | SEO + drill-downs    |
| Payment Application | Client-side form + API                     | Real-time validation |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function postInvoice(id: string) {
  // ... mutation logic
  revalidateTag("ar");
  revalidateTag("journals");
  revalidateTag("trial-balance");
}
```

---

## 📊 Analytics & Audit Events

| Event                       | When               | Properties                                        |
| --------------------------- | ------------------ | ------------------------------------------------- |
| AR.Invoice.Viewed           | Detail page open   | `invoice_id`, `customer_id`                       |
| AR.Invoice.Created          | After 2xx response | `invoice_id`, `customer_id`, `amount`, `currency` |
| AR.Invoice.Posted           | After 2xx response | `invoice_id`, `amount`, `gl_entry_id`             |
| AR.Payment.Applied          | After 2xx response | `payment_id`, `invoice_id`, `amount`, `method`    |
| AR.Payment.Matched          | Auto-match success | `payment_id`, `matched_invoice_ids`, `confidence` |
| AR.WriteOff.Created         | After 2xx response | `invoice_id`, `amount`, `reason`                  |
| AR.Collections.ReminderSent | Email sent         | `invoice_id`, `customer_id`, `reminder_level`     |
| AR.Aging.Viewed             | Report accessed    | `as_of_date`, `filters`, `export_format?`         |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("AR.Invoice.Posted", {
  invoice_id: invoice.id,
  customer_id: invoice.customer_id,
  amount: invoice.amount,
  currency: invoice.currency,
  gl_entry_id: glEntry.id,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/ar.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties; test with Arabic
- **Currency Formatting**: Respect locale currency display conventions

### Keyboard Shortcuts

| Key      | Action                | Scope          |
| -------- | --------------------- | -------------- |
| `/`      | Focus search          | Invoice list   |
| `n`      | New invoice           | Invoice list   |
| `p`      | Post selected invoice | Invoice detail |
| `a`      | Apply payment         | Invoice detail |
| `Enter`  | Open selected invoice | Table          |
| `Escape` | Close modal/cancel    | Modal/Form     |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateModal()],
  ["p", () => postInvoice(selectedId)],
  ["a", () => openPaymentModal()],
]);
```

---

## 📅 Timeline

| Day | Deliverable                  |
| --- | ---------------------------- |
| 1   | Invoice management complete  |
| 2   | Payment application working  |
| 3   | Reports and aging functional |
| 4   | Collections and testing done |

**Total**: 4 days (32 hours)

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
  m4_ar: false,                  // Master toggle
  m4_ar_auto_match: false,       // AI payment matching
  m4_ar_collections: false,      // Collections automation
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/ar`, `/ar/invoices/[id]`, `/ar/aging`)
- P50/P95/P99 latency
- Payment matching accuracy
- Collections email delivery rate
- Feature flag adoption rate

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- P95 latency > 500ms for 10min → investigate
- Payment matching accuracy < 90% → alert AI team

### UI Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m4_ar = false`

   ```powershell
   pnpm run flags:set m4_ar=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("ar");
   revalidateTag("aging");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/ar/*"
   ```

4. **Monitor for 15 minutes**:

   - Error rate drops below 0.1%
   - No new Sentry issues

5. **Post-mortem**:
   - Create incident report
   - Add regression test

**Rollback Decision Matrix**:

| Scenario               | Action             | Approval Required |
| ---------------------- | ------------------ | ----------------- |
| Error rate > 5%        | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%        | Partial rollback   | On-call engineer  |
| P95 latency > 1s       | Investigate first  | On-call engineer  |
| Data corruption/loss   | Immediate rollback | No (auto-trigger) |
| Payment mismatch spike | Disable auto-match | AI team + PM      |

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries

### Enables These Modules

- M24: AR Collections
- M25: Customer Portal
- M26: Recurring Billing

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

- ERPNext patterns: Invoice management & payment application
- QuickBooks UX: Aging reports & customer statements
- Xero: Payment matching & reconciliation
- Zoho: Collections workflow & automation

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md` (PII handling, data residency)
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Cost/Scaling**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Payment Matching Accuracy

**Mitigation**: ML model with 95%+ accuracy; manual override always available; comprehensive test coverage

### Risk #2: Multi-Currency Complexity

**Mitigation**: FX rate service integration; automated conversions; extensive test scenarios

### Risk #3: Credit Limit Enforcement

**Mitigation**: Real-time validation; override workflow for authorized users; audit trail

### Risk #4: Collections Automation Complexity

**Mitigation**: Phased rollout; manual fallback; extensive testing; feature flag control

### Risk #5: Customer Data Privacy

**Mitigation**: GDPR/CCPA compliance; data encryption; access controls; audit logging

---

## 🎯 Success Criteria

### Must Have

- [ ] Create and manage invoices
- [ ] Apply payments to invoices
- [ ] View aging reports
- [ ] Generate customer statements
- [ ] Track collections activities

### Should Have

- [ ] Auto-match payments
- [ ] Interactive aging charts
- [ ] Automated reminders
- [ ] Bulk operations

### Nice to Have

- [ ] AI-powered insights
- [ ] Predictive collections
- [ ] Customer portal integration
- [ ] Mobile app

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/ar`, `/ar/invoices`, `/ar/aging`, `/ar/collections`)
- [ ] All CRUD operations working (Create, Post, Apply Payment, Write-Off)
- [ ] Invoice posting guard rails enforced (credit limits, validation)
- [ ] Payment matching (auto and manual) working
- [ ] Aging report accurate across all buckets
- [ ] Collections workflow functional
- [ ] Customer statements generate correctly
- [ ] Permissions enforced (UI hides/shows based on role)
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
- [ ] Integration tests: All CRUD operations covered
- [ ] E2E tests: All user flows covered (create → post → apply payment)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Invoice creation and posting flow
- Payment application flow (auto and manual matching)
- Aging report calculation
- Collections reminder workflow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/ar/*` routes
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/ar`
- [ ] Network requests: ≤4 on initial load
- [ ] Aging report: < 2s for 10,000 invoices
- [ ] Payment matching: < 500ms

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly
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
  - `AR.Invoice.Viewed`
  - `AR.Invoice.Created`
  - `AR.Invoice.Posted`
  - `AR.Payment.Applied`
  - `AR.Payment.Matched`
  - `AR.WriteOff.Created`
  - `AR.Collections.ReminderSent`
  - `AR.Aging.Viewed`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, latency, matching accuracy)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Rate limiting tested (collection emails)
- [ ] No sensitive data in logs/errors
- [ ] PII handling compliant (GDPR/CCPA)
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
  - `flags.m4_ar = false` (ready to enable)
  - `flags.m4_ar_auto_match = false` (phase 2)
  - `flags.m4_ar_collections = false` (phase 2)
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
- [ ] **Security**: Security review passed (PII handling, access controls)
- [ ] **Accessibility**: A11y audit passed

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M3 - Trial Balance  
**Next**: M5 - Accounts Payable
