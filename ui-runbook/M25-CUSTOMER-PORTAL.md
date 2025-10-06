# 🚀 M25: Customer Portal - UI Implementation Runbook

**Module ID**: M25  
**Module Name**: Customer Portal  
**Priority**: MEDIUM  
**Phase**: 7 - Payments & Billing  
**Estimated Effort**: 2 days  
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

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 11 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/[path]` - [Endpoint description]
- ✅ `/api/[path]` - [Endpoint description]

**Total Endpoints**: 11

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
**File**: `apps/web/app/(dashboard)/[module]/[id]/page.tsx`

---

## 🔌 API Integration

```typescript
// apps/web/hooks/useCustomerPortal.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@aibos/api-client';

export function useCustomerPortal(filters = {}) {
  return useQuery({
    queryKey: ['m25', filters],
    queryFn: () => apiClient.GET('/api/[path]', { query: filters }),
  });
}

export function useCreateCustomerPortal() {
  return useMutation({
    mutationFn: data => apiClient.POST('/api/[path]', { body: data }),
    onSuccess: () => queryClient.invalidateQueries(['m25']),
  });
}
```

---

## 📝 Implementation Guide

### Day 1: [Tasks] (8 hours)

1. [Task 1] (X hours)
2. [Task 2] (X hours)
3. [Task 3] (X hours)

### Day 2: [Tasks] (8 hours)

1. [Task 1] (X hours)
2. [Task 2] (X hours)
3. [Task 3] (X hours)

**Total**: 2 days (16 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] [Test description]
- [ ] [Test description]
- [ ] [Test description]

### Integration Tests

- [ ] [Test description]
- [ ] [Test description]
- [ ] [Test description]

### E2E Tests

- [ ] [Test description]
- [ ] [Test description]
- [ ] [Test description]

---

## 📅 Timeline

| Day | Deliverable               |
| --- | ------------------------- |
| 1   | [Deliverable description] |
| 2   | [Deliverable description] |

**Total**: 2 days (16 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries

### Enables These Modules

- [Dependent module 1]
- [Dependent module 2]

---

## 🎯 Success Criteria

### Must Have

- [ ] [Core requirement 1]
- [ ] [Core requirement 2]
- [ ] [Core requirement 3]

### Should Have

- [ ] [Enhancement 1]
- [ ] [Enhancement 2]

### Nice to Have

- [ ] [Optional feature 1]
- [ ] [Optional feature 2]

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M24 - [Previous Module]  
**Next**: M26 - [Next Module]
