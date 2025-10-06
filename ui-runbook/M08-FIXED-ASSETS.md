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

## 🔌 API Integration

```typescript
// apps/web/hooks/useAssets.ts
export function useAssets(filters = {}) {
  return useQuery({
    queryKey: ["assets", filters],
    queryFn: () => apiClient.GET("/api/assets", { query: filters }),
  });
}

export function useRunDepreciation() {
  return useMutation({
    mutationFn: (period) =>
      apiClient.POST("/api/assets/depreciation", { body: { period } }),
  });
}

export function useAssetDisposal(assetId: string) {
  return useMutation({
    mutationFn: (data) =>
      apiClient.POST("/api/assets/dispose", {
        body: { asset_id: assetId, ...data },
      }),
  });
}
```

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

- [ ] Depreciation calculations accurate
- [ ] Gain/loss calculation correct
- [ ] Photo upload works
- [ ] QR code generation successful

### Integration Tests

- [ ] Depreciation posts to GL
- [ ] Disposal creates correct entries
- [ ] Transfer updates ownership
- [ ] Reports reflect accurate data

### E2E Tests

- [ ] Add new asset with photo
- [ ] Run monthly depreciation
- [ ] Dispose asset with gain/loss
- [ ] Generate asset report

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

**Ready to build? Start with Day 1! 🚀**

**Previous**: M7 - Bank Reconciliation  
**Next**: M9 - CAPEX Planning
