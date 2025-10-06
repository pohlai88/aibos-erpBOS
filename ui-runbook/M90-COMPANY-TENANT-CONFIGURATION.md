# 🎯 M90: Company/Tenant Configuration - UI Implementation Runbook

**Module ID**: M90  
**Module Name**: Company/Tenant Configuration  
**Priority**: 🔥 HIGH  
**Phase**: Phase 17 - Infrastructure Modernization  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M70-COMPANY-TENANT-CONFIGURATION

---

## 📋 Module Overview

### Business Value

Company/Tenant Configuration provides **comprehensive company and tenant management** for businesses requiring organized multi-tenant architecture and company settings.

**Key Benefits**:

- Complete company and tenant management
- Multi-tenant architecture support
- Company settings and configuration
- Integration with all existing modules

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
| **API**       | ✅ Complete | 12 endpoints available    |
| **Contracts** | ✅ Complete | Type-safe schemas defined |

### API Endpoints

**Company/Tenant Configuration Operations** (12 endpoints):

- ✅ `/api/companies` - List companies
- ✅ `/api/companies/[id]` - Get company details
- ✅ `/api/companies/create` - Create company
- ✅ `/api/companies/[id]/update` - Update company
- ✅ `/api/companies/[id]/delete` - Delete company
- ✅ `/api/companies/[id]/settings` - Get company settings
- ✅ `/api/companies/[id]/settings/update` - Update company settings
- ✅ `/api/tenants` - List tenants
- ✅ `/api/tenants/[id]` - Get tenant details
- ✅ `/api/tenants/create` - Create tenant
- ✅ `/api/tenants/[id]/update` - Update tenant
- ✅ `/api/tenants/[id]/delete` - Delete tenant

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                      | Page Component        | Purpose              |
| -------------------------- | --------------------- | -------------------- |
| `/companies`               | `CompanyListPage`     | List companies       |
| `/companies/[id]`          | `CompanyDetailPage`   | View company details |
| `/companies/create`        | `CompanyCreatePage`   | Create company       |
| `/companies/[id]/edit`     | `CompanyEditPage`     | Edit company         |
| `/companies/[id]/settings` | `CompanySettingsPage` | Company settings     |
| `/tenants`                 | `TenantListPage`      | List tenants         |
| `/tenants/[id]`            | `TenantDetailPage`    | View tenant details  |
| `/tenants/create`          | `TenantCreatePage`    | Create tenant        |
| `/tenants/[id]/edit`       | `TenantEditPage`      | Edit tenant          |

### Component Structure

```
apps/web/app/(dashboard)/companies/
├── page.tsx                    # Companies list
├── [id]/
│   ├── page.tsx               # Company details
│   ├── edit/
│   │   └── page.tsx           # Edit company
│   └── settings/
│       └── page.tsx           # Company settings
└── create/
    └── page.tsx               # Create company

apps/web/app/(dashboard)/tenants/
├── page.tsx                    # Tenants list
├── [id]/
│   ├── page.tsx               # Tenant details
│   └── edit/
│       └── page.tsx           # Edit tenant
└── create/
    └── page.tsx               # Create tenant

apps/web/components/companies/
├── CompanyList.tsx            # Companies component
├── CompanyCard.tsx             # Company card
├── CompanyForm.tsx             # Company form
├── CompanySettings.tsx         # Company settings
├── TenantList.tsx              # Tenants component
├── TenantCard.tsx              # Tenant card
├── TenantForm.tsx              # Tenant form
├── CompanyFilters.tsx          # Filter component
└── CompanyActions.tsx          # Action buttons

apps/web/hooks/companies/
├── useCompanyList.ts           # Companies hook
├── useCompanyDetail.ts         # Company detail hook
├── useCompanyCreate.ts         # Company create hook
├── useCompanyUpdate.ts         # Company update hook
├── useCompanySettings.ts       # Company settings hook
├── useCompanySettingsUpdate.ts # Company settings update hook
├── useTenantList.ts            # Tenants hook
├── useTenantDetail.ts          # Tenant detail hook
├── useTenantCreate.ts          # Tenant create hook
├── useTenantUpdate.ts          # Tenant update hook
└── useTenantDelete.ts          # Tenant delete hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m90_company_tenant_configuration = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose                | Variant                    |
| ----------- | ---------------------- | -------------------------- |
| `DataTable` | List companies/tenants | With filters, pagination   |
| `Card`      | Company details        | With actions               |
| `Form`      | Create/edit forms      | With validation            |
| `Button`    | Actions                | Primary, secondary, danger |
| `Modal`     | Confirmations          | With backdrop              |
| `Tabs`      | Settings tabs          | With content               |
| `Switch`    | Toggle settings        | With labels                |

### Design Tokens

```typescript
// Company-specific colors
const companyColors = {
  active: "hsl(var(--company-active))",
  inactive: "hsl(var(--company-inactive))",
  suspended: "hsl(var(--company-suspended))",
  pending: "hsl(var(--company-pending))",
};

