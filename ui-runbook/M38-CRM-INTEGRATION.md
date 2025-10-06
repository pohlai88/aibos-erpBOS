# 🚀 M38: CRM Integration - UI Implementation Runbook

**Module ID**: M38  
**Module Name**: CRM Integration  
**Priority**: MEDIUM  
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

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-salesforce-sync], [ADR-###-customer360], [ADR-###-opportunity-pipeline]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 12 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

**Synchronization** (4 endpoints):

- ✅ `/api/crm/sync` - Sync status and history
- ✅ `/api/crm/sync/trigger` - Manual sync trigger
- ✅ `/api/crm/sync/conflicts` - List conflicts
- ✅ `/api/crm/sync/resolve` - Resolve conflict

**Customer Management** (3 endpoints):

- ✅ `/api/crm/customers` - List customers
- ✅ `/api/crm/customers/[id]` - Customer 360 view
- ✅ `/api/crm/customers/sync` - Sync customer

**Opportunities** (3 endpoints):

- ✅ `/api/crm/opportunities` - Opportunity pipeline
- ✅ `/api/crm/opportunities/[id]` - Opportunity details
- ✅ `/api/crm/opportunities/convert` - Convert to order

**Configuration** (2 endpoints):

- ✅ `/api/crm/config` - CRM configuration
- ✅ `/api/crm/field-mapping` - Field mapping rules

**Total Endpoints**: 12 (4 categories)

### Risks & Blockers

| Risk                          | Impact | Mitigation                                                    | Owner    |
| ----------------------------- | ------ | ------------------------------------------------------------- | -------- |
| Bi-directional sync conflicts | HIGH   | Conflict resolution UI; last-write-wins strategy; audit trail | @backend |
| API rate limiting             | MED    | Batch sync; queue management; retry logic; incremental sync   | @backend |
| Data mapping complexity       | MED    | Configurable field mapping; transformation rules; validation  | @ops     |
| Sync reliability              | HIGH   | Health monitoring; automatic retry; failure alerts; logging   | @ops     |

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

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                  | Target          | Measurement          |
| ----------------------- | --------------- | -------------------- |
| TTFB (staging)          | ≤ 70ms          | Server timing header |
| Client TTI for `/crm`   | ≤ 200ms         | Lighthouse CI        |
| Sync operation          | < 5min          | Performance profiler |
| Customer 360 load       | < 1s            | API response time    |
| Pipeline dashboard load | < 1.5s          | API response time    |
| Conflict resolution     | < 500ms         | API response time    |
| UI bundle size          | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access for all dashboards and forms
- **Focus Management**: Logical tab order; focus indicators
- **ARIA**: Sync status announced; pipeline updates communicated
- **Screen Reader**: All data visualizations accessible; dynamic updates announced
- **Axe Target**: 0 serious/critical violations

### Security

| Layer         | Requirement                                                  |
| ------------- | ------------------------------------------------------------ |
| RBAC Scopes   | `crm.read`, `crm.sync`, `crm.admin`                          |
| Enforcement   | Server-side on all endpoints                                 |
| Data Exposure | Only show CRM data user has permission for                   |
| Audit Trail   | Immutable logs for all sync operations, conflict resolutions |
| API Keys      | Encrypted CRM API credentials; rotate every 90 days          |
| OAuth Tokens  | Secure token storage; automatic refresh; revocation support  |

#### UI Permissions Matrix

| Role      | View | Manual Sync | Resolve Conflicts | Configure Mapping | Admin |
| --------- | ---- | ----------- | ----------------- | ----------------- | ----- |
| crm.read  | ✅   | ❌          | ❌                | ❌                | ❌    |
| crm.sync  | ✅   | ✅          | ✅                | ❌                | ❌    |
| crm.admin | ✅   | ✅          | ✅                | ✅                | ✅    |

### Reliability & Observability

- **SLO**: 99% successful sync operations; <5min sync frequency
- **SLA Dashboards**: Real-time metrics on sync health, conflict rate
- **Events Emitted**: `CRM.SyncStarted`, `CRM.SyncCompleted`, `CRM.ConflictDetected`
- **Logging**: Structured logs with sync IDs for all operations
- **Tracing**: Distributed tracing for sync workflows

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### CRM Integration Business Rules

| Rule                    | Enforcement                                         |
| ----------------------- | --------------------------------------------------- |
| **Bi-Directional Sync** | Changes flow CRM ↔ ERP with conflict resolution     |
| **Last-Write-Wins**     | Most recent update wins in conflicts (configurable) |
| **Field Mapping**       | Configurable field-to-field mapping rules           |
| **Auto-Order Creation** | Closed-won opportunities auto-create sales orders   |
| **Customer Matching**   | Match by email, CRM ID, or custom key               |
| **Sync Frequency**      | Default 5min; configurable 1min-1hr                 |
| **Conflict Resolution** | Manual review required for high-value conflicts     |

### Sync States

- **Idle**: No sync running
- **Syncing**: Sync in progress
- **Success**: Sync completed successfully
- **Partial**: Sync completed with some conflicts
- **Failed**: Sync failed (retry scheduled)
- **Conflict**: Conflicts detected (manual resolution required)

### Archive Semantics

- **Sync History**: Retain all sync logs (90 days)
- **Audit Trail**: Immutable conflict resolution history
- **Guard Rails**:
  - ❌ Deny sync if CRM credentials expired
  - ❌ Deny sync if rate limit exceeded
  - ✅ Allow manual conflict resolution

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                        | User Action        |
| --------------------- | --------------------------------- | ------------------ |
| **Empty**             | "No CRM connected"                | "Connect CRM"      |
| **Loading**           | Skeleton dashboards               | N/A                |
| **Error**             | Error message + retry             | Retry / Support    |
| **Connected**         | Green badge "Connected"           | View Sync History  |
| **Syncing**           | Blue badge "Syncing..."           | View Progress      |
| **Sync Complete**     | Green badge "Synced"              | View Results       |
| **Conflicts**         | Orange alert "Conflicts Detected" | Resolve            |
| **Disconnected**      | Red badge "Disconnected"          | Reconnect          |
| **Rate Limited**      | Yellow alert "Rate Limited"       | Wait / Retry Later |
| **Permission Denied** | "Access restricted"               | Back               |

### Form Validation

- **Sync Config**: Valid CRM credentials, sync frequency
- **Field Mapping**: Valid source/target fields
- **Conflict Resolution**: Select winning value

### Network Errors

| HTTP Status | UI Message                                    | Action              |
| ----------- | --------------------------------------------- | ------------------- |
| 400         | "Invalid CRM configuration. Check settings."  | Inline field errors |
| 401         | "CRM authentication expired. Reconnect."      | Reconnect CRM       |
| 403         | "You don't have permission."                  | Hide action         |
| 404         | "CRM record not found."                       | Refresh sync        |
| 409         | "Sync conflict detected. Review and resolve." | Show conflicts      |
| 422         | "Validation failed. Check field mapping."     | Inline errors       |
| 429         | "CRM API rate limit exceeded. Retry later."   | Show wait time      |
| 500         | "Something went wrong. Try again."            | Retry button        |

---

## 📝 UX Copy Deck

### Page Titles & Headers

| Context       | Copy                   | i18n Key                |
| ------------- | ---------------------- | ----------------------- |
| Dashboard     | "CRM Integration"      | `crm.dashboard.title`   |
| Sync Status   | "Sync Dashboard"       | `crm.sync.title`        |
| Customer 360  | "Customer 360"         | `crm.customer360.title` |
| Pipeline      | "Opportunity Pipeline" | `crm.pipeline.title`    |
| Configuration | "CRM Settings"         | `crm.config.title`      |

### State Messages

| State        | Title                | Message                         | Action Button | i18n Key          |
| ------------ | -------------------- | ------------------------------- | ------------- | ----------------- |
| Empty        | "No CRM connected"   | "Connect your CRM to sync data" | "Connect CRM" | `crm.empty.*`     |
| Syncing      | "Syncing..."         | "Sync in progress"              | N/A           | `crm.syncing.*`   |
| Conflicts    | "Conflicts detected" | "{count} conflicts need review" | "Review"      | `crm.conflicts.*` |
| Rate Limited | "Rate limited"       | "CRM API limit reached"         | "View Limits" | `crm.limited.*`   |

### Success Messages (Toast)

| Action            | Message                           | i18n Key              | Shortcut |
| ----------------- | --------------------------------- | --------------------- | -------- |
| Sync Complete     | "Sync completed. {count} records" | `crm.sync.success`    | `s`      |
| Conflict Resolved | "Conflict resolved"               | `crm.resolve.success` | `r`      |
| CRM Connected     | "CRM connected successfully"      | `crm.connect.success` | `c`      |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useCRM.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function useSalesforceSync() {
  const queryClient = useQueryClient();

  const { data: syncStatus, isLoading } = useQuery({
    queryKey: ["crm-sync"],
    queryFn: () => apiClient.GET("/api/crm/sync"),
    staleTime: 30_000, // 30s
    refetchInterval: 60_000, // Refresh every minute
    retry: 2,
  });

  const triggerSync = useMutation({
    mutationFn: () => apiClient.POST("/api/crm/sync/trigger"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-sync"] });
      queryClient.invalidateQueries({ queryKey: ["crm-customers"] });
    },
  });

  const resolveConflict = useMutation({
    mutationFn: ({
      conflictId,
      resolution,
    }: {
      conflictId: string;
      resolution: "salesforce" | "aibos";
    }) =>
      apiClient.POST("/api/crm/sync/resolve", {
        body: { conflictId, resolution },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-sync"] });
    },
  });

  return {
    syncStatus: syncStatus?.data,
    isLoading,
    triggerSync: triggerSync.mutate,
    resolveConflict: resolveConflict.mutate,
  };
}

export function useCustomer360(customerId: string) {
  return useQuery({
    queryKey: ["crm-customer360", customerId],
    queryFn: () =>
      apiClient.GET("/api/crm/customers/[id]", { params: { id: customerId } }),
    staleTime: 2 * 60_000, // 2min
    enabled: !!customerId,
    select: (response) => response.data,
  });
}

export function useOpportunityPipeline(filters = {}) {
  const queryClient = useQueryClient();

  const { data: pipeline, isLoading } = useQuery({
    queryKey: ["crm-pipeline", filters],
    queryFn: () => apiClient.GET("/api/crm/opportunities", { query: filters }),
    staleTime: 5 * 60_000, // 5min
    retry: 2,
    select: (response) => response.data,
  });

  const convertToOrder = useMutation({
    mutationFn: (opportunityId: string) =>
      apiClient.POST("/api/crm/opportunities/convert", {
        body: { opportunityId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["sales-orders"] });
    },
    onError: (error) => {
      if (error.status === 409) {
        toast.error("Opportunity already converted");
      }
    },
  });

  return {
    pipeline: pipeline || { opportunities: [], stats: {}, stages: [] },
    isLoading,
    convertToOrder: convertToOrder.mutate,
  };
}

export function useCRMConfig() {
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ["crm-config"],
    queryFn: () => apiClient.GET("/api/crm/config"),
    staleTime: 10 * 60_000, // 10min
  });

  const updateConfig = useMutation({
    mutationFn: (newConfig) =>
      apiClient.PUT("/api/crm/config", { body: newConfig }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-config"] });
    },
  });

  return {
    config: config?.data,
    updateConfig: updateConfig.mutate,
  };
}
```

### Error Mapping

| API Error          | User Message                                  | UI Action            |
| ------------------ | --------------------------------------------- | -------------------- |
| 401 (Unauthorized) | "CRM authentication expired. Reconnect."      | Reconnect CRM        |
| 409 (Conflict)     | "Sync conflict detected. Review and resolve." | Show conflicts       |
| 422 (Validation)   | "Validation failed. Check field mapping."     | Inline errors        |
| 429 (Rate Limit)   | "CRM API rate limit exceeded. Retry later."   | Show wait time       |
| 500 (Server)       | "Something went wrong. Try again."            | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry for sync operations; user-initiated retry only
- **Rate Limiting**: Respect CRM API rate limits; show countdown timer

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["crm-sync"][("crm-customer360", customerId)][("crm-pipeline", { filters })][
  "crm-config"
];
```

