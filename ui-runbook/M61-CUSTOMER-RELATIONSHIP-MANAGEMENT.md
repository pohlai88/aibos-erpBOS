# 🎯 M61: Customer Relationship Management (CRM) - UI Implementation Runbook

**Module ID**: M61  
**Module Name**: Customer Relationship Management (CRM)  
**Priority**: 🔥 HIGH  
**Phase**: Phase 13 - Extended Modules  
**Estimated Effort**: 4 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M38-CRM-INTEGRATION

---

## 📋 Module Overview

Customer Relationship Management provides **lead management**, **opportunity tracking**, **contact management**, and **sales pipeline** for businesses requiring **customer engagement** and **sales automation**.

### Business Value

**Key Benefits**:

- **Lead Management**: Track and nurture leads
- **Opportunity Tracking**: Sales pipeline management
- **Contact Management**: Centralized customer database
- **Sales Analytics**: Sales performance insights

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status     | Details                          |
| ------------- | ---------- | -------------------------------- |
| **Database**  | 🔄 PARTIAL | Customer table exists, needs CRM |
| **Services**  | 🔄 PARTIAL | Customer services exist          |
| **API**       | 🔄 PARTIAL | Customer APIs exist              |
| **Contracts** | 🔄 PARTIAL | Customer types exist, needs CRM  |

### API Endpoints

**CRM** (Enhancement needed):

- 🔄 `/api/customers` - Enhance with CRM fields
- ❌ `/api/crm/leads` - Lead management
- ❌ `/api/crm/opportunities` - Opportunity tracking
- ❌ `/api/crm/contacts` - Contact management
- ❌ `/api/crm/pipeline` - Sales pipeline
- ❌ `/api/crm/analytics` - Sales analytics

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                     | Page Component          | Purpose                |
| ------------------------- | ----------------------- | ---------------------- |
| `/crm/leads`              | `LeadsListPage`         | List leads             |
| `/crm/leads/[id]`         | `LeadDetailPage`        | Lead details           |
| `/crm/opportunities`      | `OpportunitiesPage`     | Opportunities pipeline |
| `/crm/opportunities/[id]` | `OpportunityDetailPage` | Opportunity details    |
| `/crm/contacts`           | `ContactsListPage`      | List contacts          |
| `/crm/pipeline`           | `PipelinePage`          | Sales pipeline view    |
| `/crm/analytics`          | `CRMAnalyticsPage`      | Sales analytics        |

### Component Structure

```
apps/web/app/(dashboard)/crm/
├── leads/
│   ├── page.tsx                # Leads list page
│   └── [id]/
│       └── page.tsx            # Lead detail page
├── opportunities/
│   ├── page.tsx                # Opportunities page
│   └── [id]/
│       └── page.tsx            # Opportunity detail page
├── contacts/
│   └── page.tsx                # Contacts list page
├── pipeline/
│   └── page.tsx                # Pipeline page
└── analytics/
    └── page.tsx                # Analytics page

apps/web/components/crm/
├── LeadsList.tsx               # Leads list
├── LeadForm.tsx                # Lead form
├── OpportunitiesPipeline.tsx   # Pipeline kanban
├── ContactsList.tsx            # Contacts list
└── CRMAnalytics.tsx            # Analytics dashboard

apps/web/hooks/crm/
├── useLeads.ts                 # Leads hook
├── useOpportunities.ts         # Opportunities hook
├── useContacts.ts              # Contacts hook
└── useCRMAnalytics.ts          # Analytics hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages
- **Client Components**: Forms, pipeline kanban, analytics charts
- **Feature Flag**: `flags.m61_crm = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose              | Variant                  |
| ----------- | -------------------- | ------------------------ |
| `DataTable` | List leads/contacts  | With filters, pagination |
| `Card`      | Lead/contact details | With actions             |
| `Kanban`    | Sales pipeline       | Drag-and-drop            |
| `Form`      | Lead/contact forms   | With validation          |
| `Chart`     | Sales analytics      | Line, bar, funnel        |
| `Badge`     | Status indicators    | With colors              |

### Design Tokens

```typescript
// CRM specific colors
const crmColors = {
  lead: "hsl(var(--crm-lead))",
  qualified: "hsl(var(--crm-qualified))",
  opportunity: "hsl(var(--crm-opportunity))",
  won: "hsl(var(--crm-won))",
  lost: "hsl(var(--crm-lost))",
};

// Lead status colors
const leadStatusColors = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-green-100 text-green-800",
  unqualified: "bg-gray-100 text-gray-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  leads: ["crm", "leads"] as const,
  leadDetail: (id: string) => ["crm", "lead", id] as const,
  opportunities: ["crm", "opportunities"] as const,
  contacts: ["crm", "contacts"] as const,
  pipeline: ["crm", "pipeline"] as const,
  crmAnalytics: ["crm", "analytics"] as const,
};
```

### Cache Configuration

| Query Type    | Stale Time | Cache Time | Invalidation            |
| ------------- | ---------- | ---------- | ----------------------- |
| Leads List    | 5 minutes  | 15 minutes | On create/update/delete |
| Lead Detail   | 10 minutes | 30 minutes | On update               |
| Opportunities | 5 minutes  | 15 minutes | On opportunity update   |
| Contacts      | 10 minutes | 30 minutes | On contact update       |
| Pipeline      | 2 minutes  | 10 minutes | On stage change         |
| CRM Analytics | 10 minutes | 30 minutes | On data change          |

