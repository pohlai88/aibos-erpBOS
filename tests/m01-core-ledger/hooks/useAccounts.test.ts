// M01 Core Ledger Hooks Tests
// Focused tests for React Query hooks

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import {
  useAccounts,
  useAccount,
  useCreateAccount,
  useUpdateAccount,
  useArchiveAccount,
  useAccountHierarchy,
  useReparentAccount,
  useValidateReparent,
} from '@/hooks/useAccounts';

import {
  mockAccounts,
  mockAccountHierarchy,
  mockCreateAccountRequest,
  mockUpdateAccountRequest,
  mockReparentRequest,
} from '../fixtures/accounts';

import { mockApiClient } from '../fixtures/mocks';

// Mock the API client
vi.mock('@/hooks/useAccounts', async () => {
  const actual = await vi.importActual('@/hooks/useAccounts');
  return {
    ...actual,
    apiClient: mockApiClient,
  };
});

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('M01 Core Ledger Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useAccounts', () => {
    it('should fetch accounts successfully', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { accounts: mockAccounts, total: mockAccounts.length },
      });

      const { result } = renderHook(() => useAccounts(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        accounts: mockAccounts,
        total: mockAccounts.length,
      });
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/accounts');
    });

    it('should handle error state', async () => {
      mockApiClient.get.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useAccounts(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error('API Error'));
    });

    it('should support pagination', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { accounts: mockAccounts.slice(0, 1), total: 1 },
      });

      const { result } = renderHook(() => useAccounts({ page: 1, limit: 1 }), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/accounts?page=1&limit=1');
    });

    it('should support search', async () => {
      mockApiClient.get.mockResolvedValue({
        data: { accounts: [mockAccounts[0]], total: 1 },
      });

      const { result } = renderHook(() => useAccounts({ search: 'cash' }), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/accounts?search=cash');
    });
  });

  describe('useAccount', () => {
    it('should fetch single account', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockAccounts[0] });

      const { result } = renderHook(() => useAccount('acc-1'), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAccounts[0]);
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/accounts/acc-1');
    });
  });

  describe('useCreateAccount', () => {
    it('should create account successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockAccounts[0] });

      const { result } = renderHook(() => useCreateAccount(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      const response = await result.current.mutateAsync(mockCreateAccountRequest);

      expect(response).toEqual(mockAccounts[0]);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/accounts', mockCreateAccountRequest);
    });

    it('should handle creation error', async () => {
      mockApiClient.post.mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() => useCreateAccount(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      await expect(result.current.mutateAsync(mockCreateAccountRequest)).rejects.toThrow('Creation failed');
    });
  });

  describe('useUpdateAccount', () => {
    it('should update account successfully', async () => {
      mockApiClient.put.mockResolvedValue({ data: mockAccounts[0] });

      const { result } = renderHook(() => useUpdateAccount(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      const response = await result.current.mutateAsync({
        id: 'acc-1',
        ...mockUpdateAccountRequest,
      });

      expect(response).toEqual(mockAccounts[0]);
      expect(mockApiClient.put).toHaveBeenCalledWith('/api/accounts/acc-1', mockUpdateAccountRequest);
    });
  });

  describe('useArchiveAccount', () => {
    it('should archive account successfully', async () => {
      mockApiClient.delete.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useArchiveAccount(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      const response = await result.current.mutateAsync({
        id: 'acc-1',
        reason: 'Test archive',
      });

      expect(response).toEqual({ success: true });
      expect(mockApiClient.delete).toHaveBeenCalledWith('/api/accounts/acc-1', {
        reason: 'Test archive',
      });
    });
  });

  describe('useAccountHierarchy', () => {
    it('should fetch account hierarchy', async () => {
      mockApiClient.get.mockResolvedValue({ data: mockAccountHierarchy });

      const { result } = renderHook(() => useAccountHierarchy(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAccountHierarchy);
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/accounts/hierarchy');
    });
  });

  describe('useReparentAccount', () => {
    it('should reparent account successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: mockAccounts[2] });

      const { result } = renderHook(() => useReparentAccount(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      const response = await result.current.mutateAsync(mockReparentRequest);

      expect(response).toEqual(mockAccounts[2]);
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/accounts/reparent', mockReparentRequest);
    });
  });

  describe('useValidateReparent', () => {
    it('should validate reparent operation', async () => {
      mockApiClient.post.mockResolvedValue({ valid: true });

      const { result } = renderHook(() => useValidateReparent(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      const response = await result.current.mutateAsync(mockReparentRequest);

      expect(response).toEqual({ valid: true });
      expect(mockApiClient.post).toHaveBeenCalledWith('/api/accounts/reparent/validate', mockReparentRequest);
    });

    it('should detect invalid reparent operations', async () => {
      mockApiClient.post.mockResolvedValue({ 
        valid: false, 
        error: 'Circular reference detected' 
      });

      const { result } = renderHook(() => useValidateReparent(), {
        wrapper: TestWrapper,
      });

      await waitFor(() => {
        expect(result.current.mutateAsync).toBeDefined();
      });

      const response = await result.current.mutateAsync(mockReparentRequest);

      expect(response).toEqual({ 
        valid: false, 
        error: 'Circular reference detected' 
      });
    });
  });
});
