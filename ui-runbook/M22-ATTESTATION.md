# 🚀 M22: Attestation - UI Implementation Runbook

**Module ID**: M22  
**Module Name**: Attestation  
**Priority**: MEDIUM  
**Phase**: 6 - Compliance & Controls  
**Estimated Effort**: 1 day  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Attestation provides **digital signature and sign-off workflows** for financial statements, controls, and compliance certifications with full audit trail.

### Business Value

- Digital signature workflows
- Multi-level approval routing
- Audit trail of all attestations
- Compliance certification tracking
- Integration with SOX controls and evidence

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-digital-signature], [ADR-###-attestation-workflow], [ADR-###-compliance-certification]

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

- ✅ `/api/attestations` - List attestations
- ✅ `/api/attestations/[id]` - Get attestation details
- ✅ `/api/attestations/create` - Create attestation
- ✅ `/api/attestations/sign` - Sign attestation
- ✅ `/api/attestations/approve` - Approve attestation
- ✅ `/api/attestations/reject` - Reject attestation
- ✅ `/api/attestations/delegate` - Delegate signature
- ✅ `/api/certifications` - Compliance certifications
- ✅ `/api/certifications/renew` - Renew certification
- ✅ `/api/signatures` - Digital signature management
- ✅ `/api/attestations/bulk-sign` - Bulk signing
- ✅ `/api/attestations/audit-trail` - Attestation history

**Total Endpoints**: 14 (12 main + sub-endpoints)

### Risks & Blockers

| Risk                             | Impact | Mitigation                                                     | Owner     |
| -------------------------------- | ------ | -------------------------------------------------------------- | --------- |
| Digital signature legal validity | HIGH   | Use compliant e-signature standards; legal review; audit trail | @legal    |
| Multi-level approval complexity  | MED    | Clear workflow visualization; delegation support; reminders    | @backend  |
| Attestation deadline compliance  | HIGH   | Automatic reminders; escalation workflows; dashboard alerts    | @ops      |
| Signature integrity verification | HIGH   | Cryptographic signing; tamper detection; version control       | @security |

---

## 🎯 3 Killer Features

### 1. **Digital Signature Workflow** ✍️

**Description**: Secure digital signature workflow with multi-level approvals and compliance certifications.

**Why It's Killer**:

- Legally binding e-signatures
- Multi-level approval routing
- Mobile signing capability
- Full audit trail
- Better than DocuSign for financial attestations

**Implementation**:

```typescript
import { Card, Button, Timeline, Badge } from "aibos-ui";

export default function AttestationWorkflow({ attestationId }) {
  const { attestation, sign } = useAttestation(attestationId);

  return (
    <Card>
      <h3>{attestation.title}</h3>
      <p>{attestation.description}</p>

      <Timeline
        items={attestation.approvers.map((approver) => ({
          name: approver.name,
          status: approver.status,
          date: approver.signed_at,
          badge: (
            <Badge
              variant={approver.status === "Signed" ? "success" : "warning"}
            >
              {approver.status}
            </Badge>
          ),
        }))}
      />

      {attestation.awaiting_my_signature && (
        <div className="mt-4">
          <Button onClick={sign} variant="primary">
            Sign & Attest
          </Button>
        </div>
      )}
    </Card>
  );
}
```

### 2. **Attestation Dashboard** 📋

**Description**: Centralized dashboard showing all pending and completed attestations with status tracking.

**Why It's Killer**:

- Real-time attestation status
- Overdue alerts
- Bulk signing capability
- Historical attestation tracking
- Industry-first attestation dashboard

**Implementation**:

```typescript
import { DataTable, Badge } from "aibos-ui";

export default function AttestationDashboard() {
  const { attestations } = useAttestations();

  return (
    <DataTable
      data={attestations}
      columns={[
        { key: "title", label: "Attestation" },
        { key: "type", label: "Type" },
        { key: "due_date", label: "Due Date" },
        {
          key: "status",
          label: "Status",
          render: (val) => (
            <Badge variant={val === "Complete" ? "success" : "warning"}>
              {val}
            </Badge>
          ),
        },
        { key: "signers", label: "Signers" },
      ]}
    />
  );
}
```

### 3. **Compliance Certification Manager** 📜

**Description**: Track and manage regulatory compliance certifications with automatic renewal reminders.

**Why It's Killer**:

- Compliance certification tracking
- Automatic renewal reminders
- Regulatory requirement mapping
- Certificate repository
- Better than manual compliance tracking

**Implementation**:

```typescript
import { Card, DataTable, Alert } from "aibos-ui";

export default function ComplianceCertifications() {
  const { certifications } = useCertifications();

  return (
    <div className="space-y-6">
      {certifications.expiring_soon.length > 0 && (
        <Alert variant="warning">
          {certifications.expiring_soon.length} certifications expiring within
          30 days
        </Alert>
      )}

      <DataTable
        data={certifications.list}
        columns={[
          { key: "name", label: "Certification" },
          { key: "issued_date", label: "Issued" },
          { key: "expiry_date", label: "Expires" },
          { key: "status", label: "Status" },
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
**File**: `apps/web/app/(dashboard)/attestations/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                         | Target          | Measurement          |
| ------------------------------ | --------------- | -------------------- |
| TTFB (staging)                 | ≤ 70ms          | Server timing header |
| Client TTI for `/attestations` | ≤ 200ms         | Lighthouse CI        |
| Attestation load               | < 1s            | Performance profiler |
| Signature processing           | < 2s            | User perception      |
| Dashboard load                 | < 1s            | Performance profiler |
| UI bundle size                 | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to attestation workflows, signing
- **Focus Management**: Focus trap in signature modals; visible indicators
- **ARIA**: Attestation status announced; workflow progress communicated
- **Screen Reader**: All attestation details announced; signing actions described
- **Axe Target**: 0 serious/critical violations
- **Signature Interface**: Keyboard accessible; screen reader announces signature steps

### Security

| Layer          | Requirement                                                                        |
| -------------- | ---------------------------------------------------------------------------------- |
| RBAC Scopes    | `attestation.read`, `attestation.sign`, `attestation.approve`, `attestation.admin` |
| Enforcement    | Server-side on all endpoints                                                       |
| Data Exposure  | Only show attestations for authorized users                                        |
| Sensitive Data | Encrypt signatures; secure audit trail; tamper detection                           |
| Audit Trail    | All signatures, approvals, rejections logged                                       |
| Integrity      | Cryptographic signing; signature verification; version control                     |

#### UI Permissions Matrix

| Role                | View | Sign | Approve | Reject | Delegate | Create | Admin |
| ------------------- | ---- | ---- | ------- | ------ | -------- | ------ | ----- |
| attestation.read    | ✅   | ❌   | ❌      | ❌     | ❌       | ❌     | ❌    |
| attestation.sign    | ✅   | ✅   | ❌      | ❌     | ✅       | ❌     | ❌    |
| attestation.approve | ✅   | ✅   | ✅      | ✅     | ✅       | ❌     | ❌    |
| attestation.admin   | ✅   | ✅   | ✅      | ✅     | ✅       | ✅     | ✅    |

### Reliability & Observability

- **SLO**: 99.9% successful signatures; 100% audit trail integrity
- **SLA Dashboards**: Real-time metrics on attestation completion, overdue count
- **Events Emitted**: `Attestation.Signed`, `Attestation.Approved`, `Attestation.Rejected`
- **Logging**: Structured logs with correlation IDs for all attestation operations
- **Tracing**: Distributed tracing for attestation workflows
- **Monitoring**: Signature completion rate; overdue attestations; audit trail

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Attestation Rules

| Rule                       | Enforcement                                                            |
| -------------------------- | ---------------------------------------------------------------------- |
| **Signature Immutability** | Once signed, signatures are immutable; new attestation = new signature |
| **Multi-Level Approval**   | Attestations route through defined approval hierarchy                  |
| **Deadline Enforcement**   | Overdue attestations escalate automatically                            |
| **Signature Integrity**    | Cryptographic signing; tamper detection; verification                  |
| **Delegation Rules**       | Signatures can be delegated with approval; audit trail retained        |
| **Audit Trail**            | All actions logged; tamper-proof; immutable                            |
| **Evidence Linking**       | Attestations can link to evidence; cascade on archive                  |
| **Certification Renewal**  | Automated renewal reminders; expiry tracking                           |

### Attestation Workflow

- **Routing**: Multi-level approval routing with parallel/sequential workflows
- **Status**: Draft → Pending → In Review → Approved/Rejected → Complete
- **Deadline**: Automatic reminders (7 days, 3 days, 1 day, overdue)
- **Escalation**: Overdue attestations escalate to manager

### Archive Semantics

- **Historical Attestations**: Retain all attestation history indefinitely
- **Audit Trail**: Maintain full audit trail of all signature operations
- **Guard Rails**:
  - ❌ Deny delete of signed attestations
  - ❌ Deny modification of completed attestations
  - ✅ Allow archive of draft/cancelled attestations

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                            | User Action     |
| --------------------- | ------------------------------------- | --------------- |
| **Empty**             | "No attestations pending"             | "Create"        |
| **Loading**           | Skeleton table                        | N/A             |
| **Error**             | Error message + retry                 | Retry / Support |
| **Draft**             | Gray badge "Draft"                    | Edit / Submit   |
| **Pending**           | Yellow badge "Pending Your Signature" | Sign            |
| **In Review**         | Orange badge "In Review"              | View status     |
| **Approved**          | Green badge "Approved"                | N/A             |
| **Rejected**          | Red badge "Rejected"                  | View reason     |
| **Complete**          | Green checkmark "Complete"            | View details    |
| **Overdue**           | Red badge "Overdue"                   | Escalate        |
| **Delegated**         | Blue badge "Delegated to {user}"      | View delegatee  |
| **Permission Denied** | "Access restricted"                   | Back            |

### Form Validation

- **Signature**: Require confirmation before signing
- **Reason**: Required for rejection (Zod validation)
- **Server Errors**: Map 422 → inline field errors; 409 → conflict modal

### Network Errors

| HTTP Status | UI Message                                            | Action              |
| ----------- | ----------------------------------------------------- | ------------------- |
| 400         | "Invalid attestation data. Check your input."         | Inline field errors |
| 401         | "Session expired. Please log in again."               | Redirect to login   |
| 403         | "You don't have permission to sign this attestation." | Hide action         |
| 404         | "Attestation not found."                              | Return to list      |
| 409         | "Attestation was modified. Review changes."           | Show conflict modal |
| 422         | "Signature validation failed."                        | Inline errors       |
| 500         | "Signing failed. Our team has been notified."         | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/attestation.json`.

### Page Titles & Headers

| Context            | Copy                        | i18n Key                      |
| ------------------ | --------------------------- | ----------------------------- |
| Main Page          | "Attestations"              | `attestation.main.title`      |
| Attestation Detail | "Attestation Details"       | `attestation.detail.title`    |
| Signature Modal    | "Sign Attestation"          | `attestation.sign.title`      |
| Dashboard          | "Attestation Dashboard"     | `attestation.dashboard.title` |
| Certifications     | "Compliance Certifications" | `attestation.certs.title`     |

### State Messages

| State             | Title                         | Message                                              | Action Button       | i18n Key                         |
| ----------------- | ----------------------------- | ---------------------------------------------------- | ------------------- | -------------------------------- |
| Empty             | "No attestations"             | "No attestations pending your signature"             | "View All"          | `attestation.empty.*`            |
| Loading           | —                             | —                                                    | —                   | —                                |
| Error             | "Unable to load attestations" | "Something went wrong. Our team has been notified."  | "Retry" / "Support" | `attestation.error.*`            |
| Draft             | "Draft"                       | "Complete and submit for approval"                   | "Edit"              | `attestation.draft.*`            |
| Pending           | "Pending your signature"      | "Review and sign by {due_date}"                      | "Sign"              | `attestation.pending.*`          |
| In Review         | "Under review"                | "Awaiting approval from {approver}"                  | "View Status"       | `attestation.inReview.*`         |
| Approved          | "Approved"                    | "Approved by {approver} on {date}"                   | —                   | `attestation.approved.*`         |
| Rejected          | "Rejected"                    | "Rejected by {approver}: {reason}"                   | "View Reason"       | `attestation.rejected.*`         |
| Complete          | "Complete"                    | "All signatures obtained on {date}"                  | "View Details"      | `attestation.complete.*`         |
| Overdue           | "Overdue"                     | "Due {days} days ago"                                | "Sign Now"          | `attestation.overdue.*`          |
| Delegated         | "Delegated"                   | "Delegated to {delegatee}"                           | "View Delegatee"    | `attestation.delegated.*`        |
| Permission Denied | "Access restricted"           | "You don't have permission to view this attestation" | "Back"              | `attestation.permissionDenied.*` |

### Action Confirmations

| Action           | Title                  | Message                                                    | Confirm Button | Cancel Button | i18n Key                         |
| ---------------- | ---------------------- | ---------------------------------------------------------- | -------------- | ------------- | -------------------------------- |
| Sign Attestation | "Sign attestation?"    | "Sign '{title}'? This action cannot be undone."            | "Sign"         | "Cancel"      | `attestation.sign.confirm.*`     |
| Approve          | "Approve attestation?" | "Approve '{title}'?"                                       | "Approve"      | "Cancel"      | `attestation.approve.confirm.*`  |
| Reject           | "Reject attestation?"  | "Reject '{title}'? Provide a reason."                      | "Reject"       | "Cancel"      | `attestation.reject.confirm.*`   |
| Delegate         | "Delegate signature?"  | "Delegate signing of '{title}' to {delegatee}?"            | "Delegate"     | "Cancel"      | `attestation.delegate.confirm.*` |
| Bulk Sign        | "Sign {count}?"        | "Sign {count} attestations? This action cannot be undone." | "Sign All"     | "Cancel"      | `attestation.bulkSign.confirm.*` |

### Success Messages (Toast)

| Action                | Message                                    | i18n Key                       |
| --------------------- | ------------------------------------------ | ------------------------------ |
| Attestation Signed    | "'{title}' signed successfully"            | `attestation.sign.success`     |
| Attestation Approved  | "'{title}' approved by {approver}"         | `attestation.approve.success`  |
| Attestation Rejected  | "'{title}' rejected"                       | `attestation.reject.success`   |
| Attestation Delegated | "'{title}' delegated to {delegatee}"       | `attestation.delegate.success` |
| Bulk Sign Complete    | "{count} attestations signed successfully" | `attestation.bulkSign.success` |

### Error Messages (Toast)

| Scenario          | Message                                               | i18n Key                          |
| ----------------- | ----------------------------------------------------- | --------------------------------- |
| Sign Failed       | "Failed to sign '{title}'. Try again."                | `attestation.sign.error`          |
| Approve Failed    | "Failed to approve. Try again."                       | `attestation.approve.error`       |
| Already Signed    | "'{title}' has already been signed."                  | `attestation.errorAlreadySigned`  |
| Permission Denied | "You don't have permission to sign this attestation." | `attestation.errorPermission`     |
| Deadline Passed   | "Deadline has passed. Cannot sign."                   | `attestation.errorDeadlinePassed` |
| Network Error     | "Network error. Check your connection and try again." | `attestation.error.network`       |

### Form Labels & Help Text

| Field             | Label                  | Placeholder           | Help Text                                | i18n Key                          |
| ----------------- | ---------------------- | --------------------- | ---------------------------------------- | --------------------------------- |
| Attestation Title | "Title"                | "e.g., SOX 302"       | "Descriptive name for this attestation"  | `attestation.field.title.*`       |
| Description       | "Description"          | "Attestation details" | "What this attestation certifies"        | `attestation.field.description.*` |
| Approvers         | "Approvers"            | "Select approvers"    | "Users who must sign this attestation"   | `attestation.field.approvers.*`   |
| Due Date          | "Due Date"             | "YYYY-MM-DD"          | "Deadline for all signatures"            | `attestation.field.dueDate.*`     |
| Evidence          | "Evidence"             | "Select evidence"     | "Link supporting evidence documents"     | `attestation.field.evidence.*`    |
| Rejection Reason  | "Reason for Rejection" | "Explain reason"      | "Required when rejecting an attestation" | `attestation.field.reason.*`      |

### Keyboard Shortcuts Help

| Shortcut | Description          | i18n Key                         |
| -------- | -------------------- | -------------------------------- |
| `/`      | "Focus search"       | `attestation.shortcuts.search`   |
| `s`      | "Sign selected"      | `attestation.shortcuts.sign`     |
| `a`      | "Approve selected"   | `attestation.shortcuts.approve`  |
| `r`      | "Reject selected"    | `attestation.shortcuts.reject`   |
| `d`      | "Delegate selected"  | `attestation.shortcuts.delegate` |
| `↑ / ↓`  | "Navigate list"      | `attestation.shortcuts.navigate` |
| `Enter`  | "Open selected"      | `attestation.shortcuts.open`     |
| `Escape` | "Close modal/cancel" | `attestation.shortcuts.cancel`   |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useAttestation.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useAttestations(filters = {}) {
  return useQuery({
    queryKey: ["attestation", "list", filters],
    queryFn: () => apiClient.GET("/api/attestations", { query: filters }),
    staleTime: 30_000, // 30s
    retry: 2,
    select: (response) => response.data,
  });
}

export function useAttestation(id: string) {
  return useQuery({
    queryKey: ["attestation", "detail", id],
    queryFn: () => apiClient.GET("/api/attestations/[id]", { params: { id } }),
    staleTime: 60_000, // 1min
    enabled: !!id,
    select: (response) => response.data,
  });
}

export function useSignAttestation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { attestation_id: string; notes?: string }) =>
      apiClient.POST("/api/attestations/sign", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attestation"] });
      toast.success(`'${data.title}' signed successfully`);
    },
    onError: (error) => {
      if (error.status === 409) {
        toast.error("Attestation has already been signed.");
      } else if (error.status === 403) {
        toast.error("You don't have permission to sign this attestation.");
      } else {
        toast.error("Signing failed. Try again.");
      }
    },
  });
}

export function useApproveAttestation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { attestation_id: string; notes?: string }) =>
      apiClient.POST("/api/attestations/approve", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attestation"] });
      toast.success(`'${data.title}' approved by ${data.approver}`);
    },
    onError: () => {
      toast.error("Approval failed.");
    },
  });
}

export function useRejectAttestation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { attestation_id: string; reason: string }) =>
      apiClient.POST("/api/attestations/reject", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attestation"] });
      toast.success(`'${data.title}' rejected`);
    },
    onError: () => {
      toast.error("Rejection failed.");
    },
  });
}

export function useDelegateAttestation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      attestation_id: string;
      delegatee_id: string;
      reason: string;
    }) => apiClient.POST("/api/attestations/delegate", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attestation"] });
      toast.success(`'${data.title}' delegated to ${data.delegatee}`);
    },
    onError: () => {
      toast.error("Delegation failed.");
    },
  });
}

export function useBulkSignAttestations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { attestation_ids: string[]; notes?: string }) =>
      apiClient.POST("/api/attestations/bulk-sign", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attestation"] });
      toast.success(`${data.count} attestations signed successfully`);
    },
    onError: () => {
      toast.error("Bulk signing failed.");
    },
  });
}

export function useCertifications() {
  return useQuery({
    queryKey: ["attestation", "certifications"],
    queryFn: () => apiClient.GET("/api/certifications"),
    staleTime: 5 * 60_000, // 5min
    select: (response) => response.data,
  });
}

export function useRenewCertification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { certification_id: string }) =>
      apiClient.POST("/api/certifications/renew", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["attestation", "certifications"],
      });
      toast.success(`Certification '${data.name}' renewed successfully`);
    },
    onError: () => {
      toast.error("Renewal failed.");
    },
  });
}
```

### Error Mapping

| API Error         | User Message                                          | UI Action            |
| ----------------- | ----------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid attestation data. Check your input."         | Inline field errors  |
| 409 (Conflict)    | "Attestation has already been signed."                | Show status          |
| 422 (Validation)  | "Signature validation failed."                        | Inline errors        |
| 403 (Forbidden)   | "You don't have permission to sign this attestation." | Hide action          |
| 500 (Server)      | "Signing failed. Our team has been notified."         | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Network timeouts**: 10s for queries, 30s for mutations

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["attestation", "list", { filters }][("attestation", "detail", attestationId)][
  ("attestation", "certifications")
][("attestation", "audit-trail", attestationId)];
```

### Invalidation Rules

| Action               | Invalidates                         |
| -------------------- | ----------------------------------- |
| Sign Attestation     | `["attestation"]` (all)             |
| Approve Attestation  | `["attestation"]` (all)             |
| Reject Attestation   | `["attestation"]` (all)             |
| Delegate Attestation | `["attestation"]` (all)             |
| Bulk Sign            | `["attestation"]` (all)             |
| Renew Certification  | `["attestation", "certifications"]` |

### Stale Time

| Query Type         | Stale Time | Reasoning                         |
| ------------------ | ---------- | --------------------------------- |
| Attestation List   | 30s        | Frequent status changes           |
| Attestation Detail | 1min       | Changes less frequently           |
| Certifications     | 5min       | Certification data rarely changes |
| Audit Trail        | 5min       | Historical data; immutable        |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("attestation-list");
revalidateTag("attestation-certifications");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/attestation.fixtures.ts`

**Datasets**:

- `minimalAttestations`: 5 attestations (various statuses)
- `standardAttestations`: 25 attestations with multi-level approvals
- `complexAttestations`: 50+ attestations with delegations, rejections
- `edgeCases`: Edge cases (overdue, bulk signing, certification expiry)

**Edge Cases Covered**:

- Overdue attestation with escalation
- Multi-level approval workflow
- Delegated signature
- Rejected attestation with reason
- Bulk signing scenario
- Certification expiry and renewal
- Attestation with linked evidence

```typescript
// Example fixture
export const standardAttestationsFixture: AttestationFixture[] = [
  {
    id: "att_1",
    title: "SOX 302 Certification",
    description: "CEO/CFO certification of internal controls",
    type: "SOX",
    status: "pending",
    due_date: "2025-10-31",
    approvers: [
      { id: "user_1", name: "John Doe", status: "pending", role: "CEO" },
      { id: "user_2", name: "Jane Smith", status: "pending", role: "CFO" },
    ],
    evidence: ["ev_1", "ev_2"],
    created_at: "2025-10-01T10:00:00Z",
  },
  // ... more attestations
];
```

### E2E Seed Data

**Location**: `tests/seeds/attestation.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:attestation
```

**Dataset**:

- 20 attestations (various types: SOX, GDPR, SOC2, custom)
- Complete workflow (draft → pending → review → approved/rejected → complete)
- Multi-level approval workflows
- Delegated signatures
- Historical attestations

**Cleanup Command**:

```powershell
pnpm run seed:attestation:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic "Demo Corp" attestation workflows
- 15 attestations covering all compliance areas (SOX, GDPR, SOC2, etc.)
- Multi-level approval examples
- Delegation scenarios
- Historical attestation data (last 12 months)
- Certification expiry examples

**Regeneration**:

```powershell
pnpm run demo:reset:attestation
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] All approvers exist
- [ ] Workflow routing valid
- [ ] Signature integrity valid
- [ ] Evidence links exist

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
- **Interactive Parts**: Mark with `"use client"` (signature workflows, attestation interactions)

