# 🚀 M18: Intercompany - UI Implementation Runbook

**Module ID**: M18  
**Module Name**: Intercompany  
**Priority**: HIGH  
**Phase**: 5 - Consolidation & Allocation  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Intercompany manages **intercompany transaction tracking, matching, and reconciliation** across entities with automated settlements.

### Business Value

- Automated intercompany transaction matching
- Receivable/Payable reconciliation
- Intercompany settlement processing
- Mismatch identification and resolution
- Consolidation elimination support

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-ic-matching], [ADR-###-ic-settlement], [ADR-###-mismatch-workflow]

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

- ✅ `/api/intercompany/transactions` - List IC transactions
- ✅ `/api/intercompany/match` - Auto-match transactions
- ✅ `/api/intercompany/mismatches` - Mismatch list
- ✅ `/api/intercompany/settle` - Process settlement
- ✅ `/api/intercompany/balances` - IC balance matrix
- ✅ `/api/intercompany/resolve` - Resolve mismatch
- ✅ `/api/intercompany/eliminations` - Generate eliminations

**Total Endpoints**: 7

### Risks & Blockers

| Risk                                 | Impact | Mitigation                                                          | Owner     |
| ------------------------------------ | ------ | ------------------------------------------------------------------- | --------- |
| Matching accuracy (false positives)  | HIGH   | AI confidence scoring; manual review workflow; adjustable tolerance | @backend  |
| Cross-entity data access permissions | HIGH   | Entity-level RBAC; audit trail; data masking                        | @security |
| Settlement timing and FX rates       | MED    | Timestamp validation; FX rate locking; settlement date control      | @finance  |
| Mismatch resolution delays           | MED    | SLA tracking; escalation workflow; automated reminders              | @ops      |

---

## 🎯 3 Killer Features

### 1. **Auto-Match Intercompany Transactions** 🤝

**Description**: AI-powered matching of intercompany receivables and payables across entities.

**Why It's Killer**:

- Automatic AR/AP matching
- Smart suggestions for partial matches
- Mismatch exception workflow
- Real-time match status
- Industry-first automated IC matching

**Implementation**:

```typescript
import { DataTable, Button, Badge, Card } from "aibos-ui";

export default function ICMatching() {
  const { transactions, autoMatch } = useICMatching();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2>Intercompany Matching</h2>
        <Button onClick={autoMatch} variant="primary">
          Auto-Match Transactions
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Total IC Balance</h3>
          <div className="text-3xl">{formatCurrency(transactions.total)}</div>
        </Card>
        <Card>
          <h3>Matched</h3>
          <div className="text-3xl text-green-600">
            {formatCurrency(transactions.matched)}
          </div>
        </Card>
        <Card>
          <h3>Unmatched</h3>
          <div className="text-3xl text-orange-600">
            {formatCurrency(transactions.unmatched)}
          </div>
        </Card>
        <Card>
          <h3>Match Rate</h3>
          <div className="text-3xl">{transactions.match_rate}%</div>
        </Card>
      </div>

      <DataTable
        data={transactions.list}
        columns={[
          { key: "entity_from", label: "From Entity" },
          { key: "entity_to", label: "To Entity" },
          { key: "transaction", label: "Transaction" },
          { key: "amount", label: "Amount", render: formatCurrency },
          {
            key: "match_status",
            label: "Status",
            render: (val) => (
              <Badge
                variant={
                  val === "Matched"
                    ? "success"
                    : val === "Partial"
                    ? "warning"
                    : "destructive"
                }
              >
                {val}
              </Badge>
            ),
          },
          {
            key: "confidence",
            label: "AI Confidence",
            render: (val) => <Badge variant="info">{val}%</Badge>,
          },
        ]}
      />
    </div>
  );
}
```

### 2. **Intercompany Settlement Dashboard** 💸

**Description**: Centralized view of all intercompany balances with one-click settlement.

**Why It's Killer**:

- Real-time IC balance tracking
- Net settlement calculations
- Automated payment instructions
- Settlement history and audit trail
- Better than manual IC reconciliations

**Implementation**:

```typescript
import { Card, DataTable, Button, Chart } from "aibos-ui";

export default function ICSettlement() {
  const { balances, settle } = useICSettlement();

  return (
    <div className="space-y-6">
      <Card>
        <h3>Net Settlement Matrix</h3>
        <Chart
          type="heatmap"
          data={balances.matrix}
          title="Intercompany Balances"
        />
      </Card>

      <DataTable
        data={balances.entity_pairs}
        columns={[
          { key: "entity_pair", label: "Entity Pair" },
          { key: "ar_balance", label: "AR Balance", render: formatCurrency },
          { key: "ap_balance", label: "AP Balance", render: formatCurrency },
          { key: "net_balance", label: "Net Balance", render: formatCurrency },
          {
            key: "actions",
            label: "Actions",
            render: (_, row) => (
              <Button size="sm" onClick={() => settle(row.id)}>
                Settle
              </Button>
            ),
          },
        ]}
      />

      <Card className="bg-blue-50">
        <h3>Settlement Instructions</h3>
        <div className="space-y-2">
          {balances.settlement_instructions.map((instruction, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center p-2 bg-white rounded"
            >
              <span>
                {instruction.from} → {instruction.to}
              </span>
              <strong>{formatCurrency(instruction.amount)}</strong>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

### 3. **IC Mismatch Resolution Workflow** 🔍

**Description**: Guided workflow for investigating and resolving intercompany mismatches.

**Why It's Killer**:

- Exception-based workflow
- Side-by-side entity comparison
- Collaborative resolution tools
- Adjustment entry generation
- Faster than email-based resolution

**Implementation**:

```typescript
import { Card, DataTable, Button, Badge, Form } from "aibos-ui";

export default function MismatchResolution({ mismatchId }) {
  const { mismatch, resolve } = useMismatchResolution(mismatchId);

  return (
    <div className="space-y-6">
      <Card>
        <h3>Mismatch Details</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4>{mismatch.entity_a} View</h4>
            <div className="space-y-2">
              <div>
                <strong>Amount:</strong> {formatCurrency(mismatch.amount_a)}
              </div>
              <div>
                <strong>Date:</strong> {mismatch.date_a}
              </div>
              <div>
                <strong>Reference:</strong> {mismatch.ref_a}
              </div>
            </div>
          </div>
          <div>
            <h4>{mismatch.entity_b} View</h4>
            <div className="space-y-2">
              <div>
                <strong>Amount:</strong> {formatCurrency(mismatch.amount_b)}
              </div>
              <div>
                <strong>Date:</strong> {mismatch.date_b}
              </div>
              <div>
                <strong>Reference:</strong> {mismatch.ref_b}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-red-50 rounded">
          <strong>Difference:</strong>{" "}
          {formatCurrency(Math.abs(mismatch.amount_a - mismatch.amount_b))}
        </div>
      </Card>

      <Card>
        <h3>Resolution Action</h3>
        <Form onSubmit={resolve}>
          <Select
            label="Resolution Type"
            name="resolution_type"
            options={[
              "Adjust Entity A",
              "Adjust Entity B",
              "Create elimination entry",
              "Write-off difference",
            ]}
          />
          <Input label="Explanation" name="explanation" multiline />
          <Input label="Adjustment Amount" name="amount" type="number" />

          <div className="flex gap-4 mt-4">
            <Button type="submit" variant="primary">
              Resolve Mismatch
            </Button>
            <Button variant="outline" onClick={() => escalate(mismatchId)}>
              Escalate to Manager
            </Button>
          </div>
        </Form>
      </Card>
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
**File**: `apps/web/app/(dashboard)/intercompany/mismatches/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                         | Target          | Measurement          |
| ------------------------------ | --------------- | -------------------- |
| TTFB (staging)                 | ≤ 70ms          | Server timing header |
| Client TTI for `/intercompany` | ≤ 200ms         | Lighthouse CI        |
| Auto-match processing          | < 10s           | Progress tracking    |
| Settlement calculation         | < 3s            | APM traces           |
| Balance matrix load            | < 1s            | Performance profiler |
| UI bundle size                 | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to transaction matching, resolution workflow
- **Focus Management**: Focus trap in modals; visible indicators
- **ARIA**: Live regions for match progress; proper roles for matrix/heatmaps
- **Screen Reader**: All transactions and mismatches announced; match status communicated
- **Axe Target**: 0 serious/critical violations
- **Chart Accessibility**: Data table alternatives for balance matrix heatmap

### Security

| Layer          | Requirement                                                                            |
| -------------- | -------------------------------------------------------------------------------------- |
| RBAC Scopes    | `intercompany.read`, `intercompany.match`, `intercompany.settle`, `intercompany.admin` |
| Enforcement    | Server-side on all endpoints; entity-level access control                              |
| Data Exposure  | Only show transactions for entities user has access to                                 |
| Sensitive Data | Mask amounts for non-finance users; log all matches/settlements                        |
| Audit Trail    | All matching, settlement, resolution actions logged                                    |

#### UI Permissions Matrix

| Role                | View | Match | Settle | Resolve | Admin |
| ------------------- | ---- | ----- | ------ | ------- | ----- |
| intercompany.read   | ✅   | ❌    | ❌     | ❌      | ❌    |
| intercompany.match  | ✅   | ✅    | ❌     | ✅      | ❌    |
| intercompany.settle | ✅   | ✅    | ✅     | ✅      | ❌    |
| intercompany.admin  | ✅   | ✅    | ✅     | ✅      | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful matches; 100% settlement accuracy
- **SLA Dashboards**: Real-time metrics on match rate, mismatch count, settlement status
- **Events Emitted**: `IC.MatchCompleted`, `IC.MismatchDetected`, `IC.SettlementProcessed`
- **Logging**: Structured logs with correlation IDs for all IC operations
- **Tracing**: Distributed tracing for cross-entity transactions
- **Monitoring**: Match accuracy; mismatch resolution SLA; settlement timing

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Intercompany Rules

| Rule                       | Enforcement                                         |
| -------------------------- | --------------------------------------------------- |
| **AR/AP Symmetry**         | AR in Entity A = AP in Entity B (within tolerance)  |
| **Match Tolerance**        | Configurable threshold (default 0.1% or $10)        |
| **Settlement Balance**     | Total settlements = net IC balance                  |
| **Entity Pair Uniqueness** | One active transaction per entity pair + reference  |
| **Elimination Accuracy**   | Auto-generated eliminations balance to zero         |
| **FX Rate Consistency**    | Use same rate for both sides of IC transaction      |
| **Date Alignment**         | Transaction dates within 5 days (configurable)      |
| **Resolution Workflow**    | Mismatch must be resolved or escalated (no orphans) |

### Currency & Rounding

- **Display**: Reporting currency (typically USD)
- **Rounding Policy**: HALF_UP for settlement calculations
- **Multi-Currency**: Convert all IC transactions to common currency for matching
- **FX Rates**: Use transaction date rate; lock rate on settlement
- **Settlement Currency**: Use agreed settlement currency (typically parent entity currency)

### Archive Semantics

- **Historical Transactions**: Retain all matched/settled transactions for audit
- **Mismatch History**: Maintain resolution trail
- **Guard Rails**:
  - ❌ Deny delete if transaction is matched
  - ❌ Deny delete if referenced in settlement
  - ✅ Allow archive after fiscal year close + 7 years

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                          | User Action       |
| --------------------- | ----------------------------------- | ----------------- |
| **Empty**             | "No intercompany transactions"      | "Add Transaction" |
| **Loading**           | Skeleton transaction cards          | N/A               |
| **Error**             | Error message + retry               | Retry / Support   |
| **Matching**          | Progress "Matching transactions..." | Wait              |
| **Matched**           | Green badge "Matched"               | View details      |
| **Partial Match**     | Yellow badge "Partial Match"        | Review/Adjust     |
| **Unmatched**         | Red badge "Unmatched"               | Manual match      |
| **Mismatch**          | Orange alert "Mismatch detected"    | Resolve           |
| **Settling**          | Progress "Processing settlement..." | Wait              |
| **Settled**           | Green badge "Settled"               | View payment      |
| **Escalated**         | Purple badge "Escalated"            | Monitor           |
| **Permission Denied** | "Access restricted"                 | Back              |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Real-time Validation**: Check amounts match (within tolerance), dates aligned
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal

### Network Errors

| HTTP Status | UI Message                                               | Action              |
| ----------- | -------------------------------------------------------- | ------------------- |
| 400         | "Invalid transaction data. Check your input."            | Inline field errors |
| 401         | "Session expired. Please log in again."                  | Redirect to login   |
| 403         | "You don't have permission for this entity."             | Hide action         |
| 404         | "Transaction not found."                                 | Return to list      |
| 409         | "Transaction already matched."                           | Show status         |
| 422         | "Validation failed: Amount mismatch exceeds tolerance."  | Inline errors       |
| 500         | "Matching failed. Our team has been notified."           | Retry button        |
| 503         | "Settlement service unavailable. Try again in a moment." | Retry later         |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/intercompany.json`.

### Page Titles & Headers

| Context              | Copy                        | i18n Key                        |
| -------------------- | --------------------------- | ------------------------------- |
| Main Page            | "Intercompany Transactions" | `intercompany.main.title`       |
| Matching Dashboard   | "IC Matching"               | `intercompany.matching.title`   |
| Settlement Dashboard | "IC Settlement"             | `intercompany.settlement.title` |
| Mismatch Resolution  | "Resolve Mismatch"          | `intercompany.mismatch.title`   |
| Balance Matrix       | "Intercompany Balances"     | `intercompany.balances.title`   |

### State Messages

| State             | Title                         | Message                                                   | Action Button       | i18n Key                          |
| ----------------- | ----------------------------- | --------------------------------------------------------- | ------------------- | --------------------------------- |
| Empty             | "No IC transactions"          | "No intercompany transactions for this period"            | "Add Transaction"   | `intercompany.empty.*`            |
| Loading           | —                             | —                                                         | —                   | —                                 |
| Error             | "Unable to load transactions" | "Something went wrong. Our team has been notified."       | "Retry" / "Support" | `intercompany.error.*`            |
| Matching          | "Matching transactions..."    | "Analyzing {count} transactions. This may take a moment." | —                   | `intercompany.matching.*`         |
| Matched           | "Match found"                 | "Transaction matched successfully"                        | "View"              | `intercompany.matched.*`          |
| Partial Match     | "Partial match"               | "Partial match found. Review and adjust."                 | "Review"            | `intercompany.partialMatch.*`     |
| Unmatched         | "No match"                    | "No matching transaction found"                           | "Manual Match"      | `intercompany.unmatched.*`        |
| Mismatch          | "Mismatch detected"           | "Amount difference: {amount}. Resolution required."       | "Resolve"           | `intercompany.mismatch.*`         |
| Settling          | "Processing settlement..."    | "Settling {count} entity pairs"                           | —                   | `intercompany.settling.*`         |
| Settled           | "Settlement complete"         | "Successfully settled {amount}"                           | "View Payment"      | `intercompany.settled.*`          |
| Escalated         | "Mismatch escalated"          | "Escalated to {manager} for review"                       | "Monitor"           | `intercompany.escalated.*`        |
| Permission Denied | "Access restricted"           | "You don't have permission for this entity"               | "Back"              | `intercompany.permissionDenied.*` |

### Action Confirmations

| Action     | Title                      | Message                                                          | Confirm Button | Cancel Button | i18n Key                          |
| ---------- | -------------------------- | ---------------------------------------------------------------- | -------------- | ------------- | --------------------------------- |
| Auto-Match | "Auto-match transactions?" | "Match all pending IC transactions? Review results after."       | "Match"        | "Cancel"      | `intercompany.match.confirm.*`    |
| Settle     | "Process settlement?"      | "Settle {amount} between {entities}? Payment will be initiated." | "Settle"       | "Cancel"      | `intercompany.settle.confirm.*`   |
| Resolve    | "Resolve mismatch?"        | "Apply {resolution_type}? This will adjust balances."            | "Resolve"      | "Cancel"      | `intercompany.resolve.confirm.*`  |
| Escalate   | "Escalate mismatch?"       | "Escalate to {manager} for resolution?"                          | "Escalate"     | "Cancel"      | `intercompany.escalate.confirm.*` |

### Success Messages (Toast)

| Action              | Message                                     | i18n Key                        |
| ------------------- | ------------------------------------------- | ------------------------------- |
| Match Complete      | "{count} transactions matched successfully" | `intercompany.match.success`    |
| Settlement Complete | "Settlement processed: {amount}"            | `intercompany.settle.success`   |
| Mismatch Resolved   | "Mismatch resolved successfully"            | `intercompany.resolve.success`  |
| Escalated           | "Mismatch escalated to {manager}"           | `intercompany.escalate.success` |

### Error Messages (Toast)

| Scenario                 | Message                                                      | i18n Key                           |
| ------------------------ | ------------------------------------------------------------ | ---------------------------------- |
| Match Failed             | "Matching failed. Review transactions and try again."        | `intercompany.match.error`         |
| Settlement Failed        | "Settlement failed. Check entity payment setup."             | `intercompany.settle.error`        |
| Amount Exceeds Tolerance | "Amount mismatch exceeds tolerance. Manual review required." | `intercompany.errorTolerance`      |
| FX Rate Missing          | "FX rate missing for {currency}. Add rate to continue."      | `intercompany.errorFxRate`         |
| Already Matched          | "Transaction already matched."                               | `intercompany.errorAlreadyMatched` |
| Entity Access Denied     | "You don't have access to {entity}."                         | `intercompany.errorAccess`         |
| Network Error            | "Network error. Check your connection and try again."        | `intercompany.error.network`       |

### Form Labels & Help Text

| Field            | Label              | Placeholder         | Help Text                            | i18n Key                          |
| ---------------- | ------------------ | ------------------- | ------------------------------------ | --------------------------------- |
| Entity From      | "From Entity"      | "Select entity"     | "Entity originating the transaction" | `intercompany.field.entityFrom.*` |
| Entity To        | "To Entity"        | "Select entity"     | "Entity receiving the transaction"   | `intercompany.field.entityTo.*`   |
| Amount           | "Amount"           | "0.00"              | "Transaction amount"                 | `intercompany.field.amount.*`     |
| Transaction Date | "Transaction Date" | "YYYY-MM-DD"        | "Date of intercompany transaction"   | `intercompany.field.date.*`       |
| Reference        | "Reference"        | "e.g., INV-12345"   | "Invoice or reference number"        | `intercompany.field.reference.*`  |
| Match Tolerance  | "Match Tolerance"  | "0.1%"              | "Acceptable variance for auto-match" | `intercompany.field.tolerance.*`  |
| Resolution Type  | "Resolution"       | "Select resolution" | "How to resolve this mismatch"       | `intercompany.field.resolution.*` |

### Keyboard Shortcuts Help

| Shortcut | Description             | i18n Key                          |
| -------- | ----------------------- | --------------------------------- |
| `/`      | "Focus search"          | `intercompany.shortcuts.search`   |
| `m`      | "Auto-match"            | `intercompany.shortcuts.match`    |
| `s`      | "Settlement dashboard"  | `intercompany.shortcuts.settle`   |
| `r`      | "Resolve selected"      | `intercompany.shortcuts.resolve`  |
| `n`      | "New transaction"       | `intercompany.shortcuts.new`      |
| `↑ / ↓`  | "Navigate transactions" | `intercompany.shortcuts.navigate` |
| `Enter`  | "Open selected"         | `intercompany.shortcuts.open`     |
| `Escape` | "Close modal/cancel"    | `intercompany.shortcuts.cancel`   |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useIntercompany.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useICTransactions(filters = {}) {
  return useQuery({
    queryKey: ["intercompany", "transactions", filters],
    queryFn: () =>
      apiClient.GET("/api/intercompany/transactions", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });
}

export function useAutoMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { period?: string; entity_pairs?: string[] }) =>
      apiClient.POST("/api/intercompany/match", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["intercompany"] });
      toast.success(`${data.matched_count} transactions matched successfully`);
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Matching failed. Check tolerance settings.");
      } else {
        toast.error("Auto-match failed. Review transactions.");
      }
    },
  });
}

