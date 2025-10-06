# 🎯 M74: Document Management - UI Implementation Runbook

**Module ID**: M74  
**Module Name**: Document Management  
**Priority**: 🔥 HIGH  
**Phase**: Phase 15 - User Experience  
**Estimated Effort**: 4 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M56-DOCUMENT-MANAGEMENT

---

## 📋 Module Overview

### Business Value

Document Management provides **centralized document storage and management** for businesses requiring organized file handling and collaboration.

**Key Benefits**:

- Centralized document storage with version control
- Document collaboration and sharing capabilities
- Integration with existing modules (AP, AR, Inventory, etc.)
- Document search and categorization

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status      | Details                   |
| ------------- | ----------- | ------------------------- |
| **Database**  | ✅ Complete | Schema implemented        |
| **Services**  | ✅ Complete | Business logic ready      |
| **API**       | ✅ Complete | 18 endpoints available    |
| **Contracts** | ✅ Complete | Type-safe schemas defined |

### API Endpoints

**Document Management Operations** (18 endpoints):

- ✅ `/api/documents` - List documents
- ✅ `/api/documents/[id]` - Get document details
- ✅ `/api/documents/upload` - Upload document
- ✅ `/api/documents/[id]/download` - Download document
- ✅ `/api/documents/[id]/update` - Update document
- ✅ `/api/documents/[id]/delete` - Delete document
- ✅ `/api/documents/[id]/versions` - Get document versions
- ✅ `/api/documents/[id]/versions/[versionId]` - Get specific version
- ✅ `/api/documents/[id]/share` - Share document
- ✅ `/api/documents/[id]/permissions` - Manage permissions
- ✅ `/api/documents/[id]/comments` - Get comments
- ✅ `/api/documents/[id]/comments/create` - Add comment
- ✅ `/api/documents/[id]/comments/[commentId]` - Update comment
- ✅ `/api/documents/[id]/comments/[commentId]/delete` - Delete comment
- ✅ `/api/documents/search` - Search documents
- ✅ `/api/documents/categories` - Get categories
- ✅ `/api/documents/tags` - Get tags
- ✅ `/api/documents/analytics` - Get document analytics

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                      | Page Component           | Purpose                   |
| -------------------------- | ------------------------ | ------------------------- |
| `/documents`               | `DocumentListPage`       | List and search documents |
| `/documents/[id]`          | `DocumentDetailPage`     | View document details     |
| `/documents/upload`        | `DocumentUploadPage`     | Upload new document       |
| `/documents/[id]/edit`     | `DocumentEditPage`       | Edit document metadata    |
| `/documents/[id]/versions` | `DocumentVersionsPage`   | View document versions    |
| `/documents/[id]/share`    | `DocumentSharePage`      | Share document            |
| `/documents/search`        | `DocumentSearchPage`     | Advanced document search  |
| `/documents/categories`    | `DocumentCategoriesPage` | Manage categories         |

### Component Structure

```
apps/web/app/(dashboard)/documents/
├── page.tsx                    # List page
├── [id]/
│   ├── page.tsx               # Detail page
│   ├── edit/
│   │   └── page.tsx           # Edit page
│   ├── versions/
│   │   └── page.tsx           # Versions page
│   └── share/
│       └── page.tsx           # Share page
├── upload/
│   └── page.tsx               # Upload page
├── search/
│   └── page.tsx               # Search page
└── categories/
    └── page.tsx               # Categories page

apps/web/components/documents/
├── DocumentList.tsx           # List component
├── DocumentCard.tsx           # Card component
├── DocumentViewer.tsx         # Document viewer
├── DocumentUpload.tsx         # Upload component
├── DocumentVersions.tsx       # Versions component
├── DocumentShare.tsx          # Share component
├── DocumentComments.tsx       # Comments component
├── DocumentSearch.tsx         # Search component
├── DocumentCategories.tsx     # Categories component
├── DocumentFilters.tsx        # Filter component
└── DocumentActions.tsx        # Action buttons

apps/web/hooks/documents/
├── useDocumentList.ts         # List hook
├── useDocumentDetail.ts       # Detail hook
├── useDocumentUpload.ts       # Upload hook
├── useDocumentUpdate.ts       # Update hook
├── useDocumentShare.ts        # Share hook
├── useDocumentSearch.ts       # Search hook
└── useDocumentAnalytics.ts    # Analytics hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Document viewer, upload, interactive elements
- **Feature Flag**: `flags.m74_document_management = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose           | Variant                    |
| ----------- | ----------------- | -------------------------- |
| `DataTable` | List documents    | With filters, pagination   |
| `Card`      | Document details  | With actions               |
| `Viewer`    | Document viewer   | PDF, image, text support   |
| `Form`      | Upload/edit forms | With validation            |
| `Button`    | Actions           | Primary, secondary, danger |
| `Modal`     | Confirmations     | With backdrop              |
| `Timeline`  | Version timeline  | With status indicators     |

### Design Tokens

