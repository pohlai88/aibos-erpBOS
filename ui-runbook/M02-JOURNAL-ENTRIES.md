# 🚀 M2: Journal Entries - UI Implementation Runbook

**Module ID**: M2  
**Module Name**: Journal Entries  
**Priority**: CRITICAL  
**Phase**: 1 - Foundation  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

The Journal Entries module is the **core transaction engine** of the ERP system. Every financial transaction in the system flows through journal entries, making it the most critical operational module.

### Business Value

- Foundation for all accounting transactions
- Enables manual adjustments and corrections
- Supports bulk import from external systems
- Provides audit trail for all financial activities
- Required for month-end close processes

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-003-journal-auto-balance], [ADR-004-journal-reversal-logic]

---

## 📊 Current Status

| Layer         | Status  | Details                              |
| ------------- | ------- | ------------------------------------ |
| **Database**  | ✅ 100% | Complete schema with entry lines     |
| **Services**  | ✅ 100% | Journal service with posting logic   |
| **API**       | ✅ 100% | Full CRUD + posting + reversal       |
| **Contracts** | ✅ 100% | Type-safe schemas for all operations |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**             |

### API Coverage

- ✅ `/api/journals` - List entries
- ✅ `/api/journals/[id]` - Entry details
- ✅ `/api/journals/create` - Create entry
- ✅ `/api/journals/post` - Post entry
- ✅ `/api/journals/reverse` - Reverse entry
- ✅ `/api/journals/import` - Bulk import
- ✅ `/api/journals/validate` - Pre-posting validation

**Total Endpoints**: 10+

### Risks & Blockers

| Risk                          | Impact | Mitigation                                               | Owner       |
| ----------------------------- | ------ | -------------------------------------------------------- | ----------- |
| Balance validation complexity | HIGH   | Implement real-time validation with clear error messages | @dev        |
| Posting performance issues    | MED    | Batch posting with background jobs for large entries     | @backend    |
| Data entry UX complexity      | HIGH   | Extensive user testing + ERPNext pattern study           | @design     |
| Reversal audit requirements   | HIGH   | Complete audit trail with immutable logs                 | @compliance |

---

## 🎯 3 Killer Features

### 1. **Smart Line Entry with Auto-Balance** ⚖️

**Description**: Intelligent journal line entry that auto-calculates the balancing entry and suggests accounts.

**Why It's Killer**:

- Automatically balances debits and credits in real-time
- Suggests balancing account based on entry pattern
- Prevents unbalanced entries at data entry time
- Reduces errors by 95% vs manual entry
- No competitor has this level of intelligence

**Implementation**:

```typescript
import { Form, DataGrid } from "aibos-ui";

<JournalLineGrid
  lines={lines}
  onChange={handleLinesChange}
  autoBalance={{
    enabled: true,
    suggestAccount: true,
    showWarnings: true,
  }}
  validation={{
    mustBalance: true,
    realTimeValidation: true,
  }}
/>;

// Auto-balance logic
const debitTotal = lines.reduce((sum, l) => sum + l.debit, 0);
const creditTotal = lines.reduce((sum, l) => sum + l.credit, 0);
const imbalance = debitTotal - creditTotal;

if (imbalance !== 0) {
  // Suggest balancing line
  const suggestedLine = {
    account: predictBalancingAccount(lines),
    debit: imbalance < 0 ? Math.abs(imbalance) : 0,
    credit: imbalance > 0 ? imbalance : 0,
    description: "Auto-balance entry",
  };
}
```

### 2. **One-Click Reversal with Audit Trail** 🔄

**Description**: Reverse any posted journal entry with a single click, maintaining complete audit trail.

**Why It's Killer**:

- Instant reversal (vs manual re-entry in QuickBooks)
- Maintains link between original and reversal
- Shows complete reversal history
- Prevents manual errors in reversal entries
- Industry-leading audit compliance

**Implementation**:

```typescript
import { Button, Modal, Timeline } from "aibos-ui";

<Button
  onClick={handleReverse}
  variant="destructive"
  disabled={!entry.is_posted || entry.is_reversed}
>
  Reverse Entry
</Button>

<Modal title="Confirm Reversal">
  <ReversalPreview entry={entry} />
  <Timeline
    items={[
      { date: entry.post_date, event: "Original entry posted" },
      { date: new Date(), event: "Reversal will be created" }
    ]}
  />
  <Button onClick={confirmReversal}>Confirm Reversal</Button>
</Modal>
```

### 3. **Template Library with AI Learning** 📚

**Description**: Pre-built journal entry templates that learn from user patterns and suggest improvements.

**Why It's Killer**:

