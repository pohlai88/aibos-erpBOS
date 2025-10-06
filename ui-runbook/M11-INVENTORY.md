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

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-inventory-costing], [ADR-###-lcm-methodology], [ADR-###-stock-tracking]

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

- ✅ `/api/inventory` - Inventory list with filters
- ✅ `/api/inventory/[id]` - Item details
- ✅ `/api/inventory/valuation` - Run valuation report
- ✅ `/api/inventory/adjust` - Adjust quantity/cost
- ✅ `/api/inventory/lcm` - Calculate LCM adjustments
- ✅ `/api/inventory/low-stock` - Low stock alerts
- ✅ `/api/inventory/reorder` - Reorder point analysis
- ✅ `/api/inventory/obsolescence` - Calculate obsolescence reserve

**Total Endpoints**: 8

### Risks & Blockers

| Risk                          | Impact | Mitigation                                                         | Owner    |
| ----------------------------- | ------ | ------------------------------------------------------------------ | -------- |
| Costing method accuracy       | HIGH   | Comprehensive test coverage; auditor validation; peer review       | @finance |
| LCM calculation complexity    | HIGH   | Market data integration; documented methodology; review cycle      | @finance |
| Multi-location tracking       | MED    | Clear location hierarchy; barcode scanning; cycle count validation | @ops     |
| Negative inventory prevention | HIGH   | Real-time validation; reserve inventory; workflow approval         | @backend |

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
**File**: `apps/web/app/(dashboard)/inventory/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                                | Target          | Measurement          |
| ------------------------------------- | --------------- | -------------------- |
| TTFB (staging)                        | ≤ 70ms          | Server timing header |
| Client TTI for `/inventory`           | ≤ 200ms         | Lighthouse CI        |
| Valuation report generation           | < 5s            | Progress tracking    |
| Low stock dashboard load (1000 items) | < 1s            | APM traces           |
| UI bundle size                        | ≤ 250KB gzipped | Webpack analyzer     |
| Costing method switch                 | < 500ms         | React profiler       |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to all inventory operations
- **Focus Management**: Focus trap in modals; visible indicators
- **ARIA**: Live regions for low stock alerts; proper roles
- **Screen Reader**: All quantities and values announced; alert context communicated
- **Axe Target**: 0 serious/critical violations
- **Tables**: Large tables with proper headers and navigation

### Security

| Layer           | Requirement                                                                |
| --------------- | -------------------------------------------------------------------------- |
| RBAC Scopes     | `inventory.read`, `inventory.write`, `inventory.adjust`, `inventory.admin` |
| Enforcement     | Server-side on all endpoints                                               |
| Data Exposure   | Only show inventory user has permission to view                            |
| Cost Visibility | Mask cost data for non-finance users (show quantity only)                  |
| Audit Trail     | All adjustments, costing changes, and valuations logged                    |

#### UI Permissions Matrix

| Role             | View | Create | Edit | Adjust Qty | Adjust Cost | LCM | Obsolescence | Admin |
| ---------------- | ---- | ------ | ---- | ---------- | ----------- | --- | ------------ | ----- |
| inventory.read   | ✅   | ❌     | ❌   | ❌         | ❌          | ❌  | ❌           | ❌    |
| inventory.write  | ✅   | ✅     | ✅   | ✅         | ❌          | ❌  | ❌           | ❌    |
| inventory.adjust | ✅   | ✅     | ✅   | ✅         | ✅          | ✅  | ✅           | ❌    |
| inventory.admin  | ✅   | ✅     | ✅   | ✅         | ✅          | ✅  | ✅           | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful inventory transactions
- **SLA Dashboards**: Real-time metrics on item counts, low stock alerts, valuation accuracy
- **Events Emitted**: `Inventory.Created`, `Inventory.Adjusted`, `Inventory.Valued`, `Inventory.LCMApplied`
- **Logging**: Structured logs with correlation IDs for all mutations
- **Tracing**: Distributed tracing for valuation calculations
- **Monitoring**: Negative inventory prevention, low stock alerting accuracy

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Inventory Rules

| Rule                     | Enforcement                                                         |
| ------------------------ | ------------------------------------------------------------------- |
| **Negative Inventory**   | Prevented by default; requires `allow_negative` flag + approval     |
| **Costing Method**       | FIFO, LIFO, Weighted Average, Standard; requires approval to change |
| **Unit Cost**            | Must be > 0; historical costs preserved                             |
| **Quantity**             | Non-negative unless `allow_negative` enabled                        |
| **LCM Adjustment**       | Cost vs. Market; use lower value; auto-calculate or manual entry    |
| **Reorder Point**        | Must be ≥ 0; triggers low stock alert                               |
| **Obsolescence Reserve** | % of inventory value; requires justification and approval           |
| **Location Tracking**    | Multi-location support; transfers require from/to locations         |

### Currency & Rounding

- **Display**: Presentation currency from tenant settings
- **Rounding Policy**: HALF_UP for weighted average calculations
- **Multi-Currency**: Items purchased in foreign currency; track FX at purchase date
- **Valuation**: Use functional currency for all valuation reports

### Archive Semantics

- **Soft Delete**: Set `inactive_date`; maintain historical records
- **Guard Rails**:
  - ❌ Deny if item has non-zero quantity
  - ❌ Deny if item has open purchase/sales orders
  - ❌ Deny if item used in active production
  - ✅ Allow if fully depleted and no open transactions

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                              | User Action          |
| --------------------- | --------------------------------------- | -------------------- |
| **Empty**             | "No inventory items"                    | "Add Item"           |
| **Loading**           | Skeleton item cards                     | N/A                  |
| **Error**             | Error message + retry                   | Retry / Support      |
| **Calculating**       | Progress bar "Calculating valuation..." | Wait                 |
| **Low Stock**         | Orange warning "Below reorder point"    | Order more           |
| **Out of Stock**      | Red badge "Out of Stock"                | Backorder / Order    |
| **Negative Stock**    | Red alert "Negative inventory detected" | Investigate / Adjust |
| **Obsolete**          | Gray badge "Obsolete"                   | Reserve / Write off  |
| **LCM Adjustment**    | Yellow warning "Market < Cost"          | Apply LCM            |
| **Permission Denied** | "Access restricted"                     | Back                 |

### Form Validation

- **Inline Errors**: Zod messages below each field
- **Submit State**: Button disabled until dirty & valid
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal
- **Real-time Validation**: Check quantity > 0 (unless allowed), cost > 0 as user types

### Network Errors

| HTTP Status | UI Message                                        | Action              |
| ----------- | ------------------------------------------------- | ------------------- |
| 400         | "Invalid inventory data. Check your input."       | Inline field errors |
| 401         | "Session expired. Please log in again."           | Redirect to login   |
| 403         | "You don't have permission for cost adjustments." | Hide action         |
| 404         | "Item not found. It may have been deleted."       | Return to list      |
| 409         | "Negative inventory not allowed for this item."   | Show conflict modal |
| 422         | "Validation failed: Quantity must be ≥ 0."        | Inline errors       |
| 500         | "Operation failed. Our team has been notified."   | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/inventory.json`.

### Page Titles & Headers

| Context             | Copy                        | i18n Key                    |
| ------------------- | --------------------------- | --------------------------- |
| List Page           | "Inventory"                 | `inventory.list.title`      |
| Detail Page         | "Item Details"              | `inventory.detail.title`    |
| Create Modal        | "Add Inventory Item"        | `inventory.create.title`    |
| Valuation Report    | "Inventory Valuation"       | `inventory.valuation.title` |
| Low Stock Dashboard | "Low Stock Alerts"          | `inventory.lowStock.title`  |
| Costing Comparison  | "Costing Method Comparison" | `inventory.costing.title`   |
| LCM Adjustments     | "Lower of Cost or Market"   | `inventory.lcm.title`       |

### State Messages

| State             | Title                         | Message                                             | Action Button       | i18n Key                       |
| ----------------- | ----------------------------- | --------------------------------------------------- | ------------------- | ------------------------------ |
| Empty             | "No inventory items"          | "Add your first inventory item to begin tracking"   | "Add Item"          | `inventory.empty.*`            |
| Loading           | —                             | —                                                   | —                   | —                              |
| Error             | "Unable to load inventory"    | "Something went wrong. Our team has been notified." | "Retry" / "Support" | `inventory.error.*`            |
| No Results        | "No items found"              | "Try adjusting your filters or search terms"        | "Clear Filters"     | `inventory.noResults.*`        |
| Permission Denied | "Access restricted"           | "You don't have permission to view inventory."      | "Back"              | `inventory.permissionDenied.*` |
| Calculating       | "Calculating..."              | "Running valuation report. This may take a moment." | —                   | `inventory.calculating.*`      |
| Low Stock         | "Low stock alert"             | "{count} items below reorder point"                 | "View Items"        | `inventory.lowStock.*`         |
| Out of Stock      | "Out of stock"                | "{count} items out of stock"                        | "View Items"        | `inventory.outOfStock.*`       |
| Negative Stock    | "Negative inventory detected" | "Investigate and adjust immediately"                | "View Items"        | `inventory.negative.*`         |

### Action Confirmations

| Action                | Title                    | Message                                                              | Confirm Button | Cancel Button | i18n Key                           |
| --------------------- | ------------------------ | -------------------------------------------------------------------- | -------------- | ------------- | ---------------------------------- |
| Adjust Quantity       | "Adjust quantity?"       | "Adjust {item} from {old_qty} to {new_qty}?"                         | "Adjust"       | "Cancel"      | `inventory.adjust.confirm.*`       |
| Adjust Cost           | "Adjust cost?"           | "Change cost from {old_cost} to {new_cost}? This affects valuation." | "Adjust"       | "Cancel"      | `inventory.adjustCost.confirm.*`   |
| Apply LCM             | "Apply LCM adjustment?"  | "Write down {item} from {cost} to {market}? Loss: {amount}."         | "Apply"        | "Cancel"      | `inventory.lcm.confirm.*`          |
| Change Costing Method | "Change costing method?" | "Switch from {old} to {new}? This recalculates all valuations."      | "Change"       | "Cancel"      | `inventory.changeMethod.confirm.*` |
| Write Off Obsolete    | "Write off obsolete?"    | "Write off {item} with value {amount}? This creates GL entry."       | "Write Off"    | "Cancel"      | `inventory.writeOff.confirm.*`     |

### Success Messages (Toast)

| Action                 | Message                                     | i18n Key                         |
| ---------------------- | ------------------------------------------- | -------------------------------- |
| Item Created           | "Item '{name}' created successfully"        | `inventory.create.success`       |
| Item Updated           | "Item '{name}' updated successfully"        | `inventory.update.success`       |
| Quantity Adjusted      | "Quantity adjusted for {name}"              | `inventory.adjust.success`       |
| Cost Adjusted          | "Cost adjusted for {name}"                  | `inventory.adjustCost.success`   |
| LCM Applied            | "LCM adjustment applied: {count} items"     | `inventory.lcm.success`          |
| Valuation Completed    | "Valuation report completed: {total_value}" | `inventory.valuation.success`    |
| Costing Method Changed | "Costing method changed to {method}"        | `inventory.changeMethod.success` |

### Error Messages (Toast)

| Scenario               | Message                                               | i18n Key                      |
| ---------------------- | ----------------------------------------------------- | ----------------------------- |
| Create Failed          | "Failed to create item. Please try again."            | `inventory.create.error`      |
| Adjust Failed          | "Failed to adjust quantity. Check item status."       | `inventory.adjust.error`      |
| Negative Inventory     | "Negative inventory not allowed for this item."       | `inventory.errorNegative`     |
| Invalid Quantity       | "Quantity must be ≥ 0."                               | `inventory.errorQuantity`     |
| Invalid Cost           | "Unit cost must be > 0."                              | `inventory.errorCost`         |
| LCM Calculation Failed | "LCM calculation failed. Verify market prices."       | `inventory.lcm.error`         |
| Costing Method Locked  | "Cannot change costing method. Period is closed."     | `inventory.errorMethodLocked` |
| Item In Use            | "Cannot delete item. Used in open transactions."      | `inventory.errorInUse`        |
| Network Error          | "Network error. Check your connection and try again." | `inventory.error.network`     |

### Form Labels & Help Text

| Field            | Label              | Placeholder          | Help Text                                  | i18n Key                          |
| ---------------- | ------------------ | -------------------- | ------------------------------------------ | --------------------------------- |
| Item Code        | "Item Code"        | "e.g., WIDGET-001"   | "Unique identifier for this item"          | `inventory.field.itemCode.*`      |
| Item Name        | "Item Name"        | "e.g., Widget A"     | "Descriptive name for this item"           | `inventory.field.itemName.*`      |
| Category         | "Category"         | "Select category"    | "Product category for reporting"           | `inventory.field.category.*`      |
| Unit of Measure  | "Unit of Measure"  | "e.g., EA, BOX, LBS" | "Unit for tracking quantity"               | `inventory.field.uom.*`           |
| Unit Cost        | "Unit Cost"        | "0.00"               | "Cost per unit (before markup)"            | `inventory.field.unitCost.*`      |
| Quantity         | "Quantity on Hand" | "0"                  | "Current inventory quantity"               | `inventory.field.quantity.*`      |
| Reorder Point    | "Reorder Point"    | "0"                  | "Trigger low stock alert at this quantity" | `inventory.field.reorderPoint.*`  |
| Reorder Quantity | "Reorder Quantity" | "0"                  | "Suggested quantity to order"              | `inventory.field.reorderQty.*`    |
| Costing Method   | "Costing Method"   | "Select method"      | "FIFO, LIFO, or Weighted Average"          | `inventory.field.costingMethod.*` |
| Location         | "Location"         | "Select location"    | "Storage location or warehouse"            | `inventory.field.location.*`      |

### Keyboard Shortcuts Help

| Shortcut | Description             | i18n Key                       |
| -------- | ----------------------- | ------------------------------ |
| `/`      | "Focus search"          | `inventory.shortcuts.search`   |
| `n`      | "Add new item"          | `inventory.shortcuts.new`      |
| `v`      | "Run valuation report"  | `inventory.shortcuts.value`    |
| `l`      | "View low stock alerts" | `inventory.shortcuts.lowStock` |
| `↑ / ↓`  | "Navigate items"        | `inventory.shortcuts.navigate` |
| `Enter`  | "Open selected item"    | `inventory.shortcuts.open`     |
| `Escape` | "Close modal/cancel"    | `inventory.shortcuts.cancel`   |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useInventory.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useInventory(filters = {}) {
  const queryClient = useQueryClient();

  const {
    data: items,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["inventory", "list", filters],
    queryFn: () => apiClient.GET("/api/inventory", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });

  const createItem = useMutation({
    mutationFn: (data) => apiClient.POST("/api/inventory", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(`Item '${data.name}' created successfully`);
    },
    onError: (error) => {
      if (error.status === 422) {
        toast.error("Validation failed. Check your input.");
      } else {
        toast.error("Failed to create item.");
      }
    },
  });

  const updateItem = useMutation({
    mutationFn: ({ id, data }) =>
      apiClient.PUT("/api/inventory/[id]", { params: { id }, body: data }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "detail", id] });
      toast.success("Item updated successfully");
    },
  });

  return {
    items: items || [],
    isLoading,
    error,
    createItem: createItem.mutate,
    updateItem: updateItem.mutate,
  };
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: ["inventory", "detail", id],
    queryFn: () => apiClient.GET("/api/inventory/[id]", { params: { id } }),
    staleTime: 30_000, // 30s
    enabled: !!id,
    select: (response) => response.data,
  });
}

