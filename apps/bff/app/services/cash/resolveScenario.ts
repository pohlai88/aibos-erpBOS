// M15: Working Capital & Cash Flow Services
// apps/bff/app/services/cash/resolveScenario.ts

export function parseScenarioTag(tag: string) {
  // "forecast:FY26-FC1" -> { type: "forecast", code: "FY26-FC1" }
  // "budget:FY25-WIP" -> { type: "budget", code: "FY25-WIP" }
  const [t, rest] = tag.includes(":") ? tag.split(":") : ["budget", tag];
  return { type: t as "budget" | "forecast", code: rest };
}

export async function resolveScenarioToVersionId(
  companyId: string,
  scenarioTag: string
): Promise<string | null> {
  const { type, code } = parseScenarioTag(scenarioTag);
  
  if (type === "forecast") {
    // Query forecast_version table
    const { pool } = await import("../../lib/db");
    const result = await pool.query(
      `SELECT id FROM forecast_version WHERE company_id = $1 AND code = $2`,
      [companyId, code]
    );
    return result.rows[0]?.id || null;
  } else {
    // Query budget_version table
    const { pool } = await import("../../lib/db");
    const result = await pool.query(
      `SELECT id FROM budget_version WHERE company_id = $1 AND code = $2`,
      [companyId, code]
    );
    return result.rows[0]?.id || null;
  }
}
