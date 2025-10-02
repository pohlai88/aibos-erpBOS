import { z } from "zod";
import { requireAuth, requireCapability } from "../../../../../lib/auth";
import { ok, badRequest } from "../../../../../lib/http";
import { withRouteErrors, isResponse } from "../../../../../lib/route-utils";
import { generateForecastFromBudget } from "../../../../../services/forecast/drivers";

// Schema for forecast generation
const GenerateForecastSchema = z.object({
    sourceBudgetVersionId: z.string().min(1),
    driverProfileId: z.string().min(1),
    simulationParams: z.object({
        priceDelta: z.number().optional(),
        volumeDelta: z.number().optional(),
        fxRate: z.number().optional(),
        seasonalityOverride: z.record(z.string(), z.number()).optional(),
    }).optional(),
});

export const POST = withRouteErrors(async (
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) => {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;

        const capCheck = requireCapability(auth, "forecasts:manage");
        if (isResponse(capCheck)) return capCheck;

        const { id: forecastVersionId } = await params;
        const body = await req.json();
        const payload = GenerateForecastSchema.parse(body);

        const result = await generateForecastFromBudget(
            auth.company_id,
            forecastVersionId,
            payload.sourceBudgetVersionId,
            payload.driverProfileId,
            payload.simulationParams || undefined
        );

        return ok({
            result,
            message: "Forecast generated successfully",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return badRequest("Invalid request data", error.errors);
        }
        console.error("Error generating forecast:", error);
        return badRequest("Failed to generate forecast");
    }
});
