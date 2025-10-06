import { NextRequest, NextResponse } from 'next/server';
import { ArStatementService } from '@/services/ar/statements';
import { requireAuth, requireCapability } from '@/lib/auth';
import { ok, badRequest, serverError, notFound } from '@/api/_lib/http';
import { withRouteErrors } from '@/api/_kit';

const statementService = new ArStatementService();

// GET /api/ar/statements/artifacts/[id] - Download statement artifact
export const GET = withRouteErrors(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const auth = await requireAuth(request);
      if (auth instanceof Response) return auth;

      const cap = requireCapability(auth, 'ar:stmt:run');
      if (cap instanceof Response) return cap;

      const artifactId = params.id;
      if (!artifactId) {
        return badRequest('Artifact ID is required');
      }

      const result = await statementService.downloadStatementArtifact(
        auth.company_id,
        artifactId
      );

      if (!result) {
        return notFound('Statement artifact not found');
      }

      // Return file download response
      return new NextResponse(result.content as BodyInit, {
        headers: {
          'Content-Type': result.contentType,
          'Content-Disposition': `attachment; filename="${result.filename}"`,
          'Content-Length': result.contentLength.toString(),
        },
      });
    } catch (error) {
      console.error('Download statement artifact error:', error);
      return serverError('Failed to download statement artifact');
    }
  }
);
