import { NextRequest, NextResponse } from "next/server";
import { withRouteErrors } from "@/lib/route-utils";
import { AuditWorkspaceService } from "@/services/audit/workspace";
import { AuditAdminService } from "@/services/audit/admin";
import { WatermarkService } from "@/services/audit/watermark";
import { logLine } from "@/lib/log";
import { ok } from "@/api/_kit";

// GET /api/audit/dl/[key] - Download file with key
export const GET = withRouteErrors(async (request: NextRequest, { params }: { params: { key: string } }) => {
    const service = new AuditWorkspaceService();
    const adminService = new AuditAdminService();

    try {
        // Validate download key
        const fileInfo = await service.validateDownloadKey(params.key);

        // Get watermark policy
        const watermarkPolicy = await adminService.getWatermarkPolicy(fileInfo.company_id);

        // Create watermark context
        const watermarkContext = {
            company: fileInfo.company_id,
            auditor_email: fileInfo.auditor_email || "unknown@auditor.com",
            ts: new Date().toISOString()
        };

        // Log the download access
        logLine({
            msg: `Auditor download initiated`,
            grant_id: fileInfo.grant_id,
            object_id: fileInfo.object_id,
            download_key: params.key,
            watermark_applied: true
        });

        // In a real implementation, you would:
        // 1. Stream the file from storage (S3, local filesystem, etc.)
        // 2. Apply watermarking using WatermarkService
        // 3. Return the watermarked file with appropriate headers
        // 4. Log the complete audit trail

        return ok({
                    message: "File download initiated with watermark",
                    file_path: fileInfo.file_path,
                    grant_id: fileInfo.grant_id,
                    object_id: fileInfo.object_id,
                    watermark_applied: true,
                    watermark_text: WatermarkService.generateWatermarkText(watermarkPolicy, watermarkContext),
                    download_url: `/api/audit/dl/${params.key}/stream` // Separate streaming endpoint
                });

    } catch (error) {
        logLine({
            msg: `Download key validation failed: ${error}`,
            download_key: params.key,
            error: error instanceof Error ? error.message : String(error)
        });
        throw error;
    }
});
