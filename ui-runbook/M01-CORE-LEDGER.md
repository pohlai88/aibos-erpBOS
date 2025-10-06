# 🚀 M1: Core Ledger - UI Implementation Runbook

**Module ID**: M1  
**Module Name**: Core Ledger  
**Priority**: CRITICAL  
**Phase**: 1 - Foundation  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

The Core Ledger module is the **foundation of the entire ERP system**. It manages the chart of accounts, account hierarchies, and provides the base structure for all financial transactions across all modules.

### Business Value

- Central repository for all account definitions
- Enables financial reporting at all levels
- Supports multi-entity, multi-currency operations
- Foundation for compliance and audit trails

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-001-ledger-hierarchy-dnd], [ADR-002-ledger-soft-delete]

---

## 📊 Current Status

| Layer         | Status  | Details                                  |
| ------------- | ------- | ---------------------------------------- |
| **Database**  | ✅ 100% | Complete schema with account hierarchies |
| **Services**  | ✅ 100% | Ledger service implemented               |
| **API**       | ✅ 100% | Full CRUD + hierarchy endpoints          |
| **Contracts** | ✅ 100% | Type-safe schemas for all operations     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**                 |

### API Coverage

- ✅ `/api/ledger` - List accounts
- ✅ `/api/ledger/[id]` - Account details
- ✅ `/api/ledger/hierarchy` - Account tree
- ✅ `/api/ledger/create` - Create account
- ✅ `/api/ledger/update` - Update account
- ✅ `/api/ledger/archive` - Archive account

**Total Endpoints**: 6+

### Risks & Blockers

| Risk                       | Impact | Mitigation                                           |
| -------------------------- | ------ | ---------------------------------------------------- |
| DnD validator complexity   | HIGH   | Implement validator with comprehensive test coverage |
| A11y keyboard DnD fallback | HIGH   | Provide alternative button/menu-based reparenting    |
| Large tenant performance   | MED    | Server pagination + virtualization + feature flag    |
| Hierarchy loop detection   | HIGH   | Server-side validator with visited-set algorithm     |

---

## 🎯 3 Killer Features

### 1. **Hierarchical Account Tree with Drag-and-Drop** 🌳

**Description**: Interactive visual tree showing account hierarchies with ability to reorganize via drag-and-drop.

**Why It's Killer**:

- Visual representation makes complex structures easy to understand
- Drag-and-drop enables intuitive account reorganization
- Real-time validation prevents invalid moves
- Beats competitors (QuickBooks, Xero) with better UX
- **Keyboard alternative**: Button-based reparenting for accessibility compliance

**Implementation**:

```typescript
import { Tree, TreeNode } from "aibos-ui/components";

<Tree
  data={accountHierarchy}
  draggable
  onDragEnd={handleReorganize}
  renderNode={(node) => (
    <AccountNode account={node} level={node.depth} balance={node.balance} />
  )}
  keyboardAlternative={<ReparentMenu />}
/>;
```

**DnD Validation Rules**:

- ✅ Allowed: Move within same `account_type` and `entity`
- ❌ Disallowed: Moving posting account under non-matching type
- ❌ Disallowed: Creating circular references (parent → child → parent)
- On drop: Validate → dry-run API → optimistic update → reconcile or rollback
- Log `Ledger.Account.Reparented` event with full context

### 2. **Smart Account Search with AI Suggestions** 🤖

**Description**: Intelligent search that understands natural language queries and suggests relevant accounts.

**Why It's Killer**:

- "expenses for office supplies" → finds correct expense accounts
- Learns from user behavior patterns
- Reduces training time for new users
- Industry-first AI-powered account lookup

**Implementation**:

```typescript
import { CommandPalette } from "aibos-ui/components";

<CommandPalette
  onSearch={handleAccountSearch}
  suggestions={aiSuggestions}
  placeholder="Search accounts (e.g., 'office expenses')"
  enableAI
  ariaLabel="Search chart of accounts"
  ariaLiveRegion="Search results updated"
/>;
```

### 3. **Live Balance Preview with Drill-Down** 📊

**Description**: Real-time account balances with instant drill-down to transactions.

**Why It's Killer**:

- Click any balance → see source transactions
- Multi-period comparison in one view
- Instant refresh (no page reload)
- Better than SAP/Oracle's slow drill-downs

**Implementation**:

```typescript
import { DataTable, Popover } from "aibos-ui/components";

<DataTable
  columns={[
    {
      key: "balance",
      render: (value, row) => (
        <Popover
          trigger={<BalanceCell value={value} />}
          content={
            <TransactionDrilldown
              accountId={row.id}
              maxTransactions={100}
              paginationSize={25}
            />
          }
        />
      ),
    },
  ]}
/>;
```

**Performance**: Fetch max 100 transactions; paginate at 25/page in popover.

---

## 🏗️ Technical Architecture

### UI Components Needed

#### 1. Account List Page (`/ledger`)

**Server/Client Boundary**: Server component with client islands for interactions

**Components**:

- `DataTable` (virtualized after ≥200 rows) - Main account listing
- `Button` - Create new account
- `Input` - Search/filter
- `Badge` - Account status (active/archived)
- `Tabs` - Active/Archived views

**File**: `apps/web/app/(dashboard)/ledger/page.tsx`  
**Strategy**: Server-side fetch + stream for initial load; client-side React Query for mutations

#### 2. Account Detail Page (`/ledger/[id]`)

**Server/Client Boundary**: Server component wrapper with client form

**Components**:

- `Card` - Account information
- `Form` - Edit account details (mark `"use client"`)
- `Select` - Account type, currency
- `Checkbox` - Is active, allow transactions
- `Button` - Save, Cancel, Archive

**File**: `apps/web/app/(dashboard)/ledger/[id]/page.tsx`  
**Cache Strategy**: `revalidateTag('ledger')` on mutations

