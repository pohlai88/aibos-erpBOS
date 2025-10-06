import { z } from 'zod';
import { pool } from '../../../../../lib/db';
import { requireAuth, requireCapability } from '../../../../../lib/auth';
import { ok, badRequest, notFound } from '../../../../../lib/http';
import { withRouteErrors, isResponse } from '../../../../../lib/route-utils';

// Schema for cloning budget versions
const CloneVersionSchema = z.object({
  code: z.string().min(1).max(50),
  label: z.string().min(1).max(200),
  filters: z
    .object({
      costCenter: z.string().optional(),
      project: z.string().optional(),
    })
    .optional(),
});

export const POST = withRouteErrors(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: sourceVersionId } = await params;
      const auth = await requireAuth(req);
      if (isResponse(auth)) return auth;

      const capCheck = requireCapability(auth, 'budgets:manage');
      if (isResponse(capCheck)) return capCheck;
      const body = await req.json();
      const payload = CloneVersionSchema.parse(body);

      // Get source version
      const versionResult = await pool.query(
        `SELECT * FROM budget_version WHERE id = $1 AND company_id = $2`,
        [sourceVersionId, auth.company_id]
      );

      if (versionResult.rows.length === 0) {
        return notFound('Source budget version not found');
      }

      const sourceVersion = versionResult.rows[0];

      // Check if new version code already exists
      const existingVersion = await pool.query(
        `SELECT id FROM budget_version WHERE company_id = $1 AND code = $2`,
        [auth.company_id, payload.code]
      );

      if (existingVersion.rows.length > 0) {
        return badRequest(`Version code '${payload.code}' already exists`);
      }

      // Create new budget version
      const newVersionId = `bv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newVersionResult = await pool.query(
        `INSERT INTO budget_version 
       (id, company_id, code, label, year, is_baseline, status, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, false, 'draft', $6, $6)
       RETURNING *`,
        [
          newVersionId,
          auth.company_id,
          payload.code,
          payload.label,
          sourceVersion.year,
          auth.user_id,
        ]
      );

      // Clone budget lines with optional filters
      let whereClause = `version_id = $1 AND company_id = $2`;
      const queryParams = [sourceVersionId, auth.company_id];
      let paramIndex = 3;

      if (payload.filters?.costCenter) {
        whereClause += ` AND cost_center_id = $${paramIndex}`;
        queryParams.push(payload.filters.costCenter);
        paramIndex++;
      }

      if (payload.filters?.project) {
        whereClause += ` AND project_id = $${paramIndex}`;
        queryParams.push(payload.filters.project);
        paramIndex++;
      }

      const sourceLinesResult = await pool.query(
        `SELECT * FROM budget_line WHERE ${whereClause}`,
        queryParams
      );

      // Insert cloned budget lines
      let clonedCount = 0;
      for (const line of sourceLinesResult.rows) {
        const newLineId = `bl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await pool.query(
          `INSERT INTO budget_line 
         (id, budget_id, company_id, period_month, account_code, cost_center_id, project_id, amount_base, version_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now())`,
          [
            newLineId,
            line.budget_id,
            line.company_id,
            line.period_month,
            line.account_code,
            line.cost_center_id,
            line.project_id,
            line.amount_base,
            newVersionId,
          ]
        );
        clonedCount++;
      }

      return ok({
        message: 'Budget version cloned successfully',
        sourceVersionId,
        newVersion: newVersionResult.rows[0],
        clonedLines: clonedCount,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return badRequest('Invalid request data', error.errors);
      }
      console.error('Error cloning budget version:', error);
      return badRequest('Failed to clone budget version');
    }
  }
);
