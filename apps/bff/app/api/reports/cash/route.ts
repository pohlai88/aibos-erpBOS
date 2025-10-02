// M15: Cash Flow Report (Pivot Parity)
// apps/bff/app/api/reports/cash/route.ts

import { ok, badRequest, forbidden } from "../../../lib/http";
import { requireAuth, requireCapability } from "../../../lib/auth";
import { withRouteErrors, isResponse } from "../../../lib/route-utils";
import { buildMatrix } from "../../../lib/report-matrix";
import { pool } from "../../../lib/db";
import { convertToPresent } from "@aibos/policies";

async function getPresentQuotes(base: string, present: string, onISO: string) {
    const { rows } = await pool.query(
        `select date::text as date, from_ccy as from, to_ccy as to, rate::text
       from fx_rate
      where from_ccy=$1 and to_ccy=$2 and date <= $3
      order by date desc
      limit 1`,
        [base, present, onISO]
    );
    return rows.map(r => ({ date: r.date, from: r.from, to: r.to, rate: Number(r.rate) }));
}

export const GET = withRouteErrors(async (req: Request) => {
    try {
        const auth = await requireAuth(req);
        if (isResponse(auth)) return auth;

        const capCheck = requireCapability(auth, "cash:manage");
        if (isResponse(capCheck)) return capCheck;

        const url = new URL(req.url);
        const scenario = url.searchParams.get("scenario"); // expect "cash:<code>"
        const year = Number(url.searchParams.get("year") ?? new Date().getFullYear());
        const pivot = (url.searchParams.get("pivot") ?? "cost_center") as "cost_center" | "project";
        const nullLabel = url.searchParams.get("pivot_null_label") ?? "Unassigned";
        const precision = Number(url.searchParams.get("precision") ?? "2");
        const grandTotal = (url.searchParams.get("grand_total") ?? "true") === "true";
        const present = url.searchParams.get("present"); // e.g. "USD"

        if (!scenario || !scenario.startsWith("cash:")) {
            return badRequest("scenario must be cash:<code>");
        }

        const code = scenario.split(":")[1];

        // Get cash version
        const versionResult = await pool.query(
            `SELECT id FROM cash_forecast_version 
       WHERE company_id = $1 AND code = $2`,
            [auth.company_id, code]
        );

        if (versionResult.rows.length === 0) {
            return badRequest(`Unknown cash version: ${code}`);
        }

        const versionId = versionResult.rows[0].id;

        // Get cash lines
        const linesResult = await pool.query(
            `SELECT cost_center, project, net_change, month
       FROM cash_line 
       WHERE company_id = $1 AND version_id = $2
       ORDER BY month, cost_center, project`,
            [auth.company_id, versionId]
        );

        // Transform to report format
        const lines = linesResult.rows.map(row => ({
            account_code: "CASH_NET",
            account_name: "Net Cash From Operations",
            pivot_key: pivot === "cost_center" ? row.cost_center : row.project,
            amount: Number(row.net_change)
        }));

        // Build matrix
        const matrix = buildMatrix(lines, {
            pivotNullLabel: nullLabel,
            precision,
            includeGrandTotal: grandTotal
        });

        // Optional presentation currency conversion
        let presentCurrency = "MYR"; // Default base currency
        let rateUsed = 1;

        if (present && present !== "MYR") {
            const asOf = new Date(Date.UTC(year, 11, 31)); // Last day of year
            const quotes = await getPresentQuotes("MYR", present, asOf.toISOString().split('T')[0]);

            if (quotes.length > 0) {
                rateUsed = quotes[0].rate;
                presentCurrency = present;

                // Convert matrix values
                matrix.rows = matrix.rows.map(row => ({
                    ...row,
                    values: Object.fromEntries(
                        Object.entries(row.values).map(([k, v]) => [k, convertToPresent(Number(v), "MYR", present, quotes, asOf) ?? Number(v)])
                    ),
                    total: row.total ? convertToPresent(Number(row.total), "MYR", present, quotes, asOf) ?? Number(row.total) : row.total
                }));

                if (matrix.grand_total) {
                    matrix.grand_total = convertToPresent(Number(matrix.grand_total), "MYR", present, quotes, asOf) ?? Number(matrix.grand_total);
                }
            }
        }

        return ok({
            scenario,
            year,
            ...matrix,
            present_currency: presentCurrency,
            rate_used: rateUsed
        });
    } catch (error) {
        console.error("Error generating cash report:", error);
        return badRequest("Failed to generate cash flow report");
    }
});
