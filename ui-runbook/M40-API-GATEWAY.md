# 🚀 M40: API Gateway - UI Implementation Runbook

**Module ID**: M40  
**Module Name**: API Gateway  
**Priority**: LOW  
**Phase**: 10 - Extended Modules  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

M40 provides enterprise API management with developer portal, API key management, rate limiting, webhook management, and API analytics. This module enables third-party integrations, partner ecosystems, and custom application development on top of aibos ERP.

### Business Value

- **Integration Enablement**: Third-party apps and custom integrations via REST API
- **Partner Ecosystem**: Enable partners to build on aibos platform
- **Developer Productivity**: Complete API documentation and testing tools
- **Security & Control**: API key authentication, rate limiting, audit trails
- **Monetization**: Track API usage for potential usage-based pricing

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 6 endpoints implemented       |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/gateway/keys` - API key management
- ✅ `/api/gateway/webhooks` - Webhook configuration
- ✅ `/api/gateway/analytics` - API usage analytics
- ✅ `/api/gateway/logs` - API request logs

**Total Endpoints**: 6

---

## 🎯 3 Killer Features

### 1. **API Management Console** 🚀

**Description**: Comprehensive API key management with role-based permissions, rate limiting configuration, IP whitelisting, and usage analytics. Features key rotation, expiration, and granular endpoint access control.

**Why It's Killer**:

- **Granular Permissions**: Control access to specific APIs/modules (SAP has coarse-grained permissions)
- **Rate Limiting**: Prevent abuse with configurable rate limits per key
- **Usage Analytics**: See exactly which APIs are used, by whom, and how often
- **Measurable Impact**: Enable 10+ partner integrations without security concerns
- **Vs Generic API Gateways**: Purpose-built for ERP with finance-specific controls

**Implementation**:

```typescript
import {
  Card,
  DataTable,
  Button,
  Badge,
  Form,
  Input,
  MultiSelect,
  Toggle,
} from "aibos-ui";
import {
  useAPIKeys,
  useCreateAPIKey,
  useRevokeKey,
} from "@/hooks/useAPIGateway";