### Invalidation Rules

| Action              | Invalidates                                             |
| ------------------- | ------------------------------------------------------- |
| Trigger Sync        | `["crm-sync"]`, `["crm-customers"]`, `["crm-pipeline"]` |
| Resolve Conflict    | `["crm-sync"]`                                          |
| Convert Opportunity | `["crm-pipeline"]`, `["sales-orders"]`                  |
| Update Config       | `["crm-config"]`, `["crm-sync"]`                        |

### Stale Time

| Query Type    | Stale Time | Reasoning                        |
| ------------- | ---------- | -------------------------------- |
| Sync Status   | 30s        | Real-time sync monitoring        |
| Customer 360  | 2min       | Moderate update frequency        |
| Pipeline      | 5min       | CRM data updates less frequently |
| Configuration | 10min      | Rarely changes                   |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("crm-sync"); // After sync operations
revalidateTag(`crm-customer-${customerId}`); // Specific customer
```

---

## 📝 Implementation Guide

### Step 0: Foundation Setup (1 hour)

- Enable feature flags: `flags.m38_crm = false`
- Configure CRM API credentials (Salesforce OAuth)
- Wire analytics provider for sync events

### Step 1: Build Sync Dashboard (4 hours)

- Sync status display
- Manual sync trigger
- Sync history table
- Conflict resolution UI

### Step 2: Build Customer 360 View (4 hours)

- Customer header card
- Financial metrics grid
- Activity timeline
- Orders/invoices/contacts tabs

### Step 3: Build Pipeline Dashboard (4 hours)

- Pipeline funnel chart
- Opportunity table
- Weighted forecast calculation
- Convert-to-order action

### Step 4: Add Configuration (2 hours)

- CRM connection settings
- Field mapping configuration
- Sync frequency settings

### Step 5: Add Tests (2 hours)

- Unit tests for sync logic, conflict resolution
- Integration tests for bi-directional sync
- E2E tests for complete user flows

**Total**: 2 days (16 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Sync conflict resolution logic (last-write-wins strategy)
- [ ] Field mapping transformation rules
- [ ] Weighted forecast calculation (amount × probability)
- [ ] Customer matching algorithm (email, CRM ID)
- [ ] Opportunity-to-order conversion logic
- [ ] Rate limit handling with retry logic
- [ ] Sync history aggregation

### Integration Tests

- [ ] Bi-directional sync with Salesforce
- [ ] Customer data aggregation (CRM + ERP)
- [ ] Opportunity to order conversion
- [ ] Conflict detection and resolution
- [ ] Field mapping application
- [ ] Sync queue processing

### E2E Tests

- [ ] User can connect Salesforce
- [ ] User can configure and trigger sync
- [ ] User can view Customer 360
- [ ] User can resolve sync conflicts
- [ ] Closed-won opportunity creates sales order
- [ ] Pipeline dashboard displays correctly
- [ ] Sync history displays all operations
- [ ] Rate limit handling works

### Accessibility Tests

- [ ] Keyboard navigation works
- [ ] Screen reader announces sync status changes
- [ ] Focus management correct
- [ ] Color contrast meets WCAG 2.2 AA
- [ ] Axe: 0 serious/critical violations

### Contract Tests

- [ ] API calls match OpenAPI spec
- [ ] CRM API integration conforms to Salesforce API spec

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for all components

### Performance Tests

- [ ] Bundle size < 250KB gzipped
- [ ] Sync operation completes < 5min (1000 records)
- [ ] Customer 360 load < 1s

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/crm.fixtures.ts`

