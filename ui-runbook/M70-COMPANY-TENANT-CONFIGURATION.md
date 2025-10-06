# 🎯 M70: Company/Tenant Configuration - UI Implementation Runbook

**Module ID**: M70  
**Module Name**: Company/Tenant Configuration  
**Priority**: 🔥 CRITICAL  
**Phase**: Phase 15 - System Administration  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M80-MULTI-TENANT-ARCHITECTURE

---

## 📋 Module Overview

Company/Tenant Configuration provides **tenant settings**, **company profile**, **branding configuration**, and **system preferences** for businesses requiring **multi-tenant customization** and **company-specific settings**.

### Business Value

**Key Benefits**:

- **Tenant Settings**: Complete tenant configuration
- **Company Profile**: Company information management
- **Branding Configuration**: Custom branding and themes
- **System Preferences**: Tenant-specific preferences

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status     | Details                                  |
| ------------- | ---------- | ---------------------------------------- |
| **Database**  | 🔄 PARTIAL | Tenant table exists, needs configuration |
| **Services**  | 🔄 PARTIAL | Tenant services exist                    |
| **API**       | 🔄 PARTIAL | Tenant APIs exist                        |
| **Contracts** | 🔄 PARTIAL | Tenant types exist, needs configuration  |

### API Endpoints

**Company/Tenant Configuration Operations** (8 endpoints):

- 🔄 `/api/tenant/settings` - Get tenant settings (enhance existing)
- 🔄 `/api/tenant/settings/update` - Update tenant settings (enhance existing)
- 🔄 `/api/tenant/profile` - Get company profile (enhance existing)
- 🔄 `/api/tenant/profile/update` - Update company profile (enhance existing)
- ❌ `/api/tenant/branding` - Get branding settings
- ❌ `/api/tenant/branding/update` - Update branding settings
- ❌ `/api/tenant/preferences` - Get system preferences
- ❌ `/api/tenant/preferences/update` - Update system preferences

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                 | Page Component       | Purpose                |
| --------------------- | -------------------- | ---------------------- |
| `/tenant/settings`    | `TenantSettingsPage` | Tenant settings        |
| `/tenant/profile`     | `CompanyProfilePage` | Company profile        |
| `/tenant/branding`    | `BrandingPage`       | Branding configuration |
| `/tenant/preferences` | `PreferencesPage`    | System preferences     |

### Component Structure

```
apps/web/app/(dashboard)/tenant/
├── settings/
│   └── page.tsx               # Tenant settings
├── profile/
│   └── page.tsx               # Company profile
├── branding/
│   └── page.tsx               # Branding configuration
└── preferences/
    └── page.tsx               # System preferences

apps/web/components/tenant/
├── TenantSettings.tsx         # Tenant settings
├── CompanyProfile.tsx         # Company profile
├── BrandingConfiguration.tsx  # Branding configuration
├── SystemPreferences.tsx     # System preferences
├── ThemeSelector.tsx         # Theme selector
└── LogoUpload.tsx            # Logo upload

apps/web/hooks/tenant/
├── useTenantSettings.ts       # Tenant settings hook
├── useCompanyProfile.ts       # Company profile hook
├── useBrandingConfiguration.ts # Branding hook
└── useSystemPreferences.ts    # Preferences hook
```

### Server/Client Boundaries

- **Server Components**: Settings pages, profile pages (data fetching)
- **Client Components**: Forms, interactive elements, file uploads
- **Feature Flag**: `flags.m70_company_tenant_configuration = false`

---

## 🎨 Design System

### Components Used

| Component    | Purpose             | Variant                    |
| ------------ | ------------------- | -------------------------- |
| `Form`       | Configuration forms | With validation            |
| `Card`       | Settings sections   | With actions               |
| `Button`     | Actions             | Primary, secondary, danger |
| `Input`      | Form inputs         | With validation            |
| `FileUpload` | Logo upload         | With preview               |

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
  tenantSettings: ["tenant", "settings"] as const,
  companyProfile: ["tenant", "profile"] as const,
  brandingConfiguration: ["tenant", "branding"] as const,
  systemPreferences: ["tenant", "preferences"] as const,
};
```

### Cache Configuration

| Query Type         | Stale Time | Cache Time | Invalidation          |
| ------------------ | ---------- | ---------- | --------------------- |
| Tenant Settings    | 10 minutes | 30 minutes | On settings change    |
| Company Profile    | 10 minutes | 30 minutes | On profile update     |
| Branding Config    | 5 minutes  | 15 minutes | On branding change    |
| System Preferences | 5 minutes  | 15 minutes | On preferences change |

### Invalidation Rules

```typescript
// After updating tenant settings
queryClient.invalidateQueries({ queryKey: ["tenant", "settings"] });

// After updating company profile
queryClient.invalidateQueries({ queryKey: ["tenant", "profile"] });

// After updating branding
queryClient.invalidateQueries({ queryKey: ["tenant", "branding"] });

