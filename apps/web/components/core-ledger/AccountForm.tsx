import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input, Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'aibos-ui';
import { CreateAccountRequest } from '@/hooks/useAccounts';

const createAccountSchema = z.object({
  code: z.string().min(3, 'Code is required and must be at least 3 characters').max(50).regex(/^[A-Z0-9-]+$/, 'Code must contain only uppercase letters, numbers, and hyphens'),
  name: z.string().min(5, 'Name is required and must be at least 5 characters').max(255),
  type: z.enum(['Asset', 'Liability', 'Equity', 'Income', 'Expense'], { required_error: 'Account type is required' }),
  normalBalance: z.enum(['D', 'C'], { required_error: 'Normal balance is required' }),
  parentCode: z.string().optional().nullable(),
  requireCostCenter: z.boolean().default(false),
  requireProject: z.boolean().default(false),
  class: z.string().optional().nullable(),
});

interface AccountFormProps {
  onSubmit: (data: CreateAccountRequest) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const AccountForm: React.FC<AccountFormProps> = ({ onSubmit, onCancel, isLoading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateAccountRequest>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      requireCostCenter: false,
      requireProject: false,
    },
  });

  const handleFormSubmit = (data: CreateAccountRequest) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="code">Account Code</Label>
        <Input id="code" {...register('code')} />
        {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
      </div>
      <div>
        <Label htmlFor="name">Account Name</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="type">Account Type</Label>
        <Select onValueChange={(value: string) => register('type').onChange({ target: { name: 'type', value } })} defaultValue="">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select account type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Asset">Asset</SelectItem>
            <SelectItem value="Liability">Liability</SelectItem>
            <SelectItem value="Equity">Equity</SelectItem>
            <SelectItem value="Income">Income</SelectItem>
            <SelectItem value="Expense">Expense</SelectItem>
          </SelectContent>
        </Select>
        {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
      </div>
      <div>
        <Label htmlFor="normalBalance">Normal Balance</Label>
        <Select onValueChange={(value: string) => register('normalBalance').onChange({ target: { name: 'normalBalance', value } })} defaultValue="">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select normal balance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="D">Debit</SelectItem>
            <SelectItem value="C">Credit</SelectItem>
          </SelectContent>
        </Select>
        {errors.normalBalance && <p className="text-red-500 text-sm mt-1">{errors.normalBalance.message}</p>}
      </div>
      <div>
        <Label htmlFor="parentCode">Parent Account Code (Optional)</Label>
        <Input id="parentCode" {...register('parentCode')} />
        {errors.parentCode && <p className="text-red-500 text-sm mt-1">{errors.parentCode.message}</p>}
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="requireCostCenter"
          {...register('requireCostCenter')}
          className="h-4 w-4 text-aibos-semantic-primary border-aibos-semantic-border rounded focus:ring-aibos-semantic-primary bg-aibos-semantic-input"
        />
        <Label htmlFor="requireCostCenter">Require Cost Center</Label>
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="requireProject"
          {...register('requireProject')}
          className="h-4 w-4 text-aibos-semantic-primary border-aibos-semantic-border rounded focus:ring-aibos-semantic-primary bg-aibos-semantic-input"
        />
        <Label htmlFor="requireProject">Require Project</Label>
      </div>
      <div>
        <Label htmlFor="class">Class (Optional)</Label>
        <Input id="class" {...register('class')} />
        {errors.class && <p className="text-red-500 text-sm mt-1">{errors.class.message}</p>}
      </div>
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
};
