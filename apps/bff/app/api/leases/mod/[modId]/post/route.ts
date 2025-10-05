import { NextRequest, NextResponse } from "next/server";
import { RemeasurementEngine } from "../../../../../services/lease/m28-4-services";
import { LeaseModPostReq } from "@aibos/contracts";
import { z } from "zod";
import { withRouteErrors, ok } from "@/api/_kit";

const remeasurementEngine = new RemeasurementEngine();
export const POST = withRouteErrors(async (request: NextRequest, { params }: { params: { modId: string } }) => { try {
        const body = await request.json();
        const validatedData = LeaseModPostReq.parse({
            ...body,
            mod_id: params.modId
        });
        
        // Extract company ID and user ID from headers/auth
        const companyId = request.headers.get("x-company-id") || "default";
        const userId = request.headers.get("x-user-id") || "system";

        const result = await remeasurementEngine.postRemeasurement(companyId, userId, validatedData);

        return ok({
                    success: true,
                    data: result
                });

    } catch (error) {
        console.error("Error posting modification:", error);
        
        if (error instanceof z.ZodError) {
            return ok({
                            success: false,
                            error: "Validation error",
                            details: error.errors
                        }, 400);
        }

        return ok({
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error"
                }, 500);
    } });
