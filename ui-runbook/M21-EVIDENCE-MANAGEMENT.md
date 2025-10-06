# 🚀 M21: Evidence Management - UI Implementation Runbook

**Module ID**: M21  
**Module Name**: Evidence Management  
**Priority**: MEDIUM  
**Phase**: 6 - Compliance & Controls  
**Estimated Effort**: 1 day  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Evidence Management provides **centralized document and evidence storage** for audit, compliance, and financial reporting with version control and retention policies.

### Business Value

- Centralized evidence repository
- Automated evidence collection workflows
- Version control and audit trail
- Retention policy enforcement
- Integration with close tasks and attestations

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **Code Reviewer**: TBD
- **QA Lead**: TBD
- **Related ADRs**: [ADR-###-evidence-library], [ADR-###-evidence-request], [ADR-###-retention-policy]

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

- ✅ `/api/evidence` - List evidence documents
- ✅ `/api/evidence/upload` - Upload evidence
- ✅ `/api/evidence/[id]` - Get evidence details
- ✅ `/api/evidence/requests` - Evidence request management
- ✅ `/api/evidence/retention` - Retention policy management
- ✅ `/api/evidence/tags` - Tag management
- ✅ `/api/evidence/link` - Link evidence to tasks/controls
- ✅ `/api/evidence/versions` - Version history

**Total Endpoints**: 8 main + sub-endpoints for file operations

### Risks & Blockers

| Risk                          | Impact | Mitigation                                                         | Owner       |
| ----------------------------- | ------ | ------------------------------------------------------------------ | ----------- |
| Large file upload performance | HIGH   | Chunked uploads; progress indicators; S3/CDN integration           | @backend    |
| File storage costs            | MED    | Compression; retention policy enforcement; archive to cold storage | @ops        |
| Version control complexity    | MED    | Immutable versions; clear diff UI; rollback capabilities           | @backend    |
| Retention policy compliance   | HIGH   | Automated policy enforcement; legal hold flags; audit trail        | @compliance |

---

## 🎯 3 Killer Features

### 1. **Smart Evidence Library** 📚

**Description**: Centralized evidence repository with AI-powered tagging, search, and automatic linking to close tasks.

**Why It's Killer**:

- AI-powered document tagging
- Smart search across all evidence
- Automatic linking to tasks and controls
- Version history tracking
- Better than manual file folders

**Implementation**:

```typescript
import { FileUpload, DataTable, Badge, Search } from "aibos-ui";

export default function EvidenceLibrary() {
  const { evidence, upload } = useEvidence();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Search placeholder="Search evidence..." onSearch={handleSearch} />
        <FileUpload onUpload={upload} multiple accept="*/*">
          Upload Evidence
        </FileUpload>
      </div>

      <DataTable
        data={evidence.list}
        columns={[
          { key: "name", label: "Document" },
          { key: "type", label: "Type" },
          { key: "uploaded_by", label: "Uploaded By" },
          { key: "uploaded_at", label: "Date" },
          {
            key: "tags",
            label: "Tags",
            render: (tags) => tags.map((tag) => <Badge key={tag}>{tag}</Badge>),
          },
          { key: "linked_tasks", label: "Linked Tasks" },
        ]}
      />
    </div>
  );
}
```

### 2. **Evidence Request Workflow** 📝

**Description**: Automated evidence request and collection workflow with reminders and status tracking.

**Why It's Killer**:

- Automated evidence requests
- Email reminders for pending requests
- Mobile upload capability
- Approval workflow
- Industry-first evidence automation

**Implementation**:

```typescript
import { Form, Card, Button, Timeline } from "aibos-ui";

export default function EvidenceRequest() {
  const { createRequest } = useEvidenceRequest();

  return (
    <Form onSubmit={createRequest}>
      <Card>
        <h3>New Evidence Request</h3>
        <Select label="Request From" name="requester" />
        <Input label="Evidence Description" name="description" multiline />
        <DatePicker label="Due Date" name="due_date" />
        <Button type="submit">Send Request</Button>
      </Card>
    </Form>
  );
}
```

### 3. **Retention Policy Manager** ⏰

**Description**: Automated retention policy enforcement with automatic archival and deletion scheduling.

**Why It's Killer**:

- Configurable retention rules
- Automatic archival scheduling
- Legal hold management
- Compliance reporting
- Better than manual retention tracking

**Implementation**:

```typescript
import { DataTable, Badge, Button } from "aibos-ui";

export default function RetentionPolicy() {
  const { policies } = useRetentionPolicies();

  return (
    <DataTable
      data={policies}
      columns={[
        { key: "document_type", label: "Document Type" },
        { key: "retention_years", label: "Retention Period" },
        { key: "documents_count", label: "Documents" },
        { key: "next_purge", label: "Next Purge" },
        {
          key: "status",
          label: "Status",
          render: (val) => <Badge>{val}</Badge>,
        },
      ]}
    />
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
**File**: `apps/web/app/(dashboard)/evidence/[id]/page.tsx`

---

## 📐 Non-Functional Requirements

### Performance Budgets

| Metric                     | Target          | Measurement          |
| -------------------------- | --------------- | -------------------- |
| TTFB (staging)             | ≤ 70ms          | Server timing header |
| Client TTI for `/evidence` | ≤ 200ms         | Lighthouse CI        |
| File upload (100MB)        | < 30s           | Progress tracker     |
| Evidence list load         | < 1s            | Performance profiler |
| Search response            | < 300ms         | APM traces           |
| UI bundle size             | ≤ 250KB gzipped | Webpack analyzer     |

### Accessibility

- **Compliance**: WCAG 2.2 AA (must), AAA where practical
- **Keyboard Navigation**: Full keyboard access to file uploads, evidence list, search
- **Focus Management**: Focus trap in modals; visible indicators
- **ARIA**: File upload progress announced; search results communicated
- **Screen Reader**: All evidence metadata announced; upload status communicated
- **Axe Target**: 0 serious/critical violations
- **File Uploads**: Keyboard accessible; screen reader announces upload progress

### Security

| Layer          | Requirement                                                             |
| -------------- | ----------------------------------------------------------------------- |
| RBAC Scopes    | `evidence.read`, `evidence.write`, `evidence.approve`, `evidence.admin` |
| Enforcement    | Server-side on all endpoints                                            |
| Data Exposure  | Only show evidence for authorized entities/controls                     |
| Sensitive Data | Encrypt evidence at rest and in transit; access logging                 |
| Audit Trail    | All uploads, downloads, deletions logged                                |
| Virus Scanning | All uploads scanned; quarantine suspicious files                        |

#### UI Permissions Matrix

| Role             | View | Upload | Download | Delete | Approve | Manage Retention |
| ---------------- | ---- | ------ | -------- | ------ | ------- | ---------------- |
| evidence.read    | ✅   | ❌     | ✅       | ❌     | ❌      | ❌               |
| evidence.write   | ✅   | ✅     | ✅       | ❌     | ❌      | ❌               |
| evidence.approve | ✅   | ✅     | ✅       | ❌     | ✅      | ❌               |
| evidence.admin   | ✅   | ✅     | ✅       | ✅     | ✅      | ✅               |

### Reliability & Observability

- **SLO**: 99.9% successful uploads; 100% evidence integrity
- **SLA Dashboards**: Real-time metrics on upload success, storage usage
- **Events Emitted**: `Evidence.Uploaded`, `Evidence.Downloaded`, `Evidence.Deleted`
- **Logging**: Structured logs with correlation IDs for all evidence operations
- **Tracing**: Distributed tracing for upload/download workflows
- **Monitoring**: Upload success rate; storage usage; retention policy compliance

**Reference**: See `security-policy.json` for full threat model and controls.

---

## 🧬 Data & Domain Invariants

### Evidence Management Rules

| Rule                     | Enforcement                                                         |
| ------------------------ | ------------------------------------------------------------------- |
| **Version Immutability** | Once uploaded, versions are immutable; new version = new upload     |
| **Retention Policy**     | All evidence subject to retention policy; no deletion before expiry |
| **Legal Hold**           | Evidence on legal hold cannot be deleted regardless of policy       |
| **File Integrity**       | Checksum/hash validation on upload and download                     |
| **Virus Scanning**       | All uploads scanned; quarantine if suspicious                       |
| **Linking Rules**        | Evidence can link to multiple tasks/controls; cascade on delete     |
| **Access Logging**       | All downloads logged with user, timestamp, IP                       |
| **Approval Workflow**    | Critical evidence requires approval before use                      |

### File Storage

- **Max File Size**: 500MB per file; chunked upload for large files
- **Supported Formats**: All common formats (PDF, XLSX, DOCX, images, etc.)
- **Storage**: S3/Azure Blob; CDN for downloads; cold storage after 1 year
- **Compression**: Automatic compression for eligible formats

### Archive Semantics

- **Soft Delete**: Mark as deleted; actual deletion after retention period
- **Version History**: Retain all versions; show version timeline
- **Guard Rails**:
  - ❌ Deny delete if on legal hold
  - ❌ Deny delete before retention period expires
  - ✅ Allow archive to cold storage after 1 year

---

## 🚨 Error Handling & UX States

### All Possible States

| State                 | UI Display                              | User Action       |
| --------------------- | --------------------------------------- | ----------------- |
| **Empty**             | "No evidence uploaded"                  | "Upload Evidence" |
| **Loading**           | Skeleton table                          | N/A               |
| **Error**             | Error message + retry                   | Retry / Support   |
| **Uploading**         | Progress bar + percentage               | Cancel upload     |
| **Upload Success**    | Green checkmark "Uploaded successfully" | N/A               |
| **Upload Failed**     | Red icon "Upload failed"                | Retry             |
| **Virus Detected**    | Red alert "File quarantined"            | Contact support   |
| **Processing**        | Yellow badge "Processing"               | N/A               |
| **Approved**          | Green badge "Approved"                  | N/A               |
| **Pending Approval**  | Yellow badge "Pending Approval"         | Approve/Reject    |
| **On Legal Hold**     | Orange badge "Legal Hold"               | N/A               |
| **Expired**           | Gray badge "Expired"                    | View only         |
| **Permission Denied** | "Access restricted"                     | Back              |

### Form Validation

- **File Size**: Client-side check before upload; server-side validation
- **File Type**: Validate against allowed formats
- **Server Errors**: Map 413 → file too large; 415 → unsupported format

### Network Errors

| HTTP Status | UI Message                                            | Action              |
| ----------- | ----------------------------------------------------- | ------------------- |
| 400         | "Invalid file upload. Check file type and size."      | Retry with valid    |
| 401         | "Session expired. Please log in again."               | Redirect to login   |
| 403         | "You don't have permission to upload evidence."       | Hide action         |
| 404         | "Evidence not found."                                 | Return to list      |
| 409         | "File with this name already exists. Use versioning." | Show version modal  |
| 413         | "File too large. Maximum size is 500MB."              | Upload smaller file |
| 415         | "Unsupported file type."                              | Upload allowed type |
| 422         | "Virus detected. File quarantined."                   | Contact support     |
| 500         | "Upload failed. Our team has been notified."          | Retry button        |

---

## 📝 UX Copy Deck

Complete copy for all user-facing states. Use i18n keys from `@/i18n/messages/evidence.json`.

### Page Titles & Headers

| Context         | Copy                 | i18n Key                   |
| --------------- | -------------------- | -------------------------- |
| Main Page       | "Evidence Library"   | `evidence.main.title`      |
| Upload Modal    | "Upload Evidence"    | `evidence.upload.title`    |
| Evidence Detail | "Evidence Details"   | `evidence.detail.title`    |
| Request Page    | "Evidence Requests"  | `evidence.request.title`   |
| Retention Page  | "Retention Policies" | `evidence.retention.title` |

### State Messages

| State             | Title                      | Message                                                    | Action Button       | i18n Key                      |
| ----------------- | -------------------------- | ---------------------------------------------------------- | ------------------- | ----------------------------- |
| Empty             | "No evidence yet"          | "Upload your first evidence document"                      | "Upload Evidence"   | `evidence.empty.*`            |
| Loading           | —                          | —                                                          | —                   | —                             |
| Error             | "Unable to load evidence"  | "Something went wrong. Our team has been notified."        | "Retry" / "Support" | `evidence.error.*`            |
| Uploading         | "Uploading..."             | "{progress}% complete"                                     | "Cancel"            | `evidence.uploading.*`        |
| Upload Success    | "Upload successful"        | "{filename} uploaded successfully"                         | —                   | `evidence.uploadSuccess.*`    |
| Upload Failed     | "Upload failed"            | "Failed to upload {filename}. Try again."                  | "Retry"             | `evidence.uploadFailed.*`     |
| Virus Detected    | "File quarantined"         | "Virus detected in {filename}. File has been quarantined." | "Contact Support"   | `evidence.virusDetected.*`    |
| Processing        | "Processing"               | "File is being processed"                                  | —                   | `evidence.processing.*`       |
| Approved          | "Approved"                 | "Approved by {approver} on {date}"                         | —                   | `evidence.approved.*`         |
| Pending Approval  | "Pending approval"         | "Submitted for approval"                                   | "View Details"      | `evidence.pendingApproval.*`  |
| On Legal Hold     | "Legal hold"               | "This evidence is on legal hold and cannot be deleted"     | —                   | `evidence.legalHold.*`        |
| Expired           | "Retention period expired" | "This evidence has passed its retention period"            | "View Only"         | `evidence.expired.*`          |
| Permission Denied | "Access restricted"        | "You don't have permission to view this evidence"          | "Back"              | `evidence.permissionDenied.*` |

### Action Confirmations

| Action           | Title               | Message                                                     | Confirm Button | Cancel Button | i18n Key                       |
| ---------------- | ------------------- | ----------------------------------------------------------- | -------------- | ------------- | ------------------------------ |
| Delete Evidence  | "Delete evidence?"  | "Delete '{filename}'? This cannot be undone."               | "Delete"       | "Cancel"      | `evidence.delete.confirm.*`    |
| Request Evidence | "Send request?"     | "Send evidence request to {requester}?"                     | "Send"         | "Cancel"      | `evidence.request.confirm.*`   |
| Approve Evidence | "Approve evidence?" | "Approve '{filename}' for use?"                             | "Approve"      | "Cancel"      | `evidence.approve.confirm.*`   |
| Legal Hold       | "Place legal hold?" | "Place legal hold on '{filename}'? This prevents deletion." | "Place Hold"   | "Cancel"      | `evidence.legalHold.confirm.*` |

### Success Messages (Toast)

| Action            | Message                                | i18n Key                     |
| ----------------- | -------------------------------------- | ---------------------------- |
| Evidence Uploaded | "'{filename}' uploaded successfully"   | `evidence.upload.success`    |
| Evidence Deleted  | "'{filename}' deleted successfully"    | `evidence.delete.success`    |
| Request Sent      | "Evidence request sent to {requester}" | `evidence.request.success`   |
| Evidence Approved | "'{filename}' approved by {approver}"  | `evidence.approve.success`   |
| Legal Hold Placed | "Legal hold placed on '{filename}'"    | `evidence.legalHold.success` |

### Error Messages (Toast)

| Scenario           | Message                                                    | i18n Key                          |
| ------------------ | ---------------------------------------------------------- | --------------------------------- |
| Upload Failed      | "Failed to upload '{filename}'. Try again."                | `evidence.upload.error`           |
| File Too Large     | "File too large. Maximum size is 500MB."                   | `evidence.errorFileTooLarge`      |
| Unsupported Format | "Unsupported file type. Allowed: PDF, XLSX, DOCX, images." | `evidence.errorUnsupportedFormat` |
| Virus Detected     | "Virus detected in '{filename}'. File quarantined."        | `evidence.errorVirusDetected`     |
| Delete Failed      | "Cannot delete evidence on legal hold."                    | `evidence.errorDeleteLegalHold`   |
| Permission Denied  | "You don't have permission for this action."               | `evidence.errorPermission`        |
| Network Error      | "Network error. Check your connection and try again."      | `evidence.error.network`          |

### Form Labels & Help Text

| Field            | Label              | Placeholder            | Help Text                                       | i18n Key                           |
| ---------------- | ------------------ | ---------------------- | ----------------------------------------------- | ---------------------------------- |
| File Upload      | "File"             | "Drag & drop or click" | "Max 500MB. Supported: PDF, XLSX, DOCX, images" | `evidence.field.file.*`            |
| Document Name    | "Document Name"    | "e.g., Bank Statement" | "Descriptive name for this evidence"            | `evidence.field.name.*`            |
| Description      | "Description"      | "Optional description" | "Additional context for this evidence"          | `evidence.field.description.*`     |
| Tags             | "Tags"             | "Add tags"             | "Comma-separated tags for easier search"        | `evidence.field.tags.*`            |
| Linked Task      | "Linked Task"      | "Select task"          | "Link this evidence to a close task"            | `evidence.field.linkedTask.*`      |
| Retention Period | "Retention Period" | "7 years"              | "How long to retain this evidence"              | `evidence.field.retentionPeriod.*` |

### Keyboard Shortcuts Help

| Shortcut | Description          | i18n Key                      |
| -------- | -------------------- | ----------------------------- |
| `/`      | "Focus search"       | `evidence.shortcuts.search`   |
| `u`      | "Upload evidence"    | `evidence.shortcuts.upload`   |
| `r`      | "Create request"     | `evidence.shortcuts.request`  |
| `a`      | "Approve selected"   | `evidence.shortcuts.approve`  |
| `↑ / ↓`  | "Navigate list"      | `evidence.shortcuts.navigate` |
| `Enter`  | "Open selected"      | `evidence.shortcuts.open`     |
| `Escape` | "Close modal/cancel" | `evidence.shortcuts.cancel`   |

---

## 🔌 API Integration

### Hooks Required

```typescript
// apps/web/hooks/useEvidence.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";
import { toast } from "sonner";

export function useEvidence(filters = {}) {
  return useQuery({
    queryKey: ["evidence", "list", filters],
    queryFn: () => apiClient.GET("/api/evidence", { query: filters }),
    staleTime: 60_000, // 1min
    retry: 2,
    select: (response) => response.data,
  });
}

export function useUploadEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { file: File; metadata: any }) => {
      const formData = new FormData();
      formData.append("file", data.file);
      formData.append("metadata", JSON.stringify(data.metadata));

      return apiClient.POST("/api/evidence/upload", { body: formData });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["evidence"] });
      toast.success(`'${data.filename}' uploaded successfully`);
    },
    onError: (error) => {
      if (error.status === 413) {
        toast.error("File too large. Maximum size is 500MB.");
      } else if (error.status === 415) {
        toast.error("Unsupported file type.");
      } else if (error.status === 422) {
        toast.error("Virus detected. File quarantined.");
      } else {
        toast.error("Upload failed. Try again.");
      }
    },
  });
}

