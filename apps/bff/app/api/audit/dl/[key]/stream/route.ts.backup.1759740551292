import { NextRequest, NextResponse } from 'next/server';
import { withRouteErrors } from '@/lib/route-utils';
import { AuditWorkspaceService } from '@/services/audit/workspace';
import { AuditAdminService } from '@/services/audit/admin';
import { WatermarkService } from '@/services/audit/watermark';
import { logLine } from '@/lib/log';

// GET /api/audit/dl/[key]/stream - Stream watermarked file
export const GET = withRouteErrors(
  async (request: NextRequest, { params }: { params: { key: string } }) => {
    const service = new AuditWorkspaceService();
    const adminService = new AuditAdminService();

    try {
      // Validate download key and get file info
      const fileInfo = await service.validateDownloadKey(params.key);

      // Get watermark policy
      const watermarkPolicy = await adminService.getWatermarkPolicy(
        fileInfo.company_id
      );

      // Create watermark context
      const watermarkContext = {
        company: fileInfo.company_id,
        auditor_email: fileInfo.auditor_email || 'unknown@auditor.com',
        ts: new Date().toISOString(),
      };

      // Log the streaming access
      logLine({
        msg: `Auditor file streaming initiated`,
        grant_id: fileInfo.grant_id,
        object_id: fileInfo.object_id,
        download_key: params.key,
        file_path: fileInfo.file_path,
      });

      // In a real implementation, you would:
      // 1. Read the file from storage (S3, local filesystem, etc.)
      // 2. Determine MIME type from file extension or metadata
      // 3. Apply watermarking using WatermarkService.applyWatermark()
      // 4. Stream the watermarked file with proper headers
      // 5. Log the complete audit trail

      // For demonstration, return a placeholder response
      // In production, this would stream the actual watermarked file
      const watermarkedContent = Buffer.from(
        `Watermarked file content for ${fileInfo.object_id}\n` +
          `Watermark: ${WatermarkService.generateWatermarkText(watermarkPolicy, watermarkContext)}\n` +
          `Original path: ${fileInfo.file_path}`
      );

      return new NextResponse(watermarkedContent, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="watermarked_${fileInfo.object_id}.txt"`,
          'Content-Length': watermarkedContent.length.toString(),
          'X-Watermark-Applied': 'true',
          'X-Watermark-Text': WatermarkService.generateWatermarkText(
            watermarkPolicy,
            watermarkContext
          ),
        },
      });
    } catch (error) {
      logLine({
        msg: `File streaming failed: ${error}`,
        download_key: params.key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);
