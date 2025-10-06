# 🚀 M31: Lease Accounting - UI Implementation Runbook

**Module ID**: M31  
**Module Name**: Lease Accounting  
**Priority**: HIGH  
**Phase**: 9 - Lease Accounting  
**Estimated Effort**: 4 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

M31 provides comprehensive ASC 842 / IFRS 16 lease accounting compliance with automated lease classification, ROU asset calculation, payment scheduling, and financial reporting. This module eliminates spreadsheet chaos and ensures continuous GAAP/IFRS compliance for operating and finance leases.

### Business Value

- **Compliance Confidence**: 100% ASC 842/IFRS 16 compliant calculations eliminate audit issues
- **Time Savings**: Automate lease accounting that typically takes 40+ hours per month
- **Accuracy**: Eliminate Excel errors that cause financial restatements (20% of companies have lease errors)
- **Audit Efficiency**: Reduce lease audit prep from 3 weeks to 3 days with auto-generated documentation
- **Portfolio Visibility**: Real-time view of $millions in lease obligations across 100+ leases

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-asc842-compliance], [ADR-###-lease-classification], [ADR-###-modification-accounting]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 46 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

**Lease Management** (15 endpoints):

- ✅ `/api/leases` - List leases
- ✅ `/api/leases/[id]` - Lease details
- ✅ `/api/leases/create` - Create lease
- ✅ `/api/leases/update` - Update lease
- ✅ `/api/leases/terminate` - Terminate lease
- ✅ `/api/leases/classify` - Classify lease (ASC 842/IFRS 16)
- ✅ `/api/leases/portfolio` - Portfolio overview
- ✅ `/api/leases/upcoming-renewals` - Renewal alerts
- ✅ `/api/leases/expiring` - Expiring leases
- ✅ `/api/leases/by-asset-type` - Leases by asset type
- ✅ `/api/leases/by-location` - Leases by location
- ✅ `/api/leases/obligations` - Total obligations
- ✅ `/api/leases/search` - Search leases
- ✅ `/api/leases/validate` - Validate lease data
- ✅ `/api/leases/archive` - Archive lease

**Calculations & Schedules** (12 endpoints):

- ✅ `/api/leases/calculations` - Calculate ROU & liability
- ✅ `/api/leases/calculations/present-value` - PV calculation
- ✅ `/api/leases/calculations/rou-asset` - ROU asset
- ✅ `/api/leases/calculations/liability` - Lease liability
- ✅ `/api/leases/calculations/interest` - Interest expense
- ✅ `/api/leases/calculations/depreciation` - Depreciation
- ✅ `/api/leases/schedules` - Payment schedules
- ✅ `/api/leases/schedules/amortization` - Amortization schedule
- ✅ `/api/leases/schedules/depreciation` - Depreciation schedule
- ✅ `/api/leases/schedules/obligations` - Obligation schedule
- ✅ `/api/leases/discount-rate` - Suggest discount rate (IBR)
- ✅ `/api/leases/classification-tests` - Run classification tests

**Modifications** (10 endpoints):

- ✅ `/api/leases/modifications` - List modifications
- ✅ `/api/leases/modifications/[id]` - Modification details
- ✅ `/api/leases/modifications/create` - Create modification
- ✅ `/api/leases/modifications/preview` - Preview impact
- ✅ `/api/leases/modifications/remeasure` - Remeasure lease
- ✅ `/api/leases/modifications/process` - Process modification
- ✅ `/api/leases/modifications/journal-entries` - Generate JEs
- ✅ `/api/leases/modifications/history` - Modification history
- ✅ `/api/leases/modifications/approve` - Approve modification
- ✅ `/api/leases/modifications/rollback` - Rollback modification

**Reports & Compliance** (9 endpoints):

- ✅ `/api/leases/reports/disclosures` - Financial disclosures
- ✅ `/api/leases/reports/asc842` - ASC 842 report
- ✅ `/api/leases/reports/ifrs16` - IFRS 16 report
- ✅ `/api/leases/reports/maturity-analysis` - Maturity analysis
- ✅ `/api/leases/reports/rollforward` - Lease rollforward
- ✅ `/api/leases/reports/audit-package` - Audit documentation
- ✅ `/api/leases/journal-entries` - Generate journal entries
- ✅ `/api/leases/audit-trail` - Audit trail
- ✅ `/api/leases/compliance-check` - Compliance validation

**Total Endpoints**: 46 (4 categories)

### Risks & Blockers

| Risk                                       | Impact   | Mitigation                                                             | Owner        |
| ------------------------------------------ | -------- | ---------------------------------------------------------------------- | ------------ |
| ASC 842 calculation accuracy               | CRITICAL | Certified calculations; external audit validation; comprehensive tests | @lease-ops   |
| Discount rate (IBR) determination          | HIGH     | IBR database integration; market rate monitoring; override capability  | @treasury    |
| Lease classification errors                | HIGH     | Automated classification tests; manual review workflow; audit trail    | @accounting  |
| Modification remeasurement complexity      | HIGH     | Tested remeasurement engine; preview before commit; rollback support   | @lease-ops   |
| Integration with existing lease data       | MED      | Data migration tools; validation scripts; parallel run period          | @data-eng    |
| Large portfolio performance (1000+ leases) | MED      | Pagination; incremental calculations; background processing            | @backend-eng |

---

## 🎯 3 Killer Features

### 1. **ASC 842/IFRS 16 Calculator** 🚀

**Description**: Intelligent lease classification engine with automated ROU (Right-of-Use) asset and lease liability calculations. Features what-if scenario analysis, discount rate lookup, and side-by-side ASC 842 vs. IFRS 16 comparison. One-click remeasurement for modifications.

**Why It's Killer**:

- **Auto-Classification**: AI determines operating vs. finance lease in seconds (SAP requires manual review)
- **Dual-Standard**: Calculate both ASC 842 and IFRS 16 simultaneously (Oracle requires separate systems)
- **Discount Rate Intelligence**: Suggests IBR (Incremental Borrowing Rate) based on lease terms
- **Measurable Impact**: Reduces lease classification time from 2 hours to 5 minutes per lease
- **Vs LeaseQuery/CoStar**: More intuitive UI and built into full ERP (standalone tools require integration)

**Implementation**:

```typescript
import { Card, Form, Input, Select, Button, Badge, DataTable } from "aibos-ui";
import { useLeaseCalculator, useClassifyLease } from "@/hooks/useLeases";

export default function LeaseCalculator() {
  const { calculate, results } = useLeaseCalculator();
  const { classify } = useClassifyLease();

  return (
    <div className="space-y-6">
      <Card title="Lease Classification & Calculation">
        <Form onSubmit={calculate}>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold">Lease Details</h3>
              <Input label="Lease Description" name="description" required />
              <Input
                type="date"
                label="Commencement Date"
                name="commencement_date"
                required
              />
              <Input
                type="number"
                label="Lease Term (months)"
                name="lease_term"
                required
              />
              <Input
                type="number"
                label="Monthly Payment"
                name="monthly_payment"
                required
                prefix="$"
              />
              <Input
                type="number"
                label="Discount Rate (%)"
                name="discount_rate"
                required
                suffix="%"
                helpText="IBR - Incremental Borrowing Rate"
              />
              <Input
                type="number"
                label="Initial Direct Costs"
                name="initial_costs"
                prefix="$"
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Classification Factors</h3>
              <Select
                label="Transfer of Ownership?"
                name="transfer_ownership"
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
              />
              <Select
                label="Purchase Option?"
                name="purchase_option"
                options={[
                  { value: "yes", label: "Yes - Reasonably Certain" },
                  { value: "no", label: "No" },
                ]}
              />
              <Input
                type="number"
                label="Asset Fair Value"
                name="asset_fair_value"
                prefix="$"
              />
              <Input
                type="number"
                label="Asset Useful Life (years)"
                name="useful_life"
              />
              <Select
                label="Specialized Asset?"
                name="specialized"
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button type="submit" variant="primary">
              Calculate Lease
            </Button>
            <Button type="button" variant="outline" onClick={classify}>
              Auto-Classify
            </Button>
          </div>
        </Form>
      </Card>

      {results && (
        <>
          <Card title="Classification Results">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">ASC 842 (US GAAP)</h4>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold mb-2">
                    {results.asc842.classification}
                  </div>
                  <Badge
                    variant={
                      results.asc842.classification === "Finance Lease"
                        ? "error"
                        : "success"
                    }
                  >
                    {results.asc842.classification}
                  </Badge>
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Transfer of ownership:</span>
                      <Badge
                        variant={
                          results.asc842.tests.ownership ? "success" : "default"
                        }
                      >
                        {results.asc842.tests.ownership ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Purchase option:</span>
                      <Badge
                        variant={
                          results.asc842.tests.purchase_option
                            ? "success"
                            : "default"
                        }
                      >
                        {results.asc842.tests.purchase_option ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Lease term ≥ 75% useful life:</span>
                      <Badge
                        variant={
                          results.asc842.tests.lease_term
                            ? "success"
                            : "default"
                        }
                      >
                        {results.asc842.tests.lease_term ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>PV ≥ 90% fair value:</span>
                      <Badge
                        variant={
                          results.asc842.tests.present_value
                            ? "success"
                            : "default"
                        }
                      >
                        {results.asc842.tests.present_value ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Specialized asset:</span>
                      <Badge
                        variant={
                          results.asc842.tests.specialized
                            ? "success"
                            : "default"
                        }
                      >
                        {results.asc842.tests.specialized ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">IFRS 16 (International)</h4>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold mb-2">
                    {results.ifrs16.classification}
                  </div>
                  <Badge variant="info">All leases on balance sheet</Badge>
                  <p className="mt-4 text-sm text-gray-600">
                    IFRS 16 requires all leases (except short-term and
                    low-value) to be recognized on the balance sheet as ROU
                    assets and lease liabilities.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Financial Impact">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <h3>ROU Asset</h3>
                <div className="text-3xl font-bold">
                  ${results.rou_asset.toLocaleString()}
                </div>
              </Card>
              <Card>
                <h3>Lease Liability</h3>
                <div className="text-3xl font-bold">
                  ${results.lease_liability.toLocaleString()}
                </div>
              </Card>
              <Card>
                <h3>Total Payments</h3>
                <div className="text-3xl font-bold">
                  ${results.total_payments.toLocaleString()}
                </div>
              </Card>
              <Card>
                <h3>Total Interest</h3>
                <div className="text-3xl font-bold">
                  ${results.total_interest.toLocaleString()}
                </div>
              </Card>
            </div>

            <div className="mt-6">
              <h4 className="font-semibold mb-3">
                Payment Schedule (First 12 Months)
              </h4>
              <DataTable
                data={results.payment_schedule.slice(0, 12)}
                columns={[
                  { key: "period", label: "Period" },
                  { key: "payment", label: "Payment" },
                  { key: "interest", label: "Interest" },
                  { key: "principal", label: "Principal" },
                  { key: "balance", label: "Ending Balance" },
                  { key: "depreciation", label: "ROU Depreciation" },
                ]}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
```

### 2. **Lease Portfolio Dashboard** ⚡

**Description**: Comprehensive view of entire lease portfolio with real-time obligations, upcoming renewals, expiring leases, and financial impact analysis. Features drill-down by location, asset type, and lease classification with interactive charts.

**Why It's Killer**:

- **Portfolio View**: See all leases at-a-glance with $millions in obligations (competitors require custom reports)
- **Renewal Alerts**: Automated notifications 180/90/60 days before expiration
- **Financial Impact**: Live updates to balance sheet as leases change
- **Measurable Impact**: Portfolio managers save 20 hours/month eliminating manual tracking

**Implementation**:

```typescript
import { Card, Chart, Badge, DataTable, Button, Filter } from "aibos-ui";
import { useLeasePortfolio } from "@/hooks/useLeases";

export default function LeasePortfolioDashboard() {
  const { portfolio, stats, upcoming } = useLeasePortfolio();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Total Leases</h3>
          <div className="text-4xl font-bold">{stats.total_leases}</div>
          <div className="text-sm text-gray-600">
            {stats.operating} operating, {stats.finance} finance
          </div>
        </Card>
        <Card>
          <h3>Total Obligations</h3>
          <div className="text-3xl font-bold">
            ${(stats.total_liability / 1_000_000).toFixed(1)}M
          </div>
          <Badge variant="info">Lease Liability</Badge>
        </Card>
        <Card>
          <h3>ROU Assets</h3>
          <div className="text-3xl font-bold">
            ${(stats.total_rou_assets / 1_000_000).toFixed(1)}M
          </div>
          <Badge variant="info">Balance Sheet</Badge>
        </Card>
        <Card>
          <h3>Expiring Soon</h3>
          <div className="text-4xl font-bold text-orange-600">
            {stats.expiring_180_days}
          </div>
          <p className="text-sm text-gray-600">Next 180 days</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card title="Lease Obligations by Year">
          <Chart
            type="bar"
            data={{
              labels: stats.obligations_by_year.years,
              datasets: [
                {
                  label: "Operating Leases",
                  data: stats.obligations_by_year.operating,
                  backgroundColor: "rgb(59, 130, 246)",
                },
                {
                  label: "Finance Leases",
                  data: stats.obligations_by_year.finance,
                  backgroundColor: "rgb(239, 68, 68)",
                },
              ],
            }}
            options={{
              scales: {
                x: { stacked: true },
                y: {
                  stacked: true,
                  title: { display: true, text: "Obligations ($)" },
                },
              },
            }}
          />
        </Card>

        <Card title="Portfolio Composition">
          <Chart
            type="doughnut"
            data={{
              labels: stats.by_asset_type.types,
              datasets: [
                {
                  data: stats.by_asset_type.counts,
                  backgroundColor: [
                    "rgb(59, 130, 246)",
                    "rgb(34, 197, 94)",
                    "rgb(249, 115, 22)",
                    "rgb(168, 85, 247)",
                    "rgb(236, 72, 153)",
                  ],
                },
              ],
            }}
          />
        </Card>
      </div>

      <Card title="Lease Portfolio">
        <DataTable
          data={portfolio}
          columns={[
            { key: "lease_id", label: "Lease ID" },
            { key: "description", label: "Description" },
            {
              key: "classification",
              label: "Type",
              render: (_, row) => (
                <Badge
                  variant={
                    row.classification === "Finance Lease" ? "error" : "info"
                  }
                >
                  {row.classification}
                </Badge>
              ),
            },
            { key: "asset_type", label: "Asset" },
            { key: "location", label: "Location" },
            { key: "commencement_date", label: "Start Date" },
            { key: "expiration_date", label: "Expiration" },
            {
              key: "liability",
              label: "Liability",
              render: (_, row) => `$${row.liability.toLocaleString()}`,
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Upcoming Renewals & Expirations">
        <DataTable
          data={upcoming}
          columns={[
            { key: "lease_id", label: "Lease ID" },
            { key: "description", label: "Description" },
            { key: "expiration_date", label: "Expires" },
            {
              key: "days_until",
              label: "Days Until",
              render: (_, row) => (
                <Badge
                  variant={
                    row.days_until <= 60
                      ? "error"
                      : row.days_until <= 180
                      ? "warning"
                      : "info"
                  }
                >
                  {row.days_until} days
                </Badge>
              ),
            },
            { key: "monthly_payment", label: "Monthly Payment" },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Renew
                  </Button>
                  <Button size="sm" variant="outline">
                    Terminate
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
```

### 3. **Lease Modification Tracker** 💎

**Description**: Comprehensive modification management that handles rent increases, term extensions, space reductions, and lease terminations. Features automated remeasurement calculations, journal entry generation, and modification audit trail.

**Why It's Killer**:

- **Automated Remeasurement**: Recalculates ROU asset/liability in seconds (manual process takes hours)
- **Journal Entry Generation**: Auto-creates complex modification journal entries (eliminates errors)
- **Modification Types**: Handles all ASC 842 modification scenarios (rent changes, extensions, etc.)
- **Measurable Impact**: Reduces modification accounting from 4 hours to 10 minutes

**Implementation**:

```typescript
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Badge,
  DataTable,
  Alert,
} from "aibos-ui";
import {
  useLeaseModifications,
  useProcessModification,
} from "@/hooks/useLeases";

export default function LeaseModificationTracker() {
  const { modifications, pending } = useLeaseModifications();
  const { process, preview } = useProcessModification();

  return (
    <div className="space-y-6">
      <Card title="Create Lease Modification">
        <Form onSubmit={process}>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <Select
                label="Select Lease"
                name="lease_id"
                options={/* lease options */}
                required
              />
              <Select
                label="Modification Type"
                name="modification_type"
                options={[
                  { value: "rent_increase", label: "Rent Increase/Decrease" },
                  { value: "term_extension", label: "Term Extension" },
                  { value: "term_reduction", label: "Term Reduction" },
                  { value: "space_change", label: "Space Addition/Reduction" },
                  { value: "termination", label: "Early Termination" },
                ]}
                required
              />
              <Input
                type="date"
                label="Modification Date"
                name="modification_date"
                required
              />
            </div>

            <div className="space-y-4">
              <Input
                type="number"
                label="New Monthly Payment"
                name="new_payment"
                prefix="$"
              />
              <Input
                type="number"
                label="Additional Months"
                name="additional_months"
              />
              <Textarea
                label="Modification Description"
                name="description"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button type="button" variant="outline" onClick={preview}>
              Preview Impact
            </Button>
            <Button type="submit" variant="primary">
              Process Modification
            </Button>
          </div>
        </Form>
      </Card>

      <Card title="Modification History">
        <DataTable
          data={modifications}
          columns={[
            { key: "modification_date", label: "Date" },
            { key: "lease_id", label: "Lease" },
            {
              key: "type",
              label: "Type",
              render: (_, row) => <Badge>{row.type}</Badge>,
            },
            { key: "description", label: "Description" },
            {
              key: "financial_impact",
              label: "Impact",
              render: (_, row) => `$${row.financial_impact.toLocaleString()}`,
            },
            {
              key: "status",
              label: "Status",
              render: (_, row) => (
                <Badge
                  variant={
                    row.status === "Posted"
                      ? "success"
                      : row.status === "Pending"
                      ? "warning"
                      : "info"
                  }
                >
                  {row.status}
                </Badge>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
```

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Main Page (`/leases/dashboard`)

**Components**: Card, Chart, Badge, DataTable
**File**: `apps/web/app/(dashboard)/leases/page.tsx`

#### 2. Calculator (`/leases/calculator`)

**Components**: Form, Input, Select, Card, Badge
**File**: `apps/web/app/(dashboard)/leases/calculator/page.tsx`

#### 3. Portfolio (`/leases/portfolio`)

**Components**: DataTable, Chart, Filter, Badge
**File**: `apps/web/app/(dashboard)/leases/portfolio/page.tsx`

#### 4. Modifications (`/leases/modifications`)

**Components**: Form, DataTable, Alert, Badge
**File**: `apps/web/app/(dashboard)/leases/modifications/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                       | Target          | Measurement          |
| ---------------------------- | --------------- | -------------------- |
| TTFB (staging)               | ≤ 70ms          | Server timing header |
| Client TTI for `/leases`     | ≤ 200ms         | Lighthouse CI        |
| Calculator computation       | < 2s            | Performance profiler |
| Portfolio load (1000 leases) | < 3s            | Performance profiler |
| Modification remeasurement   | < 3s            | API response time    |
| Payment schedule generation  | < 1s            | Background job       |
| Report generation            | < 5s            | Background job       |
| UI bundle size               | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to calculator and forms
- **Focus Management**: Focus trap in modals; form field navigation
- **ARIA**: Calculation results announced; validation errors communicated
- **Screen Reader**: All lease data announced; payment schedules described
- **Axe Target**: 0 serious/critical violations

### Security

| Layer         | Requirement                                                    |
| ------------- | -------------------------------------------------------------- |
| RBAC Scopes   | `leases.read`, `leases.write`, `leases.modify`, `leases.admin` |
| Enforcement   | Server-side on all endpoints                                   |
| Data Exposure | Only show lease data user has permission to view               |
| Audit Trail   | Immutable audit logs for all lease transactions (7-year)       |
| Calculations  | Validate all ASC 842/IFRS 16 calculations server-side          |
| Rate Limiting | Protect calculation endpoints; prevent abuse                   |

#### UI Permissions Matrix

| Role          | View | Create | Modify | Classify | Generate Reports | Admin |
| ------------- | ---- | ------ | ------ | -------- | ---------------- | ----- |
| leases.read   | ✅   | ❌     | ❌     | ❌       | ❌               | ❌    |
| leases.write  | ✅   | ✅     | ❌     | ✅       | ✅               | ❌    |
| leases.modify | ✅   | ✅     | ✅     | ✅       | ✅               | ❌    |
| leases.admin  | ✅   | ✅     | ✅     | ✅       | ✅               | ✅    |

### Reliability & Observability

- **SLO**: 99.9% calculation accuracy; 99.9% portfolio dashboard availability
- **SLA Dashboards**: Real-time metrics on calculation performance, compliance
- **Events Emitted**: `Leases.Created`, `Leases.Modified`, `Leases.Classified`, `Leases.Terminated`
- **Logging**: Structured logs with lease IDs for all operations
- **Tracing**: Distributed tracing for calculation workflows
- **Monitoring**: Calculation accuracy; classification correctness; audit trail integrity

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Lease Accounting Rules (ASC 842 / IFRS 16)

| Rule                        | Enforcement                                                     |
| --------------------------- | --------------------------------------------------------------- |
| **Classification Tests**    | Run all 5 ASC 842 tests; document results; maintain audit trail |
| **Discount Rate (IBR)**     | Use market-based IBR; document source; allow manual override    |
| **ROU Asset Calculation**   | Present value + initial direct costs + prepayments - incentives |
| **Lease Liability**         | Present value of remaining payments using effective rate        |
| **Depreciation Method**     | Straight-line over shorter of lease term or useful life         |
| **Interest Expense**        | Effective interest method using constant periodic rate          |
| **Modification Accounting** | Remeasure if substantive; treat as new lease if increases scope |
| **Short-Term Exception**    | Leases ≤12 months can use operating lease treatment             |

### ASC 842 Classification Tests

1. **Transfer of Ownership**: Does lease transfer ownership by end of term?
2. **Purchase Option**: Does lessee have reasonably certain purchase option?
3. **Lease Term**: Is lease term ≥75% of asset's remaining useful life?
4. **Present Value**: Is PV of payments ≥90% of asset's fair value?
5. **Specialized Asset**: Is asset so specialized it has no alternative use?

**If ANY test = Yes → Finance Lease; else → Operating Lease**

### Lease States

- **Lease**: Draft → Classified → Active → Modified → Terminated → Archived
- **Modification**: Draft → Preview → Approved → Processed → Posted
- **Classification**: Unclassified → Operating Lease / Finance Lease
- **Payment Status**: Current → Past Due → In Default

### Archive Semantics

- **Lease History**: Retain all lease data indefinitely (7-year compliance minimum)
- **Modification History**: Maintain complete modification audit trail
- **Calculations**: Preserve all calculations and classification results
- **Guard Rails**:
  - ❌ Deny deletion of active leases
  - ❌ Deny modification of historical calculations
  - ❌ Deny changes to posted journal entries
  - ✅ Allow termination with proper accounting treatment

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                       | User Action       |
| --------------------- | -------------------------------- | ----------------- |
| **Empty**             | "No leases in portfolio"         | "Add Lease"       |
| **Loading**           | Skeleton forms/tables            | N/A               |
| **Error**             | Error message + retry            | Retry / Support   |
| **Draft**             | Gray badge "Draft"               | Complete / Save   |
| **Classified**        | Badge showing classification     | View / Edit       |
| **Active**            | Green badge "Active"             | View / Modify     |
| **Expiring Soon**     | Orange badge "Expires in N days" | Renew / Terminate |
| **Terminated**        | Red badge "Terminated"           | View history      |
| **Modified**          | Blue badge "Modified"            | View changes      |
| **Calculation Error** | Red alert "Calculation failed"   | Review / Retry    |
| **Permission Denied** | "Access restricted"              | Back              |

### Form Validation

- **Lease Terms**: Validate lease term > 0, commencement date valid
- **Financial Data**: Validate payments > 0, discount rate 0-100%
- **Classification**: Validate all required fields for classification tests
- **Modifications**: Validate modification date ≥ commencement date

### Network Errors

| HTTP Status | UI Message                                        | Action              |
| ----------- | ------------------------------------------------- | ------------------- |
| 400         | "Invalid lease data. Check your inputs."          | Inline field errors |
| 401         | "Session expired. Please log in again."           | Redirect to login   |
| 403         | "You don't have permission for lease operations." | Hide action         |
| 404         | "Lease not found."                                | Return to list      |
| 409         | "Lease was modified. Review changes."             | Show diff modal     |
| 422         | "Validation failed. Check classification tests."  | Inline errors       |
| 500         | "Calculation failed. Our team has been notified." | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/leases.json`.

### Page Titles & Headers

| Context       | Copy                   | i18n Key                     |
| ------------- | ---------------------- | ---------------------------- |
| Dashboard     | "Lease Portfolio"      | `leases.dashboard.title`     |
| Calculator    | "Lease Calculator"     | `leases.calculator.title`    |
| Portfolio     | "Portfolio Management" | `leases.portfolio.title`     |
| Modifications | "Lease Modifications"  | `leases.modifications.title` |
| Reports       | "Compliance Reports"   | `leases.reports.title`       |

### State Messages

| State             | Title                | Message                               | Action Button | i18n Key              |
| ----------------- | -------------------- | ------------------------------------- | ------------- | --------------------- |
| Empty             | "No leases yet"      | "Add your first lease to get started" | "Add Lease"   | `leases.empty.*`      |
| Classified        | "Lease classified"   | "Classification: {type}"              | "View"        | `leases.classified.*` |
| Expiring Soon     | "Lease expiring"     | "Expires in {days} days"              | "Renew"       | `leases.expiring.*`   |
| Modified          | "Lease modified"     | "Modification processed successfully" | "View"        | `leases.modified.*`   |
| Calculation Error | "Calculation failed" | "Check inputs and try again"          | "Retry"       | `leases.calcError.*`  |

### Success Messages (Toast)

| Action           | Message                               | i18n Key                  | Shortcut |
| ---------------- | ------------------------------------- | ------------------------- | -------- |
| Lease Created    | "Lease '{desc}' created successfully" | `leases.create.success`   | `n`      |
| Lease Classified | "Lease classified as {type}"          | `leases.classify.success` | `c`      |
| Modification     | "Modification processed successfully" | `leases.modify.success`   | `m`      |
| Report Generated | "Report generated successfully"       | `leases.report.success`   | `r`      |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useLeases.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useLeasePortfolio(filters = {}) {
  return useQuery({
    queryKey: ["leases", "portfolio", filters],
    queryFn: () => apiClient.GET("/api/leases", { query: filters }),
    staleTime: 5 * 60_000, // 5min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useLease(id: string) {
  return useQuery({
    queryKey: ["leases", "detail", id],
    queryFn: () => apiClient.GET("/api/leases/[id]", { params: { id } }),
    staleTime: 10 * 60_000, // 10min
    retry: 2,
    enabled: !!id,
    select: (response) => response.data,
  });
}

export function useLeaseCalculator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leaseData: any) =>
      apiClient.POST("/api/leases/calculations", { body: leaseData }),
    onSuccess: (data) => {
      toast.success("Lease calculated successfully");
      queryClient.invalidateQueries({ queryKey: ["leases"] });
    },
    onError: () => {
      toast.error("Failed to calculate lease.");
    },
  });
}

