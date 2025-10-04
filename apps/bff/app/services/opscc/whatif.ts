import { db, pool } from "@/lib/db";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import {
    whatifScenario,
    kpiSnapshot
} from "@aibos/db-adapter/schema";
import type {
    WhatIfRunReq,
    WhatIfRunResponse,
    WhatIfScenario,
    BoardType
} from "@aibos/contracts";
import { logLine } from "@/lib/log";

export class WhatIfService {
    constructor(private dbInstance = db) { }

    /**
     * Run a what-if simulation
     */
    async runSimulation(
        companyId: string,
        request: WhatIfRunReq
    ): Promise<WhatIfRunResponse> {
        try {
            const executedAt = new Date().toISOString();

            // Get baseline data
            const baseline = await this.getBaselineData(companyId, request.board);

            // Run simulation based on type
            let simulation: Record<string, any>;
            let diff: Record<string, any>;

            switch (request.scenario_type) {
                case "AR_UPLIFT":
                    ({ simulation, diff } = await this.runArUpliftSimulation(
                        companyId, request.params, baseline
                    ));
                    break;
                case "AP_DISCOUNT_BUDGET":
                    ({ simulation, diff } = await this.runApDiscountBudgetSimulation(
                        companyId, request.params, baseline
                    ));
                    break;
                case "FX_SHOCK":
                    ({ simulation, diff } = await this.runFxShockSimulation(
                        companyId, request.params, baseline
                    ));
                    break;
                default:
                    throw new Error(`Unknown scenario type: ${request.scenario_type}`);
            }

            // Save scenario if requested
            let scenarioId: string | undefined;
            if (request.save_scenario) {
                scenarioId = await this.saveScenario(companyId, request, baseline, diff);
            }

            return {
                scenario_id: scenarioId,
                baseline,
                simulation,
                diff,
                executed_at: executedAt
            };
        } catch (error) {
            logLine({
                msg: "WhatIfService.runSimulation error",
                companyId, request, error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Get saved scenarios
     */
    async getScenarios(companyId: string, board?: BoardType): Promise<WhatIfScenario[]> {
        try {
            let whereConditions = eq(whatifScenario.company_id, companyId);

            if (board) {
                whereConditions = and(whereConditions, eq(whatifScenario.board, board))!;
            }

            const results = await this.dbInstance
                .select()
                .from(whatifScenario)
                .where(whereConditions)
                .orderBy(desc(whatifScenario.created_at));

            return results.map(r => ({
                ...r,
                created_at: r.created_at.toISOString(),
                updated_at: r.updated_at.toISOString(),
                baseline_at: r.baseline_at.toISOString(),
                params: r.params as Record<string, any>,
                diff: r.diff as Record<string, any> | null
            })) as WhatIfScenario[];
        } catch (error) {
            logLine({
                msg: "WhatIfService.getScenarios error",
                companyId, board, error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Get a specific scenario
     */
    async getScenario(companyId: string, scenarioId: string): Promise<WhatIfScenario | null> {
        try {
            const result = await this.dbInstance
                .select()
                .from(whatifScenario)
                .where(and(
                    eq(whatifScenario.company_id, companyId),
                    eq(whatifScenario.scenario_id, scenarioId)
                ))
                .limit(1);

            const scenarioResult = result[0];
            if (!scenarioResult) return null;

            return {
                ...scenarioResult,
                created_at: scenarioResult.created_at.toISOString(),
                updated_at: scenarioResult.updated_at.toISOString(),
                baseline_at: scenarioResult.baseline_at.toISOString(),
                params: scenarioResult.params as Record<string, any>,
                diff: scenarioResult.diff as Record<string, any> | null
            } as WhatIfScenario;
        } catch (error) {
            logLine({
                msg: "WhatIfService.getScenario error",
                companyId, scenarioId, error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Delete a scenario
     */
    async deleteScenario(companyId: string, scenarioId: string): Promise<void> {
        try {
            await this.dbInstance
                .delete(whatifScenario)
                .where(and(
                    eq(whatifScenario.company_id, companyId),
                    eq(whatifScenario.scenario_id, scenarioId)
                ));
        } catch (error) {
            logLine({
                msg: "WhatIfService.deleteScenario error",
                companyId, scenarioId, error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Get baseline data for a board
     */
    private async getBaselineData(companyId: string, board: BoardType): Promise<Record<string, any>> {
        try {
            // Get latest KPI snapshots for the board
            const snapshots = await this.dbInstance
                .select()
                .from(kpiSnapshot)
                .where(and(
                    eq(kpiSnapshot.company_id, companyId),
                    eq(kpiSnapshot.board, board)
                ))
                .orderBy(desc(kpiSnapshot.ts_utc));

            // Group by KPI and get latest value for each
            const baseline: Record<string, any> = {};
            const seenKpis = new Set<string>();

            for (const snapshot of snapshots) {
                if (!seenKpis.has(snapshot.kpi)) {
                    baseline[snapshot.kpi] = {
                        value: snapshot.value,
                        basis: snapshot.basis,
                        present_ccy: snapshot.present_ccy,
                        ts_utc: snapshot.ts_utc
                    };
                    seenKpis.add(snapshot.kpi);
                }
            }

            return baseline;
        } catch (error) {
            logLine({
                msg: "WhatIfService.getBaselineData error",
                companyId, board, error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Run AR uplift simulation
     */
    private async runArUpliftSimulation(
        companyId: string,
        params: Record<string, any>,
        baseline: Record<string, any>
    ): Promise<{ simulation: Record<string, any>; diff: Record<string, any> }> {
        const { ptp_uplift_pct, dunning_wave_boost_pct, horizon_weeks } = params;

        // Simulate AR uplift impact
        const simulation: Record<string, any> = {
            ...baseline,
            PTP_KEPT_RATE: baseline.PTP_KEPT_RATE?.value * (1 + ptp_uplift_pct / 100) || 0,
            DUNNING_HIT_RATE: baseline.DUNNING_HIT_RATE?.value * (1 + dunning_wave_boost_pct / 100) || 0,
            DSO_DPO_CCC: baseline.DSO_DPO_CCC?.value * (1 - ptp_uplift_pct / 200) || 0, // DSO improves
            LIQUIDITY_RUNWAY_W: baseline.LIQUIDITY_RUNWAY_W?.value * (1 + ptp_uplift_pct / 100) || 0
        };

        const diff: Record<string, any> = {};
        for (const [kpi, value] of Object.entries(simulation)) {
            if (typeof value === 'number' && baseline[kpi]?.value) {
                diff[kpi] = {
                    baseline: baseline[kpi].value,
                    simulation: value,
                    delta: value - baseline[kpi].value,
                    delta_pct: ((value - baseline[kpi].value) / baseline[kpi].value) * 100
                };
            }
        }

        return { simulation, diff };
    }

    /**
     * Run AP discount budget simulation
     */
    private async runApDiscountBudgetSimulation(
        companyId: string,
        params: Record<string, any>,
        baseline: Record<string, any>
    ): Promise<{ simulation: Record<string, any>; diff: Record<string, any> }> {
        const { budget_ccy, limit, horizon_days } = params;

        // Simulate AP discount budget impact
        const simulation: Record<string, any> = {
            ...baseline,
            DISCOUNT_CAPTURE_RATE: Math.min(100, baseline.DISCOUNT_CAPTURE_RATE?.value * 1.2 || 0),
            PAY_RUN_COMMIT_14D: baseline.PAY_RUN_COMMIT_14D?.value * 0.9 || 0, // Reduced due to discounts
            LIQUIDITY_RUNWAY_W: baseline.LIQUIDITY_RUNWAY_W?.value * 1.1 || 0 // Improved due to discounts
        };

        const diff: Record<string, any> = {};
        for (const [kpi, value] of Object.entries(simulation)) {
            if (typeof value === 'number' && baseline[kpi]?.value) {
                diff[kpi] = {
                    baseline: baseline[kpi].value,
                    simulation: value,
                    delta: value - baseline[kpi].value,
                    delta_pct: ((value - baseline[kpi].value) / baseline[kpi].value) * 100
                };
            }
        }

        return { simulation, diff };
    }

    /**
     * Run FX shock simulation
     */
    private async runFxShockSimulation(
        companyId: string,
        params: Record<string, any>,
        baseline: Record<string, any>
    ): Promise<{ simulation: Record<string, any>; diff: Record<string, any> }> {
        const { pairs } = params;

        // Simulate FX shock impact
        const simulation: Record<string, any> = {
            ...baseline,
            FX_EXPOSURE_BY_CCY: baseline.FX_EXPOSURE_BY_CCY?.value * 1.5 || 0, // Increased exposure
            LIQUIDITY_RUNWAY_W: baseline.LIQUIDITY_RUNWAY_W?.value * 0.95 || 0 // Slightly reduced due to FX impact
        };

        const diff: Record<string, any> = {};
        for (const [kpi, value] of Object.entries(simulation)) {
            if (typeof value === 'number' && baseline[kpi]?.value) {
                diff[kpi] = {
                    baseline: baseline[kpi].value,
                    simulation: value,
                    delta: value - baseline[kpi].value,
                    delta_pct: ((value - baseline[kpi].value) / baseline[kpi].value) * 100
                };
            }
        }

        return { simulation, diff };
    }

    /**
     * Save scenario
     */
    private async saveScenario(
        companyId: string,
        request: WhatIfRunReq,
        baseline: Record<string, any>,
        diff: Record<string, any>
    ): Promise<string> {
        try {
            const scenarioId = crypto.randomUUID();
            const name = `${request.scenario_type} - ${new Date().toLocaleDateString()}`;

            await this.dbInstance
                .insert(whatifScenario)
                .values({
                    company_id: companyId,
                    board: request.board,
                    scenario_id: scenarioId,
                    name,
                    description: `What-if simulation: ${request.scenario_type}`,
                    params: request.params,
                    baseline_at: new Date(),
                    diff
                });

            return scenarioId;
        } catch (error) {
            logLine({
                msg: "WhatIfService.saveScenario error",
                companyId, request, error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
}
