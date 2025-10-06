// M01 Core Ledger Test Mocks
// Centralized mock implementations for consistent testing

import { vi } from 'vitest';
import { mockAccounts, mockAccountHierarchy, mockAuthContext } from './accounts';

// Mock React Query hooks
export const mockUseAccounts = vi.fn(() => ({
  data: { accounts: mockAccounts, total: mockAccounts.length },
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
}));

export const mockUseAccount = vi.fn(() => ({
  data: mockAccounts[0],
  isLoading: false,
  isError: false,
  error: null,
}));

export const mockUseCreateAccount = vi.fn(() => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue(mockAccounts[0]),
  isLoading: false,
  isError: false,
  error: null,
}));

export const mockUseUpdateAccount = vi.fn(() => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue(mockAccounts[0]),
  isLoading: false,
  isError: false,
  error: null,
}));

export const mockUseArchiveAccount = vi.fn(() => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue({ success: true }),
  isLoading: false,
  isError: false,
  error: null,
}));

export const mockUseAccountHierarchy = vi.fn(() => ({
  data: mockAccountHierarchy,
  isLoading: false,
  isError: false,
  error: null,
  refetch: vi.fn(),
}));

export const mockUseReparentAccount = vi.fn(() => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue({ success: true }),
  isLoading: false,
  isError: false,
  error: null,
}));

export const mockUseValidateReparent = vi.fn(() => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue({ valid: true }),
  isLoading: false,
  isError: false,
  error: null,
}));

// Mock API client
export const mockApiClient = {
  get: vi.fn().mockResolvedValue({ data: mockAccounts }),
  post: vi.fn().mockResolvedValue({ data: mockAccounts[0] }),
  put: vi.fn().mockResolvedValue({ data: mockAccounts[0] }),
  delete: vi.fn().mockResolvedValue({ success: true }),
};

// Mock authentication
export const mockRequireAuth = vi.fn().mockResolvedValue(mockAuthContext);
export const mockRequireCapability = vi.fn().mockReturnValue(undefined);

// Mock database
export const mockPool = {
  query: vi.fn().mockResolvedValue({
    rows: mockAccounts,
    rowCount: mockAccounts.length,
  }),
};

// Mock HTTP responses
export const mockHttpResponses = {
  ok: (data: any) => new Response(JSON.stringify({ data }), { status: 200 }),
  created: (data: any) => new Response(JSON.stringify({ data }), { status: 201 }),
  badRequest: (message: string, details?: any) => 
    new Response(JSON.stringify({ error: message, details }), { status: 400 }),
  notFound: (message: string) => 
    new Response(JSON.stringify({ error: message }), { status: 404 }),
  serverError: (message: string) => 
    new Response(JSON.stringify({ error: message }), { status: 500 }),
};

// Mock UI components
export const mockUIComponents = {
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  Input: ({ value, onChange, ...props }: any) => (
    <input value={value} onChange={onChange} {...props} />
  ),
  Select: ({ value, onValueChange, children }: any) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  Label: ({ children, ...props }: any) => (
    <label {...props}>{children}</label>
  ),
  Badge: ({ children, className }: any) => (
    <span className={className}>{children}</span>
  ),
  Toast: ({ children, open, onOpenChange }: any) => 
    open ? <div role="alert">{children}</div> : null,
};

// Mock Next.js
export const mockNextJS = {
  NextRequest: class MockNextRequest {
    constructor(public url: string, public init?: RequestInit) {}
    async json() {
      return JSON.parse(this.init?.body as string || '{}');
    }
  },
  NextResponse: {
    json: (data: any, init?: ResponseInit) => new Response(JSON.stringify(data), init),
  },
};

// Mock withRouteErrors
export const mockWithRouteErrors = (handler: any) => handler;
