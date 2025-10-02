// CSV Parser Tests
// Tests for the CSV parser utility

import { describe, it, expect } from "vitest";
import { parseCsv, validateCsvStructure, normalizeCsvHeaders } from "../../utils/csv";

describe("csv parser", () => {
    it("parses quoted and commas", async () => {
        const text = 'description,amount\n"Laptop, Pro",1200\nSimple,800';
        const rows = await parseCsv(text);
        expect(rows[0]?.description).toBe("Laptop, Pro");
        expect(rows[1]?.amount).toBe("800");
    });

    it("handles empty values", async () => {
        const text = 'description,amount,cost_center\n"Laptop",1200,\n"Desktop",800,CC-IT';
        const rows = await parseCsv(text);
        expect(rows[0]?.cost_center).toBe("");
        expect(rows[1]?.cost_center).toBe("CC-IT");
    });

    it("handles escaped quotes", async () => {
        const text = 'description\n"Laptop ""Pro"" Edition"';
        const rows = await parseCsv(text);
        expect(rows[0]?.description).toBe('Laptop "Pro" Edition');
    });

    it("handles Windows line endings", async () => {
        const text = 'description,amount\r\n"Laptop",1200\r\n"Desktop",800';
        const rows = await parseCsv(text);
        expect(rows).toHaveLength(2);
        expect(rows[0]?.description).toBe("Laptop");
        expect(rows[1]?.description).toBe("Desktop");
    });

    it("validates CSV structure", () => {
        const validText = 'description,amount\n"Laptop",1200';
        const result = validateCsvStructure(validText);
        expect(result.valid).toBe(true);
        expect(result.headers).toEqual(["description", "amount"]);
    });

    it("detects empty CSV", () => {
        const result = validateCsvStructure("");
        expect(result.valid).toBe(false);
        expect(result.error).toContain("empty");
    });

    it("normalizes headers", () => {
        const headers = ["Asset Class", "Description", "Cost Center"];
        const normalized = normalizeCsvHeaders(headers);
        expect(normalized.asset_class).toBe("Asset Class");
        expect(normalized.description).toBe("Description");
        expect(normalized.cost_center).toBe("Cost Center");
    });
});