#### 3. Account Hierarchy View (`/ledger/hierarchy`)

**Server/Client Boundary**: Client component for DnD interactions

**Components**:

- `Tree` - Hierarchical view (mark `"use client"`)
- `Breadcrumb` - Navigation
- `Button` - Expand all, Collapse all
- `Modal` - Create child account
- `ReparentMenu` - Keyboard DnD alternative

**File**: `apps/web/app/(dashboard)/ledger/hierarchy/page.tsx`  
**Feature Flag**: `flags.m1_ledger_dnd` gates DnD rollout

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                     | Target                | Measurement             |
| -------------------------- | --------------------- | ----------------------- |
| TTFB (staging)             | ≤ 70ms                | Server timing header    |
| Client TTI for `/ledger`   | ≤ 200ms               | Lighthouse CI           |
| Network requests (initial) | ≤ 4                   | Chrome DevTools         |
| UI bundle size             | ≤ 250KB gzipped       | Webpack bundle analyzer |
| Table virtualization       | After ≥ 200 rows      | DataTable config        |
| Server pagination          | Default 50/page       | API query param         |
| Search response (P95)      | < 150ms               | APM traces              |
| Hierarchy expansion (FPS)  | ≥ 45 fps (1000 nodes) | Performance profiler    |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard DnD alternative via buttons/menu
- **Focus Management**: Focus trap in modals; visible focus indicators
- **ARIA**: Live region for search results count; proper roles and labels
- **Screen Reader**: All interactions announced; balance updates communicated
- **Axe Target**: 0 serious/critical violations

### Security

| Layer           | Requirement                                      |
| --------------- | ------------------------------------------------ |
| RBAC Scopes     | `ledger.read`, `ledger.write`, `ledger.admin`    |
| Enforcement     | Server-side on all endpoints                     |
| Client Behavior | Hide non-permitted actions (buttons/menu items)  |
| Data Exposure   | Only show accounts user has permission to view   |
| Idempotency     | All mutations use auto-generated idempotency key |
| Rate Limiting   | Handled by BFF; UI shows appropriate toast       |

**Reference**: See `security-policy.json` for full threat model and controls.

#### UI Permissions Matrix

| Role         | View List | Search | Create | Edit | Archive | Reparent | Export | Bulk Ops |
| ------------ | --------- | ------ | ------ | ---- | ------- | -------- | ------ | -------- |
| ledger.read  | ✅        | ✅     | ❌     | ❌   | ❌      | ❌       | ✅     | ❌       |
| ledger.write | ✅        | ✅     | ✅     | ✅   | ❌      | ✅       | ✅     | ❌       |
| ledger.admin | ✅        | ✅     | ✅     | ✅   | ✅      | ✅       | ✅     | ✅       |

**UI Implementation**:

- Hide buttons/menu items for actions user lacks permission for
- Show permission-denied state if user navigates directly to restricted URL
- Display read-only view for `ledger.read` users on detail pages

### Reliability & Observability

- **SLO**: 99.9% successful responses on ledger endpoints
- **SLA Dashboards**: Real-time metrics on latency, error rate, throughput
- **Events Emitted**: `Ledger.Account.Created/Updated/Archived/Reparented`
- **Logging**: Structured logs with correlation IDs for all mutations
- **Tracing**: Distributed tracing across BFF → Kernel

---

## 🧬 Data & Domain Invariants

### Chart of Accounts Rules

| Rule                   | Enforcement                                              |
| ---------------------- | -------------------------------------------------------- |
| **Normal Balance**     | Asset/Expense = Debit; Liability/Equity/Revenue = Credit |
| **Posting Allowed**    | Only at Level 4/5; parents are headers only              |
| **Reparenting**        | Must preserve category lineage (Asset→Asset, etc.)       |
| **Parent Archive**     | Denied if parent has children or non-zero balance        |
| **Hierarchy Depth**    | Max 5 levels enforced server-side                        |
| **Circular Reference** | Prevented via server-side visited-set validator          |

### Currency & Rounding

- **Display**: Presentation currency from tenant settings
- **Rounding Policy**: HALF_UP / EVENT (from SSOT)
- **Multi-Currency Flag**: Show FX sensitivity badge on account card
- **Conversion**: Real-time rates from FX service (cache 15min)

### Archive Semantics

- **Soft Delete**: Set `effective_end_date`; maintain audit trail
- **Guard Rails**:
  - ❌ Deny if account used in open periods
  - ❌ Deny if non-zero balance exists
  - ❌ Deny if child accounts exist
  - ✅ Allow if all conditions clear

---

## 🎯 Drag-and-Drop Validation Rules

### Allowed Moves

- ✅ Within same `account_type` (Asset→Asset)
- ✅ Within same `entity_id`
- ✅ To parent at lower level (maintain max depth = 5)

### Disallowed Moves

- ❌ Cross-type (Asset→Liability)
- ❌ Cross-entity without permission
- ❌ Creating circular reference
- ❌ Moving posting account under header of different type
- ❌ Violating depth constraint

### Drop Flow

```
User drops account
  ↓
1. Client-side validation (fast fail)
  ↓
2. Dry-run API call: POST /api/ledger/reparent/validate
  ↓
3. Server validates + returns conflicts
  ↓
4. If valid: Optimistic UI update
  ↓
5. Actual mutation: POST /api/ledger/reparent
  ↓
6. On success: Emit event, invalidate cache
  ↓
7. On failure: Rollback optimistic update, show error
```

### Event Logging

```typescript
{
  event: "Ledger.Account.Reparented",
  account_id: "123",
  old_parent_id: "456",
  new_parent_id: "789",
  reason: "user_initiated",
  timestamp: "2025-10-06T12:34:56Z"
}
```

---

## 🚨 Error Handling & UX States

### All Possible States

