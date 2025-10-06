import React, { useState } from 'react';
import { Account } from '@/hooks/useAccounts';
import { Input, Button, Badge } from 'aibos-ui';
import { Edit, Save, XCircle, Trash2 } from 'lucide-react';

interface AccountListProps {
  accounts: Account[];
  isLoading?: boolean;
  onUpdate?: (id: string, data: any) => void;
  onArchive?: (id: string, reason: string) => void;
}

export const AccountList: React.FC<AccountListProps> = ({ accounts, isLoading, onUpdate, onArchive }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedAccount, setEditedAccount] = useState<Partial<Account>>({});

  const handleEdit = (account: Account) => {
    setEditingId(account.id);
    setEditedAccount(account);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedAccount((prev: Partial<Account>) => ({ ...prev, [name]: value }));
  };

  const handleSave = (id: string) => {
    console.log('Saving account:', id, editedAccount);
    // TODO: Integrate with useUpdateAccount mutation
    setEditingId(null);
    setEditedAccount({});
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedAccount({});
  };

  const handleDelete = (id: string) => {
    console.log('Deleting account:', id);
    // TODO: Integrate with useArchiveAccount mutation
    if (window.confirm('Are you sure you want to archive this account?')) {
      // Call archive mutation
    }
  };

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
        <p className="text-muted">Loading accounts...</p>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted">No accounts found. Start by creating a new one!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-aibos-semantic-border">
        <thead className="bg-aibos-semantic-card">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-aibos-semantic-muted-foreground uppercase tracking-wider">
              Code
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-aibos-semantic-muted-foreground uppercase tracking-wider">
              Name
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-aibos-semantic-muted-foreground uppercase tracking-wider">
              Type
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-aibos-semantic-muted-foreground uppercase tracking-wider">
              Balance
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-aibos-semantic-muted-foreground uppercase tracking-wider">
              Parent
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-aibos-semantic-muted-foreground uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-aibos-semantic-card divide-y divide-aibos-semantic-border">
          {accounts.map((account) => (
            <tr key={account.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-aibos-semantic-foreground">
                {editingId === account.id ? (
                  <Input
                    type="text"
                    name="code"
                    value={editedAccount.code || ''}
                    onChange={handleChange}
                    className="w-24"
                  />
                ) : (
                  account.code
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-aibos-semantic-foreground">
                {editingId === account.id ? (
                  <Input
                    type="text"
                    name="name"
                    value={editedAccount.name || ''}
                    onChange={handleChange}
                    className="w-48"
                  />
                ) : (
                  account.name
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-aibos-semantic-foreground">
                {editingId === account.id ? (
                  <select
                    name="type"
                    value={editedAccount.type || ''}
                    onChange={handleChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border-aibos-semantic-border focus:outline-none focus:ring-aibos-semantic-primary focus:border-aibos-semantic-primary sm:text-sm rounded-md bg-aibos-semantic-input"
                  >
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Equity">Equity</option>
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                ) : (
                  account.type
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-aibos-semantic-foreground">
                {editingId === account.id ? (
                  <select
                    name="normalBalance"
                    value={editedAccount.normalBalance || ''}
                    onChange={handleChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border-aibos-semantic-border focus:outline-none focus:ring-aibos-semantic-primary focus:border-aibos-semantic-primary sm:text-sm rounded-md bg-aibos-semantic-input"
                  >
                    <option value="D">Debit</option>
                    <option value="C">Credit</option>
                  </select>
                ) : (
                  account.normalBalance === 'D' ? 'Debit' : 'Credit'
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-aibos-semantic-muted-foreground">
                {account.parentCode || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <Badge variant={account.isActive ? 'success' : 'destructive'}>
                  {account.isActive ? 'Active' : 'Archived'}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingId === account.id ? (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => handleSave(account.id)} className="text-green-500 hover:text-green-600">
                      <Save className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={handleCancel} className="text-red-500 hover:text-red-600 ml-2">
                      <XCircle className="h-5 w-5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(account)} className="text-aibos-semantic-muted-foreground hover:text-aibos-semantic-foreground">
                      <Edit className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)} className="text-red-500 hover:text-red-600 ml-2">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
