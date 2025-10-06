# 🎯 M79: Compliance Reporting - UI Implementation Runbook

**Module ID**: M79  
**Module Name**: Compliance Reporting  
**Priority**: 🔥 HIGH  
**Phase**: Phase 15 - User Experience  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M60-COMPLIANCE-REPORTING

---

## 📋 Module Overview

### Business Value

Compliance Reporting provides **comprehensive compliance monitoring and reporting** for businesses requiring organized compliance tracking and regulatory reporting.

**Key Benefits**:

- Automated compliance monitoring and alerts
- Regulatory reporting and documentation
- Compliance dashboard and analytics
- Integration with existing modules (SOX Controls, Audit Trail, etc.)

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
| **API**       | ✅ Complete | 16 endpoints available    |
| **Contracts** | ✅ Complete | Type-safe schemas defined |

### API Endpoints

**Compliance Reporting Operations** (16 endpoints):

- ✅ `/api/compliance/reports` - List compliance reports
- ✅ `/api/compliance/reports/[id]` - Get report details
- ✅ `/api/compliance/reports/create` - Create compliance report
- ✅ `/api/compliance/reports/[id]/update` - Update report
- ✅ `/api/compliance/reports/[id]/delete` - Delete report
- ✅ `/api/compliance/reports/[id]/generate` - Generate report
- ✅ `/api/compliance/reports/[id]/export` - Export report
- ✅ `/api/compliance/reports/[id]/approve` - Approve report
- ✅ `/api/compliance/reports/[id]/reject` - Reject report
- ✅ `/api/compliance/reports/[id]/submit` - Submit report
- ✅ `/api/compliance/templates` - Get report templates
- ✅ `/api/compliance/templates/[id]` - Get template details
- ✅ `/api/compliance/templates/create` - Create template
- ✅ `/api/compliance/templates/[id]/update` - Update template
- ✅ `/api/compliance/analytics` - Get compliance analytics
- ✅ `/api/compliance/alerts` - Get compliance alerts

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                           | Page Component                 | Purpose                 |
| ------------------------------- | ------------------------------ | ----------------------- |
| `/compliance/reports`           | `ComplianceReportsPage`        | List compliance reports |
| `/compliance/reports/[id]`      | `ComplianceReportDetailPage`   | View report details     |
| `/compliance/reports/create`    | `ComplianceReportCreatePage`   | Create report           |
| `/compliance/reports/[id]/edit` | `ComplianceReportEditPage`     | Edit report             |
| `/compliance/templates`         | `ComplianceTemplatesPage`      | List templates          |
| `/compliance/templates/[id]`    | `ComplianceTemplateDetailPage` | View template           |
| `/compliance/templates/create`  | `ComplianceTemplateCreatePage` | Create template         |
| `/compliance/analytics`         | `ComplianceAnalyticsPage`      | Compliance analytics    |
| `/compliance/alerts`            | `ComplianceAlertsPage`         | Compliance alerts       |

### Component Structure

