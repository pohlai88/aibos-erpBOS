import { requireAuth } from "../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";

export const GET = withRouteErrors(async (req: Request) => {
  const authResult = await requireAuth(req);
  if (isResponse(authResult)) return authResult;
  
  return Response.json({ message: "Auth successful", auth: authResult });
});
