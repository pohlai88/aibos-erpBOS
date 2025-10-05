import crypto from "node:crypto";
import { pool } from "../../../../../lib/db";
import { ok } from "../../../../../lib/http";
import { requireAuth, requireCapability } from "../../../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../../../lib/route-utils";

function sha256(x: string) { return crypto.createHash("sha256").update(x, "utf8").digest("hex"); }

export const POST = withRouteErrors(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, "keys:manage");
    if (isResponse(capCheck)) return capCheck;

    const resolvedParams = await params;
    const secret = crypto.randomBytes(24).toString("base64url");
    const hash = sha256(secret);

    await pool.query(
        `update api_key set hash=$1, rotated_at=now() where id=$2 and user_id=$3 and company_id=$4`,
        [hash, resolvedParams.id, auth.user_id, auth.company_id]
    );

    return ok({ id: resolvedParams.id, secret });
});
