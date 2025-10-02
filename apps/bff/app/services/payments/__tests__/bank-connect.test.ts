import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { pool } from '@/lib/db';
import {
    upsertBankProfile,
    getBankProfile,
    listBankProfiles,
    dispatchPaymentRun,
    fetchBankFiles,
    upsertReasonNorm,
    normalizeReasonCode,
    logBankJob,
    getBankJobLogs,
    processOutboxQueue,
    processAckMappings
} from '@/services/payments/bank-connect';

describe('Bank Connectivity Services', () => {
    const testCompanyId = 'test-company-123';
    const testBankCode = 'HSBC-MY';
    const testUserId = 'test-user-123';

    beforeEach(async () => {
        // Clean up test data
        await pool.query('DELETE FROM bank_job_log WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM bank_ack_map WHERE ack_id IN (SELECT id FROM bank_ack WHERE company_id = $1)', [testCompanyId]);
        await pool.query('DELETE FROM bank_ack WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM bank_inbox_audit WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM bank_outbox WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM bank_fetch_cursor WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM bank_reason_norm WHERE bank_code = $1', [testBankCode]);
        await pool.query('DELETE FROM bank_conn_profile WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM ap_pay_run WHERE company_id = $1', [testCompanyId]);
    });

    afterEach(async () => {
        // Clean up test data
        await pool.query('DELETE FROM bank_job_log WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM bank_ack_map WHERE ack_id IN (SELECT id FROM bank_ack WHERE company_id = $1)', [testCompanyId]);
        await pool.query('DELETE FROM bank_ack WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM bank_inbox_audit WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM bank_outbox WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM bank_fetch_cursor WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM bank_reason_norm WHERE bank_code = $1', [testBankCode]);
        await pool.query('DELETE FROM bank_conn_profile WHERE company_id = $1', [testCompanyId]);
        await pool.query('DELETE FROM ap_pay_run WHERE company_id = $1', [testCompanyId]);
    });

    describe('Bank Profile Management', () => {
        it('should create a new bank profile', async () => {
            const profileData = {
                bank_code: testBankCode,
                kind: 'SFTP' as const,
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

            const profile = await upsertBankProfile(testCompanyId, profileData, testUserId);

            expect(profile.companyId).toBe(testCompanyId);
            expect(profile.bankCode).toBe(testBankCode);
            expect(profile.kind).toBe('SFTP');
            expect(profile.active).toBe(true);
            expect(profile.config).toEqual(profileData.config);
        });

        it('should update an existing bank profile', async () => {
            // Create initial profile
            const initialData = {
                bank_code: testBankCode,
                kind: 'SFTP' as const,
                config: { host: 'old.host', port: 22, username: 'old', key_ref: 'old_key' },
                active: true
            };
            await upsertBankProfile(testCompanyId, initialData, testUserId);

            // Update profile
            const updateData = {
                bank_code: testBankCode,
                kind: 'API' as const,
                config: { api_base: 'https://api.hsbc.my', auth_ref: 'HSBC_API_KEY' },
                active: false
            };

            const updatedProfile = await upsertBankProfile(testCompanyId, updateData, testUserId);

            expect(updatedProfile.kind).toBe('API');
            expect(updatedProfile.active).toBe(false);
            expect(updatedProfile.config).toEqual(updateData.config);
        });

        it('should validate SFTP config requirements', async () => {
            const invalidData = {
                bank_code: testBankCode,
                kind: 'SFTP' as const,
                config: { host: 'sftp.hsbc.my' }, // Missing required fields
                active: true
            };

            await expect(upsertBankProfile(testCompanyId, invalidData, testUserId))
                .rejects.toThrow('SFTP config missing required fields');
        });

        it('should validate API config requirements', async () => {
            const invalidData = {
                bank_code: testBankCode,
                kind: 'API' as const,
                config: { api_base: 'https://api.hsbc.my' }, // Missing auth_ref
                active: true
            };

            await expect(upsertBankProfile(testCompanyId, invalidData, testUserId))
                .rejects.toThrow('API config missing required fields');
        });

        it('should retrieve bank profile by company and bank code', async () => {
            const profileData = {
                bank_code: testBankCode,
                kind: 'SFTP' as const,
                config: { host: 'sftp.hsbc.my', port: 22, username: 'acme', key_ref: 'HSBC_SSH_KEY' },
                active: true
            };
            await upsertBankProfile(testCompanyId, profileData, testUserId);

            const profile = await getBankProfile(testCompanyId, testBankCode);

            expect(profile).not.toBeNull();
            expect(profile!.bankCode).toBe(testBankCode);
        });

        it('should return null for non-existent profile', async () => {
            const profile = await getBankProfile(testCompanyId, 'NONEXISTENT');
            expect(profile).toBeNull();
        });

        it('should list all bank profiles for a company', async () => {
            // Create multiple profiles
            await upsertBankProfile(testCompanyId, {
                bank_code: 'HSBC-MY',
                kind: 'SFTP',
                config: { host: 'sftp.hsbc.my', port: 22, username: 'acme', key_ref: 'HSBC_SSH_KEY' },
                active: true
            }, testUserId);

            await upsertBankProfile(testCompanyId, {
                bank_code: 'DBS-SG',
                kind: 'API',
                config: { api_base: 'https://api.dbs.sg', auth_ref: 'DBS_API_KEY' },
                active: true
            }, testUserId);

            const profiles = await listBankProfiles(testCompanyId);

            expect(profiles).toHaveLength(2);
            expect(profiles.map(p => p.bankCode)).toContain('HSBC-MY');
            expect(profiles.map(p => p.bankCode)).toContain('DBS-SG');
        });
    });

    describe('Payment Dispatch', () => {
        beforeEach(async () => {
            // Create bank profile
            await upsertBankProfile(testCompanyId, {
                bank_code: testBankCode,
                kind: 'SFTP',
                config: { host: 'sftp.hsbc.my', port: 22, username: 'acme', key_ref: 'HSBC_SSH_KEY' },
                active: true
            }, testUserId);

            // Create payment run
            await pool.query(`
                INSERT INTO ap_pay_run (id, company_id, year, month, status, ccy, created_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, ['test-run-123', testCompanyId, 2024, 1, 'exported', 'MYR', testUserId]);

            // Create payment lines
            await pool.query(`
                INSERT INTO ap_pay_line (id, run_id, supplier_id, invoice_id, due_date, gross_amount, pay_amount, inv_ccy, pay_ccy, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, ['test-line-123', 'test-run-123', 'supplier-123', 'invoice-123', '2024-01-15', 1000, 1000, 'MYR', 'MYR', 'selected']);
        });

        it('should dispatch payment run successfully', async () => {
            const dispatchData = {
                run_id: 'test-run-123',
                bank_code: testBankCode,
                dry_run: false
            };

            const outbox = await dispatchPaymentRun(testCompanyId, dispatchData);

            expect(outbox.companyId).toBe(testCompanyId);
            expect(outbox.runId).toBe('test-run-123');
            expect(outbox.bankCode).toBe(testBankCode);
            expect(outbox.status).toBe('queued');
            expect(outbox.filename).toContain('PAIN001_test-run-123');
            expect(outbox.payload).toContain('<?xml version="1.0"');
        });

        it('should be idempotent for same run and checksum', async () => {
            const dispatchData = {
                run_id: 'test-run-123',
                bank_code: testBankCode,
                dry_run: false
            };

            const outbox1 = await dispatchPaymentRun(testCompanyId, dispatchData);
            const outbox2 = await dispatchPaymentRun(testCompanyId, dispatchData);

            expect(outbox1.id).toBe(outbox2.id);
        });

        it('should reject dispatch for non-exported run', async () => {
            // Update run status to approved
            await pool.query(`
                UPDATE ap_pay_run SET status = 'approved' WHERE id = $1
            `, ['test-run-123']);

            const dispatchData = {
                run_id: 'test-run-123',
                bank_code: testBankCode,
                dry_run: false
            };

            await expect(dispatchPaymentRun(testCompanyId, dispatchData))
                .rejects.toThrow("Run status must be 'exported'");
        });

        it('should reject dispatch for inactive bank profile', async () => {
            // Deactivate bank profile
            await pool.query(`
                UPDATE bank_conn_profile SET active = false WHERE company_id = $1 AND bank_code = $2
            `, [testCompanyId, testBankCode]);

            const dispatchData = {
                run_id: 'test-run-123',
                bank_code: testBankCode,
                dry_run: false
            };

            await expect(dispatchPaymentRun(testCompanyId, dispatchData))
                .rejects.toThrow('Bank profile not found or inactive');
        });
    });

    describe('Bank File Fetching', () => {
        beforeEach(async () => {
            // Create bank profile
            await upsertBankProfile(testCompanyId, {
                bank_code: testBankCode,
                kind: 'SFTP',
                config: { host: 'sftp.hsbc.my', port: 22, username: 'acme', key_ref: 'HSBC_SSH_KEY' },
                active: true
            }, testUserId);
        });

        it('should fetch bank files successfully', async () => {
            const fetchData = {
                bank_code: testBankCode,
                channel: 'pain002' as const,
                max_files: 10
            };

            const result = await fetchBankFiles(testCompanyId, fetchData);

            expect(result.processed).toBe(0); // Mock implementation returns empty array
            expect(result.errors).toHaveLength(0);
        });

        it('should handle fetch errors gracefully', async () => {
            // Deactivate bank profile to trigger error
            await pool.query(`
                UPDATE bank_conn_profile SET active = false WHERE company_id = $1 AND bank_code = $2
            `, [testCompanyId, testBankCode]);

            const fetchData = {
                bank_code: testBankCode,
                channel: 'pain002' as const,
                max_files: 10
            };

            await expect(fetchBankFiles(testCompanyId, fetchData))
                .rejects.toThrow('Bank profile not found or inactive');
        });
    });

    describe('Reason Code Normalization', () => {
        it('should create reason normalization mapping', async () => {
            const reasonData = {
                bank_code: testBankCode,
                code: 'ACCP',
                norm_status: 'ack' as const,
                norm_label: 'Accepted'
            };

            const reasonNorm = await upsertReasonNorm(reasonData);

            expect(reasonNorm.bankCode).toBe(testBankCode);
            expect(reasonNorm.code).toBe('ACCP');
            expect(reasonNorm.normStatus).toBe('ack');
            expect(reasonNorm.normLabel).toBe('Accepted');
        });

        it('should update existing reason normalization', async () => {
            // Create initial mapping
            await upsertReasonNorm({
                bank_code: testBankCode,
                code: 'ACCP',
                norm_status: 'ack',
                norm_label: 'Accepted'
            });

            // Update mapping
            const updatedReason = await upsertReasonNorm({
                bank_code: testBankCode,
                code: 'ACCP',
                norm_status: 'exec_ok',
                norm_label: 'Accepted and Executed'
            });

            expect(updatedReason.normStatus).toBe('exec_ok');
            expect(updatedReason.normLabel).toBe('Accepted and Executed');
        });

        it('should normalize reason codes', async () => {
            // Create normalization mapping
            await upsertReasonNorm({
                bank_code: testBankCode,
                code: 'RJCT',
                norm_status: 'exec_fail',
                norm_label: 'Rejected'
            });

            const normalizedStatus = await normalizeReasonCode(testBankCode, 'RJCT', 'unknown');
            expect(normalizedStatus).toBe('exec_fail');

            // Test fallback for unknown codes
            const fallbackStatus = await normalizeReasonCode(testBankCode, 'UNKNOWN', 'ack');
            expect(fallbackStatus).toBe('ack');
        });
    });

    describe('Job Logging', () => {
        it('should log bank job successfully', async () => {
            const jobLog = await logBankJob(
                testCompanyId,
                testBankCode,
                'DISPATCH',
                'Test dispatch job',
                JSON.stringify({ test: 'data' }),
                true
            );

            expect(jobLog.companyId).toBe(testCompanyId);
            expect(jobLog.bankCode).toBe(testBankCode);
            expect(jobLog.kind).toBe('DISPATCH');
            expect(jobLog.detail).toBe('Test dispatch job');
            expect(jobLog.success).toBe(true);
        });

        it('should retrieve bank job logs', async () => {
            // Create multiple job logs
            await logBankJob(testCompanyId, testBankCode, 'DISPATCH', 'Job 1', undefined, true);
            await logBankJob(testCompanyId, testBankCode, 'FETCH', 'Job 2', undefined, false);

            const logs = await getBankJobLogs(testCompanyId, testBankCode);

            expect(logs).toHaveLength(2);
            expect(logs[0]?.kind).toBe('FETCH'); // Most recent first
            expect(logs[1]?.kind).toBe('DISPATCH');
        });

        it('should filter job logs by kind', async () => {
            // Create job logs of different kinds
            await logBankJob(testCompanyId, testBankCode, 'DISPATCH', 'Dispatch job', undefined, true);
            await logBankJob(testCompanyId, testBankCode, 'FETCH', 'Fetch job', undefined, true);

            const dispatchLogs = await getBankJobLogs(testCompanyId, testBankCode, 'DISPATCH');
            const fetchLogs = await getBankJobLogs(testCompanyId, testBankCode, 'FETCH');

            expect(dispatchLogs).toHaveLength(1);
            expect(dispatchLogs[0]?.kind).toBe('DISPATCH');
            expect(fetchLogs).toHaveLength(1);
            expect(fetchLogs[0]?.kind).toBe('FETCH');
        });
    });

    describe('State Machine Processing', () => {
        beforeEach(async () => {
            // Create payment run
            await pool.query(`
                INSERT INTO ap_pay_run (id, company_id, year, month, status, ccy, created_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, ['test-run-123', testCompanyId, 2024, 1, 'exported', 'MYR', testUserId]);

            // Create payment lines
            await pool.query(`
                INSERT INTO ap_pay_line (id, run_id, supplier_id, invoice_id, due_date, gross_amount, pay_amount, inv_ccy, pay_ccy, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, ['test-line-123', 'test-run-123', 'supplier-123', 'invoice-123', '2024-01-15', 1000, 1000, 'MYR', 'MYR', 'selected']);
        });

        it('should process acknowledgment mappings', async () => {
            // Create bank acknowledgment
            const ackId = 'test-ack-123';
            await pool.query(`
                INSERT INTO bank_ack (id, company_id, bank_code, ack_kind, filename, payload, uniq_hash)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [ackId, testCompanyId, testBankCode, 'pain002', 'test.xml', '<xml>test</xml>', 'test-hash']);

            // Create acknowledgment mapping
            await pool.query(`
                INSERT INTO bank_ack_map (id, ack_id, run_id, line_id, status, reason_code, reason_label)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, ['test-map-123', ackId, 'test-run-123', 'test-line-123', 'ack', 'ACCP', 'Accepted']);

            await processAckMappings(testCompanyId);

            // Check that run was acknowledged
            const { rows } = await pool.query(`
                SELECT acknowledged_at FROM ap_pay_run WHERE id = $1
            `, ['test-run-123']);

            expect(rows[0].acknowledged_at).not.toBeNull();
        });

        it('should handle execution success mappings', async () => {
            // Update line status to paid
            await pool.query(`
                UPDATE ap_pay_line SET status = 'paid' WHERE run_id = $1
            `, ['test-run-123']);

            // Create bank acknowledgment
            const ackId = 'test-ack-123';
            await pool.query(`
                INSERT INTO bank_ack (id, company_id, bank_code, ack_kind, filename, payload, uniq_hash)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [ackId, testCompanyId, testBankCode, 'camt054', 'test.xml', '<xml>test</xml>', 'test-hash']);

            // Create execution success mapping
            await pool.query(`
                INSERT INTO bank_ack_map (id, ack_id, run_id, line_id, status, reason_code, reason_label)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, ['test-map-123', ackId, 'test-run-123', 'test-line-123', 'exec_ok', 'ACSC', 'AcceptedSettlementCompleted']);

            await processAckMappings(testCompanyId);

            // Check that run was executed
            const { rows } = await pool.query(`
                SELECT status FROM ap_pay_run WHERE id = $1
            `, ['test-run-123']);

            expect(rows[0].status).toBe('executed');
        });

        it('should handle execution failure mappings', async () => {
            // Create bank acknowledgment
            const ackId = 'test-ack-123';
            await pool.query(`
                INSERT INTO bank_ack (id, company_id, bank_code, ack_kind, filename, payload, uniq_hash)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [ackId, testCompanyId, testBankCode, 'pain002', 'test.xml', '<xml>test</xml>', 'test-hash']);

            // Create execution failure mapping
            await pool.query(`
                INSERT INTO bank_ack_map (id, ack_id, run_id, line_id, status, reason_code, reason_label)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, ['test-map-123', ackId, 'test-run-123', 'test-line-123', 'exec_fail', 'RJCT', 'Rejected']);

            await processAckMappings(testCompanyId);

            // Check that run was failed
            const { rows } = await pool.query(`
                SELECT status, failed_reason FROM ap_pay_run WHERE id = $1
            `, ['test-run-123']);

            expect(rows[0].status).toBe('failed');
            expect(rows[0].failed_reason).toBe('Rejected');
        });
    });
});
