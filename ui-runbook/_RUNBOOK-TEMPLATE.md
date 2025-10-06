# 🚀 <MODULE_ID>: <MODULE_NAME> - UI Implementation Runbook

**Module ID**: <M##>  
**Module Name**: <Full Module Name>  
**Priority**: <CRITICAL | HIGH | MEDIUM | LOW>  
**Phase**: <1 - Foundation | 2 - Core | 3 - Advanced | 4 - Premium>  
**Estimated Effort**: <N days>  
**Last Updated**: <YYYY-MM-DD>

---

## 📋 Executive Summary

<1-2 paragraphs describing the module's purpose, scope, and business value>

### Business Value

- <Key business benefit 1>
- <Key business benefit 2>
- <Key business benefit 3>
- <Key business benefit 4>

---

## 👥 Ownership

- **Module Owner**: <name> (@handle)
- **Code Reviewer**: <name> (@handle)
- **QA Lead**: <name> (@handle)
- **Related ADRs**: [ADR-###-<topic>], [ADR-###-<topic>]

---

## 📊 Current Status

| Layer         | Status | Details                      |
| ------------- | ------ | ---------------------------- |
| **Database**  | ⬜/✅  | <Schema status and notes>    |
| **Services**  | ⬜/✅  | <Service layer status>       |
| **API**       | ⬜/✅  | <API endpoint coverage>      |
| **Contracts** | ⬜/✅  | <Type-safe contracts status> |
| **UI**        | ⬜/✅  | <UI implementation status>   |

### API Coverage

- ⬜/✅ `/api/<module>` - <Description>
- ⬜/✅ `/api/<module>/[id]` - <Description>
- ⬜/✅ `/api/<module>/<action>` - <Description>

**Total Endpoints**: <N>

### Risks & Blockers

| Risk               | Impact       | Mitigation            | Owner     |
| ------------------ | ------------ | --------------------- | --------- |
| <Risk description> | HIGH/MED/LOW | <Mitigation strategy> | @<handle> |

---

## 🎯 3 Killer Features

### 1. **<Feature Name>** <emoji>

**Description**: <What the feature does>

**Why It's Killer**:

- <Competitive advantage 1>
- <Competitive advantage 2>
- <Competitive advantage 3>
- <How it beats competitors>

**Implementation**:

```typescript
// Code example showing key implementation pattern
```

### 2. **<Feature Name>** <emoji>

**Description**: <What the feature does>

**Why It's Killer**:

- <Competitive advantage 1>
- <Competitive advantage 2>
- <Competitive advantage 3>

**Implementation**:

```typescript
// Code example
```

### 3. **<Feature Name>** <emoji>

**Description**: <What the feature does>

**Why It's Killer**:

- <Competitive advantage 1>
- <Competitive advantage 2>
- <Competitive advantage 3>

**Implementation**:

```typescript
// Code example
```

---

## 🏗️ Technical Architecture

### UI Components Needed

#### 1. <Page Name> (`/<route>`)

**Server/Client Boundary**: <Server component | Client component | Hybrid>

**Components**:

- `<Component>` - <Purpose>
- `<Component>` - <Purpose>
- `<Component>` - <Purpose>

**File**: `apps/web/app/(dashboard)/<route>/page.tsx`  
**Strategy**: <Data fetching strategy>

#### 2. <Page Name> (`/<route>/[id]`)

**Server/Client Boundary**: <Server | Client | Hybrid>

**Components**:

- `<Component>` - <Purpose>
- `<Component>` - <Purpose>

**File**: `apps/web/app/(dashboard)/<route>/[id]/page.tsx`  
**Cache Strategy**: <Caching approach>

#### 3. <Additional Pages as needed>

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                     | Target           | Measurement             |
| -------------------------- | ---------------- | ----------------------- |
| TTFB (staging)             | ≤ 70ms           | Server timing header    |
| Client TTI for `/<route>`  | ≤ 200ms          | Lighthouse CI           |
| Network requests (initial) | ≤ 4              | Chrome DevTools         |
| UI bundle size             | ≤ 250KB gzipped  | Webpack bundle analyzer |
| Table virtualization       | After ≥ 200 rows | DataTable config        |
| Server pagination          | Default 50/page  | API query param         |
| Search response (P95)      | < 150ms          | APM traces              |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: <Specify all keyboard-accessible interactions>
- **Focus Management**: <Focus trap strategy, visible indicators>
- **ARIA**: <Live regions, roles, labels strategy>
- **Screen Reader**: <All content announced, interaction descriptions>
- **Axe Target**: 0 serious/critical violations

### Security

| Layer           | Requirement                                         |
| --------------- | --------------------------------------------------- |
| RBAC Scopes     | `<module>.read`, `<module>.write`, `<module>.admin` |
| Enforcement     | Server-side on all endpoints                        |
| Client Behavior | Hide non-permitted actions (buttons/menu items)     |
| Data Exposure   | Only show data user has permission to view          |
| Idempotency     | All mutations use auto-generated idempotency key    |
| Rate Limiting   | Handled by BFF; UI shows appropriate toast          |

**Reference**: See `security-policy.json` for full threat model and controls.

#### UI Permissions Matrix

| Role           | Action1 | Action2 | Action3 | Action4 | Action5 |
| -------------- | ------- | ------- | ------- | ------- | ------- |
| <module>.read  | <✅/❌> | <✅/❌> | <✅/❌> | <✅/❌> | <✅/❌> |
| <module>.write | <✅/❌> | <✅/❌> | <✅/❌> | <✅/❌> | <✅/❌> |
| <module>.admin | <✅/❌> | <✅/❌> | <✅/❌> | <✅/❌> | <✅/❌> |

**UI Implementation**:

- Hide buttons/menu items for actions user lacks permission for
- Show permission-denied state if user navigates directly to restricted URL
- Display read-only view for `<module>.read` users on detail pages

### Reliability & Observability

- **SLO**: 99.9% successful responses on <module> endpoints
- **SLA Dashboards**: Real-time metrics on latency, error rate, throughput
- **Events Emitted**: `<Module>.<Entity>.<Action>` (list below in Analytics section)
- **Logging**: Structured logs with correlation IDs for all mutations
- **Tracing**: Distributed tracing across BFF → Kernel

---

## 🧬 Data & Domain Invariants

### <Module> Business Rules

| Rule            | Enforcement                           |
| --------------- | ------------------------------------- |
| **<Rule Name>** | <Description of how rule is enforced> |
| **<Rule Name>** | <Description>                         |
| **<Rule Name>** | <Description>                         |

### Currency & Rounding

- **Display**: <Currency display strategy>
- **Rounding Policy**: <HALF_UP / EVENT / other>
- **Multi-Currency**: <How multi-currency is handled>

### Archive Semantics

- **Soft Delete**: <How soft delete works>
- **Guard Rails**:
  - ❌ <Condition that prevents deletion>
  - ❌ <Condition that prevents deletion>
  - ✅ <Condition that allows deletion>

---

## 🚨 Error Handling & UX States

### All Possible States

| State          | UI Display               | User Action              |
| -------------- | ------------------------ | ------------------------ |
| **Empty**      | <Empty state message>    | <Primary action>         |
| **Loading**    | <Loading indicator>      | N/A                      |
| **Error**      | <Error message>          | <Retry / support action> |
| **Partial**    | <Partial data display>   | <Load more / pagination> |
| **No Results** | <No results message>     | <Clear filters / adjust> |
| **Conflict**   | <Conflict resolution UI> | <Review / force save>    |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Submit State**: Button disabled until dirty & valid
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal

### Network Errors

| HTTP Status | UI Message                              | Action              |
| ----------- | --------------------------------------- | ------------------- |
| 400         | "Invalid request. Check your input."    | Inline field errors |
| 401         | "Session expired. Please log in again." | Redirect to login   |
| 403         | "You don't have permission."            | Hide action         |
| 404         | "<Entity> not found."                   | Return to list      |
| 409         | "This <entity> was changed. Review."    | Show diff modal     |
| 422         | "Validation failed"                     | Inline errors       |
| 500         | "Something went wrong. Try again."      | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/<module>.json`.

### Page Titles & Headers

| Context      | Copy            | i18n Key                |
| ------------ | --------------- | ----------------------- |
| List Page    | "<Page Title>"  | `<module>.list.title`   |
| Detail Page  | "<Page Title>"  | `<module>.detail.title` |
| Create Modal | "<Modal Title>" | `<module>.create.title` |

### State Messages

| State             | Title     | Message     | Action Button | i18n Key                      |
| ----------------- | --------- | ----------- | ------------- | ----------------------------- |
| Empty             | "<Title>" | "<Message>" | "<Action>"    | `<module>.empty.*`            |
| Error             | "<Title>" | "<Message>" | "<Action>"    | `<module>.error.*`            |
| No Results        | "<Title>" | "<Message>" | "<Action>"    | `<module>.noResults.*`        |
| Permission Denied | "<Title>" | "<Message>" | "<Action>"    | `<module>.permissionDenied.*` |
| Offline           | "<Title>" | "<Message>" | "<Action>"    | `<module>.offline.*`          |
| Conflict (409)    | "<Title>" | "<Message>" | "<Action>"    | `<module>.conflict.*`         |

### Action Confirmations

| Action  | Title     | Message     | Confirm Button | Cancel Button | i18n Key                     |
| ------- | --------- | ----------- | -------------- | ------------- | ---------------------------- |
| Delete  | "<Title>" | "<Message>" | "<Confirm>"    | "Cancel"      | `<module>.delete.confirm.*`  |
| Archive | "<Title>" | "<Message>" | "<Confirm>"    | "Cancel"      | `<module>.archive.confirm.*` |

### Success Messages (Toast)

| Action | Message             | i18n Key                  |
| ------ | ------------------- | ------------------------- |
| Create | "<Success message>" | `<module>.create.success` |
| Update | "<Success message>" | `<module>.update.success` |
| Delete | "<Success message>" | `<module>.delete.success` |

### Error Messages (Toast)

| Scenario      | Message       | i18n Key                 |
| ------------- | ------------- | ------------------------ |
| Create Failed | "<Error msg>" | `<module>.create.error`  |
| Update Failed | "<Error msg>" | `<module>.update.error`  |
| Network Error | "<Error msg>" | `<module>.error.network` |

### Form Labels & Help Text

| Field   | Label     | Placeholder | Help Text     | i18n Key                  |
| ------- | --------- | ----------- | ------------- | ------------------------- |
| <Field> | "<Label>" | "<Hint>"    | "<Help text>" | `<module>.field.<name>.*` |

### Keyboard Shortcuts Help

| Shortcut | Description     | i18n Key                    |
| -------- | --------------- | --------------------------- |
| `/`      | "Focus search"  | `<module>.shortcuts.search` |
| `n`      | "Create new"    | `<module>.shortcuts.new`    |
| `e`      | "Edit selected" | `<module>.shortcuts.edit`   |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/use<Module>.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function use<Module>(filters = {}) {
  const queryClient = useQueryClient();

  const {
    data: <entities>,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["<module>", "list", filters],
    queryFn: () => apiClient.GET("/api/<module>", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });

  const create<Entity> = useMutation({
    mutationFn: (data) => apiClient.POST("/api/<module>/create", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["<module>"] });
    },
  });

  const update<Entity> = useMutation({
    mutationFn: ({ id, data }) =>
      apiClient.PUT("/api/<module>/[id]", { params: { id }, body: data }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["<module>"] });
      queryClient.invalidateQueries({ queryKey: ["<module>", "detail", id] });
    },
  });

  const archive<Entity> = useMutation({
    mutationFn: (id) => apiClient.POST("/api/<module>/archive", { body: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["<module>"] });
    },
  });

  return {
    <entities>: <entities> || [],
    isLoading,
    error,
    create<Entity>: create<Entity>.mutate,
    update<Entity>: update<Entity>.mutate,
    archive<Entity>: archive<Entity>.mutate,
  };
}

export function use<Entity>(id: string) {
  return useQuery({
    queryKey: ["<module>", "detail", id],
    queryFn: () => apiClient.GET("/api/<module>/[id]", { params: { id } }),
    staleTime: 60_000, // 1min
    enabled: !!id,
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error        | User Message       | UI Action            |
| ---------------- | ------------------ | -------------------- |
| 409 (Conflict)   | "<User message>"   | Show conflict modal  |
| 422 (Validation) | "<Field errors>"   | Inline form errors   |
| 403 (Forbidden)  | "<Permission msg>" | Hide action buttons  |
| 500 (Server)     | "<Error message>"  | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for mutations

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["<module>", "list", { filters }]
["<module>", "detail", <entityId>]
["<module>", "<custom>"]
```

### Invalidation Rules

| Action          | Invalidates                                  |
| --------------- | -------------------------------------------- |
| Create <Entity> | `["<module>"]`                               |
| Update <Entity> | `["<module>"]`, `["<module>", "detail", id]` |
| Delete <Entity> | `["<module>"]`                               |

### Stale Time

| Query Type | Stale Time | Reasoning   |
| ---------- | ---------- | ----------- |
| List       | 30s        | <Reasoning> |
| Detail     | 1min       | <Reasoning> |
| <Custom>   | <Time>     | <Reasoning> |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("<module>"); // After mutations
revalidateTag(`<module>-${<entityId>}`); // Specific entity
```

---

## 📝 Implementation Guide

### Step 0: Foundation Setup (1 hour)

- Enable feature flag: `flags.<module> = false`
- Wire analytics provider for event tracking
- Configure observability (Sentry/Datadog)

### Step 1: Create Base Layout (1 hour)

```powershell
# Create directory structure
mkdir -p apps/web/app/(dashboard)/<route>/[id]
mkdir -p apps/web/hooks
mkdir -p apps/web/components/<module>
```

### Step 2: Build API Hooks (2 hours)

Create `apps/web/hooks/use<Module>.ts` with all necessary hooks.

### Step 3: Build List Page (4 hours)

```typescript
// apps/web/app/(dashboard)/<route>/page.tsx
import { DataTable, Button } from "aibos-ui";
import { use<Module> } from "@/hooks/use<Module>";
import { useRouter } from "next/navigation";

export default function <Module>Page() {
  const router = useRouter();
  const { <entities>, create<Entity> } = use<Module>();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold"><Page Title></h1>
        <Button onClick={() => setShowCreate(true)}>Create</Button>
      </div>

      <DataTable
        data={<entities>}
        columns={[
          // Define columns
        ]}
        onRowClick={(row) => router.push(`/<route>/${row.id}`)}
        enableSearch
        enableSorting
        enablePagination
        pageSize={50}
      />
    </div>
  );
}
```

### Step 4: Build Detail Page (3 hours)

```typescript
// apps/web/app/(dashboard)/<route>/[id]/page.tsx
import { Card, Form, Button } from "aibos-ui";
import { use<Entity> } from "@/hooks/use<Module>";

