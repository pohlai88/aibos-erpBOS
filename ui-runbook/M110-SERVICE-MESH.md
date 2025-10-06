# 🎯 M110: Service Mesh - UI Implementation Runbook

**Module ID**: M110  
**Module Name**: Service Mesh  
**Priority**: 🔶 MEDIUM  
**Phase**: Phase 19 - Infrastructure Modernization  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: ❌ NO - CREATE NEW Module

---

## 📋 Module Overview

### Business Value

Service Mesh provides **comprehensive service mesh management and traffic control** for businesses requiring microservices communication and network management.

**Key Benefits**:

- Complete service mesh management
- Traffic control
- Service communication
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

**Service Mesh Operations** (15 endpoints):

- ✅ `/api/service-mesh/meshes` - List service meshes
- ✅ `/api/service-mesh/meshes/[id]` - Get mesh details
- ✅ `/api/service-mesh/meshes/create` - Create mesh
- ✅ `/api/service-mesh/meshes/[id]/update` - Update mesh
- ✅ `/api/service-mesh/meshes/[id]/delete` - Delete mesh
- ✅ `/api/service-mesh/meshes/[id]/deploy` - Deploy mesh
- ✅ `/api/service-mesh/meshes/[id]/status` - Get mesh status
- ✅ `/api/service-mesh/services` - List services
- ✅ `/api/service-mesh/services/[id]` - Get service details
- ✅ `/api/service-mesh/services/create` - Create service
- ✅ `/api/service-mesh/services/[id]/update` - Update service
- ✅ `/api/service-mesh/services/[id]/delete` - Delete service
- ✅ `/api/service-mesh/services/[id]/traffic` - Manage service traffic
- ✅ `/api/service-mesh/analytics` - Get service mesh analytics
- ✅ `/api/service-mesh/alerts` - Get service mesh alerts

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                              | Page Component                 | Purpose                |
| ---------------------------------- | ------------------------------ | ---------------------- |
| `/service-mesh`                    | `ServiceMeshPage`              | Main service mesh hub  |
| `/service-mesh/meshes`             | `ServiceMeshMeshesPage`        | Mesh management        |
| `/service-mesh/meshes/[id]`        | `ServiceMeshMeshDetailPage`    | View mesh details      |
| `/service-mesh/meshes/create`      | `ServiceMeshMeshCreatePage`    | Create mesh            |
| `/service-mesh/meshes/[id]/edit`   | `ServiceMeshMeshEditPage`      | Edit mesh              |
| `/service-mesh/services`           | `ServiceMeshServicesPage`      | Service management     |
| `/service-mesh/services/[id]`      | `ServiceMeshServiceDetailPage` | View service details   |
| `/service-mesh/services/create`    | `ServiceMeshServiceCreatePage` | Create service         |
| `/service-mesh/services/[id]/edit` | `ServiceMeshServiceEditPage`   | Edit service           |
| `/service-mesh/analytics`          | `ServiceMeshAnalyticsPage`     | Service mesh analytics |
| `/service-mesh/alerts`             | `ServiceMeshAlertsPage`        | Service mesh alerts    |

### Component Structure

