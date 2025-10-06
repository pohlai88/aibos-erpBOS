# 🚀 M21: Evidence Management - UI Implementation Runbook

**Module ID**: M21  
**Module Name**: Evidence Management  
**Priority**: MEDIUM  
**Phase**: 6 - Compliance & Controls  
**Estimated Effort**: 1.5 days  
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

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 8 endpoints implemented       |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/[path]` - [Endpoint description]
- ✅ `/api/[path]` - [Endpoint description]

**Total Endpoints**: 8

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
**File**: `apps/web/app/(dashboard)/[module]/[id]/page.tsx`

---

## 🔌 API Integration

```typescript
// apps/web/hooks/useEvidenceManagement.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function useEvidenceManagement(filters = {}) {
  return useQuery({
    queryKey: ["m21", filters],
    queryFn: () => apiClient.GET("/api/[path]", { query: filters }),
  });
}

export function useCreateEvidenceManagement() {
  return useMutation({
    mutationFn: (data) => apiClient.POST("/api/[path]", { body: data }),
    onSuccess: () => queryClient.invalidateQueries(["m21"]),
  });
}
```

---

## 📝 Implementation Guide

### Day 1: [Tasks] (8 hours)

1. [Task 1] (X hours)
2. [Task 2] (X hours)
3. [Task 3] (X hours)

### Day 2: [Tasks] (8 hours)

1. [Task 1] (X hours)
2. [Task 2] (X hours)
3. [Task 3] (X hours)

**Total**: 1.5 days (12 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] [Test description]
- [ ] [Test description]
- [ ] [Test description]

### Integration Tests

- [ ] [Test description]
- [ ] [Test description]
- [ ] [Test description]

### E2E Tests

- [ ] [Test description]
- [ ] [Test description]
- [ ] [Test description]

---

## 📅 Timeline

| Day | Deliverable               |
| --- | ------------------------- |
| 1   | [Deliverable description] |
| 2   | [Deliverable description] |

**Total**: 1.5 days (12 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M2: Journal Entries

### Enables These Modules

- [Dependent module 1]
- [Dependent module 2]

---

## 🎯 Success Criteria

### Must Have

- [ ] [Core requirement 1]
- [ ] [Core requirement 2]
- [ ] [Core requirement 3]

### Should Have

- [ ] [Enhancement 1]
- [ ] [Enhancement 2]

### Nice to Have

- [ ] [Optional feature 1]
- [ ] [Optional feature 2]

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M20 - [Previous Module]  
**Next**: M22 - [Next Module]
