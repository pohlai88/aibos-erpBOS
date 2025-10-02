import { describe, it, expect } from "vitest";
import { assertOpenPeriod } from "../periods";

describe("period guard", () => {
    it("throws 423 for closed", async () => {
        const date = new Date(Date.UTC(2025, 0, 1));
        // mock db.query.periods.findFirst to return { state: 'closed' }
        await expect(assertOpenPeriod("co", date)).rejects.toMatchObject({ status: 423 });
    });
});
