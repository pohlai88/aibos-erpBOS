# 🚀 M35: Time & Expenses - UI Implementation Runbook

**Module ID**: M35  
**Module Name**: Time & Expenses  
**Priority**: MEDIUM  
**Phase**: 10 - Extended Modules  
**Estimated Effort**: 2 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

M35 provides intuitive time entry and expense management for project-based businesses. Features mobile-first time tracking, OCR receipt capture, automated approval workflows, and seamless integration with project costing and payroll.

### Business Value

- **Mobile Time Entry**: Capture billable time anywhere, increasing time capture by 25%
- **Expense Automation**: OCR receipt scanning reduces expense processing from 5 min to 30 sec
- **Approval Efficiency**: Automated workflows reduce approval time from days to hours
- **Revenue Optimization**: Better time tracking increases billable hours captured by 15-20%
- **Employee Satisfaction**: Easy-to-use mobile app reduces administrative burden

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 12 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/time-expenses/timesheets` - Time entry
- ✅ `/api/time-expenses/expenses` - Expense submission
- ✅ `/api/time-expenses/approvals` - Approval workflows
- ✅ `/api/time-expenses/ocr` - Receipt OCR

**Total Endpoints**: 12

---

## 🎯 3 Killer Features

### 1. **Mobile-First Time Entry** 🚀

**Description**: Beautiful mobile-optimized time entry interface with quick entry shortcuts, recent projects/tasks, timer functionality, and offline capability. Features one-tap entry for recurring activities and bulk time entry for the week.

**Why It's Killer**:

- **Mobile-First Design**: 80% of time entry happens on mobile (competitors have clunky mobile UIs)
- **Quick Entry**: Log time in 3 taps vs. 10+ taps in SAP/Oracle
- **Offline Mode**: Capture time without internet, syncs when connected
- **Measurable Impact**: Increase time entry compliance from 70% to 95%
- **Vs Replicon/TSheets**: Better UI and native ERP integration (standalone tools require syncing)

**Implementation**:

```typescript
import { Card, Button, Select, Input, Badge, Timer } from "aibos-ui";
import { useTimeEntry, useStartTimer } from "@/hooks/useTimeExpenses";