```typescript
// Document-specific colors
const documentColors = {
  pdf: "hsl(var(--document-pdf))",
  image: "hsl(var(--document-image))",
  text: "hsl(var(--document-text))",
  spreadsheet: "hsl(var(--document-spreadsheet))",
  presentation: "hsl(var(--document-presentation))",
  archive: "hsl(var(--document-archive))",
  other: "hsl(var(--document-other))",
};

// Document status colors
const documentStatusColors = {
  draft: "bg-gray-100 text-gray-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-yellow-100 text-yellow-800",
  deleted: "bg-red-100 text-red-800",
  shared: "bg-blue-100 text-blue-800",
  private: "bg-purple-100 text-purple-800",
};

// File type colors
const fileTypeColors = {
  pdf: "text-red-600",
  doc: "text-blue-600",
  xls: "text-green-600",
  ppt: "text-orange-600",
  txt: "text-gray-600",
  jpg: "text-pink-600",
  png: "text-purple-600",
  zip: "text-indigo-600",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Document Themes**: Viewer themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  list: ["documents", "list"] as const,
  detail: (id: string) => ["documents", "detail", id] as const,
  versions: (id: string) => ["documents", "versions", id] as const,
  search: (query: string) => ["documents", "search", query] as const,
  categories: ["documents", "categories"] as const,
  tags: ["documents", "tags"] as const,
  analytics: ["documents", "analytics"] as const,
};
```

### Cache Configuration

| Query Type | Stale Time | Cache Time | Invalidation            |
| ---------- | ---------- | ---------- | ----------------------- |
| List       | 5 minutes  | 10 minutes | On create/update/delete |
| Detail     | 10 minutes | 30 minutes | On update/delete        |
| Versions   | 15 minutes | 45 minutes | On version upload       |
| Search     | 1 minute   | 5 minutes  | On search query         |
| Categories | 30 minutes | 2 hours    | On category change      |
| Analytics  | 15 minutes | 45 minutes | On document change      |

### Invalidation Rules

```typescript
// After uploading document
queryClient.invalidateQueries({ queryKey: ["documents", "list"] });
queryClient.invalidateQueries({ queryKey: ["documents", "analytics"] });

// After updating document
queryClient.invalidateQueries({ queryKey: ["documents", "detail", id] });
queryClient.invalidateQueries({ queryKey: ["documents", "list"] });

// After sharing document
queryClient.invalidateQueries({ queryKey: ["documents", "detail", id] });
queryClient.invalidateQueries({ queryKey: ["documents", "analytics"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Upload Document

1. User navigates to documents page
2. User clicks "Upload Document" button
3. System opens upload dialog
4. User selects file(s) to upload
5. User fills document metadata
6. User clicks "Upload"
7. System uploads document and shows success

#### 2. View Document

1. User navigates to documents page
2. User clicks on document
3. System opens document viewer
4. User can view document content
5. User can add comments
6. User can share document

#### 3. Search Documents

1. User navigates to documents page
2. User enters search query
3. System shows search results
4. User can filter by category, tags, date
5. User clicks on result to view document

### UI States

| State          | Component            | Message                          |
| -------------- | -------------------- | -------------------------------- |
| **Empty**      | `DocumentEmptyState` | "No documents found"             |
| **Loading**    | `DocumentSkeleton`   | Loading skeleton                 |
| **Error**      | `DocumentErrorState` | "Failed to load documents"       |
| **No Results** | `DocumentNoResults`  | "No documents match your search" |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Drag**: File drag-and-drop, visual feedback
- **Form Validation**: Inline errors, real-time validation

---

## ♿ Accessibility

### WCAG 2.2 AA Compliance

- **Color Contrast**: ≥4.5:1 for normal text, ≥3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader**: Proper ARIA labels and descriptions
- **Focus Management**: Clear focus indicators, logical tab order

### Keyboard Shortcuts

| Shortcut       | Action             |
| -------------- | ------------------ |
| `Ctrl/Cmd + U` | Upload document    |
| `Ctrl/Cmd + F` | Focus search field |
| `Ctrl/Cmd + S` | Save document      |
| `Ctrl/Cmd + D` | Download document  |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

### ARIA Implementation

```typescript
// Document list
<table role="table" aria-label="Documents list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Name</th>
      <th role="columnheader" aria-sort="none">Type</th>
      <th role="columnheader" aria-sort="none">Size</th>
    </tr>
  </thead>
</table>

