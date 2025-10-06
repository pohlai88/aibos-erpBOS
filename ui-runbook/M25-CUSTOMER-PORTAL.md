# 🚀 M25: Customer Portal - UI Implementation Runbook

**Module ID**: M25  
**Module Name**: Customer Portal  
**Priority**: MEDIUM  
**Phase**: 7 - Payments & Billing  
**Estimated Effort**: 1 day  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Customer Portal provides **self-service access** for customers to view invoices, make payments, download statements, and track order status.

### Business Value

- 24/7 self-service access for customers
- Reduced support call volume
- Faster payment processing
- Improved customer satisfaction
- Integration with AR and payment processing

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-customer-portal], [ADR-###-self-service-payment], [ADR-###-statement-download]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 11 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

**Customer Portal Access** (4 endpoints):

- ✅ `/api/portal/login` - Customer login
- ✅ `/api/portal/dashboard` - Customer dashboard data
- ✅ `/api/portal/profile` - Customer profile
- ✅ `/api/portal/notifications` - Notification preferences

**Invoices & Payments** (4 endpoints):

- ✅ `/api/portal/invoices` - List customer invoices
- ✅ `/api/portal/invoices/[id]` - Invoice details
- ✅ `/api/portal/invoices/[id]/pdf` - Download invoice PDF
- ✅ `/api/portal/payment` - Process online payment

**Statements & Documents** (3 endpoints):

- ✅ `/api/portal/statements` - Download statements
- ✅ `/api/portal/documents` - List documents
- ✅ `/api/portal/payment-history` - Payment history

**Total Endpoints**: 11 (3 categories)

### Risks & Blockers

| Risk                                  | Impact   | Mitigation                                                   | Owner     |
| ------------------------------------- | -------- | ------------------------------------------------------------ | --------- |
| Customer authentication security      | CRITICAL | Multi-factor auth; session management; rate limiting         | @security |
| Payment processing security (PCI)     | CRITICAL | PCI-compliant payment gateway; no card storage; tokenization | @security |
| Customer data exposure                | HIGH     | Row-level security; audit logging; data encryption           | @backend  |
| Portal availability (customer-facing) | HIGH     | High availability setup; CDN; monitoring; fallback pages     | @ops      |
| Document generation performance       | MED      | Async PDF generation; caching; CDN delivery                  | @backend  |

---

## 🎯 3 Killer Features

### 1. **Self-Service Invoice Portal** 📄

**Description**: Customer-facing portal for viewing invoices, making payments, and downloading statements.

**Why It's Killer**:

- View all invoices and payment history
- One-click online payment
- Download PDF statements
- Dispute management workflow
- Better than email-based invoicing

**Implementation**:

```typescript
import { DataTable, Button, Card } from "aibos-ui";

export default function CustomerPortal() {
  const { invoices, makePayment } = useCustomerInvoices();

  return (
    <div className="space-y-6">
      <Card>
        <h2>Welcome, {customer.name}</h2>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <strong>Account Balance:</strong>
            <div className="text-2xl">{formatCurrency(customer.balance)}</div>
          </div>
          <div>
            <strong>Credit Limit:</strong>
            <div className="text-2xl">
              {formatCurrency(customer.credit_limit)}
            </div>
          </div>
          <div>
            <strong>Available Credit:</strong>
            <div className="text-2xl text-green-600">
              {formatCurrency(customer.available_credit)}
            </div>
          </div>
        </div>
      </Card>

      <DataTable
        data={invoices}
        columns={[
          { key: "invoice_number", label: "Invoice #" },
          { key: "date", label: "Date" },
          { key: "amount", label: "Amount", render: formatCurrency },
          { key: "due_date", label: "Due Date" },
          { key: "status", label: "Status" },
          {
            key: "actions",
            label: "Actions",
            render: (_, row) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  View PDF
                </Button>
                {row.status === "Open" && (
                  <Button size="sm" onClick={() => makePayment(row.id)}>
                    Pay Now
                  </Button>
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
```

### 2. **Online Payment Processing** 💳

**Description**: Secure online payment interface with saved payment methods and payment scheduling.

**Why It's Killer**:

- PCI-compliant payment processing
- Save payment methods securely
- Schedule future payments
- Automatic payment confirmation
- Industry-first customer payment portal

**Implementation**:

```typescript
import { Form, Card, Button } from "aibos-ui";

export default function OnlinePayment({ invoiceId }) {
  const { invoice, processPayment } = usePayment(invoiceId);

  return (
    <Form onSubmit={processPayment}>
      <Card>
        <h3>Pay Invoice {invoice.number}</h3>
        <div className="text-3xl my-4">{formatCurrency(invoice.amount)}</div>

        <Select
          label="Payment Method"
          name="payment_method"
          options={savedMethods}
        />

        <Input label="Card Number" name="card_number" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Expiry" name="expiry" placeholder="MM/YY" />
          <Input label="CVV" name="cvv" type="password" />
        </div>

        <Button type="submit" variant="primary" size="lg">
          Pay {formatCurrency(invoice.amount)}
        </Button>
      </Card>
    </Form>
  );
}
```

### 3. **Statement Downloads** 📥

**Description**: Self-service statement downloads with customizable date ranges and export formats.

**Why It's Killer**:

- Download statements anytime
- Custom date range selection
- Multiple export formats (PDF, Excel)
- Email statement delivery
- Better than calling for statements

**Implementation**:

```typescript
import { Card, Button, DatePicker } from "aibos-ui";

export default function StatementDownload() {
  const { generateStatement } = useStatements();

  return (
    <Card>
      <h3>Download Statements</h3>
      <Form onSubmit={generateStatement}>
        <DatePicker label="Start Date" name="start_date" />
        <DatePicker label="End Date" name="end_date" />
        <Select
          label="Format"
          name="format"
          options={["PDF", "Excel", "CSV"]}
        />
        <Button type="submit">Generate Statement</Button>
      </Form>
    </Card>
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
**File**: `apps/web/app/(portal)/invoices/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                   | Target          | Measurement          |
| ------------------------ | --------------- | -------------------- |
| TTFB (staging)           | ≤ 70ms          | Server timing header |
| Client TTI for `/portal` | ≤ 200ms         | Lighthouse CI        |
| Dashboard load           | < 1s            | Performance profiler |
| PDF generation           | < 3s            | User perception      |
| Payment processing       | < 2s            | User perception      |
| UI bundle size           | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to all portal features
- **Focus Management**: Focus trap in payment forms; visible indicators
- **ARIA**: Payment status announced; invoice details communicated
- **Screen Reader**: All customer data announced; payment flow described
- **Axe Target**: 0 serious/critical violations
- **Mobile**: Touch-optimized for mobile customer access

### Security

| Layer          | Requirement                                                  |
| -------------- | ------------------------------------------------------------ |
| Authentication | Multi-factor auth; session management; secure cookies        |
| Authorization  | Row-level security; customer can only see own data           |
| Data Exposure  | Encrypt customer data; no sensitive data in logs             |
| PCI Compliance | No card storage; tokenization; PCI-compliant payment gateway |
| Audit Trail    | All customer activities logged                               |
| Rate Limiting  | Protect against brute force; API rate limits                 |

#### UI Permissions Matrix

| Role           | View Invoices | Make Payment | Download Statements | Update Profile | View Documents |
| -------------- | ------------- | ------------ | ------------------- | -------------- | -------------- |
| customer       | ✅ (own only) | ✅ (own)     | ✅ (own)            | ✅             | ✅ (own)       |
| customer.admin | ✅ (company)  | ✅ (company) | ✅ (company)        | ✅ (users)     | ✅ (company)   |

### Reliability & Observability

- **SLO**: 99.9% portal availability; 99% payment success rate
- **SLA Dashboards**: Real-time metrics on portal uptime, payment success
- **Events Emitted**: `Portal.Login`, `Portal.PaymentMade`, `Portal.StatementDownloaded`
- **Logging**: Structured logs with customer IDs for all activities
- **Tracing**: Distributed tracing for payment workflows
- **Monitoring**: Portal uptime; payment success rate; PDF generation time

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Customer Portal Rules

| Rule                        | Enforcement                                                   |
| --------------------------- | ------------------------------------------------------------- |
| **Data Isolation**          | Customers can only access their own data (row-level security) |
| **Payment Authorization**   | Customer must be authenticated to make payments               |
| **Invoice Visibility**      | Only show invoices customer has access to                     |
| **Payment Method Security** | Tokenize payment methods; no raw card data stored             |
| **Statement Generation**    | Async generation; email notification when ready               |
| **Session Management**      | Auto-logout after 30min inactivity                            |
| **Login Attempts**          | Lock account after 5 failed attempts                          |
| **Document Access**         | Secure signed URLs; expiry after 24h                          |

### Portal Workflow

- **Login**: Email/password → MFA → Dashboard
- **Payment Flow**: Select invoice → Choose payment method → Confirm → Receipt
- **Statement Flow**: Select date range → Request generation → Email notification → Download
- **Security**: All actions logged; suspicious activity alerts

### Archive Semantics

- **Customer History**: Retain all portal activities indefinitely
- **Audit Trail**: Maintain full audit trail of all customer actions
- **Guard Rails**:
  - ❌ Deny delete of customer payment history
  - ❌ Deny modification of customer audit logs
  - ✅ Allow customer to update own profile

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                | User Action     |
| --------------------- | ------------------------- | --------------- |
| **Empty**             | "No invoices"             | "View paid"     |
| **Loading**           | Skeleton table            | N/A             |
| **Error**             | Error message + retry     | Retry / Support |
| **Open**              | Green badge "Open"        | Pay now         |
| **Paid**              | Blue badge "Paid"         | View receipt    |
| **Overdue**           | Red badge "Overdue"       | Pay now         |
| **Processing**        | Orange badge "Processing" | N/A             |
| **Failed**            | Red badge "Failed"        | Retry payment   |
| **Permission Denied** | "Access restricted"       | Contact support |

### Form Validation

- **Payment Amount**: Must match invoice amount; validate format
- **Payment Method**: Required; must be valid (card or ACH)
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal

### Network Errors

| HTTP Status | UI Message                                          | Action              |
| ----------- | --------------------------------------------------- | ------------------- |
| 400         | "Invalid payment data. Check your input."           | Inline field errors |
| 401         | "Session expired. Please log in again."             | Redirect to login   |
| 403         | "You don't have permission to access this invoice." | Back to dashboard   |
| 404         | "Invoice not found."                                | Return to list      |
| 409         | "Payment already processed."                        | Show receipt        |
| 422         | "Payment validation failed."                        | Inline errors       |
| 500         | "Payment processing failed. Please try again."      | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/portal.json`.

### Page Titles & Headers

| Context         | Copy                  | i18n Key                      |
| --------------- | --------------------- | ----------------------------- |
| Dashboard       | "Welcome, {customer}" | `portal.dashboard.title`      |
| Invoices        | "Invoices"            | `portal.invoices.title`       |
| Payment         | "Make Payment"        | `portal.payment.title`        |
| Statements      | "Statements"          | `portal.statements.title`     |
| Payment History | "Payment History"     | `portal.paymentHistory.title` |

### State Messages

| State      | Title              | Message                                          | Action Button  | i18n Key              |
| ---------- | ------------------ | ------------------------------------------------ | -------------- | --------------------- |
| Empty      | "No open invoices" | "You're all caught up! No outstanding invoices." | "View Paid"    | `portal.empty.*`      |
| Open       | "Open invoice"     | "Payment due by {date}"                          | "Pay Now"      | `portal.open.*`       |
| Overdue    | "Invoice overdue"  | "This invoice is {days} days overdue"            | "Pay Now"      | `portal.overdue.*`    |
| Processing | "Processing"       | "Your payment is being processed"                | —              | `portal.processing.*` |
| Paid       | "Paid"             | "Paid on {date}"                                 | "View Receipt" | `portal.paid.*`       |
| Failed     | "Payment failed"   | "Payment failed: {reason}"                       | "Retry"        | `portal.failed.*`     |

### Success Messages (Toast)

| Action               | Message                                      | i18n Key                   |
| -------------------- | -------------------------------------------- | -------------------------- |
| Payment Made         | "Payment of {amount} processed successfully" | `portal.payment.success`   |
| Statement Downloaded | "Statement downloaded successfully"          | `portal.statement.success` |
| Profile Updated      | "Profile updated successfully"               | `portal.profile.success`   |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/usePortal.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function usePortalDashboard() {
  return useQuery({
    queryKey: ["portal", "dashboard"],
    queryFn: () => apiClient.GET("/api/portal/dashboard"),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });
}

export function useCustomerInvoices(filters = {}) {
  return useQuery({
    queryKey: ["portal", "invoices", filters],
    queryFn: () => apiClient.GET("/api/portal/invoices", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });
}

export function useMakePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      invoice_id: string;
      payment_method_id: string;
      amount: number;
    }) => apiClient.POST("/api/portal/payment", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["portal"] });
      toast.success(
        `Payment of ${formatCurrency(data.amount)} processed successfully`
      );
    },
    onError: (error) => {
      if (error.status === 409) {
        toast.error("Payment already processed");
      } else {
        toast.error("Payment processing failed. Please try again.");
      }
    },
  });
}

export function useDownloadStatement() {
  return useMutation({
    mutationFn: (data: {
      start_date: string;
      end_date: string;
      format: string;
    }) => apiClient.POST("/api/portal/statements", { body: data }),
    onSuccess: (data) => {
      toast.success("Statement downloaded successfully");
      // Trigger file download
      window.location.href = data.download_url;
    },
    onError: () => {
      toast.error("Statement generation failed.");
    },
  });
}
```

### Error Mapping

| API Error         | User Message                                        | UI Action            |
| ----------------- | --------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid payment data. Check your input."           | Inline field errors  |
| 409 (Duplicate)   | "Payment already processed."                        | Show receipt         |
| 422 (Validation)  | "Payment validation failed."                        | Inline errors        |
| 403 (Forbidden)   | "You don't have permission to access this invoice." | Back to dashboard    |
| 500 (Server)      | "Payment processing failed. Please try again."      | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for payment mutations

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["portal", "dashboard"][("portal", "invoices", { filters })][
  ("portal", "invoice", invoiceId)
][("portal", "statements")][("portal", "payment-history")];
```

### Invalidation Rules

| Action             | Invalidates                |
| ------------------ | -------------------------- |
| Make Payment       | `["portal"]` (all)         |
| Download Statement | `["portal", "statements"]` |
| Update Profile     | `["portal", "dashboard"]`  |

### Stale Time

| Query Type      | Stale Time | Reasoning                      |
| --------------- | ---------- | ------------------------------ |
| Dashboard       | 30s        | Moderate update frequency      |
| Invoices        | 30s        | Moderate update frequency      |
| Invoice Detail  | 1min       | Changes less frequently        |
| Payment History | 5min       | Historical data changes rarely |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("portal-dashboard");
revalidateTag("portal-invoices");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/portal.fixtures.ts`

**Datasets**:

- `minimalPortal`: 3 invoices (open, paid, overdue)
- `standardPortal`: 15 invoices with payment history
- `complexPortal`: 30+ invoices with statements and documents
- `edgeCases`: Edge cases (failed payments, disputed invoices)

**Edge Cases Covered**:

- Overdue invoices
- Failed payment retry
- Partial payments
- Multiple payment methods
- Statement generation
- Document access

```typescript
// Example fixture
export const standardPortalFixture: PortalFixture = {
  customer: {
    id: "cust_1",
    name: "Acme Corp",
    balance: 50000.0,
    credit_limit: 100000.0,
    available_credit: 50000.0,
  },
  invoices: [
    {
      id: "inv_1",
      invoice_number: "INV-001",
      date: "2025-09-01",
      amount: 10000.0,
      due_date: "2025-10-01",
      status: "open",
    },
    // ... more invoices
  ],
};
```

### E2E Seed Data

**Location**: `tests/seeds/portal.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:portal
```

**Dataset**:

- 5 test customers with portal access
- 20 invoices (various statuses)
- Payment history
- Saved payment methods (tokenized)
- Statements and documents

**Cleanup Command**:

```powershell
pnpm run seed:portal:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic "Demo Corp" customer portal
- 10 invoices across all statuses
- Payment history with receipts
- Statement downloads
- Document library

**Regeneration**:

```powershell
pnpm run demo:reset:portal
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] All invoices have valid customers
- [ ] Payment amounts match invoices
- [ ] No PCI data in fixtures
- [ ] Document URLs are signed

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
- **Interactive Parts**: Mark with `"use client"` (payment forms, invoice viewing)