export default function MobileTimeEntry() {
  const { submitTime, recentProjects } = useTimeEntry();
  const { timer, startTimer, stopTimer } = useStartTimer();

  return (
    <div className="max-w-md mx-auto space-y-4">
      {timer.running && (
        <Card className="bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{timer.project_name}</h3>
              <p className="text-sm text-gray-600">{timer.task_name}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {timer.elapsed_time}
              </div>
              <Button size="sm" variant="error" onClick={stopTimer}>
                Stop & Save
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card title="Quick Time Entry">
        <Form onSubmit={submitTime} className="space-y-4">
          <Input type="date" label="Date" name="date" defaultValue={today} />
          <Select
            label="Project"
            name="project_id"
            options={recentProjects}
            searchable
          />
          <Select
            label="Task"
            name="task_id"
            options={/* tasks */}
            searchable
          />
          <Input
            type="number"
            label="Hours"
            name="hours"
            step="0.25"
            required
          />
          <Textarea label="Description" name="description" rows={2} />
          <div className="flex items-center gap-2">
            <Checkbox label="Billable" name="billable" defaultChecked />
          </div>
          <Button type="submit" variant="primary" fullWidth>
            Log Time
          </Button>
        </Form>
      </Card>

      <Card title="Recent Projects">
        <div className="space-y-2">
          {recentProjects.map((project) => (
            <Button
              key={project.id}
              variant="outline"
              fullWidth
              onClick={() => startTimer(project)}
              className="justify-between"
            >
              <span>{project.name}</span>
              <Badge>{project.recent_hours}h this week</Badge>
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

### 2. **OCR Expense Capture** ⚡

**Description**: AI-powered receipt scanning that extracts vendor, date, amount, and category from photos. Features multi-receipt batch upload, automatic mileage calculation, and policy compliance checking.

**Why It's Killer**:

- **OCR Accuracy**: 95%+ accurate data extraction from receipts (best-in-class)
- **Speed**: Process expenses in 30 seconds vs. 5 minutes manual entry
- **Policy Enforcement**: Flags out-of-policy expenses before submission
- **Measurable Impact**: Reduce expense processing costs by 70%
- **Vs Concur/Expensify**: Better OCR and native ERP integration

**Implementation**:

```typescript
import { Card, Button, FileUpload, Badge, DataTable, Alert } from "aibos-ui";
import { useExpenseSubmission, useOCR } from "@/hooks/useTimeExpenses";

export default function OCRExpenseCapture() {
  const { submitExpense, expenses } = useExpenseSubmission();
  const { scanReceipt, ocrResult } = useOCR();

  return (
    <div className="space-y-6">
      <Card title="Scan Receipt">
        <FileUpload
          accept="image/*,application/pdf"
          capture="environment"
          onUpload={scanReceipt}
          label="Take Photo or Upload Receipt"
        />

        {ocrResult && (
          <div className="mt-4 space-y-4">
            {ocrResult.policy_violations.length > 0 && (
              <Alert variant="warning">
                <strong>Policy Violation Detected:</strong>
                <ul>
                  {ocrResult.policy_violations.map((v) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Vendor"
                name="vendor"
                value={ocrResult.vendor}
                readOnly
              />
              <Input
                label="Date"
                type="date"
                name="date"
                value={ocrResult.date}
                readOnly
              />
              <Input
                label="Amount"
                type="number"
                name="amount"
                value={ocrResult.amount}
                prefix="$"
              />
              <Select
                label="Category"
                name="category"
                value={ocrResult.category}
                options={expenseCategories}
              />
            </div>

            <Input label="Project (Optional)" name="project_id" />
            <Textarea label="Business Purpose" name="description" required />

            <Button variant="primary" onClick={submitExpense}>
              Submit Expense
            </Button>
          </div>
        )}
      </Card>

      <Card title="Pending Expenses">
        <DataTable
          data={expenses.filter((e) => e.status === "Draft")}
          columns={[
            { key: "date", label: "Date" },
            { key: "vendor", label: "Vendor" },
            { key: "category", label: "Category" },
            {
              key: "amount",
              label: "Amount",
              render: (_, row) => `$${row.amount.toLocaleString()}`,
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
```

### 3. **Approval Workflow Engine** 💎

**Description**: Configurable multi-level approval workflows for timesheets and expenses. Features automatic routing based on amount/project, batch approvals, mobile approval capability, and approval analytics.

**Why It's Killer**:

- **Flexible Routing**: Approval rules based on amount, project, department (competitors have rigid workflows)
- **Batch Approvals**: Approve 50 timesheets in one click (vs. one-by-one in Oracle)
- **Mobile Approvals**: Managers approve on the go (SAP mobile approval is clunky)
- **Measurable Impact**: Reduce average approval time from 5 days to 1 day

**Implementation**:

```typescript
import { Card, Badge, DataTable, Button, Tabs } from "aibos-ui";
import { useApprovals, useApproveItems } from "@/hooks/useTimeExpenses";

export default function ApprovalWorkflowEngine() {
  const { timesheets, expenses, stats } = useApprovals();
  const { approve, reject, batchApprove } = useApproveItems();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Pending Approvals</h3>
          <div className="text-4xl font-bold text-orange-600">
            {stats.pending}
          </div>
        </Card>
        <Card>
          <h3>Total Amount</h3>
          <div className="text-3xl font-bold">
            ${stats.total_amount.toLocaleString()}
          </div>
        </Card>
        <Card>
          <h3>Avg Approval Time</h3>
          <div className="text-3xl font-bold">{stats.avg_approval_time}</div>
          <p className="text-sm text-gray-600">hours</p>
        </Card>
      </div>

      <Card>
        <Tabs
          tabs={[
            { id: "timesheets", label: `Timesheets (${timesheets.length})` },
            { id: "expenses", label: `Expenses (${expenses.length})` },
          ]}
        >
          <Tab id="timesheets">
            <div className="flex justify-between mb-4">
              <h3>Timesheet Approvals</h3>
              <Button
                variant="success"
                onClick={() => batchApprove(selectedItems)}
                disabled={selectedItems.length === 0}
              >
                Approve Selected ({selectedItems.length})
              </Button>
            </div>
            <DataTable
              data={timesheets}
              selectable
              onSelectionChange={setSelectedItems}
              columns={[
                { key: "employee_name", label: "Employee" },
                { key: "week_ending", label: "Week Ending" },
                { key: "total_hours", label: "Hours" },
                {
                  key: "billable_pct",
                  label: "Billable %",
                  render: (_, row) => (
                    <Badge
                      variant={
                        row.billable_pct >= 75
                          ? "success"
                          : row.billable_pct >= 60
                          ? "warning"
                          : "error"
                      }
                    >
                      {row.billable_pct}%
                    </Badge>
                  ),
                },
                { key: "submitted_date", label: "Submitted" },
                {
                  key: "actions",
                  label: "Actions",
                  render: (_, row) => (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => approve(row.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="error"
                        onClick={() => reject(row.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </Tab>

          <Tab id="expenses">
            <DataTable
              data={expenses}
              columns={[
                { key: "employee_name", label: "Employee" },
                { key: "date", label: "Date" },
                { key: "vendor", label: "Vendor" },
                { key: "category", label: "Category" },
                {
                  key: "amount",
                  label: "Amount",
                  render: (_, row) => `$${row.amount.toLocaleString()}`,
                },
                {
                  key: "policy_compliant",
                  label: "Policy",
                  render: (_, row) => (
                    <Badge variant={row.policy_compliant ? "success" : "error"}>
                      {row.policy_compliant ? "Compliant" : "Review Required"}
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
                        onClick={() => viewReceipt(row.id)}
                      >
                        Receipt
                      </Button>
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => approve(row.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="error"
                        onClick={() => reject(row.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </Tab>
        </Tabs>
      </Card>
    </div>
  );
}
```

---

## 🏗️ Technical Architecture

### UI Pages Needed

#### 1. Time Entry (`/time-expenses/time`)

**Components**: Card, Form, Input, Select, Timer, Button
**File**: `apps/web/app/(dashboard)/time-expenses/time/page.tsx`

#### 2. Expense Entry (`/time-expenses/expenses`)

**Components**: FileUpload, Form, Card, Alert
**File**: `apps/web/app/(dashboard)/time-expenses/expenses/page.tsx`

#### 3. Approvals (`/time-expenses/approvals`)

**Components**: DataTable, Button, Badge, Tabs
**File**: `apps/web/app/(dashboard)/time-expenses/approvals/page.tsx`

---

## 🔌 API Integration

```typescript
// apps/web/hooks/useTimeExpenses.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@aibos/api-client';

export function useTimeEntry() {
  return useMutation({
    mutationFn: timeData =>
      apiClient.POST('/api/time-expenses/timesheets', { body: timeData }),
    onSuccess: () => queryClient.invalidateQueries(['timesheets']),
  });
}

export function useOCR() {
  return useMutation({
    mutationFn: file =>
      apiClient.POST('/api/time-expenses/ocr', { body: { file } }),
  });
}

export function useApprovals() {
  return useQuery({
    queryKey: ['approvals'],
    queryFn: () => apiClient.GET('/api/time-expenses/approvals'),
  });
}
```

---

## 📝 Implementation Guide

### Day 1: Time & Expense Entry (8 hours)

1. Build mobile time entry interface (3 hours)
2. Implement OCR expense capture (3 hours)
3. Create timer functionality (2 hours)

### Day 2: Approval Workflow (8 hours)

1. Build approval dashboard (3 hours)
2. Implement batch approval functionality (2 hours)
3. Create approval analytics (3 hours)

**Total**: 2 days (16 hours)

---

## ✅ Testing Checklist

### Unit Tests

- [ ] Time calculation accuracy
- [ ] OCR data extraction
- [ ] Approval routing logic

### Integration Tests

- [ ] Time entry to project costing
- [ ] Expense submission to AP
- [ ] Approval workflow completion

### E2E Tests

- [ ] User can enter time via mobile
- [ ] User can scan and submit expense
- [ ] Manager can approve time/expenses

---

## 📅 Timeline

| Day | Deliverable                |
| --- | -------------------------- |
| 1   | Time entry and expense OCR |
| 2   | Approval workflows         |

**Total**: 2 days (16 hours)

---

## 🔗 Dependencies

### Must Complete First

- ✅ M1: Core Ledger
- ✅ M34: Projects & Jobs (for project time tracking)

### Enables These Modules

- Enhanced M34: Projects & Jobs (labor costing)
- Enhanced M5: Accounts Payable (expense reimbursement)

---

## 🎯 Success Criteria

### Must Have

- [ ] Mobile-first time entry interface
- [ ] OCR receipt scanning
- [ ] Multi-level approval workflows

### Should Have

- [ ] Timer functionality
- [ ] Batch approvals
- [ ] Policy compliance checking

### Nice to Have

- [ ] AI-powered time suggestions
- [ ] Mileage tracking with GPS
- [ ] Voice-activated time entry

---

**Ready to build? Start with Day 1! 🚀**

**Previous**: M34 - Projects & Jobs  
**Next**: M36 - Purchase Orders
