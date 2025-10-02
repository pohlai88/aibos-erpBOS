import { pool } from "../../lib/db";

// Simple ULID generator
function generateId(): string {
    return `dp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Types for driver formulas and seasonality
export interface DriverFormula {
    [accountCode: string]: string; // e.g., { "4000": "revenue * 0.6", "5000": "revenue * 0.3" }
}

export interface SeasonalityVector {
    [month: number]: number; // 1-12, normalized to 100%
}

export interface ForecastSimulationParams {
    priceDelta?: number | undefined; // ±% change in price
    volumeDelta?: number | undefined; // ±% change in volume
    fxRate?: number | undefined; // FX rate multiplier
    seasonalityOverride?: SeasonalityVector | undefined;
}

// Driver Profile Service
export async function createDriverProfile(
    companyId: string,
    actor: string,
    input: {
        name: string;
        description?: string | undefined;
        formulaJson: DriverFormula;
        seasonalityJson: SeasonalityVector;
    }
) {
    const id = generateId();
    await pool.query(
        `INSERT INTO driver_profile (id, company_id, name, description, formula_json, seasonality_json, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
            id,
            companyId,
            input.name,
            input.description || null,
            JSON.stringify(input.formulaJson),
            JSON.stringify(input.seasonalityJson),
            actor,
        ]
    );
    return { id };
}

export async function getDriverProfile(companyId: string, profileId: string) {
    const result = await pool.query(
        `SELECT * FROM driver_profile WHERE company_id = $1 AND id = $2`,
        [companyId, profileId]
    );
    return result.rows[0] || null;
}

export async function listDriverProfiles(companyId: string) {
    const result = await pool.query(
        `SELECT * FROM driver_profile WHERE company_id = $1 AND is_active = true ORDER BY created_at DESC`,
        [companyId]
    );
    return result.rows;
}

// Forecast Version Service
export async function createForecastVersion(
    companyId: string,
    actor: string,
    input: {
        code: string;
        label: string;
        year: number;
        driverProfileId?: string | undefined;
    }
) {
    const id = generateId();
    await pool.query(
        `INSERT INTO forecast_version (id, company_id, code, label, year, driver_profile_id, created_by, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
            id,
            companyId,
            input.code,
            input.label,
            input.year,
            input.driverProfileId || null,
            actor,
            actor,
        ]
    );
    return { id };
}

export async function getForecastVersion(companyId: string, versionId: string) {
    const result = await pool.query(
        `SELECT * FROM forecast_version WHERE company_id = $1 AND id = $2`,
        [companyId, versionId]
    );
    return result.rows[0] || null;
}

// Forecast Generation Service
export async function generateForecastFromBudget(
    companyId: string,
    forecastVersionId: string,
    sourceBudgetVersionId: string,
    driverProfileId: string,
    simulationParams?: ForecastSimulationParams
) {
    const startTime = Date.now();

    // Get driver profile
    const profile = await getDriverProfile(companyId, driverProfileId);
    if (!profile) {
        throw new Error("Driver profile not found");
    }

    const formulas = JSON.parse(profile.formula_json) as DriverFormula;
    const seasonality = JSON.parse(profile.seasonality_json) as SeasonalityVector;

    // Get source budget lines
    const budgetResult = await pool.query(
        `SELECT * FROM budget_line WHERE company_id = $1 AND version_id = $2`,
        [companyId, sourceBudgetVersionId]
    );
    const budgetLines = budgetResult.rows;

    // Generate forecast lines
    const forecastLines = [];

    for (const budgetLine of budgetLines) {
        const accountCode = budgetLine.account_code;
        const formula = formulas[accountCode];

        if (!formula) {
            // No driver formula - keep original budget amount
            for (let month = 1; month <= 12; month++) {
                const seasonalFactor = seasonality[month] || 100;
                const amount = Number(budgetLine.amount_base) * (seasonalFactor / 100);

                forecastLines.push({
                    id: generateId(),
                    companyId,
                    versionId: forecastVersionId,
                    accountCode,
                    costCenterCode: budgetLine.cost_center_code,
                    projectCode: budgetLine.project_code,
                    month,
                    amount: amount.toString(),
                    currency: budgetLine.currency || "USD",
                });
            }
        } else {
            // Apply driver formula
            const baseAmount = Number(budgetLine.amount_base);
            const driverAmount = evaluateDriverFormula(formula, baseAmount, simulationParams);

            for (let month = 1; month <= 12; month++) {
                const seasonalFactor = seasonality[month] || 100;
                const amount = driverAmount * (seasonalFactor / 100);

                forecastLines.push({
                    id: generateId(),
                    companyId,
                    versionId: forecastVersionId,
                    accountCode,
                    costCenterCode: budgetLine.cost_center_code,
                    projectCode: budgetLine.project_code,
                    month,
                    amount: amount.toString(),
                    currency: budgetLine.currency || "USD",
                });
            }
        }
    }

    // Insert forecast lines
    if (forecastLines.length > 0) {
        for (const line of forecastLines) {
            await pool.query(
                `INSERT INTO forecast_line (id, company_id, version_id, account_code, cost_center_code, project_code, month, amount, currency)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    line.id,
                    line.companyId,
                    line.versionId,
                    line.accountCode,
                    line.costCenterCode,
                    line.projectCode,
                    line.month,
                    line.amount,
                    line.currency,
                ]
            );
        }
    }

    const duration = Date.now() - startTime;

    // Observability logging
    console.log(JSON.stringify({
        event: "forecast_generated",
        company_id: companyId,
        forecast_version_id: forecastVersionId,
        driver_profile_id: driverProfileId,
        source_budget_version_id: sourceBudgetVersionId,
        lines_processed: forecastLines.length,
        duration_ms: duration,
        simulation_params: simulationParams || null,
        timestamp: new Date().toISOString()
    }));

    return {
        linesGenerated: forecastLines.length,
        versionId: forecastVersionId,
        durationMs: duration,
    };
}

