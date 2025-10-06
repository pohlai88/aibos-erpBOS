# 🚀 M20: Close Management - UI Implementation Runbook

**Module ID**: M20  
**Module Name**: Close Management  
**Priority**: HIGH  
**Phase**: 6 - Compliance & Controls  
**Estimated Effort**: 2.5 days  
**Last Updated**: 2025-10-06

---

## 📋 Executive Summary

Close Management provides **financial close process management** with task tracking, approvals, and close calendar automation for faster month-end closes.

### Business Value

- Structured financial close process
- Task assignment and tracking
- Approval workflows and sign-offs
- Close metrics and analytics
- Integration with all GL modules

---

## 📊 Current Status

| Layer         | Status  | Details                       |
| ------------- | ------- | ----------------------------- |
| **Database**  | ✅ 100% | Complete schema implemented   |
| **Services**  | ✅ 100% | Business logic services ready |
| **API**       | ✅ 100% | 24 endpoints implemented      |
| **Contracts** | ✅ 100% | Type-safe schemas defined     |
| **UI**        | ❌ 0%   | **NEEDS IMPLEMENTATION**      |

### API Coverage

- ✅ `/api/[path]` - [Endpoint description]
- ✅ `/api/[path]` - [Endpoint description]

**Total Endpoints**: 24

---

## 🎯 3 Killer Features

### 1. **Interactive Close Checklist** ✅

**Description**: Dynamic close checklist with task dependencies, assignments, and real-time status tracking in Kanban-style board.

**Why It's Killer**:

- Visual task board (Kanban-style)
- Automated task dependencies
- Real-time completion tracking
- Mobile task updates
- Better than Trintech's static checklists

**Implementation**:

```typescript
import { Kanban, Card, Badge, Button } from "aibos-ui";

export default function CloseChecklist() {
  const { tasks, updateTask } = useCloseTasks();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2>Month-End Close - October 2025</h2>
        <div className="flex gap-4">
          <Badge variant="info">
            {tasks.completed}/{tasks.total} Complete
          </Badge>
          <Badge variant="warning">
            Day {tasks.days_elapsed} of {tasks.target_days}
          </Badge>
        </div>
      </div>

      <Kanban
        columns={[
          { id: "not_started", title: "Not Started", color: "gray" },
          { id: "in_progress", title: "In Progress", color: "blue" },
          { id: "review", title: "Under Review", color: "orange" },
          { id: "completed", title: "Completed", color: "green" },
        ]}
        tasks={tasks.list.map((task) => ({
          id: task.id,
          title: task.name,
          column: task.status,
          assignee: task.owner,
          dueDate: task.due_date,
          dependencies: task.dependencies,
          priority: task.priority,
          renderCard: (task) => (
            <Card className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4>{task.title}</h4>
                  <p className="text-sm text-muted">{task.assignee}</p>
                </div>
                <Badge
                  variant={task.priority === "High" ? "destructive" : "default"}
                >
                  {task.priority}
                </Badge>
              </div>
              <div className="mt-2">
                <Badge variant="outline">{task.dueDate}</Badge>
                {task.dependencies.length > 0 && (
                  <span className="text-sm text-muted ml-2">
                    ⏳ {task.dependencies.length} blockers
                  </span>
                )}
              </div>
            </Card>
          ),
        }))}
        onTaskMove={updateTask}
      />
    </div>
  );
}
```

### 2. **Close Calendar with Gantt View** 📅

**Description**: Visual close calendar showing all tasks across timeline with critical path analysis and drag-to-reschedule.

**Why It's Killer**:

- Gantt chart visualization
- Critical path identification
- Drag-to-reschedule tasks
- Historical close time tracking
- Industry-first visual close calendar

**Implementation**:

