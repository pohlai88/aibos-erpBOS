# 🎯 M80: Multi-Tenant Architecture - UI Implementation Runbook

**Module ID**: M80  
**Module Name**: Multi-Tenant Architecture  
**Priority**: 🚨 CRITICAL  
**Phase**: Phase 16 - Infrastructure Modernization  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance existing multi-tenant infrastructure

---

## 📋 Module Overview

Multi-Tenant Architecture provides **enterprise-grade SaaS scalability** for businesses requiring **multi-customer isolation** and **tenant management**.

### Business Value

**Key Benefits**:

- **SaaS Scalability**: Support 1000+ customers on single instance
- **Data Isolation**: Complete tenant separation and security
- **Cost Efficiency**: Shared infrastructure with isolated data
- **Enterprise Ready**: Meets enterprise security requirements

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status    | Details                                                     |
| ------------- | --------- | ----------------------------------------------------------- |
| **Database**  | 🔄 HYBRID | Basic multi-tenancy exists, needs enhancement               |
| **Services**  | 🔄 HYBRID | Basic tenant context exists, needs full implementation      |
| **API**       | 🔄 HYBRID | Basic tenant filtering exists, needs comprehensive coverage |
| **Contracts** | 🔄 HYBRID | Basic tenant types exist, needs full schema                 |

### API Endpoints

**Multi-Tenant Operations** (Enhancement needed):

- 🔄 `/api/tenants` - List tenants (needs enhancement)
- 🔄 `/api/tenants/[id]` - Get tenant details (needs enhancement)
- 🔄 `/api/tenants/create` - Create new tenant (needs enhancement)
- 🔄 `/api/tenants/[id]/switch` - Switch tenant context (needs implementation)
- 🔄 `/api/tenants/[id]/settings` - Tenant settings (needs implementation)

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                    | Page Component       | Purpose                   |
| ------------------------ | -------------------- | ------------------------- |
| `/tenants`               | `TenantListPage`     | List and manage tenants   |
| `/tenants/[id]`          | `TenantDetailPage`   | View tenant details       |
| `/tenants/create`        | `TenantCreatePage`   | Create new tenant         |
| `/tenants/[id]/settings` | `TenantSettingsPage` | Configure tenant settings |

### Component Structure

```
apps/web/app/(dashboard)/tenants/
├── page.tsx                    # Tenant list page
├── [id]/
│   ├── page.tsx               # Tenant detail page
│   └── settings/
│       └── page.tsx           # Tenant settings page
└── create/
    └── page.tsx               # Create tenant page

apps/web/components/tenants/
├── TenantList.tsx             # Tenant list component
├── TenantCard.tsx              # Tenant card component
├── TenantForm.tsx              # Tenant form component
├── TenantSwitcher.tsx          # Tenant switcher (navigation)
└── TenantSettings.tsx          # Tenant settings component

apps/web/hooks/tenants/
├── useTenantList.ts            # Tenant list hook
├── useTenantDetail.ts          # Tenant detail hook
├── useTenantCreate.ts          # Tenant create hook
└── useTenantSwitch.ts          # Tenant switch hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, tenant switcher, settings
- **Feature Flag**: `flags.m80_multi_tenant = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose            | Variant                    |
| ----------- | ------------------ | -------------------------- |
| `DataTable` | List tenants       | With filters, pagination   |
| `Card`      | Tenant details     | With actions               |
| `Form`      | Create/edit tenant | With validation            |
| `Button`    | Actions            | Primary, secondary, danger |
| `Modal`     | Confirmations      | With backdrop              |
| `Select`    | Tenant switcher    | With search                |

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
  list: ["tenants", "list"] as const,
  detail: (id: string) => ["tenants", "detail", id] as const,
  settings: (id: string) => ["tenants", "settings", id] as const,
  current: ["tenants", "current"] as const,
};
```

### Cache Configuration

| Query Type | Stale Time | Cache Time | Invalidation            |
| ---------- | ---------- | ---------- | ----------------------- |
| List       | 5 minutes  | 10 minutes | On create/update/delete |
| Detail     | 10 minutes | 30 minutes | On update/delete        |
| Settings   | 5 minutes  | 15 minutes | On settings change      |
| Current    | 1 minute   | 5 minutes  | On tenant switch        |

### Invalidation Rules

```typescript
// After creating tenant
queryClient.invalidateQueries({ queryKey: ["tenants", "list"] });