### Data Fetching Strategy

| Scenario          | Strategy                             | Benefit              |
| ----------------- | ------------------------------------ | -------------------- |
| Initial Dashboard | Server-side fetch + stream           | Faster TTFB          |
| Payment Actions   | Client-side with immediate feedback  | Instant confirmation |
| Invoice List      | Server component with client filters | SEO + interactivity  |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function makePayment(data) {
  // ... mutation logic
  revalidateTag("portal-dashboard");
  revalidateTag("portal-invoices");
}
```

---

## 📊 Analytics & Audit Events

| Event                      | When               | Properties                                              |
| -------------------------- | ------------------ | ------------------------------------------------------- |
| Portal.Login               | Customer login     | `customer_id`, `ip_address`, `user_agent`               |
| Portal.InvoiceViewed       | Invoice opened     | `customer_id`, `invoice_id`                             |
| Portal.PaymentMade         | Payment processed  | `customer_id`, `invoice_id`, `amount`, `payment_method` |
| Portal.PaymentFailed       | Payment failed     | `customer_id`, `invoice_id`, `amount`, `error_reason`   |
| Portal.StatementDownloaded | Statement download | `customer_id`, `start_date`, `end_date`, `format`       |
| Portal.ProfileUpdated      | Profile updated    | `customer_id`, `changed_fields`                         |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Portal.PaymentMade", {
  customer_id: "cust_123",
  invoice_id: "inv_456",
  amount: 10000.0,
  payment_method: "card",
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/portal.json`
- **Date/Number Formatting**: Use `Intl` APIs with customer locale
- **Currency**: Format per customer locale
- **RTL Support**: CSS logical properties; test with Arabic locale

