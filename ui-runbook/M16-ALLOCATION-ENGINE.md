# 🚀 M16: Allocation Engine - UI Implementation Runbook

**Module ID**: M16  
**Module Name**: Allocation Engine  
**Priority**: MEDIUM  
**Phase**: 5 - Consolidation & Allocation  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Allocation Engine provides **automated cost and revenue allocation** across departments, projects, and entities with flexible allocation rules.

### Business Value

- Automated allocation of shared costs and revenues
- Multiple allocation methods (headcount, revenue, square footage)
- Allocation waterfall for tiered allocations
- Audit trail of all allocations
- Period-end close automation

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-allocation-rules], [ADR-###-allocation-waterfall], [ADR-###-automated-posting]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 7 endpoints implemented       |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/allocations/rules` - List allocation rules
- ✅ `/api/allocations/rules/[id]` - Rule details
- ✅ `/api/allocations/test` - Test allocation before posting
- ✅ `/api/allocations/run` - Execute allocation run
- ✅ `/api/allocations/history` - Allocation history
- ✅ `/api/allocations/analysis` - Impact analysis
- ✅ `/api/allocations/templates` - Allocation templates

**Total Endpoints**: 7

### Risks & Blockers

| Risk                               | Impact | Mitigation                                                      | Owner    |
| ---------------------------------- | ------ | --------------------------------------------------------------- | -------- |
| Allocation calculation accuracy    | HIGH   | Automated validation; test mode; reconciliation checks          | @finance |
| Period-end processing performance  | HIGH   | Async processing; batch optimization; progress tracking         | @backend |
| Complex allocation waterfall logic | MED    | Visual designer; templates; dry-run testing                     | @backend |
| Integration with close process     | MED    | Event-driven architecture; status tracking; rollback capability | @backend |

---

## 🎯 3 Killer Features

### 1. **Drag-and-Drop Allocation Designer** 🎨

**Description**: Visual allocation rule builder with drag-and-drop configuration for complex allocation scenarios.

**Why It's Killer**:

- Visual rule builder - no coding required
- Test allocations before posting
- Multi-step allocation waterfall
- Template library for common allocations
- Better than SAP's complex cost center setup

**Implementation**:

```typescript
import { Card, Form, Button, DataTable } from "aibos-ui";

export default function AllocationDesigner() {
  const { rule, test, save } = useAllocationRule();

  return (
    <div className="space-y-6">
      <Card>
        <h3>Allocation Rule Setup</h3>
        <Form>
          <Input label="Rule Name" name="name" />
          <Select
            label="Allocation Method"
            options={[
              "Headcount",
              "Revenue",
              "Square Footage",
              "Equal",
              "Custom",
            ]}
            name="method"
          />
          <Select label="Source Account" name="source_account" searchable />
          <MultiSelect
            label="Target Departments"
            name="target_departments"
            options={departments}
          />
        </Form>
      </Card>

      <Card>
        <h3>Allocation Preview</h3>
        <DataTable
          data={rule.preview}
          columns={[
            { key: "department", label: "Department" },
            { key: "allocation_pct", label: "Allocation %" },
            { key: "amount", label: "Amount", render: formatCurrency },
          ]}
        />
        <div className="flex gap-4 mt-4">
          <Button onClick={test} variant="outline">
            Test Allocation
          </Button>
          <Button onClick={save} variant="primary">
            Save & Activate
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

### 2. **Automated Allocation Posting** ⚡

**Description**: Scheduled allocation runs that automatically post journal entries at month-end.

**Why It's Killer**:

- One-click allocation processing
- Automatic reversal of prior periods
- Email notifications on completion
- Integration with close checklist
- Industry-first fully automated allocations

**Implementation**:

```typescript
import { Button, Card, Timeline, Badge } from "aibos-ui";

export default function AllocationProcessing() {
  const { run, status } = useAllocationRun();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center">
          <div>
            <h3>Monthly Allocation Run</h3>
            <p className="text-muted">
              Process all allocation rules for current period
            </p>
          </div>
          <Button
            onClick={run}
            variant="primary"
            size="lg"
            disabled={status.running}
          >
            {status.running ? "Processing..." : "Run All Allocations"}
          </Button>
        </div>
      </Card>

      <Timeline
        items={status.rules.map((rule) => ({
          title: rule.name,
          status: rule.status,
          timestamp: rule.completed_at,
          details: `Allocated ${formatCurrency(rule.amount)} across ${
            rule.target_count
          } departments`,
        }))}
      />

      {status.completed && (
        <Card className="bg-green-50">
          <h4>Allocation Complete</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <strong>Rules Processed:</strong> {status.rules_count}
            </div>
            <div>
              <strong>Total Allocated:</strong>{" "}
              {formatCurrency(status.total_amount)}
            </div>
            <div>
              <strong>Journal Entries:</strong> {status.je_count}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
```

### 3. **Allocation Impact Analysis** 📊

**Description**: Pre-post analysis showing allocation impact by department and account.

**Why It's Killer**:

- Side-by-side before/after comparison
- Drill-down to allocation detail
- Exception alerts for unusual allocations
- Historical trend analysis
- Better than manual allocation reconciliations

**Implementation**:

```typescript
import { Chart, DataTable, Card, Badge } from "aibos-ui";

export default function AllocationAnalysis() {
  const { analysis } = useAllocationAnalysis();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h3>Before Allocation</h3>
          <div className="text-3xl">
            {formatCurrency(analysis.before_total)}
          </div>
        </Card>
        <Card>
          <h3>After Allocation</h3>
          <div className="text-3xl">{formatCurrency(analysis.after_total)}</div>
        </Card>
      </div>

      <Chart
        type="bar"
        data={analysis.by_department}
        series={[
          { key: "before", label: "Before", color: "gray" },
          { key: "after", label: "After", color: "blue" },
          { key: "allocated", label: "Allocated", color: "green" },
        ]}
        title="Allocation Impact by Department"
      />

      <DataTable
        data={analysis.details}
        columns={[
          { key: "department", label: "Department" },
          { key: "before", label: "Before", render: formatCurrency },
          { key: "allocated", label: "Allocated", render: formatCurrency },
          { key: "after", label: "After", render: formatCurrency },
          {
            key: "variance_pct",
            label: "Change %",
            render: (val) => (
              <Badge variant={Math.abs(val) > 20 ? "warning" : "default"}>
                {val >= 0 ? "+" : ""}
                {val}%
              </Badge>
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
**File**: `apps/web/app/(dashboard)/allocations/rules/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                        | Target          | Measurement          |
| ----------------------------- | --------------- | -------------------- |
| TTFB (staging)                | ≤ 70ms          | Server timing header |
| Client TTI for `/allocations` | ≤ 200ms         | Lighthouse CI        |
| Allocation calculation        | < 5s            | Progress tracking    |
| Allocation run (monthly)      | < 30s           | APM traces           |
| UI bundle size                | ≤ 250KB gzipped | Webpack analyzer     |
| Rule designer load time       | < 1s            | Performance profiler |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to rule designer, drag-drop alternatives
- **Focus Management**: Focus trap in modals; visible indicators
- **ARIA**: Live regions for allocation progress; proper roles for charts
- **Screen Reader**: All rules and allocations announced; progress communicated
- **Axe Target**: 0 serious/critical violations
- **Chart Accessibility**: Data table alternatives for all allocation charts

### Security

| Layer          | Requirement                                                                 |
| -------------- | --------------------------------------------------------------------------- |
| RBAC Scopes    | `allocation.read`, `allocation.write`, `allocation.run`, `allocation.admin` |
| Enforcement    | Server-side on all endpoints                                                |
| Data Exposure  | Only show allocations user has permission to view                           |
| Sensitive Data | Mask allocation amounts for non-finance users                               |
| Audit Trail    | All rule changes, test runs, and postings logged                            |

#### UI Permissions Matrix

| Role             | View | Create/Edit Rules | Test | Run | Admin |
| ---------------- | ---- | ----------------- | ---- | --- | ----- |
| allocation.read  | ✅   | ❌                | ❌   | ❌  | ❌    |
| allocation.write | ✅   | ✅                | ✅   | ❌  | ❌    |
| allocation.run   | ✅   | ✅                | ✅   | ✅  | ❌    |
| allocation.admin | ✅   | ✅                | ✅   | ✅  | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful allocation runs; 100% accuracy (must match source)
- **SLA Dashboards**: Real-time metrics on run status, performance, accuracy
- **Events Emitted**: `Allocation.RuleCreated`, `Allocation.RunStarted`, `Allocation.RunCompleted`
- **Logging**: Structured logs with correlation IDs for all allocation runs
- **Tracing**: Distributed tracing for multi-step waterfall allocations
- **Monitoring**: Run duration; allocation accuracy; JE posting success; error rates

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Allocation Rules

| Rule                      | Enforcement                                                  |
| ------------------------- | ------------------------------------------------------------ |
| **Source-Target Balance** | Total allocated = source amount (no gain/loss)               |
| **Allocation Methods**    | Headcount, Revenue, Square Footage, Equal, Custom, Waterfall |
| **Percentage Total**      | All target percentages must sum to 100%                      |
| **Period Lock**           | Cannot run allocations for closed periods                    |
| **Reversal**              | Prior period allocations reversed before new run             |
| **Waterfall Sequence**    | Rules execute in defined order; dependencies respected       |
| **Target Validation**     | All target accounts/departments must exist and be active     |
| **Recursive Allocation**  | Detect and prevent circular allocation dependencies          |

### Currency & Rounding

- **Display**: Presentation currency from tenant settings
- **Rounding Policy**: HALF_UP for allocation calculations
- **Multi-Currency**: Allocate in source currency; convert to target if needed
- **FX Handling**: Use period-end rate for multi-currency allocations

### Archive Semantics

- **Historical Allocations**: Retain all runs for audit trail
- **Rule Versions**: Maintain version history; show which version was used
- **Guard Rails**:
  - ❌ Deny delete if rule used in posted allocations
  - ❌ Deny delete if rule is active
  - ✅ Allow archive; inactive rules don't run

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                              | User Action     |
| --------------------- | --------------------------------------- | --------------- |
| **Empty**             | "No allocation rules"                   | "Create Rule"   |
| **Loading**           | Skeleton rule cards                     | N/A             |
| **Error**             | Error message + retry                   | Retry / Support |
| **Testing**           | Progress "Testing allocation..."        | Wait            |
| **Running**           | Progress "Processing allocations..."    | Wait            |
| **Completed**         | Green badge "Complete"                  | View JEs        |
| **Failed**            | Red alert "Allocation failed"           | Review errors   |
| **Validation Error**  | Yellow warning "Rule validation failed" | Fix rule        |
| **Waterfall**         | Progress bar with step-by-step status   | Wait            |
| **Permission Denied** | "Access restricted"                     | Back            |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Real-time Validation**: Check percentages sum to 100%, accounts exist
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal

### Network Errors

| HTTP Status | UI Message                                                    | Action              |
| ----------- | ------------------------------------------------------------- | ------------------- |
| 400         | "Invalid allocation rule. Check your input."                  | Inline field errors |
| 401         | "Session expired. Please log in again."                       | Redirect to login   |
| 403         | "You don't have permission to run allocations."               | Hide action         |
| 404         | "Allocation rule not found."                                  | Return to list      |
| 409         | "Allocation already posted for this period."                  | Show status         |
| 422         | "Validation failed: Percentages must sum to 100%."            | Inline errors       |
| 500         | "Allocation failed. Our team has been notified."              | Retry button        |
| 503         | "Allocation service unavailable. Try again in a few minutes." | Retry later         |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/allocations.json`.

### Page Titles & Headers

| Context         | Copy                         | i18n Key                     |
| --------------- | ---------------------------- | ---------------------------- |
| Main Page       | "Allocation Engine"          | `allocations.main.title`     |
| Rules List      | "Allocation Rules"           | `allocations.rules.title`    |
| Rule Designer   | "Allocation Rule Designer"   | `allocations.designer.title` |
| Run Allocations | "Run Allocations"            | `allocations.run.title`      |
| Impact Analysis | "Allocation Impact Analysis" | `allocations.analysis.title` |

### State Messages

| State             | Title                       | Message                                                  | Action Button       | i18n Key                         |
| ----------------- | --------------------------- | -------------------------------------------------------- | ------------------- | -------------------------------- |
| Empty             | "No allocation rules"       | "Create your first allocation rule"                      | "Create Rule"       | `allocations.empty.*`            |
| Loading           | —                           | —                                                        | —                   | —                                |
| Error             | "Unable to load rules"      | "Something went wrong. Our team has been notified."      | "Retry" / "Support" | `allocations.error.*`            |
| Testing           | "Testing allocation..."     | "Validating rule and calculating impact"                 | —                   | `allocations.testing.*`          |
| Running           | "Processing allocations..." | "Running {count} rules. This may take a moment."         | —                   | `allocations.running.*`          |
| Completed         | "Allocation complete"       | "Successfully allocated {amount} across {count} targets" | "View JEs"          | `allocations.completed.*`        |
| Failed            | "Allocation failed"         | "Review errors below and try again"                      | "Review"            | `allocations.failed.*`           |
| Validation Error  | "Rule validation failed"    | "Fix validation errors before saving"                    | "Review"            | `allocations.validationError.*`  |
| Permission Denied | "Access restricted"         | "You don't have permission for allocation management"    | "Back"              | `allocations.permissionDenied.*` |

### Action Confirmations

| Action          | Title                  | Message                                                            | Confirm Button | Cancel Button | i18n Key                        |
| --------------- | ---------------------- | ------------------------------------------------------------------ | -------------- | ------------- | ------------------------------- |
| Run Allocations | "Run allocations?"     | "Execute all active allocation rules for current period?"          | "Run"          | "Cancel"      | `allocations.run.confirm.*`     |
| Delete Rule     | "Delete rule?"         | "Delete '{name}'? This cannot be undone."                          | "Delete"       | "Cancel"      | `allocations.delete.confirm.*`  |
| Reverse Run     | "Reverse allocations?" | "Reverse allocations for {period}? Original JEs will be reversed." | "Reverse"      | "Cancel"      | `allocations.reverse.confirm.*` |

### Success Messages (Toast)

| Action            | Message                              | i18n Key                      |
| ----------------- | ------------------------------------ | ----------------------------- |
| Rule Created      | "Rule '{name}' created successfully" | `allocations.create.success`  |
| Rule Updated      | "Rule '{name}' updated successfully" | `allocations.update.success`  |
| Test Complete     | "Test complete: {amount} allocated"  | `allocations.test.success`    |
| Run Complete      | "Allocations posted successfully"    | `allocations.run.success`     |
| Reversal Complete | "Allocations reversed successfully"  | `allocations.reverse.success` |

### Error Messages (Toast)

| Scenario            | Message                                               | i18n Key                         |
| ------------------- | ----------------------------------------------------- | -------------------------------- |
| Create Failed       | "Failed to create rule. Please try again."            | `allocations.create.error`       |
| Validation Failed   | "Validation failed: {error details}"                  | `allocations.validation.error`   |
| Run Failed          | "Allocation run failed. Check rule configuration."    | `allocations.run.error`          |
| Already Posted      | "Allocations already posted for this period."         | `allocations.errorAlreadyPosted` |
| Percentages Invalid | "Target percentages must sum to 100%."                | `allocations.errorPercentages`   |
| Circular Dependency | "Circular dependency detected in waterfall sequence." | `allocations.errorCircular`      |
| Network Error       | "Network error. Check your connection and try again." | `allocations.error.network`      |

### Form Labels & Help Text

| Field              | Label                | Placeholder           | Help Text                                      | i18n Key                            |
| ------------------ | -------------------- | --------------------- | ---------------------------------------------- | ----------------------------------- |
| Rule Name          | "Rule Name"          | "e.g., IT Allocation" | "Descriptive name for this rule"               | `allocations.field.name.*`          |
| Allocation Method  | "Method"             | "Select method"       | "How to calculate allocation percentages"      | `allocations.field.method.*`        |
| Source Account     | "Source Account"     | "Search accounts"     | "Account to allocate from"                     | `allocations.field.sourceAccount.*` |
| Target Departments | "Target Departments" | "Select departments"  | "Departments to allocate to"                   | `allocations.field.targets.*`       |
| Allocation Basis   | "Basis"              | "e.g., Headcount"     | "Metric used for allocation (headcount, etc.)" | `allocations.field.basis.*`         |
| Effective Date     | "Effective Date"     | "YYYY-MM-DD"          | "When this rule becomes active"                | `allocations.field.effectiveDate.*` |
| Waterfall Sequence | "Sequence"           | "1"                   | "Order in waterfall (1 = first)"               | `allocations.field.sequence.*`      |

### Keyboard Shortcuts Help

| Shortcut | Description            | i18n Key                         |
| -------- | ---------------------- | -------------------------------- |
| `/`      | "Focus search"         | `allocations.shortcuts.search`   |
| `n`      | "Create new rule"      | `allocations.shortcuts.new`      |
| `t`      | "Test allocation"      | `allocations.shortcuts.test`     |
| `r`      | "Run allocations"      | `allocations.shortcuts.run`      |
| `a`      | "View impact analysis" | `allocations.shortcuts.analysis` |
| `↑ / ↓`  | "Navigate rules"       | `allocations.shortcuts.navigate` |
| `Enter`  | "Open selected rule"   | `allocations.shortcuts.open`     |
| `Escape` | "Close modal/cancel"   | `allocations.shortcuts.cancel`   |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useAllocation.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useAllocationRules(filters = {}) {
  return useQuery({
    queryKey: ["allocations", "rules", filters],
    queryFn: () => apiClient.GET("/api/allocations/rules", { query: filters }),
    staleTime: 60_000, // 1min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useAllocationRule(id: string) {
  return useQuery({
    queryKey: ["allocations", "rule", id],
    queryFn: () =>
      apiClient.GET("/api/allocations/rules/[id]", { params: { id } }),
    staleTime: 60_000, // 1min
    enabled: !!id,
    select: (response) => response.data,
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      method: string;
      source_account_id: string;
      targets: Array<{ department_id: string; percentage: number }>;
    }) => apiClient.POST("/api/allocations/rules", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["allocations", "rules"] });
      toast.success(`Rule '${data.name}' created successfully`);
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Validation failed: Check percentages sum to 100%");
      } else {
        toast.error("Failed to create rule.");
      }
    },
  });
}

export function useTestAllocation(ruleId: string) {
  return useMutation({
    mutationFn: (data?: { period?: string }) =>
      apiClient.POST("/api/allocations/test", {
        body: { rule_id: ruleId, ...data },
      }),
    onSuccess: (data) => {
      toast.success(`Test complete: ${data.total_amount} allocated`);
    },
    onError: () => {
      toast.error("Test failed. Check rule configuration.");
    },
  });
}

export function useRunAllocations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { period: string; rule_ids?: string[] }) =>
      apiClient.POST("/api/allocations/run", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["allocations"] });
      toast.success(`Allocations posted: ${data.je_count} journal entries`);
    },
    onError: (error) => {
      if (error.status === 409) {
        toast.error("Allocations already posted for this period.");
      } else {
        toast.error("Allocation run failed. Review errors.");
      }
    },
  });
}

