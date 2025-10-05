import { NextRequest, NextResponse } from "next/server";
import { LeaseImportService } from "@/services/lease/import";
import { LeaseDisclosureService } from "@/services/lease/remeasure";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { LeaseImportReq, LeaseDisclosureReq } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const importService = new LeaseImportService();
const disclosureService = new LeaseDisclosureService();

// POST /api/leases/import - Import leases from CSV
// GET /api/leases/import/template - Get CSV import template
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:manage");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const { csv_data, mapping, content_hash } = body;

        if (!csv_data || !mapping) {
            return badRequest("CSV data and mapping are required");
        }

        const validatedData = LeaseImportReq.parse({
            mapping,
            content_hash
        });

        const result = await importService.importFromCSV(
            auth.company_id,
            auth.user_id,
            csv_data,
            validatedData.mapping,
            validatedData.content_hash
        );

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid import data");
        }
        console.error("Error importing leases:", error);
        return serverError("Failed to import leases");
    } });
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "lease:read");
        if (cap instanceof Response) return cap;

        const template = importService.getImportTemplate();

        return new NextResponse(template, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="lease_import_template.csv"'
            }
        });
    } catch (error) {
        console.error("Error getting import template:", error);
        return serverError("Failed to get import template");
    } });