export function useICMismatches(period: string) {
  return useQuery({
    queryKey: ["intercompany", "mismatches", period],
    queryFn: () =>
      apiClient.GET("/api/intercompany/mismatches", { query: { period } }),
    staleTime: 60_000, // 1min
    select: (response) => response.data,
  });
}

export function useResolveMismatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      mismatch_id: string;
      resolution_type: string;
      amount?: number;
      explanation: string;
    }) => apiClient.POST("/api/intercompany/resolve", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["intercompany", "mismatches"],
      });
      toast.success("Mismatch resolved successfully");
    },
    onError: () => {
      toast.error("Resolution failed. Check adjustment details.");
    },
  });
}

export function useICBalances(period: string) {
  return useQuery({
    queryKey: ["intercompany", "balances", period],
    queryFn: () =>
      apiClient.GET("/api/intercompany/balances", { query: { period } }),
    staleTime: 60_000, // 1min
    select: (response) => response.data,
  });
}

export function useSettleIC() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { entity_pair_id: string; settlement_date: string }) =>
      apiClient.POST("/api/intercompany/settle", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["intercompany", "balances"] });
      toast.success(`Settlement processed: ${data.amount}`);
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Settlement failed. Check entity payment setup.");
      } else {
        toast.error("Settlement processing failed.");
      }
    },
  });
}

