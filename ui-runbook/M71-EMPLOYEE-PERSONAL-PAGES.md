# 🎯 M71: Employee Personal Pages - UI Implementation Runbook

**Module ID**: M71  
**Module Name**: Employee Personal Pages  
**Priority**: 🔥 HIGH  
**Phase**: Phase 15 - User Experience  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M66-EMPLOYEE-PERSONAL-PAGES

---

### Business Value

Employee Personal Page Configuration provides **personalized dashboard and profile management** for businesses requiring employee self-service capabilities.

**Key Benefits**:

- Personalized employee dashboards with role-based widgets
- Self-service profile management and document access
- Time tracking, leave requests, and expense submissions
- Performance reviews and goal tracking interface

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

**Employee Personal Page Operations** (12 endpoints):

- ✅ `/api/employee/profile` - Get employee profile
- ✅ `/api/employee/dashboard` - Get personalized dashboard
- ✅ `/api/employee/profile/update` - Update profile information
- ✅ `/api/employee/documents` - List personal documents
- ✅ `/api/employee/time-tracking` - Time tracking operations
- ✅ `/api/employee/leave-requests` - Leave request management
- ✅ `/api/employee/expenses` - Expense submission
- ✅ `/api/employee/goals` - Performance goals
- ✅ `/api/employee/reviews` - Performance reviews
- ✅ `/api/employee/notifications` - Personal notifications
- ✅ `/api/employee/preferences` - User preferences
- ✅ `/api/employee/security` - Security settings

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                 | Page Component          | Purpose                  |
| --------------------- | ----------------------- | ------------------------ |
| `/employee/profile`   | `EmployeeProfilePage`   | View and edit profile    |
| `/employee/dashboard` | `EmployeeDashboardPage` | Personalized dashboard   |
| `/employee/documents` | `EmployeeDocumentsPage` | Personal document access |
| `/employee/time`      | `EmployeeTimePage`      | Time tracking interface  |
| `/employee/leave`     | `EmployeeLeavePage`     | Leave request management |
| `/employee/expenses`  | `EmployeeExpensesPage`  | Expense submission       |
| `/employee/goals`     | `EmployeeGoalsPage`     | Performance goals        |
| `/employee/reviews`   | `EmployeeReviewsPage`   | Performance reviews      |
| `/employee/settings`  | `EmployeeSettingsPage`  | Personal settings        |

### Component Structure

```
apps/web/app/(dashboard)/employee/
├── profile/
│   ├── page.tsx               # Profile page
│   └── edit/
│       └── page.tsx           # Edit profile
├── dashboard/
│   └── page.tsx               # Dashboard page
├── documents/
│   └── page.tsx               # Documents page
├── time/
│   └── page.tsx               # Time tracking
├── leave/
│   └── page.tsx               # Leave requests
├── expenses/
│   └── page.tsx               # Expense submission
├── goals/
│   └── page.tsx               # Performance goals
├── reviews/
│   └── page.tsx               # Performance reviews
└── settings/
    └── page.tsx               # Personal settings

apps/web/components/employee/
├── EmployeeDashboard.tsx      # Dashboard component
├── EmployeeProfile.tsx        # Profile component
├── EmployeeTimeTracker.tsx    # Time tracking
├── EmployeeLeaveForm.tsx      # Leave request form
├── EmployeeExpenseForm.tsx    # Expense form
├── EmployeeGoalsWidget.tsx    # Goals widget
├── EmployeeReviewsWidget.tsx  # Reviews widget
├── EmployeeDocuments.tsx      # Documents list
└── EmployeeSettings.tsx       # Settings form

apps/web/hooks/employee/
├── useEmployeeProfile.ts      # Profile hook
├── useEmployeeDashboard.ts    # Dashboard hook
├── useEmployeeTime.ts         # Time tracking hook
├── useEmployeeLeave.ts        # Leave hook
├── useEmployeeExpenses.ts     # Expenses hook
├── useEmployeeGoals.ts        # Goals hook
└── useEmployeeReviews.ts      # Reviews hook
```

### Server/Client Boundaries