**Datasets**:

- `minimalSync`: 5 customers, 3 opportunities
- `standardSync`: 50 customers, 20 opportunities, 10 conflicts
- `largeDataset`: 500 customers, 100 opportunities (for performance testing)
- `edgeCases`: Special scenarios

**Edge Cases Covered**:

- Sync conflicts (field-level)
- Rate limit exceeded
- CRM authentication expired
- Opportunity already converted
- Missing required fields
- Duplicate customer detection

### E2E Seed Data

**Location**: `tests/seeds/crm.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:crm
```

**Dataset**:

- 100 synced customers
- 50 opportunities across all stages
- 10 sync conflicts (unresolved)
- Sync history (last 30 days)

**Cleanup Command**:

```powershell
pnpm run seed:crm:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic company names and contacts
- Opportunity pipeline with win probabilities
- Customer 360 data with financial history
- Sample sync conflicts for demo

**Regeneration**:

```powershell
pnpm run demo:reset:crm
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] No orphaned CRM references
- [ ] Customer matching logic works correctly

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
- **Interactive Parts**: Mark with `"use client"` (dashboards, forms)

### Data Fetching Strategy

| Scenario       | Strategy                   | Benefit             |
| -------------- | -------------------------- | ------------------- |
| Sync Dashboard | Client-side with polling   | Real-time updates   |
| Customer 360   | Server-side fetch + stream | Faster TTFB         |
| Pipeline       | Client-side React Query    | Interactive filters |

