# 🚀 M36: Purchase Orders - UI Implementation Runbook

**Module ID**: M36  
**Module Name**: Purchase Orders  
**Priority**: MEDIUM  
**Phase**: 10 - Extended Modules  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

M36 delivers comprehensive purchase order management with requisition workflows, vendor catalogs, three-way matching, and budget controls. This module streamlines procurement, enforces spending policies, and provides complete visibility into purchase commitments.

### Business Value

- **Procurement Control**: Enforce purchasing policies and approval limits on all purchases
- **Spend Visibility**: Real-time view of purchase commitments and open POs
- **Vendor Management**: Centralized vendor catalog with pricing and terms
- **AP Automation**: Three-way match automation reduces invoice processing from 5 days to 1 day
- **Budget Enforcement**: Prevent overspending with real-time budget checking

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 10 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/purchase-orders` - PO management
- ✅ `/api/purchase-orders/requisitions` - PR workflow
- ✅ `/api/purchase-orders/matching` - Three-way match

**Total Endpoints**: 10

---

## 🎯 3 Killer Features

### 1. **PO Requisition Builder** 🚀

**Description**: Intuitive purchase requisition form with vendor catalog integration, budget checking, automated routing, and multi-level approval workflows. Features quick-add from catalog, bulk line entry, and requisition templates.

**Why It's Killer**:

- **Catalog Integration**: Search vendor catalog and add items with 2 clicks (SAP requires manual entry)
- **Budget Checking**: Real-time budget availability before submission (Oracle checks after approval)
- **Smart Routing**: Automated approval routing based on amount/category (competitors use manual routing)
- **Measurable Impact**: Reduce requisition creation time from 30 min to 5 min
- **Vs Coupa/Ariba**: Native ERP integration eliminates data sync issues

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
  Search,
} from "aibos-ui";
import {
  usePurchaseRequisition,
  useVendorCatalog,
} from "@/hooks/usePurchaseOrders";

export default function PORequisitionBuilder() {
  const { createPR, checkBudget } = usePurchaseRequisition();
  const { searchCatalog, catalogItems } = useVendorCatalog();
  const [lineItems, setLineItems] = useState([]);

  return (
    <div className="space-y-6">
      <Card title="Create Purchase Requisition">
        <Form onSubmit={createPR}>
          <div className="grid grid-cols-2 gap-6">
            <Select
              label="Vendor"
              name="vendor_id"
              options={vendors}
              required
              searchable
            />
            <Input
              type="date"
              label="Needed By Date"
              name="needed_by_date"
              required
            />
            <Select
              label="Ship To Location"
              name="ship_to_location"
              options={locations}
            />
            <Select
              label="Department"
              name="department"
              options={departments}
            />
          </div>

          <Card title="Line Items" className="mt-6">
            <Search
              placeholder="Search vendor catalog..."
              onSearch={searchCatalog}
              results={catalogItems}
              onSelectResult={(item) => addLineItem(item)}
            />

            <DataTable
              data={lineItems}
              columns={[
                { key: "item_description", label: "Description" },
                {
                  key: "quantity",
                  label: "Qty",
                  editable: true,
                  type: "number",
                },
                {
                  key: "unit_price",
                  label: "Unit Price",
                  render: (_, row) => `$${row.unit_price.toFixed(2)}`,
                },
                {
                  key: "line_total",
                  label: "Total",
                  render: (_, row) =>
                    `$${(row.quantity * row.unit_price).toFixed(2)}`,
                },
                {
                  key: "budget",
                  label: "Budget",
                  render: (_, row) => (
                    <Badge variant={row.budget_available ? "success" : "error"}>
                      {row.budget_available ? "Available" : "Exceeded"}
                    </Badge>
                  ),
                },
                {
                  key: "actions",
                  label: "",
                  render: (_, row) => (
                    <Button
                      size="sm"
                      variant="error"
                      onClick={() => removeLineItem(row.id)}
                    >
                      Remove
                    </Button>
                  ),
                },
              ]}
            />

            <Button variant="outline" onClick={addEmptyLine}>
              + Add Line Item
            </Button>
          </Card>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Total:</span>
              <span className="font-bold">${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <Textarea
            label="Business Justification"
            name="justification"
            rows={3}
          />

          <div className="flex gap-4">
            <Button type="submit" variant="primary">
              Submit for Approval
            </Button>
            <Button type="button" variant="outline">
              Save as Draft
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
```

