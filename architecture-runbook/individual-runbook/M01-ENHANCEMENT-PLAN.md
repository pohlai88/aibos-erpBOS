# 🚀 M01 Core Ledger - Enhancement Plan

## 📋 **Analysis Summary**

**Status**: ✅ **Backend Complete** | ❌ **UI Missing**  
**Approach**: **Enhance Existing** (Not Create New)  
**Last Updated**: 2025-01-06  
**Owner**: Architecture Team  

---

## 🎯 **Current State Analysis**

### **✅ EXISTING IMPLEMENTATION (100% Complete)**

#### **1. Database Layer** 
**Location**: `packages/adapters/db/src/schema.ts`

```typescript
// EXISTING: Complete account schema
export const account = pgTable('account', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => company.id).notNull(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  type: text('type').notNull(), // Asset/Liability/Equity/Income/Expense
  normalBalance: char('normal_balance', { length: 1 }).notNull(), // D/C
  parentCode: text('parent_code'), // ✅ Hierarchy support
  requireCostCenter: text('require_cost_center').notNull().default('false'),
  requireProject: text('require_project').notNull().default('false'),
  class: text('class'), // ASSET/LIAB/EQUITY/REVENUE/EXPENSE
});
```

**✅ Features Already Available:**
- Multi-tenant support (`companyId`)
- Account hierarchy (`parentCode`)
- Dimension policies (cost center, project)
- Account classification
- Normal balance enforcement

#### **2. Services Layer**
**Location**: `packages/services/src/ledger.ts` + `apps/bff/app/services/gl/`

```typescript
// EXISTING: LedgerService with journal posting
export class LedgerService {
  async insertJournal(journal: Omit<RepoJournal, 'id'>): Promise<{id: string; lines: RepoJournalLine[]}>
  async getJournal(journalId: string): Promise<Journal | null>
  async trialBalance(companyId: string, currency: string): Promise<TrialBalanceRow[]>
}

// EXISTING: Journal posting with period enforcement
export async function postJournal(companyId: string, je: JournalEntry): Promise<{journalId: string; linesPosted: number}>

// EXISTING: Trial balance calculation
export async function getTrialBalances(companyId: string, options: {...}): Promise<TrialBalanceRow[]>
```

**✅ Features Already Available:**
- Journal entry posting
- Trial balance calculation
- Period enforcement
- Multi-currency support
- Idempotency handling

#### **3. API Layer**
**Location**: `apps/bff/app/api/`

**✅ Existing Endpoints:**
- `/api/accounts/[code]/dimension-policy` - Account management
- `/api/portal/ledger` - Customer ledger
- `/api/reports/trial-balance` - Financial reporting
- `/api/journals/[id]` - Journal management

---

## 🎯 **UI Runbook Requirements Mapping**

### **✅ REQUIREMENTS ALREADY MET**

| UI Requirement | Current Implementation | Status |
|---|---|---|
| **Account Schema** | `account` table with hierarchy | ✅ Complete |
| **Multi-tenant** | `companyId` foreign key | ✅ Complete |
| **Journal Posting** | `LedgerService.insertJournal()` | ✅ Complete |
| **Trial Balance** | `getTrialBalances()` function | ✅ Complete |
| **Period Enforcement** | `assertOpenPeriod()` | ✅ Complete |
| **Multi-currency** | FX rate tables + conversion | ✅ Complete |

### **❌ MISSING REQUIREMENTS**

| UI Requirement | Current Gap | Priority |
|---|---|---|
| **Account CRUD API** | No `/api/accounts` endpoints | 🚨 CRITICAL |
| **Account Hierarchy API** | No `/api/accounts/hierarchy` | 🚨 CRITICAL |
| **Account Search API** | No search functionality | 🚨 CRITICAL |
| **Drag-and-Drop Validation** | No reparent validation | 🔥 HIGH |
| **Archive Guard Rails** | No archive validation | 🔥 HIGH |
| **UI Components** | No React components | 🚨 CRITICAL |
| **React Query Hooks** | No data fetching hooks | 🚨 CRITICAL |

