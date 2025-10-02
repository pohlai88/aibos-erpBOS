import { z } from "zod";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { ok, badRequest } from "../../../lib/http";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";
import { createForecastVersion, getForecastVersion } from "../../../services/forecast/drivers";

// Schema for creating forecast versions
const CreateForecastVersionSchema = z.object({
    code: z.string().min(1).max(50),
    label: z.string().min(1).max(200),
    year: z.number().int().min(1900).max(2100),
    driverProfileId: z.string().optional(),
});

export const POST = withRouteErrors(async (req: Request) => {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;

        const capCheck = requireCapability(auth, "budgets:manage");
        if (isResponse(capCheck)) return capCheck;

        const body = await req.json();
        const payload = CreateForecastVersionSchema.parse(body);

        const result = await createForecastVersion(auth.company_id, auth.user_id, {
            code: payload.code,
            label: payload.label,
            year: payload.year,
            driverProfileId: payload.driverProfileId,
        });

        return ok({
            version: result,
            message: "Forecast version created successfully",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return badRequest("Invalid request data", error.errors);
        }
        console.error("Error creating forecast version:", error);
        return badRequest("Failed to create forecast version");
    }
});

export const GET = withRouteErrors(async (req: Request) => {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;

        const capCheck = requireCapability(auth, "budgets:read");
        if (isResponse(capCheck)) return capCheck;

        // For now, return empty array - in production you'd list forecast versions
        return ok({
            versions: [],
        });
    } catch (error) {
        console.error("Error fetching forecast versions:", error);
        return badRequest("Failed to fetch forecast versions");
    }
});