// Document upload
<form role="form" aria-label="Upload Document">
  <input
    type="file"
    aria-describedby="file-error"
    aria-invalid="false"
    aria-label="Select file"
  />
  <div id="file-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("DocumentList", () => {
  it("renders list of documents", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("useDocumentUpload", () => {
  it("uploads document successfully", () => {});
  it("handles upload errors", () => {});
  it("validates file types", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Document API Integration", () => {
  it("uploads document successfully", () => {});
  it("downloads document successfully", () => {});
  it("shares document successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Document Management E2E", () => {
  it("complete upload flow", () => {});
  it("complete view flow", () => {});
  it("complete search flow", () => {});
  it("complete share flow", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Document Management Accessibility", () => {
  it("meets WCAG 2.2 AA standards", () => {});
  it("supports keyboard navigation", () => {});
  it("works with screen readers", () => {});
  it("has proper color contrast", () => {});
});
```

---

## ⚡ Performance

### Bundle Size

- **Target**: ≤350KB gzipped per route
- **Current**: <CURRENT_SIZE>KB
- **Optimization**: Code splitting, lazy loading, document viewer optimization

### Loading Performance

- **TTFB**: ≤70ms (Time to First Byte)
- **TTI**: ≤200ms (Time to Interactive)
- **LCP**: ≤2.5s (Largest Contentful Paint)

### Optimization Strategies

```typescript
// Lazy loading
const DocumentViewer = lazy(() => import("./components/DocumentViewer"));
const DocumentUpload = lazy(() => import("./components/DocumentUpload"));

// Document viewer optimization
import { DocumentViewer } from "react-document-viewer";

// Virtual scrolling for large lists
import { FixedSizeList as List } from "react-window";
```

---

## 🚀 Implementation Guide

### Step 1: Setup

```bash
# Create directory structure
mkdir -p apps/web/app/(dashboard)/documents
mkdir -p apps/web/components/documents
mkdir -p apps/web/hooks/documents

# Create feature flag
echo 'flags.m74_document_management = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/documents/DocumentList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useDocumentList } from "@/hooks/documents/useDocumentList";

export function DocumentList() {
  const { data, isLoading, error } = useDocumentList();

  if (isLoading) return <DocumentSkeleton />;
  if (error) return <DocumentErrorState />;
  if (!data?.length) return <DocumentEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="name"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/documents/useDocumentList.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useDocumentList(filters?: DocumentFilters) {
  return useQuery({
    queryKey: ["documents", "list", filters],
    queryFn: () => api.documents.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/documents/page.tsx
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentFilters } from "@/components/documents/DocumentFilters";

export default function DocumentPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Documents</h1>
        <UploadDocumentButton />
      </div>
      <DocumentFilters />
      <DocumentList />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/documents/__tests__/DocumentList.test.tsx
import { render, screen } from "@testing-library/react";
import { DocumentList } from "@/components/documents/DocumentList";

describe("DocumentList", () => {
  it("renders list of documents", () => {
    render(<DocumentList />);
    expect(screen.getByRole("table")).toBeInTheDocument();
  });
});
```

---

## ✅ Quality Gates

### Code Quality

| Gate              | Threshold | Enforcement |
| ----------------- | --------- | ----------- |
| TypeScript errors | 0         | CI blocks   |
| ESLint errors     | 0         | CI blocks   |
| Test coverage     | ≥90%      | CI blocks   |
| Bundle size       | ≤350KB    | CI blocks   |

### Performance

| Gate                     | Threshold | Enforcement |
| ------------------------ | --------- | ----------- |
| TTFB                     | ≤70ms     | Manual      |
| TTI                      | ≤200ms    | Manual      |
| Lighthouse Performance   | ≥90       | CI warns    |
| Lighthouse Accessibility | ≥95       | CI warns    |

### Accessibility

| Gate                | Threshold          | Enforcement |
| ------------------- | ------------------ | ----------- |
| WCAG 2.2 AA         | 100%               | CI blocks   |
| Axe violations      | 0 serious/critical | CI blocks   |
| Keyboard navigation | 100%               | Manual      |
| Screen reader       | 100%               | Manual      |

---

## 🚀 Deployment

### Feature Flag

```typescript
// Feature flag configuration
const flags = {
  m74_document_management: false, // Default: disabled
};

// Usage in components
if (flags.m74_document_management) {
  return <DocumentList />;
}
return <ComingSoon />;
```

### Rollout Plan

| Environment | Cohort           | Success Criteria  | Duration |
| ----------- | ---------------- | ----------------- | -------- |
| Dev         | All developers   | Manual QA passes  | 1 day    |
| Staging     | QA team          | All tests pass    | 2 days   |
| Production  | Beta users (5%)  | Error rate < 0.1% | 3 days   |
| Production  | All users (100%) | Monitor for 24h   | Ongoing  |

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):

1. **Set feature flag**: `flags.m74_document_management = false`
2. **Invalidate cache**: `revalidateTag('documents')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Document upload functional
- [ ] Document viewer working
- [ ] Document search working
- [ ] Document sharing functional
- [ ] Version control working
- [ ] Form validation complete
- [ ] Error handling implemented
- [ ] Loading states shown
- [ ] Success messages displayed
- [ ] Responsive design verified

### Quality Requirements

- [ ] All quality gates passed
- [ ] Test coverage ≥90%
- [ ] Accessibility compliant
- [ ] Performance targets met
- [ ] Code review approved
- [ ] QA sign-off obtained
- [ ] Design sign-off obtained
- [ ] Feature flag deployed

---

**Ready to implement Document Management UI! 🚀**
