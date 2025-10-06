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
```

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
