# 🎯 M107: Infrastructure as Code - UI Implementation Runbook

**Module ID**: M107  
**Module Name**: Infrastructure as Code  
**Priority**: 🔶 MEDIUM  
**Phase**: Phase 18 - Infrastructure Modernization  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: ❌ NO - CREATE NEW Module

---

## 📋 Module Overview

### Business Value

Infrastructure as Code provides **comprehensive infrastructure provisioning and management** for businesses requiring automated infrastructure deployment and configuration management.

**Key Benefits**:

- Complete infrastructure management
- Automated provisioning
- Configuration management
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
| **API**       | ✅ Complete | 15 endpoints available    |
| **Contracts** | ✅ Complete | Type-safe schemas defined |

### API Endpoints

**Infrastructure as Code Operations** (15 endpoints):

- ✅ `/api/infrastructure-as-code/stacks` - List infrastructure stacks
- ✅ `/api/infrastructure-as-code/stacks/[id]` - Get stack details
- ✅ `/api/infrastructure-as-code/stacks/create` - Create stack
- ✅ `/api/infrastructure-as-code/stacks/[id]/update` - Update stack
- ✅ `/api/infrastructure-as-code/stacks/[id]/delete` - Delete stack
- ✅ `/api/infrastructure-as-code/stacks/[id]/deploy` - Deploy stack
- ✅ `/api/infrastructure-as-code/stacks/[id]/destroy` - Destroy stack
- ✅ `/api/infrastructure-as-code/templates` - List templates
- ✅ `/api/infrastructure-as-code/templates/[id]` - Get template details
- ✅ `/api/infrastructure-as-code/templates/create` - Create template
- ✅ `/api/infrastructure-as-code/templates/[id]/update` - Update template
- ✅ `/api/infrastructure-as-code/templates/[id]/delete` - Delete template
- ✅ `/api/infrastructure-as-code/templates/[id]/validate` - Validate template
- ✅ `/api/infrastructure-as-code/analytics` - Get infrastructure analytics
- ✅ `/api/infrastructure-as-code/alerts` - Get infrastructure alerts

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                                         | Page Component                           | Purpose                  |
| --------------------------------------------- | ---------------------------------------- | ------------------------ |
| `/infrastructure-as-code`                     | `InfrastructureAsCodePage`               | Main infrastructure hub  |
| `/infrastructure-as-code/stacks`              | `InfrastructureAsCodeStacksPage`         | Stack management         |
| `/infrastructure-as-code/stacks/[id]`         | `InfrastructureAsCodeStackDetailPage`    | View stack details       |
| `/infrastructure-as-code/stacks/create`       | `InfrastructureAsCodeStackCreatePage`    | Create stack             |
| `/infrastructure-as-code/stacks/[id]/edit`    | `InfrastructureAsCodeStackEditPage`      | Edit stack               |
| `/infrastructure-as-code/templates`           | `InfrastructureAsCodeTemplatesPage`      | Template management      |
| `/infrastructure-as-code/templates/[id]`      | `InfrastructureAsCodeTemplateDetailPage` | View template details    |
| `/infrastructure-as-code/templates/create`    | `InfrastructureAsCodeTemplateCreatePage` | Create template          |
| `/infrastructure-as-code/templates/[id]/edit` | `InfrastructureAsCodeTemplateEditPage`   | Edit template            |
| `/infrastructure-as-code/analytics`           | `InfrastructureAsCodeAnalyticsPage`      | Infrastructure analytics |
| `/infrastructure-as-code/alerts`              | `InfrastructureAsCodeAlertsPage`         | Infrastructure alerts    |

### Component Structure

