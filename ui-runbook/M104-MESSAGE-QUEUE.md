# 🎯 M104: Message Queue - UI Implementation Runbook

**Module ID**: M104  
**Module Name**: Message Queue  
**Priority**: 🔶 MEDIUM  
**Phase**: Phase 18 - Infrastructure Modernization  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: ❌ NO - CREATE NEW Module

---

## 📋 Module Overview

### Business Value

Message Queue provides **comprehensive message queue and event streaming management** for businesses requiring asynchronous processing and event-driven architecture.

**Key Benefits**:

- Complete message queue management
- Event streaming
- Asynchronous processing
- Integration with all existing modules

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

**Message Queue Operations** (15 endpoints):

- ✅ `/api/message-queue/queues` - List message queues
- ✅ `/api/message-queue/queues/[id]` - Get queue details
- ✅ `/api/message-queue/queues/create` - Create queue
- ✅ `/api/message-queue/queues/[id]/update` - Update queue
- ✅ `/api/message-queue/queues/[id]/delete` - Delete queue
- ✅ `/api/message-queue/queues/[id]/purge` - Purge queue
- ✅ `/api/message-queue/queues/[id]/stats` - Get queue stats
- ✅ `/api/message-queue/messages` - List messages
- ✅ `/api/message-queue/messages/[id]` - Get message details
- ✅ `/api/message-queue/messages/create` - Create message
- ✅ `/api/message-queue/messages/[id]/update` - Update message
- ✅ `/api/message-queue/messages/[id]/delete` - Delete message
- ✅ `/api/message-queue/messages/[id]/requeue` - Requeue message
- ✅ `/api/message-queue/analytics` - Get message queue analytics
- ✅ `/api/message-queue/alerts` - Get message queue alerts

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                               | Page Component                  | Purpose                 |
| ----------------------------------- | ------------------------------- | ----------------------- |
| `/message-queue`                    | `MessageQueuePage`              | Main message queue hub  |
| `/message-queue/queues`             | `MessageQueueQueuesPage`        | Queue management        |
| `/message-queue/queues/[id]`        | `MessageQueueQueueDetailPage`   | View queue details      |
| `/message-queue/queues/create`      | `MessageQueueQueueCreatePage`   | Create queue            |
| `/message-queue/queues/[id]/edit`   | `MessageQueueQueueEditPage`     | Edit queue              |
| `/message-queue/messages`           | `MessageQueueMessagesPage`      | Message management      |
| `/message-queue/messages/[id]`      | `MessageQueueMessageDetailPage` | View message details    |
| `/message-queue/messages/create`    | `MessageQueueMessageCreatePage` | Create message          |
| `/message-queue/messages/[id]/edit` | `MessageQueueMessageEditPage`   | Edit message            |
| `/message-queue/analytics`          | `MessageQueueAnalyticsPage`     | Message queue analytics |
| `/message-queue/alerts`             | `MessageQueueAlertsPage`        | Message queue alerts    |

### Component Structure

