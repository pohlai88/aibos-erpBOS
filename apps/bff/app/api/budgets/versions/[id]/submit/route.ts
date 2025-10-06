import { z } from 'zod';
import { pool } from '../../../../../lib/db';
import { requireAuth, requireCapability } from '../../../../../lib/auth';
import { ok, badRequest, notFound } from '../../../../../lib/http';
import { withRouteErrors, isResponse } from '../../../../../lib/route-utils';

// Schema for version actions
const VersionActionSchema = z.object({
  comment: z.string().optional(),
});

export const POST = withRouteErrors(
  async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id: versionId } = await params;
      const auth = await requireAuth(req);
      if (isResponse(auth)) return auth;

      const capCheck = requireCapability(auth, 'budgets:manage');
      if (isResponse(capCheck)) return capCheck;
      const url = new URL(req.url);
      const action = url.pathname.split('/').pop() || 'submit'; // submit, approve, or return

      // Validate action
      if (!['submit', 'approve', 'return'].includes(action)) {
        return badRequest('Invalid action. Must be submit, approve, or return');
      }

      // Check permissions
      if (action === 'approve' || action === 'return') {
        const approveCheck = requireCapability(auth, 'budgets:approve');
        if (isResponse(approveCheck)) {
          return approveCheck;
        }
      }

      // Get current version
      const versionResult = await pool.query(
        `SELECT * FROM budget_version WHERE id = $1 AND company_id = $2`,
        [versionId, auth.company_id]
      );

      if (versionResult.rows.length === 0) {
        return notFound('Budget version not found');
      }

      const version = versionResult.rows[0];

      // Validate state transitions
      const validTransitions: Record<string, string[]> = {
        submit: ['draft'],
        approve: ['submitted'],
        return: ['submitted'],
      };

      if (!validTransitions[action]?.includes(version.status)) {
        return badRequest(
          `Cannot ${action} version in ${version.status} status`
        );
      }

      // Parse request body for comment
      const body = await req.json().catch(() => ({}));
      const { comment } = VersionActionSchema.parse(body);

      // Determine new status
      const newStatus =
        action === 'submit'
          ? 'submitted'
          : action === 'approve'
            ? 'approved'
            : 'returned';

      // Update version status
      await pool.query(
        `UPDATE budget_version 
       SET status = $1, updated_at = now(), updated_by = $2
       WHERE id = $3`,
        [newStatus, auth.user_id, versionId]
      );

      // Record approval action
      const approvalId = `ba_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await pool.query(
        `INSERT INTO budget_approval 
       (id, company_id, version_id, action, actor, comment)
       VALUES ($1, $2, $3, $4, $5, $6)`,
        [approvalId, auth.company_id, versionId, action, auth.user_id, comment]
      );

      return ok({
        message: `Version ${action}ed successfully`,
        versionId,
        newStatus,
        approvalId,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return badRequest('Invalid request data', error.errors);
      }
      console.error('Error processing budget version:', error);
      return badRequest('Failed to process budget version');
    }
  }
);
