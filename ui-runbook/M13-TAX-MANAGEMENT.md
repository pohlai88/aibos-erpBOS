# 🚀 M13: Tax Management - UI Implementation Runbook

**Module ID**: M13  
**Module Name**: Tax Management  
**Priority**: HIGH  
**Phase**: 4 - Advanced Financial  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Tax Management handles **corporate income tax provisioning, deferred tax calculations, and tax return preparation** with ASC 740 compliance and multi-jurisdiction support.

### Business Value

- Automated tax provision calculations
- Deferred tax asset and liability tracking
- Multi-jurisdiction tax rate management
- ASC 740 uncertain tax position (UTP) tracking
- Integration with tax return preparation

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-asc740-implementation], [ADR-###-deferred-tax-calculation], [ADR-###-multi-jurisdiction]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 16 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/tax/provisions` - Tax provisions list
- ✅ `/api/tax/provisions/[id]` - Provision details
- ✅ `/api/tax/provisions/calculate` - Calculate tax provision
- ✅ `/api/tax/deferred` - Deferred tax tracking
- ✅ `/api/tax/deferred/reconciliation` - DTA/DTL reconciliation
- ✅ `/api/tax/jurisdictions` - Multi-jurisdiction rates
- ✅ `/api/tax/jurisdictions/[id]/update` - Update tax rates
- ✅ `/api/tax/adjustments` - Book-to-tax adjustments
- ✅ `/api/tax/utp` - Uncertain tax positions
- ✅ `/api/tax/valuation-allowance` - Valuation allowance calculation
- ✅ Plus 6 additional endpoints for reporting and compliance

**Total Endpoints**: 16

### Risks & Blockers

| Risk                               | Impact | Mitigation                                                      | Owner    |
| ---------------------------------- | ------ | --------------------------------------------------------------- | -------- |
| ASC 740 compliance accuracy        | HIGH   | Auditor validation; documented methodology; comprehensive tests | @finance |
| Deferred tax calculation errors    | HIGH   | Detailed temporary difference tracking; regular review          | @finance |
| Multi-jurisdiction rate management | MED    | Automated rate updates; audit trail; validation rules           | @tax     |
| Valuation allowance assessment     | HIGH   | Documented assessment; regular review; evidence tracking        | @finance |

---

## 🎯 3 Killer Features

### 1. **Automated Tax Provision Calculator** 🧮

**Description**: Real-time tax provision calculation with current and deferred tax components, supporting multiple jurisdictions.

**Why It's Killer**:

- Automated current and deferred tax calculations
- Multi-jurisdiction tax rate engine
- Book-to-tax adjustments tracking
- Effective tax rate (ETR) analysis
- Better than OneSource's manual tax provision tools

**Implementation**:

```typescript
import { Form, Card, DataTable, Chart } from "aibos-ui";

export default function TaxProvisionCalculator() {
  const { calculate } = useTaxProvision();

  return (
    <Form onSubmit={calculate}>
      <Card>
        <h3>Pre-Tax Income</h3>
        <Input
          label="Book Income Before Tax"
          type="number"
          name="book_income"
        />
      </Card>

      <Card>
        <h3>Book-to-Tax Adjustments</h3>
        <DataTable
          data={adjustments}
          columns={[
            { key: "description", label: "Description" },
            { key: "amount", label: "Amount", render: formatCurrency },
            { key: "type", label: "Type", render: (v) => <Badge>{v}</Badge> },
          ]}
        />
        <Button size="sm" onClick={addAdjustment}>
          + Add Adjustment
        </Button>
      </Card>

      <Card className="bg-blue-50">
        <h3>Tax Provision Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4>Current Tax</h4>
            <div className="space-y-2">
              <div>
                <strong>Federal:</strong>{" "}
                {formatCurrency(provision.current_federal)}
              </div>
              <div>
                <strong>State:</strong>{" "}
                {formatCurrency(provision.current_state)}
              </div>
              <div>
                <strong>Foreign:</strong>{" "}
                {formatCurrency(provision.current_foreign)}
              </div>
              <div className="text-xl pt-2">
                <strong>Total Current:</strong>{" "}
                {formatCurrency(provision.total_current)}
              </div>
            </div>
          </div>
          <div>
            <h4>Deferred Tax</h4>
            <div className="space-y-2">
              <div>
                <strong>Federal:</strong>{" "}
                {formatCurrency(provision.deferred_federal)}
              </div>
              <div>
                <strong>State:</strong>{" "}
                {formatCurrency(provision.deferred_state)}
              </div>
              <div>
                <strong>Foreign:</strong>{" "}
                {formatCurrency(provision.deferred_foreign)}
              </div>
              <div className="text-xl pt-2">
                <strong>Total Deferred:</strong>{" "}
                {formatCurrency(provision.total_deferred)}
              </div>
            </div>
          </div>
        </div>
        <div className="text-2xl mt-4 pt-4 border-t">
          <strong>Total Tax Expense:</strong>{" "}
          {formatCurrency(provision.total_expense)}
        </div>
        <div className="text-lg mt-2">
          <strong>Effective Tax Rate:</strong> {provision.effective_rate}%
        </div>
      </Card>
    </Form>
  );
}
```

### 2. **Deferred Tax Asset/Liability Tracker** 📊

**Description**: Visual tracking of deferred tax assets and liabilities with automatic calculation of temporary differences.

**Why It's Killer**:

- Automatic temporary difference identification
- DTA/DTL scheduling and reversal projection
- Valuation allowance calculator
- ASC 740 compliant disclosure generation
- Industry-first visual deferred tax tracking

**Implementation**:

```typescript
import { DataTable, Chart, Card } from "aibos-ui";

export default function DeferredTaxTracker() {
  const { deferredTax } = useDeferredTax();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Deferred Tax Assets</h3>
          <div className="text-3xl">{formatCurrency(deferredTax.assets)}</div>
        </Card>
        <Card>
          <h3>Valuation Allowance</h3>
          <div className="text-3xl text-red-600">
            ({formatCurrency(deferredTax.valuation_allowance)})
          </div>
        </Card>
        <Card>
          <h3>Deferred Tax Liabilities</h3>
          <div className="text-3xl">
            {formatCurrency(deferredTax.liabilities)}
          </div>
        </Card>
      </div>

      <DataTable
        data={deferredTax.items}
        columns={[
          { key: "category", label: "Category" },
          { key: "book_basis", label: "Book Basis", render: formatCurrency },
          { key: "tax_basis", label: "Tax Basis", render: formatCurrency },
          { key: "difference", label: "Difference", render: formatCurrency },
          { key: "tax_rate", label: "Tax Rate" },
          {
            key: "deferred_tax",
            label: "Deferred Tax",
            render: (val) => (
              <Badge variant={val > 0 ? "success" : "destructive"}>
                {formatCurrency(val)}
              </Badge>
            ),
          },
        ]}
      />

      <Chart
        type="waterfall"
        data={deferredTax.reconciliation}
        title="Deferred Tax Movement"
      />
    </div>
  );
}
```

### 3. **Multi-Jurisdiction Tax Rate Manager** 🌍

**Description**: Centralized management of tax rates across multiple jurisdictions with automatic rate updates and apportionment.

**Why It's Killer**:

- Multi-jurisdiction tax rate library
- State apportionment formula calculator
- Foreign tax credit management
- Automatic rate updates via API
- Better than manual jurisdiction tracking

**Implementation**:

```typescript
import { DataTable, Form, Card, Badge } from "aibos-ui";

export default function TaxRateManager() {
  const { jurisdictions, updateRate } = useTaxJurisdictions();

  return (
    <div className="space-y-6">
      <Card>
        <h3>Effective Tax Rate by Jurisdiction</h3>
        <Chart
          type="bar"
          data={jurisdictions.map((j) => ({
            jurisdiction: j.name,
            rate: j.effective_rate,
          }))}
        />
      </Card>

      <DataTable
        data={jurisdictions}
        columns={[
          { key: "jurisdiction", label: "Jurisdiction" },
          {
            key: "type",
            label: "Type",
            render: (v) => <Badge>{v}</Badge>,
          },
          { key: "statutory_rate", label: "Statutory Rate" },
          { key: "effective_rate", label: "Effective Rate" },
          {
            key: "income_allocated",
            label: "Income Allocated",
            render: formatCurrency,
          },
          { key: "tax_expense", label: "Tax Expense", render: formatCurrency },
          {
            key: "actions",
            label: "Actions",
            render: (_, row) => (
              <Button size="sm" onClick={() => updateRate(row.id)}>
                Update Rate
              </Button>
            ),
          },
        ]}
      />

      <Card>
        <h3>State Apportionment</h3>
        <div className="grid grid-cols-3 gap-4">
          <Input label="Sales Factor %" type="number" name="sales_factor" />
          <Input label="Payroll Factor %" type="number" name="payroll_factor" />
          <Input
            label="Property Factor %"
            type="number"
            name="property_factor"
          />
        </div>
        <div className="bg-blue-50 p-4 rounded mt-4">
          <strong>Apportionment %:</strong> {apportionment.total}%
        </div>
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
**File**: `apps/web/app/(dashboard)/tax/provisions/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                           | Target          | Measurement          |
| -------------------------------- | --------------- | -------------------- |
| TTFB (staging)                   | ≤ 70ms          | Server timing header |
| Client TTI for `/tax`            | ≤ 200ms         | Lighthouse CI        |
| Tax provision calculation        | < 5s            | Progress tracking    |
| Deferred tax reconciliation load | < 2s            | APM traces           |
| UI bundle size                   | ≤ 250KB gzipped | Webpack analyzer     |
| Multi-jurisdiction rate update   | < 1s            | Performance profiler |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to tax calculator, deferred tax tracker, rate manager
- **Focus Management**: Focus trap in calculation modals; visible indicators
- **ARIA**: Live regions for calculation results; proper roles
- **Screen Reader**: All amounts and rates announced; calculation progress communicated
- **Axe Target**: 0 serious/critical violations
- **Complex Tables**: Large deferred tax tables with proper headers and navigation

### Security

| Layer          | Requirement                                           |
| -------------- | ----------------------------------------------------- |
| RBAC Scopes    | `tax.read`, `tax.write`, `tax.calculate`, `tax.admin` |
| Enforcement    | Server-side on all endpoints                          |
| Data Exposure  | Only show tax data user has permission to view        |
| Sensitive Data | Mask tax amounts and rates for non-finance users      |
| Audit Trail    | All provisions, calculations, and rate changes logged |

#### UI Permissions Matrix

| Role          | View | Create | Edit | Calculate | Update Rates | UTP Manage | Valuation | Admin |
| ------------- | ---- | ------ | ---- | --------- | ------------ | ---------- | --------- | ----- |
| tax.read      | ✅   | ❌     | ❌   | ❌        | ❌           | ❌         | ❌        | ❌    |
| tax.write     | ✅   | ✅     | ✅   | ❌        | ❌           | ❌         | ❌        | ❌    |
| tax.calculate | ✅   | ✅     | ✅   | ✅        | ✅           | ✅         | ✅        | ❌    |
| tax.admin     | ✅   | ✅     | ✅   | ✅        | ✅           | ✅         | ✅        | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful tax calculation transactions
- **SLA Dashboards**: Real-time metrics on provision accuracy, deferred tax balances, ETR
- **Events Emitted**: `Tax.Provision.Calculated`, `Tax.Rate.Updated`, `Tax.UTP.Created`
- **Logging**: Structured logs with correlation IDs for all ASC 740 calculations
- **Tracing**: Distributed tracing for complex provision algorithms
- **Monitoring**: ASC 740 compliance validation; deferred tax accuracy

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### ASC 740 Rules

| Rule                              | Enforcement                                                            |
| --------------------------------- | ---------------------------------------------------------------------- |
| **Tax Provision Components**      | Must include current (federal, state, foreign) and deferred components |
| **Temporary Differences**         | Tracked separately from permanent differences                          |
| **Deferred Tax Assets**           | Require valuation allowance assessment if realization uncertain        |
| **Effective Tax Rate**            | Calculated as Tax Expense / Pre-Tax Income                             |
| **Book-to-Tax Adjustments**       | Categorized as permanent or temporary                                  |
| **Uncertain Tax Positions (UTP)** | Recognized if >50% likelihood of sustaining upon examination           |
| **Multi-Jurisdiction**            | Income allocated based on apportionment formulas                       |
| **Valuation Allowance**           | Based on more-likely-than-not standard for DTA realization             |

### Currency & Rounding

- **Display**: Presentation currency from tenant settings
- **Rounding Policy**: HALF_UP for tax calculations
- **Multi-Currency**: Foreign tax calculated in local currency; converted to functional
- **FX Impact**: Track foreign exchange impact on deferred tax balances

### Archive Semantics

- **Soft Delete**: Set `inactive_date`; maintain historical records
- **Guard Rails**:
  - ❌ Deny if provision referenced in filed tax return
  - ❌ Deny if deferred tax balance non-zero
  - ❌ Deny if open uncertain tax positions exist
  - ✅ Allow if fully settled and no pending items

---

## 🚨 Error Handling & UX States

### All Possible States

| State                  | UI Display                                        | User Action        |
| ---------------------- | ------------------------------------------------- | ------------------ |
| **Empty**              | "No tax provisions"                               | "Create Provision" |
| **Loading**            | Skeleton provision cards                          | N/A                |
| **Error**              | Error message + retry                             | Retry / Support    |
| **Calculating**        | Progress bar "Calculating tax provision..."       | Wait               |
| **Pending Review**     | Orange badge "Pending Review"                     | Review now         |
| **Approved**           | Green badge "Approved"                            | View details       |
| **Filed**              | Blue badge "Filed"                                | View return        |
| **UTP Identified**     | Yellow warning "Uncertain Tax Position"           | Review UTP         |
| **Valuation Required** | Red alert "Valuation Allowance Assessment Needed" | Assess now         |
| **Permission Denied**  | "Access restricted"                               | Back               |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Submit State**: Button disabled until dirty & valid
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal
- **Real-time Validation**: Check tax rates > 0, amounts valid, rates sum correctly

### Network Errors

| HTTP Status | UI Message                                          | Action              |
| ----------- | --------------------------------------------------- | ------------------- |
| 400         | "Invalid tax data. Check your input."               | Inline field errors |
| 401         | "Session expired. Please log in again."             | Redirect to login   |
| 403         | "You don't have permission for tax calculations."   | Hide action         |
| 404         | "Provision not found. It may have been deleted."    | Return to list      |
| 409         | "Tax provision already calculated for this period." | Show conflict modal |
| 422         | "Validation failed: Tax rates must be ≥ 0."         | Inline errors       |
| 500         | "Calculation failed. Our team has been notified."   | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/tax.json`.

### Page Titles & Headers

| Context             | Copy                       | i18n Key                  |
| ------------------- | -------------------------- | ------------------------- |
| List Page           | "Tax Management"           | `tax.list.title`          |
| Detail Page         | "Tax Provision Details"    | `tax.detail.title`        |
| Create Modal        | "Create Tax Provision"     | `tax.create.title`        |
| Calculator          | "Tax Provision Calculator" | `tax.calculator.title`    |
| Deferred Tax        | "Deferred Tax Tracking"    | `tax.deferred.title`      |
| Jurisdictions       | "Tax Jurisdictions"        | `tax.jurisdictions.title` |
| Uncertain Positions | "Uncertain Tax Positions"  | `tax.utp.title`           |

### State Messages

| State              | Title                        | Message                                                      | Action Button       | i18n Key                  |
| ------------------ | ---------------------------- | ------------------------------------------------------------ | ------------------- | ------------------------- |
| Empty              | "No tax provisions"          | "Create your first tax provision to begin tracking"          | "Create Provision"  | `tax.empty.*`             |
| Loading            | —                            | —                                                            | —                   | —                         |
| Error              | "Unable to load provisions"  | "Something went wrong. Our team has been notified."          | "Retry" / "Support" | `tax.error.*`             |
| No Results         | "No provisions found"        | "Try adjusting your filters or search terms"                 | "Clear Filters"     | `tax.noResults.*`         |
| Permission Denied  | "Access restricted"          | "You don't have permission to view tax provisions."          | "Back"              | `tax.permissionDenied.*`  |
| Calculating        | "Calculating..."             | "Running tax provision calculation. This may take a moment." | —                   | `tax.calculating.*`       |
| Pending Review     | "Pending review"             | "{count} provisions awaiting review"                         | "Review Now"        | `tax.pendingReview.*`     |
| Valuation Required | "Valuation allowance needed" | "Assess valuation allowance for deferred tax assets"         | "Assess Now"        | `tax.valuationRequired.*` |

### Action Confirmations

| Action                    | Title                        | Message                                                              | Confirm Button | Cancel Button | i18n Key                           |
| ------------------------- | ---------------------------- | -------------------------------------------------------------------- | -------------- | ------------- | ---------------------------------- |
| Calculate Provision       | "Calculate tax provision?"   | "Calculate provision for {period}? This posts GL entries."           | "Calculate"    | "Cancel"      | `tax.calculate.confirm.*`          |
| Update Rates              | "Update tax rates?"          | "Update rates for {jurisdiction}? This affects future calculations." | "Update"       | "Cancel"      | `tax.updateRates.confirm.*`        |
| Apply Valuation Allowance | "Apply valuation allowance?" | "Apply allowance of {amount}? This reduces DTA."                     | "Apply"        | "Cancel"      | `tax.valuationAllowance.confirm.*` |
| Recognize UTP             | "Recognize UTP?"             | "Recognize uncertain tax position of {amount}?"                      | "Recognize"    | "Cancel"      | `tax.utp.confirm.*`                |
| File Return               | "Mark as filed?"             | "Mark provision as filed? This locks the provision."                 | "Mark Filed"   | "Cancel"      | `tax.file.confirm.*`               |

### Success Messages (Toast)

| Action               | Message                                         | i18n Key                         |
| -------------------- | ----------------------------------------------- | -------------------------------- |
| Provision Created    | "Tax provision '{period}' created successfully" | `tax.create.success`             |
| Provision Updated    | "Tax provision '{period}' updated successfully" | `tax.update.success`             |
| Provision Calculated | "Tax provision calculated: {amount}"            | `tax.calculate.success`          |
| Rates Updated        | "Tax rates updated for {jurisdiction}"          | `tax.updateRates.success`        |
| Valuation Applied    | "Valuation allowance applied: {amount}"         | `tax.valuationAllowance.success` |
| UTP Recognized       | "Uncertain tax position recognized: {amount}"   | `tax.utp.success`                |

### Error Messages (Toast)

| Scenario               | Message                                                          | i18n Key                     |
| ---------------------- | ---------------------------------------------------------------- | ---------------------------- |
| Create Failed          | "Failed to create provision. Please try again."                  | `tax.create.error`           |
| Calculation Failed     | "Tax calculation failed. Check input values."                    | `tax.calculate.error`        |
| Invalid Tax Rate       | "Tax rate must be ≥ 0 and ≤ 100%."                               | `tax.errorRate`              |
| Invalid Adjustment     | "Book-to-tax adjustment amount invalid."                         | `tax.errorAdjustment`        |
| Deferred Tax Error     | "Deferred tax calculation failed. Verify temporary differences." | `tax.deferred.error`         |
| Jurisdiction Not Found | "Tax jurisdiction not found."                                    | `tax.errorJurisdiction`      |
| Already Calculated     | "Tax provision already calculated for this period."              | `tax.errorAlreadyCalculated` |
| Already Filed          | "Provision already filed. Cannot modify."                        | `tax.errorFiled`             |
| Network Error          | "Network error. Check your connection and try again."            | `tax.error.network`          |

### Form Labels & Help Text

| Field                | Label                  | Placeholder           | Help Text                                       | i18n Key                         |
| -------------------- | ---------------------- | --------------------- | ----------------------------------------------- | -------------------------------- |
| Period               | "Tax Period"           | "e.g., 2025-Q1"       | "Quarter or year for tax provision"             | `tax.field.period.*`             |
| Book Income          | "Pre-Tax Book Income"  | "0.00"                | "Income before tax per GAAP books"              | `tax.field.bookIncome.*`         |
| Tax Rate             | "Tax Rate %"           | "21.0"                | "Applicable tax rate for jurisdiction"          | `tax.field.rate.*`               |
| Jurisdiction         | "Jurisdiction"         | "Select jurisdiction" | "Federal, State, or Foreign jurisdiction"       | `tax.field.jurisdiction.*`       |
| Adjustment Type      | "Adjustment Type"      | "Select type"         | "Permanent or Temporary difference"             | `tax.field.adjustmentType.*`     |
| Adjustment Amount    | "Adjustment Amount"    | "0.00"                | "Book-to-tax adjustment (positive or negative)" | `tax.field.adjustmentAmount.*`   |
| Temporary Difference | "Temporary Difference" | "0.00"                | "Timing difference between book and tax"        | `tax.field.tempDiff.*`           |
| Valuation Allowance  | "Valuation Allowance"  | "0.00"                | "Reduction to DTA if realization uncertain"     | `tax.field.valuationAllowance.*` |
| UTP Amount           | "UTP Amount"           | "0.00"                | "Uncertain tax position reserve"                | `tax.field.utpAmount.*`          |
| UTP Likelihood       | "UTP Likelihood %"     | "0"                   | "Probability of sustaining position (0-100)"    | `tax.field.utpLikelihood.*`      |

### Keyboard Shortcuts Help

| Shortcut | Description               | i18n Key                      |
| -------- | ------------------------- | ----------------------------- |
| `/`      | "Focus search"            | `tax.shortcuts.search`        |
| `n`      | "Create new provision"    | `tax.shortcuts.new`           |
| `c`      | "Open calculator"         | `tax.shortcuts.calculate`     |
| `d`      | "View deferred tax"       | `tax.shortcuts.deferred`      |
| `j`      | "Manage jurisdictions"    | `tax.shortcuts.jurisdictions` |
| `↑ / ↓`  | "Navigate provisions"     | `tax.shortcuts.navigate`      |
| `Enter`  | "Open selected provision" | `tax.shortcuts.open`          |
| `Escape` | "Close modal/cancel"      | `tax.shortcuts.cancel`        |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useTaxManagement.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useTaxProvisions(filters = {}) {
  const queryClient = useQueryClient();

  const {
    data: provisions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tax", "provisions", filters],
    queryFn: () => apiClient.GET("/api/tax/provisions", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });

  const createProvision = useMutation({
    mutationFn: (data) => apiClient.POST("/api/tax/provisions", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tax"] });
      toast.success(`Tax provision '${data.period}' created successfully`);
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Validation failed. Check your input.");
      } else {
        toast.error("Failed to create provision.");
      }
    },
  });

  const updateProvision = useMutation({
    mutationFn: ({ id, data }) =>
      apiClient.PUT("/api/tax/provisions/[id]", { params: { id }, body: data }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["tax"] });
      queryClient.invalidateQueries({ queryKey: ["tax", "provision", id] });
      toast.success("Provision updated successfully");
    },
  });

  return {
    provisions: provisions || [],
    isLoading,
    error,
    createProvision: createProvision.mutate,
    updateProvision: updateProvision.mutate,
  };
}

export function useTaxProvision(id: string) {
  return useQuery({
    queryKey: ["tax", "provision", id],
    queryFn: () =>
      apiClient.GET("/api/tax/provisions/[id]", { params: { id } }),
    staleTime: 30_000, // 30s
    enabled: !!id,
    select: (response) => response.data,
  });
}

export function useCalculateTaxProvision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      period: string;
      book_income: number;
      adjustments: Array<{ type: string; amount: number }>;
      jurisdictions: Array<{
        jurisdiction: string;
        rate: number;
        income: number;
      }>;
    }) => apiClient.POST("/api/tax/provisions/calculate", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tax"] });
      toast.success(`Tax provision calculated: ${data.total_expense}`);
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Tax calculation failed. Check input values.");
      } else {
        toast.error("Calculation failed.");
      }
    },
  });
}

export function useDeferredTax() {
  return useQuery({
    queryKey: ["tax", "deferred"],
    queryFn: () => apiClient.GET("/api/tax/deferred"),
    staleTime: 5 * 60_000, // 5min
    select: (response) => response.data,
  });
}

export function useDeferredTaxReconciliation(period: string) {
  return useQuery({
    queryKey: ["tax", "deferred", "reconciliation", period],
    queryFn: () =>
      apiClient.GET("/api/tax/deferred/reconciliation", { query: { period } }),
    staleTime: 5 * 60_000, // 5min
    enabled: !!period,
    select: (response) => response.data,
  });
}

export function useTaxJurisdictions() {
  const queryClient = useQueryClient();

  const {
    data: jurisdictions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tax", "jurisdictions"],
    queryFn: () => apiClient.GET("/api/tax/jurisdictions"),
    staleTime: 10 * 60_000, // 10min
    select: (response) => response.data,
  });

  const updateRate = useMutation({
    mutationFn: (data: {
      jurisdiction_id: string;
      rate: number;
      effective_date: string;
    }) =>
      apiClient.POST("/api/tax/jurisdictions/[id]/update", {
        params: { id: data.jurisdiction_id },
        body: { rate: data.rate, effective_date: data.effective_date },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tax", "jurisdictions"] });
      toast.success(`Tax rates updated for ${data.jurisdiction_name}`);
    },
    onError: () => {
      toast.error("Failed to update rates.");
    },
  });

  return {
    jurisdictions: jurisdictions || [],
    isLoading,
    error,
    updateRate: updateRate.mutate,
  };
}

export function useApplyValuationAllowance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      period: string;
      dta_balance: number;
      allowance_amount: number;
      justification: string;
    }) => apiClient.POST("/api/tax/valuation-allowance", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tax", "deferred"] });
      toast.success(`Valuation allowance applied: ${data.allowance_amount}`);
    },
    onError: () => {
      toast.error("Failed to apply valuation allowance.");
    },
  });
}

export function useUncertainTaxPositions() {
  const queryClient = useQueryClient();

  const {
    data: utps,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tax", "utp"],
    queryFn: () => apiClient.GET("/api/tax/utp"),
    staleTime: 30_000, // 30s
    select: (response) => response.data,
  });

  const recognizeUTP = useMutation({
    mutationFn: (data: {
      description: string;
      amount: number;
      likelihood: number;
      jurisdiction: string;
    }) => apiClient.POST("/api/tax/utp", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tax", "utp"] });
      toast.success(`Uncertain tax position recognized: ${data.amount}`);
    },
    onError: () => {
      toast.error("Failed to recognize UTP.");
    },
  });

  return {
    utps: utps || [],
    isLoading,
    error,
    recognizeUTP: recognizeUTP.mutate,
  };
}
```

### Error Mapping

| API Error         | User Message                                        | UI Action            |
| ----------------- | --------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid tax data. Check your input."               | Inline field errors  |
| 409 (Conflict)    | "Tax provision already calculated for this period." | Show conflict modal  |
| 422 (Validation)  | "Validation failed: Tax rates must be ≥ 0."         | Inline errors        |
| 403 (Forbidden)   | "You don't have permission for tax calculations."   | Hide action buttons  |
| 500 (Server)      | "Calculation failed. Our team has been notified."   | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Tax calculations**: 10s timeout; complex calculations

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["tax", "provisions", { filters }][("tax", "provision", provisionId)][
  ("tax", "deferred")
][("tax", "deferred", "reconciliation", period)][("tax", "jurisdictions")][
  ("tax", "utp")
];
```

### Invalidation Rules

| Action                    | Invalidates                                             |
| ------------------------- | ------------------------------------------------------- |
| Create Provision          | `["tax", "provisions"]`                                 |
| Update Provision          | `["tax", "provisions"]`, `["tax", "provision", id]`     |
| Calculate Provision       | `["tax", "provisions"]`, `["tax", "provision", id]`     |
| Update Rates              | `["tax", "jurisdictions"]`, all `["tax", "provisions"]` |
| Apply Valuation Allowance | `["tax", "deferred"]`, `["tax", "provisions"]`          |
| Recognize UTP             | `["tax", "utp"]`, `["tax", "provisions"]`               |

### Stale Time

| Query Type       | Stale Time | Reasoning                              |
| ---------------- | ---------- | -------------------------------------- |
| Provision List   | 30s        | Frequent updates; calculations ongoing |
| Provision Detail | 30s        | Moderate changes                       |
| Deferred Tax     | 5min       | Refresh periodically for tracking      |
| Jurisdictions    | 10min      | Rates change infrequently              |
| UTP              | 30s        | Monitor uncertain positions regularly  |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("tax"); // After mutations
revalidateTag(`tax-provision-${provisionId}`); // Specific provision
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/tax.fixtures.ts`

**Datasets**:

- `minimalProvisions`: 5 provisions (basic set)
- `standardProvisions`: 50 provisions with various jurisdictions
- `complexProvisions`: Provisions with UTPs, deferred tax, valuation allowances
- `edgeCases`: Special scenarios

**Edge Cases Covered**:

- Single jurisdiction provisions
- Multi-jurisdiction provisions (federal + state + foreign)
- Provisions with large book-to-tax adjustments
- Provisions with valuation allowances
- Provisions with uncertain tax positions
- Foreign provisions with FX impact
- Negative effective tax rates
- Zero-tax jurisdictions

```typescript
// Example fixture structure
export const standardProvisions: TaxProvisionFixture[] = [
  {
    id: "prov_1",
    period: "2025-Q1",
    book_income: 1000000,
    current_federal: 185000,
    current_state: 35000,
    current_foreign: 25000,
    deferred_federal: 15000,
    deferred_state: 3000,
    deferred_foreign: 2000,
    total_expense: 265000,
    effective_rate: 26.5,
    status: "Calculated",
  },
  // ... 49 more
];
```

### E2E Seed Data

**Location**: `tests/seeds/tax.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:tax
```

**Dataset**:

- 50 provisions across various periods
- 10 jurisdictions (federal, 5 states, 4 foreign)
- 20 deferred tax items
- 5 uncertain tax positions
- Mix of provision statuses (pending, calculated, filed)

**Cleanup Command**:

```powershell
pnpm run seed:tax:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic company: "Demo Corp Inc." with $10M taxable income
- 25 provisions demonstrating all features
- Complete deferred tax tracking (DTAs and DTLs)
- Example UTPs
- Multi-jurisdiction examples
- Valuation allowance scenarios

**Regeneration**:

```powershell
pnpm run demo:reset:tax
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] Tax rates ≥ 0 and ≤ 100%
- [ ] Effective tax rate = Total Expense / Book Income
- [ ] Current + Deferred = Total Expense
- [ ] Valid jurisdiction references
- [ ] UTP likelihood 0-100%
- [ ] No circular references

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
- **Interactive Parts**: Mark with `"use client"` (calculator, deferred tracker, rate manager)