---

## 📊 Analytics & Audit Events

| Event                    | When                   | Properties                                 |
| ------------------------ | ---------------------- | ------------------------------------------ |
| CRM.SyncStarted          | Sync initiated         | `sync_id`, `direction`, `record_type`      |
| CRM.SyncCompleted        | Sync finished          | `sync_id`, `records_synced`, `duration_ms` |
| CRM.ConflictDetected     | Conflict found         | `sync_id`, `record_id`, `field_name`       |
| CRM.ConflictResolved     | Conflict resolved      | `conflict_id`, `resolution_strategy`       |
| CRM.OpportunityConverted | Opp converted to order | `opportunity_id`, `order_id`, `amount`     |

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/crm.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties

### Keyboard Shortcuts

| Key      | Action           | Scope          |
| -------- | ---------------- | -------------- |
| `/`      | Focus search     | Any page       |
| `s`      | Trigger sync     | Sync dashboard |
| `r`      | Resolve conflict | Conflicts      |
| `c`      | Connect CRM      | Settings       |
| `Enter`  | Submit form      | Forms          |
| `Escape` | Close modal      | Modal          |

---

## 📅 Timeline & Milestones

| Day | Tasks                                            | Deliverable             | Flag Status |
| --- | ------------------------------------------------ | ----------------------- | ----------- |
| 1   | Setup + Sync Dashboard + Conflict Resolution     | Basic sync works        | WIP         |
| 2   | Customer 360 + Pipeline + Opportunity Conversion | Production-ready module | GA          |