- 50+ built-in templates for common entries
- AI learns from your entries and creates custom templates
- One-click entry creation from template
- Reduces entry time by 80%
- Better than SAP/Oracle template systems

**Implementation**:

```typescript
import { CommandPalette, Card } from "aibos-ui";

<CommandPalette
  placeholder="Search templates or create from scratch"
  onSelect={handleTemplateSelect}
  groups={[
    {
      label: "Common Templates",
      items: [
        { id: "accrual", label: "Accrual Entry", icon: "📝" },
        { id: "depreciation", label: "Depreciation", icon: "📉" },
        { id: "reclassification", label: "Reclassification", icon: "🔄" }
      ]
    },
    {
      label: "AI Suggested",
      items: aiSuggestedTemplates
    }
  ]}
/>

<TemplateGallery
  templates={templates}
  onUse={createFromTemplate}
  onSaveAsTemplate={saveCurrentAsTemplate}
/>
```

---

## 🏗️ Technical Architecture

### UI Components Needed

#### 1. Journal Entry List (`/journals`)

**Components**:

- `DataTable` - Main entry listing
- `Button` - Create, Import, Export
- `DateRangePicker` - Filter by date
- `Badge` - Status (draft, posted, reversed)
- `MultiSelect` - Bulk operations

**File**: `apps/web/app/(dashboard)/journals/page.tsx`

#### 2. Journal Entry Detail (`/journals/[id]`)

**Components**:

- `Card` - Entry header (date, description, total)
- `DataGrid` - Entry lines (editable)
- `Form` - Entry metadata
- `Button` - Save, Post, Reverse
- `Alert` - Validation warnings

**File**: `apps/web/app/(dashboard)/journals/[id]/page.tsx`

#### 3. Create Journal Entry (`/journals/create`)

**Components**:

- `Form` - Entry header form
- `DataGrid` - Line entry grid
- `Select` - Template selection
- `Button` - Add line, Remove line
- `Card` - Balance summary

