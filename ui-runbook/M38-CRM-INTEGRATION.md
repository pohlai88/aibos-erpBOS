# 🚀 M38: CRM Integration - UI Implementation Runbook

**Module ID**: M38  
**Module Name**: CRM Integration  
**Priority**: LOW  
**Phase**: 10 - Extended Modules  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

M38 provides seamless bi-directional integration with Salesforce, HubSpot, and other CRM systems. This module synchronizes customers, opportunities, quotes, and orders between CRM and ERP, eliminating data silos and providing a unified view of customer relationships.

### Business Value

- **Data Synchronization**: Eliminate manual data entry between CRM and ERP
- **360° Customer View**: See financial data (AR, orders, payments) alongside CRM data
- **Quote-to-Cash Automation**: Seamless opportunity → quote → order → invoice flow
- **Sales Efficiency**: Sales teams access financial data without switching systems
- **Revenue Visibility**: Real-time pipeline value with win probability and close dates

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

- ✅ `/api/crm/sync` - Data synchronization
- ✅ `/api/crm/customers` - Customer mapping
- ✅ `/api/crm/opportunities` - Opportunity tracking
- ✅ `/api/crm/quotes` - Quote management

**Total Endpoints**: 8

---

## 🎯 3 Killer Features

### 1. **Salesforce Sync Dashboard** 🚀

**Description**: Real-time bidirectional sync between Salesforce and aibos with conflict resolution, sync history, and field mapping configuration. Features automatic customer creation, opportunity tracking, and closed-won order generation.

**Why It's Killer**:

- **Bi-Directional Sync**: Changes flow both ways automatically (competitors are one-way)
- **Conflict Resolution**: Smart handling of concurrent updates
- **Real-Time**: Sub-5-minute sync frequency (competitors sync daily)
- **Measurable Impact**: Eliminate 10+ hours/week of manual data entry
- **Vs Native Connectors**: More flexible field mapping and transformation rules

**Implementation**:

```typescript
import { Card, Badge, DataTable, Button, Toggle, Alert } from "aibos-ui";
import { useSalesforceSync, useTriggerSync } from "@/hooks/useCRM";

export default function SalesforceSyncDashboard() {
  const { syncStatus, syncHistory, conflicts } = useSalesforceSync();
  const { triggerSync, resolveCon flict } = useTriggerSync();

  return (
    <div className="space-y-6">
      <Card title="Salesforce Integration">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-4">
              <Badge
                variant={syncStatus.connected ? "success" : "error"}
                size="lg"
              >
                {syncStatus.connected ? "Connected" : "Disconnected"}
              </Badge>
              <div>
                <div className="text-sm text-gray-600">Last Sync:</div>
                <div className="font-semibold">{syncStatus.last_sync_time}</div>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <Toggle
              label="Auto Sync"
              checked={syncStatus.auto_sync_enabled}
              onChange={(enabled) => updateAutoSync(enabled)}
            />
            <Button variant="primary" onClick={triggerSync}>
              Sync Now
            </Button>
            <Button variant="outline">Configure</Button>
          </div>
        </div>
      </Card>

      {conflicts.length > 0 && (
        <Alert variant="warning">
          <strong>{conflicts.length} Sync Conflicts Detected!</strong>
          <p>Review and resolve conflicts below.</p>
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Synced Customers</h3>
          <div className="text-4xl font-bold">{syncStatus.synced_customers}</div>
        </Card>
        <Card>
          <h3>Synced Opportunities</h3>
          <div className="text-4xl font-bold">{syncStatus.synced_opportunities}</div>
        </Card>
        <Card>
          <h3>Sync Success Rate</h3>
          <div className="text-4xl font-bold text-green-600">
            {syncStatus.success_rate}%
          </div>
        </Card>
      </div>

      {conflicts.length > 0 && (
        <Card title="Sync Conflicts">
          <DataTable
            data={conflicts}
            columns={[
              { key: "record_type", label: "Type" },
              { key: "record_name", label: "Record" },
              { key: "field_name", label: "Field" },
              {
                key: "salesforce_value",
                label: "Salesforce Value",
                render: (_, row) => (
                  <Badge variant="info">{row.salesforce_value}</Badge>
                ),
              },
              {
                key: "aibos_value",
                label: "aibos Value",
                render: (_, row) => (
                  <Badge variant="warning">{row.aibos_value}</Badge>
                ),
              },
              {
                key: "actions",
                label: "Resolve",
                render: (_, row) => (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        resolveConflict(row.id, "salesforce")
                      }
                    >
                      Use Salesforce
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveConflict(row.id, "aibos")}
                    >
                      Use aibos
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      <Card title="Sync History">
        <DataTable
          data={syncHistory}
          columns={[
            { key: "sync_time", label: "Time" },
            { key: "direction", label: "Direction" },
            { key: "record_type", label: "Type" },
            { key: "records_synced", label: "Records" },
            {
              key: "status",
              label: "Status",
              render: (_, row) => (
                <Badge
                  variant={
                    row.status === "Success"
                      ? "success"
                      : row.status === "Partial"
                        ? "warning"
                        : "error"
                  }
                >
                  {row.status}
                </Badge>
              ),
            },
            { key: "duration", label: "Duration" },
          ]}
        />
      </Card>
    </div>
  );
}
```