| State          | UI Display                                | User Action                   |
| -------------- | ----------------------------------------- | ----------------------------- |
| **Empty**      | Empty state illustration + "Create first" | Button to create              |
| **Loading**    | Skeleton rows (5-10)                      | N/A                           |
| **Error**      | Error message + retry button              | Retry / contact support       |
| **Partial**    | Data + pagination controls                | Load more / jump to page      |
| **No Results** | "No accounts match filters"               | Clear filters / adjust search |
| **Conflict**   | Toast: "Changed on server" + diff view    | Review changes / force save   |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Submit State**: Button disabled until dirty & valid
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal

### Network Errors

| HTTP Status | UI Message                                     | Action              |
| ----------- | ---------------------------------------------- | ------------------- |
| 400         | "Invalid request. Check your input."           | Inline field errors |
| 401         | "Session expired. Please log in again."        | Redirect to login   |
| 403         | "You don't have permission for this action."   | Hide action         |
| 404         | "Account not found. It may have been deleted." | Return to list      |
| 409         | "This account was changed. Review conflicts."  | Show diff modal     |
| 422         | "Validation failed"                            | Inline errors       |
| 500         | "Something went wrong. Try again."             | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/ledger.json`.

### Page Titles & Headers

| Context        | Copy                 | i18n Key                 |
| -------------- | -------------------- | ------------------------ |
| List Page      | "Chart of Accounts"  | `ledger.list.title`      |
| Detail Page    | "Account Details"    | `ledger.detail.title`    |
| Hierarchy Page | "Account Hierarchy"  | `ledger.hierarchy.title` |
| Create Modal   | "Create New Account" | `ledger.create.title`    |
| Edit Mode      | "Edit Account"       | `ledger.edit.title`      |

### State Messages

| State             | Title                     | Message                                                                       | Action Button                  | i18n Key                    |
| ----------------- | ------------------------- | ----------------------------------------------------------------------------- | ------------------------------ | --------------------------- |
| Empty             | "No accounts yet"         | "Create your first account to get started"                                    | "Create Account"               | `ledger.empty.*`            |
| Loading           | —                         | —                                                                             | —                              | —                           |
| Error             | "Unable to load accounts" | "Something went wrong. Our team has been notified."                           | "Retry" / "Support"            | `ledger.error.*`            |
| No Results        | "No accounts found"       | "Try adjusting your filters or search terms"                                  | "Clear Filters"                | `ledger.noResults.*`        |
| Permission Denied | "Access restricted"       | "You don't have permission to view accounts. Contact your administrator."     | "Back to Dashboard"            | `ledger.permissionDenied.*` |
| Offline           | "You're offline"          | "Changes will sync when you reconnect to the internet"                        | "Dismiss"                      | `ledger.offline.*`          |
| Conflict (409)    | "Account was modified"    | "This account was changed by another user. Review the changes before saving." | "Review Changes" / "Overwrite" | `ledger.conflict.*`         |

### Action Confirmations

| Action       | Title                       | Message                                                            | Confirm Button | Cancel Button | i18n Key                       |
| ------------ | --------------------------- | ------------------------------------------------------------------ | -------------- | ------------- | ------------------------------ |
| Archive      | "Archive this account?"     | "This account will be hidden but can be restored later. Continue?" | "Archive"      | "Cancel"      | `ledger.archive.confirm.*`     |
| Bulk Archive | "Archive {count} accounts?" | "{count} accounts will be archived. This action can be undone."    | "Archive All"  | "Cancel"      | `ledger.bulkArchive.confirm.*` |
| Reparent     | "Move this account?"        | "Moving {account} under {newParent}. Confirm?"                     | "Move"         | "Cancel"      | `ledger.reparent.confirm.*`    |

### Success Messages (Toast)

| Action   | Message                                  | i18n Key                  |
| -------- | ---------------------------------------- | ------------------------- |
| Create   | "Account '{name}' created successfully"  | `ledger.create.success`   |
| Update   | "Account '{name}' updated successfully"  | `ledger.update.success`   |
| Archive  | "Account '{name}' archived successfully" | `ledger.archive.success`  |
| Reparent | "Account moved successfully"             | `ledger.reparent.success` |

### Error Messages (Toast)

| Scenario           | Message                                                     | i18n Key                        |
| ------------------ | ----------------------------------------------------------- | ------------------------------- |
| Create Failed      | "Failed to create account. Please try again."               | `ledger.create.error`           |
| Update Failed      | "Failed to update account. Please try again."               | `ledger.update.error`           |
| Archive Failed     | "Cannot archive account with non-zero balance"              | `ledger.archive.errorBalance`   |
| Duplicate Code     | "Account code already exists. Please use a different code." | `ledger.create.errorDuplicate`  |
| Invalid Parent     | "Cannot move account to this parent (type mismatch)"        | `ledger.reparent.errorType`     |
| Circular Reference | "Cannot move account: would create circular reference"      | `ledger.reparent.errorCircular` |
| Network Error      | "Network error. Check your connection and try again."       | `ledger.error.network`          |

### Form Labels & Help Text

| Field          | Label            | Placeholder                       | Help Text                                       | i18n Key                       |
| -------------- | ---------------- | --------------------------------- | ----------------------------------------------- | ------------------------------ |
| Code           | "Account Code"   | "e.g., 1000"                      | "Unique identifier for this account"            | `ledger.field.code.*`          |
| Name           | "Account Name"   | "e.g., Cash and Cash Equivalents" | "Descriptive name for this account"             | `ledger.field.name.*`          |
| Type           | "Account Type"   | "Select type"                     | "Asset, Liability, Equity, Revenue, or Expense" | `ledger.field.type.*`          |
| Parent         | "Parent Account" | "Select parent (optional)"        | "Leave blank for top-level account"             | `ledger.field.parent.*`        |
| Currency       | "Currency"       | "USD"                             | "Primary currency for this account"             | `ledger.field.currency.*`      |
| Normal Balance | "Normal Balance" | —                                 | "Automatically determined by account type"      | `ledger.field.normalBalance.*` |

### Keyboard Shortcuts Help

| Shortcut | Description             | i18n Key                    |
| -------- | ----------------------- | --------------------------- |
| `/`      | "Focus search"          | `ledger.shortcuts.search`   |
| `n`      | "Create new account"    | `ledger.shortcuts.new`      |
| `e`      | "Edit selected account" | `ledger.shortcuts.edit`     |
| `↑ / ↓`  | "Navigate rows"         | `ledger.shortcuts.navigate` |
| `Enter`  | "Open selected account" | `ledger.shortcuts.open`     |
| `Escape` | "Close modal/cancel"    | `ledger.shortcuts.cancel`   |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useLedger.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function useLedger(filters = {}) {
  const queryClient = useQueryClient();

  const {
    data: accounts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["ledger", "list", filters],
    queryFn: () => apiClient.GET("/api/ledger", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });

  const createAccount = useMutation({
    mutationFn: (data) => apiClient.POST("/api/ledger/create", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
    },
    onError: (error) => {
      // Map error to user-friendly message
      if (error.status === 409) {
        toast.error("Account code already exists");
      }
    },
  });

  const updateAccount = useMutation({
    mutationFn: ({ id, data }) =>
      apiClient.PUT("/api/ledger/[id]", { params: { id }, body: data }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      queryClient.invalidateQueries({ queryKey: ["ledger", "account", id] });
    },
  });

  const archiveAccount = useMutation({
    mutationFn: (id) => apiClient.POST("/api/ledger/archive", { body: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
    },
  });

  return {
    accounts: accounts || [],
    isLoading,
    error,
    createAccount: createAccount.mutate,
    updateAccount: updateAccount.mutate,
    archiveAccount: archiveAccount.mutate,
  };
}

export function useAccountHierarchy() {
  return useQuery({
    queryKey: ["ledger", "hierarchy"],
    queryFn: () => apiClient.GET("/api/ledger/hierarchy"),
    staleTime: 5 * 60_000, // 5min
    select: (response) => response.data,
  });
}

export function useAccount(id: string) {
  return useQuery({
    queryKey: ["ledger", "account", id],
    queryFn: () => apiClient.GET("/api/ledger/[id]", { params: { id } }),
    staleTime: 60_000, // 1min
    enabled: !!id,
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error        | User Message                                  | UI Action            |
| ---------------- | --------------------------------------------- | -------------------- |
| 409 (Conflict)   | "This account was modified. Review changes."  | Show conflict modal  |
| 422 (Validation) | Field-specific errors from response           | Inline form errors   |
| 403 (Forbidden)  | "You don't have permission"                   | Hide action buttons  |
| 500 (Server)     | "Something went wrong. Our team is notified." | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for mutations

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["ledger", "list", { filters }][("ledger", "account", accountId)][
  ("ledger", "hierarchy")
];
```

