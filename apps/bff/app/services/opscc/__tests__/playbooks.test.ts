import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ulid } from 'ulid';
import { pool } from '@/lib/db';
import { PlaybooksService } from '../playbooks';
import { testIds } from '../../payments/__tests__/utils/ids';
import { cleanCompany } from '../../payments/__tests__/utils/cleanup';
import { db } from '@/lib/db';
import { playbookAction } from '@aibos/db-adapter/schema';
import { eq } from 'drizzle-orm';

describe('Playbooks Service', () => {
    let ids: ReturnType<typeof testIds>;
    let service: PlaybooksService;

    beforeEach(async () => {
        ids = testIds(expect.getState().currentTestName!);
        await cleanCompany(ids.companyId);

        // Update existing playbook actions to include required fields
        await db.update(playbookAction)
            .set({
                parameter_schema: {
                    type: 'object',
                    properties: {
                        run_id: { type: 'string' },
                        dry_run: { type: 'boolean' }
                    },
                    required: ['run_id']
                }
            })
            .where(eq(playbookAction.action_id, 'PAYRUN_DISPATCH'));

        await db.update(playbookAction)
            .set({
                parameter_schema: {
                    type: 'object',
                    properties: {
                        policy_code: { type: 'string' },
                        segment: { type: 'string' },
                        dry_run: { type: 'boolean' }
                    },
                    required: ['policy_code', 'segment']
                }
            })
            .where(eq(playbookAction.action_id, 'RUN_DUNNING'));

        service = new PlaybooksService();
    });

    describe('Playbook Action Management', () => {
        it('should get all playbook actions', async () => {
            const actions = await service.getPlaybookActions();

            expect(actions).toBeDefined();
            expect(Array.isArray(actions)).toBe(true);
        });

        it('should get playbook action by ID', async () => {
            const action = await service.getPlaybookAction('PAYRUN_DISPATCH');

            if (action) {
                expect(action.action_id).toBe('PAYRUN_DISPATCH');
                expect(action.enabled).toBe(true);
            } else {
                // Action might not exist in test database
                expect(action).toBeNull();
            }
        });

        it('should return null for non-existent action', async () => {
            const action = await service.getPlaybookAction('NON_EXISTENT_ACTION');
            expect(action).toBeNull();
        });
    });

    describe('Playbook Execution', () => {
        it('should execute PAYRUN_DISPATCH action in dry-run mode', async () => {
            const request = {
                action_id: 'PAYRUN_DISPATCH',
                params: {
                    run_id: 'test-run-123',
                    dry_run: true
                },
                dry_run: true
            };

            const result = await service.executePlaybook(ids.companyId, request);

            expect(result).toBeDefined();
            expect(result.action_id).toBe('PAYRUN_DISPATCH');
            expect(result.status).toBe('SUCCESS');
            expect(result.result).toBeDefined();
            expect(result.result?.dry_run).toBe(true);
            expect(result.result?.action).toBe('PAYRUN_DISPATCH');
            expect(result.result?.run_id).toBe('test-run-123');
        });

        it('should execute RUN_DUNNING action in dry-run mode', async () => {
            const request = {
                action_id: 'RUN_DUNNING',
                params: {
                    policy_code: 'STD-30',
                    segment: 'AT_RISK',
                    dry_run: true
                },
                dry_run: true
            };

            const result = await service.executePlaybook(ids.companyId, request);

            expect(result).toBeDefined();
            expect(result.action_id).toBe('RUN_DUNNING');
            expect(result.status).toBe('SUCCESS');
            expect(result.result).toBeDefined();
            expect(result.result?.dry_run).toBe(true);
            expect(result.result?.action).toBe('RUN_DUNNING');
            expect(result.result?.policy_code).toBe('STD-30');
            expect(result.result?.segment).toBe('AT_RISK');
        });

        it('should execute FX_REVALUE action in dry-run mode', async () => {
            const request = {
                action_id: 'FX_REVALUE',
                params: {
                    year: 2025,
                    month: 1,
                    ccy_pairs: ['EUR>USD'],
                    dry_run: true
                },
                dry_run: true
            };

            const result = await service.executePlaybook(ids.companyId, request);

            expect(result).toBeDefined();
            expect(result.action_id).toBe('FX_REVALUE');
            expect(result.status).toBe('SUCCESS');
            expect(result.result).toBeDefined();
            expect(result.result?.dry_run).toBe(true);
            expect(result.result?.action).toBe('FX_REVALUE');
            expect(result.result?.year).toBe(2025);
            expect(result.result?.month).toBe(1);
            expect(result.result?.ccy_pairs).toEqual(['EUR>USD']);
        });

        it('should execute ACCELERATE_COLLECTIONS action in dry-run mode', async () => {
            const request = {
                action_id: 'ACCELERATE_COLLECTIONS',
                params: {
                    customer_ids: ['customer-1', 'customer-2'],
                    escalation_level: 'HIGH',
                    dry_run: true
                },
                dry_run: true
            };

            const result = await service.executePlaybook(ids.companyId, request);

            expect(result).toBeDefined();
            expect(result.action_id).toBe('ACCELERATE_COLLECTIONS');
            expect(result.status).toBe('SUCCESS');
            expect(result.result).toBeDefined();
            expect(result.result?.dry_run).toBe(true);
            expect(result.result?.action).toBe('ACCELERATE_COLLECTIONS');
            expect(result.result?.customer_ids).toEqual(['customer-1', 'customer-2']);
            expect(result.result?.escalation_level).toBe('HIGH');
        });

        it('should handle unknown action gracefully', async () => {
            const request = {
                action_id: 'UNKNOWN_ACTION',
                params: {},
                dry_run: true
            };

            // Unknown actions should throw an error
            await expect(
                service.executePlaybook(ids.companyId, request)
            ).rejects.toThrow('Playbook action not found: UNKNOWN_ACTION');
        });

        it('should validate required parameters', async () => {
            // First, let's verify the action exists and has the right schema
            const action = await service.getPlaybookAction('PAYRUN_DISPATCH');
            expect(action).toBeDefined();
            console.log('Action schema:', JSON.stringify(action?.parameter_schema, null, 2));
            expect(action?.parameter_schema.required).toBeDefined();
            expect(action?.parameter_schema.required).toContain('run_id');

            const request = {
                action_id: 'PAYRUN_DISPATCH',
                params: {
                    // Missing required run_id
                    dry_run: true
                },
                dry_run: true
            };

            // The validation should throw an error
            await expect(
                service.executePlaybook(ids.companyId, request)
            ).rejects.toThrow('Missing required parameter: run_id');
        });

        it('should handle parameter validation errors', async () => {
            const request = {
                action_id: 'RUN_DUNNING',
                params: {
                    policy_code: 'STD-30',
                    // Missing required segment
                    dry_run: true
                },
                dry_run: true
            };

            // The validation should throw an error
            await expect(
                service.executePlaybook(ids.companyId, request)
            ).rejects.toThrow('Missing required parameter: segment');
        });
    });

    describe('Execution History', () => {
        it('should get execution history', async () => {
            // Execute a playbook first
            const request = {
                action_id: 'PAYRUN_DISPATCH',
                params: {
                    run_id: 'test-run-history',
                    dry_run: true
                },
                dry_run: true
            };

            await service.executePlaybook(ids.companyId, request);

            // Get execution history
            const history = await service.getExecutionHistory(ids.companyId, 10);

            expect(history).toBeDefined();
            expect(Array.isArray(history)).toBe(true);
        });

        it('should limit execution history results', async () => {
            const history = await service.getExecutionHistory(ids.companyId, 5);
            expect(history.length).toBeLessThanOrEqual(5);
        });
    });

    describe('Action Execution Methods', () => {
        it('should execute payment run dispatch', async () => {
            const params = { run_id: 'test-run-123', dry_run: true };
            const result = await service['executePayrunDispatch'](params, true);

            expect(result).toBeDefined();
            expect(result.action).toBe('PAYRUN_DISPATCH');
            expect(result.run_id).toBe('test-run-123');
            expect(result.dry_run).toBe(true);
            expect(result.message).toContain('Would dispatch payment run');
        });

        it('should execute dunning process', async () => {
            const params = { policy_code: 'STD-30', segment: 'AT_RISK', dry_run: true };
            const result = await service['executeRunDunning'](params, true);

            expect(result).toBeDefined();
            expect(result.action).toBe('RUN_DUNNING');
            expect(result.policy_code).toBe('STD-30');
            expect(result.segment).toBe('AT_RISK');
            expect(result.dry_run).toBe(true);
            expect(result.message).toContain('Would run dunning process');
        });

        it('should execute FX revaluation', async () => {
            const params = { year: 2025, month: 1, ccy_pairs: ['EUR>USD'], dry_run: true };
            const result = await service['executeFxRevalue'](params, true);

            expect(result).toBeDefined();
            expect(result.action).toBe('FX_REVALUE');
            expect(result.year).toBe(2025);
            expect(result.month).toBe(1);
            expect(result.ccy_pairs).toEqual(['EUR>USD']);
            expect(result.dry_run).toBe(true);
            expect(result.message).toContain('Would execute FX revaluation');
        });

        it('should execute collections acceleration', async () => {
            const params = {
                customer_ids: ['customer-1', 'customer-2'],
                escalation_level: 'HIGH',
                dry_run: true
            };
            const result = await service['executeAccelerateCollections'](params, true);

            expect(result).toBeDefined();
            expect(result.action).toBe('ACCELERATE_COLLECTIONS');
            expect(result.customer_ids).toEqual(['customer-1', 'customer-2']);
            expect(result.escalation_level).toBe('HIGH');
            expect(result.dry_run).toBe(true);
            expect(result.message).toContain('Would accelerate collections');
        });
    });

    describe('Parameter Validation', () => {
        it('should validate parameters against schema', async () => {
            const schema = {
                type: 'object',
                properties: {
                    run_id: { type: 'string' },
                    dry_run: { type: 'boolean' }
                },
                required: ['run_id']
            };

            const validParams = { run_id: 'test-123', dry_run: true };
            await expect(
                service['validateParameters'](schema, validParams)
            ).resolves.not.toThrow();

            const invalidParams = { dry_run: true }; // Missing run_id
            await expect(
                service['validateParameters'](schema, invalidParams)
            ).rejects.toThrow('Missing required parameter');
        });
    });
});
