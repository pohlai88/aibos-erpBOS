# 🎯 M91: Universal Print & Export Hub - UI Implementation Runbook

**Module ID**: M91  
**Module Name**: Universal Print & Export Hub  
**Priority**: 🔥 HIGH  
**Phase**: Phase 17 - Infrastructure Modernization  
**Estimated Effort**: 3 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M67-UNIVERSAL-PRINT-EXPORT

---

## 📋 Module Overview

### Business Value

Universal Print & Export Hub provides **comprehensive printing and export capabilities** for businesses requiring organized document generation and data export across all modules.

**Key Benefits**:

- Universal printing and export functionality
- Multiple format support (PDF, Excel, CSV, etc.)
- Template-based document generation
- Integration with all existing modules

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
| **API**       | ✅ Complete | 15 endpoints available    |
| **Contracts** | ✅ Complete | Type-safe schemas defined |

### API Endpoints

**Universal Print & Export Hub Operations** (15 endpoints):

- ✅ `/api/print-export/templates` - List templates
- ✅ `/api/print-export/templates/[id]` - Get template details
- ✅ `/api/print-export/templates/create` - Create template
- ✅ `/api/print-export/templates/[id]/update` - Update template
- ✅ `/api/print-export/templates/[id]/delete` - Delete template
- ✅ `/api/print-export/print` - Print document
- ✅ `/api/print-export/export` - Export data
- ✅ `/api/print-export/export/pdf` - Export to PDF
- ✅ `/api/print-export/export/excel` - Export to Excel
- ✅ `/api/print-export/export/csv` - Export to CSV
- ✅ `/api/print-export/export/json` - Export to JSON
- ✅ `/api/print-export/export/xml` - Export to XML
- ✅ `/api/print-export/jobs` - List export jobs
- ✅ `/api/print-export/jobs/[id]` - Get job details
- ✅ `/api/print-export/jobs/[id]/download` - Download export

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                               | Page Component                  | Purpose                |
| ----------------------------------- | ------------------------------- | ---------------------- |
| `/print-export`                     | `PrintExportHubPage`            | Main print/export hub  |
| `/print-export/templates`           | `PrintExportTemplatesPage`      | Template management    |
| `/print-export/templates/[id]`      | `PrintExportTemplateDetailPage` | View template          |
| `/print-export/templates/create`    | `PrintExportTemplateCreatePage` | Create template        |
| `/print-export/templates/[id]/edit` | `PrintExportTemplateEditPage`   | Edit template          |
| `/print-export/jobs`                | `PrintExportJobsPage`           | Export jobs management |
| `/print-export/jobs/[id]`           | `PrintExportJobDetailPage`      | View job details       |
| `/print-export/settings`            | `PrintExportSettingsPage`       | Print/export settings  |

### Component Structure

```
apps/web/app/(dashboard)/print-export/
├── page.tsx                    # Main hub page
├── templates/
│   ├── page.tsx               # Templates list
│   ├── [id]/
│   │   ├── page.tsx           # Template details
│   │   └── edit/
│   │       └── page.tsx       # Edit template
│   └── create/
│       └── page.tsx           # Create template
├── jobs/
│   ├── page.tsx               # Jobs list
│   └── [id]/
│       └── page.tsx           # Job details
└── settings/
    └── page.tsx               # Settings page

apps/web/components/print-export/
├── PrintExportHub.tsx         # Main hub component
├── PrintExportTemplates.tsx   # Templates component
├── PrintExportTemplateCard.tsx # Template card
├── PrintExportTemplateForm.tsx # Template form
├── PrintExportJobs.tsx        # Jobs component
├── PrintExportJobCard.tsx     # Job card
├── PrintExportSettings.tsx    # Settings component
├── PrintExportFilters.tsx     # Filter component
└── PrintExportActions.tsx     # Action buttons

apps/web/hooks/print-export/
├── usePrintExportTemplates.ts  # Templates hook
├── usePrintExportTemplateDetail.ts # Template detail hook
├── usePrintExportTemplateCreate.ts # Template create hook
├── usePrintExportTemplateUpdate.ts # Template update hook
├── usePrintExportTemplateDelete.ts # Template delete hook
├── usePrintExportPrint.ts     # Print hook
├── usePrintExportExport.ts    # Export hook
├── usePrintExportJobs.ts      # Jobs hook
├── usePrintExportJobDetail.ts # Job detail hook
├── usePrintExportJobDownload.ts # Job download hook
└── usePrintExportSettings.ts  # Settings hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Forms, interactive elements, modals
- **Feature Flag**: `flags.m91_universal_print_export_hub = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose             | Variant                    |
| ----------- | ------------------- | -------------------------- |
| `DataTable` | List templates/jobs | With filters, pagination   |
| `Card`      | Template details    | With actions               |
| `Form`      | Create/edit forms   | With validation            |
| `Button`    | Actions             | Primary, secondary, danger |
| `Modal`     | Confirmations       | With backdrop              |
| `Tabs`      | Format tabs         | With content               |
| `Progress`  | Export progress     | With status                |