```
apps/web/app/(dashboard)/message-queue/
├── page.tsx                    # Main hub page
├── queues/
│   ├── page.tsx               # Queues list
│   ├── [id]/
│   │   ├── page.tsx           # Queue details
│   │   └── edit/
│   │       └── page.tsx       # Edit queue
│   └── create/
│       └── page.tsx           # Create queue
├── messages/
│   ├── page.tsx               # Messages list
│   ├── [id]/
│   │   ├── page.tsx           # Message details
│   │   └── edit/
│   │       └── page.tsx       # Edit message
│   └── create/
│       └── page.tsx           # Create message
├── analytics/
│   └── page.tsx               # Analytics page
└── alerts/
    └── page.tsx               # Alerts page

apps/web/components/message-queue/
├── MessageQueueHub.tsx      # Main hub component
├── MessageQueueQueues.tsx  # Queues component
├── MessageQueueQueueCard.tsx # Queue card
├── MessageQueueQueueForm.tsx # Queue form
├── MessageQueueMessages.tsx # Messages component
├── MessageQueueMessageCard.tsx # Message card
├── MessageQueueMessageForm.tsx # Message form
├── MessageQueueAnalytics.tsx # Analytics component
├── MessageQueueAlerts.tsx   # Alerts component
├── MessageQueueFilters.tsx  # Filter component
└── MessageQueueActions.tsx  # Action buttons

apps/web/hooks/message-queue/
├── useMessageQueueQueues.ts # Queues hook
├── useMessageQueueQueueDetail.ts # Queue detail hook
├── useMessageQueueQueueCreate.ts # Queue create hook
├── useMessageQueueQueueUpdate.ts # Queue update hook
├── useMessageQueueQueueDelete.ts # Queue delete hook
├── useMessageQueueQueuePurge.ts # Queue purge hook
├── useMessageQueueQueueStats.ts # Queue stats hook
├── useMessageQueueMessages.ts # Messages hook
├── useMessageQueueMessageDetail.ts # Message detail hook
├── useMessageQueueMessageCreate.ts # Message create hook
├── useMessageQueueMessageUpdate.ts # Message update hook
├── useMessageQueueMessageDelete.ts # Message delete hook
├── useMessageQueueMessageRequeue.ts # Message requeue hook
├── useMessageQueueAnalytics.ts # Analytics hook
└── useMessageQueueAlerts.ts # Alerts hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m104_message_queue = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose              | Variant                    |
| ----------- | -------------------- | -------------------------- |
| `DataTable` | List queues/messages | With filters, pagination   |
| `Card`      | Queue details        | With actions               |
| `Form`      | Create/edit forms    | With validation            |
| `Button`    | Actions              | Primary, secondary, danger |
| `Modal`     | Confirmations        | With backdrop              |
| `Tabs`      | Queue tabs           | With content               |
| `Progress`  | Queue progress       | With status                |

### Design Tokens

```typescript
// Message queue-specific colors
const messageQueueColors = {
  queue: "hsl(var(--queue))",
  message: "hsl(var(--message))",
  producer: "hsl(var(--producer))",
  consumer: "hsl(var(--consumer))",
  broker: "hsl(var(--broker))",
};

// Queue status colors
const queueStatusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  paused: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  maintenance: "bg-orange-100 text-orange-800",
  purged: "bg-purple-100 text-purple-800",
};

// Message status colors
const messageStatusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  requeued: "bg-orange-100 text-orange-800",
  dead: "bg-gray-100 text-gray-800",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Message Queue Themes**: Status-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  queues: ["message-queue", "queues"] as const,
  queue: (id: string) => ["message-queue", "queue", id] as const,
  messages: ["message-queue", "messages"] as const,
  message: (id: string) => ["message-queue", "message", id] as const,
  analytics: ["message-queue", "analytics"] as const,
  alerts: ["message-queue", "alerts"] as const,
};
```

### Cache Configuration

| Query Type | Stale Time | Cache Time | Invalidation            |
| ---------- | ---------- | ---------- | ----------------------- |
| Queues     | 30 seconds | 2 minutes  | On create/update/delete |
| Queue      | 15 seconds | 1 minute   | On update/delete        |
| Messages   | 15 seconds | 1 minute   | On create/update/delete |
| Message    | 10 seconds | 30 seconds | On update/delete        |
| Analytics  | 1 minute   | 5 minutes  | On queue change         |
| Alerts     | 15 seconds | 1 minute   | On alert update         |

### Invalidation Rules

```typescript
// After creating queue
queryClient.invalidateQueries({ queryKey: ["message-queue", "queues"] });
queryClient.invalidateQueries({ queryKey: ["message-queue", "analytics"] });

// After updating queue
queryClient.invalidateQueries({ queryKey: ["message-queue", "queue", id] });
queryClient.invalidateQueries({ queryKey: ["message-queue", "queues"] });

