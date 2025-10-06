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

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 4 endpoints implemented       |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/[path]` - [Endpoint description]
- ✅ `/api/[path]` - [Endpoint description]

**Total Endpoints**: 4

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
**File**: `apps/web/app/(dashboard)/[module]/[id]/page.tsx`

---

## 🔌 API Integration

```typescript
// apps/web/hooks/useIntangibleAssets.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function useIntangibleAssets(filters = {}) {
  return useQuery({
    queryKey: ["m10", filters],
    queryFn: () => apiClient.GET("/api/[path]", { query: filters }),
  });
}

export function useCreateIntangibleAssets() {
  return useMutation({
    mutationFn: (data) => apiClient.POST("/api/[path]", { body: data }),
    onSuccess: () => queryClient.invalidateQueries(["m10"]),
  });
}
```

---

## 📝 Implementation Guide

### Day 1: [Tasks] (8 hours)

1. [Task 1] (X hours)
2. [Task 2] (X hours)

**Total**: 1 day (8 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] [Test description]
- [ ] [Test description]
- [ ] [Test description]

### Integration Tests

- [ ] [Test description]
- [ ] [Test description]
- [ ] [Test description]

### E2E Tests

- [ ] [Test description]
- [ ] [Test description]
- [ ] [Test description]

---

## 📅 Timeline

| Day | Deliverable               |
| --- | ------------------------- |
| 1   | [Deliverable description] |

**Total**: 1 day (8 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries

### Enables These Modules

- [Dependent module 1]
- [Dependent module 2]

---

## 🎯 Success Criteria

### Must Have

- [ ] [Core requirement 1]
- [ ] [Core requirement 2]
- [ ] [Core requirement 3]

### Should Have

- [ ] [Enhancement 1]
- [ ] [Enhancement 2]

### Nice to Have

- [ ] [Optional feature 1]
- [ ] [Optional feature 2]

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M09 - [Previous Module]  
**Next**: M11 - [Next Module]