### Design Tokens

```typescript
// Print/Export specific colors
const printExportColors = {
  pdf: "hsl(var(--print-export-pdf))",
  excel: "hsl(var(--print-export-excel))",
  csv: "hsl(var(--print-export-csv))",
  json: "hsl(var(--print-export-json))",
  xml: "hsl(var(--print-export-xml))",
  print: "hsl(var(--print-export-print))",
};

// Export status colors
const exportStatusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

// Template type colors
const templateTypeColors = {
  invoice: "hsl(var(--template-invoice))",
  report: "hsl(var(--template-report))",
  statement: "hsl(var(--template-statement))",
  label: "hsl(var(--template-label))",
  other: "hsl(var(--template-other))",
};
```

### Theme Support

- **Dark Mode**: Default theme
- **Light Mode**: Available via theme toggle
- **High Contrast**: WCAG AAA compliance
- **Print/Export Themes**: Format-based themes

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  templates: ["print-export", "templates"] as const,
  template: (id: string) => ["print-export", "template", id] as const,
  jobs: ["print-export", "jobs"] as const,
  job: (id: string) => ["print-export", "job", id] as const,
  settings: ["print-export", "settings"] as const,
};
```

### Cache Configuration

| Query Type | Stale Time | Cache Time | Invalidation            |
| ---------- | ---------- | ---------- | ----------------------- |
| Templates  | 5 minutes  | 10 minutes | On create/update/delete |
| Template   | 10 minutes | 30 minutes | On update/delete        |
| Jobs       | 1 minute   | 5 minutes  | On job update           |
| Job        | 5 minutes  | 15 minutes | On job completion       |
| Settings   | 15 minutes | 45 minutes | On settings change      |

### Invalidation Rules

```typescript
// After creating template
queryClient.invalidateQueries({ queryKey: ["print-export", "templates"] });

// After updating template
queryClient.invalidateQueries({ queryKey: ["print-export", "template", id] });
queryClient.invalidateQueries({ queryKey: ["print-export", "templates"] });

// After starting export job
queryClient.invalidateQueries({ queryKey: ["print-export", "jobs"] });
```

---

## 🎭 User Experience

### User Flows

#### 1. Create Print/Export Template

1. User navigates to print/export templates page
2. User clicks "Create Template" button
3. System opens template creation form
4. User selects template type and format
5. User designs template layout
6. User configures template settings
7. User saves template

#### 2. Print Document

1. User navigates to print/export hub
2. User selects document to print
3. User chooses print template
4. User configures print settings
5. User clicks "Print" button
6. System generates print job
7. User receives print confirmation

#### 3. Export Data

1. User navigates to print/export hub
2. User selects data to export
3. User chooses export format
4. User configures export settings
5. User clicks "Export" button
6. System creates export job
7. User downloads exported file

### UI States

| State          | Component               | Message                          |
| -------------- | ----------------------- | -------------------------------- |
| **Empty**      | `PrintExportEmptyState` | "No templates found"             |
| **Loading**    | `PrintExportSkeleton`   | Loading skeleton                 |
| **Error**      | `PrintExportErrorState` | "Failed to load templates"       |
| **No Results** | `PrintExportNoResults`  | "No templates match your search" |

### Interactions

- **Hover**: Card elevation, button color change
- **Focus**: Clear focus ring, keyboard navigation
- **Click**: Immediate feedback, loading state
- **Form Validation**: Inline errors, real-time validation
- **Progress**: Export progress, status updates

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
| `Ctrl/Cmd + P` | Print document     |
| `Ctrl/Cmd + E` | Export data        |
| `Ctrl/Cmd + T` | Create template    |
| `Ctrl/Cmd + S` | Save template      |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

### ARIA Implementation

```typescript
// Print/Export list
<table role="table" aria-label="Print/Export templates list">
  <thead role="rowgroup">
    <tr role="row">
      <th role="columnheader" aria-sort="none">Template Name</th>
      <th role="columnheader" aria-sort="none">Type</th>
      <th role="columnheader" aria-sort="none">Format</th>
      <th role="columnheader" aria-sort="none">Created</th>
    </tr>
  </thead>