// Driver Formula Evaluation
function evaluateDriverFormula(
    formula: string,
    baseAmount: number,
    simulationParams?: ForecastSimulationParams
): number {
    // Simple formula evaluation for common patterns
    // In production, you'd want a more robust expression evaluator

    let result = baseAmount;

    // Handle common patterns
    if (formula.includes("price * volume")) {
        // Revenue calculation
        const priceMultiplier = simulationParams?.priceDelta ? (1 + simulationParams.priceDelta / 100) : 1;
        const volumeMultiplier = simulationParams?.volumeDelta ? (1 + simulationParams.volumeDelta / 100) : 1;
        result = baseAmount * priceMultiplier * volumeMultiplier;
    } else if (formula.includes("revenue *")) {
        const multiplier = parseFloat(formula.split("revenue *")[1]?.trim() || "1");
        result = baseAmount * multiplier;
    }

    // Apply FX rate if provided
    if (simulationParams?.fxRate) {
        result = result * simulationParams.fxRate;
    }

    return result;
}

// What-If Simulation (no DB writes)
export async function simulateForecast(
    companyId: string,
    sourceBudgetVersionId: string,
    driverProfileId: string,
    simulationParams: ForecastSimulationParams
) {
    const startTime = Date.now();

    const profile = await getDriverProfile(companyId, driverProfileId);
    if (!profile) {
        throw new Error("Driver profile not found");
    }

    const formulas = JSON.parse(profile.formula_json) as DriverFormula;
    const seasonality = JSON.parse(profile.seasonality_json) as SeasonalityVector;

    // Get source budget lines
    const budgetResult = await pool.query(
        `SELECT * FROM budget_line WHERE company_id = $1 AND version_id = $2`,
        [companyId, sourceBudgetVersionId]
    );
    const budgetLines = budgetResult.rows;

    // Generate simulation results (no DB writes)
    const simulationResults = [];

    for (const budgetLine of budgetLines) {
        const accountCode = budgetLine.account_code;
        const formula = formulas[accountCode];

        if (!formula) {
            // No driver formula - keep original budget amount
            for (let month = 1; month <= 12; month++) {
                const seasonalFactor = seasonality[month] || 100;
                const amount = Number(budgetLine.amount_base) * (seasonalFactor / 100);

                simulationResults.push({
                    accountCode,
                    costCenterCode: budgetLine.cost_center_code,
                    projectCode: budgetLine.project_code,
                    month,
                    amount,
                    currency: budgetLine.currency || "USD",
                });
            }
        } else {
            // Apply driver formula
            const baseAmount = Number(budgetLine.amount_base);
            const driverAmount = evaluateDriverFormula(formula, baseAmount, simulationParams);

            for (let month = 1; month <= 12; month++) {
                const seasonalFactor = seasonality[month] || 100;
                const amount = driverAmount * (seasonalFactor / 100);

                simulationResults.push({
                    accountCode,
                    costCenterCode: budgetLine.cost_center_code,
                    projectCode: budgetLine.project_code,
                    month,
                    amount,
                    currency: budgetLine.currency || "USD",
                });
            }
        }
    }

    const duration = Date.now() - startTime;

    // Observability logging
    console.log(JSON.stringify({
        event: "forecast_simulated",
        company_id: companyId,
        driver_profile_id: driverProfileId,
        source_budget_version_id: sourceBudgetVersionId,
        lines_processed: simulationResults.length,
        duration_ms: duration,
        simulation_params: simulationParams,
        timestamp: new Date().toISOString()
    }));

    return {
        simulationResults,
        parameters: simulationParams,
        linesGenerated: simulationResults.length,
        durationMs: duration,
    };
}
