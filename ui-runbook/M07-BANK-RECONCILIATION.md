# 🚀 M7: Bank Reconciliation - UI Implementation Runbook

**Module ID**: M7  
**Module Name**: Bank Reconciliation  
**Priority**: MEDIUM  
**Phase**: 2 - Priority Modules  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Bank Reconciliation automates **matching bank transactions with general ledger entries** to ensure accurate cash records. Critical for month-end close and audit compliance.

### Business Value

- Automated bank statement import and matching
- Reduces reconciliation time by 80%
- Improves cash accuracy and audit readiness
- Exception management and resolution
- Multi-account reconciliation support

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-auto-matching], [ADR-###-bank-feeds], [ADR-###-exception-mgmt]

---

## 📊 Current Status

| Layer         | Status  | Details                          |
| ------------- | ------- | -------------------------------- |
| **Database**  | ✅ 100% | Complete reconciliation schema   |
| **Services**  | ✅ 100% | Auto-matching and recon services |
| **API**       | ✅ 100% | 5 endpoints for reconciliation   |
| **Contracts** | ✅ 100% | Type-safe schemas defined        |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**         |

### API Coverage

- ✅ `/api/bank/statements/import` - Import bank statements
- ✅ `/api/bank/reconciliation` - Reconciliation status
- ✅ `/api/bank/match` - Auto-match transactions
- ✅ `/api/bank/exceptions` - Unmatched items
- ✅ `/api/bank/complete` - Complete reconciliation

**Total Endpoints**: 5

### Risks & Blockers

| Risk                             | Impact | Mitigation                                              | Owner    |
| -------------------------------- | ------ | ------------------------------------------------------- | -------- |
| Auto-match accuracy              | HIGH   | ML validation; user corrections feed model; 95%+ target | @ai-team |
| Bank statement format variations | MED    | Multi-format parser; manual upload fallback             | @backend |
| Large transaction volumes        | MED    | Pagination; background processing; progress indicators  | @backend |
| Date matching complexity         | MED    | Configurable tolerance (±3 days); fuzzy matching        | @backend |

---

## 🎯 3 Killer Features

### 1. **AI-Powered Auto-Matching** 🤖

**Description**: Machine learning algorithm that automatically matches 95%+ of bank transactions to GL entries.

**Why It's Killer**:

- 95% auto-match rate (vs 70% manual)
- Learns from user corrections
- Fuzzy matching handles description variations
- Matches across date ranges (±3 days)
- Industry-leading accuracy

**Implementation**:

```typescript
import { DataTable, Button, Badge } from "aibos-ui";

export default function BankReconPage() {
  const { matches, exceptions } = useBankReconciliation(accountId);

  return (
    <>
      <Button onClick={runAutoMatch}>Run Auto-Match (AI)</Button>

      <DataTable
        data={matches}
        columns={[
          { key: "bank_date", label: "Bank Date" },
          { key: "description", label: "Description" },
          { key: "amount", label: "Amount" },
          {
            key: "match_confidence",
            label: "Confidence",
            render: (v) => (
              <Badge color={v > 0.9 ? "success" : "warning"}>
                {(v * 100).toFixed(0)}%
              </Badge>
            ),
          },
        ]}
        onRowClick={viewMatch}
      />
    </>
  );
}
```

### 2. **One-Click Statement Import** 📄

**Description**: Import bank statements from multiple formats (CSV, OFX, QFX, MT940) with automatic parsing.

**Why It's Killer**:

- Supports all major bank formats
- Automatic field mapping
- Duplicate detection
- Drag-and-drop upload
- Faster than QuickBooks/Xero

**Implementation**:

```typescript
import { FileUpload, Card } from "aibos-ui";

export default function StatementImport() {
  const { mutate: importStatement } = useImportStatement();

  return (
    <FileUpload
      accept=".csv,.ofx,.qfx,.mt940"
      onUpload={(file) => importStatement(file)}
      multiple
      drag
      Drop
    >
      <div className="text-center p-8">
        <p>Drag and drop bank statements</p>
        <p className="text-sm">Supports CSV, OFX, QFX, MT940</p>
      </div>
    </FileUpload>
  );
}
```

### 3. **Visual Reconciliation Workbench** 🎯

**Description**: Side-by-side view of bank transactions and GL entries with drag-and-drop matching.

**Why It's Killer**:

- Intuitive visual interface
- Drag-and-drop manual matching
- Split transaction support
- Real-time balance updates
- Better UX than all competitors

**Implementation**:

```typescript
import { DataTable, Card } from "aibos-ui";

export default function ReconWorkbench() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card title="Bank Transactions">
        <DataTable
          data={bankTransactions}
          draggable
          onDragStart={handleDragStart}
        />
      </Card>

      <Card title="GL Entries">
        <DataTable data={glEntries} droppable onDrop={handleMatch} />
      </Card>
    </div>
  );
}
```

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Reconciliation List (`/bank/reconciliation`)

**Components**: DataTable, Badge, Button, DatePicker
**File**: `apps/web/app/(dashboard)/bank/reconciliation/page.tsx`

#### 2. Reconciliation Workbench (`/bank/reconciliation/[id]`)

**Components**: DataTable, Card, FileUpload, Button
**File**: `apps/web/app/(dashboard)/bank/reconciliation/[id]/page.tsx`

#### 3. Statement Import (`/bank/import`)

**Components**: FileUpload, Form, Button, Progress
**File**: `apps/web/app/(dashboard)/bank/import/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                | Target                      | Measurement      |
| --------------------- | --------------------------- | ---------------- |
| Auto-match processing | < 5s for 1000 transactions  | APM traces       |
| Import processing     | < 10s for typical statement | Progress bar     |
| UI bundle size        | ≤ 250KB gzipped             | Webpack analyzer |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard workflow for matching (no mouse required)
- **Focus Management**: Focus trap in workbench; visible indicators
- **ARIA**: Live regions for match status updates; proper roles and labels
- **Screen Reader**: All matches announced; confidence scores read
- **Axe Target**: 0 serious/critical violations

### Security

| Layer       | Requirement                                 |
| ----------- | ------------------------------------------- |
| RBAC Scopes | `bank.read`, `bank.reconcile`, `bank.admin` |
| Enforcement | Server-side on all endpoints                |
| Audit Trail | All matches/unmatches logged                |

#### UI Permissions Matrix

| Role           | View | Match | Complete | Admin |
| -------------- | ---- | ----- | -------- | ----- |
| bank.read      | ✅   | ❌    | ❌       | ❌    |
| bank.reconcile | ✅   | ✅    | ✅       | ❌    |
| bank.admin     | ✅   | ✅    | ✅       | ✅    |

### Reliability & Observability

- **SLO**: 99.5% successful auto-match completion on valid statements
- **SLA Dashboards**: Real-time metrics on match accuracy, import success rate, completion time
- **Events Emitted**: `Bank.Recon.Started`, `Bank.AutoMatch.Run`, `Bank.ManualMatch.Applied`, `Bank.Recon.Completed`
- **Logging**: Structured logs with correlation IDs for all matching operations
- **Tracing**: Distributed tracing for import → parse → match workflow
- **Monitoring**: Match accuracy tracking, exception rate monitoring, statement format success rates

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

| Rule                      | Enforcement                                                           |
| ------------------------- | --------------------------------------------------------------------- |
| **Match Amount**          | Bank transaction amount must equal GL entry amount (within tolerance) |
| **Date Tolerance**        | Configurable ±N days (default ±3)                                     |
| **One-to-One Match**      | Each bank transaction matches max 1 GL entry                          |
| **Completion Validation** | All transactions must be matched or explained                         |
| **Split Matching**        | One bank transaction can match multiple GL entries (sum must equal)   |
| **Reversal Handling**     | Reversed transactions auto-matched if paired within statement         |

### Currency & Rounding

- **Display**: All amounts in bank account currency
- **Tolerance**: Configurable tolerance for rounding differences (default $0.01)
- **Multi-Currency**: Support multiple currencies; match in native currency
- **FX Handling**: Foreign transactions matched with exchange rate variance tolerance

### Archive Semantics

- **Soft Delete**: Completed reconciliations archived with `completed_date`
- **Guard Rails**:
  - ❌ Deny if reconciliation period is not closed
  - ❌ Deny if exceptions remain unmatched and unexplained
  - ❌ Deny if reconciliation already completed
  - ✅ Allow reopening within 30 days with approval

---

## 🚨 Error Handling & UX States

### All Possible States

| State               | UI Display                                | User Action            |
| ------------------- | ----------------------------------------- | ---------------------- |
| **Empty**           | "No reconciliations"                      | "Start Reconciliation" |
| **Importing**       | Progress bar with file name               | Wait / Cancel          |
| **Processing**      | "Auto-matching..." with progress          | Wait                   |
| **Exceptions**      | List of unmatched items + count           | Manual match           |
| **Completed**       | Green checkmark + completion summary      | View report            |
| **Error**           | Error message + details                   | Retry / Support        |
| **Parse Error**     | "Unable to parse statement" + format info | Try different format   |
| **Partial Match**   | "95 matched, 5 exceptions"                | Review exceptions      |
| **Loading**         | Skeleton workbench                        | N/A                    |
| **No Results**      | "No transactions in period"               | Adjust date range      |
| **Format Mismatch** | "Unrecognized format"                     | Select format manually |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Submit State**: Button disabled until all required matched or explained
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal
- **Real-time Validation**: Check match amount as user types

### Network Errors

| HTTP Status | UI Message                                             | Action              |
| ----------- | ------------------------------------------------------ | ------------------- |
| 400         | "Invalid file format. Check your statement."           | Inline field errors |
| 401         | "Session expired. Please log in again."                | Redirect to login   |
| 403         | "You don't have permission to reconcile this account." | Hide action         |
| 404         | "Reconciliation not found. It may have been deleted."  | Return to list      |
| 409         | "Reconciliation already completed."                    | Show conflict modal |
| 422         | "Validation failed: All transactions must be matched." | Inline errors       |
| 500         | "Import failed. Our team has been notified."           | Retry button        |
| 503         | "Service temporarily unavailable. Try again."          | Retry with backoff  |
| 413         | "File too large. Maximum 10MB."                        | Select smaller file |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/bank.json`.

### Page Titles & Headers

| Context        | Copy                      | i18n Key                |
| -------------- | ------------------------- | ----------------------- |
| List Page      | "Bank Reconciliations"    | `bank.list.title`       |
| Workbench      | "Bank Reconciliation"     | `bank.recon.title`      |
| Import         | "Import Statement"        | `bank.import.title`     |
| Exceptions     | "Unmatched Items"         | `bank.exceptions.title` |
| Completed View | "Reconciliation Complete" | `bank.completed.title`  |

### State Messages

| State             | Title                       | Message                                                          | Action Button       | i18n Key                  |
| ----------------- | --------------------------- | ---------------------------------------------------------------- | ------------------- | ------------------------- |
| Empty             | "No reconciliations"        | "Start your first bank reconciliation"                           | "Start"             | `bank.empty.*`            |
| Loading           | —                           | —                                                                | —                   | —                         |
| Error             | "Unable to load"            | "Something went wrong. Our team has been notified."              | "Retry" / "Support" | `bank.error.*`            |
| Parse Error       | "Unable to parse statement" | "File format not recognized. Try CSV or OFX."                    | "Try Again"         | `bank.parseError.*`       |
| No Results        | "No transactions"           | "No transactions found in the selected period."                  | "Adjust Period"     | `bank.noResults.*`        |
| Permission Denied | "Access restricted"         | "You don't have permission to reconcile this account."           | "Back"              | `bank.permissionDenied.*` |
| Importing         | "Importing..."              | "Processing {fileName}. This may take a moment."                 | —                   | `bank.importing.*`        |
| Processing        | "Auto-matching..."          | "Analyzing {count} transactions. {percent}% complete."           | —                   | `bank.processing.*`       |
| Partial Match     | "Partial match complete"    | "{matched} matched, {exceptions} exceptions. Review exceptions?" | "Review"            | `bank.partialMatch.*`     |
| Completed         | "Reconciliation complete"   | "All transactions matched. Period closed successfully."          | "View Report"       | `bank.completed.*`        |

### Action Confirmations

| Action   | Title                       | Message                                                       | Confirm Button | Cancel Button | i18n Key                  |
| -------- | --------------------------- | ------------------------------------------------------------- | -------------- | ------------- | ------------------------- |
| Complete | "Complete reconciliation?"  | "All transactions matched. Mark as complete?"                 | "Complete"     | "Cancel"      | `bank.complete.confirm.*` |
| Unmatch  | "Unmatch this transaction?" | "This will remove the match. Continue?"                       | "Unmatch"      | "Cancel"      | `bank.unmatch.confirm.*`  |
| Delete   | "Delete reconciliation?"    | "This reconciliation will be deleted. This cannot be undone." | "Delete"       | "Cancel"      | `bank.delete.confirm.*`   |
| Reopen   | "Reopen reconciliation?"    | "This will reopen the reconciliation for editing."            | "Reopen"       | "Cancel"      | `bank.reopen.confirm.*`   |

### Success Messages (Toast)

| Action          | Message                                             | i18n Key                 |
| --------------- | --------------------------------------------------- | ------------------------ |
| Import Success  | "Statement imported: {count} transactions"          | `bank.import.success`    |
| Match Applied   | "Transaction matched successfully"                  | `bank.match.success`     |
| Auto-Match Done | "Auto-match complete: {matched} of {total} matched" | `bank.automatch.success` |
| Completed       | "Reconciliation completed successfully"             | `bank.complete.success`  |
| Unmatched       | "Match removed successfully"                        | `bank.unmatch.success`   |

### Error Messages (Toast)

| Scenario             | Message                                                   | i18n Key               |
| -------------------- | --------------------------------------------------------- | ---------------------- |
| Import Failed        | "Failed to import statement. Check format and try again." | `bank.import.error`    |
| Match Failed         | "Failed to match transaction. Please try again."          | `bank.match.error`     |
| Auto-Match Failed    | "Auto-match failed. Try manual matching."                 | `bank.automatch.error` |
| File Too Large       | "File exceeds 10MB limit. Please use a smaller file."     | `bank.errorFileSize`   |
| Format Not Supported | "File format not supported. Use CSV, OFX, or QFX."        | `bank.errorFormat`     |
| Already Completed    | "Reconciliation already completed. Reopen to edit."       | `bank.errorCompleted`  |
| Has Exceptions       | "Cannot complete: {count} transactions remain unmatched." | `bank.errorExceptions` |
| Network Error        | "Network error. Check your connection and try again."     | `bank.error.network`   |

### Form Labels & Help Text

| Field             | Label                   | Placeholder      | Help Text                                  | i18n Key                     |
| ----------------- | ----------------------- | ---------------- | ------------------------------------------ | ---------------------------- |
| Account           | "Bank Account"          | "Select account" | "Account to reconcile"                     | `bank.field.account.*`       |
| Statement File    | "Statement File"        | "Choose file"    | "CSV, OFX, QFX, or MT940 format"           | `bank.field.file.*`          |
| Period Start      | "Period Start"          | "Select date"    | "First date of reconciliation period"      | `bank.field.periodStart.*`   |
| Period End        | "Period End"            | "Select date"    | "Last date of reconciliation period"       | `bank.field.periodEnd.*`     |
| Match Explanation | "Explanation"           | "Why unmatched?" | "Reason for leaving transaction unmatched" | `bank.field.explanation.*`   |
| Date Tolerance    | "Date Tolerance (days)" | "3"              | "Allow matching within ± N days"           | `bank.field.dateTolerance.*` |

### Keyboard Shortcuts Help

| Shortcut | Description               | i18n Key                  |
| -------- | ------------------------- | ------------------------- |
| `m`      | "Run auto-match"          | `bank.shortcuts.match`    |
| `c`      | "Complete reconciliation" | `bank.shortcuts.complete` |
| `u`      | "Unmatch selected"        | `bank.shortcuts.unmatch`  |
| `i`      | "Import statement"        | `bank.shortcuts.import`   |
| `↑ / ↓`  | "Navigate transactions"   | `bank.shortcuts.navigate` |
| `Enter`  | "Apply match"             | `bank.shortcuts.apply`    |
| `Escape` | "Close modal/cancel"      | `bank.shortcuts.cancel`   |

---

## 🗂️ State, Caching, Invalidation

### React Query Keys

```typescript
// Query key structure
["bank", "reconciliation", accountId][
  ("bank", "statements", accountId, period)
][("bank", "exceptions", accountId)][("bank", "matches", reconciliationId)][
  ("bank", "history", accountId)
];
```

### Invalidation Rules

| Action       | Invalidates                                                                   |
| ------------ | ----------------------------------------------------------------------------- |
| Import       | `["bank", "statements"]`, `["bank", "reconciliation"]`                        |
| Auto-Match   | `["bank", "reconciliation"]`, `["bank", "exceptions"]`, `["bank", "matches"]` |
| Manual Match | `["bank", "reconciliation"]`, `["bank", "exceptions"]`                        |
| Unmatch      | `["bank", "reconciliation"]`, `["bank", "exceptions"]`                        |
| Complete     | `["bank", "reconciliation"]`, `["bank", "history"]`                           |

### Stale Time

| Query Type     | Stale Time | Reasoning                          |
| -------------- | ---------- | ---------------------------------- |
| Reconciliation | 30s        | Active work; frequent updates      |
| Statements     | 5min       | Imported data; rarely changes      |
| Exceptions     | 30s        | Changes during matching            |
| History        | 10min      | Historical data; infrequent access |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("bank-recon"); // After mutations
revalidateTag(`bank-recon-${accountId}`); // Specific account
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/bank-recon.fixtures.ts`

**Datasets**:

- `minimalStatements`: 10 transactions (all matchable)
- `standardStatements`: 50 transactions (90% matchable, 10% exceptions)
- `largeStatements`: 500 transactions (for performance testing)
- `edgeCases`: Special scenarios

**Edge Cases Covered**:

- Duplicate amounts on same date
- Date mismatches (beyond tolerance)
- Reversed transactions (paired)
- Split transactions (1 bank → multiple GL)
- Foreign currency transactions
- Unrecognized descriptions
- Zero-amount transactions
- Future-dated transactions

```typescript
// Example fixture structure
export const standardStatements: BankStatementFixture = {
  account_id: "bank_acc_1",
  period_start: "2025-09-01",
  period_end: "2025-09-30",
  transactions: [
    {
      id: "txn_1",
      date: "2025-09-01",
      description: "Customer Payment - ABC Corp",
      amount: 5000.0,
      type: "credit",
      match_confidence: 0.95,
    },
    // ... 49 more
  ],
};
```

### E2E Seed Data

**Location**: `tests/seeds/bank-recon.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:bank-recon
```

**Dataset**:

- 5 bank accounts with reconciliation history
- 20 completed reconciliations
- 3 in-progress reconciliations
- 200 bank transactions (various match states)
- 150 GL entries for matching
- Multi-format statement files (CSV, OFX, QFX)

**Cleanup Command**:

```powershell
pnpm run seed:bank-recon:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic company: "Demo Corp Inc." with 3 bank accounts
- 6 months of reconciliation history
- Statement files demonstrating all supported formats
- Example scenarios: 95% match rate, 5% exceptions
- Manual match examples with explanations
- Completed reconciliations showing audit trail

**Regeneration**:

```powershell
pnpm run demo:reset:bank-recon
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] No orphaned transaction references
- [ ] Match amounts equal within tolerance
- [ ] Dates within configured tolerance
- [ ] Statement file formats parse correctly
- [ ] No circular match references

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
- **Interactive Parts**: Mark with `"use client"` (workbench, drag-and-drop, file upload)

### Data Fetching Strategy

| Scenario     | Strategy                             | Benefit              |
| ------------ | ------------------------------------ | -------------------- |
| Initial List | Server-side fetch + stream           | Faster TTFB          |
| Import/Match | Client-side React Query              | Optimistic updates   |
| Workbench    | Client component with real-time sync | Interactive matching |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function completeReconciliation(id: string) {
  // ... mutation logic
  revalidateTag("bank-recon");
  revalidateTag(`bank-recon-${accountId}`);
}
```

---

## 📊 Analytics & Audit Events

| Event                    | When                | Properties                                                      |
| ------------------------ | ------------------- | --------------------------------------------------------------- |
| Bank.Recon.Started       | Recon initiated     | `account_id`, `period_start`, `period_end`                      |
| Bank.Statement.Imported  | File uploaded       | `account_id`, `format`, `transaction_count`, `file_size`        |
| Bank.AutoMatch.Run       | Auto-match executed | `account_id`, `transactions_matched`, `accuracy`, `duration_ms` |
| Bank.ManualMatch.Applied | User matches txn    | `account_id`, `bank_txn_id`, `gl_entry_id`, `confidence`        |
| Bank.Match.Unmatched     | Match removed       | `account_id`, `match_id`, `reason`                              |
| Bank.Recon.Completed     | Recon finalized     | `account_id`, `total_matches`, `exceptions`, `completion_time`  |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Bank.AutoMatch.Run", {
  account_id: accountId,
  transactions_matched: matchCount,
  accuracy: matchAccuracy,
  duration_ms: duration,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/bank.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **File Names**: Handle non-ASCII characters in statement file names
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Amount Display**: Respect locale-specific currency formatting

### Keyboard Shortcuts

| Key      | Action                  | Scope          |
| -------- | ----------------------- | -------------- |
| `m`      | Run auto-match          | Workbench      |
| `c`      | Complete reconciliation | Workbench      |
| `u`      | Unmatch selected        | Workbench      |
| `i`      | Import statement        | List/Workbench |
| `↑ / ↓`  | Navigate transactions   | Table          |
| `Enter`  | Apply match             | Workbench      |
| `Escape` | Close modal/cancel      | Modal/Form     |

**Implementation**:

```typescript
useHotkeys([
  ["m", () => runAutoMatch()],
  ["c", () => completeReconciliation()],
  ["u", () => unmatchSelected()],
  ["i", () => openImportModal()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                            | Duration | Rollback Trigger |
| ----------- | ---------------- | ------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                            | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, Lighthouse ≥90          | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, Auto-match accuracy ≥95% | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained    | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m7_bank_recon: false,              // Master toggle
  m7_auto_match: false,              // AI auto-matching
  m7_drag_drop_matching: false,      // Drag-and-drop UI
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/bank/reconciliation`, `/bank/import`)
- P50/P95/P99 latency
- Auto-match accuracy rate
- Statement import success rate (by format)
- Average completion time per reconciliation
- Exception rate (% of transactions unmatched)

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Auto-match accuracy < 90% for 1 hour → investigate
- Import failure rate > 10% → escalate
- P95 latency > 500ms for 10min → investigate

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m7_bank_recon = false`

   ```powershell
   pnpm run flags:set m7_bank_recon=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("bank-recon");
   revalidateTag("bank-reconciliations");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/bank/*"
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

**Rollback Decision Matrix**:

| Scenario                  | Action             | Approval Required |
| ------------------------- | ------------------ | ----------------- |
| Error rate > 5%           | Immediate rollback | No (auto-trigger) |
| Auto-match accuracy < 80% | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%           | Partial rollback   | On-call engineer  |
| P95 latency > 1s          | Investigate first  | On-call engineer  |
| Import failure rate > 20% | Immediate rollback | No (auto-trigger) |
| Data corruption/loss      | Immediate rollback | No (auto-trigger) |

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

- ERPNext patterns: Bank reconciliation workflows
- QuickBooks: Statement import and matching UX
- Xero: Visual reconciliation workbench
- Zoho: Auto-matching algorithms

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`

---

## 🚨 Risk Mitigation

### Risk #1: Auto-Match Accuracy

**Mitigation**: ML validation; user corrections feed model; maintain 95%+ target; confidence scores displayed

### Risk #2: Statement Format Variations

**Mitigation**: Multi-format parser; manual format selection; fallback to manual entry

### Risk #3: Large Transaction Volumes

**Mitigation**: Background processing; pagination; progress indicators; chunked imports

### Risk #4: Data Integrity

**Mitigation**: Server-side validation; atomic operations; audit trail; rollback capability

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useBankReconciliation.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useBankReconciliation(accountId: string) {
  return useQuery({
    queryKey: ["bank", "reconciliation", accountId],
    queryFn: () =>
      apiClient.GET("/api/bank/reconciliation", {
        query: { account_id: accountId },
      }),
    staleTime: 30_000, // 30s - active work
    retry: 2,
    enabled: !!accountId,
    select: (response) => response.data,
  });
}

export function useImportStatement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) =>
      apiClient.POST("/api/bank/statements/import", { body: file }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bank", "statements"] });
      queryClient.invalidateQueries({ queryKey: ["bank", "reconciliation"] });
      toast.success(
        `Statement imported: ${data.transaction_count} transactions`
      );
    },
    onError: (error) => {
      if (error.status === 413) {
        toast.error("File too large. Maximum 10MB.");
      } else if (error.status === 400) {
        toast.error("Invalid file format. Use CSV, OFX, or QFX.");
      } else {
        toast.error("Import failed. Please try again.");
      }
    },
  });
}

export function useAutoMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (accountId: string) =>
      apiClient.POST("/api/bank/match", { body: { account_id: accountId } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bank", "reconciliation"] });
      queryClient.invalidateQueries({ queryKey: ["bank", "exceptions"] });
      queryClient.invalidateQueries({ queryKey: ["bank", "matches"] });
      toast.success(
        `Auto-match complete: ${data.matched_count} of ${data.total_count} matched`
      );
    },
    onError: () => {
      toast.error("Auto-match failed. Try manual matching.");
    },
  });
}

export function useManualMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { bank_txn_id: string; gl_entry_id: string }) =>
      apiClient.POST("/api/bank/match/manual", { body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank", "reconciliation"] });
      queryClient.invalidateQueries({ queryKey: ["bank", "exceptions"] });
      toast.success("Transaction matched successfully");
    },
  });
}

export function useUnmatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (matchId: string) =>
      apiClient.POST("/api/bank/match/unmatch", {
        body: { match_id: matchId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank", "reconciliation"] });
      queryClient.invalidateQueries({ queryKey: ["bank", "exceptions"] });
      toast.success("Match removed successfully");
    },
  });
}

export function useCompleteReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reconciliationId: string) =>
      apiClient.POST("/api/bank/reconciliation/complete", {
        body: { reconciliation_id: reconciliationId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank", "reconciliation"] });
      queryClient.invalidateQueries({ queryKey: ["bank", "history"] });
      toast.success("Reconciliation completed successfully");
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Cannot complete: Some transactions remain unmatched.");
      } else if (error.status === 409) {
        toast.error("Reconciliation already completed.");
      } else {
        toast.error("Failed to complete reconciliation.");
      }
    },
  });
}

export function useExceptions(accountId: string) {
  return useQuery({
    queryKey: ["bank", "exceptions", accountId],
    queryFn: () =>
      apiClient.GET("/api/bank/exceptions", {
        query: { account_id: accountId },
      }),
    staleTime: 30_000, // 30s
    enabled: !!accountId,
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error               | User Message                                              | UI Action            |
| ----------------------- | --------------------------------------------------------- | -------------------- |
| 400 (Bad Request)       | "Invalid file format. Use CSV, OFX, or QFX."              | Inline field errors  |
| 409 (Conflict)          | "Reconciliation already completed."                       | Show conflict modal  |
| 413 (Payload Too Large) | "File too large. Maximum 10MB."                           | Select smaller file  |
| 422 (Validation)        | "Cannot complete: {count} transactions remain unmatched." | Inline errors        |
| 403 (Forbidden)         | "You don't have permission to reconcile this account."    | Hide action buttons  |
| 500 (Server)            | "Import failed. Our team has been notified."              | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **File uploads**: 30s timeout; no retry (too expensive)
- **Auto-match**: 60s timeout (long-running operation)

---

## 📝 Implementation Guide

### Day 1: Import & Auto-Match (8 hours)

1. Build statement import UI (3 hours)
2. Create auto-match interface (3 hours)
3. Add exception handling (2 hours)

### Day 2: Workbench & Completion (4 hours)

1. Build visual workbench (3 hours)
2. Add completion workflow (1 hour)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Statement parsing works for all formats (CSV, OFX, QFX, MT940)
- [ ] Auto-match algorithm accurate (various scenarios)
- [ ] Manual matching validation logic
- [ ] Balance calculations correct
- [ ] Split transaction handling
- [ ] Date tolerance matching (±N days)
- [ ] useBankReconciliation hook fetches correctly
- [ ] useImportStatement handles errors properly
- [ ] useAutoMatch triggers invalidation
- [ ] Amount matching with tolerance
- [ ] Currency conversion logic

### Integration Tests

- [ ] Import statement → transactions appear in workbench
- [ ] Auto-match → exceptions updated
- [ ] Manual match → GL entries linked
- [ ] Unmatch → match removed correctly
- [ ] Complete reconciliation → period locked
- [ ] Audit trail maintained for all operations
- [ ] Multi-format imports work correctly
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] User can navigate to reconciliation page
- [ ] User can upload and parse statement (CSV)
- [ ] User can upload OFX format statement
- [ ] User can run auto-match
- [ ] User can manually match exceptions
- [ ] User can unmatch a transaction
- [ ] User can complete reconciliation
- [ ] User can view reconciliation history
- [ ] Keyboard-only flow: import → match → complete
- [ ] Drag-and-drop matching workflow

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] File upload accessible
- [ ] Screen reader announces match status
- [ ] Focus management correct (workbench, modals)
- [ ] Color contrast meets WCAG 2.2 AA (AAA where practical)
- [ ] Axe: 0 serious/critical violations
- [ ] Live regions announce import/match progress
- [ ] All interactive elements have accessible names
- [ ] Drag-and-drop has keyboard alternative

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] All API endpoints return expected status codes
- [ ] Statement import formats validated against spec

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for workbench, import modal, exceptions list
- [ ] Dark/light theme variations
- [ ] Match confidence badge variations (high/medium/low)
- [ ] Loading/error/empty states captured
- [ ] Progress indicators captured

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/bank/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] Auto-match processes 1000 transactions in < 5s
- [ ] Statement import (500 transactions) completes in < 10s
- [ ] Workbench renders 200+ transactions smoothly

---

## 📅 Timeline

| Day | Deliverable                   |
| --- | ----------------------------- |
| 1   | Import and auto-match working |
| 1.5 | Workbench and completion done |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries
- ✅ M6: Cash Management

### Enables These Modules

- M20: Close Management

---

## 🎯 Success Criteria

### Must Have

- [ ] Import bank statements
- [ ] Auto-match transactions
- [ ] Manual match exceptions
- [ ] Complete reconciliation
- [ ] View reconciliation history

### Should Have

- [ ] Drag-and-drop matching
- [ ] Split transactions
- [ ] Bulk operations
- [ ] Export reconciliation report

### Nice to Have

- [ ] Direct bank API integration
- [ ] Mobile reconciliation app
- [ ] Scheduled auto-reconciliation
- [ ] AI anomaly detection

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] Import bank statements (CSV, OFX, QBO formats)
- [ ] Auto-match 95%+ of transactions
- [ ] Manual match exceptions
- [ ] Complete reconciliation workflow
- [ ] Exception management
- [ ] Permissions enforced

### Quality Gates 🎯

- [ ] TypeScript: 0 errors
- [ ] Unit tests: ≥90% coverage
- [ ] E2E: All workflows tested
- [ ] Axe: 0 serious/critical
- [ ] Bundle: ≤250KB gzipped
- [ ] Auto-match accuracy: ≥95%

### Observability 📊

- [ ] Analytics: `Bank.Recon.Started`, `Bank.AutoMatch.Run`, `Bank.Recon.Completed`
- [ ] Error tracking integrated
- [ ] Match accuracy dashboards

### Sign-offs 📝

- [ ] Engineering, QA, Design, PM, Security, Accessibility

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M6 - Cash Management  
**Next**: M8 - Fixed Assets
