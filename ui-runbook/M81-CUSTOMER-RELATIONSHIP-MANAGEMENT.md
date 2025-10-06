# 🎯 M81: Customer Relationship Management - UI Implementation Runbook

**Module ID**: M81  
**Module Name**: Customer Relationship Management  
**Priority**: 🔥 HIGH  
**Phase**: Phase 16 - Infrastructure Modernization  
**Estimated Effort**: 4 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M61-CUSTOMER-RELATIONSHIP-MANAGEMENT

---

## 📋 Module Overview

### Business Value

Customer Relationship Management provides **comprehensive customer relationship management** for businesses requiring organized customer interactions and sales pipeline management.

**Key Benefits**:

- Complete customer lifecycle management
- Sales pipeline and opportunity tracking
- Customer communication and interaction history
- Integration with existing modules (AR, Projects, etc.)

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
| **API**       | ✅ Complete | 20 endpoints available    |
| **Contracts** | ✅ Complete | Type-safe schemas defined |

### API Endpoints

**Customer Relationship Management Operations** (20 endpoints):

- ✅ `/api/crm/customers` - List customers
- ✅ `/api/crm/customers/[id]` - Get customer details
- ✅ `/api/crm/customers/create` - Create customer
- ✅ `/api/crm/customers/[id]/update` - Update customer
- ✅ `/api/crm/customers/[id]/delete` - Delete customer
- ✅ `/api/crm/contacts` - List contacts
- ✅ `/api/crm/contacts/[id]` - Get contact details
- ✅ `/api/crm/contacts/create` - Create contact
- ✅ `/api/crm/contacts/[id]/update` - Update contact
- ✅ `/api/crm/contacts/[id]/delete` - Delete contact
- ✅ `/api/crm/opportunities` - List opportunities
- ✅ `/api/crm/opportunities/[id]` - Get opportunity details
- ✅ `/api/crm/opportunities/create` - Create opportunity
- ✅ `/api/crm/opportunities/[id]/update` - Update opportunity
- ✅ `/api/crm/opportunities/[id]/delete` - Delete opportunity
- ✅ `/api/crm/activities` - List activities
- ✅ `/api/crm/activities/create` - Create activity
- ✅ `/api/crm/activities/[id]` - Get activity details
- ✅ `/api/crm/analytics` - Get CRM analytics
- ✅ `/api/crm/pipeline` - Get sales pipeline

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                       | Page Component             | Purpose               |
| --------------------------- | -------------------------- | --------------------- |
| `/crm/customers`            | `CRMCustomersPage`         | List customers        |
| `/crm/customers/[id]`       | `CRMCustomerDetailPage`    | View customer details |
| `/crm/customers/create`     | `CRMCustomerCreatePage`    | Create customer       |
| `/crm/customers/[id]/edit`  | `CRMCustomerEditPage`      | Edit customer         |
| `/crm/contacts`             | `CRMContactsPage`          | List contacts         |
| `/crm/contacts/[id]`        | `CRMContactDetailPage`     | View contact details  |
| `/crm/contacts/create`      | `CRMContactCreatePage`     | Create contact        |
| `/crm/opportunities`        | `CRMOpportunitiesPage`     | List opportunities    |
| `/crm/opportunities/[id]`   | `CRMOpportunityDetailPage` | View opportunity      |
| `/crm/opportunities/create` | `CRMOpportunityCreatePage` | Create opportunity    |
| `/crm/activities`           | `CRMActivitiesPage`        | List activities       |
| `/crm/activities/create`    | `CRMActivityCreatePage`    | Create activity       |
| `/crm/pipeline`             | `CRMPipelinePage`          | Sales pipeline        |
| `/crm/analytics`            | `CRMAnalyticsPage`         | CRM analytics         |

### Component Structure

