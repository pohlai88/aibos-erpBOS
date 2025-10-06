# 🎯 M65: Subscription Management - UI Implementation Runbook

**Module ID**: M65  
**Module Name**: Subscription Management  
**Priority**: 🔥 HIGH  
**Phase**: Phase 13 - Extended Modules  
**Estimated Effort**: 3.5 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M26-RECURRING-BILLING

---

## 📋 Module Overview

Subscription Management provides **subscription lifecycle**, **plan management**, **billing automation**, and **subscription analytics** for SaaS businesses requiring **recurring revenue management** and **customer retention**.

### Business Value

**Key Benefits**:

- **Subscription Lifecycle**: Complete subscription management
- **Plan Management**: Flexible pricing plans
- **Billing Automation**: Automated recurring billing
- **Subscription Analytics**: MRR, churn, and retention metrics

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status     | Details                                       |
| ------------- | ---------- | --------------------------------------------- |
| **Database**  | 🔄 PARTIAL | Recurring billing exists, needs subscriptions |
| **Services**  | 🔄 PARTIAL | Billing services exist                        |
| **API**       | 🔄 PARTIAL | Billing APIs exist                            |
| **Contracts** | 🔄 PARTIAL | Billing types exist, needs subscriptions      |

### API Endpoints

**Subscription Management Operations** (8 endpoints):

- 🔄 `/api/subscriptions` - List subscriptions (enhance existing)
- 🔄 `/api/subscriptions/[id]` - Get subscription details (enhance existing)
- 🔄 `/api/subscriptions/create` - Create new subscription (enhance existing)
- 🔄 `/api/subscriptions/[id]/update` - Update subscription (enhance existing)
- ❌ `/api/subscriptions/plans` - List subscription plans
- ❌ `/api/subscriptions/plans/[id]` - Get plan details
- ❌ `/api/subscriptions/analytics` - Subscription analytics
- ❌ `/api/subscriptions/churn` - Churn analysis

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                      | Page Component              | Purpose                   |
| -------------------------- | --------------------------- | ------------------------- |
| `/subscriptions`           | `SubscriptionsPage`         | List subscriptions        |
| `/subscriptions/[id]`      | `SubscriptionDetailPage`    | View subscription details |
| `/subscriptions/plans`     | `SubscriptionPlansPage`     | Manage subscription plans |
| `/subscriptions/analytics` | `SubscriptionAnalyticsPage` | Subscription analytics    |

### Component Structure

```
apps/web/app/(dashboard)/subscriptions/
├── page.tsx                    # Subscriptions list
├── [id]/
│   └── page.tsx               # Subscription detail
├── plans/
│   └── page.tsx               # Subscription plans
└── analytics/
    └── page.tsx               # Subscription analytics

apps/web/components/subscriptions/
├── SubscriptionsList.tsx      # Subscriptions list
├── SubscriptionCard.tsx       # Subscription card
├── SubscriptionPlans.tsx     # Subscription plans
├── SubscriptionAnalytics.tsx # Subscription analytics
├── MRRChart.tsx              # MRR chart
└── ChurnAnalysis.tsx         # Churn analysis

apps/web/hooks/subscriptions/
├── useSubscriptions.ts       # Subscriptions hook
├── useSubscriptionPlans.ts   # Subscription plans hook
├── useSubscriptionAnalytics.ts # Analytics hook
└── useChurnAnalysis.ts       # Churn analysis hook
```

### Server/Client Boundaries

- **Server Components**: Subscriptions list, analytics pages (data fetching)
- **Client Components**: Charts, interactive elements, plan forms
- **Feature Flag**: `flags.m65_subscription_management = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose              | Variant                    |
| ----------- | -------------------- | -------------------------- |
| `DataTable` | List subscriptions   | With filters, pagination   |
| `Card`      | Subscription metrics | With charts                |
| `Form`      | Create subscription  | With validation            |
| `Button`    | Actions              | Primary, secondary, danger |
| `Chart`     | Subscription metrics | Line, bar, pie             |

### Design Tokens

```typescript
// Colors
const colors = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  error: "hsl(var(--error))",
};

// Spacing
const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
};

// Typography
const typography = {
  h1: "text-3xl font-bold",
  h2: "text-2xl font-semibold",
  h3: "text-xl font-medium",
  body: "text-base",
  caption: "text-sm text-muted-foreground",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  subscriptions: ["subscriptions", "list"] as const,
  subscription: (id: string) => ["subscriptions", "detail", id] as const,
  subscriptionPlans: ["subscriptions", "plans"] as const,
  subscriptionAnalytics: ["subscriptions", "analytics"] as const,
  churnAnalysis: ["subscriptions", "churn"] as const,
};
```

### Cache Configuration

| Query Type         | Stale Time | Cache Time | Invalidation            |
| ------------------ | ---------- | ---------- | ----------------------- |
| Subscriptions      | 5 minutes  | 15 minutes | On create/update/delete |
| Subscription Plans | 10 minutes | 30 minutes | On plan change          |
| Analytics          | 1 minute   | 5 minutes  | On subscription update  |
| Churn Analysis     | 5 minutes  | 15 minutes | On subscription change  |

### Invalidation Rules

```typescript
// After creating subscription
queryClient.invalidateQueries({ queryKey: ["subscriptions", "list"] });
queryClient.invalidateQueries({ queryKey: ["subscriptions", "analytics"] });

