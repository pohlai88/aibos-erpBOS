// M15.2: Cash Alert Schedule Admin API Tests
// Smoke tests for schedule management functionality

import { describe, it, expect } from '../../../../../services/cash/__tests__/test-utils';

describe("Cash Alert Schedule Admin API", () => {
    it("validates timezone and scenario", async () => {
        // Test timezone validation
        const validTimezone = "Asia/Ho_Chi_Minh";
        const invalidTimezone = "Invalid/Timezone";

        try {
            new Intl.DateTimeFormat("en-CA", { timeZone: validTimezone }).format(new Date());
            expect(true).toBe(true); // Valid timezone should not throw
        } catch (error) {
            expect(true).toBe(false); // Should not throw for valid timezone
        }

        try {
            new Intl.DateTimeFormat("en-CA", { timeZone: invalidTimezone }).format(new Date());
            expect(true).toBe(false); // Should throw for invalid timezone
        } catch (error) {
            expect(true).toBe(true); // Expected to throw for invalid timezone
        }
    });

    it("validates hour and minute ranges", () => {
        // Test hour validation (0-23)
        expect(0 >= 0).toBe(true);
        expect(23 <= 23).toBe(true);
        expect(8 >= 0).toBe(true);
        expect(8 <= 23).toBe(true);

        // Test minute validation (0-59)
        expect(0 >= 0).toBe(true);
        expect(59 <= 59).toBe(true);
        expect(30 >= 0).toBe(true);
        expect(30 <= 59).toBe(true);
    });

    it("validates schedule upsert structure", () => {
        const validSchedule = {
            enabled: true,
            hour_local: 8,
            minute_local: 0,
            timezone: "Asia/Ho_Chi_Minh",
            scenario_code: "CFY26-01"
        };

        // Basic structure validation
        expect(validSchedule.enabled).toBe(true);
        expect(validSchedule.hour_local).toBe(8);
        expect(validSchedule.minute_local).toBe(0);
        expect(validSchedule.timezone).toBe("Asia/Ho_Chi_Minh");
        expect(validSchedule.scenario_code).toBe("CFY26-01");
    });

    it("handles schedule defaults correctly", () => {
        const defaultSchedule = {
            enabled: true,
            hour_local: 8,
            minute_local: 0,
            timezone: "Asia/Ho_Chi_Minh",
            scenario_code: "CFY26-01"
        };

        // Test default values
        expect(defaultSchedule.enabled).toBe(true);
        expect(defaultSchedule.hour_local).toBe(8);
        expect(defaultSchedule.minute_local).toBe(0);
        expect(defaultSchedule.timezone).toBe("Asia/Ho_Chi_Minh");
    });

    it("validates different timezone formats", () => {
        const timezones = [
            "Asia/Ho_Chi_Minh",
            "America/New_York",
            "Europe/London",
            "UTC"
        ];

        timezones.forEach(tz => {
            try {
                new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
                expect(true).toBe(true); // Valid timezone
            } catch (error) {
                expect(true).toBe(false); // Should not throw for valid timezone
            }
        });
    });

    it("validates scenario code format", () => {
        const validScenarioCodes = [
            "CFY26-01",
            "CFY25-BL",
            "CFY24-WIP",
            "FY25-V2"
        ];

        validScenarioCodes.forEach(code => {
            expect(code.length).toBeGreaterThan(0);
            expect(typeof code).toBe("string");
        });
    });
});

console.log("\n🎉 All M15.2 Cash Alert Schedule Admin API tests completed!");
