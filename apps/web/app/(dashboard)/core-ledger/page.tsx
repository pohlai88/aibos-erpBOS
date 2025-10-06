'use client';

import { useState } from 'react';
import { useAccounts, useCreateAccount, useUpdateAccount, useArchiveAccount, CreateAccountRequest, UpdateAccountRequest } from '@/hooks/useAccounts';
import { Button, Card, Input, Select, Tabs, Modal } from 'aibos-ui';
import { AccountForm } from '@/components/core-ledger/AccountForm';
import { AccountList } from '@/components/core-ledger/AccountList';
import { AccountHierarchy } from '@/components/core-ledger/AccountHierarchy';

export default function CoreLedgerPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'hierarchy'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    query: '',
    type: '',
    companyId: 'default',
  });

  const { data: accountsData, isLoading, error } = useAccounts(filters);
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const archiveAccount = useArchiveAccount();

  const handleCreateAccount = async (data: CreateAccountRequest) => {
    try {
      await createAccount.mutateAsync(data);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create account:', error);
    }
  };

  const handleUpdateAccount = async (id: string, data: UpdateAccountRequest) => {
    try {
      await updateAccount.mutateAsync({ id, data });
    } catch (error) {
      console.error('Failed to update account:', error);
    }
  };

  const handleArchiveAccount = async (id: string, reason?: string) => {
    try {
      await archiveAccount.mutateAsync({ id, reason: reason || 'No reason provided' });
    } catch (error) {
      console.error('Failed to archive account:', error);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="premium-card p-6 text-center">
          <div className="text-red-500 mb-4">
            Error loading accounts: {error.message}
          </div>
          <Button 
            onClick={() => window.location.reload()}
            className="premium-button"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Chart of Accounts
          </h1>
          <p className="text-muted">
            Manage your account structure and hierarchy
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="premium-button"
        >
          Create Account
        </Button>
      </div>

      {/* Filters */}
      <Card className="premium-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search accounts..."
            value={filters.query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, query: e.target.value }))}
            className="premium-input"
          />
          <Select
            value={filters.type}
            onValueChange={(value: string) => setFilters(prev => ({ ...prev, type: value }))}
            className="premium-input"
          >
            <option value="">All Types</option>
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Equity">Equity</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </Select>
          <div className="flex gap-2">
            <Button 
              onClick={() => setFilters({ query: '', type: '', companyId: 'default' })}
              className="premium-button"
              variant="ghost"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="premium-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Total Accounts</p>
              <p className="text-2xl font-bold">{accountsData?.total || 0}</p>
            </div>
            <div className="badge badge-info">Active</div>
          </div>
        </Card>
        <Card className="premium-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Assets</p>
              <p className="text-2xl font-bold">
                {accountsData?.accounts.filter(a => a.type === 'Asset').length || 0}
              </p>
            </div>
            <div className="badge badge-ok">D</div>
          </div>
        </Card>
        <Card className="premium-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Liabilities</p>
              <p className="text-2xl font-bold">
                {accountsData?.accounts.filter(a => a.type === 'Liability').length || 0}
              </p>
            </div>
            <div className="badge badge-warn">C</div>
          </div>
        </Card>
        <Card className="premium-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Equity</p>
              <p className="text-2xl font-bold">
                {accountsData?.accounts.filter(a => a.type === 'Equity').length || 0}
              </p>
            </div>
            <div className="badge badge-info">C</div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={(value: string) => setActiveTab(value as 'list' | 'hierarchy')}
        className="w-full"
      >
        <div className="flex gap-4 mb-4">
          <Button
            variant={activeTab === 'list' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('list')}
            className="premium-button"
          >
            List View
          </Button>
          <Button
            variant={activeTab === 'hierarchy' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('hierarchy')}
            className="premium-button"
          >
            Hierarchy View
          </Button>
        </div>

        {activeTab === 'list' && (
          <AccountList
            accounts={accountsData?.accounts || []}
            isLoading={isLoading}
            onUpdate={handleUpdateAccount}
            onArchive={handleArchiveAccount}
          />
        )}

        {activeTab === 'hierarchy' && (
          <AccountHierarchy
            companyId={filters.companyId}
          />
        )}
      </Tabs>

      {/* Create Account Modal */}
      <Modal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        title="Create New Account"
      >
        <AccountForm
          onSubmit={handleCreateAccount}
          isLoading={createAccount.isPending}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>
    </div>
  );
}