### 2. **Customer 360 View** ⚡

**Description**: Unified customer dashboard showing CRM data (contacts, activities, notes) alongside ERP data (AR balance, orders, payments, credit limit). Features timeline of all customer interactions and financial transactions.

**Why It's Killer**:

- **Complete View**: Sales + Finance data in one place (competitors silo data)
- **Real-Time Financial Data**: See AR balance, credit limit, payment history
- **Activity Timeline**: Every interaction and transaction chronologically
- **Measurable Impact**: Reduce customer research time from 15 min to 2 min

**Implementation**:

```typescript
import { Card, Badge, Timeline, DataTable, Tabs } from "aibos-ui";
import { useCustomer360 } from "@/hooks/useCRM";

export default function Customer360View() {
  const { customer, financial, activities, orders } = useCustomer360();

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{customer.name}</h1>
            <p className="text-gray-600">{customer.industry}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="info">{customer.type}</Badge>
              <Badge
                variant={customer.status === "Active" ? "success" : "default"}
              >
                {customer.status}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">AR Balance</div>
            <div className="text-3xl font-bold text-red-600">
              ${financial.ar_balance.toLocaleString()}
            </div>
            <div className="text-sm mt-2">
              Credit Limit: ${financial.credit_limit.toLocaleString()}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>YTD Revenue</h3>
          <div className="text-3xl font-bold text-green-600">
            ${(financial.ytd_revenue / 1000).toFixed(0)}K
          </div>
        </Card>
        <Card>
          <h3>Open Orders</h3>
          <div className="text-3xl font-bold">{orders.open_count}</div>
          <div className="text-sm text-gray-600">
            ${(orders.open_value / 1000).toFixed(0)}K value
          </div>
        </Card>
        <Card>
          <h3>Days Sales Outstanding</h3>
          <div className="text-3xl font-bold">{financial.dso} days</div>
        </Card>
        <Card>
          <h3>Lifetime Value</h3>
          <div className="text-3xl font-bold">
            ${(financial.lifetime_value / 1000).toFixed(0)}K
          </div>
        </Card>
      </div>

      <Card>
        <Tabs
          tabs={[
            { id: "timeline", label: "Activity Timeline" },
            { id: "orders", label: `Orders (${orders.orders.length})` },
            {
              id: "invoices",
              label: `Invoices (${financial.invoices.length})`,
            },
            { id: "contacts", label: `Contacts (${customer.contacts.length})` },
          ]}
        >
          <Tab id="timeline">
            <Timeline
              items={activities.map((activity) => ({
                date: activity.date,
                title: activity.title,
                description: activity.description,
                icon:
                  activity.type === "order"
                    ? "📦"
                    : activity.type === "payment"
                    ? "💰"
                    : "👤",
                status:
                  activity.type === "order"
                    ? "info"
                    : activity.type === "payment"
                    ? "success"
                    : "default",
              }))}
            />
          </Tab>

          <Tab id="orders">
            <DataTable
              data={orders.orders}
              columns={[
                { key: "order_number", label: "Order #" },
                { key: "order_date", label: "Date" },
                {
                  key: "amount",
                  label: "Amount",
                  render: (_, row) => `$${row.amount.toLocaleString()}`,
                },
                {
                  key: "status",
                  label: "Status",
                  render: (_, row) => <Badge>{row.status}</Badge>,
                },
              ]}
            />
          </Tab>

          <Tab id="invoices">
            <DataTable
              data={financial.invoices}
              columns={[
                { key: "invoice_number", label: "Invoice #" },
                { key: "invoice_date", label: "Date" },
                {
                  key: "amount",
                  label: "Amount",
                  render: (_, row) => `$${row.amount.toLocaleString()}`,
                },
                { key: "due_date", label: "Due Date" },
                {
                  key: "status",
                  label: "Status",
                  render: (_, row) => (
                    <Badge
                      variant={
                        row.status === "Paid"
                          ? "success"
                          : row.days_overdue > 0
                          ? "error"
                          : "warning"
                      }
                    >
                      {row.status}
                    </Badge>
                  ),
                },
              ]}
            />
          </Tab>

          <Tab id="contacts">
            <DataTable
              data={customer.contacts}
              columns={[
                { key: "name", label: "Name" },
                { key: "title", label: "Title" },
                { key: "email", label: "Email" },
                { key: "phone", label: "Phone" },
                {
                  key: "primary",
                  label: "Primary",
                  render: (_, row) =>
                    row.primary && <Badge variant="success">Primary</Badge>,
                },
              ]}
            />
          </Tab>
        </Tabs>
      </Card>
    </div>
  );
}
```

