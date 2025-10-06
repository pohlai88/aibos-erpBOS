# 🚀 M17: Consolidation - UI Implementation Runbook

**Module ID**: M17  
**Module Name**: Consolidation  
**Priority**: HIGH  
**Phase**: 5 - Consolidation & Allocation  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Consolidation provides **multi-entity financial consolidation** with elimination entries, intercompany matching, and currency translation for consolidated reporting.

### Business Value

- Automated multi-entity consolidation
- Intercompany elimination tracking
- Currency translation (CTA) calculations
- Consolidation adjustments and reclasses
- Consolidated financial statements

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-consolidation-methodology], [ADR-###-currency-translation], [ADR-###-elimination-entries]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 10 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/consolidation/run` - Run consolidation for period
- ✅ `/api/consolidation/entities` - Entity hierarchy and ownership
- ✅ `/api/consolidation/eliminations` - Elimination entries
- ✅ `/api/consolidation/currency-translation` - Currency translation
- ✅ `/api/consolidation/minority-interest` - NCI calculations
- ✅ `/api/consolidation/workbench` - Consolidation workbench data
- ✅ `/api/consolidation/cta` - CTA rollforward
- ✅ `/api/consolidation/intercompany` - Intercompany matching
- ✅ `/api/consolidation/adjustments` - Manual consolidation adjustments
- ✅ `/api/consolidation/reports` - Consolidated financial statements

**Total Endpoints**: 10

### Risks & Blockers

| Risk                                     | Impact | Mitigation                                                           | Owner    |
| ---------------------------------------- | ------ | -------------------------------------------------------------------- | -------- |
| Currency translation accuracy            | HIGH   | Automated rate sourcing; validation rules; audit trail               | @finance |
| Intercompany mismatch resolution         | HIGH   | Automated matching; alert system; reconciliation workflow            | @backend |
| Multi-entity performance                 | MED    | Async consolidation; progress tracking; batch optimization           | @backend |
| Minority interest calculation complexity | HIGH   | Automated calculations; validation against manual; accounting review | @finance |

---

## 🎯 3 Killer Features

### 1. **Consolidation Workbench** 🏗️

**Description**: Interactive consolidation workspace with elimination tracking and rollup visualization across all entities.

**Why It's Killer**:

- Real-time consolidation calculations
- Visual entity hierarchy tree
- Elimination entry automation
- Minority interest calculations
- Better than Hyperion's complex consolidation

**Implementation**:

```typescript
import { Tree, Card, DataTable, Button } from "aibos-ui";

export default function ConsolidationWorkbench() {
  const { entities, consolidate } = useConsolidation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <h3>Entity Hierarchy</h3>
          <Tree
            data={entities.hierarchy}
            renderNode={(entity) => (
              <div className="flex justify-between">
                <span>{entity.name}</span>
                <span className="text-muted">{entity.ownership}%</span>
              </div>
            )}
            expandable
          />
        </Card>

        <Card>
          <h3>Consolidation Summary</h3>
          <div className="space-y-4">
            <div>
              <strong>Total Entity Balance:</strong>{" "}
              {formatCurrency(entities.total_balance)}
            </div>
            <div>
              <strong>Elimination Entries:</strong>{" "}
              {formatCurrency(entities.eliminations)}
            </div>
            <div>
              <strong>Minority Interest:</strong>{" "}
              {formatCurrency(entities.minority_interest)}
            </div>
            <div className="text-2xl pt-4 border-t">
              <strong>Consolidated Balance:</strong>{" "}
              {formatCurrency(entities.consolidated_balance)}
            </div>
          </div>

          <Button onClick={consolidate} variant="primary" className="mt-4">
            Run Consolidation
          </Button>
        </Card>
      </div>

      <DataTable
        data={entities.list}
        columns={[
          { key: "entity", label: "Entity" },
          { key: "ownership_pct", label: "Ownership" },
          {
            key: "entity_balance",
            label: "Entity Balance",
            render: formatCurrency,
          },
          { key: "elimination", label: "Eliminations", render: formatCurrency },
          {
            key: "consolidated",
            label: "Consolidated",
            render: formatCurrency,
          },
        ]}
      />
    </div>
  );
}
```

### 2. **Currency Translation Engine** 🌐

**Description**: Automated currency translation with CTA calculation for foreign subsidiaries.

**Why It's Killer**:

- Automatic FX rate application
- Historical vs current rate logic
- CTA rollforward tracking
- Multi-currency trial balance
- Industry-first visual currency translation

**Implementation**:

```typescript
import { Card, DataTable, Chart } from "aibos-ui";

export default function CurrencyTranslation() {
  const { translation } = useCurrencyTranslation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Local Currency Total</h3>
          <div className="text-2xl">
            {formatCurrency(
              translation.local_currency_total,
              translation.local_currency
            )}
          </div>
        </Card>
        <Card>
          <h3>Translated Amount</h3>
          <div className="text-2xl">
            {formatCurrency(translation.translated_total)}
          </div>
        </Card>
        <Card>
          <h3>Translation Adjustment</h3>
          <div className="text-2xl text-blue-600">
            {formatCurrency(translation.cta)}
          </div>
        </Card>
        <Card>
          <h3>Cumulative CTA</h3>
          <div className="text-2xl">
            {formatCurrency(translation.cumulative_cta)}
          </div>
        </Card>
      </div>

      <Chart
        type="waterfall"
        data={translation.cta_movement}
        title="CTA Movement"
      />

      <DataTable
        data={translation.accounts}
        columns={[
          { key: "account", label: "Account" },
          {
            key: "local_amount",
            label: "Local Currency",
            render: (val) => formatCurrency(val, translation.local_currency),
          },
          { key: "rate", label: "FX Rate" },
          { key: "rate_type", label: "Rate Type" },
          {
            key: "translated_amount",
            label: "USD Equivalent",
            render: formatCurrency,
          },
        ]}
      />
    </div>
  );
}
```

### 3. **Elimination Journal Manager** 🔄

**Description**: Centralized management of intercompany eliminations with automatic matching.

**Why It's Killer**:

- Auto-generate elimination entries
- Intercompany mismatch alerts
- Recurring elimination templates
- Full audit trail
- Better than manual elimination tracking

**Implementation**:

```typescript
import { DataTable, Button, Card, Badge, Alert } from "aibos-ui";

export default function EliminationManager() {
  const { eliminations, autoGenerate } = useEliminations();

  return (
    <div className="space-y-6">
      {eliminations.mismatches.length > 0 && (
        <Alert variant="warning">
          {eliminations.mismatches.length} intercompany mismatches detected
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h2>Elimination Entries</h2>
        <Button onClick={autoGenerate} variant="primary">
          Auto-Generate Eliminations
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Total Eliminations</h3>
          <div className="text-3xl">{formatCurrency(eliminations.total)}</div>
        </Card>
        <Card>
          <h3>Posted</h3>
          <div className="text-3xl text-green-600">
            {eliminations.posted_count}
          </div>
        </Card>
        <Card>
          <h3>Pending</h3>
          <div className="text-3xl text-orange-600">
            {eliminations.pending_count}
          </div>
        </Card>
      </div>

      <DataTable
        data={eliminations.entries}
        columns={[
          { key: "description", label: "Description" },
          { key: "entity_pair", label: "Entities" },
          { key: "amount", label: "Amount", render: formatCurrency },
          {
            key: "status",
            label: "Status",
            render: (val) => (
              <Badge variant={val === "Posted" ? "success" : "warning"}>
                {val}
              </Badge>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (_, row) => (
              <Button size="sm" onClick={() => postElimination(row.id)}>
                Post
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
}
```

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Main Page (`/[module]/[page]`)

**Components**: DataTable, Button, Card, Form
**File**: `apps/web/app/(dashboard)/[module]/page.tsx`

#### 2. Detail Page (`/[module]/[id]`)

**Components**: Form, Button, Card, Badge
**File**: `apps/web/app/(dashboard)/consolidation/entities/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                          | Target          | Measurement          |
| ------------------------------- | --------------- | -------------------- |
| TTFB (staging)                  | ≤ 70ms          | Server timing header |
| Client TTI for `/consolidation` | ≤ 200ms         | Lighthouse CI        |
| Consolidation run (10 entities) | < 30s           | Progress tracking    |
| Currency translation            | < 5s            | APM traces           |
| Entity hierarchy load           | < 1s            | Performance profiler |
| UI bundle size                  | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to entity hierarchy, elimination entries
- **Focus Management**: Focus trap in modals; visible indicators
- **ARIA**: Live regions for consolidation progress; proper roles for charts/trees
- **Screen Reader**: All entities and amounts announced; CTA calculations communicated
- **Axe Target**: 0 serious/critical violations
- **Chart Accessibility**: Data table alternatives for waterfall charts

### Security

| Layer          | Requirement                                                      |
| -------------- | ---------------------------------------------------------------- |
| RBAC Scopes    | `consolidation.read`, `consolidation.run`, `consolidation.admin` |
| Enforcement    | Server-side on all endpoints                                     |
| Data Exposure  | Only show entities user has permission to view                   |
| Sensitive Data | Mask elimination amounts for non-finance users                   |
| Audit Trail    | All consolidation runs, eliminations, adjustments logged         |

#### UI Permissions Matrix

| Role                | View | Run Consolidation | Eliminations | Adjustments | Admin |
| ------------------- | ---- | ----------------- | ------------ | ----------- | ----- |
| consolidation.read  | ✅   | ❌                | ❌           | ❌          | ❌    |
| consolidation.run   | ✅   | ✅                | ✅           | ❌          | ❌    |
| consolidation.admin | ✅   | ✅                | ✅           | ✅          | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful consolidation runs; 100% accuracy in eliminations
- **SLA Dashboards**: Real-time metrics on run status, currency translation accuracy
- **Events Emitted**: `Consolidation.RunStarted`, `Consolidation.RunCompleted`, `Consolidation.EliminationPosted`
- **Logging**: Structured logs with correlation IDs for all consolidation operations
- **Tracing**: Distributed tracing for multi-entity consolidation pipeline
- **Monitoring**: Run duration; elimination accuracy; CTA calculations; intercompany match rate

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Consolidation Rules

| Rule                      | Enforcement                                                 |
| ------------------------- | ----------------------------------------------------------- |
| **Entity Hierarchy**      | Parent-child ownership relationships; max 10 levels         |
| **Ownership Percentage**  | 0-100%; determines full/partial consolidation               |
| **Elimination Balance**   | All eliminations must net to zero (debits = credits)        |
| **Minority Interest**     | NCI = (1 - ownership%) × subsidiary equity                  |
| **Currency Translation**  | Assets/Liabilities = current rate; Equity = historical rate |
| **CTA Calculation**       | Plug to equity; tracked cumulatively                        |
| **Intercompany Matching** | AR/AP between entities must match within tolerance          |
| **Consolidation Method**  | Full consolidation >50%; equity method 20-50%               |

### Currency & Rounding

- **Display**: Reporting currency (typically USD)
- **Rounding Policy**: HALF_UP for consolidation calculations
- **Multi-Currency**: Translate all entities to reporting currency
- **FX Rates**: Historical for equity; current for B/S; average for P&L
- **CTA**: Cumulative Translation Adjustment tracked in equity

### Archive Semantics

- **Historical Consolidations**: Retain all runs for audit trail
- **Elimination Versions**: Maintain version history
- **Guard Rails**:
  - ❌ Deny delete if consolidation posted
  - ❌ Deny delete if referenced in reporting
  - ✅ Allow archive after 7 years (retention policy)

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                             | User Action     |
| --------------------- | -------------------------------------- | --------------- |
| **Empty**             | "No entities configured"               | "Add Entity"    |
| **Loading**           | Skeleton entity cards                  | N/A             |
| **Error**             | Error message + retry                  | Retry / Support |
| **Running**           | Progress "Consolidating..."            | Wait            |
| **Translating**       | Progress "Translating currencies..."   | Wait            |
| **Eliminating**       | Progress "Processing eliminations..."  | Wait            |
| **Completed**         | Green badge "Consolidation complete"   | View results    |
| **Failed**            | Red alert "Consolidation failed"       | Review errors   |
| **Mismatch Detected** | Yellow warning "Intercompany mismatch" | Reconcile       |
| **Translation Error** | Red alert "FX rate missing"            | Add rate        |
| **Permission Denied** | "Access restricted"                    | Back            |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Real-time Validation**: Check ownership % valid, FX rates exist
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal

### Network Errors

| HTTP Status | UI Message                                                  | Action              |
| ----------- | ----------------------------------------------------------- | ------------------- |
| 400         | "Invalid consolidation parameters. Check your input."       | Inline field errors |
| 401         | "Session expired. Please log in again."                     | Redirect to login   |
| 403         | "You don't have permission to run consolidation."           | Hide action         |
| 404         | "Entity not found."                                         | Return to list      |
| 409         | "Consolidation already posted for this period."             | Show status         |
| 422         | "Validation failed: FX rate missing for EUR."               | Inline errors       |
| 500         | "Consolidation failed. Our team has been notified."         | Retry button        |
| 503         | "Consolidation service unavailable. Try again in a moment." | Retry later         |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/consolidation.json`.

### Page Titles & Headers

| Context              | Copy                       | i18n Key                           |
| -------------------- | -------------------------- | ---------------------------------- |
| Main Page            | "Consolidation"            | `consolidation.main.title`         |
| Workbench            | "Consolidation Workbench"  | `consolidation.workbench.title`    |
| Entity Hierarchy     | "Entity Hierarchy"         | `consolidation.entities.title`     |
| Currency Translation | "Currency Translation"     | `consolidation.translation.title`  |
| Elimination Manager  | "Elimination Entries"      | `consolidation.eliminations.title` |
| Minority Interest    | "Non-Controlling Interest" | `consolidation.nci.title`          |

### State Messages

| State             | Title                          | Message                                                            | Action Button       | i18n Key                           |
| ----------------- | ------------------------------ | ------------------------------------------------------------------ | ------------------- | ---------------------------------- |
| Empty             | "No entities"                  | "Configure entities to begin consolidation"                        | "Add Entity"        | `consolidation.empty.*`            |
| Loading           | —                              | —                                                                  | —                   | —                                  |
| Error             | "Unable to load consolidation" | "Something went wrong. Our team has been notified."                | "Retry" / "Support" | `consolidation.error.*`            |
| Running           | "Consolidating..."             | "Processing {count} entities. This may take a moment."             | —                   | `consolidation.running.*`          |
| Translating       | "Translating currencies..."    | "Converting {count} foreign subsidiaries to {currency}"            | —                   | `consolidation.translating.*`      |
| Eliminating       | "Processing eliminations..."   | "Posting {count} elimination entries"                              | —                   | `consolidation.eliminating.*`      |
| Completed         | "Consolidation complete"       | "Successfully consolidated {count} entities"                       | "View Report"       | `consolidation.completed.*`        |
| Failed            | "Consolidation failed"         | "Review errors below and try again"                                | "Review"            | `consolidation.failed.*`           |
| Mismatch Detected | "Intercompany mismatch"        | "{count} intercompany balances don't match. Reconcile to proceed." | "View Mismatches"   | `consolidation.mismatch.*`         |
| Translation Error | "FX rate missing"              | "Missing exchange rate for {currency} on {date}"                   | "Add Rate"          | `consolidation.translationError.*` |
| Permission Denied | "Access restricted"            | "You don't have permission for consolidation operations"           | "Back"              | `consolidation.permissionDenied.*` |

### Action Confirmations

| Action            | Title                | Message                                                          | Confirm Button | Cancel Button | i18n Key                               |
| ----------------- | -------------------- | ---------------------------------------------------------------- | -------------- | ------------- | -------------------------------------- |
| Run Consolidation | "Run consolidation?" | "Consolidate {count} entities for {period}?"                     | "Run"          | "Cancel"      | `consolidation.run.confirm.*`          |
| Post Eliminations | "Post eliminations?" | "Post {count} elimination entries?"                              | "Post"         | "Cancel"      | `consolidation.postElim.confirm.*`     |
| Delete Entity     | "Remove entity?"     | "Remove '{name}' from consolidation? Historical data preserved." | "Remove"       | "Cancel"      | `consolidation.deleteEntity.confirm.*` |

### Success Messages (Toast)

| Action                 | Message                                           | i18n Key                             |
| ---------------------- | ------------------------------------------------- | ------------------------------------ |
| Consolidation Complete | "Consolidation complete for {period}"             | `consolidation.run.success`          |
| Eliminations Posted    | "{count} elimination entries posted successfully" | `consolidation.eliminations.success` |
| Entity Added           | "Entity '{name}' added successfully"              | `consolidation.addEntity.success`    |
| Translation Complete   | "Currency translation complete"                   | `consolidation.translation.success`  |
| Adjustment Posted      | "Consolidation adjustment posted"                 | `consolidation.adjustment.success`   |

### Error Messages (Toast)

| Scenario              | Message                                                       | i18n Key                           |
| --------------------- | ------------------------------------------------------------- | ---------------------------------- |
| Run Failed            | "Consolidation failed. Review error details."                 | `consolidation.run.error`          |
| FX Rate Missing       | "Missing exchange rate for {currency}. Add rate to continue." | `consolidation.errorFxRate`        |
| Intercompany Mismatch | "Intercompany balances don't match. Reconcile to proceed."    | `consolidation.errorMismatch`      |
| Elimination Error     | "Failed to post eliminations. Check entries."                 | `consolidation.errorElimination`   |
| Already Posted        | "Consolidation already posted for {period}."                  | `consolidation.errorAlreadyPosted` |
| Circular Ownership    | "Circular ownership detected in entity hierarchy."            | `consolidation.errorCircular`      |
| Network Error         | "Network error. Check your connection and try again."         | `consolidation.error.network`      |

### Form Labels & Help Text

| Field                | Label                 | Placeholder           | Help Text                            | i18n Key                            |
| -------------------- | --------------------- | --------------------- | ------------------------------------ | ----------------------------------- |
| Entity Name          | "Entity Name"         | "e.g., US Subsidiary" | "Legal entity name"                  | `consolidation.field.entityName.*`  |
| Parent Entity        | "Parent Entity"       | "Select parent"       | "Parent in consolidation hierarchy"  | `consolidation.field.parent.*`      |
| Ownership %          | "Ownership %"         | "100"                 | "Percentage owned by parent (0-100)" | `consolidation.field.ownership.*`   |
| Functional Currency  | "Functional Currency" | "USD"                 | "Entity's operating currency"        | `consolidation.field.currency.*`    |
| Consolidation Method | "Method"              | "Select method"       | "Full (>50%) or Equity (20-50%)"     | `consolidation.field.method.*`      |
| Elimination Account  | "Elimination Account" | "Search accounts"     | "Account for elimination entries"    | `consolidation.field.elimAccount.*` |

### Keyboard Shortcuts Help

| Shortcut | Description            | i18n Key                            |
| -------- | ---------------------- | ----------------------------------- |
| `/`      | "Focus search"         | `consolidation.shortcuts.search`    |
| `r`      | "Run consolidation"    | `consolidation.shortcuts.run`       |
| `e`      | "View eliminations"    | `consolidation.shortcuts.elim`      |
| `t`      | "Currency translation" | `consolidation.shortcuts.translate` |
| `n`      | "Add entity"           | `consolidation.shortcuts.new`       |
| `↑ / ↓`  | "Navigate entities"    | `consolidation.shortcuts.navigate`  |
| `Enter`  | "Open selected entity" | `consolidation.shortcuts.open`      |
| `Escape` | "Close modal/cancel"   | `consolidation.shortcuts.cancel`    |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useConsolidation.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useConsolidationWorkbench(period: string) {
  return useQuery({
    queryKey: ["consolidation", "workbench", period],
    queryFn: () =>
      apiClient.GET("/api/consolidation/workbench", { query: { period } }),
    staleTime: 60_000, // 1min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useEntityHierarchy() {
  return useQuery({
    queryKey: ["consolidation", "entities"],
    queryFn: () => apiClient.GET("/api/consolidation/entities"),
    staleTime: 5 * 60_000, // 5min (hierarchy changes infrequently)
    select: (response) => response.data,
  });
}

export function useRunConsolidation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { period: string; entities?: string[] }) =>
      apiClient.POST("/api/consolidation/run", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["consolidation"] });
      toast.success(`Consolidation complete for ${data.period}`);
    },
    onError: (error) => {
      if (error.status === 409) {
        toast.error("Consolidation already posted for this period.");
      } else if (error.status === 422) {
        toast.error("FX rate missing. Add exchange rates to continue.");
      } else {
        toast.error("Consolidation failed. Review error details.");
      }
    },
  });
}

