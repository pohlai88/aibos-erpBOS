# 🎯 M66: Employee Personal Page Configuration - UI Implementation Runbook

**Module ID**: M66  
**Module Name**: Employee Personal Page Configuration  
**Priority**: 🚨 CRITICAL  
**Phase**: Foundation  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

---

## 📋 Module Overview

Employee Personal Page Configuration provides **personalized workspace management** for businesses requiring **employee self-service**, **personal preferences**, and **workspace customization**.

### Business Value

**Key Benefits**:

- **User Adoption**: Personalized workspaces increase user engagement
- **Self-Service**: Employees can manage their own preferences
- **Productivity**: Customized dashboards improve efficiency
- **User Experience**: Tailored interface reduces learning curve

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status | Details                            |
| ------------- | ------ | ---------------------------------- |
| **Database**  | ❌ NO  | No employee personalization schema |
| **Services**  | ❌ NO  | No personalization services        |
| **API**       | ❌ NO  | No personalization APIs            |
| **Contracts** | ❌ NO  | No personalization types           |

### API Endpoints

**Employee Personal Page Configuration** (Implementation needed):

- ❌ `/api/employee/profile` - Get employee profile
- ❌ `/api/employee/preferences` - Get/set preferences
- ❌ `/api/employee/dashboard` - Get/set dashboard config
- ❌ `/api/employee/widgets` - Manage dashboard widgets
- ❌ `/api/employee/themes` - Get/set theme preferences
- ❌ `/api/employee/settings` - Get/set personal settings

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                   | Page Component            | Purpose                     |
| ----------------------- | ------------------------- | --------------------------- |
| `/employee/profile`     | `EmployeeProfilePage`     | Employee profile management |
| `/employee/preferences` | `EmployeePreferencesPage` | Personal preferences        |
| `/employee/dashboard`   | `EmployeeDashboardPage`   | Personal dashboard          |
| `/employee/widgets`     | `EmployeeWidgetsPage`     | Dashboard widgets           |
| `/employee/settings`    | `EmployeeSettingsPage`    | Personal settings           |

### Component Structure

```
apps/web/app/(dashboard)/employee/
├── profile/
│   └── page.tsx               # Employee profile page
├── preferences/
│   └── page.tsx               # Employee preferences page
├── dashboard/
│   └── page.tsx               # Employee dashboard page
├── widgets/
│   └── page.tsx               # Employee widgets page
└── settings/
    └── page.tsx               # Employee settings page

apps/web/components/employee/
├── EmployeeProfile.tsx         # Employee profile component
├── EmployeePreferences.tsx    # Employee preferences component
├── EmployeeDashboard.tsx      # Employee dashboard component
├── EmployeeWidgets.tsx        # Employee widgets component
├── EmployeeSettings.tsx       # Employee settings component
├── DashboardWidget.tsx         # Dashboard widget component
└── PreferenceToggle.tsx       # Preference toggle component

apps/web/hooks/employee/
├── useEmployeeProfile.ts       # Employee profile hook
├── useEmployeePreferences.ts  # Employee preferences hook
├── useEmployeeDashboard.ts    # Employee dashboard hook
├── useEmployeeWidgets.ts      # Employee widgets hook
└── useEmployeeSettings.ts     # Employee settings hook
```

### Server/Client Boundaries

- **Server Components**: Profile pages, settings pages (data fetching)
- **Client Components**: Dashboard widgets, preference toggles, drag-and-drop
- **Feature Flag**: `flags.m66_employee_personal = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose             | Variant                    |
| ----------- | ------------------- | -------------------------- |
| `DataTable` | List preferences    | With filters, pagination   |
| `Card`      | Profile details     | With actions               |
| `Form`      | Preference forms    | With validation            |
| `Button`    | Actions             | Primary, secondary, danger |
| `Modal`     | Confirmations       | With backdrop              |
| `Select`    | Preference picker   | With search                |
| `Badge`     | Status tags         | With colors                |
| `Tabs`      | Preference sections | With icons                 |
| `Switch`    | Toggle preferences  | With labels                |
| `DragDrop`  | Widget arrangement  | With handles               |

### Design Tokens

```typescript
// Employee-specific colors
const employeeColors = {
  profile: "hsl(var(--profile))",
  preferences: "hsl(var(--preferences))",
  dashboard: "hsl(var(--dashboard))",
  widgets: "hsl(var(--widgets))",
  settings: "hsl(var(--settings))",
};