// After requeuing message
queryClient.invalidateQueries({ queryKey: ["message-queue", "message", id] });
queryClient.invalidateQueries({ queryKey: ["message-queue", "alerts"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Message Queue

1. User navigates to message queue page
2. User clicks "Create Queue" button
3. System opens queue creation form
4. User enters queue details
5. User sets queue parameters
6. User configures queue settings
7. User submits queue

#### 2. Send Message

1. User navigates to messages page
2. User clicks "Create Message" button
3. System opens message creation form
4. User selects queue
5. User sets message content
6. User configures message settings
7. User sends message

#### 3. Purge Queue

1. User views queue details
2. User clicks "Purge Queue" button
3. System opens purge confirmation
4. User confirms purge parameters
5. User clicks "Confirm Purge"
6. System purges queue
7. User views purge results

### UI States

| State          | Component                | Message                         |
| -------------- | ------------------------ | ------------------------------- |
| **Empty**      | `MessageQueueEmptyState` | "No message queues found"       |
| **Loading**    | `MessageQueueSkeleton`   | Loading skeleton                |
| **Error**      | `MessageQueueErrorState` | "Failed to load message queues" |
| **No Results** | `MessageQueueNoResults`  | "No queues match your search"   |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation
- **Progress**: Message processing progress, status updates

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
| `Ctrl/Cmd + Q` | Create queue       |
| `Ctrl/Cmd + M` | Create message     |
| `Ctrl/Cmd + P` | Purge queue        |
| `Ctrl/Cmd + R` | Requeue message    |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

### ARIA Implementation

```typescript
// Queue list
<table role="table" aria-label="Message queue list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Queue Name</th>
      <th role="columnheader" aria-sort="none">Status</th>
      <th role="columnheader" aria-sort="none">Messages</th>
      <th role="columnheader" aria-sort="none">Last Updated</th>
    </tr>
  </thead>
</table>

// Queue form
<form role="form" aria-label="Create Message Queue">
  <input
    aria-describedby="name-error"
    aria-invalid="false"
    aria-label="Queue Name"
  />
  <div id="name-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("MessageQueueQueues", () => {
  it("renders list of queues", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useMessageQueueQueueCreate", () => {
  it("creates queue successfully", () => {});
  it("handles creation errors", () => {});
  it("validates queue data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Message Queue API Integration", () => {
  it("creates queue successfully", () => {});
  it("sends message successfully", () => {});
  it("purges queue successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Message Queue E2E", () => {
  it("complete queue creation flow", () => {});
  it("complete message creation flow", () => {});
  it("complete queue purging", () => {});
  it("message queue analytics functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Message Queue Accessibility", () => {
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
const MessageQueueQueueForm = lazy(
  () => import("./components/MessageQueueQueueForm")
);
const MessageQueueAnalytics = lazy(
  () => import("./components/MessageQueueAnalytics")
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
mkdir -p apps/web/app/(dashboard)/message-queue
mkdir -p apps/web/components/message-queue
mkdir -p apps/web/hooks/message-queue

# Create feature flag
echo 'flags.m104_message_queue = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/message-queue/MessageQueueQueues.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useMessageQueueQueues } from "@/hooks/message-queue/useMessageQueueQueues";

export function MessageQueueQueues() {
  const { data, isLoading, error } = useMessageQueueQueues();

  if (isLoading) return <MessageQueueSkeleton />;
  if (error) return <MessageQueueErrorState />;
  if (!data?.length) return <MessageQueueEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="queueName"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/message-queue/useMessageQueueQueues.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useMessageQueueQueues(filters?: MessageQueueFilters) {
  return useQuery({
    queryKey: ["message-queue", "queues", filters],
    queryFn: () => api.messageQueue.queues.list(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/message-queue/page.tsx
import { MessageQueueHub } from "@/components/message-queue/MessageQueueHub";
import { MessageQueueQuickActions } from "@/components/message-queue/MessageQueueQuickActions";

export default function MessageQueuePage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Message Queue</h1>
        <MessageQueueQuickActions />
      </div>
      <MessageQueueHub />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/message-queue/__tests__/MessageQueueQueues.test.tsx
import { render, screen } from "@testing-library/react";
import { MessageQueueQueues } from "@/components/message-queue/MessageQueueQueues";

describe("MessageQueueQueues", () => {
  it("renders list of queues", () => {
    render(<MessageQueueQueues />);
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
  m104_message_queue: false, // Default: disabled
};

// Usage in components
if (flags.m104_message_queue) {
  return <MessageQueueQueues />;
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

1. **Set feature flag**: `flags.m104_message_queue = false`
2. **Invalidate cache**: `revalidateTag('message-queue')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Queue management functional
- [ ] Message management working
- [ ] Queue purging functional
- [ ] Message requeuing working
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

**Ready to implement Message Queue UI! 🚀**
