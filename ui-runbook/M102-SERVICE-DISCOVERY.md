# 🎯 M102: Service Discovery - UI Implementation Runbook

**Module ID**: M102  
**Module Name**: Service Discovery  
**Priority**: 🔥 HIGH  
**Phase**: Phase 18 - Infrastructure Modernization  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M40-API-GATEWAY

---

## 📋 Module Overview

### Business Value

Service Discovery provides **comprehensive service discovery and registration management** for businesses requiring microservices architecture and service orchestration.

**Key Benefits**:

- Complete service discovery
- Service registration
- Service health monitoring
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

**Service Discovery Operations** (15 endpoints):

- ✅ `/api/service-discovery/services` - List services
- ✅ `/api/service-discovery/services/[id]` - Get service details
- ✅ `/api/service-discovery/services/create` - Create service
- ✅ `/api/service-discovery/services/[id]/update` - Update service
- ✅ `/api/service-discovery/services/[id]/delete` - Delete service
- ✅ `/api/service-discovery/services/[id]/register` - Register service
- ✅ `/api/service-discovery/services/[id]/deregister` - Deregister service
- ✅ `/api/service-discovery/instances` - List service instances
- ✅ `/api/service-discovery/instances/[id]` - Get instance details
- ✅ `/api/service-discovery/instances/create` - Create instance
- ✅ `/api/service-discovery/instances/[id]/update` - Update instance
- ✅ `/api/service-discovery/instances/[id]/delete` - Delete instance
- ✅ `/api/service-discovery/instances/[id]/health` - Check instance health
- ✅ `/api/service-discovery/analytics` - Get service discovery analytics
- ✅ `/api/service-discovery/alerts` - Get service discovery alerts

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                                    | Page Component                       | Purpose                     |
| ---------------------------------------- | ------------------------------------ | --------------------------- |
| `/service-discovery`                     | `ServiceDiscoveryPage`               | Main service discovery hub  |
| `/service-discovery/services`            | `ServiceDiscoveryServicesPage`       | Service management          |
| `/service-discovery/services/[id]`       | `ServiceDiscoveryServiceDetailPage`  | View service details        |
| `/service-discovery/services/create`     | `ServiceDiscoveryServiceCreatePage`  | Create service              |
| `/service-discovery/services/[id]/edit`  | `ServiceDiscoveryServiceEditPage`    | Edit service                |
| `/service-discovery/instances`           | `ServiceDiscoveryInstancesPage`      | Instance management         |
| `/service-discovery/instances/[id]`      | `ServiceDiscoveryInstanceDetailPage` | View instance details       |
| `/service-discovery/instances/create`    | `ServiceDiscoveryInstanceCreatePage` | Create instance             |
| `/service-discovery/instances/[id]/edit` | `ServiceDiscoveryInstanceEditPage`   | Edit instance               |
| `/service-discovery/analytics`           | `ServiceDiscoveryAnalyticsPage`      | Service discovery analytics |
| `/service-discovery/alerts`              | `ServiceDiscoveryAlertsPage`         | Service discovery alerts    |

### Component Structure