---

## 🚀 **Enhancement Strategy**

### **Phase 1: Missing API Endpoints** (Day 1)

#### **1.1 Account CRUD API**
**Location**: `apps/bff/app/api/accounts/`

```typescript
// NEW: Create missing endpoints
GET    /api/accounts              // List accounts with filters
POST   /api/accounts              // Create account
GET    /api/accounts/[id]         // Get account details
PUT    /api/accounts/[id]         // Update account
DELETE /api/accounts/[id]         // Archive account (soft delete)
```

#### **1.2 Account Hierarchy API**
**Location**: `apps/bff/app/api/accounts/hierarchy/`

```typescript
// NEW: Hierarchy management
GET    /api/accounts/hierarchy           // Get account tree
POST   /api/accounts/reparent            // Move account (DnD)
POST   /api/accounts/reparent/validate   // Validate move (dry-run)
```

#### **1.3 Account Search API**
**Location**: `apps/bff/app/api/accounts/search/`

```typescript
// NEW: Search functionality
GET    /api/accounts/search?q=office&type=expense  // Search accounts
```

### **Phase 2: Business Logic Enhancement** (Day 2)

#### **2.1 Account Service Enhancement**
**Location**: `packages/services/src/accounts-service.ts` (NEW)

```typescript
// NEW: Dedicated account service
export class AccountsService {
  async createAccount(data: CreateAccountRequest): Promise<AccountResponse>
  async getAccount(id: string): Promise<AccountResponse>
  async getAccountHierarchy(): Promise<AccountHierarchyResponse>
  async searchAccounts(query: string, filters?: SearchFilters): Promise<AccountResponse[]>
  async updateAccount(id: string, data: UpdateAccountRequest): Promise<AccountResponse>
  async archiveAccount(id: string, reason?: string): Promise<void>
  async reparentAccount(accountId: string, newParentId: string | null): Promise<AccountResponse>
  async validateReparent(accountId: string, newParentId: string | null): Promise<ReparentValidationResponse>
}
```

#### **2.2 Account Policies**
**Location**: `packages/policies/src/accounts-policies.ts` (NEW)

```typescript
// NEW: Business rules validation
export class AccountsPolicies {
  static async validateCreate(data: CreateAccountRequest): Promise<void>
  static async validateUpdate(data: UpdateAccountRequest): Promise<void>
  static async validateParentChild(parent: Account, child: CreateAccountRequest): Promise<void>
  static async validateArchive(account: Account): Promise<void>
  static async validateReparent(accountId: string, newParentId: string | null): Promise<void>
}
```

### **Phase 3: UI Implementation** (Day 3)

#### **3.1 React Query Hooks**
**Location**: `apps/web/hooks/useAccounts.ts` (NEW)

```typescript
// NEW: Data fetching hooks
export function useAccounts(filters?: AccountFilters)
export function useAccount(id: string)
export function useAccountHierarchy()
export function useCreateAccount()
export function useUpdateAccount()
export function useArchiveAccount()
export function useReparentAccount()
```

#### **3.2 UI Components**
**Location**: `apps/web/app/(dashboard)/accounts/` (NEW)

```typescript
// NEW: UI pages and components
/accounts/page.tsx                    // Account list page
/accounts/[id]/page.tsx              // Account detail page
/accounts/hierarchy/page.tsx          // Hierarchy view with DnD
/components/AccountList.tsx          // Data table component
/components/AccountForm.tsx          // Create/edit form
/components/AccountTree.tsx          // Drag-and-drop tree
/components/AccountNode.tsx          // Tree node component
```

---

## 📊 **Implementation Plan**

### **Day 1: API Enhancement** (8 hours)

**Morning (4 hours):**
- [ ] Create `/api/accounts` CRUD endpoints
- [ ] Implement account creation with validation
- [ ] Add account update and archive functionality
- [ ] Test API endpoints with Postman

**Afternoon (4 hours):**
- [ ] Create `/api/accounts/hierarchy` endpoints
- [ ] Implement reparent validation logic
- [ ] Add search functionality
- [ ] Test hierarchy operations