### Invalidation Rules

| Action          | Invalidates                                         |
| --------------- | --------------------------------------------------- |
| Create Account  | `["ledger"]` (all lists), `["ledger", "hierarchy"]` |
| Update Account  | `["ledger"]`, `["ledger", "account", id]`           |
| Archive Account | `["ledger"]`                                        |
| Reparent (DnD)  | `["ledger", "hierarchy"]`, `["ledger"]`             |

### Stale Time

| Query Type     | Stale Time | Reasoning                           |
| -------------- | ---------- | ----------------------------------- |
| Account List   | 30s        | Frequent updates; balance real-time |
| Account Detail | 1min       | Less frequently changed             |
| Hierarchy      | 5min       | Structure changes infrequently      |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("ledger"); // After mutations
revalidateTag(`ledger-${accountId}`); // Specific account
```

---

## 📝 Implementation Guide

### Step 0: Foundation Setup (1 hour)

```powershell
# Feature flag + analytics provider
# Verify directory structure
```

**Setup**:

- Enable feature flag: `flags.m1_ledger_dnd`
- Wire analytics provider for event tracking
- Configure observability (Sentry/Datadog)

### Step 1: Create Base Layout (1 hour)

```powershell
# Create directory structure
mkdir -p apps/web/app/(dashboard)/ledger/[id]
mkdir -p apps/web/app/(dashboard)/ledger/hierarchy
mkdir -p apps/web/hooks
mkdir -p apps/web/components/ledger
```

### Step 2: Build API Hooks (2 hours)

Create `apps/web/hooks/useLedger.ts` with all necessary hooks as shown above.

**Critical**:

- Use `useQueryClient()` for invalidation
- Set `staleTime`, `retry`, and `select` on all queries
- Map errors to user-friendly messages

### Step 3: Build Account List Page (4 hours)

```typescript
// apps/web/app/(dashboard)/ledger/page.tsx
import { DataTable, Button, Badge, Tabs } from "aibos-ui";
import { useLedger } from "@/hooks/useLedger";
import { useRouter } from "next/navigation";

