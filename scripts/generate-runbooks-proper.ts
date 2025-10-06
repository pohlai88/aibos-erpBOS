/**
 * Generate UI Runbooks M09-M40 with proper UTF-8 encoding
 * This script creates complete runbook structures with placeholders for killer features
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, '../ui-runbook');

// Module definitions with specific details
const modules = [
  {
    id: 'M09',
    name: 'CAPEX Planning',
    priority: 'MEDIUM',
    phase: '3 - Asset Management',
    effort: '1.5 days',
    apis: 4,
  },
  {
    id: 'M10',
    name: 'Intangible Assets',
    priority: 'LOW',
    phase: '3 - Asset Management',
    effort: '1 day',
    apis: 4,
  },
  {
    id: 'M11',
    name: 'Inventory',
    priority: 'MEDIUM',
    phase: '3 - Asset Management',
    effort: '2 days',
    apis: 8,
  },
  {
    id: 'M12',
    name: 'Revenue Recognition',
    priority: 'HIGH',
    phase: '4 - Advanced Financial',
    effort: '2.5 days',
    apis: 26,
  },
  {
    id: 'M13',
    name: 'Tax Management',
    priority: 'HIGH',
    phase: '4 - Advanced Financial',
    effort: '2 days',
    apis: 16,
  },
  {
    id: 'M14',
    name: 'Budget Planning',
    priority: 'MEDIUM',
    phase: '4 - Advanced Financial',
    effort: '1.5 days',
    apis: 12,
  },
  {
    id: 'M15',
    name: 'Cash Flow Forecasting',
    priority: 'MEDIUM',
    phase: '4 - Advanced Financial',
    effort: '1 day',
    apis: 3,
  },
  {
    id: 'M16',
    name: 'Allocation Engine',
    priority: 'MEDIUM',
    phase: '5 - Consolidation & Allocation',
    effort: '1.5 days',
    apis: 7,
  },
  {
    id: 'M17',
    name: 'Consolidation',
    priority: 'HIGH',
    phase: '5 - Consolidation & Allocation',
    effort: '2 days',
    apis: 10,
  },
  {
    id: 'M18',
    name: 'Intercompany',
    priority: 'MEDIUM',
    phase: '5 - Consolidation & Allocation',
    effort: '1.5 days',
    apis: 7,
  },
  {
    id: 'M19',
    name: 'Multi-Currency',
    priority: 'MEDIUM',
    phase: '5 - Consolidation & Allocation',
    effort: '1 day',
    apis: 4,
  },
  {
    id: 'M20',
    name: 'Close Management',
    priority: 'HIGH',
    phase: '6 - Compliance & Controls',
    effort: '2.5 days',
    apis: 24,
  },
  {
    id: 'M21',
    name: 'Evidence Management',
    priority: 'MEDIUM',
    phase: '6 - Compliance & Controls',
    effort: '1.5 days',
    apis: 8,
  },
  {
    id: 'M22',
    name: 'Attestation',
    priority: 'MEDIUM',
    phase: '6 - Compliance & Controls',
    effort: '1.5 days',
    apis: 14,
  },
  {
    id: 'M23',
    name: 'Payment Processing',
    priority: 'HIGH',
    phase: '7 - Payments & Billing',
    effort: '3 days',
    apis: 32,
  },
  {
    id: 'M24',
    name: 'AR Collections',
    priority: 'HIGH',
    phase: '7 - Payments & Billing',
    effort: '2.5 days',
    apis: 27,
  },
  {
    id: 'M25',
    name: 'Customer Portal',
    priority: 'MEDIUM',
    phase: '7 - Payments & Billing',
    effort: '2 days',
    apis: 11,
  },
  {
    id: 'M26',
    name: 'Recurring Billing',
    priority: 'MEDIUM',
    phase: '7 - Payments & Billing',
    effort: '1.5 days',
    apis: 13,
  },
  {
    id: 'M27',
    name: 'SOX Controls',
    priority: 'HIGH',
    phase: '8 - SOX & ITGC',
    effort: '1.5 days',
    apis: 12,
  },
  {
    id: 'M28',
    name: 'ITGC',
    priority: 'HIGH',
    phase: '8 - SOX & ITGC',
    effort: '1.5 days',
    apis: 16,
  },
  {
    id: 'M29',
    name: 'Operations Automation',
    priority: 'MEDIUM',
    phase: '8 - SOX & ITGC',
    effort: '2 days',
    apis: 18,
  },
  {
    id: 'M30',
    name: 'Close Insights',
    priority: 'MEDIUM',
    phase: '8 - SOX & ITGC',
    effort: '1 day',
    apis: 8,
  },
  {
    id: 'M31',
    name: 'Lease Accounting',
    priority: 'HIGH',
    phase: '9 - Lease Accounting',
    effort: '4 days',
    apis: 46,
  },
  {
    id: 'M32',
    name: 'Sublease Management',
    priority: 'LOW',
    phase: '9 - Lease Accounting',
    effort: '1 day',
    apis: 3,
  },
  {
    id: 'M33',
    name: 'Sale-Leaseback',
    priority: 'LOW',
    phase: '9 - Lease Accounting',
    effort: '1 day',
    apis: 5,
  },
  {
    id: 'M34',
    name: 'Projects & Jobs',
    priority: 'MEDIUM',
    phase: '10 - Extended Modules',
    effort: '2 days',
    apis: 15,
  },
  {
    id: 'M35',
    name: 'Time & Expenses',
    priority: 'MEDIUM',
    phase: '10 - Extended Modules',
    effort: '2 days',
    apis: 12,
  },
  {
    id: 'M36',
    name: 'Purchase Orders',
    priority: 'MEDIUM',
    phase: '10 - Extended Modules',
    effort: '1.5 days',
    apis: 10,
  },
  {
    id: 'M37',
    name: 'Sales Orders',
    priority: 'MEDIUM',
    phase: '10 - Extended Modules',
    effort: '1.5 days',
    apis: 10,
  },
  {
    id: 'M38',
    name: 'CRM Integration',
    priority: 'LOW',
    phase: '10 - Extended Modules',
    effort: '2 days',
    apis: 8,
  },
  {
    id: 'M39',
    name: 'Analytics & BI',
    priority: 'MEDIUM',
    phase: '10 - Extended Modules',
    effort: '2 days',
    apis: 12,
  },
  {
    id: 'M40',
    name: 'API Gateway',
    priority: 'LOW',
    phase: '10 - Extended Modules',
    effort: '1.5 days',
    apis: 6,
  },
];

function generateRunbook(module: (typeof modules)[0]) {
  const hours = parseFloat(module.effort) * 8;
  const days = parseFloat(module.effort);

  return `# 🚀 ${module.id}: ${module.name} - UI Implementation Runbook

**Module ID**: ${module.id}  
**Module Name**: ${module.name}  
**Priority**: ${module.priority}  
**Phase**: ${module.phase}  
**Estimated Effort**: ${module.effort}  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

[Module description to be added]

### Business Value

- [Business value point 1]
- [Business value point 2]
- [Business value point 3]
- [Business value point 4]
- [Business value point 5]

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | ${module.apis} endpoints implemented |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ \`/api/[path]\` - [Endpoint description]
- ✅ \`/api/[path]\` - [Endpoint description]

**Total Endpoints**: ${module.apis}

---

## 🎯 3 Killer Features

### 1. **[Feature Name]** 🚀

**Description**: [Feature description to be added]

**Why It's Killer**:

- [Competitive advantage 1]
- [Competitive advantage 2]
- [Competitive advantage 3]
- [Measurable business impact]
- [Comparison to competitors]

**Implementation**:

\`\`\`typescript
import { Component } from "aibos-ui";

// Implementation code to be added
\`\`\`

### 2. **[Feature Name]** ⚡

**Description**: [Feature description to be added]

**Why It's Killer**:

- [Competitive advantage 1]
- [Competitive advantage 2]
- [Competitive advantage 3]
- [Measurable business impact]

**Implementation**:

\`\`\`typescript
// Implementation code to be added
\`\`\`

### 3. **[Feature Name]** 💎

**Description**: [Feature description to be added]

**Why It's Killer**:

- [Competitive advantage 1]
- [Competitive advantage 2]
- [Competitive advantage 3]
- [Measurable business impact]

**Implementation**:

\`\`\`typescript
// Implementation code to be added
\`\`\`

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Main Page (\`/[module]/[page]\`)

**Components**: DataTable, Button, Card, Form
**File**: \`apps/web/app/(dashboard)/[module]/page.tsx\`

#### 2. Detail Page (\`/[module]/[id]\`)

**Components**: Form, Button, Card, Badge
**File**: \`apps/web/app/(dashboard)/[module]/[id]/page.tsx\`

---

## 🔌 API Integration

\`\`\`typescript
// apps/web/hooks/use${module.name.replace(/\s+/g, '')}.ts
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@aibos/api-client";

export function use${module.name.replace(/\s+/g, '')}(filters = {}) {
  return useQuery({
    queryKey: ["${module.id.toLowerCase()}", filters],
    queryFn: () => apiClient.GET("/api/[path]", { query: filters }),
  });
}

export function useCreate${module.name.replace(/\s+/g, '')}() {
  return useMutation({
    mutationFn: (data) => apiClient.POST("/api/[path]", { body: data }),
    onSuccess: () => queryClient.invalidateQueries(["${module.id.toLowerCase()}"]),
  });
}
\`\`\`

---

## 📝 Implementation Guide

${
  days > 1
    ? Array.from(
        { length: Math.ceil(days) },
        (_, i) =>
          `### Day ${i + 1}: [Tasks] (8 hours)

1. [Task 1] (X hours)
2. [Task 2] (X hours)
3. [Task 3] (X hours)
`
      ).join('\n')
    : `### Day 1: [Tasks] (${hours} hours)

1. [Task 1] (X hours)
2. [Task 2] (X hours)
`
}

**Total**: ${module.effort} (${hours} hours)

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
${
  days > 1
    ? Array.from(
        { length: Math.ceil(days) },
        (_, i) => `| ${i + 1}   | [Deliverable description] |`
      ).join('\n')
    : `| 1   | [Deliverable description] |`
}

**Total**: ${module.effort} (${hours} hours)

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

**Previous**: ${module.id === 'M09' ? 'M8 - Fixed Assets' : `M${(parseInt(module.id.slice(1)) - 1).toString().padStart(2, '0')} - [Previous Module]`}  
**Next**: ${module.id === 'M40' ? 'Implementation Complete!' : `M${(parseInt(module.id.slice(1)) + 1).toString().padStart(2, '0')} - [Next Module]`}
`;
}

// Generate all runbooks
modules.forEach(module => {
  const fileName = `${module.id}-${module.name.toUpperCase().replace(/\s+/g, '-').replace(/&/g, '')}.md`;
  const filePath = path.join(outputDir, fileName);
  const content = generateRunbook(module);

  fs.writeFileSync(filePath, content, { encoding: 'utf8' });
  console.log(`✅ Created: ${fileName}`);
});

console.log(`\n🎉 All ${modules.length} runbooks generated successfully!`);
console.log(`📁 Location: ${outputDir}/`);
console.log(`\n📝 Next step: Populate killer features for each module`);
