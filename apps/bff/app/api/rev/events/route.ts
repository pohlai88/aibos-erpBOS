import { NextRequest, NextResponse } from "next/server";
import { RevEventsService } from "@/services/revenue/events";
import { requireAuth, requireCapability } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/api/_lib/http";
import { EventCreate, EventQuery } from "@aibos/contracts";
import { withRouteErrors } from "@/api/_kit";

const eventsService = new RevEventsService();

// POST /api/rev/events - Create event
// GET /api/rev/events - Query events
export const POST = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rev:schedule");
        if (cap instanceof Response) return cap;

        const body = await request.json();
        const validatedData = EventCreate.parse(body);

        const result = await eventsService.createEvent(
            auth.company_id,
            auth.user_id,
            validatedData
        );

        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid event data");
        }
        console.error("Error creating event:", error);
        return serverError("Failed to create event");
    } });
export const GET = withRouteErrors(async (request: NextRequest) => { try {
        const auth = await requireAuth(request);
        if (auth instanceof Response) return auth;

        const cap = requireCapability(auth, "rev:schedule");
        if (cap instanceof Response) return cap;

        const url = new URL(request.url);
        const query = {
            pob_id: url.searchParams.get('pob_id') || undefined,
            kind: url.searchParams.get('kind') as any || undefined,
            occurred_at_from: url.searchParams.get('occurred_at_from') || undefined,
            occurred_at_to: url.searchParams.get('occurred_at_to') || undefined,
            processed: url.searchParams.get('processed') ? url.searchParams.get('processed') === 'true' : undefined,
            limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50,
            offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0
        };

        const validatedQuery = EventQuery.parse(query);
        const result = await eventsService.queryEvents(auth.company_id, validatedQuery);
        return ok(result);
    } catch (error) {
        if (error instanceof Error && error.name === 'ZodError') {
            return badRequest("Invalid query parameters");
        }
        console.error("Error querying events:", error);
        return serverError("Failed to query events");
    } });