**Total Effort**: 2 days (16 hours)

**Feature Flags**:

- Day 1: `flags.m38_crm = false` (testing only)
- Day 2: `flags.m38_crm = true` after all tests pass

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                           | Duration | Rollback Trigger |
| ----------- | ---------------- | ------------------------------------------ | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                           | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, sync success rate ≥99% | 2 days   | Test failures    |
| Production  | Beta users (10%) | Error rate < 0.5%, sync success ≥99%       | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 1 week, no sync failures       | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m38_crm: false,                    // Master toggle
  m38_crm_customer360: false,        // Customer 360 view
  m38_crm_pipeline: false,           // Opportunity pipeline
  m38_crm_auto_order: false,         // Auto-order from opp
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Sync success rate (target: ≥99%)
- Sync duration (target: <5min)
- Conflict rate (target: <2%)
- API rate limit consumption

**Alert Thresholds**:

- Sync success rate < 95% for 15min → page on-call
- Sync duration > 10min → investigate
- Conflict rate > 5% → alert ops team

### UI Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m38_crm = false`

   ```powershell
   pnpm run flags:set m38_crm=false
   ```

2. **Stop scheduled syncs**:

   ```powershell
   pnpm run crm:sync:pause
   ```

3. **Monitor for 15 minutes**:

   - No new sync operations
   - Users see fallback message

4. **Post-mortem**: Create incident report, add regression test

**Rollback Decision Matrix**:

| Scenario                    | Action             | Approval Required |
| --------------------------- | ------------------ | ----------------- |
| Sync success rate < 90%     | Immediate rollback | No (auto-trigger) |
| Sync duration > 15min       | Immediate rollback | No (auto-trigger) |
| CRM API rate limit exceeded | Pause syncs        | Ops lead          |
| Data corruption detected    | Immediate rollback | No (auto-trigger) |

---

## 🔗 Dependencies

### Must Complete Before Starting

- ✅ M1: Core Ledger (customer data)
- ✅ M4: Accounts Receivable (AR balances)
- ✅ M37: Sales Orders (order creation)
- 🆕 Feature flag service
- 🆕 Analytics provider
- 🆕 CRM OAuth service (Salesforce)

### Blocks These Modules