// Company status colors
const companyStatusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  suspended: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
};

// Tenant type colors
const tenantTypeColors = {
  production: "hsl(var(--tenant-production))",
  staging: "hsl(var(--tenant-staging))",
  development: "hsl(var(--tenant-development))",
  testing: "hsl(var(--tenant-testing))",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Company Themes**: Status-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  companies: ["companies", "list"] as const,
  company: (id: string) => ["companies", "detail", id] as const,
  companySettings: (id: string) => ["companies", "settings", id] as const,
  tenants: ["tenants", "list"] as const,
  tenant: (id: string) => ["tenants", "detail", id] as const,
};
```

### Cache Configuration

| Query Type       | Stale Time | Cache Time | Invalidation            |
| ---------------- | ---------- | ---------- | ----------------------- |
| Companies        | 5 minutes  | 10 minutes | On create/update/delete |
| Company          | 10 minutes | 30 minutes | On update/delete        |
| Company Settings | 15 minutes | 45 minutes | On settings change      |
| Tenants          | 5 minutes  | 15 minutes | On create/update/delete |
| Tenant           | 10 minutes | 30 minutes | On update/delete        |

### Invalidation Rules

```typescript
// After creating company
queryClient.invalidateQueries({ queryKey: ["companies", "list"] });

// After updating company
queryClient.invalidateQueries({ queryKey: ["companies", "detail", id] });
queryClient.invalidateQueries({ queryKey: ["companies", "list"] });

