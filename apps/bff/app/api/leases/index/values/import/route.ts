import { NextRequest, NextResponse } from "next/server";
import { IndexationService } from "../../../../../services/lease/m28-4-services";
import { LeaseIndexValueImportReq } from "@aibos/contracts";
import { z } from "zod";
import { withRouteErrors, ok } from "@/api/_kit";

const indexationService = new IndexationService();
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const body = await request.json();
        const validatedData = LeaseIndexValueImportReq.parse(body);
        
        // Extract company ID and user ID from headers/auth
        const companyId = request.headers.get("x-company-id") || "default";
        const userId = request.headers.get("x-user-id") || "system";

        await indexationService.ingestIndexValues(companyId, userId, validatedData);

        return ok({
                    success: true,
                    message: "Index values imported successfully",
                    imported_count: validatedData.rows.length
                });

    } catch (error) {
        console.error("Error importing index values:", error);
        
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
