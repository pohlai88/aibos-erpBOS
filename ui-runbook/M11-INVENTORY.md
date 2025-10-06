# 🚀 M11: Inventory - UI Implementation Runbook

**Module ID**: M11  
**Module Name**: Inventory  
**Priority**: MEDIUM  
**Phase**: 3 - Asset Management  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Inventory manages **stock tracking, costing methods, and valuation** for businesses with physical goods. Supports FIFO, LIFO, weighted average, and standard costing.

### Business Value

- Real-time inventory quantity and value tracking
- Multiple costing methods (FIFO, LIFO, weighted average)
- Lower of cost or market (LCM) adjustments
- Integration with purchasing and sales orders
- Inventory reserve and obsolescence management

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 8 endpoints implemented       |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/[path]` - [Endpoint description]
- ✅ `/api/[path]` - [Endpoint description]

**Total Endpoints**: 8

---

## 🎯 3 Killer Features

### 1. **Multi-Method Costing Calculator** 🧮

**Description**: Side-by-side comparison of inventory values using FIFO, LIFO, and weighted average methods.

**Why It's Killer**:

- Compare costing methods in real-time
- See impact on COGS and gross margin
- Switch costing methods with one click
- Audit trail of costing method changes
- Better than SAP's static costing reports

**Implementation**:

```typescript
import { Card, DataTable, Toggle } from "aibos-ui";

export default function CostingComparison() {
  const [method, setMethod] = useState("FIFO");
  const { inventory } = useInventory({ method });

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button
          variant={method === "FIFO" ? "primary" : "outline"}
          onClick={() => setMethod("FIFO")}
        >
          FIFO
        </Button>
        <Button
          variant={method === "LIFO" ? "primary" : "outline"}
          onClick={() => setMethod("LIFO")}
        >
          LIFO
        </Button>
        <Button
          variant={method === "WAVG" ? "primary" : "outline"}
          onClick={() => setMethod("WAVG")}
        >
          Weighted Average
        </Button>
      </div>

      <Card>
        <h3>Inventory Valuation Comparison</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <strong>FIFO Value:</strong> {formatCurrency(inventory.fifo_value)}
          </div>
          <div>
            <strong>LIFO Value:</strong> {formatCurrency(inventory.lifo_value)}
          </div>
          <div>
            <strong>WAVG Value:</strong> {formatCurrency(inventory.wavg_value)}
          </div>
        </div>
      </Card>

      <DataTable
        data={inventory.items}
        columns={[
          { key: "item_code", label: "Item" },
          { key: "quantity", label: "Qty" },
          { key: "unit_cost", label: "Unit Cost", render: formatCurrency },
          { key: "total_value", label: "Total Value", render: formatCurrency },
        ]}
      />
    </div>
  );
}
```

### 2. **Low Stock Alert Dashboard** ⚠️

**Description**: Real-time alerts for items below reorder point with automatic purchase order suggestions.

**Why It's Killer**:

- Prevent stockouts with proactive alerts
- Auto-calculate reorder quantities
- One-click purchase order creation
- Historical demand analysis
- Better than manual stock monitoring

**Implementation**:

```typescript
import { Alert, Badge, Button, Card } from "aibos-ui";

export default function LowStockAlerts() {
  const { lowStockItems } = useLowStockItems();
  const { createPO } = usePurchaseOrders();

  return (
    <div className="space-y-4">
      {lowStockItems.map((item) => (
        <Alert key={item.id} variant="warning">
          <div className="flex justify-between items-center">
            <div>
              <strong>{item.name}</strong>
              <div className="text-sm">
                Current: {item.quantity} | Reorder Point: {item.reorder_point}
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="warning">
                {item.days_until_stockout} days until stockout
              </Badge>
              <Button size="sm" onClick={() => createPO(item)}>
                Order {item.suggested_qty} units
              </Button>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
}
```

### 3. **Interactive Inventory Valuation Report** 📊

**Description**: Visual inventory valuation report with drill-down to item-level detail and LCM adjustments.

**Why It's Killer**:

- Real-time inventory value by category
- Lower of cost or market (LCM) highlights
- Obsolescence reserve calculations
- One-click drill-down to transactions
- Better than static Excel reports

**Implementation**:

```typescript
import { Chart, DataTable, Badge } from "aibos-ui";

export default function InventoryValuationReport() {
  const { valuation } = useInventoryValuation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Total Inventory</h3>
          <div className="text-3xl">{formatCurrency(valuation.total_cost)}</div>
        </Card>
        <Card>
          <h3>LCM Adjustments</h3>
          <div className="text-3xl text-red-600">
            {formatCurrency(valuation.lcm_adjustment)}
          </div>
        </Card>
        <Card>
          <h3>Obsolescence Reserve</h3>
          <div className="text-3xl text-orange-600">
            {formatCurrency(valuation.obsolescence_reserve)}
          </div>
        </Card>
        <Card>
          <h3>Net Realizable Value</h3>
          <div className="text-3xl">{formatCurrency(valuation.nrv)}</div>
        </Card>
      </div>

      <Chart
        type="pie"
        data={valuation.by_category}
        title="Inventory Value by Category"
      />

      <DataTable
        data={valuation.items}
        columns={[
          { key: "item", label: "Item" },
          { key: "quantity", label: "Qty" },
          { key: "cost", label: "Cost", render: formatCurrency },
          { key: "market", label: "Market", render: formatCurrency },
          {
            key: "lcm",
            label: "LCM",
            render: (val, row) => (
              <Badge variant={row.cost > row.market ? "warning" : "default"}>
                {formatCurrency(Math.min(row.cost, row.market))}
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
**File**: `apps/web/app/(dashboard)/[module]/[id]/page.tsx`

---

## 🔌 API Integration

```typescript
// apps/web/hooks/useInventory.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function useInventory(filters = {}) {
  return useQuery({
    queryKey: ["m11", filters],
    queryFn: () => apiClient.GET("/api/[path]", { query: filters }),
  });
}

export function useCreateInventory() {
  return useMutation({
    mutationFn: (data) => apiClient.POST("/api/[path]", { body: data }),
    onSuccess: () => queryClient.invalidateQueries(["m11"]),
  });
}
```

---

## 📝 Implementation Guide

### Day 1: [Tasks] (8 hours)

1. [Task 1] (X hours)
2. [Task 2] (X hours)
3. [Task 3] (X hours)

### Day 2: [Tasks] (8 hours)

1. [Task 1] (X hours)
2. [Task 2] (X hours)
3. [Task 3] (X hours)

**Total**: 2 days (16 hours)

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
| 2   | [Deliverable description] |

**Total**: 2 days (16 hours)

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

**Previous**: M10 - [Previous Module]  
**Next**: M12 - [Next Module]