### Keyboard Shortcuts

| Key      | Action             | Scope          |
| -------- | ------------------ | -------------- |
| `/`      | Focus search       | Any page       |
| `p`      | Make payment       | Invoice detail |
| `d`      | Download PDF       | Invoice detail |
| `s`      | Download statement | Dashboard      |
| `↑ / ↓`  | Navigate invoices  | Invoice list   |
| `Enter`  | Open invoice       | Invoice list   |
| `Escape` | Close modal/cancel | Modal/Form     |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["p", () => openPaymentModal()],
  ["d", () => downloadPDF()],
  ["s", () => downloadStatement()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort               | Success Criteria                                              | Duration | Rollback Trigger |
| ----------- | -------------------- | ------------------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers       | Manual QA passes                                              | 1 day    | Critical bugs    |
| Staging     | QA team + PM         | All E2E tests pass, payment success ≥99%                      | 2 days   | Test failures    |
| Production  | Beta customers (5%)  | Error rate < 0.1%, payment success ≥99%, portal uptime ≥99.9% | 3 days   | SLO breach       |
| Production  | All customers (100%) | Monitor for 24h, error budget maintained                      | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m25_portal: false,                       // Master toggle
  m25_portal_payment: false,               // Online payment
  m25_portal_statements: false,            // Statement downloads
  m25_portal_documents: false,             // Document library
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Portal uptime (≥99.9% required)
- Payment success rate (≥99% required)
- PDF generation time (< 3s)
- Customer login success rate
- Error rate by page

**Alert Thresholds**:

- Portal downtime > 1min → immediate page
- Payment success < 99% → investigate
- PDF generation > 5s → investigate
- Login failure rate > 5% → security alert

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m25_portal = false`

   ```powershell
   pnpm run flags:set m25_portal=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("portal-dashboard");
   revalidateTag("portal-invoices");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/portal/*"
   ```

4. **Monitor for 15 minutes**:

   - Error rate drops below 0.1%
   - No new Sentry issues
   - Customers see maintenance message

5. **Post-mortem**:
   - Create incident report
   - Identify root cause
   - Add regression test

**Rollback Decision Matrix**:

| Scenario                      | Action             | Approval Required |
| ----------------------------- | ------------------ | ----------------- |
| Portal downtime > 5min        | Immediate rollback | No (auto-trigger) |
| Payment success < 95%         | Immediate rollback | No (auto-trigger) |
| Security breach detected      | Immediate rollback | No (auto-trigger) |
| Customer complaints > 20      | Investigate first  | On-call engineer  |
| PDF generation failures > 10% | Partial rollback   | On-call engineer  |

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

- Stripe: Payment processing UX
- Square: Customer portal design
- QuickBooks: Invoice viewing
- PCI DSS: Payment security standards

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Customer Authentication Security

**Mitigation**: Multi-factor auth; session management; rate limiting; account lockout after 5 failed attempts

### Risk #2: Payment Processing Security (PCI)

**Mitigation**: PCI-compliant payment gateway; no card storage; tokenization; secure payment forms

### Risk #3: Customer Data Exposure

**Mitigation**: Row-level security; audit logging; data encryption; secure signed URLs for documents

### Risk #4: Portal Availability (Customer-Facing)

**Mitigation**: High availability setup; CDN; monitoring; fallback pages; < 5min rollback procedure

---

## 📝 Implementation Guide

### Day 1: Portal Dashboard & Invoices & Payment (8 hours)

1. Build customer portal dashboard (2 hours)
2. Implement invoice viewing and PDF download (3 hours)
3. Add online payment processing (3 hours)

**Total**: 1 day (8 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Customer authentication
- [ ] Payment amount validation
- [ ] PDF generation
- [ ] Statement date range validation
- [ ] Row-level security filtering

### Integration Tests

- [ ] Login → view dashboard
- [ ] View invoice → make payment
- [ ] Generate statement → download
- [ ] Failed payment → retry
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] Customer can log in
- [ ] Customer can view invoices
- [ ] Customer can make payment
- [ ] Customer can download statement
- [ ] Customer can view payment history
- [ ] Keyboard-only flow: login → invoice → payment

---

## 📅 Timeline

| Day | Deliverable                    |
| --- | ------------------------------ |
| 1   | Dashboard + Invoices + Payment |

**Total**: 1 day (8 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M4: Accounts Receivable (for invoice data)
- ✅ M23: Payment Processing (for payment gateway)

### Enables These Modules

- M24: AR Collections (customer self-service reduces calls)

---

## 🎯 Success Criteria

### Must Have

- [ ] Customer portal dashboard
- [ ] Invoice viewing and PDF download
- [ ] Online payment processing
- [ ] Payment history tracking
- [ ] Portal uptime ≥99.9%, Payment success ≥99%

### Should Have

- [ ] Statement downloads
- [ ] Document library
- [ ] Profile management
- [ ] Payment method management

### Nice to Have

- [ ] Dispute management
- [ ] Order tracking
- [ ] Support ticket creation
- [ ] Multi-user access for large customers

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created (`/portal/dashboard`, `/portal/invoices`, `/portal/payment`, `/portal/statements`)
- [ ] Customer authentication working
- [ ] Invoice viewing working
- [ ] Online payment working
- [ ] Statement downloads working
- [ ] Permissions enforced (row-level security)
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
- [ ] Integration tests: All portal operations covered
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/portal`
- [ ] PDF generation: < 3s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced
- [ ] Mobile: Touch-optimized

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

- [ ] Authentication implemented
- [ ] Row-level security enforced
- [ ] PCI compliance validated
- [ ] Customer data encrypted
- [ ] Audit trail complete

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All tests passed
- [ ] **Design**: UI matches specs
- [ ] **PM**: Feature complete
- [ ] **Security**: Security review passed (authentication, PCI)
- [ ] **Accessibility**: A11y audit passed
- [ ] **Customer Success**: Customer portal workflows approved

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M24 - AR Collections  
**Next**: M26 - Recurring Billing