**File**: `apps/web/app/(dashboard)/journals/create/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                     | Target             | Measurement             |
| -------------------------- | ------------------ | ----------------------- |
| TTFB (staging)             | ≤ 70ms             | Server timing header    |
| Client TTI for `/journals` | ≤ 200ms            | Lighthouse CI           |
| Network requests (initial) | ≤ 4                | Chrome DevTools         |
| UI bundle size             | ≤ 250KB gzipped    | Webpack bundle analyzer |
| Line entry latency         | < 50ms             | Performance profiler    |
| Server pagination          | Default 50/page    | API query param         |
| Search response (P95)      | < 150ms            | APM traces              |
| Posting operation          | < 2s for 100 lines | APM traces              |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard support for line entry (Tab, Enter, Arrow keys)
- **Focus Management**: Focus trap in modals; visible focus indicators on grid cells
- **ARIA**: Live region for balance updates; proper roles for data grid
- **Screen Reader**: All interactions announced; balance validation communicated
- **Axe Target**: 0 serious/critical violations

### Security

| Layer           | Requirement                                                            |
| --------------- | ---------------------------------------------------------------------- |
| RBAC Scopes     | `journals.read`, `journals.write`, `journals.post`, `journals.reverse` |
| Enforcement     | Server-side on all endpoints                                           |
| Client Behavior | Hide post/reverse actions based on permissions                         |
| Data Exposure   | Only show entries user has permission to view                          |
| Idempotency     | All mutations use auto-generated idempotency key                       |
| Rate Limiting   | Handled by BFF; UI shows appropriate toast                             |
| Audit Trail     | All actions logged with user + timestamp                               |

**Reference**: See `security-policy.json` for full threat model and controls.

#### UI Permissions Matrix

| Role             | View List | Search | Create | Edit Draft | Post | Reverse | Import | Export | Delete |
| ---------------- | --------- | ------ | ------ | ---------- | ---- | ------- | ------ | ------ | ------ |
| journals.read    | ✅        | ✅     | ❌     | ❌         | ❌   | ❌      | ❌     | ✅     | ❌     |
| journals.write   | ✅        | ✅     | ✅     | ✅         | ❌   | ❌      | ✅     | ✅     | ❌     |
| journals.post    | ✅        | ✅     | ✅     | ✅         | ✅   | ❌      | ✅     | ✅     | ❌     |
| journals.reverse | ✅        | ✅     | ✅     | ✅         | ✅   | ✅      | ✅     | ✅     | ✅     |

**UI Implementation**:

- Hide post/reverse buttons for users without permissions
- Show read-only view for `journals.read` users
- Display permission-denied state if user navigates directly to restricted action

### Reliability & Observability

- **SLO**: 99.9% successful responses on journal endpoints
- **SLA Dashboards**: Real-time metrics on latency, error rate, posting throughput
- **Events Emitted**: `Journal.Entry.Created/Posted/Reversed/Imported`
- **Logging**: Structured logs with correlation IDs for all mutations
- **Tracing**: Distributed tracing across BFF → Kernel → Database

---

## 🧬 Data & Domain Invariants

### Journal Entry Business Rules

| Rule                    | Enforcement                                     |
| ----------------------- | ----------------------------------------------- |
| **Balance Requirement** | Total debits must equal total credits exactly   |
| **Min Lines**           | Minimum 2 lines (debit + credit) required       |
| **Posting Rules**       | Only balanced, validated entries can be posted  |
| **Reversal Rules**      | Only posted entries can be reversed             |
| **Immutability**        | Posted entries cannot be edited (only reversed) |
| **Audit Trail**         | All changes logged with user, timestamp, reason |
| **Period Validation**   | Cannot post to closed periods                   |

### Currency & Rounding

- **Display**: Presentation currency from tenant settings
- **Rounding Policy**: HALF_UP to 2 decimal places (configurable)
- **Multi-Currency**: Support foreign currency entries with exchange rates
- **FX Gains/Losses**: Auto-calculate and post FX differences

### Archive/Delete Semantics

- **Draft Entries**: Can be deleted permanently
- **Posted Entries**: Cannot be deleted; must be reversed
- **Reversal Entries**: Cannot be deleted or edited
- **Guard Rails**:
  - ❌ Deny delete if status = 'posted'
  - ❌ Deny edit if status = 'posted' or 'reversed'
  - ✅ Allow delete if status = 'draft'

---

## 🚨 Error Handling & UX States

### All Possible States

| State          | UI Display                                 | User Action                   |
| -------------- | ------------------------------------------ | ----------------------------- |
| **Empty**      | "No journal entries yet" + Create button   | Create first entry            |
| **Loading**    | Skeleton rows (5-10)                       | N/A                           |
| **Error**      | Error message + retry button               | Retry / contact support       |
| **Partial**    | Data + pagination controls                 | Load more / jump to page      |
| **No Results** | "No entries match filters"                 | Clear filters / adjust search |
| **Unbalanced** | "Entry out of balance" + difference amount | Fix line amounts              |
| **Conflict**   | "Entry was modified by another user"       | Review changes / reload       |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Real-time Balance**: Show debit/credit totals and difference in real-time
- **Line Validation**: Validate each line (account required, amount > 0)
- **Submit State**: Disable save/post until entry is balanced and valid

### Network Errors

| HTTP Status | UI Message                                    | Action              |
| ----------- | --------------------------------------------- | ------------------- |
| 400         | "Invalid entry. Check line details."          | Inline field errors |
| 401         | "Session expired. Please log in again."       | Redirect to login   |
| 403         | "You don't have permission to post entries."  | Hide post button    |
| 404         | "Entry not found. It may have been deleted."  | Return to list      |
| 409         | "Entry was modified. Review changes."         | Show diff modal     |
| 422         | "Entry out of balance or invalid."            | Inline errors       |
| 500         | "Posting failed. Our team has been notified." | Retry button        |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useJournals.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function useJournals(filters = {}) {
  const { data, isLoading } = useQuery({
    queryKey: ["journals", filters],
    queryFn: () => apiClient.GET("/api/journals", { query: filters }),
  });

  const createEntry = useMutation({
    mutationFn: (data) =>
      apiClient.POST("/api/journals/create", { body: data }),
    onSuccess: () => queryClient.invalidateQueries(["journals"]),
  });

  const postEntry = useMutation({
    mutationFn: (id) => apiClient.POST("/api/journals/post", { body: { id } }),
    onSuccess: () => queryClient.invalidateQueries(["journals"]),
  });

  const reverseEntry = useMutation({
    mutationFn: (id) =>
      apiClient.POST("/api/journals/reverse", { body: { id } }),
    onSuccess: () => queryClient.invalidateQueries(["journals"]),
  });

  return {
    entries: data?.data || [],
    isLoading,
    createEntry: createEntry.mutate,
    postEntry: postEntry.mutate,
    reverseEntry: reverseEntry.mutate,
  };
}

export function useJournalEntry(id: string) {
  return useQuery({
    queryKey: ["journals", id],
    queryFn: () => apiClient.GET("/api/journals/[id]", { params: { id } }),
    enabled: !!id,
  });
}

export function useJournalValidation() {
  return useMutation({
    mutationFn: (entry) =>
      apiClient.POST("/api/journals/validate", { body: entry }),
  });
}
```

### Error Mapping