export function useCurrencyTranslation(period: string, entity_id?: string) {
  return useQuery({
    queryKey: ["consolidation", "translation", period, entity_id],
    queryFn: () =>
      apiClient.GET("/api/consolidation/currency-translation", {
        query: { period, entity_id },
      }),
    staleTime: 60_000, // 1min
    enabled: !!period,
    select: (response) => response.data,
  });
}

export function useEliminations(period: string) {
  return useQuery({
    queryKey: ["consolidation", "eliminations", period],
    queryFn: () =>
      apiClient.GET("/api/consolidation/eliminations", { query: { period } }),
    staleTime: 60_000, // 1min
    select: (response) => response.data,
  });
}

export function usePostElimination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eliminationId: string) =>
      apiClient.POST("/api/consolidation/eliminations/post", {
        body: { elimination_id: eliminationId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["consolidation", "eliminations"],
      });
      toast.success("Elimination entry posted successfully");
    },
    onError: () => {
      toast.error("Failed to post elimination. Check entry details.");
    },
  });
}

export function useMinorityInterest(period: string) {
  return useQuery({
    queryKey: ["consolidation", "nci", period],
    queryFn: () =>
      apiClient.GET("/api/consolidation/minority-interest", {
        query: { period },
      }),
    staleTime: 60_000, // 1min
    select: (response) => response.data,
  });
}