export function useDeleteEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.DELETE("/api/evidence/[id]", { params: { id } }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["evidence"] });
      toast.success(`'${data.filename}' deleted successfully`);
    },
    onError: (error) => {
      if (error.status === 403) {
        toast.error("Cannot delete evidence on legal hold.");
      } else {
        toast.error("Delete failed.");
      }
    },
  });
}

export function useEvidenceRequests() {
  return useQuery({
    queryKey: ["evidence", "requests"],
    queryFn: () => apiClient.GET("/api/evidence/requests"),
    staleTime: 30_000, // 30s
    select: (response) => response.data,
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      requester: string;
      description: string;
      due_date: string;
    }) => apiClient.POST("/api/evidence/requests", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["evidence", "requests"] });
      toast.success(`Evidence request sent to ${data.requester}`);
    },
    onError: () => {
      toast.error("Failed to send request.");
    },
  });
}

export function useApproveEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { evidence_id: string; notes?: string }) =>
      apiClient.POST("/api/evidence/approve", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["evidence"] });
      toast.success(`'${data.filename}' approved by ${data.approver}`);
    },
    onError: () => {
      toast.error("Approval failed.");
    },
  });
}

export function useRetentionPolicies() {
  return useQuery({
    queryKey: ["evidence", "retention"],
    queryFn: () => apiClient.GET("/api/evidence/retention"),
    staleTime: 5 * 60_000, // 5min
    select: (response) => response.data,
  });
}

