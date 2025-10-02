import { describe, it, expect, beforeEach } from "vitest";
import { exportTaxReturn, getTaxReturnExports } from "../export";
import { pool } from "../../../lib/db";

describe("Tax Return Export Service", () => {
    const companyId = "test-co-export";

    beforeEach(async () => {
        // Clean up test data in proper order (foreign key dependencies)
        await pool.query("DELETE FROM tax_return_export WHERE run_id IN (SELECT id FROM tax_return_run WHERE company_id = $1)", [companyId]);
        await pool.query("DELETE FROM tax_return_line WHERE run_id IN (SELECT id FROM tax_return_run WHERE company_id = $1)", [companyId]);
        await pool.query("DELETE FROM tax_return_run WHERE company_id = $1", [companyId]);
        await pool.query("DELETE FROM tax_return_template WHERE company_id = $1", [companyId]);
        await pool.query("DELETE FROM tax_partner WHERE company_id = $1", [companyId]);
    });

    it("should export tax return as CSV", async () => {
        // Setup test data
        await pool.query(
            `INSERT INTO tax_partner (company_id, code, name, frequency, base_ccy)
             VALUES ($1, $2, $3, $4, $5)`,
            [companyId, "MY-SST-CSV", "Malaysia SST", "M", "MYR"]
        );

        const runId = "test-run-id-csv";
        await pool.query(
            `INSERT INTO tax_return_run (id, company_id, partner_code, version, year, month, period_key, mode, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [runId, companyId, "MY-SST-CSV", "2025-01", 2025, 11, "2025-11", "commit", "test-user"]
        );

        await pool.query(
            `INSERT INTO tax_return_template (company_id, partner_code, version, box_id, box_label, sign, ordinal)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [companyId, "MY-SST-CSV", "2025-01", "OUTPUT_TAX", "Output Tax", "+", 1]
        );

        await pool.query(
            `INSERT INTO tax_return_line (id, run_id, box_id, amount, note)
             VALUES ($1, $2, $3, $4, $5)`,
            ["line-csv", runId, "OUTPUT_TAX", 1000, "Test line"]
        );

        // Export as CSV
        const result = await exportTaxReturn(runId, {
            run_id: runId,
            format: "CSV"
        });

        expect(result.export_id).toBeDefined();
        expect(result.filename).toBe("tax_return_MY-SST-CSV_2025-11.csv");
        expect(result.format).toBe("CSV");
        expect(result.payload).toContain("box_id,box_label,amount");
        expect(result.payload).toContain("OUTPUT_TAX");
    });

    it("should export tax return as XML", async () => {
        // Setup test data
        await pool.query(
            `INSERT INTO tax_partner (company_id, code, name, frequency, base_ccy)
             VALUES ($1, $2, $3, $4, $5)`,
            [companyId, "MY-SST-XML", "Malaysia SST", "M", "MYR"]
        );

        const runId = "test-run-id-xml";
        await pool.query(
            `INSERT INTO tax_return_run (id, company_id, partner_code, version, year, month, period_key, mode, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [runId, companyId, "MY-SST-XML", "2025-01", 2025, 11, "2025-11", "commit", "test-user"]
        );

        await pool.query(
            `INSERT INTO tax_return_template (company_id, partner_code, version, box_id, box_label, sign, ordinal)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [companyId, "MY-SST-XML", "2025-01", "OUTPUT_TAX", "Output Tax", "+", 1]
        );

        await pool.query(
            `INSERT INTO tax_return_line (id, run_id, box_id, amount, note)
             VALUES ($1, $2, $3, $4, $5)`,
            ["line-xml", runId, "OUTPUT_TAX", 1000, "Test line"]
        );

        // Export as XML
        const result = await exportTaxReturn(runId, {
            run_id: runId,
            format: "XML"
        });

        expect(result.format).toBe("XML");
        expect(result.payload).toContain("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        expect(result.payload).toContain("<tax_return>");
        expect(result.payload).toContain("<partner_code>MY-SST-XML</partner_code>");
    });

    it("should export tax return as JSON", async () => {
        // Setup test data
        await pool.query(
            `INSERT INTO tax_partner (company_id, code, name, frequency, base_ccy)
             VALUES ($1, $2, $3, $4, $5)`,
            [companyId, "MY-SST-JSON", "Malaysia SST", "M", "MYR"]
        );

        const runId = "test-run-id-json";
        await pool.query(
            `INSERT INTO tax_return_run (id, company_id, partner_code, version, year, month, period_key, mode, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [runId, companyId, "MY-SST-JSON", "2025-01", 2025, 11, "2025-11", "commit", "test-user"]
        );

        await pool.query(
            `INSERT INTO tax_return_template (company_id, partner_code, version, box_id, box_label, sign, ordinal)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [companyId, "MY-SST-JSON", "2025-01", "OUTPUT_TAX", "Output Tax", "+", 1]
        );

        await pool.query(
            `INSERT INTO tax_return_line (id, run_id, box_id, amount, note)
             VALUES ($1, $2, $3, $4, $5)`,
            ["line-json", runId, "OUTPUT_TAX", 1000, "Test line"]
        );

        // Export as JSON
        const result = await exportTaxReturn(runId, {
            run_id: runId,
            format: "JSON"
        });

        expect(result.format).toBe("JSON");
        const jsonData = JSON.parse(result.payload);
        expect(jsonData.header.partner_code).toBe("MY-SST-JSON");
        expect(jsonData.boxes).toHaveLength(1);
        expect(jsonData.boxes[0].id).toBe("OUTPUT_TAX");
    });

    it("should retrieve export history", async () => {
        const runId = "test-run-id-history";

        // Create run first
        await pool.query(
            `INSERT INTO tax_return_run (id, company_id, partner_code, version, year, month, period_key, mode, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [runId, companyId, "MY-SST", "2025-01", 2025, 11, "2025-11", "commit", "test-user"]
        );

        // Create export record
        await pool.query(
            `INSERT INTO tax_return_export (id, run_id, format, filename, payload)
             VALUES ($1, $2, $3, $4, $5)`,
            ["export-1", runId, "CSV", "test.csv", "test,data"]
        );

        const exports = await getTaxReturnExports(runId);
        expect(exports).toHaveLength(1);
        expect(exports[0].format).toBe("CSV");
        expect(exports[0].filename).toBe("test.csv");
    });

    it("should throw error for non-existent run", async () => {
        await expect(exportTaxReturn("non-existent-run", {
            run_id: "non-existent-run",
            format: "CSV"
        })).rejects.toThrow("Tax return run not found");
    });
});
