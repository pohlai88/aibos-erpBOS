// M16.2: CAPEX CSV Import Service
// Handles CSV import for CAPEX plans with flexible column mapping

import { parseCsv } from "../../utils/csv";
import { upsertPlan } from "./plan";
import { CsvImportPayload, CsvImportResult } from "@aibos/contracts";

type Row = Record<string, string>;

function pick(row: Row, key: string, fallback?: string): string {
    const v = row[key];
    return (v != null && v !== "") ? v : (fallback ?? "");
}

export async function importCapexCsv(
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
        if (!r) continue; // Skip undefined rows

        try {
            const input = {
                asset_class: pick(r, map.asset_class ?? "asset_class"),
                description: pick(r, map.description ?? "description"),
                capex_amount: Number(pick(r, map.capex_amount ?? "capex_amount")),
                currency: pick(r, map.currency ?? "currency", defs.currency),
                present_ccy: pick(r, map.present_ccy ?? "present_ccy", defs.present_ccy),
                in_service: pick(r, map.in_service ?? "in_service"),
                life_m: r[map.life_m ?? "life_m"] ? Number(r[map.life_m ?? "life_m"]) : undefined,
                method: (r[map.method ?? "method"] || defs.method || "SL") as "SL" | "DDB",
                cost_center: r[map.cost_center ?? "cost_center"] || undefined,
                project: r[map.project ?? "project"] || undefined,
            };

            // Validate required fields
            if (!input.asset_class || !input.description || !input.capex_amount || !input.currency || !input.present_ccy || !input.in_service) {
                throw new Error("missing required fields");
            }

            // Validate numeric fields
            if (isNaN(input.capex_amount) || input.capex_amount <= 0) {
                throw new Error("invalid capex_amount");
            }

            if (input.life_m && (isNaN(input.life_m) || input.life_m <= 0)) {
                throw new Error("invalid life_m");
            }

            // Validate date format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(input.in_service)) {
                throw new Error("invalid in_service date format (expected YYYY-MM-DD)");
            }

            // Validate method
            if (input.method && !["SL", "DDB"].includes(input.method)) {
                throw new Error("invalid method (expected SL or DDB)");
            }

            const result = await upsertPlan(companyId, actor, input);
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
 * Validates CSV structure for CAPEX import
 */
export async function validateCapexCsvStructure(text: string): Promise<{ valid: boolean; error?: string; headers?: string[] }> {
    try {
        const rows = await parseCsv(text);
        if (!rows.length) {
            return { valid: false, error: "No data rows found in CSV" };
        }

        const firstRow = rows[0];
        if (!firstRow) {
            return { valid: false, error: "No data rows found in CSV" };
        }
        const requiredFields = ["asset_class", "description", "capex_amount", "currency", "present_ccy", "in_service"];
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