export function useAdjustInventory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { item_id: string; adjustment_type: string; quantity: number; reason: string }) =>
      apiClient.POST("/api/inventory/adjust", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(`Quantity adjusted for ${data.item_name}`);
    },
    onError: (error) => {
      if (error.status === 409) {
        toast.error("Negative inventory not allowed for this item.");
      } else {
        toast.error("Failed to adjust quantity. Check item status.");
      }
    },
  });
}

export function useRunValuation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { method?: string; as_of_date: string }) =>
      apiClient.POST("/api/inventory/valuation", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inventory", "valuation"] });
      toast.success(`Valuation report completed: ${data.total_value}`);
    },
    onError: () => {
      toast.error("Valuation calculation failed.");
    },
  });
}

export function useApplyLCM() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { item_ids: string[]; as_of_date: string }) =>
      apiClient.POST("/api/inventory/lcm", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(`LCM adjustment applied: ${data.items_adjusted} items`);
    },
    onError: () => {
      toast.error("LCM calculation failed. Verify market prices.");
    },
  });
}

export function useLowStockItems() {
  return useQuery({
    queryKey: ["inventory", "low-stock"],
    queryFn: () => apiClient.GET("/api/inventory/low-stock"),
    staleTime: 5 * 60_000, // 5min
    refetchInterval: 5 * 60_000, // Refresh every 5min
    select: (response) => response.data,
  });
}