export function useGenerateEliminations(period: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiClient.POST("/api/intercompany/eliminations", { body: { period } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["consolidation", "eliminations"],
      });
      toast.success(`${data.elimination_count} elimination entries generated`);
    },
    onError: () => {
      toast.error("Failed to generate eliminations.");
    },
  });
}
```

### Error Mapping

| API Error         | User Message                                            | UI Action            |
| ----------------- | ------------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid transaction data. Check your input."           | Inline field errors  |
| 409 (Conflict)    | "Transaction already matched."                          | Show status          |
| 422 (Validation)  | "Validation failed: Amount mismatch exceeds tolerance." | Inline errors        |
| 403 (Forbidden)   | "You don't have permission for this entity."            | Hide action          |
| 500 (Server)      | "Matching failed. Our team has been notified."          | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Auto-match**: 30s timeout (long-running operation)

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["intercompany", "transactions", filters][
  ("intercompany", "mismatches", period)
][("intercompany", "balances", period)];
```

### Invalidation Rules

| Action                | Invalidates                                                        |
| --------------------- | ------------------------------------------------------------------ |
| Auto-Match            | `["intercompany"]` (all)                                           |
| Resolve Mismatch      | `["intercompany", "mismatches"]`                                   |
| Settle IC             | `["intercompany", "balances"]`, `["intercompany", "transactions"]` |
| Generate Eliminations | `["consolidation", "eliminations"]`                                |