// After updating subscription
queryClient.invalidateQueries({ queryKey: ["subscriptions", "detail", id] });
queryClient.invalidateQueries({ queryKey: ["subscriptions", "list"] });
queryClient.invalidateQueries({ queryKey: ["subscriptions", "analytics"] });

// After deleting subscription
queryClient.invalidateQueries({ queryKey: ["subscriptions", "list"] });
queryClient.removeQueries({ queryKey: ["subscriptions", "detail", id] });
```

---

## 🎭 User Experience

### User Flows

#### 1. List Subscriptions

1. User navigates to `/subscriptions`
2. System loads subscriptions with pagination
3. User can search, filter, sort
4. User clicks on subscription to view details

#### 2. Create Subscription

1. User clicks "Create Subscription" button
2. System opens subscription form
3. User fills required fields (customer, plan, billing cycle)
4. User submits form
5. System creates subscription and redirects to detail page

#### 3. View Analytics

1. User navigates to `/subscriptions/analytics`
2. System loads MRR, churn, and retention metrics
3. User can view charts and trends
4. User can drill down into specific metrics

### UI States

| State          | Component                 | Message                              |
| -------------- | ------------------------- | ------------------------------------ |
| **Empty**      | `SubscriptionsEmptyState` | "No subscriptions found"             |
| **Loading**    | `SubscriptionsSkeleton`   | Loading skeleton                     |
| **Error**      | `SubscriptionsErrorState` | "Failed to load subscriptions"       |
| **No Results** | `SubscriptionsNoResults`  | "No subscriptions match your search" |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation

---

## 🚀 Implementation Guide

### Step 1: Enhance M26-RECURRING-BILLING

```bash
# Enhance existing recurring billing module
# Add subscription lifecycle management
# Add plan management
# Add subscription analytics
```

### Step 2: Create Components

```typescript
// apps/web/components/subscriptions/SubscriptionsList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useSubscriptions } from "@/hooks/subscriptions/useSubscriptions";

export function SubscriptionsList() {
  const { data, isLoading, error } = useSubscriptions();

  if (isLoading) return <SubscriptionsSkeleton />;
  if (error) return <SubscriptionsErrorState />;
  if (!data?.length) return <SubscriptionsEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="customer_name"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/subscriptions/useSubscriptions.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useSubscriptions() {
  return useQuery({
    queryKey: ["subscriptions", "list"],
    queryFn: () => api.subscriptions.list(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateSubscription() {
  return useMutation({
    mutationFn: (data: SubscriptionData) => api.subscriptions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["subscriptions", "list"],
      });
      queryClient.invalidateQueries({
        queryKey: ["subscriptions", "analytics"],
      });
    },
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/subscriptions/page.tsx
import { SubscriptionsList } from "@/components/subscriptions/SubscriptionsList";
import { SubscriptionsFilters } from "@/components/subscriptions/SubscriptionsFilters";

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <CreateSubscriptionButton />
      </div>
      <SubscriptionsFilters />
      <SubscriptionsList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/subscriptions/__tests__/SubscriptionsList.test.tsx
import { render, screen } from "@testing-library/react";
import { SubscriptionsList } from "@/components/subscriptions/SubscriptionsList";

describe("SubscriptionsList", () => {
  it("renders list of subscriptions", () => {
    render(<SubscriptionsList />);
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

| Shortcut       | Action              |
| -------------- | ------------------- |
| `Ctrl/Cmd + N` | Create subscription |
| `Ctrl/Cmd + F` | Focus search field  |
| `Escape`       | Close modal/dialog  |
| `Enter`        | Submit form         |

### ARIA Implementation

```typescript
// Subscriptions list
<table role="table" aria-label="Subscriptions list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Customer</th>
    </tr>
  </thead>
</table>

// Form
<form role="form" aria-label="Create subscription">
  <input aria-describedby="subscription-error" aria-invalid="false" />
  <div id="subscription-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("SubscriptionsList", () => {
  it("renders list of subscriptions", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useSubscriptions", () => {
  it("fetches subscriptions list", () => {});
  it("handles pagination", () => {});
  it("handles filters", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Subscription Management API Integration", () => {
  it("creates subscription successfully", () => {});
  it("updates subscription successfully", () => {});
  it("deletes subscription successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Subscription Management E2E", () => {
  it("complete create flow", () => {});
  it("complete edit flow", () => {});
  it("complete delete flow", () => {});
  it("search and filter functionality", () => {});
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
const SubscriptionCreatePage = lazy(() => import("./create/page"));

// Code splitting
const SubscriptionForm = lazy(() => import("./components/SubscriptionForm"));

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
  m65_subscription_management: false, // Default: disabled
};

// Usage in components
if (flags.m65_subscription_management) {
  return <SubscriptionsList />;
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

1. **Set feature flag**: `flags.m65_subscription_management = false`
2. **Invalidate cache**: `revalidateTag('subscriptions')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Subscription lifecycle functional
- [ ] Plan management functional
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

**Ready to implement Subscription Management UI! 🚀**
