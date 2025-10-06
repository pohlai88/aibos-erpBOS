# 🚀 M09: CAPEX Planning - UI Implementation Runbook

**Module ID**: M09  
**Module Name**: CAPEX Planning  
**Priority**: MEDIUM  
**Phase**: 3 - Asset Management  
**Estimated Effort**: 1.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

CAPEX Planning manages **capital expenditure budgeting, approval workflows, and ROI tracking** for major investments. Essential for strategic planning and capital allocation optimization.

### Business Value

- Multi-year capital expenditure planning and forecasting
- ROI and NPV analysis for investment decisions
- Approval workflow automation with business case tracking
- Integration with fixed assets upon project completion
- Compliance with capital budgeting policies

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 4 endpoints implemented       |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/[path]` - [Endpoint description]
- ✅ `/api/[path]` - [Endpoint description]

**Total Endpoints**: 4

---

## 🎯 3 Killer Features

### 1. **Interactive CAPEX Portfolio Dashboard** 📊

**Description**: Visual dashboard showing all capital projects with real-time status, spend vs budget, and ROI projections.

**Why It's Killer**:

- Interactive Gantt chart for project timelines
- Real-time spend tracking against approved budgets
- ROI and payback period calculations
- Portfolio-level capital allocation optimization
- Better than SAP's static capital planning reports

**Implementation**:

```typescript
import { Chart, DataTable, Card } from "aibos-ui";

export default function CapexDashboard() {
  const { projects } = useCapexProjects();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Total Approved</h3>
          <div className="text-3xl">
            {formatCurrency(projects.totalApproved)}
          </div>
        </Card>
        <Card>
          <h3>YTD Spend</h3>
          <div className="text-3xl">{formatCurrency(projects.ytdSpend)}</div>
        </Card>
        <Card>
          <h3>Expected ROI</h3>
          <div className="text-3xl">{projects.avgROI}%</div>
        </Card>
      </div>

      <Chart
        type="gantt"
        data={projects.list}
        showMilestones
        showDependencies
      />
    </div>
  );
}
```

### 2. **AI-Powered ROI Calculator** 🤖

**Description**: Intelligent ROI and NPV calculator that factors in depreciation, tax benefits, and opportunity costs.

**Why It's Killer**:

- Automated NPV/IRR calculations
- Tax benefit modeling including accelerated depreciation
- Sensitivity analysis with what-if scenarios
- Comparison to alternative investments
- Industry-first AI-powered capital decision support

**Implementation**:

```typescript
import { Form, Card, Chart } from "aibos-ui";

export default function ROICalculator() {
  const { calculate } = useROICalculation();

  return (
    <Form onSubmit={calculate}>
      <Input
        name="initial_investment"
        label="Initial Investment"
        type="number"
      />
      <Input name="useful_life" label="Useful Life (years)" type="number" />
      <Input
        name="annual_revenue"
        label="Expected Annual Revenue"
        type="number"
      />
      <Input name="annual_cost" label="Annual Operating Cost" type="number" />

      <Card className="bg-blue-50">
        <h3>Calculated Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>NPV:</strong> {formatCurrency(results.npv)}
          </div>
          <div>
            <strong>IRR:</strong> {results.irr}%
          </div>
          <div>
            <strong>Payback Period:</strong> {results.payback} years
          </div>
          <div>
            <strong>ROI:</strong> {results.roi}%
          </div>
        </div>
      </Card>

      <Chart type="line" data={results.cashFlow} title="Projected Cash Flows" />
    </Form>
  );
}
```

### 3. **Multi-Level Approval Workflow** ✅

**Description**: Configurable approval workflow with automatic routing based on project size and type.

**Why It's Killer**:

- Automated routing to appropriate approvers
- Parallel and sequential approval paths
- Mobile approval capability
- Full audit trail with approval rationale
- Faster than manual approval processes

**Implementation**:

```typescript
import { Timeline, Card, Button, Modal } from "aibos-ui";

export default function ApprovalWorkflow({ project }) {
  const { approve, reject } = useProjectApproval(project.id);

  return (
    <Card>
      <Timeline
        items={project.approvals.map((a) => ({
          date: a.date,
          user: a.approver,
          status: a.status,
          comments: a.comments,
        }))}
      />

      {project.needsMyApproval && (
        <div className="flex gap-4 mt-4">
          <Button onClick={() => approve()} variant="primary">
            Approve
          </Button>
          <Button onClick={() => reject()} variant="destructive">
            Reject
          </Button>
        </div>
      )}
    </Card>
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
// apps/web/hooks/useCAPEXPlanning.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@aibos/api-client';

export function useCAPEXPlanning(filters = {}) {
  return useQuery({
    queryKey: ['m09', filters],
    queryFn: () => apiClient.GET('/api/[path]', { query: filters }),
  });
}

export function useCreateCAPEXPlanning() {
  return useMutation({
    mutationFn: data => apiClient.POST('/api/[path]', { body: data }),
    onSuccess: () => queryClient.invalidateQueries(['m09']),
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

**Previous**: M8 - Fixed Assets  
**Next**: M10 - [Next Module]