export default function LedgerPage() {
  const router = useRouter();
  const { accounts, createAccount, archiveAccount } = useLedger();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Chart of Accounts</h1>
        <Button onClick={() => setShowCreate(true)}>Create Account</Button>
      </div>

      <Tabs
        tabs={[
          {
            label: "Active",
            content: (
              <DataTable
                data={accounts.filter((a) => a.is_active)}
                columns={[
                  { key: "code", label: "Code" },
                  { key: "name", label: "Name" },
                  { key: "type", label: "Type" },
                  {
                    key: "balance",
                    label: "Balance",
                    align: "right",
                    render: (v) => formatCurrency(v),
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (v) => <Badge color="success">Active</Badge>,
                  },
                ]}
                onRowClick={(row) => router.push(`/ledger/${row.id}`)}
                enableSearch
                enableSorting
                enablePagination
                pageSize={50}
                virtualizeAfter={200}
              />
            ),
          },
          {
            label: "Archived",
            content: <ArchivedAccountsTable />,
          },
        ]}
      />
    </div>
  );
}
```

**Server-side search**: Drive filters via URL query params, not just client-side.

### Step 4: Build Account Detail Page (3 hours)

```typescript
// apps/web/app/(dashboard)/ledger/[id]/page.tsx
import { Card, Form, Input, Select, Button } from "aibos-ui";
import { useAccount } from "@/hooks/useLedger";

export default function AccountDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { account, updateAccount } = useAccount(params.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <Form
          defaultValues={account}
          onSubmit={updateAccount}
          schema={accountSchema}
        >
          <Input name="code" label="Account Code" required />
          <Input name="name" label="Account Name" required />
          <Select
            name="type"
            label="Account Type"
            options={[
              { value: "asset", label: "Asset" },
              { value: "liability", label: "Liability" },
              { value: "equity", label: "Equity" },
              { value: "revenue", label: "Revenue" },
              { value: "expense", label: "Expense" },
            ]}
          />
          <Select
            name="parent_id"
            label="Parent Account"
            options={parentAccounts}
          />
          <div className="flex gap-4">
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleArchive}>
              Archive
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
```

**Note**: Mark form components with `"use client"` directive at top of file.

### Step 5: Build Hierarchy View (4 hours)

```typescript
// apps/web/app/(dashboard)/ledger/hierarchy/page.tsx
"use client";

import { Tree, Button, Modal } from "aibos-ui";
import { useAccountHierarchy, useReparent } from "@/hooks/useLedger";

export default function HierarchyPage() {
  const { hierarchy } = useAccountHierarchy();
  const { reparent } = useReparent();

  const handleDrop = async (node, newParent) => {
    // 1. Client-side validation (fast fail)
    if (!validateReparent(node, newParent)) {
      toast.error("Invalid move");
      return;
    }

    // 2. Dry-run API call
    const validation = await apiClient.POST("/api/ledger/reparent/validate", {
      body: { accountId: node.id, newParentId: newParent.id }
    });

    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    // 3. Optimistic update
    optimisticallyUpdateUI(node, newParent);

    // 4. Actual mutation
    try {
      await reparent({ accountId: node.id, newParentId: newParent.id });
      // 5. Success: emit event, invalidate
      analytics.track("Ledger.Account.Reparented", { ... });
    } catch (error) {
      // 6. Rollback on failure
      rollbackOptimisticUpdate();
      toast.error("Failed to reparent account");
    }
  };

  return (
    <div className="space-y-6">
      <Tree
        data={hierarchy}
        draggable
        onDragEnd={handleDrop}
        keyboardAlternative={<ReparentMenu />}
      />
    </div>
  );
}
```

**DnD Pattern**: Validator → dry-run → optimistic update → commit → reconcile/rollback

### Step 6: Add Tests (2 hours)

```typescript
// apps/web/app/(dashboard)/ledger/__tests__/page.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import LedgerPage from "../page";

describe("LedgerPage", () => {
  it("renders account list", async () => {
    render(<LedgerPage />);
    expect(await screen.findByText("Chart of Accounts")).toBeInTheDocument();
  });

  it("creates new account", async () => {
    render(<LedgerPage />);
    fireEvent.click(screen.getByText("Create Account"));
    // Assert modal opens
  });
});
```

---

## ✅ Testing Checklist

### Unit Tests

- [ ] DnD validator: all allowed/denied pairs (cross-type, circular, depth)
- [ ] Currency formatter with rounding policies (HALF_UP, EVENT)
- [ ] Archive guard rails (child exists, non-zero balance, open period)
- [ ] useLedger hook fetches accounts correctly
- [ ] useAccountHierarchy builds tree structure
- [ ] Form validation works for account creation
- [ ] Balance formatting displays correctly

### Integration Tests

- [ ] Create account → appears in list
- [ ] Update account → changes reflected
- [ ] Archive account → moves to archived tab
- [ ] Search filters accounts correctly
- [ ] Pagination + server filters (type, active, currency)
- [ ] Optimistic update rollback on 409 conflict

### E2E Tests

- [ ] User can navigate to ledger page
- [ ] User can create new account
- [ ] User can view account hierarchy
- [ ] User can edit account details
- [ ] User can archive account
- [ ] Keyboard-only flow: create → edit → archive
- [ ] Hierarchy: expand/collapse all; reparent persists after refresh

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Keyboard DnD alternative (buttons/menu) fully operable
- [ ] Screen reader announces changes
- [ ] Focus management correct (modals, forms)
- [ ] Color contrast meets WCAG 2.2 AAA
- [ ] Axe: 0 serious/critical violations

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for table, forms, tree
- [ ] Dark/light theme variations

### Performance Tests

- [ ] Bundle size < 250KB gzipped for page
- [ ] TTFB ≤ 70ms on staging
- [ ] Table renders 1,000+ rows smoothly (virtualization)

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/ledger.fixtures.ts`

**Datasets**:

- `minimalAccounts`: 5 accounts (1 per type)
- `standardAccounts`: 50 accounts across all types, depth 1-3
- `largeDataset`: 500 accounts, depth 1-5 (for virtualization testing)
- `edgeCases`: Accounts with special scenarios

**Edge Cases Covered**:

- Account with max depth (level 5)
- Account with very long name (100+ chars)
- Account with special characters in code
- Multiple currencies (USD, EUR, GBP, JPY, SGD)
- Archived accounts with children
- Accounts with zero and non-zero balances
- Accounts with all permission combinations