// Preference status colors
const preferenceStatusColors = {
  enabled: "bg-green-100 text-green-800",
  disabled: "bg-gray-100 text-gray-800",
  custom: "bg-blue-100 text-blue-800",
  default: "bg-yellow-100 text-yellow-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  employee: {
    profile: ["employee", "profile"] as const,
    preferences: ["employee", "preferences"] as const,
    dashboard: ["employee", "dashboard"] as const,
    widgets: ["employee", "widgets"] as const,
    settings: ["employee", "settings"] as const,
  },
};
```

### Cache Configuration

| Query Type  | Stale Time | Cache Time | Invalidation         |
| ----------- | ---------- | ---------- | -------------------- |
| Profile     | 10 minutes | 30 minutes | On profile update    |
| Preferences | 5 minutes  | 15 minutes | On preference change |
| Dashboard   | 1 minute   | 5 minutes  | On dashboard change  |
| Widgets     | 5 minutes  | 15 minutes | On widget change     |
| Settings    | 5 minutes  | 15 minutes | On settings change   |

---

## 🎭 User Experience

### User Flows

#### 1. Configure Personal Profile

1. User navigates to `/employee/profile`
2. System loads current profile data
3. User updates personal information
4. User saves changes
5. System updates profile and shows success message

#### 2. Set Personal Preferences

1. User navigates to `/employee/preferences`
2. System shows preference categories
3. User toggles preferences on/off
4. User saves preferences
5. System applies preferences immediately

#### 3. Customize Dashboard

1. User navigates to `/employee/dashboard`
2. System shows current dashboard layout
3. User drags widgets to rearrange
4. User adds/removes widgets
5. User saves dashboard configuration

#### 4. Manage Widgets

1. User navigates to `/employee/widgets`
2. System shows available widgets
3. User enables/disables widgets
4. User configures widget settings
5. User saves widget configuration

### UI States

| State          | Component            | Message                      |
| -------------- | -------------------- | ---------------------------- |
| **Empty**      | `EmployeeEmptyState` | "No preferences configured"  |
| **Loading**    | `EmployeeSkeleton`   | Loading skeleton             |
| **Error**      | `EmployeeErrorState` | "Failed to load preferences" |
| **No Results** | `EmployeeNoResults`  | "No widgets available"       |

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
| `Ctrl/Cmd + P` | Open profile       |
| `Ctrl/Cmd + F` | Focus search field |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("EmployeeProfile", () => {
  it("renders employee profile", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles profile updates", () => {});
  it("handles form validation", () => {});
});

// Hook tests
describe("useEmployeeProfile", () => {
  it("fetches employee profile", () => {});
  it("handles profile updates", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Employee API Integration", () => {
  it("fetches profile successfully", () => {});
  it("updates preferences successfully", () => {});
  it("saves dashboard configuration successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Employee E2E", () => {
  it("complete profile configuration flow", () => {});
  it("complete preferences management flow", () => {});
  it("complete dashboard customization flow", () => {});
  it("complete widget management flow", () => {});
  it("keyboard navigation", () => {});
});
```

---

## ⚡ Performance

### Bundle Size

- **Target**: ≤300KB gzipped per route
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
mkdir -p apps/web/app/(dashboard)/employee
mkdir -p apps/web/components/employee
mkdir -p apps/web/hooks/employee

# Create feature flag
echo 'flags.m66_employee_personal = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/employee/EmployeeProfile.tsx
"use client";

import { Card } from "@/components/ui/card";
import { useEmployeeProfile } from "@/hooks/employee/useEmployeeProfile";

export function EmployeeProfile() {
  const { data, isLoading, error } = useEmployeeProfile();

  if (isLoading) return <EmployeeSkeleton />;
  if (error) return <EmployeeErrorState />;
  if (!data) return <EmployeeEmptyState />;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Profile</h2>
      <EmployeeProfileForm data={data} />
    </Card>
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/employee/useEmployeeProfile.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useEmployeeProfile() {
  return useQuery({
    queryKey: ["employee", "profile"],
    queryFn: () => api.employee.profile(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/employee/profile/page.tsx
import { EmployeeProfile } from "@/components/employee/EmployeeProfile";

export default function EmployeeProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Profile</h1>
      </div>
      <EmployeeProfile />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/employee/profile/__tests__/EmployeeProfile.test.tsx
import { render, screen } from "@testing-library/react";
import { EmployeeProfile } from "@/components/employee/EmployeeProfile";

describe("EmployeeProfile", () => {
  it("renders employee profile", () => {
    render(<EmployeeProfile />);
    expect(screen.getByRole("heading")).toBeInTheDocument();
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
  m66_employee_personal: false, // Default: disabled
};

// Usage in components
if (flags.m66_employee_personal) {
  return <EmployeeProfile />;
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

1. **Set feature flag**: `flags.m66_employee_personal = false`
2. **Invalidate cache**: `revalidateTag("employee")`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All profile operations working
- [ ] Preference management functional
- [ ] Dashboard customization working
- [ ] Widget management working
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

**Ready to implement Employee Personal Page Configuration UI! 🚀**
