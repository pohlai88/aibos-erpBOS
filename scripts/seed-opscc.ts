#!/usr/bin/env node
/**
 * M27: Ops Command Center - Seed Data Script
 * 
 * This script creates default board configurations, tile configurations,
 * and alert rules for the Ops Command Center.
 */

import { db } from "@/lib/db";
import {
    boardConfig,
    kpiTileConfig,
    alertRule,
    playbookAction
} from "@aibos/db-adapter/schema";

const DEFAULT_COMPANY_ID = "00000000-0000-0000-0000-000000000001";

async function seedOpsccData() {
    console.log("🌱 Seeding M27 Ops Command Center data...");

    try {
        // 1. Seed Board Configurations
        console.log("📊 Creating board configurations...");
        await seedBoardConfigs();

        // 2. Seed Tile Configurations
        console.log("🎯 Creating tile configurations...");
        await seedTileConfigs();

        // 3. Seed Alert Rules
        console.log("🚨 Creating alert rules...");
        await seedAlertRules();

        // 4. Seed Playbook Actions
        console.log("📋 Creating playbook actions...");
        await seedPlaybookActions();

        console.log("✅ M27 Ops Command Center seed data created successfully!");
    } catch (error) {
        console.error("❌ Error seeding OpsCC data:", error);
        throw error;
    }
}

async function seedBoardConfigs() {
    const boards = [
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "EXEC",
            name: "Executive Dashboard",
            description: "High-level KPIs for executive decision making",
            default_present_ccy: "USD",
            layout: {
                columns: 3,
                rows: 2,
                tiles_per_row: 3
            },
            acl: ["admin", "accountant"]
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "TREASURY",
            name: "Treasury Operations",
            description: "Cash management, payments, and treasury KPIs",
            default_present_ccy: "USD",
            layout: {
                columns: 2,
                rows: 2,
                tiles_per_row: 2
            },
            acl: ["admin", "accountant", "ops"]
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "AR",
            name: "Accounts Receivable",
            description: "Collections, aging, and AR performance metrics",
            default_present_ccy: "USD",
            layout: {
                columns: 2,
                rows: 3,
                tiles_per_row: 2
            },
            acl: ["admin", "accountant", "ops"]
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "CLOSE",
            name: "Close & Controls",
            description: "Month-end close progress and control compliance",
            default_present_ccy: "USD",
            layout: {
                columns: 2,
                rows: 3,
                tiles_per_row: 2
            },
            acl: ["admin", "accountant"]
        }
    ];

    for (const board of boards) {
        await db.insert(boardConfig).values(board).onConflictDoNothing();
    }
}

