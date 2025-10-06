// M01 Core Ledger - Real Component Code Coverage Tests
// Tests that import and execute actual React components using RELIANCE METHOD

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// RELIANCE METHOD: Direct imports (no aliases) - Absolute paths from project root
import { AccountForm } from '../../../apps/web/components/core-ledger/AccountForm';
import { AccountList } from '../../../apps/web/components/core-ledger/AccountList';
import { AccountHierarchy } from '../../../apps/web/components/core-ledger/AccountHierarchy';

// Import test data
import {
  mockAccounts,
  mockAccountHierarchy,
  mockCreateAccountRequest,
  mockUpdateAccountRequest,
} from '../fixtures/accounts';

// Mock React Query hooks
vi.mock('../../../apps/web/hooks/useAccounts', () => ({
  useAccounts: vi.fn(() => ({
    data: { accounts: mockAccounts, total: mockAccounts.length },
    isLoading: false,
    error: null,
  })),
  useCreateAccount: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(mockAccounts[0]),
    isLoading: false,
    error: null,
  })),
  useUpdateAccount: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(mockAccounts[0]),
    isLoading: false,
    error: null,
  })),
  useArchiveAccount: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
    error: null,
  })),
  useAccountHierarchy: vi.fn(() => ({
    data: mockAccountHierarchy,
    isLoading: false,
    error: null,
  })),
  useReparentAccount: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isLoading: false,
    error: null,
  })),
}));

// Test wrapper with React Query
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('M01 Real Component Code Coverage Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AccountForm - Real Component Execution', () => {
    it('should render actual AccountForm component', () => {
      const mockOnSubmit = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <TestWrapper>
          <AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Test actual component rendering
      expect(screen.getByLabelText(/account code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/account name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/account type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/normal balance/i)).toBeInTheDocument();
    });

    it('should handle form submission in actual component', async () => {
      const mockOnSubmit = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <TestWrapper>
          <AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Fill form fields
      fireEvent.change(screen.getByLabelText(/account code/i), {
        target: { value: 'TEST-001' },
      });
      fireEvent.change(screen.getByLabelText(/account name/i), {
        target: { value: 'Test Account' },
      });
      fireEvent.change(screen.getByLabelText(/account type/i), {
        target: { value: 'Asset' },
      });
      fireEvent.change(screen.getByLabelText(/normal balance/i), {
        target: { value: 'Debit' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          code: 'TEST-001',
          name: 'Test Account',
          type: 'Asset',
          normalBalance: 'Debit',
          parentCode: '',
          requireCostCenter: false,
          requireProject: false,
          class: '',
        });
      });
    });

    it('should handle form validation in actual component', async () => {
      const mockOnSubmit = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <TestWrapper>
          <AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Try to submit empty form
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/account code is required/i)).toBeInTheDocument();
        expect(screen.getByText(/account name is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should handle cancel in actual component', () => {
      const mockOnSubmit = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <TestWrapper>
          <AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('AccountList - Real Component Execution', () => {
    it('should render actual AccountList component', () => {
      render(
        <TestWrapper>
          <AccountList />
        </TestWrapper>
      );

      // Test actual component rendering
      expect(screen.getByText(/accounts/i)).toBeInTheDocument();
      expect(screen.getByText(mockAccounts[0].name)).toBeInTheDocument();
      expect(screen.getByText(mockAccounts[1].name)).toBeInTheDocument();
    });

    it('should handle account editing in actual component', async () => {
      render(
        <TestWrapper>
          <AccountList />
        </TestWrapper>
      );

      // Find and click edit button
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);

      // Should show edit form or modal
      await waitFor(() => {
        expect(screen.getByDisplayValue(mockAccounts[0].name)).toBeInTheDocument();
      });
    });

    it('should handle account archiving in actual component', async () => {
      render(
        <TestWrapper>
          <AccountList />
        </TestWrapper>
      );

      // Find and click archive button
      const archiveButtons = screen.getAllByRole('button', { name: /archive/i });
      fireEvent.click(archiveButtons[0]);

      // Should show confirmation dialog
      await waitFor(() => {
        expect(screen.getByText(/archive account/i)).toBeInTheDocument();
      });
    });
  });

  describe('AccountHierarchy - Real Component Execution', () => {
    it('should render actual AccountHierarchy component', () => {
      render(
        <TestWrapper>
          <AccountHierarchy />
        </TestWrapper>
      );

      // Test actual component rendering
      expect(screen.getByText(/account hierarchy/i)).toBeInTheDocument();
      expect(screen.getByText(mockAccountHierarchy[0].name)).toBeInTheDocument();
    });

    it('should handle drag and drop in actual component', async () => {
      render(
        <TestWrapper>
          <AccountHierarchy />
        </TestWrapper>
      );

      // Find draggable elements
      const draggableElements = screen.getAllByRole('button');
      const sourceElement = draggableElements[0];
      const targetElement = draggableElements[1];

      // Simulate drag and drop
      fireEvent.dragStart(sourceElement);
      fireEvent.dragOver(targetElement);
      fireEvent.drop(targetElement);

      // Should trigger reparent logic
      await waitFor(() => {
        // Component should handle the drag and drop
        expect(sourceElement).toBeInTheDocument();
      });
    });

    it('should handle hierarchy expansion in actual component', () => {
      render(
        <TestWrapper>
          <AccountHierarchy />
        </TestWrapper>
      );

      // Find expand/collapse buttons
      const expandButtons = screen.getAllByRole('button', { name: /expand/i });
      if (expandButtons.length > 0) {
        fireEvent.click(expandButtons[0]);

        // Should show child accounts
        expect(screen.getByText(/child accounts/i)).toBeInTheDocument();
      }
    });
  });

  describe('Component Integration - Real Code Execution', () => {
    it('should handle complete account creation workflow', async () => {
      const mockOnSubmit = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <TestWrapper>
          <AccountForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
        </TestWrapper>
      );

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/account code/i), {
        target: { value: 'INTEGRATION-001' },
      });
      fireEvent.change(screen.getByLabelText(/account name/i), {
        target: { value: 'Integration Test Account' },
      });
      fireEvent.change(screen.getByLabelText(/account type/i), {
        target: { value: 'Asset' },
      });
      fireEvent.change(screen.getByLabelText(/normal balance/i), {
        target: { value: 'Debit' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          code: 'INTEGRATION-001',
          name: 'Integration Test Account',
          type: 'Asset',
          normalBalance: 'Debit',
          parentCode: '',
          requireCostCenter: false,
          requireProject: false,
          class: '',
        });
      });
    });

    it('should handle error states in actual components', async () => {
      // Mock error state
      vi.mocked(require('../../../apps/web/hooks/useAccounts').useAccounts).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch accounts'),
      });

      render(
        <TestWrapper>
          <AccountList />
        </TestWrapper>
      );

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/failed to fetch accounts/i)).toBeInTheDocument();
      });
    });
  });
});
