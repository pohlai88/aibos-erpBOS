# 🎯 M44: Multi-GAAP & Local Stat Adjustments - UI Implementation Runbook

**Module ID**: M44  
**Module Name**: Multi-GAAP & Local Stat Adjustments  
**Priority**: 🚨 CRITICAL  
**Phase**: Financial Operations  
**Estimated Effort**: 4 days  
**Last Updated**: 2025-10-06

---

## 📋 Module Overview

Multi-GAAP & Local Stat Adjustments provides **multi-standard compliance** for businesses requiring **GAAP/IFRS adjustments**, **Southeast Asian statutory reporting**, and **regional regulatory compliance**.

### Business Value

**Key Benefits**:

- **ASEAN Compliance**: Meet local statutory requirements across 6 Southeast Asian markets
- **Dual-Standard Support**: IFRS and local GAAP (Malaysia MFRS, Singapore SFRS, etc.)
- **Multi-Currency**: Support for MYR, SGD, THB, VND, IDR, PHP
- **Regional Reporting**: Automated compliance for SSM, ACRA, BIR, and other regulators
- **Audit Readiness**: Complete audit trail for cross-border adjustments

### Target Markets

| Country        | Local GAAP        | Regulatory Body                            | Currency |
| -------------- | ----------------- | ------------------------------------------ | -------- |
| 🇲🇾 Malaysia    | MFRS (IFRS-based) | SSM (Companies Commission of Malaysia)     | MYR      |
| 🇸🇬 Singapore   | SFRS (IFRS-based) | ACRA (Accounting & Corporate Regulatory)   | SGD      |
| 🇹🇭 Thailand    | TFRS (IFRS-based) | DBD (Department of Business Development)   | THB      |
| 🇻🇳 Vietnam     | VAS               | MOF (Ministry of Finance)                  | VND      |
| 🇮🇩 Indonesia   | PSAK (IFRS-based) | OJK (Financial Services Authority)         | IDR      |
| 🇵🇭 Philippines | PFRS (IFRS-based) | SEC/BIR (Securities & Exchange Commission) | PHP      |

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status | Details                |
| ------------- | ------ | ---------------------- |
| **Database**  | ❌ NO  | No multi-GAAP schema   |
| **Services**  | ❌ NO  | No adjustment services |
| **API**       | ❌ NO  | No adjustment APIs     |
| **Contracts** | ❌ NO  | No adjustment types    |

### API Endpoints

**Multi-GAAP & Local Stat Adjustments** (Implementation needed):

- ❌ `/api/adjustments` - List adjustments
- ❌ `/api/adjustments/[id]` - Get adjustment details
- ❌ `/api/adjustments/create` - Create new adjustment
- ❌ `/api/gaap/standards` - List GAAP/IFRS standards
- ❌ `/api/gaap/standards/[id]` - Get standard details (IFRS, MFRS, SFRS, TFRS, VAS, PSAK, PFRS)
- ❌ `/api/local-stat` - List local statutory requirements by country
- ❌ `/api/local-stat/[id]` - Get local stat details
- ❌ `/api/local-stat/countries` - List supported ASEAN countries
- ❌ `/api/adjustments/reconciliation` - IFRS to local GAAP reconciliation

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                  | Page Component           | Purpose                      |
| ---------------------- | ------------------------ | ---------------------------- |
| `/adjustments`         | `AdjustmentListPage`     | List adjustments             |
| `/adjustments/[id]`    | `AdjustmentDetailPage`   | View adjustment details      |
| `/adjustments/create`  | `AdjustmentCreatePage`   | Create new adjustment        |
| `/gaap/standards`      | `GAAPStandardsPage`      | GAAP standards               |
| `/gaap/standards/[id]` | `GAAPStandardDetailPage` | GAAP standard details        |
| `/local-stat`          | `LocalStatPage`          | Local statutory requirements |
| `/local-stat/[id]`     | `LocalStatDetailPage`    | Local stat details           |

### Component Structure

