import { z } from "zod";
import { requireAuth, requireCapability } from "../../lib/auth";
import { ok, badRequest } from "../../lib/http";
import { withRouteErrors, isResponse } from "../../lib/route-utils";
import { createDriverProfile, listDriverProfiles } from "../../services/forecast/drivers";

// Schema for creating driver profiles
const CreateDriverProfileSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    formulaJson: z.record(z.string(), z.string()), // { "4000": "revenue * 0.6", "5000": "revenue * 0.3" }
    seasonalityJson: z.record(z.string(), z.number()), // { "1": 100, "2": 95, ... }
});

export const POST = withRouteErrors(async (req: Request) => {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;

        const capCheck = requireCapability(auth, "budgets:manage");
        if (isResponse(capCheck)) return capCheck;

        const body = await req.json();
        const payload = CreateDriverProfileSchema.parse(body);

        // Validate seasonality has 12 months
        const seasonalityKeys = Object.keys(payload.seasonalityJson);
        if (seasonalityKeys.length !== 12) {
            return badRequest("Seasonality must include all 12 months (1-12)");
        }

        // Validate month keys are 1-12
        const months = seasonalityKeys.map(Number).sort();
        if (months[0] !== 1 || months[11] !== 12) {
            return badRequest("Seasonality months must be 1-12");
        }

        const result = await createDriverProfile(auth.company_id, auth.user_id, {
            name: payload.name,
            description: payload.description || undefined,
            formulaJson: payload.formulaJson,
            seasonalityJson: payload.seasonalityJson,
        });

        return ok({
            profile: result,
            message: "Driver profile created successfully",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return badRequest("Invalid request data", error.errors);
        }
        console.error("Error creating driver profile:", error);
        return badRequest("Failed to create driver profile");
    }
});

export const GET = withRouteErrors(async (req: Request) => {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;

        const capCheck = requireCapability(auth, "budgets:read");
        if (isResponse(capCheck)) return capCheck;

        const profiles = await listDriverProfiles(auth.company_id);

        return ok({
            profiles,
        });
    } catch (error) {
        console.error("Error fetching driver profiles:", error);
        return badRequest("Failed to fetch driver profiles");
    }
});