export function usePlaceLegalHold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { evidence_id: string; reason: string }) =>
      apiClient.POST("/api/evidence/legal-hold", { body: data }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["evidence"] });
      toast.success(`Legal hold placed on '${data.filename}'`);
    },
    onError: () => {
      toast.error("Failed to place legal hold.");
    },
  });
}
```

### Error Mapping

| API Error         | User Message                                          | UI Action            |
| ----------------- | ----------------------------------------------------- | -------------------- |
| 400 (Bad Request) | "Invalid file upload. Check file type and size."      | Retry with valid     |
| 409 (Conflict)    | "File with this name already exists. Use versioning." | Show version modal   |
| 413 (Too Large)   | "File too large. Maximum size is 500MB."              | Upload smaller file  |
| 415 (Unsupported) | "Unsupported file type."                              | Upload allowed type  |
| 422 (Virus)       | "Virus detected. File quarantined."                   | Contact support      |
| 403 (Forbidden)   | "Cannot delete evidence on legal hold."               | Hide delete button   |
| 500 (Server)      | "Upload failed. Our team has been notified."          | Retry + support link |

### Retry & Backoff

- **Queries**: 2 retries with exponential backoff (1s, 2s)
- **Mutations**: No auto-retry; user-initiated retry only
- **Upload**: Chunked uploads with resume capability for large files

---

## 🗂️ State, Caching, and Invalidation

### React Query Keys

```typescript
// Query key structure
["evidence", "list", { filters }][("evidence", "detail", evidenceId)][
  ("evidence", "requests")
][("evidence", "retention")][("evidence", "versions", evidenceId)];
```

### Invalidation Rules

| Action           | Invalidates                |
| ---------------- | -------------------------- |
| Upload Evidence  | `["evidence"]` (all)       |
| Delete Evidence  | `["evidence"]` (all)       |
| Approve Evidence | `["evidence"]` (all)       |
| Create Request   | `["evidence", "requests"]` |
| Place Legal Hold | `["evidence"]` (all)       |

### Stale Time

| Query Type         | Stale Time | Reasoning                              |
| ------------------ | ---------- | -------------------------------------- |
| Evidence List      | 1min       | Moderately frequent updates            |
| Evidence Detail    | 1min       | Evidence metadata changes infrequently |
| Requests           | 30s        | Request status changes frequently      |
| Retention Policies | 5min       | Policies change rarely                 |

### Cache Tags (Next.js)

```typescript
// Server actions
revalidateTag("evidence-list");
revalidateTag("evidence-requests");
```

---

## 🧪 Test Data & Fixtures

### Storybook Fixtures

**Location**: `apps/web/fixtures/evidence.fixtures.ts`

**Datasets**:

- `minimalEvidence`: 5 documents (various types)
- `standardEvidence`: 30 documents with tags, versions, links
- `complexEvidence`: 50+ documents with approvals, legal holds, requests
- `edgeCases`: Edge cases (large files, virus quarantine, expired retention)

**Edge Cases Covered**:

- Evidence on legal hold
- Expired retention period
- Multiple versions of same document
- Pending approval workflow
- Virus quarantine scenario
- Evidence linked to multiple tasks
- Large file upload (chunked)

```typescript
// Example fixture
export const standardEvidenceFixture: EvidenceFixture[] = [
  {
    id: "ev_1",
    filename: "bank_statement_2025_10.pdf",
    type: "PDF",
    size: 2048576, // 2MB
    uploaded_by: "john@example.com",
    uploaded_at: "2025-10-15T10:00:00Z",
    tags: ["bank", "october", "reconciliation"],
    linked_tasks: ["task_1", "task_2"],
    version: 1,
    status: "approved",
    retention_years: 7,
  },
  // ... more evidence
];
```

### E2E Seed Data

**Location**: `tests/seeds/evidence.seed.ts`

**Seed Command**:

```powershell
pnpm run seed:evidence
```

**Dataset**:

- 25 evidence documents (PDF, XLSX, DOCX, images)
- Complete workflow (upload → process → approve → link)
- Evidence requests (pending, fulfilled)
- Retention policies applied
- Legal hold examples

**Cleanup Command**:

```powershell
pnpm run seed:evidence:clean
```

### Demo Dataset (Staging/Sandbox)

**Purpose**: Customer demos, UAT, training

**Characteristics**:

- Realistic "Demo Corp" evidence library
- 20 documents covering all functional areas (bank statements, invoices, contracts)
- Version history examples
- Evidence requests workflow
- Retention policies configured
- Legal hold examples

**Regeneration**:

```powershell
pnpm run demo:reset:evidence
```

### Test Data Validation

**Automated Checks** (run in CI):

- [ ] All fixtures pass Zod schema validation
- [ ] File checksums valid
- [ ] All linked tasks/controls exist
- [ ] Retention policies correctly applied
- [ ] Version history consistent

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
- **Interactive Parts**: Mark with `"use client"` (file uploads, evidence list interactions)

### Data Fetching Strategy

| Scenario        | Strategy                               | Benefit             |
| --------------- | -------------------------------------- | ------------------- |
| Initial List    | Server-side fetch + stream             | Faster TTFB         |
| File Uploads    | Client-side with progress tracking     | Real-time feedback  |
| Evidence Detail | Server component with client downloads | SEO + interactivity |

### Cache Strategy

```typescript
// Server actions
"use server";