### Data Fetching Strategy

| Scenario        | Strategy                               | Benefit             |
| --------------- | -------------------------------------- | ------------------- |
| Initial List    | Server-side fetch + stream             | Faster TTFB         |
| CRUD Operations | Client-side React Query                | Optimistic updates  |
| Detail Page     | Server component wrapper + client form | SEO + interactivity |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function calculateProvision(data) {
  // ... mutation logic
  revalidateTag("tax");
  revalidateTag("tax-provisions");
}
```

---

## 📊 Analytics & Audit Events

| Event                          | When                 | Properties                                                       |
| ------------------------------ | -------------------- | ---------------------------------------------------------------- |
| Tax.Provision.Created          | After 2xx            | `provision_id`, `period`, `book_income`                          |
| Tax.Provision.Updated          | After 2xx            | `provision_id`, changed fields                                   |
| Tax.Provision.Calculated       | Calculation complete | `provision_id`, `total_expense`, `effective_rate`, `duration_ms` |
| Tax.Rate.Updated               | Rate change          | `jurisdiction`, `old_rate`, `new_rate`, `effective_date`         |
| Tax.ValuationAllowance.Applied | Allowance applied    | `period`, `dta_balance`, `allowance_amount`                      |
| Tax.UTP.Recognized             | UTP created          | `utp_id`, `amount`, `likelihood`, `jurisdiction`                 |
| Tax.DeferredTax.Viewed         | Deferred page opened | `period`, `dta_total`, `dtl_total`, `net_balance`                |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Tax.Provision.Calculated", {
  provision_id: provision.id,
  period: provision.period,
  total_expense: provision.total_expense,
  effective_rate: provision.effective_rate,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/tax.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency Display**: Respect locale-specific currency symbols
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Tax Terminology**: Maintain consistent terminology across locales

### Keyboard Shortcuts

| Key      | Action                  | Scope          |
| -------- | ----------------------- | -------------- |
| `/`      | Focus search            | Provision list |
| `n`      | Create new provision    | Provision list |
| `c`      | Open calculator         | Any page       |
| `d`      | View deferred tax       | Any page       |
| `j`      | Manage jurisdictions    | Any page       |
| `↑ / ↓`  | Navigate provisions     | Table          |
| `Enter`  | Open selected provision | Table          |
| `Escape` | Close modal/cancel      | Modal/Form     |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateModal()],
  ["c", () => openCalculator()],
  ["d", () => router.push("/tax/deferred")],
  ["j", () => router.push("/tax/jurisdictions")],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                      | Duration | Rollback Trigger |
| ----------- | ---------------- | ----------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                      | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, Lighthouse ≥90, ASC 740 validated | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, Calculation accuracy 100%          | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained              | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m13_tax: false,                  // Master toggle
  m13_tax_calculator: false,       // Tax calculator
  m13_tax_deferred: false,         // Deferred tax tracking
  m13_tax_utp: false,              // Uncertain tax positions
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/tax`, `/tax/calculator`, `/tax/deferred`)
- P50/P95/P99 latency
- Calculation accuracy (vs manual review)
- Effective tax rate trends
- UTP tracking accuracy

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Calculation error → immediate alert
- ASC 740 calculation error → alert finance team
- P95 latency > 500ms for 10min → investigate

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m13_tax = false`

   ```powershell
   pnpm run flags:set m13_tax=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("tax");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/tax/*"
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

| Scenario                 | Action             | Approval Required |
| ------------------------ | ------------------ | ----------------- |
| Error rate > 5%          | Immediate rollback | No (auto-trigger) |
| Calculation error        | Immediate rollback | No (auto-trigger) |
| ASC 740 compliance error | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%          | Partial rollback   | On-call engineer  |
| P95 latency > 1s         | Investigate first  | On-call engineer  |
| Data corruption/loss     | Immediate rollback | No (auto-trigger) |

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

- ASC 740: Income Taxes (US GAAP)
- IAS 12: Income Taxes (IFRS)
- ERPNext: Tax management workflows
- OneSource: Tax provision automation

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: ASC 740 Compliance Accuracy

**Mitigation**: Auditor validation; documented methodology; comprehensive test coverage; regular accounting review

### Risk #2: Deferred Tax Calculation Errors

**Mitigation**: Detailed temporary difference tracking; regular reconciliation; audit trail; validation rules

### Risk #3: Multi-Jurisdiction Rate Management

**Mitigation**: Automated rate updates; audit trail; validation rules; regular review; tax authority integration

### Risk #4: Valuation Allowance Assessment

**Mitigation**: Documented assessment; regular review; evidence tracking; more-likely-than-not standard application

---

## 📝 Implementation Guide

### Day 1: Provisions & Calculator (8 hours)

1. Build tax provisions table (3 hours)
2. Create tax provision calculator (4 hours)
3. Implement book-to-tax adjustments form (1 hour)

### Day 2: Deferred Tax & Jurisdictions (8 hours)

1. Build deferred tax tracker (3 hours)
2. Create multi-jurisdiction rate manager (3 hours)
3. Implement UTP tracking (2 hours)

**Total**: 2 days (16 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Tax provision calculation accurate (current + deferred)
- [ ] Effective tax rate calculation (Expense / Income)
- [ ] Deferred tax calculation (Temp Diff × Rate)
- [ ] Valuation allowance logic
- [ ] UTP recognition (> 50% likelihood)
- [ ] Multi-jurisdiction apportionment
- [ ] useTaxProvisions hook fetches correctly
- [ ] Currency formatting displays correctly

### Integration Tests

- [ ] Create provision → appears in list
- [ ] Calculate provision → amounts accurate
- [ ] Update rates → future provisions affected
- [ ] Apply valuation allowance → DTA reduced
- [ ] Recognize UTP → provision adjusted
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] User can navigate to tax page
- [ ] User can create provision with multiple jurisdictions
- [ ] User can calculate tax provision
- [ ] User can view deferred tax tracking
- [ ] User can update tax rates
- [ ] User can apply valuation allowance
- [ ] User can recognize UTP
- [ ] Keyboard-only flow: create → calculate → review

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Calculator accessible
- [ ] Screen reader announces amounts and rates
- [ ] Focus management correct (calculator, modals, forms)
- [ ] Color contrast meets WCAG 2.2 AA (AAA where practical)
- [ ] Axe: 0 serious/critical violations
- [ ] Large deferred tax tables accessible

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] All API endpoints return expected status codes
- [ ] ASC 740 results validated against spec

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for provisions, calculator, deferred tax
- [ ] Dark/light theme variations
- [ ] Provision status badge variations
- [ ] Loading/error/empty states captured

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/tax/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] Tax provision calculation completes in < 5s
- [ ] Deferred tax reconciliation loads in < 2s
- [ ] Multi-jurisdiction rate update < 1s

---

## 📅 Timeline

| Day | Deliverable                        |
| --- | ---------------------------------- |
| 1   | Provisions + Calculator            |
| 2   | Deferred Tax + Jurisdictions + UTP |

**Total**: 2 days (16 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries

### Enables These Modules

- M14: Budget Planning (tax impact forecasting)
- M20: Close Management (tax provision in close checklist)
- Financial reporting modules

---

## 🎯 Success Criteria

### Must Have

- [ ] Create and manage tax provisions
- [ ] Automated tax provision calculator
- [ ] Current and deferred tax components
- [ ] Multi-jurisdiction tax rate management
- [ ] Book-to-tax adjustments tracking
- [ ] Deferred tax asset/liability tracking
- [ ] Effective tax rate calculation

### Should Have

- [ ] Valuation allowance assessment
- [ ] Uncertain tax position tracking
- [ ] State apportionment formulas
- [ ] Foreign tax credit management
- [ ] Tax provision forecasting

### Nice to Have

- [ ] AI-powered temporary difference identification
- [ ] Automated rate updates via API
- [ ] Tax planning scenarios
- [ ] Tax analytics dashboard

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/tax`, `/tax/provisions/[id]`, `/tax/calculator`, `/tax/deferred`, `/tax/jurisdictions`)
- [ ] All CRUD operations working (Create, Read, Update, Calculate, Rate Updates, Valuation, UTP)
- [ ] Tax provision calculator complete
- [ ] Current and deferred tax calculations working
- [ ] Multi-jurisdiction rate management functional
- [ ] Deferred tax tracking accurate
- [ ] Book-to-tax adjustments working
- [ ] Search and filtering working (period, jurisdiction, status)
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
- [ ] Integration tests: All CRUD + calculation operations covered
- [ ] E2E tests: All user flows covered (create → calculate → review)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Provision creation flow
- Tax calculation flow
- Deferred tax tracking flow
- Rate update flow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/tax/*` routes
- [ ] TTFB: ≤70ms on staging (Server-Timing header)
- [ ] TTI: ≤200ms for `/tax` (Lighthouse CI)
- [ ] Tax calculation: < 5s
- [ ] Deferred tax reconciliation: < 2s
- [ ] Rate update: < 1s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues
- [ ] Calculator accessibility: Full keyboard navigation

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `Tax.Provision.Created`
  - `Tax.Provision.Calculated`
  - `Tax.Rate.Updated`
  - `Tax.ValuationAllowance.Applied`
  - `Tax.UTP.Recognized`
  - `Tax.DeferredTax.Viewed`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, calculation accuracy, ASC 740 compliance)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Tax amounts masked for non-finance users
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] Audit trail maintained for all provisions and calculations
- [ ] ASC 740 compliance validated

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete (changes, testing, screenshots)
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized (OpenAPI hash verified)
- [ ] i18n keys documented in copy deck
- [ ] User acceptance testing passed (PM/QA sign-off)
- [ ] ASC 740 methodology documented

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m13_tax = false` (ready to enable)
  - `flags.m13_tax_calculator = false` (phase 2)
  - `flags.m13_tax_deferred = false` (phase 2)
  - `flags.m13_tax_utp = false` (phase 2)
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
- [ ] **Finance/Tax**: ASC 740 compliance validated

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M12 - Revenue Recognition  
**Next**: M14 - Budget Planning
