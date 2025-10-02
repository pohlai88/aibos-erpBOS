import { ok, badRequest, forbidden } from "../../../../lib/http";
import { requireAuth, requireCapability } from "../../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../../lib/route-utils";
import { evaluateCashAlerts, dispatchCashNotifications } from "../../../../services/cash/alerts";

export const POST = withRouteErrors(async (req: Request) => {
  try {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;
    await requireCapability(auth, "cash:manage");

    const body = await req.json().catch(() => null);
    const year = Number(body?.year ?? new Date().getFullYear());
    const month = Number(body?.month ?? (new Date().getMonth() + 1));
    const scenario = String(body?.scenario ?? "cash:CFY26-01");
    
    if (!scenario.startsWith("cash:")) return badRequest("scenario must be cash:<code>");

    const code = scenario.split(":")[1];
    if (!code) return badRequest("scenario must be cash:<code>");
    const result = await evaluateCashAlerts(auth.company_id, code, { year, month });
    const dispatch = await dispatchCashNotifications(auth.company_id, result.breaches);
    
    return ok({ scenario, ...result, dispatch });
  } catch (error) {
    console.error("Error running cash alerts:", error);
    return badRequest("Failed to run cash alerts");
  }
});
