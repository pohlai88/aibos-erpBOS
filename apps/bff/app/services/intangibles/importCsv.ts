// M16.2: Intangibles CSV Import Service
// Handles CSV import for Intangible plans with flexible column mapping

import { parseCsv } from "../../utils/csv";
import { upsertIntangiblePlan } from "./plan";
import { CsvImportPayload, CsvImportResult } from "@contracts/assets_import";

type Row = Record<string, string>;

function pick(row: Row, key: string, fallback?: string): string {
    const v = row[key];
    return (v != null && v !== "") ? v : (fallback ?? "");
}

export async function importIntangiblesCsv(
    companyId: string,
    actor: string,
    fileText: string,
    payload?: CsvImportPayload
): Promise<CsvImportResult> {
    const map = payload?.mapping ?? {} as any;
    const defs = payload?.defaults ?? {} as any;
    const rows = await parseCsv(fileText);
    let created = 0;
    const errors: Array<{ line: number; error: string }> = [];

    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        try {
            // Handle both "class" and "asset_class" mappings for flexibility
            const classValue = r[map.class ?? "class"] || r[map.asset_class ?? "asset_class"] || r["asset_class"];

            const input = {
                class: classValue,
                description: pick(r, map.description ?? "description"),
                amount: Number(pick(r, map.amount ?? "amount")),
                currency: pick(r, map.currency ?? "currency", defs.currency),
                present_ccy: pick(r, map.present_ccy ?? "present_ccy", defs.present_ccy),
                in_service: pick(r, map.in_service ?? "in_service"),
                life_m: Number(pick(r, map.life_m ?? "life_m")),
                cost_center: r[map.cost_center ?? "cost_center"] || undefined,
                project: r[map.project ?? "project"] || undefined,
            };

            // Validate required fields
            if (!input.class || !input.description || !input.amount || !input.currency || !input.present_ccy || !input.in_service || !input.life_m) {
                throw new Error("missing required fields");
            }

            // Validate numeric fields
            if (isNaN(input.amount) || input.amount <= 0) {
                throw new Error("invalid amount");
            }

            if (isNaN(input.life_m) || input.life_m <= 0) {
                throw new Error("invalid life_m");
            }

            // Validate date format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(input.in_service)) {
                throw new Error("invalid in_service date format (expected YYYY-MM-DD)");
            }

            const result = await upsertIntangiblePlan(companyId, actor, input);
            if (result.created) {
                created++;
            }
        } catch (e: any) {
            errors.push({ line: i + 2, error: e.message ?? String(e) });
        }
    }

    return { created, errors };
}

/**
 * Validates CSV structure for Intangibles import
 */
export function validateIntangiblesCsvStructure(text: string): { valid: boolean; error?: string; headers?: string[] } {
    const { parseCsv } = require("../../utils/csv");

    try {
        const rows = parseCsv(text);
        if (!rows.length) {
            return { valid: false, error: "No data rows found in CSV" };
        }

        const firstRow = rows[0];
        const requiredFields = ["class", "description", "amount", "currency", "present_ccy", "in_service", "life_m"];
        const missingFields = requiredFields.filter(field => !firstRow[field]);

        if (missingFields.length > 0) {
            return {
                valid: false,
                error: `Missing required fields: ${missingFields.join(", ")}`
            };
        }

        return { valid: true, headers: Object.keys(firstRow) };
    } catch (error) {
        return { valid: false, error: `Invalid CSV format: ${error}` };
    }
}