| API Error        | User Message                                  | UI Action            |
| ---------------- | --------------------------------------------- | -------------------- |
| 409 (Conflict)   | "Entry was modified. Review changes."         | Show diff modal      |
| 422 (Validation) | "Entry out of balance or validation failed."  | Inline form errors   |
| 403 (Forbidden)  | "You don't have permission for this action."  | Hide action buttons  |
| 500 (Server)     | "Posting failed. Our team has been notified." | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for posting operations

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/journals.json`.

### Page Titles & Headers

| Context       | Copy                   | i18n Key                 |
| ------------- | ---------------------- | ------------------------ |
| List Page     | "Journal Entries"      | `journals.list.title`    |
| Detail Page   | "Entry Details"        | `journals.detail.title`  |
| Create Page   | "Create Journal Entry" | `journals.create.title`  |
| Edit Page     | "Edit Journal Entry"   | `journals.edit.title`    |
| Post Modal    | "Post Entry?"          | `journals.post.title`    |
| Reverse Modal | "Reverse Entry?"       | `journals.reverse.title` |

### State Messages

| State             | Title                    | Message                                                       | Action Button       | i18n Key                      |
| ----------------- | ------------------------ | ------------------------------------------------------------- | ------------------- | ----------------------------- |
| Empty             | "No entries yet"         | "Create your first journal entry to get started"              | "Create Entry"      | `journals.empty.*`            |
| Loading           | —                        | —                                                             | —                   | —                             |
| Error             | "Unable to load entries" | "Something went wrong. Our team has been notified."           | "Retry" / "Support" | `journals.error.*`            |
| No Results        | "No entries found"       | "Try adjusting your filters or search terms"                  | "Clear Filters"     | `journals.noResults.*`        |
| Permission Denied | "Access restricted"      | "You don't have permission to view journal entries."          | "Back to Dashboard" | `journals.permissionDenied.*` |
| Offline           | "You're offline"         | "Entry will be saved when you reconnect"                      | "Dismiss"           | `journals.offline.*`          |
| Unbalanced        | "Entry out of balance"   | "Debits and credits must be equal before saving"              | "Review Amounts"    | `journals.unbalanced.*`       |
| Conflict (409)    | "Entry was modified"     | "This entry was changed by another user. Review the changes." | "Review Changes"    | `journals.conflict.*`         |

### Action Confirmations

| Action  | Title                 | Message                                                      | Confirm Button | Cancel Button | i18n Key                     |
| ------- | --------------------- | ------------------------------------------------------------ | -------------- | ------------- | ---------------------------- |
| Post    | "Post this entry?"    | "This entry will be posted to the general ledger. Continue?" | "Post Entry"   | "Cancel"      | `journals.post.confirm.*`    |
| Reverse | "Reverse this entry?" | "A reversal entry will be created. This cannot be undone."   | "Reverse"      | "Cancel"      | `journals.reverse.confirm.*` |
| Delete  | "Delete this entry?"  | "This draft entry will be permanently deleted."              | "Delete"       | "Cancel"      | `journals.delete.confirm.*`  |

### Success Messages (Toast)

| Action  | Message                                      | i18n Key                   |
| ------- | -------------------------------------------- | -------------------------- |
| Create  | "Entry saved as draft"                       | `journals.create.success`  |
| Post    | "Entry posted successfully (ID: {entry_id})" | `journals.post.success`    |
| Reverse | "Entry reversed successfully"                | `journals.reverse.success` |
| Import  | "{count} entries imported successfully"      | `journals.import.success`  |

### Error Messages (Toast)

| Scenario         | Message                                                        | i18n Key                      |
| ---------------- | -------------------------------------------------------------- | ----------------------------- |
| Create Failed    | "Failed to save entry. Please try again."                      | `journals.create.error`       |
| Post Failed      | "Failed to post entry. Check balance and try again."           | `journals.post.error`         |
| Unbalanced Entry | "Entry out of balance by {amount}. Debits must equal credits." | `journals.errorUnbalanced`    |
| No Lines         | "Entry must have at least 2 lines."                            | `journals.errorNoLines`       |
| Period Closed    | "Cannot post to closed period."                                | `journals.errorClosedPeriod`  |
| Already Posted   | "Entry is already posted and cannot be modified."              | `journals.errorAlreadyPosted` |
| Network Error    | "Network error. Check your connection and try again."          | `journals.error.network`      |

### Form Labels & Help Text

| Field       | Label         | Placeholder      | Help Text                             | i18n Key                   |
| ----------- | ------------- | ---------------- | ------------------------------------- | -------------------------- |
| Date        | "Entry Date"  | "Select date"    | "Date the entry will be posted"       | `journals.field.date.*`    |
| Reference   | "Reference #" | "e.g., INV-001"  | "Optional reference number"           | `journals.field.ref.*`     |
| Description | "Description" | "e.g., Accrual"  | "Brief description of the entry"      | `journals.field.desc.*`    |
| Account     | "Account"     | "Select account" | "Chart of account to debit or credit" | `journals.field.account.*` |
| Debit       | "Debit"       | "0.00"           | "Amount to debit (left side)"         | `journals.field.debit.*`   |
| Credit      | "Credit"      | "0.00"           | "Amount to credit (right side)"       | `journals.field.credit.*`  |

### Keyboard Shortcuts Help

| Shortcut | Description           | i18n Key                     |
| -------- | --------------------- | ---------------------------- |
| `/`      | "Focus search"        | `journals.shortcuts.search`  |
| `n`      | "Create new entry"    | `journals.shortcuts.new`     |
| `e`      | "Edit selected entry" | `journals.shortcuts.edit`    |
| `p`      | "Post selected entry" | `journals.shortcuts.post`    |
| `Tab`    | "Next line/field"     | `journals.shortcuts.tab`     |
| `Enter`  | "Add new line"        | `journals.shortcuts.addLine` |
| `Escape` | "Close modal/cancel"  | `journals.shortcuts.cancel`  |

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["journals", "list", { filters }][("journals", "detail", entryId)][
  ("journals", "validate", entryId)
];
```