export function useClassifyLease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lease_id: string) =>
      apiClient.POST("/api/leases/classify", { body: { lease_id } }),
    onSuccess: (data) => {
      toast.success(`Lease classified as ${data.classification}`);
      queryClient.invalidateQueries({ queryKey: ["leases"] });
    },
    onError: () => {
      toast.error("Failed to classify lease.");
    },
  });
}

export function useCreateLease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (leaseData: any) =>
      apiClient.POST("/api/leases/create", { body: leaseData }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      toast.success(`Lease '${data.description}' created successfully`);
    },
    onError: () => {
      toast.error("Failed to create lease.");
    },
  });
}

export function useLeaseModifications(lease_id?: string) {
  return useQuery({
    queryKey: ["leases", "modifications", lease_id],
    queryFn: () =>
      apiClient.GET("/api/leases/modifications", {
        query: lease_id ? { lease_id } : {},
      }),
    staleTime: 5 * 60_000, // 5min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useProcessModification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (modificationData: any) =>
      apiClient.POST("/api/leases/modifications/process", {
        body: modificationData,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      toast.success("Modification processed successfully");
    },
    onError: () => {
      toast.error("Failed to process modification.");
    },
  });
}

export function useLeaseReports(reportType: string) {
  return useQuery({
    queryKey: ["leases", "reports", reportType],
    queryFn: () => apiClient.GET(`/api/leases/reports/${reportType}`),
    staleTime: 30 * 60_000, // 30min
    retry: 2,
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error         | User Message                                      | UI Action            |
| ----------------- | ------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid lease data. Check your inputs."          | Inline field errors  |
| 409 (Conflict)    | "Lease was modified. Review changes."             | Show diff modal      |
| 422 (Validation)  | "Validation failed. Check classification tests."  | Inline errors        |
| 403 (Forbidden)   | "You don't have permission for lease operations." | Hide action          |
| 500 (Server)      | "Calculation failed. Our team has been notified." | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for calculations

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["leases", "portfolio", { filters }][("leases", "detail", leaseId)][
  ("leases", "modifications", leaseId)
][("leases", "calculations", leaseId)][("leases", "reports", reportType)];
```

### Invalidation Rules

| Action               | Invalidates                                 |
| -------------------- | ------------------------------------------- |
| Create Lease         | `["leases"]` (all)                          |
| Modify Lease         | `["leases"]`, `["leases", "detail", id]`    |
| Process Modification | `["leases"]`, `["leases", "modifications"]` |
| Classify Lease       | `["leases", "detail", id]`                  |
| Terminate Lease      | `["leases"]`                                |

### Stale Time

| Query Type    | Stale Time | Reasoning                       |
| ------------- | ---------- | ------------------------------- |
| Portfolio     | 5min       | Moderate update frequency       |
| Lease Details | 10min      | Less frequently changed         |
| Modifications | 5min       | Active modification tracking    |
| Calculations  | Never      | Always fresh for accuracy       |
| Reports       | 30min      | Generated reports change slowly |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("leases-portfolio");
revalidateTag("leases-modifications");
revalidateTag("leases-reports");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/leases.fixtures.ts`

**Datasets**:

- `minimalLeases`: 5 leases (operating & finance mix)
- `standardLeases`: 50 leases across all asset types
- `complexLeases`: 200+ leases with modifications, varied terms
- `edgeCases`: Edge cases (short-term, high-value, specialized assets)

**Edge Cases Covered**:

- Short-term leases (≤12 months)
- Leases with purchase options
- Specialized assets (unique equipment)
- Leases with variable payments
- Leases with multiple modifications
- Leases crossing classification borderline (90% fair value)

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
- **Interactive Parts**: Mark with `"use client"` (calculator, forms, modifications)

### Data Fetching Strategy

| Scenario       | Strategy                          | Benefit           |
| -------------- | --------------------------------- | ----------------- |
| Portfolio List | Server-side fetch + stream        | Faster TTFB       |
| Calculator     | Client-side with optimistic UI    | Instant feedback  |
| Reports        | Server component with static data | SEO + performance |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function createLease(leaseData: any) {
  // ... mutation logic
  revalidateTag("leases-portfolio");
}
```

---

## 📊 Analytics & Audit Events

| Event                  | When                     | Properties                                            |
| ---------------------- | ------------------------ | ----------------------------------------------------- |
| Leases.Created         | Lease created            | `lease_id`, `classification`, `asset_type`, `term`    |
| Leases.Classified      | Classification completed | `lease_id`, `classification`, `asc842_tests`          |
| Leases.Modified        | Modification processed   | `lease_id`, `modification_type`, `financial_impact`   |
| Leases.Terminated      | Lease terminated         | `lease_id`, `termination_date`, `remaining_liability` |
| Leases.CalculationRun  | Calculation executed     | `lease_id`, `calculation_type`, `duration_ms`         |
| Leases.ReportGenerated | Report generated         | `report_type`, `lease_count`, `format`                |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Leases.Classified", {
  lease_id: "lease_123",
  classification: "Finance Lease",
  asc842_tests: { ownership: false, purchase_option: true, ... },
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/leases.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Currency**: Support multiple currencies for multinational leases

### Keyboard Shortcuts

| Key      | Action              | Scope          |
| -------- | ------------------- | -------------- |
| `/`      | Focus search        | Any page       |
| `n`      | New lease           | Portfolio list |
| `c`      | Calculate/Classify  | Calculator     |
| `m`      | Create modification | Lease detail   |
| `r`      | Generate report     | Reports page   |
| `↑ / ↓`  | Navigate list       | Any list       |
| `Enter`  | Open item           | Any list       |
| `Escape` | Close modal/cancel  | Modal/Form     |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateLeaseModal()],
  ["c", () => classifyLease()],
  ["m", () => openModificationModal()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                         | Duration | Rollback Trigger |
| ----------- | ---------------- | -------------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                         | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, calculation accuracy 100%            | 3 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, calc accuracy 100%, zero audit issues | 5 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 1 week, audit validation complete            | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m31_leases: false,                       // Master toggle
  m31_leases_calculator: false,            // Calculator
  m31_leases_modifications: false,         // Modifications
  m31_leases_reports: false,               // Reports
  m31_leases_ifrs16: false,                // IFRS 16 support
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Calculation accuracy (100% required)
- Classification correctness (external audit validation)
- Portfolio dashboard load time
- Modification processing success rate
- Audit trail integrity

**Alert Thresholds**:

- Calculation error → immediate investigation
- Classification mismatch vs. audit → critical alert
- Dashboard load > 5s → performance issue
- Modification rollback → escalate

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m31_leases = false`

   ```powershell
   pnpm run flags:set m31_leases=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("leases-portfolio");
   revalidateTag("leases-modifications");
   revalidateTag("leases-reports");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/leases/*"
   ```

4. **Monitor for 30 minutes**:

   - Error rate drops below 0.1%
   - No new Sentry issues
   - Users see fallback message
   - Verify no financial impact

5. **Post-mortem**:
   - Create incident report
   - Identify root cause
   - External audit validation if calculations affected
   - Add regression test

**Rollback Decision Matrix**:

| Scenario                    | Action             | Approval Required      |
| --------------------------- | ------------------ | ---------------------- |
| Calculation error           | Immediate rollback | No (auto-trigger)      |
| Classification mismatch     | Immediate rollback | No (auto-trigger)      |
| Audit trail corruption      | Immediate rollback | No (auto-trigger)      |
| Dashboard performance > 10s | Immediate rollback | No (auto-trigger)      |
| External audit findings     | Immediate rollback | CFO + External Auditor |
| User complaints > 3         | Investigate first  | Lease ops lead         |

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

- LeaseQuery: Lease accounting software
- CoStar: Real estate lease management
- Nakisa: Lease administration
- Deloitte ASC 842 guidance
- PwC IFRS 16 implementation guide
- FASB ASC 842 standard

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: ASC 842 Calculation Accuracy

**Mitigation**: Certified calculations by external auditor; comprehensive test suite covering all scenarios; parallel manual validation during pilot; independent verification

### Risk #2: Discount Rate (IBR) Determination

**Mitigation**: Integrate with market data providers; maintain IBR database; allow manual override with documentation; periodic review by treasury team

### Risk #3: Lease Classification Errors

**Mitigation**: Automated classification tests with audit trail; manual review workflow for borderline cases; external audit validation; comprehensive training

### Risk #4: Modification Remeasurement Complexity

**Mitigation**: Tested remeasurement engine with all ASC 842 scenarios; preview before commit; rollback support; external audit review of complex modifications

### Risk #5: Integration with Existing Lease Data

**Mitigation**: Comprehensive data migration tools; validation scripts; parallel run period (3 months); external audit sign-off on migrated data

---

## 📝 Implementation Guide

### Day 1: Calculator & Classification (8 hours)

1. Build lease calculator form with all inputs (3 hours)
2. Implement ASC 842 classification logic (2 hours)
3. Create payment schedule display (2 hours)
4. Add IFRS 16 comparison view (1 hour)

### Day 2: Portfolio Dashboard (8 hours)

1. Build portfolio overview with stats cards (2 hours)
2. Implement lease portfolio table with filtering (3 hours)
3. Create obligation charts and analytics (2 hours)
4. Add renewal alerts (1 hour)

### Day 3: Modifications & Reports (8 hours)

1. Build modification tracker form (3 hours)
2. Implement remeasurement calculations (3 hours)
3. Create modification history view (2 hours)

### Day 4: Financial Reporting (8 hours)

1. Build disclosure reports (3 hours)
2. Create journal entry generation (3 hours)
3. Implement audit trail (2 hours)

**Total**: 4 days (32 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] ASC 842 classification logic (all 5 tests)
- [ ] IFRS 16 classification logic
- [ ] Present value calculations (different discount rates)
- [ ] Payment schedule generation (all scenarios)
- [ ] Modification remeasurement logic (all types)
- [ ] ROU asset calculation (with initial costs, prepayments, incentives)
- [ ] Lease liability calculation (effective interest method)
- [ ] Depreciation calculation (straight-line)
- [ ] Interest expense calculation

### Integration Tests

- [ ] Complete lease lifecycle (draft → classified → active → modified → terminated)
- [ ] Modification processing with remeasurement
- [ ] Journal entry generation for all lease events
- [ ] Portfolio dashboard aggregations
- [ ] Renewal alert calculations
- [ ] Compliance report generation

### E2E Tests

- [ ] User can create and classify lease
- [ ] User can view portfolio dashboard
- [ ] User can calculate ROU asset & liability
- [ ] User can process lease modification
- [ ] User can terminate lease
- [ ] User can generate ASC 842 reports
- [ ] User can generate IFRS 16 reports

### Accessibility Tests

- [ ] Keyboard navigation works (calculator, forms)
- [ ] Screen reader announces calculation results
- [ ] Focus management correct (modals, forms)
- [ ] Color contrast meets WCAG 2.2 AAA
- [ ] Axe: 0 serious/critical violations

### Contract Tests

- [ ] API calls match OpenAPI spec
- [ ] Calculation results match audit validation

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for all components

### Performance Tests

- [ ] Bundle size < 250KB gzipped
- [ ] TTFB ≤ 70ms on staging
- [ ] Calculator computation < 2s
- [ ] Portfolio load (1000 leases) < 3s

---

## 📅 Timeline & Milestones

| Day | Tasks                                           | Deliverable                   | Flag Status |
| --- | ----------------------------------------------- | ----------------------------- | ----------- |
| 1   | Setup + Hooks + Calculator + ASC 842 logic      | Lease calculator functional   | WIP         |
| 2   | Portfolio dashboard + analytics + charts        | Portfolio view complete       | WIP         |
| 3   | Modification tracker + remeasurement            | Modification processing works | WIP         |
| 4   | Reports + journal entries + audit trail + tests | Production-ready module       | GA          |

**Total Effort**: 4 days (32 hours)

---

## 🔗 Dependencies

### Must Complete Before Starting

- ✅ M1: Core Ledger (for accounts)
- ✅ M2: Journal Entries (for JE generation)
- ✅ M8: Fixed Assets (for asset-related leases)
- 🆕 ASC 842 / IFRS 16 calculation engine
- 🆕 IBR (Incremental Borrowing Rate) database
- 🆕 External audit validation process

### Blocks These Modules

- M32: Sublease Management
- M33: Sale-Leaseback

---

## 🎯 Success Criteria

### Must Have (Measurable)

- [ ] 100% ASC 842/IFRS 16 compliant lease calculator
- [ ] Portfolio dashboard with obligation tracking (1000+ leases)
- [ ] Modification tracker with automated remeasurement (< 3s)
- [ ] Calculation accuracy: 100% (verified by external auditor)
- [ ] Classification accuracy: 100% (external audit validation)
- [ ] Audit trail: Immutable 7-year retention
- [ ] Axe: 0 serious/critical violations

### Should Have

- [ ] Automated renewal alerts (180/90/60 days)
- [ ] Journal entry generation (all lease events)
- [ ] Financial disclosure reports (ASC 842 & IFRS 16)
- [ ] IBR suggestion engine (market-based)
- [ ] Discount rate lookup integration
- [ ] Export to Excel/PDF

### Nice to Have

- [ ] AI-powered lease document extraction
- [ ] What-if scenario analysis (multiple discount rates)
- [ ] Integration with property management systems
- [ ] Visual timeline of lease obligations
- [ ] Benchmark comparisons (industry peers)

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/leases/*`)
- [ ] All CRUD operations working (Create, Read, Update, Terminate)
- [ ] ASC 842/IFRS 16 calculator with 100% accuracy
- [ ] Lease classification with all 5 tests
- [ ] Portfolio dashboard with real-time aggregations
- [ ] Modification tracker with remeasurement
- [ ] Renewal alerts (180/90/60 days)
- [ ] Compliance reports generation
- [ ] Journal entry generation
- [ ] Audit trail (7-year retention)
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

- [ ] Unit tests: ≥90% line coverage, ≥95% for calculation logic
- [ ] Integration tests: All lease lifecycle events covered
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- [ ] Lease classification flow (ASC 842 & IFRS 16)
- [ ] ROU asset & liability calculation
- [ ] Modification remeasurement flow
- [ ] Journal entry generation

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/leases/*` routes
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/leases`
- [ ] Calculator computation: < 2s
- [ ] Portfolio load (1000 leases): < 3s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly
- [ ] Focus management: Logical order, visible indicators
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Calculation Accuracy ✅

**CRITICAL - External Audit Validation Required**

- [ ] ASC 842 classification: 100% accuracy (external audit verified)
- [ ] IFRS 16 classification: 100% accuracy (external audit verified)
- [ ] Present value calculations: 100% accuracy (±$0.01)
- [ ] ROU asset calculations: 100% accuracy
- [ ] Lease liability calculations: 100% accuracy
- [ ] Interest expense calculations: 100% accuracy (effective interest method)
- [ ] Depreciation calculations: 100% accuracy (straight-line)
- [ ] Modification remeasurement: 100% accuracy (all scenarios)
- [ ] Payment schedule generation: 100% accuracy

**Validation**: Independent external auditor sign-off required before production deployment

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `Leases.Created`
  - `Leases.Classified`
  - `Leases.Modified`
  - `Leases.Terminated`
  - `Leases.CalculationRun`
  - `Leases.ReportGenerated`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (calculation errors, classification mismatches)
- [ ] Audit trail monitoring (integrity, retention)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Audit trail immutable (7-year retention)
- [ ] Rate limiting tested (calculation endpoints)
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] External audit validation completed
- [ ] ASC 842/IFRS 16 compliance verified

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized
- [ ] i18n keys documented
- [ ] External auditor documentation package complete
- [ ] UAT passed (PM/QA sign-off)

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m31_leases = false` (ready to enable)
  - `flags.m31_leases_calculator = false`
  - `flags.m31_leases_modifications = false`
  - `flags.m31_leases_reports = false`
  - `flags.m31_leases_ifrs16 = false`
- [ ] Smoke tests passed on staging
- [ ] Load tests passed (≥1000 concurrent users, 1000+ leases)
- [ ] Deployed to production (flags off)
- [ ] Rollback procedure tested
- [ ] Gradual rollout plan ready (5% → 100%)
- [ ] External auditor validation in production environment

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All test plans executed and passed
- [ ] **Design**: UI matches specs, brand compliance
- [ ] **PM**: Feature complete, acceptance criteria met
- [ ] **Security**: Security review passed
- [ ] **Accessibility**: A11y audit passed
- [ ] **Finance/Accounting**: Calculation accuracy verified
- [ ] **External Auditor**: ASC 842/IFRS 16 compliance certified

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M30 - Close Insights  
**Next**: M32 - Sublease Management