```
apps/web/app/(dashboard)/service-mesh/
├── page.tsx                    # Main hub page
├── meshes/
│   ├── page.tsx               # Meshes list
│   ├── [id]/
│   │   ├── page.tsx           # Mesh details
│   │   └── edit/
│   │       └── page.tsx       # Edit mesh
│   └── create/
│       └── page.tsx           # Create mesh
├── services/
│   ├── page.tsx               # Services list
│   ├── [id]/
│   │   ├── page.tsx           # Service details
│   │   └── edit/
│   │       └── page.tsx       # Edit service
│   └── create/
│       └── page.tsx           # Create service
├── analytics/
│   └── page.tsx               # Analytics page
└── alerts/
    └── page.tsx               # Alerts page

apps/web/components/service-mesh/
├── ServiceMeshHub.tsx      # Main hub component
├── ServiceMeshMeshes.tsx  # Meshes component
├── ServiceMeshMeshCard.tsx # Mesh card
├── ServiceMeshMeshForm.tsx # Mesh form
├── ServiceMeshServices.tsx # Services component
├── ServiceMeshServiceCard.tsx # Service card
├── ServiceMeshServiceForm.tsx # Service form
├── ServiceMeshAnalytics.tsx # Analytics component
├── ServiceMeshAlerts.tsx   # Alerts component
├── ServiceMeshFilters.tsx  # Filter component
└── ServiceMeshActions.tsx  # Action buttons

apps/web/hooks/service-mesh/
├── useServiceMeshMeshes.ts # Meshes hook
├── useServiceMeshMeshDetail.ts # Mesh detail hook
├── useServiceMeshMeshCreate.ts # Mesh create hook
├── useServiceMeshMeshUpdate.ts # Mesh update hook
├── useServiceMeshMeshDelete.ts # Mesh delete hook
├── useServiceMeshMeshDeploy.ts # Mesh deploy hook
├── useServiceMeshMeshStatus.ts # Mesh status hook
├── useServiceMeshServices.ts # Services hook
├── useServiceMeshServiceDetail.ts # Service detail hook
├── useServiceMeshServiceCreate.ts # Service create hook
├── useServiceMeshServiceUpdate.ts # Service update hook
├── useServiceMeshServiceDelete.ts # Service delete hook
├── useServiceMeshServiceTraffic.ts # Service traffic hook
├── useServiceMeshAnalytics.ts # Analytics hook
└── useServiceMeshAlerts.ts # Alerts hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m110_service_mesh = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose              | Variant                    |
| ----------- | -------------------- | -------------------------- |
| `DataTable` | List meshes/services | With filters, pagination   |
| `Card`      | Mesh details         | With actions               |
| `Form`      | Create/edit forms    | With validation            |
| `Button`    | Actions              | Primary, secondary, danger |
| `Modal`     | Confirmations        | With backdrop              |
| `Tabs`      | Mesh tabs            | With content               |
| `Progress`  | Mesh progress        | With status                |

### Design Tokens

```typescript
// Service mesh-specific colors
const serviceMeshColors = {
  mesh: "hsl(var(--mesh))",
  service: "hsl(var(--service))",
  traffic: "hsl(var(--traffic))",
  proxy: "hsl(var(--proxy))",
  gateway: "hsl(var(--gateway))",
};

// Mesh status colors
const meshStatusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  deploying: "bg-blue-100 text-blue-800",
  failed: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  error: "bg-red-200 text-red-900",
};

// Service status colors
const serviceStatusColors = {
  healthy: "bg-green-100 text-green-800",
  unhealthy: "bg-red-100 text-red-800",
  unknown: "bg-gray-100 text-gray-800",
  starting: "bg-blue-100 text-blue-800",
  stopping: "bg-orange-100 text-orange-800",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Service Mesh Themes**: Status-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  meshes: ["service-mesh", "meshes"] as const,
  mesh: (id: string) => ["service-mesh", "mesh", id] as const,
  services: ["service-mesh", "services"] as const,
  service: (id: string) => ["service-mesh", "service", id] as const,
  analytics: ["service-mesh", "analytics"] as const,
  alerts: ["service-mesh", "alerts"] as const,
};
```

### Cache Configuration

| Query Type | Stale Time | Cache Time | Invalidation            |
| ---------- | ---------- | ---------- | ----------------------- |
| Meshes     | 30 seconds | 2 minutes  | On create/update/delete |
| Mesh       | 15 seconds | 1 minute   | On update/delete        |
| Services   | 15 seconds | 1 minute   | On create/update/delete |
| Service    | 10 seconds | 30 seconds | On update/delete        |
| Analytics  | 1 minute   | 5 minutes  | On mesh change          |
| Alerts     | 15 seconds | 1 minute   | On alert update         |

### Invalidation Rules

```typescript
// After creating mesh
queryClient.invalidateQueries({ queryKey: ["service-mesh", "meshes"] });
queryClient.invalidateQueries({ queryKey: ["service-mesh", "analytics"] });

// After updating mesh
queryClient.invalidateQueries({ queryKey: ["service-mesh", "mesh", id] });
queryClient.invalidateQueries({ queryKey: ["service-mesh", "meshes"] });

