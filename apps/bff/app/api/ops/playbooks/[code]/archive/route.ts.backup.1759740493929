import { NextRequest, NextResponse } from 'next/server';
import { PlaybookService } from '@/services';
import { withRouteErrors, ok } from '@/api/_kit';

const playbookService = new PlaybookService();
export const POST = withRouteErrors(
  async (request: NextRequest, { params }: { params: { code: string } }) => {
    try {
      const companyId = request.headers.get('x-company-id');
      const userId = request.headers.get('x-user-id');

      if (!companyId || !userId) {
        return ok({ error: 'Missing company or user context' }, 400);
      }

      const result = await playbookService.archivePlaybook(
        companyId,
        params.code,
        userId
      );

      return ok(result);
    } catch (error) {
      console.error('Error archiving playbook:', error);
      return ok({ error: 'Failed to archive playbook' }, 500);
    }
  }
);
