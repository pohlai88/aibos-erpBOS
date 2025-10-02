import { describe, it, expect, vi } from "vitest";
import { revalueMonetaryAccounts } from "../revalue";

describe("FX revaluation period guard", () => {
    it("respects M17 period guard", async () => {
        // Mock postJournal to throw 423 for closed period
        const mockPostJournal = vi.fn().mockRejectedValue(
            Object.assign(new Error("Period 2025-11 is closed"), { status: 423 })
        );

        await expect(revalueMonetaryAccounts({
            companyId: "test-co",
            year: 2025,
            month: 11,
            dryRun: false,
            actor: "test-user",
            baseCcy: "MYR"
        })).rejects.toMatchObject({ status: 423 });
    });

    it("allows dry-run on closed periods", async () => {
        // Dry-run should not call postJournal, so no 423 error
        const result = await revalueMonetaryAccounts({
            companyId: "test-co",
            year: 2025,
            month: 11,
            dryRun: true, // Dry run should not post journals
            actor: "test-user",
            baseCcy: "MYR"
        });

        expect(result.run_id).toBeDefined();
        expect(result.lines).toBeDefined();
    });
});