```
apps/web/app/(dashboard)/adjustments/
├── page.tsx                    # Adjustment list page
├── [id]/
│   └── page.tsx               # Adjustment detail page
└── create/
    └── page.tsx               # Create adjustment page

apps/web/app/(dashboard)/gaap/
├── standards/
│   ├── page.tsx               # GAAP standards page
│   └── [id]/
│       └── page.tsx           # GAAP standard detail page

apps/web/app/(dashboard)/local-stat/
├── page.tsx                    # Local stat page
└── [id]/
    └── page.tsx               # Local stat detail page

apps/web/components/adjustments/
├── AdjustmentList.tsx         # Adjustment list component
├── AdjustmentCard.tsx          # Adjustment card component
├── AdjustmentForm.tsx          # Adjustment form component
├── AdjustmentDetail.tsx       # Adjustment detail component
└── AdjustmentFilters.tsx      # Adjustment filters component

apps/web/components/gaap/
├── GAAPStandards.tsx          # GAAP standards component
├── GAAPStandardCard.tsx       # GAAP standard card component
├── GAAPStandardDetail.tsx     # GAAP standard detail component
└── GAAPStandardForm.tsx      # GAAP standard form component

apps/web/components/local-stat/
├── LocalStatList.tsx          # Local stat list component
├── LocalStatCard.tsx          # Local stat card component
├── LocalStatDetail.tsx        # Local stat detail component
└── LocalStatForm.tsx          # Local stat form component

apps/web/hooks/adjustments/
├── useAdjustmentList.ts       # Adjustment list hook
├── useAdjustmentDetail.ts     # Adjustment detail hook
├── useAdjustmentCreate.ts     # Adjustment create hook
└── useAdjustmentUpdate.ts     # Adjustment update hook

apps/web/hooks/gaap/
├── useGAAPStandards.ts        # GAAP standards hook
├── useGAAPStandardDetail.ts  # GAAP standard detail hook
└── useGAAPStandardCreate.ts  # GAAP standard create hook

apps/web/hooks/local-stat/
├── useLocalStatList.ts        # Local stat list hook
├── useLocalStatDetail.ts      # Local stat detail hook
└── useLocalStatCreate.ts      # Local stat create hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, calculations, compliance checks
- **Feature Flag**: `flags.m44_multi_gaap = false`

---

## 🎨 Design System

### Components Used

| Component    | Purpose             | Variant                    |
| ------------ | ------------------- | -------------------------- |
| `DataTable`  | List adjustments    | With filters, pagination   |
| `Card`       | Adjustment details  | With actions               |
| `Form`       | Adjustment forms    | With validation            |
| `Button`     | Actions             | Primary, secondary, danger |
| `Modal`      | Confirmations       | With backdrop              |
| `Select`     | Standard picker     | With search                |
| `Badge`      | Status tags         | With colors                |
| `Tabs`       | Adjustment sections | With icons                 |
| `DatePicker` | Period selection    | With range                 |
| `Currency`   | Amount input        | With formatting            |
| `Alert`      | Compliance alerts   | With severity levels       |

### Design Tokens

```typescript
// ASEAN Multi-GAAP specific colors
const gaapColors = {
  ifrs: "hsl(var(--ifrs))",
  mfrs: "hsl(var(--mfrs))", // Malaysia
  sfrs: "hsl(var(--sfrs))", // Singapore
  tfrs: "hsl(var(--tfrs))", // Thailand
  vas: "hsl(var(--vas))", // Vietnam
  psak: "hsl(var(--psak))", // Indonesia
  pfrs: "hsl(var(--pfrs))", // Philippines
  adjustment: "hsl(var(--adjustment))",
  compliance: "hsl(var(--compliance))",
};

// Country-specific colors
const countryColors = {
  malaysia: "hsl(var(--my))",
  singapore: "hsl(var(--sg))",
  thailand: "hsl(var(--th))",
  vietnam: "hsl(var(--vn))",
  indonesia: "hsl(var(--id))",
  philippines: "hsl(var(--ph))",
};

