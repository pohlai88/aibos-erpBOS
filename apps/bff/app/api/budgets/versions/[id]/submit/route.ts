import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { pool } from "../../../../lib/db";
import { requireScope, getCompanyFromKey } from "../../../../lib/auth";
import { ok, badRequest, forbidden, notFound } from "../../../../lib/http";

// Schema for version actions
const VersionActionSchema = z.object({
  comment: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireScope(req, "budgets:manage");
    const versionId = params.id;
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop(); // submit, approve, or return

    // Validate action
    if (!["submit", "approve", "return"].includes(action)) {
      return badRequest({ message: "Invalid action. Must be submit, approve, or return" });
    }

    // Check permissions
    if (action === "approve" || action === "return") {
      const hasApproveScope = await requireScope(req, "budgets:approve").catch(() => null);
      if (!hasApproveScope) {
        return forbidden("Insufficient permissions for approval actions");
      }
    }

    // Get current version
    const versionResult = await pool.query(
      `SELECT * FROM budget_version WHERE id = $1 AND company_id = $2`,
      [versionId, auth.company_id]
    );

    if (versionResult.rows.length === 0) {
      return notFound({ message: "Budget version not found" });
    }

    const version = versionResult.rows[0];

    // Validate state transitions
    const validTransitions = {
      submit: ["draft"],
      approve: ["submitted"],
      return: ["submitted"],
    };

    if (!validTransitions[action].includes(version.status)) {
      return badRequest({ 
        message: `Cannot ${action} version in ${version.status} status` 
      });
    }

    // Parse request body for comment
    const body = await req.json().catch(() => ({}));
    const { comment } = VersionActionSchema.parse(body);

    // Determine new status
    const newStatus = action === "submit" ? "submitted" : 
                     action === "approve" ? "approved" : "returned";

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
      return badRequest({ message: "Invalid request data", errors: error.errors });
    }
    console.error(`Error ${action}ing budget version:`, error);
    return badRequest({ message: `Failed to ${action} budget version` });
  }
}
