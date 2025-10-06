# 🎯 M73: Workflow Automation - UI Implementation Runbook

**Module ID**: M73  
**Module Name**: Workflow Automation  
**Priority**: 🔥 HIGH  
**Phase**: Phase 15 - User Experience  
**Estimated Effort**: 5 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M55-WORKFLOW-AUTOMATION

---

## 📋 Module Overview

### Business Value

Workflow Automation provides **automated business process management** for businesses requiring streamlined operations and reduced manual work.

**Key Benefits**:

- Automated approval workflows for various business processes
- Custom workflow builder with drag-and-drop interface
- Integration with existing modules (AP, AR, Inventory, etc.)
- Real-time workflow monitoring and analytics

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

**Workflow Automation Operations** (15 endpoints):

- ✅ `/api/workflows` - List workflows
- ✅ `/api/workflows/[id]` - Get workflow details
- ✅ `/api/workflows/create` - Create new workflow
- ✅ `/api/workflows/[id]/update` - Update workflow
- ✅ `/api/workflows/[id]/delete` - Delete workflow
- ✅ `/api/workflows/[id]/execute` - Execute workflow
- ✅ `/api/workflows/[id]/pause` - Pause workflow
- ✅ `/api/workflows/[id]/resume` - Resume workflow
- ✅ `/api/workflows/[id]/instances` - Get workflow instances
- ✅ `/api/workflows/[id]/instances/[instanceId]` - Get instance details
- ✅ `/api/workflows/[id]/instances/[instanceId]/approve` - Approve step
- ✅ `/api/workflows/[id]/instances/[instanceId]/reject` - Reject step
- ✅ `/api/workflows/[id]/instances/[instanceId]/delegate` - Delegate step
- ✅ `/api/workflows/templates` - Get workflow templates
- ✅ `/api/workflows/analytics` - Get workflow analytics

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                                    | Page Component          | Purpose                   |
| ---------------------------------------- | ----------------------- | ------------------------- |
| `/workflows`                             | `WorkflowListPage`      | List and manage workflows |
| `/workflows/[id]`                        | `WorkflowDetailPage`    | View workflow details     |
| `/workflows/create`                      | `WorkflowCreatePage`    | Create new workflow       |
| `/workflows/[id]/edit`                   | `WorkflowEditPage`      | Edit workflow design      |
| `/workflows/[id]/instances`              | `WorkflowInstancesPage` | View workflow instances   |
| `/workflows/[id]/instances/[instanceId]` | `WorkflowInstancePage`  | View instance details     |
| `/workflows/analytics`                   | `WorkflowAnalyticsPage` | Workflow analytics        |
| `/workflows/templates`                   | `WorkflowTemplatesPage` | Workflow templates        |

### Component Structure

```
apps/web/app/(dashboard)/workflows/
├── page.tsx                    # List page
├── [id]/
│   ├── page.tsx               # Detail page
│   ├── edit/
│   │   └── page.tsx           # Edit page
│   └── instances/
│       ├── page.tsx           # Instances list
│       └── [instanceId]/
│           └── page.tsx       # Instance details
├── create/
│   └── page.tsx               # Create page
├── analytics/
│   └── page.tsx               # Analytics page
└── templates/
    └── page.tsx               # Templates page

apps/web/components/workflows/
├── WorkflowList.tsx           # List component
├── WorkflowCard.tsx           # Card component
├── WorkflowBuilder.tsx        # Workflow builder
├── WorkflowCanvas.tsx         # Canvas component
├── WorkflowNode.tsx           # Node component
├── WorkflowConnector.tsx      # Connector component
├── WorkflowInstances.tsx      # Instances component
├── WorkflowInstanceCard.tsx   # Instance card
├── WorkflowAnalytics.tsx      # Analytics component
├── WorkflowTemplates.tsx      # Templates component
└── WorkflowActions.tsx        # Action buttons

apps/web/hooks/workflows/
├── useWorkflowList.ts         # List hook
├── useWorkflowDetail.ts       # Detail hook
├── useWorkflowCreate.ts       # Create hook
├── useWorkflowUpdate.ts       # Update hook
├── useWorkflowExecute.ts      # Execute hook
├── useWorkflowInstances.ts    # Instances hook
└── useWorkflowAnalytics.ts    # Analytics hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Workflow builder, interactive elements, modals
- **Feature Flag**: `flags.m73_workflow_automation = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose              | Variant                    |
| ----------- | -------------------- | -------------------------- |
| `DataTable` | List workflows       | With filters, pagination   |
| `Card`      | Workflow details     | With actions               |
| `Canvas`    | Workflow builder     | Drag-and-drop, zoomable    |
| `Form`      | Create/edit workflow | With validation            |
| `Button`    | Actions              | Primary, secondary, danger |
| `Modal`     | Confirmations        | With backdrop              |
| `Timeline`  | Instance timeline    | With status indicators     |