### 3. **Opportunity Pipeline Dashboard** 💎

**Description**: Sales pipeline visualization from Salesforce with financial ERP data overlay. Features pipeline value, weighted forecast, conversion rates, and automatic order creation from closed-won opportunities.

**Why It's Killer**:

- **Pipeline Visibility**: Real-time view of all opportunities with ERP financial data
- **Weighted Forecast**: Revenue forecast based on opportunity probability
- **Auto-Order Creation**: Closed-won opps automatically create sales orders
- **Measurable Impact**: Improve forecast accuracy by 30%

**Implementation**:

```typescript
import { Card, Chart, Badge, DataTable } from "aibos-ui";
import { useOpportunityPipeline } from "@/hooks/useCRM";

export default function OpportunityPipelineDashboard() {
  const { pipeline, forecast, stats } = useOpportunityPipeline();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Pipeline Value</h3>
          <div className="text-3xl font-bold">
            ${(stats.total_pipeline_value / 1_000_000).toFixed(1)}M
          </div>
        </Card>
        <Card>
          <h3>Weighted Forecast</h3>
          <div className="text-3xl font-bold text-green-600">
            ${(stats.weighted_forecast / 1_000_000).toFixed(1)}M
          </div>
        </Card>
        <Card>
          <h3>Win Rate</h3>
          <div className="text-4xl font-bold">{stats.win_rate}%</div>
        </Card>
        <Card>
          <h3>Avg Deal Size</h3>
          <div className="text-3xl font-bold">
            ${(stats.avg_deal_size / 1000).toFixed(0)}K
          </div>
        </Card>
      </div>

      <Card title="Pipeline by Stage">
        <Chart
          type="funnel"
          data={{
            labels: pipeline.stages.map((s) => s.name),
            datasets: [
              {
                data: pipeline.stages.map((s) => s.value),
                backgroundColor: [
                  "rgb(59, 130, 246)",
                  "rgb(34, 197, 94)",
                  "rgb(249, 115, 22)",
                  "rgb(168, 85, 247)",
                  "rgb(236, 72, 153)",
                ],
              },
            ],
          }}
        />
      </Card>

      <Card title="Top Opportunities">
        <DataTable
          data={pipeline.opportunities}
          columns={[
            { key: "opportunity_name", label: "Opportunity" },
            { key: "account_name", label: "Account" },
            {
              key: "amount",
              label: "Amount",
              render: (_, row) => `$${row.amount.toLocaleString()}`,
            },
            {
              key: "probability",
              label: "Probability",
              render: (_, row) => <Badge>{row.probability}%</Badge>,
            },
            {
              key: "weighted_value",
              label: "Weighted",
              render: (_, row) => `$${row.weighted_value.toLocaleString()}`,
            },
            { key: "close_date", label: "Close Date" },
            { key: "stage", label: "Stage" },
            {
              key: "ar_balance",
              label: "Current AR",
              render: (_, row) =>
                row.ar_balance > 0 && (
                  <span className="text-red-600">
                    ${row.ar_balance.toLocaleString()}
                  </span>
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

#### 1. Sync Dashboard (`/crm/sync`)

**Components**: Card, DataTable, Badge, Toggle, Alert
**File**: `apps/web/app/(dashboard)/crm/sync/page.tsx`

#### 2. Customer 360 (`/crm/customers/[id]`)

**Components**: Card, Tabs, Timeline, DataTable
**File**: `apps/web/app/(dashboard)/crm/customers/[id]/page.tsx`

#### 3. Pipeline (`/crm/pipeline`)

**Components**: Chart, DataTable, Badge, Card
**File**: `apps/web/app/(dashboard)/crm/pipeline/page.tsx`

---

## 🔌 API Integration

```typescript
// apps/web/hooks/useCRM.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@aibos/api-client';

