// M01 Core Ledger API Tests
// Focused tests for account management endpoints

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/api/accounts/route';
import { GET as GET_BY_ID, PUT, DELETE } from '@/api/accounts/[id]/route';
import { GET as GET_HIERARCHY } from '@/api/accounts/hierarchy/route';
import { POST as VALIDATE_REPARENT } from '@/api/accounts/reparent/validate/route';
import { POST as REPARENT } from '@/api/accounts/reparent/route';

import {
  mockAccounts,
  mockAccountHierarchy,
  mockCreateAccountRequest,
  mockUpdateAccountRequest,
  mockReparentRequest,
  mockAuthContext,
} from '../fixtures/accounts';

import {
  mockPool,
  mockRequireAuth,
  mockRequireCapability,
  mockHttpResponses,
  mockWithRouteErrors,
} from '../fixtures/mocks';

// Mock dependencies
vi.mock('@/lib/db', () => ({ pool: mockPool }));
vi.mock('@/lib/auth', () => ({
  requireAuth: mockRequireAuth,
  requireCapability: mockRequireCapability,
}));
vi.mock('@/lib/http', () => mockHttpResponses);
vi.mock('@/api/_kit', () => ({ withRouteErrors: mockWithRouteErrors }));

describe('M01 Core Ledger API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/accounts', () => {
    it('should fetch accounts successfully', async () => {
      mockPool.query.mockResolvedValue({
        rows: mockAccounts,
        rowCount: mockAccounts.length,
      });

      const request = new NextRequest('http://localhost:3000/api/accounts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockAccounts);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM account'),
        expect.arrayContaining([mockAuthContext.company_id])
      );
    });

    it('should handle pagination', async () => {
      mockPool.query.mockResolvedValue({
        rows: mockAccounts.slice(0, 1),
        rowCount: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/accounts?page=1&limit=1');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 1 OFFSET 0'),
        expect.arrayContaining([mockAuthContext.company_id])
      );
    });

    it('should handle search query', async () => {
      mockPool.query.mockResolvedValue({
        rows: [mockAccounts[0]],
        rowCount: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/accounts?search=cash');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining([mockAuthContext.company_id, '%cash%'])
      );
    });
  });

  describe('POST /api/accounts', () => {
    it('should create account successfully', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // Duplicate check
        .mockResolvedValueOnce({ rows: [] }) // Parent check
        .mockResolvedValueOnce({ rows: [mockAccounts[0]] }); // Insert

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(mockCreateAccountRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data).toEqual(mockAccounts[0]);
      expect(mockPool.query).toHaveBeenCalledTimes(3);
    });

    it('should reject duplicate account codes', async () => {
      mockPool.query.mockResolvedValue({ rows: [mockAccounts[0]] });

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(mockCreateAccountRequest),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Account code already exists');
    });

    it('should validate parent account exists', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] }) // Duplicate check
        .mockResolvedValueOnce({ rows: [] }); // Parent check

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify({ ...mockCreateAccountRequest, parent_code: '9999' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Parent account not found');
    });
  });

  describe('GET /api/accounts/[id]', () => {
    it('should fetch account by ID', async () => {
      mockPool.query.mockResolvedValue({ rows: [mockAccounts[0]] });

      const request = new NextRequest('http://localhost:3000/api/accounts/acc-1');
      const response = await GET_BY_ID(request, { params: { id: 'acc-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockAccounts[0]);
    });

    it('should return 404 for non-existent account', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const request = new NextRequest('http://localhost:3000/api/accounts/non-existent');
      const response = await GET_BY_ID(request, { params: { id: 'non-existent' } });

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/accounts/[id]', () => {
    it('should update account successfully', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockAccounts[0]] }) // Exists check
        .mockResolvedValueOnce({ rows: [mockAccounts[0]] }); // Update

      const request = new NextRequest('http://localhost:3000/api/accounts/acc-1', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateAccountRequest),
      });

      const response = await PUT(request, { params: { id: 'acc-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockAccounts[0]);
    });
  });

  describe('DELETE /api/accounts/[id]', () => {
    it('should archive account successfully', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockAccounts[0]] }) // Exists check
        .mockResolvedValueOnce({ rows: [] }); // Archive

      const request = new NextRequest('http://localhost:3000/api/accounts/acc-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'acc-1' } });

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/accounts/hierarchy', () => {
    it('should fetch account hierarchy', async () => {
      mockPool.query.mockResolvedValue({ rows: mockAccountHierarchy });

      const request = new NextRequest('http://localhost:3000/api/accounts/hierarchy');
      const response = await GET_HIERARCHY(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockAccountHierarchy);
    });
  });

  describe('POST /api/accounts/reparent/validate', () => {
    it('should validate reparent operation', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockAccounts[2]] }) // Account exists
        .mockResolvedValueOnce({ rows: [mockAccounts[1]] }) // Parent exists
        .mockResolvedValueOnce({ rows: [] }); // No circular reference

      const request = new NextRequest('http://localhost:3000/api/accounts/reparent/validate', {
        method: 'POST',
        body: JSON.stringify(mockReparentRequest),
      });

      const response = await VALIDATE_REPARENT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
    });

    it('should detect circular references', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockAccounts[2]] }) // Account exists
        .mockResolvedValueOnce({ rows: [mockAccounts[2]] }) // Parent exists
        .mockResolvedValueOnce({ rows: [mockAccounts[0]] }); // Circular reference found

      const request = new NextRequest('http://localhost:3000/api/accounts/reparent/validate', {
        method: 'POST',
        body: JSON.stringify(mockReparentRequest),
      });

      const response = await VALIDATE_REPARENT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Circular reference detected');
    });
  });

  describe('POST /api/accounts/reparent', () => {
    it('should reparent account successfully', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [mockAccounts[2]] }) // Account exists
        .mockResolvedValueOnce({ rows: [mockAccounts[1]] }) // Parent exists
        .mockResolvedValueOnce({ rows: [] }) // No circular reference
        .mockResolvedValueOnce({ rows: [mockAccounts[2]] }); // Update

      const request = new NextRequest('http://localhost:3000/api/accounts/reparent', {
        method: 'POST',
        body: JSON.stringify(mockReparentRequest),
      });

      const response = await REPARENT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toEqual(mockAccounts[2]);
    });
  });
});
