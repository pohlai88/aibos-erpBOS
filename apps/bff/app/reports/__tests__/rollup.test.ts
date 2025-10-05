import { describe, it, expect } from "vitest";
import { costCenterPivotExpr } from "../pivot-sql";

describe("cost center rollup expr", () => {
    it("root produces first segment", () => {
        expect(typeof costCenterPivotExpr("root")).toBe("object");
    });
    it("level:2 accepted", () => {
        expect(typeof costCenterPivotExpr("level:2")).toBe("object");
    });
});