### Design Tokens

```typescript
// Workflow-specific colors
const workflowColors = {
  draft: "hsl(var(--workflow-draft))",
  active: "hsl(var(--workflow-active))",
  paused: "hsl(var(--workflow-paused))",
  completed: "hsl(var(--workflow-completed))",
  failed: "hsl(var(--workflow-failed))",
  cancelled: "hsl(var(--workflow-cancelled))",
};

// Node colors
const nodeColors = {
  start: "hsl(var(--node-start))",
  end: "hsl(var(--node-end))",
  task: "hsl(var(--node-task))",
  decision: "hsl(var(--node-decision))",
  approval: "hsl(var(--node-approval))",
  notification: "hsl(var(--node-notification))",
  integration: "hsl(var(--node-integration))",
};

// Instance status colors
const instanceStatusColors = {
  running: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  paused: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-gray-100 text-gray-800",
  waiting: "bg-purple-100 text-purple-800",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Canvas Themes**: Workflow builder themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  list: ["workflows", "list"] as const,
  detail: (id: string) => ["workflows", "detail", id] as const,
  instances: (id: string) => ["workflows", "instances", id] as const,
  instance: (id: string, instanceId: string) =>
    ["workflows", "instance", id, instanceId] as const,
  analytics: ["workflows", "analytics"] as const,
  templates: ["workflows", "templates"] as const,
};
```

### Cache Configuration

| Query Type | Stale Time | Cache Time | Invalidation            |
| ---------- | ---------- | ---------- | ----------------------- |
| List       | 5 minutes  | 10 minutes | On create/update/delete |
| Detail     | 10 minutes | 30 minutes | On update/delete        |
| Instances  | 1 minute   | 5 minutes  | On instance update      |
| Analytics  | 15 minutes | 45 minutes | On workflow change      |
| Templates  | 30 minutes | 2 hours    | On template update      |

### Invalidation Rules

```typescript
// After creating workflow
queryClient.invalidateQueries({ queryKey: ["workflows", "list"] });
queryClient.invalidateQueries({ queryKey: ["workflows", "templates"] });

// After updating workflow
queryClient.invalidateQueries({ queryKey: ["workflows", "detail", id] });
queryClient.invalidateQueries({ queryKey: ["workflows", "list"] });

// After executing workflow
queryClient.invalidateQueries({ queryKey: ["workflows", "instances", id] });
queryClient.invalidateQueries({ queryKey: ["workflows", "analytics"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Workflow

1. User navigates to workflows page
2. User clicks "Create Workflow" button
3. System opens workflow builder
4. User drags nodes onto canvas
5. User connects nodes with connectors
6. User configures node properties
7. User saves workflow

#### 2. Execute Workflow

1. User views workflow detail page
2. User clicks "Execute" button
3. System shows execution parameters
4. User fills required parameters
5. User clicks "Start Execution"
6. System creates workflow instance
7. User sees instance progress

#### 3. Approve Workflow Step

1. User receives notification for approval
2. User clicks notification link
3. System opens approval page
4. User reviews step details
5. User clicks "Approve" or "Reject"
6. System processes decision
7. Workflow continues to next step

### UI States

| State          | Component            | Message                          |
| -------------- | -------------------- | -------------------------------- |
| **Empty**      | `WorkflowEmptyState` | "No workflows found"             |
| **Loading**    | `WorkflowSkeleton`   | Loading skeleton                 |
| **Error**      | `WorkflowErrorState` | "Failed to load workflows"       |
| **No Results** | `WorkflowNoResults`  | "No workflows match your search" |

### Interactions

- **Hover**: Node elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Drag**: Node dragging, visual feedback
- **Drop**: Node placement, connection points
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
| `Ctrl/Cmd + N` | Create new workflow |
| `Ctrl/Cmd + F` | Focus search field  |
| `Ctrl/Cmd + S` | Save workflow       |
| `Ctrl/Cmd + E` | Execute workflow    |
| `Escape`       | Close modal/dialog  |
| `Enter`        | Submit form         |

### ARIA Implementation

```typescript
// Workflow canvas
<div role="application" aria-label="Workflow Builder">
  <div role="button" aria-label="Start Node" tabIndex={0}>
    <span>Start</span>
  </div>
  <div role="button" aria-label="Task Node" tabIndex={0}>
    <span>Task</span>
  </div>