```
apps/web/app/(dashboard)/service-discovery/
├── page.tsx                    # Main hub page
├── services/
│   ├── page.tsx               # Services list
│   ├── [id]/
│   │   ├── page.tsx           # Service details
│   │   └── edit/
│   │       └── page.tsx       # Edit service
│   └── create/
│       └── page.tsx           # Create service
├── instances/
│   ├── page.tsx               # Instances list
│   ├── [id]/
│   │   ├── page.tsx           # Instance details
│   │   └── edit/
│   │       └── page.tsx       # Edit instance
│   └── create/
│       └── page.tsx           # Create instance
├── analytics/
│   └── page.tsx               # Analytics page
└── alerts/
    └── page.tsx               # Alerts page

apps/web/components/service-discovery/
├── ServiceDiscoveryHub.tsx      # Main hub component
├── ServiceDiscoveryServices.tsx  # Services component
├── ServiceDiscoveryServiceCard.tsx # Service card
├── ServiceDiscoveryServiceForm.tsx # Service form
├── ServiceDiscoveryInstances.tsx # Instances component
├── ServiceDiscoveryInstanceCard.tsx # Instance card
├── ServiceDiscoveryInstanceForm.tsx # Instance form
├── ServiceDiscoveryAnalytics.tsx # Analytics component
├── ServiceDiscoveryAlerts.tsx   # Alerts component
├── ServiceDiscoveryFilters.tsx  # Filter component
└── ServiceDiscoveryActions.tsx  # Action buttons

apps/web/hooks/service-discovery/
├── useServiceDiscoveryServices.ts # Services hook
├── useServiceDiscoveryServiceDetail.ts # Service detail hook
├── useServiceDiscoveryServiceCreate.ts # Service create hook
├── useServiceDiscoveryServiceUpdate.ts # Service update hook
├── useServiceDiscoveryServiceDelete.ts # Service delete hook
├── useServiceDiscoveryServiceRegister.ts # Service register hook
├── useServiceDiscoveryServiceDeregister.ts # Service deregister hook
├── useServiceDiscoveryInstances.ts # Instances hook
├── useServiceDiscoveryInstanceDetail.ts # Instance detail hook
├── useServiceDiscoveryInstanceCreate.ts # Instance create hook
├── useServiceDiscoveryInstanceUpdate.ts # Instance update hook
├── useServiceDiscoveryInstanceDelete.ts # Instance delete hook
├── useServiceDiscoveryInstanceHealth.ts # Instance health hook
├── useServiceDiscoveryAnalytics.ts # Analytics hook
└── useServiceDiscoveryAlerts.ts # Alerts hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m102_service_discovery = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose                 | Variant                    |
| ----------- | ----------------------- | -------------------------- |
| `DataTable` | List services/instances | With filters, pagination   |
| `Card`      | Service details         | With actions               |
| `Form`      | Create/edit forms       | With validation            |
| `Button`    | Actions                 | Primary, secondary, danger |
| `Modal`     | Confirmations           | With backdrop              |
| `Tabs`      | Service tabs            | With content               |
| `Progress`  | Service progress        | With status                |

### Design Tokens

```typescript
// Service discovery-specific colors
const serviceDiscoveryColors = {
  service: "hsl(var(--service))",
  instance: "hsl(var(--instance))",
  registry: "hsl(var(--registry))",
  health: "hsl(var(--health))",
  discovery: "hsl(var(--discovery))",
};

// Service status colors
const serviceStatusColors = {
  registered: "bg-green-100 text-green-800",
  unregistered: "bg-gray-100 text-gray-800",
  unhealthy: "bg-red-100 text-red-800",
  unknown: "bg-yellow-100 text-yellow-800",
  registering: "bg-blue-100 text-blue-800",
  deregistering: "bg-orange-100 text-orange-800",
};

// Instance status colors
const instanceStatusColors = {
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
- **Service Discovery Themes**: Status-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  services: ["service-discovery", "services"] as const,
  service: (id: string) => ["service-discovery", "service", id] as const,
  instances: ["service-discovery", "instances"] as const,
  instance: (id: string) => ["service-discovery", "instance", id] as const,
  analytics: ["service-discovery", "analytics"] as const,
  alerts: ["service-discovery", "alerts"] as const,
};
```

### Cache Configuration

| Query Type | Stale Time | Cache Time | Invalidation            |
| ---------- | ---------- | ---------- | ----------------------- |
| Services   | 30 seconds | 2 minutes  | On create/update/delete |
| Service    | 15 seconds | 1 minute   | On update/delete        |
| Instances  | 15 seconds | 1 minute   | On create/update/delete |
| Instance   | 10 seconds | 30 seconds | On update/delete        |
| Analytics  | 1 minute   | 5 minutes  | On service change       |
| Alerts     | 15 seconds | 1 minute   | On alert update         |

### Invalidation Rules

```typescript
// After creating service
queryClient.invalidateQueries({ queryKey: ["service-discovery", "services"] });
queryClient.invalidateQueries({ queryKey: ["service-discovery", "analytics"] });

// After updating service
queryClient.invalidateQueries({
  queryKey: ["service-discovery", "service", id],
});
queryClient.invalidateQueries({ queryKey: ["service-discovery", "services"] });

