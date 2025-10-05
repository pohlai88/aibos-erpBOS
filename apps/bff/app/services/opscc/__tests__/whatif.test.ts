import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ulid } from 'ulid';
import { pool } from '@/lib/db';
import { WhatIfService } from '../whatif';
import { testIds } from '../../payments/__tests__/utils/ids';
import { cleanCompany } from '../../payments/__tests__/utils/cleanup';

describe('What-If Service', () => {
    let ids: ReturnType<typeof testIds>;
    let service: WhatIfService;

    beforeEach(async () => {
        ids = testIds(expect.getState().currentTestName!);
        await cleanCompany(ids.companyId);
        service = new WhatIfService();
    });

    describe('What-If Simulations', () => {
        it('should run AR uplift simulation', async () => {
            const request = {
                board: 'AR' as const,
                scenario_type: 'AR_UPLIFT' as const,
                params: {
                    ptp_uplift_pct: 10,
                    dunning_wave_boost_pct: 15,
                    horizon_weeks: 4
                },
                save_scenario: false
            };

            const result = await service.runSimulation(ids.companyId, request);

            expect(result).toBeDefined();
            expect(result.baseline).toBeDefined();
            expect(result.simulation).toBeDefined();
            expect(result.diff).toBeDefined();
            expect(result.executed_at).toBeDefined();
            expect(result.scenario_id).toBeUndefined(); // Not saved
        });

        it('should run AP discount budget simulation', async () => {
            const request = {
                board: 'TREASURY' as const,
                scenario_type: 'AP_DISCOUNT_BUDGET' as const,
                params: {
                    budget_ccy: 'USD',
                    limit: 50000,
                    horizon_days: 30
                },
                save_scenario: false
            };

            const result = await service.runSimulation(ids.companyId, request);

            expect(result).toBeDefined();
            expect(result.baseline).toBeDefined();
            expect(result.simulation).toBeDefined();
            expect(result.diff).toBeDefined();
            expect(result.executed_at).toBeDefined();
            expect(result.scenario_id).toBeUndefined(); // Not saved
        });

        it('should run FX shock simulation', async () => {
            const request = {
                board: 'TREASURY' as const,
                scenario_type: 'FX_SHOCK' as const,
                params: {
                    pairs: [
                        { ccy: 'EUR', shock_bps: 200 },
                        { ccy: 'GBP', shock_bps: 150 }
                    ]
                },
                save_scenario: false
            };

            const result = await service.runSimulation(ids.companyId, request);

            expect(result).toBeDefined();
            expect(result.baseline).toBeDefined();
            expect(result.simulation).toBeDefined();
            expect(result.diff).toBeDefined();
            expect(result.executed_at).toBeDefined();
            expect(result.scenario_id).toBeUndefined(); // Not saved
        });

        it('should save scenario when requested', async () => {
            const request = {
                board: 'EXEC' as const,
                scenario_type: 'AR_UPLIFT' as const,
                params: {
                    ptp_uplift_pct: 5,
                    dunning_wave_boost_pct: 10,
                    horizon_weeks: 2
                },
                save_scenario: true
            };

            const result = await service.runSimulation(ids.companyId, request);

            expect(result).toBeDefined();
            expect(result.scenario_id).toBeDefined();
            expect(typeof result.scenario_id).toBe('string');
        });

        it('should handle unknown scenario type', async () => {
            const request = {
                board: 'EXEC' as const,
                scenario_type: 'UNKNOWN_SCENARIO' as any,
                params: {},
                save_scenario: false
            };

            await expect(
                service.runSimulation(ids.companyId, request)
            ).rejects.toThrow('Unknown scenario type: UNKNOWN_SCENARIO');
        });
    });

    describe('Scenario Management', () => {
        it('should get all scenarios', async () => {
            const scenarios = await service.getScenarios(ids.companyId);
            expect(scenarios).toBeDefined();
            expect(Array.isArray(scenarios)).toBe(true);
        });

        it('should get scenarios by board', async () => {
            const scenarios = await service.getScenarios(ids.companyId, 'EXEC');
            expect(scenarios).toBeDefined();
            expect(Array.isArray(scenarios)).toBe(true);
        });

        it('should get specific scenario', async () => {
            // First create a scenario
            const request = {
                board: 'AR' as const,
                scenario_type: 'AR_UPLIFT' as const,
                params: {
                    ptp_uplift_pct: 10,
                    dunning_wave_boost_pct: 15,
                    horizon_weeks: 4
                },
                save_scenario: true
            };

            const simulationResult = await service.runSimulation(ids.companyId, request);
            const scenarioId = simulationResult.scenario_id!;

            // Get the scenario
            const scenario = await service.getScenario(ids.companyId, scenarioId);

            expect(scenario).toBeDefined();
            expect(scenario?.scenario_id).toBe(scenarioId);
            expect(scenario?.board).toBe('AR');
            expect(scenario?.name).toContain('AR_UPLIFT');
        });

        it('should return null for non-existent scenario', async () => {
            const scenario = await service.getScenario(ids.companyId, 'non-existent-id');
            expect(scenario).toBeNull();
        });

        it('should delete scenario', async () => {
            // First create a scenario
            const request = {
                board: 'TREASURY' as const,
                scenario_type: 'AP_DISCOUNT_BUDGET' as const,
                params: {
                    budget_ccy: 'USD',
                    limit: 25000,
                    horizon_days: 15
                },
                save_scenario: true
            };

            const simulationResult = await service.runSimulation(ids.companyId, request);
            const scenarioId = simulationResult.scenario_id!;

            // Verify it exists
            const beforeDelete = await service.getScenario(ids.companyId, scenarioId);
            expect(beforeDelete).toBeDefined();

            // Delete it
            await service.deleteScenario(ids.companyId, scenarioId);

            // Verify it's gone
            const afterDelete = await service.getScenario(ids.companyId, scenarioId);
            expect(afterDelete).toBeNull();
        });
    });

    describe('Baseline Data', () => {
        it('should get baseline data for EXEC board', async () => {
            const baseline = await service['getBaselineData'](ids.companyId, 'EXEC');
            expect(baseline).toBeDefined();
            expect(typeof baseline).toBe('object');
        });

        it('should get baseline data for TREASURY board', async () => {
            const baseline = await service['getBaselineData'](ids.companyId, 'TREASURY');
            expect(baseline).toBeDefined();
            expect(typeof baseline).toBe('object');
        });

        it('should get baseline data for AR board', async () => {
            const baseline = await service['getBaselineData'](ids.companyId, 'AR');
            expect(baseline).toBeDefined();
            expect(typeof baseline).toBe('object');
        });

        it('should get baseline data for CLOSE board', async () => {
            const baseline = await service['getBaselineData'](ids.companyId, 'CLOSE');
            expect(baseline).toBeDefined();
            expect(typeof baseline).toBe('object');
        });
    });

    describe('Simulation Calculations', () => {
        it('should run AR uplift simulation calculation', async () => {
            const baseline = {
                PTP_KEPT_RATE: { value: 80 },
                DUNNING_HIT_RATE: { value: 70 },
                DSO_DPO_CCC: { value: 30 },
                LIQUIDITY_RUNWAY_W: { value: 12 }
            };

            const params = {
                ptp_uplift_pct: 10,
                dunning_wave_boost_pct: 15,
                horizon_weeks: 4
            };

            const { simulation, diff } = await service['runArUpliftSimulation'](
                ids.companyId, params, baseline
            );

            expect(simulation).toBeDefined();
            expect(diff).toBeDefined();

            // Check that PTP_KEPT_RATE improved
            expect(simulation.PTP_KEPT_RATE).toBeGreaterThan(baseline.PTP_KEPT_RATE.value);
            expect(diff.PTP_KEPT_RATE?.delta).toBeGreaterThan(0);

            // Check that DSO improved (reduced)
            expect(simulation.DSO_DPO_CCC).toBeLessThan(baseline.DSO_DPO_CCC.value);
            expect(diff.DSO_DPO_CCC?.delta).toBeLessThan(0);
        });

        it('should run AP discount budget simulation calculation', async () => {
            const baseline = {
                DISCOUNT_CAPTURE_RATE: { value: 75 },
                PAY_RUN_COMMIT_14D: { value: 200000 },
                LIQUIDITY_RUNWAY_W: { value: 10 }
            };

            const params = {
                budget_ccy: 'USD',
                limit: 50000,
                horizon_days: 30
            };

            const { simulation, diff } = await service['runApDiscountBudgetSimulation'](
                ids.companyId, params, baseline
            );

            expect(simulation).toBeDefined();
            expect(diff).toBeDefined();

            // Check that discount capture rate improved
            expect(simulation.DISCOUNT_CAPTURE_RATE).toBeGreaterThan(baseline.DISCOUNT_CAPTURE_RATE.value);
            expect(diff.DISCOUNT_CAPTURE_RATE?.delta).toBeGreaterThan(0);

            // Check that liquidity runway improved
            expect(simulation.LIQUIDITY_RUNWAY_W).toBeGreaterThan(baseline.LIQUIDITY_RUNWAY_W.value);
            expect(diff.LIQUIDITY_RUNWAY_W?.delta).toBeGreaterThan(0);
        });

        it('should run FX shock simulation calculation', async () => {
            const baseline = {
                FX_EXPOSURE_BY_CCY: { value: 50000 },
                LIQUIDITY_RUNWAY_W: { value: 12 }
            };

            const params = {
                pairs: [
                    { ccy: 'EUR', shock_bps: 200 },
                    { ccy: 'GBP', shock_bps: 150 }
                ]
            };

            const { simulation, diff } = await service['runFxShockSimulation'](
                ids.companyId, params, baseline
            );

            expect(simulation).toBeDefined();
            expect(diff).toBeDefined();

            // Check that FX exposure increased
            expect(simulation.FX_EXPOSURE_BY_CCY).toBeGreaterThan(baseline.FX_EXPOSURE_BY_CCY.value);
            expect(diff.FX_EXPOSURE_BY_CCY?.delta).toBeGreaterThan(0);

            // Check that liquidity runway decreased slightly
            expect(simulation.LIQUIDITY_RUNWAY_W).toBeLessThan(baseline.LIQUIDITY_RUNWAY_W.value);
            expect(diff.LIQUIDITY_RUNWAY_W?.delta).toBeLessThan(0);
        });
    });

    describe('Scenario Saving', () => {
        it('should save scenario with correct data', async () => {
            const request = {
                board: 'EXEC' as const,
                scenario_type: 'AR_UPLIFT' as const,
                params: {
                    ptp_uplift_pct: 8,
                    dunning_wave_boost_pct: 12,
                    horizon_weeks: 3
                },
                save_scenario: true
            };

            const baseline = { PTP_KEPT_RATE: { value: 80 } };
            const diff = { PTP_KEPT_RATE: { baseline: 80, simulation: 88, delta: 8, delta_pct: 10 } };

            const scenarioId = await service['saveScenario'](ids.companyId, request, baseline, diff);

            expect(scenarioId).toBeDefined();
            expect(typeof scenarioId).toBe('string');

            // Verify the scenario was saved
            const scenario = await service.getScenario(ids.companyId, scenarioId);
            expect(scenario).toBeDefined();
            expect(scenario?.scenario_id).toBe(scenarioId);
            expect(scenario?.board).toBe('EXEC');
            expect(scenario?.params).toEqual(request.params);
            expect(scenario?.diff).toEqual(diff);
        });
    });
});
