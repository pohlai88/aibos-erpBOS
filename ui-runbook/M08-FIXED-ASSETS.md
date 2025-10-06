# 🚀 M8: Fixed Assets - UI Implementation Runbook

**Module ID**: M8  
**Module Name**: Fixed Assets  
**Priority**: MEDIUM  
**Phase**: 3 - Asset Management  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Fixed Assets manages the **complete lifecycle of capital assets** from acquisition through depreciation to disposal. Essential for accurate financial reporting and tax compliance.

### Business Value

- Complete asset lifecycle management
- Automated depreciation calculations
- Tax and GAAP reporting support
- Asset tracking with barcode/QR support
- Compliance with ASC 360 and IAS 16

---

## 👥 Ownership

- **Module Owner**: TBD (@handle) | **Code Reviewer**: TBD | **QA Lead**: TBD
- **ADRs**: [ADR-###-depreciation-methods], [ADR-###-asset-lifecycle]

---

## 📊 Current Status

| Layer         | Status  | Details                           |
| ------------- | ------- | --------------------------------- |
| **Database**  | ✅ 100% | Complete asset management schema  |
| **Services**  | ✅ 100% | Depreciation calculation services |
| **API**       | ✅ 100% | 5 endpoints for asset operations  |
| **Contracts** | ✅ 100% | Type-safe schemas defined         |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**          |

### API Coverage

- ✅ `/api/assets` - Asset register
- ✅ `/api/assets/depreciation` - Run depreciation
- ✅ `/api/assets/dispose` - Asset disposal
- ✅ `/api/assets/transfer` - Inter-entity transfers
- ✅ `/api/assets/reports` - Asset reports

**Total Endpoints**: 5

### Risks & Blockers

| Risk                              | Impact | Mitigation                                 | Owner       |
| --------------------------------- | ------ | ------------------------------------------ | ----------- |
| Depreciation calculation accuracy | HIGH   | Multi-method validation; accounting review | @backend    |
| Asset disposal compliance         | HIGH   | Approval workflows; audit trail            | @compliance |
| Photo storage/bandwidth           | MED    | CDN; image optimization; lazy loading      | @infra      |

---

## 🎯 3 Killer Features

### 1. **Visual Asset Register with Photos** 📸

**Description**: Interactive asset register with photo uploads, QR codes, and location tracking.

**Why It's Killer**:

- Photo documentation for each asset
- QR code generation for physical tagging
- GPS location tracking
- Mobile-friendly for physical verification
- Better than SAP/Oracle's text-only registers

**Implementation**:

```typescript
import { DataTable, Card, Image, Badge } from "aibos-ui";

export default function AssetRegister() {
  const { assets } = useAssets();

  return (
    <DataTable
      data={assets}
      columns={[
        {
          key: "photo",
          label: "Photo",
          render: (url) => <Image src={url} width={50} height={50} />,
        },
        { key: "asset_id", label: "Asset ID" },
        { key: "description", label: "Description" },
        { key: "location", label: "Location" },
        {
          key: "book_value",
          label: "Book Value",
          align: "right",
          render: formatCurrency,
        },
        {
          key: "status",
          label: "Status",
          render: (v) => <Badge>{v}</Badge>,
        },
      ]}
      expandable={(row) => <AssetDetails asset={row} />}
    />
  );
}
```

### 2. **Multi-Method Depreciation Engine** 📉

**Description**: Calculates depreciation using multiple methods simultaneously (Straight-line, Declining balance, Units of production, MACRS).

**Why It's Killer**:

- Calculate GAAP and tax depreciation simultaneously
- Switch methods retroactively with recalculation
- What-if analysis for different scenarios
- Automated journal entry generation
- Industry-first multi-method support

**Implementation**:

```typescript
import { Form, Card, Chart } from "aibos-ui";

export default function DepreciationCalculator() {
  const [methods, setMethods] = useState(["straight-line", "macrs"]);
  const { schedule } = useDepreciationSchedule(assetId, methods);

  return (
    <>
      <Form>
        <MultiSelect
          name="methods"
          label="Depreciation Methods"
          options={[
            { value: "straight-line", label: "Straight-Line" },
            { value: "declining-balance", label: "Declining Balance" },
            { value: "units", label: "Units of Production" },
            { value: "macrs", label: "MACRS (Tax)" },
          ]}
          value={methods}
          onChange={setMethods}
        />
      </Form>

      <Chart type="line" data={schedule} series={methods} yAxis="Book Value" />
    </>
  );
}
```

### 3. **Automated Disposal Workflow** 🔄

**Description**: Streamlined asset disposal process with gain/loss calculation and journal entry automation.

**Why It's Killer**:

- One-click disposal with all GL entries
- Automatic gain/loss calculation
- Partial disposal support
- Trade-in handling
- Faster than manual Oracle FA process

**Implementation**:

```typescript
import { Form, Card, Button, Alert } from "aibos-ui";

export default function AssetDisposal() {
  const { asset, dispose } = useAssetDisposal(assetId);

  return (
    <Form onSubmit={dispose}>
      <Card>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Book Value:</strong> {formatCurrency(asset.book_value)}
          </div>
          <div>
            <strong>Accumulated Depreciation:</strong>{" "}
            {formatCurrency(asset.accum_depr)}
          </div>
        </div>
      </Card>

      <Input name="disposal_date" label="Disposal Date" type="date" required />

      <Input name="proceeds" label="Sale Proceeds" type="number" required />

      <Card className="bg-blue-50">
        <h3>Calculated Gain/Loss</h3>
        <div className="text-2xl font-bold">
          {formatCurrency(calculatedGainLoss)}
        </div>
      </Card>

      <Button type="submit">Complete Disposal</Button>
    </Form>
  );
}
```

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Asset Register (`/assets`)

**Components**: DataTable, Image, Badge, Button, FileUpload
**File**: `apps/web/app/(dashboard)/assets/page.tsx`

#### 2. Asset Detail (`/assets/[id]`)

**Components**: Form, Card, Chart, Button, Image
**File**: `apps/web/app/(dashboard)/assets/[id]/page.tsx`

#### 3. Depreciation Run (`/assets/depreciation`)

**Components**: Button, DataTable, Progress, Modal
**File**: `apps/web/app/(dashboard)/assets/depreciation/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                         | Target               | Measurement          |
| ------------------------------ | -------------------- | -------------------- |
| TTFB (staging)                 | ≤ 70ms               | Server timing header |
| Client TTI for `/assets`       | ≤ 200ms              | Lighthouse CI        |
| Photo upload                   | < 5s per image       | Progress tracking    |
| Depreciation run (1000 assets) | < 10s                | APM traces           |
| UI bundle size                 | ≤ 250KB gzipped      | Webpack analyzer     |
| Image optimization             | Auto-resize to 800px | CDN processing       |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to all asset operations
- **Focus Management**: Focus trap in modals; visible indicators
- **ARIA**: Live regions for depreciation progress; proper roles and labels
- **Screen Reader**: All operations announced; photo alt text required
- **Axe Target**: 0 serious/critical violations
- **Image Accessibility**: Mandatory alt text for all asset photos

### Security

| Layer         | Requirement                                                        |
| ------------- | ------------------------------------------------------------------ |
| RBAC Scopes   | `assets.read`, `assets.write`, `assets.depreciate`, `assets.admin` |
| Enforcement   | Server-side on all endpoints                                       |
| Data Exposure | Only show assets user has permission to view                       |
| Audit Trail   | All changes logged with user + timestamp                           |
| Photo Storage | CDN with signed URLs; 24hr expiry; virus scanning                  |

#### UI Permissions Matrix

| Role              | View | Create | Edit | Depreciate | Dispose | Transfer | Admin |
| ----------------- | ---- | ------ | ---- | ---------- | ------- | -------- | ----- |
| assets.read       | ✅   | ❌     | ❌   | ❌         | ❌      | ❌       | ❌    |
| assets.write      | ✅   | ✅     | ✅   | ❌         | ❌      | ❌       | ❌    |
| assets.depreciate | ✅   | ✅     | ✅   | ✅         | ❌      | ❌       | ❌    |
| assets.admin      | ✅   | ✅     | ✅   | ✅         | ✅      | ✅       | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful depreciation runs
- **SLA Dashboards**: Real-time metrics on asset counts, depreciation accuracy, disposal success
- **Events Emitted**: `Asset.Created`, `Asset.Depreciation.Run`, `Asset.Disposed`, `Asset.Transferred`
- **Logging**: Structured logs with correlation IDs for all mutations
- **Tracing**: Distributed tracing for depreciation calculations
- **Monitoring**: Photo upload success rate, depreciation calculation accuracy

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Fixed Assets Rules

| Rule                    | Enforcement                                                     |
| ----------------------- | --------------------------------------------------------------- |
| **Acquisition Cost**    | Must be > 0; cannot be changed after asset is placed in service |
| **Depreciation Start**  | Cannot start before acquisition date                            |
| **Book Value**          | Cost - Accumulated Depreciation; cannot be negative             |
| **Disposal**            | Requires approval if book value > $10,000                       |
| **Useful Life**         | Must be > 0; typical range 3-40 years                           |
| **Salvage Value**       | Must be < Acquisition Cost; can be 0                            |
| **Transfer**            | Preserves accumulated depreciation and book value               |
| **Depreciation Method** | Once set, requires approval to change (triggers recalculation)  |

### Currency & Rounding

- **Display**: Presentation currency from tenant settings
- **Rounding Policy**: HALF_UP for depreciation amounts
- **Multi-Currency**: Assets acquired in foreign currency; track FX at acquisition date
- **Revaluation**: Track revaluation gains/losses separately from depreciation

### Archive Semantics

- **Soft Delete**: Set `disposed_date`; maintain historical records
- **Guard Rails**:
  - ❌ Deny if asset has non-zero book value (must dispose first)
  - ❌ Deny if asset is currently under maintenance
  - ❌ Deny if asset is involved in open transactions
  - ✅ Allow if fully depreciated and disposed

---

## 🚨 Error Handling & UX States

### All Possible States

| State                       | UI Display                       | User Action       |
| --------------------------- | -------------------------------- | ----------------- |
| **Empty**                   | "No assets registered"           | "Add Asset"       |
| **Loading**                 | Skeleton asset cards             | N/A               |
| **Error**                   | Error message + retry            | Retry / Support   |
| **Uploading Photo**         | Progress bar with percentage     | Wait / Cancel     |
| **Processing Depreciation** | "Calculating... {count} assets"  | Wait              |
| **No Results**              | "No assets match filters"        | Clear filters     |
| **Disposed**                | Greyed out with "Disposed" badge | View history      |
| **Fully Depreciated**       | Green badge "Fully Depreciated"  | Consider disposal |
| **Permission Denied**       | "Access restricted"              | Back              |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Submit State**: Button disabled until dirty & valid
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal
- **Real-time Validation**: Check acquisition cost > salvage value as user types

### Network Errors

| HTTP Status | UI Message                                      | Action              |
| ----------- | ----------------------------------------------- | ------------------- |
| 400         | "Invalid asset data. Check your input."         | Inline field errors |
| 401         | "Session expired. Please log in again."         | Redirect to login   |
| 403         | "You don't have permission for this action."    | Hide action         |
| 404         | "Asset not found. It may have been disposed."   | Return to list      |
| 409         | "Asset already disposed."                       | Show conflict modal |
| 413         | "Photo too large. Maximum 10MB."                | Compress or resize  |
| 422         | "Validation failed: Useful life must be > 0."   | Inline errors       |
| 500         | "Operation failed. Our team has been notified." | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/assets.json`.

### Page Titles & Headers

| Context           | Copy                    | i18n Key                    |
| ----------------- | ----------------------- | --------------------------- |
| List Page         | "Fixed Assets Register" | `assets.list.title`         |
| Detail Page       | "Asset Details"         | `assets.detail.title`       |
| Create Modal      | "Add New Asset"         | `assets.create.title`       |
| Depreciation Page | "Run Depreciation"      | `assets.depreciation.title` |
| Disposal Page     | "Dispose Asset"         | `assets.disposal.title`     |
| Transfer Page     | "Transfer Asset"        | `assets.transfer.title`     |

### State Messages

| State                   | Title                   | Message                                               | Action Button       | i18n Key                    |
| ----------------------- | ----------------------- | ----------------------------------------------------- | ------------------- | --------------------------- |
| Empty                   | "No assets registered"  | "Add your first fixed asset to begin tracking"        | "Add Asset"         | `assets.empty.*`            |
| Loading                 | —                       | —                                                     | —                   | —                           |
| Error                   | "Unable to load assets" | "Something went wrong. Our team has been notified."   | "Retry" / "Support" | `assets.error.*`            |
| No Results              | "No assets found"       | "Try adjusting your filters or search terms"          | "Clear Filters"     | `assets.noResults.*`        |
| Permission Denied       | "Access restricted"     | "You don't have permission to view assets."           | "Back"              | `assets.permissionDenied.*` |
| Uploading Photo         | "Uploading..."          | "Processing image. This may take a moment."           | —                   | `assets.uploading.*`        |
| Processing Depreciation | "Calculating..."        | "Depreciation run in progress: {percent}% complete."  | —                   | `assets.processing.*`       |
| Disposed                | "Asset disposed"        | "This asset has been disposed on {date}"              | "View History"      | `assets.disposed.*`         |
| Fully Depreciated       | "Fully depreciated"     | "This asset is fully depreciated. Consider disposal." | "Dispose"           | `assets.fullyDepreciated.*` |

### Action Confirmations

| Action           | Title                         | Message                                                          | Confirm Button | Cancel Button | i18n Key                        |
| ---------------- | ----------------------------- | ---------------------------------------------------------------- | -------------- | ------------- | ------------------------------- |
| Dispose          | "Dispose this asset?"         | "This will create a gain/loss entry. Confirm disposal?"          | "Dispose"      | "Cancel"      | `assets.dispose.confirm.*`      |
| Transfer         | "Transfer this asset?"        | "Transfer {asset} to {entity}. This cannot be easily undone."    | "Transfer"     | "Cancel"      | `assets.transfer.confirm.*`     |
| Run Depreciation | "Run depreciation?"           | "Run depreciation for {period}? This will post {count} entries." | "Run"          | "Cancel"      | `assets.depreciate.confirm.*`   |
| Delete           | "Delete this asset?"          | "This asset will be permanently deleted. This cannot be undone." | "Delete"       | "Cancel"      | `assets.delete.confirm.*`       |
| Change Method    | "Change depreciation method?" | "This will recalculate all depreciation. Continue?"              | "Change"       | "Cancel"      | `assets.changeMethod.confirm.*` |

### Success Messages (Toast)

| Action            | Message                                            | i18n Key                      |
| ----------------- | -------------------------------------------------- | ----------------------------- |
| Asset Created     | "Asset '{name}' created successfully"              | `assets.create.success`       |
| Asset Updated     | "Asset '{name}' updated successfully"              | `assets.update.success`       |
| Asset Disposed    | "Asset disposed with {gainLoss} recorded"          | `assets.dispose.success`      |
| Asset Transferred | "Asset transferred to {entity} successfully"       | `assets.transfer.success`     |
| Depreciation Run  | "Depreciation completed: {count} assets processed" | `assets.depreciation.success` |
| Photo Uploaded    | "Photo uploaded successfully"                      | `assets.photo.success`        |

### Error Messages (Toast)

| Scenario            | Message                                               | i18n Key                      |
| ------------------- | ----------------------------------------------------- | ----------------------------- |
| Create Failed       | "Failed to create asset. Please try again."           | `assets.create.error`         |
| Update Failed       | "Failed to update asset. Please try again."           | `assets.update.error`         |
| Disposal Failed     | "Failed to dispose asset. Check requirements."        | `assets.dispose.error`        |
| Photo Upload Failed | "Photo upload failed. Max 10MB, JPG/PNG only."        | `assets.photo.error`          |
| Invalid Useful Life | "Useful life must be between 1 and 50 years."         | `assets.errorUsefulLife`      |
| Invalid Salvage     | "Salvage value must be less than acquisition cost."   | `assets.errorSalvage`         |
| Already Disposed    | "Asset already disposed. Cannot edit."                | `assets.errorAlreadyDisposed` |
| Depreciation Failed | "Depreciation run failed for {count} assets."         | `assets.depreciation.error`   |
| Network Error       | "Network error. Check your connection and try again." | `assets.error.network`        |

### Form Labels & Help Text

| Field               | Label                 | Placeholder         | Help Text                                           | i18n Key                         |
| ------------------- | --------------------- | ------------------- | --------------------------------------------------- | -------------------------------- |
| Asset ID            | "Asset ID"            | "e.g., FA-001"      | "Unique identifier for this asset"                  | `assets.field.assetId.*`         |
| Description         | "Description"         | "e.g., MacBook Pro" | "Descriptive name for the asset"                    | `assets.field.description.*`     |
| Acquisition Cost    | "Acquisition Cost"    | "0.00"              | "Total cost including setup and delivery"           | `assets.field.cost.*`            |
| Acquisition Date    | "Acquisition Date"    | "Select date"       | "Date asset was acquired"                           | `assets.field.acquisitionDate.*` |
| Useful Life         | "Useful Life (years)" | "5"                 | "Expected useful life in years"                     | `assets.field.usefulLife.*`      |
| Salvage Value       | "Salvage Value"       | "0.00"              | "Estimated value at end of useful life"             | `assets.field.salvageValue.*`    |
| Depreciation Method | "Depreciation Method" | "Select method"     | "Straight-line, Declining balance, Units, or MACRS" | `assets.field.method.*`          |
| Location            | "Location"            | "e.g., Building A"  | "Physical location of asset"                        | `assets.field.location.*`        |
| Category            | "Asset Category"      | "Select category"   | "Buildings, Equipment, Vehicles, etc."              | `assets.field.category.*`        |

### Keyboard Shortcuts Help

| Shortcut | Description           | i18n Key                      |
| -------- | --------------------- | ----------------------------- |
| `/`      | "Focus search"        | `assets.shortcuts.search`     |
| `n`      | "Add new asset"       | `assets.shortcuts.new`        |
| `d`      | "Run depreciation"    | `assets.shortcuts.depreciate` |
| `↑ / ↓`  | "Navigate assets"     | `assets.shortcuts.navigate`   |
| `Enter`  | "Open selected asset" | `assets.shortcuts.open`       |
| `Escape` | "Close modal/cancel"  | `assets.shortcuts.cancel`     |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useAssets.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useAssets(filters = {}) {
  const queryClient = useQueryClient();

  const {
    data: assets,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["assets", "list", filters],
    queryFn: () => apiClient.GET("/api/assets", { query: filters }),
    staleTime: 60_000, // 1min
    retry: 2,
    select: (response) => response.data,
  });

  const createAsset = useMutation({
    mutationFn: (data) => apiClient.POST("/api/assets/create", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(`Asset '${data.description}' created successfully`);
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
      apiClient.PUT("/api/assets/[id]", { params: { id }, body: data }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["assets", "detail", id] });
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

export function useAsset(id: string) {
  return useQuery({
    queryKey: ["assets", "detail", id],
    queryFn: () => apiClient.GET("/api/assets/[id]", { params: { id } }),
    staleTime: 60_000, // 1min
    enabled: !!id,
    select: (response) => response.data,
  });
}

export function useRunDepreciation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (period: string) =>
      apiClient.POST("/api/assets/depreciation", { body: { period } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(
        `Depreciation completed: ${data.assets_processed} assets processed`
      );
    },
    onError: () => {
      toast.error("Depreciation run failed. Please try again.");
    },
  });
}

export function useAssetDisposal(assetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      apiClient.POST("/api/assets/dispose", {
        body: { asset_id: assetId, ...data },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({
        queryKey: ["assets", "detail", assetId],
      });
      const gainLoss =
        data.gain_loss >= 0
          ? `gain of ${data.gain_loss}`
          : `loss of ${Math.abs(data.gain_loss)}`;
      toast.success(`Asset disposed with ${gainLoss} recorded`);
    },
    onError: (error) => {
      if (error.status === 409) {
        toast.error("Asset already disposed.");
      } else {
        toast.error("Failed to dispose asset.");
      }
    },
  });
}