```
apps/web/app/(dashboard)/infrastructure-as-code/
├── page.tsx                    # Main hub page
├── stacks/
│   ├── page.tsx               # Stacks list
│   ├── [id]/
│   │   ├── page.tsx           # Stack details
│   │   └── edit/
│   │       └── page.tsx       # Edit stack
│   └── create/
│       └── page.tsx           # Create stack
├── templates/
│   ├── page.tsx               # Templates list
│   ├── [id]/
│   │   ├── page.tsx           # Template details
│   │   └── edit/
│   │       └── page.tsx       # Edit template
│   └── create/
│       └── page.tsx           # Create template
├── analytics/
│   └── page.tsx               # Analytics page
└── alerts/
    └── page.tsx               # Alerts page

apps/web/components/infrastructure-as-code/
├── InfrastructureAsCodeHub.tsx      # Main hub component
├── InfrastructureAsCodeStacks.tsx  # Stacks component
├── InfrastructureAsCodeStackCard.tsx # Stack card
├── InfrastructureAsCodeStackForm.tsx # Stack form
├── InfrastructureAsCodeTemplates.tsx # Templates component
├── InfrastructureAsCodeTemplateCard.tsx # Template card
├── InfrastructureAsCodeTemplateForm.tsx # Template form
├── InfrastructureAsCodeAnalytics.tsx # Analytics component
├── InfrastructureAsCodeAlerts.tsx   # Alerts component
├── InfrastructureAsCodeFilters.tsx  # Filter component
└── InfrastructureAsCodeActions.tsx  # Action buttons

apps/web/hooks/infrastructure-as-code/
├── useInfrastructureAsCodeStacks.ts # Stacks hook
├── useInfrastructureAsCodeStackDetail.ts # Stack detail hook
├── useInfrastructureAsCodeStackCreate.ts # Stack create hook
├── useInfrastructureAsCodeStackUpdate.ts # Stack update hook
├── useInfrastructureAsCodeStackDelete.ts # Stack delete hook
├── useInfrastructureAsCodeStackDeploy.ts # Stack deploy hook
├── useInfrastructureAsCodeStackDestroy.ts # Stack destroy hook
├── useInfrastructureAsCodeTemplates.ts # Templates hook
├── useInfrastructureAsCodeTemplateDetail.ts # Template detail hook
├── useInfrastructureAsCodeTemplateCreate.ts # Template create hook
├── useInfrastructureAsCodeTemplateUpdate.ts # Template update hook
├── useInfrastructureAsCodeTemplateDelete.ts # Template delete hook
├── useInfrastructureAsCodeTemplateValidate.ts # Template validate hook
├── useInfrastructureAsCodeAnalytics.ts # Analytics hook
└── useInfrastructureAsCodeAlerts.ts # Alerts hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m107_infrastructure_as_code = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose               | Variant                    |
| ----------- | --------------------- | -------------------------- |
| `DataTable` | List stacks/templates | With filters, pagination   |
| `Card`      | Stack details         | With actions               |
| `Form`      | Create/edit forms     | With validation            |
| `Button`    | Actions               | Primary, secondary, danger |
| `Modal`     | Confirmations         | With backdrop              |
| `Tabs`      | Stack tabs            | With content               |
| `Progress`  | Stack progress        | With status                |

### Design Tokens

```typescript
// Infrastructure as Code-specific colors
const infrastructureAsCodeColors = {
  stack: "hsl(var(--stack))",
  template: "hsl(var(--template))",
  resource: "hsl(var(--resource))",
  deployment: "hsl(var(--deployment))",
  configuration: "hsl(var(--configuration))",
};

// Stack status colors
const stackStatusColors = {
  deployed: "bg-green-100 text-green-800",
  deploying: "bg-blue-100 text-blue-800",
  failed: "bg-red-100 text-red-800",
  destroyed: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  error: "bg-red-200 text-red-900",
};

// Template status colors
const templateStatusColors = {
  valid: "bg-green-100 text-green-800",
  invalid: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  draft: "bg-gray-100 text-gray-800",
  published: "bg-blue-100 text-blue-800",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Infrastructure Themes**: Status-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  stacks: ["infrastructure-as-code", "stacks"] as const,
  stack: (id: string) => ["infrastructure-as-code", "stack", id] as const,
  templates: ["infrastructure-as-code", "templates"] as const,
  template: (id: string) => ["infrastructure-as-code", "template", id] as const,
  analytics: ["infrastructure-as-code", "analytics"] as const,
  alerts: ["infrastructure-as-code", "alerts"] as const,
};
```

### Cache Configuration

| Query Type | Stale Time | Cache Time | Invalidation            |
| ---------- | ---------- | ---------- | ----------------------- |
| Stacks     | 30 seconds | 2 minutes  | On create/update/delete |
| Stack      | 15 seconds | 1 minute   | On update/delete        |
| Templates  | 5 minutes  | 15 minutes | On create/update/delete |
| Template   | 5 minutes  | 15 minutes | On update/delete        |
| Analytics  | 1 minute   | 5 minutes  | On stack change         |
| Alerts     | 15 seconds | 1 minute   | On alert update         |

### Invalidation Rules

```typescript
// After creating stack
queryClient.invalidateQueries({
  queryKey: ["infrastructure-as-code", "stacks"],
});
queryClient.invalidateQueries({
  queryKey: ["infrastructure-as-code", "analytics"],
});

// After updating stack
queryClient.invalidateQueries({
  queryKey: ["infrastructure-as-code", "stack", id],
});
queryClient.invalidateQueries({
  queryKey: ["infrastructure-as-code", "stacks"],
});

// After deploying stack
queryClient.invalidateQueries({
  queryKey: ["infrastructure-as-code", "stack", id],
});
queryClient.invalidateQueries({
  queryKey: ["infrastructure-as-code", "alerts"],
});
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Infrastructure Stack

1. User navigates to infrastructure as code page
2. User clicks "Create Stack" button
3. System opens stack creation form
4. User enters stack details
5. User selects template
6. User configures stack parameters
7. User submits stack

#### 2. Create Template

1. User navigates to templates page
2. User clicks "Create Template" button
3. System opens template creation form
4. User enters template details
5. User defines template structure
6. User configures template settings
7. User saves template