import { revalidateTag } from "next/cache";

export async function uploadEvidence(data) {
  // ... mutation logic
  revalidateTag("evidence-list");
}
```

---

## 📊 Analytics & Audit Events

| Event                    | When              | Properties                                                |
| ------------------------ | ----------------- | --------------------------------------------------------- |
| Evidence.Uploaded        | File uploaded     | `evidence_id`, `filename`, `size`, `user_id`              |
| Evidence.Downloaded      | File downloaded   | `evidence_id`, `filename`, `user_id`, `download_date`     |
| Evidence.Deleted         | File deleted      | `evidence_id`, `filename`, `reason`, `user_id`            |
| Evidence.Approved        | Evidence approved | `evidence_id`, `filename`, `approver_id`, `approval_date` |
| Evidence.RequestCreated  | Request created   | `request_id`, `requester`, `description`, `due_date`      |
| Evidence.LegalHoldPlaced | Legal hold placed | `evidence_id`, `filename`, `reason`, `placed_by`          |

**Implementation**:

```typescript
import { analytics } from "@/lib/analytics";

analytics.track("Evidence.Uploaded", {
  evidence_id: "ev_123",
  filename: "bank_statement.pdf",
  size: 2048576,
  user_id: "user_456",
  timestamp: new Date().toISOString(),
});
```

---

## 🌐 i18n/L10n & Keyboard Shortcuts

### Internationalization

- **i18n Keys**: All labels, errors, toasts from `@/i18n/messages/evidence.json`
- **Date/Number Formatting**: Use `Intl` APIs with tenant locale
- **File Names**: Support international characters in filenames
- **RTL Support**: CSS logical properties; test with Arabic locale

### Keyboard Shortcuts

| Key      | Action             | Scope         |
| -------- | ------------------ | ------------- |
| `/`      | Focus search       | Any page      |
| `u`      | Upload evidence    | Evidence list |
| `r`      | Create request     | Request page  |
| `a`      | Approve selected   | Evidence list |
| `↑ / ↓`  | Navigate list      | Evidence list |
| `Enter`  | Open selected      | Evidence list |
| `Escape` | Close modal/cancel | Modal/Form    |

**Implementation**:

```typescript
useHotkeys([
  ["/", () => searchInputRef.current?.focus()],
  ["u", () => openUploadModal()],
  ["r", () => router.push("/evidence/requests")],
  ["a", () => approveEvidence()],
]);
```

---

## 🔄 UI Rollout & Rollback

### Rollout Plan

| Environment | Cohort           | Success Criteria                                     | Duration | Rollback Trigger |
| ----------- | ---------------- | ---------------------------------------------------- | -------- | ---------------- |
| Dev         | All developers   | Manual QA passes                                     | 1 day    | Critical bugs    |
| Staging     | QA team + PM     | All E2E tests pass, upload success ≥99%              | 2 days   | Test failures    |
| Production  | Beta users (5%)  | Error rate < 0.1%, upload success ≥99%, no data loss | 3 days   | SLO breach       |
| Production  | All users (100%) | Monitor for 24h, error budget maintained             | Ongoing  | Error rate spike |

### Feature Flags

```typescript
flags: {
  m21_evidence: false,              // Master toggle
  m21_evidence_upload: false,       // File upload
  m21_evidence_requests: false,     // Evidence requests
  m21_evidence_retention: false,    // Retention policies
  m21_evidence_ai_tagging: false,   // AI tagging (phase 2)
}
```

### Monitoring Dashboard

**Key Metrics** (real-time):

- Error rate by page (`/evidence/*`)
- P50/P95/P99 latency
- Upload success rate (≥99% required)
- Download success rate
- Storage usage
- Virus detection rate

**Alert Thresholds**:

- Error rate > 1% for 5min → page to on-call
- Upload success < 99% → investigate
- Virus detection rate spike → security alert
- Storage usage > 80% → ops alert

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m21_evidence = false`

   ```powershell
   pnpm run flags:set m21_evidence=false
   ```

2. **Invalidate cache**:

   ```typescript
   revalidateTag("evidence-list");
   revalidateTag("evidence-requests");
   ```

3. **Clear CDN cache**:

   ```powershell
   pnpm run cache:purge --path="/evidence/*"
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
| Upload failure > 5%    | Immediate rollback | No (auto-trigger) |
| Data corruption/loss   | Immediate rollback | No (auto-trigger) |
| Error rate 1-5%        | Partial rollback   | On-call engineer  |
| Upload delays > 5s     | Investigate first  | On-call engineer  |
| Virus scanning failure | Immediate rollback | No (auto-trigger) |

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

- SharePoint: Document management
- Box: File versioning
- Workiva: Evidence linking
- Compliance best practices (SOX, GDPR)

### SSOT References

- **Security**: `security-policy.json`
- **Compliance**: `COMPLIANCE.md`
- **Migrations**: `DATABASE_WORKFLOW.md`
- **Architecture**: `ARCHITECTURE.md`
- **Performance**: `PERFORMANCE-BUDGETS.md`

---

## 🚨 Risk Mitigation

### Risk #1: Large File Upload Performance

**Mitigation**: Chunked uploads with resume capability; progress indicators; S3/CDN integration; compression for eligible formats

### Risk #2: File Storage Costs

**Mitigation**: Retention policy enforcement; automatic compression; archive to cold storage after 1 year; monitor storage usage

### Risk #3: Version Control Complexity

**Mitigation**: Immutable versions (new upload = new version); clear version timeline UI; rollback capabilities; diff view for text formats

### Risk #4: Retention Policy Compliance

**Mitigation**: Automated policy enforcement; legal hold flags prevent deletion; comprehensive audit trail; compliance reporting

---

## 📝 Implementation Guide

### Day 1: Evidence Library & Upload (8 hours)

1. Build evidence library with smart search (3 hours)
2. Implement file upload with progress tracking (3 hours)
3. Add evidence request workflow (2 hours)

**Total**: 1 day (8 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] File upload validation (size, type)
- [ ] Checksum/hash validation
- [ ] Retention policy calculation
- [ ] Legal hold enforcement
- [ ] useEvidence hook fetches correctly
- [ ] File metadata formatting

### Integration Tests

- [ ] Upload evidence → appears in list
- [ ] Delete evidence → removed from list
- [ ] Approve evidence → status changes
- [ ] Create request → request created
- [ ] Place legal hold → evidence protected
- [ ] Permission-based UI hiding works

### E2E Tests

- [ ] User can navigate to evidence page
- [ ] User can upload evidence
- [ ] User can download evidence
- [ ] User can view evidence details
- [ ] User can create evidence request
- [ ] User can approve evidence
- [ ] Keyboard-only flow: navigate → upload → approve
- [ ] Large file upload (chunked) works

### Accessibility Tests

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] File upload keyboard accessible
- [ ] Upload progress announced to screen reader
- [ ] Screen reader announces evidence metadata
- [ ] Focus management correct (modals, forms)
- [ ] Color contrast meets WCAG 2.2 AA
- [ ] Axe: 0 serious/critical violations

### Contract Tests

- [ ] Pact or schema match: client calls conform to OpenAPI
- [ ] Generated types (`types.gen.ts`) match actual API responses
- [ ] File upload matches multipart/form-data spec

### Visual Regression Tests

- [ ] Storybook/Ladle snapshots for evidence list, upload modal, detail page
- [ ] Dark/light theme variations
- [ ] Upload progress states captured
- [ ] Loading/error/empty states captured

### Performance Tests

- [ ] Bundle size < 250KB gzipped for `/evidence/*` routes
- [ ] TTFB ≤ 70ms on staging
- [ ] Evidence list load < 1s
- [ ] File upload (100MB) < 30s
- [ ] Search response < 300ms

---

## 📅 Timeline

| Day | Deliverable                          |
| --- | ------------------------------------ |
| 1   | Evidence Library + Upload + Requests |

**Total**: 1 day (8 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M20: Close Management (for linking evidence to tasks)

### Enables These Modules

- M22: Attestation (evidence for attestations)
- All compliance modules (evidence repository)

---

## 🎯 Success Criteria

### Must Have

- [ ] Evidence library (list, search, filter)
- [ ] File upload with progress tracking
- [ ] Evidence detail view
- [ ] Evidence request workflow
- [ ] Version control
- [ ] Retention policy management
- [ ] Legal hold capability
- [ ] Upload success ≥99%, Evidence integrity 100%

### Should Have

- [ ] AI-powered tagging
- [ ] Drag-and-drop upload
- [ ] Bulk upload
- [ ] Advanced search (full-text)
- [ ] Evidence linking to controls

### Nice to Have

- [ ] OCR for scanned documents
- [ ] Preview for common formats
- [ ] Collaborative annotations
- [ ] Mobile app for evidence upload

---

## 🎉 Definition of Done

### Functional Requirements ✅

- [ ] All UI pages created and functional (`/evidence`, `/evidence/upload`, `/evidence/requests`, `/evidence/retention`, `/evidence/[id]`)
- [ ] Evidence library working (list, search, filter)
- [ ] File upload working with progress
- [ ] Download working
- [ ] Evidence request workflow working
- [ ] Approval workflow working
- [ ] Retention policy management working
- [ ] Legal hold working
- [ ] Version control working
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
- [ ] Integration tests: All evidence operations covered
- [ ] E2E tests: All user flows covered (upload → approve → link)
- [ ] Contract tests: API calls match OpenAPI spec
- [ ] A11y tests: Axe 0 serious, 0 critical violations
- [ ] Visual regression: 0 unintended changes

**Critical Path Coverage** (must be ≥95%):

- Upload evidence flow
- Download evidence flow
- Approval workflow flow
- Evidence request flow

#### Performance Budgets

- [ ] Bundle size: ≤250KB gzipped for `/evidence/*` routes
- [ ] TTFB: ≤70ms on staging (Server-Timing header)
- [ ] TTI: ≤200ms for `/evidence` (Lighthouse CI)
- [ ] Evidence list load: < 1s
- [ ] File upload (100MB): < 30s
- [ ] Search response: < 300ms

#### Accessibility

- [ ] WCAG 2.2 AA: 100% compliance (required)
- [ ] WCAG 2.2 AAA: Best effort (target 95%)
- [ ] Keyboard navigation: All features operable
- [ ] Screen reader: All content announced correctly (tested with NVDA/JAWS)
- [ ] Focus management: Logical order, visible indicators
- [ ] Color contrast: ≥7:1 (AAA) for text
- [ ] Axe DevTools: 0 serious, 0 critical, ≤5 minor issues
- [ ] File upload: Keyboard accessible, progress announced

#### Lighthouse Scores

- [ ] Performance: ≥90
- [ ] Accessibility: ≥95
- [ ] Best Practices: ≥90
- [ ] SEO: ≥90

### Observability 📊

- [ ] SLO dashboards created and populated
- [ ] All analytics events firing correctly:
  - `Evidence.Uploaded`
  - `Evidence.Downloaded`
  - `Evidence.Deleted`
  - `Evidence.Approved`
  - `Evidence.RequestCreated`
  - `Evidence.LegalHoldPlaced`
- [ ] Error tracking integrated (Sentry/Datadog)
- [ ] Performance monitoring active (APM)
- [ ] Alerts configured (error rate, upload failures, storage usage)
- [ ] Upload success rate monitoring (≥99% required)

### Security & Compliance 🔒

- [ ] Permissions matrix implemented
- [ ] RBAC enforced (server + client)
- [ ] Evidence encrypted at rest and in transit
- [ ] Virus scanning on all uploads
- [ ] Access logging for all downloads
- [ ] No sensitive data in logs/errors
- [ ] Security review completed
- [ ] All uploads, downloads, deletions logged for audit
- [ ] Legal hold enforcement validated

### Documentation 📚

- [ ] Code reviewed and approved (2 approvers)
- [ ] PR description complete (changes, testing, screenshots)
- [ ] Storybook stories created for all components
- [ ] API contracts synchronized (OpenAPI hash verified)
- [ ] i18n keys documented in copy deck
- [ ] User acceptance testing passed (PM/QA sign-off)
- [ ] Retention policy documentation

### Deployment 🚀

- [ ] Deployed to dev environment
- [ ] Deployed to staging environment
- [ ] Feature flags configured:
  - `flags.m21_evidence = false` (ready to enable)
  - `flags.m21_evidence_upload = false` (phase 2)
  - `flags.m21_evidence_requests = false` (phase 2)
  - `flags.m21_evidence_retention = false` (phase 2)
  - `flags.m21_evidence_ai_tagging = false` (phase 2)
- [ ] Smoke tests passed on staging
- [ ] Load tests passed (≥1000 concurrent users, 100 uploads)
- [ ] Deployed to production (flags off)
- [ ] Rollback procedure tested
- [ ] Gradual rollout plan ready (5% → 100%)

### Sign-offs 📝

- [ ] **Engineering**: Code review approved
- [ ] **QA**: All test plans executed and passed
- [ ] **Design**: UI matches specs, brand compliance
- [ ] **PM**: Feature complete, acceptance criteria met
- [ ] **Security**: Security review passed, virus scanning validated
- [ ] **Accessibility**: A11y audit passed
- [ ] **Compliance**: Retention policies validated, legal hold tested

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M20 - Close Management  
**Next**: M22 - Attestation
