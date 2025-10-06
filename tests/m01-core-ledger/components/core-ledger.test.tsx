// M01 Core Ledger Component Tests
// Focused tests for UI components

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { AccountForm } from '@/components/core-ledger/AccountForm';
import { AccountList } from '@/components/core-ledger/AccountList';
import { AccountHierarchy } from '@/components/core-ledger/AccountHierarchy';

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

describe('M01 Core Ledger Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AccountForm', () => {
    it('should render form fields correctly', () => {
      render(
        <TestWrapper>
          <AccountForm onSubmit={vi.fn()} onCancel={vi.fn()} />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/account code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/account name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/account type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/normal balance/i)).toBeInTheDocument();
    });

    it('should validate required fields', async () => {
      render(
        <TestWrapper>
          <AccountForm onSubmit={vi.fn()} onCancel={vi.fn()} />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/account code is required/i)).toBeInTheDocument();
        expect(screen.getByText(/account name is required/i)).toBeInTheDocument();
      });
    });

    it('should submit form with valid data', async () => {
      const mockOnSubmit = vi.fn();
      render(
        <TestWrapper>
          <AccountForm onSubmit={mockOnSubmit} onCancel={vi.fn()} />
        </TestWrapper>
      );

      // Fill form
      fireEvent.change(screen.getByLabelText(/account code/i), {
        target: { value: '1200' },
      });
      fireEvent.change(screen.getByLabelText(/account name/i), {
        target: { value: 'Accounts Receivable' },
      });

      const submitButton = screen.getByRole('button', { name: /create/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
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

    it('should handle cancel action', () => {
      const mockOnCancel = vi.fn();
      render(
        <TestWrapper>
          <AccountForm onSubmit={vi.fn()} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should show loading state', () => {
      mockUseCreateAccount.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: true,
        isError: false,
        error: null,
      });

      render(
        <TestWrapper>
          <AccountForm onSubmit={vi.fn()} onCancel={vi.fn()} />
        </TestWrapper>
      );

      expect(screen.getByText(/creating/i)).toBeInTheDocument();
    });
  });

  describe('AccountList', () => {
    it('should render accounts table', () => {
      render(
        <TestWrapper>
          <AccountList accounts={mockAccounts} onEdit={vi.fn()} onArchive={vi.fn()} />
        </TestWrapper>
      );

      expect(screen.getByText('Code')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Balance')).toBeInTheDocument();
      expect(screen.getByText('Parent')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should display account data', () => {
      render(
        <TestWrapper>
          <AccountList accounts={mockAccounts} onEdit={vi.fn()} onArchive={vi.fn()} />
        </TestWrapper>
      );

      expect(screen.getByText('1000')).toBeInTheDocument();
      expect(screen.getByText('Cash')).toBeInTheDocument();
      expect(screen.getByText('Asset')).toBeInTheDocument();
      expect(screen.getByText('Debit')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should handle edit action', () => {
      const mockOnEdit = vi.fn();
      render(
        <TestWrapper>
          <AccountList accounts={mockAccounts} onEdit={mockOnEdit} onArchive={vi.fn()} />
        </TestWrapper>
      );

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      expect(mockOnEdit).toHaveBeenCalledWith(mockAccounts[0]);
    });

    it('should handle archive action', () => {
      const mockOnArchive = vi.fn();
      render(
        <TestWrapper>
          <AccountList accounts={mockAccounts} onEdit={vi.fn()} onArchive={mockOnArchive} />
        </TestWrapper>
      );

      const archiveButtons = screen.getAllByRole('button', { name: /archive/i });
      fireEvent.click(archiveButtons[0]);

      expect(mockOnArchive).toHaveBeenCalledWith(mockAccounts[0].id);
    });

    it('should show empty state', () => {
      render(
        <TestWrapper>
          <AccountList accounts={[]} onEdit={vi.fn()} onArchive={vi.fn()} />
        </TestWrapper>
      );

      expect(screen.getByText(/no accounts found/i)).toBeInTheDocument();
    });
  });

  describe('AccountHierarchy', () => {
    it('should render hierarchy tree', () => {
      render(
        <TestWrapper>
          <AccountHierarchy />
        </TestWrapper>
      );

      expect(screen.getByText('1000 - Cash')).toBeInTheDocument();
      expect(screen.getByText('1100 - Petty Cash')).toBeInTheDocument();
      expect(screen.getByText('2000 - Accounts Payable')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      mockUseAccountHierarchy.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <AccountHierarchy />
        </TestWrapper>
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should show error state', () => {
      mockUseAccountHierarchy.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to load hierarchy'),
        refetch: vi.fn(),
      });

      render(
        <TestWrapper>
          <AccountHierarchy />
        </TestWrapper>
      );

      expect(screen.getByText(/error loading hierarchy/i)).toBeInTheDocument();
    });

    it('should handle expand/collapse', () => {
      render(
        <TestWrapper>
          <AccountHierarchy />
        </TestWrapper>
      );

      const expandButton = screen.getByRole('button', { name: /expand/i });
      fireEvent.click(expandButton);

      expect(screen.getByText('1100 - Petty Cash')).toBeInTheDocument();
    });

    it('should handle expand all/collapse all', () => {
      render(
        <TestWrapper>
          <AccountHierarchy />
        </TestWrapper>
      );

      const expandAllButton = screen.getByRole('button', { name: /expand all/i });
      fireEvent.click(expandAllButton);

      expect(screen.getByText('1100 - Petty Cash')).toBeInTheDocument();
    });
  });
});