export function useChangeCosting Method(itemId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { method: string; effective_date: string }) =>
      apiClient.POST("/api/inventory/[id]/costing-method", {
        params: { id: itemId },
        body: data,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory", "detail", itemId] });
      toast.success(`Costing method changed to ${data.method}`);
    },
    onError: (error) => {
      if (error.status === 403) {
        toast.error("Cannot change costing method. Period is closed.");
      } else {
        toast.error("Failed to change costing method.");
      }
    },
  });
}
```

### Error Mapping

| API Error         | User Message                                      | UI Action            |
| ----------------- | ------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid inventory data. Check your input."       | Inline field errors  |
| 409 (Conflict)    | "Negative inventory not allowed for this item."   | Show conflict modal  |
| 422 (Validation)  | "Validation failed: {field_errors}"               | Inline errors        |
| 403 (Forbidden)   | "You don't have permission for cost adjustments." | Hide action buttons  |
| 500 (Server)      | "Operation failed. Our team has been notified."   | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Valuation calculations**: 10s timeout; complex calculation

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["inventory", "list", { filters }][("inventory", "detail", itemId)][
  ("inventory", "valuation")
][("inventory", "low-stock")];
```

### Invalidation Rules

| Action          | Invalidates                                                                          |
| --------------- | ------------------------------------------------------------------------------------ |
| Create Item     | `["inventory", "list"]`                                                              |
| Update Item     | `["inventory", "list"]`, `["inventory", "detail", id]`                               |
| Adjust Quantity | `["inventory", "list"]`, `["inventory", "detail", id]`, `["inventory", "valuation"]` |
| Run Valuation   | `["inventory", "valuation"]`                                                         |
| Apply LCM       | `["inventory", "list"]`, all `["inventory", "detail"]`, `["inventory", "valuation"]` |
| Change Costing  | `["inventory", "list"]`, `["inventory", "detail", id]`, `["inventory", "valuation"]` |