// Adjustment status colors
const adjustmentStatusColors = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  posted: "bg-blue-100 text-blue-800",
  reconciled: "bg-purple-100 text-purple-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  adjustments: {
    list: ["adjustments", "list"] as const,
    detail: (id: string) => ["adjustments", "detail", id] as const,
    create: ["adjustments", "create"] as const,
    update: (id: string) => ["adjustments", "update", id] as const,
  },
  gaap: {
    standards: ["gaap", "standards"] as const,
    standardDetail: (id: string) => ["gaap", "standard", id] as const,
    standardCreate: ["gaap", "standard", "create"] as const,
  },
  localStat: {
    list: ["local-stat", "list"] as const,
    detail: (id: string) => ["local-stat", "detail", id] as const,
    create: ["local-stat", "create"] as const,
  },
};
```

### Cache Configuration

| Query Type        | Stale Time | Cache Time | Invalidation            |
| ----------------- | ---------- | ---------- | ----------------------- |
| Adjustment List   | 5 minutes  | 15 minutes | On create/update/delete |
| Adjustment Detail | 10 minutes | 30 minutes | On update/delete        |
| GAAP Standards    | 10 minutes | 30 minutes | On standard update      |
| Local Stat        | 10 minutes | 30 minutes | On local stat update    |

---

## 🎭 User Experience

### User Flows

#### 1. Create Adjustment

1. User navigates to `/adjustments/create`
2. System opens create form
3. User selects GAAP standard and adjustment type
4. User sets adjustment amount and accounts
5. User provides justification and documentation
6. User submits form
7. System creates adjustment and shows approval workflow

#### 2. View Adjustment Details

1. User navigates to `/adjustments`
2. System loads adjustments with pagination
3. User clicks on adjustment to view details
4. System shows adjustment details and compliance status
5. User can approve/reject adjustment

#### 3. Manage GAAP Standards (ASEAN Focus)

1. User navigates to `/gaap/standards`
2. System shows available standards:
   - **IFRS** (International baseline)
   - **MFRS** (Malaysia - IFRS-based)
   - **SFRS** (Singapore - IFRS-based)
   - **TFRS** (Thailand - IFRS-based)
   - **VAS** (Vietnam - unique standards)
   - **PSAK** (Indonesia - IFRS-based)
   - **PFRS** (Philippines - IFRS-based)
3. User can view standard-specific requirements
4. User can configure country-specific rules
5. User can map IFRS to local GAAP differences

#### 4. Configure Local Statutory Requirements (ASEAN)

1. User navigates to `/local-stat`
2. System shows country selector (MY, SG, TH, VN, ID, PH)
3. User selects target country
4. System displays country-specific requirements:
   - **Malaysia**: SSM filing requirements, tax adjustments
   - **Singapore**: ACRA reporting, XBRL taxonomy
   - **Thailand**: DBD requirements, BOI incentives
   - **Vietnam**: MOF circular compliance, VAT specifics
   - **Indonesia**: OJK regulations, tax reconciliation
   - **Philippines**: SEC/BIR requirements, PEZA zones
5. User can configure local adjustments
6. User can generate country-specific compliance reports

### UI States

| State          | Component              | Message                            |
| -------------- | ---------------------- | ---------------------------------- |
| **Empty**      | `AdjustmentEmptyState` | "No adjustments found"             |
| **Loading**    | `AdjustmentSkeleton`   | Loading skeleton                   |
| **Error**      | `AdjustmentErrorState` | "Failed to load adjustments"       |
| **No Results** | `AdjustmentNoResults`  | "No adjustments match your search" |

---

## 🌏 ASEAN-Specific Features

### Country-Specific Adjustments

#### Malaysia (MFRS)

- **SSM Compliance**: Companies Commission filing requirements
- **Tax Adjustments**: Deferred tax, tax incentives (Pioneer Status, ITA)
- **Currency**: MYR (Malaysian Ringgit)
- **Reporting**: Quarterly, Annual (SSM Form 24, 44)

#### Singapore (SFRS)

- **ACRA Compliance**: Financial statements filing
- **XBRL Taxonomy**: Automated XBRL tagging for ACRA submission
- **Currency**: SGD (Singapore Dollar)
- **Reporting**: Annual (XBRL format mandatory)

#### Thailand (TFRS)

- **DBD Compliance**: Department of Business Development requirements
- **BOI Incentives**: Board of Investment tax adjustments
- **Currency**: THB (Thai Baht)
- **Reporting**: Quarterly, Annual (DBD Form Bor Or Jor 5)

#### Vietnam (VAS)

- **MOF Circular**: Compliance with Vietnamese Accounting Standards
- **VAT Specifics**: Input/output VAT reconciliation
- **Currency**: VND (Vietnamese Dong)
- **Reporting**: Quarterly, Annual (MOF requirements)

#### Indonesia (PSAK)

- **OJK Regulations**: Financial Services Authority compliance
- **Tax Reconciliation**: Commercial vs fiscal profit reconciliation
- **Currency**: IDR (Indonesian Rupiah)
- **Reporting**: Quarterly, Annual (OJK requirements)

#### Philippines (PFRS)

- **SEC/BIR Compliance**: Securities & Exchange Commission, Bureau of Internal Revenue
- **PEZA Zones**: Special economic zone adjustments
- **Currency**: PHP (Philippine Peso)
- **Reporting**: Quarterly, Annual (SEC Form 17-Q, 17-A)

### IFRS to Local GAAP Reconciliation

```typescript
// Reconciliation mapping
const reconciliationAreas = {
  revenue: {
    ifrs15: "Revenue from Contracts with Customers",
    localVariations: {
      vietnam: "VAS 14 - Revenue recognition differences",
      philippines: "PFRS 15 - Aligned with IFRS",
    },
  },
  leases: {
    ifrs16: "Leases",
    localVariations: {
      vietnam: "VAS 06 - Operating lease treatment",
      thailand: "TFRS 16 - Aligned with IFRS",
    },
  },
  financialInstruments: {
    ifrs9: "Financial Instruments",
    localVariations: {
      vietnam: "VAS 21, 22 - Different classification",
      indonesia: "PSAK 71 - Aligned with IFRS 9",
    },
  },
};
```

---

## ♿ Accessibility

### WCAG 2.2 AA Compliance

- **Color Contrast**: ≥4.5:1 for normal text, ≥3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader**: Proper ARIA labels and descriptions
- **Focus Management**: Clear focus indicators, logical tab order

### Keyboard Shortcuts

| Shortcut       | Action             |
| -------------- | ------------------ |
| `Ctrl/Cmd + N` | Create adjustment  |
| `Ctrl/Cmd + F` | Focus search field |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("AdjustmentList", () => {
  it("renders list of adjustments", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles adjustment creation", () => {});
  it("handles adjustment approval", () => {});
});

// Hook tests
describe("useAdjustmentList", () => {
  it("fetches adjustment list", () => {});
  it("handles adjustment creation", () => {});
  it("handles adjustment updates", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Adjustment API Integration", () => {
  it("creates adjustment successfully", () => {});
  it("approves adjustment successfully", () => {});
  it("generates compliance reports successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Adjustment E2E", () => {
  it("complete adjustment creation flow", () => {});
  it("complete adjustment approval flow", () => {});
  it("complete GAAP standard management flow", () => {});
  it("complete local stat configuration flow", () => {});
  it("keyboard navigation", () => {});
});
```