```
apps/web/app/(dashboard)/crm/
├── customers/
│   ├── page.tsx               # Customers list
│   ├── [id]/
│   │   ├── page.tsx           # Customer details
│   │   └── edit/
│   │       └── page.tsx       # Edit customer
│   └── create/
│       └── page.tsx            # Create customer
├── contacts/
│   ├── page.tsx               # Contacts list
│   ├── [id]/
│   │   └── page.tsx           # Contact details
│   └── create/
│       └── page.tsx            # Create contact
├── opportunities/
│   ├── page.tsx               # Opportunities list
│   ├── [id]/
│   │   └── page.tsx           # Opportunity details
│   └── create/
│       └── page.tsx            # Create opportunity
├── activities/
│   ├── page.tsx               # Activities list
│   └── create/
│       └── page.tsx            # Create activity
├── pipeline/
│   └── page.tsx                # Pipeline page
└── analytics/
    └── page.tsx                # Analytics page

apps/web/components/crm/
├── CRMCustomers.tsx           # Customers component
├── CRMCustomerCard.tsx        # Customer card
├── CRMCustomerForm.tsx        # Customer form
├── CRMContacts.tsx            # Contacts component
├── CRMContactCard.tsx         # Contact card
├── CRMContactForm.tsx         # Contact form
├── CRMOpportunities.tsx       # Opportunities component
├── CRMOpportunityCard.tsx     # Opportunity card
├── CRMOpportunityForm.tsx     # Opportunity form
├── CRMActivities.tsx          # Activities component
├── CRMActivityForm.tsx        # Activity form
├── CRMPipeline.tsx            # Pipeline component
├── CRMAnalytics.tsx           # Analytics component
├── CRMFilters.tsx             # Filter component
└── CRMActions.tsx             # Action buttons

apps/web/hooks/crm/
├── useCRMCustomers.ts         # Customers hook
├── useCRMCustomerDetail.ts    # Customer detail hook
├── useCRMCustomerCreate.ts    # Customer create hook
├── useCRMCustomerUpdate.ts    # Customer update hook
├── useCRMContacts.ts          # Contacts hook
├── useCRMContactCreate.ts     # Contact create hook
├── useCRMContactUpdate.ts     # Contact update hook
├── useCRMOpportunities.ts     # Opportunities hook
├── useCRMOpportunityCreate.ts # Opportunity create hook
├── useCRMOpportunityUpdate.ts # Opportunity update hook
├── useCRMActivities.ts        # Activities hook
├── useCRMActivityCreate.ts    # Activity create hook
└── useCRMAnalytics.ts         # Analytics hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m81_customer_relationship_management = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose           | Variant                    |
| ----------- | ----------------- | -------------------------- |
| `DataTable` | List CRM records  | With filters, pagination   |
| `Card`      | Customer details  | With actions               |
| `Form`      | Create/edit forms | With validation            |
| `Button`    | Actions           | Primary, secondary, danger |
| `Modal`     | Confirmations     | With backdrop              |
| `Timeline`  | Activity timeline | With status indicators     |
| `Chart`     | CRM charts        | With metrics               |

### Design Tokens

```typescript
// CRM-specific colors
const crmColors = {
  lead: "hsl(var(--crm-lead))",
  prospect: "hsl(var(--crm-prospect))",
  customer: "hsl(var(--crm-customer))",
  opportunity: "hsl(var(--crm-opportunity))",
  closed: "hsl(var(--crm-closed))",
  lost: "hsl(var(--crm-lost))",
};

// CRM status colors
const crmStatusColors = {
  lead: "bg-blue-100 text-blue-800",
  prospect: "bg-yellow-100 text-yellow-800",
  customer: "bg-green-100 text-green-800",
  opportunity: "bg-purple-100 text-purple-800",
  closed: "bg-gray-100 text-gray-800",
  lost: "bg-red-100 text-red-800",
};

// CRM type colors
const crmTypeColors = {
  phone: "hsl(var(--crm-phone))",
  email: "hsl(var(--crm-email))",
  meeting: "hsl(var(--crm-meeting))",
  demo: "hsl(var(--crm-demo))",
  proposal: "hsl(var(--crm-proposal))",
  followup: "hsl(var(--crm-followup))",
  other: "hsl(var(--crm-other))",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **CRM Themes**: Status-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  customers: ["crm", "customers"] as const,
  customer: (id: string) => ["crm", "customer", id] as const,
  contacts: ["crm", "contacts"] as const,
  contact: (id: string) => ["crm", "contact", id] as const,
  opportunities: ["crm", "opportunities"] as const,
  opportunity: (id: string) => ["crm", "opportunity", id] as const,
  activities: ["crm", "activities"] as const,
  pipeline: ["crm", "pipeline"] as const,
  analytics: ["crm", "analytics"] as const,
};
```

### Cache Configuration

| Query Type    | Stale Time | Cache Time | Invalidation            |
| ------------- | ---------- | ---------- | ----------------------- |
| Customers     | 5 minutes  | 10 minutes | On create/update/delete |
| Customer      | 10 minutes | 30 minutes | On update/delete        |
| Contacts      | 5 minutes  | 15 minutes | On create/update/delete |
| Contact       | 10 minutes | 30 minutes | On update/delete        |
| Opportunities | 5 minutes  | 15 minutes | On create/update/delete |
| Opportunity   | 10 minutes | 30 minutes | On update/delete        |
| Activities    | 1 minute   | 5 minutes  | On create/update        |
| Pipeline      | 5 minutes  | 15 minutes | On opportunity change   |
| Analytics     | 15 minutes | 45 minutes | On CRM change           |

### Invalidation Rules

```typescript
// After creating customer
queryClient.invalidateQueries({ queryKey: ["crm", "customers"] });
queryClient.invalidateQueries({ queryKey: ["crm", "analytics"] });

// After updating customer
queryClient.invalidateQueries({ queryKey: ["crm", "customer", id] });
queryClient.invalidateQueries({ queryKey: ["crm", "customers"] });

