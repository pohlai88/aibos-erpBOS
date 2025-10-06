# 🎯 M88: Subscription Management - UI Implementation Runbook

**Module ID**: M88  
**Module Name**: Subscription Management  
**Priority**: 🔥 HIGH  
**Phase**: Phase 16 - Infrastructure Modernization  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M65-SUBSCRIPTION-MANAGEMENT

---

## 📋 Module Overview

### Business Value

Subscription Management provides **comprehensive subscription lifecycle management** for businesses requiring organized recurring billing and customer subscription handling.

**Key Benefits**:

- Complete subscription lifecycle management
- Automated billing and payment processing
- Subscription analytics and optimization
- Integration with existing modules (CRM, AR, etc.)

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status      | Details                   |
| ------------- | ----------- | ------------------------- |
| **Database**  | ✅ Complete | Schema implemented        |
| **Services**  | ✅ Complete | Business logic ready      |
| **API**       | ✅ Complete | 16 endpoints available    |
| **Contracts** | ✅ Complete | Type-safe schemas defined |

### API Endpoints

**Subscription Management Operations** (16 endpoints):

- ✅ `/api/subscriptions` - List subscriptions
- ✅ `/api/subscriptions/[id]` - Get subscription details
- ✅ `/api/subscriptions/create` - Create subscription
- ✅ `/api/subscriptions/[id]/update` - Update subscription
- ✅ `/api/subscriptions/[id]/delete` - Delete subscription
- ✅ `/api/subscriptions/[id]/activate` - Activate subscription
- ✅ `/api/subscriptions/[id]/suspend` - Suspend subscription
- ✅ `/api/subscriptions/[id]/cancel` - Cancel subscription
- ✅ `/api/subscriptions/[id]/renew` - Renew subscription
- ✅ `/api/subscriptions/[id]/upgrade` - Upgrade subscription
- ✅ `/api/subscriptions/[id]/downgrade` - Downgrade subscription
- ✅ `/api/subscriptions/plans` - List subscription plans
- ✅ `/api/subscriptions/plans/[id]` - Get plan details
- ✅ `/api/subscriptions/plans/create` - Create plan
- ✅ `/api/subscriptions/plans/[id]/update` - Update plan
- ✅ `/api/subscriptions/analytics` - Get subscription analytics

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                            | Page Component               | Purpose                   |
| -------------------------------- | ---------------------------- | ------------------------- |
| `/subscriptions`                 | `SubscriptionListPage`       | List subscriptions        |
| `/subscriptions/[id]`            | `SubscriptionDetailPage`     | View subscription details |
| `/subscriptions/create`          | `SubscriptionCreatePage`     | Create subscription       |
| `/subscriptions/[id]/edit`       | `SubscriptionEditPage`       | Edit subscription         |
| `/subscriptions/plans`           | `SubscriptionPlansPage`      | List subscription plans   |
| `/subscriptions/plans/[id]`      | `SubscriptionPlanDetailPage` | View plan details         |
| `/subscriptions/plans/create`    | `SubscriptionPlanCreatePage` | Create plan               |
| `/subscriptions/plans/[id]/edit` | `SubscriptionPlanEditPage`   | Edit plan                 |
| `/subscriptions/analytics`       | `SubscriptionAnalyticsPage`  | Subscription analytics    |
| `/subscriptions/billing`         | `SubscriptionBillingPage`    | Billing management        |

### Component Structure

