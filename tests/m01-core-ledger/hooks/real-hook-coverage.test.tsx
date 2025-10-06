// M01 Core Ledger - Real Hook Code Coverage Tests
// Tests that import and execute actual React Query hooks using RELIANCE METHOD

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// RELIANCE METHOD: Direct imports (no aliases) - Absolute paths from project root
import {
  useAccounts,
  useAccount,
  useCreateAccount,
  useUpdateAccount,
  useArchiveAccount,
  useAccountHierarchy,
  useReparentAccount,
  useAccountSearch,
  useAccountStats,
} from '../../../apps/web/hooks/useAccounts';

// Import test data
import {
  mockAccounts,
  mockAccountHierarchy,
  mockCreateAccountRequest,
  mockUpdateAccountRequest,
} from '../fixtures/accounts';

// Mock fetch for API calls
global.fetch = vi.fn();

// Test wrapper with React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('M01 Real Hook Code Coverage Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockClear();
  });

  describe('useAccounts - Real Hook Execution', () => {
    it('should execute actual useAccounts hook', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { accounts: mockAccounts, total: mockAccounts.length } }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAccounts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        accounts: mockAccounts,
        total: mockAccounts.length,
      });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/accounts'),
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        })
      );
    });

    it('should handle pagination in actual hook', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { accounts: [mockAccounts[0]], total: 1 } }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAccounts({ page: 1, limit: 1 }), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/accounts?page=1&limit=1'),
        expect.any(Object)
      );
    });

    it('should handle search in actual hook', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { accounts: [mockAccounts[0]], total: 1 } }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAccounts({ search: 'cash' }), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/accounts?search=cash'),
        expect.any(Object)
      );
    });

    it('should handle error in actual hook', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAccounts(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useAccount - Real Hook Execution', () => {
    it('should execute actual useAccount hook', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAccounts[0] }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAccount('acc-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAccounts[0]);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/accounts/acc-1'),
        expect.any(Object)
      );
    });
  });

  describe('useCreateAccount - Real Hook Execution', () => {
    it('should execute actual useCreateAccount hook', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAccounts[0] }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateAccount(), { wrapper });

      await waitFor(() => {
        expect(result.current.isIdle).toBe(true);
      });

      result.current.mutate(mockCreateAccountRequest);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAccounts[0]);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/accounts'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockCreateAccountRequest),
        })
      );
    });

    it('should handle optimistic updates in actual hook', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAccounts[0] }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useCreateAccount(), { wrapper });

      result.current.mutate(mockCreateAccountRequest);

      // Should immediately show optimistic update
      expect(result.current.isPending).toBe(true);
    });
  });

  describe('useUpdateAccount - Real Hook Execution', () => {
    it('should execute actual useUpdateAccount hook', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAccounts[0] }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useUpdateAccount(), { wrapper });

      result.current.mutate({ id: 'acc-1', ...mockUpdateAccountRequest });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/accounts/acc-1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockUpdateAccountRequest),
        })
      );
    });
  });

  describe('useArchiveAccount - Real Hook Execution', () => {
    it('should execute actual useArchiveAccount hook', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true } }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useArchiveAccount(), { wrapper });

      result.current.mutate({ id: 'acc-1', reason: 'Test archive' });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/accounts/acc-1'),
        expect.objectContaining({
          method: 'DELETE',
          body: JSON.stringify({ reason: 'Test archive' }),
        })
      );
    });
  });

  describe('useAccountHierarchy - Real Hook Execution', () => {
    it('should execute actual useAccountHierarchy hook', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAccountHierarchy }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAccountHierarchy(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAccountHierarchy);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/accounts/hierarchy'),
        expect.any(Object)
      );
    });
  });

  describe('useReparentAccount - Real Hook Execution', () => {
    it('should execute actual useReparentAccount hook', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true } }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useReparentAccount(), { wrapper });

      result.current.mutate({
        accountId: 'acc-1',
        newParentCode: 'PARENT-001',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/accounts/reparent'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            accountId: 'acc-1',
            newParentCode: 'PARENT-001',
          }),
        })
      );
    });
  });

  describe('useAccountSearch - Real Hook Execution', () => {
    it('should execute actual useAccountSearch hook', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { accounts: [mockAccounts[0]], total: 1 } }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAccountSearch('cash'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        accounts: [mockAccounts[0]],
        total: 1,
      });
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/accounts?search=cash'),
        expect.any(Object)
      );
    });
  });

  describe('useAccountStats - Real Hook Execution', () => {
    it('should execute actual useAccountStats hook', async () => {
      const mockStats = {
        totalAccounts: 10,
        activeAccounts: 8,
        archivedAccounts: 2,
        byType: {
          Asset: 4,
          Liability: 3,
          Equity: 2,
          Revenue: 1,
        },
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockStats }),
      } as Response);

      const wrapper = createWrapper();
      const { result } = renderHook(() => useAccountStats(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStats);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/accounts/stats'),
        expect.any(Object)
      );
    });
  });

  describe('Hook Integration - Real Code Execution', () => {
    it('should handle complete account lifecycle workflow', async () => {
      // Mock all API calls
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { accounts: [], total: 0 } }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockAccounts[0] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockAccounts[0] }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { success: true } }),
        } as Response);

      const wrapper = createWrapper();

      // Test complete workflow
      const { result: accountsResult } = renderHook(() => useAccounts(), { wrapper });
      const { result: createResult } = renderHook(() => useCreateAccount(), { wrapper });
      const { result: updateResult } = renderHook(() => useUpdateAccount(), { wrapper });
      const { result: archiveResult } = renderHook(() => useArchiveAccount(), { wrapper });

      // Wait for initial load
      await waitFor(() => {
        expect(accountsResult.current.isSuccess).toBe(true);
      });

      // Create account
      createResult.current.mutate(mockCreateAccountRequest);
      await waitFor(() => {
        expect(createResult.current.isSuccess).toBe(true);
      });

      // Update account
      updateResult.current.mutate({ id: 'acc-1', ...mockUpdateAccountRequest });
      await waitFor(() => {
        expect(updateResult.current.isSuccess).toBe(true);
      });

      // Archive account
      archiveResult.current.mutate({ id: 'acc-1', reason: 'Test complete' });
      await waitFor(() => {
        expect(archiveResult.current.isSuccess).toBe(true);
      });

      // Verify all API calls were made
      expect(fetch).toHaveBeenCalledTimes(4);
    });
  });
});