export function useTransferAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { asset_id: string; to_entity_id: string }) =>
      apiClient.POST("/api/assets/transfer", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(`Asset transferred to ${data.to_entity_name} successfully`);
    },
  });
}

export function useUploadAssetPhoto(assetId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      return apiClient.POST("/api/assets/[id]/photo", {
        params: { id: assetId },
        body: formData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["assets", "detail", assetId],
      });
      toast.success("Photo uploaded successfully");
    },
    onError: (error) => {
      if (error.status === 413) {
        toast.error("Photo too large. Maximum 10MB.");
      } else {
        toast.error("Photo upload failed. JPG/PNG only.");
      }
    },
  });
}
```

### Error Mapping

| API Error               | User Message                                    | UI Action            |
| ----------------------- | ----------------------------------------------- | -------------------- |
| 400 (Bad Request)       | "Invalid asset data. Check your input."         | Inline field errors  |
| 409 (Conflict)          | "Asset already disposed."                       | Show conflict modal  |
| 413 (Payload Too Large) | "Photo too large. Maximum 10MB."                | Compress or resize   |
| 422 (Validation)        | "Validation failed: {field_errors}"             | Inline errors        |
| 403 (Forbidden)         | "You don't have permission for this action."    | Hide action buttons  |
| 500 (Server)            | "Operation failed. Our team has been notified." | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Photo uploads**: 30s timeout; no retry (too expensive)
- **Depreciation runs**: 60s timeout (long-running operation)

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["assets", "list", { filters }][("assets", "detail", assetId)][
  ("assets", "depreciation", "schedule", assetId)
][("assets", "reports")];
```