### Invalidation Rules

| Action        | Invalidates                                       |
| ------------- | ------------------------------------------------- |
| Create Entry  | `["journals"]`                                    |
| Post Entry    | `["journals"]`, `["ledger"]`, `["trial-balance"]` |
| Reverse Entry | `["journals"]`, `["ledger"]`, `["trial-balance"]` |
| Update Entry  | `["journals"]`, `["journals", "detail", id]`      |
| Delete Entry  | `["journals"]`                                    |

### Stale Time

| Query Type   | Stale Time | Reasoning                              |
| ------------ | ---------- | -------------------------------------- |
| Entry List   | 30s        | Frequent updates; real-time visibility |
| Entry Detail | 1min       | Less frequently changed                |
| Validation   | 0s         | Always fresh for accuracy              |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("journals"); // After mutations
revalidateTag(`journals-${entryId}`); // Specific entry
revalidateTag("ledger"); // After posting (affects ledger balances)
```

---

## 📝 Implementation Guide

### Step 1: Create Base Layout (30 min)

```bash
mkdir -p apps/web/app/(dashboard)/journals/[id]
mkdir -p apps/web/app/(dashboard)/journals/create
mkdir -p apps/web/components/journals
```

### Step 2: Build API Hooks (1 hour)

Create `apps/web/hooks/useJournals.ts` with all necessary hooks.

### Step 3: Build Journal List Page (3 hours)

```typescript
// apps/web/app/(dashboard)/journals/page.tsx
import { DataTable, Button, Badge, DateRangePicker } from "aibos-ui";
import { useJournals } from "@/hooks/useJournals";

export default function JournalsPage() {
  const [filters, setFilters] = useState({ status: "all" });
  const { entries, postEntry, reverseEntry } = useJournals(filters);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Journal Entries</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleImport}>
            Import
          </Button>
          <Button onClick={() => router.push("/journals/create")}>
            Create Entry
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <DateRangePicker onChange={handleDateFilter} label="Filter by Date" />
        <Select
          value={filters.status}
          onChange={(v) => setFilters({ ...filters, status: v })}
          options={[
            { value: "all", label: "All Entries" },
            { value: "draft", label: "Draft" },
            { value: "posted", label: "Posted" },
            { value: "reversed", label: "Reversed" },
          ]}
        />
      </div>

      <DataTable
        data={entries}
        columns={[
          { key: "entry_id", label: "Entry ID" },
          { key: "doc_date", label: "Date", render: formatDate },
          { key: "description", label: "Description" },
          {
            key: "total_debit",
            label: "Amount",
            align: "right",
            render: formatCurrency,
          },
          {
            key: "status",
            label: "Status",
            render: (status) => (
              <Badge
                color={
                  status === "posted"
                    ? "success"
                    : status === "reversed"
                    ? "error"
                    : "warning"
                }
              >
                {status}
              </Badge>
            ),
          },
        ]}
        actions={[
          {
            label: "Post",
            onClick: (row) => postEntry(row.id),
            show: (row) => row.status === "draft",
          },
          {
            label: "Reverse",
            onClick: (row) => reverseEntry(row.id),
            show: (row) => row.status === "posted" && !row.is_reversed,
          },
          {
            label: "View",
            onClick: (row) => router.push(`/journals/${row.id}`),
          },
        ]}
        onRowClick={(row) => router.push(`/journals/${row.id}`)}
        enableSearch
        enableSorting
        enablePagination
        pageSize={50}
      />
    </div>
  );
}
```

### Step 4: Build Entry Creation Page (4 hours)

```typescript
// apps/web/app/(dashboard)/journals/create/page.tsx
import { Form, Input, DataGrid, Card, Button } from "aibos-ui";
import { useJournals } from "@/hooks/useJournals";