```typescript
// Example fixture structure
export const standardAccounts: AccountFixture[] = [
  {
    id: "acc_1",
    code: "1000",
    name: "Assets",
    type: "asset",
    normal_balance: "debit",
    is_active: true,
    level: 1,
    parent_id: null,
    balance: 1000000.0,
    currency: "USD",
  },
  // ... 49 more accounts
];
```

### E2E Seed Data

**Location**: `tests/seeds/ledger.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:ledger
```

**Dataset**:

- 100 accounts covering all types
- 3-level hierarchy for each type
- 10 archived accounts
- 5 accounts with transactions (non-zero balance)
- Multi-currency accounts (20% of total)

**Cleanup Command**:

```powershell
pnpm run seed:ledger:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic company structure: "Demo Corp Inc."
- 75 accounts based on common small business needs
- Includes all killer features:
  - Hierarchical structure (5 levels deep in one branch)
  - Multi-currency accounts (USD, EUR, GBP)
  - Sample balances from realistic transactions
- Account naming follows ERPNext/QuickBooks conventions

**Regeneration**:

```powershell
pnpm run demo:reset:ledger
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] No circular references in hierarchy
- [ ] All parent_id references exist
- [ ] Account types match parent types
- [ ] Normal balance aligns with account type
- [ ] No duplicate codes within same entity

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
- **Interactive Parts**: Mark with `"use client"` (forms, DnD, modals)

### Data Fetching Strategy

| Scenario     | Strategy                               | Benefit             |
| ------------ | -------------------------------------- | ------------------- |
| Initial List | Server-side fetch + stream             | Faster TTFB         |
| Mutations    | Client-side React Query                | Optimistic updates  |
| Detail Page  | Server component wrapper + client form | SEO + interactivity |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function createAccount(data) {
  // ... mutation logic
  revalidateTag("ledger");
  revalidateTag("ledger-list");
}
```

---

## 📊 Analytics & Audit Events

| Event                     | When               | Properties                                     |
| ------------------------- | ------------------ | ---------------------------------------------- |
| Ledger.Account.Viewed     | Detail page open   | `account_id`                                   |
| Ledger.Account.Created    | After 2xx response | `account_id`, `type`, `parent_id`, `currency`  |
| Ledger.Account.Updated    | After 2xx response | `account_id`, changed fields                   |
| Ledger.Account.Archived   | After 2xx response | `account_id`, `reason?`, `effective_date`      |
| Ledger.Account.Reparented | DnD success        | `account_id`, `old_parent_id`, `new_parent_id` |
| Ledger.Search.Performed   | Search executed    | `query`, `results_count`, `duration_ms`        |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Ledger.Account.Created", {
  account_id: account.id,
  type: account.type,
  parent_id: account.parent_id,
  currency: account.currency,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties; test with Arabic

### Keyboard Shortcuts

| Key      | Action                  | Scope          |
| -------- | ----------------------- | -------------- |
| `/`      | Focus search            | Ledger list    |
| `n`      | New account             | Ledger list    |
| `e`      | Edit selected account   | Account detail |
| `↑ / ↓`  | Navigate rows           | Table          |
| `Enter`  | Open selected account   | Table          |
| `Escape` | Close modal/cancel edit | Modal/Form     |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateModal()],
  ["e", () => router.push(`/ledger/${selectedId}`)],
]);
```

---

## 📅 Timeline & Milestones

| Day | Tasks                                           | Deliverable                 | Flag Status        |
| --- | ----------------------------------------------- | --------------------------- | ------------------ |
| 1   | Setup + Hooks + List Page                       | Basic account listing works | WIP                |
| 2   | Detail Page + CRUD + Archive guard rails        | CRUD operations complete    | WIP until tests ✅ |
| 3   | Hierarchy + DnD + Observability + A11y keyboard | Production-ready module     | GA                 |

**Total Effort**: 3 days (24 hours)

**Feature Flags**:

- Day 1-2: `flags.m1_ledger_dnd = false` (DnD hidden)
- Day 3: `flags.m1_ledger_dnd = true` after a11y keyboard alternative tested

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
  m1_ledger: true,              // Master toggle
  m1_ledger_dnd: false,         // DnD initially off
  m1_ledger_ai_search: false,   // AI search (phase 2)
  m1_ledger_bulk_ops: false,    // Bulk operations (phase 2)
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/ledger`, `/ledger/[id]`, `/ledger/hierarchy`)
- P50/P95/P99 latency
- Feature flag adoption rate
- User engagement (page views, actions per session)
- Bundle size compliance

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- P95 latency > 500ms for 10min → investigate
- Bundle size > 250KB → block deploy

### UI Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m1_ledger = false`

   ```powershell
   pnpm run flags:set m1_ledger=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("ledger");
   revalidateTag("ledger-list");
   revalidateTag("ledger-hierarchy");
   ```

3. **Clear CDN cache**:

   ```powershell
   # Vercel/Cloudflare
   pnpm run cache:purge --path="/ledger/*"
   ```

4. **Monitor for 15 minutes**:

   - Error rate drops below 0.1%
   - No new Sentry issues
   - Users see fallback message or previous version

5. **Post-mortem**:
   - Create incident report
   - Identify root cause
   - Add regression test
   - Plan fix + re-deploy

**Partial Rollback** (specific feature):

```typescript
// Disable only DnD if problematic
flags.m1_ledger_dnd = false;

// UI gracefully degrades to static hierarchy
```

**Rollback Decision Matrix**:

| Scenario                      | Action             | Approval Required |
| ----------------------------- | ------------------ | ----------------- |
| Error rate > 5%               | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%               | Partial rollback   | On-call engineer  |
| P95 latency > 1s              | Investigate first  | On-call engineer  |
| User complaints (< 10)        | Monitor            | PM decision       |
| Accessibility violation found | Partial rollback   | QA + PM           |
| Data corruption/loss          | Immediate rollback | No (auto-trigger) |