### Invalidation Rules

| Action           | Invalidates                                      |
| ---------------- | ------------------------------------------------ |
| Create Asset     | `["assets", "list"]`                             |
| Update Asset     | `["assets", "list"]`, `["assets", "detail", id]` |
| Dispose Asset    | `["assets", "list"]`, `["assets", "detail", id]` |
| Run Depreciation | `["assets", "list"]`, all `["assets", "detail"]` |
| Transfer Asset   | `["assets", "list"]`, `["assets", "detail", id]` |
| Upload Photo     | `["assets", "detail", id]`                       |

### Stale Time

| Query Type            | Stale Time | Reasoning                         |
| --------------------- | ---------- | --------------------------------- |
| Asset List            | 1min       | Moderate changes; balance queries |
| Asset Detail          | 1min       | Less frequently changed           |
| Depreciation Schedule | 5min       | Historical data; changes rarely   |
| Reports               | 5min       | Aggregated data; can be cached    |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("assets"); // After mutations
revalidateTag(`asset-${assetId}`); // Specific asset
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/assets.fixtures.ts`

**Datasets**:

- `minimalAssets`: 5 assets (one per category)
- `standardAssets`: 50 assets with photos, various depreciation methods
- `largeAssets`: 500 assets (for performance testing)
- `edgeCases`: Special scenarios

**Edge Cases Covered**:

- Fully depreciated assets
- Recently disposed assets
- Assets with zero salvage value
- Assets with very long useful life (40 years)
- Assets acquired in foreign currency
- Assets with multiple depreciation methods
- Assets mid-transfer
- Assets without photos

```typescript
// Example fixture structure
export const standardAssets: AssetFixture[] = [
  {
    id: "asset_1",
    asset_id: "FA-001",
    description: "MacBook Pro 16-inch",
    category: "Computer Equipment",
    acquisition_cost: 3500.0,
    acquisition_date: "2023-01-15",
    useful_life: 3,
    salvage_value: 500.0,
    depreciation_method: "straight-line",
    book_value: 2500.0,
    accumulated_depreciation: 1000.0,
    photo_url: "/assets/photos/fa-001.jpg",
    location: "Building A, Floor 3",
    status: "Active",
  },
  // ... 49 more
];
```

### E2E Seed Data

**Location**: `tests/seeds/assets.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:assets
```

**Dataset**:

- 100 assets across all categories
- 20 disposed assets
- 10 fully depreciated assets
- Assets with all depreciation methods represented
- Photos for 80% of assets
- Multi-entity transfers included

**Cleanup Command**:

```powershell
pnpm run seed:assets:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic company: "Demo Corp Inc." with $5M in assets
- 75 assets based on typical small business
- Complete depreciation history (2 years)
- Mix of asset categories (Buildings 20%, Equipment 50%, Vehicles 20%, Furniture 10%)
- Photos for all major assets
- Example disposal with gain/loss