export default function <Entity>DetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { <entity>, update<Entity> } = use<Entity>(params.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <Form
          defaultValues={<entity>}
          onSubmit={update<Entity>}
          schema={<entity>Schema}
        >
          {/* Form fields */}
          <div className="flex gap-4">
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
```

### Step 5: Add Tests (2 hours)

```typescript
// apps/web/app/(dashboard)/<route>/__tests__/page.test.tsx
import { render, screen } from "@testing-library/react";
import <Module>Page from "../page";

describe("<Module>Page", () => {
  it("renders list", async () => {
    render(<<Module>Page />);
    expect(await screen.findByText("<Page Title>")).toBeInTheDocument();
  });
});
```

---

## ✅ Testing Checklist

### Unit Tests

- [ ] <Test case 1>
- [ ] <Test case 2>
- [ ] <Test case 3>

### Integration Tests

- [ ] Create <entity> → appears in list
- [ ] Update <entity> → changes reflected
- [ ] Delete <entity> → removed from list
- [ ] Search filters <entities> correctly

### E2E Tests

- [ ] User can navigate to <module> page
- [ ] User can create new <entity>
- [ ] User can view <entity> details
- [ ] User can edit <entity>
- [ ] User can delete <entity>

### Accessibility Tests

- [ ] Keyboard navigation works
- [ ] Screen reader announces changes
- [ ] Focus management correct
- [ ] Color contrast meets WCAG 2.2 AAA
- [ ] Axe: 0 serious/critical violations

### Contract Tests

- [ ] API calls match OpenAPI spec

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for all components

### Performance Tests

- [ ] Bundle size < 250KB gzipped
- [ ] TTFB ≤ 70ms on staging
- [ ] Table renders efficiently

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/<module>.fixtures.ts`

**Datasets**:

- `minimal<Entities>`: <N> items (minimal dataset)
- `standard<Entities>`: <N> items (standard dataset)
- `largeDataset`: <N> items (for performance testing)
- `edgeCases`: Special scenarios

**Edge Cases Covered**:

- <Edge case 1>
- <Edge case 2>
- <Edge case 3>

```typescript
// Example fixture structure
export const standard<Entities>: <Entity>Fixture[] = [
  {
    id: "<id>",
    // ... fields
  },
];
```

### E2E Seed Data

**Location**: `tests/seeds/<module>.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:<module>
```

**Dataset**:

- <N> <entities> covering all scenarios
- <Description of data characteristics>

**Cleanup Command**:

```powershell
pnpm run seed:<module>:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- <Description of realistic data>
- <Key features demonstrated>

**Regeneration**:

```powershell
pnpm run demo:reset:<module>
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] No orphaned references
- [ ] <Module-specific validation>

