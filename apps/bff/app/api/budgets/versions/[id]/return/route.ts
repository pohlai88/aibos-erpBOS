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
    const auth = await requireScope(req, "budgets:approve");
    const versionId = params.id;

    // Get current version
    const versionResult = await pool.query(
      `SELECT * FROM budget_version WHERE id = $1 AND company_id = $2`,
      [versionId, auth.company_id]
    );

    if (versionResult.rows.length === 0) {
      return notFound({ message: "Budget version not found" });
    }

    const version = versionResult.rows[0];

    // Validate state transition
    if (version.status !== "submitted") {
      return badRequest({ 
        message: `Cannot return version in ${version.status} status. Must be submitted.` 
      });
    }

    // Parse request body for comment
    const body = await req.json().catch(() => ({}));
    const { comment } = VersionActionSchema.parse(body);

    // Update version status
    await pool.query(
      `UPDATE budget_version 
       SET status = 'returned', updated_at = now(), updated_by = $1
       WHERE id = $2`,
      [auth.user_id, versionId]
    );

    // Record return action
    const approvalId = `ba_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await pool.query(
      `INSERT INTO budget_approval 
       (id, company_id, version_id, action, actor, comment)
       VALUES ($1, $2, $3, 'return', $4, $5)`,
      [approvalId, auth.company_id, versionId, auth.user_id, comment]
    );

    return ok({
      message: "Version returned successfully",
      versionId,
      approvalId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return badRequest({ message: "Invalid request data", errors: error.errors });
    }
    console.error("Error returning budget version:", error);
    return badRequest({ message: "Failed to return budget version" });
  }
}