</div>

// Workflow form
<form role="form" aria-label="Create Workflow">
  <input
    aria-describedby="name-error"
    aria-invalid="false"
    aria-label="Workflow Name"
  />
  <div id="name-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("WorkflowBuilder", () => {
  it("renders workflow canvas", () => {});
  it("handles node dragging", () => {});
  it("handles node connection", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
});

// Hook tests
describe("useWorkflowCreate", () => {
  it("creates workflow successfully", () => {});
  it("handles creation errors", () => {});
  it("validates workflow structure", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Workflow API Integration", () => {
  it("creates workflow successfully", () => {});
  it("executes workflow successfully", () => {});
  it("handles approval workflow", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Workflow Automation E2E", () => {
  it("complete workflow creation flow", () => {});
  it("complete workflow execution flow", () => {});
  it("complete approval workflow flow", () => {});
  it("workflow builder functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Workflow Automation Accessibility", () => {
  it("meets WCAG 2.2 AA standards", () => {});
  it("supports keyboard navigation", () => {});
  it("works with screen readers", () => {});
  it("has proper color contrast", () => {});
});
```

---

## ⚡ Performance

### Bundle Size

- **Target**: ≤400KB gzipped per route
- **Current**: <CURRENT_SIZE>KB
- **Optimization**: Code splitting, lazy loading, canvas optimization

### Loading Performance

- **TTFB**: ≤70ms (Time to First Byte)
- **TTI**: ≤200ms (Time to Interactive)
- **LCP**: ≤2.5s (Largest Contentful Paint)

### Optimization Strategies

```typescript
// Lazy loading
const WorkflowBuilder = lazy(() => import("./components/WorkflowBuilder"));
const WorkflowAnalytics = lazy(() => import("./components/WorkflowAnalytics"));

// Canvas optimization
import { Canvas } from "react-flow-renderer";

// Virtual scrolling for large lists
import { FixedSizeList as List } from "react-window";
```

---

## 🚀 Implementation Guide

### Step 1: Setup

```bash
# Create directory structure
mkdir -p apps/web/app/(dashboard)/workflows
mkdir -p apps/web/components/workflows
mkdir -p apps/web/hooks/workflows

# Create feature flag
echo 'flags.m73_workflow_automation = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/workflows/WorkflowBuilder.tsx
"use client";

import { Canvas } from "react-flow-renderer";
import { useWorkflowBuilder } from "@/hooks/workflows/useWorkflowBuilder";

export function WorkflowBuilder() {
  const { nodes, edges, onNodesChange, onEdgesChange } = useWorkflowBuilder();

  return (
    <Canvas
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/workflows/useWorkflowList.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useWorkflowList(filters?: WorkflowFilters) {
  return useQuery({
    queryKey: ["workflows", "list", filters],
    queryFn: () => api.workflows.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/workflows/page.tsx
import { WorkflowList } from "@/components/workflows/WorkflowList";
import { WorkflowFilters } from "@/components/workflows/WorkflowFilters";

export default function WorkflowPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Workflows</h1>
        <CreateWorkflowButton />
      </div>
      <WorkflowFilters />
      <WorkflowList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/workflows/__tests__/WorkflowList.test.tsx
import { render, screen } from "@testing-library/react";
import { WorkflowList } from "@/components/workflows/WorkflowList";

describe("WorkflowList", () => {
  it("renders list of workflows", () => {
    render(<WorkflowList />);
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
| Bundle size       | ≤400KB    | CI blocks   |

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
  m73_workflow_automation: false, // Default: disabled
};

// Usage in components
if (flags.m73_workflow_automation) {
  return <WorkflowBuilder />;
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

1. **Set feature flag**: `flags.m73_workflow_automation = false`
2. **Invalidate cache**: `revalidateTag('workflows')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Workflow builder functional
- [ ] Workflow execution working
- [ ] Approval workflows functional
- [ ] Workflow analytics working
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

**Ready to implement Workflow Automation UI! 🚀**