---

## 🔗 API Contract Sync (CI Enforcement)

### Prevent Drift

**CI Step**: Fail build if `packages/contracts/openapi/openapi.json` changes without regenerating `types.gen.ts`.

```yaml
# .github/workflows/ci.yml
- name: Check API types sync
  run: |
    pnpm run generate:api-types
    git diff --exit-code packages/api-client/src/types.gen.ts
```

### Hook Layer Contract

- **Rule**: Hooks **only** use generated types from `@aibos/api-client`
- **No ad-hoc shapes**: All API calls must match OpenAPI spec
- **Validation**: TypeScript enforces at compile time

---

## 🖥️ RSC/SSR & App Router Compatibility

### Server/Client Boundaries

- **Pages**: Server components by default
- **Interactive Parts**: Mark with `"use client"` (forms, interactive widgets)

### Data Fetching Strategy

| Scenario     | Strategy                               | Benefit             |
| ------------ | -------------------------------------- | ------------------- |
| Initial List | Server-side fetch + stream             | Faster TTFB         |
| Mutations    | Client-side React Query                | Optimistic updates  |
| Detail Page  | Server component wrapper + client form | SEO + interactivity |

### Cache Strategy

```typescript
// Server actions
'use server';

import { revalidateTag } from 'next/cache';

export async function create<Entity>(data) {
  // ... mutation logic
  revalidateTag('<module>');
}
```

