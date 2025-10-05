import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';
import { GET as getProfile, POST as postProfile } from '@/api/payments/bank/profile/route';
import { POST as postDispatch } from '@/api/payments/bank/dispatch/route';
import { POST as postFetch } from '@/api/payments/bank/fetch/route';
import { GET as getJobs } from '@/api/payments/bank/jobs/route';

// Mock the auth module
vi.mock('@/lib/auth', () => ({
    requireAuth: vi.fn(() => ({
        company_id: 'test-company-123',
        user_id: 'test-user-123',
        api_key_id: 'test-api-key-123'
    }))
}));

// Mock the rbac module
vi.mock('@/lib/rbac', () => ({
    requireCapability: vi.fn(() => true)
}));

describe('Bank Connectivity API Routes', () => {
    const testCompanyId = 'test-company-123';
    const testBankCode = 'HSBC-MY';
    const testUserId = 'test-user-123';
    const testApiKey = 'test-api-key-123';

    beforeEach(async () => {
        // Clean up test data in correct order (children first)
        await pool.query('DELETE FROM bank_job_log WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM bank_outbox WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM bank_conn_profile WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM ap_pay_line WHERE run_id = $1', ['test-run-123']);
        await pool.query('DELETE FROM ap_pay_run WHERE company_id = $1', [testCompanyId]);

        // Create payment run for tests
        await pool.query(`
            INSERT INTO ap_pay_run (id, company_id, year, month, status, ccy, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO NOTHING
        `, ['test-run-123', testCompanyId, 2024, 1, 'exported', 'MYR', testUserId]);

        // Create payment lines
        await pool.query(`
            INSERT INTO ap_pay_line (id, run_id, supplier_id, invoice_id, due_date, gross_amount, pay_amount, inv_ccy, pay_ccy, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (run_id, invoice_id) DO NOTHING
        `, ['test-line-123', 'test-run-123', 'supplier-123', 'invoice-123', '2024-01-15', 1000, 1000, 'MYR', 'MYR', 'selected']);
    });

    afterEach(async () => {
        // Clean up test data
        await pool.query('DELETE FROM bank_job_log WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM bank_outbox WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM bank_conn_profile WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM ap_pay_run WHERE company_id = $1', [testCompanyId]);
    });

    describe('Bank Profile Routes', () => {
        it('should create bank profile via POST', async () => {
            const profileData = {
                bank_code: testBankCode,
                kind: 'SFTP',
                config: {
                    host: 'sftp.hsbc.my',
                    port: 22,
                    username: 'acme',
                    key_ref: 'HSBC_SSH_KEY',
                    out_dir: '/out',
                    in_dir: '/in'
                },
                active: true
            };

            const req = new NextRequest('http://localhost/api/payments/bank/profile', {
                method: 'POST',
                body: JSON.stringify(profileData),
                headers: { 'Content-Type': 'application/json' }
            });

            // Mock requireAuth to return our test auth
            vi.mock('@/lib/auth', () => ({
                requireAuth: vi.fn().mockResolvedValue({
                    company_id: 'test-company-123',
                    user_id: 'test-user-123',
                    api_key_id: 'test-api-key-123'
                })
            }));

            // Mock requireCapability to return success
            vi.mock('@/lib/rbac', () => ({
                requireCapability: vi.fn().mockResolvedValue(true)
            }));

            const response = await postProfile(req);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.companyId).toBe(testCompanyId);
            expect(data.bankCode).toBe(testBankCode);
            expect(data.kind).toBe('SFTP');
        });

        it('should retrieve bank profile via GET', async () => {
            // Create bank profile first
            await pool.query(`
                INSERT INTO bank_conn_profile (company_id, bank_code, kind, config, active, updated_by)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (company_id, bank_code) DO NOTHING
            `, [testCompanyId, testBankCode, 'SFTP', JSON.stringify({ host: 'sftp.hsbc.my' }), true, testUserId]);

            const req = new NextRequest(`http://localhost/api/payments/bank/profile?bank_code=${testBankCode}`);

            // Mock requireAuth
            vi.mock('@/lib/auth', () => ({
                requireAuth: vi.fn().mockResolvedValue({
                    company_id: 'test-company-123',
                    user_id: 'test-user-123',
                    api_key_id: 'test-api-key-123'
                })
            }));

            const response = await getProfile(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.bankCode).toBe(testBankCode);
        });

        it('should return 404 for non-existent profile', async () => {
            const req = new NextRequest('http://localhost/api/payments/bank/profile?bank_code=NONEXISTENT');

            // Mock requireAuth
            vi.mock('@/lib/auth', () => ({
                requireAuth: vi.fn().mockResolvedValue({
                    company_id: 'test-company-123',
                    user_id: 'test-user-123',
                    api_key_id: 'test-api-key-123'
                })
            }));

            const response = await getProfile(req);
            expect(response.status).toBe(404);
        });

        it('should list all bank profiles via GET', async () => {
            // Create multiple profiles with unique bank codes
            await pool.query(`
                INSERT INTO bank_conn_profile (company_id, bank_code, kind, config, active, updated_by)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (company_id, bank_code) DO NOTHING
            `, [testCompanyId, 'HSBC-MY', 'SFTP', JSON.stringify({ host: 'sftp.hsbc.my' }), true, testUserId]);

            await pool.query(`
                INSERT INTO bank_conn_profile (company_id, bank_code, kind, config, active, updated_by)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (company_id, bank_code) DO NOTHING
            `, [testCompanyId, 'DBS-SG', 'API', JSON.stringify({ api_base: 'https://api.dbs.sg' }), true, testUserId]);

            const req = new NextRequest('http://localhost/api/payments/bank/profile');

            // Mock requireAuth
            vi.mock('@/lib/auth', () => ({
                requireAuth: vi.fn().mockResolvedValue({
                    company_id: 'test-company-123',
                    user_id: 'test-user-123',
                    api_key_id: 'test-api-key-123'
                })
            }));

            const response = await getProfile(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(2);
            expect(data.map((p: any) => p.bankCode)).toContain('HSBC-MY');
            expect(data.map((p: any) => p.bankCode)).toContain('DBS-SG');
        });
    });

    describe('Dispatch Routes', () => {
        beforeEach(async () => {
            // Create bank profile
            await pool.query(`
                INSERT INTO bank_conn_profile (company_id, bank_code, kind, config, active, updated_by)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (company_id, bank_code) DO NOTHING
            `, [testCompanyId, testBankCode, 'SFTP', JSON.stringify({ host: 'sftp.hsbc.my' }), true, testUserId]);
        });

        it('should dispatch payment run successfully', async () => {
            const dispatchData = {
                run_id: 'test-run-123',
                bank_code: testBankCode,
                dry_run: false
            };

            const req = new NextRequest('http://localhost/api/payments/bank/dispatch', {
                method: 'POST',
                body: JSON.stringify(dispatchData),
                headers: { 'Content-Type': 'application/json' }
            });

            // Mock auth and capabilities
            vi.mock('@/lib/auth', () => ({
                requireAuth: vi.fn().mockResolvedValue({
                    company_id: 'test-company-123',
                    user_id: 'test-user-123',
                    api_key_id: 'test-api-key-123'
                })
            }));
            vi.mock('@/lib/rbac', () => ({
                requireCapability: vi.fn().mockResolvedValue(true)
            }));

            const response = await postDispatch(req);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.companyId).toBe(testCompanyId);
            expect(data.runId).toBe('test-run-123');
            expect(data.bankCode).toBe(testBankCode);
            expect(data.status).toBe('queued');
        });

        it('should reject dispatch for non-existent run', async () => {
            const dispatchData = {
                run_id: 'non-existent-run',
                bank_code: testBankCode,
                dry_run: false
            };

            const req = new NextRequest('http://localhost/api/payments/bank/dispatch', {
                method: 'POST',
                body: JSON.stringify(dispatchData),
                headers: { 'Content-Type': 'application/json' }
            });

            // Mock auth and capabilities
            vi.mock('@/lib/auth', () => ({
                requireAuth: vi.fn().mockResolvedValue({
                    company_id: 'test-company-123',
                    user_id: 'test-user-123',
                    api_key_id: 'test-api-key-123'
                })
            }));
            vi.mock('@/lib/rbac', () => ({
                requireCapability: vi.fn().mockResolvedValue(true)
            }));

            const response = await postDispatch(req);
            expect(response.status).toBe(500);
        });
    });

    describe('Fetch Routes', () => {
        beforeEach(async () => {
            // Create bank profile with different bank code to avoid conflicts
            await pool.query(`
                INSERT INTO bank_conn_profile (company_id, bank_code, kind, config, active, updated_by)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (company_id, bank_code) DO NOTHING
            `, [testCompanyId, 'DBS-SG', 'SFTP', JSON.stringify({ host: 'sftp.dbs.sg' }), true, testUserId]);
        });

        it('should fetch bank files successfully', async () => {
            const fetchData = {
                bank_code: 'DBS-SG',
                channel: 'pain002',
                max_files: 10
            };

            const req = new NextRequest('http://localhost/api/payments/bank/fetch', {
                method: 'POST',
                body: JSON.stringify(fetchData),
                headers: { 'Content-Type': 'application/json' }
            });

            // Mock auth and capabilities
            vi.mock('@/lib/auth', () => ({
                requireAuth: vi.fn().mockResolvedValue({
                    company_id: 'test-company-123',
                    user_id: 'test-user-123',
                    api_key_id: 'test-api-key-123'
                })
            }));
            vi.mock('@/lib/rbac', () => ({
                requireCapability: vi.fn().mockResolvedValue(true)
            }));

            const response = await postFetch(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.processed).toBeDefined();
            expect(data.errors).toBeDefined();
        });
    });

    describe('Job Log Routes', () => {
        beforeEach(async () => {
            // Clean up existing job logs first
            await pool.query('DELETE FROM bank_job_log WHERE company_id = $1', [testCompanyId]);

            // Create job logs
            await pool.query(`
                INSERT INTO bank_job_log (id, company_id, bank_code, kind, detail, success)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, ['job-1', testCompanyId, testBankCode, 'DISPATCH', 'Test dispatch', true]);

            await pool.query(`
                INSERT INTO bank_job_log (id, company_id, bank_code, kind, detail, success)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, ['job-2', testCompanyId, testBankCode, 'FETCH', 'Test fetch', false]);
        });

        it('should retrieve job logs', async () => {
            const req = new NextRequest(`http://localhost/api/payments/bank/jobs?bank_code=${testBankCode}`);

            // Mock auth and capabilities
            vi.mock('@/lib/auth', () => ({
                requireAuth: vi.fn().mockResolvedValue({
                    company_id: 'test-company-123',
                    user_id: 'test-user-123',
                    api_key_id: 'test-api-key-123'
                })
            }));
            vi.mock('@/lib/rbac', () => ({
                requireCapability: vi.fn().mockResolvedValue(true)
            }));

            const response = await getJobs(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(2);
        });

        it('should filter job logs by kind', async () => {
            const req = new NextRequest(`http://localhost/api/payments/bank/jobs?bank_code=${testBankCode}&kind=DISPATCH`);

            // Mock auth and capabilities
            vi.mock('@/lib/auth', () => ({
                requireAuth: vi.fn().mockResolvedValue({
                    company_id: 'test-company-123',
                    user_id: 'test-user-123',
                    api_key_id: 'test-api-key-123'
                })
            }));
            vi.mock('@/lib/rbac', () => ({
                requireCapability: vi.fn().mockResolvedValue(true)
            }));

            const response = await getJobs(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(1);
            expect(data[0].kind).toBe('DISPATCH');
        });
    });
});