export default function APIManagementConsole() {
  const { apiKeys, stats } = useAPIKeys();
  const { createKey, rotateKey } = useCreateAPIKey();
  const { revoke } = useRevokeKey();

  return (
    <div className="space-y-6">
      <Card title="Create API Key">
        <Form onSubmit={createKey}>
          <div className="grid grid-cols-2 gap-6">
            <Input label="Key Name" name="key_name" required />
            <Select
              label="Key Type"
              name="key_type"
              options={[
                { value: "production", label: "Production" },
                { value: "sandbox", label: "Sandbox" },
                { value: "development", label: "Development" },
              ]}
              required
            />
            <MultiSelect
              label="Allowed Modules"
              name="allowed_modules"
              options={[
                { value: "ledger", label: "General Ledger" },
                { value: "ar", label: "Accounts Receivable" },
                { value: "ap", label: "Accounts Payable" },
                { value: "orders", label: "Sales Orders" },
                { value: "projects", label: "Projects" },
                { value: "analytics", label: "Analytics (Read-Only)" },
              ]}
              required
            />
            <MultiSelect
              label="Allowed Permissions"
              name="permissions"
              options={[
                { value: "read", label: "Read" },
                { value: "write", label: "Write" },
                { value: "delete", label: "Delete" },
              ]}
              required
            />
            <Input
              type="number"
              label="Rate Limit (requests/hour)"
              name="rate_limit"
              defaultValue="1000"
            />
            <Input
              type="date"
              label="Expiration Date (Optional)"
              name="expiration_date"
            />
          </div>

          <Textarea
            label="IP Whitelist (Optional)"
            name="ip_whitelist"
            rows={2}
            placeholder="192.168.1.1, 10.0.0.0/24"
          />

          <div className="flex gap-4">
            <Button type="submit" variant="primary">
              Generate API Key
            </Button>
          </div>
        </Form>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Active Keys</h3>
          <div className="text-4xl font-bold">{stats.active_keys}</div>
        </Card>
        <Card>
          <h3>Total API Calls (Today)</h3>
          <div className="text-4xl font-bold">
            {stats.calls_today.toLocaleString()}
          </div>
        </Card>
        <Card>
          <h3>Rate Limited</h3>
          <div className="text-4xl font-bold text-red-600">
            {stats.rate_limited_today}
          </div>
        </Card>
        <Card>
          <h3>Avg Response Time</h3>
          <div className="text-4xl font-bold">{stats.avg_response_ms}ms</div>
        </Card>
      </div>

      <Card title="API Keys">
        <DataTable
          data={apiKeys}
          columns={[
            { key: "key_name", label: "Name" },
            {
              key: "key_type",
              label: "Type",
              render: (_, row) => (
                <Badge
                  variant={
                    row.key_type === "production"
                      ? "success"
                      : row.key_type === "sandbox"
                      ? "warning"
                      : "info"
                  }
                >
                  {row.key_type}
                </Badge>
              ),
            },
            {
              key: "key_prefix",
              label: "Key",
              render: (_, row) => (
                <code className="text-sm">{row.key_prefix}...****</code>
              ),
            },
            {
              key: "allowed_modules",
              label: "Modules",
              render: (_, row) => (
                <div className="flex gap-1 flex-wrap">
                  {row.allowed_modules.slice(0, 3).map((mod) => (
                    <Badge key={mod} size="sm">
                      {mod}
                    </Badge>
                  ))}
                  {row.allowed_modules.length > 3 && (
                    <Badge size="sm" variant="outline">
                      +{row.allowed_modules.length - 3}
                    </Badge>
                  )}
                </div>
              ),
            },
            { key: "rate_limit", label: "Rate Limit" },
            { key: "calls_today", label: "Calls Today" },
            {
              key: "status",
              label: "Status",
              render: (_, row) => (
                <Badge
                  variant={
                    row.status === "Active"
                      ? "success"
                      : row.status === "Expired"
                      ? "error"
                      : "default"
                  }
                >
                  {row.status}
                </Badge>
              ),
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rotateKey(row.id)}
                  >
                    Rotate
                  </Button>
                  <Button
                    size="sm"
                    variant="error"
                    onClick={() => revoke(row.id)}
                  >
                    Revoke
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

### 2. **Rate Limiting & Throttling** ⚡

**Description**: Intelligent rate limiting with configurable limits per API key, endpoint, and time window. Features burst allowance, graceful degradation, and automatic throttling with queue management.

**Why It's Killer**:

- **Prevent Abuse**: Protect system from aggressive API consumers
- **Fair Usage**: Ensure all API consumers get fair access
- **Burst Handling**: Allow temporary bursts above rate limit
- **Measurable Impact**: Prevent API-driven system overloads

**Implementation**:

```typescript
import { Card, Chart, Badge, DataTable, Alert } from "aibos-ui";
import { useRateLimiting } from "@/hooks/useAPIGateway";

export default function RateLimitingDashboard() {
  const { limits, violations, stats } = useRateLimiting();

  return (
    <div className="space-y-6">
      {violations.recent.length > 0 && (
        <Alert variant="warning">
          <strong>
            {violations.recent.length} Rate Limit Violations in Last Hour
          </strong>
          <p>Review API consumers exceeding rate limits.</p>
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Total Requests (Hour)</h3>
          <div className="text-4xl font-bold">
            {stats.requests_hour.toLocaleString()}
          </div>
        </Card>
        <Card>
          <h3>Rate Limited</h3>
          <div className="text-4xl font-bold text-red-600">
            {stats.rate_limited_hour}
          </div>
          <Badge variant="error">
            {((stats.rate_limited_hour / stats.requests_hour) * 100).toFixed(1)}
            %
          </Badge>
        </Card>
        <Card>
          <h3>Throttled</h3>
          <div className="text-4xl font-bold text-orange-600">
            {stats.throttled_hour}
          </div>
        </Card>
      </div>

      <Card title="Rate Limit Violations">
        <DataTable
          data={violations.recent}
          columns={[
            { key: "timestamp", label: "Time" },
            { key: "api_key_name", label: "API Key" },
            { key: "endpoint", label: "Endpoint" },
            {
              key: "requests_made",
              label: "Requests",
              render: (_, row) => (
                <Badge variant="error">
                  {row.requests_made} / {row.rate_limit}
                </Badge>
              ),
            },
            { key: "blocked_requests", label: "Blocked" },
          ]}
        />
      </Card>

      <Card title="Request Rate (Last 24 Hours)">
        <Chart
          type="line"
          data={{
            labels: stats.hourly_requests.hours,
            datasets: [
              {
                label: "Requests",
                data: stats.hourly_requests.counts,
                borderColor: "rgb(59, 130, 246)",
                fill: false,
              },
              {
                label: "Rate Limit",
                data: stats.hourly_requests.limits,
                borderColor: "rgb(239, 68, 68)",
                borderDash: [5, 5],
                fill: false,
              },
            ],
          }}
        />
      </Card>
    </div>
  );
}
```

### 3. **Webhook Manager** 💎

**Description**: Complete webhook management with event subscriptions, endpoint configuration, retry logic, and delivery tracking. Features webhook testing, signature verification, and failure alerts.

**Why It's Killer**:

- **Event-Driven Integration**: Real-time notifications to external systems
- **Reliable Delivery**: Automatic retry with exponential backoff
- **Secure**: HMAC signature verification for webhook authenticity
- **Measurable Impact**: Enable real-time integrations vs. polling (10x more efficient)

**Implementation**:

```typescript
import {
  Card,
  DataTable,
  Button,
  Badge,
  Form,
  Input,
  MultiSelect,
} from "aibos-ui";
import {
  useWebhooks,
  useCreateWebhook,
  useTestWebhook,
} from "@/hooks/useAPIGateway";

export default function WebhookManager() {
  const { webhooks, events, stats } = useWebhooks();
  const { create } = useCreateWebhook();
  const { test } = useTestWebhook();

  return (
    <div className="space-y-6">
      <Card title="Create Webhook">
        <Form onSubmit={create}>
          <div className="grid grid-cols-2 gap-6">
            <Input
              label="Webhook URL"
              name="url"
              placeholder="https://your-app.com/webhooks/aibos"
              required
            />
            <Input label="Description" name="description" />
            <MultiSelect
              label="Subscribe to Events"
              name="events"
              options={[
                { value: "invoice.created", label: "Invoice Created" },
                { value: "invoice.paid", label: "Invoice Paid" },
                { value: "order.created", label: "Order Created" },
                { value: "order.shipped", label: "Order Shipped" },
                { value: "payment.received", label: "Payment Received" },
                { value: "customer.created", label: "Customer Created" },
                { value: "journal.posted", label: "Journal Posted" },
              ]}
              required
            />
            <Input
              label="Secret Key"
              name="secret"
              helpText="For HMAC signature verification"
            />
          </div>

          <Toggle label="Active" name="active" defaultChecked />

          <div className="flex gap-4">
            <Button type="submit" variant="primary">
              Create Webhook
            </Button>
          </div>
        </Form>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Active Webhooks</h3>
          <div className="text-4xl font-bold">{stats.active_webhooks}</div>
        </Card>
        <Card>
          <h3>Events Sent (Today)</h3>
          <div className="text-4xl font-bold">
            {stats.events_today.toLocaleString()}
          </div>
        </Card>
        <Card>
          <h3>Success Rate</h3>
          <div className="text-4xl font-bold text-green-600">
            {stats.success_rate}%
          </div>
        </Card>
        <Card>
          <h3>Failed Deliveries</h3>
          <div className="text-4xl font-bold text-red-600">
            {stats.failed_today}
          </div>
        </Card>
      </div>

      <Card title="Configured Webhooks">
        <DataTable
          data={webhooks}
          columns={[
            { key: "url", label: "URL" },
            {
              key: "events",
              label: "Events",
              render: (_, row) => (
                <div className="flex gap-1 flex-wrap">
                  {row.events.slice(0, 2).map((evt) => (
                    <Badge key={evt} size="sm">
                      {evt}
                    </Badge>
                  ))}
                  {row.events.length > 2 && (
                    <Badge size="sm" variant="outline">
                      +{row.events.length - 2}
                    </Badge>
                  )}
                </div>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (_, row) => (
                <Badge
                  variant={row.status === "Active" ? "success" : "default"}
                >
                  {row.status}
                </Badge>
              ),
            },
            { key: "deliveries_today", label: "Deliveries" },
            {
              key: "success_rate",
              label: "Success %",
              render: (_, row) => (
                <Badge
                  variant={
                    row.success_rate >= 95
                      ? "success"
                      : row.success_rate >= 80
                      ? "warning"
                      : "error"
                  }
                >
                  {row.success_rate}%
                </Badge>
              ),
            },
            { key: "last_delivery", label: "Last Delivery" },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => test(row.id)}
                  >
                    Test
                  </Button>
                  <Button size="sm" variant="outline">
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    Logs
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Card title="Recent Webhook Deliveries">
        <DataTable
          data={events}
          columns={[
            { key: "timestamp", label: "Time" },
            { key: "event_type", label: "Event" },
            { key: "webhook_url", label: "Webhook" },
            {
              key: "status",
              label: "Status",
              render: (_, row) => (
                <Badge
                  variant={
                    row.status === "Success"
                      ? "success"
                      : row.status === "Failed"
                      ? "error"
                      : "warning"
                  }
                >
                  {row.status}
                </Badge>
              ),
            },
            { key: "response_time", label: "Response Time" },
            { key: "attempts", label: "Attempts" },
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

#### 1. API Console (`/api-gateway/console`)

**Components**: Card, DataTable, Form, Badge, Button
**File**: `apps/web/app/(dashboard)/api-gateway/console/page.tsx`

#### 2. Rate Limiting (`/api-gateway/rate-limits`)

**Components**: Chart, DataTable, Alert, Badge
**File**: `apps/web/app/(dashboard)/api-gateway/rate-limits/page.tsx`

#### 3. Webhooks (`/api-gateway/webhooks`)

**Components**: DataTable, Form, Badge, Button
**File**: `apps/web/app/(dashboard)/api-gateway/webhooks/page.tsx`

---

## 🔌 API Integration

```typescript
// apps/web/hooks/useAPIGateway.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function useAPIKeys() {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: () => apiClient.GET("/api/gateway/keys"),
  });
}

export function useCreateAPIKey() {
  return useMutation({
    mutationFn: (keyData) =>
      apiClient.POST("/api/gateway/keys", { body: keyData }),
    onSuccess: () => queryClient.invalidateQueries(["api-keys"]),
  });
}

export function useWebhooks() {
  return useQuery({
    queryKey: ["webhooks"],
    queryFn: () => apiClient.GET("/api/gateway/webhooks"),
  });
}

export function useRateLimiting() {
  return useQuery({
    queryKey: ["rate-limiting"],
    queryFn: () => apiClient.GET("/api/gateway/analytics"),
  });
}
```

---

## 📝 Implementation Guide

### Day 1: API Management & Rate Limiting (8 hours)

1. Build API key management console (4 hours)
2. Implement rate limiting dashboard (2 hours)
3. Create API analytics (2 hours)

### Day 2: Webhook Manager (4 hours)

1. Build webhook configuration UI (2 hours)
2. Implement webhook testing (1 hour)
3. Create delivery tracking (1 hour)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] API key generation and validation
- [ ] Rate limit calculation
- [ ] Webhook signature verification

### Integration Tests

- [ ] API key authentication flow
- [ ] Rate limiting enforcement
- [ ] Webhook delivery and retry

### E2E Tests

- [ ] User can create API key
- [ ] System enforces rate limits
- [ ] Webhooks deliver successfully

---

## 📅 Timeline

| Day | Deliverable                      |
| --- | -------------------------------- |
| 1   | API management and rate limiting |
| 2   | Webhook manager                  |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger (API endpoints)
- ✅ All other modules (API endpoints to expose)

### Enables These Modules

- Third-party integrations across all modules

---

## 🎯 Success Criteria

### Must Have

- [ ] API key management with granular permissions
- [ ] Rate limiting with configurable limits
- [ ] Webhook management with event subscriptions

### Should Have

- [ ] API usage analytics
- [ ] Webhook retry logic
- [ ] Developer documentation

### Nice to Have

- [ ] GraphQL gateway
- [ ] API versioning management
- [ ] Developer portal with interactive docs

---

**🎉 CONGRATULATIONS! You've completed ALL 40 modules! 🎉**

**Previous**: M39 - Analytics & BI  
**Next**: Implementation Complete - Start Building! 🚀