### Rollforward Plan

After fixing issues:

1. Deploy fix to staging
2. Run full regression suite
3. Enable for 1% of users (canary)
4. Monitor for 24h
5. Gradual rollout: 5% → 25% → 50% → 100%

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
- 🆕 Open period service (for archive guard)

### Blocks These Modules

- M2: Journal Entries (needs accounts)
- M3: Trial Balance (needs accounts)
- M4: Accounts Receivable (needs revenue accounts)
- M5: Accounts Payable (needs expense accounts)
- All other modules depend on this

---

## 🎯 Success Criteria

### Must Have (Measurable)

- [ ] Display all active accounts in table
- [ ] Create new accounts with validation (Zod)
- [ ] Edit existing accounts
- [ ] Archive accounts with guard rails (soft delete)
- [ ] View account hierarchy (tree visualization)
- [ ] Search returns results < 150ms (P95)
- [ ] Hierarchy expands ≥1,000 nodes smoothly (≥45 fps)
- [ ] Axe: 0 serious/critical violations

### Should Have

- [ ] Drag-and-drop hierarchy reorganization (feature flag)
- [ ] Keyboard DnD alternative (a11y compliant)
- [ ] Balance drill-down to transactions
- [ ] Export to CSV/Excel
- [ ] Bulk operations (archive multiple)

### Nice to Have

- [ ] AI-powered account suggestions
- [ ] Account usage analytics
- [ ] Duplicate detection
- [ ] Import from other systems

---

## 📚 References

### API Documentation

- OpenAPI spec: `packages/contracts/openapi/openapi.json`
- Type definitions: `packages/api-client/src/types.gen.ts`

### Design System

- Component library: `aibos-ui` package
- Design tokens: Import from `aibos-ui/tokens`
- Style guide: Follow dark-first theme [[memory:8119612]]

### Best Practices

- ERPNext patterns: Study ledger management
- QuickBooks: Chart of accounts UX
- Xero: Account hierarchy visualization
- Zoho: Search and filtering [[memory:8479381]]

---

## 🚨 Risk Mitigation

### Risk #1: Complex Hierarchy Operations

**Mitigation**: Start with simple list view; add hierarchy later; feature flag DnD

### Risk #2: Performance with Large Account Lists

**Mitigation**: Implement virtualization (≥200 rows), pagination (50/page), server-side search

### Risk #3: Data Validation Complexity

**Mitigation**: Reuse backend validation schemas via Zod contracts; server enforces all rules

### Risk #4: Hierarchy Loops (Circular References)

**Mitigation**: Server validator with visited-set algorithm; reject moves that create cycles

### Risk #5: Large Tenant Datasets (10,000+ accounts)

**Mitigation**: Server pagination + client virtualization + lazy loading hierarchy branches

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/ledger`, `/ledger/[id]`, `/ledger/hierarchy`)
- [ ] All CRUD operations working (Create, Read, Update, Archive)
- [ ] Archive guard rails enforced (child exists, non-zero balance, open period)
- [ ] DnD hierarchy with keyboard alternative (button-based reparenting)
- [ ] Search and filtering working (client + server-side)
- [ ] Pagination working (50 items/page default)
- [ ] Permissions enforced (UI hides/shows based on role)
- [ ] All error states handled gracefully
- [ ] Copy deck implemented (all i18n keys present)

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
- [ ] E2E tests: All user flows covered (create → edit → archive)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes (Chromatic/Percy)

**Critical Path Coverage** (must be ≥95%):

- Account creation flow
- Account update flow
- Account archive flow with guard rails
- Hierarchy reparent flow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/ledger/*` routes (webpack-bundle-analyzer)
- [ ] TTFB: ≤70ms on staging (Server-Timing header)
- [ ] TTI: ≤200ms for `/ledger` (Lighthouse CI)
- [ ] Network requests: ≤4 on initial load (Chrome DevTools)
- [ ] Virtualization: Enabled for ≥200 rows (DataTable config verified)

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `Ledger.Account.Viewed`
  - `Ledger.Account.Created`
  - `Ledger.Account.Updated`
  - `Ledger.Account.Archived`
  - `Ledger.Account.Reparented`
  - `Ledger.Search.Performed`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, latency)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Rate limiting tested (BFF layer)
- [ ] No sensitive data in logs/errors
- [ ] Security review completed

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete (changes, testing, screenshots)
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized (OpenAPI hash verified)
- [ ] i18n keys documented in copy deck
- [ ] User acceptance testing passed (PM/QA sign-off)

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m1_ledger = false` (ready to enable)
  - `flags.m1_ledger_dnd = false` (phase 2)
- [ ] Smoke tests passed on staging
- [ ] Load tests passed (≥1000 concurrent users)
- [ ] Deployed to production (flags off)
- [ ] Rollback procedure tested
- [ ] Gradual rollout plan ready (5% → 100%)

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All test plans executed and passed
- [ ] **Design**: UI matches specs, brand compliance
- [ ] **PM**: Feature complete, acceptance criteria met
- [ ] **Security**: Security review passed
- [ ] **Accessibility**: A11y audit passed

---

## 📏 Quality Gate Details

### Bundle Size Verification

```bash
# Check bundle size before merge
pnpm run build
pnpm run analyze:bundle

# Expected output
# Route: /ledger - 187KB gzipped ✅
# Route: /ledger/[id] - 145KB gzipped ✅
# Route: /ledger/hierarchy - 223KB gzipped ✅
```

### Coverage Report

```bash
# Generate coverage report
pnpm run test:coverage

# View HTML report
open coverage/index.html

