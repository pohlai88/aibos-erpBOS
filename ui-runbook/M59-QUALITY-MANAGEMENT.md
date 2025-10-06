# 🎯 M59: Quality Management - UI Implementation Runbook

**Module ID**: M59  
**Module Name**: Quality Management  
**Priority**: MEDIUM  
**Phase**: Phase 12 - Operational Modules  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: ❌ NO - CREATE NEW Module

---

## 📋 Module Overview

Quality Management provides **quality control**, **inspection management**, **non-conformance tracking**, and **corrective actions** for businesses requiring **quality assurance** and **compliance management**.

### Business Value

**Key Benefits**:

- **Quality Control**: Systematic quality inspections
- **Non-Conformance Tracking**: Track and resolve quality issues
- **Corrective Actions**: CAPA (Corrective and Preventive Actions)
- **Quality Analytics**: Quality metrics and trends

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status | Details                         |
| ------------- | ------ | ------------------------------- |
| **Database**  | ❌ NEW | Quality schema needed           |
| **Services**  | ❌ NEW | Quality services needed         |
| **API**       | ❌ NEW | Quality APIs needed             |
| **Contracts** | ❌ NEW | Quality type definitions needed |

### API Endpoints

**Quality Management** (New endpoints needed):

- ❌ `/api/quality/inspections` - List inspections
- ❌ `/api/quality/inspections/[id]` - Get inspection details
- ❌ `/api/quality/non-conformance` - Non-conformance records
- ❌ `/api/quality/capa` - Corrective actions
- ❌ `/api/quality/analytics` - Quality analytics

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                           | Page Component             | Purpose                 |
| ------------------------------- | -------------------------- | ----------------------- |
| `/quality/inspections`          | `InspectionsListPage`      | List inspections        |
| `/quality/inspections/[id]`     | `InspectionDetailPage`     | Inspection details      |
| `/quality/non-conformance`      | `NonConformanceListPage`   | Non-conformance records |
| `/quality/non-conformance/[id]` | `NonConformanceDetailPage` | NCR details             |
| `/quality/capa`                 | `CAPAListPage`             | Corrective actions      |
| `/quality/analytics`            | `QualityAnalyticsPage`     | Quality dashboard       |

### Component Structure

```
apps/web/app/(dashboard)/quality/
├── inspections/
│   ├── page.tsx                # Inspections list page
│   └── [id]/
│       └── page.tsx            # Inspection detail page
├── non-conformance/
│   ├── page.tsx                # NCR list page
│   └── [id]/
│       └── page.tsx            # NCR detail page
├── capa/
│   └── page.tsx                # CAPA list page
└── analytics/
    └── page.tsx                # Analytics page

apps/web/components/quality/
├── InspectionsList.tsx         # Inspections list
├── InspectionForm.tsx          # Inspection form
├── NonConformanceList.tsx      # NCR list
├── CAPAForm.tsx                # CAPA form
└── QualityAnalytics.tsx        # Analytics dashboard

apps/web/hooks/quality/
├── useInspections.ts           # Inspections hook
├── useNonConformance.ts        # NCR hook
├── useCAPA.ts                  # CAPA hook
└── useQualityAnalytics.ts      # Analytics hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages
- **Client Components**: Forms, inspection checklists, analytics charts
- **Feature Flag**: `flags.m59_quality_management = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose              | Variant                  |
| ----------- | -------------------- | ------------------------ |
| `DataTable` | List inspections     | With filters, pagination |
| `Card`      | Inspection details   | With actions             |
| `Form`      | Inspection forms     | With validation          |
| `Checklist` | Inspection checklist | With scoring             |
| `Chart`     | Quality analytics    | Line, bar, pie           |
| `Badge`     | Status indicators    | With colors              |

### Design Tokens

```typescript
// Quality specific colors
const qualityColors = {
  pass: "hsl(var(--quality-pass))",
  fail: "hsl(var(--quality-fail))",
  pending: "hsl(var(--quality-pending))",
  review: "hsl(var(--quality-review))",
};

// Inspection status colors
const inspectionStatusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  inProgress: "bg-yellow-100 text-yellow-800",
  passed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  inspections: ["quality", "inspections"] as const,
  inspectionDetail: (id: string) => ["quality", "inspection", id] as const,
  nonConformance: ["quality", "non-conformance"] as const,
  capa: ["quality", "capa"] as const,
  qualityAnalytics: ["quality", "analytics"] as const,
};
```

### Cache Configuration

| Query Type        | Stale Time | Cache Time | Invalidation            |
| ----------------- | ---------- | ---------- | ----------------------- |
| Inspections List  | 5 minutes  | 15 minutes | On create/update/delete |
| Inspection Detail | 10 minutes | 30 minutes | On update               |
| Non-Conformance   | 5 minutes  | 15 minutes | On NCR update           |
| CAPA              | 5 minutes  | 15 minutes | On CAPA update          |
| Quality Analytics | 10 minutes | 30 minutes | On data change          |

---

## 🚀 Implementation Guide

### Step 1: Create Database Schema

```sql
-- Quality tables
CREATE TABLE quality_inspections (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  inspection_number VARCHAR(50) NOT NULL,
  inspection_type VARCHAR(50) NOT NULL,
  inspector_id UUID NOT NULL,
  inspection_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  result VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE quality_non_conformance (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  ncr_number VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  assigned_to UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE quality_capa (
  id UUID PRIMARY KEY,
  ncr_id UUID REFERENCES quality_non_conformance(id),
  action_type VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Step 2: Create Components

```typescript
// apps/web/components/quality/InspectionsList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useInspections } from "@/hooks/quality/useInspections";

export function InspectionsList() {
  const { data, isLoading, error } = useInspections();

  if (isLoading) return <InspectionsSkeleton />;
  if (error) return <InspectionsErrorState />;
  if (!data?.length) return <InspectionsEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="inspection_number"
      filters={filters}
    />
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
  m59_quality_management: false, // Default: disabled
};
```

---

## 📝 Definition of Done

### Functional Requirements

- [ ] Inspection creation working
- [ ] NCR tracking functional
- [ ] CAPA management working
- [ ] Quality analytics working
- [ ] Checklist functionality working
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

**Ready to implement Quality Management! 🚀**