---

## ⚡ Performance

### Bundle Size

- **Target**: ≤400KB gzipped per route
- **Current**: <CURRENT_SIZE>KB
- **Optimization**: Code splitting, lazy loading

### Loading Performance

- **TTFB**: ≤70ms (Time to First Byte)
- **TTI**: ≤200ms (Time to Interactive)
- **LCP**: ≤2.5s (Largest Contentful Paint)

---

## 🚀 Implementation Guide

### Step 1: Setup

```bash
# Create directory structure
mkdir -p apps/web/app/(dashboard)/adjustments
mkdir -p apps/web/app/(dashboard)/gaap
mkdir -p apps/web/app/(dashboard)/local-stat
mkdir -p apps/web/components/adjustments
mkdir -p apps/web/components/gaap
mkdir -p apps/web/components/local-stat
mkdir -p apps/web/hooks/adjustments
mkdir -p apps/web/hooks/gaap
mkdir -p apps/web/hooks/local-stat

# Create feature flag
echo 'flags.m44_multi_gaap = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/adjustments/AdjustmentList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useAdjustmentList } from "@/hooks/adjustments/useAdjustmentList";

export function AdjustmentList() {
  const { data, isLoading, error } = useAdjustmentList();

  if (isLoading) return <AdjustmentSkeleton />;
  if (error) return <AdjustmentErrorState />;
  if (!data?.length) return <AdjustmentEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="description"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/adjustments/useAdjustmentList.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAdjustmentList(filters?: AdjustmentFilters) {
  return useQuery({
    queryKey: ["adjustments", "list", filters],
    queryFn: () => api.adjustments.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/adjustments/page.tsx
import { AdjustmentList } from "@/components/adjustments/AdjustmentList";
import { AdjustmentFilters } from "@/components/adjustments/AdjustmentFilters";

export default function AdjustmentPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Adjustments</h1>
        <CreateAdjustmentButton />
      </div>
      <AdjustmentFilters />
      <AdjustmentList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/adjustments/__tests__/AdjustmentList.test.tsx
import { render, screen } from "@testing-library/react";
import { AdjustmentList } from "@/components/adjustments/AdjustmentList";

describe("AdjustmentList", () => {
  it("renders list of adjustments", () => {
    render(<AdjustmentList />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
```

---

## ✅ Quality Gates

### Code Quality

| Gate              | Threshold | Enforcement |
| ----------------- | --------- | ----------- |
| TypeScript errors | 0         | CI blocks   |
| ESLint errors     | 0         | CI blocks   |
| Test coverage     | ≥90%      | CI blocks   |
| Bundle size       | ≤400KB    | CI blocks   |

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
  m44_multi_gaap: false, // Default: disabled
};

// Usage in components
if (flags.m44_multi_gaap) {
  return <AdjustmentList />;
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

1. **Set feature flag**: `flags.m44_multi_gaap = false`
2. **Invalidate cache**: `revalidateTag("adjustments")`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All adjustment operations working
- [ ] GAAP standard management functional
- [ ] Local statutory management working
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

**Ready to implement Multi-GAAP & Local Stat Adjustments UI! 🚀**
