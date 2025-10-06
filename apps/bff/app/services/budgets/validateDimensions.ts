import { pool } from '../../lib/db';

export interface DimResolution {
  costCenterId?: string | null;
  projectId?: string | null;
  issues: string[];
}

export async function resolveDimensionsForRows(
  companyId: string,
  rows: Array<{ costCenter?: string | undefined; project?: string | undefined }>
): Promise<DimResolution[]> {
  // collect unique codes
  const ccCodes = new Set<string>();
  const prjCodes = new Set<string>();
  rows.forEach(r => {
    if (r.costCenter) ccCodes.add(r.costCenter.trim());
    if (r.project) prjCodes.add(r.project.trim());
  });

  // Batch fetch cost centers
  let ccRows: Array<{ id: string; code: string }> = [];
  if (ccCodes.size > 0) {
    const ccResult = await pool.query(
      `SELECT id, id as code FROM dim_cost_center WHERE company_id = $1 AND id = ANY($2)`,
      [companyId, Array.from(ccCodes)]
    );
    ccRows = ccResult.rows;
  }

  // Batch fetch projects
  let prjRows: Array<{ id: string; code: string }> = [];
  if (prjCodes.size > 0) {
    const prjResult = await pool.query(
      `SELECT id, id as code FROM dim_project WHERE company_id = $1 AND id = ANY($2)`,
      [companyId, Array.from(prjCodes)]
    );
    prjRows = prjResult.rows;
  }

  const ccMap = new Map(ccRows.map(r => [r.code, r.id]));
  const prjMap = new Map(prjRows.map(r => [r.code, r.id]));

  return rows.map(r => {
    const issues: string[] = [];
    let costCenterId: string | null | undefined = undefined;
    let projectId: string | null | undefined = undefined;

    if (r.costCenter) {
      costCenterId = ccMap.get(r.costCenter.trim()) ?? null;
      if (!costCenterId) issues.push(`Unknown cost_center: ${r.costCenter}`);
    }
    if (r.project) {
      projectId = prjMap.get(r.project.trim()) ?? null;
      if (!projectId) issues.push(`Unknown project: ${r.project}`);
    }
    return {
      costCenterId: costCenterId ?? null,
      projectId: projectId ?? null,
      issues,
    };
  });
}