```typescript
import { Gantt, Card, Chart } from "aibos-ui";

export default function CloseCalendar() {
  const { schedule } = useCloseSchedule();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <h3>Target Close Date</h3>
          <div className="text-2xl">{schedule.target_date}</div>
        </Card>
        <Card>
          <h3>Projected Close</h3>
          <div className="text-2xl">{schedule.projected_date}</div>
        </Card>
        <Card>
          <h3>Days Remaining</h3>
          <div className="text-3xl">{schedule.days_remaining}</div>
        </Card>
        <Card>
          <h3>On-Time Probability</h3>
          <div className="text-3xl text-green-600">
            {schedule.on_time_probability}%
          </div>
        </Card>
      </div>

      <Gantt
        tasks={schedule.tasks.map((task) => ({
          id: task.id,
          name: task.name,
          start: task.start_date,
          end: task.due_date,
          progress: task.completion_pct,
          dependencies: task.dependencies,
          critical: task.is_critical_path,
          owner: task.owner,
        }))}
        onTaskUpdate={(taskId, updates) => rescheduleTask(taskId, updates)}
        highlightCriticalPath
      />

      <Card>
        <h3>Critical Path Tasks</h3>
        <div className="space-y-2">
          {schedule.critical_path.map((task) => (
            <div
              key={task.id}
              className="flex justify-between items-center p-2 bg-red-50 rounded"
            >
              <span>{task.name}</span>
              <Badge variant="destructive">Critical</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

### 3. **Close Metrics Dashboard** 📊

**Description**: Real-time close performance metrics with trend analysis, bottleneck identification, and benchmarking.

**Why It's Killer**:

- Days-to-close tracking
- Task completion velocity
- Bottleneck identification
- Period-over-period comparison
- Better than manual close tracking

**Implementation**:

```typescript
import { Chart, Card, DataTable, Badge } from "aibos-ui";

export default function CloseMetrics() {
  const { metrics } = useCloseMetrics();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <h3>Avg Days to Close</h3>
          <div className="text-4xl">{metrics.avg_days}</div>
          <Badge
            variant={metrics.trend === "improving" ? "success" : "warning"}
          >
            {metrics.trend === "improving" ? "↓" : "↑"} {metrics.trend_pct}% vs
            last quarter
          </Badge>
        </Card>
        <Card>
          <h3>This Month Progress</h3>
          <div className="text-4xl">{metrics.current_progress}%</div>
          <div className="text-sm text-muted">
            Day {metrics.day} of {metrics.target_days}
          </div>
        </Card>
        <Card>
          <h3>On-Time Close Rate</h3>
          <div className="text-4xl">{metrics.on_time_rate}%</div>
          <div className="text-sm text-muted">Last 12 months</div>
        </Card>
      </div>

      <Chart
        type="line"
        data={metrics.historical}
        series={[
          { key: "days_to_close", label: "Days to Close", color: "blue" },
          { key: "target", label: "Target", color: "green", style: "dashed" },
        ]}
        title="Close Performance Trend (12 Months)"
      />

      <Card>
        <h3>Bottleneck Analysis</h3>
        <DataTable
          data={metrics.bottlenecks}
          columns={[
            { key: "task_category", label: "Category" },
            { key: "avg_hours", label: "Avg Hours" },
            { key: "variance", label: "Variance" },
            { key: "owner", label: "Owner" },
            {
              key: "impact",
              label: "Impact",
              render: (val) => (
                <Badge variant={val === "High" ? "destructive" : "warning"}>
                  {val}
                </Badge>
              ),
            },
          ]}
        />
      </Card>

      <Chart
        type="bar"
        data={metrics.by_department}
        title="Completion Rate by Department"
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
**File**: `apps/web/app/(dashboard)/[module]/[id]/page.tsx`

---

## 🔌 API Integration

```typescript
// apps/web/hooks/useCloseManagement.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@aibos/api-client';

export function useCloseManagement(filters = {}) {
  return useQuery({
    queryKey: ['m20', filters],
    queryFn: () => apiClient.GET('/api/[path]', { query: filters }),
  });
}

export function useCreateCloseManagement() {
  return useMutation({
    mutationFn: data => apiClient.POST('/api/[path]', { body: data }),
    onSuccess: () => queryClient.invalidateQueries(['m20']),
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

### Day 3: [Tasks] (8 hours)

1. [Task 1] (X hours)
2. [Task 2] (X hours)
3. [Task 3] (X hours)

**Total**: 2.5 days (20 hours)

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
| 3   | [Deliverable description] |

**Total**: 2.5 days (20 hours)

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

**Previous**: M19 - [Previous Module]  
**Next**: M21 - [Next Module]