---

## 📊 Analytics & Audit Events

| Event                     | When             | Properties                    |
| ------------------------- | ---------------- | ----------------------------- |
| <Module>.<Entity>.Viewed  | Detail page open | `<entity>_id`                 |
| <Module>.<Entity>.Created | After 2xx        | `<entity>_id`, <fields>       |
| <Module>.<Entity>.Updated | After 2xx        | `<entity>_id`, changed fields |
| <Module>.<Entity>.Deleted | After 2xx        | `<entity>_id`, `reason?`      |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("<Module>.<Entity>.Created", {
  <entity>_id: <entity>.id,
  // ... properties
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/<module>.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties; test with Arabic

### Keyboard Shortcuts

| Key      | Action        | Scope  |
| -------- | ------------- | ------ |
| `/`      | Focus search  | List   |
| `n`      | New <entity>  | List   |
| `e`      | Edit selected | Detail |
| `Enter`  | Open selected | Table  |
| `Escape` | Close modal   | Modal  |

**Implementation**:

```typescript
useHotkeys([
  ['/', () => searchInputRef.current?.focus()],
  ['n', () => openCreateModal()],
]);
```

---

## 📅 Timeline & Milestones

| Day | Tasks                     | Deliverable              | Flag Status |
| --- | ------------------------- | ------------------------ | ----------- |
| 1   | Setup + Hooks + List Page | Basic listing works      | WIP         |
| 2   | Detail Page + CRUD        | CRUD operations complete | WIP         |
| 3   | Tests + Polish            | Production-ready module  | GA          |

**Total Effort**: <N> days (<N> hours)

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                         | Duration | Rollback Trigger |
| ----------- | ---------------- | ---------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                         | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, Lighthouse ≥90       | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, P95 latency < 200ms   | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained | Ongoing  | Error rate spike |

### Feature Flag Configuration

```typescript
// Feature flags for gradual rollout
flags: {
  <module>: false,              // Master toggle
  <module>_<feature>: false,    // Specific feature
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page
- P50/P95/P99 latency
- Feature flag adoption rate
- User engagement

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- P95 latency > 500ms for 10min → investigate

### UI Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.<module> = false`

   ```powershell
   pnpm run flags:set <module>=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag('<module>');
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/<route>/*"
   ```

4. **Monitor for 15 minutes**:
   - Error rate drops below 0.1%
   - No new Sentry issues

5. **Post-mortem**:
   - Create incident report
   - Add regression test

**Rollback Decision Matrix**:

| Scenario             | Action             | Approval Required |
| -------------------- | ------------------ | ----------------- |
| Error rate > 5%      | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%      | Partial rollback   | On-call engineer  |
| P95 latency > 1s     | Investigate first  | On-call engineer  |
| A11y violation found | Partial rollback   | QA + PM           |
| Data corruption/loss | Immediate rollback | No (auto-trigger) |

---

## 🔗 Dependencies

### Must Complete Before Starting

- ✅ Install aibos-ui package
- ✅ Setup Next.js routing
- ✅ Configure API client
- ✅ Setup React Query
- 🆕 Feature flag service
- 🆕 Analytics provider
- 🆕 Axe (a11y testing)

### Blocks These Modules

- <Module that depends on this>
- <Module that depends on this>

---

## 🎯 Success Criteria

### Must Have (Measurable)

- [ ] Display all <entities> in table
- [ ] Create new <entities> with validation
- [ ] Edit existing <entities>
- [ ] Delete <entities> with guard rails
- [ ] Search returns results < 150ms (P95)
- [ ] Axe: 0 serious/critical violations

### Should Have

- [ ] <Feature>
- [ ] <Feature>

### Nice to Have

- [ ] <Feature>
- [ ] <Feature>

---

## 📚 References

### API Documentation

- OpenAPI spec: `packages/contracts/openapi/openapi.json`
- Type definitions: `packages/api-client/src/types.gen.ts`

### Design System

- Component library: `aibos-ui` package
- Design tokens: Import from `aibos-ui/tokens`
- Style guide: Follow dark-first theme

### Best Practices

- ERPNext patterns
- QuickBooks UX
- Xero visualization
- Zoho search & filtering

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Cost/Scaling**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: <Risk Description>

**Mitigation**: <Mitigation strategy>

### Risk #2: <Risk Description>

**Mitigation**: <Mitigation strategy>

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional
- [ ] All CRUD operations working
- [ ] Guard rails enforced
- [ ] Search and filtering working
- [ ] Pagination working (50 items/page default)
- [ ] Permissions enforced
- [ ] All error states handled
- [ ] Copy deck implemented

### Quality Gates 🎯

**Enforced in CI** - Build fails if any gate not met

#### Code Quality

- [ ] TypeScript: 0 errors, 0 warnings
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Prettier: All files formatted
- [ ] No console.log or debugger statements

#### Test Coverage

- [ ] Unit tests: ≥90% line coverage, ≥95% for critical paths
- [ ] Integration tests: All CRUD operations covered
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms
- [ ] Network requests: ≤4 on initial load

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly
- [ ] Error tracking integrated
- [ ] Performance monitoring active
- [ ] Alerts configured

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Rate limiting tested
- [ ] No sensitive data in logs/errors
- [ ] Security review completed

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete
- [ ] Storybook stories created
- [ ] API contracts synchronized
- [ ] i18n keys documented
- [ ] UAT passed (PM/QA sign-off)

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured
- [ ] Smoke tests passed on staging
- [ ] Load tests passed (≥1000 concurrent users)
- [ ] Deployed to production (flags off)
- [ ] Rollback procedure tested
- [ ] Gradual rollout plan ready

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All test plans executed and passed
- [ ] **Design**: UI matches specs, brand compliance
- [ ] **PM**: Feature complete, acceptance criteria met
- [ ] **Security**: Security review passed
- [ ] **Accessibility**: A11y audit passed

---

**Ready to build? Start with Step 0! 🚀**

**Next Module**: <Next module that depends on this one>
