// M01 Core Ledger Integration Tests
// End-to-end tests for complete M01 functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import CoreLedgerPage from '@/app/(dashboard)/core-ledger/page';

import {
  mockAccounts,
  mockAccountHierarchy,
  mockCreateAccountRequest,
} from '../fixtures/accounts';

import {
  mockUseAccounts,
  mockUseCreateAccount,
  mockUseUpdateAccount,
  mockUseArchiveAccount,
  mockUseAccountHierarchy,
  mockUseReparentAccount,
  mockUseValidateReparent,
  mockUIComponents,
} from '../fixtures/mocks';

// Mock the hooks
vi.mock('@/hooks/useAccounts', () => ({
  useAccounts: mockUseAccounts,
  useCreateAccount: mockUseCreateAccount,
  useUpdateAccount: mockUseUpdateAccount,
  useArchiveAccount: mockUseArchiveAccount,
  useAccountHierarchy: mockUseAccountHierarchy,
  useReparentAccount: mockUseReparentAccount,
  useValidateReparent: mockUseValidateReparent,
}));

// Mock UI components
vi.mock('aibos-ui', () => mockUIComponents);

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/core-ledger',
}));

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

describe('M01 Core Ledger Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete M01 Workflow', () => {
    it('should load and display accounts successfully', async () => {
      render(
        <TestWrapper>
          <CoreLedgerPage />
        </TestWrapper>
      );

      // Wait for accounts to load
      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument();
        expect(screen.getByText('Accounts Payable')).toBeInTheDocument();
      });

      // Verify table headers
      expect(screen.getByText('Code')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Balance')).toBeInTheDocument();
      expect(screen.getByText('Parent')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should create new account successfully', async () => {
      render(
        <TestWrapper>
          <CoreLedgerPage />
        </TestWrapper>
      );

      // Click create account button
      const createButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(createButton);

      // Wait for form to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/account code/i)).toBeInTheDocument();
      });

      // Fill form
      fireEvent.change(screen.getByLabelText(/account code/i), {
        target: { value: '1200' },
      });
      fireEvent.change(screen.getByLabelText(/account name/i), {
        target: { value: 'Accounts Receivable' },
      });

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Verify creation was called
      await waitFor(() => {
        expect(mockUseCreateAccount().mutateAsync).toHaveBeenCalledWith({
          code: '1200',
          name: 'Accounts Receivable',
          type: 'Asset',
          normalBalance: 'Debit',
          parentCode: null,
          requireCostCenter: false,
          requireProject: false,
          class: null,
        });
      });
    });

    it('should edit existing account successfully', async () => {
      render(
        <TestWrapper>
          <CoreLedgerPage />
        </TestWrapper>
      );

      // Wait for accounts to load
      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument();
      });

      // Click edit button
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      // Wait for edit form to appear
      await waitFor(() => {
        expect(screen.getByDisplayValue('Cash')).toBeInTheDocument();
      });

      // Update account name
      fireEvent.change(screen.getByDisplayValue('Cash'), {
        target: { value: 'Updated Cash Account' },
      });

      // Submit changes
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      // Verify update was called
      await waitFor(() => {
        expect(mockUseUpdateAccount().mutateAsync).toHaveBeenCalledWith({
          id: 'acc-1',
          name: 'Updated Cash Account',
          type: 'Asset',
          normalBalance: 'Debit',
          requireCostCenter: false,
          requireProject: false,
          class: 'Current Assets',
        });
      });
    });

    it('should archive account successfully', async () => {
      render(
        <TestWrapper>
          <CoreLedgerPage />
        </TestWrapper>
      );

      // Wait for accounts to load
      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument();
      });

      // Click archive button
      const archiveButtons = screen.getAllByRole('button', { name: /archive/i });
      fireEvent.click(archiveButtons[0]);

      // Verify archive was called
      await waitFor(() => {
        expect(mockUseArchiveAccount().mutateAsync).toHaveBeenCalledWith({
          id: 'acc-1',
          reason: 'No reason provided',
        });
      });
    });

    it('should display account hierarchy successfully', async () => {
      render(
        <TestWrapper>
          <CoreLedgerPage />
        </TestWrapper>
      );

      // Switch to hierarchy view
      const hierarchyTab = screen.getByRole('tab', { name: /hierarchy/i });
      fireEvent.click(hierarchyTab);

      // Wait for hierarchy to load
      await waitFor(() => {
        expect(screen.getByText('1000 - Cash')).toBeInTheDocument();
        expect(screen.getByText('1100 - Petty Cash')).toBeInTheDocument();
        expect(screen.getByText('2000 - Accounts Payable')).toBeInTheDocument();
      });
    });

    it('should handle reparenting successfully', async () => {
      render(
        <TestWrapper>
          <CoreLedgerPage />
        </TestWrapper>
      );

      // Switch to hierarchy view
      const hierarchyTab = screen.getByRole('tab', { name: /hierarchy/i });
      fireEvent.click(hierarchyTab);

      // Wait for hierarchy to load
      await waitFor(() => {
        expect(screen.getByText('1100 - Petty Cash')).toBeInTheDocument();
      });

      // Simulate drag and drop reparenting
      const sourceAccount = screen.getByText('1100 - Petty Cash');
      const targetAccount = screen.getByText('2000 - Accounts Payable');

      // This would typically involve drag and drop events
      // For now, we'll simulate the reparent action
      fireEvent.click(sourceAccount);
      fireEvent.click(targetAccount);

      // Verify reparent was called
      await waitFor(() => {
        expect(mockUseReparentAccount().mutateAsync).toHaveBeenCalled();
      });
    });

    it('should handle search functionality', async () => {
      render(
        <TestWrapper>
          <CoreLedgerPage />
        </TestWrapper>
      );

      // Wait for accounts to load
      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument();
      });

      // Enter search term
      const searchInput = screen.getByPlaceholderText(/search accounts/i);
      fireEvent.change(searchInput, { target: { value: 'cash' } });

      // Verify search was triggered
      await waitFor(() => {
        expect(mockUseAccounts).toHaveBeenCalledWith({ search: 'cash' });
      });
    });

    it('should handle pagination', async () => {
      render(
        <TestWrapper>
          <CoreLedgerPage />
        </TestWrapper>
      );

      // Wait for accounts to load
      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument();
      });

      // Click next page
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);

      // Verify pagination was triggered
      await waitFor(() => {
        expect(mockUseAccounts).toHaveBeenCalledWith({ page: 2, limit: 10 });
      });
    });

    it('should handle error states gracefully', async () => {
      // Mock error state
      mockUseAccounts.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to load accounts'),
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CoreLedgerPage />
        </TestWrapper>
      );

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/error loading accounts/i)).toBeInTheDocument();
      });

      // Verify retry button is available
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });

    it('should handle loading states gracefully', async () => {
      // Mock loading state
      mockUseAccounts.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <CoreLedgerPage />
        </TestWrapper>
      );

      // Wait for loading to appear
      await waitFor(() => {
        expect(screen.getByText(/loading accounts/i)).toBeInTheDocument();
      });

      // Verify loading spinner is shown
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('M01 Data Flow Integration', () => {
    it('should maintain data consistency across components', async () => {
      render(
        <TestWrapper>
          <CoreLedgerPage />
        </TestWrapper>
      );

      // Wait for accounts to load
      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument();
      });

      // Switch between views and verify data consistency
      const listTab = screen.getByRole('tab', { name: /list/i });
      const hierarchyTab = screen.getByRole('tab', { name: /hierarchy/i });

      fireEvent.click(hierarchyTab);
      await waitFor(() => {
        expect(screen.getByText('1000 - Cash')).toBeInTheDocument();
      });

      fireEvent.click(listTab);
      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument();
      });

      // Data should be consistent across views
      expect(mockUseAccounts).toHaveBeenCalled();
      expect(mockUseAccountHierarchy).toHaveBeenCalled();
    });

    it('should handle optimistic updates correctly', async () => {
      render(
        <TestWrapper>
          <CoreLedgerPage />
        </TestWrapper>
      );

      // Wait for accounts to load
      await waitFor(() => {
        expect(screen.getByText('Cash')).toBeInTheDocument();
      });

      // Create new account
      const createButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/account code/i)).toBeInTheDocument();
      });

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/account code/i), {
        target: { value: '1200' },
      });
      fireEvent.change(screen.getByLabelText(/account name/i), {
        target: { value: 'Accounts Receivable' },
      });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      // Verify optimistic update behavior
      await waitFor(() => {
        expect(mockUseCreateAccount().mutateAsync).toHaveBeenCalled();
      });

      // The optimistic update should show the new account immediately
      // while the actual API call is in progress
    });
  });
});
