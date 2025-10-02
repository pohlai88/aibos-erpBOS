import { describe, it, expect, beforeEach } from "vitest";
import { assertOpenPeriod, setPeriodState } from "../periods";
import { pool } from "../../../lib/db";

describe("period guard", () => {
    beforeEach(async () => {
        // Clean up test data
        await pool.query("DELETE FROM periods WHERE company_id = 'co'");
    });

    it("throws 423 for closed", async () => {
        const date = new Date(Date.UTC(2025, 0, 1)); // January 2025
        // Set up a closed period
        await setPeriodState("co", 2025, 1, "closed", "test-user");

        await expect(assertOpenPeriod("co", date)).rejects.toMatchObject({ status: 423 });
    });
});