// After managing service traffic
queryClient.invalidateQueries({ queryKey: ["service-mesh", "service", id] });
queryClient.invalidateQueries({ queryKey: ["service-mesh", "alerts"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Service Mesh

1. User navigates to service mesh page
2. User clicks "Create Mesh" button
3. System opens mesh creation form
4. User enters mesh details
5. User sets mesh parameters
6. User configures mesh settings
7. User submits mesh

#### 2. Create Service

1. User navigates to services page
2. User clicks "Create Service" button
3. System opens service creation form
4. User selects mesh
5. User sets service parameters
6. User configures service settings
7. User creates service

#### 3. Deploy Mesh

1. User views mesh details
2. User clicks "Deploy Mesh" button
3. System opens deployment confirmation
4. User confirms deployment parameters
5. User clicks "Confirm Deploy"
6. System starts deployment
7. User monitors deployment progress

### UI States

| State          | Component               | Message                         |
| -------------- | ----------------------- | ------------------------------- |
| **Empty**      | `ServiceMeshEmptyState` | "No service meshes found"       |
| **Loading**    | `ServiceMeshSkeleton`   | Loading skeleton                |
| **Error**      | `ServiceMeshErrorState` | "Failed to load service meshes" |
| **No Results** | `ServiceMeshNoResults`  | "No meshes match your search"   |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation
- **Progress**: Mesh deployment progress, status updates

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
| `Ctrl/Cmd + M` | Create mesh        |
| `Ctrl/Cmd + S` | Create service     |
| `Ctrl/Cmd + D` | Deploy mesh        |
| `Ctrl/Cmd + T` | Manage traffic     |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

### ARIA Implementation

```typescript
// Mesh list
<table role="table" aria-label="Service mesh list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Mesh Name</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Services</th>
      <th role="columnheader" aria-sort="none">Last Deployed</th>
    </tr>
  </thead>
</table>

// Mesh form
<form role="form" aria-label="Create Service Mesh">
  <input
    aria-describedby="name-error"
    aria-invalid="false"
    aria-label="Mesh Name"
  />
  <div id="name-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("ServiceMeshMeshes", () => {
  it("renders list of meshes", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useServiceMeshMeshCreate", () => {
  it("creates mesh successfully", () => {});
  it("handles creation errors", () => {});
  it("validates mesh data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Service Mesh API Integration", () => {
  it("creates mesh successfully", () => {});
  it("deploys mesh successfully", () => {});
  it("creates service successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Service Mesh E2E", () => {
  it("complete mesh creation flow", () => {});
  it("complete service creation flow", () => {});
  it("complete mesh deployment", () => {});
  it("service mesh analytics functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Service Mesh Accessibility", () => {
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
const ServiceMeshMeshForm = lazy(
  () => import("./components/ServiceMeshMeshForm")
);
const ServiceMeshAnalytics = lazy(
  () => import("./components/ServiceMeshAnalytics")
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
mkdir -p apps/web/app/(dashboard)/service-mesh
mkdir -p apps/web/components/service-mesh
mkdir -p apps/web/hooks/service-mesh

# Create feature flag
echo 'flags.m110_service_mesh = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/service-mesh/ServiceMeshMeshes.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useServiceMeshMeshes } from "@/hooks/service-mesh/useServiceMeshMeshes";

export function ServiceMeshMeshes() {
  const { data, isLoading, error } = useServiceMeshMeshes();

  if (isLoading) return <ServiceMeshSkeleton />;
  if (error) return <ServiceMeshErrorState />;
  if (!data?.length) return <ServiceMeshEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="meshName"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/service-mesh/useServiceMeshMeshes.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useServiceMeshMeshes(filters?: ServiceMeshFilters) {
  return useQuery({
    queryKey: ["service-mesh", "meshes", filters],
    queryFn: () => api.serviceMesh.meshes.list(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/service-mesh/page.tsx
import { ServiceMeshHub } from "@/components/service-mesh/ServiceMeshHub";
import { ServiceMeshQuickActions } from "@/components/service-mesh/ServiceMeshQuickActions";

export default function ServiceMeshPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Service Mesh</h1>
        <ServiceMeshQuickActions />
      </div>
      <ServiceMeshHub />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/service-mesh/__tests__/ServiceMeshMeshes.test.tsx
import { render, screen } from "@testing-library/react";
import { ServiceMeshMeshes } from "@/components/service-mesh/ServiceMeshMeshes";

describe("ServiceMeshMeshes", () => {
  it("renders list of meshes", () => {
    render(<ServiceMeshMeshes />);
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
  m110_service_mesh: false, // Default: disabled
};

// Usage in components
if (flags.m110_service_mesh) {
  return <ServiceMeshMeshes />;
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

1. **Set feature flag**: `flags.m110_service_mesh = false`
2. **Invalidate cache**: `revalidateTag('service-mesh')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Mesh management functional
- [ ] Service management working
- [ ] Mesh deployment functional
- [ ] Traffic management working
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

**Ready to implement Service Mesh UI! 🚀**