// After creating opportunity
queryClient.invalidateQueries({ queryKey: ["crm", "opportunities"] });
queryClient.invalidateQueries({ queryKey: ["crm", "pipeline"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Customer

1. User navigates to CRM customers page
2. User clicks "Create Customer" button
3. System opens customer creation form
4. User fills customer details
5. User adds contact information
6. User assigns customer status
7. User submits customer

#### 2. Create Opportunity

1. User views customer detail page
2. User clicks "Create Opportunity" button
3. System opens opportunity creation form
4. User fills opportunity details
5. User sets opportunity stage
6. User assigns sales representative
7. User submits opportunity

#### 3. Track Sales Pipeline

1. User navigates to pipeline page
2. User sees opportunity stages
3. User can drag opportunities between stages
4. User can view stage details
5. User can filter by sales rep
6. User can view pipeline analytics

### UI States

| State          | Component       | Message                        |
| -------------- | --------------- | ------------------------------ |
| **Empty**      | `CRMEmptyState` | "No CRM records found"         |
| **Loading**    | `CRMSkeleton`   | Loading skeleton               |
| **Error**      | `CRMErrorState` | "Failed to load CRM data"      |
| **No Results** | `CRMNoResults`  | "No records match your search" |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Drag**: Pipeline stage changes, visual feedback
- **Form Validation**: Inline errors, real-time validation

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
| `Ctrl/Cmd + N` | Create new customer |
| `Ctrl/Cmd + F` | Focus search field  |
| `Ctrl/Cmd + O` | Create opportunity  |
| `Ctrl/Cmd + A` | Create activity     |
| `Escape`       | Close modal/dialog  |
| `Enter`        | Submit form         |

### ARIA Implementation

```typescript
// CRM list
<table role="table" aria-label="CRM customers list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Customer Name</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Last Contact</th>
      <th role="columnheader" aria-sort="none">Opportunities</th>
    </tr>
  </thead>
</table>

// CRM form
<form role="form" aria-label="Create Customer">
  <input
    aria-describedby="name-error"
    aria-invalid="false"
    aria-label="Customer Name"
  />
  <div id="name-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("CRMCustomers", () => {
  it("renders list of customers", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useCRMCustomerCreate", () => {
  it("creates customer successfully", () => {});
  it("handles creation errors", () => {});
  it("validates customer data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("CRM API Integration", () => {
  it("creates customer successfully", () => {});
  it("creates opportunity successfully", () => {});
  it("creates activity successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Customer Relationship Management E2E", () => {
  it("complete customer creation flow", () => {});
  it("complete opportunity creation flow", () => {});
  it("complete activity creation flow", () => {});
  it("pipeline management functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Customer Relationship Management Accessibility", () => {
  it("meets WCAG 2.2 AA standards", () => {});
  it("supports keyboard navigation", () => {});
  it("works with screen readers", () => {});
  it("has proper color contrast", () => {});
});
```

---

## ⚡ Performance

### Bundle Size

- **Target**: ≤400KB gzipped per route
- **Current**: <CURRENT_SIZE>KB
- **Optimization**: Code splitting, lazy loading, form optimization

### Loading Performance

- **TTFB**: ≤70ms (Time to First Byte)
- **TTI**: ≤200ms (Time to Interactive)
- **LCP**: ≤2.5s (Largest Contentful Paint)

### Optimization Strategies

```typescript
// Lazy loading
const CRMCustomerForm = lazy(() => import("./components/CRMCustomerForm"));
const CRMAnalytics = lazy(() => import("./components/CRMAnalytics"));

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
mkdir -p apps/web/app/(dashboard)/crm
mkdir -p apps/web/components/crm
mkdir -p apps/web/hooks/crm

# Create feature flag
echo 'flags.m81_customer_relationship_management = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/crm/CRMCustomers.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useCRMCustomers } from "@/hooks/crm/useCRMCustomers";

export function CRMCustomers() {
  const { data, isLoading, error } = useCRMCustomers();

  if (isLoading) return <CRMSkeleton />;
  if (error) return <CRMErrorState />;
  if (!data?.length) return <CRMEmptyState />;

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
// apps/web/hooks/crm/useCRMCustomers.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCRMCustomers(filters?: CRMFilters) {
  return useQuery({
    queryKey: ["crm", "customers", filters],
    queryFn: () => api.crm.customers.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/crm/customers/page.tsx
import { CRMCustomers } from "@/components/crm/CRMCustomers";
import { CRMFilters } from "@/components/crm/CRMFilters";

export default function CRMCustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">CRM Customers</h1>
        <CreateCustomerButton />
      </div>
      <CRMFilters />
      <CRMCustomers />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/crm/__tests__/CRMCustomers.test.tsx
import { render, screen } from "@testing-library/react";
import { CRMCustomers } from "@/components/crm/CRMCustomers";

describe("CRMCustomers", () => {
  it("renders list of customers", () => {
    render(<CRMCustomers />);
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
  m81_customer_relationship_management: false, // Default: disabled
};

// Usage in components
if (flags.m81_customer_relationship_management) {
  return <CRMCustomers />;
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

1. **Set feature flag**: `flags.m81_customer_relationship_management = false`
2. **Invalidate cache**: `revalidateTag('crm')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Customer management functional
- [ ] Contact management working
- [ ] Opportunity tracking functional
- [ ] Activity management working
- [ ] Sales pipeline functional
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

**Ready to implement Customer Relationship Management UI! 🚀**
