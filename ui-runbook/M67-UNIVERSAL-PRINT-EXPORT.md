# 🎯 M67: Universal Print & Export Hub - UI Implementation Runbook

**Module ID**: M67  
**Module Name**: Universal Print & Export Hub  
**Priority**: 🔥 HIGH  
**Phase**: User Experience  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

---

## 📋 Module Overview

Universal Print & Export Hub provides **comprehensive export capabilities** for businesses requiring **multi-format exports**, **print management**, and **document generation**.

### Business Value

**Key Benefits**:

- **User Productivity**: Export data in multiple formats
- **Print Management**: Centralized print control
- **Document Generation**: Automated document creation
- **Data Portability**: Easy data migration and sharing

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status    | Details                                               |
| ------------- | --------- | ----------------------------------------------------- |
| **Database**  | 🔄 HYBRID | Basic export exists, needs enhancement                |
| **Services**  | 🔄 HYBRID | Basic export services exist, needs universal features |
| **API**       | 🔄 HYBRID | Basic export APIs exist, needs print management       |
| **Contracts** | 🔄 HYBRID | Basic export types exist, needs universal schema      |

### API Endpoints

**Universal Print & Export Hub** (Enhancement needed):

- 🔄 `/api/export/formats` - Available export formats (needs enhancement)
- 🔄 `/api/export/generate` - Generate export (needs implementation)
- 🔄 `/api/export/download` - Download export (needs implementation)
- 🔄 `/api/print/templates` - Print templates (needs implementation)
- 🔄 `/api/print/generate` - Generate print document (needs implementation)
- 🔄 `/api/print/queue` - Print queue management (needs implementation)

---

## 🏗️ UI Architecture

### Pages & Routes

| Route               | Page Component        | Purpose                |
| ------------------- | --------------------- | ---------------------- |
| `/export`           | `ExportHubPage`       | Export hub dashboard   |
| `/export/generate`  | `ExportGeneratePage`  | Generate export        |
| `/export/downloads` | `ExportDownloadsPage` | Download exports       |
| `/print`            | `PrintHubPage`        | Print hub dashboard    |
| `/print/templates`  | `PrintTemplatesPage`  | Print templates        |
| `/print/queue`      | `PrintQueuePage`      | Print queue management |

### Component Structure

```
apps/web/app/(dashboard)/export/
├── page.tsx                    # Export hub page
├── generate/
│   └── page.tsx               # Generate export page
└── downloads/
    └── page.tsx               # Download exports page

apps/web/app/(dashboard)/print/
├── page.tsx                    # Print hub page
├── templates/
│   └── page.tsx               # Print templates page
└── queue/
    └── page.tsx               # Print queue page

apps/web/components/export/
├── ExportHub.tsx              # Export hub component
├── ExportForm.tsx             # Export form component
├── ExportDownloads.tsx        # Export downloads component
├── ExportProgress.tsx         # Export progress component
└── ExportFilters.tsx          # Export filters component

apps/web/components/print/
├── PrintHub.tsx               # Print hub component
├── PrintTemplates.tsx          # Print templates component
├── PrintQueue.tsx              # Print queue component
├── PrintForm.tsx              # Print form component
└── PrintSettings.tsx          # Print settings component

apps/web/hooks/export/
├── useExportFormats.ts        # Export formats hook
├── useExportGenerate.ts       # Export generate hook
├── useExportDownloads.ts      # Export downloads hook
└── useExportProgress.ts       # Export progress hook

apps/web/hooks/print/
├── usePrintTemplates.ts        # Print templates hook
├── usePrintGenerate.ts        # Print generate hook
├── usePrintQueue.ts           # Print queue hook
└── usePrintSettings.ts        # Print settings hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages (data fetching)
- **Client Components**: Export forms, print management
- **Feature Flag**: `flags.m67_export_print = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose         | Variant                    |
| ----------- | --------------- | -------------------------- |
| `DataTable` | List exports    | With filters, pagination   |
| `Card`      | Export details  | With actions               |
| `Form`      | Export forms    | With validation            |
| `Button`    | Actions         | Primary, secondary, danger |
| `Modal`     | Confirmations   | With backdrop              |
| `Select`    | Format picker   | With search                |
| `Badge`     | Status tags     | With colors                |
| `Progress`  | Export progress | With percentage            |
| `Tabs`      | Export sections | With icons                 |

### Design Tokens

```typescript
// Export-specific colors
const exportColors = {
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  error: "hsl(var(--error))",
  info: "hsl(var(--info))",
  processing: "hsl(var(--processing))",
};

// Export status colors
const exportStatusColors = {
  completed: "bg-green-100 text-green-800",
  processing: "bg-blue-100 text-blue-800",
  failed: "bg-red-100 text-red-800",
  queued: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-gray-100 text-gray-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  export: {
    formats: ["export", "formats"] as const,
    generate: ["export", "generate"] as const,
    downloads: ["export", "downloads"] as const,
    progress: (id: string) => ["export", "progress", id] as const,
  },
  print: {
    templates: ["print", "templates"] as const,
    generate: ["print", "generate"] as const,
    queue: ["print", "queue"] as const,
    settings: ["print", "settings"] as const,
  },
};
```

### Cache Configuration

| Query Type       | Stale Time | Cache Time | Invalidation       |
| ---------------- | ---------- | ---------- | ------------------ |
| Export Formats   | 10 minutes | 30 minutes | On format update   |
| Export Downloads | 5 minutes  | 15 minutes | On new export      |
| Print Templates  | 10 minutes | 30 minutes | On template update |
| Print Queue      | 1 minute   | 5 minutes  | On queue change    |

---

## 🎭 User Experience

### User Flows

