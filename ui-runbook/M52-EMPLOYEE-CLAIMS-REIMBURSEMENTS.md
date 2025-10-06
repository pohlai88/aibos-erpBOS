# 🎯 M52: Employee Claims & Reimbursements - UI Implementation Runbook

**Module ID**: M52  
**Module Name**: Employee Claims & Reimbursements  
**Priority**: 🔥 HIGH  
**Phase**: Phase 12 - Operational Modules  
**Estimated Effort**: 2.5 days  
**Last Updated**: 2025-10-06

**Status**: 🔄 HYBRID - Enhance M35-TIME-EXPENSES

---

## 📋 Module Overview

Employee Claims & Reimbursements provides **expense claim management** and **reimbursement processing** for businesses requiring **employee expense tracking**, **approval workflows**, and **reimbursement automation**.

### Business Value

**Key Benefits**:

- **Expense Claims**: Complete employee expense claim management
- **Approval Workflows**: Multi-level approval processes
- **Reimbursement Processing**: Automated reimbursement calculations
- **Policy Compliance**: Enforce expense policies and limits

---

## 👥 Ownership

- **Module Owner**: TBD (@handle)
- **UI Reviewer**: TBD (@handle)
- **QA Lead**: TBD (@handle)
- **Design Lead**: TBD (@handle)

---

## 📊 Current Status

### Backend Readiness

| Component     | Status     | Details                              |
| ------------- | ---------- | ------------------------------------ |
| **Database**  | 🔄 PARTIAL | Project expenses exist, needs claims |
| **Services**  | 🔄 PARTIAL | Expense services exist, needs claims |
| **API**       | 🔄 PARTIAL | Expense APIs exist, needs claims     |
| **Contracts** | 🔄 PARTIAL | Expense types exist, needs claims    |

### API Endpoints

**Employee Claims** (Enhancement needed):

- 🔄 `/api/expenses` - Enhance with claims fields
- ❌ `/api/claims` - Manage employee claims
- ❌ `/api/claims/[id]/submit` - Submit claim
- ❌ `/api/claims/[id]/approve` - Approve claim
- ❌ `/api/claims/[id]/reimburse` - Process reimbursement
- ❌ `/api/claims/policies` - Expense policies

---

## 🏗️ UI Architecture

### Pages & Routes

| Route                    | Page Component       | Purpose                |
| ------------------------ | -------------------- | ---------------------- |
| `/claims`                | `ClaimsListPage`     | List claims            |
| `/claims/[id]`           | `ClaimDetailPage`    | View claim details     |
| `/claims/create`         | `ClaimCreatePage`    | Create new claim       |
| `/claims/approvals`      | `ApprovalsPage`      | Pending approvals      |
| `/claims/reimbursements` | `ReimbursementsPage` | Reimbursement tracking |

### Component Structure

```
apps/web/app/(dashboard)/claims/
├── page.tsx                    # Claims list page
├── [id]/
│   └── page.tsx                # Claim detail page
├── create/
│   └── page.tsx                # Create claim page
├── approvals/
│   └── page.tsx                # Approvals page
└── reimbursements/
    └── page.tsx                # Reimbursements page

apps/web/components/claims/
├── ClaimsList.tsx              # Claims list
├── ClaimForm.tsx               # Claim form
├── ClaimApproval.tsx           # Approval component
├── ReimbursementTracker.tsx    # Reimbursement tracker
└── ExpensePolicyChecker.tsx    # Policy checker

apps/web/hooks/claims/
├── useClaims.ts                # Claims hook
├── useClaimDetail.ts           # Claim detail hook
├── useClaimApproval.ts         # Approval hook
└── useReimbursements.ts        # Reimbursements hook
```

### Server/Client Boundaries

- **Server Components**: List pages, detail pages
- **Client Components**: Forms, approval actions, file uploads
- **Feature Flag**: `flags.m52_employee_claims = false`

---

## 🎨 Design System

### Components Used

| Component    | Purpose        | Variant                    |
| ------------ | -------------- | -------------------------- |
| `DataTable`  | List claims    | With filters, pagination   |
| `Card`       | Claim details  | With actions               |
| `Form`       | Claim forms    | With validation            |
| `Button`     | Actions        | Primary, secondary, danger |
| `Badge`      | Status tags    | With colors                |
| `FileUpload` | Receipt upload | With preview               |
| `Currency`   | Amount input   | With formatting            |

### Design Tokens

```typescript
// Claims specific colors
const claimColors = {
  draft: "hsl(var(--claim-draft))",
  submitted: "hsl(var(--claim-submitted))",
  approved: "hsl(var(--claim-approved))",
  reimbursed: "hsl(var(--claim-reimbursed))",
};

// Claim status colors
const claimStatusColors = {
  draft: "bg-gray-100 text-gray-800",
  submitted: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  reimbursed: "bg-purple-100 text-purple-800",
};
```

---

## 🔄 State Management

### React Query Keys

```typescript
const queryKeys = {
  claims: ["claims", "list"] as const,
  claimDetail: (id: string) => ["claims", "detail", id] as const,
  approvals: ["claims", "approvals"] as const,
  reimbursements: ["claims", "reimbursements"] as const,
};
```

### Cache Configuration

| Query Type     | Stale Time | Cache Time | Invalidation            |
| -------------- | ---------- | ---------- | ----------------------- |
| Claims List    | 5 minutes  | 15 minutes | On create/update/delete |
| Claim Detail   | 10 minutes | 30 minutes | On update               |
| Approvals      | 2 minutes  | 10 minutes | On approval action      |
| Reimbursements | 5 minutes  | 15 minutes | On reimbursement        |

---

## 🚀 Implementation Guide

### Step 1: Enhance M35-TIME-EXPENSES

```bash
# Enhance existing time & expenses module
# Add claims fields to expense schema
# Add approval workflow
# Add reimbursement processing
```

### Step 2: Create Components

```typescript
// apps/web/components/claims/ClaimsList.tsx
"use client";

import { DataTable } from "@/components/ui/data-table";
import { useClaims } from "@/hooks/claims/useClaims";

export function ClaimsList() {
  const { data, isLoading, error } = useClaims();

  if (isLoading) return <ClaimsSkeleton />;
  if (error) return <ClaimsErrorState />;
  if (!data?.length) return <ClaimsEmptyState />;

  return (
    <DataTable
      data={data}
      columns={columns}
      searchKey="description"
      filters={filters}
    />
  );
}
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

---

## 🚀 Deployment

### Feature Flag

```typescript
const flags = {
  m52_employee_claims: false, // Default: disabled
};
```

---

## 📝 Definition of Done

### Functional Requirements

- [ ] Claim creation working
- [ ] Approval workflow functional
- [ ] Reimbursement processing working
- [ ] Policy compliance checking working
- [ ] Receipt upload working
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

**Ready to enhance M35-TIME-EXPENSES with Employee Claims! 🚀**
