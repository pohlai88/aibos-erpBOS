import { NextRequest, NextResponse } from "next/server";
import { RbCatalogService } from "@/services/rb/catalog";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError, notFound } from "@/api/_lib/http";
import { ProductUpsert } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const catalogService = new RbCatalogService();

// GET /api/rb/catalog/products/[id] - Get product by ID
// PUT /api/rb/catalog/products/[id] - Update product
export const GET = withRouteErrors(async (request: NextRequest, { params }: { params: { id: string } }) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rb:catalog");
        if (cap instanceof Response) return cap;

        const result = await catalogService.getProduct(auth.company_id, params.id);

        if (!result) {
            return notFound("Product not found");
        }

        return ok(result);
    } catch (error) {
        console.error("Error getting product:", error);
        return serverError("Failed to get product");
    } });
export const PUT = withRouteErrors(async (request: NextRequest, { params }: { params: { id: string } }) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rb:catalog");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = ProductUpsert.parse(body);

        // Check if product exists
        const existing = await catalogService.getProduct(auth.company_id, params.id);
        if (!existing) {
            return notFound("Product not found");
        }

        const result = await catalogService.upsertProduct(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid product data");
        }
        console.error("Error updating product:", error);
        return serverError("Failed to update product");
    } });