#### 1. Export Data

1. User navigates to `/export`
2. System shows export hub
3. User selects data source and format
4. User configures export options
5. User clicks export button
6. System generates export and shows progress

#### 2. Download Export

1. User navigates to `/export/downloads`
2. System shows available downloads
3. User clicks download button
4. System downloads file to user's device

#### 3. Print Document

1. User navigates to `/print`
2. System shows print hub
3. User selects document and template
4. User configures print options
5. User clicks print button
6. System generates print document

#### 4. Manage Print Queue

1. User navigates to `/print/queue`
2. System shows print queue
3. User can view, cancel, or prioritize jobs
4. User can monitor print progress

### UI States

| State          | Component          | Message                        |
| -------------- | ------------------ | ------------------------------ |
| **Empty**      | `ExportEmptyState` | "No exports found"             |
| **Loading**    | `ExportSkeleton`   | Loading skeleton               |
| **Error**      | `ExportErrorState` | "Failed to load exports"       |
| **No Results** | `ExportNoResults`  | "No exports match your search" |

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
| `Ctrl/Cmd + E` | Open export form   |
| `Ctrl/Cmd + P` | Open print form    |
| `Ctrl/Cmd + F` | Focus search field |
| `Escape`       | Close modal/dialog |
| `Enter`        | Submit form        |

---

## 🧪 Testing Strategy

### Unit Tests

```typescript
// Component tests
describe("ExportHub", () => {
  it("renders export hub", () => {});
  it("handles empty state", () => {});
  it("handles loading state", () => {});
  it("handles error state", () => {});
  it("handles export generation", () => {});
  it("handles export download", () => {});
});

// Hook tests
describe("useExportGenerate", () => {
  it("generates export successfully", () => {});
  it("handles export progress", () => {});
  it("handles export errors", () => {});
  it("handles export cancellation", () => {});
});
```

### Integration Tests

```typescript
// API integration
describe("Export API Integration", () => {
  it("generates export successfully", () => {});
  it("downloads export successfully", () => {});
  it("generates print document successfully", () => {});
  it("handles API errors gracefully", () => {});
});
```

### E2E Tests

```typescript
// User journeys
describe("Export E2E", () => {
  it("complete export generation flow", () => {});
  it("complete export download flow", () => {});
  it("complete print generation flow", () => {});
  it("complete print queue management flow", () => {});
  it("keyboard navigation", () => {});
});
```

---

## ⚡ Performance

### Bundle Size

- **Target**: ≤300KB gzipped per route
- **Current**: <CURRENT_SIZE>KB
- **Optimization**: Code splitting, lazy loading

### Loading Performance

- **TTFB**: ≤70ms (Time to First Byte)
- **TTI**: ≤200ms (Time to Interactive)
- **LCP**: ≤2.5s (Largest Contentful Paint)

---

## 🚀 Implementation Guide

### Step 1: Setup

```bash
# Create directory structure
mkdir -p apps/web/app/(dashboard)/export
mkdir -p apps/web/app/(dashboard)/print
mkdir -p apps/web/components/export
mkdir -p apps/web/components/print
mkdir -p apps/web/hooks/export
mkdir -p apps/web/hooks/print

# Create feature flag
echo 'flags.m67_export_print = false' >> .env.local
```

### Step 2: Create Components

```typescript
// apps/web/components/export/ExportHub.tsx
"use client";

import { Tabs } from "@/components/ui/tabs";
import { ExportForm } from "./ExportForm";
import { ExportDownloads } from "./ExportDownloads";

export function ExportHub() {
  return (
    <Tabs defaultValue="generate" className="space-y-6">
      <TabsList>
        <TabsTrigger value="generate">Generate Export</TabsTrigger>
        <TabsTrigger value="downloads">Downloads</TabsTrigger>
      </TabsList>
      <TabsContent value="generate">
        <ExportForm />
      </TabsContent>
      <TabsContent value="downloads">
        <ExportDownloads />
      </TabsContent>
    </Tabs>
  );
}
```

### Step 3: Create Hooks

```typescript
// apps/web/hooks/export/useExportGenerate.ts
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useExportGenerate() {
  return useMutation({
    mutationFn: (data: ExportRequest) => api.export.generate(data),
    onSuccess: () => {
      // Invalidate downloads list
      queryClient.invalidateQueries({ queryKey: ["export", "downloads"] });
    },
  });
}
```

### Step 4: Create Pages

```typescript
// apps/web/app/(dashboard)/export/page.tsx
import { ExportHub } from "@/components/export/ExportHub";

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Export Hub</h1>
      </div>
      <ExportHub />
    </div>
  );
}
```

### Step 5: Add Tests

```typescript
// apps/web/app/(dashboard)/export/__tests__/ExportHub.test.tsx
import { render, screen } from "@testing-library/react";
import { ExportHub } from "@/components/export/ExportHub";

describe("ExportHub", () => {
  it("renders export hub", () => {
    render(<ExportHub />);
    expect(screen.getByRole("tablist")).toBeInTheDocument();
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
| Bundle size       | ≤300KB    | CI blocks   |

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
  m67_export_print: false, // Default: disabled
};

// Usage in components
if (flags.m67_export_print) {
  return <ExportHub />;
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

1. **Set feature flag**: `flags.m67_export_print = false`
2. **Invalidate cache**: `revalidateTag('export')`
3. **Monitor**: Error rate drops below 0.1%
4. **Post-mortem**: Create incident report

---

## 📝 Definition of Done

### Functional Requirements

- [ ] All export operations working
- [ ] Export generation functional
- [ ] Export download working
- [ ] Print generation working
- [ ] Print queue management working
- [ ] Print template management working
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
