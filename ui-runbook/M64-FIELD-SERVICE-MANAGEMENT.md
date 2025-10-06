# 🎯 M64: Field Service Management - UI Implementation Runbook

**Module ID**: M64  
**Module Name**: Field Service Management  
**Priority**: MEDIUM  
**Phase**: Phase 13 - Extended Modules  
**Estimated Effort**: 4 days  
**Last Updated**: 2025-10-06

**Status**: ❌ NO - CREATE NEW Module

---

## 📋 Module Overview

Field Service Management provides **service scheduling**, **technician dispatch**, **work order management**, and **mobile field service** for businesses requiring **field service operations** and **customer service excellence**.

### Business Value

**Key Benefits**:

- **Service Scheduling**: Optimize technician schedules
- **Technician Dispatch**: Real-time dispatch management
- **Work Order Management**: Complete service tracking
- **Mobile Field Service**: Mobile app for technicians

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status | Details                     |
| ------------- | ------ | --------------------------- |
| **Database**  | ❌ NEW | FSM schema needed           |
| **Services**  | ❌ NEW | FSM services needed         |
| **API**       | ❌ NEW | FSM APIs needed             |
| **Contracts** | ❌ NEW | FSM type definitions needed |

### API Endpoints

**FSM** (New endpoints needed):

- ❌ `/api/fsm/service-orders` - Service orders
- ❌ `/api/fsm/technicians` - Technician management
- ❌ `/api/fsm/schedule` - Service scheduling
- ❌ `/api/fsm/dispatch` - Dispatch management
- ❌ `/api/fsm/mobile` - Mobile app APIs

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                 | Page Component      | Purpose               |
| --------------------- | ------------------- | --------------------- |
| `/fsm/service-orders` | `ServiceOrdersPage` | List service orders   |
| `/fsm/technicians`    | `TechniciansPage`   | Technician management |
| `/fsm/schedule`       | `SchedulePage`      | Service schedule      |
| `/fsm/dispatch`       | `DispatchPage`      | Dispatch dashboard    |
| `/fsm/mobile`         | `MobileAppPage`     | Mobile app interface  |

### Component Structure

```
apps/web/app/(dashboard)/fsm/
├── service-orders/
│   └── page.tsx                # Service orders page
├── technicians/
│   └── page.tsx                # Technicians page
├── schedule/
│   └── page.tsx                # Schedule page
├── dispatch/
│   └── page.tsx                # Dispatch page
└── mobile/
    └── page.tsx                # Mobile app page

apps/web/components/fsm/
├── ServiceOrdersList.tsx       # Service orders list
├── TechniciansList.tsx         # Technicians list
├── ServiceSchedule.tsx         # Schedule calendar
├── DispatchBoard.tsx           # Dispatch dashboard
└── MobileInterface.tsx         # Mobile app UI

apps/web/hooks/fsm/
├── useServiceOrders.ts         # Service orders hook
├── useTechnicians.ts           # Technicians hook
├── useSchedule.ts              # Schedule hook
└── useDispatch.ts              # Dispatch hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages
- **Client Components**: Schedule, dispatch board, mobile interface
- **Feature Flag**: `flags.m64_field_service = false`

---

## 🎨 Design System

### Components Used

| Component   | Purpose              | Variant                  |
| ----------- | -------------------- | ------------------------ |
| `DataTable` | List orders          | With filters, pagination |
| `Calendar`  | Service schedule     | With drag-drop           |
| `Map`       | Technician locations | Real-time updates        |
| `Card`      | Service details      | With actions             |
| `Badge`     | Status indicators    | With colors              |

### Design Tokens

```typescript
// FSM specific colors
const fsmColors = {
  scheduled: "hsl(var(--fsm-scheduled))",
  enRoute: "hsl(var(--fsm-en-route))",
  inProgress: "hsl(var(--fsm-in-progress))",
  completed: "hsl(var(--fsm-completed))",
};

// Service status colors
const serviceStatusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  enRoute: "bg-yellow-100 text-yellow-800",
  inProgress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  serviceOrders: ["fsm", "service-orders"] as const,
  technicians: ["fsm", "technicians"] as const,
  schedule: ["fsm", "schedule"] as const,
  dispatch: ["fsm", "dispatch"] as const,
};
```

---

## 🚀 Implementation Guide

### Step 1: Create Database Schema

```sql
-- FSM tables
CREATE TABLE service_orders (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  order_number VARCHAR(50) NOT NULL,
  customer_id UUID NOT NULL,
  service_type VARCHAR(50) NOT NULL,
  scheduled_date TIMESTAMP NOT NULL,
  technician_id UUID,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE technicians (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  skills TEXT[],
  current_location GEOGRAPHY(POINT),
  status VARCHAR(20) NOT NULL
);
```

---

## ✅ Quality Gates

### Code Quality

| Gate              | Threshold | Enforcement |
| ----------------- | --------- | ----------- |
| TypeScript errors | 0         | CI blocks   |
| ESLint errors     | 0         | CI blocks   |
| Test coverage     | ≥90%      | CI blocks   |
| Bundle size       | ≤400KB    | CI blocks   |

---

## 🚀 Deployment

### Feature Flag

```typescript
const flags = {
  m64_field_service: false, // Default: disabled
};
```

---

## 📝 Definition of Done

### Functional Requirements

- [ ] Service order management working
- [ ] Technician management functional
- [ ] Service scheduling working
- [ ] Dispatch management working
- [ ] Mobile interface working
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

**Ready to implement Field Service Management! 🚀**
