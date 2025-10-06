# 🎯 M60: Compliance Reporting - UI Implementation Runbook

**Module ID**: M60  
**Module Name**: Compliance Reporting  
**Priority**: 🔥 HIGH  
**Phase**: Phase 12 - Operational Modules  
**Estimated Effort**: 3.5 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M27-SOX-CONTROLS

---

## 📋 Module Overview

Compliance Reporting provides **regulatory reporting**, **compliance dashboards**, **audit trails**, and **compliance analytics** for businesses requiring **regulatory compliance** and **audit readiness**.

### Business Value

**Key Benefits**:

- **Regulatory Reporting**: Automated compliance reports
- **Compliance Dashboards**: Real-time compliance status
- **Audit Trails**: Complete audit documentation
- **Compliance Analytics**: Compliance metrics and trends

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status     | Details                              |
| ------------- | ---------- | ------------------------------------ |
| **Database**  | 🔄 PARTIAL | SOX controls exist, needs compliance |
| **Services**  | 🔄 PARTIAL | SOX services exist                   |
| **API**       | 🔄 PARTIAL | SOX APIs exist                       |
| **Contracts** | 🔄 PARTIAL | SOX types exist, needs compliance    |

### API Endpoints

**Compliance Reporting** (Enhancement needed):

- 🔄 `/api/sox/controls` - Enhance with compliance fields
- ❌ `/api/compliance/reports` - Compliance reports
- ❌ `/api/compliance/dashboard` - Compliance dashboard
- ❌ `/api/compliance/audit-trail` - Audit trail
- ❌ `/api/compliance/analytics` - Compliance analytics

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                      | Page Component            | Purpose             |
| -------------------------- | ------------------------- | ------------------- |
| `/compliance`              | `ComplianceDashboardPage` | Compliance overview |
| `/compliance/reports`      | `ComplianceReportsPage`   | List reports        |
| `/compliance/reports/[id]` | `ComplianceReportPage`    | Report details      |
| `/compliance/audit-trail`  | `AuditTrailPage`          | Audit trail         |
| `/compliance/analytics`    | `ComplianceAnalyticsPage` | Analytics dashboard |

### Component Structure

```
apps/web/app/(dashboard)/compliance/
├── page.tsx                    # Dashboard page
├── reports/
│   ├── page.tsx                # Reports list page
│   └── [id]/
│       └── page.tsx            # Report detail page
├── audit-trail/
│   └── page.tsx                # Audit trail page
└── analytics/
    └── page.tsx                # Analytics page

apps/web/components/compliance/
├── ComplianceDashboard.tsx     # Dashboard
├── ComplianceReports.tsx       # Reports list
├── ComplianceReport.tsx        # Report viewer
├── AuditTrail.tsx              # Audit trail
└── ComplianceAnalytics.tsx     # Analytics dashboard

apps/web/hooks/compliance/
├── useComplianceDashboard.ts   # Dashboard hook
├── useComplianceReports.ts     # Reports hook
├── useAuditTrail.ts            # Audit trail hook
└── useComplianceAnalytics.ts   # Analytics hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages
- **Client Components**: Dashboard, report viewer, analytics charts
- **Feature Flag**: `flags.m60_compliance_reporting = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose              | Variant                  |
| ----------- | -------------------- | ------------------------ |
| `DataTable` | List reports         | With filters, pagination |
| `Card`      | Compliance metrics   | With actions             |
| `Chart`     | Compliance analytics | Line, bar, pie           |
| `Timeline`  | Audit trail          | With events              |
| `Badge`     | Status indicators    | With colors              |
| `Export`    | Report export        | PDF, Excel, CSV          |

### Design Tokens

```typescript
// Compliance specific colors
const complianceColors = {
  compliant: "hsl(var(--compliance-compliant))",
  nonCompliant: "hsl(var(--compliance-non-compliant))",
  pending: "hsl(var(--compliance-pending))",
  review: "hsl(var(--compliance-review))",
};

// Compliance status colors
const complianceStatusColors = {
  compliant: "bg-green-100 text-green-800",
  nonCompliant: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  review: "bg-blue-100 text-blue-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  complianceDashboard: ["compliance", "dashboard"] as const,
  complianceReports: ["compliance", "reports"] as const,
  complianceReport: (id: string) => ["compliance", "report", id] as const,
  auditTrail: ["compliance", "audit-trail"] as const,
  complianceAnalytics: ["compliance", "analytics"] as const,
};
```

### Cache Configuration

| Query Type           | Stale Time | Cache Time | Invalidation         |
| -------------------- | ---------- | ---------- | -------------------- |
| Compliance Dashboard | 5 minutes  | 15 minutes | On data change       |
| Compliance Reports   | 10 minutes | 30 minutes | On report generation |
| Compliance Report    | 15 minutes | 60 minutes | On report update     |
| Audit Trail          | 5 minutes  | 15 minutes | On audit event       |
| Compliance Analytics | 10 minutes | 30 minutes | On data change       |

---

## 🚀 Implementation Guide

### Step 1: Enhance M27-SOX-CONTROLS

```bash
# Enhance existing SOX controls module
# Add compliance reporting
# Add compliance dashboards
# Add audit trail
```

