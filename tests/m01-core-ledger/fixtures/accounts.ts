// M01 Core Ledger Test Fixtures
// Centralized test data for consistent testing

export const mockAccounts = [
  {
    id: 'acc-1',
    company_id: 'test-company',
    code: '1000',
    name: 'Cash',
    type: 'Asset',
    normal_balance: 'Debit',
    parent_code: null,
    require_cost_center: false,
    require_project: false,
    class: 'Current Assets',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'acc-2',
    company_id: 'test-company',
    code: '2000',
    name: 'Accounts Payable',
    type: 'Liability',
    normal_balance: 'Credit',
    parent_code: null,
    require_cost_center: false,
    require_project: false,
    class: 'Current Liabilities',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'acc-3',
    company_id: 'test-company',
    code: '1100',
    name: 'Petty Cash',
    type: 'Asset',
    normal_balance: 'Debit',
    parent_code: '1000',
    require_cost_center: false,
    require_project: false,
    class: 'Current Assets',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

export const mockAccountHierarchy = [
  {
    id: 'acc-1',
    code: '1000',
    name: 'Cash',
    type: 'Asset',
    normal_balance: 'Debit',
    parent_code: null,
    children: [
      {
        id: 'acc-3',
        code: '1100',
        name: 'Petty Cash',
        type: 'Asset',
        normal_balance: 'Debit',
        parent_code: '1000',
        children: [],
      },
    ],
  },
  {
    id: 'acc-2',
    code: '2000',
    name: 'Accounts Payable',
    type: 'Liability',
    normal_balance: 'Credit',
    parent_code: null,
    children: [],
  },
];

export const mockCreateAccountRequest = {
  code: '1200',
  name: 'Accounts Receivable',
  type: 'Asset',
  normal_balance: 'Debit',
  parent_code: '1000',
  require_cost_center: false,
  require_project: false,
  class: 'Current Assets',
};

export const mockUpdateAccountRequest = {
  name: 'Updated Cash Account',
  type: 'Asset',
  normal_balance: 'Debit',
  require_cost_center: true,
  require_project: false,
  class: 'Current Assets',
};

export const mockReparentRequest = {
  account_id: 'acc-3',
  new_parent_code: '2000',
};

export const mockAuthContext = {
  user_id: 'test-user',
  company_id: 'test-company',
  role: 'admin',
  scopes: ['gl:read', 'gl:write'],
};

export const mockApiResponse = {
  success: true,
  data: mockAccounts,
  total: mockAccounts.length,
};

export const mockErrorResponse = {
  success: false,
  error: 'Test error message',
  details: { field: 'code', message: 'Account code already exists' },
};
