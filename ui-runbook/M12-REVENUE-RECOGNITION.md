# 🚀 M12: Revenue Recognition - UI Implementation Runbook

**Module ID**: M12  
**Module Name**: Revenue Recognition  
**Priority**: HIGH  
**Phase**: 4 - Advanced Financial  
**Estimated Effort**: 2.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Revenue Recognition manages **ASC 606 compliant revenue accounting** with performance obligation tracking, contract modifications, and deferred revenue management.

### Business Value

- Full ASC 606 / IFRS 15 compliance automation
- Performance obligation allocation and tracking
- Variable consideration and constraint estimation
- Contract modification accounting
- Deferred revenue waterfall and forecast

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-asc606-implementation], [ADR-###-contract-modifications], [ADR-###-variable-consideration]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 26 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/revenue/contracts` - Revenue contracts list
- ✅ `/api/revenue/contracts/[id]` - Contract details
- ✅ `/api/revenue/contracts/[id]/performance-obligations` - POs for contract
- ✅ `/api/revenue/contracts/[id]/allocate` - Allocate transaction price
- ✅ `/api/revenue/contracts/[id]/recognize` - Recognize revenue
- ✅ `/api/revenue/contracts/[id]/modify` - Apply contract modification
- ✅ `/api/revenue/deferred` - Deferred revenue balances
- ✅ `/api/revenue/deferred/waterfall` - Deferred revenue waterfall
- ✅ `/api/revenue/forecast` - Revenue recognition forecast
- ✅ `/api/revenue/asc606-wizard` - ASC 606 wizard analysis
- ✅ Plus 16 additional endpoints for adjustments, reporting, and compliance

**Total Endpoints**: 26

### Risks & Blockers

| Risk                                  | Impact | Mitigation                                                      | Owner    |
| ------------------------------------- | ------ | --------------------------------------------------------------- | -------- |
| ASC 606 compliance accuracy           | HIGH   | Auditor validation; documented methodology; comprehensive tests | @finance |
| Variable consideration estimation     | HIGH   | Constraint methodology; regular review; audit trail             | @finance |
| Contract modification complexity      | HIGH   | Decision tree logic; accounting review; test coverage           | @backend |
| Performance obligation identification | MED    | Clear criteria; review process; documentation                   | @finance |

---

## 🎯 3 Killer Features

### 1. **ASC 606 Five-Step Wizard** 🪄

**Description**: Interactive wizard that guides users through the five-step ASC 606 revenue recognition framework.

**Why It's Killer**:

- Step-by-step guidance through contract analysis
- Automatic performance obligation identification
- Transaction price allocation engine
- Variable consideration calculator with constraint
- Industry-first visual ASC 606 compliance tool

**Implementation**:

```typescript
import { Wizard, Card, Form, Chart } from "aibos-ui";

export default function ASC606Wizard({ contractId }) {
  const { contract, allocate } = useRevenueContract(contractId);

  return (
    <Wizard
      steps={[
        {
          title: "Step 1: Identify Contract",
          content: (
            <Card>
              <h3>Contract Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Customer:</strong> {contract.customer}
                </div>
                <div>
                  <strong>Total Value:</strong>{" "}
                  {formatCurrency(contract.total_value)}
                </div>
                <div>
                  <strong>Start Date:</strong> {contract.start_date}
                </div>
                <div>
                  <strong>Term:</strong> {contract.term} months
                </div>
              </div>
            </Card>
          ),
        },
        {
          title: "Step 2: Identify Performance Obligations",
          content: (
            <Form>
              {contract.line_items.map((item, idx) => (
                <Card key={idx}>
                  <Input
                    label="Performance Obligation"
                    value={item.description}
                  />
                  <Toggle label="Distinct?" name={`distinct_${idx}`} />
                  <Select
                    label="Recognition Pattern"
                    options={["Point in time", "Over time"]}
                    name={`pattern_${idx}`}
                  />
                </Card>
              ))}
            </Form>
          ),
        },
        {
          title: "Step 3: Determine Transaction Price",
          content: (
            <Card>
              <div className="space-y-4">
                <div>
                  <strong>Base Price:</strong>{" "}
                  {formatCurrency(contract.base_price)}
                </div>
                <Input
                  label="Variable Consideration"
                  type="number"
                  name="variable_consideration"
                />
                <Input
                  label="Constraint %"
                  type="number"
                  name="constraint_percentage"
                />
                <div className="bg-blue-50 p-4 rounded">
                  <strong>Total Transaction Price:</strong>{" "}
                  {formatCurrency(contract.transaction_price)}
                </div>
              </div>
            </Card>
          ),
        },
        {
          title: "Step 4: Allocate Transaction Price",
          content: (
            <div className="space-y-4">
              {contract.performance_obligations.map((po, idx) => (
                <Card key={idx}>
                  <h4>{po.description}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <strong>Standalone Price:</strong>{" "}
                      {formatCurrency(po.standalone_price)}
                    </div>
                    <div>
                      <strong>Allocation %:</strong> {po.allocation_pct}%
                    </div>
                    <div>
                      <strong>Allocated Amount:</strong>{" "}
                      {formatCurrency(po.allocated_amount)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ),
        },
        {
          title: "Step 5: Recognize Revenue",
          content: (
            <div className="space-y-6">
              <Chart
                type="waterfall"
                data={contract.revenue_schedule}
                title="Revenue Recognition Schedule"
              />
              <DataTable
                data={contract.revenue_schedule}
                columns={[
                  { key: "period", label: "Period" },
                  {
                    key: "recognized",
                    label: "Recognized",
                    render: formatCurrency,
                  },
                  {
                    key: "deferred",
                    label: "Deferred",
                    render: formatCurrency,
                  },
                  {
                    key: "cumulative",
                    label: "Cumulative",
                    render: formatCurrency,
                  },
                ]}
              />
            </div>
          ),
        },
      ]}
      onComplete={allocate}
    />
  );
}
```

### 2. **Deferred Revenue Waterfall** 📊

**Description**: Visual waterfall chart showing deferred revenue movement: beginning balance, additions, recognition, and ending balance.

**Why It's Killer**:

- Real-time deferred revenue tracking
- Drill-down to individual contracts
- Forecast future revenue recognition
- Current vs non-current classification
- Better than NetSuite's static reports

**Implementation**:

```typescript
import { Chart, Card, DataTable } from "aibos-ui";

export default function DeferredRevenueWaterfall() {
  const { waterfall } = useDeferredRevenueWaterfall();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Beginning Balance</h3>
          <div className="text-3xl">{formatCurrency(waterfall.beginning)}</div>
        </Card>
        <Card>
          <h3>New Deferrals</h3>
          <div className="text-3xl text-green-600">
            {formatCurrency(waterfall.additions)}
          </div>
        </Card>
        <Card>
          <h3>Recognized</h3>
          <div className="text-3xl text-blue-600">
            {formatCurrency(waterfall.recognized)}
          </div>
        </Card>
        <Card>
          <h3>Ending Balance</h3>
          <div className="text-3xl">{formatCurrency(waterfall.ending)}</div>
        </Card>
      </div>

      <Chart
        type="waterfall"
        data={[
          { label: "Beginning", value: waterfall.beginning },
          {
            label: "New Deferrals",
            value: waterfall.additions,
            type: "increase",
          },
          {
            label: "Recognized",
            value: -waterfall.recognized,
            type: "decrease",
          },
          { label: "Ending", value: waterfall.ending, type: "total" },
        ]}
        title="Deferred Revenue Movement"
      />

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h3>Current Portion</h3>
          <div className="text-2xl">{formatCurrency(waterfall.current)}</div>
        </Card>
        <Card>
          <h3>Non-Current Portion</h3>
          <div className="text-2xl">
            {formatCurrency(waterfall.non_current)}
          </div>
        </Card>
      </div>
    </div>
  );
}
```

### 3. **Contract Modification Tracker** 🔄

**Description**: Automated accounting for contract modifications with prospective vs retrospective treatment analysis.

**Why It's Killer**:

- Automatic modification type identification
- Side-by-side accounting treatment comparison
- Impact analysis on revenue recognition
- Audit trail of all contract changes
- Industry-first automated contract modification accounting

**Implementation**:

```typescript
import { Form, Card, Badge, Timeline } from "aibos-ui";

export default function ContractModification({ contractId }) {
  const { contract, analyzeModification } = useContractModification(contractId);

  return (
    <div className="space-y-6">
      <Card>
        <h3>Original Contract</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <strong>Total Value:</strong>{" "}
            {formatCurrency(contract.original_value)}
          </div>
          <div>
            <strong>Term:</strong> {contract.original_term} months
          </div>
          <div>
            <strong>Status:</strong> <Badge>{contract.status}</Badge>
          </div>
        </div>
      </Card>

      <Form onSubmit={analyzeModification}>
        <h3>Proposed Modification</h3>
        <Input label="Additional Goods/Services" name="additional_items" />
        <Input
          label="Additional Consideration"
          type="number"
          name="additional_consideration"
        />
        <Select
          label="Modification Type"
          options={[
            "Separate contract",
            "Termination + new contract",
            "Continuation - prospective",
            "Continuation - retrospective",
          ]}
          name="modification_type"
        />

        <Card className="bg-blue-50">
          <h4>Accounting Treatment</h4>
          <div className="space-y-2">
            <div>
              <strong>Recommended Treatment:</strong>
              <Badge variant="primary">{analysis.recommended_treatment}</Badge>
            </div>
            <div>
              <strong>Impact on Revenue:</strong>{" "}
              {formatCurrency(analysis.revenue_impact)}
            </div>
            <div>
              <strong>Adjustment Required:</strong>
              {analysis.requires_adjustment ? "Yes" : "No"}
            </div>
          </div>
        </Card>

        <Button type="submit">Apply Modification</Button>
      </Form>

      <Timeline
        items={contract.modifications.map((mod) => ({
          date: mod.date,
          title: mod.type,
          description: `${formatCurrency(mod.amount)} - ${mod.treatment}`,
        }))}
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
**File**: `apps/web/app/(dashboard)/revenue/contracts/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                                  | Target          | Measurement          |
| --------------------------------------- | --------------- | -------------------- |
| TTFB (staging)                          | ≤ 70ms          | Server timing header |
| Client TTI for `/revenue`               | ≤ 200ms         | Lighthouse CI        |
| ASC 606 wizard completion               | < 10s           | Progress tracking    |
| Deferred revenue waterfall load         | < 2s            | APM traces           |
| UI bundle size                          | ≤ 250KB gzipped | Webpack analyzer     |
| Revenue forecast generation (12 months) | < 3s            | Performance profiler |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to wizard, waterfall, modifications
- **Focus Management**: Focus trap in wizard steps; visible indicators
- **ARIA**: Live regions for calculation results; proper roles
- **Screen Reader**: All amounts and obligations announced; wizard progress communicated
- **Axe Target**: 0 serious/critical violations
- **Complex Forms**: Multi-step wizard with clear progress indicators

### Security

| Layer              | Requirement                                                           |
| ------------------ | --------------------------------------------------------------------- |
| RBAC Scopes        | `revenue.read`, `revenue.write`, `revenue.recognize`, `revenue.admin` |
| Enforcement        | Server-side on all endpoints                                          |
| Data Exposure      | Only show contracts user has permission to view                       |
| Revenue Visibility | Mask revenue amounts for non-finance users                            |
| Audit Trail        | All recognition, modifications, and adjustments logged                |

#### UI Permissions Matrix

| Role              | View | Create | Edit | Recognize | Modify Contract | ASC 606 Wizard | Forecast | Admin |
| ----------------- | ---- | ------ | ---- | --------- | --------------- | -------------- | -------- | ----- |
| revenue.read      | ✅   | ❌     | ❌   | ❌        | ❌              | ❌             | ✅       | ❌    |
| revenue.write     | ✅   | ✅     | ✅   | ❌        | ❌              | ✅             | ✅       | ❌    |
| revenue.recognize | ✅   | ✅     | ✅   | ✅        | ✅              | ✅             | ✅       | ❌    |
| revenue.admin     | ✅   | ✅     | ✅   | ✅        | ✅              | ✅             | ✅       | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful revenue recognition transactions
- **SLA Dashboards**: Real-time metrics on contract counts, deferred balances, recognition accuracy
- **Events Emitted**: `Revenue.Contract.Created`, `Revenue.Recognized`, `Revenue.Modified`
- **Logging**: Structured logs with correlation IDs for all ASC 606 calculations
- **Tracing**: Distributed tracing for complex allocation algorithms
- **Monitoring**: ASC 606 compliance validation; deferred revenue accuracy

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### ASC 606 Rules

| Rule                                  | Enforcement                                                 |
| ------------------------------------- | ----------------------------------------------------------- |
| **Five-Step Process**                 | All contracts must complete ASC 606 five-step analysis      |
| **Performance Obligations**           | Must be distinct and separately identifiable                |
| **Transaction Price**                 | Must include variable consideration with constraint applied |
| **Allocation**                        | Based on standalone selling prices (SSP)                    |
| **Recognition**                       | Point in time or over time based on transfer of control     |
| **Contract Modifications**            | Separate contract, termination, or continuation treatment   |
| **Deferred Revenue**                  | Current vs non-current classification (< 12 months)         |
| **Variable Consideration Constraint** | Only recognize to extent highly probable no reversal        |

### Currency & Rounding

- **Display**: Presentation currency from tenant settings
- **Rounding Policy**: HALF_UP for allocation calculations
- **Multi-Currency**: Contracts in foreign currency; track FX at contract inception
- **Recognition**: Use spot rate at recognition date for foreign contracts

### Archive Semantics

- **Soft Delete**: Set `inactive_date`; maintain historical records
- **Guard Rails**:
  - ❌ Deny if contract has unrecognized revenue
  - ❌ Deny if contract has pending modifications
  - ❌ Deny if referenced in active forecasts
  - ✅ Allow if fully recognized and no pending items

---

## 🚨 Error Handling & UX States

### All Possible States

| State                    | UI Display                                     | User Action         |
| ------------------------ | ---------------------------------------------- | ------------------- |
| **Empty**                | "No revenue contracts"                         | "Create Contract"   |
| **Loading**              | Skeleton contract cards                        | N/A                 |
| **Error**                | Error message + retry                          | Retry / Support     |
| **Calculating**          | Progress bar "Calculating allocation..."       | Wait                |
| **Pending Recognition**  | Orange badge "Ready to Recognize"              | Recognize now       |
| **Partially Recognized** | Blue progress bar showing %                    | View schedule       |
| **Fully Recognized**     | Green badge "Fully Recognized"                 | Archive             |
| **Modified**             | Yellow warning "Contract Modified"             | Review modification |
| **Constraint Exceeded**  | Red alert "Variable consideration constrained" | Review estimate     |
| **Permission Denied**    | "Access restricted"                            | Back                |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Submit State**: Button disabled until dirty & valid
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal
- **Real-time Validation**: Check SSP > 0, dates valid, amounts sum correctly

### Network Errors

| HTTP Status | UI Message                                                     | Action              |
| ----------- | -------------------------------------------------------------- | ------------------- |
| 400         | "Invalid contract data. Check your input."                     | Inline field errors |
| 401         | "Session expired. Please log in again."                        | Redirect to login   |
| 403         | "You don't have permission for revenue recognition."           | Hide action         |
| 404         | "Contract not found. It may have been deleted."                | Return to list      |
| 409         | "Contract already has pending recognition."                    | Show conflict modal |
| 422         | "Validation failed: Performance obligations must be distinct." | Inline errors       |
| 500         | "Operation failed. Our team has been notified."                | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/revenue.json`.

### Page Titles & Headers

| Context              | Copy                           | i18n Key                      |
| -------------------- | ------------------------------ | ----------------------------- |
| List Page            | "Revenue Contracts"            | `revenue.list.title`          |
| Detail Page          | "Contract Details"             | `revenue.detail.title`        |
| Create Modal         | "Create Revenue Contract"      | `revenue.create.title`        |
| ASC 606 Wizard       | "ASC 606 Analysis"             | `revenue.asc606.title`        |
| Deferred Waterfall   | "Deferred Revenue"             | `revenue.deferred.title`      |
| Recognition Schedule | "Revenue Recognition Schedule" | `revenue.schedule.title`      |
| Modifications        | "Contract Modifications"       | `revenue.modifications.title` |

### State Messages

| State               | Title                      | Message                                                | Action Button       | i18n Key                       |
| ------------------- | -------------------------- | ------------------------------------------------------ | ------------------- | ------------------------------ |
| Empty               | "No revenue contracts"     | "Create your first revenue contract to begin tracking" | "Create Contract"   | `revenue.empty.*`              |
| Loading             | —                          | —                                                      | —                   | —                              |
| Error               | "Unable to load contracts" | "Something went wrong. Our team has been notified."    | "Retry" / "Support" | `revenue.error.*`              |
| No Results          | "No contracts found"       | "Try adjusting your filters or search terms"           | "Clear Filters"     | `revenue.noResults.*`          |
| Permission Denied   | "Access restricted"        | "You don't have permission to view revenue contracts." | "Back"              | `revenue.permissionDenied.*`   |
| Calculating         | "Calculating..."           | "Running ASC 606 allocation. This may take a moment."  | —                   | `revenue.calculating.*`        |
| Pending Recognition | "Ready to recognize"       | "{count} contracts ready for revenue recognition"      | "Recognize Now"     | `revenue.pendingRecognition.*` |
| Modified            | "Contract modified"        | "Review modification accounting treatment"             | "Review"            | `revenue.modified.*`           |

### Action Confirmations

| Action              | Title                         | Message                                                        | Confirm Button | Cancel Button | i18n Key                       |
| ------------------- | ----------------------------- | -------------------------------------------------------------- | -------------- | ------------- | ------------------------------ |
| Recognize Revenue   | "Recognize revenue?"          | "Recognize {amount} for {period}? This posts GL entries."      | "Recognize"    | "Cancel"      | `revenue.recognize.confirm.*`  |
| Modify Contract     | "Modify contract?"            | "Apply {type} modification? This affects revenue recognition." | "Apply"        | "Cancel"      | `revenue.modify.confirm.*`     |
| Allocate Price      | "Allocate transaction price?" | "Allocate {amount} across {count} performance obligations?"    | "Allocate"     | "Cancel"      | `revenue.allocate.confirm.*`   |
| Apply Constraint    | "Apply constraint?"           | "Constrain variable consideration by {percentage}%?"           | "Apply"        | "Cancel"      | `revenue.constraint.confirm.*` |
| Reverse Recognition | "Reverse revenue?"            | "Reverse {amount} recognition? This creates reversal entry."   | "Reverse"      | "Cancel"      | `revenue.reverse.confirm.*`    |

### Success Messages (Toast)

| Action               | Message                                          | i18n Key                    |
| -------------------- | ------------------------------------------------ | --------------------------- |
| Contract Created     | "Contract '{name}' created successfully"         | `revenue.create.success`    |
| Contract Updated     | "Contract '{name}' updated successfully"         | `revenue.update.success`    |
| Revenue Recognized   | "Revenue recognized: {amount} for {period}"      | `revenue.recognize.success` |
| Modification Applied | "Contract modification applied: {type}"          | `revenue.modify.success`    |
| Allocation Complete  | "Transaction price allocated across {count} POs" | `revenue.allocate.success`  |
| Wizard Complete      | "ASC 606 analysis completed successfully"        | `revenue.wizard.success`    |

### Error Messages (Toast)

| Scenario                       | Message                                                                 | i18n Key                         |
| ------------------------------ | ----------------------------------------------------------------------- | -------------------------------- |
| Create Failed                  | "Failed to create contract. Please try again."                          | `revenue.create.error`           |
| Recognition Failed             | "Failed to recognize revenue. Check contract status."                   | `revenue.recognize.error`        |
| Invalid Performance Obligation | "Performance obligations must be distinct and separately identifiable." | `revenue.errorPO`                |
| Invalid SSP                    | "Standalone selling price must be > 0."                                 | `revenue.errorSSP`               |
| Invalid Allocation             | "Allocation percentages must sum to 100%."                              | `revenue.errorAllocation`        |
| Constraint Violation           | "Variable consideration exceeds constraint threshold."                  | `revenue.errorConstraint`        |
| Modification Failed            | "Contract modification failed. Review treatment rules."                 | `revenue.modify.error`           |
| Already Recognized             | "Revenue already recognized for this period."                           | `revenue.errorAlreadyRecognized` |
| Network Error                  | "Network error. Check your connection and try again."                   | `revenue.error.network`          |

### Form Labels & Help Text

| Field                          | Label                      | Placeholder          | Help Text                                                      | i18n Key                                |
| ------------------------------ | -------------------------- | -------------------- | -------------------------------------------------------------- | --------------------------------------- |
| Contract Number                | "Contract Number"          | "e.g., CNT-2025-001" | "Unique identifier for this contract"                          | `revenue.field.contractNumber.*`        |
| Customer                       | "Customer"                 | "Select customer"    | "Customer party to the contract"                               | `revenue.field.customer.*`              |
| Contract Value                 | "Total Contract Value"     | "0.00"               | "Total consideration from customer"                            | `revenue.field.totalValue.*`            |
| Start Date                     | "Start Date"               | "Select date"        | "Contract commencement date"                                   | `revenue.field.startDate.*`             |
| Term                           | "Contract Term (months)"   | "12"                 | "Duration of the contract"                                     | `revenue.field.term.*`                  |
| Performance Obligation         | "Performance Obligation"   | "e.g., Software"     | "Distinct good or service promised"                            | `revenue.field.po.*`                    |
| Standalone Selling Price (SSP) | "Standalone Selling Price" | "0.00"               | "Price if sold separately"                                     | `revenue.field.ssp.*`                   |
| Recognition Pattern            | "Recognition Pattern"      | "Select pattern"     | "Point in time or Over time"                                   | `revenue.field.pattern.*`               |
| Variable Consideration         | "Variable Consideration"   | "0.00"               | "Estimate of variable amounts (discounts, bonuses, penalties)" | `revenue.field.variableConsideration.*` |
| Constraint %                   | "Constraint Percentage"    | "0"                  | "Percentage to constrain variable consideration"               | `revenue.field.constraint.*`            |

### Keyboard Shortcuts Help

| Shortcut | Description              | i18n Key                      |
| -------- | ------------------------ | ----------------------------- |
| `/`      | "Focus search"           | `revenue.shortcuts.search`    |
| `n`      | "Create new contract"    | `revenue.shortcuts.new`       |
| `w`      | "Open ASC 606 wizard"    | `revenue.shortcuts.wizard`    |
| `r`      | "Recognize revenue"      | `revenue.shortcuts.recognize` |
| `d`      | "View deferred revenue"  | `revenue.shortcuts.deferred`  |
| `↑ / ↓`  | "Navigate contracts"     | `revenue.shortcuts.navigate`  |
| `Enter`  | "Open selected contract" | `revenue.shortcuts.open`      |
| `Escape` | "Close modal/cancel"     | `revenue.shortcuts.cancel`    |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useRevenueRecognition.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useRevenueContracts(filters = {}) {
  const queryClient = useQueryClient();

  const {
    data: contracts,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["revenue", "contracts", filters],
    queryFn: () => apiClient.GET("/api/revenue/contracts", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });

  const createContract = useMutation({
    mutationFn: (data) =>
      apiClient.POST("/api/revenue/contracts", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["revenue"] });
      toast.success(`Contract '${data.contract_number}' created successfully`);
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Validation failed. Check your input.");
      } else {
        toast.error("Failed to create contract.");
      }
    },
  });

  const updateContract = useMutation({
    mutationFn: ({ id, data }) =>
      apiClient.PUT("/api/revenue/contracts/[id]", {
        params: { id },
        body: data,
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["revenue"] });
      queryClient.invalidateQueries({ queryKey: ["revenue", "contract", id] });
      toast.success("Contract updated successfully");
    },
  });

  return {
    contracts: contracts || [],
    isLoading,
    error,
    createContract: createContract.mutate,
    updateContract: updateContract.mutate,
  };
}

export function useRevenueContract(id: string) {
  return useQuery({
    queryKey: ["revenue", "contract", id],
    queryFn: () =>
      apiClient.GET("/api/revenue/contracts/[id]", { params: { id } }),
    staleTime: 30_000, // 30s
    enabled: !!id,
    select: (response) => response.data,
  });
}

export function useAllocateTransactionPrice(contractId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      performance_obligations: Array<{ id: string; ssp: number }>;
    }) =>
      apiClient.POST("/api/revenue/contracts/[id]/allocate", {
        params: { id: contractId },
        body: data,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["revenue", "contract", contractId],
      });
      toast.success(
        `Transaction price allocated across ${data.obligation_count} POs`
      );
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Invalid allocation. Check standalone selling prices.");
      } else {
        toast.error("Allocation failed.");
      }
    },
  });
}

export function useRecognizeRevenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      contract_id: string;
      period: string;
      amount: number;
    }) =>
      apiClient.POST("/api/revenue/contracts/[id]/recognize", {
        params: { id: data.contract_id },
        body: { period: data.period, amount: data.amount },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["revenue"] });
      queryClient.invalidateQueries({ queryKey: ["revenue", "deferred"] });
      toast.success(`Revenue recognized: ${data.amount} for ${data.period}`);
    },
    onError: (error) => {
      if (error.status === 409) {
        toast.error("Revenue already recognized for this period.");
      } else if (error.status === 403) {
        toast.error("You don't have permission for revenue recognition.");
      } else {
        toast.error("Recognition failed. Check contract status.");
      }
    },
  });
}

export function useModifyContract(contractId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      modification_type: string;
      additional_consideration: number;
      additional_items?: string[];
      effective_date: string;
    }) =>
      apiClient.POST("/api/revenue/contracts/[id]/modify", {
        params: { id: contractId },
        body: data,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["revenue"] });
      queryClient.invalidateQueries({
        queryKey: ["revenue", "contract", contractId],
      });
      toast.success(`Contract modification applied: ${data.modification_type}`);
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Contract modification failed. Review treatment rules.");
      } else {
        toast.error("Modification failed.");
      }
    },
  });
}

export function useDeferredRevenueWaterfall() {
  return useQuery({
    queryKey: ["revenue", "deferred", "waterfall"],
    queryFn: () => apiClient.GET("/api/revenue/deferred/waterfall"),
    staleTime: 5 * 60_000, // 5min
    select: (response) => response.data,
  });
}

export function useRevenueForecast(months: number = 12) {
  return useQuery({
    queryKey: ["revenue", "forecast", months],
    queryFn: () =>
      apiClient.GET("/api/revenue/forecast", { query: { months } }),
    staleTime: 10 * 60_000, // 10min
    select: (response) => response.data,
  });
}

export function useASC606Wizard(contractId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      step: number;
      performance_obligations?: Array<any>;
      variable_consideration?: number;
      constraint_percentage?: number;
    }) =>
      apiClient.POST("/api/revenue/asc606-wizard", {
        body: { contract_id: contractId, ...data },
      }),
    onSuccess: (data) => {
      if (data.step === 5) {
        queryClient.invalidateQueries({
          queryKey: ["revenue", "contract", contractId],
        });
        toast.success("ASC 606 analysis completed successfully");
      }
    },
    onError: () => {
      toast.error("Wizard step failed. Check your input.");
    },
  });
}
```

### Error Mapping

| API Error         | User Message                                                   | UI Action            |
| ----------------- | -------------------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid contract data. Check your input."                     | Inline field errors  |
| 409 (Conflict)    | "Revenue already recognized for this period."                  | Show conflict modal  |
| 422 (Validation)  | "Validation failed: Performance obligations must be distinct." | Inline errors        |
| 403 (Forbidden)   | "You don't have permission for revenue recognition."           | Hide action buttons  |
| 500 (Server)      | "Operation failed. Our team has been notified."                | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **ASC 606 calculations**: 15s timeout; complex allocation algorithms

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["revenue", "contracts", { filters }][("revenue", "contract", contractId)][
  ("revenue", "deferred", "waterfall")
][("revenue", "forecast", months)];
```

### Invalidation Rules

| Action                  | Invalidates                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------ |
| Create Contract         | `["revenue", "contracts"]`                                                           |
| Update Contract         | `["revenue", "contracts"]`, `["revenue", "contract", id]`                            |
| Allocate Price          | `["revenue", "contract", id]`                                                        |
| Recognize Revenue       | `["revenue", "contracts"]`, `["revenue", "contract", id]`, `["revenue", "deferred"]` |
| Modify Contract         | `["revenue", "contracts"]`, `["revenue", "contract", id]`, `["revenue", "forecast"]` |
| Complete ASC 606 Wizard | `["revenue", "contract", id]`                                                        |

### Stale Time

| Query Type         | Stale Time | Reasoning                                      |
| ------------------ | ---------- | ---------------------------------------------- |
| Contract List      | 30s        | Frequent updates; recognition changes often    |
| Contract Detail    | 30s        | Moderate changes                               |
| Deferred Waterfall | 5min       | Refresh periodically for dashboard             |
| Revenue Forecast   | 10min      | Expensive calculation; changes less frequently |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("revenue"); // After mutations
revalidateTag(`revenue-contract-${contractId}`); // Specific contract
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/revenue.fixtures.ts`

**Datasets**:

- `minimalContracts`: 5 contracts (basic set)
- `standardContracts`: 50 contracts with various POs, stages
- `complexContracts`: Contracts with modifications, variable consideration
- `edgeCases`: Special scenarios

**Edge Cases Covered**:

- Single performance obligation contracts
- Multi-PO contracts (up to 10 POs)
- Contracts with variable consideration
- Contracts with constraint applied
- Modified contracts (all modification types)
- Partially recognized contracts
- Fully recognized contracts
- Foreign currency contracts

```typescript
// Example fixture structure
export const standardContracts: RevenueContractFixture[] = [
  {
    id: "contract_1",
    contract_number: "CNT-2025-001",
    customer: "Acme Corp",
    total_value: 120000,
    start_date: "2025-01-01",
    term: 12,
    status: "Active",
    performance_obligations: [
      {
        id: "po_1",
        description: "Software License",
        ssp: 100000,
        allocated_amount: 100000,
        pattern: "Over time",
      },
      {
        id: "po_2",
        description: "Implementation Services",
        ssp: 20000,
        allocated_amount: 20000,
        pattern: "Point in time",
      },
    ],
    recognized_to_date: 50000,
    deferred_balance: 70000,
  },
  // ... 49 more
];
```

### E2E Seed Data

**Location**: `tests/seeds/revenue.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:revenue
```

**Dataset**:

- 100 contracts across various stages
- 20 pending recognition
- 30 partially recognized
- 15 fully recognized
- 10 with modifications
- Mix of recognition patterns
- Foreign currency contracts (20% of total)

**Cleanup Command**:

```powershell
pnpm run seed:revenue:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic company: "Demo Corp Inc." with $5M in deferred revenue
- 75 contracts demonstrating all features
- Complete ASC 606 wizard data
- Example modifications
- Deferred revenue waterfall
- 12-month forecast

**Regeneration**:

```powershell
pnpm run demo:reset:revenue
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] SSP > 0 for all performance obligations
- [ ] Allocation percentages sum to 100%
- [ ] Recognition dates within contract term
- [ ] Deferred balance = Total - Recognized
- [ ] Valid modification types
- [ ] No circular contract references

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
- **Interactive Parts**: Mark with `"use client"` (ASC 606 wizard, waterfall chart, modifications)

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