// After updating tenant
queryClient.invalidateQueries({ queryKey: ["tenants", "detail", id] });
queryClient.invalidateQueries({ queryKey: ["tenants", "list"] });

// After switching tenant
queryClient.invalidateQueries({ queryKey: ["tenants", "current"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. List Tenants

1. User navigates to `/tenants`
2. System loads tenants with pagination
3. User can search, filter, sort
4. User clicks on tenant to view details

#### 2. Create Tenant

1. User clicks "Create Tenant" button
2. System opens create form
3. User fills required fields (name, domain, settings)
4. User submits form
5. System creates tenant and redirects to detail page

#### 3. Switch Tenant

1. User clicks tenant switcher in navigation
2. System shows list of available tenants
3. User selects tenant
4. System switches context and refreshes data

#### 4. Configure Tenant Settings

1. User views tenant detail page
2. User clicks "Settings" button
3. System opens settings form
4. User modifies settings
5. User submits form
6. System updates settings and shows success message

### UI States

| State          | Component          | Message                        |
| -------------- | ------------------ | ------------------------------ |
| **Empty**      | `TenantEmptyState` | "No tenants found"             |
| **Loading**    | `TenantSkeleton`   | Loading skeleton               |
| **Error**      | `TenantErrorState` | "Failed to load tenants"       |
| **No Results** | `TenantNoResults`  | "No tenants match your search" |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation

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
| `Ctrl/Cmd + N` | Create new tenant  |
| `Ctrl/Cmd + F` | Focus search field |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

### ARIA Implementation

```typescript
// Tenant switcher
<select role="combobox" aria-label="Select tenant">
  <option value="tenant1">Company A</option>
  <option value="tenant2">Company B</option>
</select>

// Tenant form
<form role="form" aria-label="Create tenant">
  <input aria-describedby="name-error" aria-invalid="false" />
  <div id="name-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("TenantList", () => {
  it("renders list of tenants", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useTenantList", () => {
  it("fetches tenants list", () => {});
  it("handles pagination", () => {});
  it("handles filters", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Tenant API Integration", () => {
  it("creates tenant successfully", () => {});
  it("updates tenant successfully", () => {});
  it("switches tenant context successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Tenant E2E", () => {
  it("complete create flow", () => {});
  it("complete switch flow", () => {});
  it("complete settings flow", () => {});
  it("search and filter functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Tenant Accessibility", () => {
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
const TenantCreatePage = lazy(() => import("./create/page"));

// Code splitting
const TenantForm = lazy(() => import("./components/TenantForm"));

// Virtual scrolling for large lists
import { FixedSizeList as List } from "react-window";
```

---

## 🚀 Implementation Guide

### Step 1: Setup

```bash
# Create directory structure
mkdir -p apps/web/app/(dashboard)/tenants
mkdir -p apps/web/components/tenants
mkdir -p apps/web/hooks/tenants

# Create feature flag
echo 'flags.m80_multi_tenant = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/tenants/TenantList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useTenantList } from "@/hooks/tenants/useTenantList";

export function TenantList() {
  const { data, isLoading, error } = useTenantList();

  if (isLoading) return <TenantSkeleton />;
  if (error) return <TenantErrorState />;
  if (!data?.length) return <TenantEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="name"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/tenants/useTenantList.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useTenantList(filters?: TenantFilters) {
  return useQuery({
    queryKey: ["tenants", "list", filters],
    queryFn: () => api.tenants.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/tenants/page.tsx
import { TenantList } from "@/components/tenants/TenantList";
import { TenantFilters } from "@/components/tenants/TenantFilters";

export default function TenantPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tenants</h1>
        <CreateTenantButton />
      </div>
      <TenantFilters />
      <TenantList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/tenants/__tests__/TenantList.test.tsx
import { render, screen } from "@testing-library/react";
import { TenantList } from "@/components/tenants/TenantList";

describe("TenantList", () => {
  it("renders list of tenants", () => {
    render(<TenantList />);
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
  m80_multi_tenant: false, // Default: disabled
};

// Usage in components
if (flags.m80_multi_tenant) {
  return <TenantList />;
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

1. **Set feature flag**: `flags.m80_multi_tenant = false`
2. **Invalidate cache**: `revalidateTag('tenants')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Tenant switching functional
- [ ] Settings configuration working
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

**Ready to implement Multi-Tenant Architecture UI! 🚀**