```
apps/web/app/(dashboard)/compliance/
├── reports/
│   ├── page.tsx               # Reports list
│   ├── [id]/
│   │   ├── page.tsx           # Report details
│   │   └── edit/
│   │       └── page.tsx       # Edit report
│   └── create/
│       └── page.tsx           # Create report
├── templates/
│   ├── page.tsx               # Templates list
│   ├── [id]/
│   │   └── page.tsx           # Template details
│   └── create/
│       └── page.tsx           # Create template
├── analytics/
│   └── page.tsx               # Analytics page
└── alerts/
    └── page.tsx               # Alerts page

apps/web/components/compliance/
├── ComplianceReports.tsx      # Reports component
├── ComplianceReportCard.tsx   # Report card
├── ComplianceReportForm.tsx   # Report form
├── ComplianceTemplates.tsx    # Templates component
├── ComplianceTemplateCard.tsx # Template card
├── ComplianceTemplateForm.tsx # Template form
├── ComplianceAnalytics.tsx    # Analytics component
├── ComplianceAlerts.tsx      # Alerts component
├── ComplianceFilters.tsx     # Filter component
└── ComplianceActions.tsx     # Action buttons

apps/web/hooks/compliance/
├── useComplianceReports.ts    # Reports hook
├── useComplianceReportDetail.ts # Report detail hook
├── useComplianceReportCreate.ts # Report create hook
├── useComplianceReportUpdate.ts # Report update hook
├── useComplianceReportGenerate.ts # Report generate hook
├── useComplianceTemplates.ts # Templates hook
├── useComplianceTemplateCreate.ts # Template create hook
├── useComplianceTemplateUpdate.ts # Template update hook
└── useComplianceAnalytics.ts # Analytics hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m79_compliance_reporting = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose                 | Variant                    |
| ----------- | ----------------------- | -------------------------- |
| `DataTable` | List compliance reports | With filters, pagination   |
| `Card`      | Report details          | With actions               |
| `Form`      | Create/edit forms       | With validation            |
| `Button`    | Actions                 | Primary, secondary, danger |
| `Modal`     | Confirmations           | With backdrop              |
| `Timeline`  | Report timeline         | With status indicators     |
| `Chart`     | Compliance charts       | With metrics               |

### Design Tokens

```typescript
// Compliance-specific colors
const complianceColors = {
  draft: "hsl(var(--compliance-draft))",
  pending: "hsl(var(--compliance-pending))",
  approved: "hsl(var(--compliance-approved))",
  submitted: "hsl(var(--compliance-submitted))",
  rejected: "hsl(var(--compliance-rejected))",
  overdue: "hsl(var(--compliance-overdue))",
};

// Compliance status colors
const complianceStatusColors = {
  draft: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  submitted: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  overdue: "bg-red-100 text-red-800",
};

// Compliance type colors
const complianceTypeColors = {
  sox: "hsl(var(--compliance-sox))",
  gdpr: "hsl(var(--compliance-gdpr))",
  hipaa: "hsl(var(--compliance-hipaa))",
  pci: "hsl(var(--compliance-pci))",
  iso: "hsl(var(--compliance-iso))",
  fda: "hsl(var(--compliance-fda))",
  other: "hsl(var(--compliance-other))",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Compliance Themes**: Status-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  reports: ["compliance", "reports"] as const,
  report: (id: string) => ["compliance", "report", id] as const,
  templates: ["compliance", "templates"] as const,
  template: (id: string) => ["compliance", "template", id] as const,
  analytics: ["compliance", "analytics"] as const,
  alerts: ["compliance", "alerts"] as const,
};
```

### Cache Configuration

| Query Type | Stale Time | Cache Time | Invalidation            |
| ---------- | ---------- | ---------- | ----------------------- |
| Reports    | 5 minutes  | 10 minutes | On create/update/delete |
| Report     | 10 minutes | 30 minutes | On update/delete        |
| Templates  | 15 minutes | 45 minutes | On template change      |
| Analytics  | 15 minutes | 45 minutes | On compliance change    |
| Alerts     | 1 minute   | 5 minutes  | On alert update         |

### Invalidation Rules

```typescript
// After creating compliance report
queryClient.invalidateQueries({ queryKey: ["compliance", "reports"] });
queryClient.invalidateQueries({ queryKey: ["compliance", "analytics"] });

// After updating compliance report
queryClient.invalidateQueries({ queryKey: ["compliance", "report", id] });
queryClient.invalidateQueries({ queryKey: ["compliance", "reports"] });