### Stale Time

| Query Type  | Stale Time | Reasoning                                      |
| ----------- | ---------- | ---------------------------------------------- |
| Item List   | 30s        | Frequent changes; quantities update often      |
| Item Detail | 30s        | Moderate changes                               |
| Low Stock   | 5min       | Refresh periodically for alerts                |
| Valuation   | 10min      | Expensive calculation; changes less frequently |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("inventory"); // After mutations
revalidateTag(`inventory-${itemId}`); // Specific item
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/inventory.fixtures.ts`

**Datasets**:

- `minimalItems`: 10 items (basic set)
- `standardItems`: 100 items with various quantities, costs
- `largeInventory`: 1000 items (for performance testing)
- `edgeCases`: Special scenarios

**Edge Cases Covered**:

- Items with zero quantity (out of stock)
- Items with negative quantity (if allowed)
- Items below reorder point
- Items with cost > market (LCM adjustment needed)
- Items with multiple locations
- Items with various costing methods (FIFO, LIFO, WAVG)

```typescript
// Example fixture structure
export const standardItems: InventoryItemFixture[] = [
  {
    id: "inv_1",
    item_code: "WIDGET-001",
    name: "Widget A",
    category: "Electronics",
    quantity: 500,
    unit_cost: 10.5,
    reorder_point: 100,
    reorder_quantity: 500,
    costing_method: "FIFO",
    location: "Warehouse A",
    status: "Active",
  },
  // ... 99 more
];
```

### E2E Seed Data

**Location**: `tests/seeds/inventory.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:inventory
```

**Dataset**:

- 200 items across multiple categories
- 20 items below reorder point
- 10 items out of stock
- 5 items requiring LCM adjustment
- Mix of costing methods
- Multi-location tracking

**Cleanup Command**:

```powershell
pnpm run seed:inventory:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic company: "Demo Corp Inc." with $2M in inventory
- 150 items demonstrating all features
- Complete transaction history
- Low stock alerts configured
- Example valuation reports
- LCM adjustments applied

