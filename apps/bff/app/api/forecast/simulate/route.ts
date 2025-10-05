import { z } from "zod";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { ok, badRequest } from "../../../lib/http";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";
import { simulateForecast } from "../../../services/forecast/drivers";

// Schema for forecast simulation
const SimulateForecastSchema = z.object({
    sourceBudgetVersionId: z.string().min(1),
    driverProfileId: z.string().min(1),
    simulationParams: z.object({
        priceDelta: z.number().optional(),
        volumeDelta: z.number().optional(),
        fxRate: z.number().optional(),
        seasonalityOverride: z.record(z.string(), z.number()).optional(),
    }),
});

export const POST = withRouteErrors(async (req: Request) => {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;

        const capCheck = requireCapability(auth, "forecasts:manage");
        if (isResponse(capCheck)) return capCheck;

        const body = await req.json();
        const payload = SimulateForecastSchema.parse(body);

        const result = await simulateForecast(
            auth.company_id,
            payload.sourceBudgetVersionId,
            payload.driverProfileId,
            payload.simulationParams
        );

        return ok({
            simulation: result,
            message: "Forecast simulation completed",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return badRequest("Invalid request data", error.errors);
        }
        console.error("Error simulating forecast:", error);
        return badRequest("Failed to simulate forecast");
    }
});