**Regeneration**:

```powershell
pnpm run demo:reset:assets
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] Book Value = Cost - Accumulated Depreciation
- [ ] Acquisition Date ≤ Depreciation Start Date
- [ ] Salvage Value < Acquisition Cost
- [ ] Useful Life > 0
- [ ] Photo URLs are valid or null

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
- **Interactive Parts**: Mark with `"use client"` (photo upload, depreciation calculator, forms)

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

export async function runDepreciation(period: string) {
  // ... mutation logic
  revalidateTag("assets");
}
```

---

## 📊 Analytics & Audit Events

| Event                  | When                  | Properties                                                        |
| ---------------------- | --------------------- | ----------------------------------------------------------------- |
| Asset.Created          | After 2xx             | `asset_id`, `category`, `acquisition_cost`, `method`              |
| Asset.Updated          | After 2xx             | `asset_id`, changed fields                                        |
| Asset.Disposed         | Disposal complete     | `asset_id`, `disposal_date`, `proceeds`, `gain_loss`              |
| Asset.Transferred      | Transfer complete     | `asset_id`, `from_entity`, `to_entity`                            |
| Asset.Depreciation.Run | Depreciation executed | `period`, `assets_processed`, `total_depreciation`, `duration_ms` |
| Asset.Photo.Uploaded   | Photo upload success  | `asset_id`, `file_size`, `upload_duration_ms`                     |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Asset.Depreciation.Run", {
  period: "2025-10",
  assets_processed: 147,
  total_depreciation: 25000.0,
  duration_ms: duration,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/assets.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency Display**: Respect locale-specific currency symbols
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Amount Display**: Handle both comma and period decimal separators

