# 🎯 UI Runbook Template

**Purpose**: Template for creating UI runbooks for M1-M40 modules  
**Usage**: Copy this file and replace all `<placeholders>` with module-specific content

---

## 📋 Module Overview

**Module ID**: <MODULE_ID>  
**Module Name**: <MODULE_NAME>  
**Priority**: <PRIORITY>  
**Phase**: <PHASE>  
**Estimated Effort**: <EFFORT>  
**Last Updated**: 2025-10-06

### Business Value

<MODULE_NAME> provides **<KEY_FUNCTIONALITY>** for businesses requiring <BUSINESS_NEED>.

**Key Benefits**:

- <BENEFIT_1>
- <BENEFIT_2>
- <BENEFIT_3>

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status      | Details                      |
| ------------- | ----------- | ---------------------------- |
| **Database**  | ✅ Complete | Schema implemented           |
| **Services**  | ✅ Complete | Business logic ready         |
| **API**       | ✅ Complete | <NUMBER> endpoints available |
| **Contracts** | ✅ Complete | Type-safe schemas defined    |

### API Endpoints

**<MODULE_NAME> Operations** (<NUMBER> endpoints):

- ✅ `/api/<module>` - List <entities>
- ✅ `/api/<module>/[id]` - Get <entity> details
- ✅ `/api/<module>/create` - Create new <entity>
- ✅ `/api/<module>/[id]/update` - Update <entity>
- ✅ `/api/<module>/[id]/delete` - Delete <entity>

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                 | Page Component       | Purpose                    |
| --------------------- | -------------------- | -------------------------- |
| `/<module>`           | `<Module>ListPage`   | List and search <entities> |
| `/<module>/[id]`      | `<Module>DetailPage` | View <entity> details      |
| `/<module>/create`    | `<Module>CreatePage` | Create new <entity>        |
| `/<module>/[id]/edit` | `<Module>EditPage`   | Edit existing <entity>     |

### Component Structure

```
apps/web/app/(dashboard)/<module>/
├── page.tsx                    # List page
├── [id]/
│   ├── page.tsx               # Detail page
│   └── edit/
│       └── page.tsx           # Edit page
└── create/
    └── page.tsx               # Create page

apps/web/components/<module>/
├── <Module>List.tsx           # List component
├── <Module>Card.tsx           # Card component
├── <Module>Form.tsx           # Form component
├── <Module>Filters.tsx        # Filter component
└── <Module>Actions.tsx         # Action buttons

apps/web/hooks/<module>/
├── use<Module>List.ts          # List hook
├── use<Module>Detail.ts        # Detail hook
├── use<Module>Create.ts        # Create hook
└── use<Module>Update.ts        # Update hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m<ID>_<module> = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose              | Variant                    |
| ----------- | -------------------- | -------------------------- |
| `DataTable` | List <entities>      | With filters, pagination   |
| `Card`      | <Entity> details     | With actions               |
| `Form`      | Create/edit <entity> | With validation            |
| `Button`    | Actions              | Primary, secondary, danger |
| `Modal`     | Confirmations        | With backdrop              |

### Design Tokens

```typescript
// Colors
const colors = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  error: "hsl(var(--error))",
};

// Spacing
const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
};

// Typography
const typography = {
  h1: "text-3xl font-bold",
  h2: "text-2xl font-semibold",
  h3: "text-xl font-medium",
  body: "text-base",
  caption: "text-sm text-muted-foreground",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  list: ['<module>', 'list'] as const,
  detail: (id: string) => ['<module>', 'detail', id] as const,
  filters: (filters: <Module>Filters) => ['<module>', 'list', filters] as const,
}
```

### Cache Configuration

| Query Type | Stale Time | Cache Time | Invalidation            |
| ---------- | ---------- | ---------- | ----------------------- |
| List       | 5 minutes  | 10 minutes | On create/update/delete |
| Detail     | 10 minutes | 30 minutes | On update/delete        |
| Filters    | 1 minute   | 5 minutes  | On filter change        |

### Invalidation Rules

```typescript
// After creating <entity>
queryClient.invalidateQueries({ queryKey: ["<module>", "list"] });

// After updating <entity>
queryClient.invalidateQueries({ queryKey: ["<module>", "detail", id] });
queryClient.invalidateQueries({ queryKey: ["<module>", "list"] });