**Regeneration**:

```powershell
pnpm run demo:reset:inventory
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] Unit Cost > 0 for all items
- [ ] Quantity ≥ 0 (unless `allow_negative`)
- [ ] Reorder Point ≥ 0
- [ ] Valid costing method (FIFO, LIFO, WAVG, STANDARD)
- [ ] Valid location references

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
- **Interactive Parts**: Mark with `"use client"` (valuation reports, low stock dashboard)

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

export async function adjustInventory(data) {
  // ... mutation logic
  revalidateTag("inventory");
}
```

---

## 📊 Analytics & Audit Events

| Event                    | When                | Properties                                                  |
| ------------------------ | ------------------- | ----------------------------------------------------------- |
| Inventory.Item.Created   | After 2xx           | `item_id`, `item_code`, `quantity`, `unit_cost`             |
| Inventory.Item.Updated   | After 2xx           | `item_id`, changed fields                                   |
| Inventory.Adjusted       | Adjustment complete | `item_id`, `adjustment_type`, `quantity`, `reason`          |
| Inventory.Valuation.Run  | Valuation complete  | `method`, `total_value`, `items_counted`, `duration_ms`     |
| Inventory.LCM.Applied    | LCM adjustment done | `items_adjusted`, `total_writedown`, `as_of_date`           |
| Inventory.CostingChanged | Method changed      | `item_id`, `old_method`, `new_method`, `effective_date`     |
| Inventory.LowStock.Alert | Below reorder point | `item_id`, `current_qty`, `reorder_point`, `days_until_out` |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Inventory.Adjusted", {
  item_id: item.id,
  adjustment_type: "manual",
  quantity: adjustmentQuantity,
  reason: adjustmentReason,
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/inventory.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency Display**: Respect locale-specific currency symbols
- **RTL Support**: CSS logical properties; test with Arabic locale
- **Quantity Formatting**: Handle various units of measure (EA, BOX, LBS, etc.)

