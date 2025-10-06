// M01 Core Ledger - Real API Code Coverage Tests
// Tests that import and execute actual source code using RELIANCE METHOD

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// RELIANCE METHOD: Direct imports (no aliases) - Absolute paths from project root
import { GET, POST } from '../../../apps/bff/app/api/accounts/route';
import { GET as GET_BY_ID, PUT, DELETE } from '../../../apps/bff/app/api/accounts/[id]/route';
import { GET as GET_HIERARCHY } from '../../../apps/bff/app/api/accounts/hierarchy/route';

// Import test data
import {
  mockAccounts,
  mockAccountHierarchy,
  mockCreateAccountRequest,
  mockUpdateAccountRequest,
  mockAuthContext,
} from '../fixtures/accounts';

// Mock dependencies
vi.mock('@/lib/db', () => ({
  pool: {
    query: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue(mockAuthContext),
  requireCapability: vi.fn().mockReturnValue(undefined),
}));

vi.mock('@/lib/http', () => ({
  ok: (data: any) => new Response(JSON.stringify({ data }), { status: 200 }),
  created: (data: any) => new Response(JSON.stringify({ data }), { status: 201 }),
  badRequest: (message: string, details?: any) => 
    new Response(JSON.stringify({ error: message, details }), { status: 400 }),
  notFound: (message: string) => 
    new Response(JSON.stringify({ error: message }), { status: 404 }),
  serverError: (message: string) => 
    new Response(JSON.stringify({ error: message }), { status: 500 }),
}));

vi.mock('@/api/_kit', () => ({
  withRouteErrors: (handler: any) => handler,
}));

const mockPool = await import('@/lib/db');

describe('M01 Real API Code Coverage Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/accounts - Real Code Execution', () => {
    it('should execute actual GET function', async () => {
      mockPool.pool.query.mockResolvedValue({
        rows: mockAccounts,
        rowCount: mockAccounts.length,
      });

      const request = new NextRequest('http://localhost:3000/api/accounts');
      const response = await GET(request); // ← ACTUAL CODE EXECUTION
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toEqual(mockAccounts);
      expect(mockPool.pool.query).toHaveBeenCalled();
    });

    it('should handle pagination in actual code', async () => {
      mockPool.pool.query.mockResolvedValue({
        rows: mockAccounts.slice(0, 1),
        rowCount: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/accounts?page=1&limit=1');
      const response = await GET(request); // ← ACTUAL CODE EXECUTION
      
      expect(response.status).toBe(200);
      expect(mockPool.pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 1 OFFSET 0'),
        expect.arrayContaining([mockAuthContext.company_id])
      );
    });

    it('should handle search in actual code', async () => {
      mockPool.pool.query.mockResolvedValue({
        rows: [mockAccounts[0]],
        rowCount: 1,
      });

      const request = new NextRequest('http://localhost:3000/api/accounts?search=cash');
      const response = await GET(request); // ← ACTUAL CODE EXECUTION
      
      expect(response.status).toBe(200);
      expect(mockPool.pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE'),
        expect.arrayContaining([mockAuthContext.company_id, '%cash%'])
      );
    });
  });

  describe('POST /api/accounts - Real Code Execution', () => {
    it('should execute actual POST function', async () => {
      mockPool.pool.query
        .mockResolvedValueOnce({ rows: [] }) // Duplicate check
        .mockResolvedValueOnce({ rows: [] }) // Parent check
        .mockResolvedValueOnce({ rows: [mockAccounts[0]] }); // Insert

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(mockCreateAccountRequest),
      });

      const response = await POST(request); // ← ACTUAL CODE EXECUTION
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.data).toEqual(mockAccounts[0]);
      expect(mockPool.pool.query).toHaveBeenCalledTimes(3);
    });

    it('should handle duplicate code validation in actual code', async () => {
      mockPool.pool.query.mockResolvedValue({ rows: [mockAccounts[0]] });

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(mockCreateAccountRequest),
      });

      const response = await POST(request); // ← ACTUAL CODE EXECUTION
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Account code already exists');
    });

    it('should handle parent validation in actual code', async () => {
      mockPool.pool.query
        .mockResolvedValueOnce({ rows: [] }) // Duplicate check
        .mockResolvedValueOnce({ rows: [] }); // Parent check

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify({ ...mockCreateAccountRequest, parent_code: '9999' }),
      });

      const response = await POST(request); // ← ACTUAL CODE EXECUTION
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Parent account not found');
    });
  });

  describe('GET /api/accounts/[id] - Real Code Execution', () => {
    it('should execute actual GET_BY_ID function', async () => {
      mockPool.pool.query.mockResolvedValue({ rows: [mockAccounts[0]] });

      const request = new NextRequest('http://localhost:3000/api/accounts/acc-1');
      const response = await GET_BY_ID(request, { params: { id: 'acc-1' } }); // ← ACTUAL CODE EXECUTION
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toEqual(mockAccounts[0]);
    });

    it('should handle non-existent account in actual code', async () => {
      mockPool.pool.query.mockResolvedValue({ rows: [] });

      const request = new NextRequest('http://localhost:3000/api/accounts/non-existent');
      const response = await GET_BY_ID(request, { params: { id: 'non-existent' } }); // ← ACTUAL CODE EXECUTION
      
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/accounts/[id] - Real Code Execution', () => {
    it('should execute actual PUT function', async () => {
      mockPool.pool.query
        .mockResolvedValueOnce({ rows: [mockAccounts[0]] }) // Exists check
        .mockResolvedValueOnce({ rows: [mockAccounts[0]] }); // Update

      const request = new NextRequest('http://localhost:3000/api/accounts/acc-1', {
        method: 'PUT',
        body: JSON.stringify(mockUpdateAccountRequest),
      });

      const response = await PUT(request, { params: { id: 'acc-1' } }); // ← ACTUAL CODE EXECUTION
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toEqual(mockAccounts[0]);
    });
  });

  describe('DELETE /api/accounts/[id] - Real Code Execution', () => {
    it('should execute actual DELETE function', async () => {
      mockPool.pool.query
        .mockResolvedValueOnce({ rows: [mockAccounts[0]] }) // Exists check
        .mockResolvedValueOnce({ rows: [] }); // Archive

      const request = new NextRequest('http://localhost:3000/api/accounts/acc-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'acc-1' } }); // ← ACTUAL CODE EXECUTION
      
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/accounts/hierarchy - Real Code Execution', () => {
    it('should execute actual GET_HIERARCHY function', async () => {
      mockPool.pool.query.mockResolvedValue({ rows: mockAccountHierarchy });

      const request = new NextRequest('http://localhost:3000/api/accounts/hierarchy');
      const response = await GET_HIERARCHY(request); // ← ACTUAL CODE EXECUTION
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.data).toEqual(mockAccountHierarchy);
    });
  });
});
