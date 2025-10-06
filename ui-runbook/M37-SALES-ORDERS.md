# 🚀 M37: Sales Orders - UI Implementation Runbook

**Module ID**: M37  
**Module Name**: Sales Orders  
**Priority**: MEDIUM  
**Phase**: 10 - Extended Modules  
**Estimated Effort**: 1.5 days  
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

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 10 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/sales-orders` - Sales order management
- ✅ `/api/sales-orders/fulfillment` - Order fulfillment
- ✅ `/api/sales-orders/quotes` - Quote conversion

**Total Endpoints**: 10

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

## 🔌 API Integration

```typescript
// apps/web/hooks/useSalesOrders.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function useSalesOrder() {
  return useMutation({
    mutationFn: (orderData) =>
      apiClient.POST("/api/sales-orders", { body: orderData }),
    onSuccess: () => queryClient.invalidateQueries(["sales-orders"]),
  });
}

export function useOrderFulfillment() {
  return useQuery({
    queryKey: ["order-fulfillment"],
    queryFn: () => apiClient.GET("/api/sales-orders/fulfillment"),
  });
}

export function useRevenueRecognition() {
  return useQuery({
    queryKey: ["sales-revenue-recognition"],
    queryFn: () => apiClient.GET("/api/sales-orders/revenue"),
  });
}
```

---

## 📝 Implementation Guide

### Day 1: Order Entry & Fulfillment (8 hours)

1. Build sales order entry form (4 hours)
2. Implement order fulfillment tracker (3 hours)
3. Create customer history integration (1 hour)

### Day 2: Revenue Recognition (4 hours)

1. Build revenue recognition dashboard (2 hours)
2. Implement deferred revenue tracking (2 hours)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Order total calculation
- [ ] Tax calculation
- [ ] Revenue recognition logic

### Integration Tests

- [ ] Order creation to fulfillment
- [ ] Revenue recognition from orders
- [ ] Credit limit checking

### E2E Tests

- [ ] User can create sales order
- [ ] System tracks order fulfillment
- [ ] Revenue recognition occurs automatically

---

## 📅 Timeline

| Day | Deliverable                       |
| --- | --------------------------------- |
| 1   | Sales order entry and fulfillment |
| 2   | Revenue recognition integration   |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M4: Accounts Receivable
- ✅ M12: Revenue Recognition

### Enables These Modules

- Enhanced M4: AR (invoice generation from orders)
- Enhanced M12: Revenue Recognition (order-based revenue)

---

## 🎯 Success Criteria

### Must Have

- [ ] Quick sales order entry form
- [ ] Order fulfillment tracking
- [ ] Revenue recognition integration

### Should Have

- [ ] Customer order history
- [ ] Credit limit checking
- [ ] Shipping integration

### Nice to Have

- [ ] AI-powered product recommendations
- [ ] Quote-to-order conversion
- [ ] Customer portal integration

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M36 - Purchase Orders  
**Next**: M38 - CRM Integration