```
apps/web/app/(dashboard)/subscriptions/
├── page.tsx                    # Subscriptions list
├── [id]/
│   ├── page.tsx               # Subscription details
│   └── edit/
│       └── page.tsx           # Edit subscription
├── create/
│   └── page.tsx               # Create subscription
├── plans/
│   ├── page.tsx               # Plans list
│   ├── [id]/
│   │   ├── page.tsx           # Plan details
│   │   └── edit/
│   │       └── page.tsx       # Edit plan
│   └── create/
│       └── page.tsx           # Create plan
├── analytics/
│   └── page.tsx               # Analytics page
└── billing/
    └── page.tsx               # Billing page

apps/web/components/subscriptions/
├── SubscriptionList.tsx       # Subscriptions component
├── SubscriptionCard.tsx        # Subscription card
├── SubscriptionForm.tsx        # Subscription form
├── SubscriptionPlans.tsx       # Plans component
├── SubscriptionPlanCard.tsx    # Plan card
├── SubscriptionPlanForm.tsx    # Plan form
├── SubscriptionAnalytics.tsx   # Analytics component
├── SubscriptionBilling.tsx     # Billing component
├── SubscriptionFilters.tsx     # Filter component
└── SubscriptionActions.tsx     # Action buttons

apps/web/hooks/subscriptions/
├── useSubscriptionList.ts      # Subscriptions hook
├── useSubscriptionDetail.ts    # Subscription detail hook
├── useSubscriptionCreate.ts    # Subscription create hook
├── useSubscriptionUpdate.ts    # Subscription update hook
├── useSubscriptionActivate.ts   # Subscription activate hook
├── useSubscriptionSuspend.ts   # Subscription suspend hook
├── useSubscriptionCancel.ts    # Subscription cancel hook
├── useSubscriptionRenew.ts     # Subscription renew hook
├── useSubscriptionUpgrade.ts   # Subscription upgrade hook
├── useSubscriptionDowngrade.ts # Subscription downgrade hook
├── useSubscriptionPlans.ts     # Plans hook
├── useSubscriptionPlanCreate.ts # Plan create hook
├── useSubscriptionPlanUpdate.ts # Plan update hook
└── useSubscriptionAnalytics.ts # Analytics hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m88_subscription_management = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose               | Variant                    |
| ----------- | --------------------- | -------------------------- |
| `DataTable` | List subscriptions    | With filters, pagination   |
| `Card`      | Subscription details  | With actions               |
| `Form`      | Create/edit forms     | With validation            |
| `Button`    | Actions               | Primary, secondary, danger |
| `Modal`     | Confirmations         | With backdrop              |
| `Timeline`  | Subscription timeline | With status indicators     |
| `Chart`     | Subscription charts   | With metrics               |

### Design Tokens

```typescript
// Subscription-specific colors
const subscriptionColors = {
  active: "hsl(var(--subscription-active))",
  suspended: "hsl(var(--subscription-suspended))",
  cancelled: "hsl(var(--subscription-cancelled))",
  expired: "hsl(var(--subscription-expired))",
  pending: "hsl(var(--subscription-pending))",
  trial: "hsl(var(--subscription-trial))",
};

// Subscription status colors
const subscriptionStatusColors = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  expired: "bg-gray-100 text-gray-800",
  pending: "bg-blue-100 text-blue-800",
  trial: "bg-purple-100 text-purple-800",
};

// Subscription plan colors
const subscriptionPlanColors = {
  basic: "hsl(var(--subscription-basic))",
  standard: "hsl(var(--subscription-standard))",
  premium: "hsl(var(--subscription-premium))",
  enterprise: "hsl(var(--subscription-enterprise))",
  custom: "hsl(var(--subscription-custom))",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Subscription Themes**: Status-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  subscriptions: ["subscriptions", "list"] as const,
  subscription: (id: string) => ["subscriptions", "detail", id] as const,
  plans: ["subscriptions", "plans"] as const,
  plan: (id: string) => ["subscriptions", "plan", id] as const,
  analytics: ["subscriptions", "analytics"] as const,
  billing: ["subscriptions", "billing"] as const,
};
```

### Cache Configuration

| Query Type    | Stale Time | Cache Time | Invalidation            |
| ------------- | ---------- | ---------- | ----------------------- |
| Subscriptions | 5 minutes  | 10 minutes | On create/update/delete |
| Subscription  | 10 minutes | 30 minutes | On update/delete        |
| Plans         | 15 minutes | 45 minutes | On plan change          |
| Plan          | 15 minutes | 45 minutes | On plan update          |
| Analytics     | 15 minutes | 45 minutes | On subscription change  |
| Billing       | 5 minutes  | 15 minutes | On billing update       |

### Invalidation Rules

```typescript
// After creating subscription
queryClient.invalidateQueries({ queryKey: ["subscriptions", "list"] });
queryClient.invalidateQueries({ queryKey: ["subscriptions", "analytics"] });

// After updating subscription
queryClient.invalidateQueries({ queryKey: ["subscriptions", "detail", id] });
queryClient.invalidateQueries({ queryKey: ["subscriptions", "list"] });