### Keyboard Shortcuts

| Key      | Action                | Scope          |
| -------- | --------------------- | -------------- |
| `/`      | Focus search          | Inventory list |
| `n`      | Add new item          | Inventory list |
| `v`      | Run valuation report  | Any page       |
| `l`      | View low stock alerts | Any page       |
| `↑ / ↓`  | Navigate items        | Table          |
| `Enter`  | Open selected item    | Table          |
| `Escape` | Close modal/cancel    | Modal/Form     |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["n", () => openCreateModal()],
  ["v", () => runValuation()],
  ["l", () => router.push("/inventory/low-stock")],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                           | Duration | Rollback Trigger |
| ----------- | ---------------- | ------------------------------------------ | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                           | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, Lighthouse ≥90         | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, Valuation accuracy 100% | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained   | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m11_inventory: false,             // Master toggle
  m11_inventory_lcm: false,         // LCM adjustments
  m11_inventory_costing_compare: false, // Costing comparison
  m11_inventory_multi_location: false,  // Multi-location tracking
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/inventory`, `/inventory/valuation`)
- P50/P95/P99 latency
- Valuation calculation accuracy
- Low stock alert accuracy
- Negative inventory prevention success rate

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Valuation calculation error → immediate alert
- Negative inventory detected → alert ops
- P95 latency > 500ms for 10min → investigate

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m11_inventory = false`

   ```powershell
   pnpm run flags:set m11_inventory=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("inventory");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/inventory/*"
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

| Scenario                    | Action             | Approval Required |
| --------------------------- | ------------------ | ----------------- |
| Error rate > 5%             | Immediate rollback | No (auto-trigger) |
| Valuation calculation error | Immediate rollback | No (auto-trigger) |
| Negative inventory bug      | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%             | Partial rollback   | On-call engineer  |
| P95 latency > 1s            | Investigate first  | On-call engineer  |
| Data corruption/loss        | Immediate rollback | No (auto-trigger) |

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

- ASC 330: Inventory (US GAAP)
- IAS 2: Inventories (IFRS)
- ERPNext: Inventory costing workflows
- SAP: Valuation procedures

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Costing Method Accuracy

**Mitigation**: Comprehensive test coverage; auditor validation; peer review; documented methodology

### Risk #2: LCM Calculation Complexity

**Mitigation**: Market data integration; documented methodology; third-party validation; regular review

### Risk #3: Multi-Location Tracking

**Mitigation**: Clear location hierarchy; barcode scanning; cycle count validation; transfer workflows

### Risk #4: Negative Inventory Prevention

**Mitigation**: Real-time validation; reserve inventory feature; workflow approval; comprehensive audit trail

---

## 📝 Implementation Guide

### Day 1: Item Management & Valuation (8 hours)

1. Build inventory item table (3 hours)
2. Create valuation report (3 hours)
3. Implement costing method comparison (2 hours)

### Day 2: Low Stock & LCM (8 hours)

1. Build low stock dashboard (3 hours)
2. Create LCM adjustment workflow (3 hours)
3. Implement quantity adjustment modal (2 hours)

**Total**: 2 days (16 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] FIFO costing calculation accurate
- [ ] LIFO costing calculation accurate
- [ ] Weighted average costing accurate
- [ ] LCM adjustment logic (cost vs. market)
- [ ] Negative inventory prevention
- [ ] Low stock detection (below reorder point)
- [ ] useInventory hook fetches correctly
- [ ] Currency formatting displays correctly

### Integration Tests

- [ ] Create item → appears in list
- [ ] Adjust quantity → valuation updates
- [ ] Apply LCM → write-down recorded
- [ ] Change costing method → all values recalculated
- [ ] Low stock alert triggers correctly
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] User can navigate to inventory page
- [ ] User can create new item with all fields
- [ ] User can adjust quantity with reason
- [ ] User can run valuation report
- [ ] User can apply LCM adjustments
- [ ] User can view low stock dashboard
- [ ] User can compare costing methods
- [ ] Keyboard-only flow: create → adjust → value

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Valuation report accessible
- [ ] Screen reader announces quantity changes
- [ ] Focus management correct (modals, forms)
- [ ] Color contrast meets WCAG 2.2 AA (AAA where practical)
- [ ] Axe: 0 serious/critical violations
- [ ] Large tables have proper headers and navigation

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] All API endpoints return expected status codes
- [ ] Valuation results validated against spec

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for list, valuation, low stock pages
- [ ] Dark/light theme variations
- [ ] Item status badge variations
- [ ] Loading/error/empty states captured

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/inventory/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] Valuation calculation completes in < 5s
- [ ] Low stock dashboard loads 1000 items in < 1s
- [ ] Costing method switch < 500ms

---

## 📅 Timeline

| Day | Deliverable                                      |
| --- | ------------------------------------------------ |
| 1   | Item management + Valuation + Costing comparison |
| 2   | Low stock dashboard + LCM + Adjustments          |

**Total**: 2 days (16 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries

### Enables These Modules

- M36: Purchase Orders (inventory receipt)
- M37: Sales Orders (inventory fulfillment)
- COGS calculation modules

---

## 🎯 Success Criteria

### Must Have

- [ ] Create and manage inventory items
- [ ] Multiple costing methods (FIFO, LIFO, Weighted Average)
- [ ] Run valuation reports
- [ ] Quantity adjustments with audit trail
- [ ] LCM adjustments
- [ ] Low stock alerts
- [ ] Search and filtering (category, status, location)

### Should Have

- [ ] Costing method comparison
- [ ] Multi-location tracking
- [ ] Reorder point analysis
- [ ] Obsolescence reserve calculation

### Nice to Have

- [ ] Barcode scanning integration
- [ ] AI-powered demand forecasting
- [ ] Automated reorder suggestions
- [ ] Inventory optimization recommendations

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/inventory`, `/inventory/[id]`, `/inventory/valuation`, `/inventory/low-stock`)
- [ ] All CRUD operations working (Create, Read, Update, Adjust, LCM, Valuation)
- [ ] Multiple costing methods working (FIFO, LIFO, Weighted Average)
- [ ] Valuation reports accurate
- [ ] LCM adjustments working
- [ ] Low stock alerts functioning
- [ ] Quantity adjustments with reasons
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
- [ ] Integration tests: All CRUD + costing operations covered
- [ ] E2E tests: All user flows covered (create → adjust → value → LCM)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Item creation flow
- Quantity adjustment flow
- Valuation calculation flow
- LCM adjustment flow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/inventory/*` routes
- [ ] TTFB: ≤70ms on staging (Server-Timing header)
- [ ] TTI: ≤200ms for `/inventory` (Lighthouse CI)
- [ ] Valuation calculation: < 5s
- [ ] Low stock dashboard: < 1s for 1000 items
- [ ] Costing method switch: < 500ms

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues
- [ ] Large tables have proper headers and navigation

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `Inventory.Item.Created`
  - `Inventory.Adjusted`
  - `Inventory.Valuation.Run`
  - `Inventory.LCM.Applied`
  - `Inventory.CostingChanged`
  - `Inventory.LowStock.Alert`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, valuation accuracy, negative inventory)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Cost data masked for non-finance users
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] Audit trail maintained for all adjustments and costing changes

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
  - `flags.m11_inventory = false` (ready to enable)
  - `flags.m11_inventory_lcm = false` (phase 2)
  - `flags.m11_inventory_costing_compare = false` (phase 2)
  - `flags.m11_inventory_multi_location = false` (phase 2)
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

**Previous**: M10 - Intangible Assets  
**Next**: M12 - Revenue Recognition