### Step 2: Create Components

```typescript
// apps/web/components/compliance/ComplianceDashboard.tsx
"use client";

import { Card } from "@/components/ui/card";
import { useComplianceDashboard } from "@/hooks/compliance/useComplianceDashboard";

export function ComplianceDashboard() {
  const { data, isLoading, error } = useComplianceDashboard();

  if (isLoading) return <DashboardSkeleton />;
  if (error) return <DashboardErrorState />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <h3>Compliance Rate</h3>
        <p className="text-3xl font-bold">{data.complianceRate}%</p>
      </Card>
      <Card>
        <h3>Open Issues</h3>
        <p className="text-3xl font-bold">{data.openIssues}</p>
      </Card>
      <Card>
        <h3>Pending Reviews</h3>
        <p className="text-3xl font-bold">{data.pendingReviews}</p>
      </Card>
    </div>
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/compliance/useComplianceDashboard.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useComplianceDashboard() {
  return useQuery({
    queryKey: ["compliance", "dashboard"],
    queryFn: () => api.compliance.getDashboard(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGenerateReport() {
  return useMutation({
    mutationFn: (data: ReportData) => api.compliance.generateReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["compliance", "reports"],
      });
    },
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/compliance/page.tsx
import { ComplianceDashboard } from "@/components/compliance/ComplianceDashboard";
import { ComplianceReports } from "@/components/compliance/ComplianceReports";

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Compliance Reporting</h1>
        <GenerateReportButton />
      </div>
      <ComplianceDashboard />
      <ComplianceReports />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/compliance/__tests__/ComplianceDashboard.test.tsx
import { render, screen } from "@testing-library/react";
import { ComplianceDashboard } from "@/components/compliance/ComplianceDashboard";

describe("ComplianceDashboard", () => {
  it("renders compliance dashboard", () => {
    render(<ComplianceDashboard />);
    expect(screen.getByText("Compliance Rate")).toBeInTheDocument();
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
| `Ctrl/Cmd + N` | Generate new report |
| `Ctrl/Cmd + F` | Focus search field  |
| `Escape`       | Close modal/dialog  |
| `Enter`        | Submit form         |

### ARIA Implementation

```typescript
// Compliance dashboard
<div role="region" aria-label="Compliance dashboard">
  <div role="group" aria-label="Compliance metrics">
    <h3>Compliance Rate</h3>
    <p aria-live="polite">{data.complianceRate}%</p>
  </div>
</div>

// Form
<form role="form" aria-label="Generate compliance report">
  <input aria-describedby="report-error" aria-invalid="false" />
  <div id="report-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("ComplianceDashboard", () => {
  it("renders compliance dashboard", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("displays compliance metrics", () => {});
});

// Hook tests
describe("useComplianceDashboard", () => {
  it("fetches compliance data", () => {});
  it("handles pagination", () => {});
  it("handles filters", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Compliance Reporting API Integration", () => {
  it("generates report successfully", () => {});
  it("updates compliance status successfully", () => {});
  it("tracks audit trails correctly", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Compliance Reporting E2E", () => {
  it("complete report generation flow", () => {});
  it("complete compliance review flow", () => {});
  it("audit trail tracking flow", () => {});
  it("search and filter functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Compliance Reporting Accessibility", () => {
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
const ReportGeneratePage = lazy(() => import("./generate/page"));

// Code splitting
const ComplianceChart = lazy(() => import("./components/ComplianceChart"));

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
  m60_compliance_reporting: false, // Default: disabled
};

// Usage in components
if (flags.m60_compliance_reporting) {
  return <ComplianceDashboard />;
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

1. **Set feature flag**: `flags.m60_compliance_reporting = false`
2. **Invalidate cache**: `revalidateTag('compliance')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Compliance reporting functional
- [ ] Audit trail tracking functional
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

**Ready to implement Compliance Reporting UI! 🚀**

if (isLoading) return <DashboardSkeleton />;
if (error) return <DashboardErrorState />;

return (
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
<Card>
<h3>Compliance Rate</h3>
<p className="text-3xl font-bold">{data.complianceRate}%</p>
</Card>
<Card>
<h3>Open Issues</h3>
<p className="text-3xl font-bold">{data.openIssues}</p>
</Card>
<Card>
<h3>Pending Reviews</h3>
<p className="text-3xl font-bold">{data.pendingReviews}</p>
</Card>
</div>
);
}

````

---

## ✅ Quality Gates

### Code Quality

| Gate              | Threshold | Enforcement |
| ----------------- | --------- | ----------- |
| TypeScript errors | 0         | CI blocks   |
| ESLint errors     | 0         | CI blocks   |
| Test coverage     | ≥90%      | CI blocks   |
| Bundle size       | ≤350KB    | CI blocks   |

---

## 🚀 Deployment

### Feature Flag

```typescript
const flags = {
  m60_compliance_reporting: false, // Default: disabled
};
````

---

## 📝 Definition of Done

### Functional Requirements

- [ ] Compliance dashboard working
- [ ] Report generation functional
- [ ] Audit trail working
- [ ] Analytics dashboard working
- [ ] Export functionality working
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

**Ready to enhance M27-SOX-CONTROLS with Compliance Reporting! 🚀**