- Enhanced M37: Sales Orders (CRM-driven orders)
- Enhanced M4: AR (CRM customer visibility)

---

## 🎯 Success Criteria

### Must Have (Measurable)

- [ ] Bi-directional Salesforce sync (≥99% success rate)
- [ ] Customer 360 view with ERP data
- [ ] Opportunity pipeline dashboard
- [ ] Sync completes < 5min (1000 records)
- [ ] Conflict resolution UI works
- [ ] Customer 360 load < 1s
- [ ] Axe: 0 serious/critical violations

### Should Have

- [ ] Auto-order from closed-won opportunities
- [ ] Weighted forecast calculation
- [ ] Sync scheduling configuration
- [ ] Field mapping configuration UI

### Nice to Have

- [ ] HubSpot integration
- [ ] Custom webhook triggers
- [ ] Sync performance analytics

---

## 📚 References

### API Documentation

- OpenAPI spec: `packages/contracts/openapi/openapi.json`
- Type definitions: `packages/api-client/src/types.gen.ts`
- Salesforce REST API: https://developer.salesforce.com/docs/apis

### Design System

- Component library: `aibos-ui` package
- Design tokens: Import from `aibos-ui/tokens`
- Style guide: Follow dark-first theme

### Best Practices

- Salesforce integration patterns
- HubSpot API best practices
- Bi-directional sync strategies
- Conflict resolution patterns

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Cost/Scaling**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Bi-Directional Sync Conflicts

**Mitigation**: Last-write-wins strategy (configurable); conflict resolution UI; audit trail; manual review for high-value conflicts

### Risk #2: CRM API Rate Limiting

**Mitigation**: Batch sync operations; queue management; respect rate limits; incremental sync; retry logic with exponential backoff

### Risk #3: Data Mapping Complexity

**Mitigation**: Configurable field mapping UI; transformation rules; validation before sync; test with sample data

### Risk #4: Sync Reliability (Network, API Changes)

**Mitigation**: Health monitoring; automatic retry; failure alerts; sync history logging; manual retry capability

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional
- [ ] Salesforce sync dashboard complete
- [ ] Conflict resolution UI works
- [ ] Customer 360 view displays CRM + ERP data
- [ ] Opportunity pipeline dashboard complete
- [ ] Auto-order from closed-won works
- [ ] Field mapping configuration UI
- [ ] Sync scheduling works
- [ ] All error states handled
- [ ] Copy deck implemented

### Quality Gates 🎯

**Enforced in CI** - Build fails if any gate not met

#### Code Quality

- [ ] TypeScript: 0 errors, 0 warnings
- [ ] ESLint: 0 errors, 0 warnings
- [ ] Prettier: All files formatted
- [ ] No console.log or debugger statements

#### Test Coverage

- [ ] Unit tests: ≥90% line coverage, ≥95% for sync logic
- [ ] Integration tests: All sync scenarios covered
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped
- [ ] TTFB: ≤70ms on staging
- [ ] Sync operation: <5min (1000 records)
- [ ] Customer 360 load: <1s
- [ ] Pipeline load: <1.5s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly
- [ ] Error tracking integrated
- [ ] Performance monitoring active
- [ ] Sync health monitoring dashboards
- [ ] Alerts configured (sync failure, rate limit)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] CRM API credentials encrypted
- [ ] OAuth tokens secured
- [ ] Audit trail for all sync operations
- [ ] Security review completed

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete
- [ ] Storybook stories created
- [ ] API contracts synchronized
- [ ] i18n keys documented
- [ ] CRM integration guide documented
- [ ] UAT passed (PM/QA sign-off)

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured
- [ ] Smoke tests passed on staging
- [ ] Sync reliability tests passed (≥99% success)
- [ ] Deployed to production (flags off)
- [ ] Rollback procedure tested
- [ ] Gradual rollout plan ready

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All test plans executed and passed
- [ ] **Design**: UI matches specs, brand compliance
- [ ] **PM**: Feature complete, acceptance criteria met
- [ ] **Security**: Security review passed
- [ ] **Accessibility**: A11y audit passed
- [ ] **Operations**: Sync monitoring configured

---

**Ready to build? Start with Step 0! 🚀**

**Next Module**: M39 - Analytics & BI