#### 3. Deploy Stack

1. User views stack details
2. User clicks "Deploy Stack" button
3. System opens deployment confirmation
4. User confirms deployment parameters
5. User clicks "Confirm Deploy"
6. System starts deployment
7. User monitors deployment progress

### UI States

| State          | Component                        | Message                                |
| -------------- | -------------------------------- | -------------------------------------- |
| **Empty**      | `InfrastructureAsCodeEmptyState` | "No infrastructure stacks found"       |
| **Loading**    | `InfrastructureAsCodeSkeleton`   | Loading skeleton                       |
| **Error**      | `InfrastructureAsCodeErrorState` | "Failed to load infrastructure stacks" |
| **No Results** | `InfrastructureAsCodeNoResults`  | "No stacks match your search"          |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation
- **Progress**: Stack deployment progress, status updates

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
| `Ctrl/Cmd + S` | Create stack       |
| `Ctrl/Cmd + T` | Create template    |
| `Ctrl/Cmd + D` | Deploy stack       |
| `Ctrl/Cmd + X` | Destroy stack      |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

### ARIA Implementation

```typescript
// Stack list
<table role="table" aria-label="Infrastructure stack list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Stack Name</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Template</th>
      <th role="columnheader" aria-sort="none">Last Deployed</th>
    </tr>
  </thead>
</table>

// Stack form
<form role="form" aria-label="Create Infrastructure Stack">
  <input
    aria-describedby="name-error"
    aria-invalid="false"
    aria-label="Stack Name"
  />
  <div id="name-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("InfrastructureAsCodeStacks", () => {
  it("renders list of stacks", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useInfrastructureAsCodeStackCreate", () => {
  it("creates stack successfully", () => {});
  it("handles creation errors", () => {});
  it("validates stack data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Infrastructure as Code API Integration", () => {
  it("creates stack successfully", () => {});
  it("deploys stack successfully", () => {});
  it("creates template successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Infrastructure as Code E2E", () => {
  it("complete stack creation flow", () => {});
  it("complete template creation flow", () => {});
  it("complete stack deployment", () => {});
  it("infrastructure analytics functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Infrastructure as Code Accessibility", () => {
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
const InfrastructureAsCodeStackForm = lazy(
  () => import("./components/InfrastructureAsCodeStackForm")
);
const InfrastructureAsCodeAnalytics = lazy(
  () => import("./components/InfrastructureAsCodeAnalytics")
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
mkdir -p apps/web/app/(dashboard)/infrastructure-as-code
mkdir -p apps/web/components/infrastructure-as-code
mkdir -p apps/web/hooks/infrastructure-as-code

# Create feature flag
echo 'flags.m107_infrastructure_as_code = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/infrastructure-as-code/InfrastructureAsCodeStacks.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useInfrastructureAsCodeStacks } from "@/hooks/infrastructure-as-code/useInfrastructureAsCodeStacks";

export function InfrastructureAsCodeStacks() {
  const { data, isLoading, error } = useInfrastructureAsCodeStacks();

  if (isLoading) return <InfrastructureAsCodeSkeleton />;
  if (error) return <InfrastructureAsCodeErrorState />;
  if (!data?.length) return <InfrastructureAsCodeEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="stackName"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/infrastructure-as-code/useInfrastructureAsCodeStacks.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useInfrastructureAsCodeStacks(
  filters?: InfrastructureAsCodeFilters
) {
  return useQuery({
    queryKey: ["infrastructure-as-code", "stacks", filters],
    queryFn: () => api.infrastructureAsCode.stacks.list(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/infrastructure-as-code/page.tsx
import { InfrastructureAsCodeHub } from "@/components/infrastructure-as-code/InfrastructureAsCodeHub";
import { InfrastructureAsCodeQuickActions } from "@/components/infrastructure-as-code/InfrastructureAsCodeQuickActions";

export default function InfrastructureAsCodePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Infrastructure as Code</h1>
        <InfrastructureAsCodeQuickActions />
      </div>
      <InfrastructureAsCodeHub />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/infrastructure-as-code/__tests__/InfrastructureAsCodeStacks.test.tsx
import { render, screen } from "@testing-library/react";
import { InfrastructureAsCodeStacks } from "@/components/infrastructure-as-code/InfrastructureAsCodeStacks";

describe("InfrastructureAsCodeStacks", () => {
  it("renders list of stacks", () => {
    render(<InfrastructureAsCodeStacks />);
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
  m107_infrastructure_as_code: false, // Default: disabled
};

// Usage in components
if (flags.m107_infrastructure_as_code) {
  return <InfrastructureAsCodeStacks />;
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

1. **Set feature flag**: `flags.m107_infrastructure_as_code = false`
2. **Invalidate cache**: `revalidateTag('infrastructure-as-code')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Stack management functional
- [ ] Template management working
- [ ] Stack deployment functional
- [ ] Template validation working
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

**Ready to implement Infrastructure as Code UI! 🚀**
