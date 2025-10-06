# 🚀 M37: Sales Orders - UI Implementation Runbook

**Module ID**: M37  
**Module Name**: Sales Orders  
**Priority**: HIGH  
**Phase**: 10 - Extended Modules  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

M37 delivers comprehensive sales order management with quote-to-cash functionality, fulfillment tracking, and revenue recognition integration. This module streamlines order processing, improves order accuracy, and provides complete visibility into the sales pipeline.

### Business Value

- **Order Efficiency**: Process sales orders 5x faster with streamlined workflows
- **Accuracy**: Reduce order errors by 80% with validation and customer history
- **Revenue Visibility**: Real-time view of sales pipeline and backlog
- **Customer Experience**: Faster order processing improves customer satisfaction
- **Revenue Recognition**: Automatic ASC 606 revenue recognition from sales orders

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-quick-order-entry], [ADR-###-order-fulfillment], [ADR-###-asc606-revenue-recognition]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 15 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

**Sales Orders** (5 endpoints):

- ✅ `/api/sales-orders` - List orders
- ✅ `/api/sales-orders/[id]` - Order details
- ✅ `/api/sales-orders/create` - Create order
- ✅ `/api/sales-orders/update` - Update order
- ✅ `/api/sales-orders/cancel` - Cancel order

**Fulfillment** (4 endpoints):

- ✅ `/api/sales-orders/fulfillment` - Fulfillment queue
- ✅ `/api/sales-orders/fulfillment/pick` - Pick order
- ✅ `/api/sales-orders/fulfillment/ship` - Ship order
- ✅ `/api/sales-orders/fulfillment/track` - Track shipment

**Quotes** (3 endpoints):

- ✅ `/api/sales-orders/quotes` - List quotes
- ✅ `/api/sales-orders/quotes/create` - Create quote
- ✅ `/api/sales-orders/quotes/convert` - Convert to order

**Revenue Recognition** (3 endpoints):

- ✅ `/api/sales-orders/revenue` - Revenue recognition data
- ✅ `/api/sales-orders/revenue/schedule` - Recognition schedule
- ✅ `/api/sales-orders/revenue/deferred` - Deferred revenue

**Total Endpoints**: 15 (4 categories)

### Risks & Blockers

| Risk                           | Impact | Mitigation                                                       | Owner       |
| ------------------------------ | ------ | ---------------------------------------------------------------- | ----------- |
| ASC 606 revenue recognition    | HIGH   | Automated POB identification; external audit validation; testing | @accounting |
| Credit limit checking accuracy | MED    | Real-time credit service; manual override capability; alerts     | @finance    |
| Order fulfillment complexity   | MED    | Inventory integration; status tracking; automated notifications  | @ops        |
| Tax calculation accuracy       | HIGH   | Automated tax service (Avalara/Vertex); manual override; audit   | @tax        |

---

## 🎯 3 Killer Features

### 1. **Quick Order Entry Form** 🚀

**Description**: Intuitive sales order entry with customer history, product catalog integration, real-time pricing, credit limit checking, and automated tax calculation. Features one-click reorder from history and bulk line entry.

**Why It's Killer**:

- **Speed**: Create complex orders in under 2 minutes (SAP takes 10+ minutes)
- **Smart Suggestions**: AI suggests products based on customer history (unique to aibos)
- **Credit Checking**: Real-time credit limit validation prevents bad orders
- **Measurable Impact**: Process 3x more orders per day with same headcount
- **Vs NetSuite**: Faster UI and better customer history integration

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
import { useSalesOrder, useCustomerInfo } from "@/hooks/useSalesOrders";

export default function QuickOrderEntryForm() {
  const { createOrder, productCatalog } = useSalesOrder();
  const { customer, creditStatus, orderHistory } = useCustomerInfo();
  const [lineItems, setLineItems] = useState([]);

  return (
    <div className="space-y-6">
      {creditStatus.over_limit && (
        <Alert variant="error">
          <strong>Credit Limit Exceeded!</strong>
          <p>
            Customer credit limit: ${creditStatus.credit_limit.toLocaleString()}
            Current balance: ${creditStatus.current_balance.toLocaleString()}
          </p>
        </Alert>
      )}

      <Card title="Create Sales Order">
        <Form onSubmit={createOrder}>
          <div className="grid grid-cols-2 gap-6">
            <Select
              label="Customer"
              name="customer_id"
              options={customers}
              required
              searchable
              onChange={(customerId) => loadCustomerInfo(customerId)}
            />
            <Input
              type="date"
              label="Order Date"
              name="order_date"
              defaultValue={today}
              required
            />
            <Select
              label="Billing Address"
              name="billing_address_id"
              options={customer?.addresses || []}
            />
            <Select
              label="Shipping Address"
              name="shipping_address_id"
              options={customer?.addresses || []}
            />
            <Select
              label="Payment Terms"
              name="payment_terms"
              defaultValue={customer?.default_terms}
              options={paymentTerms}
            />
            <Input
              type="date"
              label="Requested Delivery Date"
              name="requested_delivery_date"
            />
          </div>

          <Card title="Order Lines" className="mt-6">
            <DataTable
              data={lineItems}
              columns={[
                {
                  key: "product",
                  label: "Product",
                  editable: true,
                  type: "select",
                  options: productCatalog,
                },
                {
                  key: "description",
                  label: "Description",
                  editable: true,
                },
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
                  editable: true,
                  type: "number",
                },
                {
                  key: "discount_pct",
                  label: "Discount %",
                  editable: true,
                  type: "number",
                },
                {
                  key: "line_total",
                  label: "Total",
                  render: (_, row) => {
                    const subtotal = row.quantity * row.unit_price;
                    const discount = subtotal * (row.discount_pct / 100);
                    return `$${(subtotal - discount).toFixed(2)}`;
                  },
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

          <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax:</span>
              <span>${calculateTax().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="submit" variant="primary">
              Create Order
            </Button>
            <Button type="button" variant="outline">
              Save as Quote
            </Button>
          </div>
        </Form>
      </Card>

      {orderHistory.length > 0 && (
        <Card title="Customer Order History">
          <DataTable
            data={orderHistory}
            columns={[
              { key: "order_number", label: "Order #" },
              { key: "order_date", label: "Date" },
              {
                key: "total_amount",
                label: "Amount",
                render: (_, row) => `$${row.total_amount.toLocaleString()}`,
              },
              {
                key: "actions",
                label: "",
                render: (_, row) => (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => reorderFromHistory(row.id)}
                  >
                    Reorder
                  </Button>
                ),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
```

### 2. **Order Fulfillment Tracker** ⚡

**Description**: Real-time order fulfillment dashboard showing order status, picking/packing progress, shipping tracking, and delivery confirmation. Features integration with inventory and automated customer notifications.

**Why It's Killer**:

- **Real-Time Status**: Live updates as orders move through fulfillment stages
- **Customer Communication**: Automated shipping notifications with tracking links
- **Inventory Integration**: Real-time inventory availability checking
- **Measurable Impact**: Reduce "where's my order?" calls by 60%

**Implementation**:

```typescript
import { Card, Badge, DataTable, Timeline, Button } from "aibos-ui";
import { useOrderFulfillment, useShipOrder } from "@/hooks/useSalesOrders";

export default function OrderFulfillmentTracker() {
  const { orders, stats } = useOrderFulfillment();
  const { shipOrder, trackShipment } = useShipOrder();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Open Orders</h3>
          <div className="text-4xl font-bold">{stats.open_orders}</div>
        </Card>
        <Card>
          <h3>In Fulfillment</h3>
          <div className="text-4xl font-bold text-blue-600">
            {stats.in_fulfillment}
          </div>
        </Card>
        <Card>
          <h3>Shipped Today</h3>
          <div className="text-4xl font-bold text-green-600">
            {stats.shipped_today}
          </div>
        </Card>
        <Card>
          <h3>Backorders</h3>
          <div className="text-4xl font-bold text-red-600">
            {stats.backorders}
          </div>
        </Card>
      </div>

      <Card title="Order Fulfillment Queue">
        <DataTable
          data={orders}
          columns={[
            { key: "order_number", label: "Order #" },
            { key: "customer_name", label: "Customer" },
            { key: "order_date", label: "Order Date" },
            { key: "requested_delivery", label: "Requested Delivery" },
            {
              key: "status",
              label: "Status",
              render: (_, row) => (
                <Badge
                  variant={
                    row.status === "Shipped"
                      ? "success"
                      : row.status === "Picking"
                      ? "info"
                      : row.status === "Packing"
                      ? "warning"
                      : "default"
                  }
                >
                  {row.status}
                </Badge>
              ),
            },
            {
              key: "total_amount",
              label: "Amount",
              render: (_, row) => `$${row.total_amount.toLocaleString()}`,
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <div className="flex gap-2">
                  {row.status === "Ready to Ship" && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => shipOrder(row.id)}
                    >
                      Ship Order
                    </Button>
                  )}
                  {row.status === "Shipped" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => trackShipment(row.tracking_number)}
                    >
                      Track
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

### 3. **Revenue Recognition Integration** 💎

**Description**: Automatic revenue recognition from sales orders per ASC 606, including performance obligation identification, transaction price allocation, and revenue scheduling. Features contract modification handling and disclosure reports.

**Why It's Killer**:

- **ASC 606 Compliance**: Automatic revenue recognition per GAAP standards
- **Performance Obligations**: AI identifies separate performance obligations
- **Deferred Revenue**: Automated deferred revenue calculation and recognition
- **Measurable Impact**: Eliminate manual revenue recognition spreadsheets saving 20+ hours/month

**Implementation**:

```typescript
import { Card, Chart, Badge, DataTable } from "aibos-ui";
import { useRevenueRecognition } from "@/hooks/useSalesOrders";

export default function RevenueRecognitionIntegration() {
  const { orders, deferredRevenue, schedule } = useRevenueRecognition();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Recognized Revenue (MTD)</h3>
          <div className="text-3xl font-bold text-green-600">
            ${(deferredRevenue.recognized_mtd / 1000).toFixed(0)}K
          </div>
        </Card>
        <Card>
          <h3>Deferred Revenue</h3>
          <div className="text-3xl font-bold text-blue-600">
            ${(deferredRevenue.deferred_balance / 1000).toFixed(0)}K
          </div>
        </Card>
        <Card>
          <h3>Future Revenue</h3>
          <div className="text-3xl font-bold">
            ${(deferredRevenue.future_revenue / 1000).toFixed(0)}K
          </div>
        </Card>
      </div>

      <Card title="Revenue Recognition Schedule">
        <Chart
          type="area"
          data={{
            labels: schedule.months,
            datasets: [
              {
                label: "Revenue Recognition",
                data: schedule.recognition_amounts,
                backgroundColor: "rgba(34, 197, 94, 0.2)",
                borderColor: "rgb(34, 197, 94)",
              },
            ],
          }}
        />
      </Card>

      <Card title="Orders with Deferred Revenue">
        <DataTable
          data={orders.filter((o) => o.deferred_revenue > 0)}
          columns={[
            { key: "order_number", label: "Order #" },
            { key: "customer_name", label: "Customer" },
            {
              key: "total_amount",
              label: "Total",
              render: (_, row) => `$${row.total_amount.toLocaleString()}`,
            },
            {
              key: "recognized_revenue",
              label: "Recognized",
              render: (_, row) => `$${row.recognized_revenue.toLocaleString()}`,
            },
            {
              key: "deferred_revenue",
              label: "Deferred",
              render: (_, row) => `$${row.deferred_revenue.toLocaleString()}`,
            },
            {
              key: "recognition_method",
              label: "Method",
              render: (_, row) => <Badge>{row.recognition_method}</Badge>,
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

#### 1. Main Page (`/sales-orders/dashboard`)

**Components**: Card, DataTable, Badge, Chart
**File**: `apps/web/app/(dashboard)/sales-orders/page.tsx`

#### 2. Create Order (`/sales-orders/create`)

**Components**: Form, DataTable, Alert, Button
**File**: `apps/web/app/(dashboard)/sales-orders/create/page.tsx`

#### 3. Fulfillment (`/sales-orders/fulfillment`)

**Components**: DataTable, Badge, Timeline
**File**: `apps/web/app/(dashboard)/sales-orders/fulfillment/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                              | Target          | Measurement          |
| ----------------------------------- | --------------- | -------------------- |
| TTFB (staging)                      | ≤ 70ms          | Server timing header |
| Client TTI for `/sales-orders`      | ≤ 200ms         | Lighthouse CI        |
| Order creation submit               | < 2s            | Performance profiler |
| Credit check response               | < 500ms         | API response time    |
| Tax calculation                     | < 300ms         | API response time    |
| Product catalog search (1000 items) | < 300ms         | Search profiler      |
| Revenue recognition calculation     | < 1s            | API response time    |
| UI bundle size                      | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access for all forms and tables
- **Focus Management**: Logical tab order; focus indicators
- **ARIA**: Order status announced; fulfillment progress communicated
- **Screen Reader**: All form fields labeled; dynamic updates announced
- **Axe Target**: 0 serious/critical violations

### Security

| Layer          | Requirement                                                  |
| -------------- | ------------------------------------------------------------ |
| RBAC Scopes    | `sales.read`, `sales.create`, `sales.fulfill`, `sales.admin` |
| Enforcement    | Server-side on all endpoints                                 |
| Data Exposure  | Only show orders user has permission for                     |
| Audit Trail    | Immutable logs for all order creations, modifications        |
| Credit Access  | Server-side credit checking; client-side display only        |
| PII Protection | Mask customer credit card data; encrypt sensitive info       |

#### UI Permissions Matrix

| Role          | View | Create Order | Edit Order | Cancel Order | Fulfill Order | Manage Revenue | Admin |
| ------------- | ---- | ------------ | ---------- | ------------ | ------------- | -------------- | ----- |
| sales.read    | ✅   | ❌           | ❌         | ❌           | ❌            | ❌             | ❌    |
| sales.create  | ✅   | ✅           | ✅         | ❌           | ❌            | ❌             | ❌    |
| sales.fulfill | ✅   | ✅           | ✅         | ❌           | ✅            | ❌             | ❌    |
| sales.admin   | ✅   | ✅           | ✅         | ✅           | ✅            | ✅             | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful order submissions; 98% fulfillment on-time
- **SLA Dashboards**: Real-time metrics on order volume, fulfillment time
- **Events Emitted**: `Sales.OrderCreated`, `Sales.OrderShipped`, `Sales.RevenueRecognized`
- **Logging**: Structured logs with customer IDs for all operations
- **Tracing**: Distributed tracing for order-to-cash workflows

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Sales Order Business Rules

| Rule                     | Enforcement                                         |
| ------------------------ | --------------------------------------------------- |
| **Credit Limit Check**   | Real-time validation before order submission        |
| **Tax Calculation**      | Automated tax service (Avalara/Vertex) integration  |
| **Revenue Recognition**  | ASC 606 automated POB identification and allocation |
| **Order Modification**   | Cannot modify after shipment                        |
| **Inventory Reserve**    | Auto-reserve inventory on order confirmation        |
| **Price Freeze**         | Lock price at quote/order creation                  |
| **Fulfillment Priority** | FIFO by requested delivery date                     |

### Order States

- **Quote**: Draft → Sent → Accepted / Expired → Converted to Order
- **Sales Order**: Draft → Confirmed → Picking → Packing → Shipped → Delivered → Closed
- **Revenue**: Pending → Recognized / Deferred → Fully Recognized

### Archive Semantics

- **Order History**: Retain all orders (7-year minimum)
- **Audit Trail**: Immutable fulfillment and revenue recognition history
- **Guard Rails**:
  - ❌ Deny deletion of fulfilled orders
  - ❌ Deny changes to shipped orders
  - ✅ Allow draft order deletion

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display               | User Action        |
| --------------------- | ------------------------ | ------------------ |
| **Empty**             | "No orders yet"          | "Create Order"     |
| **Loading**           | Skeleton forms/tables    | N/A                |
| **Error**             | Error message + retry    | Retry / Support    |
| **Draft**             | Gray badge "Draft"       | Submit             |
| **Confirmed**         | Green badge "Confirmed"  | View / Fulfill     |
| **Picking**           | Blue badge "Picking"     | View Progress      |
| **Packing**           | Blue badge "Packing"     | View Progress      |
| **Shipped**           | Green badge "Shipped"    | Track Shipment     |
| **Delivered**         | Green badge "Delivered"  | Close Order        |
| **Closed**            | Gray badge "Closed"      | View Only          |
| **Cancelled**         | Red badge "Cancelled"    | View Only          |
| **Credit Hold**       | Red alert "Credit Hold"  | Review / Override  |
| **Backorder**         | Orange badge "Backorder" | Check Availability |
| **Permission Denied** | "Access restricted"      | Back               |

### Form Validation

- **Order Validation**: Required fields (customer, products, quantities), credit check
- **Line Validation**: Valid product, positive quantity, valid pricing
- **Tax Validation**: Valid shipping address for tax calculation

### Network Errors

| HTTP Status | UI Message                                        | Action              |
| ----------- | ------------------------------------------------- | ------------------- |
| 400         | "Invalid order data. Check your inputs."          | Inline field errors |
| 401         | "Session expired. Please log in again."           | Redirect to login   |
| 403         | "You don't have permission."                      | Hide action         |
| 404         | "Order not found."                                | Return to list      |
| 409         | "Credit limit exceeded or inventory unavailable." | Show alert          |
| 422         | "Validation failed. Check required fields."       | Inline errors       |
| 500         | "Something went wrong. Try again."                | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/sales-orders.json`.

### Page Titles & Headers

| Context       | Copy                | i18n Key                  |
| ------------- | ------------------- | ------------------------- |
| Dashboard     | "Sales Orders"      | `sales.dashboard.title`   |
| Create Order  | "Create Order"      | `sales.create.title`      |
| Order Details | "Order Details"     | `sales.detail.title`      |
| Fulfillment   | "Order Fulfillment" | `sales.fulfillment.title` |
| Quotes        | "Sales Quotes"      | `sales.quotes.title`      |

### State Messages

| State       | Title           | Message                      | Action Button  | i18n Key             |
| ----------- | --------------- | ---------------------------- | -------------- | -------------------- |
| Empty       | "No orders yet" | "Create your first order"    | "Create Order" | `sales.empty.*`      |
| Credit Hold | "Credit hold"   | "Customer over credit limit" | "Review"       | `sales.creditHold.*` |
| Backorder   | "Backorder"     | "Item unavailable"           | "Check Stock"  | `sales.backorder.*`  |

### Success Messages (Toast)

| Action  | Message                             | i18n Key                | Shortcut |
| ------- | ----------------------------------- | ----------------------- | -------- |
| Created | "Order '{number}' created"          | `sales.create.success`  | `o`      |
| Shipped | "Order '{number}' shipped"          | `sales.ship.success`    | `s`      |
| Revenue | "Revenue recognized for '{number}'" | `sales.revenue.success` | `r`      |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useSalesOrders.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useSalesOrders(filters = {}) {
  return useQuery({
    queryKey: ["sales-orders", "list", filters],
    queryFn: () => apiClient.GET("/api/sales-orders", { query: filters }),
    staleTime: 2 * 60_000, // 2min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: any) =>
      apiClient.POST("/api/sales-orders/create", { body: orderData }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      queryClient.invalidateQueries({ queryKey: ["revenue-recognition"] });
      toast.success(`Order '${data.order_number}' created`);
    },
    onError: (error: any) => {
      if (error.status === 409) {
        toast.error("Credit limit exceeded or inventory unavailable");
      } else {
        toast.error("Failed to create order.");
      }
    },
  });
}

export function useOrderFulfillment(filters = {}) {
  return useQuery({
    queryKey: ["order-fulfillment", filters],
    queryFn: () =>
      apiClient.GET("/api/sales-orders/fulfillment", { query: filters }),
    staleTime: 1 * 60_000, // 1min (real-time fulfillment)
    retry: 2,
    select: (response) => response.data,
  });
}

export function useShipOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      trackingNumber,
    }: {
      id: string;
      trackingNumber: string;
    }) =>
      apiClient.POST("/api/sales-orders/fulfillment/ship", {
        body: { id, trackingNumber },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-fulfillment"] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast.success("Order shipped successfully");
    },
    onError: () => {
      toast.error("Failed to ship order.");
    },
  });
}

export function useRevenueRecognition() {
  return useQuery({
    queryKey: ["revenue-recognition", "sales"],
    queryFn: () => apiClient.GET("/api/sales-orders/revenue"),
    staleTime: 5 * 60_000, // 5min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useCheckCredit() {
  return useMutation({
    mutationFn: (customerId: string) =>
      apiClient.POST("/api/customers/credit-check", { body: { customerId } }),
    retry: 1,
  });
}

export function useQuotes(filters = {}) {
  return useQuery({
    queryKey: ["sales-quotes", filters],
    queryFn: () =>
      apiClient.GET("/api/sales-orders/quotes", { query: filters }),
    staleTime: 5 * 60_000, // 5min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useConvertQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (quoteId: string) =>
      apiClient.POST("/api/sales-orders/quotes/convert", { body: { quoteId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
      toast.success("Quote converted to order");
    },
    onError: () => {
      toast.error("Failed to convert quote.");
    },
  });
}
```

### Error Mapping

| API Error         | User Message                                      | UI Action            |
| ----------------- | ------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid order data. Check your inputs."          | Inline field errors  |
| 409 (Conflict)    | "Credit limit exceeded or inventory unavailable." | Show alert dialog    |
| 422 (Validation)  | "Validation failed. Check required fields."       | Inline errors        |
| 403 (Forbidden)   | "You don't have permission."                      | Hide action          |
| 500 (Server)      | "Something went wrong. Try again."                | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for order/fulfillment operations

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["sales-orders", "list", { filters }][("sales-orders", "detail", orderId)][
  ("order-fulfillment", { filters })
][("sales-quotes", { filters })][("revenue-recognition", "sales")];
```

### Invalidation Rules

| Action        | Invalidates                                                            |
| ------------- | ---------------------------------------------------------------------- |
| Create Order  | `["sales-orders"]`, `["revenue-recognition"]`                          |
| Ship Order    | `["order-fulfillment"]`, `["sales-orders"]`                            |
| Convert Quote | `["sales-quotes"]`, `["sales-orders"]`                                 |
| Cancel Order  | `["sales-orders"]`, `["order-fulfillment"]`, `["revenue-recognition"]` |

### Stale Time

| Query Type          | Stale Time | Reasoning                      |
| ------------------- | ---------- | ------------------------------ |
| Sales Orders        | 2min       | Frequent updates               |
| Order Fulfillment   | 1min       | Real-time fulfillment tracking |
| Revenue Recognition | 5min       | Periodic updates               |
| Quotes              | 5min       | Moderate update frequency      |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("sales-orders");
revalidateTag("order-fulfillment");
revalidateTag("revenue-recognition");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/sales-orders.fixtures.ts`

**Datasets**:

- `minimalOrders`: 5 orders (various states)
- `standardOrders`: 20 orders across lifecycle
- `fulfillmentQueue`: 15 orders in fulfillment stages
- `edgeCases`: Credit hold, backorders, large orders, multi-POB revenue

**Edge Cases Covered**:

- Orders exceeding credit limit
- Backorder scenarios
- Multi-line orders with complex revenue recognition
- Quote-to-order conversion
- Order cancellations and modifications

---

## 🔗 API Contract Sync (CI Enforcement)

### Prevent Drift

**CI Step**: Fail build if `packages/contracts/openapi/openapi.json` changes without regenerating `types.gen.ts`.

---

## 🖥️ RSC/SSR & App Router Compatibility

### Server/Client Boundaries

- **Pages**: Server components by default
- **Interactive Parts**: Mark with `"use client"` (forms, order entry, fulfillment tracker)

### Data Fetching Strategy

| Scenario          | Strategy                          | Benefit              |
| ----------------- | --------------------------------- | -------------------- |
| Order List        | Server-side fetch + stream        | Faster TTFB          |
| Order Creation    | Client-side with credit check     | Real-time validation |
| Fulfillment Queue | Client-side with real-time update | Live monitoring      |

---

## 📊 Analytics & Audit Events

| Event                   | When                     | Properties                                        |
| ----------------------- | ------------------------ | ------------------------------------------------- |
| Sales.OrderCreated      | Order confirmed          | `order_id`, `customer_id`, `amount`, `line_count` |
| Sales.OrderShipped      | Order shipped            | `order_id`, `tracking_number`, `carrier`          |
| Sales.RevenueRecognized | Revenue recognized       | `order_id`, `amount`, `recognition_method`        |
| Sales.QuoteConverted    | Quote converted to order | `quote_id`, `order_id`, `amount`                  |
| Sales.OrderCancelled    | Order cancelled          | `order_id`, `reason`, `cancelled_by`              |

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/sales-orders.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Currency**: Multi-currency support for international sales

### Keyboard Shortcuts

| Key      | Action       | Scope       |
| -------- | ------------ | ----------- |
| `/`      | Focus search | Any page    |
| `o`      | New order    | Order list  |
| `q`      | New quote    | Quote list  |
| `s`      | Ship order   | Fulfillment |
| `Enter`  | Submit form  | Forms       |
| `Escape` | Close modal  | Modal       |

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                             | Duration | Rollback Trigger |
| ----------- | ---------------- | -------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                             | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, revenue accuracy 100%    | 2 days   | Test failures    |
| Production  | Beta users (10%) | Error rate < 0.5%, revenue accuracy 100%     | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 1 week, fulfillment on-time ≥98% | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m37_sales_orders: false,      // Master toggle
  m37_quick_entry: false,       // Quick order entry
  m37_fulfillment: false,       // Order fulfillment tracking
  m37_revenue_recognition: false, // ASC 606 revenue recognition
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Order submission success rate (≥99%)
- Fulfillment on-time rate (≥98%)
- Revenue recognition accuracy (100%)
- Credit check response time (< 500ms)

**Alert Thresholds**:

- Revenue recognition error > 0.1% → escalate (critical!)
- Order submission error rate > 1% → investigate
- Fulfillment delay > 2 days → escalate

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m37_sales_orders = false`
2. **Invalidate cache**: `revalidateTag("sales-orders")`
3. **Clear CDN cache**: `pnpm run cache:purge --path="/sales-orders/*"`
4. **Monitor for 15 minutes**
5. **Post-mortem**

**Rollback Decision Matrix**:

| Scenario                        | Action             | Approval Required |
| ------------------------------- | ------------------ | ----------------- |
| Revenue recognition error >0.1% | Immediate rollback | No (auto-trigger) |
| Order submission error > 5%     | Immediate rollback | No (auto-trigger) |
| Credit check timeout > 10s      | Immediate rollback | No (auto-trigger) |
| Fulfillment tracking errors     | Investigate first  | Ops lead          |

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

- NetSuite: Sales order workflows
- Salesforce CPQ: Quote-to-cash
- QuickBooks: Order fulfillment
- ASC 606: Revenue recognition standards

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: ASC 606 Revenue Recognition Accuracy

**Mitigation**: Automated POB identification with external audit validation; comprehensive test suite with known revenue scenarios; accounting team review before production; accuracy monitoring dashboard

### Risk #2: Credit Limit Checking Accuracy

**Mitigation**: Real-time credit service with sub-500ms response; manual override capability for approved exceptions; alert notifications for near-limit customers; integration with AR for real-time balance

### Risk #3: Order Fulfillment Complexity

**Mitigation**: Inventory integration with real-time availability; automated status tracking with notifications; clear fulfillment workflows; exception management queue

### Risk #4: Tax Calculation Accuracy

**Mitigation**: Automated tax service (Avalara/Vertex) integration; manual override capability for special cases; audit trail for all tax calculations; regular reconciliation

---

## 📝 Implementation Guide

### Day 1: Order Entry & Customer Integration (8 hours)

1. Build quick order entry form (3 hours)
2. Implement customer history integration (2 hours)
3. Add credit limit checking (2 hours)
4. Create quote management (1 hour)

### Day 2: Order Fulfillment & Tracking (8 hours)

1. Build order fulfillment tracker (3 hours)
2. Implement shipping integration (2 hours)
3. Add inventory reserve (2 hours)
4. Create fulfillment reporting (1 hour)

### Day 3: Revenue Recognition & Polish (8 hours)

1. Build revenue recognition dashboard (3 hours)
2. Implement ASC 606 POB identification (2 hours)
3. Add deferred revenue tracking (1 hour)
4. Comprehensive testing and polish (2 hours)

**Total**: 3 days (24 hours)

---

## ✅ Testing Checklist

### Unit Tests (8 tests)

- [ ] Order total calculation (line items + tax)
- [ ] Tax calculation (Avalara/Vertex integration)
- [ ] Revenue recognition logic (ASC 606 POB)
- [ ] Credit limit checking
- [ ] Discount application
- [ ] Price freeze logic
- [ ] Inventory reserve calculation
- [ ] Order state transitions

### Integration Tests (6 tests)

- [ ] Order creation → credit check → confirmation
- [ ] Order → inventory reserve → fulfillment
- [ ] Order → revenue recognition → GL posting
- [ ] Quote → conversion → order
- [ ] Credit hold → override → order confirmation
- [ ] Order cancellation workflow

### E2E Tests (7 flows)

- [ ] User can create sales order
- [ ] Manager can approve credit hold orders
- [ ] System tracks order fulfillment
- [ ] User can ship orders with tracking
- [ ] Revenue recognition occurs automatically per ASC 606
- [ ] User can convert quote to order
- [ ] User can access customer order history

### Accessibility Tests

- [ ] Keyboard navigation works (all forms accessible)
- [ ] Screen reader announces order status
- [ ] Focus management correct (modals, forms)
- [ ] Color contrast meets WCAG 2.2 AA
- [ ] Axe: 0 serious/critical violations

### Contract Tests

- [ ] API calls match OpenAPI spec
- [ ] Generated types match API responses

### Visual Regression Tests

- [ ] Storybook snapshots for order form
- [ ] Fulfillment tracker dashboard
- [ ] Revenue recognition UI

### Performance Tests

- [ ] Bundle size < 250KB gzipped
- [ ] Order creation < 2s submit
- [ ] Credit check < 500ms
- [ ] Product catalog search (1000 items) < 300ms

---

## 📅 Timeline & Milestones

| Day | Tasks                                                    | Deliverable                | Flag Status |
| --- | -------------------------------------------------------- | -------------------------- | ----------- |
| 1   | Setup + Order Entry + Customer History + Credit + Quotes | Basic order entry works    | WIP         |
| 2   | Fulfillment + Shipping + Inventory Reserve + Reporting   | Order fulfillment complete | WIP         |
| 3   | Revenue Recognition + ASC 606 + Deferred Revenue + Tests | Production-ready module    | GA          |

**Total Effort**: 3 days (24 hours)

**Feature Flags**:

- Day 1-2: `flags.m37_sales_orders = false` (hidden)
- Day 2: Enable `m37_fulfillment` incrementally
- Day 3: Enable `m37_revenue_recognition` after 100% accuracy verified

---

## 🔗 Dependencies

### Must Complete Before Starting

- ✅ M1: Core Ledger (for GL posting)
- ✅ M4: Accounts Receivable (for customer credit)
- ✅ M12: Revenue Recognition (for ASC 606)
- 🆕 Feature flag service
- 🆕 Analytics provider
- 🆕 Tax service API (Avalara/Vertex)
- 🆕 Credit service API

### Blocks These Modules

- Enhanced M4: AR (invoice generation from orders)
- Enhanced M12: Revenue Recognition (order-based revenue)
- M38: CRM Integration (order sync)
- Inventory Management (order fulfillment)

---

## 🎯 Success Criteria

### Must Have (Measurable)

- [ ] Quick sales order entry (< 2 minutes for average order)
- [ ] Credit limit checking (< 500ms response)
- [ ] Order fulfillment tracking (real-time status updates)
- [ ] Revenue recognition per ASC 606 (100% accuracy)
- [ ] Tax calculation (automated service integration)
- [ ] Order submission success rate ≥99%
- [ ] Fulfillment on-time rate ≥98%
- [ ] Quote-to-order conversion
- [ ] Customer order history
- [ ] Axe: 0 serious/critical violations

### Should Have

- [ ] Product recommendations based on history
- [ ] Bulk line entry
- [ ] Reorder from history (one-click)
- [ ] Shipping tracking integration
- [ ] Automated customer notifications
- [ ] Backorder management

### Nice to Have

- [ ] AI-powered product recommendations
- [ ] Customer portal integration
- [ ] Multi-currency orders
- [ ] Order templates
- [ ] Advanced pricing rules

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/dashboard`, `/create`, `/fulfillment`)
- [ ] Quick sales order entry with credit checking
- [ ] Order fulfillment tracking
- [ ] Revenue recognition per ASC 606
- [ ] Quote management and conversion
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

- [ ] Unit tests: ≥90% line coverage, ≥95% for revenue recognition logic
- [ ] Integration tests: All order/fulfillment workflows covered
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Order creation with credit check
- Fulfillment workflow
- ASC 606 revenue recognition
- Quote-to-order conversion

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/sales-orders/*` routes
- [ ] TTFB: ≤70ms on staging
- [ ] TTI: ≤200ms for `/sales-orders`
- [ ] Order creation: < 2s submit
- [ ] Credit check: < 500ms
- [ ] Tax calculation: < 300ms

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

### Revenue Recognition Accuracy 🎯

**CRITICAL - 100% revenue recognition accuracy required before production!**

- [ ] Revenue recognition accuracy 100% on test order dataset (100+ orders)
- [ ] POB identification accuracy ≥98%
- [ ] Deferred revenue calculation 100% accurate
- [ ] ASC 606 disclosure reports validated by accounting
- [ ] External audit validation before production
- [ ] Revenue recognition monitoring dashboard

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `Sales.OrderCreated`
  - `Sales.OrderShipped`
  - `Sales.RevenueRecognized`
  - `Sales.QuoteConverted`
  - `Sales.OrderCancelled`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (revenue errors, credit check timeouts, fulfillment delays)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Idempotency keys on all mutations
- [ ] Rate limiting tested
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] Audit trail for all order operations
- [ ] PII protection (credit card masking)

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
  - `flags.m37_sales_orders = false` (ready to enable)
  - `flags.m37_quick_entry = false` (phase 2)
  - `flags.m37_fulfillment = false` (phase 2)
  - `flags.m37_revenue_recognition = false` (phase 2)
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
- [ ] **Accounting**: Revenue recognition validated, ASC 606 compliance approved

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M36 - Purchase Orders  
**Next**: M38 - CRM Integration