// After registering service
queryClient.invalidateQueries({
  queryKey: ["service-discovery", "service", id],
});
queryClient.invalidateQueries({ queryKey: ["service-discovery", "alerts"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Service

1. User navigates to service discovery page
2. User clicks "Create Service" button
3. System opens service creation form
4. User enters service details
5. User sets service parameters
6. User configures service settings
7. User submits service

#### 2. Register Service Instance

1. User navigates to instances page
2. User clicks "Create Instance" button
3. System opens instance creation form
4. User selects service
5. User sets instance parameters
6. User configures instance settings
7. User registers instance

#### 3. Check Service Health

1. User views service details
2. User clicks "Check Health" button
3. System opens health check configuration
4. User sets health check parameters
5. User clicks "Run Health Check"
6. System executes health check
7. User views health check results

### UI States

| State          | Component                    | Message                         |
| -------------- | ---------------------------- | ------------------------------- |
| **Empty**      | `ServiceDiscoveryEmptyState` | "No services found"             |
| **Loading**    | `ServiceDiscoverySkeleton`   | Loading skeleton                |
| **Error**      | `ServiceDiscoveryErrorState` | "Failed to load services"       |
| **No Results** | `ServiceDiscoveryNoResults`  | "No services match your search" |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation
- **Progress**: Service registration progress, status updates

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
| `Ctrl/Cmd + S` | Create service     |
| `Ctrl/Cmd + I` | Create instance    |
| `Ctrl/Cmd + H` | Check health       |
| `Ctrl/Cmd + R` | Register service   |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

### ARIA Implementation

```typescript
// Service list
<table role="table" aria-label="Service list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Service Name</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Instances</th>
      <th role="columnheader" aria-sort="none">Last Updated</th>
    </tr>
  </thead>
</table>

// Service form
<form role="form" aria-label="Create Service">
  <input
    aria-describedby="name-error"
    aria-invalid="false"
    aria-label="Service Name"
  />
  <div id="name-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("ServiceDiscoveryServices", () => {
  it("renders list of services", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useServiceDiscoveryServiceCreate", () => {
  it("creates service successfully", () => {});
  it("handles creation errors", () => {});
  it("validates service data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Service Discovery API Integration", () => {
  it("creates service successfully", () => {});
  it("registers service successfully", () => {});
  it("checks health successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Service Discovery E2E", () => {
  it("complete service creation flow", () => {});
  it("complete instance creation flow", () => {});
  it("complete health check functionality", () => {});
  it("service discovery analytics functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Service Discovery Accessibility", () => {
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
const ServiceDiscoveryServiceForm = lazy(
  () => import("./components/ServiceDiscoveryServiceForm")
);
const ServiceDiscoveryAnalytics = lazy(
  () => import("./components/ServiceDiscoveryAnalytics")
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
mkdir -p apps/web/app/(dashboard)/service-discovery
mkdir -p apps/web/components/service-discovery
mkdir -p apps/web/hooks/service-discovery

# Create feature flag
echo 'flags.m102_service_discovery = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/service-discovery/ServiceDiscoveryServices.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useServiceDiscoveryServices } from "@/hooks/service-discovery/useServiceDiscoveryServices";

export function ServiceDiscoveryServices() {
  const { data, isLoading, error } = useServiceDiscoveryServices();

  if (isLoading) return <ServiceDiscoverySkeleton />;
  if (error) return <ServiceDiscoveryErrorState />;
  if (!data?.length) return <ServiceDiscoveryEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="serviceName"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/service-discovery/useServiceDiscoveryServices.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useServiceDiscoveryServices(filters?: ServiceDiscoveryFilters) {
  return useQuery({
    queryKey: ["service-discovery", "services", filters],
    queryFn: () => api.serviceDiscovery.services.list(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/service-discovery/page.tsx
import { ServiceDiscoveryHub } from "@/components/service-discovery/ServiceDiscoveryHub";
import { ServiceDiscoveryQuickActions } from "@/components/service-discovery/ServiceDiscoveryQuickActions";

export default function ServiceDiscoveryPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Service Discovery</h1>
        <ServiceDiscoveryQuickActions />
      </div>
      <ServiceDiscoveryHub />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/service-discovery/__tests__/ServiceDiscoveryServices.test.tsx
import { render, screen } from "@testing-library/react";
import { ServiceDiscoveryServices } from "@/components/service-discovery/ServiceDiscoveryServices";

describe("ServiceDiscoveryServices", () => {
  it("renders list of services", () => {
    render(<ServiceDiscoveryServices />);
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
  m102_service_discovery: false, // Default: disabled
};

// Usage in components
if (flags.m102_service_discovery) {
  return <ServiceDiscoveryServices />;
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

1. **Set feature flag**: `flags.m102_service_discovery = false`
2. **Invalidate cache**: `revalidateTag('service-discovery')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Service management functional
- [ ] Instance management working
- [ ] Service registration functional
- [ ] Health checking working
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

**Ready to implement Service Discovery UI! 🚀**
