# 🚀 M36: Purchase Orders - UI Implementation Runbook

**Module ID**: M36  
**Module Name**: Purchase Orders  
**Priority**: HIGH  
**Phase**: 10 - Extended Modules  
**Estimated Effort**: 3 days  
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

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-po-requisition-workflow], [ADR-###-three-way-matching], [ADR-###-vendor-catalog]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 14 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

**Purchase Orders** (4 endpoints):

- ✅ `/api/purchase-orders` - List POs
- ✅ `/api/purchase-orders/[id]` - PO details
- ✅ `/api/purchase-orders/create` - Create PO
- ✅ `/api/purchase-orders/close` - Close PO

**Requisitions** (4 endpoints):

- ✅ `/api/purchase-orders/requisitions` - List PRs
- ✅ `/api/purchase-orders/requisitions/[id]` - PR details
- ✅ `/api/purchase-orders/requisitions/create` - Create PR
- ✅ `/api/purchase-orders/requisitions/approve` - Approve PR

**Three-Way Matching** (3 endpoints):

- ✅ `/api/purchase-orders/matching` - Match queue
- ✅ `/api/purchase-orders/matching/resolve` - Resolve exception
- ✅ `/api/purchase-orders/matching/auto-post` - Auto-post matches

**Vendor Catalog** (3 endpoints):

- ✅ `/api/purchase-orders/catalog` - Catalog items
- ✅ `/api/purchase-orders/catalog/import` - Bulk import
- ✅ `/api/purchase-orders/catalog/price-history` - Price history

**Total Endpoints**: 14 (4 categories)

### Risks & Blockers

| Risk                         | Impact | Mitigation                                                        | Owner    |
| ---------------------------- | ------ | ----------------------------------------------------------------- | -------- |
| Three-way match accuracy     | HIGH   | Tolerance configuration; manual review queue; comprehensive tests | @ops     |
| Budget checking performance  | MED    | Real-time budget service; caching; async validation               | @backend |
| Approval workflow complexity | MED    | Flexible routing rules; visual workflow designer; escalation      | @ops     |
| Vendor catalog data quality  | MED    | Import validation; duplicate detection; data cleanup tools        | @ops     |

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

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                            | Target          | Measurement          |
| --------------------------------- | --------------- | -------------------- |
| TTFB (staging)                    | ≤ 70ms          | Server timing header |
| Client TTI for `/purchase-orders` | ≤ 200ms         | Lighthouse CI        |
| PR creation submit                | < 2s            | Performance profiler |
| Budget check response             | < 500ms         | API response time    |
| Three-way match calculation       | < 1s            | API response time    |
| Catalog search (1000+ items)      | < 300ms         | Search profiler      |
| UI bundle size                    | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access for all forms and tables
- **Focus Management**: Logical tab order; focus indicators
- **ARIA**: Match status announced; approval state communicated
- **Screen Reader**: All form fields labeled; dynamic updates announced
- **Axe Target**: 0 serious/critical violations

### Security

| Layer         | Requirement                                                   |
| ------------- | ------------------------------------------------------------- |
| RBAC Scopes   | `po.read`, `po.create`, `po.approve`, `po.admin`              |
| Enforcement   | Server-side on all endpoints                                  |
| Data Exposure | Only show POs/PRs user has permission for                     |
| Audit Trail   | Immutable logs for all PR submissions, approvals, PO changes  |
| Budget Access | Server-side budget checking; client-side display only         |
| Vendor Data   | Encrypt sensitive vendor terms; role-based pricing visibility |

#### UI Permissions Matrix

| Role       | View | Create PR | Approve PR | Create PO | Close PO | Manage Catalog | Admin |
| ---------- | ---- | --------- | ---------- | --------- | -------- | -------------- | ----- |
| po.read    | ✅   | ❌        | ❌         | ❌        | ❌       | ❌             | ❌    |
| po.create  | ✅   | ✅        | ❌         | ❌        | ❌       | ❌             | ❌    |
| po.approve | ✅   | ✅        | ✅         | ✅        | ❌       | ❌             | ❌    |
| po.admin   | ✅   | ✅        | ✅         | ✅        | ✅       | ✅             | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful PR submissions; 95% three-way match accuracy
- **SLA Dashboards**: Real-time metrics on PR turnaround time, match rate
- **Events Emitted**: `PO.PRCreated`, `PO.PRApproved`, `PO.Created`, `PO.Matched`, `PO.Closed`
- **Logging**: Structured logs with user IDs for all operations
- **Tracing**: Distributed tracing for approval workflows

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Purchase Order Business Rules

| Rule                     | Enforcement                                        |
| ------------------------ | -------------------------------------------------- |
| **Requisition Approval** | Amount-based routing (configurable thresholds)     |
| **Budget Checking**      | Real-time validation before PR submission          |
| **Three-Way Match**      | PO + Receipt + Invoice must match within tolerance |
| **Tolerance Limits**     | Configurable by vendor/category (default ±5%)      |
| **PO Closure**           | Cannot close PO with open receipts                 |
| **Catalog Pricing**      | Price freeze from catalog at PR creation time      |
| **Duplicate Detection**  | Prevent duplicate PRs for same items within 24h    |

### PO/PR States

- **Requisition**: Draft → Submitted → Approved / Rejected → Converted to PO
- **Purchase Order**: Draft → Issued → Partially Received → Fully Received → Closed
- **Three-Way Match**: Pending → Perfect Match / Within Tolerance / Exception → Posted

### Archive Semantics

- **PO History**: Retain all POs (7-year minimum)
- **Audit Trail**: Immutable approval history
- **Guard Rails**:
  - ❌ Deny closure of PO with open receipts
  - ❌ Deny changes to approved PRs
  - ✅ Allow draft PR deletion

---

## 🚨 Error Handling & UX States

### All Possible States

| State                  | UI Display                    | User Action       |
| ---------------------- | ----------------------------- | ----------------- |
| **Empty**              | "No requisitions yet"         | "Create PR"       |
| **Loading**            | Skeleton forms/tables         | N/A               |
| **Error**              | Error message + retry         | Retry / Support   |
| **Draft**              | Gray badge "Draft"            | Submit            |
| **Pending Approval**   | Blue badge "Pending Approval" | View              |
| **Approved**           | Green badge "Approved"        | Convert to PO     |
| **Rejected**           | Red badge "Rejected"          | Edit / Resubmit   |
| **Issued**             | Blue badge "Issued"           | View / Receive    |
| **Partially Received** | Orange badge "Partial"        | Receive remaining |
| **Fully Received**     | Green badge "Received"        | Close PO          |
| **Closed**             | Gray badge "Closed"           | View only         |
| **Budget Exceeded**    | Red alert "Budget Exceeded"   | Adjust / Override |
| **Match Exception**    | Red badge "Exception"         | Resolve           |
| **Permission Denied**  | "Access restricted"           | Back              |

### Form Validation

- **PR Validation**: Required fields (vendor, items, justification), budget check
- **PO Validation**: PR approval required, budget revalidation
- **Match Tolerance**: Configurable price/quantity variance thresholds

### Network Errors

| HTTP Status | UI Message                                  | Action              |
| ----------- | ------------------------------------------- | ------------------- |
| 400         | "Invalid PO/PR data. Check your inputs."    | Inline field errors |
| 401         | "Session expired. Please log in again."     | Redirect to login   |
| 403         | "You don't have permission."                | Hide action         |
| 404         | "Requisition/PO not found."                 | Return to list      |
| 409         | "Budget exceeded or duplicate detected."    | Show alert          |
| 422         | "Validation failed. Check required fields." | Inline errors       |
| 500         | "Something went wrong. Try again."          | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/purchase-orders.json`.

### Page Titles & Headers

| Context         | Copy                     | i18n Key                |
| --------------- | ------------------------ | ----------------------- |
| Dashboard       | "Purchase Orders"        | `po.dashboard.title`    |
| Create PR       | "Create Requisition"     | `po.requisition.create` |
| PO Details      | "Purchase Order Details" | `po.detail.title`       |
| Three-Way Match | "Invoice Matching"       | `po.matching.title`     |
| Catalog         | "Vendor Catalog"         | `po.catalog.title`      |

### State Messages

| State           | Title                      | Message                            | Action Button | i18n Key              |
| --------------- | -------------------------- | ---------------------------------- | ------------- | --------------------- |
| Empty           | "No requisitions yet"      | "Create your first PR"             | "Create PR"   | `po.empty.*`          |
| Budget Exceeded | "Budget exceeded"          | "Adjust items or request override" | "Adjust"      | `po.budgetExceeded.*` |
| Match Exception | "Match exception detected" | "Review variance and resolve"      | "Resolve"     | `po.matchException.*` |

### Success Messages (Toast)

| Action     | Message                                     | i18n Key            | Shortcut |
| ---------- | ------------------------------------------- | ------------------- | -------- |
| PR Created | "Requisition '{id}' submitted for approval" | `po.pr.success`     | `r`      |
| PO Created | "Purchase Order '{number}' created"         | `po.create.success` | `p`      |
| Matched    | "Invoice matched and posted successfully"   | `po.match.success`  | `m`      |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/usePurchaseOrders.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function usePurchaseRequisitions(filters = {}) {
  return useQuery({
    queryKey: ["purchase-requisitions", "list", filters],
    queryFn: () =>
      apiClient.GET("/api/purchase-orders/requisitions", { query: filters }),
    staleTime: 2 * 60_000, // 2min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useCreatePR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prData: any) =>
      apiClient.POST("/api/purchase-orders/requisitions/create", {
        body: prData,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      toast.success("Requisition submitted for approval");
    },
    onError: (error: any) => {
      if (error.status === 409) {
        toast.error("Budget exceeded or duplicate detected");
      } else {
        toast.error("Failed to create requisition.");
      }
    },
  });
}

export function useApprovePR() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      apiClient.POST("/api/purchase-orders/requisitions/approve", {
        body: { id, approved },
      }),
    onSuccess: (_, { approved }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success(`Requisition ${approved ? "approved" : "rejected"}`);
    },
    onError: () => {
      toast.error("Failed to process approval.");
    },
  });
}

export function usePurchaseOrders(filters = {}) {
  return useQuery({
    queryKey: ["purchase-orders", "list", filters],
    queryFn: () => apiClient.GET("/api/purchase-orders", { query: filters }),
    staleTime: 5 * 60_000, // 5min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useCreatePO() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (poData: any) =>
      apiClient.POST("/api/purchase-orders/create", { body: poData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["budget"] });
      toast.success("Purchase Order created");
    },
    onError: () => {
      toast.error("Failed to create PO.");
    },
  });
}

export function useThreeWayMatch() {
  return useQuery({
    queryKey: ["three-way-match"],
    queryFn: () => apiClient.GET("/api/purchase-orders/matching"),
    staleTime: 1 * 60_000, // 1min (real-time matching)
    retry: 2,
    select: (response) => response.data,
  });
}

export function useResolveMatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      action,
    }: {
      id: string;
      action: "approve" | "reject";
    }) =>
      apiClient.POST("/api/purchase-orders/matching/resolve", {
        body: { id, action },
      }),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["three-way-match"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success(
        `Match ${action}d and ${action === "approve" ? "posted" : "rejected"}`
      );
    },
    onError: () => {
      toast.error("Failed to resolve match.");
    },
  });
}

export function useVendorCatalog(filters = {}) {
  return useQuery({
    queryKey: ["vendor-catalog", filters],
    queryFn: () =>
      apiClient.GET("/api/purchase-orders/catalog", { query: filters }),
    staleTime: 10 * 60_000, // 10min (catalog changes infrequently)
    retry: 2,
    select: (response) => response.data,
  });
}

export function useCheckBudget() {
  return useMutation({
    mutationFn: (lineItems: any[]) =>
      apiClient.POST("/api/budget/check", { body: { lineItems } }),
    retry: 1,
  });
}
```

### Error Mapping

| API Error         | User Message                                | UI Action            |
| ----------------- | ------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid PO/PR data. Check your inputs."    | Inline field errors  |
| 409 (Conflict)    | "Budget exceeded or duplicate detected."    | Show alert dialog    |
| 422 (Validation)  | "Validation failed. Check required fields." | Inline errors        |
| 403 (Forbidden)   | "You don't have permission."                | Hide action          |
| 500 (Server)      | "Something went wrong. Try again."          | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for budget/matching operations

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["purchase-requisitions", "list", { filters }][
  ("purchase-requisitions", "detail", prId)
][("purchase-orders", "list", { filters })][
  ("purchase-orders", "detail", poId)
]["three-way-match"][("vendor-catalog", { filters })]["budget"];
```

### Invalidation Rules

| Action        | Invalidates                                                      |
| ------------- | ---------------------------------------------------------------- |
| Create PR     | `["purchase-requisitions"]`, `["budget"]`                        |
| Approve PR    | `["purchase-requisitions"]`, `["purchase-orders"]`, `["budget"]` |
| Create PO     | `["purchase-orders"]`, `["budget"]`                              |
| Resolve Match | `["three-way-match"]`, `["purchase-orders"]`                     |
| Close PO      | `["purchase-orders"]`                                            |

### Stale Time

| Query Type      | Stale Time | Reasoning                    |
| --------------- | ---------- | ---------------------------- |
| PRs             | 2min       | Frequent updates             |
| POs             | 5min       | Moderate update frequency    |
| Three-Way Match | 1min       | Real-time matching queue     |
| Vendor Catalog  | 10min      | Catalog changes infrequently |
| Budget          | 1min       | Real-time budget tracking    |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("purchase-orders");
revalidateTag("purchase-requisitions");
revalidateTag("vendor-catalog");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/purchase-orders.fixtures.ts`

**Datasets**:

- `minimalPRs`: 5 requisitions (various states)
- `standardPOs`: 20 POs across lifecycle
- `matchingQueue`: 15 invoices (perfect, tolerance, exceptions)
- `edgeCases`: Budget exceeded, duplicate PRs, match exceptions

**Edge Cases Covered**:

- PRs exceeding budget
- Three-way match with >5% variance
- Duplicate PR within 24 hours
- Catalog items with price history
- Multi-level approval chains

---

## 🔗 API Contract Sync (CI Enforcement)

### Prevent Drift

**CI Step**: Fail build if `packages/contracts/openapi/openapi.json` changes without regenerating `types.gen.ts`.

---

## 🖥️ RSC/SSR & App Router Compatibility

### Server/Client Boundaries

- **Pages**: Server components by default
- **Interactive Parts**: Mark with `"use client"` (forms, catalog search)

### Data Fetching Strategy

| Scenario           | Strategy                          | Benefit              |
| ------------------ | --------------------------------- | -------------------- |
| PO List            | Server-side fetch + stream        | Faster TTFB          |
| PR Creation        | Client-side with budget check     | Real-time validation |
| Three-Way Matching | Client-side with real-time update | Live monitoring      |

---

## 📊 Analytics & Audit Events

| Event         | When            | Properties                                  |
| ------------- | --------------- | ------------------------------------------- |
| PO.PRCreated  | PR submitted    | `pr_id`, `amount`, `item_count`, `approver` |
| PO.PRApproved | PR approved     | `pr_id`, `approver_id`, `amount`            |
| PO.Created    | PO created      | `po_id`, `po_number`, `vendor_id`, `amount` |
| PO.Matched    | Invoice matched | `po_id`, `invoice_id`, `variance`, `status` |
| PO.Closed     | PO closed       | `po_id`, `final_amount`                     |

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/purchase-orders.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency**: Multi-currency support for international vendors

### Keyboard Shortcuts

| Key      | Action          | Scope       |
| -------- | --------------- | ----------- |
| `/`      | Focus search    | Any page    |
| `r`      | New requisition | PR list     |
| `p`      | New PO          | PO list     |
| `a`      | Approve PR      | PR detail   |
| `m`      | Resolve match   | Match queue |
| `Enter`  | Submit form     | Forms       |
| `Escape` | Close modal     | Modal       |

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                        | Duration | Rollback Trigger |
| ----------- | ---------------- | --------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                        | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, match accuracy ≥95% | 2 days   | Test failures    |
| Production  | Beta users (10%) | Error rate < 0.5%, match accuracy ≥95%  | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 1 week, PR turnaround < 24h | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m36_purchase_orders: false,   // Master toggle
  m36_three_way_match: false,   // Three-way matching
  m36_budget_check: false,      // Real-time budget checking
  m36_catalog: false,           // Vendor catalog
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- PR submission success rate (≥99%)
- Three-way match accuracy (≥95%)
- Budget check response time (< 500ms)
- PR turnaround time (< 24 hours)

**Alert Thresholds**:

- Match accuracy < 90% → investigate
- PR submission error rate > 1% → escalate
- Budget check timeout > 2s → rollback

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m36_purchase_orders = false`
2. **Invalidate cache**: `revalidateTag("purchase-orders")`
3. **Clear CDN cache**: `pnpm run cache:purge --path="/purchase-orders/*"`
4. **Monitor for 15 minutes**
5. **Post-mortem**

**Rollback Decision Matrix**:

| Scenario                   | Action             | Approval Required |
| -------------------------- | ------------------ | ----------------- |
| Match accuracy < 85%       | Immediate rollback | No (auto-trigger) |
| PR submission error > 5%   | Immediate rollback | No (auto-trigger) |
| Budget check timeout > 10s | Immediate rollback | No (auto-trigger) |
| User complaints > 5        | Investigate first  | Ops lead          |

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

- Coupa: Procurement workflows
- Ariba: Three-way matching
- Oracle Purchasing: Budget controls
- SAP MM: Vendor management

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Three-Way Match Accuracy

**Mitigation**: Configurable tolerance thresholds by vendor/category; manual review queue for exceptions; comprehensive test suite with real invoice data; accuracy monitoring dashboard

### Risk #2: Budget Checking Performance

**Mitigation**: Real-time budget service with sub-500ms response; caching for frequently checked budgets; async validation for large PRs; fallback to estimate mode

### Risk #3: Approval Workflow Complexity

**Mitigation**: Flexible routing rules based on amount/category; visual workflow designer; clear escalation paths; approval delegation capability; comprehensive tests

### Risk #4: Vendor Catalog Data Quality

**Mitigation**: Import validation with duplicate detection; data cleanup tools; price history tracking; manual override capability; regular data audits

---

## 📝 Implementation Guide

### Day 1: PR Creation & Catalog (8 hours)

1. Build purchase requisition form (3 hours)
2. Implement vendor catalog integration (2 hours)
3. Add budget checking (2 hours)
4. Create approval workflow UI (1 hour)

### Day 2: Purchase Orders & Receiving (8 hours)

1. Build PO creation from approved PRs (2 hours)
2. Implement receiving workflow (2 hours)
3. Add PO lifecycle management (2 hours)
4. Create PO reporting dashboard (2 hours)

### Day 3: Three-Way Match & Polish (8 hours)

1. Build three-way match dashboard (3 hours)
2. Implement exception handling (2 hours)
3. Add tolerance configuration (1 hour)
4. Comprehensive testing and polish (2 hours)

**Total**: 3 days (24 hours)

---

## ✅ Testing Checklist

### Unit Tests (8 tests)

- [ ] Budget checking logic (real-time validation)
- [ ] Three-way match calculation (variance detection)
- [ ] Tolerance validation (configurable thresholds)
- [ ] Duplicate PR detection (24h window)
- [ ] Approval routing logic (amount-based)
- [ ] Catalog price freeze (at PR creation)
- [ ] PO closure validation (no open receipts)
- [ ] Match exception classification

### Integration Tests (6 tests)

- [ ] PR creation → budget check → approval
- [ ] Approved PR → PO conversion
- [ ] PO → Receipt → Invoice → Three-way match
- [ ] Match exception → manual resolution
- [ ] Catalog search → add to PR
- [ ] Budget exceeded → override workflow

### E2E Tests (7 flows)

- [ ] User can create purchase requisition
- [ ] Manager can approve/reject PR
- [ ] System converts approved PR to PO
- [ ] User can receive against PO
- [ ] System performs three-way matching
- [ ] User can resolve match exceptions
- [ ] User can search vendor catalog and add items

### Accessibility Tests

- [ ] Keyboard navigation works (all forms accessible)
- [ ] Screen reader announces match status
- [ ] Focus management correct (modals, forms)
- [ ] Color contrast meets WCAG 2.2 AA
- [ ] Axe: 0 serious/critical violations

### Contract Tests

- [ ] API calls match OpenAPI spec
- [ ] Generated types match API responses

### Visual Regression Tests

- [ ] Storybook snapshots for PR form
- [ ] Three-way match dashboard
- [ ] Vendor catalog UI

### Performance Tests

- [ ] Bundle size < 250KB gzipped
- [ ] PR creation < 2s submit
- [ ] Budget check < 500ms
- [ ] Catalog search (1000 items) < 300ms

---

## 📅 Timeline & Milestones

| Day | Tasks                                                     | Deliverable                        | Flag Status |
| --- | --------------------------------------------------------- | ---------------------------------- | ----------- |
| 1   | Setup + PR Form + Catalog + Budget Checking + Approval UI | Basic requisition workflow works   | WIP         |
| 2   | PO Creation + Receiving + Lifecycle + Reporting Dashboard | Purchase order management complete | WIP         |
| 3   | Three-Way Match + Exception Handling + Tolerance + Tests  | Production-ready module            | GA          |

**Total Effort**: 3 days (24 hours)

**Feature Flags**:

- Day 1-2: `flags.m36_purchase_orders = false` (hidden)
- Day 2: Enable `m36_budget_check` incrementally
- Day 3: Enable `m36_three_way_match` after match accuracy ≥95% verified

---

## 🔗 Dependencies

### Must Complete Before Starting

- ✅ M1: Core Ledger (for GL posting)
- ✅ M5: Accounts Payable (for invoice matching)
- ✅ M14: Budget Planning (for budget checking)
- 🆕 Feature flag service
- 🆕 Analytics provider
- 🆕 Budget service API

### Blocks These Modules

- Enhanced M5: Accounts Payable (three-way matching)
- Enhanced M34: Projects & Jobs (project purchasing)
- Inventory Management (receiving integration)
- Contract Management (future)

---

## 🎯 Success Criteria

### Must Have (Measurable)

- [ ] Purchase requisition creation with budget check (< 500ms)
- [ ] Multi-level approval workflows (amount-based routing)
- [ ] PR to PO conversion
- [ ] Three-way match automation (≥95% accuracy)
- [ ] Vendor catalog integration (search < 300ms)
- [ ] Budget checking before PR submission
- [ ] Tolerance-based auto-posting (configurable ±5%)
- [ ] Exception management workflow
- [ ] PR submission success rate ≥99%
- [ ] PR turnaround time < 24 hours
- [ ] Axe: 0 serious/critical violations

### Should Have

- [ ] Duplicate PR detection (24h window)
- [ ] Price history tracking
- [ ] Preferred vendor designation
- [ ] Bulk catalog import
- [ ] Approval delegation
- [ ] PO lifecycle dashboard

### Nice to Have

- [ ] Vendor performance tracking
- [ ] Contract management integration
- [ ] AI-powered vendor recommendations
- [ ] Predictive budget alerts
- [ ] Mobile approval capability

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/dashboard`, `/create`, `/matching`)
- [ ] Purchase requisition with budget checking
- [ ] Multi-level approval workflows
- [ ] Three-way match automation
- [ ] Vendor catalog integration
- [ ] Search and filtering working
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

