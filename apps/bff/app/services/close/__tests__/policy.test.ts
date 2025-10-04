import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ClosePolicyService } from "@/services/close/policy";
import { db } from "@/lib/db";
import { closePolicy } from "@aibos/db-adapter/schema";
import { eq } from "drizzle-orm";

describe("ClosePolicyService", () => {
    const companyId = "test-company";
    const userId = "test-user";
    let service: ClosePolicyService;

    beforeEach(async () => {
        service = new ClosePolicyService();
        // Clean up test data
        await db.delete(closePolicy);
    });

    afterEach(async () => {
        // Clean up test data
        await db.delete(closePolicy);
    });

    describe("upsertClosePolicy", () => {
        it("should create a new close policy", async () => {
            const data = {
                materiality_abs: 5000,
                materiality_pct: 0.05,
                sla_default_hours: 48,
                reminder_cadence_mins: 30,
                tz: "America/New_York"
            };

            const policy = await service.upsertClosePolicy(companyId, userId, data);

            expect(policy.company_id).toBe(companyId);
            expect(policy.materiality_abs).toBe(5000);
            expect(policy.materiality_pct).toBe(0.05);
            expect(policy.sla_default_hours).toBe(48);
            expect(policy.reminder_cadence_mins).toBe(30);
            expect(policy.tz).toBe("America/New_York");
        });

        it("should update an existing close policy", async () => {
            // Create initial policy
            const initialData = {
                materiality_abs: 5000,
                materiality_pct: 0.05,
                sla_default_hours: 48,
                reminder_cadence_mins: 30,
                tz: "America/New_York"
            };
            await service.upsertClosePolicy(companyId, userId, initialData);

            // Update policy
            const updateData = {
                materiality_abs: 10000,
                materiality_pct: 0.10,
                sla_default_hours: 72,
                reminder_cadence_mins: 60,
                tz: "UTC"
            };

            const updatedPolicy = await service.upsertClosePolicy(companyId, userId, updateData);

            expect(updatedPolicy.materiality_abs).toBe(10000);
            expect(updatedPolicy.materiality_pct).toBe(0.10);
            expect(updatedPolicy.sla_default_hours).toBe(72);
            expect(updatedPolicy.reminder_cadence_mins).toBe(60);
            expect(updatedPolicy.tz).toBe("UTC");
        });
    });

    describe("getClosePolicy", () => {
        it("should return null when no policy exists", async () => {
            const policy = await service.getClosePolicy(companyId);
            expect(policy).toBeNull();
        });

        it("should return existing policy", async () => {
            const data = {
                materiality_abs: 5000,
                materiality_pct: 0.05,
                sla_default_hours: 48,
                reminder_cadence_mins: 30,
                tz: "America/New_York"
            };

            await service.upsertClosePolicy(companyId, userId, data);
            const policy = await service.getClosePolicy(companyId);

            expect(policy).not.toBeNull();
            expect(policy!.company_id).toBe(companyId);
            expect(policy!.materiality_abs).toBe(5000);
        });
    });

    describe("computeMaterialityThreshold", () => {
        it("should compute materiality threshold correctly", async () => {
            const data = {
                materiality_abs: 5000,
                materiality_pct: 0.05,
                sla_default_hours: 48,
                reminder_cadence_mins: 30,
                tz: "UTC"
            };

            await service.upsertClosePolicy(companyId, userId, data);

            const result = await service.computeMaterialityThreshold(companyId, 100000);

            expect(result.absThreshold).toBe(5000);
            expect(result.pctThreshold).toBe(5000); // 100000 * 0.05
            expect(result.isMaterial).toBe(true); // 100000 >= 5000
        });

        it("should return false for non-material amounts", async () => {
            const data = {
                materiality_abs: 5000,
                materiality_pct: 0.05,
                sla_default_hours: 48,
                reminder_cadence_mins: 30,
                tz: "UTC"
            };

            await service.upsertClosePolicy(companyId, userId, data);

            const result = await service.computeMaterialityThreshold(companyId, 1000);

            expect(result.isMaterial).toBe(false); // 1000 < 5000
        });

        it("should throw error when policy not found", async () => {
            await expect(
                service.computeMaterialityThreshold(companyId, 100000)
            ).rejects.toThrow(`Close policy not found for company ${companyId}`);
        });
    });

    describe("getSlaDefaultHours", () => {
        it("should return default hours from policy", async () => {
            const data = {
                materiality_abs: 5000,
                materiality_pct: 0.05,
                sla_default_hours: 48,
                reminder_cadence_mins: 30,
                tz: "UTC"
            };

            await service.upsertClosePolicy(companyId, userId, data);

            const hours = await service.getSlaDefaultHours(companyId);
            expect(hours).toBe(48);
        });

        it("should return default value when no policy exists", async () => {
            const hours = await service.getSlaDefaultHours(companyId);
            expect(hours).toBe(72); // Default value
        });
    });

    describe("getReminderCadenceMins", () => {
        it("should return reminder cadence from policy", async () => {
            const data = {
                materiality_abs: 5000,
                materiality_pct: 0.05,
                sla_default_hours: 48,
                reminder_cadence_mins: 30,
                tz: "UTC"
            };

            await service.upsertClosePolicy(companyId, userId, data);

            const minutes = await service.getReminderCadenceMins(companyId);
            expect(minutes).toBe(30);
        });

        it("should return default value when no policy exists", async () => {
            const minutes = await service.getReminderCadenceMins(companyId);
            expect(minutes).toBe(60); // Default value
        });
    });

    describe("getCompanyTimezone", () => {
        it("should return timezone from policy", async () => {
            const data = {
                materiality_abs: 5000,
                materiality_pct: 0.05,
                sla_default_hours: 48,
                reminder_cadence_mins: 30,
                tz: "America/New_York"
            };

            await service.upsertClosePolicy(companyId, userId, data);

            const tz = await service.getCompanyTimezone(companyId);
            expect(tz).toBe("America/New_York");
        });

        it("should return default timezone when no policy exists", async () => {
            const tz = await service.getCompanyTimezone(companyId);
            expect(tz).toBe("UTC"); // Default value
        });
    });
});
