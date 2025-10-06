# 🚀 M5: Accounts Payable - UI Implementation Runbook

**Module ID**: M5  
**Module Name**: Accounts Payable  
**Priority**: HIGH  
**Phase**: 2 - Priority Modules  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Accounts Payable manages **vendor invoices, payments, and expense management**. Critical for cash management, vendor relationships, and expense control.

### Business Value

- Process vendor invoices efficiently
- Track payment obligations
- Manage vendor relationships
- Control spending and approvals
- Integration with payment systems

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-ap-ocr], [ADR-###-three-way-match], [ADR-###-payment-optimization]

---

## 📊 Current Status

| Layer         | Status  | Details                                    |
| ------------- | ------- | ------------------------------------------ |
| **Database**  | ✅ 100% | Complete AP schema with approval workflows |
| **Services**  | ✅ 100% | PI posting, payment processing services    |
| **API**       | ✅ 100% | Full CRUD + posting + approval endpoints   |
| **Contracts** | ✅ 100% | Payment schemas defined                    |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**                   |

### API Coverage

- ✅ `/api/purchase-invoices` - Invoice management
- ✅ `/api/purchase-invoices/post` - Post invoices
- ✅ `/api/purchase-invoices/approve` - Approval workflow
- ✅ `/api/purchase-invoices/import` - Bulk import

**Total Endpoints**: 12+

### Risks & Blockers

| Risk                                | Impact | Mitigation                                                     | Owner       |
| ----------------------------------- | ------ | -------------------------------------------------------------- | ----------- |
| OCR accuracy for invoice extraction | HIGH   | Multi-provider fallback; manual override; 90%+ accuracy target | @ai-team    |
| Three-way match complexity          | HIGH   | Configurable tolerance rules; manual review workflow           | @backend    |
| Payment timing optimization         | MED    | Conservative defaults; user overrides; extensive testing       | @product    |
| Duplicate invoice detection         | HIGH   | ML-based duplicate detection; manual confirmation required     | @ai-team    |
| Vendor data privacy                 | HIGH   | GDPR/CCPA compliance; data encryption; access controls         | @compliance |

---

## 🎯 3 Killer Features

### 1. **OCR Invoice Upload with Auto-Extract** 📄

**Description**: Upload invoice PDFs/images and automatically extract vendor, date, amount, and line items using AI/OCR.

**Why It's Killer**:

- 90% data extraction accuracy
- Reduces data entry time by 95%
- Supports multiple invoice formats
- Auto-matches to POs if available
- Industry-leading OCR integration

**Implementation**:

```typescript
import { FileUpload, Card, Form } from "aibos-ui";

<FileUpload
  accept="image/*,application/pdf"
  onUpload={handleOCRExtract}
  processing={isExtracting}
  preview
  ocr={{
    enabled: true,
    autoFill: true,
    confidence: 0.85
  }}
/>

<Form
  defaultValues={extractedData}
  editable
  highlightExtracted
/>
```

### 2. **Three-Way Match Automation** ✅

**Description**: Automatically match invoices to purchase orders and receiving documents, flagging discrepancies.

**Why It's Killer**:

- Auto-match PO → Receipt → Invoice
- Flag price/quantity variances
- Configurable tolerance rules
- Reduces approval time by 80%
- Prevents duplicate payments

**Implementation**:

```typescript
import { DataTable, Badge, Alert } from "aibos-ui";

<ThreeWayMatchDashboard
  invoice={invoice}
  purchaseOrder={po}
  receipt={receipt}
  rules={{
    priceTolerance: 0.05,
    quantityTolerance: 0.02,
  }}
  onMatch={autoApprove}
  onException={flagForReview}
/>;
```

### 3. **Smart Payment Scheduling** 💰

**Description**: Intelligent payment scheduling that optimizes for early payment discounts and cash flow.

**Why It's Killer**:

- Calculate optimal payment dates
- Maximizes discount capture
- Respects cash flow constraints
- Automates payment batch creation
- Saves 2-5% on annual spend

**Implementation**:

```typescript
import { Calendar, Card, Button } from "aibos-ui";

<PaymentScheduler
  invoices={dueInvoices}
  optimization="discount-priority"
  constraints={{
    maxDaily: 1000000,
    preserveCash: 500000,
  }}
  onSchedule={createPaymentRun}
/>;
```

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Purchase Invoice List (`/ap/invoices`)

**Components**: DataTable, Button, FileUpload, Badge
**File**: `apps/web/app/(dashboard)/ap/invoices/page.tsx`

#### 2. Invoice Entry/Edit (`/ap/invoices/[id]`)

**Components**: Form, DataGrid, Card, Button, FileUpload
**File**: `apps/web/app/(dashboard)/ap/invoices/[id]/page.tsx`

#### 3. Approval Queue (`/ap/approvals`)

**Components**: DataTable, Button, Modal, Badge
**File**: `apps/web/app/(dashboard)/ap/approvals/page.tsx`

#### 4. Payment Scheduler (`/ap/payments`)

**Components**: Calendar, DataTable, Card, Button
**File**: `apps/web/app/(dashboard)/ap/payments/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                     | Target          | Measurement             |
| -------------------------- | --------------- | ----------------------- |
| TTFB (staging)             | ≤ 70ms          | Server timing header    |
| Client TTI for `/ap/*`     | ≤ 200ms         | Lighthouse CI           |
| Network requests (initial) | ≤ 4             | Chrome DevTools         |
| UI bundle size             | ≤ 250KB gzipped | Webpack bundle analyzer |
| OCR processing time        | < 3s            | APM traces              |
| Three-way match            | < 500ms         | APM traces              |
| Server pagination          | Default 50/page | API query param         |
| Search response (P95)      | < 150ms         | APM traces              |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access for invoice entry, approvals, payment scheduling
- **Focus Management**: Focus trap in modals; visible focus indicators
- **ARIA**: Live region for OCR status; proper roles and labels
- **Screen Reader**: All interactions announced; invoice status changes communicated
- **Axe Target**: 0 serious/critical violations

### Security

| Layer           | Requirement                                                            |
| --------------- | ---------------------------------------------------------------------- |
| RBAC Scopes     | `ap.read`, `ap.write`, `ap.post`, `ap.approve`, `ap.pay`, `ap.admin`   |
| Enforcement     | Server-side on all endpoints                                           |
| Client Behavior | Hide post/approve/pay actions based on permissions                     |
| Data Exposure   | Only show vendor data user has permission to view                      |
| PII Protection  | Mask bank account numbers; encrypt vendor data at rest                 |
| Idempotency     | All mutations use auto-generated idempotency key                       |
| Rate Limiting   | OCR processing limited to 100 uploads per hour per user                |
| Audit Trail     | All invoice postings, approvals, payments logged with user + timestamp |

**Reference**: See `security-policy.json` for full threat model and controls.

#### UI Permissions Matrix

| Role       | View Invoices | Create Invoice | Post Invoice | Approve | Schedule Payment | Make Payment | Admin |
| ---------- | ------------- | -------------- | ------------ | ------- | ---------------- | ------------ | ----- |
| ap.read    | ✅            | ❌             | ❌           | ❌      | ❌               | ❌           | ❌    |
| ap.write   | ✅            | ✅             | ❌           | ❌      | ❌               | ❌           | ❌    |
| ap.post    | ✅            | ✅             | ✅           | ❌      | ❌               | ❌           | ❌    |
| ap.approve | ✅            | ✅             | ✅           | ✅      | ❌               | ❌           | ❌    |
| ap.pay     | ✅            | ✅             | ✅           | ✅      | ✅               | ✅           | ❌    |
| ap.admin   | ✅            | ✅             | ✅           | ✅      | ✅               | ✅           | ✅    |

**UI Implementation**:

- Hide buttons/menu items for actions user lacks permission for
- Show permission-denied state if user navigates directly to restricted URL
- Display read-only view for `ap.read` users on detail pages
- Approval actions require `ap.approve` or higher

### Reliability & Observability

- **SLO**: 99.9% successful responses on AP endpoints
- **SLA Dashboards**: Real-time metrics on latency, error rate, throughput
- **Events Emitted**: `AP.Invoice.Created/Posted/Approved/Paid`
- **Logging**: Structured logs with correlation IDs for all mutations
- **Tracing**: Distributed tracing across BFF → Kernel → OCR service

---

## 🧬 Data & Domain Invariants

### AP Business Rules

| Rule                    | Enforcement                                                  |
| ----------------------- | ------------------------------------------------------------ |
| **Invoice Posting**     | Cannot post invoice with $0 amount or without vendor         |
| **Approval Workflow**   | Invoice amount > $10,000 requires dual approval              |
| **Payment Application** | Payment amount cannot exceed invoice balance                 |
| **Three-Way Match**     | PO + Receipt + Invoice quantities/prices within tolerance    |
| **Duplicate Detection** | ML model checks for duplicates; manual override available    |
| **Multi-Currency**      | Invoice and payment must be in same currency or auto-convert |
| **Early Pay Discount**  | Auto-calculate discount if paid within discount period       |

### Currency & Rounding

- **Display**: Presentation currency from tenant settings
- **Rounding Policy**: HALF_UP / EVENT (from SSOT)
- **Multi-Currency**: Show FX sensitivity badge on invoice card
- **Conversion**: Real-time rates from FX service (cache 15min)

### Archive Semantics

- **Soft Delete**: Set `effective_end_date`; maintain audit trail
- **Guard Rails**:
  - ❌ Deny if invoice posted to GL
  - ❌ Deny if payment already made
  - ❌ Deny if in approval workflow
  - ✅ Allow if still in draft state

---

## 🚨 Error Handling & UX States

### All Possible States

| State                | UI Display                                 | User Action                   |
| -------------------- | ------------------------------------------ | ----------------------------- |
| **Empty**            | "No invoices yet" + Create button          | Create first invoice          |
| **Loading**          | Skeleton rows (5-10)                       | N/A                           |
| **Error**            | Error message + retry button               | Retry / contact support       |
| **Partial**          | Data + pagination controls                 | Load more / jump to page      |
| **No Results**       | "No invoices match filters"                | Clear filters / adjust search |
| **Pending Approval** | Alert: "Invoice pending approval"          | View approval status          |
| **Match Not Found**  | "No matching PO found for invoice"         | Manual PO selection           |
| **Conflict**         | "Invoice was modified by another user"     | Review changes / reload       |
| **OCR Processing**   | Progress bar: "Extracting invoice data..." | Wait / cancel                 |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Submit State**: Button disabled until dirty & valid
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal
- **OCR Confidence**: Highlight low-confidence extracted fields for review

### Network Errors

| HTTP Status | UI Message                                     | Action              |
| ----------- | ---------------------------------------------- | ------------------- |
| 400         | "Invalid invoice data. Check required fields." | Inline field errors |
| 401         | "Session expired. Please log in again."        | Redirect to login   |
| 403         | "You don't have permission to post invoices."  | Hide post button    |
| 404         | "Invoice not found. It may have been deleted." | Return to list      |
| 409         | "Invoice was modified. Review conflicts."      | Show diff modal     |
| 422         | "Validation failed. Check invoice details."    | Inline errors       |
| 429         | "OCR rate limit exceeded. Try again later."    | Show wait message   |
| 500         | "Posting failed. Our team has been notified."  | Retry button        |

---

## 🔌 API Integration

```typescript
// apps/web/hooks/useAP.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function usePurchaseInvoices(filters = {}) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["ap", "invoices", filters],
    queryFn: () => apiClient.GET("/api/purchase-invoices", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });

  const createInvoice = useMutation({
    mutationFn: (data) =>
      apiClient.POST("/api/purchase-invoices/create", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ap", "invoices"] });
    },
  });

  const postInvoice = useMutation({
    mutationFn: (id) =>
      apiClient.POST("/api/purchase-invoices/post", { body: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ap"] });
      queryClient.invalidateQueries({ queryKey: ["journals"] });
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

export function useInvoiceOCR() {
  return useMutation({
    mutationFn: (file: File) =>
      apiClient.POST("/api/purchase-invoices/ocr", { body: file }),
    onSuccess: (extractedData) => {
      // Auto-fill form with extracted data
    },
  });
}

export function useApproveInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.POST("/api/purchase-invoices/approve", { body: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ap", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["ap", "approvals"] });
    },
  });
}

export function useThreeWayMatch(invoiceId: string) {
  return useQuery({
    queryKey: ["ap", "three-way-match", invoiceId],
    queryFn: () =>
      apiClient.GET("/api/purchase-invoices/three-way-match", {
        query: { invoice_id: invoiceId },
      }),
    staleTime: 60_000, // 1min
    enabled: !!invoiceId,
    select: (response) => response.data,
  });
}

export function usePaymentScheduler(filters = {}) {
  return useQuery({
    queryKey: ["ap", "payments", "schedule", filters],
    queryFn: () =>
      apiClient.GET("/api/ap/payment-schedule", { query: filters }),
    staleTime: 5 * 60_000, // 5min
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
| 429 (Rate Limit) | "OCR rate limit exceeded. Try again later."     | Show wait message    |
| 500 (Server)     | "Operation failed. Our team has been notified." | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **OCR Processing**: 30s timeout with progress indicator
- **Network timeouts**: 10s for queries, 30s for posting operations

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/ap.json`.

### Page Titles & Headers

| Context           | Copy                       | i18n Key                  |
| ----------------- | -------------------------- | ------------------------- |
| Invoice List      | "Accounts Payable"         | `ap.invoices.title`       |
| Invoice Detail    | "Purchase Invoice Details" | `ap.invoice.detail.title` |
| Approval Queue    | "Approval Queue"           | `ap.approvals.title`      |
| Payment Scheduler | "Payment Scheduler"        | `ap.payments.title`       |
| Vendor Statements | "Vendor Statement"         | `ap.statements.title`     |

### State Messages

| State             | Title                     | Message                                                           | Action Button       | i18n Key                |
| ----------------- | ------------------------- | ----------------------------------------------------------------- | ------------------- | ----------------------- |
| Empty             | "No invoices yet"         | "Create your first purchase invoice to get started"               | "Create Invoice"    | `ap.empty.*`            |
| Loading           | —                         | —                                                                 | —                   | —                       |
| Error             | "Unable to load invoices" | "Something went wrong. Our team has been notified."               | "Retry" / "Support" | `ap.error.*`            |
| No Results        | "No invoices found"       | "Try adjusting your filters or search terms"                      | "Clear Filters"     | `ap.noResults.*`        |
| Permission Denied | "Access restricted"       | "You don't have permission to view AP data."                      | "Back to Dashboard" | `ap.permissionDenied.*` |
| Pending Approval  | "Awaiting approval"       | "Invoice is pending approval from {approver}."                    | "View Details"      | `ap.pendingApproval.*`  |
| OCR Processing    | "Processing invoice..."   | "Extracting data from uploaded document. This may take a moment." | "Cancel"            | `ap.ocrProcessing.*`    |

### Action Confirmations

| Action       | Title                | Message                                                   | Confirm Button | Cancel Button | i18n Key               |
| ------------ | -------------------- | --------------------------------------------------------- | -------------- | ------------- | ---------------------- |
| Post Invoice | "Post this invoice?" | "Invoice will be posted to the general ledger. Continue?" | "Post"         | "Cancel"      | `ap.post.confirm.*`    |
| Approve      | "Approve invoice?"   | "Approve invoice for payment?"                            | "Approve"      | "Cancel"      | `ap.approve.confirm.*` |
| Make Payment | "Process payment?"   | "Process payment of ${amount} to {vendor}?"               | "Pay Now"      | "Cancel"      | `ap.payment.confirm.*` |

### Success Messages (Toast)

| Action            | Message                                  | i18n Key                      |
| ----------------- | ---------------------------------------- | ----------------------------- |
| Invoice Created   | "Invoice #{number} created successfully" | `ap.invoice.create.success`   |
| Invoice Posted    | "Invoice #{number} posted successfully"  | `ap.invoice.post.success`     |
| Approved          | "Invoice approved successfully"          | `ap.approve.success`          |
| Payment Scheduled | "Payment scheduled for {date}"           | `ap.payment.schedule.success` |

### Error Messages (Toast)

| Scenario        | Message                                                          | i18n Key              |
| --------------- | ---------------------------------------------------------------- | --------------------- |
| Post Failed     | "Failed to post invoice. Check validation errors."               | `ap.post.error`       |
| Duplicate Found | "Possible duplicate invoice detected. Review before proceeding." | `ap.errorDuplicate`   |
| OCR Failed      | "Failed to extract invoice data. Please enter manually."         | `ap.ocr.error`        |
| Match Failed    | "Three-way match failed. Review discrepancies."                  | `ap.errorMatchFailed` |
| Network Error   | "Network error. Check your connection and try again."            | `ap.error.network`    |

### Form Labels & Help Text

| Field        | Label          | Placeholder     | Help Text                               | i18n Key             |
| ------------ | -------------- | --------------- | --------------------------------------- | -------------------- |
| Vendor       | "Vendor"       | "Select vendor" | "Vendor for this invoice"               | `ap.field.vendor.*`  |
| Invoice Date | "Invoice Date" | "Select date"   | "Date on vendor invoice"                | `ap.field.date.*`    |
| Due Date     | "Due Date"     | "Select date"   | "Payment due date"                      | `ap.field.dueDate.*` |
| Amount       | "Amount"       | "0.00"          | "Total invoice amount"                  | `ap.field.amount.*`  |
| PO Number    | "PO Number"    | "Optional"      | "Purchase order number (if applicable)" | `ap.field.po.*`      |

### Keyboard Shortcuts Help

| Shortcut | Description             | i18n Key               |
| -------- | ----------------------- | ---------------------- |
| `/`      | "Focus search"          | `ap.shortcuts.search`  |
| `n`      | "Create new invoice"    | `ap.shortcuts.new`     |
| `u`      | "Upload invoice (OCR)"  | `ap.shortcuts.upload`  |
| `p`      | "Post selected invoice" | `ap.shortcuts.post`    |
| `a`      | "Approve invoice"       | `ap.shortcuts.approve` |
| `Escape` | "Close modal/cancel"    | `ap.shortcuts.cancel`  |

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["ap", "invoices", { filters }][("ap", "invoice", invoiceId)][
  ("ap", "approvals", { filters })
][("ap", "payments", "schedule", { filters })][
  ("ap", "three-way-match", invoiceId)
][("ap", "statements", vendorId, dateRange)];
```

### Invalidation Rules

| Action          | Invalidates                                                 |
| --------------- | ----------------------------------------------------------- |
| Create Invoice  | `["ap", "invoices"]`                                        |
| Post Invoice    | `["ap"]` (all AP data), `["journals"]`, `["trial-balance"]` |
| Approve Invoice | `["ap", "invoices"]`, `["ap", "approvals"]`                 |
| Make Payment    | `["ap", "invoices"]`, `["ap", "payments"]`                  |
| OCR Extract     | No invalidation (returns data for form)                     |

### Stale Time

| Query Type       | Stale Time | Reasoning                                    |
| ---------------- | ---------- | -------------------------------------------- |
| Invoice List     | 30s        | Frequent updates; real-time visibility       |
| Invoice Detail   | 1min       | Less frequently changed                      |
| Approval Queue   | 30s        | Status changes frequently                    |
| Payment Schedule | 5min       | Optimized schedule recalculated periodically |
| Three-Way Match  | 1min       | Match results cached briefly                 |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("ap"); // After mutations
revalidateTag(`ap-invoice-${invoiceId}`); // Specific invoice
revalidateTag("payments"); // After scheduling/payment
```

---

## 📝 Implementation Guide

### Day 1: Invoice Management (8 hours)

1. Create invoice list with filters (2 hours)
2. Build invoice entry form (3 hours)
3. Add OCR upload functionality (2 hours)
4. Implement validation (1 hour)

### Day 2: Approval & Payments (8 hours)

1. Build approval queue (2 hours)
2. Add three-way match UI (2 hours)
3. Create payment scheduler (3 hours)
4. Testing and polish (1 hour)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Invoice form validation
- [ ] OCR data extraction parsing
- [ ] Three-way match calculation
- [ ] Payment schedule optimization

### Integration Tests

- [ ] Invoice posts to GL correctly
- [ ] Approval workflow functions
- [ ] OCR service integration
- [ ] Payment run creation

### E2E Tests

- [ ] Upload and extract invoice via OCR
- [ ] Create and approve invoice
- [ ] Three-way match workflow
- [ ] Schedule and process payments
- [ ] Keyboard-only flow: upload → create → approve

### Accessibility Tests

- [ ] Keyboard navigation works for all forms
- [ ] Screen reader announces invoice status changes
- [ ] Focus management correct in approval modals
- [ ] Color contrast meets WCAG 2.2 AA
- [ ] Axe: 0 serious/critical violations

### Contract Tests

- [ ] API calls match OpenAPI spec for AP endpoints

### Visual Regression Tests

- [ ] Storybook snapshots for invoice forms, approval queue, payment scheduler

### Performance Tests

- [ ] Bundle size < 250KB gzipped
- [ ] OCR processing < 3s for typical invoices
- [ ] Three-way match < 500ms

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/ap.fixtures.ts`

**Datasets**:

- `minimalInvoices`: 5 invoices (various statuses: draft, pending, approved, posted, paid)
- `standardInvoices`: 50 invoices across approval stages
- `largeDataset`: 1,000 invoices (for performance testing)
- `edgeCases`: Special scenarios (OCR extraction, three-way match, duplicates)

**Edge Cases Covered**:

- Invoices at all approval stages
- Multi-currency invoices (USD, EUR, GBP)
- Three-way match variances (price, quantity)
- Duplicate invoice scenarios
- OCR extraction with varying confidence levels
- Early payment discount scenarios

```typescript
// Example fixture structure
export const standardInvoices: APInvoiceFixture[] = [
  {
    id: "inv_1",
    invoice_number: "V-2025-001",
    vendor_id: "vendor_1",
    vendor_name: "Acme Supplies",
    invoice_date: "2025-01-15",
    due_date: "2025-02-14",
    amount: 2500.0,
    status: "pending_approval",
    currency: "USD",
    po_number: "PO-2025-100",
  },
  // ... 49 more
];
```

### E2E Seed Data

**Location**: `tests/seeds/ap.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:ap
```

**Dataset**:

- 100 invoices across 30 vendors
- Various approval stages
- 40 invoices with PO matching
- 20 payments scheduled
- Multi-currency scenarios (30% of invoices)

**Cleanup Command**:

```powershell
pnpm run seed:ap:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic vendor portfolio: "Demo Vendor A-Z"
- 150 invoices with realistic distribution across stages
- Payment history for 50% of invoices
- Three-way match examples (successful and exceptions)
- OCR-extracted invoices with varying confidence
- Multi-currency examples (USD, EUR, GBP)

**Regeneration**:

```powershell
pnpm run demo:reset:ap
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] No orphaned vendor references
- [ ] Payment amounts don't exceed invoice balances
- [ ] Approval workflows follow business rules
- [ ] Three-way match calculations accurate

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
- **Interactive Parts**: Mark with `"use client"` (invoice forms, approval modals, payment scheduler)

### Data Fetching Strategy

| Scenario          | Strategy                                   | Benefit                |
| ----------------- | ------------------------------------------ | ---------------------- |
| Invoice List      | Server-side fetch + stream                 | Faster TTFB            |
| Mutations         | Client-side React Query                    | Optimistic updates     |
| Approval Queue    | Server component with client interactivity | Real-time updates      |
| Payment Scheduler | Client-side form + API                     | Real-time optimization |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function postInvoice(id: string) {
  // ... mutation logic
  revalidateTag("ap");
  revalidateTag("journals");
  revalidateTag("trial-balance");
}
```

---

## 📊 Analytics & Audit Events

| Event                      | When               | Properties                                          |
| -------------------------- | ------------------ | --------------------------------------------------- |
| AP.Invoice.Viewed          | Detail page open   | `invoice_id`, `vendor_id`                           |
| AP.Invoice.Created         | After 2xx response | `invoice_id`, `vendor_id`, `amount`, `currency`     |
| AP.Invoice.Posted          | After 2xx response | `invoice_id`, `amount`, `gl_entry_id`               |
| AP.Invoice.Approved        | After 2xx response | `invoice_id`, `approver_id`, `approval_level`       |
| AP.Payment.Scheduled       | Payment scheduled  | `invoice_id`, `payment_date`, `amount`              |
| AP.Payment.Processed       | Payment made       | `payment_id`, `invoice_id`, `amount`, `method`      |
| AP.OCR.Extracted           | OCR success        | `invoice_id`, `confidence`, `fields_extracted`      |
| AP.ThreeWayMatch.Performed | Match executed     | `invoice_id`, `po_id`, `receipt_id`, `match_status` |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("AP.Invoice.Posted", {
  invoice_id: invoice.id,
  vendor_id: invoice.vendor_id,
  amount: invoice.amount,
  currency: invoice.currency,
  gl_entry_id: glEntry.id,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/ap.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties; test with Arabic
- **Currency Formatting**: Respect locale currency display conventions

### Keyboard Shortcuts

| Key      | Action                | Scope          |
| -------- | --------------------- | -------------- |
| `/`      | Focus search          | Invoice list   |
| `n`      | New invoice           | Invoice list   |
| `u`      | Upload invoice (OCR)  | Invoice list   |
| `p`      | Post selected invoice | Invoice detail |
| `a`      | Approve invoice       | Invoice detail |
| `Enter`  | Open selected invoice | Table          |
| `Escape` | Close modal/cancel    | Modal/Form     |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateModal()],
  ["u", () => openOCRUpload()],
  ["p", () => postInvoice(selectedId)],
  ["a", () => approveInvoice(selectedId)],
]);
```

---

## 📅 Timeline

| Day | Deliverable                              |
| --- | ---------------------------------------- |
| 1   | Invoice management with OCR              |
| 2   | Approval workflow and payment scheduling |

**Total**: 2 days (16 hours)

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
  m5_ap: false,                  // Master toggle
  m5_ap_ocr: false,              // OCR extraction
  m5_ap_three_way: false,        // Three-way matching
  m5_ap_payment_opt: false,      // Payment optimization
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/ap`, `/ap/invoices/[id]`, `/ap/approvals`)
- P50/P95/P99 latency
- OCR extraction accuracy
- Three-way match success rate
- Payment optimization savings
- Feature flag adoption rate

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- P95 latency > 500ms for 10min → investigate
- OCR accuracy < 85% → alert AI team

### UI Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m5_ap = false`

   ```powershell
   pnpm run flags:set m5_ap=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("ap");
   revalidateTag("payments");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/ap/*"
   ```

4. **Monitor for 15 minutes**:

   - Error rate drops below 0.1%
   - No new Sentry issues

5. **Post-mortem**:
   - Create incident report
   - Add regression test

**Rollback Decision Matrix**:

| Scenario             | Action              | Approval Required |
| -------------------- | ------------------- | ----------------- |
| Error rate > 5%      | Immediate rollback  | No (auto-trigger) |
| Error rate 1-5%      | Partial rollback    | On-call engineer  |
| P95 latency > 1s     | Investigate first   | On-call engineer  |
| Data corruption/loss | Immediate rollback  | No (auto-trigger) |
| OCR accuracy drop    | Disable OCR feature | AI team + PM      |

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries

### Enables These Modules

- M23: Payment Processing
- M7: Bank Reconciliation

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

- ERPNext patterns: Invoice management & approval workflows
- QuickBooks UX: Payment scheduling & vendor statements
- Xero: Three-way matching & reconciliation
- Zoho: OCR extraction & automation

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md` (PII handling, data residency)
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Cost/Scaling**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: OCR Accuracy for Invoice Extraction

**Mitigation**: Multi-provider fallback; manual override always available; 90%+ accuracy target; comprehensive test coverage

### Risk #2: Three-Way Match Complexity

**Mitigation**: Configurable tolerance rules; manual review workflow; extensive test scenarios

### Risk #3: Payment Timing Optimization

**Mitigation**: Conservative defaults; user overrides; extensive testing; phased rollout

### Risk #4: Duplicate Invoice Detection

**Mitigation**: ML-based duplicate detection; manual confirmation required; audit trail

### Risk #5: Vendor Data Privacy

**Mitigation**: GDPR/CCPA compliance; data encryption; access controls; audit logging

---

## 🎯 Success Criteria

### Must Have

- [ ] Create and manage purchase invoices
- [ ] Upload invoice documents
- [ ] Post invoices to GL
- [ ] Approval workflow
- [ ] Payment scheduling

### Should Have

- [ ] OCR data extraction
- [ ] Three-way matching
- [ ] Bulk import from CSV
- [ ] Payment optimization

### Nice to Have

- [ ] AI vendor matching
- [ ] Duplicate detection
- [ ] Early payment discount recommendations
- [ ] Vendor portal integration

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/ap`, `/ap/invoices`, `/ap/approvals`, `/ap/payments`)
- [ ] All CRUD operations working (Create, Post, Approve, Pay)
- [ ] OCR invoice extraction working with 90%+ accuracy
- [ ] Three-way match functional (PO → Receipt → Invoice)
- [ ] Payment scheduler optimizing for discounts and cash flow
- [ ] Approval workflow enforced
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
- [ ] E2E tests: All user flows covered (OCR → create → approve → pay)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Invoice creation and posting flow
- OCR extraction workflow
- Approval workflow (single and multi-level)
- Three-way matching
- Payment scheduling and processing

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/ap/*` routes
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/ap`
- [ ] Network requests: ≤4 on initial load
- [ ] OCR processing: < 3s for typical invoices
- [ ] Three-way match: < 500ms

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
  - `AP.Invoice.Viewed`
  - `AP.Invoice.Created`
  - `AP.Invoice.Posted`
  - `AP.Invoice.Approved`
  - `AP.Payment.Scheduled`
  - `AP.Payment.Processed`
  - `AP.OCR.Extracted`
  - `AP.ThreeWayMatch.Performed`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, latency, OCR accuracy)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Rate limiting tested (OCR uploads)
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
  - `flags.m5_ap = false` (ready to enable)
  - `flags.m5_ap_ocr = false` (phase 2)
  - `flags.m5_ap_three_way = false` (phase 2)
  - `flags.m5_ap_payment_opt = false` (phase 2)
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

**Previous**: M4 - Accounts Receivable  
**Next**: M6 - Cash Management
