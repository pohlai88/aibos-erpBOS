# 🎯 M47: Impairment Testing & Goodwill - UI Implementation Runbook

**Module ID**: M47  
**Module Name**: Impairment Testing & Goodwill  
**Priority**: 🔥 HIGH  
**Phase**: Phase 11 - Critical Missing Modules  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M10-INTANGIBLE-ASSETS

---

## 📋 Module Overview

Impairment Testing & Goodwill provides **impairment testing** and **goodwill management** for businesses requiring **ASC 350/IAS 36 compliance**, **fair value assessments**, and **impairment loss tracking**.

### Business Value

**Key Benefits**:

- **Impairment Testing**: Perform annual and triggering event impairment tests
- **ASC 350/IAS 36 Compliance**: Automated impairment accounting compliance
- **Goodwill Management**: Track goodwill by reporting unit
- **Fair Value Assessment**: Calculate and document fair value assessments

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status     | Details                                      |
| ------------- | ---------- | -------------------------------------------- |
| **Database**  | 🔄 PARTIAL | Basic intangible assets exist, needs testing |
| **Services**  | 🔄 PARTIAL | Asset services exist, needs impairment       |
| **API**       | 🔄 PARTIAL | Asset APIs exist, needs impairment           |
| **Contracts** | 🔄 PARTIAL | Asset types exist, needs impairment          |

### API Endpoints

**Impairment Testing** (Enhancement needed):

- 🔄 `/api/intangible-assets` - Enhance with impairment fields
- ❌ `/api/impairment/tests` - Manage impairment tests
- ❌ `/api/impairment/calculate` - Calculate impairment
- ❌ `/api/goodwill` - Manage goodwill by reporting unit
- ❌ `/api/impairment/reports` - Generate impairment reports

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                    | Page Component           | Purpose                |
| ------------------------ | ------------------------ | ---------------------- |
| `/impairment/tests`      | `ImpairmentTestsPage`    | Impairment tests       |
| `/impairment/goodwill`   | `GoodwillManagementPage` | Goodwill management    |
| `/impairment/fair-value` | `FairValuePage`          | Fair value assessments |
| `/impairment/losses`     | `ImpairmentLossesPage`   | Impairment losses      |

### Component Structure

```
apps/web/app/(dashboard)/impairment/
├── tests/
│   └── page.tsx                    # Impairment tests page
├── goodwill/
│   └── page.tsx                    # Goodwill management page
├── fair-value/
│   └── page.tsx                    # Fair value page
└── losses/
    └── page.tsx                    # Impairment losses page

apps/web/components/impairment/
├── ImpairmentTestForm.tsx          # Impairment test form
├── GoodwillByUnit.tsx              # Goodwill by reporting unit
├── FairValueCalculator.tsx         # Fair value calculator
├── ImpairmentLossList.tsx          # Impairment loss list
└── ImpairmentReports.tsx           # Impairment reports

apps/web/hooks/impairment/
├── useImpairmentTests.ts           # Impairment tests hook
├── useGoodwill.ts                  # Goodwill hook
├── useFairValue.ts                 # Fair value hook
└── useImpairmentLosses.ts          # Impairment losses hook
```

### Server/Client Boundaries

- **Server Components**: List pages, report pages
- **Client Components**: Forms, calculators, charts
- **Feature Flag**: `flags.m47_impairment_testing = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose             | Variant                    |
| ----------- | ------------------- | -------------------------- |
| `DataTable` | List tests/goodwill | With filters, pagination   |
| `Card`      | Test details        | With actions               |
| `Form`      | Test forms          | With validation            |
| `Button`    | Actions             | Primary, secondary, danger |
| `Currency`  | Amount input        | With formatting            |
| `Chart`     | Goodwill trends     | With tooltips              |
| `Badge`     | Test status         | With colors                |

### Design Tokens

```typescript
// Impairment testing specific colors
const impairmentColors = {
  goodwill: "hsl(var(--impairment-goodwill))",
  fairValue: "hsl(var(--impairment-fair-value))",
  carryingValue: "hsl(var(--impairment-carrying))",
  impaired: "hsl(var(--impairment-impaired))",
};

// Test status colors
const testStatusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  inProgress: "bg-yellow-100 text-yellow-800",
  passed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  impaired: "bg-red-100 text-red-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  impairmentTests: ["impairment", "tests"] as const,
  goodwill: ["impairment", "goodwill"] as const,
  fairValue: ["impairment", "fair-value"] as const,
  impairmentLosses: ["impairment", "losses"] as const,
};
```

### Cache Configuration

| Query Type        | Stale Time | Cache Time | Invalidation       |
| ----------------- | ---------- | ---------- | ------------------ |
| Impairment Tests  | 10 minutes | 30 minutes | On test completion |
| Goodwill          | 10 minutes | 30 minutes | On goodwill update |
| Fair Value        | 1 hour     | 4 hours    | On assessment      |
| Impairment Losses | 10 minutes | 30 minutes | On loss recording  |

---

## 🚀 Implementation Guide

### Step 1: Enhance M10-INTANGIBLE-ASSETS

```bash
# Enhance existing intangible assets module
# Add impairment testing fields
# Add goodwill management
# Add fair value assessment
```

### Step 2: Create Components

```typescript
// apps/web/components/impairment/ImpairmentTestForm.tsx
"use client";

import { Form } from "@/components/ui/form";
import { useImpairmentTests } from "@/hooks/impairment/useImpairmentTests";

export function ImpairmentTestForm({ assetId }: { assetId: string }) {
  const { mutate: performTest } = useImpairmentTests();

  return (
    <Form onSubmit={(data) => performTest({ assetId, ...data })}>
      {/* Impairment test form fields */}
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
  m47_impairment_testing: false, // Default: disabled
};
```

---

## 📝 Definition of Done

### Functional Requirements

- [ ] Impairment testing working
- [ ] Goodwill management functional
- [ ] Fair value assessment working
- [ ] Impairment loss tracking working
- [ ] ASC 350/IAS 36 reporting working
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

**Ready to enhance M10-INTANGIBLE-ASSETS with Impairment Testing! 🚀**