// After deleting <entity>
queryClient.invalidateQueries({ queryKey: ["<module>", "list"] });
queryClient.removeQueries({ queryKey: ["<module>", "detail", id] });
```

---

## 🎭 User Experience

### User Flows

#### 1. List <Entities>

1. User navigates to `/<module>`
2. System loads <entities> with pagination
3. User can search, filter, sort
4. User clicks on <entity> to view details

#### 2. Create <Entity>

1. User clicks "Create <Entity>" button
2. System opens create form
3. User fills required fields
4. User submits form
5. System creates <entity> and redirects to detail page

#### 3. Edit <Entity>

1. User views <entity> detail page
2. User clicks "Edit" button
3. System opens edit form with current data
4. User modifies fields
5. User submits form
6. System updates <entity> and shows success message

### UI States

| State          | Component            | Message                           |
| -------------- | -------------------- | --------------------------------- |
| **Empty**      | `<Module>EmptyState` | "No <entities> found"             |
| **Loading**    | `<Module>Skeleton`   | Loading skeleton                  |
| **Error**      | `<Module>ErrorState` | "Failed to load <entities>"       |
| **No Results** | `<Module>NoResults`  | "No <entities> match your search" |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
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
| `Ctrl/Cmd + N` | Create new <entity> |
| `Ctrl/Cmd + F` | Focus search field  |
| `Escape`       | Close modal/dialog  |
| `Enter`        | Submit form         |

### ARIA Implementation

```typescript
// List table
<table role="table" aria-label="<Entities> list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Name</th>
    </tr>
  </thead>
</table>

// Form
<form role="form" aria-label="Create <entity>">
  <input aria-describedby="name-error" aria-invalid="false" />
  <div id="name-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("<Module>List", () => {
  it("renders list of <entities>", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("use<Module>List", () => {
  it("fetches <entities> list", () => {});
  it("handles pagination", () => {});
  it("handles filters", () => {});
  it("handles errors", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("<Module> API Integration", () => {
  it("creates <entity> successfully", () => {});
  it("updates <entity> successfully", () => {});
  it("deletes <entity> successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("<Module> E2E", () => {
  it("complete create flow", () => {});
  it("complete edit flow", () => {});
  it("complete delete flow", () => {});
  it("search and filter functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("<Module> Accessibility", () => {
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
const <Module>CreatePage = lazy(() => import('./create/page'))

// Code splitting
const <Module>Form = lazy(() => import('./components/<Module>Form'))

// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window'
```

---

## 🚀 Implementation Guide

### Step 1: Setup

```bash
# Create directory structure
mkdir -p apps/web/app/(dashboard)/<module>
mkdir -p apps/web/components/<module>
mkdir -p apps/web/hooks/<module>

# Create feature flag
echo 'flags.m<ID>_<module> = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/<module>/<Module>List.tsx
'use client'

import { DataTable } from '@/components/ui/data-table'
import { use<Module>List } from '@/hooks/<module>/use<Module>List'

export function <Module>List() {
  const { data, isLoading, error } = use<Module>List()

  if (isLoading) return <Module>Skeleton />
  if (error) return <Module>ErrorState />
  if (!data?.length) return <Module>EmptyState />

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="name"
      filters={filters}
    />
  )
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/<module>/use<Module>List.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function use<Module>List(filters?: <Module>Filters) {
  return useQuery({
    queryKey: ['<module>', 'list', filters],
    queryFn: () => api.<module>.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/<module>/page.tsx
import { <Module>List } from '@/components/<module>/<Module>List'
import { <Module>Filters } from '@/components/<module>/<Module>Filters'

export default function <Module>Page() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold"><Entities></h1>
        <Create<Entity>Button />
      </div>
      <Module>Filters />
      <Module>List />
    </div>
  )
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/<module>/__tests__/<Module>List.test.tsx
import { render, screen } from '@testing-library/react'
import { <Module>List } from '@/components/<module>/<Module>List'

describe('<Module>List', () => {
  it('renders list of <entities>', () => {
    render(<Module>List />)
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})
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
  m<ID>_<module>: false, // Default: disabled
}

// Usage in components
if (flags.m<ID>_<module>) {
  return <Module>List />
}
return <ComingSoon />
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

1. **Set feature flag**: `flags.m<ID>_<module> = false`
2. **Invalidate cache**: `revalidateTag('<module>')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
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

**Ready to implement <MODULE_NAME> UI! 🚀**