// After activating subscription
queryClient.invalidateQueries({ queryKey: ["subscriptions", "detail", id] });
queryClient.invalidateQueries({ queryKey: ["subscriptions", "billing"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Subscription

1. User navigates to subscriptions page
2. User clicks "Create Subscription" button
3. System opens subscription creation form
4. User selects customer and plan
5. User sets subscription start date
6. User configures billing settings
7. User submits subscription

#### 2. Manage Subscription

1. User views subscription detail page
2. User sees subscription status and details
3. User can activate, suspend, or cancel subscription
4. User can upgrade or downgrade plan
5. User can renew subscription
6. User can update billing information

#### 3. Create Subscription Plan

1. User navigates to subscription plans page
2. User clicks "Create Plan" button
3. System opens plan creation form
4. User defines plan features and pricing
5. User sets billing cycle
6. User configures plan limits
7. User saves plan

### UI States

| State          | Component                | Message                              |
| -------------- | ------------------------ | ------------------------------------ |
| **Empty**      | `SubscriptionEmptyState` | "No subscriptions found"             |
| **Loading**    | `SubscriptionSkeleton`   | Loading skeleton                     |
| **Error**      | `SubscriptionErrorState` | "Failed to load subscriptions"       |
| **No Results** | `SubscriptionNoResults`  | "No subscriptions match your search" |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation
- **Chart**: Interactive charts, drill-down capabilities

---

## ♿ Accessibility

### WCAG 2.2 AA Compliance

- **Color Contrast**: ≥4.5:1 for normal text, ≥3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader**: Proper ARIA labels and descriptions
- **Focus Management**: Clear focus indicators, logical tab order

### Keyboard Shortcuts

| Shortcut       | Action                  |
| -------------- | ----------------------- |
| `Ctrl/Cmd + N` | Create new subscription |
| `Ctrl/Cmd + F` | Focus search field      |
| `Ctrl/Cmd + A` | Activate subscription   |
| `Ctrl/Cmd + S` | Suspend subscription    |
| `Escape`       | Close modal/dialog      |
| `Enter`        | Submit form             |

### ARIA Implementation

```typescript
// Subscription list
<table role="table" aria-label="Subscriptions list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Customer</th>
      <th role="columnheader" aria-sort="none">Plan</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Next Billing</th>
    </tr>
  </thead>
</table>

// Subscription form
<form role="form" aria-label="Create Subscription">
  <input
    aria-describedby="customer-error"
    aria-invalid="false"
    aria-label="Customer"
  />
  <div id="customer-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("SubscriptionList", () => {
  it("renders list of subscriptions", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useSubscriptionCreate", () => {
  it("creates subscription successfully", () => {});
  it("handles creation errors", () => {});
  it("validates subscription data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Subscription API Integration", () => {
  it("creates subscription successfully", () => {});
  it("activates subscription successfully", () => {});
  it("suspends subscription successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Subscription Management E2E", () => {
  it("complete subscription creation flow", () => {});
  it("complete subscription activation flow", () => {});
  it("complete subscription management flow", () => {});
  it("subscription analytics functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Subscription Management Accessibility", () => {
  it("meets WCAG 2.2 AA standards", () => {});
  it("supports keyboard navigation", () => {});
  it("works with screen readers", () => {});
  it("has proper color contrast", () => {});
});
```

---

## ⚡ Performance

### Bundle Size

- **Target**: ≤350KB gzipped per route
- **Current**: <CURRENT_SIZE>KB
- **Optimization**: Code splitting, lazy loading, form optimization

### Loading Performance

- **TTFB**: ≤70ms (Time to First Byte)
- **TTI**: ≤200ms (Time to Interactive)
- **LCP**: ≤2.5s (Largest Contentful Paint)

### Optimization Strategies

```typescript
// Lazy loading
const SubscriptionForm = lazy(() => import("./components/SubscriptionForm"));
const SubscriptionAnalytics = lazy(
  () => import("./components/SubscriptionAnalytics")
);

// Form optimization
import { useForm } from "react-hook-form";

// Virtual scrolling for large lists
import { FixedSizeList as List } from "react-window";
```

---

## 🚀 Implementation Guide

### Step 1: Setup

```bash
# Create directory structure
mkdir -p apps/web/app/(dashboard)/subscriptions
mkdir -p apps/web/components/subscriptions
mkdir -p apps/web/hooks/subscriptions

# Create feature flag
echo 'flags.m88_subscription_management = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/subscriptions/SubscriptionList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useSubscriptionList } from "@/hooks/subscriptions/useSubscriptionList";

export function SubscriptionList() {
  const { data, isLoading, error } = useSubscriptionList();

  if (isLoading) return <SubscriptionSkeleton />;
  if (error) return <SubscriptionErrorState />;
  if (!data?.length) return <SubscriptionEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="customerName"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/subscriptions/useSubscriptionList.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useSubscriptionList(filters?: SubscriptionFilters) {
  return useQuery({
    queryKey: ["subscriptions", "list", filters],
    queryFn: () => api.subscriptions.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/subscriptions/page.tsx
import { SubscriptionList } from "@/components/subscriptions/SubscriptionList";
import { SubscriptionFilters } from "@/components/subscriptions/SubscriptionFilters";

export default function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <CreateSubscriptionButton />
      </div>
      <SubscriptionFilters />
      <SubscriptionList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/subscriptions/__tests__/SubscriptionList.test.tsx
import { render, screen } from "@testing-library/react";
import { SubscriptionList } from "@/components/subscriptions/SubscriptionList";

describe("SubscriptionList", () => {
  it("renders list of subscriptions", () => {
    render(<SubscriptionList />);
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
| Bundle size       | ≤350KB    | CI blocks   |

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
  m88_subscription_management: false, // Default: disabled
};

// Usage in components
if (flags.m88_subscription_management) {
  return <SubscriptionList />;
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

1. **Set feature flag**: `flags.m88_subscription_management = false`
2. **Invalidate cache**: `revalidateTag('subscriptions')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Subscription management functional
- [ ] Subscription plan management working
- [ ] Subscription activation functional
- [ ] Subscription suspension working
- [ ] Subscription cancellation functional
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

**Ready to implement Subscription Management UI! 🚀**
