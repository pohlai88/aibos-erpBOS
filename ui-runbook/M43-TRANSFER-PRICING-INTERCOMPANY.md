# 🎯 M43: Transfer Pricing & Intercompany - UI Implementation Runbook

**Module ID**: M43  
**Module Name**: Transfer Pricing & Intercompany  
**Priority**: 🔥 HIGH  
**Phase**: Phase 11 - Critical Missing Modules  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M18-INTERCOMPANY

---

## 📋 Module Overview

Transfer Pricing & Intercompany provides **transfer pricing calculations** and **intercompany pricing management** for businesses requiring **multinational compliance**, **arm's length pricing**, and **transfer pricing documentation**.

### Business Value

**Key Benefits**:

- **Transfer Pricing**: Calculate and document transfer prices
- **Arm's Length Compliance**: Ensure OECD compliance
- **Pricing Methods**: Support multiple transfer pricing methods
- **Documentation**: Generate transfer pricing documentation

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status     | Details                                        |
| ------------- | ---------- | ---------------------------------------------- |
| **Database**  | 🔄 PARTIAL | IC matching exists, needs pricing calculations |
| **Services**  | 🔄 PARTIAL | IC services exist, needs pricing               |
| **API**       | 🔄 PARTIAL | IC APIs exist, needs pricing                   |
| **Contracts** | 🔄 PARTIAL | IC types exist, needs pricing                  |

### API Endpoints

**Transfer Pricing** (Enhancement needed):

- 🔄 `/api/intercompany` - Enhance with transfer pricing
- ❌ `/api/transfer-pricing/methods` - Pricing methods
- ❌ `/api/transfer-pricing/calculate` - Calculate transfer prices
- ❌ `/api/transfer-pricing/documentation` - Generate documentation
- ❌ `/api/transfer-pricing/compliance` - Compliance reports

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                            | Page Component        | Purpose                     |
| -------------------------------- | --------------------- | --------------------------- |
| `/intercompany/transfer-pricing` | `TransferPricingPage` | Transfer pricing management |
| `/intercompany/pricing-methods`  | `PricingMethodsPage`  | Pricing methods setup       |
| `/intercompany/documentation`    | `TPDocumentationPage` | TP documentation            |
| `/intercompany/compliance`       | `TPCompliancePage`    | TP compliance reports       |

### Component Structure

```
apps/web/app/(dashboard)/intercompany/
├── transfer-pricing/
│   └── page.tsx                     # Transfer pricing page
├── pricing-methods/
│   └── page.tsx                     # Pricing methods page
├── documentation/
│   └── page.tsx                     # TP documentation page
└── compliance/
    └── page.tsx                     # TP compliance page

apps/web/components/intercompany/
├── TransferPricingForm.tsx          # Transfer pricing form
├── PricingMethodSelector.tsx        # Pricing method selector
├── TPCalculator.tsx                 # TP calculator
├── TPDocumentation.tsx              # TP documentation
└── TPComplianceReports.tsx          # TP compliance reports

apps/web/hooks/intercompany/
├── useTransferPricing.ts            # Transfer pricing hook
├── usePricingMethods.ts             # Pricing methods hook
├── useTPCalculation.ts              # TP calculation hook
└── useTPDocumentation.ts            # TP documentation hook
```

### Server/Client Boundaries

- **Server Components**: List pages, documentation pages
- **Client Components**: Forms, calculators, method selectors
- **Feature Flag**: `flags.m43_transfer_pricing = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose           | Variant                    |
| ----------- | ----------------- | -------------------------- |
| `DataTable` | List transactions | With filters, pagination   |
| `Card`      | Pricing details   | With actions               |
| `Form`      | Pricing forms     | With validation            |
| `Button`    | Actions           | Primary, secondary, danger |
| `Select`    | Method selector   | With search                |
| `Currency`  | Price input       | With formatting            |
| `Badge`     | Method tags       | With colors                |

### Design Tokens

```typescript
// Transfer pricing specific colors
const tpColors = {
  cup: "hsl(var(--tp-cup))", // Comparable Uncontrolled Price
  rpm: "hsl(var(--tp-rpm))", // Resale Price Method
  cpm: "hsl(var(--tp-cpm))", // Cost Plus Method
  tnmm: "hsl(var(--tp-tnmm))", // Transactional Net Margin Method
  psm: "hsl(var(--tp-psm))", // Profit Split Method
};