- **Server Components**: Dashboard pages, profile pages (data fetching)
- **Client Components**: Forms, interactive widgets, modals
- **Feature Flag**: `flags.m71_employee_personal = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose            | Variant                    |
| ----------- | ------------------ | -------------------------- |
| `Dashboard` | Employee dashboard | With widgets, customizable |
| `Card`      | Profile details    | With actions               |
| `Form`      | Profile/edit forms | With validation            |
| `Button`    | Actions            | Primary, secondary, danger |
| `Widget`    | Dashboard widgets  | Draggable, resizable       |
| `Timeline`  | Activity timeline  | With status indicators     |

### Design Tokens

```typescript
// Employee-specific colors
const employeeColors = {
  profile: "hsl(var(--profile))",
  dashboard: "hsl(var(--dashboard))",
  time: "hsl(var(--time))",
  leave: "hsl(var(--leave))",
  expenses: "hsl(var(--expenses))",
  goals: "hsl(var(--goals))",
  reviews: "hsl(var(--reviews))",
  documents: "hsl(var(--documents))",
};

// Status colors
const statusColors = {
  active: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  draft: "bg-gray-100 text-gray-800",
};

// Widget colors
const widgetColors = {
  timeTracking: "hsl(var(--time-widget))",
  leaveBalance: "hsl(var(--leave-widget))",
  expensePending: "hsl(var(--expense-widget))",
  goalProgress: "hsl(var(--goal-widget))",
  reviewStatus: "hsl(var(--review-widget))",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Personal Themes**: Employee customizable themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  profile: ["employee", "profile"] as const,
  dashboard: ["employee", "dashboard"] as const,
  documents: ["employee", "documents"] as const,
  timeTracking: ["employee", "time"] as const,
  leaveRequests: ["employee", "leave"] as const,
  expenses: ["employee", "expenses"] as const,
  goals: ["employee", "goals"] as const,
  reviews: ["employee", "reviews"] as const,
  notifications: ["employee", "notifications"] as const,
};
```

### Cache Configuration

| Query Type | Stale Time | Cache Time | Invalidation          |
| ---------- | ---------- | ---------- | --------------------- |
| Profile    | 10 minutes | 30 minutes | On profile update     |
| Dashboard  | 5 minutes  | 15 minutes | On any data change    |
| Documents  | 15 minutes | 45 minutes | On document upload    |
| Time       | 1 minute   | 5 minutes  | On time entry         |
| Leave      | 5 minutes  | 15 minutes | On leave request      |
| Expenses   | 5 minutes  | 15 minutes | On expense submission |
| Goals      | 10 minutes | 30 minutes | On goal update        |
| Reviews    | 15 minutes | 45 minutes | On review completion  |

### Invalidation Rules

```typescript
// After updating profile
queryClient.invalidateQueries({ queryKey: ["employee", "profile"] });
queryClient.invalidateQueries({ queryKey: ["employee", "dashboard"] });

// After time entry
queryClient.invalidateQueries({ queryKey: ["employee", "time"] });
queryClient.invalidateQueries({ queryKey: ["employee", "dashboard"] });

