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
```

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