// Compliance status colors
const complianceColors = {
  compliant: "bg-green-100 text-green-800",
  review: "bg-yellow-100 text-yellow-800",
  noncompliant: "bg-red-100 text-red-800",
  documented: "bg-blue-100 text-blue-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  transferPricing: ["intercompany", "transfer-pricing"] as const,
  pricingMethods: ["intercompany", "pricing-methods"] as const,
  tpCalculation: ["intercompany", "tp-calculation"] as const,
  tpDocumentation: ["intercompany", "tp-documentation"] as const,
};
```

### Cache Configuration

| Query Type       | Stale Time | Cache Time | Invalidation      |
| ---------------- | ---------- | ---------- | ----------------- |
| Transfer Pricing | 10 minutes | 30 minutes | On pricing update |
| Pricing Methods  | 1 hour     | 4 hours    | On method update  |
| TP Calculation   | 5 minutes  | 15 minutes | On calculation    |
| TP Documentation | 1 day      | 7 days     | On doc generation |

---

## 🚀 Implementation Guide

### Step 1: Enhance M18-INTERCOMPANY

```bash
# Enhance existing intercompany module
# Add transfer pricing fields
# Add pricing method services
# Add TP calculation APIs
```

### Step 2: Create Components

```typescript
// apps/web/components/intercompany/TransferPricingForm.tsx
"use client";

import { Form } from "@/components/ui/form";
import { useTransferPricing } from "@/hooks/intercompany/useTransferPricing";

