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
}: {
  transactionId: string;
}) {
  const { mutate: updatePricing } = useTransferPricing();

  return (
    <Form onSubmit={(data) => updatePricing({ transactionId, ...data })}>
      {/* Transfer pricing form fields */}
    </Form>
  );
}
```

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
```

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