- [ ] Unit tests: ≥90% line coverage, ≥95% for matching/budget logic
- [ ] Integration tests: All PO/PR workflows covered
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- PR creation with budget check
- Approval workflow routing
- Three-way match calculation
- Exception resolution workflow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/purchase-orders/*` routes
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/purchase-orders`
- [ ] PR creation: < 2s submit
- [ ] Budget check: < 500ms
- [ ] Three-way match: < 1s calculation

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (NVDA/JAWS)
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Three-Way Match Accuracy 🎯

**CRITICAL - ≥95% match accuracy required before production!**

- [ ] Match accuracy ≥95% on test invoice dataset (100+ invoices)
- [ ] Perfect match detection ≥90%
- [ ] Tolerance-based match ≥95% within ±5%
- [ ] Exception classification accuracy ≥98%
- [ ] Manual review queue for low confidence
- [ ] Match accuracy monitoring dashboard

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `PO.PRCreated`
  - `PO.PRApproved`
  - `PO.Created`
  - `PO.Matched`
  - `PO.Closed`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (match accuracy, PR errors, budget check timeouts)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Rate limiting tested
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] Audit trail for all PR submissions/approvals
- [ ] Vendor data encrypted

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
  - `flags.m36_purchase_orders = false` (ready to enable)
  - `flags.m36_three_way_match = false` (phase 2)
  - `flags.m36_budget_check = false` (phase 2)
  - `flags.m36_catalog = false` (phase 2)
- [ ] Smoke tests passed on staging
- [ ] Load tests passed (≥1000 concurrent users)
- [ ] Deployed to production (flags off)
- [ ] Rollback procedure tested
- [ ] Gradual rollout plan ready (10% → 100%)

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All test plans executed and passed
- [ ] **Design**: UI matches specs, brand compliance
- [ ] **PM**: Feature complete, acceptance criteria met
- [ ] **Security**: Security review passed
- [ ] **Accessibility**: A11y audit passed
- [ ] **Procurement**: Workflow validated, match accuracy approved

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M35 - Time & Expenses  
**Next**: M37 - Sales Orders