export function TransferPricingForm({
  transactionId,
  onSuccess,
}: {
  transactionId: string;
  onSuccess?: () => void;
}) {
  const { mutate: updatePricing } = useTransferPricing();

  return (
    <Form onSubmit={(data) => updatePricing({ transactionId, ...data })}>
      {/* Transfer pricing form fields */}
    </Form>
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/intercompany/useTransferPricing.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useTransferPricing(transactionId?: string) {
  return useQuery({
    queryKey: ["intercompany", "transfer-pricing", transactionId],
    queryFn: () => api.intercompany.getTransferPricing(transactionId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateTransferPricing() {
  return useMutation({
    mutationFn: (data: TransferPricingUpdate) =>
      api.intercompany.updateTransferPricing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["intercompany", "transfer-pricing"],
      });
    },
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/intercompany/transfer-pricing/page.tsx
import { TransferPricingList } from "@/components/intercompany/TransferPricingList";
import { TransferPricingFilters } from "@/components/intercompany/TransferPricingFilters";

export default function TransferPricingPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transfer Pricing</h1>
        <CreateTransferPricingButton />
      </div>
      <TransferPricingFilters />
      <TransferPricingList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/intercompany/transfer-pricing/__tests__/TransferPricingList.test.tsx
import { render, screen } from "@testing-library/react";
import { TransferPricingList } from "@/components/intercompany/TransferPricingList";

describe("TransferPricingList", () => {
  it("renders list of transfer pricing transactions", () => {
    render(<TransferPricingList />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
```

---

## ♿ Accessibility

### WCAG 2.2 AA Compliance

- **Color Contrast**: ≥4.5:1 for normal text, ≥3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader**: Proper ARIA labels and descriptions
- **Focus Management**: Clear focus indicators, logical tab order

### Keyboard Shortcuts

| Shortcut       | Action                      |
| -------------- | --------------------------- |
| `Ctrl/Cmd + N` | Create new transfer pricing |
| `Ctrl/Cmd + F` | Focus search field          |
| `Escape`       | Close modal/dialog          |
| `Enter`        | Submit form                 |

### ARIA Implementation

```typescript
// Transfer pricing table
<table role="table" aria-label="Transfer pricing transactions">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Transaction</th>
      <th role="columnheader" aria-sort="none">Pricing Method</th>
      <th role="columnheader" aria-sort="none">Amount</th>
    </tr>
  </thead>
</table>

// Form
<form role="form" aria-label="Create transfer pricing">
  <input aria-describedby="pricing-error" aria-invalid="false" />
  <div id="pricing-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("TransferPricingList", () => {
  it("renders list of transfer pricing transactions", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useTransferPricing", () => {
  it("fetches transfer pricing data", () => {});
  it("handles pagination", () => {});
  it("handles filters", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Transfer Pricing API Integration", () => {
  it("creates transfer pricing successfully", () => {});
  it("updates transfer pricing successfully", () => {});
  it("calculates arm's length pricing correctly", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Transfer Pricing E2E", () => {
  it("complete create flow", () => {});
  it("complete edit flow", () => {});
  it("pricing calculation flow", () => {});
  it("search and filter functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Transfer Pricing Accessibility", () => {
  it("meets WCAG 2.2 AA standards", () => {});
  it("supports keyboard navigation", () => {});
  it("works with screen readers", () => {});
  it("has proper color contrast", () => {});
});
```

---

## ⚡ Performance

### Bundle Size

- **Target**: ≤250KB gzipped per route
- **Current**: <CURRENT_SIZE>KB
- **Optimization**: Code splitting, lazy loading

### Loading Performance

- **TTFB**: ≤70ms (Time to First Byte)
- **TTI**: ≤200ms (Time to Interactive)
- **LCP**: ≤2.5s (Largest Contentful Paint)

### Optimization Strategies

```typescript
// Lazy loading
const TransferPricingCreatePage = lazy(() => import("./create/page"));

// Code splitting
const TransferPricingForm = lazy(
  () => import("./components/TransferPricingForm")
);

// Virtual scrolling for large lists
import { FixedSizeList as List } from "react-window";
```

---

## ✅ Quality Gates

### Code Quality

| Gate              | Threshold | Enforcement |
| ----------------- | --------- | ----------- |
| TypeScript errors | 0         | CI blocks   |
| ESLint errors     | 0         | CI blocks   |
| Test coverage     | ≥90%      | CI blocks   |
| Bundle size       | ≤250KB    | CI blocks   |

### Performance

| Gate                     | Threshold | Enforcement |
| ------------------------ | --------- | ----------- |
| TTFB                     | ≤70ms     | Manual      |
| TTI                      | ≤200ms    | Manual      |
| Lighthouse Performance   | ≥90       | CI warns    |
| Lighthouse Accessibility | ≥95       | CI warns    |

### Accessibility

| Gate                | Threshold          | Enforcement |
| ------------------- | ------------------ | ----------- |
| WCAG 2.2 AA         | 100%               | CI blocks   |
| Axe violations      | 0 serious/critical | CI blocks   |
| Keyboard navigation | 100%               | Manual      |
| Screen reader       | 100%               | Manual      |

---

## 🚀 Deployment

### Feature Flag

```typescript
// Feature flag configuration
const flags = {
  m43_transfer_pricing: false, // Default: disabled
};

// Usage in components
if (flags.m43_transfer_pricing) {
  return <TransferPricingList />;
}
return <ComingSoon />;
```

### Rollout Plan

| Environment | Cohort           | Success Criteria  | Duration |
| ----------- | ---------------- | ----------------- | -------- |
| Dev         | All developers   | Manual QA passes  | 1 day    |
| Staging     | QA team          | All tests pass    | 2 days   |
| Production  | Beta users (5%)  | Error rate < 0.1% | 3 days   |
| Production  | All users (100%) | Monitor for 24h   | Ongoing  |

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m43_transfer_pricing = false`
2. **Invalidate cache**: `revalidateTag('transfer-pricing')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Transfer pricing calculation functional
- [ ] Arm's length pricing compliance
- [ ] Search and filtering functional
- [ ] Pagination working correctly
- [ ] Form validation complete
- [ ] Error handling implemented
- [ ] Loading states shown
- [ ] Success messages displayed
- [ ] Responsive design verified

### Quality Requirements

- [ ] All quality gates passed
- [ ] Test coverage ≥90%
- [ ] Accessibility compliant
- [ ] Performance targets met
- [ ] Code review approved
- [ ] QA sign-off obtained
- [ ] Design sign-off obtained
- [ ] Feature flag deployed

---

**Ready to implement Transfer Pricing & Intercompany UI! 🚀**
}: {
transactionId: string;
}) {
const { mutate: updatePricing } = useTransferPricing();

return (

<Form onSubmit={(data) => updatePricing({ transactionId, ...data })}>
{/_ Transfer pricing form fields _/}
</Form>
);
}

````

---

## ✅ Quality Gates

### Code Quality

| Gate              | Threshold | Enforcement |
| ----------------- | --------- | ----------- |
| TypeScript errors | 0         | CI blocks   |
| ESLint errors     | 0         | CI blocks   |
| Test coverage     | ≥90%      | CI blocks   |
| Bundle size       | ≤300KB    | CI blocks   |

---

## 🚀 Deployment

### Feature Flag

```typescript
const flags = {
  m43_transfer_pricing: false, // Default: disabled
};
````

---

## 📝 Definition of Done

### Functional Requirements

- [ ] Transfer pricing calculation working
- [ ] Pricing methods functional
- [ ] TP documentation generation working
- [ ] Compliance reporting working
- [ ] Form validation complete
- [ ] Error handling implemented
- [ ] Loading states shown
- [ ] Success messages displayed
- [ ] Responsive design verified

### Quality Requirements

- [ ] All quality gates passed
- [ ] Test coverage ≥90%
- [ ] Accessibility compliant
- [ ] Performance targets met
- [ ] Code review approved
- [ ] QA sign-off obtained
- [ ] Design sign-off obtained
- [ ] Feature flag deployed

---

**Ready to enhance M18-INTERCOMPANY with Transfer Pricing! 🚀**
