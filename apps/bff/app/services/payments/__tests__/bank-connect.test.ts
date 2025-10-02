import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ulid } from 'ulid';
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
import { testIds } from './utils/ids';
import { cleanCompany } from './utils/cleanup';
import { ensureBankProfile, ensureExportedRun, seedPayLines } from './utils/fixtures';

describe('Bank Connectivity Services', () => {
    let ids: ReturnType<typeof testIds>;

    beforeEach(async () => {
        ids = testIds(expect.getState().currentTestName!);
        await cleanCompany(ids.companyId);
    });

    describe('Bank Profile Management', () => {
        it('should create a new bank profile', async () => {
            const profileData = {
                bank_code: ids.bankCode,
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

            const profile = await upsertBankProfile(ids.companyId, profileData, 'test-user');

            expect(profile.companyId).toBe(ids.companyId);
            expect(profile.bankCode).toBe(ids.bankCode);
            expect(profile.kind).toBe('SFTP');
            expect(profile.active).toBe(true);
        });

        it('should update an existing bank profile', async () => {
            // Create initial profile
            const initialData = {
                bank_code: ids.bankCode,
                kind: 'SFTP' as const,
                config: { host: 'old.host', port: 22, username: 'testuser', key_ref: 'TEST_KEY' },
                active: true
            };
            await upsertBankProfile(ids.companyId, initialData, 'test-user');

            // Update profile
            const updatedData = {
                bank_code: ids.bankCode,
                kind: 'SFTP' as const,
                config: { host: 'new.host', port: 22, username: 'testuser', key_ref: 'TEST_KEY' },
                active: false
            };
            const updatedProfile = await upsertBankProfile(ids.companyId, updatedData, 'test-user');

            expect(updatedProfile.config.host).toBe('new.host');
            expect(updatedProfile.active).toBe(false);
        });

        it('should validate SFTP config requirements', async () => {
            const invalidData = {
                bank_code: ids.bankCode,
                kind: 'SFTP' as const,
                config: { host: 'sftp.hsbc.my' }, // Missing required fields
                active: true
            };

            await expect(upsertBankProfile(ids.companyId, invalidData, 'test-user'))
                .rejects.toThrow('SFTP config missing required fields');
        });

        it('should validate API config requirements', async () => {
            const invalidData = {
                bank_code: ids.bankCode,
                kind: 'API' as const,
                config: { api_base: 'https://api.hsbc.my' }, // Missing required fields
                active: true
            };

            await expect(upsertBankProfile(ids.companyId, invalidData, 'test-user'))
                .rejects.toThrow('API config missing required fields');
        });

        it('should retrieve bank profile by company and bank code', async () => {
            const profileData = {
                bank_code: ids.bankCode,
                kind: 'SFTP' as const,
                config: { host: 'sftp.hsbc.my', port: 22, username: 'testuser', key_ref: 'TEST_KEY' },
                active: true
            };
            await upsertBankProfile(ids.companyId, profileData, 'test-user');

            const profile = await getBankProfile(ids.companyId, ids.bankCode);

            expect(profile).toBeDefined();
            expect(profile?.companyId).toBe(ids.companyId);
            expect(profile?.bankCode).toBe(ids.bankCode);
        });

        it('should return null for non-existent profile', async () => {
            const profile = await getBankProfile(ids.companyId, 'NONEXISTENT');
            expect(profile).toBeNull();
        });

        it('should list all bank profiles for a company', async () => {
            // Create multiple profiles
            await upsertBankProfile(ids.companyId, {
                bank_code: 'HSBC-MY',
                kind: 'SFTP',
                config: { host: 'sftp.hsbc.my', port: 22, username: 'testuser', key_ref: 'TEST_KEY' },
                active: true
            }, 'test-user');

            await upsertBankProfile(ids.companyId, {
                bank_code: 'DBS-SG',
                kind: 'API',
                config: { api_base: 'https://api.dbs.sg', auth_ref: 'DBS_AUTH' },
                active: true
            }, 'test-user');

            const profiles = await listBankProfiles(ids.companyId);

            expect(profiles).toHaveLength(2);
            expect(profiles.map(p => p.bankCode)).toContain('HSBC-MY');
            expect(profiles.map(p => p.bankCode)).toContain('DBS-SG');
        });
    });

    describe.sequential('Payment Dispatch', () => {
        beforeEach(async () => {
            await ensureBankProfile({ companyId: ids.companyId, bankCode: ids.bankCode });
            await ensureExportedRun({ companyId: ids.companyId, runId: ids.runId });
            await seedPayLines({ companyId: ids.companyId, runId: ids.runId, invoiceIds: [ids.invA] });
        });

        it('should dispatch payment run successfully', async () => {
            const dispatchData = {
                run_id: ids.runId,
                bank_code: ids.bankCode,
                dry_run: false
            };

            const outbox = await dispatchPaymentRun(ids.companyId, dispatchData);

            expect(outbox.companyId).toBe(ids.companyId);
            expect(outbox.runId).toBe(ids.runId);
            expect(outbox.bankCode).toBe(ids.bankCode);
            expect(outbox.status).toBe('queued');
            expect(outbox.filename).toContain(`PAIN001_${ids.runId}`);
            expect(outbox.payload).toContain('<?xml version="1.0"');
        });

        it('should be idempotent for same run and checksum', async () => {
            const dispatchData = {
                run_id: ids.runId,
                bank_code: ids.bankCode,
                dry_run: false
            };

            const outbox1 = await dispatchPaymentRun(ids.companyId, dispatchData);
            const outbox2 = await dispatchPaymentRun(ids.companyId, dispatchData);

            expect(outbox1.id).toBe(outbox2.id);
        });

        it('should reject dispatch for non-exported run', async () => {
            // Update run status to approved
            await pool.query(`
                UPDATE ap_pay_run SET status = 'approved' WHERE id = $1
            `, [ids.runId]);

            const dispatchData = {
                run_id: ids.runId,
                bank_code: ids.bankCode,
                dry_run: false
            };

            await expect(dispatchPaymentRun(ids.companyId, dispatchData))
                .rejects.toThrow("Run status must be 'exported'");
        });

        it('should reject dispatch for inactive bank profile', async () => {
            // Deactivate bank profile
            await pool.query(`
                UPDATE bank_conn_profile SET active = false WHERE company_id = $1 AND bank_code = $2
            `, [ids.companyId, ids.bankCode]);

            const dispatchData = {
                run_id: ids.runId,
                bank_code: ids.bankCode,
                dry_run: false
            };

            await expect(dispatchPaymentRun(ids.companyId, dispatchData))
                .rejects.toThrow('Bank profile not found or inactive');
        });
    });

    describe.sequential('Bank File Fetching', () => {
        beforeEach(async () => {
            await ensureBankProfile({ companyId: ids.companyId, bankCode: ids.bankCode });
        });

        it('should fetch bank files successfully', async () => {
            const fetchData = {
                bank_code: ids.bankCode,
                channel: 'pain002' as const,
                max_files: 10
            };

            const result = await fetchBankFiles(ids.companyId, fetchData);

            expect(result.processed).toBeDefined();
            expect(result.errors).toBeDefined();
            expect(Array.isArray(result.errors)).toBe(true);
        });

        it('should handle fetch errors gracefully', async () => {
            const fetchData = {
                bank_code: 'INVALID-BANK',
                channel: 'pain002' as const,
                max_files: 10
            };

            await expect(fetchBankFiles(ids.companyId, fetchData))
                .rejects.toThrow('Bank profile not found or inactive');
        });
    });

    describe.sequential('Reason Code Normalization', () => {
        beforeEach(async () => {
            await ensureBankProfile({ companyId: ids.companyId, bankCode: ids.bankCode });
        });

        it('should create reason normalization mapping', async () => {
            const reasonData = {
                bank_code: ids.bankCode,
                code: 'ACCP',
                norm_status: 'ack' as const,
                norm_label: 'Accepted'
            };

            const reasonNorm = await upsertReasonNorm(reasonData);

            expect(reasonNorm.bankCode).toBe(ids.bankCode);
            expect(reasonNorm.code).toBe('ACCP');
            expect(reasonNorm.normStatus).toBe('ack');
            expect(reasonNorm.normLabel).toBe('Accepted');
        });

        it('should update existing reason normalization', async () => {
            // Create initial mapping
            await upsertReasonNorm({
                bank_code: ids.bankCode,
                code: 'ACCP',
                norm_status: 'ack',
                norm_label: 'Accepted'
            });

            // Update mapping
            const updatedReason = await upsertReasonNorm({
                bank_code: ids.bankCode,
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
                bank_code: ids.bankCode,
                code: 'RJCT',
                norm_status: 'exec_fail',
                norm_label: 'Rejected'
            });

            // Test normalization
            const normalizedStatus = await normalizeReasonCode(ids.bankCode, 'RJCT', 'unknown');
            expect(normalizedStatus).toBe('exec_fail');

            // Test fallback for unknown codes
            const fallbackStatus = await normalizeReasonCode(ids.bankCode, 'UNKNOWN', 'ack');
            expect(fallbackStatus).toBe('ack');
        });
    });

    describe.sequential('Job Logging', () => {
        beforeEach(async () => {
            await ensureBankProfile({ companyId: ids.companyId, bankCode: ids.bankCode });
        });

        it('should log bank job successfully', async () => {
            const jobLog = await logBankJob(
                ids.companyId,
                ids.bankCode,
                'DISPATCH',
                'Test dispatch job',
                JSON.stringify({ test: 'data' }),
                true
            );

            expect(jobLog.companyId).toBe(ids.companyId);
            expect(jobLog.bankCode).toBe(ids.bankCode);
            expect(jobLog.kind).toBe('DISPATCH');
            expect(jobLog.detail).toBe('Test dispatch job');
            expect(jobLog.success).toBe(true);
        });

        it('should retrieve bank job logs', async () => {
            // Create multiple job logs
            await logBankJob(ids.companyId, ids.bankCode, 'DISPATCH', 'Job 1', undefined, true);
            await logBankJob(ids.companyId, ids.bankCode, 'FETCH', 'Job 2', undefined, false);

            const logs = await getBankJobLogs(ids.companyId, ids.bankCode);

            expect(logs).toHaveLength(2);
            expect(logs[0]?.kind).toBe('FETCH'); // Most recent first
            expect(logs[1]?.kind).toBe('DISPATCH');
        });

        it('should filter job logs by kind', async () => {
            // Create job logs of different kinds
            await logBankJob(ids.companyId, ids.bankCode, 'DISPATCH', 'Dispatch job', undefined, true);
            await logBankJob(ids.companyId, ids.bankCode, 'FETCH', 'Fetch job', undefined, true);

            const dispatchLogs = await getBankJobLogs(ids.companyId, ids.bankCode, 'DISPATCH');
            const fetchLogs = await getBankJobLogs(ids.companyId, ids.bankCode, 'FETCH');

            expect(dispatchLogs).toHaveLength(1);
            expect(dispatchLogs[0]?.kind).toBe('DISPATCH');
            expect(fetchLogs).toHaveLength(1);
            expect(fetchLogs[0]?.kind).toBe('FETCH');
        });
    });

    describe.sequential('State Machine Processing', () => {
        beforeEach(async () => {
            await ensureBankProfile({ companyId: ids.companyId, bankCode: ids.bankCode });
            await ensureExportedRun({ companyId: ids.companyId, runId: ids.runId });
            await seedPayLines({ companyId: ids.companyId, runId: ids.runId, invoiceIds: [ids.invA, ids.invB] });
        });

        it('should process acknowledgment mappings', async () => {
            // Create bank acknowledgment
            const ackId = ulid();
            await pool.query(`
                INSERT INTO bank_ack (id, company_id, bank_code, ack_kind, filename, payload, uniq_hash)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [ackId, ids.companyId, ids.bankCode, 'pain002', 'test.xml', '<xml>test</xml>', 'test-hash']);

            // Create acknowledgment mapping
            await pool.query(`
                INSERT INTO bank_ack_map (id, ack_id, run_id, line_id, status, reason_code, reason_label)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [ulid(), ackId, ids.runId, ids.invA, 'ack', 'ACCP', 'Accepted']);

            await processAckMappings(ids.companyId);

            // Check that run was acknowledged
            const { rows } = await pool.query(`
                SELECT acknowledged_at FROM ap_pay_run WHERE id = $1
            `, [ids.runId]);

            expect(rows).toHaveLength(1);
            expect(rows[0].acknowledged_at).not.toBeNull();
        });

        it('should handle execution success mappings', async () => {
            // Update line status to paid
            await pool.query(`
                UPDATE ap_pay_line SET status = 'paid' WHERE run_id = $1
            `, [ids.runId]);

            // Create bank acknowledgment
            const ackId = ulid();
            await pool.query(`
                INSERT INTO bank_ack (id, company_id, bank_code, ack_kind, filename, payload, uniq_hash)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [ackId, ids.companyId, ids.bankCode, 'camt054', 'test.xml', '<xml>test</xml>', 'test-hash']);

            // Create execution success mapping
            await pool.query(`
                INSERT INTO bank_ack_map (id, ack_id, run_id, line_id, status, reason_code, reason_label)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [ulid(), ackId, ids.runId, ids.invA, 'exec_ok', 'ACSC', 'AcceptedSettlementCompleted']);

            await processAckMappings(ids.companyId);

            // Check that run was executed
            const { rows } = await pool.query(`
                SELECT status FROM ap_pay_run WHERE id = $1
            `, [ids.runId]);

            expect(rows[0].status).toBe('executed');
        });

        it('should handle execution failure mappings', async () => {
            // Create bank acknowledgment
            const ackId = ulid();
            await pool.query(`
                INSERT INTO bank_ack (id, company_id, bank_code, ack_kind, filename, payload, uniq_hash)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [ackId, ids.companyId, ids.bankCode, 'pain002', 'test.xml', '<xml>test</xml>', 'test-hash']);

            // Create execution failure mapping
            await pool.query(`
                INSERT INTO bank_ack_map (id, ack_id, run_id, line_id, status, reason_code, reason_label)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [ulid(), ackId, ids.runId, ids.invA, 'exec_fail', 'RJCT', 'Rejected']);

            await processAckMappings(ids.companyId);

            // Check that run was failed
            const { rows } = await pool.query(`
                SELECT status, failed_reason FROM ap_pay_run WHERE id = $1
            `, [ids.runId]);

            expect(rows[0].status).toBe('failed');
            expect(rows[0].failed_reason).toBe('Rejected');
        });
    });
});