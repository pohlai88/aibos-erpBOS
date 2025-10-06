# 🚀 M40: API Gateway - UI Implementation Runbook

**Module ID**: M40  
**Module Name**: API Gateway  
**Priority**: CRITICAL  
**Phase**: 10 - Extended Modules  
**Estimated Effort**: 2 days  
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

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-api-key-management], [ADR-###-rate-limiting], [ADR-###-webhook-delivery]

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

**API Keys** (5 endpoints):

- ✅ `/api/gateway/keys` - List API keys
- ✅ `/api/gateway/keys/create` - Create API key
- ✅ `/api/gateway/keys/[id]` - Key details
- ✅ `/api/gateway/keys/rotate` - Rotate key
- ✅ `/api/gateway/keys/revoke` - Revoke key

**Webhooks** (4 endpoints):

- ✅ `/api/gateway/webhooks` - List webhooks
- ✅ `/api/gateway/webhooks/create` - Create webhook
- ✅ `/api/gateway/webhooks/test` - Test webhook
- ✅ `/api/gateway/webhooks/logs` - Webhook delivery logs

**Analytics & Monitoring** (3 endpoints):

- ✅ `/api/gateway/analytics` - API usage analytics
- ✅ `/api/gateway/rate-limits` - Rate limiting stats
- ✅ `/api/gateway/logs` - API request logs

**Documentation** (2 endpoints):

- ✅ `/api/gateway/docs` - API documentation
- ✅ `/api/gateway/openapi` - OpenAPI spec

**Total Endpoints**: 14 (4 categories)

### Risks & Blockers

| Risk                         | Impact   | Mitigation                                                      | Owner     |
| ---------------------------- | -------- | --------------------------------------------------------------- | --------- |
| Rate limiting accuracy       | HIGH     | Distributed rate limiter (Redis); sliding window algorithm      | @backend  |
| Webhook delivery reliability | HIGH     | Retry queue; exponential backoff; dead letter queue; monitoring | @backend  |
| API key security             | CRITICAL | Encrypted storage; key rotation; IP whitelisting; audit logs    | @security |
| Performance overhead         | MED      | Caching; CDN; query optimization; monitoring                    | @backend  |

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

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                        | Target          | Measurement          |
| ----------------------------- | --------------- | -------------------- |
| TTFB (staging)                | ≤ 70ms          | Server timing header |
| Client TTI for `/api-gateway` | ≤ 200ms         | Lighthouse CI        |
| API key generation            | < 500ms         | API response time    |
| Webhook delivery              | < 2s            | Webhook monitoring   |
| Rate limit check              | < 50ms          | Redis latency        |
| Analytics query               | < 1s            | Query profiler       |
| UI bundle size                | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access for all features
- **Focus Management**: Logical tab order; focus indicators
- **ARIA**: Dynamic updates announced (key created, webhook tested)
- **Screen Reader**: All data tables accessible; status changes announced
- **Axe Target**: 0 serious/critical violations

### Security

| Layer            | Requirement                                                 |
| ---------------- | ----------------------------------------------------------- |
| RBAC Scopes      | `api.read`, `api.keys`, `api.admin`                         |
| Enforcement      | Server-side on all endpoints                                |
| API Key Storage  | Encrypted at rest (AES-256); hashed for comparison          |
| Key Rotation     | Automated rotation every 90 days; manual rotation available |
| IP Whitelisting  | CIDR block support; validation before API calls             |
| Audit Trail      | Immutable logs for all key/webhook actions                  |
| Webhook Security | HMAC signature verification (SHA-256)                       |

#### UI Permissions Matrix

| Role      | View | Create Keys | Revoke Keys | Configure Webhooks | Admin |
| --------- | ---- | ----------- | ----------- | ------------------ | ----- |
| api.read  | ✅   | ❌          | ❌          | ❌                 | ❌    |
| api.keys  | ✅   | ✅          | ✅          | ✅                 | ❌    |
| api.admin | ✅   | ✅          | ✅          | ✅                 | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful webhook deliveries; <50ms rate limit checks
- **SLA Dashboards**: Real-time metrics on API usage, rate limiting, webhook success
- **Events Emitted**: `API.KeyCreated`, `API.KeyRevoked`, `Webhook.Delivered`, `API.RateLimited`
- **Logging**: Structured logs with API key IDs for all operations
- **Tracing**: Distributed tracing for webhook deliveries

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### API Gateway Business Rules

| Rule                        | Enforcement                                               |
| --------------------------- | --------------------------------------------------------- |
| **Key Uniqueness**          | Each key must be unique; collision detection              |
| **Rate Limiting**           | Sliding window algorithm; distributed (Redis)             |
| **Webhook Retry**           | Exponential backoff (1s, 2s, 4s, 8s, 16s); max 5 attempts |
| **Key Expiration**          | Automatic expiration; 30-day warning                      |
| **IP Whitelist Validation** | CIDR block validation; IPv4/IPv6 support                  |
| **Webhook Signature**       | HMAC SHA-256 signature in X-Signature header              |
| **Request Logging**         | All API requests logged; 90-day retention                 |

### API Key States

- **Active**: Key is valid and can make API calls
- **Expired**: Key exceeded expiration date
- **Revoked**: Key manually revoked by user
- **Suspended**: Key temporarily disabled (e.g., rate limit abuse)

### Archive Semantics

- **API Keys**: Revoked keys retained 2 years for audit
- **Webhooks**: Deleted webhooks retained 90 days
- **Logs**: API request logs retained 90 days
- **Guard Rails**:
  - ❌ Deny key deletion (revoke only for audit trail)
  - ✅ Allow webhook deletion

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                        | User Action       |
| --------------------- | --------------------------------- | ----------------- |
| **Empty**             | "No API keys yet"                 | "Create API Key"  |
| **Loading**           | Skeleton tables                   | N/A               |
| **Error**             | Error message + retry             | Retry / Support   |
| **Key Generated**     | Show key once (copy to clipboard) | Copy key          |
| **Rate Limited**      | Red alert "Rate limit exceeded"   | Wait / Increase   |
| **Webhook Testing**   | "Testing webhook..."              | Wait              |
| **Webhook Success**   | Green checkmark "Success"         | View logs         |
| **Webhook Failed**    | Red X "Failed" + error message    | View logs / Retry |
| **Permission Denied** | "Access restricted"               | Back              |

### Form Validation

- **API Key Name**: Required, unique, max 100 chars
- **Webhook URL**: Valid HTTPS URL required
- **Rate Limit**: Min 10, max 100,000 requests/hour
- **IP Whitelist**: Valid CIDR notation

### Network Errors

| HTTP Status | UI Message                                  | Action              |
| ----------- | ------------------------------------------- | ------------------- |
| 400         | "Invalid configuration. Check your inputs." | Inline field errors |
| 401         | "Session expired. Please log in again."     | Redirect to login   |
| 403         | "You don't have permission."                | Hide action         |
| 404         | "API key not found."                        | Return to list      |
| 409         | "API key name already exists."              | Suggest alternative |
| 422         | "Validation failed. Check configuration."   | Inline errors       |
| 429         | "Rate limit exceeded. Try again later."     | Show wait time      |
| 500         | "Something went wrong. Try again."          | Retry button        |

---

## 📝 UX Copy Deck

### Page Titles & Headers

| Context       | Copy            | i18n Key                   |
| ------------- | --------------- | -------------------------- |
| API Console   | "API Gateway"   | `gateway.console.title`    |
| API Keys      | "API Keys"      | `gateway.keys.title`       |
| Rate Limiting | "Rate Limiting" | `gateway.rateLimits.title` |
| Webhooks      | "Webhooks"      | `gateway.webhooks.title`   |
| Analytics     | "API Analytics" | `gateway.analytics.title`  |

### State Messages

| State          | Title                     | Message                               | Action Button | i18n Key              |
| -------------- | ------------------------- | ------------------------------------- | ------------- | --------------------- |
| Empty          | "No API keys yet"         | "Create your first API key"           | "Create Key"  | `gateway.empty.*`     |
| Key Generated  | "API Key Created"         | "Copy your key now - shown once only" | "Copy Key"    | `gateway.generated.*` |
| Rate Limited   | "Rate limit exceeded"     | "Too many requests. Try again later"  | "View Limits" | `gateway.limited.*`   |
| Webhook Failed | "Webhook delivery failed" | "Check endpoint and retry"            | "Retry"       | `gateway.failed.*`    |

### Success Messages (Toast)

| Action          | Message                        | i18n Key                  | Shortcut |
| --------------- | ------------------------------ | ------------------------- | -------- |
| Key Created     | "API key '{name}' created"     | `gateway.create.success`  | `k`      |
| Key Revoked     | "API key revoked"              | `gateway.revoke.success`  | `r`      |
| Webhook Created | "Webhook created successfully" | `gateway.webhook.success` | `w`      |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useAPIGateway.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function useAPIKeys(filters = {}) {
  const queryClient = useQueryClient();

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ["gateway-keys", filters],
    queryFn: () => apiClient.GET("/api/gateway/keys", { query: filters }),
    staleTime: 2 * 60_000, // 2min
    retry: 2,
    select: (response) => response.data,
  });

  const createKey = useMutation({
    mutationFn: (keyData) =>
      apiClient.POST("/api/gateway/keys/create", { body: keyData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateway-keys"] });
    },
  });

  const revokeKey = useMutation({
    mutationFn: (keyId: string) =>
      apiClient.POST("/api/gateway/keys/revoke", { body: { keyId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateway-keys"] });
    },
  });

  const rotateKey = useMutation({
    mutationFn: (keyId: string) =>
      apiClient.POST("/api/gateway/keys/rotate", { body: { keyId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateway-keys"] });
    },
  });

  return {
    apiKeys: apiKeys || [],
    isLoading,
    createKey: createKey.mutate,
    revokeKey: revokeKey.mutate,
    rotateKey: rotateKey.mutate,
  };
}

export function useWebhooks(filters = {}) {
  const queryClient = useQueryClient();

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ["gateway-webhooks", filters],
    queryFn: () => apiClient.GET("/api/gateway/webhooks", { query: filters }),
    staleTime: 2 * 60_000, // 2min
    retry: 2,
    select: (response) => response.data,
  });

  const createWebhook = useMutation({
    mutationFn: (webhookData) =>
      apiClient.POST("/api/gateway/webhooks/create", { body: webhookData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gateway-webhooks"] });
    },
  });

  const testWebhook = useMutation({
    mutationFn: (webhookId: string) =>
      apiClient.POST("/api/gateway/webhooks/test", { body: { webhookId } }),
    onError: (error) => {
      if (error.status === 504) {
        toast.error("Webhook endpoint timeout");
      }
    },
  });

  return {
    webhooks: webhooks || [],
    isLoading,
    createWebhook: createWebhook.mutate,
    testWebhook: testWebhook.mutate,
  };
}

export function useRateLimiting() {
  return useQuery({
    queryKey: ["gateway-rate-limits"],
    queryFn: () => apiClient.GET("/api/gateway/rate-limits"),
    staleTime: 30_000, // 30s
    refetchInterval: 60_000, // Refresh every minute
    retry: 2,
    select: (response) => response.data,
  });
}

export function useAPIAnalytics(filters = {}) {
  return useQuery({
    queryKey: ["gateway-analytics", filters],
    queryFn: () => apiClient.GET("/api/gateway/analytics", { query: filters }),
    staleTime: 5 * 60_000, // 5min
    retry: 2,
    select: (response) => response.data,
  });
}
```

### Error Mapping

| API Error         | User Message                                | UI Action            |
| ----------------- | ------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid configuration. Check your inputs." | Inline field errors  |
| 409 (Conflict)    | "API key name already exists."              | Suggest alternative  |
| 422 (Validation)  | "Validation failed. Check configuration."   | Inline errors        |
| 403 (Forbidden)   | "You don't have permission."                | Hide action          |
| 429 (Rate Limit)  | "Rate limit exceeded. Try again later."     | Show wait time       |
| 500 (Server)      | "Something went wrong. Try again."          | Retry + support link |
| 504 (Timeout)     | "Webhook endpoint timeout."                 | Check endpoint       |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Webhooks**: Exponential backoff (1s, 2s, 4s, 8s, 16s); max 5 attempts

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["gateway-keys", { filters }][("gateway-key", keyId)][
  ("gateway-webhooks", { filters })
]["gateway-rate-limits"][("gateway-analytics", { filters })];
```

### Invalidation Rules

| Action         | Invalidates                                  |
| -------------- | -------------------------------------------- |
| Create Key     | `["gateway-keys"]`                           |
| Revoke Key     | `["gateway-keys"]`, `["gateway-key", keyId]` |
| Rotate Key     | `["gateway-keys"]`, `["gateway-key", keyId]` |
| Create Webhook | `["gateway-webhooks"]`                       |
| Test Webhook   | `["gateway-webhooks"]`                       |

### Stale Time

| Query Type  | Stale Time | Reasoning                      |
| ----------- | ---------- | ------------------------------ |
| API Keys    | 2min       | Moderate update frequency      |
| Webhooks    | 2min       | Moderate update frequency      |
| Rate Limits | 30s        | Real-time monitoring needed    |
| Analytics   | 5min       | Historical data; less volatile |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("gateway-keys"); // After key mutations
revalidateTag(`gateway-key-${keyId}`); // Specific key
```

---

## 📝 Implementation Guide

### Step 0: Foundation Setup (1 hour)

- Enable feature flags: `flags.m40_gateway = false`
- Configure Redis for rate limiting
- Wire analytics provider for event tracking

### Step 1: Build API Key Management (4 hours)

- API key creation form
- API keys table with actions
- Key rotation functionality
- Key revocation with confirmation

### Step 2: Build Rate Limiting Dashboard (3 hours)

- Rate limit statistics cards
- Rate limit violations table
- Request rate chart
- Alert system for violations

### Step 3: Build Webhook Manager (4 hours)

- Webhook creation form
- Webhooks table with status
- Webhook testing functionality
- Delivery logs and retry tracking

### Step 4: Build Analytics Dashboard (2 hours)

- API usage metrics
- Top endpoints chart
- API consumers list
- Request logs table

### Step 5: Add Tests (2 hours)

- Unit tests for key generation, HMAC verification
- Integration tests for rate limiting, webhook delivery
- E2E tests for complete user flows

**Total**: 2 days (16 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] API key generation and uniqueness validation
- [ ] API key encryption and hashing
- [ ] Rate limit calculation (sliding window)
- [ ] Webhook signature verification (HMAC SHA-256)
- [ ] IP whitelist CIDR validation
- [ ] Key expiration checking
- [ ] Webhook retry logic (exponential backoff)

### Integration Tests

- [ ] API key authentication flow
- [ ] Rate limiting enforcement (Redis)
- [ ] Webhook delivery and retry
- [ ] Key rotation process
- [ ] IP whitelist enforcement
- [ ] Webhook event subscriptions

### E2E Tests

- [ ] User can create API key with permissions
- [ ] User can revoke API key
- [ ] User can rotate API key
- [ ] System enforces rate limits correctly
- [ ] User can configure webhook
- [ ] User can test webhook endpoint
- [ ] Webhooks deliver successfully
- [ ] Webhook retry works on failure

### Accessibility Tests

- [ ] Keyboard navigation works
- [ ] Screen reader announces key creation/revocation
- [ ] Focus management correct
- [ ] Color contrast meets WCAG 2.2 AA
- [ ] Axe: 0 serious/critical violations

### Contract Tests

- [ ] API calls match OpenAPI spec

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for all components

### Performance Tests

- [ ] Bundle size < 250KB gzipped
- [ ] API key generation < 500ms
- [ ] Rate limit check < 50ms (Redis)

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/gateway.fixtures.ts`

**Datasets**:

- `minimalKeys`: 3 API keys (production, sandbox, development)
- `standardKeys`: 10 API keys with various permissions
- `largeDataset`: 100 API keys (for performance testing)
- `edgeCases`: Special scenarios

**Edge Cases Covered**:

- Expired API keys
- Revoked API keys
- Rate-limited keys
- Webhook delivery failures
- IP whitelist violations

### E2E Seed Data

**Location**: `tests/seeds/gateway.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:gateway
```

**Dataset**:

- 20 API keys across all types
- 10 webhooks with various event subscriptions
- Rate limiting data (last 24 hours)
- Webhook delivery logs

**Cleanup Command**:

```powershell
pnpm run seed:gateway:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Sample API keys for demo integrations
- Webhook configurations for common events
- Realistic rate limiting data
- API usage analytics

**Regeneration**:

```powershell
pnpm run demo:reset:gateway
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] No duplicate API key names
- [ ] Webhook URLs are valid HTTPS

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
- **Interactive Parts**: Mark with `"use client"` (forms, tables)

### Data Fetching Strategy

| Scenario        | Strategy                   | Benefit              |
| --------------- | -------------------------- | -------------------- |
| API Keys List   | Server-side fetch + stream | Faster TTFB          |
| Key Creation    | Client-side React Query    | Immediate feedback   |
| Rate Limiting   | Client-side with polling   | Real-time monitoring |
| Webhook Testing | Client-side mutation       | Interactive testing  |

---

## 📊 Analytics & Audit Events

| Event             | When                | Properties                                        |
| ----------------- | ------------------- | ------------------------------------------------- |
| API.KeyCreated    | Key generated       | `key_id`, `key_name`, `permissions`, `rate_limit` |
| API.KeyRevoked    | Key revoked         | `key_id`, `reason`, `revoked_by`                  |
| API.KeyRotated    | Key rotated         | `key_id`, `old_key_prefix`, `new_key_prefix`      |
| Webhook.Created   | Webhook configured  | `webhook_id`, `url`, `events`                     |
| Webhook.Delivered | Webhook sent        | `webhook_id`, `event_type`, `status`, `attempts`  |
| API.RateLimited   | Rate limit exceeded | `key_id`, `endpoint`, `requests_made`, `limit`    |

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/gateway.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **RTL Support**: CSS logical properties

### Keyboard Shortcuts

| Key      | Action       | Scope         |
| -------- | ------------ | ------------- |
| `/`      | Focus search | Any page      |
| `k`      | New API key  | API keys list |
| `w`      | New webhook  | Webhooks list |
| `r`      | Revoke key   | Key selected  |
| `Enter`  | Submit form  | Forms         |
| `Escape` | Close modal  | Modal         |

---

## 📅 Timeline & Milestones

| Day | Tasks                                                | Deliverable             | Flag Status |
| --- | ---------------------------------------------------- | ----------------------- | ----------- |
| 1   | Setup + API Key Management + Rate Limiting Dashboard | Basic API management    | WIP         |
| 2   | Webhook Manager + Analytics + Tests                  | Production-ready module | GA          |

**Total Effort**: 2 days (16 hours)

**Feature Flags**:

- Day 1: `flags.m40_gateway = false` (testing only)
- Day 2: `flags.m40_gateway = true` after all tests pass

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                           | Duration | Rollback Trigger |
| ----------- | ---------------- | ------------------------------------------ | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                           | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, key generation < 500ms | 2 days   | Test failures    |
| Production  | Beta users (10%) | Error rate < 0.5%, webhook success ≥99%    | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 1 week, rate limit accuracy    | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m40_gateway: false,                // Master toggle
  m40_gateway_webhooks: false,       // Webhook functionality
  m40_gateway_rate_limits: false,    // Rate limiting UI
  m40_gateway_analytics: false,      // Analytics dashboard
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- API key creation success rate (target: ≥99%)
- Webhook delivery success rate (target: ≥99%)
- Rate limit check latency (target: <50ms)
- API usage trends

**Alert Thresholds**:

- Webhook success rate < 95% for 15min → page on-call
- Rate limit check latency > 100ms → investigate
- API key generation failures > 2% → alert

### UI Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m40_gateway = false`

   ```powershell
   pnpm run flags:set m40_gateway=false
   ```

2. **Monitor for 15 minutes**:

   - No new API key operations
   - Users see fallback message

3. **Post-mortem**: Create incident report, add regression test

**Rollback Decision Matrix**:

| Scenario                     | Action             | Approval Required |
| ---------------------------- | ------------------ | ----------------- |
| API key encryption failure   | Immediate rollback | No (auto-trigger) |
| Webhook delivery < 90%       | Investigate first  | Backend lead      |
| Rate limit check > 200ms     | Immediate rollback | No (auto-trigger) |
| Key generation failures > 5% | Immediate rollback | No (auto-trigger) |

---

## 🔗 Dependencies

### Must Complete Before Starting

- ✅ M1: Core Ledger (API endpoints to expose)
- ✅ All other modules M2-M39 (API endpoints to expose)
- 🆕 Feature flag service
- 🆕 Redis (for rate limiting)
- 🆕 Analytics provider
- 🆕 Webhook delivery service

### Blocks These Modules

- Third-party integrations across all modules
- Partner ecosystem development

---

## 🎯 Success Criteria

### Must Have (Measurable)

- [ ] API key management with granular permissions
- [ ] Rate limiting with configurable limits (<50ms checks)
- [ ] Webhook management with event subscriptions
- [ ] API key generation < 500ms
- [ ] Webhook delivery success ≥99%
- [ ] Axe: 0 serious/critical violations

### Should Have

- [ ] API usage analytics dashboard
- [ ] Webhook retry logic (5 attempts)
- [ ] Developer documentation
- [ ] IP whitelisting (CIDR support)
- [ ] Key rotation functionality

### Nice to Have

- [ ] GraphQL gateway
- [ ] API versioning management
- [ ] Interactive developer portal
- [ ] Webhook signature verification testing tool

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

- AWS API Gateway patterns
- Stripe API key management
- Twilio webhook delivery
- Redis rate limiting patterns

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Cost/Scaling**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: API Key Security

**Mitigation**: Encrypted storage (AES-256); hashed for comparison; automated rotation every 90 days; IP whitelisting (CIDR); audit trail; revocation capability; no deletion (revoke only)

### Risk #2: Rate Limiting Accuracy

**Mitigation**: Distributed rate limiter (Redis); sliding window algorithm; cluster-aware; monitoring; graceful degradation; configurable limits; burst allowance

### Risk #3: Webhook Delivery Reliability

**Mitigation**: Retry queue with exponential backoff (1s, 2s, 4s, 8s, 16s); max 5 attempts; dead letter queue; delivery monitoring; HMAC signature verification; timeout limits (2s)

### Risk #4: Performance Overhead

**Mitigation**: Caching (API key metadata); Redis for rate limiting; async webhook delivery; query optimization; CDN for static assets; monitoring dashboards

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional
- [ ] API key management with granular permissions works
- [ ] Rate limiting with configurable limits
- [ ] Webhook management with event subscriptions
- [ ] API usage analytics dashboard
- [ ] Key rotation and revocation
- [ ] IP whitelisting (CIDR support)
- [ ] Webhook testing functionality
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

- [ ] Unit tests: ≥90% line coverage, ≥95% for security logic
- [ ] Integration tests: All scenarios covered (auth, rate limiting, webhooks)
- [ ] E2E tests: All user flows covered
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

#### Security

- [ ] **CRITICAL**: API keys encrypted at rest (AES-256)
- [ ] **CRITICAL**: HMAC signature verification (SHA-256) for webhooks
- [ ] **CRITICAL**: Rate limiting accuracy ≥99.9% (validated with Redis)
- [ ] IP whitelist CIDR validation working
- [ ] Audit trail complete for all operations
- [ ] No API keys in logs or errors

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped
- [ ] TTFB: ≤70ms on staging
- [ ] API key generation: <500ms
- [ ] Rate limit check: <50ms (Redis)
- [ ] Webhook delivery: <2s

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
- [ ] Rate limiting monitoring dashboards
- [ ] Webhook delivery monitoring
- [ ] Alerts configured (key failures, webhook failures, rate limit breaches)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] API keys encrypted at rest
- [ ] Key rotation automated (90 days)
- [ ] IP whitelisting enforced
- [ ] Audit trail immutable
- [ ] Security review completed

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete
- [ ] Storybook stories created
- [ ] API contracts synchronized
- [ ] i18n keys documented
- [ ] Developer documentation (API key usage, webhook setup)
- [ ] UAT passed (PM/QA sign-off)

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured
- [ ] Smoke tests passed on staging
- [ ] Rate limiting tested (≥99.9% accuracy)
- [ ] Webhook delivery tested (≥99% success)
- [ ] Deployed to production (flags off)
- [ ] Rollback procedure tested
- [ ] Gradual rollout plan ready

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All test plans executed and passed
- [ ] **Design**: UI matches specs, brand compliance
- [ ] **PM**: Feature complete, acceptance criteria met
- [ ] **Security**: Security review passed (API key encryption, HMAC verification)
- [ ] **Accessibility**: A11y audit passed
- [ ] **Operations**: Redis configured, monitoring dashboards ready

---

**🎉 CONGRATULATIONS! You've completed ALL 40 modules! 🎉**

**This is the FINAL MODULE - M40 Complete!**

**Next**: Implementation Complete - Start Building! 🚀
