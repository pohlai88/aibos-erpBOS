import { NextRequest, NextResponse } from "next/server";
import { RbCatalogService } from "@/services/rb/catalog";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { ProductUpsert, ProductQuery } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const catalogService = new RbCatalogService();

// GET /api/rb/catalog/products - List products
// POST /api/rb/catalog/products - Create/update product
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rb:catalog");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const query = {
            sku: url.searchParams.get('sku') || undefined,
            kind: url.searchParams.get('kind') as any || undefined,
            status: url.searchParams.get('status') as any || undefined,
            limit: parseInt(url.searchParams.get('limit') || '50'),
            offset: parseInt(url.searchParams.get('offset') || '0')
        };

        const result = await catalogService.getProducts(auth.company_id, query);
        return ok(result);
    } catch (error) {
        console.error("Error listing products:", error);
        return serverError("Failed to list products");
    } });
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rb:catalog");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = ProductUpsert.parse(body);

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
        console.error("Error creating product:", error);
        return serverError("Failed to create product");
    } });
