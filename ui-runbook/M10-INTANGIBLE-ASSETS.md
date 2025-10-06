# 🚀 M10: Intangible Assets - UI Implementation Runbook

**Module ID**: M10  
**Module Name**: Intangible Assets  
**Priority**: LOW  
**Phase**: 3 - Asset Management  
**Estimated Effort**: 1 day  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Intangible Assets manages **software licenses, patents, trademarks, goodwill, and other non-physical assets** with amortization tracking and impairment testing.

### Business Value

- Comprehensive tracking of intellectual property and digital assets
- Automated amortization calculations and schedules
- Impairment testing with ASC 350 compliance
- Integration with M&A and goodwill allocation
- Audit-ready documentation for intangible valuations

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-intangible-amortization], [ADR-###-impairment-testing], [ADR-###-ip-valuation]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 4 endpoints implemented       |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/intangible-assets` - Asset list with filters
- ✅ `/api/intangible-assets/[id]` - Asset details
- ✅ `/api/intangible-assets/[id]/impairment-test` - Perform impairment test
- ✅ `/api/intangible-assets/[id]/amortize` - Calculate amortization

**Total Endpoints**: 4

### Risks & Blockers

| Risk                                 | Impact | Mitigation                                                    | Owner    |
| ------------------------------------ | ------ | ------------------------------------------------------------- | -------- |
| Impairment test accuracy             | HIGH   | ASC 350 compliance review; audit validation; test coverage    | @finance |
| Software license tracking complexity | MED    | Integration with vendor APIs; manual entry fallback           | @backend |
| IP valuation subjectivity            | HIGH   | Third-party appraisal; documented methodologies; review cycle | @legal   |
| Amortization method changes          | MED    | Approval workflow; recalculation validation; audit trail      | @finance |

---

## 🎯 3 Killer Features

### 1. **Software License Management Dashboard** 💻

**Description**: Centralized tracking of all software licenses with expiration alerts and renewal management.

**Why It's Killer**:

- Auto-detect license expiration and send renewal reminders
- Track license utilization vs purchased seats
- Integration with vendor contracts
- Cost optimization recommendations
- Better than manual spreadsheet tracking

**Implementation**:

```typescript
import { DataTable, Badge, Card } from "aibos-ui";

export default function LicenseManagement() {
  const { licenses } = useSoftwareLicenses();

  return (
    <DataTable
      data={licenses}
      columns={[
        { key: "vendor", label: "Vendor" },
        { key: "product", label: "Product" },
        { key: "seats_purchased", label: "Seats" },
        { key: "seats_used", label: "Used" },
        {
          key: "expiration",
          label: "Expires",
          render: (date) => (
            <Badge variant={isExpiringSoon(date) ? "warning" : "default"}>
              {date}
            </Badge>
          ),
        },
        { key: "cost", label: "Annual Cost", render: formatCurrency },
      ]}
    />
  );
}
```

### 2. **Automated Impairment Testing** 📉

**Description**: Automated impairment testing workflow with fair value calculations and reporting unit allocation.

**Why It's Killer**:

- Step-by-step impairment testing workflow (ASC 350)
- Fair value calculator with multiple valuation methods
- Reporting unit allocation with goodwill tracking
- Audit-ready impairment test documentation
- Industry-first automated impairment testing

**Implementation**:

```typescript
import { Form, Card, Button } from "aibos-ui";

export default function ImpairmentTest({ assetId }) {
  const { performTest } = useImpairmentTest(assetId);

  return (
    <Form onSubmit={performTest}>
      <Card>
        <h3>Step 1: Identify Reporting Unit</h3>
        <Select name="reporting_unit" options={reportingUnits} />
      </Card>

      <Card>
        <h3>Step 2: Determine Fair Value</h3>
        <Input name="fair_value_method" label="Valuation Method" />
        <Input name="fair_value" label="Fair Value" type="number" />
      </Card>

      <Card>
        <h3>Step 3: Compare to Carrying Amount</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Carrying Amount:</strong>{" "}
            {formatCurrency(asset.carrying_value)}
          </div>
          <div>
            <strong>Fair Value:</strong> {formatCurrency(fairValue)}
          </div>
        </div>
        <Badge
          variant={fairValue < asset.carrying_value ? "destructive" : "success"}
        >
          {fairValue < asset.carrying_value
            ? "Impairment Required"
            : "No Impairment"}
        </Badge>
      </Card>

      <Button type="submit">Record Impairment Test</Button>
    </Form>
  );
}
```

### 3. **Patent & IP Portfolio Tracker** 📜

**Description**: Visual tracking of patents, trademarks, and intellectual property with valuation and legal status monitoring.

**Why It's Killer**:

- Track patent applications through approval process
- Monitor trademark renewals and legal deadlines
- Valuation tracking for IP portfolio
- Integration with legal department workflows
- Better than Anaqua's patent management system

**Implementation**:

```typescript
import { Timeline, Card, Badge } from "aibos-ui";

export default function IPPortfolio() {
  const { portfolio } = useIPAssets();

  return (
    <div className="space-y-6">
      {portfolio.map((ip) => (
        <Card key={ip.id}>
          <div className="flex justify-between">
            <div>
              <h3>{ip.name}</h3>
              <Badge>{ip.type}</Badge>
              <Badge variant={ip.status === "Active" ? "success" : "warning"}>
                {ip.status}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-2xl">{formatCurrency(ip.value)}</div>
              <div className="text-sm text-muted">Current Valuation</div>
            </div>
          </div>

          <Timeline
            items={ip.milestones.map((m) => ({
              date: m.date,
              title: m.event,
              description: m.notes,
            }))}
          />
        </Card>
      ))}
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
**File**: `apps/web/app/(dashboard)/intangible-assets/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                                | Target          | Measurement          |
| ------------------------------------- | --------------- | -------------------- |
| TTFB (staging)                        | ≤ 70ms          | Server timing header |
| Client TTI for `/intangible-assets`   | ≤ 200ms         | Lighthouse CI        |
| Impairment test calculation           | < 3s            | Progress tracking    |
| License dashboard load (500 licenses) | < 1s            | APM traces           |
| UI bundle size                        | ≤ 250KB gzipped | Webpack analyzer     |
| Amortization schedule generation      | < 2s            | Performance profiler |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to all asset operations
- **Focus Management**: Focus trap in modals; visible indicators
- **ARIA**: Live regions for impairment test results; proper roles
- **Screen Reader**: All financial metrics announced; test results communicated
- **Axe Target**: 0 serious/critical violations
- **Complex Forms**: Multi-step impairment testing with clear progress indicators

### Security

| Layer         | Requirement                                                                    |
| ------------- | ------------------------------------------------------------------------------ |
| RBAC Scopes   | `intangible.read`, `intangible.write`, `intangible.impair`, `intangible.admin` |
| Enforcement   | Server-side on all endpoints                                                   |
| Data Exposure | Only show assets user has permission to view                                   |
| IP Protection | Sensitive IP details masked for non-authorized users                           |
| Audit Trail   | All valuations and impairment tests logged                                     |

#### UI Permissions Matrix

| Role              | View | Create | Edit | Amortize | Impairment Test | Valuation Update | Admin |
| ----------------- | ---- | ------ | ---- | -------- | --------------- | ---------------- | ----- |
| intangible.read   | ✅   | ❌     | ❌   | ❌       | ❌              | ❌               | ❌    |
| intangible.write  | ✅   | ✅     | ✅   | ✅       | ❌              | ❌               | ❌    |
| intangible.impair | ✅   | ✅     | ✅   | ✅       | ✅              | ✅               | ❌    |
| intangible.admin  | ✅   | ✅     | ✅   | ✅       | ✅              | ✅               | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful amortization calculations
- **SLA Dashboards**: Real-time metrics on asset counts, impairment tests, license expiration alerts
- **Events Emitted**: `IntangibleAsset.Created`, `IntangibleAsset.Amortized`, `IntangibleAsset.ImpairmentTested`
- **Logging**: Structured logs with correlation IDs for all mutations
- **Tracing**: Distributed tracing for impairment calculations
- **Monitoring**: License expiration tracking, impairment test accuracy

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Intangible Asset Rules

| Rule                    | Enforcement                                              |
| ----------------------- | -------------------------------------------------------- |
| **Acquisition Cost**    | Must be > 0; cannot be changed after initial recognition |
| **Useful Life**         | Definite (finite) or Indefinite; affects amortization    |
| **Amortization Method** | Straight-line default; requires approval to change       |
| **Impairment Test**     | Required annually for indefinite-life assets             |
| **Carrying Value**      | Cost - Accumulated Amortization - Impairment Losses      |
| **Goodwill**            | Never amortized; impairment test only                    |
| **Software Licenses**   | Track expiration; auto-alert 90 days before              |
| **IP Valuation**        | Requires third-party appraisal every 3 years             |

### Currency & Rounding

- **Display**: Presentation currency from tenant settings
- **Rounding Policy**: HALF_UP for amortization amounts
- **Multi-Currency**: Assets acquired in foreign currency; track FX at acquisition date
- **Impairment Calculations**: Use spot rate at impairment test date

### Archive Semantics

- **Soft Delete**: Set `disposed_date`; maintain historical records
- **Guard Rails**:
  - ❌ Deny if asset has non-zero carrying value (must impair/dispose first)
  - ❌ Deny if active software licenses attached
  - ❌ Deny if involved in open M&A transactions
  - ✅ Allow if fully amortized/impaired and inactive

---

## 🚨 Error Handling & UX States

### All Possible States

| State                   | UI Display                                 | User Action       |
| ----------------------- | ------------------------------------------ | ----------------- |
| **Empty**               | "No intangible assets recorded"            | "Add Asset"       |
| **Loading**             | Skeleton asset cards                       | N/A               |
| **Error**               | Error message + retry                      | Retry / Support   |
| **Calculating**         | Progress bar "Calculating amortization..." | Wait              |
| **Impairment Required** | Red badge "Impairment Detected"            | Perform test      |
| **License Expiring**    | Orange warning "{days} days to expiry"     | Renew license     |
| **Fully Amortized**     | Green badge "Fully Amortized"              | Consider disposal |
| **Goodwill**            | Purple badge "Goodwill - No Amortization"  | Schedule test     |
| **Permission Denied**   | "Access restricted"                        | Back              |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Submit State**: Button disabled until dirty & valid
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal
- **Real-time Validation**: Check cost > 0, useful life valid as user types

### Network Errors

| HTTP Status | UI Message                                              | Action              |
| ----------- | ------------------------------------------------------- | ------------------- |
| 400         | "Invalid asset data. Check your input."                 | Inline field errors |
| 401         | "Session expired. Please log in again."                 | Redirect to login   |
| 403         | "You don't have permission for impairment testing."     | Hide action         |
| 404         | "Asset not found. It may have been disposed."           | Return to list      |
| 409         | "Asset already has an impairment test for this period." | Show conflict modal |
| 422         | "Validation failed: Useful life must be > 0."           | Inline errors       |
| 500         | "Operation failed. Our team has been notified."         | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/intangible-assets.json`.

### Page Titles & Headers

| Context           | Copy                   | i18n Key                             |
| ----------------- | ---------------------- | ------------------------------------ |
| List Page         | "Intangible Assets"    | `intangibleAssets.list.title`        |
| Detail Page       | "Asset Details"        | `intangibleAssets.detail.title`      |
| Create Modal      | "Add Intangible Asset" | `intangibleAssets.create.title`      |
| License Dashboard | "Software Licenses"    | `intangibleAssets.licenses.title`    |
| IP Portfolio      | "IP Portfolio"         | `intangibleAssets.ipPortfolio.title` |
| Impairment Test   | "Impairment Testing"   | `intangibleAssets.impairment.title`  |

### State Messages

| State               | Title                      | Message                                                  | Action Button       | i18n Key                                |
| ------------------- | -------------------------- | -------------------------------------------------------- | ------------------- | --------------------------------------- |
| Empty               | "No intangible assets"     | "Add your first intangible asset to begin tracking"      | "Add Asset"         | `intangibleAssets.empty.*`              |
| Loading             | —                          | —                                                        | —                   | —                                       |
| Error               | "Unable to load assets"    | "Something went wrong. Our team has been notified."      | "Retry" / "Support" | `intangibleAssets.error.*`              |
| No Results          | "No assets found"          | "Try adjusting your filters or search terms"             | "Clear Filters"     | `intangibleAssets.noResults.*`          |
| Permission Denied   | "Access restricted"        | "You don't have permission to view intangible assets."   | "Back"              | `intangibleAssets.permissionDenied.*`   |
| Calculating         | "Calculating..."           | "Running amortization schedule. This may take a moment." | —                   | `intangibleAssets.calculating.*`        |
| Impairment Required | "Impairment test required" | "Annual impairment test due for this asset"              | "Perform Test"      | `intangibleAssets.impairmentRequired.*` |
| License Expiring    | "License expiring soon"    | "Renew within {days} days to avoid service interruption" | "Renew Now"         | `intangibleAssets.licenseExpiring.*`    |

### Action Confirmations

| Action           | Title                  | Message                                                         | Confirm Button | Cancel Button | i18n Key                                  |
| ---------------- | ---------------------- | --------------------------------------------------------------- | -------------- | ------------- | ----------------------------------------- |
| Dispose          | "Dispose this asset?"  | "Record disposal of {asset}? This creates gain/loss entry."     | "Dispose"      | "Cancel"      | `intangibleAssets.dispose.confirm.*`      |
| Impair           | "Record impairment?"   | "Record impairment loss of {amount}? This cannot be reversed."  | "Record"       | "Cancel"      | `intangibleAssets.impair.confirm.*`       |
| Amortize         | "Run amortization?"    | "Calculate amortization for {period}? This posts GL entries."   | "Run"          | "Cancel"      | `intangibleAssets.amortize.confirm.*`     |
| Change Method    | "Change amortization?" | "Change method? This recalculates all historical amortization." | "Change"       | "Cancel"      | `intangibleAssets.changeMethod.confirm.*` |
| Update Valuation | "Update valuation?"    | "Update {asset} valuation to {amount}? Requires approval."      | "Update"       | "Cancel"      | `intangibleAssets.updateValue.confirm.*`  |

### Success Messages (Toast)

| Action            | Message                                     | i18n Key                            |
| ----------------- | ------------------------------------------- | ----------------------------------- |
| Asset Created     | "Asset '{name}' created successfully"       | `intangibleAssets.create.success`   |
| Asset Updated     | "Asset '{name}' updated successfully"       | `intangibleAssets.update.success`   |
| Asset Disposed    | "Asset disposed with {gainLoss} recorded"   | `intangibleAssets.dispose.success`  |
| Amortization Run  | "Amortization completed for {count} assets" | `intangibleAssets.amortize.success` |
| Impairment Tested | "Impairment test completed for {asset}"     | `intangibleAssets.impair.success`   |
| License Renewed   | "License renewed until {date}"              | `intangibleAssets.renew.success`    |

### Error Messages (Toast)

| Scenario              | Message                                                        | i18n Key                                |
| --------------------- | -------------------------------------------------------------- | --------------------------------------- |
| Create Failed         | "Failed to create asset. Please try again."                    | `intangibleAssets.create.error`         |
| Amortization Failed   | "Failed to calculate amortization. Check asset data."          | `intangibleAssets.amortize.error`       |
| Impairment Failed     | "Impairment test failed. Verify fair value calculation."       | `intangibleAssets.impair.error`         |
| Invalid Useful Life   | "Useful life must be greater than 0 for definite-life assets." | `intangibleAssets.errorUsefulLife`      |
| Invalid Cost          | "Acquisition cost must be greater than 0."                     | `intangibleAssets.errorCost`            |
| Already Impaired      | "Asset already has impairment test for this period."           | `intangibleAssets.errorAlreadyImpaired` |
| Goodwill Amortization | "Goodwill cannot be amortized. Use impairment test only."      | `intangibleAssets.errorGoodwillAmort`   |
| Network Error         | "Network error. Check your connection and try again."          | `intangibleAssets.error.network`        |

### Form Labels & Help Text

| Field               | Label                 | Placeholder           | Help Text                                       | i18n Key                               |
| ------------------- | --------------------- | --------------------- | ----------------------------------------------- | -------------------------------------- |
| Asset Name          | "Asset Name"          | "e.g., Customer List" | "Descriptive name for this intangible asset"    | `intangibleAssets.field.name.*`        |
| Asset Type          | "Asset Type"          | "Select type"         | "Patents, Trademarks, Software, Goodwill, etc." | `intangibleAssets.field.type.*`        |
| Acquisition Cost    | "Acquisition Cost"    | "0.00"                | "Initial cost or fair value at acquisition"     | `intangibleAssets.field.cost.*`        |
| Acquisition Date    | "Acquisition Date"    | "Select date"         | "Date asset was acquired or recognized"         | `intangibleAssets.field.acqDate.*`     |
| Useful Life         | "Useful Life (years)" | "Indefinite or years" | "Leave blank for indefinite-life assets"        | `intangibleAssets.field.usefulLife.*`  |
| Amortization Method | "Amortization Method" | "Straight-line"       | "Method for allocating cost over useful life"   | `intangibleAssets.field.amortMethod.*` |
| Fair Value          | "Fair Value"          | "0.00"                | "Current fair value for impairment testing"     | `intangibleAssets.field.fairValue.*`   |
| License Expiration  | "License Expiration"  | "Select date"         | "Date when software license expires"            | `intangibleAssets.field.expiration.*`  |

### Keyboard Shortcuts Help

| Shortcut | Description              | i18n Key                              |
| -------- | ------------------------ | ------------------------------------- |
| `/`      | "Focus search"           | `intangibleAssets.shortcuts.search`   |
| `n`      | "Add new asset"          | `intangibleAssets.shortcuts.new`      |
| `i`      | "Run impairment test"    | `intangibleAssets.shortcuts.impair`   |
| `a`      | "Calculate amortization" | `intangibleAssets.shortcuts.amortize` |
| `↑ / ↓`  | "Navigate assets"        | `intangibleAssets.shortcuts.navigate` |
| `Enter`  | "Open selected asset"    | `intangibleAssets.shortcuts.open`     |
| `Escape` | "Close modal/cancel"     | `intangibleAssets.shortcuts.cancel`   |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useIntangibleAssets.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useIntangibleAssets(filters = {}) {
  const queryClient = useQueryClient();

  const {
    data: assets,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["intangible-assets", "list", filters],
    queryFn: () => apiClient.GET("/api/intangible-assets", { query: filters }),
    staleTime: 60_000, // 1min
    retry: 2,
    select: (response) => response.data,
  });

  const createAsset = useMutation({
    mutationFn: (data) =>
      apiClient.POST("/api/intangible-assets", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["intangible-assets"] });
      toast.success(`Asset '${data.name}' created successfully`);
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Validation failed. Check your input.");
      } else {
        toast.error("Failed to create asset.");
      }
    },
  });

  const updateAsset = useMutation({
    mutationFn: ({ id, data }) =>
      apiClient.PUT("/api/intangible-assets/[id]", {
        params: { id },
        body: data,
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["intangible-assets"] });
      queryClient.invalidateQueries({
        queryKey: ["intangible-assets", "detail", id],
      });
      toast.success("Asset updated successfully");
    },
  });

  return {
    assets: assets || [],
    isLoading,
    error,
    createAsset: createAsset.mutate,
    updateAsset: updateAsset.mutate,
  };
}

export function useIntangibleAsset(id: string) {
  return useQuery({
    queryKey: ["intangible-assets", "detail", id],
    queryFn: () =>
      apiClient.GET("/api/intangible-assets/[id]", { params: { id } }),
    staleTime: 60_000, // 1min
    enabled: !!id,
    select: (response) => response.data,
  });
}

export function useRunAmortization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { period: string; asset_ids?: string[] }) =>
      apiClient.POST("/api/intangible-assets/amortize", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["intangible-assets"] });
      toast.success(
        `Amortization completed for ${data.assets_processed} assets`
      );
    },
    onError: () => {
      toast.error("Amortization failed. Check asset data.");
    },
  });
}

export function usePerformImpairmentTest(assetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      test_date: string;
      fair_value: number;
      valuation_method: string;
      reporting_unit?: string;
    }) =>
      apiClient.POST("/api/intangible-assets/[id]/impairment-test", {
        params: { id: assetId },
        body: data,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["intangible-assets"] });
      queryClient.invalidateQueries({
        queryKey: ["intangible-assets", "detail", assetId],
      });
      toast.success(`Impairment test completed for ${data.asset_name}`);
    },
    onError: (error) => {
      if (error.status === 409) {
        toast.error("Asset already has impairment test for this period.");
      } else {
        toast.error("Impairment test failed. Verify fair value calculation.");
      }
    },
  });
}

export function useDisposeAsset(assetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { disposal_date: string; proceeds: number }) =>
      apiClient.POST("/api/intangible-assets/[id]/dispose", {
        params: { id: assetId },
        body: data,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["intangible-assets"] });
      const gainLoss =
        data.gain_loss >= 0
          ? `gain of ${data.gain_loss}`
          : `loss of ${Math.abs(data.gain_loss)}`;
      toast.success(`Asset disposed with ${gainLoss} recorded`);
    },
  });
}

export function useSoftwareLicenses() {
  return useQuery({
    queryKey: ["intangible-assets", "licenses"],
    queryFn: () => apiClient.GET("/api/intangible-assets/licenses"),
    staleTime: 2 * 60_000, // 2min
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error         | User Message                                         | UI Action            |
| ----------------- | ---------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid asset data. Check your input."              | Inline field errors  |
| 409 (Conflict)    | "Asset already has impairment test for this period." | Show conflict modal  |
| 422 (Validation)  | "Validation failed: {field_errors}"                  | Inline errors        |
| 403 (Forbidden)   | "You don't have permission for impairment testing."  | Hide action buttons  |
| 500 (Server)      | "Operation failed. Our team has been notified."      | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Impairment tests**: 5s timeout; complex calculation

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["intangible-assets", "list", { filters }][
  ("intangible-assets", "detail", assetId)
][("intangible-assets", "licenses")][("intangible-assets", "ip-portfolio")];
```

### Invalidation Rules

| Action           | Invalidates                                                            |
| ---------------- | ---------------------------------------------------------------------- |
| Create Asset     | `["intangible-assets", "list"]`                                        |
| Update Asset     | `["intangible-assets", "list"]`, `["intangible-assets", "detail", id]` |
| Run Amortization | `["intangible-assets", "list"]`, all `["intangible-assets", "detail"]` |
| Impairment Test  | `["intangible-assets", "list"]`, `["intangible-assets", "detail", id]` |
| Dispose Asset    | `["intangible-assets", "list"]`, `["intangible-assets", "detail", id]` |

### Stale Time

| Query Type        | Stale Time | Reasoning                                |
| ----------------- | ---------- | ---------------------------------------- |
| Asset List        | 1min       | Moderate changes; carrying value updates |
| Asset Detail      | 1min       | Less frequently changed                  |
| Software Licenses | 2min       | License data changes infrequently        |
| IP Portfolio      | 5min       | IP valuations change rarely              |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("intangible-assets"); // After mutations
revalidateTag(`intangible-asset-${assetId}`); // Specific asset
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/intangible-assets.fixtures.ts`

**Datasets**:

- `minimalAssets`: 5 assets (one per type)
- `standardAssets`: 30 assets with amortization schedules
- `largePortfolio`: 200 assets (for performance testing)
- `edgeCases`: Special scenarios

**Edge Cases Covered**:

- Goodwill (indefinite life, no amortization)
- Software licenses with various expiration dates
- Patents in application stage vs. granted
- Fully amortized assets
- Assets with impairment losses
- Multi-currency acquisitions

```typescript
// Example fixture structure
export const standardAssets: IntangibleAssetFixture[] = [
  {
    id: "intangible_1",
    name: "Customer Relationships",
    type: "customer_list",
    acquisition_cost: 500000.0,
    acquisition_date: "2023-01-15",
    useful_life: 10,
    amortization_method: "straight-line",
    carrying_value: 450000.0,
    accumulated_amortization: 50000.0,
    status: "Active",
  },
  // ... 29 more
];
```

### E2E Seed Data

**Location**: `tests/seeds/intangible-assets.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:intangible-assets
```

**Dataset**:

- 50 assets across all types
- 10 software licenses (various expiration dates)
- 5 patents (different stages)
- 3 goodwill assets (from M&A)
- 15 fully amortized assets
- Mix of definite and indefinite life

**Cleanup Command**:

```powershell
pnpm run seed:intangible-assets:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic company: "Demo Corp Inc." with $5M in intangible assets
- 40 assets demonstrating all features
- Complete amortization schedules
- Example impairment tests with documentation
- Software license dashboard with expiring licenses
- IP portfolio with patents and trademarks

**Regeneration**:

```powershell
pnpm run demo:reset:intangible-assets
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] Carrying Value = Cost - Accumulated Amortization - Impairment Losses
- [ ] Acquisition Cost > 0
- [ ] Useful Life > 0 for definite-life assets
- [ ] Goodwill has no useful life or amortization
- [ ] License expiration dates in future

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
- **Interactive Parts**: Mark with `"use client"` (impairment test forms, license dashboard)

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

export async function runAmortization(period: string) {
  // ... mutation logic
  revalidateTag("intangible-assets");
}
```

---

## 📊 Analytics & Audit Events

| Event                                 | When                  | Properties                                                        |
| ------------------------------------- | --------------------- | ----------------------------------------------------------------- |
| IntangibleAsset.Created               | After 2xx             | `asset_id`, `name`, `type`, `acquisition_cost`                    |
| IntangibleAsset.Updated               | After 2xx             | `asset_id`, changed fields                                        |
| IntangibleAsset.Amortized             | Amortization run      | `period`, `assets_processed`, `total_amortization`, `duration_ms` |
| IntangibleAsset.ImpairmentTested      | Impairment completed  | `asset_id`, `test_date`, `fair_value`, `impairment_loss`          |
| IntangibleAsset.Disposed              | Disposal complete     | `asset_id`, `disposal_date`, `proceeds`, `gain_loss`              |
| IntangibleAsset.License.ExpiringAlert | 90 days before expiry | `license_id`, `product`, `vendor`, `expiration_date`              |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("IntangibleAsset.ImpairmentTested", {
  asset_id: asset.id,
  test_date: testDate,
  fair_value: fairValue,
  carrying_value: asset.carrying_value,
  impairment_loss: impairmentLoss,
  valuation_method: "discounted_cash_flow",
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/intangible-assets.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency Display**: Respect locale-specific currency symbols
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Accounting Terms**: Localized terminology for amortization vs. depreciation

### Keyboard Shortcuts

| Key      | Action                 | Scope      |
| -------- | ---------------------- | ---------- |
| `/`      | Focus search           | Asset list |
| `n`      | Add new asset          | Asset list |
| `i`      | Run impairment test    | Detail     |
| `a`      | Calculate amortization | Any page   |
| `↑ / ↓`  | Navigate assets        | Table      |
| `Enter`  | Open selected asset    | Table      |
| `Escape` | Close modal/cancel     | Modal/Form |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateModal()],
  ["i", () => canImpair && openImpairmentTest()],
  ["a", () => runAmortization()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                              | Duration | Rollback Trigger |
| ----------- | ---------------- | --------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                              | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, Lighthouse ≥90            | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, Amortization accuracy 100% | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained      | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m10_intangible_assets: false,        // Master toggle
  m10_impairment_testing: false,       // Impairment workflow
  m10_license_dashboard: false,        // License management
  m10_ip_portfolio: false,             // IP tracking
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/intangible-assets`, `/intangible-assets/licenses`)
- P50/P95/P99 latency
- Amortization calculation accuracy
- License expiration alert success rate
- Impairment test completion rate

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Amortization calculation error → immediate alert
- License expiration alert failure → notify ops
- P95 latency > 500ms for 10min → investigate

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m10_intangible_assets = false`

   ```powershell
   pnpm run flags:set m10_intangible_assets=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("intangible-assets");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/intangible-assets/*"
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

| Scenario                       | Action             | Approval Required |
| ------------------------------ | ------------------ | ----------------- |
| Error rate > 5%                | Immediate rollback | No (auto-trigger) |
| Amortization calculation error | Immediate rollback | No (auto-trigger) |
| Impairment test failure        | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%                | Partial rollback   | On-call engineer  |
| P95 latency > 1s               | Investigate first  | On-call engineer  |
| Data corruption/loss           | Immediate rollback | No (auto-trigger) |

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

- ASC 350: Intangibles—Goodwill and Other (US GAAP)
- IAS 38: Intangible Assets (IFRS)
- ERPNext: Intangible asset workflows
- SAP: Impairment testing procedures

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Impairment Test Accuracy

**Mitigation**: ASC 350 compliance review; audit validation; documented methodologies; third-party validation

### Risk #2: Software License Tracking Complexity

**Mitigation**: Vendor API integrations; manual entry fallback; automated expiration alerts

### Risk #3: IP Valuation Subjectivity

**Mitigation**: Third-party appraisal requirements; documented valuation methods; regular review cycle

### Risk #4: Amortization Method Changes

**Mitigation**: Approval workflow; recalculation validation; comprehensive audit trail; test coverage

---

## 📝 Implementation Guide

### Day 1: Asset Management & Licenses (8 hours)

1. Build asset register table (3 hours)
2. Create software license dashboard (3 hours)
3. Implement amortization calculator (2 hours)

**Total**: 1 day (8 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Amortization calculations accurate (straight-line, various methods)
- [ ] Carrying value calculation (cost - amortization - impairment)
- [ ] Goodwill validation (no amortization)
- [ ] License expiration detection
- [ ] Impairment test logic
- [ ] useIntangibleAssets hook fetches correctly
- [ ] Currency formatting displays correctly

### Integration Tests

- [ ] Create asset → appears in list
- [ ] Run amortization → GL entries posted
- [ ] Perform impairment test → impairment loss recorded
- [ ] Dispose asset → gain/loss calculated
- [ ] License expiration alerts trigger
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] User can navigate to intangible assets page
- [ ] User can create new asset with all fields
- [ ] User can run amortization for period
- [ ] User can perform impairment test
- [ ] User can dispose asset with proceeds
- [ ] User can view software license dashboard
- [ ] Keyboard-only flow: create → amortize → test → dispose

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Impairment test form accessible
- [ ] Screen reader announces calculation results
- [ ] Focus management correct (modals, forms)
- [ ] Color contrast meets WCAG 2.2 AA (AAA where practical)
- [ ] Axe: 0 serious/critical violations
- [ ] Multi-step forms have clear progress indicators

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] All API endpoints return expected status codes
- [ ] Amortization results validated against spec

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for list, detail, impairment test pages
- [ ] Dark/light theme variations
- [ ] Asset status badge variations
- [ ] Loading/error/empty states captured

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/intangible-assets/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] Impairment calculation completes in < 3s
- [ ] License dashboard loads 500 licenses in < 1s
- [ ] Amortization schedule generation < 2s

---

## 📅 Timeline

| Day | Deliverable                                       |
| --- | ------------------------------------------------- |
| 1   | Asset register + License dashboard + Amortization |

**Total**: 1 day (8 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries
- ✅ M8: Fixed Assets (similar domain)

### Enables These Modules

- M&A modules (goodwill allocation)
- Financial reporting modules

---

## 🎯 Success Criteria

### Must Have

- [ ] Create and manage intangible assets
- [ ] Automated amortization calculations
- [ ] Impairment testing workflow (ASC 350)
- [ ] Software license tracking with expiration alerts
- [ ] Disposal with gain/loss calculation
- [ ] Search and filtering (type, status, useful life)

### Should Have

- [ ] IP portfolio visualization
- [ ] Multi-method amortization comparison
- [ ] License utilization tracking
- [ ] Third-party valuation integration

### Nice to Have

- [ ] AI-powered license optimization recommendations
- [ ] Patent application tracking integration
- [ ] M&A goodwill allocation tool
- [ ] Predictive impairment alerts

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/intangible-assets`, `/intangible-assets/[id]`, `/intangible-assets/licenses`)
- [ ] All CRUD operations working (Create, Read, Update, Amortize, Impair, Dispose)
- [ ] Amortization calculations accurate (multiple methods)
- [ ] Impairment testing workflow complete (ASC 350)
- [ ] Software license dashboard with expiration alerts
- [ ] Disposal with gain/loss calculation
- [ ] Search and filtering working (type, status, useful life)
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
- [ ] Integration tests: All CRUD + amortization operations covered
- [ ] E2E tests: All user flows covered (create → amortize → impair → dispose)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Asset creation flow
- Amortization calculation flow
- Impairment testing flow
- Asset disposal with gain/loss

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/intangible-assets/*` routes
- [ ] TTFB: ≤70ms on staging (Server-Timing header)
- [ ] TTI: ≤200ms for `/intangible-assets` (Lighthouse CI)
- [ ] Impairment calculation: < 3s
- [ ] License dashboard: < 1s for 500 licenses
- [ ] Amortization schedule: < 2s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues
- [ ] Multi-step forms have clear progress indicators

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `IntangibleAsset.Created`
  - `IntangibleAsset.Amortized`
  - `IntangibleAsset.ImpairmentTested`
  - `IntangibleAsset.Disposed`
  - `IntangibleAsset.License.ExpiringAlert`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, amortization accuracy)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] IP details masked for non-authorized users
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] Audit trail maintained for all valuations and tests

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
  - `flags.m10_intangible_assets = false` (ready to enable)
  - `flags.m10_impairment_testing = false` (phase 2)
  - `flags.m10_license_dashboard = false` (phase 2)
  - `flags.m10_ip_portfolio = false` (phase 2)
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

**Ready to build? Start with Day 1! 🚀**

**Previous**: M09 - CAPEX Planning  
**Next**: M11 - Inventory