### Stale Time

| Query Type   | Stale Time | Reasoning                |
| ------------ | ---------- | ------------------------ |
| Transactions | 30s        | Frequently updated       |
| Mismatches   | 1min       | Resolution takes time    |
| Balances     | 1min       | Updated after settlement |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("intercompany-transactions");
revalidateTag("intercompany-balances");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/intercompany.fixtures.ts`

**Datasets**:

- `minimalIC`: 2 entities, 4 transactions (2 matched, 2 unmatched)
- `standardIC`: 5 entities, 20 transactions, various statuses
- `complexIC`: 10 entities, 50 transactions, mismatches, partial matches
- `edgeCases`: Edge cases (tolerance threshold, FX mismatch, date misalignment)

**Edge Cases Covered**:

- Amount within tolerance (matched)
- Amount exceeds tolerance (mismatch)
- Date misalignment (> 5 days)
- FX rate mismatch
- Circular IC transactions
- Multi-hop settlements

```typescript
// Example fixture
export const standardICTransactions: ICTransactionFixture[] = [
  {
    id: "ic_1",
    entity_from: "entity_us",
    entity_to: "entity_uk",
    amount: 10000,
    currency: "USD",
    reference: "INV-1001",
    date: "2025-03-15",
    match_status: "Matched",
    counterparty_id: "ic_2",
  },
  {
    id: "ic_2",
    entity_from: "entity_uk",
    entity_to: "entity_us",
    amount: 10000,
    currency: "USD",
    reference: "INV-1001",
    date: "2025-03-15",
    match_status: "Matched",
    counterparty_id: "ic_1",
  },
  // ... more transactions
];
```

### E2E Seed Data

**Location**: `tests/seeds/intercompany.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:intercompany
```

**Dataset**:

- 6 entities (3 pairs)
- 30 IC transactions (20 matched, 8 unmatched, 2 mismatches)
- Complete settlement run (prior period)
- Mismatch resolution examples

**Cleanup Command**:

```powershell
pnpm run seed:intercompany:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic "Global Corp" structure (8 entities across 4 regions)
- Complete IC transaction cycle (invoice → match → settle)
- Mismatch examples with resolutions
- Historical settlement data (last 6 months)