async function seedTileConfigs() {
    const tiles = [
        // Executive Board Tiles
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "EXEC",
            tile_id: "exec-liquidity-runway",
            kpi: "LIQUIDITY_RUNWAY_W",
            viz: "NUMBER",
            format: "WEEKS",
            targets: { warning: 8, critical: 4 },
            order_no: 1
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "EXEC",
            tile_id: "exec-cash-burn",
            kpi: "CASH_BURN_4W",
            viz: "DELTA",
            format: "CURRENCY",
            targets: { warning: -100000, critical: -200000 },
            order_no: 2
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "EXEC",
            tile_id: "exec-forecast-accuracy",
            kpi: "FORECAST_ACCURACY_CASH_30D",
            viz: "NUMBER",
            format: "PERCENTAGE",
            targets: { warning: 85, critical: 75 },
            order_no: 3
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "EXEC",
            tile_id: "exec-dso",
            kpi: "DSO_DPO_CCC",
            viz: "NUMBER",
            format: "DAYS",
            targets: { warning: 35, critical: 45 },
            order_no: 4
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "EXEC",
            tile_id: "exec-close-progress",
            kpi: "CLOSE_PROGRESS",
            viz: "NUMBER",
            format: "PERCENTAGE",
            targets: { warning: 80, critical: 70 },
            order_no: 5
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "EXEC",
            tile_id: "exec-control-pass-rate",
            kpi: "CONTROL_PASS_RATE",
            viz: "NUMBER",
            format: "PERCENTAGE",
            targets: { warning: 95, critical: 90 },
            order_no: 6
        },

        // Treasury Board Tiles
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "TREASURY",
            tile_id: "treasury-committed-payments",
            kpi: "PAY_RUN_COMMIT_14D",
            viz: "NUMBER",
            format: "CURRENCY",
            targets: { warning: 200000, critical: 300000 },
            order_no: 1
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "TREASURY",
            tile_id: "treasury-discount-capture",
            kpi: "DISCOUNT_CAPTURE_RATE",
            viz: "NUMBER",
            format: "PERCENTAGE",
            targets: { warning: 80, critical: 70 },
            order_no: 2
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "TREASURY",
            tile_id: "treasury-bank-ack-lag",
            kpi: "BANK_ACK_LAG_H",
            viz: "NUMBER",
            format: "HOURS",
            targets: { warning: 4, critical: 8 },
            order_no: 3
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "TREASURY",
            tile_id: "treasury-fx-exposure",
            kpi: "FX_EXPOSURE_BY_CCY",
            viz: "NUMBER",
            format: "CURRENCY",
            targets: { warning: 50000, critical: 100000 },
            order_no: 4
        },

        // AR Board Tiles
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "AR",
            tile_id: "ar-ptp-at-risk",
            kpi: "PTP_AT_RISK",
            viz: "NUMBER",
            format: "CURRENCY",
            targets: { warning: 100000, critical: 200000 },
            order_no: 1
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "AR",
            tile_id: "ar-ptp-kept-rate",
            kpi: "PTP_KEPT_RATE",
            viz: "NUMBER",
            format: "PERCENTAGE",
            targets: { warning: 85, critical: 75 },
            order_no: 2
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "AR",
            tile_id: "ar-dunning-hit-rate",
            kpi: "DUNNING_HIT_RATE",
            viz: "NUMBER",
            format: "PERCENTAGE",
            targets: { warning: 70, critical: 60 },
            order_no: 3
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "AR",
            tile_id: "ar-auto-match-rate",
            kpi: "AUTO_MATCH_RATE",
            viz: "NUMBER",
            format: "PERCENTAGE",
            targets: { warning: 90, critical: 80 },
            order_no: 4
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "AR",
            tile_id: "ar-slippage-vs-promise",
            kpi: "SLIPPAGE_VS_PROMISE",
            viz: "NUMBER",
            format: "PERCENTAGE",
            targets: { warning: 10, critical: 20 },
            order_no: 5
        },

        // Close Board Tiles
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "CLOSE",
            tile_id: "close-accrual-coverage",
            kpi: "ACCRUAL_COVERAGE",
            viz: "NUMBER",
            format: "PERCENTAGE",
            targets: { warning: 90, critical: 80 },
            order_no: 1
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "CLOSE",
            tile_id: "close-flux-comment-completion",
            kpi: "FLUX_COMMENT_COMPLETION",
            viz: "NUMBER",
            format: "PERCENTAGE",
            targets: { warning: 85, critical: 75 },
            order_no: 2
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "CLOSE",
            tile_id: "close-evidence-freshness",
            kpi: "EVIDENCE_FRESHNESS",
            viz: "NUMBER",
            format: "DAYS",
            targets: { warning: 7, critical: 14 },
            order_no: 3
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "CLOSE",
            tile_id: "close-sox-status",
            kpi: "SOX_STATUS",
            viz: "NUMBER",
            format: "PERCENTAGE",
            targets: { warning: 95, critical: 90 },
            order_no: 4
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "CLOSE",
            tile_id: "close-exceptions-open",
            kpi: "EXCEPTIONS_OPEN",
            viz: "NUMBER",
            format: "COUNT",
            targets: { warning: 5, critical: 10 },
            order_no: 5
        }
    ];

    for (const tile of tiles) {
        await db.insert(kpiTileConfig).values(tile).onConflictDoNothing();
    }
}

