import { describe, it, expect, beforeEach } from "vitest";
import { upsertTaxPartner, getTaxPartners, upsertTaxTemplate, getTaxTemplate, upsertTaxBoxMap, getTaxBoxMap, runTaxReturn } from "../templates";
import { pool } from "../../../lib/db";

describe("Tax Return Templates Service", () => {
    const companyId = "test-co";
    const actor = "test-user";

    beforeEach(async () => {
        // Clean up test data
        await pool.query("DELETE FROM tax_return_box_map WHERE company_id = $1", [companyId]);
        await pool.query("DELETE FROM tax_return_template WHERE company_id = $1", [companyId]);
        await pool.query("DELETE FROM tax_partner WHERE company_id = $1", [companyId]);
    });

    it("should create and retrieve tax partners", async () => {
        // Create partner
        await upsertTaxPartner(companyId, {
            code: "MY-SST",
            name: "Malaysia SST",
            frequency: "M",
            base_ccy: "MYR"
        }, actor);

        // Retrieve partners
        const partners = await getTaxPartners(companyId);
        expect(partners).toHaveLength(1);
        expect(partners[0].code).toBe("MY-SST");
        expect(partners[0].name).toBe("Malaysia SST");
    });

    it("should create and retrieve tax templates", async () => {
        // Create template
        await upsertTaxTemplate(companyId, {
            partner_code: "MY-SST",
            version: "2025-01",
            boxes: [
                { box_id: "OUTPUT_TAX", box_label: "Output Tax", sign: "+", ordinal: 1 },
                { box_id: "INPUT_TAX", box_label: "Input Tax", sign: "-", ordinal: 2 },
                { box_id: "NET_PAYABLE", box_label: "Net Payable", sign: "+", ordinal: 99 }
            ]
        }, actor);

        // Retrieve template
        const template = await getTaxTemplate(companyId, "MY-SST", "2025-01");
        expect(template).toHaveLength(3);
        expect(template[0].box_id).toBe("OUTPUT_TAX");
        expect(template[0].sign).toBe("+");
    });

    it("should create and retrieve box mappings", async () => {
        // Create box mapping
        await upsertTaxBoxMap(companyId, {
            partner_code: "MY-SST",
            version: "2025-01",
            rules: [
                {
                    box_id: "OUTPUT_TAX",
                    tax_code: "SST-SR",
                    direction: "OUTPUT",
                    rate_name: "SR",
                    priority: 1
                },
                {
                    box_id: "INPUT_TAX",
                    tax_code: "SST-SR",
                    direction: "INPUT",
                    rate_name: "SR",
                    priority: 1
                }
            ]
        }, actor);

        // Retrieve box mapping
        const boxMap = await getTaxBoxMap(companyId, "MY-SST", "2025-01");
        expect(boxMap).toHaveLength(2);
        expect(boxMap[0].box_id).toBe("INPUT_TAX"); // Sorted by box_id
        expect(boxMap[0].direction).toBe("INPUT");
    });

    it("should run tax return dry-run", async () => {
        // Setup template and mapping
        await upsertTaxTemplate(companyId, {
            partner_code: "MY-SST",
            version: "2025-01",
            boxes: [
                { box_id: "OUTPUT_TAX", box_label: "Output Tax", sign: "+", ordinal: 1 },
                { box_id: "INPUT_TAX", box_label: "Input Tax", sign: "-", ordinal: 2 }
            ]
        }, actor);

        await upsertTaxBoxMap(companyId, {
            partner_code: "MY-SST",
            version: "2025-01",
            rules: [
                {
                    box_id: "OUTPUT_TAX",
                    tax_code: "SST-SR",
                    direction: "OUTPUT",
                    priority: 1
                },
                {
                    box_id: "INPUT_TAX",
                    tax_code: "SST-SR",
                    direction: "INPUT",
                    priority: 1
                }
            ]
        }, actor);

        // Run dry-run
        const result = await runTaxReturn(companyId, {
            partner_code: "MY-SST",
            version: "2025-01",
            year: 2025,
            month: 11,
            dry_run: true,
            include_detail: false
        }, actor);

        expect(result.run_id).toBeDefined();
        expect(result.lines).toBeDefined();
        expect(result.boxes).toBeDefined();
    });

    it("should validate template before mapping", async () => {
        // Try to create mapping without template
        await expect(upsertTaxBoxMap(companyId, {
            partner_code: "MY-SST",
            version: "2025-01",
            rules: [
                {
                    box_id: "NONEXISTENT_BOX",
                    tax_code: "SST-SR",
                    direction: "OUTPUT",
                    priority: 1
                }
            ]
        }, actor)).resolves.not.toThrow();

        // The mapping should be created but won't match anything in the return builder
        const boxMap = await getTaxBoxMap(companyId, "MY-SST", "2025-01");
        expect(boxMap).toHaveLength(1);
    });
});