### 2. **Three-Way Match Automation** ⚡

**Description**: Automated matching of purchase orders, receiving documents, and invoices with configurable tolerance settings. Features exception management, auto-posting for perfect matches, and variance analysis.

**Why It's Killer**:

- **Automated Matching**: 90% of invoices auto-match and post (SAP requires manual matching)
- **Tolerance Control**: Configure price/quantity tolerances by vendor/category
- **Exception Workflow**: Smart routing of mismatches to appropriate approvers
- **Measurable Impact**: Reduce invoice processing from 5 days to 1 day, cut AP headcount needs by 30%

**Implementation**:

```typescript
import { Card, Badge, DataTable, Button, Alert } from "aibos-ui";
import { useThreeWayMatch, useResolveMatch } from "@/hooks/usePurchaseOrders";

export default function ThreeWayMatchAutomation() {
  const { matches, stats } = useThreeWayMatch();
  const { approve, resolve } = useResolveMatch();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Perfect Matches</h3>
          <div className="text-4xl font-bold text-green-600">
            {stats.perfect_matches}
          </div>
          <Badge variant="success">Auto-posted</Badge>
        </Card>
        <Card>
          <h3>Within Tolerance</h3>
          <div className="text-4xl font-bold text-blue-600">
            {stats.within_tolerance}
          </div>
          <Badge variant="info">Review</Badge>
        </Card>
        <Card>
          <h3>Exceptions</h3>
          <div className="text-4xl font-bold text-red-600">
            {stats.exceptions}
          </div>
          <Badge variant="error">Action Required</Badge>
        </Card>
        <Card>
          <h3>Auto-Match Rate</h3>
          <div className="text-4xl font-bold">{stats.auto_match_pct}%</div>
        </Card>
      </div>

      <Card title="Three-Way Match Queue">
        <DataTable
          data={matches.filter((m) => m.status !== "Posted")}
          columns={[
            { key: "invoice_number", label: "Invoice" },
            { key: "vendor_name", label: "Vendor" },
            { key: "po_number", label: "PO" },
            {
              key: "invoice_amount",
              label: "Invoice Amount",
              render: (_, row) => `$${row.invoice_amount.toLocaleString()}`,
            },
            {
              key: "po_amount",
              label: "PO Amount",
              render: (_, row) => `$${row.po_amount.toLocaleString()}`,
            },
            {
              key: "variance",
              label: "Variance",
              render: (_, row) => (
                <Badge
                  variant={
                    Math.abs(row.variance) === 0
                      ? "success"
                      : Math.abs(row.variance) <= row.tolerance
                      ? "warning"
                      : "error"
                  }
                >
                  ${Math.abs(row.variance).toFixed(2)}
                  {row.variance !== 0 &&
                    (row.variance > 0 ? " over" : " under")}
                </Badge>
              ),
            },
            {
              key: "match_status",
              label: "Status",
              render: (_, row) => (
                <Badge
                  variant={
                    row.match_status === "Perfect Match"
                      ? "success"
                      : row.match_status === "Within Tolerance"
                      ? "warning"
                      : "error"
                  }
                >
                  {row.match_status}
                </Badge>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <div className="flex gap-2">
                  {row.match_status === "Within Tolerance" && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => approve(row.id)}
                    >
                      Approve & Post
                    </Button>
                  )}
                  {row.match_status === "Exception" && (
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={() => resolve(row.id)}
                    >
                      Resolve
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    View Details
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

### 3. **Vendor Catalog Management** 💎

**Description**: Centralized vendor catalog with items, pricing, terms, and contract information. Features bulk import, price history, preferred vendor designation, and catalog search for easy requisition creation.

**Why It's Killer**:

- **Centralized Catalog**: All vendor items and pricing in one place (vs. scattered Excel files)
- **Price History**: Track price changes over time for negotiation leverage
- **Quick Requisitions**: Add catalog items to PRs in 2 clicks
- **Measurable Impact**: Reduce requisition errors by 70%, improve pricing compliance

**Implementation**:

```typescript
import { Card, DataTable, Button, Search, Badge } from "aibos-ui";
import { useVendorCatalog } from "@/hooks/usePurchaseOrders";