// After leave request
queryClient.invalidateQueries({ queryKey: ["employee", "leave"] });
queryClient.invalidateQueries({ queryKey: ["employee", "dashboard"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Employee Dashboard

1. Employee logs in and sees personalized dashboard
2. Dashboard shows role-based widgets (time tracking, leave balance, etc.)
3. Employee can customize widget layout
4. Employee clicks on widgets for detailed views

#### 2. Profile Management

1. Employee navigates to profile page
2. Employee views current profile information
3. Employee clicks "Edit" to modify profile
4. Employee updates information and saves
5. System updates profile and shows success message

#### 3. Time Tracking

1. Employee navigates to time tracking page
2. Employee sees current time entries
3. Employee clicks "Add Entry" to log time
4. Employee fills time entry form
5. Employee submits and sees updated timesheet

#### 4. Leave Request

1. Employee navigates to leave page
2. Employee sees leave balance and history
3. Employee clicks "Request Leave"
4. Employee fills leave request form
5. Employee submits request and sees confirmation

### UI States

| State          | Component            | Message               |
| -------------- | -------------------- | --------------------- |
| **Empty**      | `EmployeeEmptyState` | "No data available"   |
| **Loading**    | `EmployeeSkeleton`   | Loading skeleton      |
| **Error**      | `EmployeeErrorState` | "Failed to load data" |
| **No Results** | `EmployeeNoResults`  | "No records found"    |

### Interactions

- **Hover**: Widget elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Drag**: Widget reordering, visual feedback
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
| `Ctrl/Cmd + P` | Go to profile       |
| `Ctrl/Cmd + D` | Go to dashboard     |
| `Ctrl/Cmd + T` | Go to time tracking |
| `Ctrl/Cmd + L` | Go to leave         |
| `Ctrl/Cmd + E` | Go to expenses      |
| `Escape`       | Close modal/dialog  |
| `Enter`        | Submit form         |

### ARIA Implementation

```typescript
// Dashboard widgets
<div role="region" aria-label="Employee Dashboard">
  <div role="button" aria-label="Time Tracking Widget" tabIndex={0}>
    <h3>Time Tracking</h3>
    <p aria-live="polite">8 hours logged today</p>
  </div>
</div>

// Profile form
<form role="form" aria-label="Update Profile">
  <input
    aria-describedby="name-error"
    aria-invalid="false"
    aria-label="Full Name"
  />
  <div id="name-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("EmployeeDashboard", () => {
  it("renders personalized widgets", () => {});
  it("handles widget customization", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
});

// Hook tests
describe("useEmployeeProfile", () => {
  it("fetches employee profile", () => {});
  it("updates profile successfully", () => {});
  it("handles update errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Employee API Integration", () => {
  it("loads employee dashboard", () => {});
  it("updates profile successfully", () => {});
  it("submits time entry", () => {});
  it("creates leave request", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Employee Personal Pages E2E", () => {
  it("complete profile update flow", () => {});
  it("complete time tracking flow", () => {});
  it("complete leave request flow", () => {});
  it("complete expense submission flow", () => {});
  it("dashboard customization", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Employee Personal Pages Accessibility", () => {
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
- **Optimization**: Code splitting, lazy loading, widget lazy loading

### Loading Performance

- **TTFB**: ≤70ms (Time to First Byte)
- **TTI**: ≤200ms (Time to Interactive)
- **LCP**: ≤2.5s (Largest Contentful Paint)

### Optimization Strategies

```typescript
// Lazy loading
const EmployeeDashboard = lazy(() => import("./dashboard/page"));
const EmployeeProfile = lazy(() => import("./profile/page"));

// Widget lazy loading
const TimeTrackingWidget = lazy(
  () => import("./components/TimeTrackingWidget")
);
const LeaveBalanceWidget = lazy(
  () => import("./components/LeaveBalanceWidget")
);

// Virtual scrolling for large lists
import { FixedSizeList as List } from "react-window";
```

---

## 🚀 Implementation Guide

### Step 1: Setup

```bash
# Create directory structure
mkdir -p apps/web/app/(dashboard)/employee
mkdir -p apps/web/components/employee
mkdir -p apps/web/hooks/employee

# Create feature flag
echo 'flags.m71_employee_personal = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/employee/EmployeeDashboard.tsx
"use client";

import { Dashboard } from "@/components/ui/dashboard";
import { useEmployeeDashboard } from "@/hooks/employee/useEmployeeDashboard";

export function EmployeeDashboard() {
  const { data, isLoading, error } = useEmployeeDashboard();

  if (isLoading) return <EmployeeSkeleton />;
  if (error) return <EmployeeErrorState />;

  return (
    <Dashboard
      widgets={data.widgets}
      layout={data.layout}
      onLayoutChange={handleLayoutChange}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/employee/useEmployeeDashboard.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useEmployeeDashboard() {
  return useQuery({
    queryKey: ["employee", "dashboard"],
    queryFn: () => api.employee.dashboard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/employee/dashboard/page.tsx
import { EmployeeDashboard } from "@/components/employee/EmployeeDashboard";
import { EmployeeQuickActions } from "@/components/employee/EmployeeQuickActions";

export default function EmployeeDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <EmployeeQuickActions />
      </div>
      <EmployeeDashboard />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/employee/__tests__/EmployeeDashboard.test.tsx
import { render, screen } from "@testing-library/react";
import { EmployeeDashboard } from "@/components/employee/EmployeeDashboard";

describe("EmployeeDashboard", () => {
  it("renders personalized dashboard", () => {
    render(<EmployeeDashboard />);
    expect(
      screen.getByRole("region", { name: /employee dashboard/i })
    ).toBeInTheDocument();
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
  m71_employee_personal: false, // Default: disabled
};

// Usage in components
if (flags.m71_employee_personal) {
  return <EmployeeDashboard />;
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

1. **Set feature flag**: `flags.m71_employee_personal = false`
2. **Invalidate cache**: `revalidateTag('employee')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Dashboard customization functional
- [ ] Profile management complete
- [ ] Time tracking working
- [ ] Leave requests functional
- [ ] Expense submission working
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