export function useIntercompanyMatching(period: string) {
  return useQuery({
    queryKey: ["consolidation", "intercompany", period],
    queryFn: () =>
      apiClient.GET("/api/consolidation/intercompany", { query: { period } }),
    staleTime: 60_000, // 1min
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error         | User Message                                          | UI Action            |
| ----------------- | ----------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid consolidation parameters. Check your input." | Inline field errors  |
| 409 (Conflict)    | "Consolidation already posted for this period."       | Show status          |
| 422 (Validation)  | "Validation failed: FX rate missing for EUR."         | Inline errors        |
| 403 (Forbidden)   | "You don't have permission to run consolidation."     | Hide action          |
| 500 (Server)      | "Consolidation failed. Our team has been notified."   | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Consolidation run**: 60s timeout (long-running operation)

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["consolidation", "workbench", period][("consolidation", "entities")][
  ("consolidation", "translation", period, entity_id)
][("consolidation", "eliminations", period)][("consolidation", "nci", period)][
  ("consolidation", "intercompany", period)
];
```

### Invalidation Rules

| Action               | Invalidates                                          |
| -------------------- | ---------------------------------------------------- |
| Run Consolidation    | `["consolidation"]` (all)                            |
| Post Elimination     | `["consolidation", "eliminations"]`                  |
| Add/Update Entity    | `["consolidation", "entities"]`, `["consolidation"]` |
| Currency Translation | `["consolidation", "translation"]`                   |

### Stale Time

| Query Type           | Stale Time | Reasoning                      |
| -------------------- | ---------- | ------------------------------ |
| Workbench            | 1min       | Real-time consolidation data   |
| Entity Hierarchy     | 5min       | Hierarchy changes infrequently |
| Currency Translation | 1min       | FX rates may update            |
| Eliminations         | 1min       | Frequently modified            |
| NCI                  | 1min       | Depends on ownership changes   |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("consolidation-workbench");
revalidateTag("consolidation-entities");
revalidateTag("consolidation-eliminations");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/consolidation.fixtures.ts`

**Datasets**:

- `minimalEntities`: 2 entities (parent + 1 subsidiary)
- `standardEntities`: 5 entities (parent + 4 subsidiaries, 2 currencies)
- `complexHierarchy`: 10 entities, 3-level hierarchy, multiple currencies
- `edgeCases`: Edge cases (100% ownership, minority interest, circular detection)

**Edge Cases Covered**:

- 100% ownership (full consolidation, no NCI)
- 60% ownership (NCI calculation)
- Circular ownership detection
- Multiple currencies (USD, EUR, GBP, JPY)
- Intercompany mismatches
- Missing FX rates

```typescript
// Example fixture
export const standardConsolidationEntities: ConsolidationEntityFixture[] = [
  {
    id: "entity_1",
    name: "Parent Corp",
    parent_id: null,
    ownership_pct: 100,
    functional_currency: "USD",
    consolidation_method: "full",
  },
  {
    id: "entity_2",
    name: "US Subsidiary",
    parent_id: "entity_1",
    ownership_pct: 100,
    functional_currency: "USD",
    consolidation_method: "full",
  },
  {
    id: "entity_3",
    name: "EUR Subsidiary",
    parent_id: "entity_1",
    ownership_pct: 80,
    functional_currency: "EUR",
    consolidation_method: "full",
  },
  // ... more entities
];
```

### E2E Seed Data

**Location**: `tests/seeds/consolidation.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:consolidation
```

**Dataset**:

- 8 entities (3-level hierarchy)
- 5 currencies (USD, EUR, GBP, JPY, CNY)
- 20 elimination entries (10 posted, 10 pending)
- Complete consolidation run (prior period)
- Intercompany transactions (AR/AP matching)

**Cleanup Command**:

```powershell
pnpm run seed:consolidation:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic "Global Corp" structure (10 entities across 5 countries)
- Multi-currency with FX translation
- Complete elimination entries
- Historical consolidation runs (last 6 months)
- Minority interest examples

**Regeneration**:

```powershell
pnpm run demo:reset:consolidation
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] Ownership percentages 0-100%
- [ ] No circular ownership
- [ ] All parent references exist
- [ ] Elimination entries balance to zero
- [ ] FX rates exist for all currencies

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
- **Interactive Parts**: Mark with `"use client"` (workbench, entity tree, charts)

### Data Fetching Strategy

| Scenario             | Strategy                           | Benefit             |
| -------------------- | ---------------------------------- | ------------------- |
| Initial Workbench    | Server-side fetch + stream         | Faster TTFB         |
| Run Consolidation    | Client-side with progress tracking | Real-time updates   |
| Entity Hierarchy     | Server component with client tree  | SEO + interactivity |
| Currency Translation | Client-side React Query            | Dynamic updates     |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function runConsolidation(data) {
  // ... mutation logic
  revalidateTag("consolidation-workbench");
  revalidateTag("consolidation-entities");
}
```

---

## 📊 Analytics & Audit Events

| Event                            | When               | Properties                                                    |
| -------------------------------- | ------------------ | ------------------------------------------------------------- |
| Consolidation.RunStarted         | Run initiated      | `period`, `entity_count`, `timestamp`                         |
| Consolidation.RunCompleted       | Run complete       | `period`, `entity_count`, `duration_ms`, `total_eliminations` |
| Consolidation.EliminationPosted  | Elimination posted | `elimination_id`, `amount`, `entity_pair`                     |
| Consolidation.CurrencyTranslated | Translation done   | `entity_id`, `currency`, `amount`, `cta`                      |
| Consolidation.MismatchDetected   | Mismatch found     | `entity_pair`, `account`, `difference`                        |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Consolidation.RunCompleted", {
  period: "2025-03",
  entity_count: 8,
  duration_ms: 12500,
  total_eliminations: 15,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/consolidation.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency Display**: Multi-currency with locale-specific symbols
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Entity Names**: Support international characters

### Keyboard Shortcuts

| Key      | Action               | Scope       |
| -------- | -------------------- | ----------- |
| `/`      | Focus search         | Any page    |
| `r`      | Run consolidation    | Workbench   |
| `e`      | View eliminations    | Workbench   |
| `t`      | Currency translation | Workbench   |
| `n`      | Add entity           | Entity list |
| `↑ / ↓`  | Navigate entities    | Tree        |
| `Enter`  | Open selected entity | Tree        |
| `Escape` | Close modal/cancel   | Modal/Form  |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["r", () => runConsolidation()],
  ["e", () => router.push("/consolidation/eliminations")],
  ["t", () => router.push("/consolidation/translation")],
  ["n", () => openAddEntityModal()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                     | Duration | Rollback Trigger |
| ----------- | ---------------- | ---------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                     | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, consolidation accuracy 100%      | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, runs complete < 30s, NCI accurate | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained             | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m17_consolidation: false,              // Master toggle
  m17_consolidation_auto_elim: false,    // Auto-elimination
  m17_consolidation_currency: false,     // Currency translation
  m17_consolidation_nci: false,          // NCI calculation
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/consolidation/*`)
- P50/P95/P99 latency
- Consolidation run duration
- Consolidation accuracy (eliminations balance, NCI correct)
- FX rate coverage
- Intercompany match rate

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Consolidation run > 60s → investigate performance
- Elimination imbalance detected → immediate escalation (critical)
- FX rate missing → alert finance team
- Intercompany mismatch > 5% → alert accounting

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m17_consolidation = false`

   ```powershell
   pnpm run flags:set m17_consolidation=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("consolidation-workbench");
   revalidateTag("consolidation-entities");
   revalidateTag("consolidation-eliminations");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/consolidation/*"
   ```

4. **Monitor for 15 minutes**:

   - Error rate drops below 0.1%
   - No new Sentry issues
   - Users see fallback message

5. **Post-mortem**:
   - Create incident report
   - Identify root cause
   - Add regression test

**Rollback Decision Matrix**:

| Scenario                      | Action             | Approval Required |
| ----------------------------- | ------------------ | ----------------- |
| Error rate > 5%               | Immediate rollback | No (auto-trigger) |
| Consolidation accuracy < 100% | Immediate rollback | No (auto-trigger) |
| FX rate missing               | Investigate first  | Finance team      |
| Error rate 1-5%               | Partial rollback   | On-call engineer  |
| Run duration > 120s           | Investigate first  | On-call engineer  |
| Data corruption/loss          | Immediate rollback | No (auto-trigger) |

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

- Hyperion: Consolidation methodology
- Oracle HFM: Currency translation
- SAP BPC: Elimination entries
- NetSuite: Entity hierarchy

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Currency Translation Accuracy

**Mitigation**: Automated rate sourcing; validation rules; dual calculation (system vs manual); audit trail; accounting review

### Risk #2: Intercompany Mismatch Resolution

**Mitigation**: Automated matching with tolerance thresholds; alert system; reconciliation workflow; clear ownership of resolution

### Risk #3: Multi-Entity Performance

**Mitigation**: Async consolidation with progress tracking; batch optimization; parallel processing; timeout limits (30s); queue-based architecture

### Risk #4: Minority Interest Calculation Complexity

**Mitigation**: Automated NCI calculations per ASC 810; validation against manual calc; accounting review; extensive testing

---

## 📝 Implementation Guide

### Day 1: Workbench & Entities (8 hours)

1. Build consolidation workbench with entity tree (4 hours)
2. Implement entity hierarchy CRUD (3 hours)
3. Add run consolidation functionality (1 hour)

### Day 2: Translation & Eliminations (8 hours)

1. Implement currency translation page (3 hours)
2. Build elimination manager (3 hours)
3. Add minority interest calculations (2 hours)

**Total**: 2 days (16 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Ownership percentage validation (0-100%)
- [ ] Elimination balance check (debits = credits)
- [ ] NCI calculation accuracy
- [ ] Circular ownership detection
- [ ] FX rate lookup and application
- [ ] useConsolidationWorkbench hook fetches correctly
- [ ] Currency formatting displays correctly

### Integration Tests

- [ ] Run consolidation → posts elimination entries
- [ ] Currency translation → CTA calculated correctly
- [ ] Add entity → appears in hierarchy
- [ ] Post elimination → updates workbench
- [ ] Update ownership % → NCI recalculated
- [ ] Intercompany matching → mismatches detected
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] User can navigate to consolidation page
- [ ] User can view entity hierarchy
- [ ] User can run consolidation for period
- [ ] User can view currency translation
- [ ] User can post elimination entries
- [ ] User can view minority interest
- [ ] Keyboard-only flow: navigate → run → view results
- [ ] Multi-currency consolidation executes correctly

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Entity tree keyboard navigable
- [ ] Charts have data table alternatives
- [ ] Screen reader announces entities and amounts
- [ ] Focus management correct (modals, forms, trees)
- [ ] Color contrast meets WCAG 2.2 AA (AAA where practical)
- [ ] Axe: 0 serious/critical violations
- [ ] Progress indicators are accessible

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] All API endpoints return expected status codes

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for workbench, tree, charts
- [ ] Dark/light theme variations
- [ ] Progress states captured
- [ ] Loading/error/empty states captured

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/consolidation/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] Consolidation run < 30s (10 entities)
- [ ] Currency translation < 5s
- [ ] Entity hierarchy load < 1s

---

## 📅 Timeline

| Day | Deliverable                      |
| --- | -------------------------------- |
| 1   | Workbench + Entities + Run       |
| 2   | Translation + Eliminations + NCI |

**Total**: 2 days (16 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger (for accounts)
- ✅ M2: Journal Entries (for elimination entries)
- ✅ M19: Multi-Currency (for FX rates)
- ✅ Entity Management (for entity setup)

### Enables These Modules

- M20: Close Management (consolidation in close checklist)
- Consolidated Reporting (uses consolidation results)

---

## 🎯 Success Criteria

### Must Have

- [ ] Entity hierarchy management (CRUD)
- [ ] Run consolidation for period
- [ ] Currency translation with CTA
- [ ] Elimination entry management
- [ ] Minority interest calculation
- [ ] Intercompany matching
- [ ] Consolidation workbench
- [ ] 100% accuracy (eliminations balance, NCI correct)

### Should Have

- [ ] Auto-generate elimination entries
- [ ] FX rate sourcing integration
- [ ] Consolidated financial statements
- [ ] Historical consolidation comparison
- [ ] Consolidation audit trail

### Nice to Have

- [ ] AI-powered intercompany matching
- [ ] What-if consolidation scenarios
- [ ] Consolidation forecasting
- [ ] Visual entity ownership map

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/consolidation`, `/consolidation/workbench`, `/consolidation/entities`, `/consolidation/translation`, `/consolidation/eliminations`)
- [ ] Entity hierarchy CRUD working
- [ ] Run consolidation working
- [ ] Currency translation working
- [ ] Elimination entries working
- [ ] Minority interest calculation working
- [ ] Intercompany matching working
- [ ] Search and filtering working
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
- [ ] Integration tests: All consolidation operations covered
- [ ] E2E tests: All user flows covered (entity → run → translation → eliminations)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Consolidation run flow
- Currency translation flow
- Elimination posting flow
- NCI calculation flow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/consolidation/*` routes
- [ ] TTFB: ≤70ms on staging (Server-Timing header)
- [ ] TTI: ≤200ms for `/consolidation` (Lighthouse CI)
- [ ] Consolidation run: < 30s (10 entities)
- [ ] Currency translation: < 5s
- [ ] Entity hierarchy load: < 1s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues
- [ ] Charts/Trees: Keyboard accessible with alternatives

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `Consolidation.RunStarted`
  - `Consolidation.RunCompleted`
  - `Consolidation.EliminationPosted`
  - `Consolidation.CurrencyTranslated`
  - `Consolidation.MismatchDetected`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, accuracy, duration, mismatches)
- [ ] Consolidation accuracy monitoring (100% required)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Elimination amounts masked for non-finance users
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] All consolidation runs logged for audit trail
- [ ] Data retention policy enforced (7 years)

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete (changes, testing, screenshots)
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized (OpenAPI hash verified)
- [ ] i18n keys documented in copy deck
- [ ] User acceptance testing passed (PM/QA sign-off)
- [ ] Consolidation methodology documented (ASC 810)

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m17_consolidation = false` (ready to enable)
  - `flags.m17_consolidation_auto_elim = false` (phase 2)
  - `flags.m17_consolidation_currency = false` (phase 2)
  - `flags.m17_consolidation_nci = false` (phase 2)
- [ ] Smoke tests passed on staging
- [ ] Load tests passed (≥1000 concurrent users, 10 entities)
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
- [ ] **Finance/Controller**: Consolidation methodology validated (ASC 810), 100% accuracy confirmed

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M16 - Allocation Engine  
**Next**: M18 - Intercompany