### **Day 2: Business Logic** (8 hours)

**Morning (4 hours):**
- [ ] Create `AccountsService` class
- [ ] Implement business rules validation
- [ ] Add archive guard rails
- [ ] Test service layer

**Afternoon (4 hours):**
- [ ] Create `AccountsPolicies` class
- [ ] Implement drag-and-drop validation
- [ ] Add circular reference prevention
- [ ] Test policy enforcement

### **Day 3: UI Implementation** (8 hours)

**Morning (4 hours):**
- [ ] Create React Query hooks
- [ ] Implement account list page
- [ ] Add search and filtering
- [ ] Test data fetching

**Afternoon (4 hours):**
- [ ] Create hierarchy page with DnD
- [ ] Implement account detail page
- [ ] Add form validation
- [ ] Test UI interactions

---

## 🎯 **Success Criteria**

### **Must Have (Measurable)**
- [ ] All 6 API endpoints working (`/api/accounts/*`)
- [ ] Account hierarchy with drag-and-drop
- [ ] Search returns results < 150ms (P95)
- [ ] Archive guard rails enforced
- [ ] Circular reference prevention
- [ ] Axe: 0 serious/critical violations

### **Should Have**
- [ ] Keyboard DnD alternative (a11y compliant)
- [ ] Balance drill-down to transactions
- [ ] Export to CSV/Excel
- [ ] Bulk operations (archive multiple)

### **Nice to Have**
- [ ] AI-powered account suggestions
- [ ] Account usage analytics
- [ ] Duplicate detection

---

## 🔄 **Architecture Compliance**

### **Current Architecture Issues**
- ❌ **Missing Policies Layer**: Business rules scattered in services
- ❌ **Missing Contracts Layer**: No proper API contracts
- ❌ **Mixed Responsibilities**: Services doing validation + business logic

### **Enhancement Approach**
- ✅ **Add Policies Layer**: `packages/policies/src/accounts-policies.ts`
- ✅ **Add Contracts Layer**: `packages/contracts/src/accounts/`
- ✅ **Refactor Services**: Separate validation from business logic
- ✅ **Maintain Backward Compatibility**: Don't break existing APIs

---

## 🚨 **Risk Mitigation**

### **Risk #1: Breaking Existing Functionality**
**Mitigation**: 
- Add new endpoints alongside existing ones
- Maintain backward compatibility
- Feature flag new functionality

### **Risk #2: Performance Impact**
**Mitigation**:
- Add database indexes for hierarchy queries
- Implement pagination for large datasets
- Cache hierarchy structure

### **Risk #3: Complex Hierarchy Operations**
**Mitigation**:
- Start with simple list view
- Add hierarchy later
- Feature flag drag-and-drop

---

## 📈 **Expected Outcomes**

### **Technical Benefits**
- ✅ **Complete UI Layer**: All 3 killer features implemented
- ✅ **Clean Architecture**: Proper 8-layer separation
- ✅ **Enterprise Quality**: Production-ready implementation
- ✅ **Maintainable Code**: Well-structured and tested

### **Business Benefits**
- ✅ **User Adoption**: Intuitive drag-and-drop interface
- ✅ **Productivity**: Fast search and hierarchy management
- ✅ **Compliance**: Proper audit trails and validation
- ✅ **Scalability**: Handles large account structures

---

## 🎉 **Conclusion**

**The existing backend is 100% complete and production-ready.** We only need to:

1. **Add missing API endpoints** (Day 1)
2. **Enhance business logic** (Day 2)  
3. **Build UI components** (Day 3)

**Total effort: 3 days** (same as "create new" but leveraging existing work)

**This approach is:**
- ✅ **Faster**: Leverage existing implementation
- ✅ **Safer**: No risk of breaking existing functionality
- ✅ **Better**: Build on proven, production-ready foundation
- ✅ **Smarter**: Follow DRY principle and avoid duplication

**Ready to proceed with enhancement plan! 🚀**