async function seedAlertRules() {
    const rules = [
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "EXEC",
            kpi: "LIQUIDITY_RUNWAY_W",
            rule_id: "exec-liquidity-critical",
            expr: "value < 6",
            severity: "HIGH",
            throttle_sec: 3600, // 1 hour
            enabled: true
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "EXEC",
            kpi: "FORECAST_ACCURACY_CASH_30D",
            rule_id: "exec-forecast-accuracy-low",
            expr: "value < 85",
            severity: "MEDIUM",
            throttle_sec: 7200, // 2 hours
            enabled: true
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "CLOSE",
            kpi: "CONTROL_PASS_RATE",
            rule_id: "close-controls-failing",
            expr: "value < 95",
            severity: "HIGH",
            throttle_sec: 1800, // 30 minutes
            enabled: true
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "AR",
            kpi: "PTP_AT_RISK",
            rule_id: "ar-ptp-high-risk",
            expr: "value > 150000",
            severity: "MEDIUM",
            throttle_sec: 3600, // 1 hour
            enabled: true
        },
        {
            company_id: DEFAULT_COMPANY_ID,
            board: "TREASURY",
            kpi: "BANK_ACK_LAG_H",
            rule_id: "treasury-bank-lag-high",
            expr: "value > 6",
            severity: "MEDIUM",
            throttle_sec: 1800, // 30 minutes
            enabled: true
        }
    ];

    for (const rule of rules) {
        await db.insert(alertRule).values(rule).onConflictDoNothing();
    }
}

async function seedPlaybookActions() {
    const actions = [
        {
            action_id: "PAYRUN_DISPATCH",
            name: "Dispatch Payment Run",
            description: "Execute a payment run to process pending payments",
            parameter_schema: {
                type: "object",
                properties: {
                    run_id: { type: "string", description: "Payment run ID" },
                    dry_run: { type: "boolean", description: "Simulate execution" }
                },
                required: ["run_id"]
            },
            required_capability: "pay:dispatch",
            enabled: true
        },
        {
            action_id: "RUN_DUNNING",
            name: "Run Dunning Process",
            description: "Execute dunning process for overdue accounts",
            parameter_schema: {
                type: "object",
                properties: {
                    policy_code: { type: "string", description: "Dunning policy code" },
                    segment: { type: "string", description: "Customer segment" },
                    dry_run: { type: "boolean", description: "Simulate execution" }
                },
                required: ["policy_code", "segment"]
            },
            required_capability: "ar:dunning:run",
            enabled: true
        },
        {
            action_id: "FX_REVALUE",
            name: "FX Revaluation",
            description: "Execute FX revaluation for monetary accounts",
            parameter_schema: {
                type: "object",
                properties: {
                    year: { type: "number", description: "Year for revaluation" },
                    month: { type: "number", description: "Month for revaluation" },
                    ccy_pairs: { type: "array", items: { type: "string" }, description: "Currency pairs" },
                    dry_run: { type: "boolean", description: "Simulate execution" }
                },
                required: ["year", "month"]
            },
            required_capability: "fx:manage",
            enabled: true
        },
        {
            action_id: "ACCELERATE_COLLECTIONS",
            name: "Accelerate Collections",
            description: "Escalate collections for at-risk customers",
            parameter_schema: {
                type: "object",
                properties: {
                    customer_ids: { type: "array", items: { type: "string" }, description: "Customer IDs" },
                    escalation_level: { type: "string", description: "Escalation level" },
                    dry_run: { type: "boolean", description: "Simulate execution" }
                },
                required: ["customer_ids", "escalation_level"]
            },
            required_capability: "ar:collect:workbench",
            enabled: true
        }
    ];

    for (const action of actions) {
        await db.insert(playbookAction).values(action).onConflictDoNothing();
    }
}

// Run the seed function if this script is executed directly
if (require.main === module) {
    seedOpsccData()
        .then(() => {
            console.log("🎉 Seed completed successfully!");
            process.exit(0);
        })
        .catch((error) => {
            console.error("💥 Seed failed:", error);
            process.exit(1);
        });
}

export { seedOpsccData };