export async function recognizeRevenue(data) {
  // ... mutation logic
  revalidateTag("revenue");
  revalidateTag("revenue-deferred");
}
```

---

## 📊 Analytics & Audit Events

| Event                           | When                 | Properties                                                     |
| ------------------------------- | -------------------- | -------------------------------------------------------------- |
| Revenue.Contract.Created        | After 2xx            | `contract_id`, `customer`, `total_value`, `term`               |
| Revenue.Contract.Updated        | After 2xx            | `contract_id`, changed fields                                  |
| Revenue.PriceAllocated          | Allocation complete  | `contract_id`, `obligation_count`, `total_allocated`           |
| Revenue.Recognized              | Recognition complete | `contract_id`, `period`, `amount`, `cumulative_recognized`     |
| Revenue.ContractModified        | Modification applied | `contract_id`, `modification_type`, `additional_consideration` |
| Revenue.ASC606WizardCompleted   | Wizard step 5 done   | `contract_id`, `duration_ms`, `obligations_count`              |
| Revenue.DeferredWaterfallViewed | Waterfall opened     | `beginning_balance`, `ending_balance`, `recognized_period`     |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Revenue.Recognized", {
  contract_id: contract.id,
  period: recognitionPeriod,
  amount: recognitionAmount,
  cumulative_recognized: contract.recognized_to_date,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/revenue.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency Display**: Respect locale-specific currency symbols
- **RTL Support**: CSS logical properties; test with Arabic locale
- **ASC 606 Terminology**: Maintain consistent terminology across locales

### Keyboard Shortcuts

| Key      | Action                 | Scope           |
| -------- | ---------------------- | --------------- |
| `/`      | Focus search           | Contract list   |
| `n`      | Create new contract    | Contract list   |
| `w`      | Open ASC 606 wizard    | Contract detail |
| `r`      | Recognize revenue      | Contract detail |
| `d`      | View deferred revenue  | Any page        |
| `↑ / ↓`  | Navigate contracts     | Table           |
| `Enter`  | Open selected contract | Table           |
| `Escape` | Close modal/cancel     | Modal/Form      |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateModal()],
  ["w", () => openASC606Wizard()],
  ["r", () => recognizeRevenue()],
  ["d", () => router.push("/revenue/deferred")],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                      | Duration | Rollback Trigger |
| ----------- | ---------------- | ----------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                      | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, Lighthouse ≥90, ASC 606 validated | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, Recognition accuracy 100%          | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained              | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m12_revenue: false,                 // Master toggle
  m12_revenue_asc606_wizard: false,   // ASC 606 wizard
  m12_revenue_modifications: false,   // Contract modifications
  m12_revenue_forecast: false,        // Revenue forecasting
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/revenue`, `/revenue/contracts/[id]`, `/revenue/deferred`)
- P50/P95/P99 latency
- ASC 606 allocation accuracy
- Recognition posting success rate
- Deferred revenue balance accuracy

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Recognition posting failure → immediate alert
- ASC 606 calculation error → alert finance team
- P95 latency > 500ms for 10min → investigate

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m12_revenue = false`

   ```powershell
   pnpm run flags:set m12_revenue=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("revenue");
   revalidateTag("revenue-deferred");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/revenue/*"
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

| Scenario                  | Action             | Approval Required |
| ------------------------- | ------------------ | ----------------- |
| Error rate > 5%           | Immediate rollback | No (auto-trigger) |
| Recognition posting error | Immediate rollback | No (auto-trigger) |
| ASC 606 calculation error | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%           | Partial rollback   | On-call engineer  |
| P95 latency > 1s          | Investigate first  | On-call engineer  |
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

- ASC 606: Revenue from Contracts with Customers (US GAAP)
- IFRS 15: Revenue from Contracts with Customers (IFRS)
- ERPNext: Revenue recognition workflows
- NetSuite: ASC 606 implementation

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: ASC 606 Compliance Accuracy

**Mitigation**: Auditor validation; documented methodology; comprehensive test coverage; regular accounting review

### Risk #2: Variable Consideration Estimation

**Mitigation**: Constraint methodology; documented assumptions; regular review; sensitivity analysis

### Risk #3: Contract Modification Complexity

**Mitigation**: Decision tree logic; accounting review; comprehensive test scenarios; audit trail

### Risk #4: Performance Obligation Identification

**Mitigation**: Clear criteria; review process; documentation; training; examples

---

## 📝 Implementation Guide

### Day 1: Contracts & ASC 606 Wizard (8 hours)

1. Build revenue contracts table (3 hours)
2. Create ASC 606 5-step wizard (4 hours)
3. Implement performance obligation form (1 hour)

### Day 2: Recognition & Deferred Revenue (8 hours)

1. Build revenue recognition workflow (3 hours)
2. Create deferred revenue waterfall (3 hours)
3. Implement recognition schedule view (2 hours)

### Day 3: Modifications & Forecast (4 hours)

1. Build contract modification tracker (2 hours)
2. Create revenue forecast (2 hours)

**Total**: 2.5 days (20 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] ASC 606 allocation algorithm accurate
- [ ] Variable consideration constraint calculation
- [ ] Contract modification type identification
- [ ] Recognition pattern logic (point in time vs over time)
- [ ] Deferred revenue balance calculations
- [ ] useRevenueContracts hook fetches correctly
- [ ] Currency formatting displays correctly
- [ ] Allocation percentages sum to 100%

### Integration Tests

- [ ] Create contract → appears in list
- [ ] Allocate price → POs updated
- [ ] Recognize revenue → deferred balance decreases
- [ ] Modify contract → accounting treatment correct
- [ ] ASC 606 wizard → contract analyzed correctly
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] User can navigate to revenue page
- [ ] User can create contract with multiple POs
- [ ] User can complete ASC 606 wizard
- [ ] User can recognize revenue for period
- [ ] User can modify contract
- [ ] User can view deferred revenue waterfall
- [ ] User can generate revenue forecast
- [ ] Keyboard-only flow: create → wizard → recognize

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] ASC 606 wizard accessible (step navigation)
- [ ] Screen reader announces amounts and obligations
- [ ] Focus management correct (wizard, modals, forms)
- [ ] Color contrast meets WCAG 2.2 AA (AAA where practical)
- [ ] Axe: 0 serious/critical violations
- [ ] Wizard progress indicator accessible

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] All API endpoints return expected status codes
- [ ] ASC 606 results validated against spec

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for contracts, wizard, waterfall
- [ ] Dark/light theme variations
- [ ] Contract status badge variations
- [ ] Loading/error/empty states captured

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/revenue/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] ASC 606 wizard completes in < 10s
- [ ] Deferred revenue waterfall loads in < 2s
- [ ] Revenue forecast (12 months) generates in < 3s

---

## 📅 Timeline

| Day | Deliverable                              |
| --- | ---------------------------------------- |
| 1   | Contracts + ASC 606 Wizard               |
| 2   | Recognition + Deferred Revenue Waterfall |
| 3   | Modifications + Forecast                 |

**Total**: 2.5 days (20 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries
- ✅ M4: Accounts Receivable (customer data)

### Enables These Modules

- M14: Budget Planning (revenue forecasting)
- M15: Cash Flow Forecasting (revenue collection)
- M37: Sales Orders (revenue triggering)

---

## 🎯 Success Criteria

### Must Have

- [ ] Create and manage revenue contracts
- [ ] ASC 606 five-step wizard
- [ ] Performance obligation allocation
- [ ] Revenue recognition (point in time & over time)
- [ ] Deferred revenue waterfall
- [ ] Contract modifications (all 4 types)
- [ ] Search and filtering (customer, status, period)

### Should Have

- [ ] Revenue forecasting (12 months)
- [ ] Variable consideration with constraint
- [ ] Multi-currency contracts
- [ ] Recognition schedule visualization

### Nice to Have

- [ ] AI-powered PO identification
- [ ] Automated SSP determination
- [ ] Contract renewal workflows
- [ ] Revenue analytics dashboard

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/revenue`, `/revenue/contracts/[id]`, `/revenue/deferred`, `/revenue/forecast`)
- [ ] All CRUD operations working (Create, Read, Update, Allocate, Recognize, Modify)
- [ ] ASC 606 five-step wizard complete
- [ ] Revenue recognition working (point in time & over time)
- [ ] Deferred revenue waterfall accurate
- [ ] Contract modifications working (all 4 types)
- [ ] Revenue forecasting functional
- [ ] Search and filtering working (customer, status, period)
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
- [ ] Integration tests: All CRUD + ASC 606 operations covered
- [ ] E2E tests: All user flows covered (create → wizard → recognize → modify)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Contract creation flow
- ASC 606 wizard flow
- Revenue recognition flow
- Contract modification flow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/revenue/*` routes
- [ ] TTFB: ≤70ms on staging (Server-Timing header)
- [ ] TTI: ≤200ms for `/revenue` (Lighthouse CI)
- [ ] ASC 606 wizard: < 10s
- [ ] Deferred waterfall: < 2s
- [ ] Revenue forecast (12 months): < 3s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues
- [ ] Wizard accessibility: Full keyboard navigation

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `Revenue.Contract.Created`
  - `Revenue.PriceAllocated`
  - `Revenue.Recognized`
  - `Revenue.ContractModified`
  - `Revenue.ASC606WizardCompleted`
  - `Revenue.DeferredWaterfallViewed`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, recognition accuracy, ASC 606 compliance)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Revenue amounts masked for non-finance users
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] Audit trail maintained for all recognition and modifications
- [ ] ASC 606 compliance validated

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete (changes, testing, screenshots)
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized (OpenAPI hash verified)
- [ ] i18n keys documented in copy deck
- [ ] User acceptance testing passed (PM/QA sign-off)
- [ ] ASC 606 methodology documented

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m12_revenue = false` (ready to enable)
  - `flags.m12_revenue_asc606_wizard = false` (phase 2)
  - `flags.m12_revenue_modifications = false` (phase 2)
  - `flags.m12_revenue_forecast = false` (phase 2)
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
- [ ] **Finance/Accounting**: ASC 606 compliance validated

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M11 - Inventory  
**Next**: M13 - Tax Management