**Regeneration**:

```powershell
pnpm run demo:reset:intercompany
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] Matched pairs balance (AR = AP within tolerance)
- [ ] All entity references exist
- [ ] FX rates available for all currencies
- [ ] Settlement amounts = net IC balances

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
- **Interactive Parts**: Mark with `"use client"` (matching dashboard, resolution workflow, balance matrix)

### Data Fetching Strategy

| Scenario             | Strategy                             | Benefit             |
| -------------------- | ------------------------------------ | ------------------- |
| Initial Transactions | Server-side fetch + stream           | Faster TTFB         |
| Auto-Match           | Client-side with progress tracking   | Real-time feedback  |
| Settlement           | Client-side React Query              | Optimistic updates  |
| Balance Matrix       | Server component with client heatmap | SEO + interactivity |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function autoMatchIC(data) {
  // ... mutation logic
  revalidateTag("intercompany-transactions");
  revalidateTag("intercompany-balances");
}
```

---

## 📊 Analytics & Audit Events

| Event                    | When                 | Properties                                      |
| ------------------------ | -------------------- | ----------------------------------------------- |
| IC.MatchCompleted        | Match success        | `period`, `matched_count`, `unmatched_count`    |
| IC.MismatchDetected      | Mismatch found       | `entity_pair`, `amount_difference`, `threshold` |
| IC.MismatchResolved      | Resolution applied   | `mismatch_id`, `resolution_type`, `amount`      |
| IC.SettlementProcessed   | Settlement done      | `entity_pair`, `amount`, `settlement_date`      |
| IC.EliminationsGenerated | Eliminations created | `period`, `elimination_count`                   |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("IC.MatchCompleted", {
  period: "2025-03",
  matched_count: 25,
  unmatched_count: 3,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/intercompany.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency Display**: Multi-currency with locale-specific symbols
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Entity Names**: Support international characters

### Keyboard Shortcuts

| Key      | Action                | Scope            |
| -------- | --------------------- | ---------------- |
| `/`      | Focus search          | Any page         |
| `m`      | Auto-match            | Main page        |
| `s`      | Settlement dashboard  | Main page        |
| `r`      | Resolve selected      | Mismatch list    |
| `n`      | New transaction       | Transaction list |
| `↑ / ↓`  | Navigate transactions | Table            |
| `Enter`  | Open selected         | Table            |
| `Escape` | Close modal/cancel    | Modal/Form       |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["m", () => autoMatch()],
  ["s", () => router.push("/intercompany/settlement")],
  ["r", () => openResolveModal()],
  ["n", () => openCreateModal()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                        | Duration | Rollback Trigger |
| ----------- | ---------------- | ------------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                        | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, match accuracy ≥95%                 | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, match rate ≥90%, settlement accurate | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained                | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m18_intercompany: false,              // Master toggle
  m18_intercompany_auto_match: false,   // AI-powered matching
  m18_intercompany_settlement: false,   // Settlement processing
  m18_intercompany_ai: false,           // AI confidence scoring
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/intercompany/*`)
- P50/P95/P99 latency
- Match rate (target ≥90%)
- Mismatch count and resolution time
- Settlement accuracy (100% required)
- AI confidence scores

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Match rate < 85% → investigate matching algorithm
- Mismatch resolution time > 48h → escalate
- Settlement imbalance detected → immediate escalation (critical)

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m18_intercompany = false`

   ```powershell
   pnpm run flags:set m18_intercompany=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("intercompany-transactions");
   revalidateTag("intercompany-balances");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/intercompany/*"
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

| Scenario             | Action             | Approval Required |
| -------------------- | ------------------ | ----------------- |
| Error rate > 5%      | Immediate rollback | No (auto-trigger) |
| Match accuracy < 80% | Immediate rollback | No (auto-trigger) |
| Settlement imbalance | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%      | Partial rollback   | On-call engineer  |
| Match rate 80-85%    | Investigate first  | Data science team |
| Data corruption/loss | Immediate rollback | No (auto-trigger) |

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

- SAP: Intercompany reconciliation
- Oracle: IC settlement
- NetSuite: IC matching
- Workday: IC elimination

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Matching Accuracy (False Positives)

**Mitigation**: AI confidence scoring (display to user); manual review workflow; adjustable tolerance thresholds; audit trail of all matches

### Risk #2: Cross-Entity Data Access Permissions

**Mitigation**: Entity-level RBAC; server-side enforcement; audit trail of all access; data masking for non-authorized entities

### Risk #3: Settlement Timing and FX Rates

**Mitigation**: Timestamp validation; FX rate locking on settlement initiation; settlement date control; historical rate tracking

### Risk #4: Mismatch Resolution Delays

**Mitigation**: SLA tracking (48h target); escalation workflow; automated reminders; manager notifications; resolution dashboard

---

## 📝 Implementation Guide

### Day 1: Matching & Transactions (8 hours)

1. Build IC transaction list and dashboard (3 hours)
2. Implement auto-match with AI scoring (4 hours)
3. Add balance matrix visualization (1 hour)

### Day 2: Settlement & Resolution (4 hours)

1. Implement settlement dashboard (2 hours)
2. Build mismatch resolution workflow (2 hours)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Match tolerance validation (within/exceeds)
- [ ] AR/AP symmetry check
- [ ] Settlement balance calculation
- [ ] FX rate consistency
- [ ] Date alignment validation (5-day window)
- [ ] useICTransactions hook fetches correctly
- [ ] Currency formatting displays correctly

### Integration Tests

- [ ] Auto-match → transactions matched
- [ ] Resolve mismatch → balance adjusted
- [ ] Settle IC → payment initiated
- [ ] Generate eliminations → entries created
- [ ] Update tolerance → match results change
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] User can navigate to intercompany page
- [ ] User can view transaction list
- [ ] User can auto-match transactions
- [ ] User can view mismatches
- [ ] User can resolve mismatch
- [ ] User can process settlement
- [ ] Keyboard-only flow: navigate → match → resolve
- [ ] Multi-entity IC cycle executes correctly

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Balance matrix keyboard accessible
- [ ] Charts have data table alternatives
- [ ] Screen reader announces transactions and status
- [ ] Focus management correct (modals, forms, workflows)
- [ ] Color contrast meets WCAG 2.2 AA (AAA where practical)
- [ ] Axe: 0 serious/critical violations
- [ ] Progress indicators are accessible

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] All API endpoints return expected status codes

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for dashboard, matrix, workflow
- [ ] Dark/light theme variations
- [ ] Progress states captured
- [ ] Loading/error/empty states captured

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/intercompany/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] Auto-match < 10s (100 transactions)
- [ ] Settlement calculation < 3s
- [ ] Balance matrix load < 1s

---

## 📅 Timeline

| Day | Deliverable                      |
| --- | -------------------------------- |
| 1   | Matching + Transactions + Matrix |
| 2   | Settlement + Resolution          |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger (for accounts)
- ✅ M2: Journal Entries (for elimination entries)
- ✅ M17: Consolidation (for eliminations)
- ✅ Entity Management (for entity setup)

### Enables These Modules

- M17: Consolidation (uses IC matching for eliminations)
- M20: Close Management (IC reconciliation in close checklist)

---

## 🎯 Success Criteria

### Must Have

- [ ] IC transaction management (CRUD)
- [ ] Auto-match with configurable tolerance
- [ ] Mismatch identification and tracking
- [ ] Mismatch resolution workflow
- [ ] IC settlement processing
- [ ] Balance matrix visualization
- [ ] Generate elimination entries
- [ ] Match rate ≥90%, Settlement accuracy 100%

### Should Have

- [ ] AI-powered match confidence scoring
- [ ] Historical settlement comparison
- [ ] Escalation workflow for unresolved mismatches
- [ ] FX rate integration
- [ ] Multi-hop settlement optimization

### Nice to Have

- [ ] Predictive mismatch detection
- [ ] What-if settlement scenarios
- [ ] IC forecasting
- [ ] Visual entity relationship map

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/intercompany`, `/intercompany/matching`, `/intercompany/settlement`, `/intercompany/mismatches`)
- [ ] IC transaction CRUD working
- [ ] Auto-match working with AI confidence
- [ ] Mismatch resolution workflow working
- [ ] Settlement processing working
- [ ] Balance matrix working
- [ ] Elimination generation working
- [ ] Search and filtering working
- [ ] Permissions enforced (entity-level RBAC)
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
- [ ] Integration tests: All IC operations covered
- [ ] E2E tests: All user flows covered (transaction → match → settle)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Auto-match flow
- Mismatch resolution flow
- Settlement processing flow
- Elimination generation flow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/intercompany/*` routes
- [ ] TTFB: ≤70ms on staging (Server-Timing header)
- [ ] TTI: ≤200ms for `/intercompany` (Lighthouse CI)
- [ ] Auto-match: < 10s (100 transactions)
- [ ] Settlement calculation: < 3s
- [ ] Balance matrix load: < 1s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues
- [ ] Charts/Matrix: Keyboard accessible with alternatives

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `IC.MatchCompleted`
  - `IC.MismatchDetected`
  - `IC.MismatchResolved`
  - `IC.SettlementProcessed`
  - `IC.EliminationsGenerated`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, match rate, settlement accuracy)
- [ ] Match accuracy monitoring (≥90% target)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client + entity-level)
- [ ] Idempotency keys on all mutations
- [ ] IC amounts masked for non-finance users
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] All matches and settlements logged for audit
- [ ] Data retention policy enforced (7 years)

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete (changes, testing, screenshots)
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized (OpenAPI hash verified)
- [ ] i18n keys documented in copy deck
- [ ] User acceptance testing passed (PM/QA sign-off)
- [ ] IC methodology documented

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m18_intercompany = false` (ready to enable)
  - `flags.m18_intercompany_auto_match = false` (phase 2)
  - `flags.m18_intercompany_settlement = false` (phase 2)
  - `flags.m18_intercompany_ai = false` (phase 2)
- [ ] Smoke tests passed on staging
- [ ] Load tests passed (≥1000 concurrent users, 100 transactions)
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
- [ ] **Finance/Controller**: IC methodology validated, 100% settlement accuracy confirmed

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M17 - Consolidation  
**Next**: M19 - Multi-Currency