export function useSalesforceSync() {
  return useQuery({
    queryKey: ['salesforce-sync'],
    queryFn: () => apiClient.GET('/api/crm/sync'),
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useCustomer360(customerId) {
  return useQuery({
    queryKey: ['customer-360', customerId],
    queryFn: () => apiClient.GET(`/api/crm/customers/${customerId}`),
  });
}

export function useOpportunityPipeline() {
  return useQuery({
    queryKey: ['opportunity-pipeline'],
    queryFn: () => apiClient.GET('/api/crm/opportunities'),
  });
}
```

---

## 📝 Implementation Guide

### Day 1: Sync & Customer 360 (8 hours)

1. Build Salesforce sync dashboard (3 hours)
2. Implement conflict resolution (2 hours)
3. Create Customer 360 view (3 hours)

### Day 2: Pipeline & Opportunity (8 hours)

1. Build opportunity pipeline dashboard (3 hours)
2. Implement weighted forecast (2 hours)
3. Create auto-order generation (3 hours)

**Total**: 2 days (16 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Sync conflict resolution logic
- [ ] Field mapping transformation
- [ ] Weighted forecast calculation

### Integration Tests

- [ ] Bi-directional sync with Salesforce
- [ ] Customer data aggregation
- [ ] Opportunity to order conversion

### E2E Tests

- [ ] User can configure and trigger sync
- [ ] User can view Customer 360
- [ ] Closed-won opp creates sales order

---

## 📅 Timeline

| Day | Deliverable                         |
| --- | ----------------------------------- |
| 1   | Salesforce sync and Customer 360    |
| 2   | Opportunity pipeline and automation |

**Total**: 2 days (16 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M4: Accounts Receivable
- ✅ M37: Sales Orders

### Enables These Modules

- Enhanced M37: Sales Orders (CRM-driven orders)
- Enhanced M4: AR (CRM customer visibility)

---

## 🎯 Success Criteria

### Must Have

- [ ] Bi-directional Salesforce sync
- [ ] Customer 360 view
- [ ] Opportunity pipeline dashboard

### Should Have

- [ ] Conflict resolution
- [ ] Auto-order from closed-won
- [ ] Weighted forecast

### Nice to Have

- [ ] HubSpot integration
- [ ] Custom field mapping UI
- [ ] Sync scheduling configuration

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M37 - Sales Orders  
**Next**: M39 - Analytics & BI