### Data Fetching Strategy

| Scenario           | Strategy                               | Benefit             |
| ------------------ | -------------------------------------- | ------------------- |
| Initial List       | Server-side fetch + stream             | Faster TTFB         |
| Signature Actions  | Client-side with optimistic updates    | Instant feedback    |
| Attestation Detail | Server component with client signature | SEO + interactivity |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function signAttestation(data) {
  // ... mutation logic
  revalidateTag("attestation-list");
}
```

---

## 📊 Analytics & Audit Events

| Event                  | When                  | Properties                                                 |
| ---------------------- | --------------------- | ---------------------------------------------------------- |
| Attestation.Signed     | Attestation signed    | `attestation_id`, `title`, `signer_id`, `signature_date`   |
| Attestation.Approved   | Attestation approved  | `attestation_id`, `title`, `approver_id`, `approval_date`  |
| Attestation.Rejected   | Attestation rejected  | `attestation_id`, `title`, `rejector_id`, `reason`         |
| Attestation.Delegated  | Signature delegated   | `attestation_id`, `delegator_id`, `delegatee_id`, `reason` |
| Attestation.BulkSigned | Bulk signing          | `attestation_ids`, `signer_id`, `count`                    |
| Certification.Renewed  | Certification renewed | `certification_id`, `name`, `new_expiry_date`              |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Attestation.Signed", {
  attestation_id: "att_123",
  title: "SOX 302 Certification",
  signer_id: "user_456",
  signature_date: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/attestation.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **Attestation Names**: Support international characters
- **RTL Support**: CSS logical properties; test with Arabic locale

### Keyboard Shortcuts

| Key      | Action             | Scope            |
| -------- | ------------------ | ---------------- |
| `/`      | Focus search       | Any page         |
| `s`      | Sign selected      | Attestation list |
| `a`      | Approve selected   | Attestation list |
| `r`      | Reject selected    | Attestation list |
| `d`      | Delegate selected  | Attestation list |
| `↑ / ↓`  | Navigate list      | Attestation list |
| `Enter`  | Open selected      | Attestation list |
| `Escape` | Close modal/cancel | Modal/Form       |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["s", () => signAttestation()],
  ["a", () => approveAttestation()],
  ["r", () => rejectAttestation()],
  ["d", () => delegateAttestation()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                        | Duration | Rollback Trigger |
| ----------- | ---------------- | ------------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                        | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, signature success ≥99%              | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, signature success ≥99%, no data loss | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained                | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m22_attestation: false,              // Master toggle
  m22_attestation_digital_sign: false, // Digital signatures
  m22_attestation_bulk_sign: false,    // Bulk signing
  m22_attestation_delegation: false,   // Delegation
  m22_attestation_certs: false,        // Certifications
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/attestations/*`)
- P50/P95/P99 latency
- Signature success rate (≥99% required)
- Overdue attestation count
- Audit trail integrity (100% required)

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Signature success < 99% → investigate
- Overdue attestations > 10 → alert compliance team
- Audit trail failure → immediate escalation (critical)

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m22_attestation = false`

   ```powershell
   pnpm run flags:set m22_attestation=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("attestation-list");
   revalidateTag("attestation-certifications");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/attestations/*"
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

| Scenario               | Action             | Approval Required |
| ---------------------- | ------------------ | ----------------- |
| Error rate > 5%        | Immediate rollback | No (auto-trigger) |
| Signature failure > 5% | Immediate rollback | No (auto-trigger) |
| Audit trail corruption | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%        | Partial rollback   | On-call engineer  |
| Signature delays > 5s  | Investigate first  | On-call engineer  |
| Data corruption/loss   | Immediate rollback | No (auto-trigger) |

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

- DocuSign: E-signature workflows
- Adobe Sign: Digital signature standards
- Workiva: Attestation management
- Compliance best practices (SOX, GDPR, SOC2)

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Digital Signature Legal Validity

**Mitigation**: Use e-signature standards (ESIGN, UETA); legal review; comprehensive audit trail; cryptographic signing

### Risk #2: Multi-Level Approval Complexity

**Mitigation**: Clear workflow visualization; delegation support; automatic reminders; escalation workflows

### Risk #3: Attestation Deadline Compliance

**Mitigation**: Automatic reminders (7d, 3d, 1d, overdue); escalation workflows; dashboard alerts; mobile notifications

### Risk #4: Signature Integrity Verification

**Mitigation**: Cryptographic signing; tamper detection; immutable audit trail; signature verification; version control

---

## 📝 Implementation Guide

### Day 1: Attestation Workflows & Dashboard (8 hours)

1. Build attestation dashboard with status tracking (3 hours)
2. Implement digital signature workflow (3 hours)
3. Add approval/rejection workflows (2 hours)

**Total**: 1 day (8 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Signature validation
- [ ] Workflow routing logic
- [ ] Delegation rules
- [ ] Deadline calculation
- [ ] useAttestations hook fetches correctly
- [ ] Audit trail integrity

### Integration Tests

- [ ] Sign attestation → status changes
- [ ] Approve attestation → workflow advances
- [ ] Reject attestation → workflow stops
- [ ] Delegate attestation → delegatee receives
- [ ] Bulk sign → all attestations signed
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] User can navigate to attestation page
- [ ] User can sign attestation
- [ ] User can approve attestation
- [ ] User can reject attestation
- [ ] User can delegate attestation
- [ ] User can bulk sign attestations
- [ ] Keyboard-only flow: navigate → sign → approve
- [ ] Complete attestation workflow executes correctly

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Signature workflow keyboard accessible
- [ ] Screen reader announces attestation status
- [ ] Focus management correct (modals, forms)
- [ ] Color contrast meets WCAG 2.2 AA
- [ ] Axe: 0 serious/critical violations

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] Signature format matches spec

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for attestation list, detail, signature modal
- [ ] Dark/light theme variations
- [ ] Status states captured
- [ ] Loading/error/empty states captured

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/attestations/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] Attestation load < 1s
- [ ] Signature processing < 2s
- [ ] Dashboard load < 1s

---

## 📅 Timeline

| Day | Deliverable                                   |
| --- | --------------------------------------------- |
| 1   | Attestation Workflows + Dashboard + Approvals |

**Total**: 1 day (8 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M20: Close Management (for attestation workflows)
- ✅ M21: Evidence Management (for linking evidence)

### Enables These Modules

- All compliance modules (attestation workflows)
- SOX controls (attestation sign-offs)

---

## 🎯 Success Criteria

### Must Have

- [ ] Attestation dashboard (list, search, filter)
- [ ] Digital signature workflow
- [ ] Multi-level approval workflow
- [ ] Approval/rejection capability
- [ ] Delegation capability
- [ ] Audit trail (100% integrity)
- [ ] Compliance certifications
- [ ] Signature success ≥99%, Audit trail integrity 100%

### Should Have

- [ ] Bulk signing
- [ ] Mobile signing
- [ ] Automatic reminders
- [ ] Escalation workflows
- [ ] Historical attestation tracking

### Nice to Have

- [ ] AI-powered compliance suggestions
- [ ] Integration with DocuSign/Adobe Sign
- [ ] Advanced analytics
- [ ] Predictive deadline alerts

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/attestations`, `/attestations/[id]`, `/attestations/dashboard`, `/certifications`)
- [ ] Attestation dashboard working (list, search, filter)
- [ ] Digital signature workflow working
- [ ] Approval workflow working
- [ ] Rejection workflow working
- [ ] Delegation workflow working
- [ ] Bulk signing working
- [ ] Compliance certifications working
- [ ] Audit trail working (100% integrity)
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

- [ ] Unit tests: ≥90% line coverage, ≥95% for critical paths
- [ ] Integration tests: All attestation operations covered
- [ ] E2E tests: All user flows covered (sign → approve → complete)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Sign attestation flow
- Approve attestation flow
- Reject attestation flow
- Delegation flow
- Bulk signing flow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/attestations/*` routes
- [ ] TTFB: ≤70ms on staging (Server-Timing header)
- [ ] TTI: ≤200ms for `/attestations` (Lighthouse CI)
- [ ] Attestation load: < 1s
- [ ] Signature processing: < 2s
- [ ] Dashboard load: < 1s

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues
- [ ] Signature workflow: Keyboard accessible

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `Attestation.Signed`
  - `Attestation.Approved`
  - `Attestation.Rejected`
  - `Attestation.Delegated`
  - `Attestation.BulkSigned`
  - `Certification.Renewed`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, signature failures, overdue attestations)
- [ ] Audit trail monitoring (100% integrity required)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Signatures encrypted
- [ ] Cryptographic signing implemented
- [ ] Tamper detection active
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] All signatures, approvals, rejections logged for audit
- [ ] Audit trail immutable and tamper-proof

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete (changes, testing, screenshots)
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized (OpenAPI hash verified)
- [ ] i18n keys documented in copy deck
- [ ] User acceptance testing passed (PM/QA sign-off)
- [ ] Attestation workflow documentation

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m22_attestation = false` (ready to enable)
  - `flags.m22_attestation_digital_sign = false` (phase 2)
  - `flags.m22_attestation_bulk_sign = false` (phase 2)
  - `flags.m22_attestation_delegation = false` (phase 2)
  - `flags.m22_attestation_certs = false` (phase 2)
- [ ] Smoke tests passed on staging
- [ ] Load tests passed (≥1000 concurrent users, 100 attestations)
- [ ] Deployed to production (flags off)
- [ ] Rollback procedure tested
- [ ] Gradual rollout plan ready (5% → 100%)

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All test plans executed and passed
- [ ] **Design**: UI matches specs, brand compliance
- [ ] **PM**: Feature complete, acceptance criteria met
- [ ] **Security**: Security review passed, cryptographic signing validated
- [ ] **Accessibility**: A11y audit passed
- [ ] **Legal**: E-signature compliance validated, audit trail approved
- [ ] **Compliance**: Attestation workflows validated, certification tracking approved

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M21 - Evidence Management  
**Next**: M23 - Payment Processing