export default function CreateJournalPage() {
  const [lines, setLines] = useState([{ account: "", debit: 0, credit: 0 }]);
  const { createEntry } = useJournals();

  const handleSubmit = (headerData) => {
    const entry = {
      ...headerData,
      lines: lines,
    };
    createEntry(entry);
  };

  const debitTotal = lines.reduce((sum, l) => sum + l.debit, 0);
  const creditTotal = lines.reduce((sum, l) => sum + l.credit, 0);
  const isBalanced = debitTotal === creditTotal && debitTotal > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Create Journal Entry</h1>

      <Card>
        <Form onSubmit={handleSubmit} schema={journalEntrySchema}>
          <div className="grid grid-cols-2 gap-4">
            <Input name="doc_date" label="Entry Date" type="date" required />
            <Input name="reference" label="Reference #" />
            <Textarea
              name="description"
              label="Description"
              className="col-span-2"
              required
            />
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Entry Lines</h3>
            <DataGrid
              data={lines}
              onChange={setLines}
              columns={[
                {
                  key: "account",
                  label: "Account",
                  type: "select",
                  options: accounts,
                  required: true,
                },
                {
                  key: "description",
                  label: "Line Description",
                  type: "text",
                },
                {
                  key: "debit",
                  label: "Debit",
                  type: "number",
                  align: "right",
                },
                {
                  key: "credit",
                  label: "Credit",
                  type: "number",
                  align: "right",
                },
              ]}
              editable
              onAddRow={() =>
                setLines([...lines, { account: "", debit: 0, credit: 0 }])
              }
              onRemoveRow={(index) =>
                setLines(lines.filter((_, i) => i !== index))
              }
            />
          </div>

          <Card className="mt-4 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Debit:</span>
              <span className="text-lg">{formatCurrency(debitTotal)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Credit:</span>
              <span className="text-lg">{formatCurrency(creditTotal)}</span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t">
              <span className="font-bold">Difference:</span>
              <span
                className={`text-lg font-bold ${
                  isBalanced ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(Math.abs(debitTotal - creditTotal))}
              </span>
            </div>
          </Card>

          {!isBalanced && (
            <Alert variant="error">
              Entry must be balanced before saving. Debit and credit totals must
              be equal.
            </Alert>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={!isBalanced}>
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSaveAndPost}
              disabled={!isBalanced}
            >
              Save and Post
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

### Step 5: Build Detail/Edit Page (3 hours)

Similar to create page but with view-only mode for posted entries.

### Step 6: Add Tests (2 hours)

```typescript
describe("Journal Entries", () => {
  it("creates balanced entry", async () => {
    // Test entry creation with balanced lines
  });

  it("prevents posting unbalanced entry", async () => {
    // Test validation
  });

  it("reverses posted entry", async () => {
    // Test reversal functionality
  });
});
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/journals.fixtures.ts`

**Datasets**:

- `minimalEntries`: 3 entries (draft, posted, reversed)
- `standardEntries`: 50 entries with various line counts (2-10 lines)
- `largeDataset`: 200 entries (for virtualization testing)
- `edgeCases`: Special scenarios

**Edge Cases Covered**:

- Entry with exactly 2 lines (minimal)
- Entry with 50 lines (stress test)
- Entry with foreign currency
- Entry with very large amounts (10M+)
- Reversal entries linked to originals
- Draft entries with various statuses

```typescript
// Example fixture structure
export const standardEntries: JournalEntryFixture[] = [
  {
    id: "je_001",
    entry_id: "JE-2025-001",
    doc_date: "2025-10-01",
    description: "Monthly depreciation",
    status: "posted",
    total_debit: 5000.0,
    total_credit: 5000.0,
    lines: [
      { account_id: "acc_dep_exp", debit: 5000, credit: 0 },
      { account_id: "acc_accum_dep", debit: 0, credit: 5000 },
    ],
  },
  // ... 49 more entries
];
```

### E2E Seed Data

**Location**: `tests/seeds/journals.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:journals
```

**Dataset**:

- 100 journal entries across 3 months
- 20% draft, 70% posted, 10% reversed
- Variety of line counts (2-15 lines per entry)
- Multi-currency entries (20% of total)

**Cleanup Command**:

```powershell
pnpm run seed:journals:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic company journal entries for "Demo Corp Inc."
- 50 entries covering common scenarios:
  - Accruals (10 entries)
  - Reclassifications (10 entries)
  - Depreciation (5 entries)
  - Manual adjustments (25 entries)
- All entries balanced and validated
- Mix of simple (2-line) and complex (10+ line) entries

**Regeneration**:

```powershell
pnpm run demo:reset:journals
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] All entries are balanced (debits = credits)
- [ ] No entries with < 2 lines
- [ ] All account references exist
- [ ] Reversal entries link to valid original entries
- [ ] Date sequences are valid (reversal after original)

---

## 📊 Analytics & Audit Events

| Event                    | When               | Properties                                       |
| ------------------------ | ------------------ | ------------------------------------------------ |
| Journal.Entry.Viewed     | Detail page open   | `entry_id`, `status`                             |
| Journal.Entry.Created    | After 2xx response | `entry_id`, `line_count`, `total_amount`         |
| Journal.Entry.Posted     | After 2xx response | `entry_id`, `total_amount`, `posting_date`       |
| Journal.Entry.Reversed   | After 2xx response | `entry_id`, `original_entry_id`, `reversal_date` |
| Journal.Entry.Imported   | After bulk import  | `import_count`, `success_count`, `error_count`   |
| Journal.Search.Performed | Search executed    | `query`, `results_count`, `duration_ms`          |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Journal.Entry.Posted", {
  entry_id: entry.id,
  total_amount: entry.total_debit,
  posting_date: entry.doc_date,
  line_count: entry.lines.length,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/journals.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties; test with Arabic
- **Currency Display**: Format with tenant's presentation currency

### Keyboard Shortcuts

| Key      | Action                  | Scope       |
| -------- | ----------------------- | ----------- |
| `/`      | Focus search            | List        |
| `n`      | New entry               | List        |
| `e`      | Edit selected entry     | List/Detail |
| `p`      | Post selected entry     | List/Detail |
| `Tab`    | Next line/field         | Entry form  |
| `Enter`  | Add new line            | Entry form  |
| `Escape` | Close modal/cancel edit | Modal/Form  |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateModal()],
  ["e", () => editSelected()],
  ["p", () => postSelected()],
]);
```

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
- **Interactive Parts**: Mark with `"use client"` (forms, data grids, modals)

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

export async function postJournalEntry(entryId: string) {
  // ... posting logic
  revalidateTag("journals");
  revalidateTag("ledger"); // Affects ledger balances
  revalidateTag("trial-balance"); // Affects reports
}
```

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
  m2_journals: true,              // Master toggle
  m2_journals_import: false,      // Bulk import (phase 2)
  m2_journals_templates: false,   // Template library (phase 2)
  m2_journals_ai: false,          // AI suggestions (phase 3)
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/journals`, `/journals/create`, `/journals/[id]`)
- P50/P95/P99 latency
- Posting success rate
- Balance validation errors
- User engagement (entries created, posted)

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- P95 latency > 500ms for 10min → investigate
- Posting failure rate > 5% → immediate investigation

### UI Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m2_journals = false`

   ```powershell
   pnpm run flags:set m2_journals=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("journals");
   revalidateTag("ledger");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/journals/*"
   ```

4. **Monitor for 15 minutes**:

   - Error rate drops below 0.1%
   - No new Sentry issues
   - Users see fallback message

5. **Post-mortem**:
   - Create incident report
   - Add regression test
   - Plan fix + re-deploy

**Rollback Decision Matrix**:

| Scenario                 | Action             | Approval Required |
| ------------------------ | ------------------ | ----------------- |
| Error rate > 5%          | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%          | Partial rollback   | On-call engineer  |
| P95 latency > 1s         | Investigate first  | On-call engineer  |
| Balance calculation bugs | Immediate rollback | No (auto-trigger) |
| Data corruption/loss     | Immediate rollback | No (auto-trigger) |

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Journal list loads correctly
- [ ] Entry validation works (balance check, min lines)
- [ ] Line totals calculate correctly (debits, credits, difference)
- [ ] Status badges display correctly
- [ ] Balance calculation logic (debits = credits)
- [ ] Line entry grid adds/removes lines
- [ ] Currency formatting with rounding policies
- [ ] Date validation for posting periods

### Integration Tests

- [ ] Create entry → saves to database
- [ ] Post entry → updates GL balances
- [ ] Reverse entry → creates reversal entry with link
- [ ] Import CSV → creates multiple entries
- [ ] Search filters entries correctly
- [ ] Pagination + server filters (status, date range)
- [ ] Optimistic update rollback on 409 conflict
- [ ] Multi-line entry with real-time balance display

### E2E Tests

- [ ] User can navigate to journals page
- [ ] User can create manual entry with 2+ lines
- [ ] User can post balanced entry
- [ ] User cannot post unbalanced entry
- [ ] User can reverse posted entry
- [ ] User can filter and search entries
- [ ] Keyboard-only flow: create → edit → post
- [ ] Import workflow: CSV → validate → import

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Arrow keys in grid)
- [ ] Screen reader announces balance updates
- [ ] Focus management correct (modals, form, grid cells)
- [ ] Color contrast meets WCAG 2.2 AAA
- [ ] Axe: 0 serious/critical violations
- [ ] Grid cells properly labeled for screen readers

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for list, create form, data grid
- [ ] Dark/light theme variations

### Performance Tests

- [ ] Bundle size < 250KB gzipped for page
- [ ] TTFB ≤ 70ms on staging
- [ ] Line entry latency < 50ms (keystroke to UI update)
- [ ] Posting 100-line entry < 2s

---

## 📅 Timeline & Milestones

| Day | Tasks                                       | Deliverable                 |
| --- | ------------------------------------------- | --------------------------- |
| 1   | List page + API hooks + Basic CRUD          | Can view and create entries |
| 2   | Line entry grid + Validation + Post/Reverse | Full functionality complete |

**Total Effort**: 2 days (16 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger (needs accounts)

### Enables These Modules

- M3: Trial Balance
- M4: Accounts Receivable
- M5: Accounts Payable
- All other financial modules

---

## 🎯 Success Criteria

### Must Have (Measurable)

- [ ] Create journal entries with 2+ lines
- [ ] Real-time balance validation (debits = credits)
- [ ] Post balanced entries to general ledger
- [ ] Reverse posted entries with audit trail
- [ ] Search returns results < 150ms (P95)
- [ ] Line entry latency < 50ms (P95)
- [ ] Axe: 0 serious/critical violations

### Should Have

- [ ] Import entries from CSV
- [ ] Template library (50+ templates)
- [ ] Auto-balance suggestions
- [ ] Bulk operations (post/reverse multiple)
- [ ] Multi-currency support

### Nice to Have

- [ ] AI-powered account suggestions
- [ ] Entry approval workflow
- [ ] Recurring journal entries
- [ ] Entry templates with AI learning

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

- ERPNext patterns: Journal entry workflows
- QuickBooks: Line entry UX
- Xero: Reversal handling
- Zoho: Template library

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Cost/Scaling**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Complex Line Entry UX

**Mitigation**: Extensive user testing with real accountants; iterate based on feedback; study ERPNext patterns

### Risk #2: Balance Validation Performance

**Mitigation**: Real-time client-side validation with debouncing; server-side validation before posting

### Risk #3: Data Loss on Network Errors

**Mitigation**: Auto-save drafts to local storage; recovery on reconnect; optimistic UI updates

### Risk #4: Posting Performance with Large Entries

**Mitigation**: Background job for entries with 50+ lines; progress indicator; estimated time display

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/journals`, `/journals/[id]`, `/journals/create`)
- [ ] All CRUD operations working (Create, Read, Update, Delete draft)
- [ ] Post and reverse operations functional
- [ ] Real-time balance validation (debits = credits)
- [ ] Line entry grid fully functional (add/remove/edit)
- [ ] Search and filtering working (status, date range)
- [ ] Pagination working (50 items/page default)
- [ ] Permissions enforced (UI shows/hides based on role)
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
- [ ] Integration tests: All CRUD + posting operations covered
- [ ] E2E tests: All user flows covered (create → post → reverse)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Entry creation flow with balance validation
- Posting flow with GL update
- Reversal flow with audit trail link
- Line entry grid operations

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/journals/*` routes
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/journals`
- [ ] Network requests: ≤4 on initial load
- [ ] Line entry latency: < 50ms (P95)
- [ ] Posting operation: < 2s for 100 lines

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable (Tab, Enter, Arrow keys)
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators, grid navigation
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
  - `Journal.Entry.Viewed`
  - `Journal.Entry.Created`
  - `Journal.Entry.Posted`
  - `Journal.Entry.Reversed`
  - `Journal.Entry.Imported`
  - `Journal.Search.Performed`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, latency, posting failures)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Rate limiting tested (BFF layer)
- [ ] No sensitive data in logs/errors
- [ ] Audit trail complete (all actions logged)
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
  - `flags.m2_journals = false` (ready to enable)
  - `flags.m2_journals_import = false` (phase 2)
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

**Ready to build? Start with Step 0! 🚀**

**Previous Module**: M1 - Core Ledger  
**Next Module**: M3 - Trial Balance