// After generating compliance report
queryClient.invalidateQueries({ queryKey: ["compliance", "report", id] });
queryClient.invalidateQueries({ queryKey: ["compliance", "alerts"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Compliance Report

1. User navigates to compliance reports page
2. User clicks "Create Report" button
3. System opens report creation form
4. User selects compliance type and template
5. User fills report details
6. User adds compliance data
7. User submits report for approval

#### 2. Generate Compliance Report

1. User views report detail page
2. User clicks "Generate Report" button
3. System processes compliance data
4. System generates report content
5. User reviews generated report
6. User approves or modifies report
7. System finalizes report

#### 3. Submit Compliance Report

1. User views approved report
2. User clicks "Submit Report" button
3. System validates report completeness
4. System submits report to regulatory body
5. System updates report status
6. User receives confirmation

### UI States

| State          | Component              | Message                          |
| -------------- | ---------------------- | -------------------------------- |
| **Empty**      | `ComplianceEmptyState` | "No compliance reports found"    |
| **Loading**    | `ComplianceSkeleton`   | Loading skeleton                 |
| **Error**      | `ComplianceErrorState` | "Failed to load compliance data" |
| **No Results** | `ComplianceNoResults`  | "No reports match your search"   |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation
- **Chart**: Interactive charts, drill-down capabilities

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
| `Ctrl/Cmd + N` | Create new report  |
| `Ctrl/Cmd + F` | Focus search field |
| `Ctrl/Cmd + G` | Generate report    |
| `Ctrl/Cmd + S` | Submit report      |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

### ARIA Implementation

```typescript
// Compliance list
<table role="table" aria-label="Compliance reports list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Report ID</th>
      <th role="columnheader" aria-sort="none">Type</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Due Date</th>
    </tr>
  </thead>
</table>

// Compliance form
<form role="form" aria-label="Create Compliance Report">
  <input
    aria-describedby="type-error"
    aria-invalid="false"
    aria-label="Compliance Type"
  />
  <div id="type-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("ComplianceReports", () => {
  it("renders list of compliance reports", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useComplianceReportCreate", () => {
  it("creates compliance report successfully", () => {});
  it("handles creation errors", () => {});
  it("validates compliance data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Compliance API Integration", () => {
  it("creates compliance report successfully", () => {});
  it("generates compliance report successfully", () => {});
  it("submits compliance report successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Compliance Reporting E2E", () => {
  it("complete report creation flow", () => {});
  it("complete report generation flow", () => {});
  it("complete report submission flow", () => {});
  it("compliance analytics functionality", () => {});
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
const ComplianceReportForm = lazy(
  () => import("./components/ComplianceReportForm")
);
const ComplianceAnalytics = lazy(
  () => import("./components/ComplianceAnalytics")
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
mkdir -p apps/web/app/(dashboard)/compliance
mkdir -p apps/web/components/compliance
mkdir -p apps/web/hooks/compliance

# Create feature flag
echo 'flags.m79_compliance_reporting = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/compliance/ComplianceReports.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useComplianceReports } from "@/hooks/compliance/useComplianceReports";

export function ComplianceReports() {
  const { data, isLoading, error } = useComplianceReports();

  if (isLoading) return <ComplianceSkeleton />;
  if (error) return <ComplianceErrorState />;
  if (!data?.length) return <ComplianceEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="reportId"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/compliance/useComplianceReports.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useComplianceReports(filters?: ComplianceFilters) {
  return useQuery({
    queryKey: ["compliance", "reports", filters],
    queryFn: () => api.compliance.reports.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/compliance/reports/page.tsx
import { ComplianceReports } from "@/components/compliance/ComplianceReports";
import { ComplianceFilters } from "@/components/compliance/ComplianceFilters";

export default function ComplianceReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Compliance Reports</h1>
        <CreateComplianceReportButton />
      </div>
      <ComplianceFilters />
      <ComplianceReports />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/compliance/__tests__/ComplianceReports.test.tsx
import { render, screen } from "@testing-library/react";
import { ComplianceReports } from "@/components/compliance/ComplianceReports";

describe("ComplianceReports", () => {
  it("renders list of compliance reports", () => {
    render(<ComplianceReports />);
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
  m79_compliance_reporting: false, // Default: disabled
};

// Usage in components
if (flags.m79_compliance_reporting) {
  return <ComplianceReports />;
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

1. **Set feature flag**: `flags.m79_compliance_reporting = false`
2. **Invalidate cache**: `revalidateTag('compliance')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Compliance report creation functional
- [ ] Compliance report generation working
- [ ] Compliance report submission functional
- [ ] Compliance template management working
- [ ] Compliance analytics functional
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