export default function VendorCatalogManagement() {
  const { catalog, vendors } = useVendorCatalog();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-center">
          <h2>Vendor Catalog</h2>
          <div className="flex gap-4">
            <Search
              placeholder="Search catalog..."
              onSearch={(q) => filterCatalog(q)}
            />
            <Button variant="primary">Import Catalog</Button>
          </div>
        </div>
      </Card>

      <Card title="Catalog Items">
        <DataTable
          data={catalog}
          columns={[
            { key: "item_code", label: "Item Code" },
            { key: "description", label: "Description" },
            { key: "vendor_name", label: "Vendor" },
            {
              key: "unit_price",
              label: "Unit Price",
              render: (_, row) => `$${row.unit_price.toFixed(2)}`,
            },
            { key: "uom", label: "UOM" },
            { key: "lead_time_days", label: "Lead Time" },
            {
              key: "preferred",
              label: "Preferred",
              render: (_, row) =>
                row.preferred && <Badge variant="success">Preferred</Badge>,
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    View History
                  </Button>
                  <Button size="sm" variant="primary">
                    Add to PR
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

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Main Page (`/purchase-orders/dashboard`)

**Components**: Card, DataTable, Badge, Chart
**File**: `apps/web/app/(dashboard)/purchase-orders/page.tsx`

#### 2. Create PO/PR (`/purchase-orders/create`)

**Components**: Form, Search, DataTable, Button
**File**: `apps/web/app/(dashboard)/purchase-orders/create/page.tsx`

#### 3. Three-Way Match (`/purchase-orders/matching`)

**Components**: DataTable, Badge, Button, Alert
**File**: `apps/web/app/(dashboard)/purchase-orders/matching/page.tsx`

---

## 🔌 API Integration

```typescript
// apps/web/hooks/usePurchaseOrders.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@aibos/api-client';

export function usePurchaseRequisition() {
  return useMutation({
    mutationFn: prData =>
      apiClient.POST('/api/purchase-orders/requisitions', { body: prData }),
    onSuccess: () => queryClient.invalidateQueries(['purchase-requisitions']),
  });
}

export function useThreeWayMatch() {
  return useQuery({
    queryKey: ['three-way-match'],
    queryFn: () => apiClient.GET('/api/purchase-orders/matching'),
  });
}

export function useVendorCatalog() {
  return useQuery({
    queryKey: ['vendor-catalog'],
    queryFn: () => apiClient.GET('/api/purchase-orders/catalog'),
  });
}
```

---

## 📝 Implementation Guide

### Day 1: Requisition & Catalog (8 hours)

1. Build PO requisition form (3 hours)
2. Implement vendor catalog integration (3 hours)
3. Create approval workflow (2 hours)

### Day 2: Three-Way Match (4 hours)

1. Build three-way match dashboard (2 hours)
2. Implement exception handling (2 hours)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Budget checking logic
- [ ] Three-way match calculation
- [ ] Tolerance validation

### Integration Tests

- [ ] PR to PO conversion
- [ ] Three-way match workflow
- [ ] Catalog search and selection

### E2E Tests

- [ ] User can create purchase requisition
- [ ] System performs three-way matching
- [ ] User can search vendor catalog

---

## 📅 Timeline

| Day | Deliverable                       |
| --- | --------------------------------- |
| 1   | PO requisition and vendor catalog |
| 2   | Three-way match automation        |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M5: Accounts Payable

### Enables These Modules

- Enhanced M5: Accounts Payable (invoice matching)

---

## 🎯 Success Criteria

### Must Have

- [ ] Purchase requisition creation with approval workflow
- [ ] Three-way match automation
- [ ] Vendor catalog integration

### Should Have

- [ ] Budget checking
- [ ] Tolerance-based auto-posting
- [ ] Exception management

### Nice to Have

- [ ] Vendor performance tracking
- [ ] Contract management integration
- [ ] AI-powered vendor recommendations

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M35 - Time & Expenses  
**Next**: M37 - Sales Orders
