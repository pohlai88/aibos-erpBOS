import { NextRequest } from "next/server";
import { ok, forbidden, badRequest } from "../../../lib/http";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";
import { FxRevalRequest } from "@aibos/contracts";
import { revalueMonetaryAccounts } from "../../../services/fx/revalue";
import { pool } from "../../../lib/db";

async function getCompanyBaseCcy(companyId: string): Promise<string> {
    const { rows } = await pool.query(
        `SELECT base_currency FROM company WHERE id = $1`,
        [companyId]
    );
    return rows[0]?.base_currency || "MYR";
}

export const POST = withRouteErrors(async (req: NextRequest) => {
    const auth = await requireAuth(req);
    if (isResponse(auth)) return auth;

    const capCheck = requireCapability(auth, "fx:manage");
    if (isResponse(capCheck)) return capCheck;

    try {
        const input = FxRevalRequest.parse(await req.json());
        const base = await getCompanyBaseCcy(auth.company_id);

        const res = await revalueMonetaryAccounts({
            companyId: auth.company_id,
            year: input.year,
            month: input.month,
            dryRun: input.dry_run,
            accounts: input.accounts ?? [],
            ...(input.memo && { memo: input.memo }),
            actor: auth.api_key_id ?? "system",
            baseCcy: base
        });

        return ok(res);
    } catch (error) {
        console.error("Error running FX revaluation:", error);
        return badRequest("Failed to run revaluation");
    }
});