</table>

// Print/Export form
<form role="form" aria-label="Create Template">
  <input
    aria-describedby="name-error"
    aria-invalid="false"
    aria-label="Template Name"
  />
  <div id="name-error" role="alert" aria-live="polite" />
</form>
```

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("PrintExportTemplates", () => {
  it("renders list of templates", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles search functionality", () => {});
});

// Hook tests
describe("usePrintExportTemplateCreate", () => {
  it("creates template successfully", () => {});
  it("handles creation errors", () => {});
  it("validates template data", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Print/Export API Integration", () => {
  it("creates template successfully", () => {});
  it("prints document successfully", () => {});
  it("exports data successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Universal Print & Export Hub E2E", () => {
  it("complete template creation flow", () => {});
  it("complete print document flow", () => {});
  it("complete export data flow", () => {});
  it("print/export hub functionality", () => {});
  it("keyboard navigation", () => {});
});
```

### Accessibility Tests

```typescript
// A11y tests
describe("Universal Print & Export Hub Accessibility", () => {
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
- **Optimization**: Code splitting, lazy loading, form optimization

### Loading Performance

- **TTFB**: ≤70ms (Time to First Byte)
- **TTI**: ≤200ms (Time to Interactive)
- **LCP**: ≤2.5s (Largest Contentful Paint)

### Optimization Strategies

```typescript
// Lazy loading
const PrintExportTemplateForm = lazy(
  () => import("./components/PrintExportTemplateForm")
);
const PrintExportJobs = lazy(() => import("./components/PrintExportJobs"));

// Form optimization
import { useForm } from "react-hook-form";

// Virtual scrolling for large lists
import { FixedSizeList as List } from "react-window";
```

---

## 🚀 Implementation Guide

### Step 1: Setup

```bash
# Create directory structure
mkdir -p apps/web/app/(dashboard)/print-export
mkdir -p apps/web/components/print-export
mkdir -p apps/web/hooks/print-export

# Create feature flag
echo 'flags.m91_universal_print_export_hub = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/print-export/PrintExportTemplates.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { usePrintExportTemplates } from "@/hooks/print-export/usePrintExportTemplates";

export function PrintExportTemplates() {
  const { data, isLoading, error } = usePrintExportTemplates();

  if (isLoading) return <PrintExportSkeleton />;
  if (error) return <PrintExportErrorState />;
  if (!data?.length) return <PrintExportEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="templateName"
      filters={filters}
    />
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/print-export/usePrintExportTemplates.ts
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function usePrintExportTemplates(filters?: PrintExportFilters) {
  return useQuery({
    queryKey: ["print-export", "templates", filters],
    queryFn: () => api.printExport.templates.list(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/print-export/page.tsx
import { PrintExportHub } from "@/components/print-export/PrintExportHub";
import { PrintExportQuickActions } from "@/components/print-export/PrintExportQuickActions";

export default function PrintExportPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Print & Export Hub</h1>
        <PrintExportQuickActions />
      </div>
      <PrintExportHub />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/print-export/__tests__/PrintExportTemplates.test.tsx
import { render, screen } from "@testing-library/react";
import { PrintExportTemplates } from "@/components/print-export/PrintExportTemplates";

describe("PrintExportTemplates", () => {
  it("renders list of templates", () => {
    render(<PrintExportTemplates />);
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
  m91_universal_print_export_hub: false, // Default: disabled
};

// Usage in components
if (flags.m91_universal_print_export_hub) {
  return <PrintExportTemplates />;
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

1. **Set feature flag**: `flags.m91_universal_print_export_hub = false`
2. **Invalidate cache**: `revalidateTag('print-export')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All CRUD operations working
- [ ] Template management functional
- [ ] Print functionality working
- [ ] Export functionality working
- [ ] Multiple format support functional
- [ ] Export job management working
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

**Ready to implement Universal Print & Export Hub UI! 🚀**