### Keyboard Shortcuts

| Key      | Action              | Scope      |
| -------- | ------------------- | ---------- |
| `/`      | Focus search        | Asset list |
| `n`      | Add new asset       | Asset list |
| `d`      | Run depreciation    | Any page   |
| `↑ / ↓`  | Navigate assets     | Table      |
| `Enter`  | Open selected asset | Table      |
| `Escape` | Close modal/cancel  | Modal/Form |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateModal()],
  ["d", () => router.push("/assets/depreciation")],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                              | Duration | Rollback Trigger |
| ----------- | ---------------- | --------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                              | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, Lighthouse ≥90            | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, Depreciation accuracy 100% | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained      | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m8_fixed_assets: false,        // Master toggle
  m8_photo_upload: false,        // Photo upload feature
  m8_multi_method_depr: false,   // Multi-method depreciation
  m8_qr_codes: false,            // QR code generation
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/assets`, `/assets/depreciation`)
- P50/P95/P99 latency
- Photo upload success rate
- Depreciation calculation accuracy
- Asset disposal success rate

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Depreciation calculation error → immediate alert
- Photo upload failure rate > 10% → investigate
- P95 latency > 500ms for 10min → investigate

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m8_fixed_assets = false`

   ```powershell
   pnpm run flags:set m8_fixed_assets=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("assets");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/assets/*"
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
| Depreciation calculation error | Immediate rollback | No (auto-trigger) |
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

- ERPNext patterns: Fixed assets lifecycle management
- QuickBooks: Asset depreciation workflows
- Oracle EBS: Multi-method depreciation
- SAP: Asset disposal and gain/loss calculation

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Depreciation Calculation Accuracy

**Mitigation**: Multi-method validation; accounting review; audit trail; comprehensive test coverage

### Risk #2: Asset Disposal Compliance

**Mitigation**: Approval workflows for high-value assets; audit trail; gain/loss verification

### Risk #3: Photo Storage/Bandwidth

**Mitigation**: CDN with optimization; lazy loading; image compression; 10MB limit

### Risk #4: Data Integrity

**Mitigation**: Server-side validation; immutable acquisition cost after in-service; audit logs

---

## 📝 Implementation Guide

### Day 1: Asset Register (8 hours)

1. Build asset register table (3 hours)
2. Add photo upload capability (2 hours)
3. Implement QR code generation (2 hours)
4. Add search and filters (1 hour)

### Day 2: Depreciation & Disposal (4 hours)

1. Build depreciation interface (2 hours)
2. Create disposal workflow (2 hours)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Depreciation calculations accurate (straight-line, declining balance, units, MACRS)
- [ ] Gain/loss calculation correct (various scenarios)
- [ ] Photo upload works (validation, compression)
- [ ] QR code generation successful
- [ ] Book value calculation (cost - accumulated depreciation)
- [ ] Salvage value validation
- [ ] Useful life validation (range 1-50 years)
- [ ] useAssets hook fetches correctly
- [ ] useRunDepreciation handles errors properly
- [ ] useAssetDisposal calculates gain/loss
- [ ] Currency formatting displays correctly

### Integration Tests

- [ ] Create asset → appears in register
- [ ] Update asset → changes reflected
- [ ] Depreciation posts to GL correctly
- [ ] Disposal creates correct journal entries (gain/loss)
- [ ] Transfer updates ownership and entity
- [ ] Reports reflect accurate data
- [ ] Photo upload → URL stored correctly
- [ ] Permission-based UI hiding works
- [ ] Multi-method depreciation calculations

### E2E Tests

- [ ] User can navigate to assets page
- [ ] User can add new asset with all required fields
- [ ] User can upload asset photo
- [ ] User can run monthly depreciation
- [ ] User can dispose asset with gain/loss
- [ ] User can transfer asset between entities
- [ ] User can generate asset report
- [ ] User can view depreciation schedule
- [ ] Keyboard-only flow: create → depreciate → dispose
- [ ] QR code generation and download

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Photo upload accessible
- [ ] Screen reader announces depreciation progress
- [ ] Focus management correct (modals, forms)
- [ ] Color contrast meets WCAG 2.2 AA (AAA where practical)
- [ ] Axe: 0 serious/critical violations
- [ ] All asset photos have alt text
- [ ] Live regions announce depreciation completion
- [ ] All interactive elements have accessible names

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] All API endpoints return expected status codes
- [ ] Depreciation calculation results validated against spec

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for asset register, detail, depreciation page
- [ ] Dark/light theme variations
- [ ] Asset status badge variations (Active/Disposed/Fully Depreciated)
- [ ] Loading/error/empty states captured
- [ ] Photo upload progress indicators

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/assets/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] Photo upload completes in < 5s
- [ ] Depreciation run (1000 assets) completes in < 10s
- [ ] Asset register renders 500+ assets smoothly

---

## 📅 Timeline

| Day | Deliverable                        |
| --- | ---------------------------------- |
| 1   | Asset register with photos         |
| 1.5 | Depreciation and disposal complete |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries

### Enables These Modules

- M9: CAPEX Planning

---

## 🎯 Success Criteria

### Must Have

- [ ] Maintain asset register
- [ ] Calculate depreciation
- [ ] Dispose assets
- [ ] Transfer assets
- [ ] Generate asset reports

### Should Have

- [ ] Photo documentation
- [ ] QR code tagging
- [ ] Multi-method depreciation
- [ ] Bulk depreciation run

### Nice to Have

- [ ] Mobile asset verification app
- [ ] Barcode scanning
- [ ] IoT sensor integration
- [ ] Predictive maintenance

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/assets`, `/assets/[id]`, `/assets/depreciation`)
- [ ] All CRUD operations working (Create, Read, Update, Dispose, Transfer)
- [ ] Photo upload working (10MB limit, JPG/PNG)
- [ ] Depreciation calculation accurate (all methods)
- [ ] Gain/loss calculation correct on disposal
- [ ] Asset transfer preserves book value and depreciation
- [ ] Search and filtering working (category, status, location)
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
- [ ] E2E tests: All user flows covered (create → depreciate → dispose)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Asset creation flow
- Depreciation calculation flow
- Asset disposal flow with gain/loss
- Photo upload flow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/assets/*` routes
- [ ] TTFB: ≤70ms on staging (Server-Timing header)
- [ ] TTI: ≤200ms for `/assets` (Lighthouse CI)
- [ ] Photo upload: < 5s per image
- [ ] Depreciation run: < 10s for 1000 assets

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues
- [ ] All photos have meaningful alt text

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `Asset.Created`
  - `Asset.Updated`
  - `Asset.Disposed`
  - `Asset.Transferred`
  - `Asset.Depreciation.Run`
  - `Asset.Photo.Uploaded`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, depreciation accuracy)
- [ ] Depreciation calculation accuracy tracking

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Photo storage secured (CDN with signed URLs)
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] Audit trail maintained for all changes

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
  - `flags.m8_fixed_assets = false` (ready to enable)
  - `flags.m8_photo_upload = false` (phase 2)
  - `flags.m8_multi_method_depr = false` (phase 2)
  - `flags.m8_qr_codes = false` (phase 2)
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

**Previous**: M7 - Bank Reconciliation  
**Next**: M9 - CAPEX Planning