---

## 🚀 Implementation Guide

### Step 1: Enhance M38-CRM-INTEGRATION

```bash
# Enhance existing CRM integration module
# Add lead management
# Add opportunity tracking
# Add sales pipeline
```

### Step 2: Create Components

```typescript
// apps/web/components/crm/OpportunitiesPipeline.tsx
"use client";

import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useOpportunities } from "@/hooks/crm/useOpportunities";

export function OpportunitiesPipeline() {
  const { data, isLoading, error, updateStage } = useOpportunities();

  if (isLoading) return <PipelineSkeleton />;
  if (error) return <PipelineErrorState />;

  return (
    <DragDropContext onDragEnd={updateStage}>
      {stages.map((stage) => (
        <Droppable key={stage.id} droppableId={stage.id}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {data
                .filter((opp) => opp.stage === stage.id)
                .map((opp, index) => (
                  <Draggable key={opp.id} draggableId={opp.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <OpportunityCard opportunity={opp} />
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      ))}
    </DragDropContext>
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/crm/useOpportunities.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useOpportunities(opportunityId?: string) {
  return useQuery({
    queryKey: ["crm", "opportunities", opportunityId],
    queryFn: () => api.crm.getOpportunities(opportunityId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateLead() {
  return useMutation({
    mutationFn: (data: LeadData) => api.crm.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["crm", "leads"],
      });
    },
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/crm/page.tsx
import { OpportunitiesPipeline } from "@/components/crm/OpportunitiesPipeline";
import { LeadsList } from "@/components/crm/LeadsList";

export default function CRMPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Customer Relationship Management</h1>
        <CreateLeadButton />
      </div>
      <OpportunitiesPipeline />
      <LeadsList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/crm/__tests__/OpportunitiesPipeline.test.tsx
import { render, screen } from "@testing-library/react";
import { OpportunitiesPipeline } from "@/components/crm/OpportunitiesPipeline";

describe("OpportunitiesPipeline", () => {
  it("renders opportunities pipeline", () => {
    render(<OpportunitiesPipeline />);
    expect(screen.getByRole("region")).toBeInTheDocument();
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
| `Ctrl/Cmd + N` | Create new lead    |
| `Ctrl/Cmd + F` | Focus search field |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

### ARIA Implementation

```typescript
// CRM pipeline
<div role="region" aria-label="Sales pipeline">
  <div role="group" aria-label="Pipeline stages">
    <h3>Prospecting</h3>
    <div role="list" aria-label="Opportunities in prospecting stage">
      <div role="listitem">Opportunity Card</div>
    </div>
  </div>
</div>

// Form
<form role="form" aria-label="Create lead">
  <input aria-describedby="lead-error" aria-invalid="false" />
  <div id="lead-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("OpportunitiesPipeline", () => {
  it("renders opportunities pipeline", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles drag and drop", () => {});
});

// Hook tests
describe("useOpportunities", () => {
  it("fetches opportunities data", () => {});
  it("handles pagination", () => {});
  it("handles filters", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("CRM API Integration", () => {
  it("creates lead successfully", () => {});
  it("updates opportunity successfully", () => {});
  it("tracks pipeline stages correctly", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("CRM E2E", () => {
  it("complete lead creation flow", () => {});
  it("complete opportunity update flow", () => {});
  it("pipeline stage movement flow", () => {});
  it("search and filter functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("CRM Accessibility", () => {
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
const LeadCreatePage = lazy(() => import("./create/page"));

// Code splitting
const OpportunityCard = lazy(() => import("./components/OpportunityCard"));

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
  m61_customer_relationship_management: false, // Default: disabled
};

// Usage in components
if (flags.m61_customer_relationship_management) {
  return <OpportunitiesPipeline />;
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

1. **Set feature flag**: `flags.m61_customer_relationship_management = false`
2. **Invalidate cache**: `revalidateTag('crm')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Lead management functional
- [ ] Opportunity tracking functional
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

**Ready to implement Customer Relationship Management UI! 🚀**

if (isLoading) return <PipelineSkeleton />;
if (error) return <PipelineErrorState />;

return (
<DragDropContext onDragEnd={updateStage}>
{stages.map((stage) => (
<Droppable key={stage.id} droppableId={stage.id}>
{(provided) => (
<div ref={provided.innerRef} {...provided.droppableProps}>
{data
.filter((opp) => opp.stage === stage.id)
.map((opp, index) => (
<Draggable key={opp.id} draggableId={opp.id} index={index}>
{(provided) => (
<div
ref={provided.innerRef}
{...provided.draggableProps}
{...provided.dragHandleProps} >
<OpportunityCard opportunity={opp} />
</div>
)}
</Draggable>
))}
{provided.placeholder}
</div>
)}
</Droppable>
))}
</DragDropContext>
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
| Bundle size       | ≤400KB    | CI blocks   |

---

## 🚀 Deployment

### Feature Flag

```typescript
const flags = {
  m61_crm: false, // Default: disabled
};
````

---

## 📝 Definition of Done

### Functional Requirements

- [ ] Lead management working
- [ ] Opportunity tracking functional
- [ ] Contact management working
- [ ] Sales pipeline working
- [ ] Analytics dashboard working
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

**Ready to enhance M38-CRM-INTEGRATION with full CRM capabilities! 🚀**