# Verify thresholds
# Lines: 91.2% ✅ (≥90%)
# Statements: 90.8% ✅ (≥90%)
# Functions: 94.1% ✅ (≥90%)
# Branches: 89.3% ⚠️ (target ≥90%)
```

### Accessibility Audit

```bash
# Run Axe scan
pnpm run test:a11y

# Expected result:
# Serious: 0 ✅
# Critical: 0 ✅
# Moderate: 2 ⚠️ (acceptable)
# Minor: 3 ⚠️ (acceptable)
```

---

## 🧱 Reusable Runbook Core (Paste into All 40 Modules)

When creating runbooks for M2-M40, ensure each includes:

### 1. Ownership & Accountability

- **Module Owner** (eng lead)
- **Code Reviewer** (sr eng)
- **QA Lead**
- **Related ADRs** (links)

### 2. Non-Functional Requirements

- **Performance**: TTFB, TTI, bundle size, pagination, virtualization thresholds
- **Accessibility**: WCAG 2.2 AA (must), AAA (target), keyboard equivalents, ARIA, Axe targets
- **Security**: RBAC scopes, enforcement layer (server + client), idempotency, rate limits
- **Observability**: SLO/SLA, events emitted, logging strategy, tracing, dashboards

### 3. UI Permissions Matrix

| Role | Action1 | Action2 | Action3 | ... |
| ---- | ------- | ------- | ------- | --- |

Document exactly what each role can see/do in the UI.

### 4. Domain Invariants

- Business rules & constraints specific to module
- Data validation rules (Zod schemas)
- Archive/delete semantics
- State machine (if applicable)

### 5. UX Copy Deck

Complete table covering:

- **Page titles** + i18n keys
- **All states**: empty, loading, error, no-results, permission-denied, offline, conflict
- **Confirmations**: archive, delete, bulk operations
- **Success/error toasts**: all scenarios
- **Form labels**: all fields with help text
- **Keyboard shortcuts**: help menu content

### 6. API Contract Sync

- OpenAPI generation CI check (fail build on drift)
- Type-safe hook layer (only generated types, no ad-hoc shapes)
- Contract tests (Pact or schema validation)

### 7. State & Caching

- **React Query keys**: structure for all queries
- **Invalidation map**: what invalidates what
- **Stale time**: per query type with reasoning
- **Cache tags**: Next.js revalidation strategy

### 8. Error Handling

- **All UI states**: empty, loading, error, partial, no-results, conflict, permission-denied, offline
- **HTTP status mapping**: status code → user message → UI action
- **Network error mapping**: timeout, offline, server error
- **Form validation**: inline errors, submit states

### 9. Test Data & Fixtures

- **Storybook fixtures**: location, datasets (minimal, standard, large, edge cases)
- **E2E seed data**: location, seed/cleanup commands
- **Demo dataset**: characteristics, regeneration command
- **Edge cases**: list of special scenarios covered

### 10. Testing Matrix

- **Unit**: logic, validation, formatting, edge cases
- **Integration**: API + UI interactions, optimistic updates
- **E2E**: critical user flows
- **Accessibility**: keyboard, screen reader, Axe audit
- **Contract**: OpenAPI conformance
- **Visual regression**: Storybook/Ladle snapshots
- **Performance**: bundle size, load tests

### 11. Quality Gates (CI-Enforced)

**Measurable Thresholds**:

- Coverage: ≥90% lines, ≥95% critical paths
- Bundle: ≤250KB gzipped (or module-specific)
- Lighthouse: Performance ≥90, Accessibility ≥95
- Axe: 0 serious, 0 critical
- TypeScript: 0 errors
- ESLint: 0 errors

### 12. Rollout & Rollback

- **Environment gates**: dev → staging → canary → GA
- **Feature flags**: names, defaults, gradual rollout %
- **Success criteria**: per environment
- **Rollback procedure**: step-by-step UI rollback (< 5min)
- **Rollback triggers**: error rate, latency, user complaints
- **Monitoring dashboard**: key metrics + alert thresholds

### 13. Analytics & Audit

- **Event names**: `Module.Entity.Action` format
- **Properties**: for each event
- **When fired**: trigger conditions
- **Dashboard requirements**: KPIs, success metrics

### 14. SLO/SLA

- **Numeric targets**: latency (P95), error rate, availability
- **Measurement method**: APM, logs, synthetic monitors
- **Dashboard links**: where to view real-time metrics
- **Error budget policy**: when to stop deployments

### 15. DoR / DoD

- **Definition of Ready**: deps ready, designs final, flags provisioned, contracts frozen
- **Definition of Done**: comprehensive checklist with sign-offs (functional, quality gates, observability, security, documentation, deployment)

### 16. References (SSOT Links)

- **Security**: Link to `security-policy.json` (don't duplicate threat model)
- **Compliance**: Link to `COMPLIANCE.md` (don't duplicate PII/residency rules)
- **Migrations**: Link to `DATABASE_WORKFLOW.md` (document UI impact only)
- **Architecture**: Link to `ARCHITECTURE.md` (don't duplicate API dependency map)
- **Cost/Scaling**: Link to `PERFORMANCE-BUDGETS.md` (document UI budgets only)

---

## ✍️ Code-Level Notes

### Import Router

```typescript
import { useRouter } from "next/navigation"; // Missing in Step 3 example
```

### Server Actions Preferred

For mutations, prefer **server actions** where suitable (especially create/update/archive):

```typescript
// app/actions/ledger.ts
"use server";

import { revalidateTag } from "next/cache";

export async function createAccount(data: AccountInput) {
  const account = await ledgerService.create(data);
  revalidateTag("ledger");
  return account;
}
```

### Client Directive

Add `"use client"` at top of files using hooks, state, or event handlers:

```typescript
"use client";

import { useState } from "react";
import { useLedger } from "@/hooks/useLedger";
```

---

**Ready to build? Start with Step 0! 🚀**

**Next Module**: M2 - Journal Entries (depends on M1)