export function useAllocationHistory(period: string) {
  return useQuery({
    queryKey: ["allocations", "history", period],
    queryFn: () =>
      apiClient.GET("/api/allocations/history", { query: { period } }),
    staleTime: 5 * 60_000, // 5min
    select: (response) => response.data,
  });
}

export function useAllocationAnalysis(period: string) {
  return useQuery({
    queryKey: ["allocations", "analysis", period],
    queryFn: () =>
      apiClient.GET("/api/allocations/analysis", { query: { period } }),
    staleTime: 60_000, // 1min
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error         | User Message                                       | UI Action            |
| ----------------- | -------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid allocation rule. Check your input."       | Inline field errors  |
| 409 (Conflict)    | "Allocation already posted for this period."       | Show status          |
| 422 (Validation)  | "Validation failed: Percentages must sum to 100%." | Inline errors        |
| 403 (Forbidden)   | "You don't have permission to run allocations."    | Hide action          |
| 500 (Server)      | "Allocation failed. Our team has been notified."   | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Allocation run**: 60s timeout (long-running operation)

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["allocations", "rules", filters][("allocations", "rule", ruleId)][
  ("allocations", "history", period)
][("allocations", "analysis", period)];
```

### Invalidation Rules

| Action              | Invalidates                                                 |
| ------------------- | ----------------------------------------------------------- |
| Create Rule         | `["allocations", "rules"]`                                  |
| Update Rule         | `["allocations", "rules"]`, `["allocations", "rule", id]`   |
| Delete Rule         | `["allocations", "rules"]`                                  |
| Run Allocations     | `["allocations", "history"]`, `["allocations", "analysis"]` |
| Reverse Allocations | `["allocations", "history"]`                                |

### Stale Time

| Query Type         | Stale Time | Reasoning                     |
| ------------------ | ---------- | ----------------------------- |
| Rules List         | 1min       | Rules change infrequently     |
| Rule Detail        | 1min       | Rule details rarely change    |
| Allocation History | 5min       | History is static once posted |
| Impact Analysis    | 1min       | Regenerate for current data   |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("allocations-rules"); // After rule changes
revalidateTag("allocations-history"); // After run
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/allocations.fixtures.ts`

**Datasets**:

- `minimalRules`: 2 simple allocation rules
- `standardRules`: 5 rules with various methods
- `waterfallRules`: Complex multi-step waterfall
- `edgeCases`: Edge cases (100% to one target, circular dependencies)

**Edge Cases Covered**:

- Single target (100% allocation)
- Equal allocation (25% each to 4 targets)
- Circular dependency detection
- Invalid percentage totals (<100%, >100%)
- Inactive rules
- Historical allocation runs

```typescript
// Example fixture
export const standardAllocationRules: AllocationRuleFixture[] = [
  {
    id: "rule_1",
    name: "IT Allocation",
    method: "Headcount",
    source_account_id: "acct_it",
    targets: [
      { department_id: "dept_sales", percentage: 40 },
      { department_id: "dept_ops", percentage: 30 },
      { department_id: "dept_admin", percentage: 30 },
    ],
    status: "active",
  },
  // ... more rules
];
```

### E2E Seed Data

**Location**: `tests/seeds/allocations.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:allocations
```

**Dataset**:

- 10 allocation rules (5 active, 5 inactive)
- 3 complete allocation runs (3 prior periods)
- Test data for all allocation methods
- Waterfall sequence with 4 steps

**Cleanup Command**:

```powershell
pnpm run seed:allocations:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic company "Demo Corp Inc." with 10 departments
- 8 allocation rules covering common scenarios
- Complete allocation history (last 6 months)
- Impact analysis showing before/after

**Regeneration**:

```powershell
pnpm run demo:reset:allocations
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] Target percentages sum to 100%
- [ ] All referenced accounts/departments exist
- [ ] No circular dependencies
- [ ] Waterfall sequence is valid

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
- **Interactive Parts**: Mark with `"use client"` (rule designer, allocation run, charts)

### Data Fetching Strategy

| Scenario           | Strategy                            | Benefit             |
| ------------------ | ----------------------------------- | ------------------- |
| Initial Rules List | Server-side fetch + stream          | Faster TTFB         |
| Rule Testing       | Client-side React Query             | Real-time feedback  |
| Allocation Run     | Client-side with progress tracking  | User visibility     |
| Impact Analysis    | Server component with client charts | SEO + interactivity |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function runAllocations(data) {
  // ... mutation logic
  revalidateTag("allocations-rules");
  revalidateTag("allocations-history");
}
```

---

## 📊 Analytics & Audit Events

| Event                   | When          | Properties                                                     |
| ----------------------- | ------------- | -------------------------------------------------------------- |
| Allocation.RuleCreated  | After 2xx     | `rule_id`, `name`, `method`, `target_count`                    |
| Allocation.RuleUpdated  | After 2xx     | `rule_id`, changed fields                                      |
| Allocation.TestRun      | Test complete | `rule_id`, `period`, `total_amount`, `target_count`            |
| Allocation.RunStarted   | Run initiated | `period`, `rule_count`, `timestamp`                            |
| Allocation.RunCompleted | Run complete  | `period`, `rule_count`, `je_count`, `total_amount`, `duration` |
| Allocation.RuleDeleted  | After 2xx     | `rule_id`, `name`                                              |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Allocation.RunCompleted", {
  period: "2025-03",
  rule_count: 12,
  je_count: 48,
  total_amount: 1500000,
  duration_ms: 2500,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/allocations.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency Display**: Respect locale-specific currency symbols
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Fiscal Period Display**: Respect fiscal year conventions

### Keyboard Shortcuts

| Key      | Action               | Scope       |
| -------- | -------------------- | ----------- |
| `/`      | Focus search         | Any page    |
| `n`      | Create new rule      | Rules list  |
| `t`      | Test allocation      | Rule detail |
| `r`      | Run allocations      | Main page   |
| `a`      | View impact analysis | Main page   |
| `↑ / ↓`  | Navigate rules       | Table       |
| `Enter`  | Open selected rule   | Table       |
| `Escape` | Close modal/cancel   | Modal/Form  |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateModal()],
  ["t", () => testAllocation()],
  ["r", () => runAllocations()],
  ["a", () => router.push("/allocations/analysis")],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                  | Duration | Rollback Trigger |
| ----------- | ---------------- | ------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                  | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, allocation accuracy 100%      | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, allocation runs complete < 30s | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained          | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m16_allocations: false,              // Master toggle
  m16_allocations_designer: false,     // Visual rule designer
  m16_allocations_auto_run: false,     // Automated allocation run
  m16_allocations_waterfall: false,    // Multi-step waterfall
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/allocations/*`)
- P50/P95/P99 latency
- Allocation run duration
- Allocation accuracy (total allocated = source)
- JE posting success rate
- Rule test frequency

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Allocation run > 60s → investigate performance
- Allocation accuracy < 100% → immediate escalation (critical)
- P95 latency > 500ms for 10min → investigate

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m16_allocations = false`

   ```powershell
   pnpm run flags:set m16_allocations=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("allocations-rules");
   revalidateTag("allocations-history");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/allocations/*"
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

| Scenario                   | Action             | Approval Required |
| -------------------------- | ------------------ | ----------------- |
| Error rate > 5%            | Immediate rollback | No (auto-trigger) |
| Allocation accuracy < 100% | Immediate rollback | No (auto-trigger) |
| Run duration > 120s        | Investigate first  | On-call engineer  |
| Error rate 1-5%            | Partial rollback   | On-call engineer  |
| P95 latency > 1s           | Investigate first  | On-call engineer  |
| Data corruption/loss       | Immediate rollback | No (auto-trigger) |

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

- SAP: Cost center allocations
- Oracle: Allocation waterfall
- NetSuite: Allocation rules
- ERPNext: Cost allocation

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Allocation Calculation Accuracy

**Mitigation**: Automated validation (total allocated = source amount); test mode before posting; reconciliation checks; audit trail

### Risk #2: Period-End Processing Performance

**Mitigation**: Async processing with progress tracking; batch optimization; timeout limits (30s); queue-based architecture

### Risk #3: Complex Allocation Waterfall Logic

**Mitigation**: Visual designer with templates; dry-run testing; circular dependency detection; step-by-step validation

### Risk #4: Integration with Close Process

**Mitigation**: Event-driven architecture; status tracking; rollback capability; close checklist integration

---

## 📝 Implementation Guide

### Day 1: Rules & Designer (8 hours)

1. Build allocation rules list and CRUD (3 hours)
2. Implement rule designer with visual builder (4 hours)
3. Add test allocation functionality (1 hour)

### Day 2: Run & Analysis (4 hours)

1. Implement allocation run with progress tracking (2 hours)
2. Build impact analysis page (2 hours)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Allocation percentage validation (must sum to 100%)
- [ ] Source-target balance check (total allocated = source)
- [ ] Circular dependency detection
- [ ] Waterfall sequence validation
- [ ] useAllocationRules hook fetches correctly
- [ ] Currency formatting displays correctly

### Integration Tests

- [ ] Create rule → appears in list
- [ ] Test allocation → calculates correctly
- [ ] Run allocations → posts journal entries
- [ ] Update rule → changes reflected
- [ ] Delete rule → removed (if not used)
- [ ] Reverse allocations → JEs reversed
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] User can navigate to allocations page
- [ ] User can create allocation rule
- [ ] User can test allocation before posting
- [ ] User can run monthly allocations
- [ ] User can view impact analysis
- [ ] User can view allocation history
- [ ] Keyboard-only flow: create → test → run
- [ ] Waterfall sequence executes correctly

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Charts have data table alternatives
- [ ] Screen reader announces rules and progress
- [ ] Focus management correct (modals, forms, charts)
- [ ] Color contrast meets WCAG 2.2 AA (AAA where practical)
- [ ] Axe: 0 serious/critical violations
- [ ] Progress indicators are accessible

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] All API endpoints return expected status codes

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for rules, designer, analysis
- [ ] Dark/light theme variations
- [ ] Progress states captured
- [ ] Loading/error/empty states captured

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/allocations/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] Allocation calculation < 5s
- [ ] Allocation run < 30s (50 rules)
- [ ] Rule designer load < 1s

---

## 📅 Timeline

| Day | Deliverable             |
| --- | ----------------------- |
| 1   | Rules + Designer + Test |
| 2   | Run + Analysis          |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries (for posting allocation JEs)
- ✅ Departments/Cost Centers setup

### Enables These Modules

- M17: Consolidation (uses allocation results)
- M20: Close Management (allocation in close checklist)

---

## 🎯 Success Criteria

### Must Have

- [ ] Create and manage allocation rules (CRUD)
- [ ] Test allocations before posting
- [ ] Run monthly allocations (all active rules)
- [ ] View allocation history
- [ ] Impact analysis (before/after)
- [ ] Support all allocation methods (Headcount, Revenue, Square Footage, Equal, Custom)
- [ ] 100% accuracy (total allocated = source amount)

### Should Have

- [ ] Visual rule designer with templates
- [ ] Allocation waterfall (multi-step)
- [ ] Automated reversal of prior period
- [ ] Email notifications on completion
- [ ] Integration with close checklist

### Nice to Have

- [ ] Drag-and-drop rule builder
- [ ] AI-suggested allocation methods
- [ ] Allocation forecasting
- [ ] What-if scenario modeling

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/allocations`, `/allocations/rules`, `/allocations/run`, `/allocations/analysis`)
- [ ] Allocation rules CRUD working
- [ ] Test allocation working (dry-run before posting)
- [ ] Run allocations working (posts JEs)
- [ ] Impact analysis working
- [ ] Allocation history working
- [ ] All allocation methods supported
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
- [ ] Integration tests: All allocation operations covered
- [ ] E2E tests: All user flows covered (create → test → run)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Allocation calculation flow
- Rule validation flow
- Allocation run flow
- Reversal flow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/allocations/*` routes
- [ ] TTFB: ≤70ms on staging (Server-Timing header)
- [ ] TTI: ≤200ms for `/allocations` (Lighthouse CI)
- [ ] Allocation calculation: < 5s
- [ ] Allocation run: < 30s (50 rules)
- [ ] Rule designer load: < 1s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues
- [ ] Charts: Data table alternatives provided

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `Allocation.RuleCreated`
  - `Allocation.RunStarted`
  - `Allocation.RunCompleted`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, accuracy, duration)
- [ ] Allocation accuracy monitoring (100% required)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Allocation amounts masked for non-finance users
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] All rule changes logged for audit trail
- [ ] Data retention policy enforced

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete (changes, testing, screenshots)
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized (OpenAPI hash verified)
- [ ] i18n keys documented in copy deck
- [ ] User acceptance testing passed (PM/QA sign-off)
- [ ] Allocation methodology documented

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m16_allocations = false` (ready to enable)
  - `flags.m16_allocations_designer = false` (phase 2)
  - `flags.m16_allocations_auto_run = false` (phase 2)
  - `flags.m16_allocations_waterfall = false` (phase 2)
- [ ] Smoke tests passed on staging
- [ ] Load tests passed (≥1000 concurrent users, 50 rules)
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
- [ ] **Finance/Controller**: Allocation methodology validated, 100% accuracy confirmed

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M15 - Cash Flow Forecasting  
**Next**: M17 - Consolidation