// After updating preferences
queryClient.invalidateQueries({ queryKey: ["tenant", "preferences"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Configure Tenant Settings

1. User navigates to `/tenant/settings`
2. System loads current tenant settings
3. User modifies settings as needed
4. User saves changes
5. System updates tenant configuration

#### 2. Update Company Profile

1. User navigates to `/tenant/profile`
2. System loads company profile information
3. User updates company details
4. User uploads new logo if needed
5. User saves changes

#### 3. Customize Branding

1. User navigates to `/tenant/branding`
2. System loads current branding settings
3. User selects theme colors and fonts
4. User uploads custom logo
5. User previews changes
6. User applies branding

### UI States

| State       | Component                   | Message                        |
| ----------- | --------------------------- | ------------------------------ |
| **Empty**   | `ConfigurationEmptyState`   | "No configuration found"       |
| **Loading** | `ConfigurationSkeleton`     | Loading skeleton               |
| **Error**   | `ConfigurationErrorState`   | "Failed to load configuration" |
| **Success** | `ConfigurationSuccessState` | "Configuration saved"          |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation

---

## 🚀 Implementation Guide

### Step 1: Enhance M80-MULTI-TENANT-ARCHITECTURE

```bash
# Enhance existing multi-tenant architecture
# Add company configuration
# Add branding settings
# Add system preferences
```

### Step 2: Create Components

```typescript
// apps/web/components/tenant/TenantSettings.tsx
"use client";

import { Card } from "@/components/ui/card";
import { useTenantSettings } from "@/hooks/tenant/useTenantSettings";

export function TenantSettings() {
  const { data, isLoading, error } = useTenantSettings();

  if (isLoading) return <ConfigurationSkeleton />;
  if (error) return <ConfigurationErrorState />;

  return (
    <div className="space-y-6">
      <Card>
        <h3>General Settings</h3>
        <TenantSettingsForm data={data} />
      </Card>
      <Card>
        <h3>Security Settings</h3>
        <SecuritySettingsForm data={data} />
      </Card>
    </div>
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/tenant/useTenantSettings.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useTenantSettings() {
  return useQuery({
    queryKey: ["tenant", "settings"],
    queryFn: () => api.tenant.getSettings(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateTenantSettings() {
  return useMutation({
    mutationFn: (data: TenantSettingsData) => api.tenant.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tenant", "settings"],
      });
    },
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/tenant/settings/page.tsx
import { TenantSettings } from "@/components/tenant/TenantSettings";

export default function TenantSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Tenant Settings</h1>
        <SaveSettingsButton />
      </div>
      <TenantSettings />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/tenant/settings/__tests__/TenantSettings.test.tsx
import { render, screen } from "@testing-library/react";
import { TenantSettings } from "@/components/tenant/TenantSettings";

describe("TenantSettings", () => {
  it("renders tenant settings", () => {
    render(<TenantSettings />);
    expect(screen.getByText("General Settings")).toBeInTheDocument();
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

| Shortcut       | Action             |
| -------------- | ------------------ |
| `Ctrl/Cmd + S` | Save settings      |
| `Ctrl/Cmd + R` | Reset to defaults  |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

### ARIA Implementation

```typescript
// Tenant settings form
<form role="form" aria-label="Tenant settings">
  <fieldset role="group" aria-label="General settings">
    <legend>General Settings</legend>
    <input aria-describedby="tenant-name-error" aria-invalid="false" />
    <div id="tenant-name-error" role="alert" aria-live="polite" />
  </fieldset>
</form>

// File upload
<div role="region" aria-label="Logo upload">
  <input type="file" aria-describedby="logo-help" />
  <div id="logo-help">Upload your company logo</div>
</div>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("TenantSettings", () => {
  it("renders tenant settings", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("saves settings successfully", () => {});
});

// Hook tests
describe("useTenantSettings", () => {
  it("fetches tenant settings", () => {});
  it("updates settings successfully", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Company/Tenant Configuration API Integration", () => {
  it("updates tenant settings successfully", () => {});
  it("updates company profile successfully", () => {});
  it("updates branding configuration successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Company/Tenant Configuration E2E", () => {
  it("complete settings update flow", () => {});
  it("complete profile update flow", () => {});
  it("complete branding update flow", () => {});
  it("form validation functionality", () => {});
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
const BrandingPage = lazy(() => import("./branding/page"));

// Code splitting
const ThemeSelector = lazy(() => import("./components/ThemeSelector"));

// Image optimization
import { Image } from "next/image";
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
  m70_company_tenant_configuration: false, // Default: disabled
};

// Usage in components
if (flags.m70_company_tenant_configuration) {
  return <TenantSettings />;
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

1. **Set feature flag**: `flags.m70_company_tenant_configuration = false`
2. **Invalidate cache**: `revalidateTag('tenant')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All configuration forms working
- [ ] Tenant settings functional
- [ ] Company profile functional
- [ ] Branding configuration functional
- [ ] System preferences functional
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