// After updating company settings
queryClient.invalidateQueries({ queryKey: ["companies", "settings", id] });
queryClient.invalidateQueries({ queryKey: ["companies", "detail", id] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Company

1. User navigates to companies page
2. User clicks "Create Company" button
3. System opens company creation form
4. User fills company details
5. User sets company settings
6. User configures company preferences
7. User submits company

#### 2. Configure Company Settings

1. User views company detail page
2. User navigates to settings tab
3. User sees company settings options
4. User modifies settings
5. User saves settings changes
6. System updates company configuration

#### 3. Manage Tenants

1. User navigates to tenants page
2. User sees list of tenants
3. User can create new tenant
4. User can edit existing tenant
5. User can delete tenant
6. User can manage tenant settings

### UI States

| State          | Component           | Message                          |
| -------------- | ------------------- | -------------------------------- |
| **Empty**      | `CompanyEmptyState` | "No companies found"             |
| **Loading**    | `CompanySkeleton`   | Loading skeleton                 |
| **Error**      | `CompanyErrorState` | "Failed to load companies"       |
| **No Results** | `CompanyNoResults`  | "No companies match your search" |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation
- **Tab Navigation**: Settings tabs, content switching

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
| `Ctrl/Cmd + N` | Create new company |
| `Ctrl/Cmd + F` | Focus search field |
| `Ctrl/Cmd + S` | Save settings      |
| `Ctrl/Cmd + T` | Create new tenant  |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

### ARIA Implementation

```typescript
// Company list
<table role="table" aria-label="Companies list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Company Name</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Created</th>
      <th role="columnheader" aria-sort="none">Actions</th>
    </tr>
  </thead>
</table>

// Company form
<form role="form" aria-label="Create Company">
  <input
    aria-describedby="name-error"
    aria-invalid="false"
    aria-label="Company Name"
  />
  <div id="name-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("CompanyList", () => {
  it("renders list of companies", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useCompanyCreate", () => {
  it("creates company successfully", () => {});
  it("handles creation errors", () => {});
  it("validates company data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Company API Integration", () => {
  it("creates company successfully", () => {});
  it("updates company successfully", () => {});
  it("updates company settings successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Company/Tenant Configuration E2E", () => {
  it("complete company creation flow", () => {});
  it("complete company settings flow", () => {});
  it("complete tenant management flow", () => {});
  it("company configuration functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Company/Tenant Configuration Accessibility", () => {
  it("meets WCAG 2.2 AA standards", () => {});
  it("supports keyboard navigation", () => {});
  it("works with screen readers", () => {});
  it("has proper color contrast", () => {});
});
```

---

## ⚡ Performance

### Bundle Size

- **Target**: ≤300KB gzipped per route
- **Current**: <CURRENT_SIZE>KB
- **Optimization**: Code splitting, lazy loading, form optimization

### Loading Performance

- **TTFB**: ≤70ms (Time to First Byte)
- **TTI**: ≤200ms (Time to Interactive)
- **LCP**: ≤2.5s (Largest Contentful Paint)

### Optimization Strategies

```typescript
// Lazy loading
const CompanyForm = lazy(() => import("./components/CompanyForm"));
const CompanySettings = lazy(() => import("./components/CompanySettings"));

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
mkdir -p apps/web/app/(dashboard)/companies
mkdir -p apps/web/app/(dashboard)/tenants
mkdir -p apps/web/components/companies
mkdir -p apps/web/hooks/companies

# Create feature flag
echo 'flags.m90_company_tenant_configuration = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/companies/CompanyList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useCompanyList } from "@/hooks/companies/useCompanyList";

export function CompanyList() {
  const { data, isLoading, error } = useCompanyList();

  if (isLoading) return <CompanySkeleton />;
  if (error) return <CompanyErrorState />;
  if (!data?.length) return <CompanyEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="companyName"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/companies/useCompanyList.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCompanyList(filters?: CompanyFilters) {
  return useQuery({
    queryKey: ["companies", "list", filters],
    queryFn: () => api.companies.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/companies/page.tsx
import { CompanyList } from "@/components/companies/CompanyList";
import { CompanyFilters } from "@/components/companies/CompanyFilters";

export default function CompanyPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Companies</h1>
        <CreateCompanyButton />
      </div>
      <CompanyFilters />
      <CompanyList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/companies/__tests__/CompanyList.test.tsx
import { render, screen } from "@testing-library/react";
import { CompanyList } from "@/components/companies/CompanyList";

describe("CompanyList", () => {
  it("renders list of companies", () => {
    render(<CompanyList />);
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
| Bundle size       | ≤300KB    | CI blocks   |

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
  m90_company_tenant_configuration: false, // Default: disabled
};

// Usage in components
if (flags.m90_company_tenant_configuration) {
  return <CompanyList />;
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

1. **Set feature flag**: `flags.m90_company_tenant_configuration = false`
2. **Invalidate cache**: `revalidateTag('companies')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Company management functional
- [ ] Company settings working
- [ ] Tenant management functional
- [ ] Multi-tenant support working
- [ ] Company configuration functional
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

**Ready to implement Company/Tenant Configuration UI! 🚀**
