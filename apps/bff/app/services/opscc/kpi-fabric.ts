import { db, pool } from "@/lib/db";
import { eq, and, desc, asc, sql, gte, lte, inArray } from "drizzle-orm";
import {
    kpiSnapshot,
    kpiTileConfig,
    boardConfig,
    kpiRefreshLog
} from "@aibos/db-adapter/schema";
import type {
    OpsccKpiQuery,
    BoardType,
    KpiBasis,
    KpiSnapshotResponse,
    BoardTileResponse,
    BoardSummaryResponse
} from "@aibos/contracts";
import { logLine } from "@/lib/log";

export class KpiFabricService {
    constructor(private dbInstance = db) { }

    /**
     * Compute a single KPI value for a company/board/kpi combination
     */
    async computeKpi(
        companyId: string,
        board: BoardType,
        kpi: string,
        options: { present?: string } = {}
    ): Promise<KpiSnapshotResponse | null> {
        const present = options.present || "USD";

        try {
            let value: number | null = null;
            let num: number | null = null;
            let den: number | null = null;
            let meta: Record<string, any> | null = null;
            const basis: KpiBasis = "ACTUAL";

            // Compute KPI based on board and KPI code
            switch (board) {
                case "EXEC":
                    value = await this.computeExecKpi(kpi, companyId, present);
                    break;
                case "TREASURY":
                    value = await this.computeTreasuryKpi(kpi, companyId, present);
                    break;
                case "AR":
                    value = await this.computeArKpi(kpi, companyId, present);
                    break;
                case "CLOSE":
                    value = await this.computeCloseKpi(kpi, companyId, present);
                    break;
                default:
                    throw new Error(`Unknown board: ${board}`);
            }

            // Store snapshot
            const snapshot = await this.dbInstance.insert(kpiSnapshot).values({
                company_id: companyId,
                board,
                kpi,
                value: value?.toString() || null,
                num,
                den,
                meta,
                present_ccy: present,
                basis
            }).returning();

            return snapshot[0] as unknown as KpiSnapshotResponse;
        } catch (error) {
            logLine({
                msg: "KpiFabricService.computeKpi error",
                companyId, board, kpi, error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Compute all KPIs for a board
     */
    async computeBoard(
        companyId: string,
        board: BoardType,
        options: { present?: string } = {}
    ): Promise<BoardSummaryResponse> {
        const present = options.present || "USD";

        try {
            // Get board configuration
            const boardConfigResult = await this.dbInstance
                .select()
                .from(boardConfig)
                .where(and(
                    eq(boardConfig.company_id, companyId),
                    eq(boardConfig.board, board)
                ))
                .limit(1);

            if (boardConfigResult.length === 0) {
                throw new Error(`Board config not found for ${board}`);
            }

            const config = boardConfigResult[0];

            // Get tile configurations
            const tiles = await this.dbInstance
                .select()
                .from(kpiTileConfig)
                .where(and(
                    eq(kpiTileConfig.company_id, companyId),
                    eq(kpiTileConfig.board, board)
                ))
                .orderBy(asc(kpiTileConfig.order_no));

            // Compute KPIs for each tile
            const tileResults: BoardTileResponse[] = [];
            for (const tile of tiles) {
                try {
                    const snapshot = await this.computeKpi(companyId, board, tile.kpi, { present });
                    tileResults.push({
                        tile_id: tile.tile_id,
                        kpi: tile.kpi,
                        viz: tile.viz,
                        format: tile.format,
                        targets: tile.targets as Record<string, any> | null,
                        order_no: tile.order_no,
                        board_name: config?.name || "",
                        board_description: config?.description || "",
                        default_present_ccy: config?.default_present_ccy || "USD",
                        value: snapshot?.value || null,
                        last_updated: snapshot?.ts_utc || null,
                        basis: snapshot?.basis || null
                    });
                } catch (error) {
                    logLine({
                        msg: "KpiFabricService.computeBoard tile error",
                        companyId, board, tile: tile.tile_id, error: error instanceof Error ? error.message : String(error)
                    });
                    // Continue with other tiles even if one fails
                }
            }

            return {
                board,
                name: config?.name || "",
                description: config?.description || "",
                default_present_ccy: config?.default_present_ccy || "USD",
                tiles: tileResults,
                last_refreshed: new Date().toISOString()
            };
        } catch (error) {
            logLine({
                msg: "KpiFabricService.computeBoard error",
                companyId, board, error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Get latest KPI snapshots for a query
     */
    async getKpiSnapshots(query: OpsccKpiQuery & { companyId: string }): Promise<KpiSnapshotResponse[]> {
        try {
            let whereConditions = and(
                eq(kpiSnapshot.company_id, query.companyId),
                eq(kpiSnapshot.board, query.board)
            );

            if (query.kpi) {
                whereConditions = and(whereConditions, eq(kpiSnapshot.kpi, query.kpi));
            }

            const snapshots = await this.dbInstance
                .select()
                .from(kpiSnapshot)
                .where(whereConditions)
                .orderBy(desc(kpiSnapshot.ts_utc))
                .limit(query.limit);

            return snapshots as unknown as KpiSnapshotResponse[];
        } catch (error) {
            logLine({
                msg: "KpiFabricService.getKpiSnapshots error",
                query, error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }

    /**
     * Refresh materialized views and log the operation
     */
    async refreshMaterializedViews(companyId: string): Promise<void> {
        const views = [
            "kpi_mv_cashflow",
            "kpi_mv_ar_aging",
            "kpi_mv_treasury",
            "kpi_mv_close_controls",
            "kpi_mv_fx_exposure"
        ];

        for (const mvName of views) {
            const startTime = Date.now();
            try {
                await this.dbInstance.execute(sql`REFRESH MATERIALIZED VIEW ${sql.identifier(mvName)}`);
                const duration = Date.now() - startTime;

                await this.dbInstance.insert(kpiRefreshLog).values({
                    company_id: companyId,
                    mv_name: mvName,
                    status: "SUCCESS",
                    duration_ms: duration
                });
            } catch (error) {
                const duration = Date.now() - startTime;

                await this.dbInstance.insert(kpiRefreshLog).values({
                    company_id: companyId,
                    mv_name: mvName,
                    status: "ERROR",
                    duration_ms: duration,
                    error_message: error instanceof Error ? error.message : String(error)
                });

                logLine({
                    msg: "KpiFabricService.refreshMaterializedViews error",
                    companyId, mvName, error: error instanceof Error ? error.message : String(error)
                });
            }
        }
    }

    // Private methods for computing specific KPIs

    private async computeExecKpi(kpi: string, companyId: string, present: string): Promise<number | null> {
        switch (kpi) {
            case "LIQUIDITY_RUNWAY_W":
                return await this.computeLiquidityRunway(companyId);
            case "CASH_BURN_4W":
                return await this.computeCashBurn(companyId, present);
            case "FORECAST_ACCURACY_CASH_30D":
                return await this.computeForecastAccuracy(companyId);
            case "DSO_DPO_CCC":
                return await this.computeDSO(companyId);
            case "CLOSE_PROGRESS":
                return await this.computeCloseProgress(companyId);
            case "CONTROL_PASS_RATE":
                return await this.computeControlPassRate(companyId);
            case "UAR_COMPLETION":
                return await this.computeUarCompletion(companyId);
            default:
                return null;
        }
    }

    private async computeTreasuryKpi(kpi: string, companyId: string, present: string): Promise<number | null> {
        switch (kpi) {
            case "PAY_RUN_COMMIT_14D":
                return await this.computeCommittedPayments(companyId, present, 14);
            case "DISCOUNT_CAPTURE_RATE":
                return await this.computeDiscountCaptureRate(companyId);
            case "BANK_ACK_LAG_H":
                return await this.computeBankAckLag(companyId);
            case "FX_EXPOSURE_BY_CCY":
                return await this.computeFxExposure(companyId, present);
            default:
                return null;
        }
    }

    private async computeArKpi(kpi: string, companyId: string, present: string): Promise<number | null> {
        switch (kpi) {
            case "PTP_AT_RISK":
                return await this.computePtpAtRisk(companyId, present);
            case "PTP_KEPT_RATE":
                return await this.computePtpKeptRate(companyId);
            case "DUNNING_HIT_RATE":
                return await this.computeDunningHitRate(companyId);
            case "AUTO_MATCH_RATE":
                return await this.computeAutoMatchRate(companyId);
            case "SLIPPAGE_VS_PROMISE":
                return await this.computeSlippageVsPromise(companyId);
            default:
                return null;
        }
    }

    private async computeCloseKpi(kpi: string, companyId: string, present: string): Promise<number | null> {
        switch (kpi) {
            case "ACCRUAL_COVERAGE":
                return await this.computeAccrualCoverage(companyId);
            case "FLUX_COMMENT_COMPLETION":
                return await this.computeFluxCommentCompletion(companyId);
            case "EVIDENCE_FRESHNESS":
                return await this.computeEvidenceFreshness(companyId);
            case "SOX_STATUS":
                return await this.computeSoxStatus(companyId);
            case "EXCEPTIONS_OPEN":
                return await this.computeExceptionsOpen(companyId);
            default:
                return null;
        }
    }

    // Placeholder implementations for KPI calculations
    // These would be implemented with actual business logic

    private async computeLiquidityRunway(companyId: string): Promise<number | null> {
        // TODO: Implement liquidity runway calculation
        return 12.5; // Placeholder
    }

    private async computeCashBurn(companyId: string, present: string): Promise<number | null> {
        // TODO: Implement cash burn calculation
        return -50000; // Placeholder
    }

    private async computeForecastAccuracy(companyId: string): Promise<number | null> {
        // TODO: Implement forecast accuracy calculation
        return 92.5; // Placeholder
    }

    private async computeDSO(companyId: string): Promise<number | null> {
        // TODO: Implement DSO calculation
        return 28.5; // Placeholder
    }

    private async computeCloseProgress(companyId: string): Promise<number | null> {
        // TODO: Implement close progress calculation
        return 85.0; // Placeholder
    }

    private async computeControlPassRate(companyId: string): Promise<number | null> {
        // TODO: Implement control pass rate calculation
        return 96.8; // Placeholder
    }

    private async computeUarCompletion(companyId: string): Promise<number | null> {
        // TODO: Implement UAR completion calculation
        return 100.0; // Placeholder
    }

    private async computeCommittedPayments(companyId: string, present: string, days: number): Promise<number | null> {
        // TODO: Implement committed payments calculation
        return 150000; // Placeholder
    }

    private async computeDiscountCaptureRate(companyId: string): Promise<number | null> {
        // TODO: Implement discount capture rate calculation
        return 78.5; // Placeholder
    }

    private async computeBankAckLag(companyId: string): Promise<number | null> {
        // TODO: Implement bank ack lag calculation
        return 2.5; // Placeholder
    }

    private async computeFxExposure(companyId: string, present: string): Promise<number | null> {
        // TODO: Implement FX exposure calculation
        return 25000; // Placeholder
    }

    private async computePtpAtRisk(companyId: string, present: string): Promise<number | null> {
        // TODO: Implement PTP at risk calculation
        return 75000; // Placeholder
    }

    private async computePtpKeptRate(companyId: string): Promise<number | null> {
        // TODO: Implement PTP kept rate calculation
        return 88.2; // Placeholder
    }

    private async computeDunningHitRate(companyId: string): Promise<number | null> {
        // TODO: Implement dunning hit rate calculation
        return 72.5; // Placeholder
    }

    private async computeAutoMatchRate(companyId: string): Promise<number | null> {
        // TODO: Implement auto match rate calculation
        return 94.8; // Placeholder
    }

    private async computeSlippageVsPromise(companyId: string): Promise<number | null> {
        // TODO: Implement slippage vs promise calculation
        return 5.2; // Placeholder
    }

    private async computeAccrualCoverage(companyId: string): Promise<number | null> {
        // TODO: Implement accrual coverage calculation
        return 95.5; // Placeholder
    }

    private async computeFluxCommentCompletion(companyId: string): Promise<number | null> {
        // TODO: Implement flux comment completion calculation
        return 87.3; // Placeholder
    }

    private async computeEvidenceFreshness(companyId: string): Promise<number | null> {
        // TODO: Implement evidence freshness calculation
        return 18.5; // Placeholder
    }

    private async computeSoxStatus(companyId: string): Promise<number | null> {
        // TODO: Implement SOX status calculation
        return 98.7; // Placeholder
    }

    private async computeExceptionsOpen(companyId: string): Promise<number | null> {
        // TODO: Implement exceptions open calculation
        return 3; // Placeholder
    }
}
